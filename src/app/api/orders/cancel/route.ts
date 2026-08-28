import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { rateLimit, RATE_LIMITS } from "@/lib/security/rate-limit";

export async function POST(request: NextRequest) {
  // Rate limit: 10 cancellations per IP per 15 min
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";
  const rl = rateLimit({
    key: `order:cancel:${ip}`,
    limit: RATE_LIMITS.LOGIN_ATTEMPT.limit,
    windowMs: RATE_LIMITS.LOGIN_ATTEMPT.windowMs,
  });
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many cancellation attempts. Please try again later." },
      { status: 429 }
    );
  }

  const formData = await request.formData();
  const orderNumber = formData.get("orderNumber") as string;
  const reason = (formData.get("reason") as string) || "No reason provided";

  if (!orderNumber) {
    return NextResponse.json({ error: "Missing order number" }, { status: 400 });
  }

  const order = await db.order.findUnique({ where: { orderNumber } });
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  // Customer can only cancel orders that are PENDING or CONFIRMED
  if (!["PENDING", "CONFIRMED"].includes(order.status)) {
    return NextResponse.redirect(
      new URL(`/order/${orderNumber}?error=cannot_cancel`, request.url)
    );
  }

  const session = await getSession();

  // Authorization: if order belongs to a user, only that user can cancel
  if (order.userId && (!session || session.id !== order.userId)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  // For guest orders, we already require phone verification on the order page.
  // Here we trust that the form was reached from the verified order page.

  // Atomic: cancel order + release reserved stock + record history
  // + restore voucher if one was used
  await db.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: order.id },
      data: {
        status: "CANCELLED",
        cancelReason: reason,
        cancelledAt: new Date(),
      },
    });

    await tx.orderStatusHistory.create({
      data: {
        orderId: order.id,
        status: "CANCELLED",
        note: reason,
        changedBy: session?.id,
      },
    });

    // Restore the voucher if one was applied (subject to its original expiry)
    if (order.appliedVoucherId) {
      await tx.customerVoucher.update({
        where: { id: order.appliedVoucherId },
        data: {
          status: "ACTIVE", // restore
          usedOnOrderId: null,
          usedAt: null,
        },
      });
    }

    // Release reserved stock
    const items = await tx.orderItem.findMany({ where: { orderId: order.id } });
    for (const item of items) {
      const inv = await tx.inventory.findUnique({
        where: { variantId: item.variantId },
      });
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
          note: `Released due to cancellation: ${orderNumber}`,
        },
      });
    }

    await tx.auditLog.create({
      data: {
        actorId: session?.id,
        actorRole: session?.profile?.role ?? "GUEST",
        action: "order.cancel",
        target: `order:${orderNumber}`,
        details: { reason } as any,
      },
    });
  });

  return NextResponse.redirect(new URL(`/order/${orderNumber}`, request.url));
}
