import {
  getTopProducts,
  getSlowSellers,
  getLowStockVariants,
  getStockValue,
  parseRange,
} from "@/lib/analytics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RangeSelector } from "@/components/management/range-selector";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatTk } from "@/lib/utils/currency";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function ProductAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const { range } = await searchParams;
  const dateRange = parseRange(range);

  const [topProducts, slowSellers, lowStock, stockValue] = await Promise.all([
    getTopProducts(dateRange, 10),
    getSlowSellers(10),
    getLowStockVariants(10),
    getStockValue(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Product Analytics</h1>
          <p className="text-sm text-muted-foreground">Best sellers, slow movers, stock health</p>
        </div>
        <RangeSelector />
      </div>

      {/* Stock summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total Stock Value</p>
            <p className="text-2xl font-bold mt-1">{formatTk(stockValue.stockValue)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total Units in Stock</p>
            <p className="text-2xl font-bold mt-1">{stockValue.totalUnits}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Active Variants</p>
            <p className="text-2xl font-bold mt-1">{stockValue.variantCount}</p>
          </CardContent>
        </Card>
      </div>

      {/* Top sellers */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Top Sellers (by units sold)</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8">#</TableHead>
                <TableHead>Product</TableHead>
                <TableHead className="text-right">Units Sold</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-6 text-muted-foreground text-sm">
                    No sales in this period
                  </TableCell>
                </TableRow>
              ) : (
                topProducts.map((p, i) => (
                  <TableRow key={p.productId}>
                    <TableCell className="text-xs text-muted-foreground">{i + 1}</TableCell>
                    <TableCell className="text-sm font-medium">{p.productName}</TableCell>
                    <TableCell className="text-right font-semibold text-sm">{p.unitsSold}</TableCell>
                    <TableCell className="text-right text-sm">{formatTk(p.revenue)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Slow sellers */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Slow Sellers (no sales in last 30 days)</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead className="text-right">Available Stock</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {slowSellers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={2} className="text-center py-6 text-muted-foreground text-sm">
                    No slow sellers — all products have recent sales 🎉
                  </TableCell>
                </TableRow>
              ) : (
                slowSellers.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="text-sm">
                      <Link href={`/admin/products/${p.id}`} className="hover:text-primary">
                        {p.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      <Badge variant={p.stock <= 0 ? "destructive" : p.stock <= 5 ? "secondary" : "outline"}>
                        {p.stock}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Low stock */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Low Stock Variants (≤ 5 units)</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead className="hidden md:table-cell">SKU</TableHead>
                <TableHead className="text-right">Stock</TableHead>
                <TableHead className="text-right hidden sm:table-cell">Reserved</TableHead>
                <TableHead className="text-right">Available</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lowStock.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6 text-muted-foreground text-sm">
                    No low-stock variants. All good.
                  </TableCell>
                </TableRow>
              ) : (
                lowStock.map((v) => {
                  const opts = v.options as { color?: string; size?: string };
                  const stock = v.inventory?.quantity ?? 0;
                  const reserved = v.inventory?.reserved ?? 0;
                  const available = stock - reserved;
                  return (
                    <TableRow key={v.id}>
                      <TableCell className="text-sm">
                        <Link href={`/admin/products/${v.productId}`} className="hover:text-primary">
                          {v.product.name}
                        </Link>
                        <p className="text-xs text-muted-foreground">
                          {[opts.color, opts.size].filter(Boolean).join(" / ")}
                        </p>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-xs font-mono">{v.sku}</TableCell>
                      <TableCell className="text-right text-sm">{stock}</TableCell>
                      <TableCell className="text-right text-sm hidden sm:table-cell">{reserved}</TableCell>
                      <TableCell className="text-right text-sm">
                        <Badge variant={available <= 0 ? "destructive" : "secondary"}>
                          {available}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
