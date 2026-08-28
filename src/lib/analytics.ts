/**
 * Budget King BD — Analytics data access layer
 *
 * All functions are server-side only. They use Prisma aggregates
 * to compute metrics on demand. For high-traffic production,
 * consider materialized views or a nightly rollup table — but
 * for MVP these queries are fast enough on Supabase Postgres.
 */

import { db } from "@/lib/db";
import type { OrderStatus } from "@prisma/client";

export type DateRange = {
  from: Date;
  to: Date;
};

export function lastNDays(days: number): DateRange {
  const to = new Date();
  to.setHours(23, 59, 59, 999);
  const from = new Date(to);
  from.setDate(from.getDate() - days + 1);
  from.setHours(0, 0, 0, 0);
  return { from, to };
}

export function parseRange(rangeParam?: string): DateRange {
  switch (rangeParam) {
    case "7d":
      return lastNDays(7);
    case "30d":
      return lastNDays(30);
    case "90d":
      return lastNDays(90);
    case "ytd":
      const start = new Date(new Date().getFullYear(), 0, 1);
      return { from: start, to: new Date() };
    case "all":
    default:
      return { from: new Date(0), to: new Date() };
  }
}

// ============================================================
// SALES METRICS
// ============================================================

export async function getSalesMetrics(range: DateRange) {
  const where = {
    createdAt: { gte: range.from, lte: range.to },
    status: { notIn: ["CANCELLED", "DELIVERY_FAILED"] as OrderStatus[] },
  };

  const [agg, count, delivered, cancelled, pending] = await Promise.all([
    db.order.aggregate({
      where,
      _sum: { subtotal: true, discount: true, deliveryCharge: true, total: true },
      _avg: { total: true },
    }),
    db.order.count({ where }),
    db.order.count({ where: { ...where, status: "DELIVERED" } }),
    db.order.count({
      where: {
        createdAt: { gte: range.from, lte: range.to },
        status: "CANCELLED",
      },
    }),
    db.order.count({
      where: {
        createdAt: { gte: range.from, lte: range.to },
        status: { in: ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED"] },
      },
    }),
  ]);

  return {
    grossMerchandiseValue: Number(agg._sum.subtotal ?? 0),
    discounts: Number(agg._sum.discount ?? 0),
    deliveryRevenue: Number(agg._sum.deliveryCharge ?? 0),
    netSales: Number(agg._sum.total ?? 0),
    totalOrders: count,
    deliveredOrders: delivered,
    cancelledOrders: cancelled,
    pendingOrders: pending,
    averageOrderValue: Number(agg._avg.total ?? 0),
    cancellationRate: count > 0 ? (cancelled / count) * 100 : 0,
    conversionRate: count > 0 ? (delivered / count) * 100 : 0,
  };
}

export async function getDailySalesSeries(range: DateRange) {
  // Group by day using raw SQL for efficiency
  const rows = await db.$queryRaw<Array<{
    day: Date;
    orders: bigint;
    revenue: number;
    delivered: bigint;
  }>>`
    SELECT
      DATE_TRUNC('day', "createdAt") AS day,
      COUNT(*) AS orders,
      COALESCE(SUM(total), 0) AS revenue,
      COUNT(CASE WHEN status = 'DELIVERED' THEN 1 END) AS delivered
    FROM orders
    WHERE "createdAt" >= ${range.from} AND "createdAt" <= ${range.to}
      AND status NOT IN ('CANCELLED', 'DELIVERY_FAILED')
    GROUP BY day
    ORDER BY day ASC
  `;

  return rows.map((r) => ({
    day: new Date(r.day),
    orders: Number(r.orders),
    revenue: Number(r.revenue),
    delivered: Number(r.delivered),
  }));
}

// ============================================================
// PRODUCT METRICS
// ============================================================

export async function getTopProducts(range: DateRange, limit = 10) {
  const items = await db.orderItem.findMany({
    where: {
      order: {
        createdAt: { gte: range.from, lte: range.to },
        status: { notIn: ["CANCELLED", "DELIVERY_FAILED"] as OrderStatus[] },
      },
    },
    select: {
      productId: true,
      productName: true,
      quantity: true,
      totalPrice: true,
    },
  });

  const grouped = new Map<
    string,
    { productId: string; productName: string; unitsSold: number; revenue: number }
  >();

  for (const item of items) {
    const existing = grouped.get(item.productId);
    if (existing) {
      existing.unitsSold += item.quantity;
      existing.revenue += Number(item.totalPrice);
    } else {
      grouped.set(item.productId, {
        productId: item.productId,
        productName: item.productName,
        unitsSold: item.quantity,
        revenue: Number(item.totalPrice),
      });
    }
  }

  return Array.from(grouped.values())
    .sort((a, b) => b.unitsSold - a.unitsSold)
    .slice(0, limit);
}

export async function getSlowSellers(limit = 10) {
  // Products with zero or very few sales in last 30 days
  const thirty = lastNDays(30);
  const topProductIds = (await getTopProducts(thirty, 1000)).map((p) => p.productId);

  const slowProducts = await db.product.findMany({
    where: {
      status: "ACTIVE",
      ...(topProductIds.length > 0
        ? { id: { notIn: topProductIds } }
        : {}),
    },
    include: {
      variants: {
        select: {
          inventory: { select: { quantity: true, reserved: true } },
        },
      },
    },
    take: limit,
    orderBy: { updatedAt: "asc" },
  });

  return slowProducts.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    stock: p.variants.reduce(
      (sum, v) => sum + (v.inventory?.quantity ?? 0) - (v.inventory?.reserved ?? 0),
      0
    ),
  }));
}

export async function getLowStockVariants(limit = 10) {
  return db.productVariant.findMany({
    where: {
      status: "ACTIVE",
      inventory: { quantity: { lte: 5 } },
    },
    include: {
      product: { select: { name: true, slug: true } },
      inventory: true,
    },
    orderBy: { inventory: { quantity: "asc" } },
    take: limit,
  });
}

export async function getStockValue() {
  const result = await db.productVariant.aggregate({
    where: { status: "ACTIVE" },
    _sum: { price: true },
  });
  // Approximate stock value = sum(variant.price * quantity)
  const variants = await db.productVariant.findMany({
    where: { status: "ACTIVE" },
    include: { inventory: true },
  });
  let stockValue = 0;
  let totalUnits = 0;
  for (const v of variants) {
    const qty = v.inventory?.quantity ?? 0;
    stockValue += Number(v.price) * qty;
    totalUnits += qty;
  }
  return { stockValue, totalUnits, variantCount: variants.length };
}

// ============================================================
// CUSTOMER METRICS
// ============================================================

export async function getCustomerMetrics(range: DateRange) {
  // New customers: profiles created in the range
  const newCustomers = await db.profile.count({
    where: {
      role: "CUSTOMER",
      createdAt: { gte: range.from, lte: range.to },
    },
  });

  // Total registered customers up to end of range
  const totalRegistered = await db.profile.count({
    where: { role: "CUSTOMER", createdAt: { lte: range.to } },
  });

  // Orders split: guest vs registered
  const guestOrders = await db.order.count({
    where: {
      createdAt: { gte: range.from, lte: range.to },
      userId: null,
      status: { notIn: ["CANCELLED", "DELIVERY_FAILED"] as OrderStatus[] },
    },
  });
  const registeredOrders = await db.order.count({
    where: {
      createdAt: { gte: range.from, lte: range.to },
      userId: { not: null },
      status: { notIn: ["CANCELLED", "DELIVERY_FAILED"] as OrderStatus[] },
    },
  });

  // Returning customers: customers with 2+ delivered orders before end of range
  const customersWithMultipleOrders = await db.$queryRaw<bigint[]>`
    SELECT COUNT(DISTINCT "userId")
    FROM orders
    WHERE "userId" IS NOT NULL
      AND status = 'DELIVERED'
      AND "createdAt" <= ${range.to}
    GROUP BY "userId"
    HAVING COUNT(*) >= 2
  `;
  const returningCustomers = customersWithMultipleOrders.length;

  // Total customers who ever placed an order (delivered)
  const customersWithOrders = await db.$queryRaw<bigint[]>`
    SELECT COUNT(DISTINCT "userId")
    FROM orders
    WHERE "userId" IS NOT NULL
      AND status = 'DELIVERED'
      AND "createdAt" <= ${range.to}
  `;
  const totalBuyers = Number(customersWithOrders[0] ?? 0);

  // Average orders per buyer
  const avgOrdersPerBuyer = totalBuyers > 0 ? totalRegistered / totalBuyers : 0;

  return {
    newCustomers,
    totalRegistered,
    totalBuyers,
    returningCustomers,
    guestOrders,
    registeredOrders,
    avgOrdersPerBuyer,
    retentionRate:
      totalBuyers > 0 ? (returningCustomers / totalBuyers) * 100 : 0,
  };
}

// ============================================================
// REWARDS METRICS
// ============================================================

export async function getRewardsMetrics(range: DateRange) {
  const [issued, redeemed, reversed, vouchersIssued, vouchersUsed] = await Promise.all([
    db.coinTransaction.aggregate({
      where: { type: "EARNED", createdAt: { gte: range.from, lte: range.to } },
      _sum: { amount: true },
    }),
    db.coinTransaction.aggregate({
      where: { type: "REDEEMED", createdAt: { gte: range.from, lte: range.to } },
      _sum: { amount: true },
    }),
    db.coinTransaction.aggregate({
      where: { type: "EARNED_REVERSAL", createdAt: { gte: range.from, lte: range.to } },
      _sum: { amount: true },
    }),
    db.customerVoucher.count({
      where: { redeemedAt: { gte: range.from, lte: range.to } },
    }),
    db.customerVoucher.count({
      where: { usedAt: { gte: range.from, lte: range.to } },
    }),
  ]);

  const outstanding = (issued._sum.amount ?? 0) + (redeemed._sum.amount ?? 0) + (reversed._sum.amount ?? 0);

  return {
    coinsIssued: issued._sum.amount ?? 0,
    coinsRedeemed: Math.abs(redeemed._sum.amount ?? 0),
    coinsReversed: Math.abs(reversed._sum.amount ?? 0),
    outstanding,
    vouchersIssued,
    vouchersUsed,
    voucherUsageRate: vouchersIssued > 0 ? (vouchersUsed / vouchersIssued) * 100 : 0,
  };
}

export async function getTopVouchers(limit = 5) {
  const vouchers = await db.voucher.findMany({
    include: {
      _count: { select: { customerVouchers: true } },
      customerVouchers: {
        where: { status: "USED" },
        select: { id: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
  return vouchers
    .map((v) => ({
      id: v.id,
      name: v.name,
      type: v.type,
      value: Number(v.value),
      coinCost: v.coinCost,
      totalRedemptions: v._count.customerVouchers,
      usedCount: v.customerVouchers.length,
    }))
    .sort((a, b) => b.totalRedemptions - a.totalRedemptions)
    .slice(0, limit);
}

// ============================================================
// GROUP METRICS
// ============================================================

export async function getGroupMetrics(range: DateRange) {
  const [
    totalGroups,
    activeGroups,
    newGroupsInRange,
    groupOrdersCount,
    groupOrderValue,
    totalMembers,
    totalSharedProducts,
    totalGroupCartItems,
  ] = await Promise.all([
    db.group.count(),
    db.group.count({ where: { status: "ACTIVE" } }),
    db.group.count({ where: { createdAt: { gte: range.from, lte: range.to } } }),
    db.order.count({
      where: {
        groupOrderId: { not: null },
        createdAt: { gte: range.from, lte: range.to },
      },
    }),
    db.order.aggregate({
      where: {
        groupOrderId: { not: null },
        createdAt: { gte: range.from, lte: range.to },
        status: { notIn: ["CANCELLED", "DELIVERY_FAILED"] as OrderStatus[] },
      },
      _sum: { total: true },
    }),
    db.groupMember.count(),
    db.groupProduct.count(),
    db.groupCartItem.count(),
  ]);

  return {
    totalGroups,
    activeGroups,
    newGroupsInRange,
    groupOrdersCount,
    groupOrderRevenue: Number(groupOrderValue._sum.total ?? 0),
    totalMembers,
    totalSharedProducts,
    totalGroupCartItems,
    avgMembersPerGroup: totalGroups > 0 ? totalMembers / totalGroups : 0,
    groupConversionRate:
      totalSharedProducts > 0 ? (groupOrdersCount / totalSharedProducts) * 100 : 0,
  };
}

export async function getTopGroups(limit = 5) {
  const groups = await db.group.findMany({
    include: {
      owner: { select: { email: true, fullName: true } },
      _count: {
        select: { members: true, products: true, cartItems: true, orders: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return groups
    .map((g) => ({
      id: g.id,
      name: g.name,
      code: g.code,
      owner: g.owner.fullName ?? g.owner.email,
      status: g.status,
      memberCount: g._count.members,
      productCount: g._count.products,
      cartItemCount: g._count.cartItems,
      orderCount: g._count.orders,
      createdAt: g.createdAt,
    }))
    .sort((a, b) => b.orderCount - a.orderCount || b.memberCount - a.memberCount)
    .slice(0, limit);
}

// ============================================================
// AGENT / STAFF METRICS
// ============================================================

export async function getAgentMetrics(range: DateRange) {
  // Group orders by assigned agent
  const agents = await db.profile.findMany({
    where: { role: { in: ["AGENT", "ADMIN"] } },
    include: {
      assignedOrders: {
        where: { createdAt: { gte: range.from, lte: range.to } },
        select: { id: true, status: true, total: true },
      },
    },
  });

  return agents
    .map((a) => {
      const total = a.assignedOrders.length;
      const delivered = a.assignedOrders.filter((o) => o.status === "DELIVERED").length;
      const cancelled = a.assignedOrders.filter((o) => o.status === "CANCELLED").length;
      const failed = a.assignedOrders.filter((o) => o.status === "DELIVERY_FAILED").length;
      const pending = a.assignedOrders.filter((o) =>
        ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED"].includes(o.status)
      ).length;
      const revenue = a.assignedOrders
        .filter((o) => o.status === "DELIVERED")
        .reduce((sum, o) => sum + Number(o.total), 0);

      return {
        agentId: a.id,
        name: a.fullName ?? a.email,
        role: a.role,
        assigned: total,
        delivered,
        cancelled,
        failed,
        pending,
        revenue,
        cancellationRate: total > 0 ? (cancelled / total) * 100 : 0,
        deliveryRate: total > 0 ? (delivered / total) * 100 : 0,
      };
    })
    .filter((a) => a.assigned > 0)
    .sort((a, b) => b.assigned - a.assigned);
}

// ============================================================
// ORDER STATUS BREAKDOWN
// ============================================================

export async function getOrderStatusBreakdown(range: DateRange) {
  const grouped = await db.order.groupBy({
    by: ["status"],
    where: { createdAt: { gte: range.from, lte: range.to } },
    _count: { _all: true },
  });

  return grouped.map((g) => ({
    status: g.status,
    count: g._count._all,
  }));
}
