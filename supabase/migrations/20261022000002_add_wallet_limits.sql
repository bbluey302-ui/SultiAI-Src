-- ============================================================================
-- Per-learner token limits
-- ============================================================================
-- Admins can override the monthly allowance for a single learner (for
-- scholarships, promos, or throttling heavy accounts) without changing plans.
-- The effective allowance is:
--     monthly_override  ->  plan allowance  ->  global free allowance
-- ============================================================================

alter table public.ai_token_wallets
  add column if not exists monthly_override integer,
  add column if not exists note text,
  add column if not exists plan_started_at timestamptz not null default now();

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
             v_wallet.monthly_override,
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

revoke all on function public.ai_spend_tokens(uuid, integer, text, text, jsonb) from public;
grant execute on function public.ai_spend_tokens(uuid, integer, text, text, jsonb) to service_role;

-- Keep updated_at truthful for account changes.
create or replace function public.ai_touch_wallet()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists ai_wallet_touch on public.ai_token_wallets;
create trigger ai_wallet_touch
  before update on public.ai_token_wallets
  for each row execute function public.ai_touch_wallet();
