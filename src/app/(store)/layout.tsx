import { StoreNavbar } from "@/components/store/navbar";
import { StoreFooter } from "@/components/store/footer";
import { db } from "@/lib/db";
import { createServerClient } from "@/lib/supabase/server";
import { SiteBanner } from "@/components/store/site-banner";

export const dynamic = "force-dynamic";

export default async function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Only fetch user data if there are auth cookies present
  // This prevents unnecessary DB queries on public pages
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  const profile = user
    ? await db.profile.findUnique({
        where: { id: user.id },
        select: { role: true, fullName: true, email: true },
      })
    : null;

  const userObj = user
    ? { email: user.email ?? "", role: profile?.role ?? "CUSTOMER" }
    : null;

  let notifications: Array<{
    id: string;
    type: string;
    title: string;
    message: string;
    link: string | null;
    isRead: boolean;
    createdAt: string;
  }> = [];
  let unreadCount = 0;

  if (user && profile) {
    try {
      const [notifs, count] = await Promise.all([
        db.notification.findMany({
          where: {
            OR: [
              { userId: user.id },
              { userId: null, roleTarget: profile.role },
            ],
          },
          orderBy: { createdAt: "desc" },
          take: 10,
        }),
        db.notification.count({
          where: {
            isRead: false,
            OR: [
              { userId: user.id },
              { userId: null, roleTarget: profile.role },
            ],
          },
        }),
      ]);
      notifications = notifs.map((n) => ({
        id: n.id,
        type: n.type,
        title: n.title,
        message: n.message,
        link: n.link,
        isRead: n.isRead,
        createdAt: n.createdAt.toISOString(),
      }));
      unreadCount = count;
    } catch {
      // Non-critical — don't fail the page if notifications fail
    }
  }

  // Fetch active top banner (cached)
  let topBanner = null;
  try {
    topBanner = await db.banner.findFirst({
      where: {
        isActive: true,
        placement: "top",
        AND: [
          { OR: [{ startsAt: null }, { startsAt: { lte: new Date() } }] },
          { OR: [{ endsAt: null }, { endsAt: { gte: new Date() } }] },
        ],
      },
      orderBy: { createdAt: "desc" },
    });
  } catch {
    // Non-critical
  }

  return (
    <div className="flex min-h-screen flex-col">
      {topBanner && <SiteBanner banner={topBanner} />}
      <StoreNavbar user={userObj} notifications={notifications} unreadCount={unreadCount} />
      <main className="flex-1">{children}</main>
      <StoreFooter />
    </div>
  );
}
