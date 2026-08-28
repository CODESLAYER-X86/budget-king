import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Package, Truck, Home, XCircle } from "lucide-react";
import { formatTk } from "@/lib/utils/currency";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ReviewForm } from "./review-form";

export const dynamic = "force-dynamic";

const STATUS_STEPS: Array<{
  key: string;
  label: string;
  icon: typeof Package;
}> = [
  { key: "PENDING", label: "Order Placed", icon: CheckCircle2 },
  { key: "CONFIRMED", label: "Confirmed", icon: Package },
  { key: "PROCESSING", label: "Processing", icon: Package },
  { key: "SHIPPED", label: "Shipped", icon: Truck },
  { key: "DELIVERED", label: "Delivered", icon: Home },
];

function statusIndex(status: string): number {
  const i = STATUS_STEPS.findIndex((s) => s.key === status);
  return i >= 0 ? i : -1;
}

export default async function OrderDetailPage({
  searchParams,
}: {
  searchParams: Promise<{ orderNumber?: string; phone?: string }>;
}) {
  const { orderNumber, phone } = await searchParams;

  if (!orderNumber) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">
              Please provide an order number.{" "}
              <Link href="/track" className="text-primary hover:underline">
                Track your order here.
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const order = await db.order.findUnique({
    where: { orderNumber },
    include: {
      items: true,
      statusHistory: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!order) notFound();

  // Guest verification: phone must match
  if (!order.userId && phone && phone !== order.customerPhone) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Card>
          <CardContent className="p-8 text-center">
            <XCircle className="mx-auto h-12 w-12 text-destructive" />
            <h1 className="mt-4 text-xl font-bold">Verification failed</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              The phone number does not match this order.
            </p>
            <Link
              href="/track"
              className="mt-4 inline-block text-primary hover:underline"
            >
              Try again
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentStep = statusIndex(order.status);
  const isCancelled = order.status === "CANCELLED" || order.status === "DELIVERY_FAILED";
  const address = order.deliveryAddressJson as {
    fullName?: string;
    phone?: string;
    division?: string;
    district?: string;
    area?: string;
    addressLine?: string;
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Order {order.orderNumber}</h1>
          <p className="text-sm text-muted-foreground">
            Placed on {new Date(order.createdAt).toLocaleDateString("en-BD", {
              year: "numeric", month: "long", day: "numeric",
              hour: "2-digit", minute: "2-digit",
            })}
          </p>
        </div>
        <Badge
          variant={isCancelled ? "destructive" : "default"}
          className="text-sm"
        >
          {order.status.replace(/_/g, " ")}
        </Badge>
      </div>

      {/* Status tracker */}
      {!isCancelled ? (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">Order Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="grid grid-cols-5 gap-2">
              {STATUS_STEPS.map((step, idx) => {
                const Icon = step.icon;
                const isDone = idx <= currentStep;
                const isCurrent = idx === currentStep;
                return (
                  <li key={step.key} className="flex flex-col items-center text-center">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full border-2 ${
                        isDone
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-background text-muted-foreground"
                      } ${isCurrent ? "ring-2 ring-primary ring-offset-2" : ""}`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <span
                      className={`mt-2 text-xs ${
                        isDone ? "font-semibold text-foreground" : "text-muted-foreground"
                      }`}
                    >
                      {step.label}
                    </span>
                  </li>
                );
              })}
            </ol>
          </CardContent>
        </Card>
      ) : (
        <Card className="mb-6 border-destructive">
          <CardContent className="p-6 text-center">
            <XCircle className="mx-auto h-10 w-10 text-destructive" />
            <p className="mt-2 font-semibold">
              {order.status === "CANCELLED" ? "Order Cancelled" : "Delivery Failed"}
            </p>
            {order.cancelReason && (
              <p className="mt-1 text-sm text-muted-foreground">
                Reason: {order.cancelReason}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
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
                    <img
                      src={item.productImage}
                      alt={item.productName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                      No img
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium line-clamp-1">{item.productName}</p>
                  <p className="text-xs text-muted-foreground">{item.variantLabel}</p>
                  <p className="text-xs text-muted-foreground">SKU: {item.productSku}</p>
                  <div className="mt-1 flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {item.quantity} × {formatTk(item.unitPrice)}
                    </span>
                    <span className="font-semibold">{formatTk(item.totalPrice)}</span>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Summary + delivery */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatTk(order.subtotal)}</span>
              </div>
              {Number(order.discount) > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>-{formatTk(order.discount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Delivery Charge</span>
                <span>{formatTk(order.deliveryCharge)}</span>
              </div>
              <div className="border-t pt-2 flex justify-between font-semibold text-base">
                <span>Total</span>
                <span>{formatTk(order.total)}</span>
              </div>
              <div className="pt-2 text-xs text-muted-foreground">
                Payment: Cash on Delivery
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Delivery Address</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-1">
              <p className="font-medium">{address?.fullName ?? order.customerName}</p>
              <p className="text-muted-foreground">{address?.phone ?? order.customerPhone}</p>
              <p className="text-muted-foreground">{address?.addressLine}</p>
              <p className="text-muted-foreground">
                {[address?.area, address?.district, address?.division].filter(Boolean).join(", ")}
              </p>
            </CardContent>
          </Card>

          {/* Cancel button for pending orders */}
          {(order.status === "PENDING" || order.status === "CONFIRMED") && (
            <CancelOrderForm orderNumber={order.orderNumber} />
          )}

          {/* Review prompt for delivered orders (authenticated customers only) */}
          {order.status === "DELIVERED" && order.userId && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Write a Review</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                <p>
                  Tell us what you think of your purchase. Your review helps other
                  shoppers make better decisions.
                </p>
                <ReviewList orderId={order.id} items={order.items} />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function ReviewList({
  orderId,
  items,
}: {
  orderId: string;
  items: Array<{ id: string; productId: string; productName: string }>;
}) {
  return (
    <div className="mt-3 space-y-2">
      {items.map((item) => (
        <ReviewForm key={item.id} orderId={orderId} productId={item.productId} productName={item.productName} />
      ))}
    </div>
  );
}

function CancelOrderForm({ orderNumber }: { orderNumber: string }) {
  return (
    <form action="/api/orders/cancel" method="POST" className="space-y-3">
      <input type="hidden" name="orderNumber" value={orderNumber} />
      <label className="text-sm font-medium">Cancel reason (optional)</label>
      <select
        name="reason"
        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
      >
        <option value="">Select reason</option>
        <option value="Changed my mind">Changed my mind</option>
        <option value="Ordered by mistake">Ordered by mistake</option>
        <option value="Wrong product">Wrong product</option>
        <option value="Delivery taking too long">Delivery taking too long</option>
        <option value="Other">Other</option>
      </select>
      <button
        type="submit"
        className="w-full rounded-md border border-destructive px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive hover:text-destructive-foreground"
      >
        Cancel Order
      </button>
    </form>
  );
}
