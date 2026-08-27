"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { updateOrderStatusAction } from "@/actions/orders-status";

export function OrderStatusActions({
  orderId,
  currentStatus,
  nextStatus,
  nextLabel,
  variant = "default",
}: {
  orderId: string;
  currentStatus: string;
  nextStatus: string;
  nextLabel: string;
  variant?: "default" | "destructive";
}) {
  const [pending, startTransition] = useTransition();
  const [reason, setReason] = useState("");
  const [showReason, setShowReason] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  function handleClick() {
    if (nextStatus === "CANCELLED") {
      setShowReason(true);
      return;
    }
    confirmAndSubmit("");
  }

  function confirmAndSubmit(r: string) {
    startTransition(async () => {
      const result = await updateOrderStatusAction({
        orderId,
        newStatus: nextStatus,
        reason: r || undefined,
      });
      if (!result.ok) {
        toast({ title: "Failed", description: result.error, variant: "destructive" });
        return;
      }
      toast({ title: "Status updated", description: `${currentStatus} → ${nextStatus}` });
      router.refresh();
    });
  }

  if (showReason) {
    return (
      <div className="flex flex-col gap-2 w-full">
        <input
          type="text"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Cancellation reason (optional)"
          className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
        />
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="destructive"
            disabled={pending}
            onClick={() => confirmAndSubmit(reason)}
          >
            {pending && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
            Confirm Cancel
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setShowReason(false)}>
            Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Button
      size="sm"
      variant={variant}
      disabled={pending}
      onClick={handleClick}
    >
      {pending && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
      {nextLabel}
    </Button>
  );
}
