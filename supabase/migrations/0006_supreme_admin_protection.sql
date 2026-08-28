-- ============================================================
-- Supreme Admin Protection (DB-level)
--
-- Even if someone gets DB access, they cannot change the
-- supreme admin's role, isSuspended, or isSupremeAdmin fields.
-- This is a DB-level trigger that runs BEFORE any UPDATE.
-- ============================================================

CREATE OR REPLACE FUNCTION protect_supreme_admin()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- If this is the supreme admin, block changes to role/isSuspended/isSupremeAdmin
  -- UNLESS the update is coming from the service role (which bypasses RLS)
  -- We detect service-role by checking if auth.uid() is NULL (service role has no auth context)
  IF OLD."isSupremeAdmin" = TRUE AND auth.uid() IS NOT NULL THEN
    -- Block if any of these fields changed
    IF NEW.role <> OLD.role THEN
      RAISE EXCEPTION 'The Supreme Admin role cannot be changed by anyone';
    END IF;
    IF NEW."isSuspended" <> OLD."isSuspended" THEN
      RAISE EXCEPTION 'The Supreme Admin cannot be suspended by anyone';
    END IF;
    IF NEW."isSupremeAdmin" <> OLD."isSupremeAdmin" THEN
      RAISE EXCEPTION 'The Supreme Admin flag cannot be changed by anyone';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_supreme_admin_trigger ON profiles;
CREATE TRIGGER protect_supreme_admin_trigger
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION protect_supreme_admin();

