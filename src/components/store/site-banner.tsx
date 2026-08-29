"use client";

import Link from "next/link";
import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

type Banner = {
  id: string;
  title: string;
  message: string;
  ctaText: string | null;
  ctaLink: string | null;
  bgColor: string;
  textColor: string;
};

export function SiteBanner({ banner }: { banner: Banner }) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  return (
    <div
      className="relative w-full text-center text-sm py-2 px-4"
      style={{ backgroundColor: banner.bgColor, color: banner.textColor }}
    >
      <span className="inline-block font-medium">{banner.message}</span>
      {banner.ctaText && banner.ctaLink && (
        <Link
          href={banner.ctaLink}
          className="ml-3 inline-block underline font-semibold hover:opacity-80"
        >
          {banner.ctaText} →
        </Link>
      )}
      <button
        onClick={() => setDismissed(true)}
        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-black/10"
        aria-label="Dismiss"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
