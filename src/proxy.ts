import { NextResponse, type NextRequest } from "next/server";
import { createServerClient as createSSRClient } from "@supabase/ssr";

/**
 * ONLY runs on auth-protected routes — NOT on public pages.
 * This prevents an extra Supabase round-trip on every product/shop/blog load.
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

  // Refresh session — non-blocking
  await supabase.auth.getUser();

  return response;
}

export const config = {
  // ONLY run middleware on protected routes — skip ALL public pages
  // This eliminates the Supabase auth round-trip on homepage, shop, product, blog, etc.
  matcher: [
    "/admin/:path*",
    "/agent/:path*",
    "/moderator/:path*",
    "/account/:path*",
    "/account",
    "/checkout/:path*",
    "/checkout",
    "/orders/:path*",
    "/orders",
    "/rewards/:path*",
    "/rewards",
    "/addresses/:path*",
    "/addresses",
    "/groups/:path*",
    "/groups",
    "/notifications/:path*",
    "/notifications",
    "/referrals/:path*",
    "/referrals",
  ],
};
