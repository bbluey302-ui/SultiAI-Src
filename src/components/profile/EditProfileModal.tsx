import React, { useState } from 'react';
import { X, Check, Camera, User, Clock, AlertCircle, Sparkles, Loader2 } from 'lucide-react';
import { UserProfile, TargetDialect } from '../../types';
import { sounds } from '../../utils/soundEffects';
import { addNotification } from '../../utils/notificationService';
import { supabase } from '../../services/supabaseClient';
import { authHeaders } from '../../services/tokenService';

interface EditProfileModalProps {
  profile: UserProfile;
  onSave: (updates: Partial<UserProfile>) => void;
  onOpenAvatarPicker: () => void;
  onClose: () => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  profile,
  onSave,
  onOpenAvatarPicker,
  onClose,
}) => {
  const [name, setName] = useState(profile.name);
  const [dailyGoalMinutes, setDailyGoalMinutes] = useState(profile.dailyGoalMinutes);
  const [targetDialect, setTargetDialect] = useState<TargetDialect>(profile.targetDialect);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;

    const trimmed = name.trim();
    if (trimmed.length < 2) {
      setError('Display name must be at least 2 characters long.');
      sounds.playWrong();
      return;
    }
    if (trimmed.length > 50) {
      setError('Display name cannot exceed 50 characters.');
      sounds.playWrong();
      return;
    }

    setSaving(true);
    setError(null);
    sounds.playTap();

    try {
      const updates: Partial<UserProfile> = {
        name: trimmed,
        dailyGoalMinutes,
        targetDialect,
      };

      // Sync to Supabase profiles table if available
      if (supabase && profile.id) {
        try {
          await supabase.from('profiles').update({
            full_name: trimmed,
            daily_goal_minutes: dailyGoalMinutes,
            target_dialect: targetDialect,
            updated_at: new Date().toISOString(),
          }).eq('id', profile.id);
        } catch (dbErr) {
          console.warn('Supabase profile update warning:', dbErr);
        }
      }

      // Also trigger the authenticated backend sync with safe preferences only.
      void authHeaders().then((headers) => fetch('/api/learner/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({
          name: trimmed,
          targetDialect,
          dailyGoalMinutes,
        }),
      })).catch(() => {});

      onSave(updates);

      addNotification({
        category: 'system',
        title: '✅ Profile Updated',
        titleBisaya: 'Na-update ang Imong Profile',
        message: `Saved display name "${trimmed}" and daily goal (${dailyGoalMinutes} min/day).`,
        iconType: 'sparkles',
      });

      sounds.playCorrect();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to save profile changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md bg-white dark:bg-[#11222D] rounded-3xl border border-stone-200 dark:border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        role="dialog"
        aria-labelledby="edit-profile-title"
      >
        {/* Header */}
        <div className="p-4 border-b border-stone-200/80 dark:border-white/10 flex items-center justify-between bg-stone-50/50 dark:bg-stone-900/40">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-teal-50 dark:bg-teal-950/70 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h2 id="edit-profile-title" className="font-display font-black text-sm text-stone-900 dark:text-white">
                Edit Profile
              </h2>
              <p className="text-[10px] text-stone-500 dark:text-stone-400">
                Update your display name, profile photo, and goal
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              sounds.playTap();
              onClose();
            }}
            disabled={saving}
            className="w-8 h-8 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-500 hover:text-stone-900 dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-500/30 rounded-2xl flex items-center gap-2 text-rose-700 dark:text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Avatar preview with trigger */}
          <div className="flex flex-col items-center justify-center py-2 space-y-2">
            <div className="relative group cursor-pointer" onClick={() => {
              sounds.playTap();
              onOpenAvatarPicker();
            }}>
              <img
                src={profile.avatar}
                alt={profile.name}
                className="w-20 h-20 rounded-full object-cover border-4 border-teal-500 shadow-md group-hover:opacity-90 transition-opacity"
              />
              <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="w-6 h-6 text-white" />
              </div>
              <button
                type="button"
                className="absolute -bottom-1 -right-1 p-1.5 bg-teal-500 text-stone-950 rounded-full shadow-md border-2 border-white dark:border-[#11222D]"
                title="Change Profile Photo"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
            </div>
            <button
              type="button"
              onClick={() => {
                sounds.playTap();
                onOpenAvatarPicker();
              }}
              className="text-xs font-bold text-teal-600 dark:text-teal-400 hover:underline cursor-pointer"
            >
              Upload or change photo
            </button>
          </div>

          {/* Display Name */}
          <div className="space-y-1.5">
            <label className="block text-xs font-black text-stone-900 dark:text-white">
              Display Name <span className="text-teal-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError(null);
              }}
              maxLength={50}
              required
              disabled={saving}
              placeholder="Your full or display name"
              className="w-full bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-white/10 rounded-2xl px-3.5 py-2.5 text-xs font-medium text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all"
            />
            <div className="flex items-center justify-between text-[10px] text-stone-500 dark:text-stone-400">
              <span>Visible on leaderboard and class roster</span>
              <span className="font-mono">{name.length}/50</span>
            </div>
          </div>

          {/* Email Address (Read-only security note) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-black text-stone-900 dark:text-white">
                Account Email
              </label>
              <span className="text-[9.5px] font-mono text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/70 px-2 py-0.5 rounded-full border border-teal-200 dark:border-teal-500/30">
                Verified Account
              </span>
            </div>
            <input
              type="email"
              value={profile.email}
              readOnly
              disabled
              className="w-full bg-stone-100 dark:bg-stone-800/40 border border-stone-200 dark:border-white/5 rounded-2xl px-3.5 py-2.5 text-xs text-stone-500 dark:text-stone-400 cursor-not-allowed font-mono"
            />
            <p className="text-[10px] text-stone-400 leading-tight">
              Email changes must be requested through Account & Security with verification.
            </p>
          </div>

          {/* Daily Goal Commitment */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-black text-stone-900 dark:text-white">
                Daily Learning Goal
              </label>
              <span className="text-[10px] font-mono font-bold text-teal-600 dark:text-teal-400">
                {dailyGoalMinutes} min / day
              </span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[10, 15, 20, 30].map((mins) => (
                <button
                  type="button"
                  key={mins}
                  onClick={() => {
                    sounds.playTap();
                    setDailyGoalMinutes(mins);
                  }}
                  className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    dailyGoalMinutes === mins
                      ? 'bg-teal-600 text-white shadow-xs font-black'
                      : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'
                  }`}
                >
                  {mins}m
                </button>
              ))}
            </div>
          </div>


          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                sounds.playTap();
                onClose();
              }}
              disabled={saving}
              className="px-4 py-2.5 rounded-2xl text-xs font-bold text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 rounded-2xl text-xs font-bold bg-teal-500 hover:bg-teal-400 text-stone-950 flex items-center gap-1.5 shadow-md transition-all cursor-pointer disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
