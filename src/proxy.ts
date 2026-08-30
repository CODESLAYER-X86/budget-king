import { NextResponse, type NextRequest } from "next/server";

/**
 * Next.js Edge Proxy / Middleware
 *
 * Matches the Cyber Club architecture:
 * - NEVER mutates or refreshes Supabase cookies during page or RSC navigation.
 * - Leaves cookies strictly intact to prevent mobile browsers from purging them.
 */
export async function proxy(request: NextRequest) {
  return NextResponse.next({
    request: { headers: request.headers },
  });
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|favicon.png|logo.png|icon.png|apple-touch-icon.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|js|map|css|woff|woff2)$).*)",
  ],
};
