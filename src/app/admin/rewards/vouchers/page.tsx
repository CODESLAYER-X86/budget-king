import { db } from "@/lib/db";
import { VoucherManager } from "./voucher-manager";

export const dynamic = "force-dynamic";

export default async function AdminVouchersPage() {
  const vouchers = await db.voucher.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { customerVouchers: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Voucher Templates</h1>
        <p className="text-sm text-muted-foreground">
          Define vouchers that customers can redeem with Budget Coins.
        </p>
      </div>
      <VoucherManager
        vouchers={vouchers.map((v) => ({
          id: v.id,
          name: v.name,
          type: v.type,
          value: Number(v.value),
          coinCost: v.coinCost,
          minOrderValue: Number(v.minOrderValue),
          validDays: v.validDays,
          isActive: v.isActive,
          redeemedCount: v._count.customerVouchers,
        }))}
      />
    </div>
  );
}
