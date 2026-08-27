# 🛍️ Budget King BD — Shopping Flow Plan

The shopping system should be **very simple for a normal customer** while keeping all important decisions server-side.

The overall flow:

```text
Browse
  ↓
Product
  ↓
Cart
  ↓
Checkout
  ↓
COD Confirmation
  ↓
Order Created
  ↓
Agent Processing
  ↓
Shipped
  ↓
Delivered
```

And for problems:

```text
Order
 ├── Cancel
 ├── Exchange
 └── Return
```

---

# 1. 🏠 Product discovery

### Guest or customer

```text
Home
 ↓
Shop
 ↓
Category
 ↓
Product listing
 ↓
Product details
```

Product listing should show:

* Product image
* Name
* Price
* Available sizes
* Available colors
* Discount, if any
* Rating/review summary
* Stock status

### Filters

Initially, since you're only selling shirts:

```text
Category
Size
Color
Price
Availability
```

Later, when you add products:

```text
Category
Brand
Size
Color
Material
Price
...
```

The UI should be designed so those filters can be added without redesigning the entire shop.

---

# 2. 👕 Product page

The product page is where the customer makes the actual purchase decision.

```text
┌──────────────────────────────┐
│       Product Images         │
├──────────────────────────────┤
│ Casual Oxford Shirt          │
│ ⭐ 4.7 (24 reviews)          │
│                              │
│ ৳699                         │
│                              │
│ Color: Black                 │
│ ○ Black  ○ White             │
│                              │
│ Size:                        │
│ [M] [L] [XL]                 │
│                              │
│ ✓ In Stock                   │
│                              │
│ [-] 1 [+]                    │
│                              │
│ [ Add to Cart ]              │
│ [ Buy Now ]                  │
└──────────────────────────────┘
```

### Important

The customer selects a **variant**:

> Black + XL

not simply:

> Oxford Shirt.

That variant determines the actual SKU and inventory.

---

# 3. 🛒 Add to cart

When the customer clicks:

**Add to Cart**

the cart contains:

```text
Product
Variant
Quantity
```

Example:

```text
Oxford Shirt
Black / XL
× 2
```

### Guest

Cart can be stored locally in the browser.

### Logged-in customer

You can initially still use local cart storage.

Later, if you want cross-device synchronization:

```text
Local Cart
    ↓
Login
    ↓
Merge with Server Cart
```

That can be a Phase 2 feature.

---

# 4. Cart page

```text
🛒 Your Cart

Oxford Shirt
Black / XL
৳699

[-] 2 [+]
Remove

----------------

Subtotal        ৳1,398
Delivery        —
Discount        —
----------------
Total            —

[ Proceed to Checkout ]
```

Don't show a fake final total if delivery depends on address.

You can say:

> Delivery calculated at checkout.

---

# 5. 🧾 Checkout

Keep checkout extremely short.

### Step 1 — Customer information

For guest:

```text
Full Name
Phone Number
```

For logged-in customer:

```text
Name
Phone
```

Pre-fill from their profile where appropriate.

---

### Step 2 — Delivery address

```text
Division
District
Area
Full Address
```

You can later improve this with saved addresses.

---

### Step 3 — Delivery method

Initially:

```text
🚚 Home Delivery
```

Because you're COD-only, **don't create a payment-method selection screen**.

---

# 6. 💵 COD

The checkout should simply say:

```text
Payment Method

● Cash on Delivery

Pay when your order arrives.

[ Place Order ]
```

That's it.

No:

* bKash
* Nagad
* Card
* SSLCommerz
* Stripe
* Payment gateway

for now.

---

# 7. 🪙 Voucher at checkout

If the customer has an eligible voucher:

```text
🎟️ Apply Voucher

[ BK20OFF       ] [Apply]
```

Server verifies:

```text
Voucher belongs to customer
↓
Voucher is active
↓
Not expired
↓
Order meets requirements
↓
Calculate discount
```

Then:

```text
Subtotal          ৳2,499
Voucher           -৳100
Delivery           ৳80
-----------------------
Total             ৳2,479
```

The browser does not determine the authoritative total.

---

# 8. Final checkout confirmation

Before placing the order:

```text
┌─────────────────────────────┐
│ Review Your Order           │
│                             │
│ 2 × Oxford Shirt      ৳1398 │
│ 1 × Premium Shirt      ৳899 │
│                             │
│ Subtotal              ৳2297 │
│ Voucher              -৳100  │
│ Delivery                ৳80 │
│                             │
│ Total                 ৳2277 │
│                             │
│ Payment: Cash on Delivery   │
│                             │
│ Deliver to:                 │
│ [Customer address]          │
│                             │
│ [ Place COD Order ]         │
└─────────────────────────────┘
```

---

# 9. 📦 Order creation

When the customer clicks **Place COD Order**:

```text
Checkout
   ↓
Server validation
   ↓
Check product availability
   ↓
Read current prices
   ↓
Validate voucher
   ↓
Calculate delivery
   ↓
Calculate final total
   ↓
Create order
   ↓
Create order items
   ↓
Reserve stock
   ↓
Apply voucher
   ↓
Commit transaction
   ↓
Order number generated
```

Example:

```text
BK-2026-001024
```

This should be **one database transaction** where appropriate.

If something fails, you don't want:

```text
Order created ✅
Stock not updated ❌
Voucher consumed ❌
```

You want the entire operation to succeed or roll back.

---

# 10. 🎉 Order confirmation

After successful checkout:

```text
┌──────────────────────────────┐
│        Order Confirmed ✓     │
│                              │
│      #BK-2026-001024         │
│                              │
│ Thank you for your order!    │
│                              │
│ Payment: Cash on Delivery    │
│ Total: ৳2,277                │
│                              │
│ [ Track Order ]              │
│ [ Continue Shopping ]        │
└──────────────────────────────┘
```

For logged-in customers, the order is automatically added to their order history.

---

# 11. 👤 Guest orders

Guest checkout is important because you decided customers **don't have to log in**.

Flow:

```text
Guest
 ↓
Cart
 ↓
Checkout
 ↓
Name + Phone + Address
 ↓
COD
 ↓
Order
```

No account required.

---

# 12. Guest order tracking

Don't require the guest to create an account after buying.

Give them:

```text
Order Number
+
Verification information
```

For example:

```text
Track your order

Order Number:
[ BK-2026-001024 ]

Phone:
[ 01XXXXXXXXX ]

[ Track ]
```

Then:

```text
Order Confirmed ✓
Processing      ✓
Shipped         ○
Delivered       ○
```

The tracking endpoint should reveal **only the minimum necessary information**.

---

# 13. 📦 Order status system

I'd use something like:

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

Alternative states:

```text
CANCELLED
DELIVERY_FAILED
RETURN_REQUESTED
RETURNED
EXCHANGE_REQUESTED
EXCHANGED
```

Don't allow arbitrary status changes from the frontend.

---

# 14. 📞 Agent workflow

Once an order arrives:

```text
NEW ORDER
    ↓
Agent sees order
    ↓
Contact customer if necessary
    ↓
Confirm
    ↓
Processing
    ↓
Shipping
```

Agent dashboard might show:

```text
New Orders:       14
Pending Contact:   6
Confirmed:        21
Processing:       12
```

---

# 15. ❌ Cancellation

Cancellation rules should be configurable.

For example:

### Customer can cancel:

```text
PENDING
CONFIRMED
```

### Customer cannot normally cancel:

```text
SHIPPED
DELIVERED
```

Once shipped, they would use the return/exchange process instead.

---

# 16. Customer cancellation flow

```text
My Orders
 ↓
Order #BK1024
 ↓
Cancel Order
 ↓
Select reason
 ↓
Confirm
 ↓
Cancellation requested/processed
```

Reasons:

```text
Changed my mind
Ordered by mistake
Wrong product
Delivery taking too long
Other
```

For a simple MVP, you could allow cancellation directly while the order is still `PENDING`, while requiring agent/admin handling for later stages.

---

# 17. 📦 Inventory after cancellation

If stock was reserved:

```text
Order cancelled
      ↓
Release reserved stock
```

Example:

```text
Before:
Stock = 10
Reserved = 2

After cancellation:
Stock = 10
Reserved = 0
```

The inventory movement should be recorded.

---

# 18. 🔄 Exchange

For clothing, **exchange is probably more important than return**.

Example:

> Customer ordered L but needs XL.

Flow:

```text
Delivered
 ↓
Request Exchange
 ↓
Select item
 ↓
Select reason
 ↓
Select replacement size
 ↓
Submit request
 ↓
Agent/Admin review
 ↓
Approved
 ↓
Exchange processing
```

Common reasons:

```text
Wrong size
Wrong color
Damaged item
Wrong item received
```

---

# 19. ↩️ Return

Return flow:

```text
Delivered
 ↓
Request Return
 ↓
Select item
 ↓
Reason
 ↓
Submit
 ↓
Review
 ↓
Approved
 ↓
Return collection
 ↓
Inspection
 ↓
Return completed
```

Since you're **COD-only**, refunds need separate business rules.

For example, you might initially handle refunds manually rather than building a digital refund system.

---

# 20. 🪙 What happens to coins after cancellation/return?

This needs to be explicitly defined.

Suppose:

```text
Order = ৳2,000
Reward = 2,000 coins
```

Order gets delivered:

```text
+2,000 coins
```

Then customer returns it.

The system should create:

```text
-2,000 coins
```

rather than deleting the original transaction.

So:

```text
+2000  earned
-2000  reversal
----------------
0      net
```

This preserves the ledger.

---

# 21. Voucher handling during cancellation/return

If a voucher was used:

```text
Order
 ↓
Voucher applied
 ↓
Order cancelled
```

The system needs a defined policy:

### Option A

Voucher is restored.

### Option B

Voucher is consumed permanently.

I'd recommend **restoring it when the entire order is cancelled before fulfillment**, subject to its original expiry rules.

For partial returns, you need a separate policy.

---

# 22. 📱 Mobile UX

Because most of your customers will likely shop from phones, the flow should be optimized for:

```text
Product
 ↓
Add to Cart
 ↓
Checkout
 ↓
COD
 ↓
Done
```

Avoid unnecessary pages.

A good target is:

**Guest customer → order in ~1–2 minutes.**

---

# 23. Complete shopping flow

```text
                         SHOP
                           │
                           ↓
                      PRODUCT PAGE
                           │
                    ┌──────┴──────┐
                    ↓             ↓
                Add Cart       Buy Now
                    │             │
                    └──────┬──────┘
                           ↓
                         CART
                           ↓
                       CHECKOUT
                           ↓
                 ┌─────────┴─────────┐
                 │                   │
              Guest               Customer
                 │                   │
          Name/Phone/Address     Pre-filled data
                 │                   │
                 └─────────┬─────────┘
                           ↓
                     Apply Voucher
                           ↓
                   Calculate Delivery
                           ↓
                    Review Order
                           ↓
                      COD Order
                           ↓
                  Server Validation
                           ↓
                    Create Order
                           ↓
                    Reserve Stock
                           ↓
                   ORDER CONFIRMED
                           ↓
               ┌───────────┴───────────┐
               ↓                       ↓
          Track Order              Cancel
               │                       │
               ↓                       ↓
          Processing              Cancelled
               ↓
            Shipped
               ↓
           Delivered
               │
          ┌────┴─────┐
          ↓          ↓
       Exchange    Return
```

## What I'd lock in for Budget King BD

* **Guest checkout:** ✅
* **Google login:** optional, not mandatory for purchasing
* **COD only:** ✅
* **No payment gateway:** ✅
* **Server-calculated price:** ✅
* **Variant-based inventory:** ✅
* **Order number:** ✅
* **Guest order tracking:** ✅
* **Customer order history:** ✅
* **Customer cancellation:** limited by status
* **Exchange:** ✅, particularly size exchange
* **Return:** ✅
* **Automatic coin reversal:** ✅
* **Voucher reversal policy:** needs to be defined
* **Group shopping:** handled as a separate checkout/order flow, not mixed into the normal cart unnecessarily

