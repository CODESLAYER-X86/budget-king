"use client";

import { ProductCard } from "@/components/store/product-card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMemo, useState } from "react";

type Product = {
  id: string;
  slug: string;
  name: string;
  basePrice: number;
  primaryImage: string | null;
  availableColors: string[];
  rating: number | null;
  reviewCount: number;
  outOfStock: boolean;
  categorySlug: string;
  categoryName: string;
};

type Category = { id: string; name: string; slug: string };

export function ShopClient({
  products,
  categories,
}: {
  products: Product[];
  categories: Category[];
}) {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [sort, setSort] = useState("newest");

  // All filtering happens client-side — ZERO database queries
  const filtered = useMemo(() => {
    let result = [...products];

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.categoryName.toLowerCase().includes(q)
      );
    }

    // Category filter
    if (categoryFilter) {
      result = result.filter((p) => p.categorySlug === categoryFilter);
    }

    // Sort
    if (sort === "price_asc") result.sort((a, b) => a.basePrice - b.basePrice);
    else if (sort === "price_desc") result.sort((a, b) => b.basePrice - a.basePrice);
    else if (sort === "name_asc") result.sort((a, b) => a.name.localeCompare(b.name));

    return result;
  }, [products, search, categoryFilter, sort]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">
          {categoryFilter
            ? categories.find((c) => c.slug === categoryFilter)?.name ?? "Shop"
            : "All Products"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {filtered.length} of {products.length} products • Cash on Delivery
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-[220px_1fr]">
        {/* Filters sidebar */}
        <aside className="space-y-4">
          <div className="rounded-lg border bg-card p-4 space-y-4">
            <h3 className="font-semibold text-sm">Filters</h3>

            <div>
              <Label htmlFor="q" className="text-xs text-muted-foreground">
                Search
              </Label>
              <Input
                id="q"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search..."
                className="mt-1 h-9"
              />
            </div>

            <div>
              <Label className="text-xs text-muted-foreground">Category</Label>
              <div className="mt-1.5 space-y-1">
                <button
                  onClick={() => setCategoryFilter("")}
                  className={`block w-full text-left rounded px-2 py-1 text-sm hover:bg-accent ${
                    !categoryFilter ? "bg-accent font-medium" : ""
                  }`}
                >
                  All Categories
                </button>
                {categories.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setCategoryFilter(c.slug)}
                    className={`block w-full text-left rounded px-2 py-1 text-sm hover:bg-accent ${
                      categoryFilter === c.slug ? "bg-accent font-medium" : ""
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-xs text-muted-foreground">Sort By</Label>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="newest">Newest First</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="name_asc">Name: A to Z</option>
              </select>
            </div>
          </div>
        </aside>

        {/* Products grid */}
        <div>
          {filtered.length === 0 ? (
            <div className="rounded-lg border border-dashed p-12 text-center">
              <p className="text-muted-foreground">
                No products found matching your filters.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {filtered.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
