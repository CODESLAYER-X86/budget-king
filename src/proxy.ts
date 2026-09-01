import { NextResponse, type NextRequest } from "next/server";

/**
 * Next.js Edge Proxy / Middleware
 *
 * Matches the Cyber Club architecture:
 * - NEVER mutates or refreshes Supabase cookies during page or RSC navigation.
 * - Leaves cookies strictly intact to prevent mobile browsers from purging them.
 */
export async function proxy(request: NextRequest) {
  // If Supabase redirects auth code to root '/' instead of '/auth/callback', forward it to callback handler
  const codeParam = request.nextUrl.searchParams.get("code");
  if (request.nextUrl.pathname === "/" && codeParam) {
    const callbackUrl = new URL("/auth/callback", request.url);
    request.nextUrl.searchParams.forEach((val, key) => {
      callbackUrl.searchParams.set(key, val);
    });
    return NextResponse.redirect(callbackUrl);
  }

  const response = NextResponse.next({
    request: { headers: request.headers },
  });

  const refParam = request.nextUrl.searchParams.get("ref");
  if (refParam) {
    response.cookies.set("bk_ref", refParam.toUpperCase().trim(), {
      path: "/",
      maxAge: 30 * 24 * 60 * 60, // 30 days
      httpOnly: false,
      sameSite: "lax",
    });
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|favicon.png|logo.png|icon.png|apple-touch-icon.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|js|map|css|woff|woff2)$).*)",
  ],
};
