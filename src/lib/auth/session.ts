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
    profile = await db.profile.create({
      data: {
        id: user.id,
        email: user.email ?? "",
        fullName: user.user_metadata?.full_name ?? user.user_metadata?.name ?? null,
        avatarUrl: user.user_metadata?.avatar_url ?? null,
        role: "CUSTOMER",
      },
    });
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
