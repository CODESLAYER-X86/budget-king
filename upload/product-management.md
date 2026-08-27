# 📸 Budget King BD — Product & Content Management

The goal is to make product management **flexible enough for shirts now and completely different product categories later**, without rebuilding the database.

Core structure:

```text
Category
   ↓
Product
   ↓
Variants
   ↓
Attributes
   ↓
Images
   ↓
Reviews
```

And separately:

```text
Homepage
   ↓
Banners / Sections / Promotions
```

---

# 1. 👕 Products

A product is the **base item**, independent of size/color.

Example:

```text
Oxford Casual Shirt
```

Product data:

```text
products
├── id
├── name
├── slug
├── description
├── category_id
├── brand
├── base_price
├── status
├── featured
├── created_at
└── updated_at
```

### Product status

```text
DRAFT
ACTIVE
OUT_OF_STOCK
ARCHIVED
```

Don't delete products that have already been purchased.

Instead:

```text
ACTIVE → ARCHIVED
```

This preserves old orders and reviews.

---

# 2. 🗂️ Categories

Start with:

```text
Shirts
```

But design the system hierarchically.

Example:

```text
Fashion
├── Shirts
│   ├── Casual Shirts
│   ├── Formal Shirts
│   └── Oversized Shirts
│
└── Future Product
```

Later you might add:

```text
Pants
T-Shirts
Accessories
Bags
```

without changing the architecture.

### Category fields

```text
categories
├── id
├── parent_id
├── name
├── slug
├── description
├── image
├── sort_order
├── is_active
└── created_at
```

`parent_id` allows nested categories.

---

# 3. 🎨 Variants

For shirts, variants are essential.

Example:

```text
Oxford Shirt

Black / M
Black / L
Black / XL

White / M
White / L
White / XL
```

Each variant should have:

```text
product_variant
├── id
├── product_id
├── sku
├── price
├── compare_at_price
├── status
└── created_at
```

Inventory connects to the variant:

```text
Variant
   ↓
Inventory
```

---

# 4. Variant options

Don't hard-code:

```text
size
color
```

into the database.

Instead support:

```text
Color
Size
Material
Pattern
```

because you don't know what products you'll sell later.

Example:

```text
Oxford Shirt

Color:
Black
White
Navy

Size:
M
L
XL
XXL
```

Later:

```text
Backpack

Color:
Black
Blue

Capacity:
20L
30L
```

Same system.

---

# 5. 🧩 Product attributes

This is different from variants.

### Variant attribute

Changes what the customer receives.

```text
Color → Black
Size → XL
```

### Product attribute

Describes the product generally.

```text
Material → Cotton
Fit → Regular
Sleeve → Full
Pattern → Solid
```

Example:

```text
PRODUCT

Material: 100% Cotton
Fit: Regular
Sleeve: Full
Pattern: Solid
```

These shouldn't necessarily create separate inventory variants.

---

# 6. Flexible attribute system

I'd use:

```text
attributes
├── id
├── name
├── type
├── category_id
└── is_filterable
```

and:

```text
product_attribute_values
├── product_id
├── attribute_id
└── value
```

Possible types:

```text
TEXT
NUMBER
BOOLEAN
SELECT
MULTI_SELECT
```

This makes your future catalog much easier to expand.

---

# 7. 🔢 SKU

Every sellable variant should have a unique SKU.

Example:

```text
OXF-BLK-M
OXF-BLK-L
OXF-BLK-XL
```

Don't use the product ID as the SKU.

SKU should identify the **specific sellable variant**.

---

# 8. 📸 Product images

Each product can have multiple images.

Example:

```text
Oxford Shirt

1. Front
2. Back
3. Side
4. Fabric close-up
5. Model wearing it
```

Database:

```text
product_images
├── id
├── product_id
├── variant_id
├── image_url
├── alt_text
├── sort_order
├── is_primary
└── created_at
```

---

# 9. Variant-specific images

This is useful for colors.

Example:

```text
Black variant
→ black shirt images

White variant
→ white shirt images
```

When customer selects:

> White

the gallery can automatically switch to the white product images.

This creates a much better shopping experience.

---

# 10. Image storage

Since you're using Supabase:

```text
Supabase Storage
       ↓
Product images
```

Don't store the actual image binary inside PostgreSQL.

Store:

```text
image_url/path
```

in the database.

I'd create a bucket such as:

```text
product-images
```

with appropriate storage policies.

---

# 11. Image optimization

Don't upload massive 10–20 MB photos directly to customers.

Admin upload:

```text
Original
   ↓
Optimize
   ↓
WebP/AVIF where appropriate
   ↓
CDN/storage
   ↓
Customer
```

You want the product page to load quickly, especially on mobile networks.

---

# 12. Image ordering

Admin should be able to drag:

```text
1️⃣ Front
2️⃣ Back
3️⃣ Side
4️⃣ Detail
```

and rearrange:

```text
1️⃣ Model
2️⃣ Front
3️⃣ Back
4️⃣ Detail
```

No database changes needed—just update `sort_order`.

---

# 13. 📝 Product description

I'd separate:

### Short description

Used near the product title.

```text
Premium regular-fit cotton shirt.
```

### Full description

Used lower on the product page.

Could include:

* Material
* Fit
* Care instructions
* Features
* Size information

Don't store HTML blindly from admin unless you sanitize it.

---

# 14. ⭐ Reviews

Only customers who actually purchased the product should be allowed to review it.

Recommended:

```text
DELIVERED
    ↓
Eligible for review
```

Not:

```text
Order placed
    ↓
Review ❌
```

This prevents fake reviews.

---

# 15. Review structure

```text
reviews
├── id
├── user_id
├── product_id
├── order_id
├── rating
├── title
├── content
├── status
├── is_verified_purchase
├── created_at
└── updated_at
```

---

# 16. Verified purchase

Show:

> ✓ Verified Purchase

when the review comes from a successfully delivered order containing that product.

Don't let users simply claim they're verified.

The backend determines it.

---

# 17. Review moderation

Reviews should have:

```text
PENDING
APPROVED
REJECTED
```

I'd recommend:

```text
Customer submits
       ↓
PENDING
       ↓
Moderator reviews
       ↓
APPROVED
```

For Budget King BD, **moderators are the ideal role for review moderation**.

Admin retains override power.

---

# 18. Review permissions

### Customer

Can:

* Create review for eligible purchase
* Edit own review
* Delete/withdraw own review if you choose
* Report another review

### Moderator

Can:

* Approve
* Reject
* Hide
* Review reported content

### Admin

Can:

* Everything
* Override moderation
* Permanently remove problematic content

### Agent

No review-management permissions.

---

# 19. ⭐ Rating calculation

Don't store only:

```text
product.rating = 4.7
```

as the source of truth.

Calculate from approved reviews.

Example:

```text
★★★★★  124
★★★★☆   32
★★★☆☆   10
★★☆☆☆    2
★☆☆☆☆    1
```

Then:

```text
Average rating = calculated value
```

You can cache the aggregate later for performance.

---

# 20. Review images

I'd actually include this in your architecture now.

Customers can optionally upload:

```text
📷 Customer photo
```

Example:

> "The size is perfect."

with a photo.

But this requires stronger moderation and storage controls.

So:

**Database architecture: support it.**

**V1 UI: optional.**

---

# 21. 🏠 Homepage content management

Don't hard-code the entire homepage.

You should have a basic CMS-like system.

Homepage sections:

```text
Hero
↓
Featured Products
↓
Categories
↓
Why Budget King
↓
Group Shopping
↓
Rewards
↓
Customer Reviews
↓
Footer
```

---

# 22. Hero section

Admin can configure:

```text
Hero

Title:
Quality That Fits Your Budget

Subtitle:
Affordable clothing without compromising quality.

Image:
[ uploaded image ]

Button:
Shop Shirts

Link:
 /category/shirts
```

Admin can activate/deactivate it.

---

# 23. Promotional banners

Example:

```text
🔥 GROUP SHOP & SAVE ON DELIVERY
Create a group and shop together.

[ Learn More ]
```

This is particularly important because group shopping is one of your differentiators.

---

# 24. Featured products

Admin can manually select:

```text
Featured Products

1. Oxford Shirt
2. Premium Casual Shirt
3. Classic Formal Shirt
```

Or later automatically show:

```text
Best sellers
Trending
New arrivals
```

I'd support both eventually.

---

# 25. Homepage section model

Instead of creating separate database tables for every homepage component, consider a generic section system.

```text
homepage_sections
├── id
├── section_type
├── title
├── subtitle
├── content
├── sort_order
├── is_active
├── starts_at
├── ends_at
└── created_at
```

`section_type` could be:

```text
HERO
BANNER
PRODUCT_GRID
CATEGORY_GRID
TEXT
REVIEW_GRID
GROUP_PROMOTION
REWARD_PROMOTION
```

This makes the homepage extensible.

---

# 26. Admin homepage editor

Something like:

```text
Homepage
────────────────────────

☰ Hero
  Active

☰ Featured Products
  Active

☰ Categories
  Active

☰ Group Shopping
  Active

☰ Rewards
  Active

☰ Reviews
  Active

[ + Add Section ]
```

Drag-and-drop ordering would be excellent.

---

# 27. Scheduling content

Eventually allow:

```text
Start:
Sep 1, 12:00 AM

End:
Sep 7, 11:59 PM
```

So you can schedule:

```text
Eid campaign
Flash sale
New collection
Group-shopping campaign
```

without manually changing the website at midnight.

---

# 28. Product search & filtering

This belongs closely with product management.

For shirts:

```text
Category
Price
Size
Color
Fit
Material
Rating
Availability
```

Later, when you add another category, filters should dynamically change.

Example:

```text
Shirts:
Size / Color / Fit

Shoes:
Size / Color / Material

Bags:
Capacity / Color / Material
```

This is another reason not to hard-code product attributes.

---

# 29. Product admin interface

I'd structure the admin product editor as:

```text
Create Product

① Basic Information
② Category
③ Description
④ Images
⑤ Attributes
⑥ Variants
⑦ Pricing
⑧ Inventory
⑨ SEO
⑩ Preview
```

Then:

```text
[ Save Draft ]
[ Publish ]
```

---

# 30. Product creation example

Admin enters:

```text
Name:
Oxford Casual Shirt

Category:
Shirts → Casual Shirts

Description:
Premium cotton casual shirt...

Images:
[5 images]

Attributes:
Material → Cotton
Fit → Regular
Sleeve → Full
```

Then variants:

```text
Color     Size     Price     SKU
------------------------------------
Black     M        ৳699      OXF-BLK-M
Black     L        ৳699      OXF-BLK-L
Black     XL       ৳699      OXF-BLK-XL
White     M        ৳699      OXF-WHT-M
White     L        ৳699      OXF-WHT-L
```

Inventory is then managed separately.

---

# 31. Product lifecycle

```text
DRAFT
  ↓
ACTIVE
  ↓
OUT OF STOCK
  ↓
ACTIVE
  ↓
ARCHIVED
```

Don't confuse:

**Product status**

with:

**Inventory status**

A product can be:

```text
ACTIVE
```

while one variant is:

```text
OUT OF STOCK
```

---

# 32. Recommended database structure

At a high level:

```text
categories
    │
    ↓
products
    │
    ├──────── product_images
    │
    ├──────── product_attributes
    │
    └──────── product_variants
                     │
                     ↓
                 inventory


products
    ↓
reviews
    ↓
users


homepage_sections
    ├── banners/content
    └── product/category references
```

---

# 33. Final V1 scope

### Products

* ✅ Product CRUD
* ✅ Draft/Active/Archived
* ✅ Categories
* ✅ Slugs
* ✅ Descriptions
* ✅ Pricing
* ✅ SKU

### Variants

* ✅ Size
* ✅ Color
* ✅ Dynamic variant options
* ✅ Variant-specific pricing
* ✅ Variant-specific images
* ✅ SKU per variant

### Attributes

* ✅ Dynamic attributes
* ✅ Category-specific attributes
* ✅ Filterable attributes

### Images

* ✅ Multiple images
* ✅ Primary image
* ✅ Ordering
* ✅ Variant images
* ✅ Supabase Storage
* ✅ Image optimization

### Reviews

* ✅ Verified purchase
* ✅ Rating
* ✅ Text review
* ✅ Moderation
* ✅ Review reporting
* ⏳ Customer images

### Homepage

* ✅ Hero
* ✅ Promotional banners
* ✅ Featured products
* ✅ Category sections
* ✅ Rewards promotion
* ✅ Group-shopping promotion
* ✅ Reviews
* ✅ Section ordering
* ⏳ Scheduled campaigns

---

## The key architectural decision

**Don't design Budget King BD as a "shirt shop." Design it as a general product-commerce platform where shirts happen to be the first category.**

That means:

```text
❌ Shirt → Size + Color hard-coded

✅ Product → Category → Dynamic Attributes → Variants
```

Then when you eventually decide to sell **pants, shoes, bags, accessories, or something completely different**, the same product system can handle them without a database redesign.
