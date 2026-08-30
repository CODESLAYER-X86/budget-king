"use client";

import { createClient } from "@/lib/supabase/browser";
import { useEffect, useState } from "react";

type AuthUser = {
  email: string;
  role: string;
  fullName: string | null;
} | null;

/**
 * Client-side auth hook for the navbar.
 * Checks the Supabase session in the browser — no server-side DB query needed.
 * This allows pages to be cached (ISR) while the navbar still shows
 * the correct logged-in state.
 */
export function useAuthUser(): AuthUser {
  const [authUser, setAuthUser] = useState<AuthUser>(null);

  useEffect(() => {
    const supabase = createClient();

    // Get current session
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setAuthUser({
          email: user.email ?? "",
          role: "CUSTOMER", // Role is fetched from DB, default to CUSTOMER
          fullName: user.user_metadata?.full_name ?? user.user_metadata?.name ?? null,
        });
      }
    });

    // Listen for auth state changes (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" || !session?.user) {
        setAuthUser(null);
      } else if (session?.user) {
        setAuthUser({
          email: session.user.email ?? "",
          role: "CUSTOMER",
          fullName: session.user.user_metadata?.full_name ?? session.user.user_metadata?.name ?? null,
        });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return authUser;
}
