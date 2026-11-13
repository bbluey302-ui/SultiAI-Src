-- ============================================================================
-- SultiAI — AI token economy, metering, caching and per-character providers
-- ============================================================================
-- Adds:
--   ai_plans               subscription/token plans
--   ai_settings            singleton limits + token costs + provider chains
--   ai_token_wallets       per-user balance (atomic spend/grant RPCs)
--   ai_token_ledger        append-only ledger
--   ai_usage_events        per-call provider telemetry (tokens, latency, cache)
--   ai_provider_accounts   key-slot metadata (NO secrets — env only)
--   ai_voice_profiles      character/language -> ElevenLabs voice id
--   ai_cache_entries       shared LLM response cache
--   ai_upgrade_requests    manual GCash top-up queue (gateway-ready)
--
-- Safe to re-run: every object is IF NOT EXISTS / CREATE OR REPLACE and every
-- policy is dropped before being recreated.
-- ============================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- 1. Plans
-- ---------------------------------------------------------------------------
create table if not exists public.ai_plans (
  id            text primary key,
  name          text not null,
  monthly_tokens integer not null default 0,
  price_php     numeric(10,2) not null default 0,
  features      jsonb not null default '[]'::jsonb,
  is_active     boolean not null default true,
  sort_order    integer not null default 0,
  created_at    timestamptz not null default now()
);

insert into public.ai_plans (id, name, monthly_tokens, price_php, features, sort_order) values
  ('free', 'Free',  5000,   0, '["5,000 AI tokens / month","All 5 AI coaches","Chat + voice practice"]'::jsonb, 0),
  ('plus', 'Plus', 25000,  99, '["25,000 AI tokens / month","Priority provider queue","Extended voice sessions"]'::jsonb, 1),
  ('pro',  'Pro',  75000, 249, '["75,000 AI tokens / month","Highest provider priority","Unlimited session length"]'::jsonb, 2)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- 2. Settings (singleton)
-- ---------------------------------------------------------------------------
create table if not exists public.ai_settings (
  id                 text primary key default 'global',
  free_monthly_tokens integer not null default 5000,
  cost_chat_turn     integer not null default 1,
  cost_voice_minute  integer not null default 25,
  cost_tts_1k_chars  integer not null default 5,
  cost_stt_minute    integer not null default 10,
  rate_limit_per_min integer not null default 30,
  provider_chains    jsonb not null default '{
    "jen":     ["groq","openrouter","nvidia","gemini"],
    "adam":    ["openrouter","nvidia","groq","gemini"],
    "gentech": ["nvidia","openrouter","groq","gemini"],
    "kevin":   ["groq","nvidia","openrouter","gemini"],
    "mika":    ["openrouter","groq","nvidia","gemini"]
  }'::jsonb,
  updated_at         timestamptz not null default now()
);

insert into public.ai_settings (id) values ('global') on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- 3. Wallets
-- ---------------------------------------------------------------------------
create table if not exists public.ai_token_wallets (
  user_id          uuid primary key references auth.users(id) on delete cascade,
  plan_id          text not null default 'free' references public.ai_plans(id),
  balance          integer not null default 0 check (balance >= 0),
  lifetime_granted bigint not null default 0,
  lifetime_spent   bigint not null default 0,
  period_start     timestamptz not null default now(),
  period_end       timestamptz not null default (now() + interval '1 month'),
  updated_at       timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 4. Ledger (append-only)
-- ---------------------------------------------------------------------------
create table if not exists public.ai_token_ledger (
  id            bigserial primary key,
  user_id       uuid not null references auth.users(id) on delete cascade,
  delta         integer not null,
  balance_after integer not null,
  reason        text not null,
  source        text,
  metadata      jsonb not null default '{}'::jsonb,
  created_at    timestamptz not null default now()
);

create index if not exists ai_token_ledger_user_created_idx
  on public.ai_token_ledger (user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- 5. Usage events (provider telemetry)
-- ---------------------------------------------------------------------------
create table if not exists public.ai_usage_events (
  id             bigserial primary key,
  user_id        uuid references auth.users(id) on delete set null,
  agent_id       text,
  mode           text not null default 'chat',
  provider       text,
  model          text,
  key_alias      text,
  input_tokens   integer not null default 0,
  output_tokens  integer not null default 0,
  units          numeric(12,3) not null default 0,
  tokens_charged integer not null default 0,
  latency_ms     integer not null default 0,
  cached         boolean not null default false,
  ok             boolean not null default true,
  error          text,
  created_at     timestamptz not null default now()
);

create index if not exists ai_usage_events_created_idx
  on public.ai_usage_events (created_at desc);
create index if not exists ai_usage_events_user_created_idx
  on public.ai_usage_events (user_id, created_at desc);
create index if not exists ai_usage_events_provider_created_idx
  on public.ai_usage_events (provider, created_at desc);

-- ---------------------------------------------------------------------------
-- 6. Provider key slots (metadata only — secrets stay in env)
-- ---------------------------------------------------------------------------
create table if not exists public.ai_provider_accounts (
  id             text primary key,
  provider       text not null,
  key_alias      text not null,
  agent_ids      text[] not null default '{}',
  monthly_quota  bigint not null default 0,
  used_units     bigint not null default 0,
  period_start   date not null default current_date,
  status         text not null default 'active'
                 check (status in ('active','cooling','disabled','exhausted')),
  cooldown_until timestamptz,
  last_error     text,
  last_used_at   timestamptz,
  updated_at     timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 7. Voice profiles
-- ---------------------------------------------------------------------------
create table if not exists public.ai_voice_profiles (
  id                  uuid primary key default gen_random_uuid(),
  agent_id            text not null,
  language            text not null,
  elevenlabs_voice_id text not null,
  model_id            text not null default 'eleven_multilingual_v2',
  display_name        text,
  key_alias           text,
  settings            jsonb not null default '{}'::jsonb,
  is_active           boolean not null default true,
  created_at          timestamptz not null default now(),
  unique (agent_id, language)
);

-- ---------------------------------------------------------------------------
-- 8. Response cache
-- ---------------------------------------------------------------------------
create table if not exists public.ai_cache_entries (
  cache_key  text primary key,
  scope      text not null default 'chat',
  payload    jsonb not null,
  hits       integer not null default 0,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists ai_cache_entries_expires_idx
  on public.ai_cache_entries (expires_at);

-- ---------------------------------------------------------------------------
-- 9. Upgrade / top-up requests (manual GCash, gateway-ready)
-- ---------------------------------------------------------------------------
create table if not exists public.ai_upgrade_requests (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  plan_id          text references public.ai_plans(id),
  tokens_requested integer not null default 0,
  amount_php       numeric(10,2) not null default 0,
  payment_method   text not null default 'gcash',
  reference_no     text,
  receipt_url      text,
  status           text not null default 'pending'
                   check (status in ('pending','approved','rejected','cancelled')),
  admin_note       text,
  reviewed_by      text,
  reviewed_at      timestamptz,
  gateway          text,
  gateway_ref      text,
  created_at       timestamptz not null default now()
);

create index if not exists ai_upgrade_requests_status_idx
  on public.ai_upgrade_requests (status, created_at desc);
create index if not exists ai_upgrade_requests_user_idx
  on public.ai_upgrade_requests (user_id, created_at desc);

-- ===========================================================================
-- 10. Atomic wallet RPCs
-- ===========================================================================

create or replace function public.ai_ensure_wallet(p_user uuid)
returns public.ai_token_wallets
language plpgsql
security definer
set search_path = public
as $$
declare
  v_wallet   public.ai_token_wallets;
  v_allowance integer;
begin
  if p_user is null then
    raise exception 'userId is required';
  end if;

  select * into v_wallet from public.ai_token_wallets where user_id = p_user;
  if found then
    return v_wallet;
  end if;

  select coalesce(free_monthly_tokens, 5000) into v_allowance
    from public.ai_settings where id = 'global';
  v_allowance := coalesce(v_allowance, 5000);

  insert into public.ai_token_wallets (user_id, plan_id, balance, lifetime_granted)
  values (p_user, 'free', v_allowance, v_allowance)
  on conflict (user_id) do nothing
  returning * into v_wallet;

  if v_wallet.user_id is null then
    select * into v_wallet from public.ai_token_wallets where user_id = p_user;
  else
    insert into public.ai_token_ledger (user_id, delta, balance_after, reason, source, metadata)
    values (p_user, v_allowance, v_allowance, 'monthly_grant', 'signup', '{}'::jsonb);
  end if;

  return v_wallet;
end;
$$;

create or replace function public.ai_spend_tokens(
  p_user uuid,
  p_amount integer,
  p_reason text default 'spend',
  p_source text default 'ai_gateway',
  p_metadata jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_wallet    public.ai_token_wallets;
  v_allowance integer;
  v_old       integer;
begin
  if p_user is null then
    raise exception 'userId is required';
  end if;
  if p_amount is null or p_amount < 0 then
    raise exception 'invalid token amount';
  end if;

  -- Lock the row so two concurrent requests cannot double-spend.
  select * into v_wallet from public.ai_token_wallets where user_id = p_user for update;
  if not found then
    perform public.ai_ensure_wallet(p_user);
    select * into v_wallet from public.ai_token_wallets where user_id = p_user for update;
  end if;

  -- Lazy monthly reset (no pg_cron dependency).
  if v_wallet.period_end <= now() then
    v_old := v_wallet.balance;
    select coalesce(
             (select monthly_tokens from public.ai_plans where id = v_wallet.plan_id),
             (select free_monthly_tokens from public.ai_settings where id = 'global'),
             5000
           ) into v_allowance;

    update public.ai_token_wallets
       set balance      = v_allowance,
           period_start = now(),
           period_end   = now() + interval '1 month',
           updated_at   = now()
     where user_id = p_user
     returning * into v_wallet;

    insert into public.ai_token_ledger (user_id, delta, balance_after, reason, source, metadata)
    values (p_user, v_allowance - v_old, v_wallet.balance, 'monthly_grant', 'period_reset', '{}'::jsonb);
  end if;

  if v_wallet.balance < p_amount then
    raise exception 'INSUFFICIENT_TOKENS: balance % < required %', v_wallet.balance, p_amount
      using errcode = 'P0001';
  end if;

  update public.ai_token_wallets
     set balance        = balance - p_amount,
         lifetime_spent = lifetime_spent + p_amount,
         updated_at     = now()
   where user_id = p_user
   returning * into v_wallet;

  insert into public.ai_token_ledger (user_id, delta, balance_after, reason, source, metadata)
  values (p_user, -p_amount, v_wallet.balance, p_reason, p_source, coalesce(p_metadata, '{}'::jsonb));

  return jsonb_build_object(
    'user_id', v_wallet.user_id,
    'plan_id', v_wallet.plan_id,
    'balance', v_wallet.balance,
    'lifetime_granted', v_wallet.lifetime_granted,
    'lifetime_spent', v_wallet.lifetime_spent,
    'period_start', v_wallet.period_start,
    'period_end', v_wallet.period_end,
    'updated_at', v_wallet.updated_at
  );
end;
$$;

create or replace function public.ai_grant_tokens(
  p_user uuid,
  p_amount integer,
  p_reason text default 'grant',
  p_source text default 'admin',
  p_metadata jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_wallet public.ai_token_wallets;
begin
  if p_user is null then
    raise exception 'userId is required';
  end if;
  if p_amount is null or p_amount < 0 then
    raise exception 'invalid token amount';
  end if;

  perform public.ai_ensure_wallet(p_user);

  update public.ai_token_wallets
     set balance          = balance + p_amount,
         lifetime_granted = lifetime_granted + p_amount,
         updated_at       = now()
   where user_id = p_user
   returning * into v_wallet;

  insert into public.ai_token_ledger (user_id, delta, balance_after, reason, source, metadata)
  values (p_user, p_amount, v_wallet.balance, p_reason, p_source, coalesce(p_metadata, '{}'::jsonb));

  return jsonb_build_object(
    'user_id', v_wallet.user_id,
    'plan_id', v_wallet.plan_id,
    'balance', v_wallet.balance,
    'lifetime_granted', v_wallet.lifetime_granted,
    'lifetime_spent', v_wallet.lifetime_spent,
    'period_start', v_wallet.period_start,
    'period_end', v_wallet.period_end,
    'updated_at', v_wallet.updated_at
  );
end;
$$;

revoke all on function public.ai_spend_tokens(uuid, integer, text, text, jsonb) from public;
revoke all on function public.ai_grant_tokens(uuid, integer, text, text, jsonb) from public;
grant execute on function public.ai_spend_tokens(uuid, integer, text, text, jsonb) to service_role;
grant execute on function public.ai_grant_tokens(uuid, integer, text, text, jsonb) to service_role;

-- ---------------------------------------------------------------------------
-- 11. Auto-provision a wallet on signup + backfill existing users
-- ---------------------------------------------------------------------------
create or replace function public.ai_on_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.ai_ensure_wallet(new.id);
  return new;
end;
$$;

drop trigger if exists ai_wallet_on_signup on auth.users;
create trigger ai_wallet_on_signup
  after insert on auth.users
  for each row execute function public.ai_on_new_user();

-- Backfill: every existing auth user gets a wallet exactly once.
do $$
declare
  u record;
begin
  for u in
    select au.id
      from auth.users au
      left join public.ai_token_wallets w on w.user_id = au.id
     where w.user_id is null
  loop
    perform public.ai_ensure_wallet(u.id);
  end loop;
end;
$$;

-- ---------------------------------------------------------------------------
-- 12. RLS
-- ---------------------------------------------------------------------------
alter table public.ai_plans             enable row level security;
alter table public.ai_settings          enable row level security;
alter table public.ai_token_wallets     enable row level security;
alter table public.ai_token_ledger      enable row level security;
alter table public.ai_usage_events      enable row level security;
alter table public.ai_provider_accounts enable row level security;
alter table public.ai_voice_profiles    enable row level security;
alter table public.ai_cache_entries     enable row level security;
alter table public.ai_upgrade_requests  enable row level security;

-- Plans + settings are safe to read (no secrets).
drop policy if exists ai_plans_read on public.ai_plans;
create policy ai_plans_read on public.ai_plans
  for select to anon, authenticated using (true);

drop policy if exists ai_settings_read on public.ai_settings;
create policy ai_settings_read on public.ai_settings
  for select to authenticated using (true);

-- Wallet / ledger / usage: own rows only.
drop policy if exists ai_wallets_select_own on public.ai_token_wallets;
create policy ai_wallets_select_own on public.ai_token_wallets
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists ai_ledger_select_own on public.ai_token_ledger;
create policy ai_ledger_select_own on public.ai_token_ledger
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists ai_usage_select_own on public.ai_usage_events;
create policy ai_usage_select_own on public.ai_usage_events
  for select to authenticated using (auth.uid() = user_id);

-- Voice profiles are readable so the client can show which voice is active.
drop policy if exists ai_voice_profiles_read on public.ai_voice_profiles;
create policy ai_voice_profiles_read on public.ai_voice_profiles
  for select to authenticated using (is_active = true);

-- Upgrade requests: create and read your own.
drop policy if exists ai_upgrades_select_own on public.ai_upgrade_requests;
create policy ai_upgrades_select_own on public.ai_upgrade_requests
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists ai_upgrades_insert_own on public.ai_upgrade_requests;
create policy ai_upgrades_insert_own on public.ai_upgrade_requests
  for insert to authenticated with check (auth.uid() = user_id);

-- ai_provider_accounts + ai_cache_entries intentionally have no policies:
-- only the service_role (server) may touch them.

-- ---------------------------------------------------------------------------
-- 13. Seed provider slot metadata (no secrets here)
-- ---------------------------------------------------------------------------
insert into public.ai_provider_accounts (id, provider, key_alias, agent_ids) values
  ('groq:primary',        'groq',       'GROQ_API_KEY',        '{jen,kevin}'),
  ('openrouter:primary',  'openrouter', 'OPENROUTER_API_KEY',  '{adam,kevin,mika}'),
  ('openrouter:secondary','openrouter', 'OPENROUTER_API_KEY_2','{jen,gentech}'),
  ('nvidia:primary',      'nvidia',     'NVIDIA_API_KEY',      '{gentech,adam,jen,kevin,mika}'),
  ('gemini:primary',      'gemini',     'GEMINI_API_KEY',      '{jen,adam,gentech,kevin,mika}')
on conflict (id) do nothing;
