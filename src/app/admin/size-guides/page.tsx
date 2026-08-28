import { db } from "@/lib/db";
import { SizeGuideManager } from "./size-guide-manager";

export const dynamic = "force-dynamic";

export default async function AdminSizeGuidesPage() {
  const [categories, guides] = await Promise.all([
    db.category.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    }),
    db.sizeGuide.findMany({ include: { category: { select: { name: true } } } }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Size Guides</h1>
        <p className="text-sm text-muted-foreground">
          Configure size charts per category. Shown on product pages.
        </p>
      </div>
      <SizeGuideManager
        categories={categories.map((c) => ({ id: c.id, name: c.name }))}
        guides={guides.map((g) => ({
          categoryId: g.categoryId,
          categoryName: g.category.name,
          title: g.title,
          rows: g.rows as Array<Record<string, string>>,
          notes: g.notes,
        }))}
      />
    </div>
  );
}
