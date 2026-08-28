import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { ProductDetailClient } from "./product-detail-client";
import { ProductCard } from "@/components/store/product-card";
import { ShareToGroupButton } from "@/components/store/share-to-group-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Truck, RefreshCw, ShieldCheck, ChevronRight } from "lucide-react";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await db.product.findUnique({
    where: { slug },
    select: { name: true, shortDescription: true, description: true, basePrice: true, brand: true, images: true },
  });
  if (!product) return { title: "Product not found — Budget King BD" };

  const image = product.images[0]?.imageUrl;
  const description = product.shortDescription ?? product.description ?? "Available at Budget King BD with Cash on Delivery";

  return {
    title: `${product.name} — Budget King BD`,
    description: description.slice(0, 160),
    openGraph: {
      title: product.name,
      description: description.slice(0, 160),
      images: image ? [{ url: image, width: 600, height: 800, alt: product.name }] : undefined,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: product.name,
      description: description.slice(0, 160),
      images: image ? [image] : undefined,
    },
  };
}

async function getProduct(slug: string) {
  const product = await db.product.findUnique({
    where: { slug },
    include: {
      category: true,
      images: { orderBy: { sortOrder: "asc" } },
      variants: {
        where: { status: "ACTIVE" },
        include: { inventory: true, images: { orderBy: { sortOrder: "asc" } } },
        orderBy: { price: "asc" },
      },
      attributeValues: { include: { attribute: true } },
      reviews: {
        where: { status: "APPROVED" },
        include: { user: { select: { fullName: true, email: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!product || product.status === "ARCHIVED") {
    notFound();
  }

  // Serialize Decimal values to plain numbers for client components
  return {
    ...product,
    basePrice: Number(product.basePrice),
    variants: product.variants.map((v) => ({
      ...v,
      price: Number(v.price),
      compareAtPrice: v.compareAtPrice ? Number(v.compareAtPrice) : null,
      options: v.options as { color?: string; size?: string },
    })),
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProduct(slug);

  // Related products (same category, excluding self)
  const related = await db.product.findMany({
    where: {
      categoryId: product.categoryId,
      id: { not: product.id },
      status: "ACTIVE",
    },
    include: {
      images: { orderBy: { sortOrder: "asc" }, take: 1 },
      variants: {
        where: { status: "ACTIVE" },
        select: { inventory: { select: { quantity: true, reserved: true } } },
      },
    },
    take: 4,
  });

  // Build variant option metadata
  const colors = Array.from(
    new Set(
      product.variants
        .map((v) => (v.options as { color?: string } | null)?.color)
        .filter(Boolean) as string[]
    )
  );
  const sizes = Array.from(
    new Set(
      product.variants
        .map((v) => (v.options as { size?: string } | null)?.size)
        .filter(Boolean) as string[]
    )
  );

  const avgRating =
    product.reviews.length > 0
      ? product.reviews.reduce((s, r) => s + r.rating, 0) / product.reviews.length
      : null;

  const primaryImage = product.images.find((i) => i.isPrimary)?.imageUrl ?? product.images[0]?.imageUrl;

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Breadcrumb */}
      <nav className="mb-4 flex items-center gap-1 text-xs text-muted-foreground">
        <Link href="/" className="hover:text-primary">Home</Link>
        <ChevronRight className="h-3 w-3" />
        <Link href="/shop" className="hover:text-primary">Shop</Link>
        <ChevronRight className="h-3 w-3" />
        <Link href={`/category/${product.category.slug}`} className="hover:text-primary">
          {product.category.name}
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground">{product.name}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Gallery */}
        <div>
          <div className="relative aspect-[3/4] overflow-hidden rounded-lg border bg-muted">
            {primaryImage ? (
              <Image
                src={primaryImage}
                alt={product.name}
                fill
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover"
                priority
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
                No image available
              </div>
            )}
          </div>

          {product.images.length > 1 && (
            <div className="mt-3 grid grid-cols-5 gap-2">
              {product.images.map((img) => (
                <div
                  key={img.id}
                  className="relative aspect-square overflow-hidden rounded-md border bg-muted"
                >
                  <Image
                    src={img.imageUrl}
                    alt={img.altText ?? product.name}
                    fill
                    sizes="100px"
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info + variant picker */}
        <div>
          {product.brand && (
            <Badge variant="outline" className="mb-2">
              {product.brand}
            </Badge>
          )}
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {product.name}
          </h1>

          {avgRating != null && (
            <div className="mt-2 flex items-center gap-2 text-sm">
              <span className="text-amber-500">
                {"★".repeat(Math.round(avgRating))}
                {"☆".repeat(5 - Math.round(avgRating))}
              </span>
              <span className="text-muted-foreground">
                {avgRating.toFixed(1)} • {product.reviews.length} reviews
              </span>
            </div>
          )}

          <div className="mt-4">
            <ProductDetailClient product={product} colors={colors} sizes={sizes} />
          </div>

          {/* Share to group */}
          <div className="mt-4">
            <ShareToGroupButton productId={product.id} />
          </div>

          {/* Trust badges */}
          <div className="mt-6 grid grid-cols-3 gap-3 text-center">
            <div className="rounded-lg border p-3">
              <Truck className="mx-auto h-5 w-5 text-primary" />
              <p className="mt-1 text-xs font-medium">COD Delivery</p>
            </div>
            <div className="rounded-lg border p-3">
              <RefreshCw className="mx-auto h-5 w-5 text-primary" />
              <p className="mt-1 text-xs font-medium">7-Day Exchange</p>
            </div>
            <div className="rounded-lg border p-3">
              <ShieldCheck className="mx-auto h-5 w-5 text-primary" />
              <p className="mt-1 text-xs font-medium">Quality Guaranteed</p>
            </div>
          </div>

          {/* Description */}
          {product.shortDescription && (
            <p className="mt-6 text-sm text-muted-foreground">
              {product.shortDescription}
            </p>
          )}
          {product.description && (
            <div className="mt-4 prose prose-sm max-w-none">
              <h3 className="text-base font-semibold">Product Details</h3>
              <p className="whitespace-pre-line text-sm">{product.description}</p>
            </div>
          )}

          {/* Attributes */}
          {product.attributeValues.length > 0 && (
            <div className="mt-6">
              <h3 className="mb-2 text-sm font-semibold">Specifications</h3>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                {product.attributeValues.map((av) => (
                  <div key={av.id} className="flex justify-between border-b py-1">
                    <dt className="text-muted-foreground">{av.attribute.name}</dt>
                    <dd className="font-medium">{av.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </div>
      </div>

      {/* Reviews */}
      {product.reviews.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-4 text-xl font-bold">Customer Reviews</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {product.reviews.map((r) => (
              <div key={r.id} className="rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-sm">
                    {r.user.fullName ?? r.user.email.split("@")[0]}
                  </p>
                  <span className="text-amber-500 text-sm">
                    {"★".repeat(r.rating)}
                    {"☆".repeat(5 - r.rating)}
                  </span>
                </div>
                {r.title && <p className="mt-1 text-sm font-semibold">{r.title}</p>}
                {r.content && (
                  <p className="mt-1 text-sm text-muted-foreground">{r.content}</p>
                )}
                <Badge variant="secondary" className="mt-2 text-xs">
                  ✓ Verified Purchase
                </Badge>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Related */}
      {related.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-4 text-xl font-bold">You Might Also Like</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {related.map((p) => (
              <ProductCard
                key={p.id}
                product={{
                  id: p.id,
                  slug: p.slug,
                  name: p.name,
                  basePrice: p.basePrice,
                  primaryImage: p.images[0]?.imageUrl ?? null,
                  outOfStock: p.variants.every(
                    (v) => (v.inventory?.quantity ?? 0) - (v.inventory?.reserved ?? 0) <= 0
                  ),
                }}
              />
            ))}
          </div>
        </section>
      )}

      {/* JSON-LD structured data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            name: product.name,
            description: product.shortDescription ?? product.description ?? undefined,
            image: product.images.map((i) => i.imageUrl),
            sku: product.variants[0]?.sku,
            brand: product.brand
              ? { "@type": "Brand", name: product.brand }
              : undefined,
            category: product.category.name,
            offers: {
              "@type": "AggregateOffer",
              priceCurrency: "BDT",
              lowPrice: Number(product.basePrice),
              highPrice: product.variants.length > 0
                ? Math.max(...product.variants.map((v) => Number(v.price)))
                : Number(product.basePrice),
              offerCount: product.variants.length,
              availability:
                product.variants.some(
                  (v) => (v.inventory?.quantity ?? 0) - (v.inventory?.reserved ?? 0) > 0
                )
                  ? "https://schema.org/InStock"
                  : "https://schema.org/OutOfStock",
            },
            ...(avgRating != null && {
              aggregateRating: {
                "@type": "AggregateRating",
                ratingValue: avgRating.toFixed(1),
                reviewCount: product.reviews.length,
              },
            }),
          }),
        }}
      />
    </div>
  );
}
