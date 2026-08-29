"use server";

import { db } from "@/lib/db";
import { z } from "zod";
import { getSession } from "@/lib/auth/session";

const CreateSchema = z.object({
  name: z.string().min(1),
  charge: z.string().refine((v) => parseFloat(v) >= 0),
  estimatedDays: z.string().refine((v) => parseInt(v, 10) > 0),
  divisions: z.array(z.string()),
});

const ToggleSchema = z.object({
  id: z.string(),
  isActive: z.boolean(),
});

type Result = { ok: true; zoneId: string } | { ok: false; error: string };

export async function saveDeliveryZoneAction(input: unknown): Promise<Result> {
  const session = await getSession();
  if (!session?.profile || !["ADMIN", "MODERATOR"].includes(session.profile.role)) {
    return { ok: false, error: "Unauthorized" };
  }

  // Try toggle schema first
  const toggleParsed = ToggleSchema.safeParse(input);
  if (toggleParsed.success) {
    const { id, isActive } = toggleParsed.data;
    await db.deliveryZone.update({ where: { id }, data: { isActive } });
    await db.auditLog.create({
      data: {
        actorId: session.id,
        actorRole: session.profile.role,
        action: "delivery_zone.toggle",
        target: `delivery_zone:${id}`,
        details: { isActive } as any,
      },
    });
    return { ok: true, zoneId: id };
  }

  const createParsed = CreateSchema.safeParse(input);
  if (!createParsed.success) {
    return { ok: false, error: createParsed.error.issues[0].message };
  }
  const data = createParsed.data;

  const existing = await db.deliveryZone.findUnique({ where: { name: data.name } });
  if (existing) return { ok: false, error: "Zone name already exists" };

  const zone = await db.deliveryZone.create({
    data: {
      name: data.name,
      charge: parseFloat(data.charge),
      estimatedDays: parseInt(data.estimatedDays, 10),
      divisions: data.divisions,
      isActive: true,
    },
  });

  await db.auditLog.create({
    data: {
      actorId: session.id,
      actorRole: session.profile.role,
      action: "delivery_zone.create",
      target: `delivery_zone:${zone.id}`,
      details: { name: zone.name, charge: Number(zone.charge) } as any,
    },
  });

  return { ok: true, zoneId: zone.id };
}
