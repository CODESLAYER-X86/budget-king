import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ShieldAlert } from "lucide-react";

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <ShieldAlert className="h-16 w-16 text-destructive" />
      <h1 className="text-3xl font-bold">Access Denied</h1>
      <p className="text-sm text-muted-foreground max-w-md">
        You don&apos;t have permission to access this page. If you believe this is an error,
        please contact an administrator.
      </p>
      <div className="flex gap-3">
        <Link href="/">
          <Button variant="outline">Back to Home</Button>
        </Link>
        <Link href="/login">
          <Button>Sign in</Button>
        </Link>
      </div>
    </div>
  );
}
