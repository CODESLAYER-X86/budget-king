"use server";

import { db } from "@/lib/db";
import { z } from "zod";
import { getSession } from "@/lib/auth/session";
import { rateLimit, RATE_LIMITS } from "@/lib/security/rate-limit";
import { headers } from "next/headers";

const CreateSchema = z.object({
  label: z.string().max(50).optional(),
  fullName: z.string().min(2),
  phone: z.string().regex(/^01[0-9]{9}$/),
  division: z.string().min(2),
  district: z.string().min(2),
  area: z.string().optional(),
  addressLine: z.string().min(5),
  isDefault: z.boolean().default(false),
});

const UpdateSchema = z.object({
  id: z.string(),
  isDefault: z.boolean().optional(),
});

type Result = { ok: true; addressId: string } | { ok: false; error: string };

export async function saveAddressAction(input: unknown): Promise<Result> {
  const session = await getSession();
  if (!session?.profile) return { ok: false, error: "Unauthorized" };

  // Rate limit: 20 address saves per user per hour
  const rl = rateLimit({
    key: `address:save:${session.id}`,
    limit: RATE_LIMITS.ADDRESS_SAVE.limit,
    windowMs: RATE_LIMITS.ADDRESS_SAVE.windowMs,
  });
  if (!rl.ok) {
    return { ok: false, error: "Too many address changes. Please try again later." };
  }

  // Update mode?
  const updateParsed = UpdateSchema.safeParse(input);
  if (updateParsed.success && updateParsed.data.isDefault) {
    const { id, isDefault } = updateParsed.data;
    // Verify ownership
    const addr = await db.address.findUnique({ where: { id } });
    if (!addr || addr.userId !== session.id) {
      return { ok: false, error: "Address not found" };
    }
    if (isDefault) {
      await db.$transaction([
        db.address.updateMany({
          where: { userId: session.id, isDefault: true },
          data: { isDefault: false },
        }),
        db.address.update({ where: { id }, data: { isDefault: true } }),
      ]);
    }
    return { ok: true, addressId: id };
  }

  const parsed = CreateSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const data = parsed.data;

  const address = await db.$transaction(async (tx) => {
    if (data.isDefault) {
      await tx.address.updateMany({
        where: { userId: session.id, isDefault: true },
        data: { isDefault: false },
      });
    }
    return tx.address.create({
      data: {
        userId: session.id,
        label: data.label,
        fullName: data.fullName,
        phone: data.phone,
        division: data.division,
        district: data.district,
        area: data.area,
        addressLine: data.addressLine,
        isDefault: data.isDefault,
      },
    });
  });

  return { ok: true, addressId: address.id };
}

export async function deleteAddressAction(addressId: string): Promise<Result> {
  const session = await getSession();
  if (!session?.profile) return { ok: false, error: "Unauthorized" };
  const addr = await db.address.findUnique({ where: { id: addressId } });
  if (!addr || addr.userId !== session.id) {
    return { ok: false, error: "Address not found" };
  }
  await db.address.delete({ where: { id: addressId } });
  return { ok: true, addressId };
}
