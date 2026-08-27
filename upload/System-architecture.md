# 🏗️ Budget King BD — System Architecture Plan

Since you're building this with **TypeScript + Supabase**, I recommend a **single full-stack Next.js application** rather than separating frontend and backend into different projects.

```text
                    Budget King BD
                          │
              ┌───────────┴───────────┐
              │                       │
          Customer UI             Management UI
              │                       │
              └───────────┬───────────┘
                          │
                   Next.js / TS
                          │
              ┌───────────┴───────────┐
              │                       │
       Server Actions / API      Supabase Client
              │                       │
              └───────────┬───────────┘
                          │
                       Supabase
              ┌───────────┼───────────┐
              │           │           │
           Postgres      Auth       Storage
```

---

# 1. Frontend structure

I'd use **Next.js + TypeScript + Tailwind CSS**.

A clean structure:

```text
src/
├── app/
│   ├── (store)/
│   │   ├── page.tsx
│   │   ├── shop/
│   │   ├── products/
│   │   ├── offers/
│   │   ├── cart/
│   │   └── checkout/
│   │
│   ├── (customer)/
│   │   ├── account/
│   │   ├── orders/
│   │   ├── rewards/
│   │   └── groups/
│   │
│   ├── admin/
│   ├── moderator/
│   ├── agent/
│   │
│   └── api/
│
├── components/
│   ├── ui/
│   ├── store/
│   ├── customer/
│   ├── groups/
│   └── management/
│
├── lib/
│   ├── supabase/
│   ├── auth/
│   ├── permissions/
│   ├── validation/
│   └── utils/
│
├── actions/
│   ├── orders/
│   ├── products/
│   ├── rewards/
│   ├── groups/
│   └── inventory/
│
├── types/
└── config/
```

### Key principle

Keep **business logic outside UI components**.

Don't have:

```text
ProductPage
   ↓
100 lines of database operations
   ↓
100 lines of business rules
```

Instead:

```text
ProductPage
    ↓
Server Action / service
    ↓
Supabase
```

**Analogy:** The cashier shouldn't be responsible for running the warehouse. The UI takes the customer's request; the backend logic decides how that request is processed.

---

# 2. Backend architecture

Supabase will handle most of your backend infrastructure.

### Supabase components

```text
Supabase
│
├── PostgreSQL
│   └── All application data
│
├── Auth
│   └── Google OAuth
│
├── Storage
│   └── Product images
│
└── Edge Functions
    └── Special server-side operations
```

You don't need a traditional Express/NestJS backend initially.

---

# 3. Three layers of application logic

I'd use:

```text
UI
 ↓
Server Action / API
 ↓
Database
```

But for important operations:

```text
UI
 ↓
Server Action
 ↓
Business Logic
 ↓
Supabase
```

For example:

### Customer places order

```text
Checkout UI
     ↓
placeOrder()
     ↓
Validate cart
     ↓
Validate product availability
     ↓
Calculate price
     ↓
Calculate delivery
     ↓
Create order
     ↓
Reserve stock
     ↓
Return order number
```

The browser should **never calculate the final authoritative order price**.

---

# 4. Server Actions vs API routes

I'd primarily use **Next.js Server Actions** for internal application operations.

Examples:

```text
createOrder()
cancelOrder()
confirmOrder()
updateProduct()
redeemVoucher()
createGroup()
joinGroup()
addToGroupCart()
```

Use API routes when you need an HTTP endpoint for:

* External integrations
* Webhooks
* Public tracking
* Third-party services
* Future mobile application

So:

```text
Normal application operation
→ Server Action

External HTTP integration
→ API Route
```

---

# 5. Authentication architecture

### Customer

```text
Customer
   ↓
"Continue with Google"
   ↓
Google OAuth
   ↓
Supabase Auth
   ↓
User created/found
   ↓
Customer profile
```

No passwords.

No email/password authentication.

No Facebook login.

No phone OTP initially.

---

# 6. Staff authentication

Admin, Moderator and Agent also use:

**Google OAuth.**

But authentication ≠ authorization.

After Google authentication:

```text
Google
 ↓
Supabase Auth
 ↓
auth.users
 ↓
profiles
 ↓
role
 ↓
permissions
```

For example:

```text
user
email: agent@...
role: order_agent
```

The application then determines what that account can access.

---

# 7. Staff access should be controlled server-side

Don't do:

```text
if (user.role === "admin") {
    showAdminPage()
}
```

and consider that security.

That's only UI control.

You need:

```text
Request
 ↓
Authenticate
 ↓
Identify user
 ↓
Check role/permission
 ↓
RLS / server authorization
 ↓
Allow / deny
```

The frontend hiding a button is **UX**.

Supabase RLS preventing the operation is **security**.

---

# 8. Public/guest architecture

Guests don't need Supabase Auth.

They can:

```text
Browse
 ↓
Product
 ↓
Cart
 ↓
Checkout
 ↓
COD
```

The cart can initially live in:

**Browser/local storage**

and then be submitted to the server during checkout.

The server validates everything again.

---

# 9. Customer session

After Google login:

```text
Supabase Auth Session
        ↓
Customer Profile
        ↓
Customer Features
```

The customer can access:

* Orders
* Coins
* Vouchers
* Groups
* Group carts
* Profile

But RLS ensures they only access their own private information.

---

# 10. Database access model

I'd use two Supabase clients conceptually:

### Browser client

For safe operations such as:

```text
Read public products
Read categories
Read reviews
```

### Server client

For privileged operations:

```text
Create order
Confirm order
Cancel order
Reward coins
Modify inventory
Manage staff
```

And importantly, the **Supabase service-role key must never reach the browser**.

---

# 11. Business logic location

This is particularly important for your special features.

### 🪙 Coins

Don't do:

```text
Frontend:
coins += 2000
```

Instead:

```text
Completed order
      ↓
Server-side reward logic
      ↓
Coin transaction
      ↓
Balance
```

### 👥 Group cart

Don't trust:

```text
Frontend:
total = 500
```

Instead:

```text
Group cart
 ↓
Server
 ↓
Read actual product prices
 ↓
Calculate total
 ↓
Calculate delivery
 ↓
Create order
```

### 📦 Inventory

```text
Order
 ↓
Server
 ↓
Check stock
 ↓
Reserve/decrease stock
```

This protects you from manipulated requests.

---

# 12. Storage architecture

Product images go into Supabase Storage.

I'd separate buckets logically:

```text
storage/
├── product-images
├── category-images
├── banners
└── avatars
```

Public product images can be publicly readable.

Staff-only assets should use protected buckets/policies.

---

# 13. Where Edge Functions fit

Don't use Edge Functions for everything.

Use them when you need isolated server-side processing, such as:

* Scheduled reward processing
* Complex background operations
* Notifications
* Future courier integrations
* External API calls
* Webhooks

For normal CRUD:

**Next.js Server Actions + Supabase** is enough.

---

# 14. Overall architecture

So I'd settle on this:

```text
                         ┌──────────────┐
                         │   Customer   │
                         └──────┬───────┘
                                │
                         Next.js Store
                                │
                         ┌──────┴───────┐
                         │              │
                    Server Actions   Supabase
                         │              │
                         └──────┬───────┘
                                │
                    ┌───────────┼───────────┐
                    │           │           │
                 Database      Auth       Storage
                    │           │
                    │      Google OAuth
                    │
            ┌───────┴────────┐
            │                │
       Customer Data     Business Data
            │                │
       Orders/Groups    Products/Inventory
       Rewards/etc.     Delivery/etc.


                  MANAGEMENT
                      │
       ┌──────────────┼──────────────┐
       │              │              │
     Admin        Moderator        Agent
       │              │              │
       └──────────────┼──────────────┘
                      ↓
              Same backend/database
                      ↓
                 RBAC + RLS
```

## Architecture decision I'd lock in

**Next.js + TypeScript + Tailwind + Supabase**

* **Next.js:** frontend + server-side application layer
* **TypeScript:** entire application
* **Supabase PostgreSQL:** database
* **Supabase Auth:** Google OAuth
* **Supabase Storage:** images/files
* **RLS:** database-level access control
* **Server Actions:** primary application mutations
* **API routes:** external/public HTTP endpoints where needed
* **Edge Functions:** only for operations that actually benefit from them
* **No separate backend server initially**
* **No customer password authentication**
* **No payment gateway**

This gives you a relatively small attack surface while still leaving room to scale.

**Next planning step should be #2: the complete database architecture.** That one should be designed before we start defining individual APIs or writing the UI components, because almost every feature you've described—orders, groups, coins, vouchers, inventory and roles—depends on getting the data model right.
