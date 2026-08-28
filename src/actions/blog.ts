"use server";

import { db } from "@/lib/db";
import { z } from "zod";
import { getSession } from "@/lib/auth/session";

const SavePostSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(2).max(200),
  slug: z.string().min(2).max(200),
  excerpt: z.string().max(500).optional(),
  content: z.string().min(1),
  coverImage: z.string().url().optional().or(z.literal("")),
  categoryId: z.string().optional(),
  tags: z.array(z.string()).default([]),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
  publishedAt: z.string().optional(),
  metaDescription: z.string().max(160).optional(),
});

type Result = { ok: true; postId: string } | { ok: false; error: string };

async function requireStaff() {
  const session = await getSession();
  if (!session?.profile || !["ADMIN", "MODERATOR", "AGENT"].includes(session.profile.role)) {
    throw new Error("Unauthorized");
  }
  return session;
}

export async function saveBlogPostAction(input: unknown): Promise<Result> {
  const session = await requireStaff();
  const parsed = SavePostSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const data = parsed.data;

  // Slug uniqueness
  const existing = await db.blogPost.findUnique({ where: { slug: data.slug } });
  if (existing && existing.id !== data.id) {
    return { ok: false, error: "A post with this slug already exists" };
  }

  try {
    if (data.id) {
      const wasPublished = await db.blogPost.findUnique({
        where: { id: data.id },
        select: { status: true },
      });
      await db.blogPost.update({
        where: { id: data.id },
        data: {
          title: data.title,
          slug: data.slug,
          excerpt: data.excerpt || null,
          content: data.content,
          coverImage: data.coverImage || null,
          categoryId: data.categoryId || null,
          tags: data.tags,
          status: data.status,
          publishedAt:
            data.status === "PUBLISHED" && !wasPublished?.status.includes("PUBLISHED")
              ? new Date()
              : data.publishedAt ? new Date(data.publishedAt) : undefined,
          metaDescription: data.metaDescription || null,
        },
      });
      return { ok: true, postId: data.id };
    }

    const post = await db.blogPost.create({
      data: {
        title: data.title,
        slug: data.slug,
        excerpt: data.excerpt || null,
        content: data.content,
        coverImage: data.coverImage || null,
        categoryId: data.categoryId || null,
        tags: data.tags,
        status: data.status,
        authorId: session.id,
        publishedAt: data.status === "PUBLISHED" ? new Date() : null,
        metaDescription: data.metaDescription || null,
      },
    });
    return { ok: true, postId: post.id };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function deleteBlogPostAction(postId: string): Promise<Result> {
  await requireStaff();
  await db.blogPost.delete({ where: { id: postId } });
  return { ok: true, postId };
}

// ============================================================
// Blog Category actions
// ============================================================
const SaveCategorySchema = z.object({
  name: z.string().min(1).max(80),
  slug: z.string().min(1).max(80),
  description: z.string().max(500).optional(),
});

export async function saveBlogCategoryAction(input: unknown): Promise<Result> {
  await requireStaff();
  const parsed = SaveCategorySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  try {
    const cat = await db.blogCategory.create({ data: parsed.data });
    return { ok: true, postId: cat.id };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
