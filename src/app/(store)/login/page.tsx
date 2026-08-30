import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { AuthClient } from "./auth-client";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Sign in — Budget King BD",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const session = await getSession();
  if (session?.profile) redirect(searchParams ? decodeURIComponent((await searchParams).next ?? "/account") : "/account");

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="mx-auto max-w-md">
        <div className="rounded-xl border bg-card p-8 shadow-sm">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Sign in to track orders, earn Budget Coins, and shop with groups.
            </p>
          </div>
          <Suspense fallback={<div className="h-10 w-full animate-pulse rounded-md bg-muted" />}>
            <AuthClient />
          </Suspense>
        </div>
        <p className="mt-4 text-center text-xs text-muted-foreground">
          By signing in, you agree to our{" "}
          <a href="/terms" className="text-primary hover:underline">Terms</a> and{" "}
          <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a>.
        </p>
      </div>
    </div>
  );
}
