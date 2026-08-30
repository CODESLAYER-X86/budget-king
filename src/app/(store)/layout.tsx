import { ClientNavbar } from "@/components/store/client-navbar";
import { StoreFooter } from "@/components/store/footer";
import { MobileBottomNav } from "@/components/store/mobile-bottom-nav";

export default function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <ClientNavbar />
      <main className="flex-1 pb-20 md:pb-0">{children}</main>
      <StoreFooter />
      <MobileBottomNav />
    </div>
  );
}
