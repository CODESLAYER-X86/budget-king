"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Check, X, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { moderateReviewAction } from "@/actions/reviews";

export function ReviewActions({ reviewId }: { reviewId: string }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const { toast } = useToast();

  function handleAction(action: "APPROVE" | "REJECT") {
    startTransition(async () => {
      const result = await moderateReviewAction({ reviewId, action });
      if (!result.ok) {
        toast({ title: "Failed", description: result.error, variant: "destructive" });
        return;
      }
      toast({ title: `Review ${action.toLowerCase()}` });
      router.refresh();
    });
  }

  return (
    <div className="flex justify-center gap-1">
      <Button
        size="sm"
        variant="ghost"
        disabled={pending}
        onClick={() => handleAction("APPROVE")}
        className="text-green-600 hover:text-green-700"
      >
        {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
      </Button>
      <Button
        size="sm"
        variant="ghost"
        disabled={pending}
        onClick={() => handleAction("REJECT")}
        className="text-destructive"
      >
        <X className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
