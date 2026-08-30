/**
 * BUDGET KING — PRE-LAUNCH CLEANUP SCRIPT
 *
 * Purpose:
 * Safely purges all simulated test orders, test transactions, and reservations
 * so the store launches with 0 revenue, 0 fake orders, and 100% accurate stock.
 *
 * Safety Safeguards:
 * - Requires explicit --confirm flag to execute.
 * - NEVER deletes Products, ProductVariants, Categories, DeliveryZones, RewardSettings, or Staff/Admin Profiles.
 *
 * Usage:
 *   npx tsx scripts/pre-launch-cleanup.ts --confirm
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const isConfirmed = process.argv.includes("--confirm");

  console.log("==================================================");
  console.log("👑 BUDGET KING — PRE-LAUNCH TEST DATA PURGE");
  console.log("==================================================\n");

  if (!isConfirmed) {
    console.warn("⚠️  DRY RUN MODE: No data was modified.");
    console.warn("👉 To execute the purge, run:");
    console.warn("   npx tsx scripts/pre-launch-cleanup.ts --confirm\n");
    return;
  }

  console.log("🚀 Starting pre-launch cleanup...\n");

  const results = await prisma.$transaction(async (tx) => {
    // 1. Delete Order Status History
    const statusHistory = await tx.orderStatusHistory.deleteMany();
    console.log(`✓ Deleted ${statusHistory.count} order status history entries.`);

    // 2. Delete Order Items
    const orderItems = await tx.orderItem.deleteMany();
    console.log(`✓ Deleted ${orderItems.count} test order items.`);

    // 3. Delete Customer Vouchers
    const customerVouchers = await tx.customerVoucher.deleteMany();
    console.log(`✓ Deleted ${customerVouchers.count} test customer vouchers.`);

    // 4. Delete Coupon Usages & Reset Coupon Usage Counters
    const couponUsages = await tx.couponUsage.deleteMany();
    console.log(`✓ Deleted ${couponUsages.count} promo coupon usage records.`);

    await tx.coupon.updateMany({
      data: { usedCount: 0 },
    });
    console.log(`✓ Reset all promo code usage counts to 0.`);

    // 5. Delete Orders
    const orders = await tx.order.deleteMany();
    console.log(`✓ Deleted ${orders.count} test orders (Revenue reset to ৳0.00).`);

    // 6. Delete Coin Transactions (Reset all coin balances to 0)
    const coinTxs = await tx.coinTransaction.deleteMany();
    console.log(`✓ Deleted ${coinTxs.count} test coin transactions.`);

    // 7. Reset Inventory Reserved Stock to 0
    const inventoryReset = await tx.inventory.updateMany({
      data: { reserved: 0 },
    });
    console.log(`✓ Reset reserved stock on ${inventoryReset.count} inventory items (all physical stock now available).`);

    // 8. Delete Test Cart Items
    const cartItems = await tx.cartItem.deleteMany();
    console.log(`✓ Deleted ${cartItems.count} test cart items.`);

    // 9. Delete Audit Logs from testing
    const auditLogs = await tx.auditLog.deleteMany();
    console.log(`✓ Deleted ${auditLogs.count} development audit log records.`);

    return {
      orders: orders.count,
      orderItems: orderItems.count,
      coinTxs: coinTxs.count,
      cartItems: cartItems.count,
    };
  });

  console.log("\n==================================================");
  console.log("✅ PRE-LAUNCH CLEANUP COMPLETED SUCCESSFULLY!");
  console.log("==================================================");
  console.log(`• Total Revenue: ৳0.00 (Ready for real orders)`);
  console.log(`• Total Orders Purged: ${results.orders}`);
  console.log(`• Coin Balances Reset: All users start at 0`);
  console.log(`• Products & Categories: 100% INTACT & PRESERVED`);
  console.log(`• Admin & Staff Logins: 100% INTACT & PRESERVED`);
  console.log("==================================================\n");
}

main()
  .catch((e) => {
    console.error("❌ Cleanup failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
