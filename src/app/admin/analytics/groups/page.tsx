import { getGroupMetrics, getTopGroups, parseRange } from "@/lib/analytics";
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

export default async function GroupAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const { range } = await searchParams;
  const dateRange = parseRange(range);

  const [metrics, topGroups] = await Promise.all([
    getGroupMetrics(dateRange),
    getTopGroups(10),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Group Analytics</h1>
          <p className="text-sm text-muted-foreground">Group shopping engagement and conversion</p>
        </div>
        <RangeSelector />
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total Groups</p>
            <p className="text-2xl font-bold mt-1">{metrics.totalGroups}</p>
            <p className="text-xs text-muted-foreground mt-1">{metrics.activeGroups} active</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total Members</p>
            <p className="text-2xl font-bold mt-1">{metrics.totalMembers}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Avg {metrics.avgMembersPerGroup.toFixed(1)} per group
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Group Orders</p>
            <p className="text-2xl font-bold mt-1">{metrics.groupOrdersCount}</p>
            <p className="text-xs text-muted-foreground mt-1">In selected period</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Group Revenue</p>
            <p className="text-2xl font-bold mt-1">{formatTk(metrics.groupOrderRevenue)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {metrics.groupConversionRate.toFixed(1)}% product→order conversion
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Funnel */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Group Shopping Funnel</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <FunnelBar
              label="Groups created"
              value={metrics.totalGroups}
              max={metrics.totalGroups}
            />
            <FunnelBar
              label="Members joined"
              value={metrics.totalMembers}
              max={Math.max(metrics.totalMembers, metrics.totalGroups)}
            />
            <FunnelBar
              label="Products shared"
              value={metrics.totalSharedProducts}
              max={Math.max(metrics.totalSharedProducts, metrics.totalGroups)}
            />
            <FunnelBar
              label="Items added to group carts"
              value={metrics.totalGroupCartItems}
              max={Math.max(metrics.totalGroupCartItems, metrics.totalSharedProducts)}
            />
            <FunnelBar
              label="Group orders placed"
              value={metrics.groupOrdersCount}
              max={Math.max(metrics.groupOrdersCount, metrics.totalGroupCartItems)}
              highlight
            />
          </div>
        </CardContent>
      </Card>

      {/* Top groups */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Top Groups (by orders & activity)</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Code</TableHead>
                <TableHead className="hidden md:table-cell">Owner</TableHead>
                <TableHead className="text-center">Members</TableHead>
                <TableHead className="text-center hidden sm:table-cell">Products</TableHead>
                <TableHead className="text-center hidden sm:table-cell">Cart</TableHead>
                <TableHead className="text-center">Orders</TableHead>
                <TableHead className="text-center">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topGroups.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-6 text-muted-foreground text-sm">
                    No groups created yet.
                  </TableCell>
                </TableRow>
              ) : (
                topGroups.map((g) => (
                  <TableRow key={g.id}>
                    <TableCell className="text-sm font-medium">{g.name}</TableCell>
                    <TableCell className="font-mono text-xs">{g.code}</TableCell>
                    <TableCell className="hidden md:table-cell text-xs text-muted-foreground">{g.owner}</TableCell>
                    <TableCell className="text-center text-sm">{g.memberCount}</TableCell>
                    <TableCell className="text-center text-sm hidden sm:table-cell">{g.productCount}</TableCell>
                    <TableCell className="text-center text-sm hidden sm:table-cell">{g.cartItemCount}</TableCell>
                    <TableCell className="text-center text-sm font-semibold">{g.orderCount}</TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant={
                          g.status === "ACTIVE" ? "default" :
                          g.status === "SUSPENDED" ? "destructive" :
                          "secondary"
                        }
                      >
                        {g.status}
                      </Badge>
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

function FunnelBar({
  label,
  value,
  max,
  highlight,
}: {
  label: string;
  value: number;
  max: number;
  highlight?: boolean;
}) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-semibold">{value.toLocaleString()}</span>
      </div>
      <div className="h-3 bg-muted rounded overflow-hidden">
        <div
          className={`h-full ${highlight ? "bg-primary" : "bg-amber-500"}`}
          style={{ width: `${Math.max(pct, value > 0 ? 5 : 0)}%` }}
        />
      </div>
    </div>
  );
}
