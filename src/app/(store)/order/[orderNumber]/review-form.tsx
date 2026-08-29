"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function ReviewForm({
  orderId,
  productId,
  productName,
}: {
  orderId: string;
  productId: string;
  productName: string;
}) {
  const [rating, setRating] = useState(5);
  const [hover, setHover] = useState(0);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { toast } = useToast();

  async function handleSubmit() {
    setSubmitting(true);
    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, productId, rating, title: title || undefined, content: content || undefined }),
    });
    const data = await res.json();
    setSubmitting(false);

    if (!res.ok) {
      toast({
        title: "Review failed",
        description: data.error ?? "Please try again",
        variant: "destructive",
      });
      return;
    }

    toast({ title: "Review submitted", description: "It will appear after moderator approval" });
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="rounded-md border border-green-500/30 bg-green-500/5 p-3 text-sm">
        <p className="text-green-700 dark:text-green-400">✓ Review submitted for {productName}</p>
        <p className="text-xs text-muted-foreground mt-1">
          Pending moderator approval
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-md border p-3">
      <p className="text-sm font-medium">{productName}</p>
      <div className="mt-2 flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(0)}
            className="p-0.5"
            aria-label={`Rate ${star} star`}
          >
            <Star
              className={`h-5 w-5 ${
                (hover || rating) >= star ? "fill-amber-400 text-amber-400" : "text-muted-foreground"
              }`}
            />
          </button>
        ))}
        <span className="ml-2 text-xs text-muted-foreground">{rating}/5</span>
      </div>
      <Input
        className="mt-2 h-8"
        placeholder="Review title (optional)"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <Textarea
        className="mt-2"
        rows={2}
        placeholder="Share your experience..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />
      <Button
        size="sm"
        className="mt-2"
        onClick={handleSubmit}
        disabled={submitting}
      >
        {submitting ? "Submitting..." : "Submit Review"}
      </Button>
    </div>
  );
}
