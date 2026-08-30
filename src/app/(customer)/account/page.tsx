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

  const userName = session.profile.fullName ?? session.email.split("@")[0];
  const userInitials = userName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase() || "BK";

  return (
    <div className="container mx-auto px-4 py-6 max-w-5xl space-y-6">
      {/* Modern Profile Header Card */}
      <div className="rounded-2xl border border-border/80 bg-gradient-to-br from-card via-card to-primary/5 p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* Avatar Initials */}
            <div className="relative flex h-14 w-14 sm:h-16 sm:w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-amber-600 text-primary-foreground font-bold text-lg sm:text-xl shadow-md shadow-primary/20">
              {userInitials}
              <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-background ring-2 ring-background">
                <Crown className="h-3 w-3 text-amber-500 fill-amber-500" />
              </span>
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground truncate">
                  {userName}
                </h1>
                <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/30 font-semibold">
                  Member
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground truncate mt-0.5">
                {session.email}
              </p>
            </div>
          </div>

          {/* Styled Sign Out Button */}
          <a
            href="/auth/signout"
            className="inline-flex items-center justify-center gap-2 self-start sm:self-auto rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-2 text-xs font-semibold text-destructive hover:bg-destructive/20 active:scale-95 transition-all shadow-xs"
          >
            <LogOut className="h-3.5 w-3.5" /> Sign out
          </a>
        </div>
      </div>

      {/* Modern Stat Grid */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-3">
        <Link href="/orders" className="block group">
          <Card className="rounded-2xl transition-all hover:border-primary/40 hover:shadow-sm active:scale-[0.99]">
            <CardContent className="p-4 sm:p-5 flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Recent Orders</p>
                <p className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">{orders.length}</p>
                <p className="text-[11px] text-primary group-hover:underline">View history →</p>
              </div>
              <div className="rounded-xl bg-primary/10 p-3 text-primary">
                <Package className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/rewards" className="block group">
          <Card className="rounded-2xl border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-card to-card transition-all hover:border-amber-500/60 hover:shadow-sm active:scale-[0.99]">
            <CardContent className="p-4 sm:p-5 flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">Budget Coins</p>
                <p className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground font-mono">{coinBalance.toLocaleString()}</p>
                <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium group-hover:underline">Redeem at checkout →</p>
              </div>
              <div className="rounded-xl bg-amber-500/20 p-3 text-amber-600 dark:text-amber-400">
                <Coins className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Card className="rounded-2xl">
          <CardContent className="p-4 sm:p-5 flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Spent</p>
              <p className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">{formatTk(totalSpent)}</p>
              <p className="text-[11px] text-muted-foreground">On delivered orders</p>
            </div>
            <div className="rounded-xl bg-emerald-500/10 p-3 text-emerald-600 dark:text-emerald-400">
              <Crown className="h-6 w-6" />
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
