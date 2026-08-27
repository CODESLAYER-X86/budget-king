/**
 * Budget King BD — Seed Script
 *
 * Seeds the database with:
 * - Categories (Fashion > Shirts > Casual/Formal/Oversized)
 * - 6 sample products with variants + inventory
 * - 2 delivery zones (Inside Dhaka, Outside Dhaka)
 * - Homepage hero section
 *
 * NOTE: Auth user creation requires the Supabase service_role key (a JWT, NOT the
 * database password). The user has not provided this yet. To create the admin
 * account, the user should:
 *   1. Sign up via the dev sign-in form at /login with any email/password
 *   2. Run the SQL below in the Supabase SQL Editor to elevate to ADMIN:
 *
 *      UPDATE profiles SET role = 'ADMIN', "isStaff" = true
 *      WHERE email = 'YOUR_EMAIL@example.com';
 */

import { PrismaClient } from "@prisma/client";
import { config } from "dotenv";

// Force load .env, overriding Bun's auto-loaded env (which may be stale)
config({ path: ".env", override: true });

const db = new PrismaClient({
  log: ["error", "warn"],
});

const SAMPLE_SHIRT_IMAGES = {
  oxfordBlack:
    "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600&h=800&fit=crop",
  oxfordWhite:
    "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=600&h=800&fit=crop",
  casualBlack:
    "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=600&h=800&fit=crop",
  casualBlue:
    "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=600&h=800&fit=crop",
  formalWhite:
    "https://images.unsplash.com/photo-1603252109303-2751441dd157?w=600&h=800&fit=crop",
  oversizedOlive:
    "https://images.unsplash.com/photo-1620012253295-c15cc3e65df4?w=600&h=800&fit=crop",
};

async function main() {
  console.log("Seeding Budget King BD database...");
  console.log("DATABASE_URL:", process.env.DATABASE_URL?.substring(0, 60) + "...");

  // 1. Categories
  const fashion = await db.category.upsert({
    where: { slug: "fashion" },
    create: { name: "Fashion", slug: "fashion", sortOrder: 0 },
    update: {},
  });
  const shirts = await db.category.upsert({
    where: { slug: "shirts" },
    create: {
      name: "Shirts",
      slug: "shirts",
      parentId: fashion.id,
      sortOrder: 1,
      description: "Quality shirts for every occasion.",
    },
    update: {},
  });
  await db.category.upsert({
    where: { slug: "casual-shirts" },
    create: {
      name: "Casual Shirts",
      slug: "casual-shirts",
      parentId: shirts.id,
      sortOrder: 1,
    },
    update: {},
  });
  await db.category.upsert({
    where: { slug: "formal-shirts" },
    create: {
      name: "Formal Shirts",
      slug: "formal-shirts",
      parentId: shirts.id,
      sortOrder: 2,
    },
    update: {},
  });
  await db.category.upsert({
    where: { slug: "oversized-shirts" },
    create: {
      name: "Oversized Shirts",
      slug: "oversized-shirts",
      parentId: shirts.id,
      sortOrder: 3,
    },
    update: {},
  });
  console.log("  ✓ Categories created");

  // 2. Delivery zones
  await db.deliveryZone.upsert({
    where: { name: "Inside Dhaka" },
    create: {
      name: "Inside Dhaka",
      charge: 80,
      estimatedDays: 1,
      divisions: ["Dhaka"],
      isActive: true,
    },
    update: {},
  });
  await db.deliveryZone.upsert({
    where: { name: "Outside Dhaka" },
    create: {
      name: "Outside Dhaka",
      charge: 120,
      estimatedDays: 3,
      divisions: [],
      isActive: true,
    },
    update: {},
  });
  console.log("  ✓ Delivery zones created");

  // 3. Products
  const products = [
    {
      name: "Oxford Casual Shirt",
      slug: "oxford-casual-shirt",
      categorySlug: "casual-shirts",
      shortDescription: "Premium regular-fit cotton shirt.",
      description:
        "Material: 100% Cotton\nFit: Regular\nSleeve: Full\nPattern: Solid\nCare: Machine wash cold",
      brand: "Budget King",
      basePrice: 699,
      isFeatured: true,
      variants: [
        { color: "Black", size: "M", sku: "OXF-BLK-M", price: 699, stock: 15 },
        { color: "Black", size: "L", sku: "OXF-BLK-L", price: 699, stock: 20 },
        { color: "Black", size: "XL", sku: "OXF-BLK-XL", price: 699, stock: 8 },
        { color: "White", size: "M", sku: "OXF-WHT-M", price: 699, stock: 12 },
        { color: "White", size: "L", sku: "OXF-WHT-L", price: 699, stock: 18 },
        { color: "White", size: "XL", sku: "OXF-WHT-XL", price: 699, stock: 0 },
      ],
      images: [SAMPLE_SHIRT_IMAGES.oxfordBlack, SAMPLE_SHIRT_IMAGES.oxfordWhite],
    },
    {
      name: "Premium Casual Shirt",
      slug: "premium-casual-shirt",
      categorySlug: "casual-shirts",
      shortDescription: "Soft brushed cotton casual shirt.",
      description:
        "Material: 100% Brushed Cotton\nFit: Regular\nSleeve: Full\nPattern: Solid",
      brand: "Budget King",
      basePrice: 899,
      isFeatured: true,
      variants: [
        { color: "Black", size: "M", sku: "PRM-CSL-BLK-M", price: 899, stock: 10 },
        { color: "Black", size: "L", sku: "PRM-CSL-BLK-L", price: 899, stock: 14 },
        { color: "Navy", size: "L", sku: "PRM-CSL-NAV-L", price: 899, stock: 7 },
        { color: "Navy", size: "XL", sku: "PRM-CSL-NAV-XL", price: 899, stock: 5 },
      ],
      images: [SAMPLE_SHIRT_IMAGES.casualBlack, SAMPLE_SHIRT_IMAGES.casualBlue],
    },
    {
      name: "Classic Formal Shirt",
      slug: "classic-formal-shirt",
      categorySlug: "formal-shirts",
      shortDescription: "Crisp white formal shirt for office and occasions.",
      description:
        "Material: 65% Cotton, 35% Polyester\nFit: Slim\nSleeve: Full\nPattern: Solid",
      brand: "Budget King",
      basePrice: 749,
      isFeatured: true,
      variants: [
        { color: "White", size: "M", sku: "CLF-FRM-WHT-M", price: 749, stock: 25 },
        { color: "White", size: "L", sku: "CLF-FRM-WHT-L", price: 749, stock: 30 },
        { color: "White", size: "XL", sku: "CLF-FRM-WHT-XL", price: 749, stock: 18 },
        { color: "White", size: "XXL", sku: "CLF-FRM-WHT-XXL", price: 799, stock: 6 },
      ],
      images: [SAMPLE_SHIRT_IMAGES.formalWhite],
    },
    {
      name: "Oversized Drop-Shoulder Shirt",
      slug: "oversized-drop-shoulder-shirt",
      categorySlug: "oversized-shirts",
      shortDescription: "Trendy oversized fit, perfect for street style.",
      description:
        "Material: 100% Cotton\nFit: Oversized\nSleeve: Long\nPattern: Solid",
      brand: "Budget King",
      basePrice: 999,
      isFeatured: true,
      variants: [
        { color: "Olive", size: "M", sku: "OVS-DRP-OLV-M", price: 999, stock: 8 },
        { color: "Olive", size: "L", sku: "OVS-DRP-OLV-L", price: 999, stock: 12 },
        { color: "Olive", size: "XL", sku: "OVS-DRP-OLV-XL", price: 999, stock: 6 },
        { color: "Black", size: "L", sku: "OVS-DRP-BLK-L", price: 999, stock: 4 },
      ],
      images: [SAMPLE_SHIRT_IMAGES.oversizedOlive],
    },
    {
      name: "Everyday Oxford Shirt",
      slug: "everyday-oxford-shirt",
      categorySlug: "casual-shirts",
      shortDescription: "Versatile everyday shirt, goes with anything.",
      description:
        "Material: 100% Cotton Oxford\nFit: Regular\nSleeve: Full\nPattern: Solid",
      brand: "Budget King",
      basePrice: 599,
      isFeatured: false,
      variants: [
        { color: "White", size: "M", sku: "EVD-OXF-WHT-M", price: 599, stock: 22 },
        { color: "White", size: "L", sku: "EVD-OXF-WHT-L", price: 599, stock: 18 },
        { color: "Black", size: "L", sku: "EVD-OXF-BLK-L", price: 599, stock: 3 },
      ],
      images: [SAMPLE_SHIRT_IMAGES.oxfordWhite],
    },
    {
      name: "Slim Fit Casual Shirt",
      slug: "slim-fit-casual-shirt",
      categorySlug: "casual-shirts",
      shortDescription: "Tailored slim-fit shirt for a sharp look.",
      description:
        "Material: 97% Cotton, 3% Elastane\nFit: Slim\nSleeve: Full\nPattern: Solid",
      brand: "Budget King",
      basePrice: 849,
      isFeatured: false,
      variants: [
        { color: "Navy", size: "M", sku: "SLM-CSL-NAV-M", price: 849, stock: 9 },
        { color: "Navy", size: "L", sku: "SLM-CSL-NAV-L", price: 849, stock: 14 },
        { color: "Black", size: "XL", sku: "SLM-CSL-BLK-XL", price: 849, stock: 7 },
      ],
      images: [SAMPLE_SHIRT_IMAGES.casualBlue],
    },
  ];

  for (const p of products) {
    const category = await db.category.findUnique({
      where: { slug: p.categorySlug },
    });
    if (!category) continue;

    const existing = await db.product.findUnique({ where: { slug: p.slug } });
    if (existing) {
      console.log(`  ⊘ Product exists: ${p.name}`);
      continue;
    }

    const product = await db.product.create({
      data: {
        name: p.name,
        slug: p.slug,
        shortDescription: p.shortDescription,
        description: p.description,
        categoryId: category.id,
        brand: p.brand,
        basePrice: p.basePrice,
        status: "ACTIVE",
        isFeatured: p.isFeatured,
        images: {
          create: p.images.map((url, idx) => ({
            imageUrl: url,
            sortOrder: idx,
            isPrimary: idx === 0,
            altText: `${p.name} ${idx + 1}`,
          })),
        },
        variants: {
          create: p.variants.map((v) => ({
            sku: v.sku,
            price: v.price,
            options: { color: v.color, size: v.size },
            status: "ACTIVE",
          })),
        },
      },
      include: { variants: true },
    });

    for (const variant of product.variants) {
      const stockVal = p.variants.find((v) => v.sku === variant.sku)!.stock;
      const inv = await db.inventory.create({
        data: { variantId: variant.id, quantity: stockVal },
      });
      await db.inventoryMovement.create({
        data: {
          inventoryId: inv.id,
          type: "INITIAL",
          quantity: stockVal,
          note: "Initial seed stock",
        },
      });
    }
    console.log(`  ✓ Product created: ${p.name}`);
  }

  // 4. Homepage hero
  await db.homepageSection.upsert({
    where: { id: "hero-default" },
    create: {
      id: "hero-default",
      sectionType: "HERO",
      title: "Quality That Fits Your Budget",
      subtitle: "Affordable clothing without compromising quality.",
      imageUrl:
        "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=1200&h=900&fit=crop",
      buttonText: "Shop Now",
      buttonLink: "/shop",
      sortOrder: 0,
      isActive: true,
    },
    update: {},
  });
  console.log("  ✓ Homepage hero created");

  console.log("\n✅ Seed complete!");
  console.log("\n📋 To set up the admin account:");
  console.log("   1. Sign up at /login using the dev sign-in form (any email/password)");
  console.log("   2. Run this SQL in the Supabase SQL Editor:");
  console.log("      UPDATE profiles SET role = 'ADMIN', \"isStaff\" = true");
  console.log("      WHERE email = 'YOUR_EMAIL@example.com';");
  console.log("   3. Sign out and back in to refresh your session");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
