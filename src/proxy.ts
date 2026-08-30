import { NextResponse, type NextRequest } from "next/server";
import { createServerClient as createSSRClient } from "@supabase/ssr";

/**
 * Refreshes the Supabase auth session on EVERY request.
 *
 * CRITICAL: This must run on ALL routes to keep the auth session alive.
 * Without it, the Supabase access token expires and the user appears
 * logged out when navigating between pages (especially on mobile).
 *
 * SAFETY: If the refresh fails or Supabase tries to clear cookies,
 * we return the ORIGINAL unmodified response so cookies are preserved.
 * The server component will handle auth checks separately.
 */
export async function proxy(request: NextRequest) {
  const response = NextResponse.next({
    request: { headers: request.headers },
  });

  // Skip for static assets
  const path = request.nextUrl.pathname;
  if (
    path.startsWith("/_next/") ||
    path.startsWith("/api/") ||
    path.match(/\.(png|jpg|jpeg|svg|ico|webp|css|js|woff|woff2|map)$/) ||
    path === "/robots.txt" ||
    path === "/sitemap.xml" ||
    path === "/manifest.webmanifest"
  ) {
    return response;
  }

  // Check if there are any Supabase auth cookies
  const allCookies = request.cookies.getAll();
  const hasAuthCookies = allCookies.some((c) => c.name.startsWith("sb-"));

  if (!hasAuthCookies) {
    // Guest — no session to refresh
    return response;
  }

  // We'll build a NEW response only if setAll provides valid refreshed cookies.
  // If Supabase tries to clear cookies (session invalid), we ignore it and
  // return the original response — keeping existing cookies untouched.
  let refreshedResponse: NextResponse | null = null;

  try {
    const supabase = createSSRClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return allCookies;
          },
          setAll(cookiesToSet) {
            // Check if Supabase is trying to SET real tokens or CLEAR them
            const hasRealTokens = cookiesToSet.some(
              (c) =>
                c.name.includes("auth-token") &&
                !c.name.includes("code-verifier") &&
                c.value.length > 10
            );

            if (!hasRealTokens) {
              // Supabase is trying to clear cookies (session invalid/expired).
              // DO NOT apply — keep existing cookies so user isn't force-logged-out.
              return;
            }

            // Real token refresh — apply the new cookies
            cookiesToSet.forEach(({ name, value }) => {
              request.cookies.set(name, value);
            });

            refreshedResponse = NextResponse.next({
              request: { headers: request.headers },
            });

            cookiesToSet.forEach(({ name, value, options }) => {
              refreshedResponse!.cookies.set(name, value, {
                ...options,
                path: "/",
                sameSite: "lax",
                secure: process.env.NODE_ENV === "production",
              });
            });
          },
        },
      }
    );

    // This refreshes the session and may trigger setAll
    await supabase.auth.getUser();
  } catch {
    // If Supabase call fails entirely (network error, etc.),
    // return original response — don't touch cookies
    return response;
  }

  // Return refreshed response if we got real tokens, otherwise original
  return refreshedResponse ?? response;
}

export const config = {
  // Run on ALL routes except static assets
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|favicon.png|logo.png|icon.png|apple-touch-icon.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|js|map|css|woff|woff2)$).*)",
  ],
};
