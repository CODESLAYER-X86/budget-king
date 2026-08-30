"use server";

import { db } from "@/lib/db";
import { z } from "zod";
import { getSession } from "@/lib/auth/session";
import type { CheckoutResult } from "@/types/cart";
import { headers } from "next/headers";

const LineSchema = z.object({
  variantId: z.string().min(1),
  quantity: z.number().int().positive().max(100),
});

const CheckoutSchema = z.object({
  customer: z.object({
    fullName: z.string().min(2, "Name is too short"),
    phone: z.string().regex(/^01[0-9]{9}$/, "Phone must be 11 digits starting with 01"),
    email: z.string().email().optional().or(z.literal("")),
  }),
  address: z.object({
    fullName: z.string().min(2),
    phone: z.string().regex(/^01[0-9]{9}$/),
    division: z.string().min(2),
    district: z.string().min(2),
    area: z.string().optional(),
    addressLine: z.string().min(5, "Address too short"),
  }),
  deliveryZoneId: z.string().min(1),
  notes: z.string().max(1000).optional(),
  voucherCode: z.string().max(30).optional(),
  redeemCoins: z.boolean().optional(),
  lines: z.array(LineSchema).min(1, "Cart is empty"),
});

/**
 * Place a COD order — OPTIMIZED for Vercel serverless.
 * 
 * Minimized DB queries:
 * 1. Get session (optional — guests can order)
 * 2. Single transaction: fetch zone + variants + create order + reserve stock
 * 3. Notification (fire-and-forget, non-blocking)
 * 
 * Total DB queries: ~8 (down from 15+)
 */
export async function placeOrderAction(input: unknown): Promise<CheckoutResult> {
  // 1. Validate input
  const parsed = CheckoutSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid checkout data",
    };
  }
  const data = parsed.data;

  // 2. Get session (lightweight — fast local JWT verification)
  let userId: string | null = null;
  try {
    const session = await getSession();
    userId = session?.id ?? null;
  } catch {
    // Guest checkout
  }

  // 3. Single atomic transaction — with extended timeout for serverless
  try {
    const result = await db.$transaction(async (tx) => {
      // 3a. Parallel pre-flight: fetch zone + variants in parallel
      const [zone, variants] = await Promise.all([
        tx.deliveryZone.findUnique({ where: { id: data.deliveryZoneId } }),
        tx.productVariant.findMany({
          where: { id: { in: data.lines.map((l) => l.variantId) } },
          include: {
            product: {
              select: {
                name: true,
                status: true,
                images: { where: { isPrimary: true }, take: 1, select: { imageUrl: true } },
              },
            },
            inventory: { select: { id: true, quantity: true, reserved: true } },
          },
        }),
      ]);

      if (!zone || !zone.isActive) {
        throw new Error("Selected delivery zone is not available");
      }

      // 3b. Validate variants + stock
      if (variants.length !== data.lines.length) {
        throw new Error("One or more products in your cart are no longer available");
      }

      for (const line of data.lines) {
        const variant = variants.find((v) => v.id === line.variantId);
        if (!variant) throw new Error("Product not found");
        if (variant.product.status === "ARCHIVED" || variant.product.status === "OUT_OF_STOCK") {
          throw new Error(`"${variant.product.name}" is no longer available`);
        }
        const available = (variant.inventory?.quantity ?? 0) - (variant.inventory?.reserved ?? 0);
        if (available < line.quantity) {
          throw new Error(`"${variant.product.name}" — only ${available} in stock`);
        }
      }

      // 3c. Generate order number
      const year = new Date().getFullYear();
      const prefix = `BK-${year}-`;
      const lastOrder = await tx.order.findFirst({
        where: { orderNumber: { startsWith: prefix } },
        orderBy: { orderNumber: "desc" },
        select: { orderNumber: true },
      });
      const nextSeq = lastOrder ? parseInt(lastOrder.orderNumber.split("-")[2], 10) + 1 : 1;
      const orderNumber = `${prefix}${String(nextSeq).padStart(6, "0")}`;

      // 3d. Calculate subtotal
      let subtotal = 0;
      const orderItemsData = data.lines.map((line) => {
        const variant = variants.find((v) => v.id === line.variantId)!;
        const unitPrice = Number(variant.price);
        const totalPrice = unitPrice * line.quantity;
        subtotal += totalPrice;
        const opts = variant.options as { color?: string; size?: string };
        return {
          productId: variant.productId,
          variantId: variant.id,
          quantity: line.quantity,
          unitPrice: variant.price,
          totalPrice,
          productName: variant.product.name,
          variantLabel: [opts.color, opts.size].filter(Boolean).join(" / "),
          productImage: variant.product.images[0]?.imageUrl ?? null,
          productSku: variant.sku,
        };
      });

      // 3e. Process Promo Coupon or Customer Voucher
      let appliedVoucherId: string | null = null;
      let appliedCouponId: string | null = null;
      let couponDiscount = 0;

      if (data.voucherCode && data.voucherCode.trim()) {
        const normalizedCode = data.voucherCode.toUpperCase().trim();
        const now = new Date();

        // Check Promo Code (Coupon e.g. EID50)
        const coupon = await tx.coupon.findUnique({
          where: { code: normalizedCode },
        });

        if (coupon) {
          if (!coupon.isActive) throw new Error("This promo code is no longer active");
          if (coupon.startDate && coupon.startDate > now) throw new Error("This promo code is not active yet");
          if (coupon.expiresAt && coupon.expiresAt <= now) throw new Error("This promo code has expired");
          if (coupon.totalUsageLimit !== null && coupon.usedCount >= coupon.totalUsageLimit) {
            throw new Error("This promo code has reached its usage limit");
          }
          if (subtotal < Number(coupon.minOrderValue)) {
            throw new Error(`Minimum order of ৳${Number(coupon.minOrderValue)} required for code ${coupon.code}`);
          }

          if (userId) {
            const userUsages = await tx.couponUsage.count({
              where: { couponId: coupon.id, userId },
            });
            if (userUsages >= coupon.perUserLimit) {
              throw new Error(`You have already used code "${coupon.code}" (${coupon.perUserLimit} use limit per customer)`);
            }
          }

          if (coupon.type === "FIXED_AMOUNT") {
            couponDiscount = Number(coupon.value);
          } else {
            couponDiscount = Math.round((subtotal * Number(coupon.value)) / 100);
            if (coupon.maxDiscount) {
              couponDiscount = Math.min(couponDiscount, Number(coupon.maxDiscount));
            }
          }
          couponDiscount = Math.min(couponDiscount, subtotal);
          appliedCouponId = coupon.id;
        } else {
          // Check Personal Customer Voucher (e.g. BKVC-XXXXX)
          if (!userId) {
            throw new Error("Please sign in to use your personal rewards voucher");
          }

          const cv = await tx.customerVoucher.findUnique({
            where: { code: normalizedCode },
            include: { voucher: true },
          });

          if (!cv) throw new Error("Invalid promo code or voucher");
          if (cv.userId !== userId) throw new Error("This voucher does not belong to your account");
          if (cv.status !== "ACTIVE") throw new Error(`Voucher is ${cv.status.toLowerCase()}`);
          if (cv.expiresAt <= now) throw new Error("Voucher has expired");
          if (subtotal < Number(cv.voucher.minOrderValue)) {
            throw new Error(`Minimum order of ৳${Number(cv.voucher.minOrderValue)} required for this voucher`);
          }

          if (cv.voucher.type === "FIXED_AMOUNT") {
            couponDiscount = Number(cv.voucher.value);
          } else {
            couponDiscount = Math.round((subtotal * Number(cv.voucher.value)) / 100);
          }
          couponDiscount = Math.min(couponDiscount, subtotal);
          appliedVoucherId = cv.id;
        }
      }

      // 3f. Process Direct Coin Redemption (Dynamic rate: e.g. 10 or 30 Coins = ৳1)
      let coinDiscount = 0;
      let coinsRedeemed = 0;

      if (data.redeemCoins && userId) {
        const [coinBalanceResult, rewardSetting] = await Promise.all([
          tx.coinTransaction.aggregate({
            where: { userId },
            _sum: { amount: true },
          }),
          tx.rewardSetting.findUnique({ where: { id: "default" } }),
        ]);

        const currentCoinBalance = coinBalanceResult._sum.amount ?? 0;
        const coinsPerTk = rewardSetting?.coinsPerTk ?? 10;
        const maxPercent = (rewardSetting?.maxRedemptionPercent ?? 20) / 100;
        const minCoins = rewardSetting?.minCoinsToRedeem ?? 10;
        const isDirectActive = rewardSetting?.isDirectRedemptionActive ?? true;

        if (isDirectActive && currentCoinBalance >= minCoins && coinsPerTk > 0) {
          const remainingSubtotal = Math.max(0, subtotal - couponDiscount);
          const maxAllowedTk = Math.min(
            remainingSubtotal,
            Math.max(50, Math.floor(remainingSubtotal * maxPercent))
          );
          const maxCoinsAffordableTk = Math.floor(currentCoinBalance / coinsPerTk);
          coinDiscount = Math.min(maxAllowedTk, maxCoinsAffordableTk);
          coinsRedeemed = coinDiscount * coinsPerTk;
        }
      }

      const totalDiscount = couponDiscount + coinDiscount;
      const deliveryCharge = Number(zone.charge);
      const total = Math.max(0, subtotal - totalDiscount + deliveryCharge);

      // 3g. Create order
      const order = await tx.order.create({
        data: {
          orderNumber,
          userId,
          status: "PENDING",
          paymentMethod: "COD",
          customerName: data.customer.fullName,
          customerPhone: data.customer.phone,
          customerEmail: data.customer.email || null,
          deliveryAddressJson: {
            fullName: data.address.fullName,
            phone: data.address.phone,
            division: data.address.division,
            district: data.address.district,
            area: data.address.area ?? null,
            addressLine: data.address.addressLine,
          },
          deliveryZoneId: zone.id,
          deliveryCharge: zone.charge,
          subtotal,
          discount: totalDiscount,
          couponDiscount,
          coinDiscount,
          coinsRedeemed,
          appliedVoucherId,
          appliedCouponId,
          notes: data.notes ?? null,
          items: { create: orderItemsData },
          statusHistory: {
            create: { status: "PENDING", note: "Order placed" },
          },
        },
      });

      // 3h. Record Coupon / Voucher / Coin usage
      if (appliedVoucherId) {
        await tx.customerVoucher.update({
          where: { id: appliedVoucherId },
          data: {
            status: "USED",
            usedOnOrderId: order.id,
            usedAt: new Date(),
          },
        });
      }

      if (appliedCouponId) {
        await tx.coupon.update({
          where: { id: appliedCouponId },
          data: { usedCount: { increment: 1 } },
        });
        await tx.couponUsage.create({
          data: {
            couponId: appliedCouponId,
            userId,
            orderId: order.id,
            discount: couponDiscount,
          },
        });
      }

      if (coinsRedeemed > 0 && userId) {
        const balResult = await tx.coinTransaction.aggregate({
          where: { userId },
          _sum: { amount: true },
        });
        const currentBal = balResult._sum.amount ?? 0;
        await tx.coinTransaction.create({
          data: {
            userId,
            type: "REDEEMED",
            amount: -coinsRedeemed,
            balanceAfter: currentBal - coinsRedeemed,
            orderId: order.id,
            note: `Direct checkout discount: ${coinsRedeemed} coins for ৳${coinDiscount} off on order ${orderNumber}`,
          },
        });
      }

      // 3i. Reserve stock
      for (const line of data.lines) {
        const variant = variants.find((v) => v.id === line.variantId)!;
        if (!variant.inventory) continue;
        await tx.inventory.update({
          where: { id: variant.inventory.id },
          data: { reserved: { increment: line.quantity } },
        });
      }

      return { order, orderNumber };
    }, {
      timeout: 15000, // 15 seconds — default is 5s, too short for serverless
    });

    // 4. Audit log (outside transaction — non-blocking)
    db.auditLog.create({
      data: {
        actorId: userId,
        actorRole: userId ? "CUSTOMER" : "GUEST",
        action: "order.create",
        target: `order:${result.orderNumber}`,
        details: { total: Number(result.order.total), itemCount: data.lines.length } as any,
      },
    }).catch(() => {});

    // 5. Send notification (fire-and-forget — don't block the response)
    if (userId) {
      import("@/lib/notifications").then(({ notifyOrderPlaced }) =>
        notifyOrderPlaced({
          id: result.order.id,
          orderNumber: result.orderNumber,
          userId,
          customerName: data.customer.fullName,
          total: Number(result.order.total),
        })
      ).catch(() => {});
    }

    return { ok: true, orderNumber: result.orderNumber };
  } catch (e) {
    const error = e as Error;
    return { ok: false, error: error.message ?? "Failed to place order" };
  }
}
