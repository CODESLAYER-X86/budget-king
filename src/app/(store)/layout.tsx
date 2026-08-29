import { StoreNavbar } from "@/components/store/navbar";
import { StoreFooter } from "@/components/store/footer";
import { createServerClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";

// This layout MUST be dynamic because it checks the user's auth session.
export const dynamic = "force-dynamic";

export default async function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let user: { email: string; role: string; fullName: string | null } | null = null;

  try {
    const supabase = await createServerClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();

    if (authUser) {
      // Fetch ONLY the profile (1 query) — no notifications/banners in layout
      const profile = await db.profile.findUnique({
        where: { id: authUser.id },
        select: { role: true, fullName: true, email: true },
      });

      if (profile) {
        user = {
          email: profile.email,
          role: profile.role,
          fullName: profile.fullName,
        };
      } else {
        // Profile doesn't exist yet — create it (first login)
        const firstAdminEmail = process.env.FIRST_ADMIN_EMAIL?.trim().toLowerCase();
        const userEmail = (authUser.email ?? "").trim().toLowerCase();
        const adminCount = await db.profile.count({ where: { role: "ADMIN" } });
        const shouldBeAdmin =
          firstAdminEmail && userEmail === firstAdminEmail && adminCount === 0;

        const newProfile = await db.profile.create({
          data: {
            id: authUser.id,
            email: authUser.email ?? "",
            fullName: authUser.user_metadata?.full_name ?? authUser.user_metadata?.name ?? null,
            avatarUrl: authUser.user_metadata?.avatar_url ?? null,
            role: shouldBeAdmin ? "ADMIN" : "CUSTOMER",
            isStaff: shouldBeAdmin,
            isSupremeAdmin: shouldBeAdmin,
          },
        }).catch(async () => {
          // Race condition: trigger created it. Fetch instead.
          return db.profile.findUnique({ where: { id: authUser.id } });
        });

        if (newProfile) {
          user = {
            email: newProfile.email,
            role: newProfile.role,
            fullName: newProfile.fullName,
          };
        }
      }
    }
  } catch {
    // If auth/DB fails (e.g., connection pool exhausted), render as guest
    // This prevents a 500 crash — user sees the site as a guest
  }

  return (
    <div className="flex min-h-screen flex-col">
      <StoreNavbar user={user} />
      <main className="flex-1">{children}</main>
      <StoreFooter />
    </div>
  );
}
