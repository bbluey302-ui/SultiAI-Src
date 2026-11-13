'use client';

import { useState } from 'react';
import { DonutChart, LineChart, chartColor } from '@/components/ChartCard';
import { PageHeader } from '@/components/PageHeader';
import { Stagger, StaggerItem } from '@/components/motion';
import { StatCard } from '@/components/StatCard';
import { useToast } from '@/components/Toast';
import {
  Card,
  CardHeader,
  ErrorState,
  LoadingState,
  ghostBtn,
  inputCls,
  primaryBtn,
  selectCls,
  softBtn,
  tabStrip,
  tabStripBtn,
  tableHeadTh,
  tableHeadThRight,
  tableTd,
} from '@/components/ui';
import { useAsync } from '@/hooks/useAsync';
import { api } from '@/lib/api';
import { downloadCsv } from '@/lib/export';
import type { AiWalletRow } from '@/types';

type Tab = 'overview' | 'wallets' | 'upgrades' | 'providers' | 'limits';

const TABS: { id: Tab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'wallets', label: 'Wallets' },
  { id: 'upgrades', label: 'Upgrades' },
  { id: 'providers', label: 'Providers' },
  { id: 'limits', label: 'Limits' },
];

const AGENTS = ['jen', 'adam', 'gentech', 'kevin', 'mika'];
const PROVIDERS = ['groq', 'openrouter', 'nvidia', 'gemini'];

function num(value: string): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function fmt(value: number): string {
  return Math.round(value).toLocaleString('en-PH');
}

function pesos(value: number): string {
  return `₱${Number(value || 0).toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function shortDate(iso: string | null): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
  } catch {
    return '—';
  }
}

export default function AdminAiTokensPage() {
  const toast = useToast();
  const [tab, setTab] = useState<Tab>('overview');
  const [search, setSearch] = useState('');
  const [busy, setBusy] = useState<string | null>(null);

  // Wallet editor
  const [editing, setEditing] = useState<AiWalletRow | null>(null);
  const [editingPlan, setEditingPlan] = useState('free');
  const [editingLimit, setEditingLimit] = useState('');
  const [editingNote, setEditingNote] = useState('');
  const [grantAmount, setGrantAmount] = useState('500');
  const [adjustAmount, setAdjustAmount] = useState('');

  // Upgrade review
  const [upgradeNote, setUpgradeNote] = useState('');

  // Provider editor
  const [providerEdits, setProviderEdits] = useState<Record<string, { status: string; quota: string }>>({});

  // Limits form
  const [limits, setLimits] = useState<Record<string, string>>({});
  const [chains, setChains] = useState<Record<string, string>>({});

  // Voice profile form
  const [voiceAgent, setVoiceAgent] = useState('jen');
  const [voiceLanguage, setVoiceLanguage] = useState('cebuano');
  const [voiceId, setVoiceId] = useState('');
  const [voiceName, setVoiceName] = useState('');

  const { data, loading, error, reload } = useAsync(async () => {
    const [overview, wallets, providers, settings, upgrades, voices] = await Promise.all([
      api.getAiTokenOverview(),
      api.listAiWallets('', 1, 100),
      api.listAiProviders(),
      api.getAiSettings(),
      api.listAiUpgrades('pending'),
      api.listAiVoiceProfiles(),
    ]);
    return { overview, wallets, providers, settings, upgrades, voices };
  }, []);

  const startEdit = (row: AiWalletRow) => {
    setEditing(row);
    setEditingPlan(row.planId);
    setEditingLimit(row.monthlyOverride === null ? '' : String(row.monthlyOverride));
    setEditingNote(row.note ?? '');
    setGrantAmount('500');
    setAdjustAmount('');
    setTab('wallets');
  };

  const requireData = () => {
    if (!data) {
      toast.push('error', 'Data is still loading.');
      return false;
    }
    return true;
  };

  const run = async (key: string, action: () => Promise<unknown>, message: string) => {
    setBusy(key);
    try {
      await action();
      toast.push('success', message);
      reload();
    } catch (err) {
      toast.push('error', err instanceof Error ? err.message : 'Action failed.');
    } finally {
      setBusy(null);
    }
  };

  const saveWallet = () =>
    editing &&
    run(
      'wallet-save',
      () =>
        api.updateAiWallet(editing.userId, {
          planId: editingPlan,
          monthlyOverride: editingLimit.trim() === '' ? null : num(editingLimit),
          note: editingNote.trim() || null,
          adjustBalance: adjustAmount.trim() === '' ? undefined : num(adjustAmount),
        }),
      `Updated ${editing.name}'s wallet.`
    ).then(() => {
      setEditing(null);
      setAdjustAmount('');
    });

  if (loading) return <LoadingState label="Loading AI token economy..." />;
  if (error || !data) {
    return <ErrorState message={error ?? 'Failed to load AI token data'} onRetry={reload} />;
  }

  const { overview, wallets, providers, settings, upgrades, voices } = data;

  const filteredWallets = wallets.rows.filter((row) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      row.name.toLowerCase().includes(q) ||
      row.email.toLowerCase().includes(q) ||
      row.userId.toLowerCase().includes(q)
    );
  });

  const limitValue = (key: string, fallback: number) =>
    limits[key] !== undefined ? limits[key] : String(fallback);

  const chainValue = (agent: string) =>
    chains[agent] !== undefined
      ? chains[agent]
      : (settings.providerChains[agent] ?? []).join(', ');

  const saveLimits = () =>
    run(
      'limits-save',
      () =>
        api.updateAiSettings({
          freeMonthlyTokens: num(limitValue('freeMonthlyTokens', settings.freeMonthlyTokens)),
          costChatTurn: num(limitValue('costChatTurn', settings.costChatTurn)),
          costVoiceMinute: num(limitValue('costVoiceMinute', settings.costVoiceMinute)),
          costTts1kChars: num(limitValue('costTts1kChars', settings.costTts1kChars)),
          costSttMinute: num(limitValue('costSttMinute', settings.costSttMinute)),
          rateLimitPerMin: num(limitValue('rateLimitPerMin', settings.rateLimitPerMin)),
          providerChains: Object.fromEntries(
            AGENTS.map((agent) => [
              agent,
              chainValue(agent)
                .split(',')
                .map((entry) => entry.trim())
                .filter((entry) => PROVIDERS.includes(entry)),
            ])
          ),
        }),
      'AI limits and provider chains saved.'
    );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="AI console"
        title="Tokens & Providers"
        description="Per-learner token wallets, provider rotation, quotas and GCash top-up approvals."
        actions={
          <button
            type="button"
            onClick={() =>
              downloadCsv(
                wallets.rows.map((row) => ({
                  userId: row.userId,
                  name: row.name,
                  email: row.email,
                  plan: row.planId,
                  balance: row.balance,
                  spent30d: row.spent30d,
                  requests30d: row.requests30d,
                  monthlyOverride: row.monthlyOverride ?? '',
                })),
                `sultiai-token-wallets-${new Date().toISOString().split('T')[0]}.csv`
              )
            }
            className={ghostBtn}
          >
            Export CSV
          </button>
        }
      />

      <div className={tabStrip}>
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={tabStripBtn(tab === item.id)}
          >
            {item.label}
            {item.id === 'upgrades' && overview.pendingUpgrades > 0 && (
              <span className="ml-1.5 rounded-full bg-warning-soft px-1.5 py-0.5 text-[10px] font-bold text-warning">
                {overview.pendingUpgrades}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* OVERVIEW                                                          */}
      {/* ---------------------------------------------------------------- */}
      {tab === 'overview' && (
        <div className="space-y-6">
          <Stagger className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" step={0.05}>
            <StaggerItem index={0}>
              <StatCard
                label="Token wallets"
                value={fmt(overview.totalWallets)}
                delta={`${fmt(overview.totalBalance)} tokens held`}
                icon="◈"
                emphasis
              />
            </StaggerItem>
            <StaggerItem index={1}>
              <StatCard
                label="Spent this month"
                value={fmt(overview.spentThisMonth)}
                delta={`${fmt(overview.grantedThisMonth)} granted`}
                tone="violet"
                icon="◎"
              />
            </StaggerItem>
            <StaggerItem index={2}>
              <StatCard
                label="Cache hit rate (7d)"
                value={`${overview.cacheHitRate}%`}
                delta={`${fmt(overview.cachedRequests7d)} cached replies`}
                tone={overview.cacheHitRate >= 20 ? 'green' : 'amber'}
                icon="⧉"
              />
            </StaggerItem>
            <StaggerItem index={3}>
              <StatCard
                label="Pending upgrades"
                value={fmt(overview.pendingUpgrades)}
                delta={`${fmt(overview.failedRequests7d)} failed calls · ${overview.avgLatencyMs} ms avg`}
                tone={overview.pendingUpgrades > 0 ? 'amber' : 'green'}
                icon="₱"
              />
            </StaggerItem>
          </Stagger>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="p-6">
              <CardHeader title="Tokens charged" subtitle="Last 7 days (uncached calls)" />
              <div className="pt-6">
                <LineChart data={overview.trend} color={chartColor(1)} gradientId="ai-tokens-trend" />
              </div>
            </Card>
            <Card className="p-6">
              <CardHeader title="Usage mix" subtitle="Token share by mode (30 days)" />
              <div className="pt-6">
                <DonutChart
                  data={overview.byMode.map((mode) => ({
                    label: mode.mode,
                    value: mode.tokens || mode.requests,
                  }))}
                />
              </div>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader title="Provider traffic" subtitle="Requests, charged tokens and latency" />
              <div className="overflow-x-auto">
                <table className="w-full min-w-[520px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-line">
                      <th className={tableHeadTh}>Provider</th>
                      <th className={tableHeadThRight}>Requests</th>
                      <th className={tableHeadThRight}>Tokens</th>
                      <th className={tableHeadThRight}>Failed</th>
                      <th className={tableHeadThRight}>Avg ms</th>
                    </tr>
                  </thead>
                  <tbody>
                    {overview.byProvider.length === 0 && (
                      <tr>
                        <td className={tableTd} colSpan={5}>
                          <span className="text-ink-faint">No AI calls recorded yet.</span>
                        </td>
                      </tr>
                    )}
                    {overview.byProvider.map((row) => (
                      <tr key={row.provider} className="border-b border-line last:border-0">
                        <td className={`${tableTd} font-semibold text-ink`}>{row.provider}</td>
                        <td className={`${tableTd} text-right tabular-nums text-ink-soft`}>
                          {fmt(row.requests)}
                        </td>
                        <td className={`${tableTd} text-right tabular-nums text-ink-soft`}>
                          {fmt(row.tokens)}
                        </td>
                        <td className={`${tableTd} text-right tabular-nums ${row.failed ? 'text-danger' : 'text-ink-soft'}`}>
                          {fmt(row.failed)}
                        </td>
                        <td className={`${tableTd} text-right tabular-nums text-ink-soft`}>
                          {fmt(row.avgLatencyMs)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            <Card>
              <CardHeader title="Top token users" subtitle="30-day spend" />
              <div className="overflow-x-auto">
                <table className="w-full min-w-[440px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-line">
                      <th className={tableHeadTh}>Learner</th>
                      <th className={tableHeadTh}>Plan</th>
                      <th className={tableHeadThRight}>Spent</th>
                      <th className={tableHeadThRight}>Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {overview.topUsers.length === 0 && (
                      <tr>
                        <td className={tableTd} colSpan={4}>
                          <span className="text-ink-faint">No wallets yet.</span>
                        </td>
                      </tr>
                    )}
                    {overview.topUsers.map((user) => (
                      <tr key={user.userId} className="border-b border-line last:border-0">
                        <td className={tableTd}>
                          <p className="font-semibold text-ink">{user.name}</p>
                          <p className="text-xs text-ink-faint">{user.email}</p>
                        </td>
                        <td className={`${tableTd} capitalize text-ink-soft`}>{user.planId}</td>
                        <td className={`${tableTd} text-right tabular-nums text-ink-soft`}>
                          {fmt(user.spent30d)}
                        </td>
                        <td className={`${tableTd} text-right tabular-nums font-semibold text-ink`}>
                          {fmt(user.balance)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* WALLETS                                                           */}
      {/* ---------------------------------------------------------------- */}
      {tab === 'wallets' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name, email or user id"
              className={`${inputCls} max-w-sm`}
            />
            <span className="text-xs text-ink-faint">
              {filteredWallets.length} of {wallets.total} wallets
            </span>
          </div>

          {editing && (
            <Card className="p-5">
              <CardHeader
                title={`Manage ${editing.name}`}
                subtitle={`${editing.email} · balance ${fmt(editing.balance)} tokens`}
              />
              <div className="grid gap-3 pt-4 sm:grid-cols-2 xl:grid-cols-4">
                <label className="block text-xs font-semibold text-ink-soft">
                  Plan
                  <select
                    value={editingPlan}
                    onChange={(event) => setEditingPlan(event.target.value)}
                    className={`${selectCls} mt-1 w-full`}
                  >
                    <option value="free">Free</option>
                    <option value="plus">Plus</option>
                    <option value="pro">Pro</option>
                  </select>
                </label>
                <label className="block text-xs font-semibold text-ink-soft">
                  Monthly limit (blank = plan)
                  <input
                    value={editingLimit}
                    onChange={(event) => setEditingLimit(event.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="e.g. 25000"
                    className={`${inputCls} mt-1 w-full`}
                  />
                </label>
                <label className="block text-xs font-semibold text-ink-soft">
                  Adjust balance (+ / -)
                  <input
                    value={adjustAmount}
                    onChange={(event) => setAdjustAmount(event.target.value.replace(/[^0-9-]/g, ''))}
                    placeholder="e.g. 1000 or -500"
                    className={`${inputCls} mt-1 w-full`}
                  />
                </label>
                <label className="block text-xs font-semibold text-ink-soft">
                  Note
                  <input
                    value={editingNote}
                    onChange={(event) => setEditingNote(event.target.value)}
                    placeholder="Reason / reference"
                    className={`${inputCls} mt-1 w-full`}
                  />
                </label>
              </div>
              <div className="flex flex-wrap items-center gap-2 pt-4">
                <button type="button" onClick={saveWallet} disabled={busy === 'wallet-save'} className={primaryBtn}>
                  {busy === 'wallet-save' ? 'Saving…' : 'Save changes'}
                </button>
                <div className="flex items-center gap-1.5">
                  <input
                    value={grantAmount}
                    onChange={(event) => setGrantAmount(event.target.value.replace(/[^0-9]/g, ''))}
                    className={`${inputCls} w-24`}
                    aria-label="Grant amount"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      run(
                        'grant',
                        () =>
                          api.grantAiTokens(
                            editing.userId,
                            num(grantAmount),
                            editingNote.trim() || 'Admin grant'
                          ),
                        `Granted ${fmt(num(grantAmount))} tokens.`
                      )
                    }
                    disabled={busy === 'grant' || num(grantAmount) <= 0}
                    className={softBtn}
                  >
                    Grant tokens
                  </button>
                </div>
                <button type="button" onClick={() => setEditing(null)} className={ghostBtn}>
                  Cancel
                </button>
              </div>
            </Card>
          )}

          <Card>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[840px] text-left text-sm">
                <thead>
                  <tr className="border-b border-line">
                    <th className={tableHeadTh}>Learner</th>
                    <th className={tableHeadTh}>Plan</th>
                    <th className={tableHeadThRight}>Balance</th>
                    <th className={tableHeadThRight}>Spent 30d</th>
                    <th className={tableHeadThRight}>Requests</th>
                    <th className={tableHeadTh}>Reset</th>
                    <th className={tableHeadThRight}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredWallets.length === 0 && (
                    <tr>
                      <td className={tableTd} colSpan={7}>
                        <span className="text-ink-faint">No wallets match this search.</span>
                      </td>
                    </tr>
                  )}
                  {filteredWallets.map((row) => (
                    <tr key={row.userId} className="border-b border-line last:border-0">
                      <td className={tableTd}>
                        <p className="font-semibold text-ink">{row.name}</p>
                        <p className="text-xs text-ink-faint">{row.email}</p>
                      </td>
                      <td className={tableTd}>
                        <span className="rounded-full bg-brand-soft px-2 py-0.5 text-[11px] font-bold uppercase text-brand-ink">
                          {row.planId}
                        </span>
                        {row.monthlyOverride !== null && (
                          <p className="mt-1 text-[10px] text-ink-faint">
                            limit {fmt(row.monthlyOverride)}
                          </p>
                        )}
                      </td>
                      <td className={`${tableTd} text-right font-semibold tabular-nums text-ink`}>
                        {fmt(row.balance)}
                      </td>
                      <td className={`${tableTd} text-right tabular-nums text-ink-soft`}>
                        {fmt(row.spent30d)}
                      </td>
                      <td className={`${tableTd} text-right tabular-nums text-ink-soft`}>
                        {fmt(row.requests30d)}
                      </td>
                      <td className={`${tableTd} text-xs text-ink-faint`}>{shortDate(row.periodEnd)}</td>
                      <td className={`${tableTd} text-right`}>
                        <button type="button" onClick={() => startEdit(row)} className={ghostBtn}>
                          Manage
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* UPGRADES                                                          */}
      {/* ---------------------------------------------------------------- */}
      {tab === 'upgrades' && (
        <div className="space-y-4">
          <Card className="p-5">
            <CardHeader
              title="Pending GCash top-ups"
              subtitle="Verify the reference number before approving. Approving credits tokens immediately."
            />
            <label className="mt-4 block text-xs font-semibold text-ink-soft">
              Admin note (applied to the next approval / rejection)
              <input
                value={upgradeNote}
                onChange={(event) => setUpgradeNote(event.target.value)}
                placeholder="e.g. Verified in GCash app"
                className={`${inputCls} mt-1 w-full max-w-lg`}
              />
            </label>
          </Card>

          <Card>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px] text-left text-sm">
                <thead>
                  <tr className="border-b border-line">
                    <th className={tableHeadTh}>Learner</th>
                    <th className={tableHeadTh}>Request</th>
                    <th className={tableHeadTh}>Reference</th>
                    <th className={tableHeadTh}>Submitted</th>
                    <th className={tableHeadThRight}>Decision</th>
                  </tr>
                </thead>
                <tbody>
                  {upgrades.length === 0 && (
                    <tr>
                      <td className={tableTd} colSpan={5}>
                        <span className="text-ink-faint">No pending top-up requests.</span>
                      </td>
                    </tr>
                  )}
                  {upgrades.map((row) => (
                    <tr key={row.id} className="border-b border-line last:border-0">
                      <td className={tableTd}>
                        <p className="font-semibold text-ink">{row.userName}</p>
                        <p className="text-xs text-ink-faint">{row.userEmail}</p>
                      </td>
                      <td className={tableTd}>
                        <p className="font-semibold text-ink">{fmt(row.tokensRequested)} tokens</p>
                        <p className="text-xs text-ink-faint">
                          {pesos(row.amountPhp)} · {row.planId ?? 'custom'} · {row.paymentMethod}
                        </p>
                      </td>
                      <td className={tableTd}>
                        <p className="font-mono text-xs text-ink">{row.referenceNo ?? '—'}</p>
                        {row.receiptUrl && (
                          <a
                            href={row.receiptUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-brand underline"
                          >
                            Receipt
                          </a>
                        )}
                      </td>
                      <td className={`${tableTd} text-xs text-ink-faint`}>{shortDate(row.createdAt)}</td>
                      <td className={`${tableTd} text-right`}>
                        <div className="flex justify-end gap-1.5">
                          <button
                            type="button"
                            disabled={busy === `upgrade-${row.id}`}
                            onClick={() =>
                              run(
                                `upgrade-${row.id}`,
                                () => api.reviewAiUpgrade(row.id, 'approve', upgradeNote.trim() || undefined),
                                `Approved ${row.userName}'s top-up.`
                              )
                            }
                            className={primaryBtn}
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            disabled={busy === `upgrade-${row.id}`}
                            onClick={() =>
                              run(
                                `upgrade-${row.id}`,
                                () => api.reviewAiUpgrade(row.id, 'reject', upgradeNote.trim() || undefined),
                                `Rejected ${row.userName}'s top-up.`
                              )
                            }
                            className={ghostBtn}
                          >
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* PROVIDERS                                                         */}
      {/* ---------------------------------------------------------------- */}
      {tab === 'providers' && (
        <div className="space-y-4">
          <Card className="p-5">
            <CardHeader
              title="Provider key slots"
              subtitle="Secrets stay in the server environment. This table tracks rotation state and quotas."
            />
            <div className="mt-4 flex flex-wrap gap-1.5">
              {PROVIDERS.map((provider) => {
                const rows = providers.filter((row) => row.provider === provider);
                return (
                  <span
                    key={provider}
                    className="rounded-full glass-2 px-2.5 py-1 text-[11px] font-semibold text-ink-soft"
                  >
                    {provider} · {rows.length} slot{rows.length === 1 ? '' : 's'}
                  </span>
                );
              })}
            </div>
          </Card>

          <Card>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead>
                  <tr className="border-b border-line">
                    <th className={tableHeadTh}>Slot</th>
                    <th className={tableHeadTh}>Agents</th>
                    <th className={tableHeadThRight}>Quota</th>
                    <th className={tableHeadTh}>Status</th>
                    <th className={tableHeadTh}>Last error</th>
                    <th className={tableHeadThRight}>Save</th>
                  </tr>
                </thead>
                <tbody>
                  {providers.map((row) => {
                    const edit = providerEdits[row.id] ?? {
                      status: row.status,
                      quota: String(row.monthlyQuota),
                    };
                    return (
                      <tr key={row.id} className="border-b border-line last:border-0">
                        <td className={tableTd}>
                          <p className="font-semibold text-ink">{row.provider}</p>
                          <p className="font-mono text-[11px] text-ink-faint">{row.keyAlias}</p>
                        </td>
                        <td className={`${tableTd} text-xs text-ink-soft`}>
                          {row.agentIds.join(', ') || '—'}
                        </td>
                        <td className={`${tableTd} text-right`}>
                          <input
                            value={edit.quota}
                            onChange={(event) =>
                              setProviderEdits((prev) => ({
                                ...prev,
                                [row.id]: { ...edit, quota: event.target.value.replace(/[^0-9]/g, '') },
                              }))
                            }
                            className={`${inputCls} w-28 text-right`}
                            aria-label={`${row.id} quota`}
                          />
                          <p className="mt-1 text-[10px] text-ink-faint">used {fmt(row.usedUnits)}</p>
                        </td>
                        <td className={tableTd}>
                          <select
                            value={edit.status}
                            onChange={(event) =>
                              setProviderEdits((prev) => ({
                                ...prev,
                                [row.id]: { ...edit, status: event.target.value },
                              }))
                            }
                            className={selectCls}
                          >
                            <option value="active">active</option>
                            <option value="cooling">cooling</option>
                            <option value="exhausted">exhausted</option>
                            <option value="disabled">disabled</option>
                          </select>
                        </td>
                        <td className={`${tableTd} max-w-[220px] truncate text-xs text-ink-faint`}>
                          {row.lastError ?? '—'}
                        </td>
                        <td className={`${tableTd} text-right`}>
                          <button
                            type="button"
                            className={ghostBtn}
                            disabled={busy === `provider-${row.id}`}
                            onClick={() =>
                              run(
                                `provider-${row.id}`,
                                () =>
                                  api.updateAiProvider(row.id, {
                                    status: edit.status,
                                    monthlyQuota: num(edit.quota),
                                  }),
                                `Updated ${row.id}.`
                              )
                            }
                          >
                            Save
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {providers.length === 0 && (
                    <tr>
                      <td className={tableTd} colSpan={6}>
                        <span className="text-ink-faint">No provider slots registered.</span>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* LIMITS                                                            */}
      {/* ---------------------------------------------------------------- */}
      {tab === 'limits' && (
        <div className="space-y-4">
          <Card className="p-5">
            <CardHeader
              title="Token costs & allowances"
              subtitle="Changes apply on the next request. The free allowance resets monthly."
            />
            <div className="grid gap-3 pt-4 sm:grid-cols-2 xl:grid-cols-3">
              {[
                { key: 'freeMonthlyTokens', label: 'Free monthly tokens', value: settings.freeMonthlyTokens },
                { key: 'costChatTurn', label: 'Cost per chat turn', value: settings.costChatTurn },
                { key: 'costVoiceMinute', label: 'Cost per voice minute', value: settings.costVoiceMinute },
                { key: 'costTts1kChars', label: 'Cost per 1k TTS chars', value: settings.costTts1kChars },
                { key: 'costSttMinute', label: 'Cost per STT minute', value: settings.costSttMinute },
                { key: 'rateLimitPerMin', label: 'Requests per minute', value: settings.rateLimitPerMin },
              ].map((field) => (
                <label key={field.key} className="block text-xs font-semibold text-ink-soft">
                  {field.label}
                  <input
                    value={limitValue(field.key, field.value)}
                    onChange={(event) =>
                      setLimits((prev) => ({
                        ...prev,
                        [field.key]: event.target.value.replace(/[^0-9]/g, ''),
                      }))
                    }
                    className={`${inputCls} mt-1 w-full`}
                  />
                </label>
              ))}
            </div>

            <div className="mt-5 border-t border-line pt-4">
              <p className="text-xs font-semibold text-ink-soft">
                Per-character provider chain (comma separated, in failover order)
              </p>
              <div className="mt-2 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {AGENTS.map((agent) => (
                  <label key={agent} className="block text-xs font-semibold text-ink-soft">
                    <span className="capitalize">{agent}</span>
                    <input
                      value={chainValue(agent)}
                      onChange={(event) =>
                        setChains((prev) => ({ ...prev, [agent]: event.target.value }))
                      }
                      placeholder="groq, openrouter, nvidia, gemini"
                      className={`${inputCls} mt-1 w-full font-mono text-[11px]`}
                    />
                  </label>
                ))}
              </div>
            </div>

            <button type="button" onClick={saveLimits} disabled={busy === 'limits-save'} className={`${primaryBtn} mt-4`}>
              {busy === 'limits-save' ? 'Saving…' : 'Save limits'}
            </button>
          </Card>

          <Card className="p-5">
            <CardHeader
              title="Voice profiles"
              subtitle="Map each character + language to an ElevenLabs voice id. Leave blank to use the built-in fallback."
            />
            <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
              <select value={voiceAgent} onChange={(event) => setVoiceAgent(event.target.value)} className={selectCls}>
                {AGENTS.map((agent) => (
                  <option key={agent} value={agent}>
                    {agent}
                  </option>
                ))}
              </select>
              <select
                value={voiceLanguage}
                onChange={(event) => setVoiceLanguage(event.target.value)}
                className={selectCls}
              >
                <option value="cebuano">cebuano</option>
                <option value="filipino">filipino</option>
                <option value="english">english</option>
              </select>
              <input
                value={voiceId}
                onChange={(event) => setVoiceId(event.target.value)}
                placeholder="ElevenLabs voice id"
                className={`${inputCls} font-mono text-[11px]`}
              />
              <input
                value={voiceName}
                onChange={(event) => setVoiceName(event.target.value)}
                placeholder="Display name (optional)"
                className={inputCls}
              />
              <button
                type="button"
                className={primaryBtn}
                disabled={!voiceId.trim() || busy === 'voice-save'}
                onClick={() =>
                  run(
                    'voice-save',
                    () =>
                      api.upsertAiVoiceProfile({
                        agentId: voiceAgent,
                        language: voiceLanguage,
                        voiceId: voiceId.trim(),
                        displayName: voiceName.trim() || undefined,
                      }),
                    `Saved ${voiceAgent}/${voiceLanguage} voice.`
                  ).then(() => {
                    setVoiceId('');
                    setVoiceName('');
                  })
                }
              >
                Save voice
              </button>
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[620px] text-left text-sm">
                <thead>
                  <tr className="border-b border-line">
                    <th className={tableHeadTh}>Character</th>
                    <th className={tableHeadTh}>Language</th>
                    <th className={tableHeadTh}>Voice id</th>
                    <th className={tableHeadTh}>Model</th>
                    <th className={tableHeadTh}>Name</th>
                  </tr>
                </thead>
                <tbody>
                  {voices.length === 0 && (
                    <tr>
                      <td className={tableTd} colSpan={5}>
                        <span className="text-ink-faint">
                          No custom voices yet — built-in free-tier voices are in use.
                        </span>
                      </td>
                    </tr>
                  )}
                  {voices.map((voice) => (
                    <tr key={voice.id} className="border-b border-line last:border-0">
                      <td className={`${tableTd} font-semibold capitalize text-ink`}>{voice.agentId}</td>
                      <td className={`${tableTd} capitalize text-ink-soft`}>{voice.language}</td>
                      <td className={`${tableTd} font-mono text-[11px] text-ink-soft`}>{voice.voiceId}</td>
                      <td className={`${tableTd} text-xs text-ink-faint`}>{voice.modelId}</td>
                      <td className={`${tableTd} text-xs text-ink-faint`}>{voice.displayName ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
