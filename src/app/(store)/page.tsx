import Link from "next/link";
import { db } from "@/lib/db";
import { ProductCard } from "@/components/store/product-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Crown,
  Truck,
  ShieldCheck,
  RefreshCw,
  Users,
  Coins,
  ArrowRight,
  ShoppingBag,
} from "lucide-react";

// Cache for 10 minutes — homepage content rarely changes
export const revalidate = 600;

async function getHomeData() {
  const [featured, categories, heroSection] = await Promise.all([
    db.product.findMany({
      where: {
        isFeatured: true,
        status: "ACTIVE",
      },
      include: {
        images: { orderBy: { sortOrder: "asc" }, take: 1 },
        variants: {
          where: { status: "ACTIVE" },
          select: { options: true, inventory: { select: { quantity: true, reserved: true } } },
        },
        reviews: {
          where: { status: "APPROVED" },
          select: { rating: true },
        },
      },
      take: 8,
      orderBy: { updatedAt: "desc" },
    }),
    db.category.findMany({
      where: { isActive: true, parentId: null },
      orderBy: { sortOrder: "asc" },
      take: 6,
    }),
    db.homepageSection.findFirst({
      where: { sectionType: "HERO", isActive: true },
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  return { featured, categories, heroSection };
}

export default async function HomePage() {
  const { featured, categories, heroSection } = await getHomeData();

  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden border-b">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-50 via-background to-orange-50 dark:from-amber-950/30 dark:via-background dark:to-orange-950/20" />
        <div className="container relative mx-auto px-4 py-16 sm:py-24">
          <div className="grid items-center gap-8 md:grid-cols-2">
            <div className="space-y-6">
              <Badge variant="outline" className="w-fit">
                <Crown className="mr-1 h-3 w-3 text-primary" /> Cash on Delivery everywhere in Bangladesh
              </Badge>
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                Quality That Fits{" "}
                <span className="text-primary">Your Budget</span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-prose">
                Affordable clothing without compromising quality. Shop shirts
                with COD, earn Budget Coins on every order, and shop together
                with friends for shared savings.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link href="/shop">
                  <Button size="lg" className="gap-2">
                    <ShoppingBag className="h-4 w-4" /> Shop Now
                  </Button>
                </Link>
                <Link href="/track">
                  <Button size="lg" variant="outline">
                    Track Order
                  </Button>
                </Link>
              </div>

              <div className="flex flex-wrap items-center gap-4 pt-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Truck className="h-4 w-4 text-primary" /> Free delivery over tk 2,000
                </span>
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-primary" /> Secure COD
                </span>
                <span className="flex items-center gap-1.5">
                  <RefreshCw className="h-4 w-4 text-primary" /> 7-day exchange
                </span>
              </div>
            </div>

            {heroSection?.imageUrl ? (
              <div className="relative aspect-[4/3] overflow-hidden rounded-2xl shadow-lg">
                <img
                  src={heroSection.imageUrl}
                  alt={heroSection.title ?? "Budget King BD"}
                  className="h-full w-full object-cover"
                />
              </div>
            ) : (
              <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-gradient-to-br from-amber-100 to-orange-200 dark:from-amber-900/40 dark:to-orange-900/30">
                <div className="flex h-full w-full items-center justify-center">
                  <Crown className="h-24 w-24 text-primary/40" />
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* VALUE PROPS */}
      <section className="border-b bg-secondary/30">
        <div className="container mx-auto grid grid-cols-2 gap-4 px-4 py-8 md:grid-cols-4">
          {[
            { icon: Truck, title: "Cash on Delivery", desc: "Pay when you receive" },
            { icon: Coins, title: "Budget Coins", desc: "Earn on every order" },
            { icon: Users, title: "Group Shopping", desc: "Shop together, save together" },
            { icon: RefreshCw, title: "Easy Exchange", desc: "7-day hassle-free" },
          ].map((v) => (
            <div key={v.title} className="flex items-start gap-3">
              <div className="rounded-lg bg-primary/10 p-2.5">
                <v.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-sm">{v.title}</p>
                <p className="text-xs text-muted-foreground">{v.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CATEGORIES */}
      {categories.length > 0 && (
        <section className="container mx-auto px-4 py-12">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold">Shop by Category</h2>
            <Link
              href="/shop"
              className="text-sm text-muted-foreground hover:text-primary inline-flex items-center"
            >
              View all <ArrowRight className="ml-1 h-3 w-3" />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/category/${cat.slug}`}
                className="group relative aspect-square overflow-hidden rounded-lg border bg-card"
              >
                {cat.imageUrl ? (
                  <img
                    src={cat.imageUrl}
                    alt={cat.name}
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-secondary text-3xl">
                    👕
                  </div>
                )}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                  <p className="font-semibold text-sm text-white">{cat.name}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* FEATURED PRODUCTS */}
      <section className="container mx-auto px-4 py-12">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Featured Products</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Hand-picked shirts at budget-friendly prices
            </p>
          </div>
          <Link
            href="/shop"
            className="text-sm text-muted-foreground hover:text-primary inline-flex items-center"
          >
            View all <ArrowRight className="ml-1 h-3 w-3" />
          </Link>
        </div>

        {featured.length === 0 ? (
          <div className="rounded-lg border border-dashed p-12 text-center">
            <p className="text-muted-foreground">
              No featured products yet. Check back soon!
            </p>
            <Link href="/shop">
              <Button className="mt-4">Browse All Products</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4">
            {featured.map((p) => (
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
                  isFeatured: p.isFeatured,
                  outOfStock: p.variants.every(
                    (v) => (v.inventory?.quantity ?? 0) - (v.inventory?.reserved ?? 0) <= 0
                  ),
                }}
              />
            ))}
          </div>
        )}
      </section>

      {/* GROUP SHOPPING PROMO */}
      <section className="border-y bg-gradient-to-br from-amber-50 via-background to-orange-50 dark:from-amber-950/30 dark:via-background dark:to-orange-950/20">
        <div className="container mx-auto px-4 py-16">
          <div className="grid items-center gap-8 md:grid-cols-2">
            <div>
              <Badge variant="outline" className="mb-4">
                <Users className="mr-1 h-3 w-3 text-primary" /> Group Shopping
              </Badge>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Shop Together, Save Together
              </h2>
              <p className="mt-4 text-muted-foreground max-w-prose">
                Create a group with friends, vote on products, and place one
                combined COD order. Share the delivery cost and unlock group-only
                rewards.
              </p>
              <Link href="/login">
                <Button className="mt-6 gap-2">
                  Start a Group <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
            <div className="rounded-2xl border bg-card p-6 shadow-sm">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">DIU CSE Friends</p>
                    <p className="text-xs text-muted-foreground">6 members • 4 products shared</p>
                  </div>
                </div>
                <div className="rounded-lg bg-secondary/50 p-3">
                  <p className="text-sm">
                    <span className="font-semibold">Rahim</span> shared{" "}
                    <span className="text-primary">Oxford Casual Shirt</span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    👍 5 • 👎 1
                  </p>
                </div>
                <div className="rounded-lg bg-secondary/50 p-3">
                  <p className="text-sm">
                    <span className="font-semibold">Karim</span> added 2 items to group cart
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Group total: tk 2,498
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* REWARDS PROMO */}
      <section className="container mx-auto px-4 py-16">
        <div className="rounded-2xl border bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/30 p-8">
          <div className="grid items-center gap-6 md:grid-cols-3">
            <div className="md:col-span-2">
              <Badge variant="outline" className="mb-3">
                <Coins className="mr-1 h-3 w-3 text-primary" /> Budget Coins
              </Badge>
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Earn Coins on Every Order
              </h2>
              <p className="mt-3 text-muted-foreground max-w-prose">
                Spend tk 2,000+ on a delivered order and earn 2,000 Budget Coins.
                Convert coins into vouchers for future purchases. The more you
                shop, the more you save.
              </p>
            </div>
            <div className="rounded-xl bg-card p-6 text-center shadow-sm">
              <Coins className="mx-auto h-12 w-12 text-primary" />
              <p className="mt-2 text-3xl font-bold">2,000</p>
              <p className="text-xs text-muted-foreground">coins per qualifying order</p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function extractColors(
  variants: Array<{ options: unknown }>
): string[] {
  const colors = new Set<string>();
  for (const v of variants) {
    const opts = v.options as { color?: string } | null;
    if (opts?.color) colors.add(opts.color);
  }
  return Array.from(colors);
}
