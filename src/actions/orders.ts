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
  voucherCode: z.string().max(20).optional(),
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
    // Auth failed — treat as guest
  }

  // 3. Single atomic transaction — with extended timeout for serverless
  try {
    const result = await db.$transaction(async (tx) => {
      // 3a. Fetch delivery zone + variants in parallel
      const [zone, variants] = await Promise.all([
        tx.deliveryZone.findUnique({ where: { id: data.deliveryZoneId } }),
        tx.productVariant.findMany({
          where: { id: { in: data.lines.map((l) => l.variantId) }, status: "ACTIVE" },
          include: {
            product: {
              select: { name: true, status: true, images: { where: { isPrimary: true }, take: 1, select: { imageUrl: true } } },
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

      // 3d. Calculate totals and process voucher
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

      let appliedVoucherId: string | null = null;
      let discount = 0;

      if (data.voucherCode && data.voucherCode.trim()) {
        if (!userId) {
          throw new Error("Please sign in to apply vouchers");
        }
        const normalizedCode = data.voucherCode.toUpperCase().trim();
        const cv = await tx.customerVoucher.findUnique({
          where: { code: normalizedCode },
          include: { voucher: true },
        });

        if (!cv) throw new Error("Invalid voucher code");
        if (cv.userId !== userId) throw new Error("This voucher does not belong to your account");
        if (cv.status !== "ACTIVE") throw new Error(`Voucher is ${cv.status.toLowerCase()}`);
        if (cv.expiresAt <= new Date()) throw new Error("Voucher has expired");
        if (subtotal < Number(cv.voucher.minOrderValue)) {
          throw new Error(`Minimum order of ৳${Number(cv.voucher.minOrderValue)} required for this voucher`);
        }

        if (cv.voucher.type === "FIXED_AMOUNT") {
          discount = Number(cv.voucher.value);
        } else {
          discount = Math.round((subtotal * Number(cv.voucher.value)) / 100);
        }
        discount = Math.min(discount, subtotal);
        appliedVoucherId = cv.id;
      }

      const deliveryCharge = Number(zone.charge);
      const total = Math.max(0, subtotal - discount + deliveryCharge);

      // 3e. Create order + items + status history + audit log in ONE create
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
          discount,
          total,
          appliedVoucherId,
          notes: data.notes ?? null,
          items: { create: orderItemsData },
          statusHistory: {
            create: { status: "PENDING", note: "Order placed" },
          },
        },
      });

      // 3f. Mark voucher as USED
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

      // 3f. Reserve stock — batch (no movements, just increment reserved)
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
