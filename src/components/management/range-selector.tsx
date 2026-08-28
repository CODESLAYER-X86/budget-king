"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

const RANGES = [
  { value: "7d", label: "7 Days" },
  { value: "30d", label: "30 Days" },
  { value: "90d", label: "90 Days" },
  { value: "ytd", label: "Year to Date" },
  { value: "all", label: "All Time" },
];

export function RangeSelector({ baseUrl = "/admin/analytics" }: { baseUrl?: string }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentRange = searchParams.get("range") ?? "30d";

  return (
    <div className="flex flex-wrap gap-1">
      {RANGES.map((r) => {
        const isActive = currentRange === r.value;
        const params = new URLSearchParams(searchParams.toString());
        params.set("range", r.value);
        return (
          <Link
            key={r.value}
            href={`${baseUrl}?${params.toString()}`}
            className={`rounded-md px-3 py-1.5 text-xs font-medium ${
              isActive
                ? "bg-primary text-primary-foreground"
                : "border hover:bg-accent"
            }`}
          >
            {r.label}
          </Link>
        );
      })}
    </div>
  );
}
