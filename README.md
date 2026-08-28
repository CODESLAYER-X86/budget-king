# 👑 Budget King BD

**Quality That Fits Your Budget** — a Bangladesh-first clothing e-commerce platform built with Next.js 16, TypeScript, Supabase, and Tailwind CSS.

Cash on Delivery only. Google login optional. Built around three differentiators:
- 🪙 **Budget Coins** — earn coins on every delivered order, redeem for vouchers (Phase 5)
- 👥 **Group Shopping** — shop together with friends, place one combined COD order (Phase 6)
- 🇧🇩 **COD-first** — no online payment gateway needed, lowest barrier for BD customers

---

## 🚀 Quick Start (Local)

```bash
# 1. Install dependencies
bun install

# 2. Copy env file and fill in your Supabase credentials
cp .env.example .env
# Edit .env with your Supabase URL, anon key, service role key, and DB password

# 3. Push the Prisma schema to Supabase
bun run db:push

# 4. Seed the database with categories, products, variants, delivery zones
bun run scripts/seed.ts

# 5. Start the dev server
bun run dev
# Open http://localhost:3000
```

---

## 🔑 Setting Up the Admin Account

There are **two ways** to create the first admin:

### Method 1: Automatic (Recommended)

1. **Set `FIRST_ADMIN_EMAIL` in your `.env` file**:
   ```
   FIRST_ADMIN_EMAIL="your-email@gmail.com"
   ```
2. **Sign up** at `/login` using Google OAuth or the dev sign-in form with that exact email
3. The app **automatically promotes you to ADMIN** on first login
4. Visit `/admin` to access the admin dashboard

This is secure because:
- Only the person with access to the `.env` file can set this
- It only works if **no admin exists yet** (one-time bootstrap)
- After the first admin is created, the env var becomes a no-op

### Method 2: Manual SQL (Fallback)

If you didn't set `FIRST_ADMIN_EMAIL` before signing up:

1. **Sign up** at `/login` (you'll be a CUSTOMER by default)
2. **Run this SQL** in the Supabase SQL Editor (Dashboard → SQL Editor):

```sql
UPDATE profiles
SET role = 'ADMIN', "isStaff" = true
WHERE email = 'your-email@gmail.com';
```

3. **Sign out** and back in to refresh your session
4. Visit `/admin` to access the admin dashboard

### Creating Staff Accounts (Agent / Moderator)

Once you're an admin, you can create other staff accounts:

1. Have the person **sign up** at `/login` with their Google account
2. **Run SQL** in the Supabase SQL Editor to set their role:

```sql
-- Make someone an AGENT
UPDATE profiles SET role = 'AGENT', "isStaff" = true
WHERE email = 'agent-email@gmail.com';

-- Make someone a MODERATOR
UPDATE profiles SET role = 'MODERATOR', "isStaff" = true
WHERE email = 'moderator-email@gmail.com';
```

3. They sign out and back in to get their new role

---

## 📦 What's Built (Milestone 1 MVP)

### Customer storefront
- ✅ Homepage with hero, featured products, categories, group/rewards promos
- ✅ Shop page with search, category filter, color filter, sort, pagination
- ✅ Product detail page with variant picker (color/size), image gallery, related products
- ✅ Cart drawer (Zustand + localStorage — works for guests)
- ✅ Checkout with guest + customer flow, COD only, delivery zone picker
- ✅ Order confirmation page with status tracker
- ✅ Guest order tracking via order number + phone
- ✅ Customer account page with order history & saved addresses

### Admin dashboard (`/admin`)
- ✅ Dashboard with KPIs (today's revenue, orders, customers, low-stock alerts)
- ✅ Product CRUD with variants, images, inventory (all in one form)
- ✅ Category management (hierarchical, with parent/child)
- ✅ Inventory overview (stock, reserved, available, low-stock filter)
- ✅ Order management with status workflow (PENDING → CONFIRMED → PROCESSING → SHIPPED → DELIVERED)
- ✅ Delivery zone management (Inside Dhaka, Outside Dhaka, etc.)
- ✅ Audit logs (every admin/agent action is recorded)

### Agent dashboard (`/agent`)
- ✅ Order queue with "Recommended Next Action" buttons
- ✅ Confirm → Process → Ship → Deliver workflow
- ✅ Customer contact info & delivery address
- ✅ Cancel order flow with reason capture

### Architecture
- ✅ **Server-authoritative pricing** — browser sends only `variantId + quantity`, server recalculates prices
- ✅ **Atomic order creation** — order + inventory reservation + status history all in one Postgres transaction
- ✅ **Idempotent coin rewards** — schema-ready for Phase 5 (unique constraint on `order_id + transaction_type`)
- ✅ **Stock reservation** — pending orders reserve stock; cancellation releases it; delivery consumes it
- ✅ **Role-based access control** — `requireRole("ADMIN")` server-side guard on all admin routes
- ✅ **Audit trail** — every status change, product edit, and inventory adjustment is logged

### Tech Stack
- **Framework:** Next.js 16 (App Router, Turbopack)
- **Language:** TypeScript 5
- **Styling:** Tailwind CSS 4 + shadcn/ui (New York style)
- **Database:** Supabase Postgres + Prisma ORM
- **Auth:** Supabase Auth (Google OAuth + dev email/password fallback)
- **Storage:** Supabase Storage (configured for product images)
- **State:** Zustand (cart) + TanStack Query (server state, ready to use)
- **Validation:** Zod
- **Icons:** Lucide React

---

## 🗂️ Project Structure

```
src/
├── app/
│   ├── (store)/              # Public storefront
│   │   ├── page.tsx          # Homepage
│   │   ├── shop/             # Shop with filters
│   │   ├── product/[slug]/   # Product detail
│   │   ├── category/[slug]/  # Category page
│   │   ├── checkout/         # COD checkout
│   │   ├── track/           # Guest order tracking
│   │   ├── order/[orderNumber]/  # Order detail
│   │   ├── login/           # Google OAuth + dev sign-in
│   │   └── info/[slug]/     # About, Shipping, Returns
│   │
│   ├── (customer)/
│   │   └── account/         # My Budget King dashboard
│   │
│   ├── admin/               # Admin dashboard
│   │   ├── page.tsx         # Dashboard
│   │   ├── products/        # Product CRUD
│   │   ├── categories/      # Category management
│   │   ├── inventory/       # Stock overview
│   │   ├── orders/          # Order management
│   │   ├── delivery-zones/  # Zone configuration
│   │   ├── audit-logs/      # Action history
│   │   └── settings/        # Store settings
│   │
│   ├── agent/               # Agent dashboard
│   │   ├── page.tsx         # Pending order queue
│   │   └── orders/          # Order processing
│   │
│   ├── auth/                # OAuth callback + signout
│   └── api/                 # API routes (order cancel, etc.)
│
├── actions/                 # Server Actions
│   ├── orders.ts            # placeOrder (atomic transaction)
│   ├── orders-status.ts     # updateOrderStatus (state machine)
│   ├── products.ts          # saveProduct, deleteProduct
│   ├── categories.ts        # category CRUD
│   └── delivery-zones.ts    # delivery zone CRUD
│
├── lib/
│   ├── supabase/            # browser / server / service clients
│   ├── auth/session.ts      # getSession, requireRole
│   ├── db.ts                # Prisma client
│   ├── cart-store.ts        # Zustand cart
│   └── utils/currency.ts    # formatTk → "tk 699"
│
├── components/
│   ├── ui/                  # shadcn/ui components
│   ├── store/               # navbar, footer, cart drawer, product card
│   ├── management/          # admin sidebar, topbar, order actions
│   └── shared/              # cross-cutting components
│
├── types/cart.ts            # CartLine, CheckoutInput, CheckoutResult
│
└── proxy.ts                 # Next.js 16 middleware (session refresh)
```

---

## 🗄️ Database Schema

The full schema is in `prisma/schema.prisma`. Key entities:

| Table | Purpose |
|---|---|
| `profiles` | User accounts with role (CUSTOMER/AGENT/MODERATOR/ADMIN) |
| `categories` | Hierarchical product categories (parent/child) |
| `products` | Base products (status: DRAFT/ACTIVE/OUT_OF_STOCK/ARCHIVED) |
| `product_variants` | Specific sellable variant (color + size + SKU + price) |
| `product_images` | Multiple images per product, with variant-specific images |
| `inventory` | Per-variant stock with reserved count |
| `inventory_movements` | Audit trail of every stock change |
| `cart_items` | Logged-in customer cart (guests use localStorage) |
| `delivery_zones` | Dhaka/Outside Dhaka/etc. with charge + estimated days |
| `orders` | Order with status, COD payment, address snapshot |
| `order_items` | Snapshot of product info at order time |
| `order_status_history` | Full status transition log |
| `reviews` | Verified-purchase-only reviews (Phase 4+) |
| `homepage_sections` | CMS-style configurable homepage |
| `audit_logs` | Every staff action (who/what/when) |

---

## 🚢 Deploy to Vercel (via GitHub)

1. **Push to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Budget King BD MVP"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/budget-king-bd.git
   git push -u origin main
   ```

2. **Import to Vercel:**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Import your GitHub repo
   - Framework preset: **Next.js** (auto-detected)
   - Root directory: `/` (default)
   - Build command: `next build` (auto-detected)
   - Install command: `bun install` or `npm install`

3. **Set environment variables** in Vercel (Project Settings → Environment Variables):
   ```
   DATABASE_URL=postgresql://postgres.[REF]:[PASS]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1
   DIRECT_URL=postgresql://postgres.[REF]:[PASS]@aws-0-[REGION].pooler.supabase.com:5432/postgres
   NEXT_PUBLIC_SUPABASE_URL=https://[REF].supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=[YOUR-ANON-KEY]
   SUPABASE_SERVICE_ROLE_KEY=[YOUR-SERVICE-ROLE-KEY]
   NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
   NODE_ENV=production
   ```

4. **Configure Google OAuth** (production):
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create OAuth 2.0 Client ID (Web application)
   - Add `https://your-domain.vercel.app/auth/callback` to Authorized redirect URIs
   - In Supabase Dashboard → Authentication → Providers → Google:
     - Enable Google
     - Paste Client ID and Client Secret
   - In Supabase Dashboard → Authentication → URL Configuration:
     - Set Site URL to `https://your-domain.vercel.app`
     - Add redirect URLs: `https://your-domain.vercel.app/auth/callback`

5. **Deploy** — Vercel will build and deploy automatically on every push to `main`.

---

## 🛣️ Roadmap (Future Phases)

| Phase | Status | Description |
|---|---|---|
| Phase 0 — Foundation | ✅ Done | Next.js + TypeScript + Supabase + Prisma + auth + env |
| Phase 1 — Core Store | ✅ Done | Customer storefront + cart + COD checkout + admin + agent |
| Phase 2 — Delivery & Ops | ✅ Done | Order workflow, agent dashboard, stock reservation/release |
| Phase 3 — Security | 🟡 Partial | Role guards + audit logs done; RLS policies + rate limiting TODO |
| Phase 4 — SEO | ⏳ TODO | Sitemap, JSON-LD, Open Graph, structured data |
| Phase 5 — Rewards | ⏳ TODO | Coin ledger, voucher generation, redemption, reversal |
| Phase 6 — Groups | ⏳ TODO | Group creation, voting, group cart, combined COD checkout |
| Phase 7 — Analytics | ⏳ TODO | Sales dashboards, top products, customer LTV |
| Phase 8 — Notifications | ⏳ TODO | Email + in-app for order status, rewards, group events |
| Phase 9 — Content | ⏳ TODO | Blog, buying guides, size guides, referral system |

---

## 📝 Key Design Decisions

1. **COD only** — no payment gateway. Reduces complexity, fits BD market.
2. **Google-only auth** — no passwords. Customers can shop as guests; login unlocks rewards/groups/history.
3. **Server-authoritative pricing** — the browser NEVER tells the server the price. Only `variantId + quantity`. Server re-reads live prices and validates stock.
4. **Atomic order creation** — order + stock reservation + status history are all in one Postgres transaction. If anything fails, the entire operation rolls back.
5. **Ledger-based coins (Phase 5)** — no `UPDATE profiles SET coins = X`. Every coin movement is a row in `coin_transactions`. Idempotency key prevents duplicate rewards.
6. **Role-based access control** — `requireRole("ADMIN")` server-side guard on every staff route. Frontend hiding is UX, not security.
7. **Generic product system** — dynamic attributes per category. Adding pants/shoes/bags later = zero schema changes.

---

## 📜 Available Scripts

```bash
bun run dev          # Start dev server (port 3000)
bun run build        # Production build
bun run lint         # Run ESLint
bun run db:push      # Push schema to Supabase (destructive — accepts data loss)
bun run db:generate  # Regenerate Prisma client
bun run db:migrate    # Run migrations (creates migration files)
bun run db:reset     # Reset database (WARNING: deletes all data)
bun run scripts/seed.ts  # Seed sample data
```

---

## 📞 Support

- Email: support@budgetkingbd.com
- Hours: 10am–8pm (Sat–Thu)
- Returns: 7-day exchange, 48-hour damage report

---

© 2026 Budget King BD. All rights reserved.
