import { createServerClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import type { Profile, UserRole } from "@prisma/client";
import { redirect } from "next/navigation";

export type SessionUser = {
  id: string;
  email: string;
  profile: Profile | null;
};

/**
 * Returns the authenticated user + their Profile, or null.
 * Use in server components / server actions.
 *
 * FIRST-ADMIN BOOTSTRAP:
 * If the env var FIRST_ADMIN_EMAIL is set and matches the signing-in
 * user's email, they are automatically promoted to ADMIN + isStaff=true.
 * This is the secure way to bootstrap the first admin without SQL access.
 * Once the first admin exists, they can promote other staff via SQL
 * (a future admin UI for staff management can be added later).
 */
export async function getSession(): Promise<SessionUser | null> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Ensure profile row exists (handles Google OAuth first login)
  let profile = await db.profile.findUnique({
    where: { id: user.id },
  });

  if (!profile) {
    // Check if this is the configured first-admin email
    const firstAdminEmail = process.env.FIRST_ADMIN_EMAIL?.trim().toLowerCase();
    const userEmail = (user.email ?? "").trim().toLowerCase();
    const shouldBeAdmin =
      firstAdminEmail &&
      userEmail === firstAdminEmail &&
      // Only auto-promote if no admin exists yet (one-time bootstrap)
      (await db.profile.count({ where: { role: "ADMIN" } })) === 0;

    profile = await db.profile.create({
      data: {
        id: user.id,
        email: user.email ?? "",
        fullName: user.user_metadata?.full_name ?? user.user_metadata?.name ?? null,
        avatarUrl: user.user_metadata?.avatar_url ?? null,
        role: shouldBeAdmin ? "ADMIN" : "CUSTOMER",
        isStaff: shouldBeAdmin,
      },
    });
  } else {
    // Profile already exists (e.g. created by the SQL trigger on signup).
    // Check if they should be promoted to admin (bootstrap scenario).
    const firstAdminEmail = process.env.FIRST_ADMIN_EMAIL?.trim().toLowerCase();
    const userEmail = (user.email ?? "").trim().toLowerCase();
    if (
      firstAdminEmail &&
      userEmail === firstAdminEmail &&
      profile.role !== "ADMIN" &&
      (await db.profile.count({ where: { role: "ADMIN" } })) === 0
    ) {
      profile = await db.profile.update({
        where: { id: profile.id },
        data: { role: "ADMIN", isStaff: true },
      });
    }
  }

  if (profile.isSuspended) {
    // Sign them out — they should not be allowed in
    await supabase.auth.signOut();
    return null;
  }

  return { id: user.id, email: user.email ?? "", profile };
}

/**
 * Require an authenticated user. If none, redirect to /login.
 */
export async function requireSession(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

/**
 * Require a specific role. Otherwise redirect to /unauthorized.
 */
export async function requireRole(...roles: UserRole[]): Promise<SessionUser> {
  const session = await requireSession();
  if (!session.profile) redirect("/unauthorized");
  if (!roles.includes(session.profile.role)) redirect("/unauthorized");
  return session;
}
