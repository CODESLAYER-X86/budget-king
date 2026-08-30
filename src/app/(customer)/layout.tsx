import { ClientNavbar } from "@/components/store/client-navbar";
import { StoreFooter } from "@/components/store/footer";

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <ClientNavbar />
      <main className="flex-1">{children}</main>
      <StoreFooter />
    </div>
  );
}
