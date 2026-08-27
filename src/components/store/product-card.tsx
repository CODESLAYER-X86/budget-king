import Link from "next/link";
import Image from "next/image";
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

export function ProductCard({ product }: { product: ProductCardData }) {
  const price = Number(product.basePrice);
  const compare = product.compareAtPrice ? Number(product.compareAtPrice) : null;
  const discount =
    compare && compare > price
      ? Math.round(((compare - price) / compare) * 100)
      : null;

  return (
    <Link
      href={`/product/${product.slug}`}
      className="group block overflow-hidden rounded-lg border bg-card transition-shadow hover:shadow-md"
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-muted">
        {product.primaryImage ? (
          <Image
            src={product.primaryImage}
            alt={product.name}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
            className="object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
            No image
          </div>
        )}

        {discount && (
          <Badge className="absolute left-2 top-2 bg-destructive text-destructive-foreground">
            -{discount}%
          </Badge>
        )}
        {product.isFeatured && !discount && (
          <Badge className="absolute left-2 top-2 bg-primary text-primary-foreground">
            Featured
          </Badge>
        )}
        {product.outOfStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/70">
            <Badge variant="secondary">Out of Stock</Badge>
          </div>
        )}
      </div>

      <div className="p-3 space-y-1">
        <h3 className="font-medium text-sm line-clamp-1 group-hover:text-primary">
          {product.name}
        </h3>

        {product.availableColors && product.availableColors.length > 0 && (
          <div className="flex items-center gap-1">
            {product.availableColors.slice(0, 5).map((c) => (
              <span
                key={c}
                className="inline-block h-3 w-3 rounded-full border"
                style={{ backgroundColor: colorToHex(c) }}
                title={c}
              />
            ))}
            {product.availableColors.length > 5 && (
              <span className="text-xs text-muted-foreground">
                +{product.availableColors.length - 5}
              </span>
            )}
          </div>
        )}

        <div className="flex items-center gap-2 pt-1">
          <span className="font-semibold text-sm">{formatTk(price)}</span>
          {compare && compare > price && (
            <span className="text-xs text-muted-foreground line-through">
              {formatTk(compare)}
            </span>
          )}
        </div>

        {product.rating != null && product.rating > 0 && (
          <p className="text-xs text-muted-foreground">
            ★ {product.rating.toFixed(1)}
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
