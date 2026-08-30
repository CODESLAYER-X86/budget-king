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
        setAll() {
          // Read-only server client — matches Cyber Club pattern.
          // Cookies are managed strictly at login (/auth/callback) and signout (/auth/signout).
        },
      },
    }
  );
}
