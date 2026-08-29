import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { ProductCard } from "@/components/store/product-card";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

export const revalidate = 60;

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const category = await db.category.findUnique({
    where: { slug },
    include: {
      children: { where: { isActive: true }, orderBy: { sortOrder: "asc" } },
    },
  });

  if (!category || !category.isActive) notFound();

  const products = await db.product.findMany({
    where: {
      status: { in: ["ACTIVE", "OUT_OF_STOCK"] },
      OR: [
        { categoryId: category.id },
        { category: { parentId: category.id } },
      ],
    },
    include: {
      images: { orderBy: { sortOrder: "asc" }, take: 1 },
      variants: {
        where: { status: "ACTIVE" },
        select: {
          options: true,
          inventory: { select: { quantity: true, reserved: true } },
        },
      },
      reviews: { where: { status: "APPROVED" }, select: { rating: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <nav className="mb-4 flex items-center gap-1 text-xs text-muted-foreground">
        <Link href="/" className="hover:text-primary">Home</Link>
        <ChevronRight className="h-3 w-3" />
        <Link href="/shop" className="hover:text-primary">Shop</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground">{category.name}</span>
      </nav>

      <h1 className="text-3xl font-bold tracking-tight">{category.name}</h1>
      {category.description && (
        <p className="mt-1 text-sm text-muted-foreground max-w-prose">
          {category.description}
        </p>
      )}

      {/* Subcategories */}
      {category.children.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-2">
          {category.children.map((c) => (
            <Link
              key={c.id}
              href={`/category/${c.slug}`}
              className="rounded-full border bg-card px-4 py-1.5 text-sm hover:bg-accent"
            >
              {c.name}
            </Link>
          ))}
        </div>
      )}

      <div className="mt-8">
        {products.length === 0 ? (
          <div className="rounded-lg border border-dashed p-12 text-center">
            <p className="text-muted-foreground">No products in this category yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {products.map((p) => (
              <ProductCard
                key={p.id}
                product={{
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
                }}
              />
            ))}
          </div>
        )}
      </div>
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
