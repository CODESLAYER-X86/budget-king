import { createClient } from "@supabase/supabase-js";

/**
 * Service-role client — bypasses RLS, full DB access.
 * ONLY use in trusted server-side contexts (server actions, webhooks).
 * NEVER import this in a client component.
 */
export function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { persistSession: false, autoRefreshToken: false },
    }
  );
}
