import { StoreNavbar } from "@/components/store/navbar";
import { StoreFooter } from "@/components/store/footer";
import { getSession } from "@/lib/auth/session";

export default async function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  const user = session?.profile
    ? { email: session.email, role: session.profile.role }
    : null;

  return (
    <div className="flex min-h-screen flex-col">
      <StoreNavbar user={user} />
      <main className="flex-1">{children}</main>
      <StoreFooter />
    </div>
  );
}
