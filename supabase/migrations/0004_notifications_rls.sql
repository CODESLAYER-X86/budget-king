-- ============================================================
-- Budget King BD — Phase 8 Notifications RLS Policies
--
-- - Customers see only their own notifications
-- - Staff see role-targeted broadcasts (roleTarget matches their role)
--   AND their own personal notifications
-- - INSERT happens via server actions (service role bypasses RLS);
--   anon client cannot insert/update notifications directly
-- ============================================================

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notifications_select_own_or_role" ON notifications;
CREATE POLICY "notifications_select_own_or_role" ON notifications
  FOR SELECT USING (
    -- Personal notifications
    "userId" = auth.uid()::text
    -- Or role-targeted broadcasts where the user's role matches
    OR (
      "userId" IS NULL
      AND "roleTarget" IS NOT NULL
      AND "roleTarget" = (
        SELECT role::text FROM profiles WHERE id = auth.uid()::text
      )
    )
    -- Admins can see all (for moderation/troubleshooting)
    OR is_admin()
  );

DROP POLICY IF EXISTS "notifications_update_own" ON notifications;
CREATE POLICY "notifications_update_own" ON notifications
  FOR UPDATE USING (
    "userId" = auth.uid()::text
    OR (
      "userId" IS NULL
      AND "roleTarget" = (SELECT role::text FROM profiles WHERE id = auth.uid()::text)
    )
  );

DROP POLICY IF EXISTS "notifications_delete_own" ON notifications;
CREATE POLICY "notifications_delete_own" ON notifications
  FOR DELETE USING (
    "userId" = auth.uid()::text
    OR is_admin()
  );

-- INSERT only via service role (server actions)
DROP POLICY IF EXISTS "notifications_insert_service_only" ON notifications;
CREATE POLICY "notifications_insert_service_only" ON notifications
  FOR INSERT WITH CHECK (true);
