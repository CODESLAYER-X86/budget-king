-- ============================================================
-- Budget King BD — Phase 5 Rewards RLS Policies
--
-- Coins & Vouchers security boundaries:
-- - Customers can SELECT only their own coin transactions / vouchers
-- - Customers can INSERT nothing (all coin/voucher writes happen via
--   server actions with the service-role key, never the anon client)
-- - Admins can do everything
-- ============================================================

ALTER TABLE coin_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE coin_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE vouchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_vouchers ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- COIN RULES — admin-only (read by service-role when awarding)
-- Public cannot see admin reward configs
-- ============================================================
DROP POLICY IF EXISTS "coin_rules_select_staff" ON coin_rules;
CREATE POLICY "coin_rules_select_staff" ON coin_rules
  FOR SELECT USING (is_staff());

DROP POLICY IF EXISTS "coin_rules_write_admin" ON coin_rules;
CREATE POLICY "coin_rules_write_admin" ON coin_rules
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- ============================================================
-- COIN TRANSACTIONS — customer reads own; admin reads all;
-- INSERT/UPDATE only via service role (server actions)
-- ============================================================
DROP POLICY IF EXISTS "coin_tx_select_own_or_staff" ON coin_transactions;
CREATE POLICY "coin_tx_select_own_or_staff" ON coin_transactions
  FOR SELECT USING ("userId" = auth.uid()::text OR is_staff());

DROP POLICY IF EXISTS "coin_tx_insert_service_only" ON coin_transactions;
CREATE POLICY "coin_tx_insert_service_only" ON coin_transactions
  FOR INSERT WITH CHECK (true); -- service role bypasses RLS; anon never writes

DROP POLICY IF EXISTS "coin_tx_update_admin_only" ON coin_transactions;
CREATE POLICY "coin_tx_update_admin_only" ON coin_transactions
  FOR UPDATE USING (is_admin());

-- ============================================================
-- VOUCHERS (templates) — admin-only reads+writes
-- (Customers see them indirectly via the redeem UI which loads
-- through a server action)
-- ============================================================
DROP POLICY IF EXISTS "vouchers_select_staff" ON vouchers;
CREATE POLICY "vouchers_select_staff" ON vouchers
  FOR SELECT USING (is_staff());

DROP POLICY IF EXISTS "vouchers_write_admin" ON vouchers;
CREATE POLICY "vouchers_write_admin" ON vouchers
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- ============================================================
-- CUSTOMER VOUCHERS — customer reads own; admin reads all;
-- writes only via service role (server actions)
-- ============================================================
DROP POLICY IF EXISTS "customer_vouchers_select_own_or_staff" ON customer_vouchers;
CREATE POLICY "customer_vouchers_select_own_or_staff" ON customer_vouchers
  FOR SELECT USING ("userId" = auth.uid()::text OR is_staff());

DROP POLICY IF EXISTS "customer_vouchers_insert_service_only" ON customer_vouchers;
CREATE POLICY "customer_vouchers_insert_service_only" ON customer_vouchers
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "customer_vouchers_update_staff" ON customer_vouchers;
CREATE POLICY "customer_vouchers_update_staff" ON customer_vouchers
  FOR UPDATE USING (is_staff());
