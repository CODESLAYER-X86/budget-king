"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Check, Share2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function ReferralActions({ link, code }: { link: string; code: string }) {
  const [copied, setCopied] = useState<"link" | "code" | null>(null);
  const { toast } = useToast();

  function copy(text: string, type: "link" | "code") {
    navigator.clipboard?.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
    toast({ title: `Copied ${type}!` });
  }

  function share() {
    const shareData = {
      title: "Budget King BD — Quality That Fits Your Budget",
      text: `Shop quality shirts with Cash on Delivery at Budget King BD! Use my referral code ${code} for special rewards:`,
      url: link,
    };
    if (navigator.share) {
      navigator.share(shareData).catch(() => {});
    } else {
      copy(link, "link");
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      <div className="flex-1 min-w-[200px] flex items-center gap-2 rounded-md border bg-background px-3 py-2">
        <span className="text-sm font-mono truncate flex-1">{link}</span>
        <button
          onClick={() => copy(link, "link")}
          className="text-primary hover:text-primary/80"
          aria-label="Copy link"
        >
          {copied === "link" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </button>
      </div>
      <Button onClick={() => copy(code, "code")} variant="outline">
        {copied === "code" ? <Check className="mr-1 h-4 w-4" /> : <Copy className="mr-1 h-4 w-4" />}
        Copy Code
      </Button>
      <Button onClick={share}>
        <Share2 className="mr-1 h-4 w-4" /> Share
      </Button>
    </div>
  );
}
