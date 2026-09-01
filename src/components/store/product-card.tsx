import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { formatTk } from "@/lib/utils/currency";
import { cn } from "@/lib/utils";

type ProductCardData = {
  id: string;
  slug: string;
  name: string;
  basePrice: number | string;
  compareAtPrice?: number | string | null;
  primaryImage?: string | null;
  availableColors?: string[];
  rating?: number | null;
  reviewCount?: number;
  isFeatured?: boolean;
  outOfStock?: boolean;
};

export function ProductCard({
  product,
  priority = false,
}: {
  product: ProductCardData;
  priority?: boolean;
}) {
  const price = Number(product.basePrice);
  const compare = product.compareAtPrice ? Number(product.compareAtPrice) : null;
  const discount =
    compare && compare > price
      ? Math.round(((compare - price) / compare) * 100)
      : null;

  return (
    <Link
      href={`/product/${product.slug}`}
      className="group block overflow-hidden rounded-xl border bg-card transition-all duration-200 hover:shadow-md active:scale-[0.98] select-none touch-manipulation"
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-muted">
        {product.primaryImage ? (
          <Image
            src={product.primaryImage}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            priority={priority}
            loading={priority ? undefined : "lazy"}
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
            No image
          </div>
        )}

        {/* Discount Badge */}
        {discount && (
          <Badge className="absolute left-2 top-2 bg-rose-600 font-bold text-white shadow-sm">
            -{discount}%
          </Badge>
        )}
        {product.isFeatured && !discount && (
          <Badge className="absolute left-2 top-2 bg-primary text-primary-foreground font-medium shadow-sm">
            Featured
          </Badge>
        )}
        {product.outOfStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-xs">
            <Badge variant="secondary" className="font-semibold">Out of Stock</Badge>
          </div>
        )}
      </div>

      <div className="p-3 space-y-1.5">
        <h3 className="font-medium text-xs sm:text-sm line-clamp-1 group-hover:text-primary transition-colors">
          {product.name}
        </h3>

        {product.availableColors && product.availableColors.length > 0 && (
          <div className="flex items-center gap-1 py-0.5">
            {product.availableColors.slice(0, 5).map((c) => (
              <span
                key={c}
                className="inline-block h-2.5 w-2.5 rounded-full border shadow-2xs"
                style={{ backgroundColor: colorToHex(c) }}
                title={c}
              />
            ))}
            {product.availableColors.length > 5 && (
              <span className="text-[10px] text-muted-foreground">
                +{product.availableColors.length - 5}
              </span>
            )}
          </div>
        )}

        <div className="flex items-baseline justify-between gap-1 pt-0.5">
          <div className="flex items-baseline gap-1.5">
            <span className="font-bold text-sm text-foreground">{formatTk(price)}</span>
            {compare && compare > price && (
              <span className="text-[11px] text-muted-foreground line-through">
                {formatTk(compare)}
              </span>
            )}
          </div>

          {/* Coin reward pill */}
          <span className="text-[10px] font-medium text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded-full">
            🪙 +{Math.floor(price)}
          </span>
        </div>

        {product.rating != null && product.rating > 0 && (
          <p className="text-[11px] text-muted-foreground flex items-center gap-1">
            <span className="text-amber-500">★</span> {product.rating.toFixed(1)}
            {product.reviewCount ? ` (${product.reviewCount})` : ""}
          </p>
        )}
      </div>
    </Link>
  );
}

// Simple color name → hex map for swatches
function colorToHex(name: string): string {
  const map: Record<string, string> = {
    Black: "#000000",
    White: "#ffffff",
    Navy: "#1e3a8a",
    Blue: "#3b82f6",
    Red: "#dc2626",
    Green: "#16a34a",
    Grey: "#6b7280",
    Gray: "#6b7280",
    Beige: "#e8dcc4",
    Brown: "#92400e",
    Olive: "#4d7c0f",
    Khaki: "#a3a353",
    Pink: "#ec4899",
    Maroon: "#7f1d1d",
    Cream: "#fff8e7",
    Yellow: "#eab308",
    Orange: "#f97316",
    Purple: "#9333ea",
    Tan: "#d2b48c",
    Charcoal: "#36454f",
  };
  return map[name?.trim?.()] ?? "#888888";
}
