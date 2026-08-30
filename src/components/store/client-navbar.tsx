"use client";

import dynamic from "next/dynamic";

// Dynamically import navbar with ssr: false — must be in a client component
const StoreNavbar = dynamic(() => import("@/components/store/navbar").then(m => m.StoreNavbar), {
  ssr: false,
  loading: () => (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur h-16" />
  ),
});

export function ClientNavbar() {
  return <StoreNavbar />;
}
