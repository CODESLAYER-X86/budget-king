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

  let coupons: any[] = [];
  try {
    if (db.coupon) {
      coupons = await db.coupon.findMany({
        orderBy: { createdAt: "desc" },
        include: {
          _count: {
            select: { usages: true },
          },
        },
      });
    }
  } catch (err) {
    console.error("Error fetching coupons:", err);
  }

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
        actualUsagesCount: c._count?.usages ?? 0,
        startDate: c.startDate ? new Date(c.startDate).toISOString() : new Date().toISOString(),
        expiresAt: c.expiresAt ? new Date(c.expiresAt).toISOString() : null,
        isActive: c.isActive,
        createdAt: c.createdAt ? new Date(c.createdAt).toISOString() : new Date().toISOString(),
      }))}
    />
  );
}
