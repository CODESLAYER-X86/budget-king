"use server";

import { db } from "@/lib/db";
import { z } from "zod";
import { getSession } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";
import type { CouponType } from "@prisma/client";

const CreateCouponSchema = z.object({
  code: z
    .string()
    .min(2, "Code must be at least 2 characters")
    .max(30, "Code is too long")
    .regex(/^[A-Z0-9_-]+$/i, "Code can only contain letters, numbers, hyphens, and underscores"),
  description: z.string().max(200).optional(),
  type: z.enum(["FIXED_AMOUNT", "PERCENTAGE"]),
  value: z.number().positive("Value must be greater than 0"),
  maxDiscount: z.number().positive().nullable().optional(),
  minOrderValue: z.number().nonnegative().default(0),
  totalUsageLimit: z.number().int().positive().nullable().optional(),
  perUserLimit: z.number().int().positive().default(1),
  expiresAt: z.string().nullable().optional(),
  isActive: z.boolean().default(true),
});

const UpdateCouponSchema = CreateCouponSchema.extend({
  id: z.string().min(1),
});

export async function createCouponAction(input: unknown) {
  const session = await getSession();
  if (!session?.profile || session.profile.role !== "ADMIN") {
    return { ok: false, error: "Unauthorized. Admin privileges required." };
  }

  const parsed = CreateCouponSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message || "Invalid coupon input" };
  }

  const data = parsed.data;
  const normalizedCode = data.code.toUpperCase().trim();

  try {
    const existing = await db.coupon.findUnique({
      where: { code: normalizedCode },
    });
    if (existing) {
      return { ok: false, error: `Coupon with code "${normalizedCode}" already exists` };
    }

    const coupon = await db.coupon.create({
      data: {
        code: normalizedCode,
        description: data.description?.trim() || null,
        type: data.type as CouponType,
        value: data.value,
        maxDiscount: data.maxDiscount || null,
        minOrderValue: data.minOrderValue,
        totalUsageLimit: data.totalUsageLimit || null,
        perUserLimit: data.perUserLimit,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
        isActive: data.isActive,
      },
    });

    revalidatePath("/admin/coupons");
    return { ok: true, coupon };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function updateCouponAction(input: unknown) {
  const session = await getSession();
  if (!session?.profile || session.profile.role !== "ADMIN") {
    return { ok: false, error: "Unauthorized" };
  }

  const parsed = UpdateCouponSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message || "Invalid coupon input" };
  }

  const data = parsed.data;
  const normalizedCode = data.code.toUpperCase().trim();

  try {
    const existing = await db.coupon.findFirst({
      where: {
        code: normalizedCode,
        NOT: { id: data.id },
      },
    });
    if (existing) {
      return { ok: false, error: `Another coupon with code "${normalizedCode}" already exists` };
    }

    await db.coupon.update({
      where: { id: data.id },
      data: {
        code: normalizedCode,
        description: data.description?.trim() || null,
        type: data.type as CouponType,
        value: data.value,
        maxDiscount: data.maxDiscount || null,
        minOrderValue: data.minOrderValue,
        totalUsageLimit: data.totalUsageLimit || null,
        perUserLimit: data.perUserLimit,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
        isActive: data.isActive,
      },
    });

    revalidatePath("/admin/coupons");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function toggleCouponActiveAction(id: string) {
  const session = await getSession();
  if (!session?.profile || session.profile.role !== "ADMIN") {
    return { ok: false, error: "Unauthorized" };
  }

  try {
    const coupon = await db.coupon.findUnique({ where: { id } });
    if (!coupon) return { ok: false, error: "Coupon not found" };

    await db.coupon.update({
      where: { id },
      data: { isActive: !coupon.isActive },
    });

    revalidatePath("/admin/coupons");
    return { ok: true, isActive: !coupon.isActive };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function deleteCouponAction(id: string) {
  const session = await getSession();
  if (!session?.profile || session.profile.role !== "ADMIN") {
    return { ok: false, error: "Unauthorized" };
  }

  try {
    await db.coupon.delete({ where: { id } });
    revalidatePath("/admin/coupons");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

/**
 * Unified Code Validator for Checkout:
 * Validates either a public Promo Code (Coupon e.g. EID50)
 * OR a personal redeemed loyalty voucher (CustomerVoucher e.g. BKVC-7X29P).
 */
export async function validateDiscountCodeAction(
  code: string,
  orderSubtotal: number
): Promise<{
  ok: boolean;
  type?: "COUPON" | "VOUCHER";
  discount?: number;
  code?: string;
  label?: string;
  error?: string;
}> {
  if (!code || !code.trim()) {
    return { ok: false, error: "Please enter a code" };
  }

  const session = await getSession();
  const normalizedCode = code.toUpperCase().trim();
  const now = new Date();

  // 1. Check Promo Coupon (e.g. EID50)
  const coupon = await db.coupon.findUnique({
    where: { code: normalizedCode },
  });

  if (coupon) {
    if (!coupon.isActive) {
      return { ok: false, error: "This promo code is no longer active" };
    }
    if (coupon.startDate && coupon.startDate > now) {
      return { ok: false, error: "This promo code is not active yet" };
    }
    if (coupon.expiresAt && coupon.expiresAt <= now) {
      return { ok: false, error: "This promo code has expired" };
    }
    if (coupon.totalUsageLimit !== null && coupon.usedCount >= coupon.totalUsageLimit) {
      return { ok: false, error: "This promo code has reached its usage limit" };
    }
    if (orderSubtotal < Number(coupon.minOrderValue)) {
      return {
        ok: false,
        error: `Minimum order of ৳${Number(coupon.minOrderValue)} required for code ${coupon.code}`,
      };
    }

    // Per user limit check (if signed in)
    if (session?.id) {
      const userUsageCount = await db.couponUsage.count({
        where: { couponId: coupon.id, userId: session.id },
      });
      if (userUsageCount >= coupon.perUserLimit) {
        return {
          ok: false,
          error: `You have already used promo code "${coupon.code}" (${coupon.perUserLimit} use limit per customer)`,
        };
      }
    }

    // Calculate discount
    let discount = 0;
    if (coupon.type === "FIXED_AMOUNT") {
      discount = Number(coupon.value);
    } else {
      discount = Math.round((orderSubtotal * Number(coupon.value)) / 100);
      if (coupon.maxDiscount) {
        discount = Math.min(discount, Number(coupon.maxDiscount));
      }
    }
    discount = Math.min(discount, orderSubtotal);

    return {
      ok: true,
      type: "COUPON",
      discount,
      code: coupon.code,
      label: coupon.description || `${coupon.code} (${coupon.type === "PERCENTAGE" ? `${coupon.value}% OFF` : `৳${coupon.value} OFF`})`,
    };
  }

  // 2. Check Personal Customer Voucher (e.g. BKVC-XXXXX)
  const cv = await db.customerVoucher.findUnique({
    where: { code: normalizedCode },
    include: { voucher: true },
  });

  if (cv) {
    if (!session?.profile) {
      return { ok: false, error: "Please sign in to use your personal rewards voucher" };
    }
    if (cv.userId !== session.id) {
      return { ok: false, error: "This voucher does not belong to your account" };
    }
    if (cv.status !== "ACTIVE") {
      return { ok: false, error: `Voucher is ${cv.status.toLowerCase()}` };
    }
    if (cv.expiresAt <= now) {
      return { ok: false, error: "Voucher has expired" };
    }
    if (orderSubtotal < Number(cv.voucher.minOrderValue)) {
      return {
        ok: false,
        error: `Minimum order of ৳${Number(cv.voucher.minOrderValue)} required for this voucher`,
      };
    }

    let discount = 0;
    if (cv.voucher.type === "FIXED_AMOUNT") {
      discount = Number(cv.voucher.value);
    } else {
      discount = Math.round((orderSubtotal * Number(cv.voucher.value)) / 100);
    }
    discount = Math.min(discount, orderSubtotal);

    return {
      ok: true,
      type: "VOUCHER",
      discount,
      code: cv.code,
      label: cv.voucher.name,
    };
  }

  return { ok: false, error: "Invalid coupon or voucher code" };
}
