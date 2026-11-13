// Learner-side client for the AI token wallet.
//
// The server is the only place that mutates balances. This module just reads the
// summary, submits GCash top-up requests, and exposes the Supabase bearer token
// so AI calls are metered against the signed-in learner.

import { supabase } from './supabaseClient';

export interface TokenWallet {
  userId: string;
  planId: string;
  balance: number;
  lifetimeGranted: number;
  lifetimeSpent: number;
  periodStart: string;
  periodEnd: string;
  updatedAt: string;
}

export interface TokenPlan {
  id: string;
  name: string;
  monthlyTokens: number;
  pricePhp: number;
  features: string[];
}

export interface TokenLedgerEntry {
  id: number | string;
  delta: number;
  balanceAfter: number;
  reason: string;
  source?: string | null;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface TokenUsageBucket {
  mode: string;
  tokens: number;
  requests: number;
}

export interface TokenWalletSummary {
  wallet: TokenWallet;
  plan: TokenPlan | null;
  planOptions: TokenPlan[];
  costs: {
    chatTurn: number;
    voiceMinute: number;
    tts1kChars: number;
    sttMinute: number;
  };
  ledger: TokenLedgerEntry[];
  usage: {
    todayTokens: number;
    monthTokens: number;
    byMode: TokenUsageBucket[];
  };
}

export interface UpgradeRequestSummary {
  id: string;
  planId?: string;
  tokensRequested: number;
  amountPhp: number;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  createdAt: string;
}

export interface UpgradeRequestInput {
  planId?: string;
  tokensRequested: number;
  amountPhp?: number;
  paymentMethod?: string;
  referenceNo?: string;
  receiptUrl?: string;
}

export class TokenApiError extends Error {
  status: number;
  code?: string;
  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'TokenApiError';
    this.status = status;
    this.code = code;
  }
}

/** Bearer header for metered AI endpoints. Empty object when signed out. */
export async function authHeaders(): Promise<Record<string, string>> {
  if (!supabase) return {};
  try {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: {
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...(await authHeaders()),
      ...(init?.headers || {}),
    },
  });

  let payload: any = null;
  try {
    payload = await res.json();
  } catch {
    payload = null;
  }

  if (!res.ok) {
    throw new TokenApiError(
      payload?.error || `Request failed with HTTP ${res.status}`,
      res.status,
      payload?.code
    );
  }
  return payload as T;
}

export async function fetchWalletSummary(): Promise<TokenWalletSummary> {
  return request<TokenWalletSummary>('/api/sulti/wallet');
}

export async function submitTokenRequest(input: UpgradeRequestInput): Promise<{ id: string; status: string }> {
  return request<{ id: string; status: string }>('/api/sulti/tokens/request', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function fetchMyRequests(): Promise<UpgradeRequestSummary[]> {
  const data = await request<{ requests: UpgradeRequestSummary[] }>('/api/sulti/tokens/requests');
  return data.requests || [];
}

const RECEIPT_BUCKET = 'ai-receipts';

/**
 * Upload a GCash receipt into the learner's private folder.
 * Returns the storage path (not a URL) — the admin console signs it on demand.
 */
export async function uploadReceipt(file: File): Promise<string> {
  if (!supabase) throw new TokenApiError('Storage is not configured', 503, 'NOT_CONFIGURED');

  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData.session?.user.id;
  if (!userId) throw new TokenApiError('Sign in to upload a receipt.', 401, 'UNAUTHENTICATED');

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-80);
  const path = `${userId}/${Date.now()}-${safeName}`;

  const { error } = await supabase.storage.from(RECEIPT_BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
    contentType: file.type || 'application/octet-stream',
  });
  if (error) throw new TokenApiError(error.message, 500, 'UPLOAD_FAILED');
  return path;
}

export function formatTokens(value: number): string {
  const rounded = Math.round(Number(value) || 0);
  if (Math.abs(rounded) >= 1_000_000) {
    return `${(rounded / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  }
  if (Math.abs(rounded) >= 10_000) {
    return `${(rounded / 1000).toFixed(1).replace(/\.0$/, '')}k`;
  }
  return rounded.toLocaleString('en-PH');
}

export function formatLedgerReason(reason: string): string {
  switch (reason) {
    case 'chat_turn':
      return 'Chat message';
    case 'voice_minute':
      return 'Voice practice';
    case 'tts':
      return 'Coach voice';
    case 'stt':
      return 'Speech recognition';
    case 'monthly_grant':
      return 'Monthly allowance';
    case 'grant':
      return 'Admin grant';
    case 'refund':
      return 'Refund';
    case 'purchase':
      return 'Top-up';
    default:
      return reason.replace(/_/g, ' ');
  }
}
