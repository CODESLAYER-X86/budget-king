"use client";

import { useEffect, useState } from "react";

type AuthUser = {
  email: string;
  role: string;
  fullName: string | null;
} | null;

/**
 * Client-side auth hook for the navbar.
 * Fetches from our own API to avoid Supabase JS client bugs that aggressively
 * delete auth cookies on mobile browsers (Brave/Chrome on Android).
 */
export function useAuthUser(): AuthUser {
  const [authUser, setAuthUser] = useState<AuthUser>(null);

  useEffect(() => {
    let mounted = true;

    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (mounted && data?.user) {
          setAuthUser(data.user);
        }
      })
      .catch((err) => console.error("Failed to fetch auth user:", err));

    return () => {
      mounted = false;
    };
  }, []);

  return authUser;
}
