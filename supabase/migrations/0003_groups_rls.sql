-- ============================================================
-- Budget King BD — Phase 6 Group Shopping RLS Policies
--
-- Membership-based access:
-- - Group rows visible to members only (or owner/admin)
-- - All child rows (members, products, votes, cart items) inherit
--   visibility from the parent group's membership
-- - Writes: owner can manage; members can add products/votes/cart items
-- - Admin can suspend groups
-- ============================================================

ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_cart_items ENABLE ROW LEVEL SECURITY;

-- Helper: is the current user a member of group X?
CREATE OR REPLACE FUNCTION is_group_member(gid TEXT)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM group_members
    WHERE "groupId" = gid
      AND "userId" = auth.uid()::text
  );
$$;

-- Helper: is the current user the owner of group X?
CREATE OR REPLACE FUNCTION is_group_owner(gid TEXT)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM groups
    WHERE id = gid
      AND "ownerId" = auth.uid()::text
  );
$$;

-- ============================================================
-- GROUPS — members can read; owner can update; admin can do all
-- ============================================================
DROP POLICY IF EXISTS "groups_select_member_or_staff" ON groups;
CREATE POLICY "groups_select_member_or_staff" ON groups
  FOR SELECT USING (
    is_group_member(id) OR is_staff()
  );

DROP POLICY IF EXISTS "groups_insert_own" ON groups;
CREATE POLICY "groups_insert_own" ON groups
  FOR INSERT WITH CHECK ("ownerId" = auth.uid()::text);

DROP POLICY IF EXISTS "groups_update_owner_or_admin" ON groups;
CREATE POLICY "groups_update_owner_or_admin" ON groups
  FOR UPDATE USING (
    "ownerId" = auth.uid()::text OR is_admin()
  );

DROP POLICY IF EXISTS "groups_delete_owner_or_admin" ON groups;
CREATE POLICY "groups_delete_owner_or_admin" ON groups
  FOR DELETE USING (
    "ownerId" = auth.uid()::text OR is_admin()
  );

-- ============================================================
-- GROUP MEMBERS — members can read; anyone can INSERT (self-join)
-- ============================================================
DROP POLICY IF EXISTS "group_members_select_member" ON group_members;
CREATE POLICY "group_members_select_member" ON group_members
  FOR SELECT USING (
    is_group_member("groupId") OR is_staff()
  );

-- A user can INSERT only their own membership row
DROP POLICY IF EXISTS "group_members_insert_own" ON group_members;
CREATE POLICY "group_members_insert_own" ON group_members
  FOR INSERT WITH CHECK ("userId" = auth.uid()::text);

-- Owner can remove members; members can remove themselves
DROP POLICY IF EXISTS "group_members_delete_owner_or_self" ON group_members;
CREATE POLICY "group_members_delete_owner_or_self" ON group_members
  FOR DELETE USING (
    "userId" = auth.uid()::text
    OR is_group_owner("groupId")
    OR is_admin()
  );

-- ============================================================
-- GROUP PRODUCTS — visible to members; insert by any member
-- ============================================================
DROP POLICY IF EXISTS "group_products_select_member" ON group_products;
CREATE POLICY "group_products_select_member" ON group_products
  FOR SELECT USING (
    is_group_member("groupId") OR is_staff()
  );

DROP POLICY IF EXISTS "group_products_insert_member" ON group_products;
CREATE POLICY "group_products_insert_member" ON group_products
  FOR INSERT WITH CHECK (
    is_group_member("groupId") AND "userId" = auth.uid()::text
  );

DROP POLICY IF EXISTS "group_products_delete_owner_or_sharer" ON group_products;
CREATE POLICY "group_products_delete_owner_or_sharer" ON group_products
  FOR DELETE USING (
    "userId" = auth.uid()::text OR is_group_owner("groupId") OR is_admin()
  );

-- ============================================================
-- GROUP VOTES — visible to members; vote by any member
-- ============================================================
DROP POLICY IF EXISTS "group_votes_select_member" ON group_votes;
CREATE POLICY "group_votes_select_member" ON group_votes
  FOR SELECT USING (
    is_group_member((SELECT "groupId" FROM group_products WHERE id = "groupProductId"))
    OR is_staff()
  );

DROP POLICY IF EXISTS "group_votes_insert_member" ON group_votes;
CREATE POLICY "group_votes_insert_member" ON group_votes
  FOR INSERT WITH CHECK (
    is_group_member((SELECT "groupId" FROM group_products WHERE id = "groupProductId"))
    AND "userId" = auth.uid()::text
  );

DROP POLICY IF EXISTS "group_votes_delete_own" ON group_votes;
CREATE POLICY "group_votes_delete_own" ON group_votes
  FOR DELETE USING ("userId" = auth.uid()::text);

-- ============================================================
-- GROUP CART ITEMS — visible to members; insert by any member
-- ============================================================
DROP POLICY IF EXISTS "group_cart_items_select_member" ON group_cart_items;
CREATE POLICY "group_cart_items_select_member" ON group_cart_items
  FOR SELECT USING (
    is_group_member("groupId") OR is_staff()
  );

DROP POLICY IF EXISTS "group_cart_items_insert_member" ON group_cart_items;
CREATE POLICY "group_cart_items_insert_member" ON group_cart_items
  FOR INSERT WITH CHECK (
    is_group_member("groupId") AND "userId" = auth.uid()::text
  );

DROP POLICY IF EXISTS "group_cart_items_update_own" ON group_cart_items;
CREATE POLICY "group_cart_items_update_own" ON group_cart_items
  FOR UPDATE USING ("userId" = auth.uid()::text);

DROP POLICY IF EXISTS "group_cart_items_delete_own_or_owner" ON group_cart_items;
CREATE POLICY "group_cart_items_delete_own_or_owner" ON group_cart_items
  FOR DELETE USING (
    "userId" = auth.uid()::text
    OR is_group_owner("groupId")
    OR is_admin()
  );

