import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Package, Coins, Users, MapPin, LogOut, Crown, Gift, ShoppingBag } from "lucide-react";
import { formatTk } from "@/lib/utils/currency";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const session = await getSession();
  if (!session?.profile) redirect("/login?next=/account");

  // Fetch data with error handling — don't crash if pool is exhausted
  const [orders, addresses, coinBalanceResult, activeVoucherCount] = await Promise.all([
    db.order.findMany({
      where: { userId: session.id },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, orderNumber: true, total: true, status: true, createdAt: true, items: { take: 1, select: { productName: true } } },
    }).catch(() => []),
    db.address.findMany({
      where: { userId: session.id },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
      take: 3,
    }).catch(() => []),
    db.coinTransaction.aggregate({
      where: { userId: session.id },
      _sum: { amount: true },
    }).catch(() => ({ _sum: { amount: 0 } })),
    db.customerVoucher.count({
      where: { userId: session.id, status: "ACTIVE" },
    }).catch(() => 0),
  ]);

  const coinBalance = coinBalanceResult._sum.amount ?? 0;

  const totalSpent = orders
    .filter((o) => o.status === "DELIVERED")
    .reduce((sum, o) => sum + Number(o.total), 0);

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

      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2.5">
              <Package className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{orders.length}</p>
              <p className="text-xs text-muted-foreground">Recent Orders</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2.5">
              <Coins className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{coinBalance.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Budget Coins</p>
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
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center justify-between">
                Recent Orders
                <Link href="/orders" className="text-xs text-primary hover:underline">View All →</Link>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {orders.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">
                  No orders yet.
                  <Link href="/shop" className="block text-primary mt-2">Start Shopping</Link>
                </p>
              ) : (
                orders.map((o) => (
                  <Link
                    key={o.id}
                    href={`/order/${o.orderNumber}`}
                    className="block rounded-md border p-3 hover:bg-accent"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">#{o.orderNumber}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(o.createdAt).toLocaleDateString("en-BD")}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-sm">{formatTk(o.total)}</p>
                        <Badge variant="secondary" className="text-xs">{o.status}</Badge>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Quick Links</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <Link href="/orders" className="block text-primary hover:underline">View All Orders →</Link>
              <Link href="/addresses" className="block text-primary hover:underline">Manage Addresses →</Link>
              <Link href="/rewards" className="block text-primary hover:underline">My Rewards ({coinBalance.toLocaleString()} coins) →</Link>
              <Link href="/groups" className="block text-primary hover:underline">My Groups →</Link>
              <Link href="/referrals" className="block text-primary hover:underline">Refer Friends →</Link>
            </CardContent>
          </Card>

          {addresses.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-base">Saved Addresses</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {addresses.map((a) => (
                  <div key={a.id} className="rounded-md border p-3 text-sm">
                    <p className="font-medium">{a.label ?? "Address"}</p>
                    <p className="text-xs text-muted-foreground">{a.addressLine}</p>
                    <p className="text-xs text-muted-foreground">{a.district}, {a.division}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
