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

export async function deleteCategoryAction(categoryId: string): Promise<Result> {
  const session = await getSession();
  if (!session?.profile || !["ADMIN", "MODERATOR"].includes(session.profile.role)) {
    return { ok: false, error: "Unauthorized" };
  }
  // Soft delete (deactivate) rather than hard delete
  await db.category.update({
    where: { id: categoryId },
    data: { isActive: false },
  });
  await db.auditLog.create({
    data: {
      actorId: session.id,
      actorRole: session.profile.role,
      action: "category.delete",
      target: `category:${categoryId}`,
    },
  });
  return { ok: true, categoryId };
}
