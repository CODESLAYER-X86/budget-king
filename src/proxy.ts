import { NextResponse, type NextRequest } from "next/server";
import { createServerClient as createSSRClient } from "@supabase/ssr";

/**
 * Refreshes the Supabase auth session on EVERY request.
 *
 * CRITICAL: This must run on ALL routes to keep the auth session alive.
 * Without it, the Supabase access token expires and the user appears
 * logged out when navigating between pages (especially on mobile).
 *
 * Performance: Skips Supabase call entirely if no auth cookies present.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({
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

  // Refresh the Supabase auth session
  const supabase = createSSRClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return allCookies;
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            // Ensure cookies are set with proper options for mobile browsers
            request.cookies.set(name, value);
            response = NextResponse.next({
              request: { headers: request.headers },
            });
            // Set cookie with same options as Supabase provides + ensure path and sameSite
            response.cookies.set(name, value, {
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

  // This refreshes the session and sets updated cookies on the response
  await supabase.auth.getUser();

  return response;
}

export const config = {
  // Run on ALL routes except static assets
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|favicon.png|logo.png|icon.png|apple-touch-icon.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|js|map|css|woff|woff2)$).*)",
  ],
};
