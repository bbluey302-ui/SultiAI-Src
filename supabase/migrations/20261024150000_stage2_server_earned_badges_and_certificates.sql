-- STAGE 2: server-earned badges + certificates
-- ----------------------------------------------------------------------------
-- Badge unlock state and certificate issuance are server-owned. The browser
-- may read its own earned rows, but cannot insert/update/delete them.
--
-- Rollback:
--   DROP TABLE IF EXISTS public.learner_certificates;
--   DROP TABLE IF EXISTS public.learner_badges;

CREATE TABLE IF NOT EXISTS public.learner_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id text NOT NULL,
  earned_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, badge_id)
);

CREATE INDEX IF NOT EXISTS idx_learner_badges_user
  ON public.learner_badges(user_id);

CREATE TABLE IF NOT EXISTS public.learner_certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  language text NOT NULL DEFAULT 'cebuano',
  verification_code text NOT NULL UNIQUE,
  average_score integer CHECK (average_score IS NULL OR (average_score >= 0 AND average_score <= 100)),
  completed_challenges integer NOT NULL DEFAULT 0 CHECK (completed_challenges >= 0),
  total_challenges integer NOT NULL DEFAULT 0 CHECK (total_challenges >= 0),
  issued_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, language)
);

CREATE INDEX IF NOT EXISTS idx_learner_certificates_user
  ON public.learner_certificates(user_id);

ALTER TABLE public.learner_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learner_badges FORCE ROW LEVEL SECURITY;
ALTER TABLE public.learner_certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learner_certificates FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "learner_badges_select_own" ON public.learner_badges;
CREATE POLICY "learner_badges_select_own"
  ON public.learner_badges
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "learner_certificates_select_own" ON public.learner_certificates;
CREATE POLICY "learner_certificates_select_own"
  ON public.learner_certificates
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

REVOKE ALL ON public.learner_badges FROM anon, authenticated;
REVOKE ALL ON public.learner_certificates FROM anon, authenticated;
GRANT SELECT ON public.learner_badges TO authenticated;
GRANT SELECT ON public.learner_certificates TO authenticated;

-- completed_lessons is written only by the service-role learner backend.
REVOKE INSERT, UPDATE, DELETE ON public.completed_lessons FROM anon, authenticated;
GRANT SELECT ON public.completed_lessons TO authenticated;
