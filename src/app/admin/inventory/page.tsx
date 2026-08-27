import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminInventoryPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const { filter } = await searchParams;
  const where =
    filter === "low"
      ? { status: "ACTIVE", inventory: { quantity: { lte: 5 } } }
      : { status: "ACTIVE" };

  const variants = await db.productVariant.findMany({
    where,
    include: {
      product: { select: { name: true, slug: true } },
      inventory: true,
    },
    orderBy: { product: { name: "asc" } },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Inventory</h1>
          <p className="text-sm text-muted-foreground">
            {variants.length} active variants
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/admin/inventory"
            className={`rounded-md border px-3 py-1.5 text-sm ${!filter ? "bg-accent" : "hover:bg-accent"}`}
          >
            All
          </Link>
          <Link
            href="/admin/inventory?filter=low"
            className={`rounded-md border px-3 py-1.5 text-sm ${filter === "low" ? "bg-accent" : "hover:bg-accent"}`}
          >
            Low Stock (≤ 5)
          </Link>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead className="hidden sm:table-cell">Variant</TableHead>
                <TableHead className="text-center">In Stock</TableHead>
                <TableHead className="text-center">Reserved</TableHead>
                <TableHead className="text-center">Available</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="w-24"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {variants.map((v) => {
                const opts = v.options as { color?: string; size?: string };
                const stock = v.inventory?.quantity ?? 0;
                const reserved = v.inventory?.reserved ?? 0;
                const available = stock - reserved;
                return (
                  <TableRow key={v.id}>
                    <TableCell>
                      <Link
                        href={`/admin/products/${v.productId}`}
                        className="font-medium text-sm hover:text-primary"
                      >
                        {v.product.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground font-mono">
                      {v.sku}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-sm">
                      {[opts.color, opts.size].filter(Boolean).join(" / ") || "—"}
                    </TableCell>
                    <TableCell className="text-center text-sm">{stock}</TableCell>
                    <TableCell className="text-center text-sm">{reserved}</TableCell>
                    <TableCell className="text-center text-sm font-semibold">
                      {available}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant={
                          available <= 0 ? "destructive" :
                          available <= 5 ? "secondary" : "outline"
                        }
                      >
                        {available <= 0 ? "Out" : available <= 5 ? "Low" : "OK"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/admin/products/${v.productId}`}
                        className="text-xs text-primary hover:underline"
                      >
                        Edit →
                      </Link>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
