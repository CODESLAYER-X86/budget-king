import { db } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const dynamic = "force-dynamic";

const TYPE_BADGES: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  EARNED: "default",
  EARNED_REVERSAL: "destructive",
  REDEEMED: "secondary",
  REDEEMED_REVERSAL: "outline",
  EXPIRED: "secondary",
  ADMIN_ADJUSTMENT: "outline",
  REFERRAL_BONUS: "default",
};

export default async function AdminCoinLedgerPage() {
  const transactions = await db.coinTransaction.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      user: { select: { email: true, fullName: true } },
      order: { select: { orderNumber: true } },
      voucher: { select: { code: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Coin Ledger</h1>
        <p className="text-sm text-muted-foreground">
          {transactions.length} most recent coin transactions
        </p>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right hidden md:table-cell">Balance After</TableHead>
                <TableHead className="hidden lg:table-cell">Source</TableHead>
                <TableHead className="hidden lg:table-cell">Note</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No transactions yet.
                  </TableCell>
                </TableRow>
              ) : (
                transactions.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(t.createdAt).toLocaleString("en-BD", {
                        day: "numeric", month: "short",
                        hour: "2-digit", minute: "2-digit",
                      })}
                    </TableCell>
                    <TableCell className="text-sm">
                      <p>{t.user.fullName ?? t.user.email}</p>
                    </TableCell>
                    <TableCell>
                      <Badge variant={TYPE_BADGES[t.type] ?? "secondary"} className="text-xs">
                        {t.type.replace(/_/g, " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className={`text-right font-semibold text-sm ${t.amount >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {t.amount >= 0 ? "+" : ""}
                      {t.amount.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right text-sm hidden md:table-cell">
                      {t.balanceAfter.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground hidden lg:table-cell">
                      {t.order ? `Order ${t.order.orderNumber}` : ""}
                      {t.voucher ? `Voucher ${t.voucher.code}` : ""}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground hidden lg:table-cell max-w-xs truncate">
                      {t.note}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
