import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { CouponsClient } from "./coupons-client";

export const dynamic = "force-dynamic";

export default async function AdminCouponsPage() {
  const session = await getSession();
  if (!session?.profile || session.profile.role !== "ADMIN") {
    redirect("/login");
  }

  const coupons = await db.coupon.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { usages: true },
      },
    },
  });

  return (
    <CouponsClient
      coupons={coupons.map((c) => ({
        id: c.id,
        code: c.code,
        description: c.description,
        type: c.type,
        value: Number(c.value),
        maxDiscount: c.maxDiscount ? Number(c.maxDiscount) : null,
        minOrderValue: Number(c.minOrderValue),
        totalUsageLimit: c.totalUsageLimit,
        perUserLimit: c.perUserLimit,
        usedCount: c.usedCount,
        actualUsagesCount: c._count.usages,
        startDate: c.startDate.toISOString(),
        expiresAt: c.expiresAt ? c.expiresAt.toISOString() : null,
        isActive: c.isActive,
        createdAt: c.createdAt.toISOString(),
      }))}
    />
  );
}
