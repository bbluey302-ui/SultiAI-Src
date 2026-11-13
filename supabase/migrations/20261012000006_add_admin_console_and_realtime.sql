-- ============================================================================
-- SultiAI Capstone Project: Supabase Migration Script 6
-- Objective: Decouple the Admin Console backend from the Learner backend.
--            Supabase becomes the SINGLE SOURCE OF TRUTH for:
--              - audit_logs        (real telemetry written by the learner backend)
--              - system_config     (real admin console configuration)
--              - learner_accounts  (real learner XP/hearts/progress mirror)
--            Postgres Realtime is enabled so the Admin Console live-syncs
--            whenever the Learner app performs a trigger.
-- Target Database: Supabase / PostgreSQL
-- Institution: Jose Maria College Foundation, Inc. (JMCFI) - BSIT Capstone
-- Author: Genesis Diaz
-- Date: October 2026
-- ============================================================================

-- ============================================================================
-- 1. Table: public.audit_logs
-- Immutable telemetry written by the LEARNER backend on every AI trigger
-- (mBERT intent inference, Whisper WER, lesson completion, security checks).
-- NOTE: user_id is TEXT (not an FK to auth.users) so the learner backend can
--       log activity even for the offline/demo learner session.
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT,
    event_type TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'SYSTEM_CONFIG'
      CHECK (category IN ('AI_INFERENCE', 'SPEECH_WER', 'LEARNING_ACTIVITY', 'SECURITY_RLS', 'SYSTEM_CONFIG')),
    actor TEXT NOT NULL DEFAULT 'system',
    actor_role TEXT NOT NULL DEFAULT 'System',
    description TEXT NOT NULL,
    severity TEXT NOT NULL DEFAULT 'INFO'
      CHECK (severity IN ('INFO', 'SUCCESS', 'WARNING', 'CRITICAL')),
    latency_ms INTEGER,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_category ON public.audit_logs(category);
CREATE INDEX IF NOT EXISTS idx_audit_logs_severity ON public.audit_logs(severity);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Audit logs readable by console" ON public.audit_logs;
DROP POLICY IF EXISTS "Audit logs insertable by console" ON public.audit_logs;
DROP POLICY IF EXISTS "Audit logs deletable by console" ON public.audit_logs;

-- The Admin Console subscribes to Realtime using the anon key, so SELECT must
-- be allowed for anon + authenticated. Writes normally come from the learner
-- backend using the service_role key (which bypasses RLS entirely).
-- NOTE: For production hardening, restrict INSERT/DELETE to service_role only.
DO $_sguard_$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'audit_logs' AND column_name = 'user_id' AND data_type = 'uuid'
  ) THEN
    EXECUTE $_spol$CREATE POLICY "Audit logs readable by console"
ON public.audit_logs FOR SELECT TO anon, authenticated
USING (true)$_spol$;
  END IF;
END
$_sguard_$;

DO $_sguard_$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'audit_logs' AND column_name = 'user_id' AND data_type = 'uuid'
  ) THEN
    EXECUTE $_spol$CREATE POLICY "Audit logs insertable by console"
ON public.audit_logs FOR INSERT TO anon, authenticated
WITH CHECK (true)$_spol$;
  END IF;
END
$_sguard_$;

DO $_sguard_$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'audit_logs' AND column_name = 'user_id' AND data_type = 'uuid'
  ) THEN
    EXECUTE $_spol$CREATE POLICY "Audit logs deletable by console"
ON public.audit_logs FOR DELETE TO anon, authenticated
USING (true)$_spol$;
  END IF;
END
$_sguard_$;

-- ============================================================================
-- 2. Table: public.system_config
-- Single-row ("global") configuration owned by the Admin Console backend.
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.system_config (
    id TEXT PRIMARY KEY DEFAULT 'global',
    active_gemini_model TEXT DEFAULT 'gemini-3.8-flash',
    whisper_wer_threshold INTEGER DEFAULT 15,
    bert_confidence_threshold NUMERIC(4,3) DEFAULT 0.850,
    maintenance_mode BOOLEAN DEFAULT false,
    rate_limit_per_min INTEGER DEFAULT 60,
    grounding_maps_enabled BOOLEAN DEFAULT true,
    grounding_search_enabled BOOLEAN DEFAULT true,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

INSERT INTO public.system_config (id) VALUES ('global') ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.system_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_config FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "System config readable by console" ON public.system_config;
DROP POLICY IF EXISTS "System config updatable by console" ON public.system_config;

CREATE POLICY "System config readable by console"
ON public.system_config FOR SELECT TO anon, authenticated
USING (true);

CREATE POLICY "System config updatable by console"
ON public.system_config FOR UPDATE TO anon, authenticated
USING (true) WITH CHECK (true);

-- ============================================================================
-- 3. Table: public.learner_accounts
-- Real learner roster mirror read by the Admin Console. Rows are upserted by
-- the LEARNER backend whenever the mobile app reports new progress, so the
-- admin console reflects ACTUAL activity (no mocked data).
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.learner_accounts (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT,
    role TEXT DEFAULT 'Learner',
    target_dialect TEXT DEFAULT 'davao_bisaya',
    xp INTEGER DEFAULT 0,
    streak_days INTEGER DEFAULT 0,
    hearts INTEGER DEFAULT 5,
    today_minutes INTEGER DEFAULT 0,
    daily_goal_minutes INTEGER DEFAULT 15,
    speech_score_average INTEGER DEFAULT 0,
    vocabulary_mastered INTEGER DEFAULT 0,
    status TEXT DEFAULT 'ACTIVE',
    last_active TEXT DEFAULT 'Just now',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_learner_accounts_updated_at ON public.learner_accounts(updated_at DESC);

ALTER TABLE public.learner_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learner_accounts FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Learner accounts readable by console" ON public.learner_accounts;
DROP POLICY IF EXISTS "Learner accounts upsertable by backend" ON public.learner_accounts;

CREATE POLICY "Learner accounts readable by console"
ON public.learner_accounts FOR SELECT TO anon, authenticated
USING (true);

CREATE POLICY "Learner accounts upsertable by backend"
ON public.learner_accounts FOR INSERT TO anon, authenticated
WITH CHECK (true);

-- Allow UPDATE through the same role set (needed for upsert on conflict)
DROP POLICY IF EXISTS "Learner accounts updatable by backend" ON public.learner_accounts;
CREATE POLICY "Learner accounts updatable by backend"
ON public.learner_accounts FOR UPDATE TO anon, authenticated
USING (true) WITH CHECK (true);

-- ============================================================================
-- 4. Enable Postgres Realtime for live Admin Console synchronisation
-- ============================================================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime'
          AND schemaname = 'public'
          AND tablename = 'audit_logs'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.audit_logs;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime'
          AND schemaname = 'public'
          AND tablename = 'learner_accounts'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.learner_accounts;
    END IF;
END $$;

-- ============================================================================
-- 5. Seed data
-- ============================================================================
-- NOTE: This migration previously seeded demo learner accounts
-- (usr_genesis / "Genesis Diaz", usr_mark, usr_sarah, usr_rhea) and demo
-- audit-log rows. All mock/demo users were removed: the learner console is
-- populated exclusively by real, authenticated Supabase accounts (the learner
-- backend upserts rows into public.learner_accounts on real activity).
-- No seed INSERTs here on purpose — there are no fake accounts.

-- ============================================================================
-- 6. Verification Queries (for Capstone Defense Panel)
-- ============================================================================
-- SELECT tablename, rowsecurity FROM pg_tables
--   WHERE schemaname = 'public' AND tablename IN ('audit_logs', 'system_config', 'learner_accounts');
-- SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';
-- SELECT count(*) FROM public.audit_logs;
