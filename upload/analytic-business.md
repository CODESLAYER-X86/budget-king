# 📈 Budget King BD — Analytics & Reporting

For Budget King BD, analytics should be designed as **operational analytics first**, not a giant BI system. Admin should quickly understand **what is selling, what is happening with orders, who the customers are, and where problems exist**.

Core structure:

```text
Orders
 ├── Sales
 ├── Customers
 ├── Products
 ├── Rewards
 ├── Groups
 └── Agents
        ↓
   Analytics Layer
        ↓
 Admin Dashboard / Reports
```

---

# 1. 📊 Main Analytics Dashboard

The Admin dashboard should immediately show:

```text
TODAY

Sales              ৳24,850
Orders                 38
Delivered              29
Pending                 6
Cancelled               3

New Customers          17
Coins Awarded       18,400
Groups Created           7
```

Then:

```text
Sales Overview
────────────────────────────
Today       ৳24,850
Yesterday   ৳21,300
This Week   ৳143,200
This Month  ৳512,400
```

And below:

```text
Top Products
Top Categories
Order Status
Agent Performance
```

The dashboard should answer:

> **"How is Budget King BD doing right now?"**

---

# 2. 💰 Sales Analytics

Track:

* Gross sales
* Discounts
* Voucher discounts
* Delivery charges
* Net sales
* Number of orders
* Average order value
* Cancelled order value
* Returned order value

Example:

```text
Sales

Gross Merchandise Value      ৳520,000
Discounts                    -৳18,000
Delivery Charges             +৳12,500
Returns                      -৳24,000
────────────────────────────────────
Net Sales                    ৳490,500
```

Be careful with terminology.

For reporting, keep:

```text
Product revenue
Delivery revenue
Discounts
Returns
```

as separate values rather than one mysterious "total."

---

# 3. 📈 Sales trends

Allow:

```text
Today
7 Days
30 Days
90 Days
Custom
```

Graph:

```text
Sales
 ^
 |              ╭──╮
 |        ╭─────╯  ╰──╮
 |   ╭────╯            ╰──
 |───╯
 +────────────────────────→
       Days
```

Useful comparisons:

```text
This week vs previous week
This month vs previous month
```

---

# 4. 🛒 Order Analytics

Track:

```text
Total orders
Pending
Confirmed
Processing
Shipped
Delivered
Cancelled
Delivery failed
Returned
Exchanged
```

Example:

```text
Orders: 1,240

Delivered        842
Processing       106
Shipped           94
Pending           72
Cancelled         83
Failed            43
```

---

# 5. Conversion funnel

Eventually you can track:

```text
Visitors
   ↓
Product Views
   ↓
Add to Cart
   ↓
Checkout
   ↓
Order
   ↓
Delivered
```

This tells you where customers disappear.

Example:

```text
10,000 visitors
     ↓
4,200 product views
     ↓
1,400 add to cart
     ↓
700 checkout
     ↓
500 orders
     ↓
430 delivered
```

For V1, **order-based analytics are more important**. You can add detailed behavioral analytics later.

---

# 6. 👥 Customer Analytics

Track:

* Total customers
* New customers
* Returning customers
* Active customers
* Orders per customer
* Customer lifetime value
* Average order value
* Cancellation rate
* Return rate

Example:

```text
Customers

Total customers       8,420
New this month          640
Returning             1,820
```

---

# 7. Customer segmentation

Useful segments:

```text
New Customer
Returning Customer
High Value
Inactive
Frequent Buyer
Group Shopper
Rewards User
```

Example:

```text
High-value customers
─────────────────────

Rahim      ৳18,420
Karim      ৳15,830
Hasan      ৳14,220
```

This becomes useful for marketing later.

---

# 8. 👕 Product Analytics

For every product:

```text
Oxford Shirt

Views:             8,420
Orders:              412
Units sold:          527
Revenue:         ৳368,373
Returns:              21
Rating:             4.6
```

Track:

* Units sold
* Revenue
* Orders
* Product views
* Add-to-cart rate
* Conversion rate
* Return rate
* Average rating
* Stock turnover

---

# 9. Top products

Admin should be able to sort by:

```text
Best selling
Highest revenue
Most viewed
Highest conversion
Most returned
Highest rated
Lowest rated
```

Example:

```text
Top Selling

1. Oxford Shirt       527 units
2. Casual Shirt       412 units
3. Formal Shirt       301 units
```

---

# 10. Variant analytics

Don't stop at product-level analytics.

For shirts:

```text
Oxford Shirt

Black / M     82 sold
Black / L    124 sold
Black / XL   156 sold
White / M     41 sold
White / L     73 sold
White / XL    51 sold
```

This is extremely useful for deciding what sizes/colors to restock.

---

# 11. 📦 Inventory analytics

Although inventory has its own system, analytics should expose:

```text
Fastest-selling variants
Slow-moving variants
Low-stock variants
Out-of-stock products
Stock turnover
```

Example:

```text
⚠️ Restock Priority

Oxford Shirt / Black / XL
Sold: 156
Remaining: 4

Oxford Shirt / White / L
Sold: 73
Remaining: 3
```

---

# 12. 🪙 Rewards analytics

This needs its own section.

Track:

```text
Coins earned
Coins redeemed
Coins expired
Coins reversed
Current outstanding coins
Vouchers issued
Vouchers redeemed
Voucher value
```

Example:

```text
Rewards — August

Coins earned          182,400
Coins redeemed         94,000
Coins expired          12,500
Coins reversed          3,200
Outstanding            72,700
```

---

# 13. Voucher analytics

For each voucher:

```text
৳100 OFF

Issued:       240
Used:         173
Unused:        67

Coins spent:
346,000

Discount given:
৳17,300
```

This lets you determine whether your rewards program is actually helping sales.

---

# 14. Group analytics

This is particularly important because group shopping is one of Budget King BD's unique features.

Track:

```text
Groups created
Active groups
Group members
Group orders
Group order value
Group items
Group delivery savings
```

Example:

```text
Group Shopping — August

Groups created:       184
Group orders:         126
Members:              672
Group sales:       ৳84,200
Delivery savings:  ৳10,240
```

---

# 15. Group conversion

Track:

```text
Groups created
     ↓
Groups with products
     ↓
Groups with carts
     ↓
Groups with orders
```

Example:

```text
184 groups created
      ↓
151 shared products
      ↓
139 active carts
      ↓
126 completed orders
```

This tells you whether the feature is actually being used.

---

# 16. 👥 Group product popularity

You can also learn what customers collectively like.

Example:

```text
Most voted products

Oxford Shirt
👍 482

Oversized Shirt
👍 391

Polo
👍 302
```

This could eventually influence your product selection.

---

# 17. 🚚 Group delivery savings

This is a particularly valuable metric.

Calculate:

```text
Individual delivery cost
-
Actual group delivery cost
=
Customer savings
```

Example:

```text
Individual delivery:
৳320

Group delivery:
৳100

Customer saved:
৳220
```

Then dashboard:

> **৳18,420 saved by customers through group shopping this month.**

That's also a powerful marketing number.

---

# 18. 🧑‍💼 Agent performance

Agent analytics should focus on **work quality and efficiency**, not just how many orders they touch.

Track:

* Orders assigned
* Orders confirmed
* Orders cancelled
* Confirmation time
* Processing time
* Shipping time
* Delivery success
* Failed deliveries
* Customer contact attempts
* Return/exchange handling

Example:

```text
Agent Performance

Agent       Orders   Confirmed   Failed   Avg Confirm
------------------------------------------------------
Rahim         184       171         13       18 min
Karim         162       151         11       24 min
Hasan         143       136          7       21 min
```

---

# 19. Agent performance shouldn't encourage bad behavior

Don't rank agents simply by:

> "Who confirmed the most orders?"

An agent could confirm everything without properly verifying COD orders.

Better metrics:

```text
Confirmation rate
Delivery success
Cancellation accuracy
Average processing time
Customer complaints
```

Eventually you can create a weighted performance score.

---

# 20. Agent workload

Admin should see:

```text
Current workload

Rahim
Pending: 12
Processing: 8

Karim
Pending: 5
Processing: 11

Hasan
Pending: 14
Processing: 4
```

This can help admins redistribute orders.

---

# 21. Order processing time

Track timestamps:

```text
created_at
confirmed_at
processing_at
shipped_at
delivered_at
```

Then calculate:

```text
Confirmation time
Processing time
Shipping time
Total fulfillment time
```

Example:

```text
Order #BK1024

Placed → Confirmed       18 min
Confirmed → Processing    7 min
Processing → Shipped     42 min
Shipped → Delivered      1.2 days
```

This gives you a real operational picture.

---

# 22. Cancellation analytics

Track cancellation reasons.

Example:

```text
Cancellation Reasons

Customer changed mind       32%
Wrong address               21%
Couldn't contact            18%
Out of stock                 9%
Duplicate order              7%
Other                        13%
```

This is much more useful than just:

> "83 orders cancelled."

---

# 23. Return/exchange analytics

Track:

```text
Return rate
Exchange rate
Return reasons
Product return rate
Size-related returns
Damaged product returns
```

Example:

```text
Oxford Shirt

Sold: 527
Returned: 21
Return rate: 3.98%
```

If one product has a 15% return rate, you should investigate it.

---

# 24. Delivery analytics

Track:

```text
Delivered
Failed
Average delivery time
Delivery success rate
Cancellation after shipping
Delivery zone performance
```

Example:

```text
Dhaka
Success: 94%
Avg: 1.2 days

Chattogram
Success: 89%
Avg: 2.4 days
```

This can help you negotiate with delivery partners later.

---

# 25. 📍 Delivery-zone analytics

Because you're using delivery zones:

```text
Zone
Orders
Revenue
Delivery fees
Failed deliveries
Average delivery time
```

Example:

```text
Zone              Orders   Failed
----------------------------------
Dhaka              820       32
Chattogram         240       18
Other              180       21
```

---

# 26. Analytics permissions

### Admin

Full analytics:

```text
Sales
Orders
Customers
Products
Rewards
Groups
Agents
Inventory
```

### Moderator

Only relevant operational analytics, if needed:

```text
Reviews
Reports
Content moderation
```

They shouldn't see sensitive financial/customer analytics by default.

### Agent

Only personal/work-related statistics:

```text
My orders
My performance
My workload
```

Not:

```text
Total company revenue
Other agents' performance
Customer financial analytics
```

---

# 27. Reports

Dashboard ≠ reports.

Dashboard:

> "What's happening?"

Reports:

> "Give me the actual data."

I'd support:

```text
Sales Report
Order Report
Customer Report
Product Report
Rewards Report
Group Report
Agent Report
Inventory Report
```

---

# 28. Filtering

Every report should eventually support:

```text
Date range
Category
Product
Variant
Order status
Delivery zone
Agent
Customer
Group
```

Example:

```text
Sales

Date:
[ Aug 01 — Aug 28 ]

Category:
[ Shirts ]

Zone:
[ Dhaka ]

Agent:
[ All ]

[ Generate Report ]
```

---

# 29. Export

Admin should be able to export:

```text
CSV
Excel
PDF
```

But I wouldn't build elaborate PDF reports initially.

**CSV/Excel is the most useful for actual business analysis.**

---

# 30. Analytics data architecture

Don't make the frontend calculate everything from thousands of orders.

Instead:

```text
Orders
Products
Customers
Rewards
Groups
Agents
       ↓
Database queries / views
       ↓
Analytics layer
       ↓
Dashboard
```

For frequently used metrics, Supabase/PostgreSQL views or materialized aggregates can be used later.

---

# 31. Don't store every metric unnecessarily

For example, don't blindly store:

```text
users.total_orders
users.total_spent
users.average_order_value
```

as manually editable values.

These can become inconsistent.

Prefer:

```text
orders
   ↓
SQL aggregation
   ↓
Analytics
```

For high-traffic metrics, cache/precompute them later.

---

# 32. Auditability

Analytics should be based on trustworthy records.

For example:

```text
Order status history
Inventory movements
Coin transactions
Voucher transactions
Agent actions
```

This allows you to answer:

> "Why does the dashboard say we sold 527 shirts?"

rather than relying on manually updated counters.

---

# 33. Recommended dashboard structure

I'd make Admin Analytics:

```text
📈 Analytics

Overview
├── Sales
├── Orders
├── Customers
├── Products
├── Inventory
├── Rewards
├── Groups
├── Delivery
└── Agents
```

Overview:

```text
┌─────────────────────────────────────────┐
│ Sales          Orders       Customers  │
│ ৳512,400       1,240        8,420       │
├─────────────────────────────────────────┤
│                                         │
│             Sales Graph                 │
│                                         │
├─────────────────────────────────────────┤
│ Top Products     Order Status           │
│                                         │
├─────────────────────────────────────────┤
│ Rewards          Groups      Agents     │
└─────────────────────────────────────────┘
```

---

# 34. V1 vs Later

### 🔥 V1 — Definitely build

* Sales overview
* Order statistics
* Product sales
* Customer count
* Rewards statistics
* Group statistics
* Agent workload
* Cancellation/return statistics
* Delivery statistics
* Date filtering
* CSV export

### V2

* Customer lifetime value
* Cohort analysis
* Conversion funnel
* Advanced product conversion
* Customer segmentation
* Automated reports
* Scheduled reports
* Advanced agent scoring
* Predictive analytics
* Demand forecasting

---

# 35. Final analytics architecture

```text
                         DATABASE
                            │
       ┌────────────────────┼────────────────────┐
       ↓                    ↓                    ↓
     Orders              Products            Customers
       │                    │                    │
       ├──────────┐         │                    │
       ↓          ↓         ↓                    ↓
    Delivery    Rewards   Inventory          Groups
       │          │         │                    │
       └──────────┴─────────┴────────────────────┘
                            │
                            ↓
                    ANALYTICS LAYER
                            │
        ┌───────────────────┼───────────────────┐
        ↓                   ↓                   ↓
      Admin              Agent              Reports
    Dashboard           Dashboard           / Export
```

### The key principle

**Your analytics should be a read-only interpretation of your transactional systems.** Don't make analytics itself responsible for business logic.

That gives you a clean separation:

```text
Order system    → records what happened
Inventory       → records stock
Rewards         → records coins/vouchers
Groups          → records group activity
Analytics       → explains what happened
```

That architecture will scale much better as Budget King BD grows beyond shirts.
# ⚙️ Budget King BD — Business Rules

This section defines **what the system is allowed to do and under what conditions**. These rules should be agreed upon before implementation because they will affect the database, backend logic, RLS, order workflow, rewards, and UI.

---

## 1. 💵 COD Rules

Since Budget King BD accepts **Cash on Delivery only**:

### Basic rules

* All customer orders use COD.
* No online payment status is required.
* Order is not considered financially paid until delivery/payment is confirmed.
* Customer sees the total payable amount before confirming.
* Delivery charge is included in the final COD amount.
* Redeemed vouchers reduce the COD amount.
* Coins themselves cannot be used directly as payment unless converted into a voucher.

### COD order flow

```text
Cart
 ↓
Checkout
 ↓
COD selected automatically
 ↓
Order placed
 ↓
Agent confirms
 ↓
Order prepared
 ↓
Shipped
 ↓
Delivered
 ↓
COD collected
 ↓
Order completed
```

### Important

Don't let the customer enter an arbitrary COD amount.

```text
Product subtotal
+ Delivery
- Voucher
= Final COD amount
```

The server calculates this.

---

# 2. ❌ Cancellation Rules

You need to distinguish **customer cancellation** from **admin/agent cancellation**.

### Customer cancellation

Customer can cancel only before a certain stage.

Recommended:

```text
PENDING
   ↓
CONFIRMED
   ↓
PROCESSING
   ↓
SHIPPED
   ↓
DELIVERED
```

Allow cancellation:

```text
PENDING       ✅
CONFIRMED     ✅/configurable
PROCESSING    ❌
SHIPPED       ❌
DELIVERED     ❌
```

Once shipped, the customer should use the return process instead.

### Cancellation reasons

Use predefined reasons:

* Changed my mind
* Ordered by mistake
* Wrong product
* Wrong size/color
* Delivery taking too long
* Other

For "Other":

> Require a short explanation.

---

# 3. Agent cancellation

Agents should **not be able to cancel arbitrarily**.

For example:

```text
Agent
 ↓
Select cancellation reason
 ↓
Confirm
 ↓
System records action
```

Possible reasons:

* Customer unreachable
* Customer requested cancellation
* Product unavailable
* Invalid address
* Duplicate order
* Other

Every cancellation should be recorded in the order history/audit log.

---

# 4. 🔄 Returns

A return should only be available after delivery.

```text
DELIVERED
    ↓
Return window
    ↓
Return requested
```

Example policy:

> Return request within **7 days** of delivery.

The exact number should be configurable by Admin.

---

# 5. Return eligibility

Possible rules:

* Product must have been delivered.
* Request must be within return window.
* Product must meet condition requirements.
* Product must not be intentionally damaged.
* Certain categories may be non-returnable later.

For shirts, you could require:

```text
Unused
Unwashed
Original condition
Tags intact
```

---

# 6. Return workflow

```text
Customer requests return
          ↓
PENDING_REVIEW
          ↓
Approved / Rejected
          ↓
Return collection
          ↓
Received
          ↓
Inspection
          ↓
Approved
          ↓
Return completed
```

Don't immediately mark an item as returned when the customer submits the request.

---

# 7. 🔁 Exchange rules

For clothing, exchanges are particularly important because of sizing.

Example:

```text
Black / L
    ↓
Exchange
    ↓
Black / XL
```

Allow exchange for:

* Different size
* Different color

Subject to stock availability.

---

# 8. Exchange inventory

Before approving:

```text
Requested variant
        ↓
Check stock
        ↓
Available?
   ↙         ↘
 YES         NO
 ↓            ↓
Approve     Reject / Alternative
```

Don't promise an exchange variant that isn't available.

---

# 9. Return vs exchange

Keep them separate.

### Return

```text
Customer gives product back
↓
Order/item refunded according to policy
```

### Exchange

```text
Customer gives product back
↓
Receives another variant/product
```

For COD, there is no automatic online-payment refund mechanism, so you'll need a separate **refund settlement process** if you eventually return money.

---

# 10. 💰 COD refund policy

This is one area you should decide before development.

Because customers pay cash to the delivery agent, a return can result in:

> Budget King owes the customer money.

For V1, I recommend defining an operational refund method, for example:

* Bank transfer
* Mobile financial service
* Store credit

Don't pretend a COD order can simply be "refunded" through the nonexistent payment gateway.

---

# 11. 🪙 Rewards during cancellation/return

This must connect directly to your rewards ledger.

Suppose:

```text
Order = ৳2,000
↓
Customer earns 2,000 coins
```

Then order is cancelled before completion.

The system should reverse the earned coins:

```text
+2,000 coins
        ↓
Order cancelled
        ↓
-2,000 coins
```

**Never directly edit the user's coin balance.**

Use ledger entries.

---

# 12. Rewards after return

Same principle.

```text
Delivered
↓
+2,000 coins
↓
Return approved
↓
-2,000 coins
```

If the customer has already spent those coins, you need a defined policy.

I'd recommend:

> The system can allow the resulting coin balance to go negative internally, or mark the account as having a rewards debt.

But I would **not** silently confiscate unrelated coins without an auditable transaction.

---

# 13. 🪙 Coin earning rule

Based on your current concept:

```text
Purchase amount ≥ ৳2,000
        ↓
Earn 2,000 coins
```

But you should define exactly what "purchase amount" means.

I recommend:

> Coins are calculated from **eligible product subtotal after discounts, excluding delivery charges**.

Example:

```text
Products:       ৳2,200
Delivery:         ৳80
Voucher:          ৳100
────────────────────
Eligible amount: ৳2,100
```

If the threshold is ৳2,000:

```text
→ 2,000 coins
```

This avoids customers earning rewards from delivery fees.

---

# 14. One-time or repeated coin earning?

You need to decide whether:

```text
৳2,000 → 2,000 coins
৳4,000 → 4,000 coins
৳6,000 → 6,000 coins
```

or:

```text
৳2,000+ → 2,000 coins maximum
```

I strongly recommend **proportional earning** if the intention is a loyalty system.

For example:

```text
Every ৳1 eligible spending
= 1 Budget Coin
```

with:

```text
Minimum eligible order:
৳2,000
```

Then:

```text
৳2,000 → 2,000 coins
৳3,500 → 3,500 coins
৳5,000 → 5,000 coins
```

This is much easier to understand.

---

# 15. 🎟️ Voucher rules

Your coin system can convert coins into vouchers.

Example:

```text
2,000 coins
     ↓
৳20 voucher
```

Admin can configure the available rewards:

```text
2,000 coins → ৳20
5,000 coins → ৳50
10,000 coins → ৳100
```

Don't hard-code these values.

---

# 16. Voucher restrictions

Each voucher should have configurable restrictions:

```text
Minimum order value
Maximum discount
Applicable categories
Applicable products
Applicable variants
New customers only
Existing customers only
Group orders allowed
Maximum uses
Expiration
```

Example:

```text
৳100 Voucher

Minimum purchase: ৳1,000
Maximum discount: ৳100
Valid for: Shirts
Group order: Yes
Expiry: 30 days
```

---

# 17. Voucher stacking

I recommend:

> **Only one voucher per order in V1.**

Don't allow:

```text
৳100 voucher
+
৳50 voucher
+
৳20 voucher
```

It makes pricing and abuse prevention unnecessarily complicated.

---

# 18. Voucher + coins

Also don't allow:

```text
Coins
+
Voucher
```

in the same transaction unless you explicitly design it.

Since coins are converted into vouchers, the clean model is:

```text
Coins
 ↓
Voucher
 ↓
Order
```

---

# 19. Voucher redemption

When customer applies a voucher:

```text
Check:
├── Voucher exists
├── Belongs to customer / available globally
├── Active
├── Not expired
├── Minimum order satisfied
├── Product/category eligible
├── Usage limit not exceeded
└── Order conditions satisfied
```

Then calculate the discount server-side.

---

# 20. Voucher reservation

Don't permanently consume the voucher merely because the customer enters it into the cart.

Better:

```text
Apply voucher
     ↓
Checkout
     ↓
Order placed
     ↓
Voucher consumed
```

If checkout is abandoned:

```text
Voucher remains available
```

This prevents accidental voucher loss.

---

# 21. Group Order Rules

Group orders need their own business rules.

### Group order requires

* Authenticated users
* Valid group
* At least one member
* At least one cart item
* One common delivery destination
* Valid inventory
* One checkout initiator
* COD payer

---

# 22. Group ownership

Only the group owner should:

* Start checkout
* Set delivery address
* Select COD payer
* Finalize group order
* Close the group

Members can:

* Add products
* Vote
* Comment
* Add their own items
* Remove their own items

---

# 23. Group cart ownership

Every item must have:

```text
group_id
user_id
product_variant_id
quantity
```

So the system knows:

> Who actually requested this item?

This becomes essential for calculating each member's share.

---

# 24. Group delivery rule

If all group members use the **same delivery destination**, combine the order.

```text
Member A
Member B
Member C
      ↓
Same address
      ↓
ONE DELIVERY
```

If they have different addresses:

```text
A → Dhaka
B → Chittagong
```

they cannot receive the same physical delivery.

The system should either:

* Split into separate orders, or
* Prevent group checkout.

For V1, I'd **require one delivery address**.

---

# 25. Group delivery calculation

Use the delivery zone's normal rate:

```text
Zone rate = ৳80
```

Then:

```text
Group order
→ One delivery
→ ৳80
```

Don't multiply by members.

---

# 26. Group COD

I'd make one member the **COD payer**.

Example:

```text
Group total: ৳4,360

COD payer:
Rahim
```

Budget King receives:

```text
৳4,360
```

from Rahim.

The group members can settle their shares privately.

This keeps your delivery operation simple.

---

# 27. 🚚 Delivery rules

Delivery charge should be determined server-side based on:

```text
Delivery zone
+
Order type
+
Group order
+
Admin-defined rules
```

Never trust:

```text
delivery_charge = 0
```

coming from the frontend.

---

# 28. Delivery zones

Example:

```text
Dhaka Metro       ৳80
Outside Dhaka    ৳130
Remote            ৳160
```

Admin should be able to change rates.

Historical orders should **retain the delivery charge they were originally given**.

If Dhaka changes:

```text
৳80 → ৳100
```

yesterday's order should remain:

```text
৳80
```

---

# 29. Minimum order value

You can optionally define:

```text
Minimum order:
৳300
```

But don't unnecessarily introduce restrictions in V1 unless your delivery economics require them.

---

# 30. Stock rules

At checkout:

```text
Requested quantity
       ↓
Check available inventory
       ↓
Reserve stock
       ↓
Create order
```

If order is cancelled:

```text
Reserved stock
      ↓
Release
      ↓
Inventory available again
```

If delivered:

```text
Reserved
 ↓
Sold
 ↓
Inventory permanently reduced
```

---

# 31. Price protection

Very important.

Suppose:

```text
Customer adds shirt
৳699
```

Admin later changes it:

```text
৳699 → ৳799
```

The checkout should use the **current valid price**, not blindly trust the cart.

At order creation, store:

```text
unit_price = ৳699
```

inside the order item.

Historical orders must never change when product prices change.

---

# 32. Product deletion

Never physically delete a product that appears in an order.

Instead:

```text
ACTIVE
 ↓
ARCHIVED
```

Orders retain:

```text
Product name
SKU
Variant
Unit price
```

This keeps historical records intact.

---

# 33. Business-rule configuration

This is something I'd make **Admin configurable**.

For example:

```text
Business Settings

Rewards
├── Minimum qualifying amount
├── Coin earning rate
├── Voucher options
└── Expiration

Delivery
├── Dhaka
├── Outside Dhaka
└── Group delivery

Orders
├── Cancellation window
├── Return window
└── Exchange rules
```

Don't hard-code business policies into frontend components.

---

# 34. ⚠️ Abuse prevention rules

Because you have rewards + groups + COD, you need basic abuse controls.

Examples:

### Rewards

Don't award coins until the order reaches the required state.

```text
Order placed ❌
Order confirmed ❌
Order shipped ❌
Order delivered ✅
```

### Groups

Limit:

```text
Members per group
Products shared
Votes per member
```

### Vouchers

Track:

```text
Issued
Redeemed
Expired
Revoked
```

### COD

Consider limiting repeated failed COD orders later.

---

# 35. Business rule hierarchy

I'd structure your backend logic like this:

```text
                 BUSINESS RULES
                       │
       ┌───────────────┼────────────────┐
       ↓               ↓                ↓
     Orders         Rewards          Groups
       │               │                │
       ↓               ↓                ↓
 Cancellation      Coins/Vouchers    Cart/Checkout
       │               │                │
       └───────────────┼────────────────┘
                       ↓
                    Delivery
                       ↓
                    Inventory
```

These systems must coordinate, but **no single frontend page should own the rules**.

---

# 36. V1 Business Rules — Final Checklist

### 💵 COD

* ✅ COD only
* ✅ Server-calculated total
* ✅ One COD amount
* ✅ Payment confirmed only after delivery

### ❌ Cancellation

* ✅ Customer cancellation window
* ✅ Agent cancellation with reason
* ✅ Admin override
* ✅ Audit history

### 🔄 Returns

* ✅ Return window
* ✅ Eligibility rules
* ✅ Approval process
* ✅ Inspection
* ✅ Refund/settlement policy

### 🔁 Exchange

* ✅ Size/color exchange
* ✅ Stock check
* ✅ Exchange request workflow

### 🪙 Rewards

* ✅ Delivery-based earning
* ✅ Coin ledger
* ✅ Coin reversal
* ✅ Configurable earning rules
* ✅ Expiration policy

### 🎟️ Vouchers

* ✅ Configurable coin → voucher conversion
* ✅ Minimum order
* ✅ Expiration
* ✅ Usage limits
* ✅ Category/product restrictions
* ✅ One voucher per order

### 👥 Groups

* ✅ Owner/member permissions
* ✅ Common address
* ✅ Shared cart
* ✅ Individual item ownership
* ✅ One COD payer
* ✅ Combined delivery
* ✅ Delivery sharing

### 🚚 Delivery

* ✅ Zone-based pricing
* ✅ Group delivery
* ✅ Historical price preservation
* ✅ Server-side calculation

### 📦 Inventory

* ✅ Checkout stock check
* ✅ Stock reservation
* ✅ Release on cancellation
* ✅ Permanent reduction on completed sale

---

### One particularly important architectural rule

For Budget King BD, I'd treat **business rules as backend/domain logic**, not UI logic.

For example, the frontend can display:

> "You can cancel this order."

But the backend must actually decide:

```text
Can cancel?
    ↓
Check current order status
    ↓
Check cancellation window
    ↓
Check user permission
    ↓
Allow / Reject
```

That prevents someone from bypassing your UI and calling the API directly.

At this point, you've planned **architecture → database → security → shopping → orders/delivery → inventory → rewards → groups → product/content → analytics → notifications → business rules**. The next major planning areas are mainly **testing/QA, deployment & DevOps, SEO/marketing, legal/privacy, and backup/disaster recovery**.
