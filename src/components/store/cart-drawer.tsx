"use client";

import Link from "next/link";
import Image from "next/image";
import { X, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useCart } from "@/lib/cart-store";
import { formatTk } from "@/lib/utils/currency";

export function CartDrawer({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const lines = useCart((s) => s.lines);
  const setQuantity = useCart((s) => s.setQuantity);
  const remove = useCart((s) => s.remove);
  const subtotal = useCart((s) => s.subtotal());

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md flex flex-col p-0">
        <SheetHeader className="p-4 border-b">
          <SheetTitle className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-primary" />
            Your Cart ({lines.length})
          </SheetTitle>
        </SheetHeader>

        {lines.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 p-8 text-center">
            <ShoppingBag className="h-12 w-12 text-muted-foreground/50" />
            <p className="text-muted-foreground">Your cart is empty</p>
            <Link href="/shop" onClick={() => onOpenChange(false)}>
              <Button>Continue Shopping</Button>
            </Link>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto bk-scroll p-4 space-y-4">
              {lines.map((line) => (
                <div
                  key={line.variantId}
                  className="flex gap-3 border-b pb-4 last:border-0"
                >
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-md bg-muted">
                    {line.image ? (
                      <Image
                        src={line.image}
                        alt={line.name}
                        fill
                        sizes="80px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                        No image
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/product/${line.slug}`}
                      onClick={() => onOpenChange(false)}
                      className="font-medium text-sm hover:text-primary line-clamp-2"
                    >
                      {line.name}
                    </Link>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {line.variantLabel}
                    </p>
                    <p className="text-sm font-semibold mt-1">
                      {formatTk(line.unitPrice)}
                    </p>
                    <div className="mt-2.5 flex items-center justify-between">
                      <div className="flex items-center rounded-lg border bg-secondary/30 p-0.5">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-md hover:bg-background active:scale-90 transition-transform"
                          onClick={() => setQuantity(line.variantId, line.quantity - 1)}
                          aria-label="Decrease"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </Button>
                        <span className="w-8 text-center text-sm font-semibold">{line.quantity}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-md hover:bg-background active:scale-90 transition-transform"
                          onClick={() => setQuantity(line.variantId, line.quantity + 1)}
                          aria-label="Increase"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 active:scale-90 transition-transform"
                        onClick={() => remove(line.variantId)}
                        aria-label="Remove"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t p-4 space-y-3 bg-background/95 backdrop-blur-sm">
              <div className="flex items-center justify-between rounded-lg bg-amber-500/10 px-3 py-2 text-xs font-medium text-amber-700 dark:text-amber-300">
                <span>🪙 Budget Coins Reward:</span>
                <span className="font-bold font-mono">+{Math.floor(subtotal)} Coins</span>
              </div>

              <div className="flex justify-between text-base font-semibold">
                <span>Subtotal</span>
                <span>{formatTk(subtotal)}</span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Delivery charge & discounts calculated at checkout.
              </p>
              <Link href="/checkout" onClick={() => onOpenChange(false)} className="block">
                <Button className="w-full h-12 text-base font-bold shadow-lg shadow-primary/20 active:scale-[0.98] transition-transform" size="lg">
                  Proceed to Checkout
                </Button>
              </Link>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
