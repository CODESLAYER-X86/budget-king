import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { ProductForm } from "../product-form";

export const dynamic = "force-dynamic";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [product, categories] = await Promise.all([
    db.product.findUnique({
      where: { id },
      include: {
        category: true,
        variants: {
          include: { inventory: true },
          orderBy: { price: "asc" },
        },
        images: { orderBy: { sortOrder: "asc" } },
        attributeValues: { include: { attribute: true } },
      },
    }),
    db.category.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    }),
  ]);

  if (!product) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Edit Product</h1>
        <p className="text-sm text-muted-foreground">{product.name}</p>
      </div>
      <ProductForm categories={categories} product={product} />
    </div>
  );
}
