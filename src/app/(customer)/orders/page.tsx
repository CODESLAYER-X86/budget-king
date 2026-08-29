import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { safeQuery } from "@/lib/safe-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { formatTk } from "@/lib/utils/currency";
import { ChevronRight } from "lucide-react";

export const dynamic = "force-dynamic";

const STATUS_BADGES: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  PENDING: "secondary",
  CONFIRMED: "default",
  PROCESSING: "default",
  SHIPPED: "default",
  DELIVERED: "default",
  CANCELLED: "destructive",
  DELIVERY_FAILED: "destructive",
};

export default async function MyOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const session = await getSession();
  if (!session?.profile) redirect("/login?next=/orders");

  const { status } = await searchParams;
  const where = status && status !== "ALL"
    ? { userId: session.id, status: status as any }
    : { userId: session.id };

  const [orders, statusCounts] = await Promise.all([
    safeQuery(
      () => db.order.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: 50,
        include: { items: { take: 1 } },
      }),
      []
    ),
    safeQuery(
      () => db.order.groupBy({
        by: ["status"],
        where: { userId: session.id },
        _count: { _all: true },
      }),
      []
    ),
  ]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">My Orders</h1>
        <p className="text-sm text-muted-foreground">
          {orders.length} order{orders.length === 1 ? "" : "s"}
        </p>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        <Link
          href="/orders"
          className={`rounded-full border px-3 py-1 text-xs ${!status ? "bg-primary text-primary-foreground" : "hover:bg-accent"}`}
        >
          All
        </Link>
        {statusCounts.map((sc) => (
          <Link
            key={sc.status}
            href={`/orders?status=${sc.status}`}
            className={`rounded-full border px-3 py-1 text-xs ${status === sc.status ? "bg-primary text-primary-foreground" : "hover:bg-accent"}`}
          >
            {sc.status.replace(/_/g, " ")} ({sc._count._all})
          </Link>
        ))}
      </div>

      {orders.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">You haven&apos;t placed any orders yet.</p>
            <Link href="/shop">
              <Button className="mt-4">Start Shopping</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => (
            <Link
              key={o.id}
              href={`/order/${o.orderNumber}`}
              className="block rounded-lg border bg-card p-4 hover:bg-accent transition-colors"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">#{o.orderNumber}</span>
                    <Badge variant={STATUS_BADGES[o.status] ?? "secondary"} className="text-xs">
                      {o.status.replace(/_/g, " ")}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {new Date(o.createdAt).toLocaleDateString("en-BD", {
                      day: "numeric", month: "long", year: "numeric",
                      hour: "2-digit", minute: "2-digit",
                    })}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {o.items.length} item{o.items.length === 1 ? "" : "s"}
                    {o.items[0]?.productName ? ` • ${o.items[0].productName}` : ""}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{formatTk(o.total)}</p>
                  <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
