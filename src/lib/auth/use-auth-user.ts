"use client";

import { createClient } from "@/lib/supabase/browser";
import { useEffect, useState } from "react";
import type { Database } from "@/types/database";

type User = {
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
export function useAuthUser(): User {
  const [user, setUser] = useState<User>(null);
  const supabase = createClient();

  useEffect(() => {
    // Get current session
    supabase.auth.getUser().then(({ data: { user: authUser } }) => {
      if (authUser) {
        setUser({
          email: authUser.email ?? "",
          role: (authUser as any).role ?? "CUSTOMER",
          fullName: (authUser as any).user_metadata?.full_name ??
                   (authUser as any).user_metadata?.name ?? null,
        });
      }
    });

    // Listen for auth state changes (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" || !session?.user) {
        setUser(null);
      } else if (session?.user) {
        setUser({
          email: session.user.email ?? "",
          role: (session.user as any).role ?? "CUSTOMER",
          fullName: (session.user as any).user_metadata?.full_name ??
                   (session.user as any).user_metadata?.name ?? null,
        });
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  return user;
}
