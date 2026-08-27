import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser Supabase client — uses anon key, subject to RLS.
 * Safe to import from client components.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
