# 🔐 Budget King BD — Security Plan

For Budget King BD, the security model should follow one principle:

> **Never trust the browser.**

The frontend is only the interface. **Supabase/PostgreSQL + server-side authorization must enforce the actual security.**

---

# 1. Security architecture

```text id="2j2h6m"
                    Browser
                       │
                 HTTPS / TLS
                       │
              Next.js Application
                       │
             ┌─────────┴─────────┐
             │                   │
       Server Actions         Supabase
             │                   │
             └─────────┬─────────┘
                       ↓
                  PostgreSQL
                       │
                      RLS
                       ↓
                Allowed / Denied
```

For sensitive operations:

```text id="9qhjx2"
User request
     ↓
Authentication
     ↓
Authorization
     ↓
Input validation
     ↓
Business-rule validation
     ↓
Database transaction
     ↓
RLS
     ↓
Database change
     ↓
Audit log
```

---

# 2. 🔐 Supabase RLS

**RLS (Row Level Security)** should be enabled on essentially every application table containing private or mutable data.

Think of RLS as a security guard sitting **inside the database**.

Even if someone bypasses your UI and sends a malicious request, PostgreSQL still says:

> "You aren't allowed to access this row."

---

## Public tables

For things such as:

```text id="z1s7d4"
categories
products
product_variants
product_images
```

Public users can have `SELECT` access only where:

```text id="y2m2x1"
is_active = true
```

They should **not** be able to:

* INSERT
* UPDATE
* DELETE

---

# 3. Customer data boundaries

A customer should only access their own private information.

For example:

```text id="3j1w5c"
orders
WHERE user_id = authenticated_user
```

A customer should **never** be able to query:

```text id="f1e9j4"
SELECT * FROM orders
```

and receive everyone else's orders.

RLS prevents that.

---

# 4. Guest order security

Guest checkout is slightly different because:

```text id="7q4t1w"
user_id = NULL
```

You should **not** create a public RLS policy saying:

> Anyone can read orders where user_id is NULL.

That would be disastrous.

Instead:

### Guest

Can **create** an order through a controlled server-side operation.

But cannot freely query guest orders from the database.

### Order tracking

Use a controlled endpoint/action such as:

```text id="8nq0a4"
trackOrder(orderNumber, verificationData)
```

Then verify appropriate information server-side.

For example:

```text id="0h8x9d"
Order number
+
Phone verification
```

before returning tracking information.

---

# 5. 👤 Customer authorization

Customer permissions should be enforced at the database level.

### Customer can:

```text id="hm0u3h"
Own profile
Own orders
Own vouchers
Own coin transactions
Own group memberships
Own votes
Own group-cart items
```

### Customer cannot:

```text id="6o4a2q"
Other customer's orders
Other customer's vouchers
Other customer's coins
Other customer's private data
Admin data
Moderator data
Agent data
System settings
```

---

# 6. 👥 Group security

Group access should be based on **membership**.

For example:

```text id="t5f7fs"
groups
   ↓
group_members
   ↓
user
```

A customer can access group information only if:

```text id="u9z1n4"
user ∈ group_members
```

So if:

```text id="r7q1s3"
Group A
Members:
Rahim
Karim
Hasan
```

Rahim cannot access:

```text id="1x6z0k"
Group B
```

unless he's a member.

---

# 7. Group owner permissions

Owner-specific actions should also be protected.

### Group member

Can:

* View group
* Share products
* Vote
* Add own items to group cart
* Leave group

### Group owner

Can additionally:

* Change group name
* Remove members
* Manage group
* Close group

The frontend can hide buttons, but **RLS/server authorization must enforce it**.

---

# 8. 🪙 Coin security

Coins are one of the areas I'd protect most aggressively.

The customer should **never directly update their coin balance**.

Never allow:

```text id="v3pj2a"
UPDATE profiles
SET coins = 1000000
```

Instead:

```text id="6z2t8s"
Eligible completed order
       ↓
Server-side reward calculation
       ↓
Create coin transaction
       ↓
Ledger updated
```

Customer permissions:

```text id="0t5j7n"
SELECT own coin transactions
```

but:

```text id="p5g7ry"
INSERT coin_transactions
❌ Customer
```

Only the controlled server-side process/admin operation can create appropriate transactions.

---

# 9. Prevent duplicate coin rewards

This is very important.

Suppose:

> Order #BK1001 → 2,000 coins

A malicious request shouldn't be able to execute the reward function 20 times.

Use an idempotency/uniqueness rule around the reward source.

Conceptually:

```text id="y6g8wm"
order_id + transaction_type
```

must be unique for reward issuance.

Then:

```text id="m0g6q8"
Order BK1001
→ reward issued

Second request
→ already rewarded
→ reject/ignore
```

---

# 10. 🎟️ Voucher security

Customers shouldn't be able to:

```text id="j8n5zw"
change voucher value
change expiry
change owner
mark voucher as unused
```

They can only:

```text id="j7s2gd"
View their vouchers
Redeem eligible vouchers
```

The server verifies:

```text id="4l4c1s"
Voucher belongs to user
      ↓
Voucher is active
      ↓
Not expired
      ↓
Not already used
      ↓
Order meets requirements
      ↓
Apply discount
```

Then mark it used **atomically** with the order.

---

# 11. 📦 Inventory security

Inventory should never be trusted from the frontend.

A malicious user shouldn't be able to submit:

```text id="7a2u4x"
quantity = -999
```

or:

```text id="d7m8s0"
price = ৳1
```

The server retrieves:

```text id="6cq2tz"
Product
Variant
Current price
Current inventory
```

and calculates the order itself.

---

# 12. 💰 Price protection

This is critical for an online store.

The client may send:

```text id="9x1t3m"
variant_id = ABC
quantity = 2
```

It should **not be trusted to send**:

```text id="3k5m7z"
price = 10
subtotal = 20
```

The server calculates:

```text id="q7v8e2"
Database price
×
Quantity
+
Delivery
-
Valid discount
=
Final total
```

This prevents someone from modifying the request in DevTools.

---

# 13. 👑 Admin protection

Admin accounts are extremely sensitive.

I recommend:

### Admin login

**Google OAuth only.**

Then:

```text id="g0f4v1"
Google identity
       ↓
Supabase Auth
       ↓
Authorized staff record
       ↓
Admin role
```

Do not allow users to select:

> "I want to be an admin."

Obviously. 😄

---

# 14. Admin role assignment

Only an existing authorized Admin should be able to assign:

```text id="8j2z0c"
customer
order_agent
moderator
admin
```

And ideally, the most sensitive role-management operation should have additional safeguards.

For example:

```text id="f6m2q8"
Admin A
   ↓
Promotes User B to Admin
   ↓
Audit Log
```

---

# 15. Protect management routes

Routes such as:

```text id="t9x4n7"
/admin
/moderator
/agent
```

must be protected **server-side**.

Don't rely on:

```text id="5u8r2c"
if (!isAdmin) redirect("/")
```

alone.

That's just navigation protection.

Actual database operations must still enforce permissions.

---

# 16. Service-role key

This is one of the most important Supabase rules.

### NEVER expose:

```text id="4p6w8x"
SUPABASE_SERVICE_ROLE_KEY
```

to the browser.

Not in:

* React
* client components
* environment variables prefixed for browser exposure
* JavaScript bundles
* GitHub
* public configuration

It belongs strictly on the server.

Think of the service-role key as the **master key to your warehouse**. You don't hand it to every customer because they need to buy a shirt.

---

# 17. Environment variables

Separate:

### Public

```text id="5c2r8n"
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
```

### Server-only

```text id="2m7z1a"
SUPABASE_SERVICE_ROLE_KEY
```

And ensure `.env.local` isn't committed to Git.

Use production secrets through your hosting provider.

---

# 18. 🛡️ Abuse prevention

Your biggest abuse risks aren't necessarily sophisticated hackers.

They'll be things like:

### Fake orders

Someone submits:

```text id="k4z6n8"
1000 COD orders
```

to waste your inventory/time.

### Coin abuse

Trying to repeatedly trigger rewards.

### Voucher abuse

Trying to redeem the same voucher multiple times.

### Group spam

Creating thousands of groups/products/votes.

### Review spam

Submitting hundreds of reviews.

### Automated scraping

Rapidly requesting every product/image/API endpoint.

---

# 19. Order abuse controls

I'd implement:

### Rate limit order creation

Example concept:

```text id="6w9n2s"
Maximum:
X orders / phone / IP / time window
```

Don't necessarily hard-code the exact number yet.

Also consider:

* Duplicate order detection
* Suspicious order flags
* Agent verification
* Order cancellation history

Don't automatically ban users based solely on IP; shared networks can cause false positives.

---

# 20. Group abuse controls

Set reasonable limits:

```text id="h2t5s9"
Maximum groups created per day
Maximum members per group
Maximum products shared per day
Maximum votes per user
Maximum group invitations
```

These limits should be enforced server-side.

---

# 21. Group code security

Don't use:

```text id="a6z9d2"
123456
```

as a group code.

Prefer something unpredictable, for example:

```text id="q8m2p6"
BK-7X92P
```

And ideally store a unique internal identifier separate from the human-friendly code.

You can also allow group owners to regenerate the invite code.

---

# 22. 🔥 Rate limiting

You need rate limiting at multiple levels.

### Public endpoints

Protect:

```text id="k2m8s4"
Search
Product API
Order creation
Order tracking
Group joining
```

### Authenticated endpoints

Protect:

```text id="b5n1q7"
Create group
Vote
Redeem voucher
Create order
Cancel order
```

### Staff endpoints

Especially:

```text id="f3c8w2"
Confirm order
Cancel order
Modify inventory
Modify rewards
Manage staff
```

---

# 23. Rate-limit layers

I'd use three levels conceptually:

```text id="t1x5r8"
                 Rate Limiting
                      │
          ┌───────────┼───────────┐
          ↓           ↓           ↓
         IP          User       Action
```

For example:

```text id="3h9q4m"
IP
↓
Protect public endpoints

User ID
↓
Protect authenticated abuse

Action
↓
Protect sensitive operations
```

---

# 24. Input validation

Every server-side mutation should validate input.

Use a schema validator such as **Zod**.

Example concept:

```text id="f9j3s1"
createOrder(input)
       ↓
Zod validation
       ↓
Business validation
       ↓
Database operation
```

Validate:

* Phone number
* Quantity
* UUIDs
* Addresses
* Group codes
* Voucher codes
* Product IDs
* Text lengths
* Enum values

Never trust TypeScript types alone because runtime requests can be manipulated.

---

# 25. SQL injection

Using Supabase/Postgres client methods with parameterized queries protects against normal SQL injection.

Avoid constructing SQL strings from user input.

If you use PostgreSQL functions/RPCs, make sure parameters are handled safely.

---

# 26. XSS protection

Customer-controlled text includes:

* Group messages
* Product comments
* Reviews
* Names

Don't render arbitrary HTML from users.

Prefer:

```text id="3n7v2x"
Plain text
```

over allowing arbitrary HTML.

If rich text is ever introduced, sanitize it.

---

# 27. File upload security

Product images are admin-controlled.

Still validate:

* File type
* File size
* Filename
* Image dimensions
* Upload permissions

Customers shouldn't be able to upload arbitrary files into your product storage bucket.

If customer avatars are allowed, give them a separate restricted path/bucket.

---

# 28. Audit logging

Important actions should create audit records:

```text id="y0s4q6"
Admin:
├── Product price changed
├── Inventory adjusted
├── Reward rule changed
├── Voucher configuration changed
├── Staff role changed
└── Customer restricted

Agent:
├── Order confirmed
├── Order cancelled
└── Order status changed

Moderator:
├── Review removed
├── Group content removed
└── User restricted
```

Customers generally don't need access to the internal audit log.

---

# 29. Sensitive data boundaries

Don't expose more customer data than necessary.

### Customer sees

```text id="9p3k6z"
Their own:
Name
Phone
Address
Orders
Rewards
Groups
```

### Agent sees

Only information necessary for order handling:

```text id="v4m7c2"
Name
Phone
Delivery address
Order details
```

### Moderator

Usually doesn't need:

```text id="h7w2p5"
Full address
Order history
Payment-related information
```

So don't simply give Moderator a generic:

> `SELECT * FROM profiles`

permission.

---

# 30. Security hierarchy

The final architecture should look like:

```text id="3n5j8q"
                    REQUEST
                       │
                       ↓
                 Authentication
                       │
                       ↓
                 Authorization
                       │
                       ↓
                 Input Validation
                       │
                       ↓
               Business Validation
                       │
                       ↓
                Database Transaction
                       │
                       ↓
                     RLS
                       │
                ┌──────┴──────┐
                ↓             ↓
              Allow          Deny
                │
                ↓
             Audit Log
```

Not every read needs every stage, but **sensitive mutations should follow this model**.

---

# 31. Security priorities for your MVP

Don't spend equal effort everywhere.

### 🔴 Critical

1. **RLS**
2. **Role/permission enforcement**
3. **Admin protection**
4. **Price validation**
5. **Inventory protection**
6. **Coin/voucher protection**
7. **Guest-order protection**
8. **Service-role key protection**

### 🟠 High

9. Rate limiting
10. Input validation
11. Audit logs
12. Group abuse prevention
13. File-upload restrictions

### 🟡 Later

14. Advanced fraud detection
15. Device fingerprinting
16. Automated suspicious-order scoring
17. Advanced bot detection

Don't over-engineer the last four before you even have customers.

---

# 🔒 Final security architecture

```text id="j5p4v8"
                    BROWSER
                       │
                    HTTPS
                       │
                 NEXT.JS APP
                       │
          ┌────────────┴────────────┐
          │                         │
     Authentication            Rate Limits
          │
      Google OAuth
          │
     Supabase Auth
          │
     ┌────┴─────┐
     │          │
  Customer    Staff
                │
        Role/Permission Check
                │
                ↓
        Server Actions / API
                │
        Input Validation
                │
        Business Validation
                │
                ↓
          PostgreSQL
                │
               RLS
                │
       ┌────────┴────────┐
       │                 │
    Allowed            Denied
       │
       ↓
  Database Transaction
       │
       ↓
   Audit Log
```

### The key philosophy

**Frontend security:** hide things and guide users.

**Server security:** validate everything.

**Database security:** RLS prevents unauthorized data access.

**Business security:** transactions/idempotency prevent things like duplicate rewards and inventory races.

**Operational security:** audit logs tell you who changed what.

For Budget King BD, **RLS + server-side authorization + transactional business logic** should be the three pillars. Everything else sits around those.   