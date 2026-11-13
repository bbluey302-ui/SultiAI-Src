import React, { useState } from 'react';
import { ShieldCheck, Lock, Mail, ArrowRight, AlertCircle, ArrowLeft, Database } from 'lucide-react';
import { useAdminAuth } from './AdminAuthContext';

interface AdminLoginProps {
  onBackToMobileApp: () => void;
}

export function AdminLogin({ onBackToMobileApp }: AdminLoginProps) {
  const { login, isSupabaseLive, loading } = useAdminAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const res = await login(email, password);
    if (!res.success) {
      setErrorMessage(res.error || 'Authentication failed. Please verify credentials.');
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#0A121D] text-white flex flex-col justify-between p-4 sm:p-8 font-sans selection:bg-teal-500 selection:text-white">
      {/* Top Bar */}
      <div className="max-w-7xl w-full mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-teal-500 to-indigo-600 flex items-center justify-center text-white shadow-lg">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <span className="font-display font-black text-lg text-white tracking-tight block">
              Sulti<span className="text-teal-400">AI</span> Admin
            </span>
            <span className="text-[11px] text-stone-400 block">Desktop Control & Audit Portal</span>
          </div>
        </div>

        <button
          onClick={onBackToMobileApp}
          className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white flex items-center gap-2 transition-all border border-stone-700/60"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Learner Mobile App</span>
        </button>
      </div>

      {/* Center Auth Card */}
      <div className="max-w-md w-full mx-auto my-12 bg-[#11222D] rounded-3xl border border-white/10 shadow-2xl p-6 sm:p-8 space-y-6">
        <div>
          <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-teal-500/10 text-teal-400 border border-teal-500/20 inline-block mb-3">
            ROLE-BASED AUTHORIZATION REQUIRED
          </span>
          <h2 className="text-2xl font-black text-white tracking-tight">
            Administrator Sign In
          </h2>
          <p className="text-xs text-stone-400 mt-1.5 leading-relaxed">
            Sign in with a Supabase account whose public.users role is <strong>admin</strong>.
            The server verifies the session before any console data is released.
          </p>
        </div>

        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-800/80 text-rose-200 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-stone-300 font-semibold mb-1.5">Administrator Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="email"
                required
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-stone-900 border border-stone-700 text-white placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-stone-300 font-semibold mb-1.5">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your Supabase password"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-stone-900 border border-stone-700 text-white placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl font-bold bg-gradient-to-r from-teal-600 to-indigo-600 hover:from-teal-700 hover:to-indigo-700 text-white flex items-center justify-center gap-2 shadow-lg transition-all active:scale-98 disabled:opacity-50 mt-2"
          >
            <span>{loading ? 'Verifying…' : 'Authenticate Session'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="pt-2 border-t border-white/5">
          <div className="flex items-center justify-between text-[11px] text-stone-500 pt-1">
            <span className="flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-teal-500" />
              {isSupabaseLive ? 'Supabase Backend: Connected' : 'Supabase Backend: Not configured'}
            </span>
            <span>JMCFI BSIT Panel</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="max-w-7xl w-full mx-auto text-center text-xs text-stone-500">
        SultiAI Bisaya Language & Communication Platform — Protected by Row-Level Security (RLS)
      </div>
    </div>
  );
}
