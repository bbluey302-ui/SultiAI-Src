import React, { useState } from 'react';
import { X, Bell, Check, Flame, Trophy, Shield, Sparkles, BookOpen, Volume2 } from 'lucide-react';
import { NotificationPreferences, DEFAULT_NOTIFICATION_PREFS } from './types';
import { sounds } from '../../utils/soundEffects';
import { addNotification } from '../../utils/notificationService';

interface NotificationSettingsModalProps {
  onClose: () => void;
}

export const NotificationSettingsModal: React.FC<NotificationSettingsModalProps> = ({ onClose }) => {
  const [prefs, setPrefs] = useState<NotificationPreferences>(() => {
    try {
      const saved = localStorage.getItem('sultiai_notification_preferences');
      return saved ? JSON.parse(saved) : DEFAULT_NOTIFICATION_PREFS;
    } catch {
      return DEFAULT_NOTIFICATION_PREFS;
    }
  });

  const [saving, setSaving] = useState(false);

  const togglePref = (key: keyof NotificationPreferences) => {
    sounds.playTap();
    setPrefs((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSave = () => {
    setSaving(true);
    sounds.playTap();
    localStorage.setItem('sultiai_notification_preferences', JSON.stringify(prefs));

    addNotification({
      category: 'system',
      title: '🔔 Notification Preferences Saved',
      titleBisaya: 'Na-save ang Imong Pahibalo',
      message: 'In-app reminders and milestone banners updated successfully.',
      iconType: 'sparkles',
    });

    sounds.playCorrect();
    setTimeout(() => {
      setSaving(false);
      onClose();
    }, 200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md bg-white dark:bg-[#11222D] rounded-3xl border border-stone-200 dark:border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        role="dialog"
        aria-labelledby="notifications-title"
      >
        {/* Header */}
        <div className="p-4 border-b border-stone-200/80 dark:border-white/10 flex items-center justify-between bg-stone-50/50 dark:bg-stone-900/40">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-teal-50 dark:bg-teal-950/70 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h2 id="notifications-title" className="font-display font-black text-sm text-stone-900 dark:text-white">
                Notification Preferences
              </h2>
              <p className="text-[10px] text-stone-500 dark:text-stone-400">
                Control in-app alerts and practice reminders
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              sounds.playTap();
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-500 hover:text-stone-900 dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* Informational banner about In-App delivery vs Push */}
          <div className="p-3 bg-teal-50/70 dark:bg-teal-950/40 border border-teal-200/80 dark:border-teal-500/20 rounded-2xl text-[11px] text-teal-900 dark:text-teal-200 leading-relaxed">
            ℹ️ <strong>In-App Notification Center:</strong> All active categories appear inside the Top Bar bell indicator. Hardware OS push requires browser notifications permission when enabled.
          </div>

          <div className="space-y-3">
            {/* Setting 1: Daily Practice Reminder */}
            <div 
              onClick={() => togglePref('dailyPracticeReminder')}
              className="p-3.5 bg-stone-50 dark:bg-stone-800/60 rounded-2xl border border-stone-200/80 dark:border-white/5 flex items-center justify-between cursor-pointer hover:border-teal-500/40 transition-all"
            >
              <div className="flex items-start gap-3 min-w-0 pr-2">
                <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Flame className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-display font-black text-xs text-stone-900 dark:text-white">
                    Daily Practice Reminders
                  </div>
                  <p className="text-[10.5px] text-stone-500 dark:text-stone-400 leading-tight">
                    Gentle prompts to keep your 15-minute daily Bisaya goal active before midnight.
                  </p>
                </div>
              </div>
              <div className={`w-11 h-6 rounded-full transition-colors flex items-center px-0.5 shrink-0 ${
                prefs.dailyPracticeReminder ? 'bg-teal-500 justify-end' : 'bg-stone-300 dark:bg-stone-700 justify-start'
              }`}>
                <div className="w-5 h-5 rounded-full bg-white shadow-xs" />
              </div>
            </div>

            {/* Setting 2: Streak Milestones */}
            <div 
              onClick={() => togglePref('streakMilestones')}
              className="p-3.5 bg-stone-50 dark:bg-stone-800/60 rounded-2xl border border-stone-200/80 dark:border-white/5 flex items-center justify-between cursor-pointer hover:border-teal-500/40 transition-all"
            >
              <div className="flex items-start gap-3 min-w-0 pr-2">
                <div className="w-8 h-8 rounded-xl bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Trophy className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-display font-black text-xs text-stone-900 dark:text-white">
                    Streak & Badge Celebrations
                  </div>
                  <p className="text-[10.5px] text-stone-500 dark:text-stone-400 leading-tight">
                    Alerts when you reach streak thresholds (7 days, 14 days) and earn gamification gems.
                  </p>
                </div>
              </div>
              <div className={`w-11 h-6 rounded-full transition-colors flex items-center px-0.5 shrink-0 ${
                prefs.streakMilestones ? 'bg-teal-500 justify-end' : 'bg-stone-300 dark:bg-stone-700 justify-start'
              }`}>
                <div className="w-5 h-5 rounded-full bg-white shadow-xs" />
              </div>
            </div>

            {/* Setting 3: Whisper Concordance Feedback */}
            <div 
              onClick={() => togglePref('whisperAcousticFeedback')}
              className="p-3.5 bg-stone-50 dark:bg-stone-800/60 rounded-2xl border border-stone-200/80 dark:border-white/5 flex items-center justify-between cursor-pointer hover:border-teal-500/40 transition-all"
            >
              <div className="flex items-start gap-3 min-w-0 pr-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Volume2 className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-display font-black text-xs text-stone-900 dark:text-white">
                    Whisper Speech Concordance
                  </div>
                  <p className="text-[10.5px] text-stone-500 dark:text-stone-400 leading-tight">
                    Detailed Word Error Rate (WER) and phoneme evaluations after speaking exercises.
                  </p>
                </div>
              </div>
              <div className={`w-11 h-6 rounded-full transition-colors flex items-center px-0.5 shrink-0 ${
                prefs.whisperAcousticFeedback ? 'bg-teal-500 justify-end' : 'bg-stone-300 dark:bg-stone-700 justify-start'
              }`}>
                <div className="w-5 h-5 rounded-full bg-white shadow-xs" />
              </div>
            </div>

            {/* Setting 4: Account Security Alerts */}
            <div 
              onClick={() => togglePref('accountSecurityAlerts')}
              className="p-3.5 bg-stone-50 dark:bg-stone-800/60 rounded-2xl border border-stone-200/80 dark:border-white/5 flex items-center justify-between cursor-pointer hover:border-teal-500/40 transition-all"
            >
              <div className="flex items-start gap-3 min-w-0 pr-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-display font-black text-xs text-stone-900 dark:text-white">
                    Account & Security Alerts
                  </div>
                  <p className="text-[10.5px] text-stone-500 dark:text-stone-400 leading-tight">
                    Critical security events, profile password updates, and session logins.
                  </p>
                </div>
              </div>
              <div className={`w-11 h-6 rounded-full transition-colors flex items-center px-0.5 shrink-0 ${
                prefs.accountSecurityAlerts ? 'bg-teal-500 justify-end' : 'bg-stone-300 dark:bg-stone-700 justify-start'
              }`}>
                <div className="w-5 h-5 rounded-full bg-white shadow-xs" />
              </div>
            </div>

            {/* Setting 5: Curriculum Updates */}
            <div 
              onClick={() => togglePref('curriculumUpdates')}
              className="p-3.5 bg-stone-50 dark:bg-stone-800/60 rounded-2xl border border-stone-200/80 dark:border-white/5 flex items-center justify-between cursor-pointer hover:border-teal-500/40 transition-all"
            >
              <div className="flex items-start gap-3 min-w-0 pr-2">
                <div className="w-8 h-8 rounded-xl bg-sky-100 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0 mt-0.5">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-display font-black text-xs text-stone-900 dark:text-white">
                    Curriculum & Scenarios Updates
                  </div>
                  <p className="text-[10.5px] text-stone-500 dark:text-stone-400 leading-tight">
                    Broadcasts when new Bankerohan Market or Davao jeepney dialogues are published.
                  </p>
                </div>
              </div>
              <div className={`w-11 h-6 rounded-full transition-colors flex items-center px-0.5 shrink-0 ${
                prefs.curriculumUpdates ? 'bg-teal-500 justify-end' : 'bg-stone-300 dark:bg-stone-700 justify-start'
              }`}>
                <div className="w-5 h-5 rounded-full bg-white shadow-xs" />
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-stone-200/80 dark:border-white/10 flex items-center justify-between bg-stone-50/50 dark:bg-stone-900/40">
          <button
            onClick={() => {
              sounds.playTap();
              onClose();
            }}
            className="px-4 py-2 rounded-xl text-xs font-bold text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2.5 rounded-2xl text-xs font-bold bg-teal-500 hover:bg-teal-400 text-stone-950 flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Save Preferences</span>
          </button>
        </div>
      </div>
    </div>
  );
};
