import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowUpRight,
  CheckCircle2,
  Coins,
  Gauge,
  Loader2,
  Mic,
  RefreshCw,
  Search,
  Server,
  Sliders,
  TrendingUp,
  Users,
  Wallet,
  XCircle,
} from 'lucide-react';
import { adminApi } from '../../services/adminApi';
import { useAdminAuth } from '../AdminAuthContext';
import { sounds } from '@/src/utils/soundEffects';

// ---------------------------------------------------------------------------
// Shapes returned by /api/admin/ai/tokens/*
// ---------------------------------------------------------------------------
type TrendPoint = { label: string; value: number };
type ModeRow = { mode: string; requests: number; tokens: number };
type ProviderStat = {
  provider: string;
  requests: number;
  tokens: number;
  failed: number;
  avgLatencyMs: number;
};
type TopUser = {
  userId: string;
  name: string;
  email: string;
  planId: string;
  balance: number;
  spent30d: number;
  requests30d: number;
};
type Overview = {
  totalWallets: number;
  totalBalance: number;
  grantedThisMonth: number;
  spentThisMonth: number;
  activeUsers30d: number;
  cachedRequests7d: number;
  cacheHitRate: number;
  failedRequests7d: number;
  avgLatencyMs: number;
  pendingUpgrades: number;
  trend: TrendPoint[];
  byMode: ModeRow[];
  byProvider: ProviderStat[];
  topUsers: TopUser[];
};
type WalletRow = {
  userId: string;
  name: string;
  email: string;
  planId: string;
  balance: number;
  lifetimeGranted: number;
  lifetimeSpent: number;
  monthlyOverride: number | null;
  note: string | null;
  spent30d: number;
  requests30d: number;
  periodStart: string;
  periodEnd: string;
  updatedAt: string;
};
type WalletList = { rows: WalletRow[]; total: number; page: number; perPage: number };
type UpgradeRow = {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  planId: string | null;
  tokensRequested: number;
  amountPhp: number;
  paymentMethod: string;
  referenceNo: string | null;
  receiptUrl: string | null;
  status: 'pending' | 'approved' | 'rejected';
  adminNote: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdAt: string;
};
type ProviderRow = {
  id: string;
  provider: string;
  keyAlias: string;
  agentIds: string[];
  monthlyQuota: number;
  usedUnits: number;
  status: string;
  cooldownUntil: string | null;
  lastError: string | null;
  lastUsedAt: string | null;
  updatedAt: string;
};
type Settings = {
  freeMonthlyTokens: number;
  costChatTurn: number;
  costVoiceMinute: number;
  costTts1kChars: number;
  costSttMinute: number;
  rateLimitPerMin: number;
  providerChains: Record<string, string[]>;
  updatedAt: string;
};
type VoiceRow = {
  id: string;
  agentId: string;
  language: string;
  voiceId: string;
  modelId: string;
  displayName: string | null;
  keyAlias: string | null;
  isActive: boolean;
};

type Tab = 'overview' | 'wallets' | 'upgrades' | 'providers' | 'limits';

const AGENTS = ['jen', 'adam', 'gentech', 'kevin', 'mika'];
const LANGUAGES = ['cebuano', 'filipino', 'english'];
const PROVIDERS = ['groq', 'openrouter', 'nvidia', 'gemini'];

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await adminApi(path, init);
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error || `Request failed (${response.status})`);
  }
  return response.json() as Promise<T>;
}

const fmt = (value: number): string => new Intl.NumberFormat('en-PH').format(Math.round(value));

function formatDate(value: string | null): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
}

const card = 'rounded-2xl border border-stone-200 bg-white p-5 shadow-xs dark:border-white/10 dark:bg-stone-900';
const label = 'text-[10px] font-bold uppercase tracking-wider text-stone-400';
const inputCls =
  'w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-xs font-semibold text-stone-900 outline-none focus:border-teal-500 dark:border-white/10 dark:bg-stone-950 dark:text-white';
const btnPrimary =
  'inline-flex items-center justify-center gap-1.5 rounded-xl bg-teal-600 px-3.5 py-2 text-xs font-bold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50';
const btnGhost =
  'inline-flex items-center justify-center gap-1.5 rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs font-bold text-stone-600 transition hover:bg-stone-50 disabled:opacity-50 dark:border-white/10 dark:bg-stone-900 dark:text-stone-300 dark:hover:bg-stone-800';

export function AiTokensView() {
  const { adminUser } = useAdminAuth();
  const [tab, setTab] = useState<Tab>('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const [overview, setOverview] = useState<Overview | null>(null);
  const [walletList, setWalletList] = useState<WalletList | null>(null);
  const [upgrades, setUpgrades] = useState<UpgradeRow[]>([]);
  const [providers, setProviders] = useState<ProviderRow[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [voices, setVoices] = useState<VoiceRow[]>([]);

  const [walletSearch, setWalletSearch] = useState('');
  const [upgradeStatus, setUpgradeStatus] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');

  const [grantTarget, setGrantTarget] = useState<WalletRow | null>(null);
  const [grantAmount, setGrantAmount] = useState('1000');
  const [grantReason, setGrantReason] = useState('Goodwill grant');
  const [saving, setSaving] = useState(false);
  const [reviewNote, setReviewNote] = useState('');

  const [voiceDraft, setVoiceDraft] = useState({ agentId: 'jen', language: 'cebuano', voiceId: '', displayName: '' });

  const showToast = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 3200);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [overviewData, walletData, upgradeData, providerData, settingsData, voiceData] = await Promise.all([
        api<Overview>('/api/admin/ai/tokens/overview'),
        api<WalletList>(
          `/api/admin/ai/tokens/wallets?search=${encodeURIComponent(walletSearch)}&page=1&perPage=100`
        ),
        api<UpgradeRow[]>(`/api/admin/ai/tokens/upgrades?status=${upgradeStatus}`),
        api<ProviderRow[]>('/api/admin/ai/tokens/providers'),
        api<Settings>('/api/admin/ai/tokens/settings'),
        api<VoiceRow[]>('/api/admin/ai/tokens/voice-profiles'),
      ]);
      setOverview(overviewData);
      setWalletList(walletData);
      setUpgrades(upgradeData);
      setProviders(providerData);
      setSettings(settingsData);
      setVoices(voiceData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load the AI token console.');
    } finally {
      setLoading(false);
    }
  }, [walletSearch, upgradeStatus]);

  useEffect(() => {
    void load();
  }, [load]);

  const totals = useMemo(() => {
    const spend = overview?.spentThisMonth ?? 0;
    const grant = overview?.grantedThisMonth ?? 0;
    return { spend, grant, burn: grant ? Math.round((spend / grant) * 100) : 0 };
  }, [overview]);

  const submitGrant = async () => {
    if (!grantTarget) return;
    const amount = Number(grantAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setError('Enter a positive token amount.');
      return;
    }
    setSaving(true);
    try {
      await api('/api/admin/ai/tokens/grant', {
        method: 'POST',
        body: JSON.stringify({
          userId: grantTarget.userId,
          amount,
          reason: grantReason,
          adminEmail: adminUser?.email ?? 'admin',
        }),
      });
      sounds.playTap();
      showToast(`Granted ${fmt(amount)} tokens to ${grantTarget.name}.`);
      setGrantTarget(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not grant tokens.');
    } finally {
      setSaving(false);
    }
  };

  const saveWallet = async (row: WalletRow, patch: { planId?: string; monthlyOverride?: number | null; note?: string }) => {
    setSaving(true);
    try {
      await api(`/api/admin/ai/tokens/wallets/${encodeURIComponent(row.userId)}`, {
        method: 'PATCH',
        body: JSON.stringify({ ...patch, adminEmail: adminUser?.email ?? 'admin' }),
      });
      showToast(`Updated limits for ${row.name}.`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update this wallet.');
    } finally {
      setSaving(false);
    }
  };

  const reviewUpgrade = async (row: UpgradeRow, action: 'approve' | 'reject') => {
    setSaving(true);
    try {
      await api(`/api/admin/ai/tokens/upgrades/${row.id}/review`, {
        method: 'POST',
        body: JSON.stringify({ action, note: reviewNote || null, adminEmail: adminUser?.email ?? 'admin' }),
      });
      sounds.playTap();
      showToast(`${action === 'approve' ? 'Approved' : 'Rejected'} ${row.userName}'s top-up.`);
      setReviewNote('');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not review this request.');
    } finally {
      setSaving(false);
    }
  };

  const updateProvider = async (row: ProviderRow, patch: { status?: string; monthlyQuota?: number }) => {
    setSaving(true);
    try {
      await api(`/api/admin/ai/tokens/providers/${encodeURIComponent(row.id)}`, {
        method: 'PATCH',
        body: JSON.stringify(patch),
      });
      showToast(`Updated ${row.provider} (${row.keyAlias}).`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update this provider.');
    } finally {
      setSaving(false);
    }
  };

  const [settingsDraft, setSettingsDraft] = useState<Settings | null>(null);
  useEffect(() => {
    if (settings) setSettingsDraft((current) => current ?? settings);
  }, [settings]);

  const saveSettings = async () => {
    if (!settingsDraft) return;
    setSaving(true);
    try {
      const updated = await api<Settings>('/api/admin/ai/tokens/settings', {
        method: 'PUT',
        body: JSON.stringify(settingsDraft),
      });
      setSettings(updated);
      setSettingsDraft(updated);
      showToast('Global AI limits saved. Learners see the change on their next turn.');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save settings.');
    } finally {
      setSaving(false);
    }
  };

  const saveVoice = async () => {
    if (!voiceDraft.voiceId.trim()) {
      setError('Paste the ElevenLabs voice id first.');
      return;
    }
    setSaving(true);
    try {
      await api('/api/admin/ai/tokens/voice-profiles', {
        method: 'PUT',
        body: JSON.stringify({ ...voiceDraft, modelId: 'eleven_multilingual_v2' }),
      });
      showToast(`Voice saved for ${voiceDraft.agentId} · ${voiceDraft.language}.`);
      setVoiceDraft((draft) => ({ ...draft, voiceId: '', displayName: '' }));
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save this voice.');
    } finally {
      setSaving(false);
    }
  };

  const maxTrend = Math.max(1, ...(overview?.trend.map((point) => point.value) ?? [1]));

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-black text-stone-900 dark:text-white">
            <Coins className="h-5 w-5 text-teal-600" />
            AI Tokens & Usage
          </h2>
          <p className="mt-0.5 text-xs text-stone-500">
            Per-learner wallets, provider routing and GCash top-up approvals.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" className={btnGhost} onClick={() => void load()} disabled={loading}>
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1.5 rounded-2xl border border-stone-200 bg-white p-1.5 dark:border-white/10 dark:bg-stone-900">
        {(
          [
            ['overview', 'Overview', TrendingUp],
            ['wallets', 'Wallets', Wallet],
            ['upgrades', 'Top-ups', ArrowUpRight],
            ['providers', 'Providers', Server],
            ['limits', 'Limits & Voices', Sliders],
          ] as [Tab, string, typeof Coins][]
        ).map(([id, text, Icon]) => (
          <button
            key={id}
            type="button"
            onClick={() => {
              sounds.playTap();
              setTab(id);
            }}
            className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition ${
              tab === id
                ? 'bg-teal-600 text-white shadow-sm'
                : 'text-stone-500 hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-stone-800'
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            {text}
            {id === 'upgrades' && (overview?.pendingUpgrades ?? 0) > 0 && (
              <span className="ml-1 rounded-full bg-rose-500 px-1.5 py-0.5 text-[9px] font-black text-white">
                {overview?.pendingUpgrades}
              </span>
            )}
          </button>
        ))}
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span className="flex-1">{error}</span>
          <button type="button" onClick={() => setError(null)} className="font-black">
            ×
          </button>
        </div>
      )}

      {toast && (
        <div className="flex items-center gap-2 rounded-2xl border border-teal-200 bg-teal-50 p-3 text-xs font-bold text-teal-800 dark:border-teal-500/30 dark:bg-teal-500/10 dark:text-teal-300">
          <CheckCircle2 className="h-4 w-4" />
          {toast}
        </div>
      )}

      {loading && !overview ? (
        <div className={`${card} flex items-center justify-center gap-2 py-16 text-sm font-semibold text-stone-400`}>
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading token economy…
        </div>
      ) : (
        <>
          {/* ---------------------------------------------------------------- */}
          {/* OVERVIEW */}
          {/* ---------------------------------------------------------------- */}
          {tab === 'overview' && overview && (
            <div className="space-y-5">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {[
                  { label: 'Tokens in wallets', value: fmt(overview.totalBalance), hint: `${overview.totalWallets} wallets`, icon: Wallet, tone: 'text-teal-600' },
                  { label: 'Spent this month', value: fmt(totals.spend), hint: `${totals.burn}% of grants burned`, icon: TrendingUp, tone: 'text-rose-500' },
                  { label: 'Granted this month', value: fmt(totals.grant), hint: 'Free + purchases + admin grants', icon: Coins, tone: 'text-violet-500' },
                  { label: 'Active learners (30d)', value: fmt(overview.activeUsers30d), hint: `${overview.pendingUpgrades} top-ups waiting`, icon: Users, tone: 'text-amber-500' },
                ].map((stat) => (
                  <div key={stat.label} className={card}>
                    <div className="flex items-start justify-between">
                      <span className={label}>{stat.label}</span>
                      <stat.icon className={`h-4 w-4 ${stat.tone}`} />
                    </div>
                    <p className="mt-2 text-2xl font-black text-stone-900 dark:text-white">{stat.value}</p>
                    <p className="mt-0.5 text-[10px] font-semibold text-stone-400">{stat.hint}</p>
                  </div>
                ))}
              </div>

              <div className="grid gap-5 lg:grid-cols-3">
                <div className={`${card} lg:col-span-2`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-black text-stone-900 dark:text-white">Daily token spend</h3>
                      <p className="text-[10px] font-semibold text-stone-400">Last 7 days, from the ledger</p>
                    </div>
                    <Gauge className="h-4 w-4 text-stone-300" />
                  </div>
                  <div className="mt-5 flex h-40 items-end gap-2">
                    {overview.trend.map((point) => (
                      <div key={point.label} className="flex flex-1 flex-col items-center gap-1.5">
                        <span className="text-[9px] font-bold text-stone-400">{fmt(point.value)}</span>
                        <div
                          className="w-full rounded-t-lg bg-gradient-to-t from-teal-600 to-teal-400 transition-all"
                          style={{ height: `${Math.max(4, (point.value / maxTrend) * 100)}%` }}
                          title={`${point.label}: ${fmt(point.value)} tokens`}
                        />
                        <span className="text-[9px] font-bold text-stone-400">{point.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className={card}>
                  <h3 className="text-sm font-black text-stone-900 dark:text-white">Reliability (7d)</h3>
                  <dl className="mt-4 space-y-3">
                    {[
                      ['Cache hit rate', `${overview.cacheHitRate}%`, `${fmt(overview.cachedRequests7d)} cached`],
                      ['Avg latency', `${fmt(overview.avgLatencyMs)} ms`, 'provider round-trip'],
                      ['Failed calls', fmt(overview.failedRequests7d), 'after all fallbacks'],
                    ].map(([title, value, hint]) => (
                      <div key={title} className="flex items-center justify-between gap-2">
                        <div>
                          <dt className="text-[11px] font-bold text-stone-700 dark:text-stone-200">{title}</dt>
                          <dd className="text-[9.5px] font-semibold text-stone-400">{hint}</dd>
                        </div>
                        <span className="text-sm font-black text-stone-900 dark:text-white">{value}</span>
                      </div>
                    ))}
                  </dl>
                </div>
              </div>

              <div className="grid gap-5 lg:grid-cols-2">
                <div className={card}>
                  <h3 className="text-sm font-black text-stone-900 dark:text-white">Spend by capability</h3>
                  <div className="mt-4 space-y-3">
                    {overview.byMode.length === 0 && (
                      <p className="text-xs font-semibold text-stone-400">No spend recorded yet.</p>
                    )}
                    {overview.byMode.map((row) => {
                      const total = Math.max(1, overview.byMode.reduce((sum, item) => sum + item.tokens, 0));
                      return (
                        <div key={row.mode}>
                          <div className="flex items-center justify-between text-[11px] font-bold">
                            <span className="capitalize text-stone-700 dark:text-stone-200">{row.mode}</span>
                            <span className="text-stone-500">
                              {fmt(row.tokens)} <span className="font-semibold text-stone-400">· {row.requests} calls</span>
                            </span>
                          </div>
                          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-stone-100 dark:bg-white/5">
                            <div
                              className="h-full rounded-full bg-teal-500"
                              style={{ width: `${(row.tokens / total) * 100}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className={card}>
                  <h3 className="text-sm font-black text-stone-900 dark:text-white">Provider traffic</h3>
                  <div className="mt-4 space-y-2">
                    {overview.byProvider.map((row) => (
                      <div
                        key={row.provider}
                        className="flex items-center justify-between rounded-xl bg-stone-50 px-3 py-2 dark:bg-stone-950"
                      >
                        <div>
                          <p className="text-[11px] font-black capitalize text-stone-800 dark:text-white">{row.provider}</p>
                          <p className="text-[9.5px] font-semibold text-stone-400">
                            {fmt(row.tokens)} provider tokens · {fmt(row.avgLatencyMs)} ms avg
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[11px] font-black text-stone-800 dark:text-white">{fmt(row.requests)}</p>
                          <p className={`text-[9.5px] font-bold ${row.failed ? 'text-rose-500' : 'text-teal-600'}`}>
                            {row.failed ? `${row.failed} failed` : 'healthy'}
                          </p>
                        </div>
                      </div>
                    ))}
                    {overview.byProvider.length === 0 && (
                      <p className="text-xs font-semibold text-stone-400">No provider calls yet.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ---------------------------------------------------------------- */}
          {/* WALLETS */}
          {/* ---------------------------------------------------------------- */}
          {tab === 'wallets' && (
            <div className="space-y-3">
              <div className="relative max-w-sm">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-stone-400" />
                <input
                  value={walletSearch}
                  onChange={(event) => setWalletSearch(event.target.value)}
                  placeholder="Search learner, email or user id…"
                  className={`${inputCls} pl-9`}
                />
              </div>

              <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white dark:border-white/10 dark:bg-stone-900">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-stone-50 text-[10px] uppercase tracking-wider text-stone-400 dark:bg-stone-950">
                      <tr>
                        <th className="px-4 py-3 font-bold">Learner</th>
                        <th className="px-4 py-3 font-bold">Plan</th>
                        <th className="px-4 py-3 text-right font-bold">Balance</th>
                        <th className="px-4 py-3 text-right font-bold">Spent 30d</th>
                        <th className="px-4 py-3 text-right font-bold">Monthly cap</th>
                        <th className="px-4 py-3 font-bold">Renews</th>
                        <th className="px-4 py-3 text-right font-bold">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 dark:divide-white/5">
                      {(walletList?.rows ?? []).map((row) => (
                        <tr key={row.userId} className="hover:bg-stone-50/70 dark:hover:bg-white/[0.02]">
                          <td className="px-4 py-3">
                            <p className="font-bold text-stone-800 dark:text-white">{row.name}</p>
                            <p className="truncate text-[10px] font-semibold text-stone-400">{row.email || row.userId}</p>
                          </td>
                          <td className="px-4 py-3">
                            <PlanSelect
                              value={row.planId}
                              disabled={saving}
                              onChange={(planId) => void saveWallet(row, { planId })}
                            />
                          </td>
                          <td className="px-4 py-3 text-right font-black text-stone-900 dark:text-white">
                            {fmt(row.balance)}
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-stone-600 dark:text-stone-300">
                            {fmt(row.spent30d)}
                            <span className="block text-[9.5px] font-semibold text-stone-400">{row.requests30d} calls</span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <input
                              type="number"
                              min={0}
                              defaultValue={row.monthlyOverride ?? ''}
                              placeholder="global"
                              onBlur={(event) => {
                                const raw = event.target.value.trim();
                                const next = raw === '' ? null : Number(raw);
                                if (next !== row.monthlyOverride) {
                                  void saveWallet(row, { monthlyOverride: next });
                                }
                              }}
                              className="w-24 rounded-lg border border-stone-200 bg-stone-50 px-2 py-1.5 text-right text-[11px] font-bold text-stone-800 outline-none focus:border-teal-500 dark:border-white/10 dark:bg-stone-950 dark:text-white"
                            />
                          </td>
                          <td className="px-4 py-3 text-[10px] font-semibold text-stone-400">{formatDate(row.periodEnd)}</td>
                          <td className="px-4 py-3 text-right">
                            <button
                              type="button"
                              className={btnGhost}
                              onClick={() => {
                                setGrantTarget(row);
                                setGrantAmount('1000');
                                setGrantReason('Goodwill grant');
                              }}
                            >
                              <Coins className="h-3.5 w-3.5" />
                              Grant
                            </button>
                          </td>
                        </tr>
                      ))}
                      {(walletList?.rows ?? []).length === 0 && (
                        <tr>
                          <td colSpan={7} className="px-4 py-10 text-center text-xs font-semibold text-stone-400">
                            No wallets match this search.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
              <p className="text-[10px] font-semibold text-stone-400">
                Showing {walletList?.rows.length ?? 0} of {walletList?.total ?? 0} wallets. Leave the monthly cap
                empty to inherit the global free allowance.
              </p>
            </div>
          )}

          {/* ---------------------------------------------------------------- */}
          {/* UPGRADES */}
          {/* ---------------------------------------------------------------- */}
          {tab === 'upgrades' && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-1.5">
                {(['pending', 'approved', 'rejected', 'all'] as const).map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setUpgradeStatus(status)}
                    className={`rounded-xl px-3 py-1.5 text-[11px] font-bold capitalize transition ${
                      upgradeStatus === status
                        ? 'bg-stone-900 text-white dark:bg-white dark:text-stone-900'
                        : 'bg-stone-100 text-stone-500 hover:bg-stone-200 dark:bg-stone-800 dark:text-stone-300'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>

              <div className="grid gap-3 lg:grid-cols-2">
                {upgrades.map((row) => (
                  <div key={row.id} className={card}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-black text-stone-900 dark:text-white">{row.userName}</p>
                        <p className="text-[10px] font-semibold text-stone-400">{row.userEmail || row.userId}</p>
                      </div>
                      <StatusBadge status={row.status} />
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
                      <Detail title="Tokens" value={fmt(row.tokensRequested)} />
                      <Detail title="Amount" value={`₱${fmt(row.amountPhp)}`} />
                      <Detail title="Plan" value={row.planId ?? 'add-on'} />
                      <Detail title="Method" value={row.paymentMethod.toUpperCase()} />
                      <Detail title="Reference" value={row.referenceNo ?? '—'} />
                      <Detail title="Requested" value={formatDate(row.createdAt)} />
                    </div>

                    {row.receiptUrl ? (
                      <a
                        href={row.receiptUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-3 inline-flex items-center gap-1 text-[11px] font-bold text-teal-600 hover:underline"
                      >
                        <ArrowUpRight className="h-3.5 w-3.5" />
                        Open GCash receipt
                      </a>
                    ) : (
                      <p className="mt-3 text-[10px] font-semibold text-stone-400">No receipt attached.</p>
                    )}

                    {row.status === 'pending' ? (
                      <div className="mt-3 space-y-2">
                        <input
                          value={reviewNote}
                          onChange={(event) => setReviewNote(event.target.value)}
                          placeholder="Review note (optional)"
                          className={inputCls}
                        />
                        <div className="flex gap-2">
                          <button
                            type="button"
                            className={`${btnPrimary} flex-1`}
                            disabled={saving}
                            onClick={() => void reviewUpgrade(row, 'approve')}
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Approve & credit
                          </button>
                          <button
                            type="button"
                            className={`${btnGhost} flex-1`}
                            disabled={saving}
                            onClick={() => void reviewUpgrade(row, 'reject')}
                          >
                            <XCircle className="h-3.5 w-3.5" />
                            Reject
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="mt-3 text-[10px] font-semibold text-stone-400">
                        Reviewed by {row.reviewedBy ?? 'admin'} · {formatDate(row.reviewedAt)}
                        {row.adminNote ? ` · ${row.adminNote}` : ''}
                      </p>
                    )}
                  </div>
                ))}
                {upgrades.length === 0 && (
                  <div className={`${card} py-12 text-center text-xs font-semibold text-stone-400 lg:col-span-2`}>
                    No {upgradeStatus === 'all' ? '' : upgradeStatus} top-up requests.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ---------------------------------------------------------------- */}
          {/* PROVIDERS */}
          {/* ---------------------------------------------------------------- */}
          {tab === 'providers' && (
            <div className="space-y-3">
              <p className="text-[11px] font-semibold text-stone-500">
                Each character starts on a different provider so free tiers last. Changing a provider here takes effect
                on the next turn.
              </p>
              <div className="grid gap-3 md:grid-cols-2">
                {providers.map((row) => (
                  <div key={row.id} className={card}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-black capitalize text-stone-900 dark:text-white">{row.provider}</p>
                        <p className="text-[10px] font-mono font-semibold text-stone-400">{row.keyAlias}</p>
                      </div>
                      <select
                        value={row.status}
                        onChange={(event) => void updateProvider(row, { status: event.target.value })}
                        className="rounded-lg border border-stone-200 bg-stone-50 px-2 py-1 text-[10px] font-bold text-stone-700 outline-none dark:border-white/10 dark:bg-stone-950 dark:text-stone-200"
                      >
                        {['active', 'cooling', 'exhausted', 'disabled'].map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
                      <Detail title="Requests used" value={fmt(row.usedUnits)} />
                      <Detail title="Monthly quota" value={row.monthlyQuota ? fmt(row.monthlyQuota) : 'unlimited'} />
                      <Detail title="Last used" value={formatDate(row.lastUsedAt)} />
                      <Detail title="Agents" value={row.agentIds.length ? row.agentIds.join(', ') : 'any'} />
                    </div>
                    <div className="mt-3 flex items-end gap-2">
                      <label className="flex-1">
                        <span className={label}>Quota</span>
                        <input
                          type="number"
                          min={0}
                          defaultValue={row.monthlyQuota}
                          onBlur={(event) => {
                            const next = Number(event.target.value);
                            if (next !== row.monthlyQuota) void updateProvider(row, { monthlyQuota: next });
                          }}
                          className={`${inputCls} mt-1`}
                        />
                      </label>
                    </div>
                    {row.lastError && (
                      <p className="mt-2 line-clamp-2 text-[10px] font-semibold text-rose-500">{row.lastError}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ---------------------------------------------------------------- */}
          {/* LIMITS + VOICES */}
          {/* ---------------------------------------------------------------- */}
          {tab === 'limits' && settingsDraft && (
            <div className="grid gap-5 lg:grid-cols-2">
              <div className={card}>
                <h3 className="text-sm font-black text-stone-900 dark:text-white">Token economy</h3>
                <p className="text-[10px] font-semibold text-stone-400">
                  Applies to every learner unless their wallet has a custom cap.
                </p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {[
                    ['freeMonthlyTokens', 'Free monthly tokens'],
                    ['costChatTurn', 'Cost · chat turn'],
                    ['costVoiceMinute', 'Cost · voice minute'],
                    ['costTts1kChars', 'Cost · TTS / 1k chars'],
                    ['costSttMinute', 'Cost · STT / minute'],
                    ['rateLimitPerMin', 'Rate limit / minute'],
                  ].map(([key, text]) => (
                    <label key={key}>
                      <span className={label}>{text}</span>
                      <input
                        type="number"
                        min={0}
                        value={settingsDraft[key as keyof Settings] as number}
                        onChange={(event) =>
                          setSettingsDraft({ ...settingsDraft, [key]: Number(event.target.value) })
                        }
                        className={`${inputCls} mt-1`}
                      />
                    </label>
                  ))}
                </div>
                <button type="button" className={`${btnPrimary} mt-4`} disabled={saving} onClick={() => void saveSettings()}>
                  {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sliders className="h-3.5 w-3.5" />}
                  Save limits
                </button>
              </div>

              <div className={card}>
                <h3 className="text-sm font-black text-stone-900 dark:text-white">Provider chains</h3>
                <p className="text-[10px] font-semibold text-stone-400">
                  First provider wins; the rest are fallbacks. Leave one per line.
                </p>
                <div className="mt-4 space-y-3">
                  {AGENTS.map((agent) => (
                    <label key={agent} className="block">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500">{agent}</span>
                      <textarea
                        rows={2}
                        value={(settingsDraft.providerChains[agent] ?? []).join('\n')}
                        onChange={(event) =>
                          setSettingsDraft({
                            ...settingsDraft,
                            providerChains: {
                              ...settingsDraft.providerChains,
                              [agent]: event.target.value
                                .split(/\s+/)
                                .map((entry) => entry.trim().toLowerCase())
                                .filter((entry) => PROVIDERS.includes(entry)),
                            },
                          })
                        }
                        className={`${inputCls} mt-1 font-mono text-[11px]`}
                      />
                    </label>
                  ))}
                </div>
                <button type="button" className={`${btnPrimary} mt-4`} disabled={saving} onClick={() => void saveSettings()}>
                  <Sliders className="h-3.5 w-3.5" />
                  Save chains
                </button>
              </div>

              <div className={`${card} lg:col-span-2`}>
                <h3 className="flex items-center gap-2 text-sm font-black text-stone-900 dark:text-white">
                  <Mic className="h-4 w-4 text-teal-600" />
                  Character voices
                </h3>
                <p className="text-[10px] font-semibold text-stone-400">
                  ElevenLabs is only used for speech-to-text and text-to-speech. Each character keeps its own key and
                  must speak the matching language.
                </p>

                <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                  {voices.map((voice) => (
                    <div
                      key={voice.id}
                      className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 dark:border-white/10 dark:bg-stone-950"
                    >
                      <p className="text-[11px] font-black capitalize text-stone-800 dark:text-white">
                        {voice.agentId} · {voice.language}
                      </p>
                      <p className="truncate font-mono text-[10px] font-semibold text-stone-400">{voice.voiceId}</p>
                    </div>
                  ))}
                  {voices.length === 0 && (
                    <p className="text-xs font-semibold text-stone-400">
                      No overrides yet — the gateway is using its built-in voice table.
                    </p>
                  )}
                </div>

                <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
                  <select
                    value={voiceDraft.agentId}
                    onChange={(event) => setVoiceDraft({ ...voiceDraft, agentId: event.target.value })}
                    className={inputCls}
                  >
                    {AGENTS.map((agent) => (
                      <option key={agent} value={agent}>
                        {agent}
                      </option>
                    ))}
                  </select>
                  <select
                    value={voiceDraft.language}
                    onChange={(event) => setVoiceDraft({ ...voiceDraft, language: event.target.value })}
                    className={inputCls}
                  >
                    {LANGUAGES.map((language) => (
                      <option key={language} value={language}>
                        {language}
                      </option>
                    ))}
                  </select>
                  <input
                    value={voiceDraft.voiceId}
                    onChange={(event) => setVoiceDraft({ ...voiceDraft, voiceId: event.target.value.trim() })}
                    placeholder="ElevenLabs voice id"
                    className={`${inputCls} font-mono`}
                  />
                  <input
                    value={voiceDraft.displayName}
                    onChange={(event) => setVoiceDraft({ ...voiceDraft, displayName: event.target.value })}
                    placeholder="Label (optional)"
                    className={inputCls}
                  />
                  <button type="button" className={btnPrimary} disabled={saving} onClick={() => void saveVoice()}>
                    <Mic className="h-3.5 w-3.5" />
                    Save voice
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Grant modal */}
      {grantTarget && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-stone-950/50 p-4 backdrop-blur-sm sm:items-center">
          <div className="w-full max-w-sm rounded-2xl border border-stone-200 bg-white p-5 shadow-2xl dark:border-white/10 dark:bg-stone-900">
            <h3 className="text-sm font-black text-stone-900 dark:text-white">Grant tokens</h3>
            <p className="mt-0.5 text-[11px] font-semibold text-stone-400">
              {grantTarget.name} · balance {fmt(grantTarget.balance)}
            </p>

            <label className="mt-4 block">
              <span className={label}>Amount</span>
              <input
                type="number"
                min={1}
                value={grantAmount}
                onChange={(event) => setGrantAmount(event.target.value)}
                className={`${inputCls} mt-1`}
              />
            </label>
            <label className="mt-3 block">
              <span className={label}>Reason</span>
              <input
                value={grantReason}
                onChange={(event) => setGrantReason(event.target.value)}
                className={`${inputCls} mt-1`}
              />
            </label>

            <div className="mt-4 flex gap-2">
              <button type="button" className={`${btnPrimary} flex-1`} disabled={saving} onClick={() => void submitGrant()}>
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Coins className="h-3.5 w-3.5" />}
                Grant
              </button>
              <button type="button" className={`${btnGhost} flex-1`} onClick={() => setGrantTarget(null)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Detail({ title, value }: { title: string; value: string }) {
  return (
    <div>
      <p className="text-[9px] font-bold uppercase tracking-wider text-stone-400">{title}</p>
      <p className="truncate text-[11px] font-bold text-stone-700 dark:text-stone-200">{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: UpgradeRow['status'] }) {
  const tone =
    status === 'approved'
      ? 'bg-teal-50 text-teal-700 dark:bg-teal-500/10 dark:text-teal-300'
      : status === 'rejected'
        ? 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-300'
        : 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300';
  return (
    <span className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wide ${tone}`}>
      {status}
    </span>
  );
}

function PlanSelect({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (planId: string) => void;
  disabled?: boolean;
}) {
  return (
    <select
      value={value}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value)}
      className="rounded-lg border border-stone-200 bg-stone-50 px-2 py-1 text-[10px] font-bold capitalize text-stone-700 outline-none dark:border-white/10 dark:bg-stone-950 dark:text-stone-200"
    >
      {['free', 'plus', 'pro'].map((plan) => (
        <option key={plan} value={plan}>
          {plan}
        </option>
      ))}
    </select>
  );
}
