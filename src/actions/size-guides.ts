"use server";

import { db } from "@/lib/db";
import { z } from "zod";
import { getSession } from "@/lib/auth/session";

const SaveSchema = z.object({
  categoryId: z.string(),
  title: z.string().min(1),
  rows: z.array(z.record(z.string())),
  notes: z.string().optional(),
});

type Result = { ok: true; id: string } | { ok: false; error: string };

async function requireAdmin() {
  const session = await getSession();
  if (!session?.profile || session.profile.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }
  return session;
}

export async function saveSizeGuideAction(input: unknown): Promise<Result> {
  await requireAdmin();
  const parsed = SaveSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const { categoryId, title, rows, notes } = parsed.data;

  const guide = await db.sizeGuide.upsert({
    where: { categoryId },
    create: { categoryId, title, rows, notes: notes || null },
    update: { title, rows, notes: notes || null },
  });
  return { ok: true, id: guide.id };
}

export async function getSizeGuideForCategory(categoryId: string) {
  return db.sizeGuide.findUnique({ where: { categoryId } });
}
