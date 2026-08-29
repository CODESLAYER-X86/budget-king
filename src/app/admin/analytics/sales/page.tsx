import {
  getSalesMetrics,
  getDailySalesSeries,
  getOrderStatusBreakdown,
  parseRange,
} from "@/lib/analytics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { SalesChart } from "./sales-chart";

export const dynamic = "force-dynamic";

export default async function SalesAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const { range } = await searchParams;
  const dateRange = parseRange(range);

  const [metrics, series, statusBreakdown] = await Promise.all([
    getSalesMetrics(dateRange),
    getDailySalesSeries(dateRange),
    getOrderStatusBreakdown(dateRange),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Sales Analytics</h1>
          <p className="text-sm text-muted-foreground">Revenue, orders, and conversion metrics</p>
        </div>
        <RangeSelector />
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Gross Merchandise Value</p>
            <p className="text-2xl font-bold mt-1">{formatTk(metrics.grossMerchandiseValue)}</p>
            <p className="text-xs text-muted-foreground mt-1">Before discounts</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Net Sales</p>
            <p className="text-2xl font-bold mt-1">{formatTk(metrics.netSales)}</p>
            <p className="text-xs text-muted-foreground mt-1">After discounts + delivery</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Avg Order Value</p>
            <p className="text-2xl font-bold mt-1">{formatTk(metrics.averageOrderValue)}</p>
            <p className="text-xs text-muted-foreground mt-1">{metrics.totalOrders} orders</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Conversion Rate</p>
            <p className="text-2xl font-bold mt-1">{metrics.conversionRate.toFixed(1)}%</p>
            <p className="text-xs text-muted-foreground mt-1">
              {metrics.deliveredOrders}/{metrics.totalOrders} delivered
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Daily Revenue</CardTitle>
        </CardHeader>
        <CardContent>
          <SalesChart data={series} />
        </CardContent>
      </Card>

      {/* Detailed breakdown */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Revenue Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row label="Gross Merchandise Value" value={formatTk(metrics.grossMerchandiseValue)} />
            <Row label="Discounts Given" value={`-${formatTk(metrics.discounts)}`} negative />
            <Row label="Delivery Revenue" value={formatTk(metrics.deliveryRevenue)} />
            <div className="border-t pt-2">
              <Row label="Net Sales" value={formatTk(metrics.netSales)} strong />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Order Status Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Count</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {statusBreakdown.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center py-4 text-muted-foreground text-sm">
                      No orders in this period
                    </TableCell>
                  </TableRow>
                ) : (
                  statusBreakdown.map((s) => (
                    <TableRow key={s.status}>
                      <TableCell className="text-sm">{s.status.replace(/_/g, " ")}</TableCell>
                      <TableCell className="text-right font-medium text-sm">{s.count}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
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
