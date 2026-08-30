"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Coins, Tag, History, Copy, Check, ShoppingBag, ArrowRight, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatTk } from "@/lib/utils/currency";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { RewardSettingData } from "@/actions/rewards";

type Transaction = {
  id: string;
  type: string;
  amount: number;
  balanceAfter: number;
  note: string | null;
  createdAt: string;
  orderNumber: string | null;
};

type ActiveCoupon = {
  id: string;
  code: string;
  description: string | null;
  type: "FIXED_AMOUNT" | "PERCENTAGE";
  value: number;
  maxDiscount: number | null;
  minOrderValue: number;
  expiresAt: string | null;
};

const TYPE_LABELS: Record<string, string> = {
  EARNED: "Earned on Order",
  EARNED_REVERSAL: "Order Reversed",
  REDEEMED: "Redeemed at Checkout",
  REDEEMED_REVERSAL: "Refunded to Wallet",
  EXPIRED: "Expired",
  ADMIN_ADJUSTMENT: "Admin Adjustment",
  REFERRAL_BONUS: "Referral Bonus",
};

export function RewardsClient({
  balance,
  transactions,
  activeCoupons,
  rewardSettings,
}: {
  balance: number;
  transactions: Transaction[];
  activeCoupons: ActiveCoupon[];
  rewardSettings?: RewardSettingData;
}) {
  const { toast } = useToast();
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const coinsPerTk = rewardSettings?.coinsPerTk ?? 10;
  const maxPercent = rewardSettings?.maxRedemptionPercent ?? 20;
  const cashValue = Math.floor(balance / (coinsPerTk || 10));

  function handleCopy(code: string) {
    navigator.clipboard?.writeText(code);
    setCopiedCode(code);
    toast({
      title: `Code "${code}" Copied!`,
      description: "Paste it into the promo code box at checkout.",
    });
    setTimeout(() => setCopiedCode(null), 2500);
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
          Budget Coins & Rewards
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Earn Budget Coins automatically on every order and save instantly at checkout with 1 tap.
        </p>
      </div>

      {/* Hero Wallet Card */}
      <Card className="rounded-3xl border-amber-500/30 bg-gradient-to-br from-amber-500/15 via-card to-amber-500/5 shadow-md overflow-hidden">
        <CardContent className="p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4 sm:gap-5">
              <div className="rounded-2xl bg-amber-500/20 p-4 text-amber-600 dark:text-amber-400 shadow-inner shrink-0">
                <Coins className="h-12 w-12" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">
                  Your Coin Balance
                </p>
                <p className="text-4xl sm:text-5xl font-black text-foreground tracking-tight font-mono">
                  {balance.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">
                  Earn 1 coin for every ৳1 spent on delivered orders
                </p>
              </div>
            </div>

            {/* Direct Cash Value Card */}
            <div className="rounded-2xl border border-amber-500/30 bg-background/80 p-4 sm:p-5 sm:text-right shadow-xs backdrop-blur-xs space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Instant Checkout Value</p>
              <p className="text-2xl sm:text-3xl font-black text-green-600 dark:text-green-400">
                ≈ {formatTk(cashValue)} Off
              </p>
              <p className="text-[11px] text-muted-foreground font-medium">
                Conversion Rate: <strong>{coinsPerTk} Coins = ৳1</strong>
              </p>
            </div>
          </div>

          {/* 3-Step 1-Tap Redemption Guide */}
          <div className="border-t border-amber-500/20 pt-5">
            <p className="text-xs font-bold uppercase tracking-wider text-foreground mb-3 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-amber-500" /> How to Redeem Coins (1-Tap Direct Checkout)
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-xl border bg-background/60 p-3 flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                  1
                </span>
                <div>
                  <p className="text-xs font-semibold text-foreground">Add to Cart</p>
                  <p className="text-[11px] text-muted-foreground">Shop your favorite shirts and products.</p>
                </div>
              </div>

              <div className="rounded-xl border bg-background/60 p-3 flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-xs font-bold text-amber-600">
                  2
                </span>
                <div>
                  <p className="text-xs font-semibold text-foreground">Check the Coin Box</p>
                  <p className="text-[11px] text-muted-foreground">Toggle "Redeem Coins" at checkout (up to {maxPercent}% off).</p>
                </div>
              </div>

              <div className="rounded-xl border bg-background/60 p-3 flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-500/20 text-xs font-bold text-green-600">
                  3
                </span>
                <div>
                  <p className="text-xs font-semibold text-foreground">Instant Cash Discount</p>
                  <p className="text-[11px] text-muted-foreground">Pay less cash when your order arrives via COD.</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Store Promo Codes & Coupons */}
      <Card className="rounded-3xl border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Tag className="h-5 w-5 text-primary" /> Active Store Promo Codes
            </span>
            <Link href="/shop" className="text-xs font-semibold text-primary hover:underline flex items-center gap-1">
              Shop Now <ArrowRight className="h-3 w-3" />
            </Link>
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Copy any promo code below and apply it at checkout for instant discounts.
          </p>
        </CardHeader>
        <CardContent>
          {activeCoupons.length === 0 ? (
            <div className="rounded-2xl border border-dashed p-8 text-center">
              <Tag className="mx-auto h-8 w-8 text-muted-foreground/40 mb-2" />
              <p className="text-sm font-medium text-muted-foreground">
                No public promo codes right now. Stay tuned for seasonal sales!
              </p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {activeCoupons.map((coupon) => (
                <div
                  key={coupon.id}
                  className="rounded-2xl border border-border/80 bg-gradient-to-br from-card via-card to-secondary/30 p-4 flex flex-col justify-between gap-3 shadow-2xs hover:border-primary/40 transition-colors"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <Badge className="bg-primary text-primary-foreground font-bold text-xs">
                        {coupon.type === "FIXED_AMOUNT"
                          ? `${formatTk(coupon.value)} OFF`
                          : `${coupon.value}% OFF`}
                      </Badge>
                      {coupon.maxDiscount && (
                        <span className="text-[10px] text-muted-foreground">
                          Max {formatTk(coupon.maxDiscount)}
                        </span>
                      )}
                    </div>

                    <p className="font-bold text-sm text-foreground">
                      {coupon.description || `Special ${coupon.code} Discount`}
                    </p>

                    <p className="text-[11px] text-muted-foreground">
                      {coupon.minOrderValue > 0
                        ? `Min order ${formatTk(coupon.minOrderValue)}`
                        : "No minimum purchase requirement"}
                    </p>

                    {coupon.expiresAt && (
                      <p className="text-[10px] text-muted-foreground">
                        Valid until: {new Date(coupon.expiresAt).toLocaleDateString("en-BD", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-border/60">
                    <span className="font-mono text-xs font-bold text-foreground bg-secondary/80 px-2.5 py-1 rounded-lg">
                      {coupon.code}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCopy(coupon.code)}
                      className="h-8 text-xs font-semibold rounded-xl active:scale-95 transition-transform"
                    >
                      {copiedCode === coupon.code ? (
                        <>
                          <Check className="mr-1.5 h-3.5 w-3.5 text-green-600" /> Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="mr-1.5 h-3.5 w-3.5" /> Copy Code
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Coin Transaction History */}
      <Card className="rounded-3xl border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <History className="h-5 w-5 text-primary" /> Coin Activity Log
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Complete record of your earned and redeemed Budget Coins.
          </p>
        </CardHeader>
        <CardContent className="p-0">
          {transactions.length === 0 ? (
            <div className="p-8 text-center">
              <Coins className="mx-auto h-8 w-8 text-muted-foreground/40 mb-2" />
              <p className="text-sm text-muted-foreground">
                No coin activity yet. Place your first order to start earning!
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[140px]">Date</TableHead>
                  <TableHead>Activity</TableHead>
                  <TableHead className="hidden md:table-cell">Details</TableHead>
                  <TableHead className="text-right">Coins</TableHead>
                  <TableHead className="text-right hidden sm:table-cell">Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((t) => (
                  <TableRow key={t.id} className="hover:bg-muted/40">
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(t.createdAt).toLocaleString("en-BD", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </TableCell>
                    <TableCell className="text-xs sm:text-sm font-medium">
                      {TYPE_LABELS[t.type] ?? t.type.replace(/_/g, " ")}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground hidden md:table-cell">
                      {t.orderNumber ? `Order #${t.orderNumber}` : t.note ?? "—"}
                    </TableCell>
                    <TableCell className={`text-right font-bold text-xs sm:text-sm font-mono ${t.amount >= 0 ? "text-green-600 dark:text-green-400" : "text-amber-600 dark:text-amber-400"}`}>
                      {t.amount >= 0 ? "+" : ""}
                      {t.amount.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right text-xs sm:text-sm font-mono text-muted-foreground hidden sm:table-cell">
                      {t.balanceAfter.toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
