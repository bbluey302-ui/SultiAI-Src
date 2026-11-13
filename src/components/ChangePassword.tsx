import React, { useState } from 'react';
import { Lock, Check, AlertCircle } from 'lucide-react';
import { sounds } from '../utils/soundEffects';

export const ChangePassword: React.FC<{ onDone?: () => void }> = ({ onDone }) => {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [msg, setMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      setStatus('error'); setMsg('Passwords do not match'); return;
    }
    if (password.length < 6) {
      setStatus('error'); setMsg('Too short'); return;
    }
    setStatus('loading');
    try {
      const { supabase } = await import('../services/supabaseClient');
      if (!supabase) throw new Error('Authentication is not configured');
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setStatus('done'); setMsg('Password updated');
      sounds.playTap();
      onDone?.();
    } catch (err: any) {
      setStatus('error'); setMsg(err.message || 'Failed');
    }
  };

  if (status === 'done') return <div className="p-4 text-teal-600 font-bold">{msg}</div>;

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="relative"><Lock className="w-4 h-4 absolute left-3 top-2.5 text-stone-400" /><input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="New password" className="w-full pl-9 pr-3 py-2 rounded-xl bg-stone-100 dark:bg-[#11222D] border border-stone-200 dark:border-white/10 text-sm" /></div>
      <div className="relative"><Lock className="w-4 h-4 absolute left-3 top-2.5 text-stone-400" /><input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Confirm" className="w-full pl-9 pr-3 py-2 rounded-xl bg-stone-100 dark:bg-[#11222D] border border-stone-200 dark:border-white/10 text-sm" /></div>
      {status === 'error' && <div className="text-red-500 text-xs font-bold flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {msg}</div>}
      <button type="submit" disabled={status === 'loading'} className="w-full py-2.5 bg-teal-600 text-white rounded-xl font-bold text-sm shadow-xs disabled:opacity-50">{status === 'loading' ? 'Saving...' : 'Change Password'}</button>
    </form>
  );
};
