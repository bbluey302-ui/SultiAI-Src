import React from 'react';
import { Sparkles } from 'lucide-react';
import { ASSETS } from '../../assets/images';
import { TokenWalletPill } from './TokenWalletPill';

export interface HeaderStat {
  id: string;
  emoji: string;
  value: string | number;
  label: string;
}

interface SultiGreetingHeaderProps {
  userName?: string;
  /** Compact subtitle shown under the greeting */
  tagline?: string;
  /** Live dashboard stats rendered as a mini chip row (real data, not decoration) */
  stats?: HeaderStat[];
  onOpenMascot?: () => void;
  /** AI token balance shown as the first live chip */
  tokenBalance?: number | null;
  tokenPlan?: string;
  tokenLoading?: boolean;
  onOpenTokenStore?: () => void;
}

/**
 * Welcome band for the Sulti AI dashboard.
 * Bleeds into the page instead of sitting in its own card, keeping the
 * greeting, live usage chips and brand mark in one readable hierarchy.
 */
export const SultiGreetingHeader: React.FC<SultiGreetingHeaderProps> = ({
  userName = 'Learner',
  tagline = 'Your AI language coach — practice Bisaya, Filipino & English',
  stats = [],
  onOpenMascot,
  tokenBalance,
  tokenPlan,
  tokenLoading = false,
  onOpenTokenStore,
}) => {
  const firstName = userName.split(' ')[0] || 'Learner';

  return (
    <header className="relative -mx-4 px-4 pt-4 pb-3 select-none overflow-hidden">
      {/* Subtle brand wash + ambient light, kept low-contrast for both themes */}
      <div className="absolute inset-0 bg-gradient-to-b from-brand/10 via-brand/5 to-transparent dark:from-brand/10 dark:via-brand/5 pointer-events-none" />
      <div className="absolute -top-16 -left-12 w-48 h-48 rounded-full bg-brand/10 blur-3xl pointer-events-none" />
      <div className="absolute -top-10 right-4 w-28 h-28 rounded-full bg-cyan-400/10 blur-2xl pointer-events-none" />

      <div className="relative z-10 flex items-start justify-between gap-3">
        {/* Left: greeting + tagline + live usage chips */}
        <div className="min-w-0 flex-1">
          <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-surface/80 border border-line shadow-xs">
            <span className="w-4 h-4 rounded-full bg-brand/15 text-brand flex items-center justify-center shrink-0">
              <Sparkles className="w-2.5 h-2.5" />
            </span>
            <span className="text-[9.5px] font-mono font-black uppercase tracking-wider text-muted">
              Sulti AI <span className="text-brand">· Language Coach</span>
            </span>
          </div>

          <h1 className="font-display font-black text-[22px] sm:text-2xl leading-[1.15] tracking-tight text-ink mt-2 break-words">
            Hello, {firstName}! <span className="inline-block animate-wave">👋</span>
          </h1>

          <p className="text-[12px] sm:text-[13px] font-medium text-muted leading-snug mt-1">
            {tagline}
          </p>

          {(stats.length > 0 || tokenBalance !== undefined) && (
            <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
              {onOpenTokenStore && (
                <TokenWalletPill
                  balance={tokenBalance}
                  planName={tokenPlan}
                  loading={tokenLoading}
                  onClick={onOpenTokenStore}
                />
              )}
              {stats.map((stat) => (
                <span
                  key={stat.id}
                  className="inline-flex items-center gap-1.5 h-9 px-2.5 rounded-xl bg-surface/85 border border-line shadow-xs"
                >
                  <span className="text-[13px] leading-none">{stat.emoji}</span>
                  <span className="text-[12px] font-black text-ink leading-none tabular-nums">
                    {stat.value}
                  </span>
                  <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-muted leading-none">
                    {stat.label}
                  </span>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Right: brand mark — smaller and calmer so the greeting stays dominant */}
        {onOpenMascot ? (
          <button
            type="button"
            onClick={onOpenMascot}
            aria-label="About Sulti AI"
            className="relative z-10 shrink-0 group cursor-pointer active:scale-95 transition-transform"
          >
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden p-[2px] bg-gradient-to-br from-brand/70 to-cyan-400/60 shadow-soft">
              <img
                src={ASSETS.logo}
                alt="SultiAI logo"
                className="w-full h-full object-cover rounded-[14px] bg-surface"
              />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-emerald-500 border-[3px] border-app shadow-xs" />
          </button>
        ) : (
          <div className="relative z-10 shrink-0" aria-hidden>
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden p-[2px] bg-gradient-to-br from-brand/70 to-cyan-400/60 shadow-soft">
              <img
                src={ASSETS.logo}
                alt=""
                className="w-full h-full object-cover rounded-[14px] bg-surface"
              />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-emerald-500 border-[3px] border-app shadow-xs" />
          </div>
        )}
      </div>
    </header>
  );
};
