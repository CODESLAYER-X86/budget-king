import { db } from "@/lib/db";
import { ShopClient } from "./shop-client";

// Cache for 5 minutes — product catalog rarely changes
export const revalidate = 300;

export default async function ShopPage() {
  // Fetch ALL active products in ONE query (cached for 5 min)
  const [products, categories] = await Promise.all([
    db.product.findMany({
      where: { status: "ACTIVE" },
      include: {
        images: { orderBy: { sortOrder: "asc" }, take: 1 },
        variants: {
          where: { status: "ACTIVE" },
          select: {
            price: true,
            compareAtPrice: true,
            options: true,
            inventory: { select: { quantity: true, reserved: true } },
          },
        },
        reviews: { where: { status: "APPROVED" }, select: { rating: true } },
        category: { select: { name: true, slug: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 48,
    }),
    db.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    }),
  ]);

  // Serialize ALL Decimal values here (server side)
  const serializedProducts = products.map((p) => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    basePrice: Number(p.basePrice),
    primaryImage: p.images[0]?.imageUrl ?? null,
    availableColors: extractColors(p.variants),
    rating:
      p.reviews.length > 0
        ? p.reviews.reduce((s, r) => s + r.rating, 0) / p.reviews.length
        : null,
    reviewCount: p.reviews.length,
    outOfStock: p.variants.every(
      (v) => (v.inventory?.quantity ?? 0) - (v.inventory?.reserved ?? 0) <= 0
    ),
    categorySlug: p.category.slug,
    categoryName: p.category.name,
  }));

  return (
    <ShopClient
      products={serializedProducts}
      categories={categories.map((c) => ({ id: c.id, name: c.name, slug: c.slug }))}
    />
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
