import { StoreNavbar } from "@/components/store/navbar";
import { StoreFooter } from "@/components/store/footer";
import { createServerClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let user: { email: string; role: string; fullName: string | null } | null = null;

  try {
    const supabase = await createServerClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();

    if (authUser) {
      const profile = await db.profile.findUnique({
        where: { id: authUser.id },
        select: { role: true, fullName: true, email: true },
      }).catch(() => null);

      if (profile) {
        user = {
          email: profile.email,
          role: profile.role,
          fullName: profile.fullName,
        };
      }
    }
  } catch {
    // Non-critical — render as guest
  }

  return (
    <div className="flex min-h-screen flex-col">
      <StoreNavbar user={user} />
      <main className="flex-1">{children}</main>
      <StoreFooter />
    </div>
  );
}
