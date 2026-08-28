"use server";

import { db } from "@/lib/db";
import { z } from "zod";
import { createServerClient } from "@/lib/supabase/server";
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

  // 2. Get session (lightweight — only if auth cookies exist)
  let userId: string | null = null;
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    userId = user?.id ?? null;
  } catch {
    // Auth failed — treat as guest
  }

  // 3. Single atomic transaction — everything in one DB round-trip group
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

      // 3d. Calculate totals
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

      const deliveryCharge = Number(zone.charge);
      const total = subtotal + deliveryCharge;

      // 3e. Create order + items in one operation
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
          discount: 0,
          total,
          notes: data.notes ?? null,
          items: { create: orderItemsData },
        },
      });

      // 3f. Reserve stock — batch update
      for (const line of data.lines) {
        const variant = variants.find((v) => v.id === line.variantId)!;
        if (!variant.inventory) continue;
        await tx.inventory.update({
          where: { id: variant.inventory.id },
          data: { reserved: { increment: line.quantity } },
        });
      }

      // 3g. Status history + audit log
      await tx.orderStatusHistory.create({
        data: { orderId: order.id, status: "PENDING", note: "Order placed" },
      });
      await tx.auditLog.create({
        data: {
          actorId: userId,
          actorRole: userId ? "CUSTOMER" : "GUEST",
          action: "order.create",
          target: `order:${orderNumber}`,
          details: { total, itemCount: data.lines.length } as any,
        },
      });

      return { order, orderNumber };
    });

    // 4. Send notification (fire-and-forget — don't block the response)
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
