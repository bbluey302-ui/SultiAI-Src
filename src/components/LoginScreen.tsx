import React, { useState, useEffect } from 'react';
import { 
  Sparkles, Mail, Lock, User, ArrowRight, Eye, EyeOff, 
  CheckCircle2, AlertCircle, Shield, Globe, BookOpen, 
  Volume2, Compass, Heart, Loader2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { sounds } from '../utils/soundEffects';
import { ASSETS } from '../assets/images';
import { AuthNoticeModal, AuthNoticeKind } from './auth/AuthNoticeModal';

interface LoginScreenProps {
  onSuccess?: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onSuccess }) => {
  const { 
    loginWithEmail, 
    signUpWithEmail, 
    loginWithGoogle, 
    resetPassword,
    resendConfirmationEmail,
    isLoading,
    isSupabaseLive,
    authError,
    clearAuthError,
    passwordRecovery,
    completePasswordRecovery,
    cancelPasswordRecovery
  } = useAuth();

  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ kind: AuthNoticeKind; email: string } | null>(null);
  const [targetLanguage, setTargetLanguage] = useState<'bisaya' | 'filipino'>('bisaya');

  // Surface a failed OAuth / email-link callback (cancelled consent, expired
  // link, redirect URL not allow-listed) instead of silently bouncing back.
  useEffect(() => {
    if (!authError) return;
    setError(authError);
    clearAuthError();
  }, [authError, clearAuthError]);

  // Handle Google Provider Sign-In
  const handleGoogleSignIn = async () => {
    setError(null);
    setSuccessMessage(null);
    sounds.playTap();
    try {
      const res = await loginWithGoogle();
      if (res.success) {
        sounds.playCorrect();
        onSuccess?.();
      } else if (res.error) {
        setError(res.error);
        sounds.playWrong();
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to authenticate with Google Provider.');
      sounds.playWrong();
    }
  };

  // Handle Email Provider Sign-In / Sign-Up
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setError('Palihug isulod ang imong email address (Please enter your email).');
      sounds.playWrong();
      return;
    }

    if (mode === 'forgot') {
      sounds.playTap();
      const res = await resetPassword(cleanEmail);
      if (res.success) {
        sounds.playCorrect();
        setSuccessMessage(null);
        setNotice({ kind: 'recovery', email: cleanEmail.trim().toLowerCase() });
      } else {
        setError(res.error || 'Failed to send password recovery link.');
        sounds.playWrong();
      }
      return;
    }

    if (!password) {
      setError('Palihug isulod ang imong password (Please enter your password).');
      sounds.playWrong();
      return;
    }

    sounds.playTap();

    if (mode === 'signup') {
      const res = await signUpWithEmail(cleanEmail, password, name, targetLanguage);
      if (res.success) {
        sounds.playCorrect();
        if (res.message) {
          setNotice({ kind: 'confirmation', email: cleanEmail.trim().toLowerCase() });
        } else {
          onSuccess?.();
        }
      } else {
        setError(res.error || 'Account creation encountered an issue.');
        sounds.playWrong();
      }
    } else {
      const res = await loginWithEmail(cleanEmail, password);
      if (res.success) {
        sounds.playCorrect();
        onSuccess?.();
      } else {
        setError(res.error || 'Invalid email or password. Please verify your credentials.');
        sounds.playWrong();
      }
    }
  };

  return (
    <div className="min-h-screen bg-app text-ink flex flex-col justify-between selection:bg-teal-500 selection:text-white relative overflow-hidden font-sans transition-colors duration-200">
      {/* Background Ambience & Cultural Accents */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-80 h-80 bg-teal-600/5 rounded-full blur-3xl pointer-events-none" />

      {/* Top Brand Bar */}
      <header className="w-full max-w-md mx-auto px-5 pt-6 pb-2 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl overflow-hidden border border-teal-500/30 bg-teal-50 dark:bg-teal-950/60 p-0.5 shadow-md flex items-center justify-center">
            <img 
              src={ASSETS.logo} 
              alt="SultiAI logo" 
              className="w-full h-full object-cover rounded-xl"
            />
          </div>
          <div>
            <div className="font-display font-black text-lg tracking-tight leading-none text-stone-900 dark:text-white flex items-center gap-1">
              Sulti<span className="text-teal-600 dark:text-teal-400">AI</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-teal-100 text-teal-700 border border-teal-300 font-bold ml-1 dark:bg-teal-500/20 dark:text-teal-300 dark:border-teal-500/30">
                v2.2
              </span>
            </div>
            <p className="text-[9.5px] font-mono text-stone-500 dark:text-stone-400 tracking-wider uppercase mt-0.5">
              Language Learning Hub
            </p>
          </div>
        </div>

        {/* Supabase Status Indicator */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-stone-200 text-[10px] font-mono text-stone-500 shadow-sm dark:bg-[#0F1A24] dark:border-white/10 dark:text-stone-400 dark:shadow-none">
          <span className={`w-2 h-2 rounded-full ${isSupabaseLive ? 'bg-emerald-400 animate-pulse' : 'bg-teal-400'}`} />
          <span>{isSupabaseLive ? 'Supabase Live' : 'Cloud Ready'}</span>
        </div>
      </header>

      {/* Main Form Centerpiece */}
      <main className="w-full max-w-md mx-auto px-5 py-4 flex-1 flex flex-col justify-center relative z-10">
        {/* Welcome Hero Badge */}
        <div className="text-center space-y-1.5 mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-300 text-teal-700 text-xs font-medium dark:bg-teal-950/80 dark:border-teal-500/30 dark:text-teal-300">
            <Sparkles className="w-3.5 h-3.5 text-teal-500 dark:text-teal-400" />
            <span>Welcome to SultiAI</span>
          </div>
          <h1 className="font-display font-black text-2xl sm:text-3xl tracking-tight text-stone-900 dark:text-white">
            {mode === 'login' && 'Sign in to continue learning'}
            {mode === 'signup' && 'Create your SultiAI account'}
            {mode === 'forgot' && 'Reset your password'}
          </h1>
          <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 max-w-xs mx-auto">
            {mode === 'login' && 'Practice conversational language with your AI voice companion.'}
            {mode === 'signup' && 'Track streaks, save vocabulary, and earn gems across devices.'}
            {mode === 'forgot' && 'Enter your email address and we will dispatch a password recovery link.'}
          </p>
        </div>

        {/* Authentication Card */}
        <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-lg shadow-stone-200/60 backdrop-blur-xl space-y-5 dark:bg-[#0F1A24] dark:border-white/10 dark:shadow-teal-900/10">
          {/* PROVIDER 1: Google Provider Button */}
          {mode !== 'forgot' && (
            <div className="space-y-3">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-2xl bg-white hover:bg-stone-100 text-stone-900 font-bold text-sm flex items-center justify-center gap-3 transition-all duration-150 shadow-sm active:scale-[0.99] cursor-pointer disabled:opacity-60 border border-stone-200 dark:border-transparent"
              >
                {/* Official Google Icon SVG */}
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 12 2.18 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Continue with Google</span>
              </button>

              {/* Or Divider */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-stone-200 dark:bg-white/10" />
                <span className="text-[11px] font-mono text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                  O Gamita ang Email
                </span>
                <div className="flex-1 h-px bg-stone-200 dark:bg-white/10" />
              </div>
            </div>
          )}

          {/* Error & Feedback Banner */}
          {error && (
            <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2 animate-in fade-in dark:bg-rose-500/55 dark:border-rose-400/40 dark:text-rose-300">
              <AlertCircle className="w-4 h-4 text-rose-500 dark:text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{error}</div>
            </div>
          )}

          {successMessage && (
            <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-start gap-2 animate-in fade-in dark:bg-emerald-500/55 dark:border-emerald-400/40 dark:text-emerald-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{successMessage}</div>
            </div>
          )}

          {/* PROVIDER 2: Email Provider Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {mode === 'signup' && (
              <div className="space-y-1">
                <label className="text-[11px] font-mono font-bold text-stone-600 dark:text-stone-300 uppercase tracking-wider flex items-center gap-1.5">
                  <User className="w-3 h-3 text-teal-500 dark:text-teal-400" />
                  Pangalan (Display Name)
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Juan Dela Cruz"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 border border-stone-300 focus:border-teal-500 focus:outline-none text-sm text-stone-900 placeholder-stone-400 transition-colors dark:bg-stone-900/80 dark:border-white/15 dark:focus:border-teal-400 dark:text-white dark:placeholder-stone-500"
                />
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[11px] font-mono font-bold text-stone-600 dark:text-stone-300 uppercase tracking-wider flex items-center gap-1.5">
                <Mail className="w-3 h-3 text-teal-500 dark:text-teal-400" />
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="genesis@jmc.edu.ph"
                className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 border border-stone-300 focus:border-teal-500 focus:outline-none text-sm text-stone-900 placeholder-stone-400 transition-colors dark:bg-stone-900/80 dark:border-white/15 dark:focus:border-teal-400 dark:text-white dark:placeholder-stone-500"
              />
            </div>

            {mode !== 'forgot' && (
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-mono font-bold text-stone-600 dark:text-stone-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Lock className="w-3 h-3 text-teal-500 dark:text-teal-400" />
                    Password
                  </label>
                  {mode === 'login' && (
                    <button
                      type="button"
                      onClick={() => {
                        sounds.playTap();
                        setMode('forgot');
                        setError(null);
                        setSuccessMessage(null);
                      }}
                      className="text-[11px] text-teal-600 hover:text-teal-500 transition-colors cursor-pointer dark:text-teal-400 dark:hover:text-teal-300"
                    >
                      Forgot Password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-stone-50 border border-stone-300 focus:border-teal-500 focus:outline-none text-sm text-stone-900 placeholder-stone-400 transition-colors dark:bg-stone-900/80 dark:border-white/15 dark:focus:border-teal-400 dark:text-white dark:placeholder-stone-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-900 transition-colors dark:text-stone-400 dark:hover:text-white"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-2xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-sm shadow-teal-900/40 active:scale-[0.99] cursor-pointer disabled:opacity-60"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Palihug hulat...</span>
                </>
              ) : (
                <>
                  <span>
                    {mode === 'login' && 'Sign In with Email'}
                    {mode === 'signup' && 'Create SultiAI Account'}
                    {mode === 'forgot' && 'Send Recovery Email'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Mode Switcher Footer */}
          <div className="pt-2 border-t border-stone-200 dark:border-white/10 text-center text-xs text-stone-500 dark:text-stone-400">
            {mode === 'login' ? (
              <p>
                Create A New Account{' '}
                <button
                  type="button"
                  onClick={() => {
                    sounds.playTap();
                    setMode('signup');
                    setError(null);
                    setSuccessMessage(null);
                  }}
                  className="font-bold text-teal-600 hover:text-teal-500 underline cursor-pointer dark:text-teal-400 dark:hover:text-teal-300"
                >
                  Sign Up 
                </button>
              </p>
            ) : (
              <p>
                Naa na kay account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    sounds.playTap();
                    setMode('login');
                    setError(null);
                    setSuccessMessage(null);
                  }}
                  className="font-bold text-teal-600 hover:text-teal-500 underline cursor-pointer dark:text-teal-400 dark:hover:text-teal-300"
                >
                  Balik sa Log In
                </button>
              </p>
            )}
          </div>
        </div>

        {/* Authentication assurance — real Supabase accounts only, no demos */}
        <div
          className={`mt-4 p-3.5 rounded-2xl border flex items-start gap-2.5 ${
            isSupabaseLive
              ? 'bg-white/60 border-stone-200/50 dark:bg-[#0F1A2D]/60 dark:border-white/5'
              : 'bg-rose-50 border-rose-200/40 dark:bg-rose-500/40 dark:border-rose-400/30'
          }`}
        >
          
         <div className="flex w-full items-center justify-center rounded-xl border border-stone-200 bg-white p-4 dark:border-white/10 dark:bg-[#060e17]">
  {/* Bag-ong wrapper para magkuyog jud ang icon ug text sa tunga */}
  <div className="flex items-center gap-3">
    {/* Icon Container */}
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-100 p-2 text-teal-600 dark:bg-teal-950/50 dark:text-teal-400">
      <svg 
        xmlns="http://w3.org" 
        fill="none" 
        viewBox="0 0 24 24" 
        strokeWidth={1.5} 
        stroke="currentColor" 
        className="h-6 w-6"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" 
        />
      </svg>
    </div>

    {/* Text Container */}
    <div className="whitespace-nowrap">
      <div className="text-[11px] font-bold text-stone-900 dark:text-white">
        {isSupabaseLive ? 'Secured by Sulti AI' : 'Authentication unavailable'}
      </div>
    </div>
  </div>
</div>

      </div>
    </main>

    

      {notice && (
        <AuthNoticeModal
          kind={notice.kind}
          email={notice.email}
          onClose={() => {
            setNotice(null);
            setMode('login');
            setPassword('');
          }}
          onResend={
            notice.kind === 'recovery'
              ? () => resetPassword(notice.email)
              : () => resendConfirmationEmail(notice.email)
          }
        />
      )}
    </div>
  );
};