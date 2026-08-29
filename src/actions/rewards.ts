"use server";

import { db } from "@/lib/db";
import { z } from "zod";
import { getSession } from "@/lib/auth/session";
import { rateLimit, RATE_LIMITS } from "@/lib/security/rate-limit";
import type { CoinTransactionType } from "@prisma/client";
import { headers } from "next/headers";
import { notifyVoucherRedeemed } from "@/lib/notifications";

// ============================================================
// Coin balance helper — sum of all transactions for a user
// ============================================================
export async function getCoinBalance(userId: string): Promise<number> {
  const result = await db.coinTransaction.aggregate({
    where: { userId },
    _sum: { amount: true },
  });
  return result._sum.amount ?? 0;
}

// ============================================================
// Award coins when an order is DELIVERED
//
// RULE: 1 tk spent = 1 coin earned (no minimum threshold)
// - Eligible amount = merchandise subtotal after discounts (excluding delivery)
// - Example: tk 599 order → 599 coins
// - Example: tk 1 order → 1 coin
// - Guest orders (userId = null) don't earn coins
// - Idempotent: unique constraint on (orderId, type) prevents duplicates
// - Coins expire after 365 days
// ============================================================
export async function awardOrderCoins(orderId: string): Promise<{
  ok: boolean;
  awarded?: number;
  error?: string;
}> {
  const order = await db.order.findUnique({
    where: { id: orderId },
  });
  if (!order) return { ok: false, error: "Order not found" };
  if (order.status !== "DELIVERED") {
    return { ok: false, error: "Order is not delivered" };
  }
  if (!order.userId) {
    // Guest orders don't earn coins — no-op
    return { ok: true, awarded: 0 };
  }

  // 1 tk spent = 1 coin (subtotal after discount, excluding delivery)
  const eligibleAmount = Number(order.subtotal) - Number(order.discount);
  const coinsToAward = Math.floor(eligibleAmount); // round down to whole coins

  if (coinsToAward <= 0) {
    return { ok: true, awarded: 0 };
  }

  try {
    const result = await db.$transaction(async (tx) => {
      // Check idempotency: has this order already earned coins?
      const existing = await tx.coinTransaction.findUnique({
        where: {
          orderId_type: { orderId, type: "EARNED" as CoinTransactionType },
        },
      });
      if (existing) {
        return { awarded: 0, alreadyAwarded: true };
      }

      // Get current balance (within transaction for consistency)
      const balanceResult = await tx.coinTransaction.aggregate({
        where: { userId: order.userId! },
        _sum: { amount: true },
      });
      const currentBalance = balanceResult._sum.amount ?? 0;
      const newBalance = currentBalance + coinsToAward;

      // Expiry: 365 days from now
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 365);

      // Create the EARNED transaction
      await tx.coinTransaction.create({
        data: {
          userId: order.userId!,
          type: "EARNED",
          amount: coinsToAward,
          balanceAfter: newBalance,
          orderId,
          note: `Earned ${coinsToAward} coins from order ${order.orderNumber} (1 tk = 1 coin)`,
          expiresAt,
        },
      });

      // Audit log
      await tx.auditLog.create({
        data: {
          actorId: order.userId,
          actorRole: "SYSTEM",
          action: "coin.award",
          target: `order:${order.orderNumber}`,
          details: {
            amount: coinsToAward,
            eligibleAmount,
          } as any,
        },
      });

      return { awarded: coinsToAward, alreadyAwarded: false };
    });

    return { ok: true, awarded: result.awarded };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

// ============================================================
// Reverse coins when an order is cancelled or returned
//
// Idempotency: same unique constraint pattern (orderId + EARNED_REVERSAL).
// Only reverses if coins were previously awarded.
// ============================================================
export async function reverseOrderCoins(orderId: string): Promise<{
  ok: boolean;
  reversed?: number;
  error?: string;
}> {
  const order = await db.order.findUnique({ where: { id: orderId } });
  if (!order) return { ok: false, error: "Order not found" };
  if (!order.userId) return { ok: true, reversed: 0 };

  try {
    const result = await db.$transaction(async (tx) => {
      // Did this order earn coins?
      const earned = await tx.coinTransaction.findUnique({
        where: {
          orderId_type: { orderId, type: "EARNED" as CoinTransactionType },
        },
      });
      if (!earned) {
        return { reversed: 0, nothingToReverse: true };
      }

      // Check idempotency: already reversed?
      const existing = await tx.coinTransaction.findUnique({
        where: {
          orderId_type: { orderId, type: "EARNED_REVERSAL" as CoinTransactionType },
        },
      });
      if (existing) {
        return { reversed: 0, alreadyReversed: true };
      }

      // Get current balance
      const balanceResult = await tx.coinTransaction.aggregate({
        where: { userId: order.userId! },
        _sum: { amount: true },
      });
      const currentBalance = balanceResult._sum.amount ?? 0;
      // Reverse (don't let balance go negative)
      const reversalAmount = Math.min(earned.amount, currentBalance);
      const newBalance = currentBalance - reversalAmount;

      await tx.coinTransaction.create({
        data: {
          userId: order.userId!,
          type: "EARNED_REVERSAL",
          amount: -reversalAmount,
          balanceAfter: newBalance,
          orderId,
          note: `Reversed: order ${order.orderNumber} ${order.status.toLowerCase()}`,
        },
      });

      await tx.auditLog.create({
        data: {
          actorId: order.userId,
          actorRole: "SYSTEM",
          action: "coin.reverse",
          target: `order:${order.orderNumber}`,
          details: { amount: -reversalAmount } as any,
        },
      });

      return { reversed: reversalAmount };
    });
    return { ok: true, reversed: result.reversed };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

// ============================================================
// Redeem coins for a voucher
//
// - Validates user has enough coins
// - Creates a CustomerVoucher with a unique code
// - Records a REDEEMED coin transaction (negative amount)
// - Sets voucher expiry based on Voucher.validDays
// ============================================================
const RedeemSchema = z.object({ voucherId: z.string() });

export async function redeemVoucherAction(
  input: unknown
): Promise<{ ok: true; voucherCode: string } | { ok: false; error: string }> {
  const session = await getSession();
  if (!session?.profile) return { ok: false, error: "Unauthorized" };

  // Rate limit: 10 voucher redemptions per user per hour
  const rl = rateLimit({
    key: `voucher:redeem:${session.id}`,
    limit: RATE_LIMITS.VOUCHER_REDEEM.limit,
    windowMs: RATE_LIMITS.VOUCHER_REDEEM.windowMs,
  });
  if (!rl.ok) return { ok: false, error: "Too many redemption attempts. Please try later." };

  const parsed = RedeemSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid input" };
  const { voucherId } = parsed.data;

  // Fetch the voucher template
  const voucher = await db.voucher.findUnique({ where: { id: voucherId } });
  if (!voucher || !voucher.isActive) {
    return { ok: false, error: "Voucher is no longer available" };
  }

  // Check balance
  const balance = await getCoinBalance(session.id);
  if (balance < voucher.coinCost) {
    return {
      ok: false,
      error: `You need ${voucher.coinCost} coins but have only ${balance}.`,
    };
  }

  // Generate unique voucher code: BKVC-XXXXX (alphanumeric)
  const code = `BKVC-${generateVoucherCode()}`;

  try {
    const result = await db.$transaction(async (tx) => {
      // Re-check balance inside transaction (race-safe)
      const balanceResult = await tx.coinTransaction.aggregate({
        where: { userId: session.id },
        _sum: { amount: true },
      });
      const currentBalance = balanceResult._sum.amount ?? 0;
      if (currentBalance < voucher.coinCost) {
        throw new Error("Insufficient coin balance");
      }

      // Create the customer voucher
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + voucher.validDays);
      const customerVoucher = await tx.customerVoucher.create({
        data: {
          userId: session.id,
          voucherId: voucher.id,
          code,
          status: "ACTIVE",
          expiresAt,
        },
      });

      // Deduct coins
      await tx.coinTransaction.create({
        data: {
          userId: session.id,
          type: "REDEEMED",
          amount: -voucher.coinCost,
          balanceAfter: currentBalance - voucher.coinCost,
          customerVoucherId: customerVoucher.id,
          note: `Redeemed for voucher ${voucher.name} (${code})`,
        },
      });

      // Audit
      await tx.auditLog.create({
        data: {
          actorId: session.id,
          actorRole: "CUSTOMER",
          action: "voucher.redeem",
          target: `customer_voucher:${customerVoucher.id}`,
          details: {
            code,
            coinCost: voucher.coinCost,
            voucherName: voucher.name,
          } as any,
        },
      });

      return customerVoucher;
    });

    // Send notification
    await notifyVoucherRedeemed(
      session.id,
      voucher.name,
      result.code,
      voucher.coinCost
    ).catch(() => {});

    return { ok: true, voucherCode: result.code };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

// ============================================================
// Validate a voucher code for use at checkout
// (called by the checkout page before placing the order)
// ============================================================
export async function validateVoucherAction(
  code: string,
  orderSubtotal: number
): Promise<{
  ok: boolean;
  discount?: number;
  voucherId?: string;
  error?: string;
}> {
  const session = await getSession();
  if (!session?.profile) return { ok: false, error: "Please sign in to use vouchers" };

  const cv = await db.customerVoucher.findUnique({
    where: { code: code.toUpperCase().trim() },
    include: { voucher: true },
  });
  if (!cv) return { ok: false, error: "Invalid voucher code" };
  if (cv.userId !== session.id) return { ok: false, error: "This voucher doesn't belong to you" };
  if (cv.status !== "ACTIVE") return { ok: false, error: `Voucher is ${cv.status.toLowerCase()}` };
  if (cv.expiresAt <= new Date()) return { ok: false, error: "Voucher has expired" };

  // Check min order value
  if (orderSubtotal < Number(cv.voucher.minOrderValue)) {
    return {
      ok: false,
      error: `Minimum order of tk ${Number(cv.voucher.minOrderValue)} required for this voucher`,
    };
  }

  // Calculate discount
  let discount: number;
  if (cv.voucher.type === "FIXED_AMOUNT") {
    discount = Number(cv.voucher.value);
  } else {
    // PERCENTAGE
    discount = Math.round((orderSubtotal * Number(cv.voucher.value)) / 100);
  }
  // Don't allow discount > subtotal
  discount = Math.min(discount, orderSubtotal);

  return { ok: true, discount, voucherId: cv.id };
}

function generateVoucherCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no I, O, 0, 1 (ambiguous)
  let code = "";
  for (let i = 0; i < 5; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// ============================================================
// Get a customer's coin balance + recent transactions
// ============================================================
export async function getMyCoinHistory(limit = 50) {
  const session = await getSession();
  if (!session?.profile) return { balance: 0, transactions: [] };

  const [balanceResult, transactions] = await Promise.all([
    db.coinTransaction.aggregate({
      where: { userId: session.id },
      _sum: { amount: true },
    }),
    db.coinTransaction.findMany({
      where: { userId: session.id },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        order: { select: { orderNumber: true } },
        voucher: { select: { code: true, voucher: { select: { name: true } } } },
      },
    }),
  ]);

  return {
    balance: balanceResult._sum.amount ?? 0,
    transactions,
  };
}

// ============================================================
// Get a customer's vouchers (active + used + expired)
// ============================================================
export async function getMyVouchers() {
  const session = await getSession();
  if (!session?.profile) return [];

  return db.customerVoucher.findMany({
    where: { userId: session.id },
    include: { voucher: true, order: { select: { orderNumber: true } } },
    orderBy: { redeemedAt: "desc" },
  });
}
