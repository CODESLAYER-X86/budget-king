import Link from "next/link";
import { ChevronRight } from "lucide-react";

export const metadata = {
  title: "Track Your Order — Budget King BD",
};

export default function TrackOrderPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <nav className="mb-4 flex items-center gap-1 text-xs text-muted-foreground">
        <Link href="/" className="hover:text-primary">Home</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground">Track Order</span>
      </nav>

      <div className="mx-auto max-w-md">
        <h1 className="text-2xl font-bold tracking-tight">Track Your Order</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Enter your order number and phone number to see the latest status.
        </p>

        <form action="/order/" className="mt-6 space-y-4">
          <div>
            <label htmlFor="orderNumber" className="text-sm font-medium">
              Order Number
            </label>
            <input
              id="orderNumber"
              name="orderNumber"
              type="text"
              required
              placeholder="e.g. BK-2026-001024"
              className="mt-1 flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <div>
            <label htmlFor="phone" className="text-sm font-medium">
              Phone Number
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              required
              placeholder="01XXXXXXXXX"
              className="mt-1 flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Use the phone number you placed the order with.
            </p>
          </div>
          <button
            type="submit"
            className="inline-flex h-11 w-full items-center justify-center rounded-md bg-primary px-6 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            Track Order
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Lost your order number?{" "}
          <Link href="/contact" className="text-primary hover:underline">
            Contact support
          </Link>
        </p>
      </div>
    </div>
  );
}
