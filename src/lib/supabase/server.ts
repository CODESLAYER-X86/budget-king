import { createServerClient as createSSRClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Server Supabase client — uses anon key but with the user's cookies,
 * so RLS applies based on the authenticated user.
 *
 * In Next.js 16, cookies() returns a Promise that must be awaited.
 */
export async function createServerClient() {
  const cookieStore = await cookies();
  return createSSRClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            // Detect if Supabase is attempting a FULL session wipe (e.g. spurious network error)
            const authCookies = cookiesToSet.filter(c => c.name.includes("auth-token"));
            const isFullClear = 
              authCookies.length > 0 && 
              authCookies.every(c => !c.value || c.options?.maxAge === 0);

            if (isFullClear) {
              console.warn("Blocked Supabase from automatically wiping the session cookies.");
              return;
            }

            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, {
                ...options,
                path: "/",
                sameSite: "lax",
                secure: process.env.NODE_ENV === "production",
              })
            );
          } catch {
            // called from a Server Component — safe to ignore
          }
        },
      },
    }
  );
}
