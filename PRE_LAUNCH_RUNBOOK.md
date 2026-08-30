# 🚀 Budget King — Pre-Launch Reset & Launch Runbook

> **INSTRUCTION FOR AI & DEVELOPERS:**
> This document outlines the exact, automated procedure to reset all test data and initialize clean business metrics immediately before opening the store to real public customers.
>
> **DO NOT RUN THIS DURING DEVELOPMENT.** Run this only when the store owner explicitly says: *"Ready for launch"* or *"Reset test data for launch"*.

---

## 🎯 1. Purpose
During development and QA testing, dozens of test orders, test coin earnings, test coupon usages, and inventory stock reservations are generated.

Running the pre-launch reset ensures:
- **Total Revenue & Sales Analytics** reset cleanly to **৳0.00**.
- **Reserved Inventory** resets to **0** (making 100% of physical stock available for buyers).
- **Coin Balances** reset so all customers start with fresh loyalty wallets.
- **Promo Codes (`EID50`)** reset their usage limits so real customers can redeem them.

---

## 🛡️ 2. Safety Safeguards (What is Protected)

The reset script will **NEVER** modify or delete any of the following:
- ✅ **Products & Variants**: All shirts, options, sizes, prices, and images remain 100% intact.
- ✅ **Categories**: Category tree (`Fashion`, `Shirts`, `Casual Shirts`, etc.) remains intact.
- ✅ **Delivery Zones**: Dhaka (৳80), Outside Dhaka (৳130) remain intact.
- ✅ **Store Configuration & Reward Settings**: Coin exchange rates (`20 Coins = ৳1`), margin caps, and rules remain intact.
- ✅ **Admin & Staff Accounts**: Supreme Admin, Admin, and Moderator logins remain untouched.
- ✅ **Store Promo Codes**: `EID50` and marketing coupons remain active and ready for customers.

---

## ⚡ 3. The Execution Command

When the store owner gives the green light to launch, execute this single command:

```bash
npx -y tsx scripts/pre-launch-cleanup.ts --confirm
```

---

## 📋 4. What the Script Automatically Cleans

| Table | Action | Impact |
| :--- | :--- | :--- |
| `Order` | Purged | Resets total orders and revenue to **৳0.00**. |
| `OrderItem` | Purged | Cleans test item records. |
| `OrderStatusHistory` | Purged | Cleans test delivery transitions. |
| `CoinTransaction` | Purged | Resets test customer coin wallets to **0 coins**. |
| `CustomerVoucher` | Purged | Cleans legacy test voucher records. |
| `CouponUsage` | Purged | Clears promo code redemption logs. |
| `Coupon` | `usedCount = 0` | Resets storewide and per-user redemption counters. |
| `Inventory` | `reserved = 0` | Releases all held/reserved items back to available stock. |
| `CartItem` | Purged | Cleans abandoned test carts. |
| `AuditLog` | Purged | Cleans noisy development audit events. |

---

## ✅ 5. Post-Launch Verification Checklist

After running the command:
1. Open `/admin` $\rightarrow$ Verify **Total Revenue is ৳0.00** and **Total Orders is 0**.
2. Open `/shop` $\rightarrow$ Verify all shirts and category pills display properly with active stock.
3. Open `/rewards` $\rightarrow$ Verify coin balance is 0 and active promo codes (`EID50`) are visible.
4. When the first real customer purchases $\rightarrow$ Order `#BK-2026-000001` starts the real store timeline!
