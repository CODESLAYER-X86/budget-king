import { db } from "@/lib/db";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Package, ChevronRight } from "lucide-react";
import { formatTk } from "@/lib/utils/currency";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const products = await db.product.findMany({
    include: {
      category: { select: { name: true } },
      _count: { select: { variants: true } },
      variants: {
        select: { inventory: { select: { quantity: true, reserved: true } } },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Products</h1>
          <p className="text-sm text-muted-foreground">
            {products.length} total products
          </p>
        </div>
        <Link href="/admin/products/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Add Product
          </Button>
        </Link>
      </div>

      {products.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <Package className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <p className="mt-3 text-muted-foreground">No products yet.</p>
          <Link href="/admin/products/new">
            <Button className="mt-3">Add your first product</Button>
          </Link>
        </div>
      ) : (
        <div className="rounded-lg border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="hidden md:table-cell">Category</TableHead>
                <TableHead className="text-right">Base Price</TableHead>
                <TableHead className="text-center hidden sm:table-cell">Variants</TableHead>
                <TableHead className="text-center hidden sm:table-cell">Stock</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((p) => {
                const totalStock = p.variants.reduce(
                  (sum, v) => sum + (v.inventory?.quantity ?? 0) - (v.inventory?.reserved ?? 0),
                  0
                );
                return (
                  <TableRow key={p.id} className="hover:bg-muted/50">
                    <TableCell>
                      <Link
                        href={`/admin/products/${p.id}`}
                        className="font-medium text-sm hover:text-primary"
                      >
                        {p.name}
                      </Link>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                      {p.category.name}
                    </TableCell>
                    <TableCell className="text-right font-medium text-sm">
                      {formatTk(p.basePrice)}
                    </TableCell>
                    <TableCell className="text-center text-sm">{p._count.variants}</TableCell>
                    <TableCell className="text-center text-sm">
                      <Badge
                        variant={totalStock <= 0 ? "destructive" : totalStock <= 5 ? "secondary" : "outline"}
                      >
                        {totalStock}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant={
                          p.status === "ACTIVE" ? "default" :
                          p.status === "OUT_OF_STOCK" ? "destructive" :
                          p.status === "ARCHIVED" ? "secondary" :
                          "outline"
                        }
                      >
                        {p.status.replace(/_/g, " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Link href={`/admin/products/${p.id}`}>
                        <Button variant="ghost" size="icon">
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
