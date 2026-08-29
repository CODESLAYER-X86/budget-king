import { getCustomerMetrics, parseRange } from "@/lib/analytics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RangeSelector } from "@/components/management/range-selector";
import { formatTk } from "@/lib/utils/currency";
import { Users, UserPlus, Repeat, ShoppingBag } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function CustomerAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const { range } = await searchParams;
  const dateRange = parseRange(range);
  const metrics = await getCustomerMetrics(dateRange);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Customer Analytics</h1>
          <p className="text-sm text-muted-foreground">Acquisition, retention, and lifetime value</p>
        </div>
        <RangeSelector />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2.5">
                <UserPlus className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{metrics.newCustomers}</p>
                <p className="text-xs text-muted-foreground">New (in period)</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2.5">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{metrics.totalRegistered}</p>
                <p className="text-xs text-muted-foreground">Total registered</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2.5">
                <Repeat className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{metrics.returningCustomers}</p>
                <p className="text-xs text-muted-foreground">Returning customers</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2.5">
                <ShoppingBag className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{metrics.totalBuyers}</p>
                <p className="text-xs text-muted-foreground">Total buyers</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Acquisition & Retention</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Row label="New customers (in period)" value={metrics.newCustomers} />
            <Row label="Total registered customers" value={metrics.totalRegistered} />
            <Row label="Customers with delivered orders" value={metrics.totalBuyers} />
            <div className="border-t pt-2">
              <Row label="Retention rate" value={`${metrics.retentionRate.toFixed(1)}%`} strong />
            </div>
            <Row label="Returning customers (2+ orders)" value={metrics.returningCustomers} />
            <Row label="Avg orders per buyer" value={metrics.avgOrdersPerBuyer.toFixed(2)} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Order Source (in period)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">Guest orders</span>
                <span className="font-semibold">{metrics.guestOrders}</span>
              </div>
              <div className="h-2 bg-muted rounded overflow-hidden">
                <div
                  className="h-full bg-amber-500"
                  style={{
                    width: `${(metrics.guestOrders / Math.max(metrics.guestOrders + metrics.registeredOrders, 1)) * 100}%`,
                  }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">Registered customer orders</span>
                <span className="font-semibold">{metrics.registeredOrders}</span>
              </div>
              <div className="h-2 bg-muted rounded overflow-hidden">
                <div
                  className="h-full bg-primary"
                  style={{
                    width: `${(metrics.registeredOrders / Math.max(metrics.guestOrders + metrics.registeredOrders, 1)) * 100}%`,
                  }}
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground pt-2">
              Total orders in period: {metrics.guestOrders + metrics.registeredOrders}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Lifetime Value (LTV)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p className="text-muted-foreground">
            LTV is calculated as Total Net Sales / Total Buyers.
          </p>
          <Row label="Total buyers" value={metrics.totalBuyers} />
          <Row label="Avg orders per buyer" value={metrics.avgOrdersPerBuyer.toFixed(2)} />
          <p className="text-xs text-muted-foreground pt-2">
            For more detailed LTV (cohort-based, monthly), a future analytics phase can add a
            customer cohorts table with materialized monthly aggregates.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: string | number; strong?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={strong ? "font-semibold text-base" : "font-medium"}>{value}</span>
    </div>
  );
}
