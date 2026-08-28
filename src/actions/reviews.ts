"use server";

import { db } from "@/lib/db";
import { z } from "zod";
import { getSession } from "@/lib/auth/session";

const Schema = z.object({
  reviewId: z.string(),
  action: z.enum(["APPROVE", "REJECT"]),
});

type Result = { ok: true } | { ok: false; error: string };

export async function moderateReviewAction(input: unknown): Promise<Result> {
  const session = await getSession();
  if (!session?.profile || !["MODERATOR", "ADMIN"].includes(session.profile.role)) {
    return { ok: false, error: "Unauthorized" };
  }
  const parsed = Schema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const { reviewId, action } = parsed.data;

  const review = await db.review.findUnique({ where: { id: reviewId } });
  if (!review) return { ok: false, error: "Review not found" };

  await db.review.update({
    where: { id: reviewId },
    data: { status: action === "APPROVE" ? "APPROVED" : "REJECTED" },
  });

  await db.auditLog.create({
    data: {
      actorId: session.id,
      actorRole: session.profile.role,
      action: `review.${action.toLowerCase()}`,
      target: `review:${reviewId}`,
    },
  });

  return { ok: true };
}
