"use client";

import { createClient } from "@/lib/supabase/browser";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useRouter, useSearchParams } from "next/navigation";
import { Crown, Loader2 } from "lucide-react";

export function AuthClient() {
  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/account";
  const errorParam = searchParams.get("error");
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  // Fix iOS Safari bfcache (Back-Forward Cache): If user navigated to Google and pressed Back,
  // reset the loading state so button is not stuck spinning.
  useEffect(() => {
    function handlePageShow(event: PageTransitionEvent) {
      if (event.persisted) {
        setLoading(false);
      }
    }
    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, []);

  // Display error toast if redirected back to /login with an error code
  useEffect(() => {
    if (errorParam) {
      const msg =
        errorParam === "auth_failed"
          ? "Authentication failed. Please try signing in again."
          : errorParam === "no_code"
          ? "No authorization code received from Google."
          : errorParam === "access_denied"
          ? "Google sign-in was cancelled."
          : searchParams.get("error_description") ?? `Sign-in error: ${errorParam}`;
      toast({
        title: "Sign-in problem",
        description: msg,
        variant: "destructive",
      });
    }
  }, [errorParam, searchParams, toast]);

  async function handleGoogle() {
    setLoading(true);
    try {
      const origin = window.location.origin;
      const redirectTo = `${origin}/auth/callback?next=${encodeURIComponent(next)}`;
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
          queryParams: {
            prompt: "select_account",
            access_type: "offline",
          },
        },
      });

      if (error) {
        setLoading(false);
        toast({
          title: "Google sign-in failed",
          description:
            error.message ??
            "Google OAuth may not be configured yet. Enable it in Supabase Dashboard → Authentication → Providers → Google.",
          variant: "destructive",
        });
      } else if (data?.url) {
        window.location.assign(data.url);
      }
    } catch (err) {
      setLoading(false);
      toast({
        title: "Google sign-in error",
        description: (err as Error).message ?? "An unexpected error occurred.",
        variant: "destructive",
      });
    }
  }

  return (
    <div className="space-y-4">
      <Button
        onClick={handleGoogle}
        disabled={loading}
        className="w-full"
        size="lg"
      >
        {loading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
        )}
        Continue with Google
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        <Crown className="inline h-3 w-3 text-primary" /> Customers can shop without an account —
        login only unlocks rewards, groups, and order history.
      </p>
    </div>
  );
}
