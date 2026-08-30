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
 * Protected against DB connection errors (Supabase free tier).
 */
export async function getSession(): Promise<SessionUser | null> {
  try {
    const supabase = await createServerClient();
    
    // 1. Fast, reliable local cryptographic JWT validation from cookies
    const { data: { session } } = await supabase.auth.getSession();
    let user = session?.user;

    // 2. Fallback to network getUser() if local session was not parsed
    if (!user) {
      const { data: { user: fetchedUser } } = await supabase.auth.getUser();
      user = fetchedUser ?? undefined;
    }

    if (!user) return null;

    // Fetch profile with error handling
    let profile: Profile | null = null;
    try {
      profile = await db.profile.findUnique({
        where: { id: user.id },
      });
    } catch (dbError) {
      // If DB fails (pool exhausted), try ONE more time after a short delay
      const msg = (dbError as Error).message;
      if (msg.includes("EMAXCONNSESSION") || msg.includes("FATAL") || msg.includes("connection")) {
        console.error("DB connection error in getSession, retrying...");
        // Wait 500ms and try once more
        await new Promise((resolve) => setTimeout(resolve, 500));
        try {
          profile = await db.profile.findUnique({
            where: { id: user.id },
          });
        } catch (retryError) {
          console.error("DB retry also failed:", (retryError as Error).message);
          // Return null — user will be treated as not logged in
          // They can refresh to try again
          return null;
        }
      } else {
        throw dbError;
      }
    }

    if (!profile) {
      // Profile doesn't exist yet — create it (first login only)
      const firstAdminEmail = process.env.FIRST_ADMIN_EMAIL?.trim().toLowerCase();
      const userEmail = (user.email ?? "").trim().toLowerCase();
      let shouldBeAdmin = false;
      
      try {
        const adminCount = await db.profile.count({ where: { role: "ADMIN" } });
        shouldBeAdmin = Boolean(
          firstAdminEmail &&
          userEmail === firstAdminEmail &&
          adminCount === 0
        );
      } catch {
        // If count fails, just create as CUSTOMER
      }

      try {
        const newProfile = await db.profile.create({
          data: {
            id: user.id,
            email: user.email ?? "",
            fullName: user.user_metadata?.full_name ?? user.user_metadata?.name ?? null,
            avatarUrl: user.user_metadata?.avatar_url ?? null,
            role: shouldBeAdmin ? "ADMIN" : "CUSTOMER",
            isStaff: shouldBeAdmin,
            isSupremeAdmin: shouldBeAdmin,
          },
        });
        return { id: user.id, email: user.email ?? "", profile: newProfile };
      } catch {
        // Race condition — profile was created by DB trigger in parallel
        try {
          const retryProfile = await db.profile.findUnique({ where: { id: user.id } });
          if (retryProfile) {
            return { id: user.id, email: user.email ?? "", profile: retryProfile };
          }
        } catch {
          // DB still failing
        }
        return null;
      }
    }

    if (profile.isSuspended) {
      await supabase.auth.signOut();
      return null;
    }

    return { id: user.id, email: user.email ?? "", profile };
  } catch (error) {
    console.error("getSession error:", (error as Error).message);
    return null;
  }
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
