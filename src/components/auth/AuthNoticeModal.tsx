import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Inbox,
  Loader2,
  Mail,
  RefreshCw,
  ShieldCheck,
  X,
} from 'lucide-react';
import { sounds } from '../../utils/soundEffects';

export type AuthNoticeKind = 'recovery' | 'confirmation';

interface AuthNoticeModalProps {
  kind: AuthNoticeKind;
  email: string;
  onClose: () => void;
  /** Optional resend action (recovery email or confirmation email). */
  onResend?: () => Promise<{ success: boolean; error?: string }>;
  resendCooldownSeconds?: number;
}

/** Best-effort deep link to the web inbox for the most common providers. */
function inboxUrl(email: string): string | null {
  const domain = email.split('@')[1]?.toLowerCase() || '';
  if (['gmail.com', 'googlemail.com'].includes(domain)) return 'https://mail.google.com';
  if (['outlook.com', 'hotmail.com', 'live.com', 'msn.com'].includes(domain))
    return 'https://outlook.live.com/mail';
  if (domain === 'yahoo.com') return 'https://mail.yahoo.com';
  if (domain === 'proton.me' || domain === 'protonmail.com') return 'https://mail.proton.me';
  if (domain === 'icloud.com' || domain === 'me.com') return 'https://www.icloud.com/mail';
  return null;
}

export const AuthNoticeModal: React.FC<AuthNoticeModalProps> = ({
  kind,
  email,
  onClose,
  onResend,
  resendCooldownSeconds = 45,
}) => {
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [resendError, setResendError] = useState<string | null>(null);
  const [resent, setResent] = useState(false);

  const copy = useMemo(() => {
    if (kind === 'recovery') {
      return {
        title: 'Check your inbox',
        subtitle: 'Password recovery link sent',
        body: 'We sent a secure link to reset your password. Open it on this or any device, then choose a new password. The link expires in 1 hour.',
        actionLabel: 'Resend recovery email',
      };
    }
    return {
      title: 'Confirm your email',
      subtitle: 'One last step',
      body: 'Your account is created. Open the confirmation link we emailed you to activate it, then sign in to start learning.',
      actionLabel: 'Resend confirmation email',
    };
  }, [kind]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setInterval(() => {
      setCooldown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [cooldown]);

  const handleResend = async () => {
    if (!onResend || resending || cooldown > 0) return;
    sounds.playTap();
    setResending(true);
    setResendError(null);
    const result = await onResend();
    setResending(false);
    if (result.success) {
      sounds.playCorrect();
      setResent(true);
      setCooldown(resendCooldownSeconds);
    } else {
      sounds.playWrong();
      setResendError(result.error || 'Could not resend the email. Please try again.');
    }
  };

  const inbox = inboxUrl(email);

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-notice-title"
    >
      <div className="w-full max-w-sm bg-[#11222D] rounded-3xl border border-white/10 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-teal-500/15 text-teal-400 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-stone-400">
              {copy.subtitle}
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              sounds.playTap();
              onClose();
            }}
            className="w-7 h-7 rounded-full bg-stone-800 text-stone-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="p-6 text-center space-y-4">
          <div className="relative w-16 h-16 mx-auto">
            <div className="absolute inset-0 rounded-full bg-teal-500/15 blur-md" />
            <div className="relative w-16 h-16 rounded-full bg-teal-500/15 border border-teal-500/40 flex items-center justify-center">
              <Mail className="w-7 h-7 text-teal-400" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-[#11222D] flex items-center justify-center">
              <CheckCircle2 className="w-3.5 h-3.5 text-white" />
            </div>
          </div>

          <div className="space-y-1.5">
            <h2 id="auth-notice-title" className="font-display font-black text-xl text-white">
              {copy.title}
            </h2>
            <p className="text-xs text-stone-400 leading-relaxed">{copy.body}</p>
          </div>

          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-stone-900/70 border border-white/10 text-left">
            <Inbox className="w-4 h-4 text-teal-400 shrink-0" />
            <span className="font-mono text-[11px] text-stone-200 break-all flex-1">{email}</span>
          </div>

          {resent && (
            <div className="p-2.5 rounded-xl bg-emerald-950/50 border border-emerald-500/30 text-emerald-200 text-[11px] flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Sent again. Give it a minute and check spam too.</span>
            </div>
          )}

          {resendError && (
            <div className="p-2.5 rounded-xl bg-rose-950/50 border border-rose-500/30 text-rose-200 text-[11px] flex items-start gap-2 text-left">
              <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
              <span>{resendError}</span>
            </div>
          )}

          <div className="space-y-2 pt-1">
            {inbox && (
              <a
                href={inbox}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => sounds.playTap()}
                className="w-full py-2.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors"
              >
                <span>Open my inbox</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}

            {onResend && (
              <button
                type="button"
                onClick={handleResend}
                disabled={resending || cooldown > 0}
                className="w-full py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-stone-200 font-bold text-xs border border-white/10 flex items-center justify-center gap-2 transition-colors disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed"
              >
                {resending ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Sending…</span>
                  </>
                ) : cooldown > 0 ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Resend in {cooldown}s</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>{copy.actionLabel}</span>
                  </>
                )}
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                sounds.playTap();
                onClose();
              }}
              className="w-full py-2 text-stone-400 hover:text-white text-[11px] font-semibold transition-colors cursor-pointer"
            >
              {kind === 'recovery' ? 'Back to sign in' : "Got it, I'll confirm later"}
            </button>
          </div>

          <p className="text-[10px] text-stone-500 leading-relaxed pt-1 border-t border-white/5">
            No email after a few minutes? Check your spam folder, or confirm the address is spelled
            correctly.
          </p>
        </div>
      </div>
    </div>
  );
};
