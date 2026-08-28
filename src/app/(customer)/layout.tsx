import { StoreNavbar } from "@/components/store/navbar";
import { StoreFooter } from "@/components/store/footer";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db";

export default async function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  const user = session?.profile
    ? { email: session.email, role: session.profile.role }
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

  if (session?.profile) {
    const [notifs, count] = await Promise.all([
      db.notification.findMany({
        where: {
          OR: [
            { userId: session.id },
            { userId: null, roleTarget: session.profile.role },
          ],
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      db.notification.count({
        where: {
          isRead: false,
          OR: [
            { userId: session.id },
            { userId: null, roleTarget: session.profile.role },
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
  }

  return (
    <div className="flex min-h-screen flex-col">
      <StoreNavbar user={user} notifications={notifications} unreadCount={unreadCount} />
      <main className="flex-1">{children}</main>
      <StoreFooter />
    </div>
  );
}
