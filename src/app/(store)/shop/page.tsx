import { db } from "@/lib/db";
import { ProductCard } from "@/components/store/product-card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const revalidate = 60;
export const dynamic = "force-static";

type SearchParams = {
  q?: string;
  category?: string;
  color?: string;
  size?: string;
  minPrice?: string;
  maxPrice?: string;
  sort?: string;
  page?: string;
};

async function getShopData(params: SearchParams) {
  const page = Math.max(1, parseInt(params.page ?? "1", 10));
  const perPage = 24;
  const skip = (page - 1) * perPage;

  const where: Record<string, unknown> = {
    status: "ACTIVE",
  };

  if (params.q) {
    where.OR = [
      { name: { contains: params.q, mode: "insensitive" } },
      { description: { contains: params.q, mode: "insensitive" } },
      { brand: { contains: params.q, mode: "insensitive" } },
    ];
  }

  if (params.category) {
    where.category = { slug: params.category };
  }

  if (params.minPrice || params.maxPrice) {
    where.basePrice = {};
    if (params.minPrice) where.basePrice.gte = parseFloat(params.minPrice);
    if (params.maxPrice) where.basePrice.lte = parseFloat(params.maxPrice);
  }

  let orderBy: Record<string, "asc" | "desc"> = { createdAt: "desc" };
  if (params.sort === "price_asc") orderBy = { basePrice: "asc" };
  if (params.sort === "price_desc") orderBy = { basePrice: "desc" };
  if (params.sort === "name_asc") orderBy = { name: "asc" };

  const [products, total, categories] = await Promise.all([
    db.product.findMany({
      where,
      include: {
        images: { orderBy: { sortOrder: "asc" }, take: 1 },
        variants: {
          where: { status: "ACTIVE" },
          select: {
            options: true,
            inventory: { select: { quantity: true, reserved: true } },
          },
        },
        reviews: {
          where: { status: "APPROVED" },
          select: { rating: true },
        },
        category: { select: { name: true, slug: true } },
      },
      orderBy,
      skip,
      take: perPage,
    }),
    db.product.count({ where }),
    db.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    }),
  ]);

  return {
    products,
    total,
    categories,
    page,
    perPage,
    totalPages: Math.max(1, Math.ceil(total / perPage)),
  };
}

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const { products, total, categories, page, totalPages } = await getShopData(params);

  // Extract unique colors/sizes from variants for filter UI
  const colors = new Set<string>();
  const sizes = new Set<string>();
  products.forEach((p) => {
    p.variants.forEach((v) => {
      const opts = v.options as { color?: string; size?: string } | null;
      if (opts?.color) colors.add(opts.color);
      if (opts?.size) sizes.add(opts.size);
    });
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">
          {params.category
            ? categories.find((c) => c.slug === params.category)?.name ?? "Shop"
            : "All Products"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {total} {total === 1 ? "product" : "products"} available • Cash on Delivery
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-[220px_1fr]">
        {/* Filters sidebar */}
        <aside className="space-y-4">
          <div className="rounded-lg border bg-card p-4 space-y-4">
            <h3 className="font-semibold text-sm">Filters</h3>

            {/* Search */}
            <div>
              <Label htmlFor="q" className="text-xs text-muted-foreground">
                Search
              </Label>
              <form action="/shop" method="GET" className="mt-1">
                {Object.entries(params)
                  .filter(([k]) => k !== "q" && k !== "page")
                  .map(([k, v]) => (
                    <input key={k} type="hidden" name={k} value={v} />
                  ))}
                <Input
                  id="q"
                  name="q"
                  defaultValue={params.q ?? ""}
                  placeholder="Search..."
                  className="h-9"
                />
              </form>
            </div>

            {/* Category */}
            <div>
              <Label className="text-xs text-muted-foreground">Category</Label>
              <div className="mt-1.5 space-y-1">
                <a
                  href={`/shop${stripParam(params, "category")}`}
                  className={`block rounded px-2 py-1 text-sm hover:bg-accent ${
                    !params.category ? "bg-accent font-medium" : ""
                  }`}
                >
                  All Categories
                </a>
                {categories.map((c) => (
                  <a
                    key={c.id}
                    href={`/shop?${mergeParams(params, { category: c.slug, page: undefined })}`}
                    className={`block rounded px-2 py-1 text-sm hover:bg-accent ${
                      params.category === c.slug ? "bg-accent font-medium" : ""
                    }`}
                  >
                    {c.name}
                  </a>
                ))}
              </div>
            </div>

            {/* Colors */}
            {colors.size > 0 && (
              <div>
                <Label className="text-xs text-muted-foreground">Color</Label>
                <div className="mt-1.5 flex flex-wrap gap-2">
                  {Array.from(colors).map((c) => (
                    <a
                      key={c}
                      href={`/shop?${mergeParams(params, { color: c, page: undefined })}`}
                      className={`rounded-full border px-3 py-1 text-xs hover:bg-accent ${
                        params.color === c ? "bg-accent border-primary" : ""
                      }`}
                    >
                      {c}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Sort */}
            <div>
              <Label className="text-xs text-muted-foreground">Sort By</Label>
              <Select defaultValue={params.sort ?? "newest"}>
                <SelectTrigger className="mt-1 h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="price_asc">Price: Low to High</SelectItem>
                  <SelectItem value="price_desc">Price: High to Low</SelectItem>
                  <SelectItem value="name_asc">Name: A to Z</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </aside>

        {/* Products grid */}
        <div>
          {products.length === 0 ? (
            <div className="rounded-lg border border-dashed p-12 text-center">
              <p className="text-muted-foreground">
                No products found matching your filters.
              </p>
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
                    basePrice: p.basePrice,
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8 flex justify-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <a
                  key={p}
                  href={`/shop?${mergeParams(params, { page: p.toString() })}`}
                  className={`flex h-9 min-w-9 items-center justify-center rounded-md border px-3 text-sm hover:bg-accent ${
                    p === page ? "border-primary bg-primary text-primary-foreground" : ""
                  }`}
                >
                  {p}
                </a>
              ))}
            </div>
          )}
        </div>
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

function mergeParams(
  current: SearchParams,
  updates: Partial<SearchParams>
): string {
  const next = { ...current, ...updates };
  Object.keys(next).forEach((k) => {
    if (next[k as keyof SearchParams] === undefined) delete next[k as keyof SearchParams];
  });
  return new URLSearchParams(
    Object.entries(next).map(([k, v]) => [k, String(v)])
  ).toString();
}

function stripParam(current: SearchParams, key: keyof SearchParams): string {
  const next = { ...current };
  delete next[key];
  if (next.page) delete next.page;
  const qs = new URLSearchParams(
    Object.entries(next).map(([k, v]) => [k, String(v)])
  ).toString();
  return qs ? `?${qs}` : "";
}
