import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { NotificationRow } from "@/components/shared/notification-bell";
import { MarkAllReadButton } from "./mark-all-read-button";
import { formatTk } from "@/lib/utils/currency";

export const dynamic = "force-dynamic";

const TYPE_ICONS: Record<string, string> = {
  ORDER_PLACED: "🛒",
  ORDER_CONFIRMED: "✓",
  ORDER_PROCESSING: "⚙️",
  ORDER_SHIPPED: "📦",
  ORDER_DELIVERED: "🏠",
  ORDER_CANCELLED: "❌",
  ORDER_DELIVERY_FAILED: "⚠️",
  COINS_EARNED: "🪙",
  COINS_REVERSED: "↩️",
  VOUCHER_REDEEMED: "🎟️",
  VOUCHER_EXPIRING_SOON: "⏰",
  GROUP_MEMBER_JOINED: "👋",
  GROUP_PRODUCT_SHARED: "👕",
  GROUP_VOTE_RECEIVED: "👍",
  GROUP_ORDER_PLACED: "🛍️",
  STAFF_NEW_ORDER: "🔔",
  STAFF_CANCELLATION_REQUEST: "🚫",
  STAFF_LOW_STOCK: "⚠️",
};

export default async function NotificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const session = await getSession();
  if (!session?.profile) redirect("/login?next=/notifications");

  const { filter } = await searchParams;
  const where =
    filter === "unread"
      ? {
          isRead: false,
          OR: [
            { userId: session.id },
            { userId: null, roleTarget: session.profile.role },
          ],
        }
      : {
          OR: [
            { userId: session.id },
            { userId: null, roleTarget: session.profile.role },
          ],
        };

  const [notifications, unreadCount, totalCount] = await Promise.all([
    db.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
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
    db.notification.count({
      where: {
        OR: [
          { userId: session.id },
          { userId: null, roleTarget: session.profile.role },
        ],
      },
    }),
  ]);

  const serialized: NotificationRow[] = notifications.map((n) => ({
    id: n.id,
    type: n.type,
    title: n.title,
    message: n.message,
    link: n.link,
    isRead: n.isRead,
    createdAt: n.createdAt.toISOString(),
  }));

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
          <p className="text-sm text-muted-foreground">
            {unreadCount} unread of {totalCount} total
          </p>
        </div>
        {unreadCount > 0 && <MarkAllReadButton />}
      </div>

      <div className="mb-4 flex gap-2">
        <Link
          href="/notifications"
          className={`rounded-full border px-3 py-1 text-xs ${
            !filter ? "bg-primary text-primary-foreground" : "hover:bg-accent"
          }`}
        >
          All
        </Link>
        <Link
          href="/notifications?filter=unread"
          className={`rounded-full border px-3 py-1 text-xs ${
            filter === "unread" ? "bg-primary text-primary-foreground" : "hover:bg-accent"
          }`}
        >
          Unread ({unreadCount})
        </Link>
      </div>

      {notifications.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center text-sm text-muted-foreground">
            <span className="text-4xl">🔔</span>
            <p className="mt-3">
              {filter === "unread"
                ? "You're all caught up! No unread notifications."
                : "No notifications yet. Place an order or join a group to start receiving them."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {serialized.map((n) => (
            <NotificationRowItem key={n.id} notification={n} />
          ))}
        </div>
      )}
    </div>
  );
}

function NotificationRowItem({ notification }: { notification: NotificationRow }) {
  return (
    <Card className={notification.isRead ? "" : "border-primary bg-primary/5"}>
      <CardContent className="p-4 flex items-start gap-3">
        <span className="text-xl shrink-0">
          {TYPE_ICONS[notification.type] ?? "🔔"}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-medium text-sm">{notification.title}</p>
            {!notification.isRead && (
              <span className="h-2 w-2 rounded-full bg-primary" />
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">{notification.message}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {new Date(notification.createdAt).toLocaleString("en-BD", {
              day: "numeric", month: "long", year: "numeric",
              hour: "2-digit", minute: "2-digit",
            })}
          </p>
        </div>
        {notification.link && (
          <Link href={notification.link}>
            <Button size="sm" variant="ghost">
              View →
            </Button>
          </Link>
        )}
      </CardContent>
    </Card>
  );
}
