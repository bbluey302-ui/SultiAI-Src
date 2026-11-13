import React, { useState, useEffect } from 'react';
import { 
  Users, Heart, Award, Sparkles, RefreshCw, CheckCircle, 
  Search, Shield, MapPin, Clock, Mic, Activity 
} from 'lucide-react';
import { AdminLearner } from '@/src/types';
import { adminApi, subscribeToTable, isSupabaseConfigured } from '../services/adminApi';

interface LearnersManagementProps {
  onLearnerAction?: () => void;
}

export function LearnersManagement({ onLearnerAction }: LearnersManagementProps) {
  const [learners, setLearners] = useState<AdminLearner[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const fetchLearners = async () => {
    setLoading(true);
    try {
      const res = await adminApi('/api/admin/learners');
      if (res.ok) {
        const data = await res.json();
        setLearners(data.learners || []);
      }
    } catch (err) {
      console.error('Failed to fetch learners:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLearners();
  }, []);

  // Live sync: refresh whenever the LEARNER backend upserts learner progress.
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const unsubscribe = subscribeToTable('learner_accounts', () => fetchLearners());
    return unsubscribe;
  }, []);

  const handleAction = async (id: string, action: string, payload: any = {}) => {
    try {
      const res = await adminApi(`/api/admin/learners/${id}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...payload }),
      });
      if (res.ok) {
        setActionSuccess(`Action ${action} executed successfully!`);
        setTimeout(() => setActionSuccess(null), 3000);
        fetchLearners();
        if (onLearnerAction) onLearnerAction();
      }
    } catch (err) {
      console.error('Learner action failed:', err);
    }
  };

  const filteredLearners = learners.filter((l) => {
    if (!searchTerm) return true;
    const s = searchTerm.toLowerCase();
    return l.name.toLowerCase().includes(s) || l.email.toLowerCase().includes(s) || l.role.toLowerCase().includes(s);
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-[#11222D] p-5 rounded-2xl border border-stone-200 dark:border-white/10 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-stone-900 dark:text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-teal-600" />
            Learner Accounts & Progression Management
          </h2>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
            Supervise enrolled non-native students, speech performance scores, dialect assignments, and energy hearts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filter student..."
              className="pl-8 pr-3 py-1.5 rounded-xl text-xs bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <button
            onClick={fetchLearners}
            className="p-1.5 rounded-xl text-stone-500 hover:text-stone-800 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-stone-800"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-semibold flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          {actionSuccess}
        </div>
      )}

      {/* Learners Table */}
      <div className="bg-white dark:bg-[#11222D] rounded-2xl border border-stone-200 dark:border-white/10 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-100/60 dark:bg-stone-800/50 text-stone-600 dark:text-stone-300 font-semibold border-b border-stone-200 dark:border-white/10">
              <tr>
                <th className="px-4 py-3">Learner Profile</th>
                <th className="px-4 py-3">Dialect Track</th>
                <th className="px-4 py-3">Experience (XP)</th>
                <th className="px-4 py-3">Energy Hearts</th>
                <th className="px-4 py-3">Speech Acc.</th>
                <th className="px-4 py-3">Vocab Mastered</th>
                <th className="px-4 py-3 text-right">Admin Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-white/5">
              {filteredLearners.map((learner) => (
                <tr key={learner.id} className="hover:bg-stone-50/50 dark:hover:bg-stone-800/30 transition-colors">
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-teal-600/10 text-teal-700 dark:text-teal-300 font-bold flex items-center justify-center text-xs">
                        {learner.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <span className="font-bold text-stone-900 dark:text-white block">{learner.name}</span>
                        <span className="text-[11px] text-stone-400 block">{learner.email}</span>
                        <span className="text-[10px] text-teal-600 font-medium">{learner.role}</span>
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700">
                      {learner.targetDialect === 'davao_bisaya' ? '🦅 Davao Bisaya' : learner.targetDialect === 'boholano' ? '🐒 Boholano' : '🌊 Cebuano Standard'}
                    </span>
                  </td>

                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                      <span className="font-bold text-stone-900 dark:text-white font-mono">{learner.xp} XP</span>
                    </div>
                    <span className="text-[10px] text-stone-400">🔥 {learner.streakDays} Day Streak</span>
                  </td>

                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <div className="flex items-center gap-1 font-bold text-rose-600">
                      <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
                      <span>{learner.hearts} / 5</span>
                    </div>
                    <span className="text-[10px] text-stone-400">Max Energy</span>
                  </td>

                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <div className="flex items-center gap-1.5 font-bold text-emerald-600">
                      <Mic className="w-3.5 h-3.5" />
                      <span>{learner.speechScoreAverage}%</span>
                    </div>
                    <span className="text-[10px] text-stone-400">Whisper WER Evaluated</span>
                  </td>

                  <td className="px-4 py-3.5 whitespace-nowrap font-mono font-bold text-stone-800 dark:text-stone-200">
                    {learner.vocabularyMastered} words
                  </td>

                  <td className="px-4 py-3.5 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleAction(learner.id, 'refill_hearts')}
                        className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 text-xs font-semibold transition-colors flex items-center gap-1 border border-rose-200 dark:border-rose-800/60"
                        title="Refill 5 energy hearts"
                      >
                        <Heart className="w-3 h-3 fill-rose-500" />
                        Refill
                      </button>

                      <button
                        onClick={() => handleAction(learner.id, 'grant_xp', { amount: 100 })}
                        className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 text-xs font-semibold transition-colors flex items-center gap-1 border border-indigo-200 dark:border-indigo-800/60"
                        title="Grant bonus experience"
                      >
                        <Award className="w-3 h-3 text-indigo-500" />
                        +100 XP
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
