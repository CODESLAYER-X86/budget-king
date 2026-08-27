import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { formatTk } from "@/lib/utils/currency";
import {
  ShoppingCart,
  Package,
  Users,
  TrendingUp,
  Clock,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const [
    todayOrders,
    pendingOrders,
    totalProducts,
    activeVariants,
    customersCount,
    todayRevenue,
    yesterdayRevenue,
    lowStockVariants,
    recentOrders,
  ] = await Promise.all([
    db.order.count({ where: { createdAt: { gte: today } } }),
    db.order.count({ where: { status: "PENDING" } }),
    db.product.count({ where: { status: { not: "ARCHIVED" } } }),
    db.productVariant.count({ where: { status: "ACTIVE" } }),
    db.profile.count({ where: { role: "CUSTOMER" } }),
    db.order.aggregate({
      where: { createdAt: { gte: today }, status: { not: "CANCELLED" } },
      _sum: { total: true },
    }),
    db.order.aggregate({
      where: {
        createdAt: { gte: yesterday, lt: today },
        status: { not: "CANCELLED" },
      },
      _sum: { total: true },
    }),
    db.productVariant.findMany({
      where: { status: "ACTIVE", inventory: { quantity: { lte: 5 } } },
      include: { product: { select: { name: true, slug: true } }, inventory: true },
      take: 10,
    }),
    db.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { items: { take: 1 } },
    }),
  ]);

  const todayRev = Number(todayRevenue._sum.total ?? 0);
  const yesterdayRev = Number(yesterdayRevenue._sum.total ?? 0);
  const revenueChange = yesterdayRev > 0
    ? Math.round(((todayRev - yesterdayRev) / yesterdayRev) * 100)
    : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Overview of your store&apos;s performance today.
        </p>
      </div>

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Today&apos;s Revenue</p>
                <p className="text-2xl font-bold mt-1">{formatTk(todayRev)}</p>
                {revenueChange != null && (
                  <p className={`text-xs mt-1 ${revenueChange >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {revenueChange >= 0 ? "↑" : "↓"} {Math.abs(revenueChange)}% vs yesterday
                  </p>
                )}
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
                <p className="text-2xl font-bold mt-1">{todayOrders}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {pendingOrders} pending action
                </p>
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
                <p className="text-xs text-muted-foreground mt-1">{activeVariants} variants</p>
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
                <p className="text-xs text-muted-foreground mt-1">registered</p>
              </div>
              <div className="rounded-lg bg-primary/10 p-2.5">
                <Users className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Requires Attention */}
      <div className="grid gap-6 lg:grid-cols-2">
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
              <Badge variant="secondary">{pendingOrders}</Badge>
            </Link>
            <Link
              href="/admin/inventory?filter=low"
              className="flex items-center justify-between rounded-md border p-3 hover:bg-accent"
            >
              <div className="flex items-center gap-2 text-sm">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                Low stock variants (≤ 5)
              </div>
              <Badge variant="secondary">{lowStockVariants.length}</Badge>
            </Link>
          </CardContent>
        </Card>

        {/* Recent Orders */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              Recent Orders
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
              <p className="text-sm text-muted-foreground text-center py-6">
                No orders yet.
              </p>
            ) : (
              recentOrders.map((o) => (
                <Link
                  key={o.id}
                  href={`/admin/orders/${o.id}`}
                  className="block rounded-md border p-3 hover:bg-accent"
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

      {/* Low Stock */}
      {lowStockVariants.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Low Stock Variants</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 sm:grid-cols-2">
              {lowStockVariants.map((v) => (
                <Link
                  key={v.id}
                  href={`/admin/products/${v.productId}`}
                  className="flex items-center justify-between rounded-md border p-3 text-sm hover:bg-accent"
                >
                  <div>
                    <p className="font-medium">{v.product.name}</p>
                    <p className="text-xs text-muted-foreground">{v.sku}</p>
                  </div>
                  <Badge variant={v.inventory?.quantity === 0 ? "destructive" : "secondary"}>
                    {v.inventory?.quantity ?? 0} left
                  </Badge>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
