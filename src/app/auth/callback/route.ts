import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") ?? "/account";
  const error = requestUrl.searchParams.get("error");
  const errorDescription = requestUrl.searchParams.get("error_description");

  // If Google/Supabase redirected back with an error, redirect to login with the error
  if (error) {
    const loginUrl = new URL("/login", requestUrl.origin);
    loginUrl.searchParams.set("next", next);
    return NextResponse.redirect(loginUrl);
  }

  if (code) {
    try {
      const supabase = await createServerClient();
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
      
      if (exchangeError) {
        console.error("Auth exchange error:", exchangeError.message);
        const loginUrl = new URL("/login", requestUrl.origin);
        loginUrl.searchParams.set("next", next);
        loginUrl.searchParams.set("error", "auth_failed");
        return NextResponse.redirect(loginUrl);
      }
    } catch (e) {
      console.error("Auth callback exception:", (e as Error).message);
      const loginUrl = new URL("/login", requestUrl.origin);
      loginUrl.searchParams.set("next", next);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.redirect(`${requestUrl.origin}${next}`);
}
