"use server";

import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { createNotification } from "@/lib/notifications";

// ============================================================
// Get or create the current user's referral code
// ============================================================
export async function getOrCreateMyReferralCode(): Promise<{
  code: string;
  uses: number;
  successful: number;
}> {
  const session = await getSession();
  if (!session?.profile) {
    return { code: "", uses: 0, successful: 0 };
  }

  let existing = await db.referralCode.findFirst({
    where: { userId: session.id },
  });
  if (!existing) {
    // Generate a unique code: first name (4 letters) + "BK" + 3 random digits
    const namePart = (session.profile.fullName ?? session.email)
      .split(" ")[0]
      .replace(/[^a-zA-Z]/g, "")
      .substring(0, 4)
      .toUpperCase()
      .padEnd(4, "X");
    const random = Math.floor(Math.random() * 900 + 100);
    const code = `${namePart}-BK${random}`;

    existing = await db.referralCode.create({
      data: { userId: session.id, code },
    });
  }

  return {
    code: existing.code,
    uses: existing.uses,
    successful: existing.successful,
  };
}

// ============================================================
// Get referral events for the current user
// ============================================================
export async function getMyReferralEvents() {
  const session = await getSession();
  if (!session?.profile) return [];

  const code = await db.referralCode.findFirst({
    where: { userId: session.id },
    include: {
      events: {
        orderBy: { createdAt: "desc" },
        take: 50,
      },
    },
  });
  if (!code) return [];

  return code.events.map((e) => ({
    id: e.id,
    referredEmail: e.referredEmail,
    status: e.status,
    bonusCoinsAwarded: e.bonusCoinsAwarded,
    createdAt: e.createdAt.toISOString(),
  }));
}

// ============================================================
// Track a referral — called when someone visits with ?ref=CODE
// Records a PENDING event. When that visitor signs up + places first
// delivered order, the event is upgraded to REWARDED.
// ============================================================
export async function trackReferralVisitAction(
  refCode: string,
  visitorEmail?: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const code = await db.referralCode.findUnique({
    where: { code: refCode.toUpperCase().trim() },
  });
  if (!code) return { ok: false, error: "Invalid referral code" };

  // Don't create duplicate events for the same email
  if (visitorEmail) {
    const existing = await db.referralEvent.findFirst({
      where: { referredEmail: visitorEmail, referrerCodeId: code.id },
    });
    if (existing) return { ok: true };
  }

  await db.referralEvent.create({
    data: {
      referrerCodeId: code.id,
      referredEmail: visitorEmail ?? "anonymous",
      status: "PENDING",
    },
  });
  await db.referralCode.update({
    where: { id: code.id },
    data: { uses: { increment: 1 } },
  });
  return { ok: true };
}

// ============================================================
// Called when a customer's order is DELIVERED — if they were referred,
// award bonus coins to the referrer and update the event.
// ============================================================
export async function processReferralBonusOnDelivery(
  userId: string,
  orderId: string,
  orderNumber: string
): Promise<void> {
  // Check if this user was referred
  const event = await db.referralEvent.findFirst({
    where: { referredUserId: userId, status: { not: "REWARDED" } },
    include: { referrer: true },
  });
  if (!event) return;

  // Award bonus coins to the referrer (e.g. 500 coins)
  const BONUS = 500;

  const result = await db.$transaction(async (tx) => {
    // Update the event
    await tx.referralEvent.update({
      where: { id: event.id },
      data: { status: "REWARDED", bonusCoinsAwarded: BONUS },
    });

    // Increment the referrer's successful count
    await tx.referralCode.update({
      where: { id: event.referrer.id },
      data: { successful: { increment: 1 } },
    });

    // Get referrer's current balance
    const balanceResult = await tx.coinTransaction.aggregate({
      where: { userId: event.referrer.userId },
      _sum: { amount: true },
    });
    const currentBalance = balanceResult._sum.amount ?? 0;

    // Award bonus coins
    await tx.coinTransaction.create({
      data: {
        userId: event.referrer.userId,
        type: "REFERRAL_BONUS",
        amount: BONUS,
        balanceAfter: currentBalance + BONUS,
        orderId,
        note: `Referral bonus: ${event.referredEmail} placed first order ${orderNumber}`,
      },
    });
  });

  // Notify the referrer
  await createNotification({
    userId: event.referrer.userId,
    type: "COINS_EARNED",
    title: "Referral bonus earned!",
    message: `You earned ${BONUS} coins! Your referral (${event.referredEmail}) just had their first order delivered.`,
    link: "/rewards",
    metadata: { amount: BONUS, referredEmail: event.referredEmail, orderNumber },
  }).catch(() => {});
}
