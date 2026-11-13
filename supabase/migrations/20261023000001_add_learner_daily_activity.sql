-- ============================================================================
-- Real learner practice calendar
-- ----------------------------------------------------------------------------
-- The streak/activity card used to render hard-coded September dates. This
-- table stores one row per learner per local calendar day so streaks, weekly
-- goals, the month grid, daily minutes and per-day XP are computed from real
-- practice instead of static demo data.
--
-- Rows are written by the learner backend (service role). Learners may still
-- read their own rows through RLS if the client ever needs direct access.
-- ============================================================================

create table if not exists public.learner_daily_activity (
  user_id uuid not null references auth.users (id) on delete cascade,
  activity_date date not null,
  minutes integer not null default 0 check (minutes >= 0),
  xp_earned integer not null default 0 check (xp_earned >= 0),
  lessons_completed integer not null default 0 check (lessons_completed >= 0),
  goal_minutes integer not null default 15 check (goal_minutes > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, activity_date)
);

comment on table public.learner_daily_activity is
  'Per-learner, per-local-day practice totals that drive the real streak calendar.';

create index if not exists learner_daily_activity_recent_idx
  on public.learner_daily_activity (user_id, activity_date desc);

alter table public.learner_daily_activity enable row level security;

drop policy if exists "learner_daily_activity_select_own" on public.learner_daily_activity;
create policy "learner_daily_activity_select_own"
  on public.learner_daily_activity
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "learner_daily_activity_insert_own" on public.learner_daily_activity;
create policy "learner_daily_activity_insert_own"
  on public.learner_daily_activity
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "learner_daily_activity_update_own" on public.learner_daily_activity;
create policy "learner_daily_activity_update_own"
  on public.learner_daily_activity
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Atomic increment used by POST /api/learner/activity. Additive so lessons,
-- voice drills and SULTI chats can all contribute to the same local day.
create or replace function public.learner_add_activity(
  p_user uuid,
  p_date date,
  p_minutes integer default 0,
  p_xp integer default 0,
  p_lessons integer default 0,
  p_goal integer default 15
)
returns public.learner_daily_activity
language plpgsql
security definer
set search_path = public
as $$
declare
  result public.learner_daily_activity;
begin
  insert into public.learner_daily_activity as t (
    user_id,
    activity_date,
    minutes,
    xp_earned,
    lessons_completed,
    goal_minutes
  )
  values (
    p_user,
    p_date,
    greatest(coalesce(p_minutes, 0), 0),
    greatest(coalesce(p_xp, 0), 0),
    greatest(coalesce(p_lessons, 0), 0),
    greatest(coalesce(p_goal, 15), 1)
  )
  on conflict (user_id, activity_date) do update
  set
    minutes = t.minutes + excluded.minutes,
    xp_earned = t.xp_earned + excluded.xp_earned,
    lessons_completed = t.lessons_completed + excluded.lessons_completed,
    goal_minutes = excluded.goal_minutes,
    updated_at = now()
  returning * into result;

  return result;
end;
$$;

comment on function public.learner_add_activity(uuid, date, integer, integer, integer, integer) is
  'Atomically adds practice minutes/XP/lessons to a learner day and stores the current daily goal.';

revoke all on function public.learner_add_activity(uuid, date, integer, integer, integer, integer)
  from public, anon, authenticated;
grant execute on function public.learner_add_activity(uuid, date, integer, integer, integer, integer)
  to service_role;
