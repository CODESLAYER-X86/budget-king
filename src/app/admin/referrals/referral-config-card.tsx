"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateReferralBonusAmountAction } from "@/actions/referrals";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Coins, Loader2 } from "lucide-react";

export function ReferralConfigCard({
  initialBonusAmount,
}: {
  initialBonusAmount: number;
}) {
  const [bonus, setBonus] = useState<string>(String(initialBonusAmount));
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const { toast } = useToast();

  function handleSave() {
    const num = parseInt(bonus, 10);
    if (isNaN(num) || num < 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid positive number of coins.",
        variant: "destructive",
      });
      return;
    }

    startTransition(async () => {
      const result = await updateReferralBonusAmountAction(num);
      if (!result.ok) {
        toast({
          title: "Update failed",
          description: result.error,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Referral Bonus Updated",
        description: `Referrers will now receive ${num} coins when a referred friend's order is delivered.`,
      });
      router.refresh();
    });
  }

  return (
    <Card className="border-amber-500/30 bg-amber-50/20 dark:bg-amber-950/10">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Coins className="h-5 w-5 text-amber-500" />
          Referral Bonus Configuration
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">
              Bonus Coins per Successful Referral
            </p>
            <p className="text-xs text-muted-foreground">
              Coins awarded to the referrer automatically when their referred friend completes their first delivered order.
            </p>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative w-32">
              <Input
                type="number"
                min="0"
                step="50"
                value={bonus}
                onChange={(e) => setBonus(e.target.value)}
                className="text-right pr-8 font-semibold"
                disabled={pending}
              />
              <span className="absolute right-2.5 top-2.5 text-xs text-muted-foreground font-medium">
                pts
              </span>
            </div>
            <Button onClick={handleSave} disabled={pending || String(initialBonusAmount) === bonus} size="sm">
              {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
              Save Setting
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
