"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Coins,
  Settings,
  Percent,
  Sliders,
  CheckCircle2,
  Loader2,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { formatTk } from "@/lib/utils/currency";
import {
  updateRewardSettingsAction,
  type RewardSettingData,
} from "@/actions/rewards";

export function RewardSettingsCard({
  initialSettings,
}: {
  initialSettings: RewardSettingData;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();

  const [coinsPerTk, setCoinsPerTk] = useState(initialSettings.coinsPerTk.toString());
  const [coinsEarnedPerTk, setCoinsEarnedPerTk] = useState(initialSettings.coinsEarnedPerTk.toString());
  const [maxRedemptionPercent, setMaxRedemptionPercent] = useState(initialSettings.maxRedemptionPercent.toString());
  const [minCoinsToRedeem, setMinCoinsToRedeem] = useState(initialSettings.minCoinsToRedeem.toString());
  const [isDirectRedemptionActive, setIsDirectRedemptionActive] = useState(initialSettings.isDirectRedemptionActive);

  const numCoinsPerTk = Number(coinsPerTk) || 10;
  const numMaxPercent = Number(maxRedemptionPercent) || 20;

  function setPreset(rate: number) {
    setCoinsPerTk(rate.toString());
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await updateRewardSettingsAction({
        coinsPerTk: Number(coinsPerTk) || 10,
        coinsEarnedPerTk: Number(coinsEarnedPerTk) || 1,
        maxRedemptionPercent: Number(maxRedemptionPercent) || 20,
        minCoinsToRedeem: Number(minCoinsToRedeem) || 10,
        isDirectRedemptionActive,
      });

      if (!result.ok) {
        toast({
          title: "Save failed",
          description: result.error,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Reward Settings Saved",
        description: `Direct coin exchange rate updated to ${coinsPerTk} Coins = ৳1`,
      });
      router.refresh();
    });
  }

  return (
    <Card className="border-amber-500/20 bg-gradient-to-br from-card to-amber-500/5">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-amber-500/10 p-2 text-amber-600 dark:text-amber-400">
              <Coins className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base">Coin Redemption Rate & Rules</CardTitle>
              <CardDescription className="text-xs">
                Configure direct coin-to-Taka conversion rate for customer checkout.
              </CardDescription>
            </div>
          </div>
          <Badge variant="outline" className="border-amber-500/30 text-amber-600">
            {coinsPerTk} Coins = ৳1
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSave} className="space-y-4">
          {/* Rate Presets */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold">
              Exchange Rate Presets (Coins per ৳1)
            </Label>
            <div className="flex flex-wrap gap-2">
              {[10, 20, 30, 50, 100].map((rate) => (
                <Button
                  key={rate}
                  type="button"
                  size="sm"
                  variant={Number(coinsPerTk) === rate ? "default" : "outline"}
                  onClick={() => setPreset(rate)}
                  className="h-8 text-xs font-medium"
                >
                  {rate} Coins = ৳1 {rate === 10 ? "(Default)" : ""}
                </Button>
              ))}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="coinsPerTk" className="text-xs">
                Direct Coins per ৳1 Discount <span className="text-destructive">*</span>
              </Label>
              <Input
                id="coinsPerTk"
                type="number"
                min="1"
                step="1"
                value={coinsPerTk}
                onChange={(e) => setCoinsPerTk(e.target.value)}
                required
                className="h-9 font-medium"
              />
              <p className="text-[11px] text-muted-foreground">
                e.g. Set to 30 so 300 coins gives ৳10 discount.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="maxRedemptionPercent" className="text-xs">
                Max Order Discount Cap (%) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="maxRedemptionPercent"
                type="number"
                min="1"
                max="100"
                value={maxRedemptionPercent}
                onChange={(e) => setMaxRedemptionPercent(e.target.value)}
                required
                className="h-9 font-medium"
              />
              <p className="text-[11px] text-muted-foreground">
                Max % of order subtotal payable via coins (e.g. 20%).
              </p>
            </div>
          </div>

          {/* Live Simulator Preview */}
          <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-3 text-xs space-y-1">
            <p className="font-semibold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-amber-600" /> Live Checkout Simulation
            </p>
            <p className="text-muted-foreground">
              • A customer with <span className="font-bold text-foreground">{(numCoinsPerTk * 20).toLocaleString()} Coins</span> gets a <span className="font-bold text-green-600">{formatTk(20)}</span> discount.
            </p>
            <p className="text-muted-foreground">
              • On a <span className="font-bold text-foreground">৳1,000 order</span>, max coin discount allowed is <span className="font-bold text-green-600">{formatTk((1000 * numMaxPercent) / 100)}</span> ({numMaxPercent}%), requiring <span className="font-bold text-foreground">{(((1000 * numMaxPercent) / 100) * numCoinsPerTk).toLocaleString()} coins</span>.
            </p>
          </div>

          {/* Direct Redemption Active Switch */}
          <div className="flex items-center justify-between rounded-lg border p-3 bg-background/50">
            <div className="space-y-0.5">
              <Label htmlFor="directRedeem" className="text-xs font-semibold">
                Enable 1-Tap Direct Checkout Redemption
              </Label>
              <p className="text-[11px] text-muted-foreground">
                When enabled, customers can spend coins directly on the checkout screen.
              </p>
            </div>
            <Switch
              id="directRedeem"
              checked={isDirectRedemptionActive}
              onCheckedChange={setIsDirectRedemptionActive}
            />
          </div>

          <div className="flex justify-end pt-1">
            <Button type="submit" disabled={pending} className="gap-2">
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              Save Redemption Settings
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
