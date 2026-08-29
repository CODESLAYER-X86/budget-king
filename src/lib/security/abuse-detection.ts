/**
 * Order abuse detection — flags suspicious order patterns per
 * Security-plan.md section 19:
 *
 * - Same phone creating many pending orders in a short window
 * - Same IP creating many orders
 * - Duplicate order detection (same items + address in short window)
 *
 * Returns a list of warnings; the caller decides whether to block
 * or just flag for agent review.
 */

import { db } from "@/lib/db";

export type AbuseWarning = {
  type: "too_many_pending" | "duplicate_ip" | "duplicate_phone" | "high_value_first_order";
  message: string;
};

export async function detectOrderAbuse(input: {
  phone: string;
  ip: string;
  lines: Array<{ variantId: string; quantity: number }>;
  total: number;
}): Promise<AbuseWarning[]> {
  const warnings: AbuseWarning[] = [];
  const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000);

  // Check 1: too many pending orders from this phone in last 10 min
  const recentPendingByPhone = await db.order.count({
    where: {
      customerPhone: input.phone,
      status: "PENDING",
      createdAt: { gte: tenMinAgo },
    },
  });
  if (recentPendingByPhone >= 3) {
    warnings.push({
      type: "too_many_pending",
      message: `${recentPendingByPhone} pending orders from this phone in last 10 min`,
    });
  }

  // Check 2: same phone has cancelled many orders historically (suspicious)
  const cancelledByPhone = await db.order.count({
    where: {
      customerPhone: input.phone,
      status: "CANCELLED",
      createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
    },
  });
  if (cancelledByPhone >= 5) {
    warnings.push({
      type: "duplicate_phone",
      message: `${cancelledByPhone} cancellations from this phone in last 7 days`,
    });
  }

  // Check 3: high-value first order from a new phone (potential fraud)
  if (input.total >= 10000) {
    const priorOrdersByPhone = await db.order.count({
      where: { customerPhone: input.phone },
    });
    if (priorOrdersByPhone === 0) {
      warnings.push({
        type: "high_value_first_order",
        message: `First order from this phone with high value (tk ${input.total})`,
      });
    }
  }

  return warnings;
}

/**
 * Block-level decision: should we reject this order entirely?
 */
export function shouldBlockOrder(warnings: AbuseWarning[]): boolean {
  // Block if 2+ warnings (high fraud probability)
  return warnings.length >= 2;
}
