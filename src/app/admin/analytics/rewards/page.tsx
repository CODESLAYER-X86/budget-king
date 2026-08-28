import { getRewardsMetrics, getTopVouchers, parseRange } from "@/lib/analytics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RangeSelector } from "@/components/management/range-selector";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatTk } from "@/lib/utils/currency";

export const dynamic = "force-dynamic";

export default async function RewardsAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const { range } = await searchParams;
  const dateRange = parseRange(range);

  const [metrics, topVouchers] = await Promise.all([
    getRewardsMetrics(dateRange),
    getTopVouchers(10),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Rewards Analytics</h1>
          <p className="text-sm text-muted-foreground">Coins issued, redeemed, voucher usage</p>
        </div>
        <RangeSelector />
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Coins Issued</p>
            <p className="text-2xl font-bold mt-1">{metrics.coinsIssued.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Coins Redeemed</p>
            <p className="text-2xl font-bold mt-1">{metrics.coinsRedeemed.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Outstanding Coins</p>
            <p className="text-2xl font-bold mt-1">{metrics.outstanding.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground mt-1">In customer balances</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Voucher Usage Rate</p>
            <p className="text-2xl font-bold mt-1">{metrics.voucherUsageRate.toFixed(1)}%</p>
            <p className="text-xs text-muted-foreground mt-1">
              {metrics.vouchersUsed}/{metrics.vouchersIssued} used
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Coin flow */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Coin Flow (in period)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="grid sm:grid-cols-4 gap-3">
            <div className="rounded-md border p-3">
              <p className="text-xs text-muted-foreground">Issued (+)</p>
              <p className="text-xl font-bold text-green-600">+{metrics.coinsIssued.toLocaleString()}</p>
            </div>
            <div className="rounded-md border p-3">
              <p className="text-xs text-muted-foreground">Redeemed (−)</p>
              <p className="text-xl font-bold text-amber-600">−{metrics.coinsRedeemed.toLocaleString()}</p>
            </div>
            <div className="rounded-md border p-3">
              <p className="text-xs text-muted-foreground">Reversed (−)</p>
              <p className="text-xl font-bold text-red-600">−{metrics.coinsReversed.toLocaleString()}</p>
            </div>
            <div className="rounded-md border border-primary p-3">
              <p className="text-xs text-muted-foreground">Net Outstanding</p>
              <p className="text-xl font-bold">{metrics.outstanding.toLocaleString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top vouchers */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Top Voucher Templates</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Voucher</TableHead>
                <TableHead>Discount</TableHead>
                <TableHead className="text-right">Coin Cost</TableHead>
                <TableHead className="text-right">Redemptions</TableHead>
                <TableHead className="text-right">Used</TableHead>
                <TableHead className="text-right">Usage Rate</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topVouchers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-6 text-muted-foreground text-sm">
                    No voucher templates yet.
                  </TableCell>
                </TableRow>
              ) : (
                topVouchers.map((v) => (
                  <TableRow key={v.id}>
                    <TableCell className="text-sm font-medium">{v.name}</TableCell>
                    <TableCell className="text-sm">
                      <Badge variant="outline">
                        {v.type === "FIXED_AMOUNT" ? formatTk(v.value) : `${v.value}%`}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-sm">{v.coinCost.toLocaleString()}</TableCell>
                    <TableCell className="text-right text-sm font-semibold">{v.totalRedemptions}</TableCell>
                    <TableCell className="text-right text-sm">{v.usedCount}</TableCell>
                    <TableCell className="text-right text-sm">
                      {v.totalRedemptions > 0
                        ? `${((v.usedCount / v.totalRedemptions) * 100).toFixed(0)}%`
                        : "—"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
