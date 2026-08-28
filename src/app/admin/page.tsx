import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { formatTk } from "@/lib/utils/currency";
import { ShoppingCart, Package, Users, TrendingUp, Clock, AlertTriangle, ArrowRight } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  // SINGLE parallel query — minimize DB round-trips
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [todayOrderCount, pendingCount, totalProducts, customersCount, todayRevenue, recentOrders, lowStockCount] = await Promise.all([
    db.order.count({ where: { createdAt: { gte: today } } }).catch(() => 0),
    db.order.count({ where: { status: "PENDING" } }).catch(() => 0),
    db.product.count({ where: { status: { not: "ARCHIVED" } } }).catch(() => 0),
    db.profile.count({ where: { role: "CUSTOMER" } }).catch(() => 0),
    db.order.aggregate({
      where: { createdAt: { gte: today }, status: { not: "CANCELLED" } },
      _sum: { total: true },
    }).catch(() => ({ _sum: { total: 0 } })),
    db.order.findMany({ orderBy: { createdAt: "desc" }, take: 5, select: { id: true, orderNumber: true, customerName: true, customerPhone: true, total: true, status: true, createdAt: true } }).catch(() => []),
    db.productVariant.count({ where: { status: "ACTIVE", inventory: { quantity: { lte: 5 } } } }).catch(() => 0),
  ]);

  const todayRev = Number(todayRevenue._sum.total ?? 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Overview of your store&apos;s performance today.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Today&apos;s Revenue</p>
                <p className="text-2xl font-bold mt-1">{formatTk(todayRev)}</p>
              </div>
              <div className="rounded-lg bg-primary/10 p-2.5"><TrendingUp className="h-5 w-5 text-primary" /></div>
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
              <div className="rounded-lg bg-primary/10 p-2.5"><ShoppingCart className="h-5 w-5 text-primary" /></div>
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
              <div className="rounded-lg bg-primary/10 p-2.5"><Package className="h-5 w-5 text-primary" /></div>
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
              <div className="rounded-lg bg-primary/10 p-2.5"><Users className="h-5 w-5 text-primary" /></div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-amber-500" />Requires Attention</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <Link href="/admin/orders?status=PENDING" className="flex items-center justify-between rounded-md border p-3 hover:bg-accent">
              <div className="flex items-center gap-2 text-sm"><Clock className="h-4 w-4 text-amber-500" />Orders pending confirmation</div>
              <Badge variant="secondary">{pendingCount}</Badge>
            </Link>
            <Link href="/admin/inventory?filter=low" className="flex items-center justify-between rounded-md border p-3 hover:bg-accent">
              <div className="flex items-center gap-2 text-sm"><AlertTriangle className="h-4 w-4 text-red-500" />Low stock variants (≤ 5)</div>
              <Badge variant="secondary">{lowStockCount}</Badge>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base flex items-center justify-between">Recent Orders<Link href="/admin/orders" className="text-xs text-muted-foreground hover:text-primary inline-flex items-center">View all <ArrowRight className="ml-1 h-3 w-3" /></Link></CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {recentOrders.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No orders yet.</p>
            ) : (
              recentOrders.map((o) => (
                <Link key={o.id} href={`/admin/orders/${o.id}`} className="block rounded-md border p-3 hover:bg-accent">
                  <div className="flex items-center justify-between text-sm">
                    <div>
                      <p className="font-medium">#{o.orderNumber}</p>
                      <p className="text-xs text-muted-foreground">{o.customerName} • {o.customerPhone}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatTk(o.total)}</p>
                      <Badge variant="secondary" className="text-xs">{o.status.replace(/_/g, " ")}</Badge>
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
