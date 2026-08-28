/**
 * Cron endpoint: notify customers about vouchers expiring soon.
 *
 * Schedule: run daily (e.g. via Vercel Cron or external scheduler).
 * Calls /api/cron/voucher-expiring?secret=CRON_SECRET
 *
 * Sends in-app notifications for vouchers expiring in 3 days or less.
 */

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createNotification } from "@/lib/notifications";

export async function GET(request: Request) {
  // Simple secret check — replace with proper auth in production
  const url = new URL(request.url);
  const secret = url.searchParams.get("secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const inThreeDays = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

  // Find ACTIVE vouchers expiring within 3 days that haven't been notified yet
  const expiringVouchers = await db.customerVoucher.findMany({
    where: {
      status: "ACTIVE",
      expiresAt: { gte: now, lte: inThreeDays },
    },
    include: { voucher: true, user: { select: { email: true } } },
  });

  let notifiedCount = 0;
  for (const cv of expiringVouchers) {
    // Check if we already sent an expiring-soon notification for this voucher
    const existing = await db.notification.findFirst({
      where: {
        userId: cv.userId,
        type: "VOUCHER_EXPIRING_SOON",
        metadata: { path: ["customerVoucherId"], equals: cv.id },
      },
    });
    if (existing) continue;

    await createNotification({
      userId: cv.userId,
      type: "VOUCHER_EXPIRING_SOON",
      title: "Voucher expiring soon",
      message: `Your voucher "${cv.voucher.name}" (code: ${cv.code}) expires on ${cv.expiresAt.toLocaleDateString("en-BD")}. Use it before it's gone!`,
      link: "/rewards",
      metadata: { customerVoucherId: cv.id, code: cv.code, expiresAt: cv.expiresAt.toISOString() },
    });
    notifiedCount++;
  }

  return NextResponse.json({
    ok: true,
    checked: expiringVouchers.length,
    notified: notifiedCount,
  });
}
