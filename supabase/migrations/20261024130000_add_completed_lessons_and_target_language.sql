-- STAGE 2: Authoritative persistence
-- completed_lessons: track verified lesson completions per user/language
-- Rollback:
--   DROP TABLE IF EXISTS public.completed_lessons;
--   ALTER TABLE public.learner_profiles DROP COLUMN IF EXISTS target_language;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='learner_profiles') THEN
    ALTER TABLE public.learner_profiles ADD COLUMN IF NOT EXISTS target_language text DEFAULT 'cebuano';
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.completed_lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id text NOT NULL,
  language text NOT NULL,
  module_id text,
  xp_awarded integer NOT NULL DEFAULT 0 CHECK (xp_awarded >= 0),
  score integer CHECK (score IS NULL OR (score >= 0 AND score <= 100)),
  completed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, lesson_id)
);

CREATE INDEX IF NOT EXISTS idx_completed_lessons_user ON public.completed_lessons(user_id);
CREATE INDEX IF NOT EXISTS idx_completed_lessons_user_lang ON public.completed_lessons(user_id, language);

ALTER TABLE public.completed_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.completed_lessons FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "completed_lessons_select_own" ON public.completed_lessons;
CREATE POLICY "completed_lessons_select_own"
  ON public.completed_lessons
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);
