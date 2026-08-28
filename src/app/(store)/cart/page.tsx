"use client";

import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/lib/cart-store";
import { formatTk } from "@/lib/utils/currency";
import { Button } from "@/components/ui/button";
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CartPage() {
  const lines = useCart((s) => s.lines);
  const setQuantity = useCart((s) => s.setQuantity);
  const remove = useCart((s) => s.remove);
  const subtotal = useCart((s) => s.subtotal());
  const router = useRouter();
  const [promoCode, setPromoCode] = useState("");

  if (lines.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <ShoppingBag className="mx-auto h-16 w-16 text-muted-foreground/50" />
          <h1 className="mt-4 text-2xl font-bold">Your cart is empty</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Browse our collection and find something you love.
          </p>
          <Link href="/shop">
            <Button className="mt-4">Continue Shopping</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold tracking-tight">Shopping Cart</h1>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        {/* Items */}
        <div className="space-y-4">
          {lines.map((line) => (
            <div
              key={line.variantId}
              className="flex gap-4 rounded-lg border bg-card p-4"
            >
              <Link
                href={`/product/${line.slug}`}
                className="relative h-24 w-24 shrink-0 overflow-hidden rounded-md bg-muted"
              >
                {line.image ? (
                  <Image
                    src={line.image}
                    alt={line.name}
                    fill
                    sizes="96px"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                    No img
                  </div>
                )}
              </Link>

              <div className="flex-1 min-w-0">
                <Link
                  href={`/product/${line.slug}`}
                  className="font-medium hover:text-primary line-clamp-1"
                >
                  {line.name}
                </Link>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {line.variantLabel}
                </p>
                <p className="text-xs text-muted-foreground">SKU: {line.sku}</p>

                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center border rounded-md">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setQuantity(line.variantId, line.quantity - 1)}
                      disabled={line.quantity <= 1}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="px-3 text-sm font-medium">{line.quantity}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setQuantity(line.variantId, line.quantity + 1)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>

                  <div className="text-right">
                    <p className="font-semibold">{formatTk(line.unitPrice * line.quantity)}</p>
                    <button
                      onClick={() => remove(line.variantId)}
                      className="mt-1 inline-flex items-center gap-1 text-xs text-destructive hover:underline"
                    >
                      <Trash2 className="h-3 w-3" /> Remove
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="space-y-4">
          <div className="rounded-lg border bg-card p-4 sticky top-20">
            <h2 className="text-base font-semibold mb-4">Order Summary</h2>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal ({lines.length} items)</span>
                <span className="font-medium">{formatTk(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Delivery</span>
                <span className="text-muted-foreground">Calculated at checkout</span>
              </div>
              <div className="border-t pt-2 flex justify-between font-semibold text-base">
                <span>Estimated Total</span>
                <span>{formatTk(subtotal)}</span>
              </div>
            </div>

            {/* Promo code */}
            <div className="mt-4 pt-4 border-t">
              <label className="text-xs text-muted-foreground">Promo Code</label>
              <div className="mt-1 flex gap-2">
                <input
                  type="text"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  placeholder="Enter code"
                  className="flex h-9 flex-1 rounded-md border border-input bg-background px-3 text-sm"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => alert("Vouchers coming in Phase 5 (Budget Coins)")}
                >
                  Apply
                </Button>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Budget Coins &amp; vouchers coming soon
              </p>
            </div>

            <Button
              className="mt-4 w-full"
              size="lg"
              onClick={() => router.push("/checkout")}
            >
              Proceed to Checkout <ArrowRight className="ml-2 h-4 w-4" />
            </Button>

            <Link
              href="/shop"
              className="mt-3 block text-center text-sm text-muted-foreground hover:text-primary"
            >
              ← Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
