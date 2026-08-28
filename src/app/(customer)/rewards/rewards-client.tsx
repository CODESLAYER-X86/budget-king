"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Coins, Ticket, History, Copy, Check, Loader2, Gift } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { redeemVoucherAction } from "@/actions/rewards";
import { formatTk } from "@/lib/utils/currency";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Transaction = {
  id: string;
  type: string;
  amount: number;
  balanceAfter: number;
  note: string | null;
  createdAt: string;
  orderNumber: string | null;
  voucherCode: string | null;
  voucherName: string | null;
};

type MyVoucher = {
  id: string;
  code: string;
  status: string;
  redeemedAt: string;
  expiresAt: string;
  usedOnOrderNumber: string | null;
  voucher: {
    name: string;
    type: "FIXED_AMOUNT" | "PERCENTAGE";
    value: number;
    minOrderValue: number;
  };
};

type AvailableVoucher = {
  id: string;
  name: string;
  type: "FIXED_AMOUNT" | "PERCENTAGE";
  value: number;
  coinCost: number;
  minOrderValue: number;
  validDays: number;
};

const TYPE_LABELS: Record<string, string> = {
  EARNED: "Earned",
  EARNED_REVERSAL: "Reversed",
  REDEEMED: "Spent on voucher",
  REDEEMED_REVERSAL: "Refunded",
  EXPIRED: "Expired",
  ADMIN_ADJUSTMENT: "Admin adjustment",
  REFERRAL_BONUS: "Referral bonus",
};

export function RewardsClient({
  balance,
  transactions,
  myVouchers,
  availableVouchers,
}: {
  balance: number;
  transactions: Transaction[];
  myVouchers: MyVoucher[];
  availableVouchers: AvailableVoucher[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [redeemingId, setRedeemingId] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  async function handleRedeem(voucher: AvailableVoucher) {
    if (balance < voucher.coinCost) {
      toast({
        title: "Not enough coins",
        description: `You need ${voucher.coinCost} coins but have ${balance}.`,
        variant: "destructive",
      });
      return;
    }
    if (!confirm(`Redeem ${voucher.coinCost} coins for "${voucher.name}"?`)) return;

    setRedeemingId(voucher.id);
    startTransition(async () => {
      const result = await redeemVoucherAction({ voucherId: voucher.id });
      setRedeemingId(null);
      if (!result.ok) {
        toast({ title: "Failed", description: result.error, variant: "destructive" });
        return;
      }
      toast({
        title: "Voucher redeemed!",
        description: `Code: ${result.voucherCode} — find it under "My Vouchers"`,
      });
      router.refresh();
    });
  }

  function copyCode(code: string) {
    navigator.clipboard?.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Rewards</h1>
        <p className="text-sm text-muted-foreground">
          Earn coins on delivered orders, redeem them for vouchers.
        </p>
      </div>

      {/* Balance Hero */}
      <Card className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/30">
        <CardContent className="p-6 flex items-center gap-4">
          <div className="rounded-full bg-primary/20 p-4">
            <Coins className="h-10 w-10 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Your Coin Balance</p>
            <p className="text-4xl font-bold">{balance.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Earn 1 coin per tk 1 spent on delivered orders (with qualifying rules)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Available vouchers to redeem */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Gift className="h-4 w-4 text-primary" /> Redeem Your Coins
          </CardTitle>
        </CardHeader>
        <CardContent>
          {availableVouchers.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No vouchers available for redemption right now.
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {availableVouchers.map((v) => {
                const canAfford = balance >= v.coinCost;
                return (
                  <div
                    key={v.id}
                    className="rounded-lg border bg-card p-4 flex flex-col gap-2"
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-semibold">{v.name}</p>
                      <Badge variant={canAfford ? "default" : "secondary"}>
                        {v.type === "FIXED_AMOUNT" ? formatTk(v.value) : `${v.value}%`} off
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Min order: tk {v.minOrderValue} • Valid {v.validDays} days after redemption
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-sm font-medium text-amber-600">
                        {v.coinCost.toLocaleString()} coins
                      </span>
                      <Button
                        size="sm"
                        disabled={!canAfford || pending}
                        onClick={() => handleRedeem(v)}
                      >
                        {redeemingId === v.id && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
                        {canAfford ? "Redeem" : "Not enough"}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* My vouchers */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Ticket className="h-4 w-4 text-primary" /> My Vouchers
          </CardTitle>
        </CardHeader>
        <CardContent>
          {myVouchers.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No vouchers yet. Redeem your coins above to get one.
            </p>
          ) : (
            <div className="space-y-2">
              {myVouchers.map((v) => {
                const expired = v.expiresAt <= new Date().toISOString();
                const isActive = v.status === "ACTIVE" && !expired;
                return (
                  <div
                    key={v.id}
                    className="rounded-md border p-3 flex items-center justify-between"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm">{v.voucher.name}</p>
                        <Badge
                          variant={
                            isActive ? "default" :
                            v.status === "USED" ? "secondary" :
                            v.status === "REVOKED" ? "destructive" :
                            "secondary"
                          }
                          className="text-xs"
                        >
                          {v.status === "ACTIVE" && expired ? "EXPIRED" : v.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {v.voucher.type === "FIXED_AMOUNT"
                          ? `${formatTk(v.voucher.value)} off`
                          : `${v.voucher.value}% off`}{" "}
                        {v.voucher.minOrderValue > 0 && `• Min tk ${v.voucher.minOrderValue}`}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Expires: {new Date(v.expiresAt).toLocaleDateString("en-BD")}
                        {v.usedOnOrderNumber && ` • Used on order ${v.usedOnOrderNumber}`}
                      </p>
                    </div>
                    {isActive && (
                      <button
                        onClick={() => copyCode(v.code)}
                        className="font-mono text-sm font-semibold bg-secondary px-3 py-1.5 rounded-md hover:bg-accent flex items-center gap-1"
                      >
                        {v.code}
                        {copiedCode === v.code ? (
                          <Check className="h-3 w-3 text-green-600" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transaction history */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <History className="h-4 w-4 text-primary" /> Coin History
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {transactions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              No coin transactions yet. Place an order and have it delivered to earn coins.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>When</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="hidden md:table-cell">Source</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right hidden md:table-cell">Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(t.createdAt).toLocaleString("en-BD", {
                        day: "numeric", month: "short",
                        hour: "2-digit", minute: "2-digit",
                      })}
                    </TableCell>
                    <TableCell className="text-sm">
                      {TYPE_LABELS[t.type] ?? t.type.replace(/_/g, " ")}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground hidden md:table-cell">
                      {t.orderNumber && `Order ${t.orderNumber}`}
                      {t.voucherCode && `Voucher ${t.voucherCode}`}
                      {!t.orderNumber && !t.voucherCode && (t.note ?? "—")}
                    </TableCell>
                    <TableCell className={`text-right font-semibold text-sm ${t.amount >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {t.amount >= 0 ? "+" : ""}
                      {t.amount.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right text-sm hidden md:table-cell">
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
