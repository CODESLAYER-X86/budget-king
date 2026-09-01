import { NextResponse, type NextRequest } from "next/server";
import { createServerClient as createSSRClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") ?? "/account";
  const error = requestUrl.searchParams.get("error");
  const errorDescription = requestUrl.searchParams.get("error_description");

  // On Vercel / serverless proxies, request.url may be http internally.
  // Resolve the true public HTTPS origin so iOS Safari doesn't discard Secure cookies.
  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto");
  const origin = forwardedHost
    ? `${forwardedProto ?? (process.env.NODE_ENV === "production" ? "https" : "http")}://${forwardedHost}`
    : (process.env.NODE_ENV === "production"
        ? requestUrl.origin.replace(/^http:/, "https:")
        : requestUrl.origin);

  // If Google/Supabase redirected back with an error, redirect to login with the error
  if (error) {
    const loginUrl = new URL("/login", origin);
    loginUrl.searchParams.set("next", next);
    loginUrl.searchParams.set("error", error);
    if (errorDescription) loginUrl.searchParams.set("error_description", errorDescription);
    return NextResponse.redirect(loginUrl);
  }

  if (!code) {
    const loginUrl = new URL("/login", origin);
    loginUrl.searchParams.set("next", next);
    loginUrl.searchParams.set("error", "no_code");
    return NextResponse.redirect(loginUrl);
  }

  const safeNext = next.startsWith("/") ? next : `/${next}`;
  const successUrl = new URL(safeNext, origin);
  const successResponse = NextResponse.redirect(successUrl);

  const cookieStore = await cookies();

  const supabase = createSSRClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => {
            successResponse.cookies.set(name, value, {
              ...options,
              path: options?.path ?? "/",
              sameSite: options?.sameSite ?? "lax",
              secure: process.env.NODE_ENV === "production",
            });
          });
        },
      },
    }
  );

  try {
    const { data: { session }, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    if (exchangeError || !session?.user) {
      console.error("Auth exchange error:", exchangeError?.message);
      const loginUrl = new URL("/login", origin);
      loginUrl.searchParams.set("next", next);
      loginUrl.searchParams.set("error", "auth_failed");
      return NextResponse.redirect(loginUrl);
    }

    const user = session.user;
    const userEmail = (user.email ?? "").trim().toLowerCase();
    const firstAdminEmail = process.env.FIRST_ADMIN_EMAIL?.trim().toLowerCase();

    // Ensure Profile exists in DB immediately upon OAuth callback
    try {
      const { db } = await import("@/lib/db");
      const existing = await db.profile.findUnique({ where: { id: user.id } });
      if (!existing) {
        let shouldBeAdmin = false;
        try {
          const adminCount = await db.profile.count({ where: { role: "ADMIN" } });
          shouldBeAdmin = !!(firstAdminEmail && userEmail === firstAdminEmail && adminCount === 0);
        } catch {}

        await db.profile.create({
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
      }
    } catch (dbErr) {
      console.error("[OAuth Callback] DB upsert error:", dbErr);
      // Non-fatal: user can still proceed
    }
  } catch (e) {
    console.error("Auth callback exception:", (e as Error).message);
    const loginUrl = new URL("/login", origin);
    loginUrl.searchParams.set("next", next);
    loginUrl.searchParams.set("error", "auth_failed");
    return NextResponse.redirect(loginUrl);
  }

  return successResponse;
}
