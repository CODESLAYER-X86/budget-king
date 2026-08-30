import { StoreNavbar } from "@/components/store/navbar";
import { StoreFooter } from "@/components/store/footer";

// No auth check here — the navbar handles auth client-side
// This allows pages to use ISR caching without caching the user state
export default function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <StoreNavbar />
      <main className="flex-1">{children}</main>
      <StoreFooter />
    </div>
  );
}
