"use server";

import { db } from "@/lib/db";
import { z } from "zod";
import { getSession } from "@/lib/auth/session";
import { rateLimit, RATE_LIMITS } from "@/lib/security/rate-limit";

const VariantInputSchema = z.object({
  id: z.string().optional(),
  sku: z.string().min(1, "SKU is required"),
  price: z.string().refine((v) => parseFloat(v) > 0, "Price must be > 0"),
  compareAtPrice: z.string().optional(),
  color: z.string().optional(),
  size: z.string().optional(),
  stock: z.string().refine((v) => parseInt(v, 10) >= 0, "Stock must be ≥ 0"),
});

const SaveProductSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, "Name too short"),
  slug: z.string().min(2, "Slug too short"),
  shortDescription: z.string().optional(),
  description: z.string().optional(),
  categoryId: z.string().min(1, "Category required"),
  brand: z.string().optional(),
  basePrice: z.string().refine((v) => parseFloat(v) > 0, "Base price must be > 0"),
  status: z.enum(["DRAFT", "ACTIVE", "OUT_OF_STOCK", "ARCHIVED"]),
  isFeatured: z.boolean(),
  variants: z.array(VariantInputSchema).min(1, "At least one variant required"),
  images: z.array(z.string().url("Invalid image URL")).default([]),
});

type SaveResult = { ok: true; productId: string } | { ok: false; error: string };

export async function saveProductAction(input: unknown): Promise<SaveResult> {
  const session = await getSession();
  if (!session?.profile || session.profile.role !== "ADMIN") {
    return { ok: false, error: "Unauthorized" };
  }

  // Rate limit: 60 product saves per admin per minute
  const rl = rateLimit({
    key: `product:save:${session.id}`,
    limit: RATE_LIMITS.INVENTORY_ADJUST.limit,
    windowMs: RATE_LIMITS.INVENTORY_ADJUST.windowMs,
  });
  if (!rl.ok) {
    return { ok: false, error: "Rate limit exceeded. Slow down." };
  }

  const parsed = SaveProductSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const data = parsed.data;

  // Ensure slug uniqueness
  const existing = await db.product.findUnique({ where: { slug: data.slug } });
  if (existing && existing.id !== data.id) {
    return { ok: false, error: "A product with this slug already exists" };
  }

  // Validate SKU uniqueness
  const allSkus = data.variants.map((v) => v.sku);
  if (new Set(allSkus).size !== allSkus.length) {
    return { ok: false, error: "Each variant must have a unique SKU" };
  }
  for (const sku of allSkus) {
    const existingVariant = await db.productVariant.findUnique({ where: { sku } });
    if (existingVariant && !data.variants.find((v) => v.id === existingVariant.id)) {
      return { ok: false, error: `SKU "${sku}" is already in use` };
    }
  }

  try {
    const result = await db.$transaction(async (tx) => {
      let productId = data.id;

      if (productId) {
        // Update existing product
        await tx.product.update({
          where: { id: productId },
          data: {
            name: data.name,
            slug: data.slug,
            shortDescription: data.shortDescription || null,
            description: data.description || null,
            categoryId: data.categoryId,
            brand: data.brand || null,
            basePrice: parseFloat(data.basePrice),
            status: data.status,
            isFeatured: data.isFeatured,
          },
        });

        // Delete old images, then re-create
        await tx.productImage.deleteMany({ where: { productId } });
        if (data.images.length > 0) {
          await tx.productImage.createMany({
            data: data.images.map((url, idx) => ({
              productId: productId!,
              imageUrl: url,
              sortOrder: idx,
              isPrimary: idx === 0,
            })),
          });
        }

        // Delete variants that no longer exist in the form
        const keepIds = data.variants.map((v) => v.id).filter(Boolean) as string[];
        await tx.productVariant.deleteMany({
          where: { productId, id: { notIn: keepIds } },
        });

        // Upsert variants
        for (const v of data.variants) {
          const opts: Record<string, string> = {};
          if (v.color) opts.color = v.color;
          if (v.size) opts.size = v.size;

          if (v.id) {
            await tx.productVariant.update({
              where: { id: v.id },
              data: {
                sku: v.sku,
                price: parseFloat(v.price),
                compareAtPrice: v.compareAtPrice ? parseFloat(v.compareAtPrice) : null,
                options: opts,
              },
            });
            // Update inventory quantity
            const inv = await tx.inventory.findUnique({ where: { variantId: v.id } });
            if (inv) {
              const oldQty = inv.quantity;
              const newQty = parseInt(v.stock, 10);
              if (oldQty !== newQty) {
                await tx.inventory.update({
                  where: { id: inv.id },
                  data: { quantity: newQty },
                });
                await tx.inventoryMovement.create({
                  data: {
                    inventoryId: inv.id,
                    type: "ADJUSTMENT",
                    quantity: newQty - oldQty,
                    note: `Admin adjusted stock from ${oldQty} to ${newQty}`,
                    createdBy: session.id,
                  },
                });
              }
            } else {
              await tx.inventory.create({
                data: {
                  variantId: v.id,
                  quantity: parseInt(v.stock, 10),
                },
              });
            }
          } else {
            const newVariant = await tx.productVariant.create({
              data: {
                productId: productId!,
                sku: v.sku,
                price: parseFloat(v.price),
                compareAtPrice: v.compareAtPrice ? parseFloat(v.compareAtPrice) : null,
                options: opts,
                status: "ACTIVE",
              },
            });
            await tx.inventory.create({
              data: {
                variantId: newVariant.id,
                quantity: parseInt(v.stock, 10),
              },
            });
            await tx.inventoryMovement.create({
              data: {
                inventoryId: (await tx.inventory.findUnique({ where: { variantId: newVariant.id } }))!.id,
                type: "INITIAL",
                quantity: parseInt(v.stock, 10),
                note: "Initial stock",
                createdBy: session.id,
              },
            });
          }
        }
      } else {
        // Create new product
        const newProduct = await tx.product.create({
          data: {
            name: data.name,
            slug: data.slug,
            shortDescription: data.shortDescription || null,
            description: data.description || null,
            categoryId: data.categoryId,
            brand: data.brand || null,
            basePrice: parseFloat(data.basePrice),
            status: data.status,
            isFeatured: data.isFeatured,
          },
        });
        productId = newProduct.id;

        // Images
        if (data.images.length > 0) {
          await tx.productImage.createMany({
            data: data.images.map((url, idx) => ({
              productId,
              imageUrl: url,
              sortOrder: idx,
              isPrimary: idx === 0,
            })),
          });
        }

        // Variants + inventory
        for (const v of data.variants) {
          const opts: Record<string, string> = {};
          if (v.color) opts.color = v.color;
          if (v.size) opts.size = v.size;

          const newVariant = await tx.productVariant.create({
            data: {
              productId: productId,
              sku: v.sku,
              price: parseFloat(v.price),
              compareAtPrice: v.compareAtPrice ? parseFloat(v.compareAtPrice) : null,
              options: opts,
              status: "ACTIVE",
            },
          });
          const inv = await tx.inventory.create({
            data: {
              variantId: newVariant.id,
              quantity: parseInt(v.stock, 10),
            },
          });
          await tx.inventoryMovement.create({
            data: {
              inventoryId: inv.id,
              type: "INITIAL",
              quantity: parseInt(v.stock, 10),
              note: "Initial stock",
              createdBy: session.id,
            },
          });
        }
      }

      // Audit log
      await tx.auditLog.create({
        data: {
          actorId: session.id,
          actorRole: session.profile!.role,
          action: data.id ? "product.update" : "product.create",
          target: `product:${productId}`,
          details: {
            name: data.name,
            slug: data.slug,
            variantCount: data.variants.length,
          } as any,
        },
      });

      return { productId };
    });

    return { ok: true, productId: result.productId };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function deleteProductAction(productId: string): Promise<SaveResult> {
  const session = await getSession();
  if (!session?.profile || session.profile.role !== "ADMIN") {
    return { ok: false, error: "Unauthorized" };
  }

  const product = await db.product.findUnique({
    where: { id: productId },
    include: { _count: { select: { orderItems: true } } },
  });
  if (!product) return { ok: false, error: "Product not found" };

  // Don't hard delete — just archive (preserves order history)
  await db.product.update({
    where: { id: productId },
    data: { status: "ARCHIVED" },
  });

  await db.auditLog.create({
    data: {
      actorId: session.id,
      actorRole: session.profile!.role,
      action: "product.archive",
      target: `product:${productId}`,
      details: { name: product.name } as any,
    },
  });

  return { ok: true, productId };
}
