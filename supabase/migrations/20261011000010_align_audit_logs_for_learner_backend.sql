-- ============================================================================
-- SultiAI: align public.audit_logs with the Learner backend
-- ----------------------------------------------------------------------------
-- WHY THIS MIGRATION EXISTS
--   `public.audit_logs` already exists (created by the legacy migration
--   20260827073100_new-migration.sql) with the columns:
--       id, user_id INTEGER, action TEXT NOT NULL, resource_type, resource_id,
--       details, ip_address, timestamp
--
--   The SultiAI learner backend (mobile/server/supabaseServer.ts) writes a
--   DIFFERENT shape:
--       user_id (TEXT), event_type, category, actor, actor_role, description,
--       severity, latency_ms, metadata, created_at
--
--   Because 20261012000006 uses `CREATE TABLE IF NOT EXISTS`, it is a no-op on
--   an existing audit_logs table and never adds those columns. This migration
--   is ADDITIVE and IDEMPOTENT: it keeps the legacy columns working while
--   enabling the new backend (and the admin console, which reads created_at /
--   event_type / category / severity / actor / metadata).
--
-- SAFE TO RE-RUN. Applies no destructive change.
-- Order matters: must run BEFORE 20261012000006_add_admin_console_and_realtime.sql
-- (which builds an index on audit_logs(created_at)).
-- ============================================================================

-- 1. Add the learner-backend columns (no-ops when already present).
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS event_type   TEXT;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS category     TEXT DEFAULT 'SYSTEM_CONFIG';
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS actor        TEXT DEFAULT 'system';
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS actor_role   TEXT DEFAULT 'System';
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS description  TEXT;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS severity     TEXT DEFAULT 'INFO';
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS latency_ms   INTEGER;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS metadata     JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS created_at   TIMESTAMPTZ DEFAULT timezone('utc'::text, now());

-- 2. The legacy `action` column is NOT NULL, but the learner backend does not
--    send it. Give it a default so those inserts succeed.
ALTER TABLE public.audit_logs ALTER COLUMN action SET DEFAULT '';

-- 3. The learner backend stores TEXT identifiers ('usr_genesis', auth UUIDs).
--    The legacy column was INTEGER. Widen it; existing rows are preserved.
ALTER TABLE public.audit_logs ALTER COLUMN user_id TYPE TEXT USING user_id::text;

-- 4. Keep the legacy SECURITY DEFINER helper working after the type change:
--    it selected an INTEGER user_id, which no longer matches the TEXT column.
CREATE OR REPLACE FUNCTION public.write_audit_entry(
  p_action        TEXT,
  p_resource_type TEXT,
  p_resource_id   TEXT,
  p_details       TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_auth_id UUID := auth.uid();
  v_user_id TEXT;
BEGIN
  IF v_auth_id IS NULL THEN
    RETURN;  -- service role / cron: no acting user to attribute
  END IF;

  SELECT user_id::text INTO v_user_id
    FROM public.users
   WHERE supabase_id = v_auth_id::text;

  INSERT INTO public.audit_logs (user_id, action, resource_type, resource_id, details, timestamp)
  VALUES (
    v_user_id,
    p_action,
    p_resource_type,
    p_resource_id,
    p_details,
    now()
  );
END;
$$;

-- 5. Index the column the admin console sorts/filters on.
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- ============================================================================
-- Verification:
--   SELECT column_name, data_type FROM information_schema.columns
--    WHERE table_schema = 'public' AND table_name = 'audit_logs'
--    ORDER BY ordinal_position;
-- ============================================================================
