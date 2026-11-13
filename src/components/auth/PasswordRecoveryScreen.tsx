import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Lock,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react';
import { sounds } from '../../utils/soundEffects';
import { ASSETS } from '../../assets/images';

interface PasswordRecoveryScreenProps {
  /** Email of the account whose recovery link was just verified. */
  email?: string;
  onSubmit: (newPassword: string) => Promise<{ success: boolean; error?: string }>;
  onCancel: () => Promise<void> | void;
  /** Called after the success screen is dismissed, to show the login screen. */
  onDone: () => void;
}

const rules = [
  { id: 'length', label: 'At least 8 characters', test: (v: string) => v.length >= 8 },
  { id: 'case', label: 'Upper & lowercase letters', test: (v: string) => /[a-z]/.test(v) && /[A-Z]/.test(v) },
  { id: 'number', label: 'At least one number', test: (v: string) => /\d/.test(v) },
  { id: 'symbol', label: 'At least one symbol', test: (v: string) => /[^A-Za-z0-9]/.test(v) },
];

export const PasswordRecoveryScreen: React.FC<PasswordRecoveryScreenProps> = ({
  email,
  onSubmit,
  onCancel,
  onDone,
}) => {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [succeeded, setSucceeded] = useState(false);

  const passedRules = useMemo(
    () => rules.filter((rule) => rule.test(password)).length,
    [password]
  );
  const strength = Math.round((passedRules / rules.length) * 100);
  const strengthLabel =
    strength >= 100 ? 'Strong' : strength >= 75 ? 'Good' : strength >= 50 ? 'Fair' : 'Weak';
  const strengthColor =
    strength >= 100
      ? 'bg-emerald-500'
      : strength >= 75
        ? 'bg-teal-500'
        : strength >= 50
          ? 'bg-amber-500'
          : 'bg-rose-500';

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError('Use at least 8 characters for your new password.');
      sounds.playWrong();
      return;
    }
    if (password !== confirm) {
      setError('The two passwords do not match. Please retype them.');
      sounds.playWrong();
      return;
    }

    sounds.playTap();
    setSubmitting(true);
    const result = await onSubmit(password);
    setSubmitting(false);

    if (!result.success) {
      setError(result.error || 'Could not update your password. Please try again.');
      sounds.playWrong();
      return;
    }

    sounds.playCorrect();
    setSucceeded(true);
  };

  const handleCancel = async () => {
    sounds.playTap();
    await onCancel();
    onDone();
  };

  return (
    <div className="min-h-screen bg-[#0A121D] text-white flex flex-col justify-between selection:bg-teal-500 selection:text-white relative overflow-hidden font-sans">
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-80 h-80 bg-teal-600/5 rounded-full blur-3xl pointer-events-none" />

      <header className="w-full max-w-md mx-auto px-5 pt-6 pb-2 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl overflow-hidden border border-teal-500/30 bg-teal-950/60 p-0.5 shadow-md flex items-center justify-center">
            <img src={ASSETS.logo} alt="SultiAI logo" className="w-full h-full object-cover rounded-xl" />
          </div>
          <div>
            <div className="font-display font-black text-lg tracking-tight leading-none text-white">
              Sulti<span className="text-teal-400">AI</span>
            </div>
            <p className="text-[9.5px] font-mono text-stone-400 tracking-wider uppercase mt-0.5">
              Secure Account Recovery
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleCancel}
          className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#11222D] border border-white/10 text-[10px] font-mono text-stone-400 hover:text-white hover:border-white/20 transition-colors cursor-pointer"
        >
          <X className="w-3 h-3" />
          Cancel
        </button>
      </header>

      <main className="w-full max-w-md mx-auto px-5 py-4 flex-1 flex flex-col justify-center relative z-10">
        {succeeded ? (
          <div className="bg-[#11222D] rounded-3xl p-7 border border-white/10 shadow-2xl text-center space-y-4 backdrop-blur-xl animate-in fade-in">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-400" />
            </div>
            <div className="space-y-1.5">
              <h1 className="font-display font-black text-2xl tracking-tight text-white">
                Password updated
              </h1>
              <p className="text-sm text-stone-400">
                Your SultiAI password was changed successfully. Sign in with your new password to
                continue learning.
              </p>
            </div>
            {email && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-teal-950/80 border border-teal-500/30 text-teal-300 text-xs font-mono">
                <ShieldCheck className="w-3.5 h-3.5" />
                {email}
              </div>
            )}
            <button
              type="button"
              onClick={() => {
                sounds.playTap();
                onDone();
              }}
              className="w-full py-3 px-4 rounded-2xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-teal-900/40 active:scale-[0.99] cursor-pointer"
            >
              <span>Continue to Sign In</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <>
            <div className="text-center space-y-1.5 mb-6">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-950/80 border border-teal-500/30 text-teal-300 text-xs font-medium">
                <Sparkles className="w-3.5 h-3.5 text-teal-400" />
                <span>Link verified — set a new password</span>
              </div>
              <h1 className="font-display font-black text-2xl sm:text-3xl tracking-tight text-white">
                Choose a new password
              </h1>
              <p className="text-xs sm:text-sm text-stone-400 max-w-xs mx-auto">
                Pick a password you have not used before. This recovery link can only be used once.
              </p>
              {email && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#11222D] border border-white/10 text-stone-300 text-xs font-mono">
                  <KeyRound className="w-3.5 h-3.5 text-teal-400" />
                  {email}
                </div>
              )}
            </div>

            <form
              onSubmit={handleSubmit}
              className="bg-[#11222D] rounded-3xl p-6 border border-white/10 shadow-2xl space-y-4 backdrop-blur-xl"
            >
              {error && (
                <div className="p-3 rounded-2xl bg-rose-950/60 border border-rose-500/40 text-rose-200 text-xs flex items-start gap-2 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div className="flex-1 font-medium">{error}</div>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[11px] font-mono font-bold text-stone-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Lock className="w-3 h-3 text-teal-400" />
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="new-password"
                    value={password}
                    onChange={(event) => {
                      setPassword(event.target.value);
                      if (error) setError(null);
                    }}
                    placeholder="••••••••••••"
                    className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-stone-900/80 border border-white/15 focus:border-teal-400 focus:outline-none text-sm text-white placeholder-stone-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-white transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-mono font-bold text-stone-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Lock className="w-3 h-3 text-teal-400" />
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    required
                    autoComplete="new-password"
                    value={confirm}
                    onChange={(event) => {
                      setConfirm(event.target.value);
                      if (error) setError(null);
                    }}
                    placeholder="••••••••••••"
                    className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-stone-900/80 border border-white/15 focus:border-teal-400 focus:outline-none text-sm text-white placeholder-stone-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-white transition-colors"
                    aria-label={showConfirm ? 'Hide password' : 'Show password'}
                  >
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {password.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className="text-stone-400 uppercase tracking-wider">Password strength</span>
                    <span
                      className={
                        strength >= 75 ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'
                      }
                    >
                      {strengthLabel}
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-stone-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${strengthColor}`}
                      style={{ width: `${Math.max(strength, 6)}%` }}
                    />
                  </div>
                  <ul className="grid grid-cols-1 gap-1">
                    {rules.map((rule) => {
                      const passed = rule.test(password);
                      return (
                        <li
                          key={rule.id}
                          className={`flex items-center gap-1.5 text-[10.5px] ${
                            passed ? 'text-emerald-400' : 'text-stone-500'
                          }`}
                        >
                          <Check
                            className={`w-3 h-3 shrink-0 ${passed ? 'opacity-100' : 'opacity-30'}`}
                          />
                          {rule.label}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 px-4 rounded-2xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-teal-900/40 active:scale-[0.99] cursor-pointer disabled:opacity-60"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Updating password…</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Update Password</span>
                  </>
                )}
              </button>

              <div className="pt-1 border-t border-white/10 text-center">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="text-xs text-stone-400 hover:text-white transition-colors cursor-pointer"
                >
                  Cancel and return to sign in
                </button>
              </div>
            </form>
          </>
        )}
      </main>

      <footer className="w-full max-w-md mx-auto px-5 py-4 text-center text-[10px] text-stone-500 space-y-1 relative z-10">
        <div>SultiAI Platform • Secured with Supabase Auth & JWT Sessions</div>
        <div>Recovery links expire automatically to keep your account safe.</div>
      </footer>
    </div>
  );
};
