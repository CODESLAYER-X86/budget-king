"use server";

import { db } from "@/lib/db";
import { z } from "zod";
import { getSession } from "@/lib/auth/session";
import { createNotification } from "@/lib/notifications";
import type { UserRole } from "@prisma/client";

const UpdateRoleSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(["CUSTOMER", "AGENT", "MODERATOR", "ADMIN"]),
});

const ToggleSuspendSchema = z.object({
  userId: z.string().min(1),
});

type Result = { ok: true } | { ok: false; error: string };

/**
 * Update a user's role. Admin-only.
 *
 * Safeguards:
 * - Cannot change your own role (prevents self-demotion lockout)
 * - Cannot demote the last remaining admin (prevents no-admin lockout)
 * - Notifies the affected user of their new role
 */
export async function updateUserRoleAction(input: unknown): Promise<Result> {
  const session = await getSession();
  if (!session?.profile || session.profile.role !== "ADMIN") {
    return { ok: false, error: "Unauthorized" };
  }

  const parsed = UpdateRoleSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const { userId, role } = parsed.data;

  // Safeguard 1: Cannot change your own role
  if (userId === session.id) {
    return { ok: false, error: "You cannot change your own role" };
  }

  // Fetch the target user
  const target = await db.profile.findUnique({ where: { id: userId } });
  if (!target) return { ok: false, error: "User not found" };

  // Safeguard 2: Cannot demote the last admin
  if (target.role === "ADMIN" && role !== "ADMIN") {
    const adminCount = await db.profile.count({ where: { role: "ADMIN", isSuspended: false } });
    if (adminCount <= 1) {
      return { ok: false, error: "Cannot demote the last remaining admin" };
    }
  }

  const isStaff = role !== "CUSTOMER";

  await db.profile.update({
    where: { id: userId },
    data: { role, isStaff },
  });

  // Audit log
  await db.auditLog.create({
    data: {
      actorId: session.id,
      actorRole: "ADMIN",
      action: "staff.role_change",
      target: `user:${userId}`,
      details: {
        from: target.role,
        to: role,
        userEmail: target.email,
      } as any,
    },
  });

  // Notify the user of their new role
  const roleMessages: Record<UserRole, { title: string; message: string }> = {
    ADMIN: {
      title: "You are now an Admin",
      message: "Your account has been promoted to Admin. You now have full access to the admin dashboard.",
    },
    MODERATOR: {
      title: "You are now a Moderator",
      message: "Your account has been set to Moderator. You can review and moderate group content and reviews.",
    },
    AGENT: {
      title: "You are now an Order Agent",
      message: "Your account has been set to Agent. You can confirm, process, and ship orders.",
    },
    CUSTOMER: {
      title: "Your staff access has been removed",
      message: "Your account has been changed back to a regular Customer. Staff dashboard access has been revoked.",
    },
  };
  const msg = roleMessages[role as UserRole];
  await createNotification({
    userId,
    type: "SYSTEM_ANNOUNCEMENT",
    title: msg.title,
    message: msg.message,
    link: role === "CUSTOMER" ? "/" : `/${role.toLowerCase()}`,
  }).catch(() => {});

  return { ok: true };
}

/**
 * Suspend or unsuspend a user. Admin-only.
 *
 * Safeguards:
 * - Cannot suspend yourself
 * - Cannot suspend the last admin
 */
export async function toggleUserSuspensionAction(input: unknown): Promise<Result> {
  const session = await getSession();
  if (!session?.profile || session.profile.role !== "ADMIN") {
    return { ok: false, error: "Unauthorized" };
  }

  const parsed = ToggleSuspendSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const { userId } = parsed.data;

  // Cannot suspend yourself
  if (userId === session.id) {
    return { ok: false, error: "You cannot suspend your own account" };
  }

  const target = await db.profile.findUnique({ where: { id: userId } });
  if (!target) return { ok: false, error: "User not found" };

  // Cannot suspend the last admin
  if (target.role === "ADMIN" && !target.isSuspended) {
    const adminCount = await db.profile.count({ where: { role: "ADMIN", isSuspended: false } });
    if (adminCount <= 1) {
      return { ok: false, error: "Cannot suspend the last remaining admin" };
    }
  }

  await db.profile.update({
    where: { id: userId },
    data: { isSuspended: !target.isSuspended },
  });

  await db.auditLog.create({
    data: {
      actorId: session.id,
      actorRole: "ADMIN",
      action: target.isSuspended ? "staff.unsuspend" : "staff.suspend",
      target: `user:${userId}`,
      details: { userEmail: target.email } as any,
    },
  });

  return { ok: true };
}
