import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { z } from "zod";

const Schema = z.object({
  productId: z.string().min(1),
  orderId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  title: z.string().max(100).optional(),
  content: z.string().max(2000).optional(),
});

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session?.profile) {
    return NextResponse.json({ error: "Please sign in to write a review" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }
  const { productId, orderId, rating, title, content } = parsed.data;

  // Verify the order belongs to this user, contains this product, and is DELIVERED
  const order = await db.order.findFirst({
    where: { id: orderId, userId: session.id, status: "DELIVERED" },
    include: { items: { where: { productId } } },
  });
  if (!order) {
    return NextResponse.json({ error: "Only delivered orders can be reviewed" }, { status: 403 });
  }
  if (order.items.length === 0) {
    return NextResponse.json({ error: "This product is not in this order" }, { status: 403 });
  }

  // Prevent duplicate review (unique constraint on user+product+order)
  const existing = await db.review.findUnique({
    where: {
      userId_productId_orderId: { userId: session.id, productId, orderId },
    },
  });
  if (existing) {
    return NextResponse.json({ error: "You already reviewed this product" }, { status: 400 });
  }

  const review = await db.review.create({
    data: {
      userId: session.id,
      productId,
      orderId,
      rating,
      title,
      content,
      status: "PENDING",
      isVerifiedPurchase: true,
    },
  });

  await db.auditLog.create({
    data: {
      actorId: session.id,
      actorRole: "CUSTOMER",
      action: "review.create",
      target: `review:${review.id}`,
    },
  });

  return NextResponse.json({ ok: true, reviewId: review.id });
}
