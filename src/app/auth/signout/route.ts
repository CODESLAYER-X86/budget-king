import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

export async function GET() {
  const supabase = await createServerClient();
  await supabase.auth.signOut();
  
  // Explicitly clear cookies because we blocked automatic clearing in server.ts
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();
  allCookies.forEach(c => {
    if (c.name.startsWith("sb-")) {
      cookieStore.set(c.name, "", { maxAge: 0, path: "/" });
    }
  });

  return NextResponse.redirect(new URL("/", process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"));
}
