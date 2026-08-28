import {
  getSalesMetrics,
  getCustomerMetrics,
  getRewardsMetrics,
  getGroupMetrics,
  parseRange,
} from "@/lib/analytics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RangeSelector } from "@/components/management/range-selector";
import Link from "next/link";
import {
  TrendingUp,
  ShoppingCart,
  Users,
  Coins,
  UsersRound,
  ArrowRight,
  Package,
  Crown,
  Truck,
} from "lucide-react";
import { formatTk } from "@/lib/utils/currency";

export const dynamic = "force-dynamic";

export default async function AdminAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const { range } = await searchParams;
  const dateRange = parseRange(range);
  const rangeLabel = range ?? "30d";

  const [sales, customers, rewards, groups] = await Promise.all([
    getSalesMetrics(dateRange),
    getCustomerMetrics(dateRange),
    getRewardsMetrics(dateRange),
    getGroupMetrics(dateRange),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
          <p className="text-sm text-muted-foreground">
            Operational insights for the selected period
          </p>
        </div>
        <RangeSelector />
      </div>

      {/* Top KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Net Sales ({rangeLabel})</p>
                <p className="text-2xl font-bold mt-1">{formatTk(sales.netSales)}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {sales.totalOrders} orders • AOV {formatTk(sales.averageOrderValue)}
                </p>
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
                <p className="text-xs text-muted-foreground">Delivered</p>
                <p className="text-2xl font-bold mt-1">{sales.deliveredOrders}</p>
                <p className="text-xs text-green-600 mt-1">
                  {sales.conversionRate.toFixed(1)}% delivery rate
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
                <p className="text-xs text-muted-foreground">New Customers</p>
                <p className="text-2xl font-bold mt-1">{customers.newCustomers}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {customers.totalBuyers} total buyers
                </p>
              </div>
              <div className="rounded-lg bg-primary/10 p-2.5">
                <Users className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Coins Issued</p>
                <p className="text-2xl font-bold mt-1">{rewards.coinsIssued.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {rewards.vouchersIssued} vouchers issued
                </p>
              </div>
              <div className="rounded-lg bg-primary/10 p-2.5">
                <Coins className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed breakdowns */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Sales summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              Sales Breakdown
              <Link href="/admin/analytics/sales" className="text-xs text-primary hover:underline inline-flex items-center">
                View <ArrowRight className="ml-1 h-3 w-3" />
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row label="Gross Merchandise Value" value={formatTk(sales.grossMerchandiseValue)} />
            <Row label="Discounts Given" value={`-${formatTk(sales.discounts)}`} negative />
            <Row label="Delivery Revenue" value={formatTk(sales.deliveryRevenue)} />
            <div className="border-t pt-2">
              <Row label="Net Sales" value={formatTk(sales.netSales)} strong />
            </div>
            <Row label="Avg Order Value" value={formatTk(sales.averageOrderValue)} />
            <Row label="Cancellation Rate" value={`${sales.cancellationRate.toFixed(1)}%`} />
          </CardContent>
        </Card>

        {/* Customer summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              Customers
              <Link href="/admin/analytics/customers" className="text-xs text-primary hover:underline inline-flex items-center">
                View <ArrowRight className="ml-1 h-3 w-3" />
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row label="New in period" value={customers.newCustomers} />
            <Row label="Total registered" value={customers.totalRegistered} />
            <Row label="Total buyers" value={customers.totalBuyers} />
            <Row label="Returning customers" value={customers.returningCustomers} />
            <div className="border-t pt-2">
              <Row label="Retention rate" value={`${customers.retentionRate.toFixed(1)}%`} strong />
            </div>
            <Row label="Avg orders/buyer" value={customers.avgOrdersPerBuyer.toFixed(2)} />
            <Row label="Guest orders" value={customers.guestOrders} />
            <Row label="Registered orders" value={customers.registeredOrders} />
          </CardContent>
        </Card>

        {/* Rewards summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              Rewards
              <Link href="/admin/analytics/rewards" className="text-xs text-primary hover:underline inline-flex items-center">
                View <ArrowRight className="ml-1 h-3 w-3" />
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row label="Coins issued" value={rewards.coinsIssued.toLocaleString()} />
            <Row label="Coins redeemed" value={`-${rewards.coinsRedeemed.toLocaleString()}`} />
            <Row label="Coins reversed" value={`-${rewards.coinsReversed.toLocaleString()}`} />
            <div className="border-t pt-2">
              <Row label="Outstanding coins" value={rewards.outstanding.toLocaleString()} strong />
            </div>
            <Row label="Vouchers issued" value={rewards.vouchersIssued} />
            <Row label="Vouchers used" value={rewards.vouchersUsed} />
            <Row label="Voucher usage rate" value={`${rewards.voucherUsageRate.toFixed(1)}%`} />
          </CardContent>
        </Card>

        {/* Group summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              Groups
              <Link href="/admin/analytics/groups" className="text-xs text-primary hover:underline inline-flex items-center">
                View <ArrowRight className="ml-1 h-3 w-3" />
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row label="Total groups" value={groups.totalGroups} />
            <Row label="Active groups" value={groups.activeGroups} />
            <Row label="New in period" value={groups.newGroupsInRange} />
            <Row label="Total members" value={groups.totalMembers} />
            <Row label="Avg members/group" value={groups.avgMembersPerGroup.toFixed(1)} />
            <div className="border-t pt-2">
              <Row label="Group orders" value={groups.groupOrdersCount} />
              <Row label="Group revenue" value={formatTk(groups.groupOrderRevenue)} strong />
            </div>
            <Row label="Conversion rate" value={`${groups.groupConversionRate.toFixed(1)}%`} />
          </CardContent>
        </Card>

        {/* Product summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              Products
              <Link href="/admin/analytics/products" className="text-xs text-primary hover:underline inline-flex items-center">
                View <ArrowRight className="ml-1 h-3 w-3" />
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row label="GMV (gross)" value={formatTk(sales.grossMerchandiseValue)} />
            <Row label="Conversion rate" value={`${sales.conversionRate.toFixed(1)}%`} />
            <p className="text-xs text-muted-foreground pt-2">
              Detailed best-seller & slow-seller analysis on the products tab.
            </p>
          </CardContent>
        </Card>

        {/* Agents summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              Staff Performance
              <Link href="/admin/analytics/agents" className="text-xs text-primary hover:underline inline-flex items-center">
                View <ArrowRight className="ml-1 h-3 w-3" />
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="text-xs text-muted-foreground">
              Agent assignment, delivery, cancellation, and revenue performance.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  strong,
  negative,
}: {
  label: string;
  value: string | number;
  strong?: boolean;
  negative?: boolean;
}) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span
        className={`${strong ? "font-semibold text-base" : "font-medium"} ${
          negative ? "text-red-600" : ""
        }`}
      >
        {value}
      </span>
    </div>
  );
}
