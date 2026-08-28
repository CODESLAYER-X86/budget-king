import { db } from "@/lib/db";
import { CoinRuleManager } from "./coin-rule-manager";

export const dynamic = "force-dynamic";

export default async function AdminCoinRulesPage() {
  const rules = await db.coinRule.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Coin Earning Rules</h1>
        <p className="text-sm text-muted-foreground">
          Define how customers earn Budget Coins. Highest matching rule wins per order.
        </p>
      </div>
      <CoinRuleManager
        rules={rules.map((r) => ({
          id: r.id,
          name: r.name,
          minPurchase: Number(r.minPurchase),
          coinsAwarded: r.coinsAwarded,
          isActive: r.isActive,
          startsAt: r.startsAt?.toISOString() ?? null,
          endsAt: r.endsAt?.toISOString() ?? null,
        }))}
      />
    </div>
  );
}
