# 🪙 Budget King BD — Rewards System

The rewards system should be designed as a **ledger-based system**, not simply a `coin_balance` field.

The basic flow:

```text
Eligible Order
      ↓
Calculate Coins
      ↓
Create Coin Transaction
      ↓
Customer Balance
      ↓
Redeem Coins
      ↓
Receive Voucher
      ↓
Use Voucher on Order
```

And importantly:

```text
Cancel / Return
      ↓
Reverse Previously Awarded Coins
```

---

# 1. 🪙 Coin earning rules

Your current concept is:

> **Spend ৳2,000 → receive 2,000 coins.**

I recommend making this **admin-configurable**, rather than hard-coding it.

### Example rule

```text
Minimum eligible purchase: ৳2,000
Coins awarded:             2,000
```

Later Admin can change it to:

```text
৳1,000 → 500 coins
৳2,000 → 1,500 coins
৳5,000 → 5,000 coins
```

without changing application code.

---

# 2. What amount qualifies?

You need to define whether the reward is based on:

```text
Product subtotal
```

or:

```text
Subtotal + delivery
```

or:

```text
Final amount after voucher
```

### I recommend:

**Eligible purchase amount = merchandise subtotal after discounts, excluding delivery charges.**

Example:

```text
Products             ৳2,200
Voucher              -৳100
Delivery                ৳80
---------------------------
Customer pays        ৳2,180
```

Eligible amount:

```text
৳2,100
```

if the voucher applies to merchandise.

So the customer qualifies for the ৳2,000 reward.

Delivery should not generate coins.

---

# 3. When should coins be awarded?

**After successful delivery.**

Not when:

* Cart is created
* Checkout begins
* Order is placed
* Order is confirmed

Recommended:

```text
ORDER
  ↓
CONFIRMED
  ↓
SHIPPED
  ↓
DELIVERED
  ↓
Reward eligibility checked
  ↓
Coins awarded
```

This protects against COD abuse.

---

# 4. 🧮 Example

Customer buys:

```text
Shirts       ৳2,400
Voucher       -৳100
Delivery        ৳80
-------------------
Total         ৳2,380
```

Eligible merchandise amount:

```text
৳2,300
```

If your rule is:

```text
৳2,000 → 2,000 coins
```

Customer gets:

```text
🪙 +2,000 coins
```

---

# 5. What happens with ৳4,000?

This is something you should decide now.

There are two models.

### Model A — Threshold reward

```text
৳2,000+ → 2,000 coins
```

Whether ৳2,100 or ৳3,900, the customer gets 2,000.

### Model B — Proportional reward

```text
৳2,000 → 2,000 coins
৳4,000 → 4,000 coins
৳6,000 → 6,000 coins
```

I recommend **Model B** if your intention is essentially:

> 1 taka eligible spending = 1 coin.

Then the rule becomes much easier to understand.

But if you specifically want **fixed rewards per threshold**, use Model A.

Your database should support either.

---

# 6. 🗄️ Reward rules table

Something like:

```text id="w1d5rp"
reward_rules
├── id
├── name
├── rule_type
├── minimum_amount
├── coins_per_unit
├── fixed_coins
├── is_active
├── starts_at
├── ends_at
├── created_by
└── created_at
```

Possible `rule_type`:

```text
THRESHOLD
PROPORTIONAL
```

Example:

```text
THRESHOLD
minimum_amount = 2000
fixed_coins = 2000
```

or:

```text
PROPORTIONAL
minimum_amount = 2000
coins_per_taka = 1
```

---

# 7. 🧾 Coin ledger

This is the **most important technical component**.

Don't store only:

```text
users.coins = 5000
```

Instead:

### `coin_transactions`

```text id="3a6z0m"
coin_transactions
├── id
├── user_id
├── amount
├── transaction_type
├── reference_type
├── reference_id
├── description
├── expires_at
└── created_at
```

Example:

```text id="l7l8u1"
+2,000  Order BK1024
+1,500  Order BK1051
-2,000  Redeemed ৳100 voucher
```

Balance:

```text id="qv9y3j"
2,000
+1,500
-2,000
------
1,500 coins
```

---

# 8. Transaction types

I'd use:

```text id="b2j8vd"
EARNED
REDEEMED
EXPIRED
RETURN_REVERSAL
CANCELLATION_REVERSAL
ADMIN_ADJUSTMENT
BONUS
```

This makes the ledger understandable.

---

# 9. Never delete coin transactions

Suppose:

```text id="h9m7p4"
+2,000 EARNED
```

Then the order is returned.

Don't delete the original transaction.

Create:

```text id="q0k5xm"
-2,000 RETURN_REVERSAL
```

So your history remains:

```text id="g3l9k1"
+2,000 EARNED
-2,000 RETURN_REVERSAL
----------------------
0
```

This is much safer for auditing.

**Analogy:** A bank doesn't erase yesterday's deposit when you withdraw money; it records another transaction.

---

# 10. 🪙 Coin expiration

You mentioned expiration, so I'd support it from the beginning.

There are two approaches.

### Option A — Coins expire individually

Each earning transaction gets:

```text id="7l2s8c"
expires_at
```

Example:

```text id="6v1s5w"
+2,000 coins
Earned: Aug 1
Expires: Feb 1
```

This is the model I'd recommend.

---

# 11. Expiration example

Customer:

```text id="x0f1qy"
Aug 1:
+2,000 coins

Sep 1:
+1,000 coins
```

Suppose the first batch expires Feb 1.

On Feb 1:

```text id="5a7d8p"
+2,000 EARNED
-2,000 EXPIRED
```

The balance decreases accordingly.

---

# 12. FIFO redemption

If different coin batches have different expiration dates, use **FIFO/earliest-expiry-first** logic.

Example:

```text id="2a9s4k"
Batch A: 2,000 coins → expires Jan 1
Batch B: 3,000 coins → expires Apr 1
```

Customer redeems:

```text id="c8x6mn"
2,000 coins
```

Consume:

```text id="o8g3zy"
Batch A first
```

This prevents older coins from unnecessarily expiring while newer coins are spent.

---

# 13. 🎟️ Voucher rules

Your current concept:

```text id="4c9d6w"
2,000 coins
      ↓
৳100 voucher
```

and potentially:

```text id="9q2w4m"
500 coins
      ↓
৳20 voucher
```

These should be configurable.

### `voucher_types`

```text id="j7y3n8"
voucher_types
├── id
├── name
├── coin_cost
├── discount_type
├── discount_value
├── minimum_order
├── maximum_discount
├── expires_after_days
├── is_active
└── created_at
```

---

# 14. Example voucher types

```text id="1p3v8m"
Voucher A
৳20 OFF
Cost: 500 coins

Voucher B
৳50 OFF
Cost: 1,000 coins

Voucher C
৳100 OFF
Cost: 2,000 coins
```

Admin can activate/deactivate them.

---

# 15. Fixed vs percentage vouchers

Support both.

### Fixed

```text id="j5z0p4"
৳100 OFF
```

### Percentage

```text id="7m2s4k"
10% OFF
```

But percentage discounts need:

```text id="x8p1f3"
minimum_order
maximum_discount
```

Example:

```text
10% OFF
Minimum order: ৳1,000
Maximum discount: ৳200
```

---

# 16. Voucher issuance

When customer clicks:

> Redeem 2,000 coins

Don't immediately create a discount directly.

Instead:

```text id="9x3q2j"
Check balance
      ↓
Check voucher availability
      ↓
Deduct 2,000 coins
      ↓
Create voucher
      ↓
Return voucher to customer
```

All of this should happen atomically.

---

# 17. Voucher ownership

Generated voucher:

```text id="f0p5m7"
Voucher
├── user_id
├── voucher_type_id
├── code
├── status
├── expires_at
└── created_at
```

So:

```text id="k9f3s0"
Rahim
 ↓
BK100OFF-8X7K
 ↓
৳100 OFF
```

Another customer cannot use it.

---

# 18. Voucher redemption

At checkout:

```text id="w7g3c4"
Customer selects voucher
        ↓
Server validates
        ↓
Voucher belongs to customer
        ↓
Active?
        ↓
Expired?
        ↓
Minimum order met?
        ↓
Other restrictions?
        ↓
Apply discount
```

Then:

```text id="e8q2w1"
Voucher
AVAILABLE
    ↓
USED
```

---

# 19. Voucher cannot be reused

Database/business logic must ensure:

```text id="6c4w0z"
voucher.status = USED
```

means:

```text id="e7m1z3"
❌ Cannot be redeemed again
```

The update should happen atomically with order creation.

---

# 20. 🪙 Coins + voucher example

Customer has:

```text id="d1r8q5"
3,000 coins
```

They select:

```text id="7s0p4a"
৳100 voucher
Cost = 2,000 coins
```

Ledger:

```text id="c4y6j8"
Previous balance: 3,000

-2,000 REDEEMED

Remaining: 1,000
```

Voucher:

```text id="8j3m5f"
৳100 OFF
Status: AVAILABLE
```

---

# 21. 🔄 Cancellation before reward

Customer orders:

```text id="0x8s2m"
৳2,000
```

Order is cancelled before delivery.

No coins were awarded.

Therefore:

```text id="6h3z9k"
Coins:
0 → 0
```

Nothing to reverse.

---

# 22. 🔄 Cancellation after reward

Suppose the order was delivered:

```text id="7s9x2k"
+2,000 coins
```

Then the customer returns the entire order.

Create:

```text id="5w4m1q"
-2,000 RETURN_REVERSAL
```

Not:

```text id="9d1x3p"
DELETE coin transaction ❌
```

---

# 23. Partial return

This is more complicated.

Suppose:

```text id="x7y2k9"
Order = ৳4,000
Reward = 4,000 coins

Customer returns items worth ৳1,000.
```

You need a policy.

I recommend recalculating the customer's **final eligible purchase amount**.

If remaining eligible purchase:

```text id="5m8r2z"
৳3,000
```

Then required reward:

```text id="g4q1n6"
3,000 coins
```

Already awarded:

```text id="k8p2v0"
4,000
```

Therefore:

```text id="w3c6z9"
Reverse 1,000 coins
```

This is fairer than blindly removing all rewards.

---

# 24. What if the customer already spent the coins?

This is important.

Customer earns:

```text id="4q5m7s"
+2,000
```

Then immediately redeems:

```text id="7x2c9a"
-2,000
```

Now their coin balance is zero.

Later the original order is returned.

You need a policy.

I recommend:

### Allow balance to become negative.

Example:

```text id="5s8m2q"
Reward reversal:
-2,000

Current balance:
-2,000
```

Then future earned coins first offset the negative balance.

This prevents customers from keeping rewards after returning the purchase.

---

# 25. Negative coin balance

Example:

```text id="x2n7p4"
Balance:
-2,000
```

Next delivered order earns:

```text id="c8m3w1"
+3,000
```

New balance:

```text id="p9q6r2"
+1,000
```

This is much cleaner than trying to hunt down previously issued vouchers.

---

# 26. What happens to an already-created voucher?

Suppose:

```text id="h4z8m1"
2,000 coins
 ↓
৳100 voucher
```

Customer hasn't used it yet.

Then the original earning order is returned.

You have two options:

### Option A — Cancel the voucher

Recommended.

```text id="k6p3v8"
Voucher
AVAILABLE
   ↓
CANCELLED
```

### Option B — Let customer keep it

I wouldn't recommend this because the customer would effectively keep the reward after returning the qualifying purchase.

---

# 27. What if the voucher was already used?

Then the system should record the relationship:

```text id="z8q1c6"
Original earning order
       ↓
Coin transaction
       ↓
Voucher
       ↓
Used on Order #2
```

If Order #1 is returned, you can:

```text id="e4m7s2"
Reverse the original coins
```

and retain the Order #2 discount as already consumed, **but the customer's balance can become negative**.

That is operationally simpler than rewriting old orders.

---

# 28. Admin controls

Admin should have a **Rewards Management** page:

```text id="3j7x5p"
Rewards
────────────────────────

Current earning rule:
৳2,000 → 2,000 coins

Voucher Types:

৳20 OFF
500 coins
Active

৳50 OFF
1,000 coins
Active

৳100 OFF
2,000 coins
Active
```

Actions:

```text id="z4m6q8"
[ Edit Rule ]
[ Create Voucher Type ]
[ Disable ]
[ View Usage ]
```

---

# 29. Admin manual adjustment

Sometimes customer support needs to correct an account.

Admin can:

```text id="1p8s5n"
Customer:
Rahim

Current:
1,200 coins

Adjustment:
+500

Reason:
Compensation for delayed delivery
```

Ledger:

```text id="f2n9w7"
+500 ADMIN_ADJUSTMENT
```

Never directly edit the balance.

---

# 30. Customer rewards page

I'd make this a nice feature.

```text id="0q4j6m"
🪙 My Budget Coins

        3,240
         COINS

[ Redeem Rewards ]

──────────────────

Recent activity

+2,000
Order #BK1024
Aug 25

-2,000
৳100 Voucher
Aug 26

+1,240
Order #BK1031
Aug 27
```

Then:

```text id="5v8x1q"
Available Rewards

৳20 OFF
500 coins

[ Redeem ]

৳100 OFF
2,000 coins

[ Redeem ]
```

---

# 31. Expiring coins UI

Don't surprise customers.

Show:

```text id="r5t7w2"
🪙 800 coins expire in 12 days
```

And perhaps:

```text id="k3m8p1"
500 coins
Expires: September 10
```

This encourages redemption.

---

# 32. Security requirements

The rewards system needs particularly strict controls.

Customer:

```text id="q8z3m5"
❌ Cannot create coins
❌ Cannot modify coin amount
❌ Cannot change expiry
❌ Cannot create vouchers
❌ Cannot change voucher value
```

Customer can only:

```text id="s7x2n9"
View own balance
View own transactions
Redeem available rewards
View own vouchers
Use own vouchers
```

Admin can manage reward configuration.

---

# 33. Database relationship

```text id="h7p2c9"
orders
   │
   │ delivered
   ↓
reward_rules
   │
   ↓
coin_transactions
   │
   │ redeem
   ↓
voucher_types
   │
   ↓
vouchers
   │
   │ used
   ↓
order
```

And cancellation/return:

```text id="f4m8s1"
Order
 ↓
Return / Cancel
 ↓
Reward reversal
 ↓
Coin transaction
```

---

# 34. Complete reward lifecycle

```text id="m2v7q4"
                    ORDER
                      │
                      ↓
                  DELIVERED
                      │
                      ↓
              Reward calculation
                      │
                Eligible?
                 /       \
               NO         YES
               │           │
               │           ↓
               │      + Coins
               │           │
               │           ↓
               │      Coin Ledger
               │           │
               │           ↓
               │      Customer Balance
               │           │
               │      Redeem Coins
               │           │
               │           ↓
               │        Voucher
               │           │
               │           ↓
               │       Use Voucher
               │
               ↓
           Return/Cancel
                   │
                   ↓
             Reward Reversal
                   │
                   ↓
             Coin Ledger
```

---

# 35. Final design decisions

### 🪙 Coins

* Ledger-based
* Admin-configurable earning rules
* Award after delivery
* Delivery fee doesn't earn coins
* Support expiration
* Earliest-expiring coins consumed first
* Never delete transactions
* Reversals are new transactions
* Negative balances allowed for legitimate reward reversals

### 🎟️ Vouchers

* Admin-configurable
* Fixed or percentage discounts
* Configurable coin cost
* Optional minimum order
* Optional maximum discount
* Expiration
* One-time use
* User-specific
* Atomic redemption

### 🔄 Returns/cancellations

* No reward if order never reaches eligibility
* Reverse earned coins after qualifying order is returned
* Partial returns recalculate/reverse the excess reward
* Unused reward voucher can be cancelled if its qualifying order is fully returned
* Already-used vouchers aren't retroactively rewritten; the coin ledger handles the resulting adjustment

### 🔐 Security

```text
Customer
   ↓
Can READ own rewards
   ↓
Can REQUEST redemption
   ↓
Server validates
   ↓
Atomic transaction
   ↓
Coin deduction + voucher creation
```

**The critical rule is that coins and vouchers are financial-like assets even though they aren't real currency. Treat them with the same accounting discipline as money: immutable ledger entries, atomic operations, clear reversals, and complete auditability.**


# 🗄️ Budget King BD — Database Design Plan

For the first version, I would design the Supabase PostgreSQL database around **10–14 core tables**, with a few supporting tables for variants, groups, rewards, and auditing.

The most important principle: **don't store derived business data when it can be calculated safely from authoritative records.** For example, coin balance should come from a transaction ledger rather than being blindly incremented in multiple places.

---

# 1. Core database structure

```text
AUTH
├── auth.users                 ← Supabase-managed
└── profiles
    └── user_roles

CATALOG
├── categories
├── products
├── product_variants
└── product_images

INVENTORY
└── inventory_movements

ORDERS
├── orders
├── order_items
└── order_status_history

GROUPS
├── groups
├── group_members
├── group_products
├── group_votes
└── group_cart_items

REWARDS
├── coin_transactions
├── reward_rules
├── vouchers
└── voucher_redemptions

SYSTEM
└── audit_logs
```

You don't necessarily need every table on day one, but **this is the structure I'd plan around**.

---

# 2. 👤 Users & Roles

Don't modify Supabase's `auth.users` directly.

Supabase owns authentication.

Create your application profile:

### `profiles`

```text
profiles
├── id              UUID PK → auth.users.id
├── full_name
├── avatar_url
├── phone
├── created_at
└── updated_at
```

Then role information:

### `user_roles`

```text
user_roles
├── user_id         UUID PK/FK
├── role
├── created_at
└── updated_at
```

Role:

```text
admin
moderator
order_agent
customer
```

For a normal customer:

```text
auth.users
    ↓
profiles
    ↓
user_roles
    ↓
customer
```

For staff:

```text
auth.users
    ↓
profiles
    ↓
user_roles
    ↓
order_agent / moderator / admin
```

### Why separate roles?

Because later you can move toward:

```text
user
 ↓
roles
 ↓
permissions
```

without redesigning authentication.

---

# 3. 🏷️ Categories

### `categories`

```text
categories
├── id
├── name
├── slug
├── description
├── image_url
├── is_active
├── sort_order
├── created_at
└── updated_at
```

Initially:

```text
Shirts
```

Later:

```text
Shirts
T-Shirts
Pants
Hoodies
Accessories
...
```

The frontend doesn't need to know what categories exist.

---

# 4. 👕 Products

### `products`

```text
products
├── id
├── category_id        FK
├── name
├── slug
├── description
├── base_price
├── is_active
├── is_featured
├── created_at
└── updated_at
```

Example:

```text
Product
Casual Oxford Shirt
৳699
```

But **don't put size and color directly in `products`**.

That's where variants come in.

---

# 5. 🎨 Product Variants

### `product_variants`

```text
product_variants
├── id
├── product_id         FK
├── sku
├── size
├── color
├── price
├── is_active
├── created_at
└── updated_at
```

Example:

```text
Casual Oxford Shirt

SKU       Size    Color     Price
------------------------------------------------
COS-B-M   M       Black     ৳699
COS-B-L   L       Black     ৳699
COS-B-XL  XL      Black     ৳699
COS-W-M   M       White     ৳699
```

This is much better than:

```text
products
size = "M,L,XL"
color = "Black,White"
```

because every purchasable combination gets its own SKU and inventory.

---

# 6. 📸 Product Images

### `product_images`

```text
product_images
├── id
├── product_id       FK
├── variant_id       FK nullable
├── image_url
├── sort_order
├── is_primary
└── created_at
```

This lets you have:

```text
Product
 ├── Front
 ├── Back
 ├── Detail
 └── Model photo
```

And optionally variant-specific images.

---

# 7. 📦 Inventory

I would separate **current inventory** from **inventory history**.

### `inventory`

```text
inventory
├── variant_id       PK/FK
├── quantity
├── reserved_quantity
├── updated_at
```

Available stock:

```text
available = quantity - reserved_quantity
```

Then maintain:

### `inventory_movements`

```text
inventory_movements
├── id
├── variant_id
├── quantity_change
├── movement_type
├── reference_id
├── performed_by
├── note
└── created_at
```

Movement types:

```text
purchase
sale
reservation
release
return
adjustment
damage
```

This gives you a history.

**Analogy:** `inventory.quantity` is the number written on the warehouse clipboard; `inventory_movements` is the warehouse logbook explaining how it got there.

---

# 8. 🛒 Orders

This is one of the most important parts.

### `orders`

```text
orders
├── id
├── order_number
├── user_id             FK nullable
├── customer_name
├── customer_phone
├── delivery_address
├── subtotal
├── delivery_fee
├── discount
├── total
├── voucher_id          FK nullable
├── order_type
├── status
├── created_at
└── updated_at
```

### Why `user_id` is nullable?

Because you allow **guest checkout**.

Guest:

```text
user_id = NULL
```

Logged-in customer:

```text
user_id = customer's UUID
```

But the order still contains:

```text
customer_name
customer_phone
delivery_address
```

So the order remains self-contained.

---

# 9. Order Items

### `order_items`

```text
order_items
├── id
├── order_id            FK
├── product_id          FK
├── variant_id          FK
├── product_name
├── variant_snapshot
├── unit_price
├── quantity
└── subtotal
```

The **snapshot fields are important**.

Suppose:

> Shirt = ৳699

Customer buys it.

Next month:

> Shirt = ৳799

The old order must still say:

> ৳699

So don't depend entirely on the current product record.

---

# 10. Order Status History

### `order_status_history`

```text
order_status_history
├── id
├── order_id
├── old_status
├── new_status
├── changed_by
├── note
└── created_at
```

Example:

```text
Pending
 ↓
Confirmed
 ↓
Processing
 ↓
Shipped
 ↓
Delivered
```

If cancelled:

```text
Pending
 ↓
Cancelled
```

This also helps your audit system.

---

# 11. 👥 Groups

### `groups`

```text
groups
├── id
├── name
├── code
├── owner_id          FK
├── status
├── created_at
└── updated_at
```

Example:

```text
Group:
DIU Friends

Code:
BK-7X92P
```

Group codes should be **unique and difficult to guess**.

---

# 12. Group Members

### `group_members`

```text
group_members
├── group_id          FK
├── user_id           FK
├── role
├── joined_at
└── status
```

Roles:

```text
owner
member
```

You can add moderator later if needed.

Unique constraint:

```text
(group_id, user_id)
```

So a user can't join the same group twice.

---

# 13. 🛍️ Group Products

When someone shares a product:

### `group_products`

```text
group_products
├── id
├── group_id
├── user_id
├── product_id
├── variant_id nullable
├── message
├── created_at
└── status
```

Example:

> Rahim shares Black Oxford Shirt XL.

---

# 14. 👍👎 Group Voting

### `group_votes`

```text
group_votes
├── id
├── group_product_id
├── user_id
├── vote
└── created_at
```

`vote`:

```text
up
down
```

Unique:

```text
(group_product_id, user_id)
```

Therefore one person gets one vote per shared product.

They can change:

```text
👍 → 👎
```

rather than creating another vote.

---

# 15. 🛒 Group Cart

### `group_cart_items`

```text
group_cart_items
├── id
├── group_id
├── user_id
├── variant_id
├── quantity
└── created_at
```

This represents:

```text
Group
 │
 ├── Rahim → Shirt ×2
 ├── Karim → Shirt ×1
 └── Hasan → Shirt ×1
```

You can calculate:

```text
Group subtotal
+
Group delivery
=
Group order total
```

---

# 16. Group → Order relationship

This needs careful planning.

I'd add:

```text
orders
└── group_id nullable
```

So:

```text
Normal order
group_id = NULL
```

while:

```text
Group order
group_id = GROUP_UUID
```

This lets your system distinguish:

```text
Individual COD order
        vs
Group COD order
```

---

# 17. 🪙 Coins

This should **not** simply be:

```text
profiles
coins = 2500
```

Instead, create a ledger.

### `coin_transactions`

```text
coin_transactions
├── id
├── user_id
├── amount
├── transaction_type
├── reference_id
├── description
└── created_at
```

Examples:

```text
+2000  Order #BK1024
+1000  Order #BK1051
-2000  Redeemed ৳100 voucher
```

Balance:

```text
SUM(coin_transactions.amount)
```

Or maintain a cached balance later for performance, while the ledger remains authoritative.

### Transaction types

```text
earned
redeemed
expired
adjustment
refund
reversal
```

---

# 18. 🎟️ Reward Rules

Since you said **Admin should decide the reward**, don't hard-code:

> ৳2,000 purchase → 2,000 coins.

Create:

### `reward_rules`

```text
reward_rules
├── id
├── minimum_purchase
├── coins_awarded
├── is_active
├── starts_at
├── ends_at
└── created_at
```

Example:

```text
minimum_purchase = 2000
coins_awarded = 2000
```

Later you can change it without deploying the website.

---

# 19. 🎟️ Vouchers

There are actually **two concepts**:

### Voucher definition

What the reward is.

### Voucher issued to customer

Who owns it.

I'd therefore use:

### `voucher_types`

```text
voucher_types
├── id
├── name
├── discount_type
├── discount_value
├── coin_cost
├── minimum_order
├── maximum_discount
├── expires_after_days
├── is_active
└── created_at
```

Example:

```text
৳20 OFF
500 coins

৳100 OFF
2000 coins
```

Then:

### `vouchers`

```text
vouchers
├── id
├── user_id
├── voucher_type_id
├── code
├── status
├── expires_at
├── redeemed_at
└── created_at
```

Status:

```text
available
used
expired
cancelled
```

---

# 20. Voucher redemption

You may also want:

### `voucher_redemptions`

```text
voucher_redemptions
├── id
├── voucher_id
├── order_id
├── user_id
├── discount_amount
└── created_at
```

This gives you an immutable record of how the voucher was actually used.

---

# 21. 🔐 Audit Logs

### `audit_logs`

```text
audit_logs
├── id
├── actor_id
├── action
├── entity_type
├── entity_id
├── old_data
├── new_data
├── ip_address
├── created_at
└── metadata
```

Example:

```text
Admin
Changed reward rule

Old:
2000 coins

New:
1500 coins
```

Another:

```text
Agent
Order #BK1024
Pending → Confirmed
```

Another:

```text
Moderator
Removed review #123
```

This is your system's **digital paper trail**.

---

# 22. Relationship overview

Here's the important part:

```text
auth.users
    │
    └── profiles
          │
          └── user_roles
          │
          ├──────────── orders
          │                │
          │                ├── order_items
          │                └── order_status_history
          │
          ├──────────── coin_transactions
          │
          ├──────────── vouchers
          │
          └──────────── group_members
                           │
                           └── groups
                                │
                                ├── group_products
                                │      │
                                │      └── group_votes
                                │
                                └── group_cart_items


categories
    │
    └── products
          │
          ├── product_variants
          │       │
          │       └── inventory
          │              │
          │              └── inventory_movements
          │
          └── product_images
```

---

# 23. Important order relationship

```text
products
   ↓
product_variants
   ↓
order_items
   ↓
orders
   ↓
customer
```

The actual purchasable entity should be the **variant**, not merely the product.

For example:

```text
Product:
Oxford Shirt

Variant:
Oxford Shirt / Black / XL
SKU: OS-BLK-XL
Price: ৳699
Stock: 12
```

That's what goes into the cart and order.

---

# 24. Guest order relationship

This is how I'd handle your guest checkout:

```text
Guest
 │
 └── orders
       │
       ├── customer_name
       ├── customer_phone
       ├── delivery_address
       └── user_id = NULL
```

Later, if that guest logs in:

```text
Guest Order
    ↓
Claim / associate
    ↓
Customer account
```

But this association needs verification so someone cannot claim another person's order merely by knowing an order number.

---

# 25. Tables I'd consider MVP

Don't build every possible table before launch.

### Phase 1 — Essential

```text
profiles
user_roles

categories
products
product_variants
product_images

inventory
inventory_movements

orders
order_items
order_status_history

groups
group_members
group_products
group_votes
group_cart_items

coin_transactions
reward_rules
voucher_types
vouchers
voucher_redemptions

audit_logs
```

That's roughly **25 tables**, but many are small supporting tables.

I would **not** be scared by the table count. A commerce system naturally has many relationships.

---

# 26. What should NOT be a database table yet

Avoid unnecessary complexity like:

```text
shopping_sessions
notifications
wishlists
coupons
payments
wallets
subscriptions
chat_messages
```

unless the actual requirements justify them.

For example, because you're **COD-only**, you don't need a payment transaction architecture right now.

---

# 27. The most important database rules

I'd lock these in before coding:

### Rule 1

**Supabase Auth owns authentication.**

### Rule 2

**Postgres owns business data.**

### Rule 3

**RLS owns data-level authorization.**

### Rule 4

**Variants own inventory.**

### Rule 5

**Orders store price snapshots.**

### Rule 6

**Coins use a transaction ledger.**

### Rule 7

**Guest orders have nullable `user_id`.**

### Rule 8

**Group membership controls group access.**

### Rule 9

**Every important administrative mutation creates an audit record.**

### Rule 10

**Final prices, rewards, inventory and permissions are determined server-side—not by the browser.**

---

## One architectural decision I'd make now

Before moving to the next planning stage, I'd turn this into an actual **ERD/database schema specification** with:

* exact table names
* exact columns
* PostgreSQL data types
* primary keys
* foreign keys
* unique constraints
* indexes
* enums
* `ON DELETE` behavior
* RLS policies
* which fields are nullable
* which fields are generated
* which operations require transactions

That is the point where the database plan becomes directly implementable in Supabase rather than just conceptual.
