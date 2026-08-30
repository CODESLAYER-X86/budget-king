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
  const [balanceResult, transactions, vouchers, availableVouchers, rewardSettings] = await Promise.all([
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
          voucher: { select: { code: true, voucher: { select: { name: true } } } },
        },
      }),
      []
    ),
    safeQuery(
      () => db.customerVoucher.findMany({
        where: { userId: session.id },
        include: { voucher: true, order: { select: { orderNumber: true } } },
        orderBy: { redeemedAt: "desc" },
      }),
      []
    ),
    safeQuery(
      () => db.voucher.findMany({
        where: { isActive: true },
        orderBy: { coinCost: "asc" },
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
          voucherCode: t.voucher?.code ?? null,
          voucherName: t.voucher?.voucher.name ?? null,
        }))}
        myVouchers={vouchers.map((v) => ({
          id: v.id,
          code: v.code,
          status: v.status,
          redeemedAt: v.redeemedAt.toISOString(),
          expiresAt: v.expiresAt.toISOString(),
          usedOnOrderNumber: v.order?.orderNumber ?? null,
          voucher: {
            name: v.voucher.name,
            type: v.voucher.type,
            value: Number(v.voucher.value),
            minOrderValue: Number(v.voucher.minOrderValue),
          },
        }))}
        availableVouchers={availableVouchers.map((v) => ({
          id: v.id,
          name: v.name,
          type: v.type,
          value: Number(v.value),
          coinCost: v.coinCost,
          minOrderValue: Number(v.minOrderValue),
          validDays: v.validDays,
        }))}
      />
    </div>
  );
}
