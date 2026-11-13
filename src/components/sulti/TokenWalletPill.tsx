import React from 'react';
import { Coins, Plus } from 'lucide-react';
import { formatTokens } from '../../services/tokenService';

interface TokenWalletPillProps {
  balance?: number | null;
  planName?: string;
  loading?: boolean;
  onClick?: () => void;
}

/**
 * Compact balance chip for the dashboard header.
 *
 * Sits in the live-stat row so the token economy reads as part of the
 * dashboard, not as an upsell banner. Tapping opens the token store.
 */
export const TokenWalletPill: React.FC<TokenWalletPillProps> = ({
  balance,
  planName,
  loading = false,
  onClick,
}) => {
  const low = typeof balance === 'number' && balance < 200;
  const display = typeof balance === 'number' ? formatTokens(balance) : '—';

  return (
    <button
      type="button"
      onClick={onClick}
      title="AI token balance — tap to top up"
      aria-label={`AI token balance: ${display}${planName ? `, ${planName} plan` : ''}. Tap to top up.`}
      className={`group inline-flex items-center gap-1.5 h-9 pl-1.5 pr-2 rounded-xl border shadow-xs transition-all cursor-pointer active:scale-95 ${
        low
          ? 'bg-amber-50/90 dark:bg-amber-500/10 border-amber-400/60 dark:border-amber-400/30'
          : 'bg-surface/85 border-line hover:border-brand/50'
      }`}
    >
      <span
        className={`w-5 h-5 rounded-lg flex items-center justify-center shrink-0 ${
          low
            ? 'bg-amber-400/20 text-amber-700 dark:text-amber-300'
            : 'bg-brand/15 text-brand'
        }`}
      >
        <Coins className="w-3 h-3" />
      </span>

      {loading ? (
        <span className="w-8 h-2.5 rounded-full bg-muted/30 animate-pulse" />
      ) : (
        <span className="text-[12px] font-black leading-none text-ink tabular-nums">
          {display}
        </span>
      )}

      <span className="text-[9px] font-mono font-bold uppercase tracking-wider leading-none text-muted">
        {planName ? planName : 'tokens'}
      </span>

      <span className="w-4 h-4 rounded-full bg-brand/15 text-brand flex items-center justify-center shrink-0 group-hover:bg-brand group-hover:text-on-brand transition-colors">
        <Plus className="w-2.5 h-2.5" />
      </span>
    </button>
  );
};
