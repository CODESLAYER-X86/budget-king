import { NextResponse, type NextRequest } from "next/server";
import { createServerClient as createSSRClient } from "@supabase/ssr";

/**
 * Refreshes the Supabase auth session on EVERY request.
 *
 * CRITICAL: This must run on ALL routes, not just protected ones.
 * Without session refresh, the Supabase auth cookie expires and
 * the user appears logged out when navigating between pages.
 *
 * Performance: This adds ~50ms (Supabase Auth getUser call) but
 * prevents the "auto logout" bug. The session refresh only runs
 * if there are auth cookies present — guests skip it.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  // Skip session refresh for static assets — no auth cookies there anyway
  const path = request.nextUrl.pathname;
  if (
    path.startsWith("/_next/") ||
    path.startsWith("/api/") ||
    path.includes(".png") ||
    path.includes(".jpg") ||
    path.includes(".svg") ||
    path.includes(".ico") ||
    path.includes(".css") ||
    path.includes(".js") ||
    path.includes(".webp") ||
    path.includes("robots.txt") ||
    path.includes("sitemap.xml") ||
    path.includes("manifest.webmanifest")
  ) {
    return response;
  }

  // Check if there are any Supabase auth cookies
  const hasAuthCookies = request.cookies
    .getAll()
    .some((c) => c.name.startsWith("sb-"));

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
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // This refreshes the session and sets updated cookies
  await supabase.auth.getUser();

  return response;
}

export const config = {
  // Run on ALL routes except static assets
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|favicon.png|logo.png|icon.png|apple-touch-icon.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|js|map|css|woff|woff2)$).*)",
  ],
};
