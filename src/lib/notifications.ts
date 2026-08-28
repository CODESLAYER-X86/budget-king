/**
 * Budget King BD — Notification helper
 *
 * Server-side helper to create notifications. NEVER call from client.
 *
 * - `createNotification()` for personal notifications (one user)
 * - `broadcastToRole()` for staff-wide broadcasts (e.g. all AGENTs)
 * - Hooks into the existing audit-log infrastructure
 *
 * Email sending is stubbed — integration with Resend/SES comes later.
 * For now, all notifications are in-app.
 */

import { db } from "@/lib/db";
import type { NotificationType, NotificationChannel } from "@prisma/client";

type CreateNotificationInput = {
  userId?: string; // null for broadcast to role
  roleTarget?: string; // "AGENT", "ADMIN", "MODERATOR" — used when userId is null
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  metadata?: Record<string, unknown>;
  channel?: NotificationChannel; // default IN_APP
};

/**
 * Create a single notification. Safe to call from server actions
 * (it runs in its own transaction so it can't break the parent flow).
 *
 * Errors are swallowed — we don't want a failed notification to fail
 * the parent operation (e.g. order creation should still succeed
 * even if the "order placed" notification fails).
 */
export async function createNotification(input: CreateNotificationInput): Promise<void> {
  try {
    await db.notification.create({
      data: {
        userId: input.userId ?? null,
        roleTarget: input.roleTarget ?? null,
        type: input.type,
        title: input.title,
        message: input.message,
        link: input.link ?? null,
        metadata: (input.metadata as any) ?? undefined,
        channel: input.channel ?? "IN_APP",
      },
    });
  } catch (e) {
    console.error("Notification create failed:", (e as Error).message);
  }
}

/**
 * Broadcast to all users with a given role.
 * Used for staff alerts (e.g. new order to all AGENTs).
 */
export async function broadcastToRole(
  role: "AGENT" | "ADMIN" | "MODERATOR",
  input: Omit<CreateNotificationInput, "userId" | "roleTarget">
): Promise<void> {
  await createNotification({ ...input, roleTarget: role });
}

// ============================================================
// Convenience helpers for common notification types
// ============================================================

export async function notifyOrderPlaced(order: {
  id: string;
  orderNumber: string;
  userId: string | null;
  customerName: string;
  total: number | string;
}): Promise<void> {
  // Customer notification (if registered)
  if (order.userId) {
    await createNotification({
      userId: order.userId,
      type: "ORDER_PLACED",
      title: "Order placed successfully",
      message: `Order ${order.orderNumber} for tk ${Number(order.total).toLocaleString()} is now pending confirmation.`,
      link: `/order/${order.orderNumber}`,
      metadata: { orderNumber: order.orderNumber, total: Number(order.total) },
    });
  }
  // Staff alert
  await broadcastToRole("AGENT", {
    type: "STAFF_NEW_ORDER",
    title: "New order received",
    message: `Order ${order.orderNumber} (${order.customerName}) placed, pending confirmation.`,
    link: `/agent/orders/${order.id}`,
    metadata: { orderNumber: order.orderNumber, customerName: order.customerName },
  });
}

export async function notifyOrderStatusChange(
  order: {
    id: string;
    orderNumber: string;
    userId: string | null;
    newStatus: string;
  },
  reason?: string
): Promise<void> {
  if (!order.userId) return; // guest customers don't have in-app notifications

  const messages: Record<string, { title: string; message: string }> = {
    CONFIRMED: {
      title: "Order confirmed",
      message: `Order ${order.orderNumber} has been confirmed. We'll start processing soon.`,
    },
    PROCESSING: {
      title: "Order processing",
      message: `Order ${order.orderNumber} is now being prepared for shipment.`,
    },
    SHIPPED: {
      title: "Order shipped",
      message: `Order ${order.orderNumber} is on its way! Get ready to receive it.`,
    },
    DELIVERED: {
      title: "Order delivered",
      message: `Order ${order.orderNumber} has been delivered. Enjoy your purchase!`,
    },
    CANCELLED: {
      title: "Order cancelled",
      message: `Order ${order.orderNumber} has been cancelled${reason ? `: ${reason}` : "."}`,
    },
    DELIVERY_FAILED: {
      title: "Delivery failed",
      message: `We couldn't deliver order ${order.orderNumber}. Please contact support.`,
    },
  };

  const msg = messages[order.newStatus];
  if (!msg) return;

  const typeMap: Record<string, NotificationType> = {
    CONFIRMED: "ORDER_CONFIRMED",
    PROCESSING: "ORDER_PROCESSING",
    SHIPPED: "ORDER_SHIPPED",
    DELIVERED: "ORDER_DELIVERED",
    CANCELLED: "ORDER_CANCELLED",
    DELIVERY_FAILED: "ORDER_DELIVERY_FAILED",
  };

  await createNotification({
    userId: order.userId,
    type: typeMap[order.newStatus],
    title: msg.title,
    message: msg.message,
    link: `/order/${order.orderNumber}`,
    metadata: { orderNumber: order.orderNumber, status: order.newStatus, reason },
  });

  // Staff alert on cancellation/failed delivery
  if (["CANCELLED", "DELIVERY_FAILED"].includes(order.newStatus)) {
    await broadcastToRole("ADMIN", {
      type: "STAFF_CANCELLATION_REQUEST",
      title: `Order ${order.newStatus.toLowerCase()}`,
      message: `Order ${order.orderNumber} was ${order.newStatus.toLowerCase()}${reason ? `: ${reason}` : ""}.`,
      link: `/admin/orders/${order.id}`,
      metadata: { orderNumber: order.orderNumber, status: order.newStatus },
    });
  }
}

export async function notifyCoinsEarned(
  userId: string,
  amount: number,
  orderNumber: string
): Promise<void> {
  await createNotification({
    userId,
    type: "COINS_EARNED",
    title: "Budget Coins earned!",
    message: `You earned ${amount.toLocaleString()} coins from order ${orderNumber}. Redeem them for vouchers in your rewards page.`,
    link: "/rewards",
    metadata: { amount, orderNumber },
  });
}

export async function notifyCoinsReversed(
  userId: string,
  amount: number,
  orderNumber: string
): Promise<void> {
  await createNotification({
    userId,
    type: "COINS_REVERSED",
    title: "Coins reversed",
    message: `${amount.toLocaleString()} coins were reversed from your balance due to order ${orderNumber} being cancelled or returned.`,
    link: "/rewards",
    metadata: { amount, orderNumber },
  });
}

export async function notifyVoucherRedeemed(
  userId: string,
  voucherName: string,
  code: string,
  coinCost: number
): Promise<void> {
  await createNotification({
    userId,
    type: "VOUCHER_REDEEMED",
    title: "Voucher redeemed",
    message: `You redeemed ${coinCost.toLocaleString()} coins for "${voucherName}" (code: ${code}). Use it at checkout.`,
    link: "/rewards",
    metadata: { voucherName, code, coinCost },
  });
}

export async function notifyGroupEvent(
  groupId: string,
  groupName: string,
  eventType: "MEMBER_JOINED" | "PRODUCT_SHARED" | "ORDER_PLACED",
  details: { actorName: string; productName?: string; memberCount?: number }
): Promise<void> {
  // Notify the group owner
  const group = await db.group.findUnique({
    where: { id: groupId },
    select: { ownerId: true, members: { select: { userId: true } } },
  });
  if (!group) return;

  const recipients = new Set<string>([group.ownerId]);
  // For product shared / order placed, notify all members
  if (eventType === "PRODUCT_SHARED" || eventType === "ORDER_PLACED") {
    group.members.forEach((m) => recipients.add(m.userId));
  }
  // Don't notify the actor
  // We don't know actorId here; the caller passes actorName only

  const messages = {
    MEMBER_JOINED: {
      type: "GROUP_MEMBER_JOINED" as NotificationType,
      title: "New member joined",
      message: `${details.actorName} joined ${groupName}${details.memberCount ? ` (${details.memberCount} members)` : ""}.`,
    },
    PRODUCT_SHARED: {
      type: "GROUP_PRODUCT_SHARED" as NotificationType,
      title: "Product shared",
      message: `${details.actorName} shared ${details.productName ?? "a product"} in ${groupName}.`,
    },
    ORDER_PLACED: {
      type: "GROUP_ORDER_PLACED" as NotificationType,
      title: "Group order placed",
      message: `A group order for ${groupName} has been placed by ${details.actorName}.`,
    },
  };

  const msg = messages[eventType];
  for (const userId of recipients) {
    await createNotification({
      userId,
      type: msg.type,
      title: msg.title,
      message: msg.message,
      link: `/groups/${groupId}`,
      metadata: { groupId, groupName, ...details },
    });
  }
}

// ============================================================
// Get notifications for the current user
// ============================================================
export async function getMyNotifications(limit = 20) {
  const session = await import("@/lib/auth/session").then((m) => m.getSession());
  if (!session?.profile) return [];

  return db.notification.findMany({
    where: {
      OR: [
        { userId: session.id },
        {
          userId: null,
          roleTarget: session.profile.role,
        },
      ],
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function getUnreadCount(): Promise<number> {
  const session = await import("@/lib/auth/session").then((m) => m.getSession());
  if (!session?.profile) return 0;

  return db.notification.count({
    where: {
      isRead: false,
      OR: [
        { userId: session.id },
        {
          userId: null,
          roleTarget: session.profile.role,
        },
      ],
    },
  });
}
