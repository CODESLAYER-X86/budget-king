import { getAgentMetrics, parseRange } from "@/lib/analytics";
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

export default async function AgentAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const { range } = await searchParams;
  const dateRange = parseRange(range);
  const agents = await getAgentMetrics(dateRange);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Agent Performance</h1>
          <p className="text-sm text-muted-foreground">Staff handling of orders (assigned, delivered, cancelled)</p>
        </div>
        <RangeSelector />
      </div>

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Active Agents</p>
            <p className="text-2xl font-bold mt-1">{agents.length}</p>
            <p className="text-xs text-muted-foreground mt-1">with assigned orders</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total Orders Assigned</p>
            <p className="text-2xl font-bold mt-1">
              {agents.reduce((s, a) => s + a.assigned, 0)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total Delivered</p>
            <p className="text-2xl font-bold mt-1">
              {agents.reduce((s, a) => s + a.delivered, 0)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total Revenue (delivered)</p>
            <p className="text-2xl font-bold mt-1">
              {formatTk(agents.reduce((s, a) => s + a.revenue, 0))}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Agent Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Agent</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="text-right">Assigned</TableHead>
                <TableHead className="text-right">Pending</TableHead>
                <TableHead className="text-right">Delivered</TableHead>
                <TableHead className="text-right hidden sm:table-cell">Cancelled</TableHead>
                <TableHead className="text-right hidden sm:table-cell">Failed</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
                <TableHead className="text-right">Delivery Rate</TableHead>
                <TableHead className="text-right hidden md:table-cell">Cancel Rate</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {agents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8 text-muted-foreground text-sm">
                    No orders assigned to any agent in this period.
                  </TableCell>
                </TableRow>
              ) : (
                agents.map((a) => (
                  <TableRow key={a.agentId}>
                    <TableCell className="text-sm font-medium">{a.name}</TableCell>
                    <TableCell>
                      <Badge variant={a.role === "ADMIN" ? "default" : "secondary"} className="text-xs">
                        {a.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-sm">{a.assigned}</TableCell>
                    <TableCell className="text-right text-sm">{a.pending}</TableCell>
                    <TableCell className="text-right text-sm font-semibold">{a.delivered}</TableCell>
                    <TableCell className="text-right text-sm hidden sm:table-cell">{a.cancelled}</TableCell>
                    <TableCell className="text-right text-sm hidden sm:table-cell">{a.failed}</TableCell>
                    <TableCell className="text-right text-sm font-medium">{formatTk(a.revenue)}</TableCell>
                    <TableCell className="text-right text-sm">
                      <Badge variant={a.deliveryRate >= 70 ? "default" : a.deliveryRate >= 40 ? "secondary" : "destructive"}>
                        {a.deliveryRate.toFixed(0)}%
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-sm hidden md:table-cell">
                      <Badge variant={a.cancellationRate <= 10 ? "outline" : a.cancellationRate <= 25 ? "secondary" : "destructive"}>
                        {a.cancellationRate.toFixed(0)}%
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
