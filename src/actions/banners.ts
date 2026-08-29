"use server";

import { db } from "@/lib/db";
import { z } from "zod";
import { getSession } from "@/lib/auth/session";

const SaveBannerSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1).max(100),
  message: z.string().min(1).max(300),
  ctaText: z.string().max(50).optional(),
  ctaLink: z.string().max(200).optional(),
  bgColor: z.string().default("#d4a017"),
  textColor: z.string().default("#ffffff"),
  placement: z.enum(["top", "below_hero", "footer"]).default("top"),
  startsAt: z.string().optional(),
  endsAt: z.string().optional(),
  isActive: z.boolean().default(true),
});

type Result = { ok: true; id: string } | { ok: false; error: string };

async function requireAdmin() {
  const session = await getSession();
  if (!session?.profile || session.profile.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }
}

export async function saveBannerAction(input: unknown): Promise<Result> {
  await requireAdmin();
  const parsed = SaveBannerSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const data = parsed.data;

  try {
    if (data.id) {
      await db.banner.update({
        where: { id: data.id },
        data: {
          title: data.title,
          message: data.message,
          ctaText: data.ctaText || null,
          ctaLink: data.ctaLink || null,
          bgColor: data.bgColor,
          textColor: data.textColor,
          placement: data.placement,
          startsAt: data.startsAt ? new Date(data.startsAt) : null,
          endsAt: data.endsAt ? new Date(data.endsAt) : null,
          isActive: data.isActive,
        },
      });
      return { ok: true, id: data.id };
    }
    const banner = await db.banner.create({
      data: {
        title: data.title,
        message: data.message,
        ctaText: data.ctaText || null,
        ctaLink: data.ctaLink || null,
        bgColor: data.bgColor,
        textColor: data.textColor,
        placement: data.placement,
        startsAt: data.startsAt ? new Date(data.startsAt) : null,
        endsAt: data.endsAt ? new Date(data.endsAt) : null,
        isActive: data.isActive,
      },
    });
    return { ok: true, id: banner.id };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function deleteBannerAction(id: string): Promise<Result> {
  await requireAdmin();
  await db.banner.delete({ where: { id } });
  return { ok: true, id };
}
