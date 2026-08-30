import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";

/**
 * Diagnostic endpoint — visit /api/debug-auth on mobile to see
 * exactly what's happening with your auth session.
 *
 * DELETE THIS ROUTE before going to production!
 */
export async function GET() {
  const debug: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    nodeEnv: process.env.NODE_ENV,
  };

  try {
    // 1. Check Supabase session
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    debug.supabaseAuth = {
      hasUser: !!user,
      userId: user?.id ?? null,
      email: user?.email ?? null,
      error: authError?.message ?? null,
    };

    // 2. Check profile in DB
    if (user) {
      try {
        const profile = await db.profile.findUnique({
          where: { id: user.id },
          select: { id: true, email: true, role: true, isSuspended: true },
        });
        debug.profile = profile
          ? { found: true, role: profile.role, isSuspended: profile.isSuspended }
          : { found: false };
      } catch (dbErr) {
        debug.profile = { error: (dbErr as Error).message };
      }
    }

    // 3. Check what cookies the server sees
    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();
    const supabaseCookies = allCookies.filter((c) => c.name.startsWith("sb-"));
    debug.cookies = {
      totalCount: allCookies.length,
      supabaseCookieNames: supabaseCookies.map((c) => c.name),
      supabaseCookieCount: supabaseCookies.length,
      // Show first 20 chars of each value to verify they're not empty
      supabaseCookiePreviews: supabaseCookies.map((c) => ({
        name: c.name,
        valueLength: c.value.length,
        preview: c.value.substring(0, 20) + "...",
      })),
    };
  } catch (err) {
    debug.fatalError = (err as Error).message;
  }

  return NextResponse.json(debug, {
    headers: { "Cache-Control": "no-store" },
  });
}
