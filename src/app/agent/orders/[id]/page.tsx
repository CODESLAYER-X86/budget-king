import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { formatTk } from "@/lib/utils/currency";
import { OrderStatusActions } from "@/components/management/order-status-actions-shared";
import { ChevronLeft, Phone, MapPin, Clock } from "lucide-react";
import { formatDateTime } from "@/lib/utils/date";

export const dynamic = "force-dynamic";

const NEXT_ACTION: Record<string, { label: string; action: string }> = {
  PENDING: { label: "Confirm Order", action: "CONFIRMED" },
  CONFIRMED: { label: "Start Processing", action: "PROCESSING" },
  PROCESSING: { label: "Mark as Shipped", action: "SHIPPED" },
};

export default async function AgentOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await db.order.findUnique({
    where: { id },
    include: {
      items: true,
      deliveryZone: true,
      statusHistory: { orderBy: { createdAt: "asc" } },
      agent: { select: { fullName: true, email: true, role: true } },
    },
  });

  if (!order) notFound();

  // Resolve status changers
  const changedByIds = Array.from(
    new Set(order.statusHistory.map((h) => h.changedBy).filter(Boolean))
  ) as string[];

  const changers = changedByIds.length > 0
    ? await db.profile.findMany({
        where: { id: { in: changedByIds } },
        select: { id: true, fullName: true, email: true, role: true },
      })
    : [];

  const changerMap = new Map(changers.map((c) => [c.id, c]));

  const address = order.deliveryAddressJson as {
    fullName?: string;
    phone?: string;
    division?: string;
    district?: string;
    area?: string;
    addressLine?: string;
  };
  const nextAction = NEXT_ACTION[order.status];

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/agent/orders"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"
        >
          <ChevronLeft className="h-4 w-4" /> Back to Orders
        </Link>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">#{order.orderNumber}</h1>
          <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
            <Clock className="h-3.5 w-3.5" />
            {new Date(order.createdAt).toLocaleString("en-BD")}
          </p>
        </div>
        <Badge className="text-sm">{order.status.replace(/_/g, " ")}</Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Next action */}
          {nextAction ? (
            <Card className="border-primary">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground mb-2">Recommended Next Action</p>
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-base">👉 {nextAction.label}</p>
                  <OrderStatusActions
                    orderId={order.id}
                    currentStatus={order.status}
                    nextStatus={nextAction.action}
                    nextLabel={nextAction.label}
                  />
                </div>
              </CardContent>
            </Card>
          ) : order.status === "SHIPPED" ? (
            <Card className="border-primary">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground mb-3">
                  Order is out for delivery. Update the outcome:
                </p>
                <div className="flex flex-wrap gap-2">
                  <OrderStatusActions
                    orderId={order.id}
                    currentStatus={order.status}
                    nextStatus="DELIVERY_FAILED"
                    nextLabel="❌ Delivery Failed"
                    variant="destructive"
                  />
                  <OrderStatusActions
                    orderId={order.id}
                    currentStatus={order.status}
                    nextStatus="DELIVERED"
                    nextLabel="✅ Mark Delivered"
                  />
                </div>
              </CardContent>
            </Card>
          ) : order.status === "DELIVERED" ? (
            <Card className="border-border">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground mb-3">
                  Order delivered successfully. Update if customer returns the item:
                </p>
                <div className="flex flex-wrap gap-2">
                  <OrderStatusActions
                    orderId={order.id}
                    currentStatus={order.status}
                    nextStatus="RETURNED"
                    nextLabel="↩️ Mark Returned"
                    variant="destructive"
                  />
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-4 text-sm text-muted-foreground">
                This order is in a terminal state ({order.status.replace(/_/g, " ")}).
              </CardContent>
            </Card>
          )}

          {/* Items */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Items ({order.items.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {order.items.map((item) => (
                <div key={item.id} className="flex gap-3 border-b pb-3 last:border-0 last:pb-0">
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-md bg-muted">
                    {item.productImage ? (
                      <img src={item.productImage} alt={item.productName} className="h-full w-full object-cover" />
                    ) : null}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{item.productName}</p>
                    <p className="text-xs text-muted-foreground">{item.variantLabel}</p>
                    <p className="text-xs text-muted-foreground">SKU: {item.productSku}</p>
                    <div className="mt-1 flex justify-between text-sm">
                      <span className="text-muted-foreground">{item.quantity} × {formatTk(item.unitPrice)}</span>
                      <span className="font-semibold">{formatTk(item.totalPrice)}</span>
                    </div>
                  </div>
                </div>
              ))}
              <Separator />
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatTk(order.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Delivery</span>
                  <span>{formatTk(order.deliveryCharge)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold text-base">
                  <span>Total</span>
                  <span>{formatTk(order.total)}</span>
                </div>
                <p className="text-xs text-muted-foreground pt-1">Payment: Cash on Delivery</p>
              </div>
            </CardContent>
          </Card>

          {/* Status history */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Status History</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-3">
                {order.statusHistory.map((h) => {
                  const changer = h.changedBy ? changerMap.get(h.changedBy) : null;
                  const isCustomer = h.changedBy && h.changedBy === order.userId;

                  return (
                    <li key={h.id} className="flex items-start gap-3 text-sm">
                      <div className="mt-1 h-2 w-2 rounded-full bg-primary shrink-0" />
                      <div className="space-y-0.5 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium">{h.status.replace(/_/g, " ")}</span>
                          {changer ? (
                            <Badge variant={changer.role === "ADMIN" ? "default" : "secondary"} className="text-[10px] px-1.5 py-0">
                              By {changer.fullName ?? changer.email} ({changer.role})
                            </Badge>
                          ) : isCustomer ? (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                              By Customer
                            </Badge>
                          ) : h.changedBy ? (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                              By Staff
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                              System
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {formatDateTime(h.createdAt)}
                          {h.note ? ` • ${h.note}` : ""}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Customer</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <p className="font-medium">{order.customerName}</p>
              <p className="flex items-center gap-1.5 text-muted-foreground">
                <Phone className="h-3.5 w-3.5" />
                <a href={`tel:${order.customerPhone}`} className="hover:text-primary">
                  {order.customerPhone}
                </a>
              </p>
              {order.customerEmail && (
                <p className="text-muted-foreground">{order.customerEmail}</p>
              )}
              {order.userId ? (
                <Badge variant="outline" className="text-xs">Registered</Badge>
              ) : (
                <Badge variant="outline" className="text-xs">Guest</Badge>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Delivery Address</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-1">
              <p className="flex items-start gap-1.5">
                <MapPin className="h-3.5 w-3.5 mt-0.5 text-primary shrink-0" />
                <span>
                  {address?.addressLine ?? "—"}<br />
                  {[address?.area, address?.district, address?.division].filter(Boolean).join(", ")}
                </span>
              </p>
              <Separator className="my-2" />
              <p className="text-xs text-muted-foreground">
                Zone: {order.deliveryZone?.name ?? "—"} • Est. {order.deliveryZone?.estimatedDays ?? "?"} days
              </p>
              {order.notes && (
                <>
                  <Separator className="my-2" />
                  <p className="text-xs">
                    <strong>Notes:</strong> {order.notes}
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          {order.agent && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Assigned Agent</CardTitle>
              </CardHeader>
              <CardContent className="text-sm">
                <p className="font-medium">{order.agent.fullName ?? order.agent.email}</p>
                <Badge variant="secondary" className="text-[10px] mt-1">
                  {order.agent.role}
                </Badge>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
