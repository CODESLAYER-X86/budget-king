import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { safeQuery } from "@/lib/safe-query";
import { RewardsClient } from "./rewards-client";
import { getRewardSettings } from "@/actions/rewards";

export const dynamic = "force-dynamic";

export default async function RewardsPage() {
  const session = await getSession();
  if (!session?.profile) redirect("/login?next=/rewards");

  // All queries protected — if DB fails (pool exhausted), show defaults instead of 500
  const [balanceResult, transactions, activeCoupons, rewardSettings] = await Promise.all([
    safeQuery(
      () => db.coinTransaction.aggregate({
        where: { userId: session.id },
        _sum: { amount: true },
      }),
      { _sum: { amount: 0 } }
    ),
    safeQuery(
      () => db.coinTransaction.findMany({
        where: { userId: session.id },
        orderBy: { createdAt: "desc" },
        take: 30,
        include: {
          order: { select: { orderNumber: true } },
        },
      }),
      []
    ),
    safeQuery(
      () => db.coupon.findMany({
        where: { isActive: true },
        orderBy: { createdAt: "desc" },
      }),
      []
    ),
    getRewardSettings(),
  ]);

  const balance = balanceResult._sum.amount ?? 0;

  return (
    <div className="container mx-auto px-4 py-8">
      <RewardsClient
        balance={balance}
        rewardSettings={rewardSettings}
        transactions={transactions.map((t) => ({
          id: t.id,
          type: t.type,
          amount: t.amount,
          balanceAfter: t.balanceAfter,
          note: t.note,
          createdAt: t.createdAt.toISOString(),
          orderNumber: t.order?.orderNumber ?? null,
        }))}
        activeCoupons={activeCoupons.map((c) => ({
          id: c.id,
          code: c.code,
          description: c.description,
          type: c.type,
          value: Number(c.value),
          maxDiscount: c.maxDiscount ? Number(c.maxDiscount) : null,
          minOrderValue: Number(c.minOrderValue),
          expiresAt: c.expiresAt ? c.expiresAt.toISOString() : null,
        }))}
      />
    </div>
  );
}
