import { config } from "dotenv";
config({ path: ".env", override: true });
import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();

async function main() {
  console.log("Seeding rewards defaults...");

  // Default coin rule: spend tk 2000+ → earn 2000 coins
  await db.coinRule.upsert({
    where: { name: "Standard Reward" },
    create: {
      name: "Standard Reward",
      minPurchase: 2000,
      coinsAwarded: 2000,
      isActive: true,
    },
    update: {},
  });
  console.log("  ✓ Coin rule: Standard Reward (2000+ → 2000 coins)");

  // Default voucher templates
  const vouchers = [
    { name: "tk 20 OFF", type: "FIXED_AMOUNT" as const, value: 20, coinCost: 500, minOrderValue: 0, validDays: 30 },
    { name: "tk 50 OFF", type: "FIXED_AMOUNT" as const, value: 50, coinCost: 1000, minOrderValue: 500, validDays: 30 },
    { name: "tk 100 OFF", type: "FIXED_AMOUNT" as const, value: 100, coinCost: 2000, minOrderValue: 1000, validDays: 30 },
    { name: "10% OFF", type: "PERCENTAGE" as const, value: 10, coinCost: 1500, minOrderValue: 0, validDays: 30 },
  ];

  for (const v of vouchers) {
    await db.voucher.upsert({
      where: { name: v.name },
      create: v,
      update: {},
    });
    console.log(`  ✓ Voucher: ${v.name} (${v.coinCost} coins)`);
  }

  console.log("\n✅ Rewards seed complete!");
}
main().catch(console.error).finally(() => db.$disconnect());
