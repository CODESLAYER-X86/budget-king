# 👥 Budget King BD — Group Shopping System

The group-shopping system can become one of **Budget King BD's main differentiating features**. I would design it around this flow:

```text
Create Group
     ↓
Share Group Code
     ↓
Members Join
     ↓
Share Products
     ↓
Vote / Discuss
     ↓
Add Products to Group Cart
     ↓
Group Checkout
     ↓
One Common Delivery
     ↓
Delivery Cost Shared
```

Think of it like a **shared shopping room**: everyone can suggest shirts, everyone can vote, but only authorized people can finalize the group's purchase.

---

# 1. 👥 Group creation

A logged-in customer can create a group.

### Create Group

```text
Group name:
DIU Friends

Group description:
Buying shirts together

Delivery area:
Dhaka

[ Create Group ]
```

After creation:

```text
DIU Friends

Group Code:
BK7X29

[ Copy Code ]
[ Share Group ]
```

I'd use a **short random code**, not the group's database ID.

Example:

```text
BK7X29
```

---

# 2. Joining a group

Customer enters:

```text
Join a Group

Group Code:
[ BK7X29 ]

[ Join ]
```

Server checks:

* Does the group exist?
* Is it active?
* Is joining allowed?
* Is the user already a member?
* Has the group reached its member limit?

Then:

```text
Rahim joined DIU Friends
```

---

# 3. 👤 Group roles

Keep group-specific roles simple.

### Group Owner

The person who created the group.

Can:

* Change group settings
* Remove members
* Change member permissions
* Manage group cart
* Start group checkout
* Set delivery address
* Close/delete group

### Group Member

Can:

* View group
* Share products
* Vote
* Comment/discuss
* Add products to group cart
* See group cart
* Remove **their own** items

### Optional: Group Admin

I'd initially **avoid this**.

If a group becomes large, you can allow the owner to promote someone to:

> Group Admin

But this isn't necessary for V1.

---

# 4. 🔐 Group permissions

I'd use something like:

| Action                       | Owner | Member |
| ---------------------------- | ----: | -----: |
| View group                   |     ✅ |      ✅ |
| Join                         |     — |      — |
| Invite                       |     ✅ |      ✅ |
| Share product                |     ✅ |      ✅ |
| Vote                         |     ✅ |      ✅ |
| Comment                      |     ✅ |      ✅ |
| Add to group cart            |     ✅ |      ✅ |
| Remove own cart item         |     ✅ |      ✅ |
| Remove another member's item |     ✅ |      ❌ |
| Edit group settings          |     ✅ |      ❌ |
| Remove member                |     ✅ |      ❌ |
| Start checkout               |     ✅ |      ❌ |
| Set common address           |     ✅ |      ❌ |
| Close group                  |     ✅ |      ❌ |

The key principle:

> **Members control their own shopping; the owner controls the group.**

---

# 5. 🛍️ Product sharing

This is where the group becomes more than just a shared cart.

Customer sees a product:

```text
Oxford Shirt
৳699

[ Add to Cart ]
[ Share to Group ]
```

Click:

> Share to Group

Then:

```text
Share with:

☑ DIU Friends
☐ CSE Friends

Message:
"Should we buy this one?"

[ Share ]
```

---

# 6. Group feed

The group should have a feed.

Example:

```text
DIU Friends
5 Members
────────────────────

Rahim shared:

      [ Shirt Image ]

Oxford Shirt
Black / XL
৳699

"Should we get this?"

👍 4     👎 1

[ View Product ]
[ Add to Group Cart ]
────────────────────

Karim shared:

      [ Shirt Image ]

Premium Polo
৳799

👍 2     👎 3
```

This creates a lightweight social-shopping experience.

---

# 7. 👍 Voting

Keep voting extremely simple.

### Option 1

```text
👍 Like
👎 Dislike
```

This is enough for V1.

### Better later

You could have:

```text
👍 Want it
🤔 Maybe
👎 Don't want it
```

But I wouldn't overcomplicate the initial system.

---

# 8. One vote per member

A member should only have **one active vote per shared product**.

Example:

```text
Rahim → 👍
Karim → 👍
Hasan → 👎
```

Results:

```text
👍 2
👎 1
```

If Rahim changes his mind:

```text
👍 → 👎
```

The system updates his vote rather than creating another vote.

---

# 9. Voting doesn't automatically add to cart

This distinction is important.

Someone votes:

> 👍

That should **not mean they want to buy it**.

Instead:

```text
Vote
  ≠
Purchase
```

The user must explicitly select:

> **Add to Group Cart**

This prevents accidental orders.

---

# 10. Product sharing permissions

Members can share:

* Existing Budget King products
* Specific variant
* Size
* Color

For example:

```text
Oxford Shirt
Black / XL
৳699
```

Not simply:

```text
Oxford Shirt
```

because size/color matters for inventory.

---

# 11. 👕 Variant selection

If someone shares a product without selecting a variant:

```text
Oxford Shirt

Color:
[ Select ]

Size:
[ Select ]

[ Share ]
```

But if they're just asking the group whether the product looks good, they can share the base product.

Then:

> Add to group cart

requires variant selection.

---

# 12. 💬 Discussion

I'd include lightweight comments.

Example:

```text
Rahim:
"Black looks better."

Karim:
"I prefer navy."

Hasan:
"Let's get black."

👍 4
```

Don't turn it into a full messaging platform.

You don't need:

* Private messaging
* Voice
* Video
* Complex chat

Just product-specific comments.

---

# 13. 🛒 Group cart

This should be clearly different from the customer's normal cart.

Example:

```text
GROUP CART
DIU Friends

────────────────────

Rahim
Oxford Shirt
Black / XL × 2
৳1,398

Karim
Oxford Shirt
White / L × 1
৳699

Hasan
Polo
Navy / M × 1
৳799

────────────────────
Subtotal       ৳2,896
Delivery          ৳80
────────────────────
Total          ৳2,976
```

---

# 14. Individual ownership of items

Every group-cart item should belong to a specific member.

Example:

```text
group_cart_item

member:
Rahim

product:
Oxford Shirt

variant:
Black / XL

quantity:
2
```

This is important for:

* Who added it
* Who owns it
* How much they owe
* Removing their items
* Tracking their purchases

---

# 15. Members should see their own total

At the bottom:

```text
Your items

Oxford Shirt ×2
৳1,398

Your product total:
৳1,398
```

And:

```text
Group total:
৳2,976
```

This makes COD collection easier.

---

# 16. 🧮 Delivery splitting

This is where your idea becomes useful.

Suppose:

```text
Rahim     ৳1,398
Karim       ৳699
Hasan       ৳799
----------------
Products  ৳2,896
```

Normal individual delivery:

```text
Rahim → ৳80
Karim → ৳80
Hasan → ৳80

Total delivery = ৳240
```

Group:

```text
One destination
       ↓
One delivery
       ↓
৳80
```

Savings:

```text
৳240 → ৳80
```

---

# 17. How should delivery be split?

I recommend **proportional splitting based on item subtotal**.

Example:

```text
Total product value = ৳2,896
Delivery = ৳80
```

Rahim:

```text
1398 / 2896 × 80
≈ ৳38.64
```

Karim:

```text
699 / 2896 × 80
≈ ৳19.31
```

Hasan:

```text
799 / 2896 × 80
≈ ৳22.05
```

Total:

```text
38.64 + 19.31 + 22.05
= ৳80
```

This is fairer than simply splitting:

```text
৳80 / 3 = ৳26.67
```

because members may buy very different amounts.

---

# 18. But for COD...

Here's the important operational problem.

Suppose:

```text
Rahim → ৳1,436.64
Karim → ৳718.31
Hasan → ৳821.05
```

Are you going to ask the delivery agent to collect three separate payments?

**I wouldn't.**

For V1:

### One group order = one COD payment

The group owner chooses:

> **COD payer**

Example:

```text
COD Payer:
Rahim

Total:
৳2,976
```

Rahim collects money from the others himself.

The system can still show:

```text
Rahim owes:    ৳1,436.64
Karim owes:      ৳718.31
Hasan owes:      ৳821.05
```

But Budget King BD only needs to collect:

```text
৳2,976
```

from the delivery recipient.

---

# 19. Alternative: equal delivery split

For simplicity, you could allow:

```text
Delivery splitting:

○ Proportional
○ Equal
```

But I would make **proportional the default**.

---

# 20. 🚚 Common delivery address

Group checkout must explicitly establish:

> Where is this combined order being delivered?

Example:

```text
Group Delivery

Address:
DIU Main Campus
Dhanmondi, Dhaka

[ Confirm Address ]
```

All members need to understand:

> **This is one shared delivery.**

---

# 21. Group checkout

Only the **Group Owner** should initiate final checkout.

Flow:

```text
Group Cart
    ↓
Review members/items
    ↓
Check inventory
    ↓
Confirm common address
    ↓
Calculate delivery
    ↓
Select COD payer
    ↓
Review total
    ↓
Place Group Order
```

---

# 22. Final confirmation

Before placing:

```text
⚠️ Group Order Confirmation

Members: 5
Items: 8

Delivery:
DIU Main Campus

Payment:
Cash on Delivery

COD Payer:
Rahim

Subtotal:
৳4,280

Delivery:
৳80

Total:
৳4,360

[ Place Group Order ]
```

This is the final point where inventory should be reserved.

---

# 23. Inventory reservation

Don't reserve inventory when someone adds something to the group cart.

Example:

```text
Group cart:
Black XL × 5
```

No reservation yet.

Only:

```text
Place Group Order
        ↓
Check inventory
        ↓
Reserve
```

This follows the same inventory architecture we already planned.

---

# 24. What if stock disappears?

Suppose:

```text
Group cart:
Black XL × 3
```

But another customer purchases the last two.

At checkout:

```text
Available:
2

Requested:
3
```

Show:

```text
⚠️ Stock changed

Black / XL

Requested: 3
Available: 2

Please update the group cart.
```

Don't silently reduce the quantity.

---

# 25. Member leaving the group

If a member leaves:

```text
Leave Group
```

their **unsubmitted group-cart items should be removed**.

But previous completed orders remain unaffected.

Example:

```text
Group membership
     ↓
Leave
     ↓
Remove active cart items
     ↓
Preserve order history
```

---

# 26. Owner leaving

Don't allow:

> Owner leaves → group has no owner.

Instead:

```text
Owner
 ↓
Transfer ownership
 ↓
New owner
 ↓
Old owner becomes member
```

Or:

```text
Owner
 ↓
Close Group
```

---

# 27. Group limits

I'd impose reasonable limits from the beginning.

For example:

```text
Maximum members: 50
```

And perhaps:

```text
Maximum shared products: 100
```

These don't need to be permanent; they can be configurable later.

This also helps abuse prevention.

---

# 28. Group expiration

You should consider inactive groups.

For example:

```text
Group created
      ↓
No activity for 90 days
      ↓
Inactive
```

But **don't delete the historical orders**.

You can archive the group.

---

# 29. Group UI

I'd structure the group page like:

```text
┌───────────────────────────────────┐
│ DIU Friends                 ⚙️    │
│ 8 Members                         │
│ Code: BK7X29                     │
├───────────────────────────────────┤
│                                   │
│ [ Feed ] [ Cart ] [ Members ]     │
│                                   │
├───────────────────────────────────┤
│                                   │
│ Rahim shared a product            │
│                                   │
│     [ Product Image ]             │
│     Oxford Shirt                  │
│     ৳699                          │
│                                   │
│     👍 6     👎 2                 │
│                                   │
│ [View] [Add to Group Cart]        │
│                                   │
└───────────────────────────────────┘
```

I'd use **three tabs**:

### Feed

Products + votes + comments

### Cart

Combined shopping cart

### Members

Group members and permissions

---

# 30. Group home dashboard

At the top:

```text
DIU Friends

👥 8 Members
🛒 7 Items
💰 ৳4,280

Delivery:
DIU Campus

[ Share Group ]
[ View Cart ]
```

This gives everyone an immediate overview.

---

# 31. Group notifications

Useful notifications:

```text
Rahim joined the group.

Karim shared a product.

Hasan voted 👍 on Oxford Shirt.

Rahim added Oxford Shirt to group cart.

Group cart was updated.

Group order is ready for checkout.
```

But avoid excessive notifications.

---

# 32. Security

Group codes should **not be treated as authorization credentials**.

A code such as:

```text
BK7X29
```

only allows someone to **request joining**.

The server must still verify:

```text
Authenticated Google account
        ↓
Membership
        ↓
Permission
        ↓
Action
```

Never do:

```text
if group_code == "BK7X29":
    allow_admin_action()
```

---

# 33. Important RLS boundaries

Supabase RLS should enforce:

### Member can read

Only groups they're members of.

```text
group_members.user_id = auth.uid()
```

### Member can create

Shared products/votes/comments for groups they're members of.

### Member can modify

Only their own:

* Vote
* Cart items
* Comments

### Owner can modify

Group-level settings and members.

### Admin

Can access everything according to your admin policies.

---

# 34. Recommended tables

At the database-design level, this feature will probably need:

```text
groups
group_members
group_invites
group_products
group_votes
group_comments
group_cart_items
group_orders
```

Potentially:

```text
group_settings
```

if you later make group behavior configurable.

---

# 35. Relationship

```text
USER
 │
 ├──────────────┐
 ↓              ↓
GROUP       GROUP_MEMBER
 │
 ├── GROUP_PRODUCT
 │       │
 │       ├── GROUP_VOTE
 │       └── GROUP_COMMENT
 │
 └── GROUP_CART_ITEM
          │
          ↓
      GROUP_ORDER
          │
          ↓
      ORDER_ITEMS
```

---

# 36. Full group-shopping lifecycle

```text
                 CREATE GROUP
                      │
                      ↓
               SHARE GROUP CODE
                      │
                      ↓
                MEMBERS JOIN
                      │
                      ↓
              SHARE PRODUCTS
                      │
                      ↓
                  VOTE
                      │
                      ↓
              DISCUSS PRODUCTS
                      │
                      ↓
            ADD TO GROUP CART
                      │
                      ↓
               REVIEW CART
                      │
                      ↓
             COMMON ADDRESS
                      │
                      ↓
              STOCK CHECK
                      │
                      ↓
             RESERVE STOCK
                      │
                      ↓
              GROUP ORDER
                      │
                      ↓
                COD PAYMENT
                      │
                      ↓
              SINGLE DELIVERY
                      │
                      ↓
                 DELIVERED
```

---

# 37. What I would build for V1

Don't try to build a mini social network.

### Definitely include

* ✅ Group creation
* ✅ Group code
* ✅ Join group
* ✅ Owner/member roles
* ✅ Product sharing
* ✅ 👍/👎 voting
* ✅ Product comments
* ✅ Group cart
* ✅ Individual member ownership of cart items
* ✅ Common delivery address
* ✅ Group checkout
* ✅ One COD payer
* ✅ Combined delivery
* ✅ Proportional delivery calculation
* ✅ Inventory validation
* ✅ Group order tracking

### Leave for V2

* ⏳ Group chat
* ⏳ Group admins
* ⏳ Multiple COD payers
* ⏳ Advanced voting/polls
* ⏳ Group-specific discounts
* ⏳ Group spending limits
* ⏳ Group purchase history analytics
* ⏳ Invite links with advanced permissions

**The strongest part of this feature is not the voting itself; it's the connection between social decision-making → shared cart → single destination → lower delivery cost.** That's the workflow I'd make visually prominent throughout Budget King BD.


# 📊 Budget King BD — Inventory System

For Budget King BD, I recommend a **variant-based inventory system with reservations and an immutable movement history**.

The core idea:

```text
Product
   ↓
Variant
   ↓
Available Stock
   ↓
Reservation
   ↓
Order
   ↓
Delivered / Cancelled / Returned
```

The key rule is: **customers never directly modify stock.** Every stock change happens through controlled server-side operations.

---

# 1. 👕 Stock belongs to variants

Inventory should be attached to the **product variant**, not the product itself.

Example:

```text
Oxford Shirt
│
├── Black / M   → SKU: OS-BLK-M → 12
├── Black / L   → SKU: OS-BLK-L → 8
├── Black / XL  → SKU: OS-BLK-XL → 5
├── White / M   → SKU: OS-WHT-M → 10
└── White / L   → SKU: OS-WHT-L → 7
```

Each variant has its own stock.

This becomes essential when you eventually sell trousers, shoes, etc.

**Analogy:** A clothing store doesn't have "20 Oxford shirts" as one pile—the warehouse has 20 specific combinations of size/color.

---

# 2. 🗄️ Inventory table

Use:

```text
inventory
├── variant_id
├── quantity
├── reserved_quantity
├── low_stock_threshold
├── updated_at
└── updated_by
```

For example:

```text
Variant: Black / XL

quantity          = 10
reserved_quantity = 3
```

Therefore:

```text
Available stock = 10 - 3 = 7
```

---

# 3. 🟢 Stock states

You essentially have:

```text
TOTAL STOCK
     │
     ├── AVAILABLE
     │
     └── RESERVED
```

Example:

```text
Total:      20
Reserved:    4
Available:  16
```

Don't create a separate manually editable `available_quantity`.

Calculate it:

```text
available = quantity - reserved_quantity
```

That prevents inconsistencies.

---

# 4. 🛒 Stock reservation

This is particularly important for COD.

Suppose:

```text
Stock = 10
```

Customer A orders:

```text
5 shirts
```

While the order is pending:

```text
quantity          = 10
reserved_quantity = 5
available         = 5
```

Now Customer B can't successfully order 6.

The server sees:

```text
Available = 5
Requested = 6

❌ Insufficient stock
```

---

# 5. Why reservation is necessary

Without reservations:

```text
Stock = 5

Customer A → orders 5
Customer B → orders 5
```

Both requests might see:

```text
Stock = 5
```

You end up with:

```text
10 orders
5 products
```

That's an **overselling/race-condition problem**.

Reservation acts like putting a product into a physical shopping basket and marking it "held."

---

# 6. When should stock be reserved?

I'd recommend:

```text
Order successfully created
        ↓
Stock reservation
```

So:

```text
PENDING
   ↓
Reserved
```

Then the reservation remains while the order is being processed.

---

# 7. Reservation lifecycle

```text
Order Created
      ↓
Reserve Stock
      ↓
PENDING
      │
      ├── Cancelled → Release Reservation
      │
      ↓
CONFIRMED
      ↓
PROCESSING
      ↓
SHIPPED
      ↓
DELIVERED
      ↓
Convert Reservation → Sold
```

The important distinction:

### Reserved ≠ Sold

A pending order hasn't actually resulted in a completed sale yet.

---

# 8. 📦 When order is shipped

At shipping:

```text
Reserved
    ↓
Sold
```

Conceptually:

```text
quantity = quantity - sold_quantity
reserved_quantity = reserved_quantity - reserved_quantity
```

Example:

Before:

```text
Total stock: 10
Reserved:     3
Available:    7
```

After shipping 3:

```text
Total stock: 7
Reserved:    0
Available:   7
```

---

# 9. ❌ Cancellation

Suppose:

```text
Stock = 10
Reserved = 3
Available = 7
```

Customer cancels.

The product was never sold.

So:

```text
Reserved:
3 → 0
```

Result:

```text
Stock = 10
Reserved = 0
Available = 10
```

You **release the reservation**, rather than adding stock.

---

# 10. 🚚 Delivery failure

If the order was shipped but couldn't be delivered:

```text
SHIPPED
   ↓
DELIVERY_FAILED
```

You need to distinguish between:

### Reattempt

```text
DELIVERY_FAILED
      ↓
SHIPPED
```

No inventory change.

### Order permanently cancelled

Then the item comes back into your inventory:

```text
Cancelled
   ↓
Returned to warehouse
   ↓
Stock + quantity
```

But this should happen when the physical goods are actually back—not merely when the order is marked cancelled.

---

# 11. ↩️ Returns

Returns need slightly different treatment.

Example:

```text
Customer bought:
Black / XL × 1
```

Order delivered.

Later returned.

When the physical shirt comes back:

### If sellable

```text
Inventory +1
```

### If damaged

```text
Inventory +0
```

Instead record:

```text
DAMAGED / UNSALABLE
```

This distinction matters for clothing.

---

# 12. 🔄 Exchange

Example:

Customer wants:

```text
Black / L
```

but receives/ordered:

```text
Black / XL
```

Exchange:

```text
XL returned
L supplied
```

Inventory:

```text
XL → +1
L  → -1
```

But only after the appropriate physical exchange steps occur.

---

# 13. 🧾 Inventory movement history

Never simply overwrite stock without recording **why it changed**.

Create:

```text
inventory_movements
├── id
├── variant_id
├── movement_type
├── quantity_change
├── reference_type
├── reference_id
├── performed_by
├── note
└── created_at
```

Example:

```text
+20  STOCK_RECEIVED
-2   SOLD
+1   RETURN
-1   DAMAGED
+3   ADJUSTMENT
```

---

# 14. Movement types

I'd support:

```text
STOCK_RECEIVED
SALE
RESERVATION
RESERVATION_RELEASE
RETURN
EXCHANGE_IN
EXCHANGE_OUT
DAMAGE
LOST
ADJUSTMENT
```

You don't necessarily need every one to affect `quantity`.

For example:

```text
RESERVATION
```

primarily affects:

```text
reserved_quantity
```

while:

```text
SALE
RETURN
DAMAGE
```

affect actual inventory quantity.

---

# 15. Example complete history

Suppose you initially receive 50 shirts.

```text
Date        Event              Change
------------------------------------------------
Aug 01      Stock received      +50
Aug 03      Reserved             -3 reserved
Aug 03      Reservation release  +3 available
Aug 05      Reserved             -5 reserved
Aug 05      Shipped/Sold         -5 stock
Aug 12      Return               +1 stock
Aug 13      Damaged              -1 stock
```

Current inventory can always be explained by the history.

That's extremely useful when an admin asks:

> "Why does the system say we have 42 shirts?"

---

# 16. 📊 Admin inventory dashboard

Your admin should have:

```text
Inventory
─────────────────────────────

Total Products        12
Total Variants        46
Low Stock             8
Out of Stock          3
Reserved Items        14
```

Then:

```text
Oxford Shirt / Black / XL

SKU: OS-BLK-XL

Stock:       10
Reserved:     3
Available:    7

[ Adjust Stock ]
[ View History ]
```

---

# 17. Low-stock alerts

Each variant can have:

```text
low_stock_threshold
```

Example:

```text
Stock = 4
Threshold = 5
```

Dashboard:

> ⚠️ Low stock

When:

```text
available <= threshold
```

the variant appears in the low-stock list.

---

# 18. Out-of-stock behavior

When:

```text
available = 0
```

customer sees:

```text
❌ Out of Stock
```

and:

```text
[ Add to Cart ]
```

should be disabled.

But **don't rely on this UI**.

A customer might already have the product in their cart from 10 minutes ago.

At checkout, the server must check stock again.

---

# 19. Cart vs inventory

Don't reserve stock merely because someone clicks:

> Add to Cart.

Otherwise someone could put 20 shirts in their cart and leave the website, blocking everyone else.

Instead:

```text
Add to cart
    ↓
No reservation

Checkout
    ↓
Order created
    ↓
Reservation
```

This is much better.

---

# 20. Reservation expiry

There is one issue:

A customer creates a COD order and then disappears.

If reservations never expire:

```text
Stock = 10
Customer reserves 8
Never responds
```

Only 2 remain available forever.

So I recommend reservation/order expiration logic.

For example:

```text
PENDING
   ↓
Reservation active
   ↓
Customer doesn't confirm
   ↓
Reservation expires
   ↓
Stock released
```

The exact timeout should be decided based on your agent workflow.

---

# 21. ⚠️ Don't use client-side stock calculations

Bad:

```text
Browser:
"Stock = 10"

Customer:
"I want 10"

Browser:
"Okay!"
```

Good:

```text
Browser
  ↓
Request order
  ↓
Server
  ↓
Database transaction
  ↓
Lock/check inventory
  ↓
Reserve stock
  ↓
Create order
```

This prevents race conditions.

---

# 22. Atomic stock reservation

This is technically important.

Two customers might simultaneously try to buy the last shirt:

```text
Stock = 1

Customer A → 1
Customer B → 1
```

The database operation must be atomic so that **only one succeeds**.

Conceptually:

```text
BEGIN TRANSACTION

Check available stock
        ↓
If available >= requested
        ↓
Reserve stock
        ↓
Create order

COMMIT
```

Otherwise:

```text
Customer A → SUCCESS
Customer B → SUCCESS
Stock → -1 ❌
```

---

# 23. Admin stock adjustment

Admins need manual adjustment because real warehouses aren't perfect.

Example:

```text
System says: 20
Physical count: 18
```

Admin:

```text
[ Adjust Stock ]

Current: 20
New:     18

Reason:
Physical inventory correction
```

System records:

```text
ADJUSTMENT
-2
Admin: [name]
Reason: Physical inventory correction
```

Never silently change `20 → 18`.

---

# 24. Who can manage inventory?

### Admin

Full control:

```text
View
Add stock
Remove stock
Adjust stock
View history
```

### Agent

Probably:

```text
View stock
View availability
```

But **not modify inventory**.

If agents physically handle stock, you can later give them specific inventory permissions.

### Moderator

```text
No inventory access
```

### Customer

```text
Public availability only
```

They should see:

```text
In stock
Low stock
Out of stock
```

rather than your exact warehouse quantity unless you intentionally want to expose it.

---

# 25. Group orders

Group carts should use the **same inventory system**.

Suppose:

```text
Group cart:
Black XL × 4
```

At group checkout:

```text
Available stock
      ↓
Check ×4
      ↓
Reserve ×4
      ↓
Create group order
```

You don't need a separate group inventory system.

That's important because otherwise you'd create two competing stock systems.

---

# 26. Inventory + order relationship

The clean model is:

```text
Product
   ↓
Variant
   ↓
Inventory
   ↓
Inventory Movement
        ↑
        │
      Order
        │
        ↓
   Order Item
```

For group orders:

```text
Group Order
    ↓
Order Items
    ↓
Same Variant Inventory
```

---

# 27. Complete lifecycle

```text
             STOCK RECEIVED
                    │
                    ↓
              AVAILABLE
                    │
             Customer orders
                    │
                    ↓
               RESERVED
              /         \
             /           \
       Cancelled        Confirmed
          │                 │
          ↓                 ↓
    RELEASED          PROCESSING
                            │
                            ↓
                         SHIPPED
                            │
                     ┌──────┴──────┐
                     ↓             ↓
                 DELIVERED      FAILED
                     │             │
                     │        Reattempt
                     │             │
                     │         or Return
                     ↓
                 SOLD
                     │
                     ↓
                  RETURN
                  /     \
                 /       \
            SELLABLE    DAMAGED
               │           │
               ↓           ↓
           STOCK +1     UNSALABLE
```

---

# 28. Final design I'd use

### Core tables

```text
products
    ↓
product_variants
    ↓
inventory
    ↓
inventory_movements
```

### Order integration

```text
orders
    ↓
order_items
    ↓
product_variants
    ↓
inventory
```

### Rules

* **Stock belongs to variants**
* **Available = quantity − reserved_quantity**
* **Cart does not reserve stock**
* **Successful checkout reserves stock**
* **Reservation is released when an order is cancelled/expired**
* **Shipping converts reserved stock into sold stock**
* **Returned sellable items increase stock**
* **Damaged returns don't automatically become sellable stock**
* **Every physical stock change creates an inventory movement**
* **Admin adjustments require a reason**
* **Inventory operations must be atomic**
* **Group orders use the same inventory pool**
* **Customers never directly modify inventory**
