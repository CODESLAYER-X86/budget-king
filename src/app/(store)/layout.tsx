import dynamic from "next/dynamic";
import { StoreFooter } from "@/components/store/footer";

// Dynamically import navbar with ssr: false to prevent prerendering errors.
// The navbar uses client-side auth (useAuthUser hook + Supabase browser client)
// which cannot run during static generation.
const StoreNavbar = dynamic(() => import("@/components/store/navbar").then(m => m.StoreNavbar), {
  ssr: false,
  loading: () => (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur h-16" />
  ),
});

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
