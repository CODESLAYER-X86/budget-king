import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Coins, Ticket, History, Plus } from "lucide-react";
import { formatTk } from "@/lib/utils/currency";
import { getRewardSettings } from "@/actions/rewards";
import { RewardSettingsCard } from "./reward-settings-card";

export const dynamic = "force-dynamic";

export default async function AdminRewardsPage() {
  const [rules, vouchers, totalCoinsIssued, totalCoinsRedeemed, recentTransactions, rewardSettings] = await Promise.all([
    db.coinRule.findMany({ orderBy: { createdAt: "desc" } }),
    db.voucher.findMany({ orderBy: { createdAt: "desc" } }),
    db.coinTransaction.aggregate({
      where: { type: "EARNED" },
      _sum: { amount: true },
    }),
    db.coinTransaction.aggregate({
      where: { type: "REDEEMED" },
      _sum: { amount: true },
    }),
    db.coinTransaction.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        user: { select: { email: true, fullName: true } },
        order: { select: { orderNumber: true } },
        voucher: { select: { code: true } },
      },
    }),
    getRewardSettings(),
  ]);

  const issued = totalCoinsIssued._sum.amount ?? 0;
  const redeemed = Math.abs(totalCoinsRedeemed._sum.amount ?? 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Rewards Management</h1>
        <p className="text-sm text-muted-foreground">
          Configure direct coin exchange rates, earning rules, and voucher templates.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Coins className="h-5 w-5 text-amber-500" />
              <div>
                <p className="text-2xl font-bold">{issued.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Coins Issued</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Ticket className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{redeemed.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Coins Redeemed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Coins className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{(issued - redeemed).toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Outstanding Coins</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Ticket className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{vouchers.length}</p>
                <p className="text-xs text-muted-foreground">Voucher Templates</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Direct Coin Redemption Configuration */}
      <RewardSettingsCard initialSettings={rewardSettings} />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Coin Rules */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Coin Earning Rules</CardTitle>
            <Link href="/admin/rewards/rules">
              <span className="text-xs text-primary hover:underline">Manage →</span>
            </Link>
          </CardHeader>
          <CardContent className="space-y-2">
            {rules.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No rules yet. Customers won&apos;t earn coins until you add one.
              </p>
            ) : (
              rules.slice(0, 5).map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between rounded-md border p-3 text-sm"
                >
                  <div>
                    <p className="font-medium">{r.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Spend tk {Number(r.minPurchase)}+ → earn {r.coinsAwarded} coins
                    </p>
                  </div>
                  <Badge variant={r.isActive ? "default" : "secondary"}>
                    {r.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Voucher Templates */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Voucher Templates</CardTitle>
            <Link href="/admin/rewards/vouchers">
              <span className="text-xs text-primary hover:underline">Manage →</span>
            </Link>
          </CardHeader>
          <CardContent className="space-y-2">
            {vouchers.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No vouchers yet. Customers can&apos;t redeem coins without vouchers.
              </p>
            ) : (
              vouchers.slice(0, 5).map((v) => (
                <div
                  key={v.id}
                  className="flex items-center justify-between rounded-md border p-3 text-sm"
                >
                  <div>
                    <p className="font-medium">{v.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {v.type === "FIXED_AMOUNT"
                        ? `${formatTk(v.value)} off`
                        : `${Number(v.value)}% off`}{" "}
                      • {v.coinCost} coins
                    </p>
                  </div>
                  <Badge variant={v.isActive ? "default" : "secondary"}>
                    {v.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <History className="h-4 w-4" /> Recent Coin Transactions
          </CardTitle>
          <Link href="/admin/rewards/ledger">
            <span className="text-xs text-primary hover:underline">View all →</span>
          </Link>
        </CardHeader>
        <CardContent>
          {recentTransactions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No transactions yet.
            </p>
          ) : (
            <div className="space-y-2">
              {recentTransactions.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between rounded-md border p-3 text-sm"
                >
                  <div>
                    <p className="font-medium">
                      {t.user.fullName ?? t.user.email}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t.type.replace(/_/g, " ")} •{" "}
                      {new Date(t.createdAt).toLocaleString("en-BD", {
                        day: "numeric", month: "short",
                        hour: "2-digit", minute: "2-digit",
                      })}
                      {t.order && ` • Order ${t.order.orderNumber}`}
                      {t.voucher && ` • Voucher ${t.voucher.code}`}
                    </p>
                  </div>
                  <span
                    className={`font-semibold ${
                      t.amount >= 0 ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {t.amount >= 0 ? "+" : ""}
                    {t.amount.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
