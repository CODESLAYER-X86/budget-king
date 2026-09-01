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
  compareAtPrice?: number | null;
  primaryImage: string | null;
  availableColors: string[];
  rating: number | null;
  reviewCount: number;
  outOfStock: boolean;
  categoryId: string;
  categorySlug: string;
  categoryName: string;
  categoryParentId?: string | null;
};

type Category = {
  id: string;
  name: string;
  slug: string;
  parentId?: string | null;
};

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

    // Hierarchical Category filter (selects category and all its subcategories)
    if (categoryFilter) {
      const selectedCategory = categories.find((c) => c.slug === categoryFilter);
      if (selectedCategory) {
        const matchedCategoryIds = new Set<string>([selectedCategory.id]);
        let changed = true;
        while (changed) {
          changed = false;
          for (const c of categories) {
            if (c.parentId && matchedCategoryIds.has(c.parentId) && !matchedCategoryIds.has(c.id)) {
              matchedCategoryIds.add(c.id);
              changed = true;
            }
          }
        }
        result = result.filter(
          (p) =>
            p.categorySlug === categoryFilter ||
            matchedCategoryIds.has(p.categoryId) ||
            (p.categoryParentId && matchedCategoryIds.has(p.categoryParentId))
        );
      } else {
        result = result.filter((p) => p.categorySlug === categoryFilter);
      }
    }

    // Sort
    if (sort === "price_asc") result.sort((a, b) => a.basePrice - b.basePrice);
    else if (sort === "price_desc") result.sort((a, b) => b.basePrice - a.basePrice);
    else if (sort === "name_asc") result.sort((a, b) => a.name.localeCompare(b.name));

    return result;
  }, [products, search, categoryFilter, sort, categories]);

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {categoryFilter
              ? categories.find((c) => c.slug === categoryFilter)?.name ?? "Shop"
              : "All Products"}
          </h1>
          <p className="mt-0.5 text-xs sm:text-sm text-muted-foreground">
            {filtered.length} of {products.length} products • Cash on Delivery
          </p>
        </div>

        {/* Mobile Search & Sort Controls */}
        <div className="flex items-center gap-2 md:hidden pt-2">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products..."
            className="h-9 rounded-xl text-xs bg-secondary/30"
          />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="h-9 rounded-xl border border-input bg-background px-2.5 text-xs font-medium shrink-0"
          >
            <option value="newest">Newest</option>
            <option value="price_asc">Price: Low ↑</option>
            <option value="price_desc">Price: High ↓</option>
          </select>
        </div>
      </div>

      {/* Mobile Horizontal Swipeable Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none md:hidden -mx-4 px-4 select-none touch-manipulation">
        <button
          onClick={() => setCategoryFilter("")}
          className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-semibold shrink-0 active:scale-95 transition-all ${
            !categoryFilter
              ? "bg-primary text-primary-foreground shadow-sm"
              : "bg-secondary/80 text-foreground hover:bg-secondary"
          }`}
        >
          All Categories
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setCategoryFilter(c.slug)}
            className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-semibold shrink-0 active:scale-95 transition-all ${
              categoryFilter === c.slug
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-secondary/80 text-foreground hover:bg-secondary"
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-[220px_1fr]">
        {/* Desktop Sidebar (Hidden on mobile) */}
        <aside className="hidden md:block space-y-4">
          <div className="rounded-2xl border bg-card p-4 space-y-4 shadow-xs">
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
                className="mt-1 h-9 rounded-xl"
              />
            </div>

            <div>
              <Label className="text-xs text-muted-foreground">Category</Label>
              <div className="mt-1.5 space-y-1">
                <button
                  onClick={() => setCategoryFilter("")}
                  className={`block w-full text-left rounded-lg px-2.5 py-1.5 text-xs font-medium hover:bg-accent transition-colors ${
                    !categoryFilter ? "bg-primary/10 text-primary font-bold" : "text-foreground"
                  }`}
                >
                  All Categories
                </button>
                {categories.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setCategoryFilter(c.slug)}
                    className={`block w-full text-left rounded-lg px-2.5 py-1.5 text-xs font-medium hover:bg-accent transition-colors ${
                      categoryFilter === c.slug ? "bg-primary/10 text-primary font-bold" : "text-foreground"
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
                className="mt-1 flex h-9 w-full rounded-xl border border-input bg-background px-3 text-xs font-medium"
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
            <div className="rounded-2xl border border-dashed p-12 text-center">
              <p className="text-muted-foreground text-sm">
                No products found matching your filters.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {filtered.map((p, index) => (
                <ProductCard key={p.id} product={p} priority={index < 4} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
