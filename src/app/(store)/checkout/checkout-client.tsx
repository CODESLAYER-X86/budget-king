"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  ShoppingBag,
  Truck,
  ShieldCheck,
  MapPin,
  Plus,
  Loader2,
  Tag,
  Coins,
  Sparkles,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/lib/cart-store";
import { formatTk } from "@/lib/utils/currency";
import { useToast } from "@/hooks/use-toast";
import { placeOrderAction } from "@/actions/orders";
import { validateDiscountCodeAction } from "@/actions/coupons";

interface DeliveryZone {
  id: string;
  name: string;
  charge: number;
  estimatedDays: number;
  divisions: string[];
}

interface SavedAddress {
  id: string;
  label: string | null;
  fullName: string;
  phone: string;
  division: string;
  district: string;
  area: string;
  addressLine: string;
  isDefault: boolean;
}

export function CheckoutClient({
  deliveryZones,
  addresses,
  user,
  coinBalance = 0,
}: {
  deliveryZones: DeliveryZone[];
  addresses: SavedAddress[];
  user: { fullName: string; phone: string; email: string } | null;
  coinBalance?: number;
}) {
  const { lines, subtotal: calcSubtotal, clear } = useCart();
  const subtotal = calcSubtotal();
  const { toast } = useToast();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [selectedZoneId, setSelectedZoneId] = useState(deliveryZones[0]?.id ?? "");
  const [useSavedAddress, setUseSavedAddress] = useState<string | "new">(addresses[0]?.id ?? "new");

  const [form, setForm] = useState({
    fullName: user?.fullName ?? "",
    phone: user?.phone ?? "",
    email: user?.email ?? "",
    division: addresses[0]?.division ?? "",
    district: addresses[0]?.district ?? "",
    area: addresses[0]?.area ?? "",
    addressLine: addresses[0]?.addressLine ?? "",
    notes: "",
  });

  const [voucherCode, setVoucherCode] = useState("");
  const [voucherDiscount, setVoucherDiscount] = useState(0);
  const [voucherLabel, setVoucherLabel] = useState<string | null>(null);
  const [voucherError, setVoucherError] = useState<string | null>(null);
  const [validatingVoucher, setValidatingVoucher] = useState(false);

  // Direct Coin Redemption State (10 Coins = ৳1)
  const [useCoins, setUseCoins] = useState(false);

  const selectedZone = useMemo(
    () => deliveryZones.find((z) => z.id === selectedZoneId),
    [deliveryZones, selectedZoneId]
  );

  const remainingAfterCoupon = Math.max(0, subtotal - voucherDiscount);
  const maxCoinsTk = Math.min(
    remainingAfterCoupon,
    Math.max(50, Math.floor(remainingAfterCoupon * 0.20)),
    Math.floor(coinBalance / 10)
  );
  const coinDiscount = useCoins && maxCoinsTk > 0 ? maxCoinsTk : 0;
  const coinsToRedeem = coinDiscount * 10;

  const deliveryCharge = selectedZone?.charge ?? 0;
  const total = Math.max(0, subtotal - voucherDiscount - coinDiscount + deliveryCharge);

  async function handleApplyVoucher() {
    if (!voucherCode.trim()) return;
    setValidatingVoucher(true);
    setVoucherError(null);
    try {
      const res = await validateDiscountCodeAction(voucherCode, subtotal);
      if (!res.ok) {
        setVoucherError(res.error ?? "Invalid code");
        setVoucherDiscount(0);
        setVoucherLabel(null);
      } else {
        setVoucherDiscount(res.discount ?? 0);
        setVoucherLabel(res.label ?? res.code ?? null);
        toast({
          title: res.type === "COUPON" ? "Promo code applied!" : "Voucher applied!",
          description: `Saved ${formatTk(res.discount ?? 0)} with ${res.code}`,
        });
      }
    } catch {
      setVoucherError("Failed to validate code");
    }
    setValidatingVoucher(false);
  }

  function handleRemoveVoucher() {
    setVoucherCode("");
    setVoucherDiscount(0);
    setVoucherLabel(null);
    setVoucherError(null);
  }

  if (lines.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <ShoppingBag className="mx-auto h-12 w-12 text-muted-foreground" />
        <h1 className="mt-4 text-2xl font-bold">Your cart is empty</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Add products to your cart before checking out.
        </p>
        <Button className="mt-4" onClick={() => router.push("/shop")}>
          Continue Shopping
        </Button>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);

    const result = await placeOrderAction({
      customer: {
        fullName: form.fullName,
        phone: form.phone,
        email: form.email || undefined,
      },
      address: {
        fullName: form.fullName,
        phone: form.phone,
        division: form.division,
        district: form.district,
        area: form.area || undefined,
        addressLine: form.addressLine,
      },
      deliveryZoneId: selectedZoneId,
      notes: form.notes || undefined,
      voucherCode: voucherCode || undefined,
      redeemCoins: useCoins,
      lines: lines.map((l) => ({ variantId: l.variantId, quantity: l.quantity })),
    });

    setSubmitting(false);

    if (!result.ok) {
      toast({
        title: "Checkout failed",
        description: result.error,
        variant: "destructive",
      });
      return;
    }

    clear();
    toast({
      title: "Order placed successfully!",
      description: `Order number: ${result.orderNumber}`,
    });
    router.push(`/order/${result.orderNumber}`);
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold tracking-tight">Checkout</h1>

      <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[1fr_400px]">
        <div className="space-y-6">
          {/* Saved addresses (if logged in) */}
          {addresses.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Delivery Address</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <RadioGroup
                  value={useSavedAddress}
                  onValueChange={(v) => {
                    setUseSavedAddress(v);
                    if (v !== "new") {
                      const a = addresses.find((x) => x.id === v);
                      if (a) {
                        setForm((f) => ({
                          ...f,
                          fullName: a.fullName,
                          phone: a.phone,
                          division: a.division,
                          district: a.district,
                          area: a.area,
                          addressLine: a.addressLine,
                        }));
                      }
                    }
                  }}
                >
                  {addresses.map((a) => (
                    <div key={a.id} className="flex items-start gap-2 rounded-md border p-3">
                      <RadioGroupItem value={a.id} id={a.id} className="mt-1" />
                      <label htmlFor={a.id} className="flex-1 cursor-pointer text-sm">
                        <span className="font-medium">{a.label ?? "Address"}: </span>
                        <span>{a.addressLine}, {a.district}, {a.division}</span>
                        <span className="block text-xs text-muted-foreground">
                          {a.fullName} • {a.phone}
                        </span>
                      </label>
                    </div>
                  ))}
                  <div className="flex items-start gap-2 rounded-md border p-3">
                    <RadioGroupItem value="new" id="new" className="mt-1" />
                    <label htmlFor="new" className="flex-1 cursor-pointer text-sm font-medium">
                      Enter a new address
                    </label>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>
          )}

          {/* Customer info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Customer Information</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label htmlFor="fullName">Full Name *</Label>
                <Input
                  id="fullName"
                  required
                  value={form.fullName}
                  onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  type="tel"
                  required
                  pattern="01[0-9]{9}"
                  placeholder="01XXXXXXXXX"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="email">Email (optional)</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                />
              </div>
            </CardContent>
          </Card>

          {/* Address */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Delivery Address</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="division">Division *</Label>
                <Input
                  id="division"
                  required
                  placeholder="e.g. Dhaka"
                  value={form.division}
                  onChange={(e) => setForm((f) => ({ ...f, division: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="district">District *</Label>
                <Input
                  id="district"
                  required
                  placeholder="e.g. Dhaka"
                  value={form.district}
                  onChange={(e) => setForm((f) => ({ ...f, district: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="area">Area (optional)</Label>
                <Input
                  id="area"
                  placeholder="e.g. Mirpur 10"
                  value={form.area}
                  onChange={(e) => setForm((f) => ({ ...f, area: e.target.value }))}
                />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="addressLine">Full Address *</Label>
                <Textarea
                  id="addressLine"
                  required
                  rows={3}
                  placeholder="House, road, building details..."
                  value={form.addressLine}
                  onChange={(e) => setForm((f) => ({ ...f, addressLine: e.target.value }))}
                />
              </div>
            </CardContent>
          </Card>

          {/* Delivery zone */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Delivery Method</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <RadioGroup value={selectedZoneId} onValueChange={setSelectedZoneId}>
                {deliveryZones.map((zone) => (
                  <div key={zone.id} className="flex items-start gap-3 rounded-md border p-3">
                    <RadioGroupItem value={zone.id} id={zone.id} className="mt-1" />
                    <label htmlFor={zone.id} className="flex-1 cursor-pointer">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm flex items-center gap-2">
                          <Truck className="h-4 w-4 text-primary" />
                          {zone.name}
                        </span>
                        <span className="text-sm font-semibold">{formatTk(zone.charge)}</span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Estimated delivery: {zone.estimatedDays} day{zone.estimatedDays === 1 ? "" : "s"}
                      </p>
                    </label>
                  </div>
                ))}
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Order Notes (optional)</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                rows={3}
                placeholder="Special instructions for delivery..."
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              />
            </CardContent>
          </Card>
        </div>

        {/* Summary */}
        <div className="space-y-4">
          <Card className="lg:sticky lg:top-20">
            <CardHeader>
              <CardTitle className="text-base">Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2 max-h-64 overflow-y-auto bk-scroll">
                {lines.map((line) => (
                  <div key={line.variantId} className="flex gap-3">
                    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md bg-muted">
                      {line.image ? (
                        <Image
                          src={line.image}
                          alt={line.name}
                          fill
                          sizes="56px"
                          className="object-cover"
                        />
                      ) : null}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium line-clamp-1">{line.name}</p>
                      <p className="text-xs text-muted-foreground">{line.variantLabel}</p>
                      <p className="text-xs">
                        {line.quantity} × {formatTk(line.unitPrice)}
                      </p>
                    </div>
                    <p className="text-xs font-semibold">
                      {formatTk(line.quantity * line.unitPrice)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="space-y-1.5 border-t pt-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatTk(subtotal)}</span>
                </div>

                {/* Promo Code / Voucher */}
                <div className="space-y-2 pt-2 border-t">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold flex items-center gap-1.5">
                      <Tag className="h-3.5 w-3.5 text-primary" /> Promo Code or Voucher
                    </Label>
                  </div>

                  {voucherDiscount > 0 && voucherLabel ? (
                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-green-500/10 border border-green-500/20 text-xs">
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-600 shrink-0" />
                        <div>
                          <p className="font-semibold text-green-700 dark:text-green-400">
                            {voucherCode} Applied
                          </p>
                          <p className="text-[11px] text-green-600/90 dark:text-green-500">
                            {voucherLabel} • Saving {formatTk(voucherDiscount)}
                          </p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive"
                        onClick={handleRemoveVoucher}
                      >
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={voucherCode}
                          onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                          placeholder="Code (e.g. EID50, BKVC-...)"
                          className="flex h-9 flex-1 rounded-md border border-input bg-background px-3 text-xs font-mono uppercase"
                        />
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          onClick={handleApplyVoucher}
                          disabled={validatingVoucher || !voucherCode.trim()}
                        >
                          {validatingVoucher ? <Loader2 className="h-3 w-3 animate-spin" /> : "Apply"}
                        </Button>
                      </div>
                      {voucherError && (
                        <p className="text-xs text-destructive">{voucherError}</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Direct Coin Redemption (1-Tap Daraz/Shopee Style) */}
                {user && coinBalance >= 10 && (
                  <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="rounded-full bg-amber-500/20 p-1.5 text-amber-600 dark:text-amber-400">
                          <Coins className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                            Redeem Budget Coins
                            <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30">
                              {coinBalance.toLocaleString()} Coins
                            </Badge>
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            10 Coins = ৳1 discount
                          </p>
                        </div>
                      </div>
                    </div>

                    {maxCoinsTk > 0 ? (
                      <label className="flex items-center gap-2 cursor-pointer pt-1 border-t border-amber-500/15">
                        <input
                          type="checkbox"
                          checked={useCoins}
                          onChange={(e) => setUseCoins(e.target.checked)}
                          className="h-4 w-4 rounded border-amber-500 text-primary focus:ring-amber-500"
                        />
                        <span className="text-xs font-medium text-foreground">
                          Use <span className="font-bold text-amber-600 dark:text-amber-400">{maxCoinsTk * 10} coins</span> to save <span className="font-bold text-green-600">{formatTk(maxCoinsTk)}</span>
                        </span>
                      </label>
                    ) : (
                      <p className="text-[11px] text-muted-foreground italic">
                        Coin redemption not applicable with current order amount.
                      </p>
                    )}
                  </div>
                )}

                {/* Breakdown */}
                {voucherDiscount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Coupon / Voucher discount</span>
                    <span>-{formatTk(voucherDiscount)}</span>
                  </div>
                )}

                {coinDiscount > 0 && (
                  <div className="flex justify-between text-amber-600">
                    <span className="flex items-center gap-1">
                      <Coins className="h-3.5 w-3.5" /> Budget Coins ({coinsToRedeem} coins)
                    </span>
                    <span>-{formatTk(coinDiscount)}</span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span className="text-muted-foreground">Delivery</span>
                  <span>{formatTk(deliveryCharge)}</span>
                </div>
                <div className="flex justify-between border-t pt-2 text-base font-semibold">
                  <span>Total</span>
                  <span>{formatTk(total)}</span>
                </div>
              </div>

              {/* COD info */}
              <div className="rounded-md bg-secondary/50 p-3 text-xs">
                <p className="flex items-center gap-2 font-medium">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  Cash on Delivery
                </p>
                <p className="mt-1 text-muted-foreground">
                  Pay {formatTk(total)} in cash when your order arrives. No online payment needed.
                </p>
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={submitting}
              >
                {submitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <ShoppingBag className="mr-2 h-4 w-4" />
                )}
                Place COD Order
              </Button>

              <p className="text-center text-xs text-muted-foreground">
                By placing this order, you agree to our terms.
                Your card is not required — pay with cash on delivery.
              </p>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  );
}
