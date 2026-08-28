"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { markAllNotificationsReadAction } from "@/actions/notifications";

export function MarkAllReadButton() {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const { toast } = useToast();

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={pending}
      onClick={() => {
        startTransition(async () => {
          const result = await markAllNotificationsReadAction();
          if (!result.ok) {
            toast({ title: "Failed", description: result.error, variant: "destructive" });
            return;
          }
          toast({ title: "All marked as read" });
          router.refresh();
        });
      }}
    >
      {pending ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Check className="mr-1 h-4 w-4" />}
      Mark all read
    </Button>
  );
}
