"use server";

import { db } from "@/lib/db";
import { z } from "zod";
import { getSession } from "@/lib/auth/session";
import type { CheckoutResult } from "@/types/cart";

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
  voucherCode: z.string().optional(),
  lines: z.array(LineSchema).min(1, "Cart is empty"),
});

/**
 * Place a COD order.
 *
 * Critical security/business rules:
 * - Browser sends ONLY variantId + quantity (no prices)
 * - Server reads live prices from DB
 * - Server validates stock availability
 * - Server calculates delivery charge from the zone
 * - Order creation + inventory reservation is atomic (Prisma transaction)
 * - Order number is generated sequentially with a "BK-YYYY-" prefix
 * - Idempotency is handled at the order-number level (DB unique constraint)
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

  // 2. Authenticate (optional — guests can order)
  const session = await getSession();

  // 3. Atomic transaction: validate stock + create order + reserve inventory
  try {
    const result = await db.$transaction(async (tx) => {
      // 3a. Fetch delivery zone
      const zone = await tx.deliveryZone.findUnique({
        where: { id: data.deliveryZoneId },
      });
      if (!zone || !zone.isActive) {
        throw new Error("Selected delivery zone is not available");
      }

      // 3b. Fetch all variants with current prices + inventory
      const variantIds = data.lines.map((l) => l.variantId);
      const variants = await tx.productVariant.findMany({
        where: { id: { in: variantIds }, status: "ACTIVE" },
        include: {
          product: {
            include: { images: { where: { isPrimary: true }, take: 1 } },
          },
          inventory: true,
        },
      });

      // Validate all variants exist
      if (variants.length !== variantIds.length) {
        throw new Error("One or more products in your cart are no longer available");
      }

      // 3c. Check stock availability for each line
      for (const line of data.lines) {
        const variant = variants.find((v) => v.id === line.variantId);
        if (!variant) {
          throw new Error(`Product not found`);
        }
        if (variant.product.status === "ARCHIVED" || variant.product.status === "OUT_OF_STOCK") {
          throw new Error(`"${variant.product.name}" is no longer available`);
        }
        const available =
          (variant.inventory?.quantity ?? 0) - (variant.inventory?.reserved ?? 0);
        if (available < line.quantity) {
          throw new Error(
            `"${variant.product.name}" — only ${available} in stock (you requested ${line.quantity})`
          );
        }
      }

      // 3d. Generate order number: BK-YYYY-NNNNNN (sequential per year)
      const year = new Date().getFullYear();
      const prefix = `BK-${year}-`;
      const lastOrder = await tx.order.findFirst({
        where: { orderNumber: { startsWith: prefix } },
        orderBy: { orderNumber: "desc" },
      });
      const nextSeq = lastOrder
        ? parseInt(lastOrder.orderNumber.split("-")[2], 10) + 1
        : 1;
      const orderNumber = `${prefix}${String(nextSeq).padStart(6, "0")}`;

      // 3e. Calculate totals (server-authoritative)
      let subtotal = 0;
      const orderItemsData = data.lines.map((line) => {
        const variant = variants.find((v) => v.id === line.variantId)!;
        const unitPrice = Number(variant.price);
        const totalPrice = unitPrice * line.quantity;
        subtotal += totalPrice;

        const opts = variant.options as { color?: string; size?: string };
        const variantLabel = [opts.color, opts.size].filter(Boolean).join(" / ");

        return {
          productId: variant.productId,
          variantId: variant.id,
          quantity: line.quantity,
          unitPrice: variant.price,
          totalPrice,
          productName: variant.product.name,
          variantLabel,
          productImage: variant.product.images[0]?.imageUrl ?? null,
          productSku: variant.sku,
        };
      });

      const deliveryCharge = Number(zone.charge);
      const total = subtotal + deliveryCharge;

      // 3f. Create order
      const order = await tx.order.create({
        data: {
          orderNumber,
          userId: session?.id ?? null,
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
        include: { items: true },
      });

      // 3g. Reserve stock + record movement
      for (const line of data.lines) {
        const variant = variants.find((v) => v.id === line.variantId)!;
        const inventoryId = variant.inventory?.id;
        if (!inventoryId) continue;

        await tx.inventory.update({
          where: { id: inventoryId },
          data: { reserved: { increment: line.quantity } },
        });

        await tx.inventoryMovement.create({
          data: {
            inventoryId,
            type: "RESERVED",
            quantity: line.quantity,
            refOrderId: order.id,
            note: `Reserved for order ${orderNumber}`,
          },
        });
      }

      // 3h. Record initial status history
      await tx.orderStatusHistory.create({
        data: {
          orderId: order.id,
          status: "PENDING",
          note: "Order placed by customer",
        },
      });

      // 3i. Audit log
      await tx.auditLog.create({
        data: {
          actorId: session?.id,
          actorRole: session?.profile?.role ?? "GUEST",
          action: "order.create",
          target: `order:${orderNumber}`,
          details: {
            total,
            itemCount: data.lines.length,
            paymentMethod: "COD",
          } as any,
        },
      });

      return order;
    });

    return { ok: true, orderNumber: result.orderNumber };
  } catch (e) {
    const error = e as Error;
    return { ok: false, error: error.message ?? "Failed to place order" };
  }
}
