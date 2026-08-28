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

export default async function AdminReferralsPage() {
  const [codes, events, totalCoinsAwarded] = await Promise.all([
    db.referralCode.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { email: true, fullName: true } },
        _count: { select: { events: true } },
      },
    }),
    db.referralEvent.count({ where: { status: "REWARDED" } }),
    db.coinTransaction.aggregate({
      where: { type: "REFERRAL_BONUS" },
      _sum: { amount: true },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Referral Program</h1>
        <p className="text-sm text-muted-foreground">
          {codes.length} active referral codes • {events} successful referrals •{" "}
          {(totalCoinsAwarded._sum.amount ?? 0).toLocaleString()} coins awarded
        </p>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead className="text-right">Uses</TableHead>
                <TableHead className="text-right">Successful</TableHead>
                <TableHead className="text-right hidden sm:table-cell">Coins Awarded</TableHead>
                <TableHead className="hidden md:table-cell">Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {codes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground text-sm">
                    No referral codes created yet.
                  </TableCell>
                </TableRow>
              ) : (
                codes.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-mono text-sm font-semibold">{c.code}</TableCell>
                    <TableCell className="text-sm">
                      {c.user.fullName ?? c.user.email}
                    </TableCell>
                    <TableCell className="text-right text-sm">{c.uses}</TableCell>
                    <TableCell className="text-right text-sm font-semibold">
                      {c.successful}
                    </TableCell>
                    <TableCell className="text-right text-sm hidden sm:table-cell">
                      {c.successful * 500}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                      {new Date(c.createdAt).toLocaleDateString("en-BD")}
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
