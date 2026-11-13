-- ============================================================================
-- STAGE 1: Secure learner data authority
-- ----------------------------------------------------------------------------
-- Goal:
--   * A learner can read only their own learner_accounts row.
--   * The browser cannot INSERT/UPDATE/DELETE learner_accounts directly.
--   * The browser cannot INSERT/UPDATE/DELETE learner_daily_activity directly.
--   * system_config writes require an administrator (service_role still
--     bypasses RLS for the admin backend).
--
-- The learner/admin backends use the service_role key, which bypasses RLS.
-- All authoritative progress writes therefore remain server-side.
--
-- This migration supersedes the owner-write policies from:
--   20261024120000_restrict_learner_accounts_rls.sql
-- and closes the permissive policies from:
--   20261012000006_add_admin_console_and_realtime.sql
--   20261023000001_add_learner_daily_activity.sql
--
-- Rollback (development only; restores the previous, less secure policies):
--   DROP POLICY IF EXISTS "Learner accounts readable by owner or admin" ON public.learner_accounts;
--   CREATE POLICY "Learner accounts readable by console"
--     ON public.learner_accounts FOR SELECT TO anon, authenticated USING (true);
--   CREATE POLICY "Learner accounts upsertable by backend"
--     ON public.learner_accounts FOR INSERT TO anon, authenticated WITH CHECK (true);
--   CREATE POLICY "Learner accounts updatable by backend"
--     ON public.learner_accounts FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
--   GRANT INSERT, UPDATE, DELETE ON public.learner_accounts TO anon, authenticated;
--
--   ALTER TABLE public.learner_daily_activity NO FORCE ROW LEVEL SECURITY;
--   CREATE POLICY "learner_daily_activity_insert_own"
--     ON public.learner_daily_activity FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
--   CREATE POLICY "learner_daily_activity_update_own"
--     ON public.learner_daily_activity FOR UPDATE TO authenticated
--     USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
--   GRANT INSERT, UPDATE, DELETE ON public.learner_daily_activity TO authenticated;
--
--   DROP POLICY IF EXISTS "System config updatable by admins" ON public.system_config;
--   CREATE POLICY "System config updatable by console"
--     ON public.system_config FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
--   GRANT UPDATE ON public.system_config TO anon, authenticated;
--
--   DROP POLICY IF EXISTS "Audit logs readable by admins" ON public.audit_logs;
--   CREATE POLICY "Audit logs readable by console"
--     ON public.audit_logs FOR SELECT TO anon, authenticated USING (true);
--   CREATE POLICY "Audit logs insertable by console"
--     ON public.audit_logs FOR INSERT TO anon, authenticated WITH CHECK (true);
--   CREATE POLICY "Audit logs deletable by console"
--     ON public.audit_logs FOR DELETE TO anon, authenticated USING (true);
--   GRANT INSERT, DELETE, SELECT ON public.audit_logs TO anon, authenticated;
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. learner_accounts: read-only for the owner (and admins), writes only via
--    the service_role server path.
-- ----------------------------------------------------------------------------
ALTER TABLE public.learner_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learner_accounts FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Learner accounts readable by console" ON public.learner_accounts;
DROP POLICY IF EXISTS "Learner accounts upsertable by backend" ON public.learner_accounts;
DROP POLICY IF EXISTS "Learner accounts updatable by backend" ON public.learner_accounts;
DROP POLICY IF EXISTS "Learner accounts readable by owner" ON public.learner_accounts;
DROP POLICY IF EXISTS "Learner accounts insertable by owner" ON public.learner_accounts;
DROP POLICY IF EXISTS "Learner accounts updatable by owner" ON public.learner_accounts;
DROP POLICY IF EXISTS "Learner accounts readable by owner or admin" ON public.learner_accounts;

-- `learner_accounts.id` is TEXT; auth.uid() is UUID.
CREATE POLICY "Learner accounts readable by owner or admin"
  ON public.learner_accounts
  FOR SELECT
  TO authenticated
  USING (
    id = auth.uid()::text
    OR coalesce(public.is_admin(), false)
  );

-- Remove direct browser write grants as defense in depth. The service_role
-- key used by server.ts/admin-server.ts is unaffected.
REVOKE INSERT, UPDATE, DELETE ON public.learner_accounts FROM anon, authenticated;
GRANT SELECT ON public.learner_accounts TO authenticated;

-- ----------------------------------------------------------------------------
-- 2. learner_daily_activity: read-only for the owner. The service_role RPC
--    learner_add_activity remains the only write path.
--
--    ENABLE (not FORCE) keeps the trusted SECURITY DEFINER RPC working while
--    still denying anon/authenticated writes. The service_role backend bypasses
--    RLS explicitly.
-- ----------------------------------------------------------------------------
ALTER TABLE public.learner_daily_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learner_daily_activity NO FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "learner_daily_activity_insert_own" ON public.learner_daily_activity;
DROP POLICY IF EXISTS "learner_daily_activity_update_own" ON public.learner_daily_activity;
DROP POLICY IF EXISTS "learner_daily_activity_select_own" ON public.learner_daily_activity;

CREATE POLICY "learner_daily_activity_select_own"
  ON public.learner_daily_activity
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

REVOKE INSERT, UPDATE, DELETE ON public.learner_daily_activity FROM anon, authenticated;
GRANT SELECT ON public.learner_daily_activity TO authenticated;

-- ----------------------------------------------------------------------------
-- 3. system_config: reads remain available, but only admins may update it.
--    The Admin backend writes through the service_role key.
-- ----------------------------------------------------------------------------
ALTER TABLE public.system_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_config FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "System config updatable by console" ON public.system_config;
DROP POLICY IF EXISTS "System config updatable by admins" ON public.system_config;

CREATE POLICY "System config updatable by admins"
  ON public.system_config
  FOR UPDATE
  TO authenticated
  USING (coalesce(public.is_admin(), false))
  WITH CHECK (coalesce(public.is_admin(), false));

REVOKE INSERT, DELETE ON public.system_config FROM anon, authenticated;
REVOKE UPDATE ON public.system_config FROM anon;

-- ----------------------------------------------------------------------------
-- 4. audit_logs: immutable to browsers; readable by authenticated admins only.
--    The learner/admin backends append through service_role.
-- ----------------------------------------------------------------------------
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Audit logs readable by console" ON public.audit_logs;
DROP POLICY IF EXISTS "Audit logs insertable by console" ON public.audit_logs;
DROP POLICY IF EXISTS "Audit logs deletable by console" ON public.audit_logs;
DROP POLICY IF EXISTS "Audit logs readable by admins" ON public.audit_logs;
-- Legacy catch-all from 20260827073100_new-migration.sql.
DROP POLICY IF EXISTS "Admins can manage all logs" ON public.audit_logs;

CREATE POLICY "Audit logs readable by admins"
  ON public.audit_logs
  FOR SELECT
  TO authenticated
  USING (coalesce(public.is_admin(), false));

REVOKE INSERT, UPDATE, DELETE ON public.audit_logs FROM anon, authenticated;
REVOKE SELECT ON public.audit_logs FROM anon;
GRANT SELECT ON public.audit_logs TO authenticated;

-- ----------------------------------------------------------------------------
-- Verification queries (run manually after applying):
--   SELECT tablename, policyname, cmd, roles, qual, with_check
--   FROM pg_policies
--   WHERE schemaname = 'public'
--     AND tablename IN ('learner_accounts', 'learner_daily_activity', 'system_config', 'audit_logs')
--   ORDER BY tablename, policyname;
--
--   -- As anon: must return zero rows
--   SELECT count(*) FROM public.learner_accounts;
--
--   -- As learner A: must only see A's row and cannot update it
--   SELECT * FROM public.learner_accounts;
--   UPDATE public.learner_accounts SET xp = 999999 WHERE id = auth.uid()::text;
--
--   -- As learner A: direct activity writes must fail
--   INSERT INTO public.learner_daily_activity (user_id, activity_date, minutes)
--   VALUES (auth.uid(), current_date, 600);
-- ----------------------------------------------------------------------------
