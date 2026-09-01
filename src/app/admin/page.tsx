import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { formatTk } from "@/lib/utils/currency";
import { ShoppingCart, Package, Users, TrendingUp, Clock, AlertTriangle, ArrowRight, UserCheck, CheckCircle2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const session = await getSession();
  const isAgent = session?.profile?.role === "AGENT";

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    todayOrderCount,
    pendingCount,
    totalProducts,
    customersCount,
    todayRevenue,
    recentOrders,
    lowStockCount,
    myAssignedOrders,
    myAssignedCount,
    myPendingAssignedCount,
    myDeliveredCount,
  ] = await Promise.all([
    db.order.count({ where: { createdAt: { gte: today } } }).catch(() => 0),
    db.order.count({ where: { status: "PENDING" } }).catch(() => 0),
    db.product.count({ where: { status: { not: "ARCHIVED" } } }).catch(() => 0),
    db.profile.count({ where: { role: "CUSTOMER" } }).catch(() => 0),
    db.order.aggregate({
      where: { createdAt: { gte: today }, status: { not: "CANCELLED" } },
      _sum: { total: true },
    }).catch(() => ({ _sum: { total: 0 } })),
    db.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      select: { id: true, orderNumber: true, customerName: true, customerPhone: true, total: true, status: true, createdAt: true },
    }).catch(() => []),
    db.productVariant.count({ where: { status: "ACTIVE", inventory: { quantity: { lte: 5 } } } }).catch(() => 0),
    session?.id
      ? db.order.findMany({
          where: { agentId: session.id },
          orderBy: { createdAt: "desc" },
          take: 6,
          select: { id: true, orderNumber: true, customerName: true, customerPhone: true, total: true, status: true, createdAt: true },
        }).catch(() => [])
      : Promise.resolve([]),
    session?.id ? db.order.count({ where: { agentId: session.id } }).catch(() => 0) : Promise.resolve(0),
    session?.id
      ? db.order.count({
          where: {
            agentId: session.id,
            status: { in: ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED"] },
          },
        }).catch(() => 0)
      : Promise.resolve(0),
    session?.id
      ? db.order.count({
          where: { agentId: session.id, status: "DELIVERED" },
        }).catch(() => 0)
      : Promise.resolve(0),
  ]);

  const todayRev = Number(todayRevenue._sum.total ?? 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {isAgent ? "Agent Dashboard" : "Dashboard"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {isAgent
            ? "Your assigned order workload and quick action queue."
            : "Overview of your store's performance today."}
        </p>
      </div>

      {isAgent ? (
        /* Agent-specific KPIs */
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">My Assigned Orders</p>
                  <p className="text-2xl font-bold mt-1">{myAssignedCount}</p>
                  <p className="text-xs text-muted-foreground mt-1">{myPendingAssignedCount} in progress</p>
                </div>
                <div className="rounded-lg bg-primary/10 p-2.5">
                  <UserCheck className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">My Delivered Orders</p>
                  <p className="text-2xl font-bold mt-1">{myDeliveredCount}</p>
                  <p className="text-xs text-muted-foreground mt-1">Successfully fulfilled</p>
                </div>
                <div className="rounded-lg bg-green-500/10 p-2.5">
                  <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Awaiting Confirmation</p>
                  <p className="text-2xl font-bold mt-1">{pendingCount}</p>
                  <p className="text-xs text-muted-foreground mt-1">Ready to claim</p>
                </div>
                <div className="rounded-lg bg-amber-500/10 p-2.5">
                  <Clock className="h-5 w-5 text-amber-500" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Active Products</p>
                  <p className="text-2xl font-bold mt-1">{totalProducts}</p>
                </div>
                <div className="rounded-lg bg-primary/10 p-2.5">
                  <Package className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        /* Admin KPIs */
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Today&apos;s Revenue</p>
                  <p className="text-2xl font-bold mt-1">{formatTk(todayRev)}</p>
                </div>
                <div className="rounded-lg bg-primary/10 p-2.5">
                  <TrendingUp className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Today&apos;s Orders</p>
                  <p className="text-2xl font-bold mt-1">{todayOrderCount}</p>
                  <p className="text-xs text-muted-foreground mt-1">{pendingCount} pending</p>
                </div>
                <div className="rounded-lg bg-primary/10 p-2.5">
                  <ShoppingCart className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Active Products</p>
                  <p className="text-2xl font-bold mt-1">{totalProducts}</p>
                </div>
                <div className="rounded-lg bg-primary/10 p-2.5">
                  <Package className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Customers</p>
                  <p className="text-2xl font-bold mt-1">{customersCount}</p>
                </div>
                <div className="rounded-lg bg-primary/10 p-2.5">
                  <Users className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* If Agent: Show My Assigned Orders */}
        {isAgent ? (
          <Card className="border-primary/40">
            <CardHeader>
              <CardTitle className="text-base flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-primary" />
                  My Assigned Orders ({myAssignedCount})
                </span>
                <Link
                  href="/admin/orders"
                  className="text-xs text-muted-foreground hover:text-primary inline-flex items-center"
                >
                  View all <ArrowRight className="ml-1 h-3 w-3" />
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {myAssignedOrders.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  No orders assigned to you yet. You can confirm pending orders below to claim them!
                </p>
              ) : (
                myAssignedOrders.map((o) => (
                  <Link
                    key={o.id}
                    href={`/admin/orders/${o.id}`}
                    className="block rounded-md border p-3 hover:bg-accent transition-colors"
                  >
                    <div className="flex items-center justify-between text-sm">
                      <div>
                        <p className="font-semibold text-primary">#{o.orderNumber}</p>
                        <p className="text-xs text-muted-foreground">
                          {o.customerName} • {o.customerPhone}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{formatTk(o.total)}</p>
                        <Badge variant="secondary" className="text-xs">
                          {o.status.replace(/_/g, " ")}
                        </Badge>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                Requires Attention
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link
                href="/admin/orders?status=PENDING"
                className="flex items-center justify-between rounded-md border p-3 hover:bg-accent"
              >
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-amber-500" />
                  Orders pending confirmation
                </div>
                <Badge variant="secondary">{pendingCount}</Badge>
              </Link>
              <Link
                href="/admin/inventory?filter=low"
                className="flex items-center justify-between rounded-md border p-3 hover:bg-accent"
              >
                <div className="flex items-center gap-2 text-sm">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  Low stock variants (≤ 5)
                </div>
                <Badge variant="secondary">{lowStockCount}</Badge>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Second Column */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              <span>{isAgent ? "Orders Awaiting Confirmation" : "Recent Orders"}</span>
              <Link
                href="/admin/orders"
                className="text-xs text-muted-foreground hover:text-primary inline-flex items-center"
              >
                View all <ArrowRight className="ml-1 h-3 w-3" />
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentOrders.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No orders yet.</p>
            ) : (
              recentOrders.map((o) => (
                <Link
                  key={o.id}
                  href={`/admin/orders/${o.id}`}
                  className="block rounded-md border p-3 hover:bg-accent transition-colors"
                >
                  <div className="flex items-center justify-between text-sm">
                    <div>
                      <p className="font-medium">#{o.orderNumber}</p>
                      <p className="text-xs text-muted-foreground">
                        {o.customerName} • {o.customerPhone}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatTk(o.total)}</p>
                      <Badge variant="secondary" className="text-xs">
                        {o.status.replace(/_/g, " ")}
                      </Badge>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
