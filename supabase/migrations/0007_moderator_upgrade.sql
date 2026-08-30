-- ============================================================
-- Budget King BD — Moderator Upgrade RLS
-- Gives Moderator same write access as Admin for store operations
-- ============================================================

-- Update is_staff() to already includes MODERATOR (it does — checked)
-- Just need to update the policies that check is_admin() to also check is_staff()

-- Products
DROP POLICY IF EXISTS "products_write_admin" ON products;
CREATE POLICY "products_write_staff" ON products
  FOR ALL USING (is_staff()) WITH CHECK (is_staff());

-- Product Variants
DROP POLICY IF EXISTS "variants_write_admin" ON product_variants;
CREATE POLICY "variants_write_staff" ON product_variants
  FOR ALL USING (is_staff()) WITH CHECK (is_staff());

-- Product Images
DROP POLICY IF EXISTS "product_images_write_admin" ON product_images;
CREATE POLICY "product_images_write_staff" ON product_images
  FOR ALL USING (is_staff()) WITH CHECK (is_staff());

-- Categories
DROP POLICY IF EXISTS "categories_write_admin" ON categories;
CREATE POLICY "categories_write_staff" ON categories
  FOR ALL USING (is_staff()) WITH CHECK (is_staff());

-- Attributes
DROP POLICY IF EXISTS "attributes_write_admin" ON attributes;
CREATE POLICY "attributes_write_staff" ON attributes
  FOR ALL USING (is_staff()) WITH CHECK (is_staff());

DROP POLICY IF EXISTS "product_attribute_values_write_admin" ON product_attribute_values;
CREATE POLICY "product_attribute_values_write_staff" ON product_attribute_values
  FOR ALL USING (is_staff()) WITH CHECK (is_staff());

-- Inventory
DROP POLICY IF EXISTS "inventory_write_staff" ON inventory;
CREATE POLICY "inventory_write_staff_v2" ON inventory
  FOR ALL USING (is_staff()) WITH CHECK (is_staff());

-- Inventory Movements (insert already staff, add update)
DROP POLICY IF EXISTS "inventory_movements_write_staff" ON inventory_movements;
CREATE POLICY "inventory_movements_write_staff_v2" ON inventory_movements
  FOR INSERT WITH CHECK (is_staff());

-- Orders (update — allow staff to update)
DROP POLICY IF EXISTS "orders_update_staff" ON orders;
CREATE POLICY "orders_update_staff_v2" ON orders
  FOR UPDATE USING (is_staff());

-- Order Items (insert — allow staff)
DROP POLICY IF EXISTS "order_items_insert_staff_only" ON order_items;
CREATE POLICY "order_items_insert_staff_v2" ON order_items
  FOR INSERT WITH CHECK (is_staff());

-- Order Status History (insert — allow staff)
DROP POLICY IF EXISTS "order_status_history_insert_staff" ON order_status_history;
CREATE POLICY "order_status_history_insert_staff_v2" ON order_status_history
  FOR INSERT WITH CHECK (is_staff());

-- Delivery Zones
DROP POLICY IF EXISTS "delivery_zones_write_admin" ON delivery_zones;
CREATE POLICY "delivery_zones_write_staff" ON delivery_zones
  FOR ALL USING (is_staff()) WITH CHECK (is_staff());

-- Reviews (update — already allows staff; add delete for staff)
DROP POLICY IF EXISTS "reviews_delete_admin" ON reviews;
CREATE POLICY "reviews_delete_staff" ON reviews
  FOR DELETE USING (is_staff());

-- Blog Posts
DROP POLICY IF EXISTS "blog_posts_write_admin" ON blog_posts;
CREATE POLICY "blog_posts_write_staff" ON blog_posts
  FOR ALL USING (is_staff()) WITH CHECK (is_staff());

-- Blog Categories
DROP POLICY IF EXISTS "blog_categories_write_admin" ON blog_categories;
CREATE POLICY "blog_categories_write_staff" ON blog_categories
  FOR ALL USING (is_staff()) WITH CHECK (is_staff());

-- Size Guides
DROP POLICY IF EXISTS "size_guides_write_admin" ON size_guides;
CREATE POLICY "size_guides_write_staff" ON size_guides
  FOR ALL USING (is_staff()) WITH CHECK (is_staff());

-- Banners
DROP POLICY IF EXISTS "banners_write_admin" ON banners;
CREATE POLICY "banners_write_staff" ON banners
  FOR ALL USING (is_staff()) WITH CHECK (is_staff());

-- Homepage Sections
DROP POLICY IF EXISTS "homepage_sections_write_admin" ON homepage_sections;
CREATE POLICY "homepage_sections_write_staff" ON homepage_sections
  FOR ALL USING (is_staff()) WITH CHECK (is_staff());

DROP POLICY IF EXISTS "homepage_section_products_write_admin" ON homepage_section_products;
CREATE POLICY "homepage_section_products_write_staff" ON homepage_section_products
  FOR ALL USING (is_staff()) WITH CHECK (is_staff());

-- Cart Items (staff can manage — for troubleshooting)
DROP POLICY IF EXISTS "cart_update_own" ON cart_items;
CREATE POLICY "cart_update_staff_or_own" ON cart_items
  FOR UPDATE USING ("userId" = auth.uid()::text OR is_staff());

DROP POLICY IF EXISTS "cart_delete_own" ON cart_items;
CREATE POLICY "cart_delete_staff_or_own" ON cart_items
  FOR DELETE USING ("userId" = auth.uid()::text OR is_staff());
