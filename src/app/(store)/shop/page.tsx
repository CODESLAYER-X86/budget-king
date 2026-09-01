import { db } from "@/lib/db";
import { ShopClient } from "./shop-client";
import { safeQuery } from "@/lib/safe-query";

export const revalidate = 60;

export default async function ShopPage() {
  // Fetch ALL active products in ONE query
  const [products, categories] = await Promise.all([
    safeQuery(
      () => db.product.findMany({
        where: { status: { in: ["ACTIVE", "OUT_OF_STOCK"] } },
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
          category: { select: { id: true, name: true, slug: true, parentId: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 48,
      }),
      []
    ),
    safeQuery(
      () => db.category.findMany({
        where: { isActive: true },
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      }),
      []
    ),
  ]);

  // Serialize ALL Decimal values here (server side)
  const serializedProducts = products.map((p) => {
    const minCompare = Math.min(
      ...p.variants.map((v) => (v.compareAtPrice ? Number(v.compareAtPrice) : Infinity))
    );
    return {
      id: p.id,
      slug: p.slug,
      name: p.name,
      basePrice: Number(p.basePrice),
      compareAtPrice: minCompare === Infinity ? null : minCompare,
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
      categoryId: p.category.id,
      categorySlug: p.category.slug,
      categoryName: p.category.name,
      categoryParentId: p.category.parentId,
    };
  });

  return (
    <ShopClient
      products={serializedProducts}
      categories={categories.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        parentId: c.parentId ?? null,
      }))}
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
