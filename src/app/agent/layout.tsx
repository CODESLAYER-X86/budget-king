import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { AdminSidebar } from "@/components/management/admin-sidebar";
import { AdminTopbar } from "@/components/management/admin-topbar";

export const dynamic = "force-dynamic";

export default async function AgentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireRole("AGENT", "ADMIN");

  const [notifs, count] = await Promise.all([
    db.notification.findMany({
      where: {
        OR: [
          { userId: session.id },
          { userId: null, roleTarget: session.profile!.role },
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
          { userId: null, roleTarget: session.profile!.role },
        ],
      },
    }),
  ]);
  const notifications = notifs.map((n) => ({
    id: n.id,
    type: n.type,
    title: n.title,
    message: n.message,
    link: n.link,
    isRead: n.isRead,
    createdAt: n.createdAt.toISOString(),
  }));

  return (
    <div className="flex min-h-screen bg-secondary/30">
      <AdminSidebar role={session.profile!.role} />
      <div className="flex flex-1 flex-col lg:pl-64">
        <AdminTopbar user={session} notifications={notifications} unreadCount={count} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
