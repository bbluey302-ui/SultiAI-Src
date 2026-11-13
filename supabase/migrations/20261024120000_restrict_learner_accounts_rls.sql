-- STAGE 1: Restrict learner_accounts RLS
-- Goal: users can access only their own row (auth.uid()); writes go through server (service_role)
-- Service role bypasses RLS, so server/admin backends using service_role can still read/write
-- Rollback:
--   DROP POLICY IF EXISTS \"Learner accounts readable by owner\" ON public.learner_accounts;
--   DROP POLICY IF EXISTS \"Learner accounts insertable by owner or service\" ON public.learner_accounts;
--   DROP POLICY IF EXISTS \"Learner accounts updatable by owner\" ON public.learner_accounts;
--   CREATE POLICY \"Learner accounts readable by console\" ON public.learner_accounts FOR SELECT TO anon, authenticated USING (true);
--   CREATE POLICY \"Learner accounts upsertable by backend\" ON public.learner_accounts FOR INSERT TO anon, authenticated WITH CHECK (true);
--   CREATE POLICY \"Learner accounts updatable by backend\" ON public.learner_accounts FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

ALTER TABLE public.learner_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learner_accounts FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Learner accounts readable by console" ON public.learner_accounts;
DROP POLICY IF EXISTS "Learner accounts upsertable by backend" ON public.learner_accounts;
DROP POLICY IF EXISTS "Learner accounts updatable by backend" ON public.learner_accounts;

-- Allow authenticated users to read only their own row
CREATE POLICY "Learner accounts readable by owner"
ON public.learner_accounts
FOR SELECT
TO authenticated
USING (id = auth.uid()::text);

-- Allow authenticated users to insert only their own row (defensive; server uses service_role)
CREATE POLICY "Learner accounts insertable by owner"
ON public.learner_accounts
FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid()::text);

-- Allow authenticated users to update only their own row (defensive; server uses service_role)
CREATE POLICY "Learner accounts updatable by owner"
ON public.learner_accounts
FOR UPDATE
TO authenticated
USING (id = auth.uid()::text)
WITH CHECK (id = auth.uid()::text);

-- No policies for anon; service_role bypasses RLS
