"use server";

import { db } from "@/lib/db";
import { z } from "zod";
import { getSession } from "@/lib/auth/session";
import { awardOrderCoins, reverseOrderCoins } from "@/actions/rewards";
import { rateLimit, RATE_LIMITS } from "@/lib/security/rate-limit";
import { headers } from "next/headers";
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
  SHIPPED: ["DELIVERED", "DELIVERY_FAILED", "RETURNED"],
  DELIVERED: ["RETURN_REQUESTED", "EXCHANGE_REQUESTED", "RETURNED"],
  CANCELLED: [],
  DELIVERY_FAILED: [],
  RETURN_REQUESTED: ["RETURNED"],
  RETURNED: [],
  EXCHANGE_REQUESTED: ["EXCHANGED"],
  EXCHANGED: [],
};

export async function updateOrderStatusAction(input: unknown): Promise<Result> {
  const session = await getSession();
  if (!session?.profile || !["ADMIN", "AGENT", "MODERATOR"].includes(session.profile.role)) {
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

      // If cancelled or delivery failed → release reserved stock + restore voucher/coupons/coins
      if (data.newStatus === "CANCELLED" || data.newStatus === "DELIVERY_FAILED") {
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
              note: `Released: order ${order.orderNumber} ${data.newStatus.toLowerCase().replace("_", " ")}`,
            },
          });
        }
        // Restore customer voucher if one was applied
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

        // Restore promo coupon if one was applied
        if (order.appliedCouponId) {
          await tx.coupon.update({
            where: { id: order.appliedCouponId },
            data: { usedCount: { decrement: 1 } },
          });
          await tx.couponUsage.deleteMany({
            where: { orderId: order.id },
          });
        }

        // Refund direct coins if spent at checkout
        if (order.coinsRedeemed && order.coinsRedeemed > 0 && order.userId) {
          const balResult = await tx.coinTransaction.aggregate({
            where: { userId: order.userId },
            _sum: { amount: true },
          });
          const currentBal = balResult._sum.amount ?? 0;
          await tx.coinTransaction.create({
            data: {
              userId: order.userId,
              type: "REDEEMED_REVERSAL",
              amount: order.coinsRedeemed,
              balanceAfter: currentBal + order.coinsRedeemed,
              orderId: order.id,
              note: `Refunded direct checkout coins from ${data.newStatus.toLowerCase().replace("_", " ")} order ${order.orderNumber}`,
            },
          });
        }
      }

      // If returned → handle stock based on whether it was delivered or shipped before return
      if (data.newStatus === "RETURNED") {
        for (const item of order.items) {
          const inv = await tx.inventory.findUnique({ where: { variantId: item.variantId } });
          if (!inv) continue;

          if (order.status === "SHIPPED") {
            // Returned before delivery was completed: release reserved lock
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
                note: `Released: order ${order.orderNumber} returned before delivery`,
              },
            });
          } else {
            // Returned after delivery (DELIVERED or RETURN_REQUESTED): restock physical quantity
            await tx.inventory.update({
              where: { id: inv.id },
              data: { quantity: { increment: item.quantity } },
            });
            await tx.inventoryMovement.create({
              data: {
                inventoryId: inv.id,
                type: "RETURNED",
                quantity: item.quantity,
                refOrderId: order.id,
                note: `Restocked from returned order ${order.orderNumber}`,
              },
            });
          }
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
          actorRole: session.profile?.role ?? "ADMIN",
          action: "order.status_change",
          target: `order:${order.orderNumber}`,
          details: { from: order.status, to: data.newStatus, reason: data.reason } as any,
        },
      });
    });

    // After transaction commits, handle side effects
    // These MUST be awaited on Vercel serverless — fire-and-forget
    // doesn't work because the function gets killed before async ops complete
    if (data.newStatus === "DELIVERED" && order.userId) {
      try {
        const result = await awardOrderCoins(order.id);
        if (result.ok && result.awarded && result.awarded > 0) {
          await notifyCoinsEarned(order.userId, result.awarded, order.orderNumber).catch(() => {});
        }
      } catch (e) {
        console.error("Coin award failed:", e);
      }
    }

    // Notify customer of status change
    if (order.userId) {
      await notifyOrderStatusChange(
        { id: order.id, orderNumber: order.orderNumber, userId: order.userId, newStatus: data.newStatus },
        data.reason
      ).catch(() => {});
    }

    // Reverse coins for cancellations/returns
    if (["CANCELLED", "RETURNED"].includes(data.newStatus) && order.userId) {
      try {
        await reverseOrderCoins(order.id);
      } catch (e) {
        console.error("Coin reversal failed:", e);
      }
    }

    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
