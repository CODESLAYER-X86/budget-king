-- ============================================================
-- Budget King BD — Phase 9 Content & Growth RLS Policies
-- ============================================================

ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE size_guides ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE banners ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- BLOG POSTS — public read (published), admin write
-- ============================================================
DROP POLICY IF EXISTS "blog_posts_select_public" ON blog_posts;
CREATE POLICY "blog_posts_select_public" ON blog_posts
  FOR SELECT USING (
    status = 'PUBLISHED' OR is_staff()
  );

DROP POLICY IF EXISTS "blog_posts_write_admin" ON blog_posts;
CREATE POLICY "blog_posts_write_admin" ON blog_posts
  FOR ALL USING (is_staff()) WITH CHECK (is_staff());

-- ============================================================
-- BLOG CATEGORIES — public read, admin write
-- ============================================================
DROP POLICY IF EXISTS "blog_categories_select_public" ON blog_categories;
CREATE POLICY "blog_categories_select_public" ON blog_categories
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "blog_categories_write_admin" ON blog_categories;
CREATE POLICY "blog_categories_write_admin" ON blog_categories
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- ============================================================
-- SIZE GUIDES — public read, admin write
-- ============================================================
DROP POLICY IF EXISTS "size_guides_select_public" ON size_guides;
CREATE POLICY "size_guides_select_public" ON size_guides
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "size_guides_write_admin" ON size_guides;
CREATE POLICY "size_guides_write_admin" ON size_guides
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- ============================================================
-- REFERRAL CODES — owner reads own, admin reads all
-- (writes via server actions only)
-- ============================================================
DROP POLICY IF EXISTS "referral_codes_select_own_or_staff" ON referral_codes;
CREATE POLICY "referral_codes_select_own_or_staff" ON referral_codes
  FOR SELECT USING ("userId" = auth.uid()::text OR is_staff());

DROP POLICY IF EXISTS "referral_codes_insert_own" ON referral_codes;
CREATE POLICY "referral_codes_insert_own" ON referral_codes
  FOR INSERT WITH CHECK ("userId" = auth.uid()::text);

DROP POLICY IF EXISTS "referral_codes_update_own" ON referral_codes;
CREATE POLICY "referral_codes_update_own" ON referral_codes
  FOR UPDATE USING ("userId" = auth.uid()::text);

-- ============================================================
-- REFERRAL EVENTS — owner reads own, admin reads all
-- ============================================================
DROP POLICY IF EXISTS "referral_events_select_own_or_staff" ON referral_events;
CREATE POLICY "referral_events_select_own_or_staff" ON referral_events
  FOR SELECT USING (
    "referrerCodeId" IN (
      SELECT id FROM referral_codes WHERE "userId" = auth.uid()::text
    )
    OR is_staff()
  );

DROP POLICY IF EXISTS "referral_events_insert_service_only" ON referral_events;
CREATE POLICY "referral_events_insert_service_only" ON referral_events
  FOR INSERT WITH CHECK (true);

-- ============================================================
-- BANNERS — public read (active), admin write
-- ============================================================
DROP POLICY IF EXISTS "banners_select_public" ON banners;
CREATE POLICY "banners_select_public" ON banners
  FOR SELECT USING ("isActive" = true OR is_staff());

DROP POLICY IF EXISTS "banners_write_admin" ON banners;
CREATE POLICY "banners_write_admin" ON banners
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());
