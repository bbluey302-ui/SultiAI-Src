import React, { useState } from 'react';
import { Lock, Check, AlertCircle, ShieldCheck } from 'lucide-react';
import { authHeaders } from '../services/tokenService';

export const AdminReset: React.FC = () => {
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [msg, setMsg] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    try {
      const h = await authHeaders();
      const res = await fetch('/api/admin/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(h as any) },
        body: JSON.stringify({ userEmail: email, newPassword: pw }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setStatus('done'); setMsg('Password reset for ' + email);
    } catch (err: any) {
      setStatus('error'); setMsg(err.message || 'Failed');
    }
  };

  return (
    <form onSubmit={submit} className="max-w-xs mx-auto space-y-3 p-4 bg-stone-50 dark:bg-[#11222D] rounded-2xl border border-stone-200 dark:border-white/10">
      <h3 className="font-black text-sm text-stone-900 dark:text-white flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-amber-500" /> Admin Password Reset</h3>
      <input type="email" placeholder="User email" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#11222D] border border-stone-200 text-sm" required />
      <input type="password" placeholder="New password" value={pw} onChange={e => setPw(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#11222D] border border-stone-200 text-sm" required />
      {status === 'error' && <div className="text-red-500 text-xs font-bold flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {msg}</div>}
      {status === 'done' && <div className="text-teal-600 text-xs font-bold flex items-center gap-1"><Check className="w-3 h-3" /> {msg}</div>}
      <button type="submit" disabled={status === 'loading'} className="w-full py-2.5 bg-teal-600 text-white rounded-xl font-bold text-sm">{status === 'loading' ? 'Saving...' : 'Reset Password'}</button>
    </form>
  );
};
