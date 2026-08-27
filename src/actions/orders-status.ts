"use server";

import { db } from "@/lib/db";
import { z } from "zod";
import { getSession } from "@/lib/auth/session";

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

      // If cancelled → release reserved stock
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
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
