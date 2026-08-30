import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

async function performSignOut(request: NextRequest) {
  // CRITICAL FIX: Next.js <Link> automatically prefetches links in the viewport.
  // If this is a prefetch request, DO NOT destroy the user's session!
  const purpose = request.headers.get("purpose") || request.headers.get("sec-purpose") || request.headers.get("x-purpose");
  if (purpose === "prefetch" || purpose === "preview") {
    return new Response(null, { status: 204 });
  }

  const supabase = await createServerClient();
  await supabase.auth.signOut();
  
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();
  allCookies.forEach(c => {
    if (c.name.startsWith("sb-")) {
      cookieStore.set(c.name, "", { maxAge: 0, path: "/" });
    }
  });

  return NextResponse.redirect(new URL("/", request.url || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"));
}

export async function GET(request: NextRequest) {
  return performSignOut(request);
}

export async function POST(request: NextRequest) {
  return performSignOut(request);
}
