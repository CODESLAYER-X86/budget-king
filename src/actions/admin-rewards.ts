"use server";

import { db } from "@/lib/db";
import { z } from "zod";
import { getSession } from "@/lib/auth/session";

const SaveRuleSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1).max(100),
  minPurchase: z.string().refine((v) => parseFloat(v) > 0),
  coinsAwarded: z.string().refine((v) => parseInt(v, 10) > 0),
  isActive: z.boolean().optional(),
});

const SaveVoucherSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1).max(100),
  type: z.enum(["FIXED_AMOUNT", "PERCENTAGE"]),
  value: z.string().refine((v) => parseFloat(v) > 0),
  coinCost: z.string().refine((v) => parseInt(v, 10) > 0),
  minOrderValue: z.string().default("0"),
  validDays: z.string().default("30"),
  isActive: z.boolean().optional(),
});

type Result = { ok: true; id: string } | { ok: false; error: string };

async function requireAdmin() {
  const session = await getSession();
  if (!session?.profile || session.profile.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }
  return session;
}

// ============================================================
// Coin Rule actions
// ============================================================
export async function saveCoinRuleAction(input: unknown): Promise<Result> {
  await requireAdmin();
  const parsed = SaveRuleSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const data = parsed.data;

  try {
    if (data.id) {
      // Update
      await db.coinRule.update({
        where: { id: data.id },
        data: {
          ...(data.name && { name: data.name }),
          ...(data.minPurchase && { minPurchase: parseFloat(data.minPurchase) }),
          ...(data.coinsAwarded && { coinsAwarded: parseInt(data.coinsAwarded, 10) }),
          ...(data.isActive !== undefined && { isActive: data.isActive }),
        },
      });
      return { ok: true, id: data.id };
    }

    // Create
    const rule = await db.coinRule.create({
      data: {
        name: data.name,
        minPurchase: parseFloat(data.minPurchase),
        coinsAwarded: parseInt(data.coinsAwarded, 10),
        isActive: true,
      },
    });
    return { ok: true, id: rule.id };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function deleteCoinRuleAction(id: string): Promise<Result> {
  await requireAdmin();
  await db.coinRule.delete({ where: { id } });
  return { ok: true, id };
}

// ============================================================
// Voucher Template actions
// ============================================================
export async function saveVoucherAction(input: unknown): Promise<Result> {
  await requireAdmin();
  const parsed = SaveVoucherSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const data = parsed.data;

  try {
    if (data.id) {
      await db.voucher.update({
        where: { id: data.id },
        data: {
          ...(data.name && { name: data.name }),
          ...(data.type && { type: data.type }),
          ...(data.value && { value: parseFloat(data.value) }),
          ...(data.coinCost && { coinCost: parseInt(data.coinCost, 10) }),
          ...(data.minOrderValue && { minOrderValue: parseFloat(data.minOrderValue) }),
          ...(data.validDays && { validDays: parseInt(data.validDays, 10) }),
          ...(data.isActive !== undefined && { isActive: data.isActive }),
        },
      });
      return { ok: true, id: data.id };
    }

    const voucher = await db.voucher.create({
      data: {
        name: data.name,
        type: data.type,
        value: parseFloat(data.value),
        coinCost: parseInt(data.coinCost, 10),
        minOrderValue: parseFloat(data.minOrderValue),
        validDays: parseInt(data.validDays, 10),
        isActive: true,
      },
    });
    return { ok: true, id: voucher.id };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function deleteVoucherAction(id: string): Promise<Result> {
  await requireAdmin();
  // Soft delete (deactivate)
  await db.voucher.update({
    where: { id },
    data: { isActive: false },
  });
  return { ok: true, id };
}

// ============================================================
// Revoke a customer voucher (admin override)
// ============================================================
export async function revokeCustomerVoucherAction(
  customerVoucherId: string,
  reason: string
): Promise<Result> {
  const session = await requireAdmin();
  const cv = await db.customerVoucher.findUnique({ where: { id: customerVoucherId } });
  if (!cv) return { ok: false, error: "Voucher not found" };

  await db.$transaction(async (tx) => {
    await tx.customerVoucher.update({
      where: { id: customerVoucherId },
      data: {
        status: "REVOKED",
        revokedReason: reason,
      },
    });
    // If the voucher was redeemed with coins, refund the coins
    if (cv.status === "ACTIVE") {
      const coinTx = await tx.coinTransaction.findUnique({
        where: { customerVoucherId: cv.id },
      });
      if (coinTx) {
        const balanceResult = await tx.coinTransaction.aggregate({
          where: { userId: cv.userId },
          _sum: { amount: true },
        });
        const currentBalance = balanceResult._sum.amount ?? 0;
        await tx.coinTransaction.create({
          data: {
            userId: cv.userId,
            type: "REDEEMED_REVERSAL",
            amount: -coinTx.amount, // negate the negative = refund
            balanceAfter: currentBalance - coinTx.amount,
            customerVoucherId: cv.id,
            note: `Refund: voucher ${cv.code} revoked by admin (${reason})`,
          },
        });
      }
    }
    await tx.auditLog.create({
      data: {
        actorId: session.id,
        actorRole: "ADMIN",
        action: "voucher.revoke",
        target: `customer_voucher:${customerVoucherId}`,
        details: { reason } as any,
      },
    });
  });
  return { ok: true, id: customerVoucherId };
}
