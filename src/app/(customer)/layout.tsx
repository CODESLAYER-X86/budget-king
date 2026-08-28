import { StoreNavbar } from "@/components/store/navbar";
import { StoreFooter } from "@/components/store/footer";

// NO database queries in the layout — customer pages fetch their own data
export default function CustomerLayout({
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
