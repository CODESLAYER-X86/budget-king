import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session";

export async function POST(request: NextRequest) {
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
