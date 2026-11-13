// Token wallet + metering service.
//
// All balances live in Postgres (`ai_token_wallets`) and every mutation is
// append-only in `ai_token_ledger`. The atomic RPCs in the migration prevent
// double-spend races. When Supabase is not configured (pure local dev) an
// in-memory wallet keeps the UI usable.

import { supabaseServer } from '../supabaseServer';
import { DEFAULT_AI_SETTINGS } from './config';
import type { AiSettings, UsageEvent } from './types';
import { InsufficientTokensError } from './types';

export { InsufficientTokensError };

interface WalletRow {
  user_id: string;
  plan_id: string;
  balance: number;
  lifetime_granted: number | string | null;
  lifetime_spent: number | string | null;
  period_start: string;
  period_end: string;
  updated_at: string;
}

export interface Wallet {
  userId: string;
  planId: string;
  balance: number;
  lifetimeGranted: number;
  lifetimeSpent: number;
  periodStart: string;
  periodEnd: string;
  updatedAt: string;
}

export interface LedgerEntry {
  id: number | string;
  delta: number;
  balanceAfter: number;
  reason: string;
  source?: string | null;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface WalletSummary {
  wallet: Wallet;
  plan: { id: string; name: string; monthlyTokens: number; pricePhp: number; features: string[] } | null;
  planOptions: { id: string; name: string; monthlyTokens: number; pricePhp: number; features: string[] }[];
  costs: {
    chatTurn: number;
    voiceMinute: number;
    tts1kChars: number;
    sttMinute: number;
  };
  ledger: LedgerEntry[];
  usage: {
    todayTokens: number;
    monthTokens: number;
    byMode: { mode: string; tokens: number; requests: number }[];
  };
}

const settingsCache: { value: AiSettings | null; at: number } = { value: null, at: 0 };
const SETTINGS_TTL_MS = 60_000;

// ---- local fallback --------------------------------------------------------

const localWallets = new Map<string, Wallet>();
const localLedger = new Map<string, LedgerEntry[]>();

function localWallet(userId: string): Wallet {
  const existing = localWallets.get(userId);
  if (existing) return existing;
  const now = Date.now();
  const wallet: Wallet = {
    userId,
    planId: 'free',
    balance: DEFAULT_AI_SETTINGS.freeMonthlyTokens,
    lifetimeGranted: DEFAULT_AI_SETTINGS.freeMonthlyTokens,
    lifetimeSpent: 0,
    periodStart: new Date(now).toISOString(),
    periodEnd: new Date(now + 30 * 86400_000).toISOString(),
    updatedAt: new Date(now).toISOString(),
  };
  localWallets.set(userId, wallet);
  localLedger.set(userId, [
    {
      id: `local-${now}`,
      delta: wallet.balance,
      balanceAfter: wallet.balance,
      reason: 'monthly_grant',
      source: 'local_dev',
      createdAt: wallet.updatedAt,
    },
  ]);
  return wallet;
}

// ---- helpers ---------------------------------------------------------------

function mapWallet(row: WalletRow): Wallet {
  return {
    userId: row.user_id,
    planId: row.plan_id,
    balance: Number(row.balance) || 0,
    lifetimeGranted: Number(row.lifetime_granted) || 0,
    lifetimeSpent: Number(row.lifetime_spent) || 0,
    periodStart: row.period_start,
    periodEnd: row.period_end,
    updatedAt: row.updated_at,
  };
}

function mapSettings(row: any): AiSettings {
  if (!row) return DEFAULT_AI_SETTINGS;
  return {
    freeMonthlyTokens: Number(row.free_monthly_tokens) || DEFAULT_AI_SETTINGS.freeMonthlyTokens,
    costChatTurn: Number(row.cost_chat_turn) ?? DEFAULT_AI_SETTINGS.costChatTurn,
    costVoiceMinute: Number(row.cost_voice_minute) ?? DEFAULT_AI_SETTINGS.costVoiceMinute,
    costTts1kChars: Number(row.cost_tts_1k_chars) ?? DEFAULT_AI_SETTINGS.costTts1kChars,
    costSttMinute: Number(row.cost_stt_minute) ?? DEFAULT_AI_SETTINGS.costSttMinute,
    rateLimitPerMin: Number(row.rate_limit_per_min) || DEFAULT_AI_SETTINGS.rateLimitPerMin,
    providerChains:
      row.provider_chains && typeof row.provider_chains === 'object' && Object.keys(row.provider_chains).length
        ? { ...DEFAULT_AI_SETTINGS.providerChains, ...row.provider_chains }
        : DEFAULT_AI_SETTINGS.providerChains,
  };
}

export async function getAiSettings(force = false): Promise<AiSettings> {
  if (!force && settingsCache.value && Date.now() - settingsCache.at < SETTINGS_TTL_MS) {
    return settingsCache.value;
  }
  let value = DEFAULT_AI_SETTINGS;
  if (supabaseServer) {
    try {
      const { data } = await supabaseServer.from('ai_settings').select('*').eq('id', 'global').maybeSingle();
      value = mapSettings(data);
    } catch {
      value = DEFAULT_AI_SETTINGS;
    }
  }
  settingsCache.value = value;
  settingsCache.at = Date.now();
  return value;
}

export function invalidateSettingsCache() {
  settingsCache.value = null;
  settingsCache.at = 0;
}

export async function getWallet(userId: string): Promise<Wallet> {
  if (!userId) throw new Error('userId is required');
  if (!supabaseServer) return localWallet(userId);

  const { data, error } = await supabaseServer
    .from('ai_token_wallets')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (data) return mapWallet(data as WalletRow);

  // First touch: create the wallet with the plan's monthly allowance.
  const settings = await getAiSettings();
  const granted = await grantTokens(userId, settings.freeMonthlyTokens, 'monthly_grant', 'signup', {});
  return granted;
}

export async function spendTokens(
  userId: string,
  amount: number,
  reason: string,
  metadata: Record<string, unknown> = {},
  source = 'ai_gateway'
): Promise<Wallet> {
  const cost = Math.max(0, Math.round(amount));
  if (!userId) throw new Error('userId is required');
  if (cost === 0) return getWallet(userId);

  if (!supabaseServer) {
    const wallet = localWallet(userId);
    if (wallet.balance < cost) throw new InsufficientTokensError(wallet.balance, cost);
    wallet.balance -= cost;
    wallet.lifetimeSpent += cost;
    wallet.updatedAt = new Date().toISOString();
    const list = localLedger.get(userId) || [];
    list.unshift({
      id: `local-${Date.now()}`,
      delta: -cost,
      balanceAfter: wallet.balance,
      reason,
      source,
      metadata,
      createdAt: wallet.updatedAt,
    });
    localLedger.set(userId, list.slice(0, 100));
    return wallet;
  }

  const { data, error } = await supabaseServer.rpc('ai_spend_tokens', {
    p_user: userId,
    p_amount: cost,
    p_reason: reason,
    p_source: source,
    p_metadata: metadata,
  });

  if (error) {
    if ((error.message || '').includes('INSUFFICIENT_TOKENS')) {
      const wallet = await getWallet(userId).catch(() => null);
      throw new InsufficientTokensError(wallet?.balance ?? 0, cost);
    }
    throw new Error(error.message);
  }

  const row = Array.isArray(data) ? data[0] : data;
  if (row && row.balance !== undefined) return mapWallet(row as WalletRow);
  return getWallet(userId);
}

export async function grantTokens(
  userId: string,
  amount: number,
  reason = 'grant',
  source = 'admin',
  metadata: Record<string, unknown> = {}
): Promise<Wallet> {
  const value = Math.max(0, Math.round(amount));
  if (!userId) throw new Error('userId is required');

  if (!supabaseServer) {
    const wallet = localWallet(userId);
    wallet.balance += value;
    wallet.lifetimeGranted += value;
    wallet.updatedAt = new Date().toISOString();
    const list = localLedger.get(userId) || [];
    list.unshift({
      id: `local-${Date.now()}`,
      delta: value,
      balanceAfter: wallet.balance,
      reason,
      source,
      metadata,
      createdAt: wallet.updatedAt,
    });
    localLedger.set(userId, list.slice(0, 100));
    return wallet;
  }

  const { data, error } = await supabaseServer.rpc('ai_grant_tokens', {
    p_user: userId,
    p_amount: value,
    p_reason: reason,
    p_source: source,
    p_metadata: metadata,
  });
  if (error) throw new Error(error.message);

  const row = Array.isArray(data) ? data[0] : data;
  if (row && row.balance !== undefined) return mapWallet(row as WalletRow);
  return getWallet(userId);
}

export async function listLedger(userId: string, limit = 20): Promise<LedgerEntry[]> {
  if (!supabaseServer) {
    return (localLedger.get(userId) || []).slice(0, limit);
  }
  const { data, error } = await supabaseServer
    .from('ai_token_ledger')
    .select('id, delta, balance_after, reason, source, metadata, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) return [];
  return (data || []).map((row: any) => ({
    id: row.id,
    delta: Number(row.delta) || 0,
    balanceAfter: Number(row.balance_after) || 0,
    reason: row.reason,
    source: row.source,
    metadata: row.metadata || {},
    createdAt: row.created_at,
  }));
}

export async function recordUsage(event: UsageEvent): Promise<void> {
  if (!supabaseServer) return;
  try {
    await supabaseServer.from('ai_usage_events').insert([
      {
        user_id: event.userId || null,
        agent_id: event.agentId || null,
        mode: event.mode,
        provider: event.provider || null,
        model: event.model || null,
        key_alias: event.keyAlias || null,
        input_tokens: event.inputTokens || 0,
        output_tokens: event.outputTokens || 0,
        units: event.units || 0,
        tokens_charged: event.tokensCharged || 0,
        latency_ms: event.latencyMs || 0,
        cached: Boolean(event.cached),
        ok: event.ok !== false,
        error: event.error || null,
      },
    ]);
  } catch {
    // Telemetry must never break a request.
  }
}

export async function getWalletSummary(userId: string): Promise<WalletSummary> {
  const [wallet, settings, ledger] = await Promise.all([
    getWallet(userId),
    getAiSettings(),
    listLedger(userId, 15),
  ]);

  let plan: WalletSummary['plan'] = null;
  let planOptions: WalletSummary['planOptions'] = [];
  let usage: WalletSummary['usage'] = { todayTokens: 0, monthTokens: 0, byMode: [] };

  if (supabaseServer) {
    try {
      const { data: plans } = await supabaseServer
        .from('ai_plans')
        .select('id, name, monthly_tokens, price_php, features, sort_order')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
      planOptions = (plans || []).map((p: any) => ({
        id: p.id,
        name: p.name,
        monthlyTokens: Number(p.monthly_tokens) || 0,
        pricePhp: Number(p.price_php) || 0,
        features: Array.isArray(p.features) ? p.features : [],
      }));
      plan = planOptions.find((p) => p.id === wallet.planId) || null;

      const monthStart = new Date();
      monthStart.setUTCDate(1);
      monthStart.setUTCHours(0, 0, 0, 0);
      const dayStart = new Date();
      dayStart.setUTCHours(0, 0, 0, 0);

      const { data: events } = await supabaseServer
        .from('ai_usage_events')
        .select('mode, tokens_charged, created_at')
        .eq('user_id', userId)
        .gte('created_at', monthStart.toISOString())
        .limit(5000);

      const rows = (events || []) as { mode: string; tokens_charged: number; created_at: string }[];
      const byModeMap = new Map<string, { tokens: number; requests: number }>();
      let monthTokens = 0;
      let todayTokens = 0;
      for (const row of rows) {
        const tokens = Number(row.tokens_charged) || 0;
        monthTokens += tokens;
        if (new Date(row.created_at) >= dayStart) todayTokens += tokens;
        const bucket = byModeMap.get(row.mode) || { tokens: 0, requests: 0 };
        bucket.tokens += tokens;
        bucket.requests += 1;
        byModeMap.set(row.mode, bucket);
      }
      usage = {
        todayTokens,
        monthTokens,
        byMode: [...byModeMap.entries()].map(([mode, value]) => ({ mode, ...value })),
      };
    } catch {
      // Keep defaults.
    }
  }

  return {
    wallet,
    plan,
    planOptions,
    costs: {
      chatTurn: settings.costChatTurn,
      voiceMinute: settings.costVoiceMinute,
      tts1kChars: settings.costTts1kChars,
      sttMinute: settings.costSttMinute,
    },
    ledger,
    usage,
  };
}

export async function requestTokenUpgrade(input: {
  userId: string;
  planId?: string;
  tokensRequested: number;
  amountPhp?: number;
  paymentMethod?: string;
  referenceNo?: string;
  receiptUrl?: string;
}): Promise<{ id: string; status: string }> {
  if (!supabaseServer) {
    return { id: `local-${Date.now()}`, status: 'pending' };
  }
  const { data, error } = await supabaseServer
    .from('ai_upgrade_requests')
    .insert([
      {
        user_id: input.userId,
        plan_id: input.planId || null,
        tokens_requested: Math.max(1, Math.round(input.tokensRequested)),
        amount_php: input.amountPhp ?? 0,
        payment_method: input.paymentMethod || 'gcash',
        reference_no: input.referenceNo || null,
        receipt_url: input.receiptUrl || null,
        status: 'pending',
      },
    ])
    .select('id, status')
    .single();
  if (error) throw new Error(error.message);
  return { id: data.id, status: data.status };
}

export async function listUpgradeRequests(userId: string): Promise<
  { id: string; planId?: string; tokensRequested: number; amountPhp: number; status: string; createdAt: string }[]
> {
  if (!supabaseServer) return [];
  const { data } = await supabaseServer
    .from('ai_upgrade_requests')
    .select('id, plan_id, tokens_requested, amount_php, status, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(10);
  return (data || []).map((row: any) => ({
    id: row.id,
    planId: row.plan_id,
    tokensRequested: Number(row.tokens_requested) || 0,
    amountPhp: Number(row.amount_php) || 0,
    status: row.status,
    createdAt: row.created_at,
  }));
}
