import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Crown, Home, Search } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center gap-2 px-4">
          <Link href="/" className="flex items-center gap-2">
            <Crown className="h-6 w-6 text-primary" />
            <span className="font-bold">Budget King BD</span>
          </Link>
        </div>
      </header>
      <main className="flex flex-1 flex-col items-center justify-center gap-6 px-4 text-center">
        <p className="text-7xl font-bold text-primary">404</p>
        <h1 className="text-2xl font-bold tracking-tight">Page not found</h1>
        <p className="max-w-md text-sm text-muted-foreground">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
          Try searching our shop instead.
        </p>
        <div className="flex gap-3">
          <Link href="/">
            <Button variant="outline">
              <Home className="mr-2 h-4 w-4" /> Go Home
            </Button>
          </Link>
          <Link href="/shop">
            <Button>
              <Search className="mr-2 h-4 w-4" /> Browse Shop
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
