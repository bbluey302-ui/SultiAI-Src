import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  Coins,
  Info,
  Loader2,
  MessageSquare,
  Mic,
  ShieldCheck,
  Volume2,
  X,
  Zap,
} from 'lucide-react';
import {
  TokenApiError,
  TokenWalletSummary,
  UpgradeRequestSummary,
  fetchMyRequests,
  fetchWalletSummary,
  formatLedgerReason,
  formatTokens,
  submitTokenRequest,
  uploadReceipt,
} from '../../services/tokenService';
import { sounds } from '../../utils/soundEffects';

interface TokenStoreModalProps {
  onClose: () => void;
  /** Fired after a top-up request is accepted or the balance refreshes. */
  onChanged?: () => void;
}

const GCASH_NUMBER = (import.meta.env.VITE_GCASH_NUMBER as string | undefined)?.trim();

function peso(value: number): string {
  return `₱${(Number(value) || 0).toLocaleString('en-PH', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
}

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-amber-500/15 text-amber-600 dark:text-amber-300 border-amber-500/25',
  approved: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border-emerald-500/25',
  rejected: 'bg-rose-500/15 text-rose-600 dark:text-rose-300 border-rose-500/25',
  cancelled: 'bg-stone-500/15 text-stone-500 dark:text-stone-400 border-stone-500/25',
};

/**
 * Bottom-sheet token store.
 *
 * Free users get a monthly allowance; top-ups are manual GCash payments that an
 * admin approves. The sheet never mutates the balance itself — it only submits a
 * request, so the ledger stays server-authoritative.
 */
export const TokenStoreModal: React.FC<TokenStoreModalProps> = ({ onClose, onChanged }) => {
  const [summary, setSummary] = useState<TokenWalletSummary | null>(null);
  const [requests, setRequests] = useState<UpgradeRequestSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedPlan, setSelectedPlan] = useState<string>('');
  const [tokens, setTokens] = useState('');
  const [amount, setAmount] = useState('');
  const [reference, setReference] = useState('');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptUrl, setReceiptUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const [wallet, recent] = await Promise.all([fetchWalletSummary(), fetchMyRequests()]);
        if (!mounted) return;
        setSummary(wallet);
        setRequests(recent);
        const nextPlan =
          wallet.planOptions.find((p) => p.id === wallet.wallet.planId && p.id !== 'free') ??
          wallet.planOptions.find((p) => p.id === 'plus') ??
          wallet.planOptions.find((p) => p.id !== 'free') ??
          wallet.planOptions[0];
        if (nextPlan) {
          setSelectedPlan(nextPlan.id);
          setTokens(String(nextPlan.monthlyTokens));
          setAmount(String(nextPlan.pricePhp));
        }
      } catch (err) {
        if (!mounted) return;
        if (err instanceof TokenApiError && err.status === 401) {
          setError('Sign in to see your AI token wallet.');
        } else {
          setError(err instanceof Error ? err.message : 'Could not load your token wallet.');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };
    void load();
    return () => {
      mounted = false;
    };
  }, []);

  const buyablePlans = useMemo(
    () => (summary?.planOptions ?? []).filter((plan) => plan.id !== 'free'),
    [summary]
  );

  const balance = summary?.wallet.balance ?? 0;
  const allowance = summary?.plan?.monthlyTokens || 5000;
  const usedPct = allowance > 0 ? Math.min(100, Math.round(((allowance - balance) / allowance) * 100)) : 0;

  const choosePlan = (planId: string) => {
    sounds.playTap();
    setSelectedPlan(planId);
    setSubmitted(false);
    setFormError(null);
    const plan = summary?.planOptions.find((p) => p.id === planId);
    if (plan) {
      setTokens(String(plan.monthlyTokens));
      setAmount(String(plan.pricePhp));
    }
  };

  const handleSubmit = async () => {
    setFormError(null);
    const tokenValue = Number(tokens);
    if (!Number.isFinite(tokenValue) || tokenValue <= 0) {
      setFormError('Enter how many tokens you need.');
      return;
    }
    if (reference.trim().length < 4) {
      setFormError('Enter your GCash reference number (at least 4 characters).');
      return;
    }

    setSubmitting(true);
    try {
      let receiptPath: string | undefined;
      if (receiptFile) {
        setUploading(true);
        try {
          receiptPath = await uploadReceipt(receiptFile);
        } finally {
          setUploading(false);
        }
      }

      await submitTokenRequest({
        planId: selectedPlan || undefined,
        tokensRequested: tokenValue,
        amountPhp: Number(amount) || 0,
        paymentMethod: 'gcash',
        referenceNo: reference.trim(),
        receiptUrl: receiptPath || receiptUrl.trim() || undefined,
      });
      sounds.playTap();
      const [wallet, recent] = await Promise.all([fetchWalletSummary(), fetchMyRequests()]);
      setSummary(wallet);
      setRequests(recent);
      setSubmitted(true);
      setReference('');
      setReceiptUrl('');
      setReceiptFile(null);
      onChanged?.();
    } catch (err) {
      if (err instanceof TokenApiError && err.status === 401) {
        setFormError('Your session expired. Please sign in again.');
      } else {
        setFormError(err instanceof Error ? err.message : 'Could not submit your top-up request.');
      }
    } finally {
      setUploading(false);
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="AI token store"
    >
      <div
        className="relative w-full max-w-md max-h-[92vh] overflow-y-auto rounded-t-3xl border-t border-x border-stone-200/70 dark:border-white/10 bg-white dark:bg-[#0A121D] shadow-2xl animate-in slide-in-from-bottom duration-250"
        onClick={(event) => event.stopPropagation()}
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 20px)' }}
      >
        {/* Sticky sheet header */}
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 px-4 pt-3.5 pb-3 bg-white/95 dark:bg-[#0A121D]/95 backdrop-blur-md border-b border-stone-100 dark:border-white/5">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-xl bg-gradient-to-br from-teal-400 to-violet-500 flex items-center justify-center">
              <Coins className="w-4 h-4 text-white" />
            </span>
            <div className="leading-tight">
              <h2 className="text-sm font-black text-stone-900 dark:text-white font-display">
                AI Tokens
              </h2>
              <p className="text-[10px] font-medium text-stone-500 dark:text-stone-400">
                Powering every coach reply and voice line
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-100 dark:bg-white/10 text-stone-600 dark:text-stone-300 flex items-center justify-center active:scale-90 transition-transform cursor-pointer"
            aria-label="Close token store"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16">
            <Loader2 className="w-6 h-6 text-teal-500 animate-spin" />
            <p className="text-xs font-semibold text-stone-500 dark:text-stone-400">
              Loading your wallet…
            </p>
          </div>
        ) : error ? (
          <div className="m-4 rounded-2xl border border-rose-500/25 bg-rose-500/10 p-4">
            <p className="text-sm font-bold text-rose-600 dark:text-rose-300">{error}</p>
          </div>
        ) : (
          <div className="p-4 space-y-4">
            {/* Balance card */}
            <div className="relative overflow-hidden rounded-2xl p-4 bg-gradient-to-br from-teal-600 via-teal-600 to-violet-600 shadow-lg shadow-teal-900/20">
              <div className="absolute -top-8 -right-6 w-28 h-28 rounded-full bg-white/10 blur-2xl" />
              <div className="relative flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-mono font-black uppercase tracking-widest text-teal-50/80">
                    Available balance
                  </p>
                  <p className="mt-0.5 text-3xl font-black text-white tabular-nums leading-none">
                    {formatTokens(balance)}
                    <span className="ml-1.5 text-xs font-bold text-teal-50/80">tokens</span>
                  </p>
                  <p className="mt-1.5 text-[11px] font-semibold text-teal-50/85">
                    {summary?.plan ? `${summary.plan.name} plan` : 'Free plan'} · resets{' '}
                    {summary ? formatDate(summary.wallet.periodEnd) : 'monthly'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-teal-50/70">
                    Used this month
                  </p>
                  <p className="text-sm font-black text-white tabular-nums">
                    {formatTokens(summary?.usage.monthTokens ?? 0)}
                  </p>
                </div>
              </div>

              <div className="relative mt-3">
                <div className="h-2 rounded-full bg-black/20 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      usedPct >= 90 ? 'bg-amber-300' : 'bg-white/80'
                    }`}
                    style={{ width: `${Math.max(usedPct, balance > 0 ? 3 : 100)}%` }}
                  />
                </div>
                <div className="mt-1.5 flex items-center justify-between text-[10px] font-semibold text-teal-50/80">
                  <span>{usedPct}% of {formatTokens(allowance)} used</span>
                  <span>Today: {formatTokens(summary?.usage.todayTokens ?? 0)}</span>
                </div>
              </div>
            </div>

            {/* Cost legend */}
            <div className="grid grid-cols-2 gap-2">
              {[
                { icon: MessageSquare, label: 'Chat turn', value: summary?.costs.chatTurn ?? 1, unit: 'tok' },
                { icon: Mic, label: 'Voice / min', value: summary?.costs.voiceMinute ?? 25, unit: 'tok' },
                { icon: Volume2, label: 'Coach voice / 1k', value: summary?.costs.tts1kChars ?? 5, unit: 'tok' },
                { icon: Zap, label: 'Speech-to-text / min', value: summary?.costs.sttMinute ?? 10, unit: 'tok' },
              ].map((cost) => (
                <div
                  key={cost.label}
                  className="flex items-center gap-2 rounded-xl border border-stone-200/80 dark:border-white/10 bg-stone-50 dark:bg-white/[0.04] px-2.5 py-2"
                >
                  <cost.icon className="w-3.5 h-3.5 text-teal-600 dark:text-teal-300 shrink-0" />
                  <div className="min-w-0 leading-tight">
                    <p className="text-[10px] font-bold text-stone-600 dark:text-stone-300 truncate">
                      {cost.label}
                    </p>
                    <p className="text-[10px] font-black text-stone-900 dark:text-white tabular-nums">
                      {cost.value} {cost.unit}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Plans */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-[11px] font-mono font-black uppercase tracking-widest text-stone-500 dark:text-stone-400">
                  Top up
                </h3>
                <span className="text-[10px] font-semibold text-stone-400 dark:text-stone-500">
                  GCash · admin-verified
                </span>
              </div>

              <div className="space-y-2">
                {buyablePlans.map((plan) => {
                  const active = selectedPlan === plan.id;
                  return (
                    <button
                      key={plan.id}
                      type="button"
                      onClick={() => choosePlan(plan.id)}
                      className={`w-full flex items-center justify-between gap-3 rounded-2xl border px-3 py-2.5 text-left transition-all cursor-pointer active:scale-[0.99] ${
                        active
                          ? 'border-teal-500 bg-teal-50 dark:bg-teal-500/10 shadow-sm shadow-teal-500/10'
                          : 'border-stone-200 dark:border-white/10 bg-white dark:bg-white/[0.03] hover:border-teal-400/50'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-black text-stone-900 dark:text-white">{plan.name}</p>
                          {active && (
                            <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 dark:text-teal-300" />
                          )}
                        </div>
                        <p className="text-[10.5px] font-semibold text-stone-500 dark:text-stone-400">
                          {formatTokens(plan.monthlyTokens)} tokens / month
                          {plan.features.length > 0 ? ` · ${plan.features[0]}` : ''}
                        </p>
                      </div>
                      <span className="shrink-0 text-sm font-black text-teal-700 dark:text-teal-300 tabular-nums">
                        {plan.pricePhp > 0 ? peso(plan.pricePhp) : 'Free'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* GCash form */}
            <div className="rounded-2xl border border-stone-200 dark:border-white/10 bg-stone-50/80 dark:bg-white/[0.03] p-3 space-y-2.5">
              <div className="flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-teal-600 dark:text-teal-300 shrink-0 mt-0.5" />
                <p className="text-[10.5px] leading-relaxed font-medium text-stone-600 dark:text-stone-300">
                  Pay via GCash{GCASH_NUMBER ? <> to <span className="font-black text-stone-900 dark:text-white">{GCASH_NUMBER}</span></> : ' using the number given by your admin'}
                  , then enter the reference number. Tokens are added once an admin approves.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <label className="block">
                  <span className="text-[10px] font-bold text-stone-500 dark:text-stone-400">Tokens</span>
                  <input
                    value={tokens}
                    onChange={(event) => setTokens(event.target.value.replace(/[^0-9]/g, ''))}
                    inputMode="numeric"
                    className="mt-1 w-full rounded-xl bg-white dark:bg-[#0A121D] border border-stone-200 dark:border-white/10 px-2.5 py-2 text-xs font-bold text-stone-900 dark:text-white tabular-nums focus:outline-none focus:border-teal-500"
                  />
                </label>
                <label className="block">
                  <span className="text-[10px] font-bold text-stone-500 dark:text-stone-400">Amount (PHP)</span>
                  <input
                    value={amount}
                    onChange={(event) => setAmount(event.target.value.replace(/[^0-9.]/g, ''))}
                    inputMode="decimal"
                    className="mt-1 w-full rounded-xl bg-white dark:bg-[#0A121D] border border-stone-200 dark:border-white/10 px-2.5 py-2 text-xs font-bold text-stone-900 dark:text-white tabular-nums focus:outline-none focus:border-teal-500"
                  />
                </label>
              </div>

              <label className="block">
                <span className="text-[10px] font-bold text-stone-500 dark:text-stone-400">
                  GCash reference no.
                </span>
                <input
                  value={reference}
                  onChange={(event) => setReference(event.target.value)}
                  placeholder="e.g. 1234 567 890123"
                  className="mt-1 w-full rounded-xl bg-white dark:bg-[#0A121D] border border-stone-200 dark:border-white/10 px-2.5 py-2 text-xs font-semibold text-stone-900 dark:text-white placeholder:text-stone-400 focus:outline-none focus:border-teal-500"
                />
              </label>

              <label className="block">
                <span className="text-[10px] font-bold text-stone-500 dark:text-stone-400">
                  GCash receipt (optional)
                </span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,application/pdf"
                  onChange={(event) => {
                    const file = event.target.files?.[0] ?? null;
                    if (file && file.size > 5 * 1024 * 1024) {
                      setFormError('Receipt must be 5 MB or smaller.');
                      event.target.value = '';
                      return;
                    }
                    setFormError(null);
                    setReceiptFile(file);
                  }}
                  className="mt-1 w-full rounded-xl bg-white dark:bg-[#0A121D] border border-stone-200 dark:border-white/10 px-2.5 py-1.5 text-[11px] font-semibold text-stone-600 dark:text-stone-300 file:mr-2 file:rounded-lg file:border-0 file:bg-teal-500/15 file:px-2 file:py-1 file:text-[10px] file:font-black file:text-teal-700 dark:file:text-teal-300"
                />
                {receiptFile && (
                  <span className="mt-1 block truncate text-[9.5px] font-semibold text-teal-600 dark:text-teal-300">
                    {receiptFile.name}
                  </span>
                )}
              </label>

              <label className="block">
                <span className="text-[10px] font-bold text-stone-500 dark:text-stone-400">
                  …or a receipt link
                </span>
                <input
                  value={receiptUrl}
                  onChange={(event) => setReceiptUrl(event.target.value)}
                  placeholder="https://…"
                  className="mt-1 w-full rounded-xl bg-white dark:bg-[#0A121D] border border-stone-200 dark:border-white/10 px-2.5 py-2 text-xs font-semibold text-stone-900 dark:text-white placeholder:text-stone-400 focus:outline-none focus:border-teal-500"
                />
              </label>

              {formError && (
                <p className="text-[10.5px] font-bold text-rose-600 dark:text-rose-300">{formError}</p>
              )}
              {submitted && (
                <p className="flex items-center gap-1.5 text-[10.5px] font-bold text-emerald-600 dark:text-emerald-300">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Request submitted! An admin will verify your GCash payment.
                </p>
              )}

              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-teal-600 to-teal-500 px-3 py-2.5 text-xs font-black text-white shadow-md shadow-teal-600/25 active:scale-[0.99] transition-transform disabled:opacity-60 cursor-pointer"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    {uploading ? 'Uploading receipt…' : 'Submitting…'}
                  </>
                ) : (
                  <>
                    Submit top-up request
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>

            {/* Pending requests */}
            {requests.length > 0 && (
              <div className="space-y-1.5">
                <h3 className="text-[11px] font-mono font-black uppercase tracking-widest text-stone-500 dark:text-stone-400">
                  Your requests
                </h3>
                {requests.slice(0, 5).map((req) => (
                  <div
                    key={req.id}
                    className="flex items-center justify-between gap-2 rounded-xl border border-stone-200/80 dark:border-white/10 bg-white dark:bg-white/[0.03] px-2.5 py-2"
                  >
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold text-stone-800 dark:text-white tabular-nums">
                        {formatTokens(req.tokensRequested)} tokens · {peso(req.amountPhp)}
                      </p>
                      <p className="text-[9.5px] font-medium text-stone-400 dark:text-stone-500">
                        {formatDate(req.createdAt)}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wide ${
                        STATUS_STYLES[req.status] || STATUS_STYLES.pending
                      }`}
                    >
                      {req.status === 'pending' ? (
                        <Clock3 className="w-2.5 h-2.5" />
                      ) : (
                        <CheckCircle2 className="w-2.5 h-2.5" />
                      )}
                      {req.status}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Recent ledger */}
            {(summary?.ledger.length ?? 0) > 0 && (
              <div className="space-y-1.5">
                <h3 className="text-[11px] font-mono font-black uppercase tracking-widest text-stone-500 dark:text-stone-400">
                  Recent activity
                </h3>
                <div className="rounded-xl border border-stone-200/80 dark:border-white/10 overflow-hidden divide-y divide-stone-100 dark:divide-white/5">
                  {summary!.ledger.slice(0, 6).map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between gap-2 px-2.5 py-1.5 bg-white dark:bg-white/[0.02]"
                    >
                      <span className="text-[10.5px] font-semibold text-stone-600 dark:text-stone-300 truncate">
                        {formatLedgerReason(entry.reason)}
                      </span>
                      <span
                        className={`shrink-0 text-[10.5px] font-black tabular-nums ${
                          entry.delta >= 0
                            ? 'text-emerald-600 dark:text-emerald-300'
                            : 'text-stone-500 dark:text-stone-400'
                        }`}
                      >
                        {entry.delta >= 0 ? '+' : ''}
                        {formatTokens(entry.delta)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <p className="flex items-start gap-1.5 text-[9.5px] leading-relaxed font-medium text-stone-400 dark:text-stone-500">
              <Info className="w-3 h-3 shrink-0 mt-0.5" />
              Tokens never expire while your plan is active. Free allowance resets every month.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
