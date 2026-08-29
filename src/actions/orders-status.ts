"use server";

import { db } from "@/lib/db";
import { z } from "zod";
import { getSession } from "@/lib/auth/session";
import { rateLimit, RATE_LIMITS } from "@/lib/security/rate-limit";
import { headers } from "next/headers";
import { awardOrderCoins, reverseOrderCoins } from "@/actions/rewards";
import { notifyOrderStatusChange, notifyCoinsEarned, notifyCoinsReversed } from "@/lib/notifications";
import { processReferralBonusOnDelivery } from "@/actions/referrals";

const Schema = z.object({
  orderId: z.string(),
  newStatus: z.enum([
    "PENDING",
    "CONFIRMED",
    "PROCESSING",
    "SHIPPED",
    "DELIVERED",
    "CANCELLED",
    "DELIVERY_FAILED",
    "RETURN_REQUESTED",
    "RETURNED",
    "EXCHANGE_REQUESTED",
    "EXCHANGED",
  ]),
  reason: z.string().optional(),
});

type Result = { ok: true } | { ok: false; error: string };

const TRANSITIONS: Record<string, string[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED", "DELIVERY_FAILED"],
  DELIVERED: ["RETURN_REQUESTED", "EXCHANGE_REQUESTED"],
  CANCELLED: [],
  DELIVERY_FAILED: [],
  RETURN_REQUESTED: ["RETURNED"],
  RETURNED: [],
  EXCHANGE_REQUESTED: ["EXCHANGED"],
  EXCHANGED: [],
};

export async function updateOrderStatusAction(input: unknown): Promise<Result> {
  const session = await getSession();
  if (!session?.profile || !["ADMIN", "AGENT"].includes(session.profile.role)) {
    return { ok: false, error: "Unauthorized" };
  }

  // Rate limit: 100 status updates per staff per minute
  const rl = rateLimit({
    key: `order:status:${session.id}`,
    limit: RATE_LIMITS.ORDER_STATUS_UPDATE.limit,
    windowMs: RATE_LIMITS.ORDER_STATUS_UPDATE.windowMs,
  });
  if (!rl.ok) {
    return { ok: false, error: "Rate limit exceeded. Slow down." };
  }

  const parsed = Schema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const data = parsed.data;

  const order = await db.order.findUnique({
    where: { id: data.orderId },
    include: { items: true },
  });
  if (!order) return { ok: false, error: "Order not found" };

  const allowed = TRANSITIONS[order.status] ?? [];
  if (!allowed.includes(data.newStatus)) {
    return {
      ok: false,
      error: `Cannot transition from ${order.status} to ${data.newStatus}`,
    };
  }

  try {
    await db.$transaction(async (tx) => {
      const updateData: any = { status: data.newStatus };
      if (data.newStatus === "SHIPPED") updateData.shippedAt = new Date();
      if (data.newStatus === "DELIVERED") updateData.deliveredAt = new Date();
      if (data.newStatus === "CANCELLED") {
        updateData.cancelledAt = new Date();
        updateData.cancelReason = data.reason ?? "Cancelled by staff";
      }

      await tx.order.update({ where: { id: order.id }, data: updateData });

      await tx.orderStatusHistory.create({
        data: {
          orderId: order.id,
          status: data.newStatus,
          note: data.reason ?? null,
          changedBy: session.id,
        },
      });

      // If cancelled → release reserved stock + restore voucher
      if (data.newStatus === "CANCELLED") {
        for (const item of order.items) {
          const inv = await tx.inventory.findUnique({ where: { variantId: item.variantId } });
          if (!inv) continue;
          await tx.inventory.update({
            where: { id: inv.id },
            data: { reserved: { decrement: item.quantity } },
          });
          await tx.inventoryMovement.create({
            data: {
              inventoryId: inv.id,
              type: "RELEASED",
              quantity: item.quantity,
              refOrderId: order.id,
              note: `Released: order ${order.orderNumber} cancelled`,
            },
          });
        }
        // Restore voucher if one was applied
        if (order.appliedVoucherId) {
          await tx.customerVoucher.update({
            where: { id: order.appliedVoucherId },
            data: {
              status: "ACTIVE",
              usedOnOrderId: null,
              usedAt: null,
            },
          });
        }
      }

      // If delivered → consume reserved stock (turn reserved into sold)
      if (data.newStatus === "DELIVERED") {
        for (const item of order.items) {
          const inv = await tx.inventory.findUnique({ where: { variantId: item.variantId } });
          if (!inv) continue;
          await tx.inventory.update({
            where: { id: inv.id },
            data: {
              quantity: { decrement: item.quantity },
              reserved: { decrement: item.quantity },
            },
          });
          await tx.inventoryMovement.create({
            data: {
              inventoryId: inv.id,
              type: "SOLD",
              quantity: item.quantity,
              refOrderId: order.id,
              note: `Sold: order ${order.orderNumber} delivered`,
            },
          });
        }
      }

      await tx.auditLog.create({
        data: {
          actorId: session.id,
          actorRole: session.profile.role,
          action: "order.status_change",
          target: `order:${order.orderNumber}`,
          details: { from: order.status, to: data.newStatus, reason: data.reason } as any,
        },
      });
    });

    // After the transaction commits, handle side effects FIRE-AND-FORGET
    // (don't await — these run in background and shouldn't block the response)
    if (data.newStatus === "DELIVERED" && order.userId) {
      // Fire-and-forget: award coins, notifications, referral bonus
      // These run asynchronously and don't block the HTTP response
      import("@/actions/rewards").then(({ awardOrderCoins }) =>
        awardOrderCoins(order.id).catch((e) => console.error("Coin award failed:", e))
      );
      import("@/lib/notifications").then(({ notifyOrderStatusChange }) =>
        notifyOrderStatusChange(
          { id: order.id, orderNumber: order.orderNumber, userId: order.userId, newStatus: "DELIVERED" },
          data.reason
        ).catch(() => {})
      );
      import("@/actions/referrals").then(({ processReferralBonusOnDelivery }) =>
        processReferralBonusOnDelivery(order.userId, order.id, order.orderNumber).catch((e) =>
          console.error("Referral bonus failed:", e)
        )
      );
    } else {
      // Non-blocking notification for other status changes
      import("@/lib/notifications").then(({ notifyOrderStatusChange }) =>
        notifyOrderStatusChange(
          { id: order.id, orderNumber: order.orderNumber, userId: order.userId, newStatus: data.newStatus },
          data.reason
        ).catch(() => {})
      );
    }

    // Reverse coins for cancellations (fire-and-forget)
    if (["CANCELLED", "RETURNED"].includes(data.newStatus) && order.userId) {
      import("@/actions/rewards").then(({ reverseOrderCoins }) =>
        reverseOrderCoins(order.id).catch((e) => console.error("Coin reversal failed:", e))
      );
    }

    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
