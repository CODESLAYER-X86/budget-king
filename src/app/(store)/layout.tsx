import { StoreNavbar } from "@/components/store/navbar";
import { StoreFooter } from "@/components/store/footer";

// NO database queries in the layout — this makes ALL public pages fast
// User notifications are fetched client-side only when logged in
export default function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <StoreNavbar user={null} />
      <main className="flex-1">{children}</main>
      <StoreFooter />
    </div>
  );
}
