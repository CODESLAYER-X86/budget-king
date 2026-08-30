import { NextResponse, type NextRequest } from "next/server";
import { createServerClient as createSSRClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") ?? "/account";
  const error = requestUrl.searchParams.get("error");

  // If Google/Supabase redirected back with an error, redirect to login with the error
  if (error) {
    const loginUrl = new URL("/login", requestUrl.origin);
    loginUrl.searchParams.set("next", next);
    return NextResponse.redirect(loginUrl);
  }

  if (!code) {
    return NextResponse.redirect(`${requestUrl.origin}/login?error=no_code`);
  }

  const cookieStore = await cookies();
  const successResponse = NextResponse.redirect(`${requestUrl.origin}${next}`);

  const supabase = createSSRClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) =>
            successResponse.cookies.set(name, value, {
              ...options,
              path: "/",
              sameSite: "lax",
              secure: process.env.NODE_ENV === "production",
            })
          );
        },
      },
    }
  );

  try {
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

  return successResponse;
}
