import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Package, Coins, Users, MapPin, LogOut, Crown } from "lucide-react";
import { formatTk } from "@/lib/utils/currency";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const session = await getSession();
  if (!session?.profile) redirect("/login?next=/account");

  const [orders, addresses] = await Promise.all([
    db.order.findMany({
      where: { userId: session.id },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { items: true },
    }),
    db.address.findMany({
      where: { userId: session.id },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    }),
  ]);

  const totalSpent = orders
    .filter((o) => o.status === "DELIVERED")
    .reduce((sum, o) => sum + Number(o.total), 0);

  const activeOrders = orders.filter((o) =>
    ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED"].includes(o.status)
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Welcome back, {session.profile.fullName ?? session.email.split("@")[0]} 👋
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your orders, profile, and rewards.
          </p>
        </div>
        <a
          href="/auth/signout"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-destructive"
        >
          <LogOut className="h-4 w-4" /> Sign out
        </a>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2.5">
              <Package className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{activeOrders.length}</p>
              <p className="text-xs text-muted-foreground">Active Orders</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2.5">
              <Coins className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">0</p>
              <p className="text-xs text-muted-foreground">Budget Coins (Phase 5)</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2.5">
              <Crown className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{formatTk(totalSpent)}</p>
              <p className="text-xs text-muted-foreground">Total Spent</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent orders */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent Orders</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {orders.length === 0 ? (
                <div className="rounded-md border border-dashed p-8 text-center">
                  <Package className="mx-auto h-8 w-8 text-muted-foreground" />
                  <p className="mt-2 text-sm text-muted-foreground">
                    No orders yet.
                  </p>
                  <Link href="/shop">
                    <Button className="mt-3" size="sm">
                      Start Shopping
                    </Button>
                  </Link>
                </div>
              ) : (
                orders.map((o) => (
                  <Link
                    key={o.id}
                    href={`/order/${o.orderNumber}`}
                    className="block rounded-md border p-3 hover:bg-accent transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">#{o.orderNumber}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(o.createdAt).toLocaleDateString("en-BD", {
                            day: "numeric", month: "short", year: "numeric",
                          })} • {o.items.length} item{o.items.length === 1 ? "" : "s"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-sm">{formatTk(o.total)}</p>
                        <Badge
                          variant={
                            o.status === "DELIVERED" ? "default" :
                            o.status === "CANCELLED" ? "destructive" :
                            "secondary"
                          }
                          className="text-xs"
                        >
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

        {/* Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Saved Addresses</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {addresses.length === 0 ? (
                <p className="text-sm text-muted-foreground">No saved addresses yet.</p>
              ) : (
                addresses.map((a) => (
                  <div key={a.id} className="rounded-md border p-3 text-sm">
                    <p className="font-medium flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-primary" />
                      {a.label ?? "Address"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">{a.addressLine}</p>
                    <p className="text-xs text-muted-foreground">
                      {a.district}, {a.division}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">{a.phone}</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Coming Soon</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="h-4 w-4" /> Group Shopping (Phase 6)
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Coins className="h-4 w-4" /> Budget Coins (Phase 5)
              </div>
            </CardContent>
          </Card>

          {/* Quick links */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick Links</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <Link href="/orders" className="block text-primary hover:underline">View All Orders →</Link>
              <Link href="/addresses" className="block text-primary hover:underline">Manage Addresses →</Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
