"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { applyReferralCodeAction } from "@/actions/referrals";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Gift, Loader2, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function ClaimReferralCard({
  existingReferrerName,
}: {
  existingReferrerName?: string | null;
}) {
  const [code, setCode] = useState("");
  const [pending, startTransition] = useTransition();
  const [referrer, setReferrer] = useState<string | null>(existingReferrerName ?? null);
  const router = useRouter();
  const { toast } = useToast();

  function handleApply() {
    if (!code.trim()) return;

    startTransition(async () => {
      const result = await applyReferralCodeAction(code);
      if (!result.ok) {
        toast({
          title: "Failed to apply referral code",
          description: result.error,
          variant: "destructive",
        });
        return;
      }

      setReferrer(result.referrerName);
      toast({
        title: "Referral Code Applied! 🎉",
        description: `Your account is linked to ${result.referrerName}. You and your friend will earn rewards upon your first delivered order!`,
      });
      setCode("");
      router.refresh();
    });
  }

  if (referrer) {
    return (
      <Card className="border-green-500/30 bg-green-50/50 dark:bg-green-950/20">
        <CardContent className="p-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">Referred by friend</p>
              <p className="text-xs text-muted-foreground">
                Linked to <span className="font-semibold text-foreground">{referrer}</span>
              </p>
            </div>
          </div>
          <Badge variant="outline" className="text-xs text-green-700 dark:text-green-300 border-green-300">
            Active Referral
          </Badge>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Gift className="h-4 w-4 text-primary" />
          Have a Friend&apos;s Referral Code?
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground mb-3">
          Enter a friend&apos;s code below to link your account. When your first order is delivered, your friend earns bonus reward coins!
        </p>
        <div className="flex gap-2">
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="e.g. TAMI-BK423"
            className="font-mono uppercase text-sm max-w-xs"
            disabled={pending}
          />
          <Button onClick={handleApply} disabled={pending || !code.trim()} size="sm">
            {pending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
            Apply Code
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
