import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { formatTk } from "@/lib/utils/currency";
import { Clock, CheckCircle2, Truck, Home, AlertTriangle } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AgentDashboardPage() {
  const session = await getSession();
  if (!session?.profile || !["AGENT", "ADMIN"].includes(session.profile.role)) {
    redirect("/login");
  }

  // Agents see all orders; in a multi-agent setup you'd filter by agentId
  const [pendingOrders, confirmedOrders, processingOrders, shippedOrders, todayDelivered] = await Promise.all([
    db.order.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "asc" },
      take: 20,
      include: { items: { take: 1 } },
    }),
    db.order.count({ where: { status: "CONFIRMED" } }),
    db.order.count({ where: { status: "PROCESSING" } }),
    db.order.count({ where: { status: "SHIPPED" } }),
    db.order.count({
      where: {
        status: "DELIVERED",
        deliveredAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Agent Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Confirm and process incoming orders.
        </p>
      </div>

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-amber-500" />
              <div>
                <p className="text-2xl font-bold">{pendingOrders.length}</p>
                <p className="text-xs text-muted-foreground">Pending Confirmation</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{confirmedOrders}</p>
                <p className="text-xs text-muted-foreground">Confirmed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Truck className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{shippedOrders}</p>
                <p className="text-xs text-muted-foreground">Out for Delivery</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Home className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{todayDelivered}</p>
                <p className="text-xs text-muted-foreground">Delivered Today</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending orders */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            Orders Awaiting Confirmation ({pendingOrders.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {pendingOrders.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              No pending orders. All caught up! 🎉
            </p>
          ) : (
            pendingOrders.map((o) => (
              <Link
                key={o.id}
                href={`/agent/orders/${o.id}`}
                className="block rounded-md border p-3 hover:bg-accent"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">#{o.orderNumber}</span>
                      <Badge variant="secondary" className="text-xs">
                        {new Date(o.createdAt).toLocaleTimeString("en-BD", {
                          hour: "2-digit", minute: "2-digit",
                        })}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {o.customerName} • {o.customerPhone}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {o.items[0]?.productName ?? "—"}
                      {o.items.length > 1 ? ` + ${o.items.length - 1} more` : ""}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-sm">{formatTk(o.total)}</p>
                    <Badge className="text-xs bg-amber-500">Confirm →</Badge>
                  </div>
                </div>
              </Link>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
