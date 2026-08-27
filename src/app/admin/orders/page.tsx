import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Link from "next/link";
import { formatTk } from "@/lib/utils/currency";

export const dynamic = "force-dynamic";

const STATUS_BADGES: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  PENDING: "secondary",
  CONFIRMED: "default",
  PROCESSING: "default",
  SHIPPED: "default",
  DELIVERED: "default",
  CANCELLED: "destructive",
  DELIVERY_FAILED: "destructive",
  RETURN_REQUESTED: "secondary",
  RETURNED: "secondary",
};

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const where = status && status !== "ALL" ? { status: status as any } : {};

  const orders = await db.order.findMany({
    where,
    include: { items: { take: 1 } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const statusCounts = await db.order.groupBy({
    by: ["status"],
    _count: { _all: true },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Orders</h1>
        <p className="text-sm text-muted-foreground">
          {orders.length} orders {status && status !== "ALL" ? `(${status.replace(/_/g, " ")})` : ""}
        </p>
      </div>

      {/* Status filter chips */}
      <div className="flex flex-wrap gap-2">
        <Link
          href="/admin/orders"
          className={`rounded-full border px-3 py-1 text-xs ${!status ? "bg-primary text-primary-foreground" : "hover:bg-accent"}`}
        >
          All ({statusCounts.reduce((s, c) => s + c._count._all, 0)})
        </Link>
        {statusCounts.map((sc) => (
          <Link
            key={sc.status}
            href={`/admin/orders?status=${sc.status}`}
            className={`rounded-full border px-3 py-1 text-xs ${status === sc.status ? "bg-primary text-primary-foreground" : "hover:bg-accent"}`}
          >
            {sc.status.replace(/_/g, " ")} ({sc._count._all})
          </Link>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order #</TableHead>
                <TableHead className="hidden sm:table-cell">Customer</TableHead>
                <TableHead className="hidden md:table-cell">Date</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No orders found.
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((o) => (
                  <TableRow key={o.id} className="hover:bg-muted/50">
                    <TableCell>
                      <Link
                        href={`/admin/orders/${o.id}`}
                        className="font-medium text-sm hover:text-primary"
                      >
                        #{o.orderNumber}
                      </Link>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-sm">
                      <p>{o.customerName}</p>
                      <p className="text-xs text-muted-foreground">{o.customerPhone}</p>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                      {new Date(o.createdAt).toLocaleDateString("en-BD", {
                        day: "numeric", month: "short", year: "numeric",
                      })}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-sm">
                      {formatTk(o.total)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={STATUS_BADGES[o.status] ?? "secondary"}>
                        {o.status.replace(/_/g, " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Link href={`/admin/orders/${o.id}`} className="text-primary hover:underline">
                        →
                      </Link>
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
