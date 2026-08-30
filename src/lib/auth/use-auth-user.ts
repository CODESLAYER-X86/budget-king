"use client";

import { useEffect, useState } from "react";

export type AuthUser = {
  email: string;
  role: string;
  fullName: string | null;
} | null;

const STORAGE_KEY = "bk_auth_user";

/**
 * Client-side auth hook for the navbar.
 * Instantly loads user from localStorage to eliminate UI flickers during navigation,
 * then background-verifies with /api/auth/me.
 */
export function useAuthUser(): AuthUser {
  const [authUser, setAuthUser] = useState<AuthUser>(() => {
    if (typeof window === "undefined") return null;
    try {
      const cached = localStorage.getItem(STORAGE_KEY);
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    let mounted = true;

    fetch("/api/auth/me", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        if (!mounted) return;
        if (data?.user) {
          setAuthUser(data.user);
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data.user));
          } catch {}
        } else {
          setAuthUser(null);
          try {
            localStorage.removeItem(STORAGE_KEY);
          } catch {}
        }
      })
      .catch((err) => console.error("Failed to fetch auth user:", err));

    return () => {
      mounted = false;
    };
  }, []);

  return authUser;
}
