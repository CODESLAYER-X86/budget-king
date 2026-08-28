-- ============================================================
-- Budget King BD — Row Level Security (RLS) Policies
-- Phase 3: Security hardening
--
-- IMPORTANT: Prisma does NOT auto-convert column names to
-- snake_case. The actual DB columns are camelCase (e.g.
-- "userId", "isSuspended", "isActive"). This migration uses
-- those exact names.
--
-- Principle: "Never trust the browser." Even if someone bypasses
-- the Next.js UI and sends a malicious request directly to Supabase,
-- these policies enforce they can only access their own data.
-- ============================================================

-- Enable RLS on every application table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE attributes ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_attribute_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE homepage_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE homepage_section_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper: is_staff (matches against profile.role)
CREATE OR REPLACE FUNCTION is_staff()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()::text
      AND role IN ('ADMIN', 'AGENT', 'MODERATOR')
      AND "isSuspended" = FALSE
  );
$$;

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()::text
      AND role = 'ADMIN'
      AND "isSuspended" = FALSE
  );
$$;

-- ============================================================
-- PROFILES
-- ============================================================
DROP POLICY IF EXISTS "profiles_select_own_or_staff" ON profiles;
CREATE POLICY "profiles_select_own_or_staff" ON profiles
  FOR SELECT USING (
    id = auth.uid()::text OR is_staff()
  );

DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (
    id = auth.uid()::text AND role = 'CUSTOMER'
  );

DROP POLICY IF EXISTS "profiles_update_admin_only_role" ON profiles;
CREATE POLICY "profiles_update_admin_only_role" ON profiles
  FOR UPDATE USING (is_admin());

DROP POLICY IF EXISTS "profiles_insert_admin_only" ON profiles;
CREATE POLICY "profiles_insert_admin_only" ON profiles
  FOR INSERT WITH CHECK (is_admin());

-- ============================================================
-- ADDRESSES
-- ============================================================
DROP POLICY IF EXISTS "addresses_select_own_or_staff" ON addresses;
CREATE POLICY "addresses_select_own_or_staff" ON addresses
  FOR SELECT USING ("userId" = auth.uid()::text OR is_staff());

DROP POLICY IF EXISTS "addresses_insert_own" ON addresses;
CREATE POLICY "addresses_insert_own" ON addresses
  FOR INSERT WITH CHECK ("userId" = auth.uid()::text);

DROP POLICY IF EXISTS "addresses_update_own" ON addresses;
CREATE POLICY "addresses_update_own" ON addresses
  FOR UPDATE USING ("userId" = auth.uid()::text);

DROP POLICY IF EXISTS "addresses_delete_own" ON addresses;
CREATE POLICY "addresses_delete_own" ON addresses
  FOR DELETE USING ("userId" = auth.uid()::text);

-- ============================================================
-- CATEGORIES — public read (active only), admin write
-- ============================================================
DROP POLICY IF EXISTS "categories_select_public" ON categories;
CREATE POLICY "categories_select_public" ON categories
  FOR SELECT USING ("isActive" = true OR is_staff());

DROP POLICY IF EXISTS "categories_write_admin" ON categories;
CREATE POLICY "categories_write_admin" ON categories
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- ============================================================
-- PRODUCTS
-- ============================================================
DROP POLICY IF EXISTS "products_select_public" ON products;
CREATE POLICY "products_select_public" ON products
  FOR SELECT USING (status = 'ACTIVE' OR is_staff());

DROP POLICY IF EXISTS "products_write_admin" ON products;
CREATE POLICY "products_write_admin" ON products
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- ============================================================
-- PRODUCT VARIANTS
-- ============================================================
DROP POLICY IF EXISTS "variants_select_public" ON product_variants;
CREATE POLICY "variants_select_public" ON product_variants
  FOR SELECT USING (status = 'ACTIVE' OR is_staff());

DROP POLICY IF EXISTS "variants_write_admin" ON product_variants;
CREATE POLICY "variants_write_admin" ON product_variants
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- ============================================================
-- PRODUCT IMAGES, ATTRIBUTES, ATTRIBUTE VALUES
-- ============================================================
DROP POLICY IF EXISTS "product_images_select_public" ON product_images;
CREATE POLICY "product_images_select_public" ON product_images
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "product_images_write_admin" ON product_images;
CREATE POLICY "product_images_write_admin" ON product_images
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "attributes_select_public" ON attributes;
CREATE POLICY "attributes_select_public" ON attributes
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "attributes_write_admin" ON attributes;
CREATE POLICY "attributes_write_admin" ON attributes
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "product_attribute_values_select_public" ON product_attribute_values;
CREATE POLICY "product_attribute_values_select_public" ON product_attribute_values
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "product_attribute_values_write_admin" ON product_attribute_values;
CREATE POLICY "product_attribute_values_write_admin" ON product_attribute_values
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- ============================================================
-- INVENTORY — public read for stock status; staff write
-- ============================================================
DROP POLICY IF EXISTS "inventory_select_public" ON inventory;
CREATE POLICY "inventory_select_public" ON inventory
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "inventory_write_staff" ON inventory;
CREATE POLICY "inventory_write_staff" ON inventory
  FOR ALL USING (is_staff()) WITH CHECK (is_staff());

DROP POLICY IF EXISTS "inventory_movements_select_staff" ON inventory_movements;
CREATE POLICY "inventory_movements_select_staff" ON inventory_movements
  FOR SELECT USING (is_staff());

DROP POLICY IF EXISTS "inventory_movements_write_staff" ON inventory_movements;
CREATE POLICY "inventory_movements_write_staff" ON inventory_movements
  FOR INSERT WITH CHECK (is_staff());

-- ============================================================
-- CART ITEMS — customer manages only their own
-- ============================================================
DROP POLICY IF EXISTS "cart_select_own" ON cart_items;
CREATE POLICY "cart_select_own" ON cart_items
  FOR SELECT USING ("userId" = auth.uid()::text);

DROP POLICY IF EXISTS "cart_insert_own" ON cart_items;
CREATE POLICY "cart_insert_own" ON cart_items
  FOR INSERT WITH CHECK ("userId" = auth.uid()::text);

DROP POLICY IF EXISTS "cart_update_own" ON cart_items;
CREATE POLICY "cart_update_own" ON cart_items
  FOR UPDATE USING ("userId" = auth.uid()::text);

DROP POLICY IF EXISTS "cart_delete_own" ON cart_items;
CREATE POLICY "cart_delete_own" ON cart_items
  FOR DELETE USING ("userId" = auth.uid()::text);

-- ============================================================
-- DELIVERY ZONES — public read, admin write
-- ============================================================
DROP POLICY IF EXISTS "delivery_zones_select_public" ON delivery_zones;
CREATE POLICY "delivery_zones_select_public" ON delivery_zones
  FOR SELECT USING ("isActive" = true OR is_staff());

DROP POLICY IF EXISTS "delivery_zones_write_admin" ON delivery_zones;
CREATE POLICY "delivery_zones_write_admin" ON delivery_zones
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- ============================================================
-- ORDERS — CRITICAL security boundary
-- - Customers can SELECT only their own orders
-- - Guest orders (userId IS NULL) are NEVER directly queryable
--   via the anon key. Tracking uses the server action with the
--   service-role key (which bypasses RLS).
-- - Staff can SELECT/UPDATE all orders for fulfillment
-- ============================================================
DROP POLICY IF EXISTS "orders_select_own_or_staff" ON orders;
CREATE POLICY "orders_select_own_or_staff" ON orders
  FOR SELECT USING (
    "userId" = auth.uid()::text OR is_staff()
  );

DROP POLICY IF EXISTS "orders_insert_own_or_service" ON orders;
CREATE POLICY "orders_insert_own_or_service" ON orders
  FOR INSERT WITH CHECK (
    "userId" = auth.uid()::text OR "userId" IS NULL
  );

DROP POLICY IF EXISTS "orders_update_staff" ON orders;
CREATE POLICY "orders_update_staff" ON orders
  FOR UPDATE USING (is_staff());

-- ============================================================
-- ORDER ITEMS
-- ============================================================
DROP POLICY IF EXISTS "order_items_select_own_or_staff" ON order_items;
CREATE POLICY "order_items_select_own_or_staff" ON order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items."orderId"
        AND (orders."userId" = auth.uid()::text OR is_staff())
    )
  );

DROP POLICY IF EXISTS "order_items_insert_staff_only" ON order_items;
CREATE POLICY "order_items_insert_staff_only" ON order_items
  FOR INSERT WITH CHECK (is_staff());

-- ============================================================
-- ORDER STATUS HISTORY
-- ============================================================
DROP POLICY IF EXISTS "order_status_history_select_own_or_staff" ON order_status_history;
CREATE POLICY "order_status_history_select_own_or_staff" ON order_status_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_status_history."orderId"
        AND (orders."userId" = auth.uid()::text OR is_staff())
    )
  );

DROP POLICY IF EXISTS "order_status_history_insert_staff" ON order_status_history;
CREATE POLICY "order_status_history_insert_staff" ON order_status_history
  FOR INSERT WITH CHECK (is_staff());

-- ============================================================
-- REVIEWS
-- ============================================================
DROP POLICY IF EXISTS "reviews_select_approved_or_own_or_staff" ON reviews;
CREATE POLICY "reviews_select_approved_or_own_or_staff" ON reviews
  FOR SELECT USING (
    status = 'APPROVED'
    OR "userId" = auth.uid()::text
    OR is_staff()
  );

DROP POLICY IF EXISTS "reviews_insert_own" ON reviews;
CREATE POLICY "reviews_insert_own" ON reviews
  FOR INSERT WITH CHECK ("userId" = auth.uid()::text);

DROP POLICY IF EXISTS "reviews_update_own" ON reviews;
CREATE POLICY "reviews_update_own" ON reviews
  FOR UPDATE USING ("userId" = auth.uid()::text);

DROP POLICY IF EXISTS "reviews_update_staff" ON reviews;
CREATE POLICY "reviews_update_staff" ON reviews
  FOR UPDATE USING (is_staff());

DROP POLICY IF EXISTS "reviews_delete_admin" ON reviews;
CREATE POLICY "reviews_delete_admin" ON reviews
  FOR DELETE USING (is_admin());

-- ============================================================
-- HOMEPAGE SECTIONS
-- ============================================================
DROP POLICY IF EXISTS "homepage_sections_select_public" ON homepage_sections;
CREATE POLICY "homepage_sections_select_public" ON homepage_sections
  FOR SELECT USING ("isActive" = true OR is_staff());

DROP POLICY IF EXISTS "homepage_sections_write_admin" ON homepage_sections;
CREATE POLICY "homepage_sections_write_admin" ON homepage_sections
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "homepage_section_products_select_public" ON homepage_section_products;
CREATE POLICY "homepage_section_products_select_public" ON homepage_section_products
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "homepage_section_products_write_admin" ON homepage_section_products;
CREATE POLICY "homepage_section_products_write_admin" ON homepage_section_products
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- ============================================================
-- AUDIT LOGS — admin read; server actions (any auth) write
-- ============================================================
DROP POLICY IF EXISTS "audit_logs_select_admin" ON audit_logs;
CREATE POLICY "audit_logs_select_admin" ON audit_logs
  FOR SELECT USING (is_admin());

DROP POLICY IF EXISTS "audit_logs_insert_service_only" ON audit_logs;
CREATE POLICY "audit_logs_insert_service_only" ON audit_logs
  FOR INSERT WITH CHECK (true);

-- ============================================================
-- AUTO-CREATE PROFILE ON SIGNUP (handle_new_user trigger)
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO profiles (id, email, "fullName", "avatarUrl", role, "isStaff", "isSuspended")
  VALUES (
    NEW.id::text,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url',
    'CUSTOMER',
    FALSE,
    FALSE
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- STORAGE BUCKETS — public read for media; staff write
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('product-images', 'product-images', true),
  ('category-images', 'category-images', true),
  ('banners', 'banners', true),
  ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "media_public_read" ON storage.objects;
CREATE POLICY "media_public_read" ON storage.objects
  FOR SELECT USING (
    bucket_id IN ('product-images', 'category-images', 'banners', 'avatars')
  );

DROP POLICY IF EXISTS "media_staff_write" ON storage.objects;
CREATE POLICY "media_staff_write" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id IN ('product-images', 'category-images', 'banners') AND is_staff()
  );

DROP POLICY IF EXISTS "media_staff_update" ON storage.objects;
CREATE POLICY "media_staff_update" ON storage.objects
  FOR UPDATE USING (
    bucket_id IN ('product-images', 'category-images', 'banners') AND is_staff()
  );

DROP POLICY IF EXISTS "media_staff_delete" ON storage.objects;
CREATE POLICY "media_staff_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id IN ('product-images', 'category-images', 'banners') AND is_staff()
  );

DROP POLICY IF EXISTS "avatars_owner_write" ON storage.objects;
CREATE POLICY "avatars_owner_write" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "avatars_owner_update" ON storage.objects;
CREATE POLICY "avatars_owner_update" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "avatars_owner_delete" ON storage.objects;
CREATE POLICY "avatars_owner_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- ============================================================
-- DONE
-- ============================================================
