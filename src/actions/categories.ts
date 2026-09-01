"use server";

import { db } from "@/lib/db";
import { z } from "zod";
import { getSession } from "@/lib/auth/session";

const SaveCategorySchema = z.object({
  name: z.string().min(1, "Name required"),
  slug: z.string().min(1, "Slug required"),
  parentId: z.string().optional(),
  description: z.string().optional(),
  imageUrl: z.string().url().optional().or(z.literal("")),
});

type Result = { ok: true; categoryId: string } | { ok: false; error: string };

export async function saveCategoryAction(input: unknown): Promise<Result> {
  const session = await getSession();
  if (!session?.profile || !["ADMIN", "MODERATOR"].includes(session.profile.role)) {
    return { ok: false, error: "Unauthorized" };
  }
  const parsed = SaveCategorySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const data = parsed.data;

  const existing = await db.category.findUnique({ where: { slug: data.slug } });
  if (existing) return { ok: false, error: "Slug already exists" };

  const category = await db.category.create({
    data: {
      name: data.name,
      slug: data.slug,
      parentId: data.parentId || null,
      description: data.description || null,
      imageUrl: data.imageUrl || null,
      isActive: true,
    },
  });

  await db.auditLog.create({
    data: {
      actorId: session.id,
      actorRole: session.profile.role,
      action: "category.create",
      target: `category:${category.id}`,
      details: { name: category.name } as any,
    },
  });

  return { ok: true, categoryId: category.id };
}

import { revalidatePath } from "next/cache";

export async function toggleCategoryStatusAction(categoryId: string): Promise<Result> {
  const session = await getSession();
  if (!session?.profile || !["ADMIN", "MODERATOR"].includes(session.profile.role)) {
    return { ok: false, error: "Unauthorized" };
  }

  const category = await db.category.findUnique({ where: { id: categoryId } });
  if (!category) return { ok: false, error: "Category not found" };

  await db.category.update({
    where: { id: categoryId },
    data: { isActive: !category.isActive },
  });

  revalidatePath("/");
  revalidatePath("/shop");
  revalidatePath("/admin/categories");

  return { ok: true, categoryId };
}

export async function deleteCategoryAction(categoryId: string): Promise<Result> {
  const session = await getSession();
  if (!session?.profile || !["ADMIN", "MODERATOR"].includes(session.profile.role)) {
    return { ok: false, error: "Unauthorized" };
  }

  const category = await db.category.findUnique({
    where: { id: categoryId },
    include: {
      children: true,
      _count: { select: { products: true } },
    },
  });

  if (!category) return { ok: false, error: "Category not found" };

  try {
    await db.$transaction(async (tx) => {
      // 1. Unlink any child subcategories
      await tx.category.updateMany({
        where: { parentId: categoryId },
        data: { parentId: null },
      });

      // 2. If products exist in this category, reassign them to another active category
      if (category._count.products > 0) {
        let fallback = await tx.category.findFirst({
          where: { id: { not: categoryId }, isActive: true },
        });

        if (!fallback) {
          // Create general fallback category if none exists
          fallback = await tx.category.create({
            data: {
              name: "General",
              slug: "general",
              description: "General clothing",
              isActive: true,
            },
          });
        }

        await tx.product.updateMany({
          where: { categoryId },
          data: { categoryId: fallback.id },
        });
      }

      // 3. Delete size guide / attributes linked to this category
      await tx.sizeGuide.deleteMany({ where: { categoryId } }).catch(() => {});
      await tx.attribute.deleteMany({ where: { categoryId } }).catch(() => {});

      // 4. Permanently delete the category
      await tx.category.delete({
        where: { id: categoryId },
      });

      // 5. Audit log
      await tx.auditLog.create({
        data: {
          actorId: session.id,
          actorRole: session.profile!.role,
          action: "category.delete",
          target: `category:${categoryId}`,
          details: { name: category.name } as any,
        },
      });
    });

    revalidatePath("/");
    revalidatePath("/shop");
    revalidatePath("/admin/categories");

    return { ok: true, categoryId };
  } catch (e) {
    return { ok: false, error: (e as Error).message || "Failed to delete category" };
  }
}
