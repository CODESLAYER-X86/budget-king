import { NextResponse, type NextRequest } from "next/server";
import { createServerClient as createSSRClient } from "@supabase/ssr";

/**
 * Refreshes Supabase auth session on every request.
 *
 * PERFORMANCE: Only runs on routes that need auth — skips all
 * static assets, images, and API routes to minimize overhead.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

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

  // Refresh session — non-blocking, doesn't throw on failure
  await supabase.auth.getUser();

  return response;
}

export const config = {
  // Skip ALL static files, images, favicon, and API routes for performance
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|favicon.png|logo.png|icon.png|apple-touch-icon.png|manifest.webmanifest|robots.txt|sitemap.xml|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|js|map|css|woff|woff2)$).*)",
  ],
};
