import { db } from "@/lib/db";
import { ProductCard } from "@/components/store/product-card";
import { Badge } from "@/components/ui/badge";
import { Tag } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Offers — Budget King BD",
};

export default async function OffersPage() {
  // Show products that have a compareAtPrice (i.e., on sale)
  const products = await db.product.findMany({
    where: {
      status: "ACTIVE",
      variants: {
        some: {
          status: "ACTIVE",
          compareAtPrice: { not: null },
        },
      },
    },
    include: {
      images: { orderBy: { sortOrder: "asc" }, take: 1 },
      variants: {
        where: { status: "ACTIVE", compareAtPrice: { not: null } },
        select: {
          price: true,
          compareAtPrice: true,
          options: true,
          inventory: { select: { quantity: true, reserved: true } },
        },
      },
      reviews: { where: { status: "APPROVED" }, select: { rating: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: 24,
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Badge variant="outline" className="mb-2">
          <Tag className="mr-1 h-3 w-3 text-primary" /> On Sale
        </Badge>
        <h1 className="text-3xl font-bold tracking-tight">Special Offers</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {products.length} products on sale — Cash on Delivery available
        </p>
      </div>

      {products.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <Tag className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <p className="mt-3 text-muted-foreground">
            No active offers right now. Check back soon!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((p) => {
            const minPrice = Math.min(...p.variants.map((v) => Number(v.price)));
            const minCompare = Math.min(
              ...p.variants
                .map((v) => (v.compareAtPrice ? Number(v.compareAtPrice) : Infinity))
            );
            return (
              <ProductCard
                key={p.id}
                product={{
                  id: p.id,
                  slug: p.slug,
                  name: p.name,
                  basePrice: minPrice,
                  compareAtPrice: minCompare === Infinity ? null : minCompare,
                  primaryImage: p.images[0]?.imageUrl ?? null,
                  availableColors: extractColors(p.variants),
                  rating:
                    p.reviews.length > 0
                      ? p.reviews.reduce((s, r) => s + r.rating, 0) / p.reviews.length
                      : null,
                  reviewCount: p.reviews.length,
                  outOfStock: p.variants.every(
                    (v) =>
                      (v.inventory?.quantity ?? 0) - (v.inventory?.reserved ?? 0) <= 0
                  ),
                }}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

function extractColors(variants: Array<{ options: unknown }>): string[] {
  const colors = new Set<string>();
  for (const v of variants) {
    const opts = v.options as { color?: string } | null;
    if (opts?.color) colors.add(opts.color);
  }
  return Array.from(colors);
}
