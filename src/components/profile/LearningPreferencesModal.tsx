import React, { useState } from 'react';
import { X, Check, Globe, Sliders, Volume2, Mic, Bot, Sparkles, BookOpen } from 'lucide-react';
import { TargetDialect, MajorLanguageId, UserProfile } from '../../types';
import { sounds } from '../../utils/soundEffects';
import { addNotification } from '../../utils/notificationService';
import { AI_COACHES } from '../../data/aiCoachesData';
import { AiCoachId } from '../../types/aiHub';

interface LearningPreferencesModalProps {
  profile: UserProfile;
  onSavePreferences: (updates: {
    targetDialect: TargetDialect;
    dailyGoalMinutes: number;
    preferredLanguage?: MajorLanguageId;
    preferredCoach?: AiCoachId;
    playbackSpeed?: number;
  }) => void;
  onClose: () => void;
}

export const LearningPreferencesModal: React.FC<LearningPreferencesModalProps> = ({
  profile,
  onSavePreferences,
  onClose,
}) => {
  const [selectedLanguage, setSelectedLanguage] = useState<MajorLanguageId>(() => {
    return (localStorage.getItem('sultiai_selected_language') as MajorLanguageId) || 'cebuano';
  });
  const [targetDialect, setTargetDialect] = useState<TargetDialect>(profile.targetDialect);
  const [dailyGoalMinutes, setDailyGoalMinutes] = useState(profile.dailyGoalMinutes);
  const [preferredCoach, setPreferredCoach] = useState<AiCoachId>(() => {
    return (localStorage.getItem('sultiai_preferred_coach') as AiCoachId) || 'jen';
  });
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(() => {
    const saved = localStorage.getItem('sultiai_audio_speed');
    return saved ? parseFloat(saved) : 1.0;
  });

  const handleSave = () => {
    sounds.playTap();

    localStorage.setItem('sultiai_selected_language', selectedLanguage);
    localStorage.setItem('sultiai_preferred_coach', preferredCoach);
    localStorage.setItem('sultiai_audio_speed', playbackSpeed.toString());

    onSavePreferences({
      targetDialect,
      dailyGoalMinutes,
      preferredLanguage: selectedLanguage,
      preferredCoach,
      playbackSpeed,
    });

    addNotification({
      category: 'admin',
      title: '🎯 Learning Preferences Saved',
      titleBisaya: 'Na-save ang Imong Pagpili sa Pagtuon',
      message: `Set to ${selectedLanguage.toUpperCase()} (${targetDialect}) with ${dailyGoalMinutes} min/day commitment.`,
      iconType: 'sliders',
    });

    sounds.playCorrect();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md bg-white dark:bg-[#11222D] rounded-3xl border border-stone-200 dark:border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        role="dialog"
        aria-labelledby="learning-prefs-title"
      >
        {/* Header */}
        <div className="p-4 border-b border-stone-200/80 dark:border-white/10 flex items-center justify-between bg-stone-50/50 dark:bg-stone-900/40">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-teal-50 dark:bg-teal-950/70 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h2 id="learning-prefs-title" className="font-display font-black text-sm text-stone-900 dark:text-white">
                Learning Preferences
              </h2>
              <p className="text-[10px] text-stone-500 dark:text-stone-400">
                Configure your target language, dialect, and voice pacing
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
        <div className="p-5 space-y-5 overflow-y-auto flex-1">
          {/* SECTION 1: TARGET PRIMARY LANGUAGE */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-stone-900 dark:text-white flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                Primary Target Language
              </label>
              <span className="text-[9.5px] font-mono text-stone-500 dark:text-stone-400">
                Preserves all progress
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'cebuano', name: 'Bisaya', flag: '🇵🇭', subtitle: 'Cebuano' },
                { id: 'filipino', name: 'Filipino', flag: '🇵🇭', subtitle: 'Tagalog' },
                { id: 'english', name: 'English', flag: '🌐', subtitle: 'Professional' },
              ].map((lang) => {
                const isSelected = selectedLanguage === lang.id;
                return (
                  <button
                    key={lang.id}
                    type="button"
                    onClick={() => {
                      sounds.playTap();
                      setSelectedLanguage(lang.id as MajorLanguageId);
                    }}
                    className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-teal-50 dark:bg-teal-950/70 border-teal-500 text-teal-950 dark:text-teal-200 font-black shadow-xs ring-2 ring-teal-500/20'
                        : 'bg-stone-50 dark:bg-stone-800/60 border-stone-200 dark:border-white/10 text-stone-700 dark:text-stone-300'
                    }`}
                  >
                    <span className="text-lg block">{lang.flag}</span>
                    <span className="text-xs font-bold block mt-1">{lang.name}</span>
                    <span className="text-[9.5px] text-stone-500 dark:text-stone-400 block font-mono">
                      {lang.subtitle}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* SECTION 2: REGIONAL DIALECT VARIETY */}
          <div className="space-y-2">
            <label className="text-xs font-black text-stone-900 dark:text-white flex items-center gap-1.5">
              <Mic className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              Regional Dialect & Acoustic Tolerance
            </label>
            <div className="space-y-2">
              {[
                {
                  id: 'davao_bisaya',
                  title: 'Davao Bisaya',
                  desc: 'Mindanao urban variety with modal particles (bitaw, gud, lagi) and loanwords.',
                  badge: 'Recommended for Davao',
                },
                {
                  id: 'cebuano_standard',
                  title: 'Cebuano Standard',
                  desc: 'Central Visayas standard orthography with formal grammatical roots.',
                  badge: 'Formal Visayan',
                },
                {
                  id: 'boholano',
                  title: 'Boholano (Bol-anon)',
                  desc: 'Bohol phonetic shifts (y -> j, e.g., "maajo kaajo") and localized vocabulary.',
                  badge: 'Bohol Variety',
                },
              ].map((d) => {
                const isSelected = targetDialect === d.id;
                return (
                  <div
                    key={d.id}
                    onClick={() => {
                      sounds.playTap();
                      setTargetDialect(d.id as TargetDialect);
                    }}
                    className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 ${
                      isSelected
                        ? 'bg-teal-50/80 dark:bg-teal-950/60 border-teal-500 text-stone-900 dark:text-white shadow-xs'
                        : 'bg-stone-50 dark:bg-stone-800/50 border-stone-200 dark:border-white/10 text-stone-600 dark:text-stone-300 hover:border-teal-400/50'
                    }`}
                  >
                    <div className="pt-0.5">
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        isSelected ? 'border-teal-500 bg-teal-500 text-white' : 'border-stone-400'
                      }`}>
                        {isSelected && <span className="text-[10px] font-bold">✓</span>}
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black">{d.title}</span>
                        <span className="text-[9px] font-mono font-bold bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300 px-1.5 py-0.5 rounded">
                          {d.badge}
                        </span>
                      </div>
                      <p className="text-[10.5px] text-stone-500 dark:text-stone-400 mt-0.5">
                        {d.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SECTION 3: PREFERRED AI COACH */}
          <div className="space-y-2">
            <label className="text-xs font-black text-stone-900 dark:text-white flex items-center gap-1.5">
              <Bot className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              Default AI Practice Coach
            </label>
            <div className="grid grid-cols-2 gap-2">
              {AI_COACHES.map((coach) => {
                const isSelected = preferredCoach === coach.id;
                return (
                  <button
                    key={coach.id}
                    type="button"
                    onClick={() => {
                      sounds.playTap();
                      setPreferredCoach(coach.id);
                    }}
                    className={`p-2.5 rounded-2xl border text-left transition-all flex items-center gap-2.5 cursor-pointer ${
                      isSelected
                        ? 'bg-teal-50/80 dark:bg-teal-950/60 border-teal-500 shadow-xs ring-1 ring-teal-500/30'
                        : 'bg-stone-50 dark:bg-stone-800/50 border-stone-200 dark:border-white/10'
                    }`}
                  >
                    <img
                      src={coach.avatar}
                      alt={coach.name}
                      className="w-9 h-9 rounded-full object-cover shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-black text-stone-900 dark:text-white truncate">
                        {coach.name}
                      </div>
                      <div className="text-[9.5px] text-stone-500 dark:text-stone-400 truncate">
                        {coach.role}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* SECTION 4: AUDIO PLAYBACK SPEED */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-stone-900 dark:text-white flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                Speech Synthesis Speed
              </label>
              <span className="text-[10px] font-mono font-bold text-teal-600 dark:text-teal-400">
                {playbackSpeed}x
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { val: 0.85, label: '0.85x Slow (Beginner)' },
                { val: 1.0, label: '1.0x Normal (Standard)' },
                { val: 1.15, label: '1.15x Fast (Native)' },
              ].map((s) => (
                <button
                  key={s.val}
                  type="button"
                  onClick={() => {
                    sounds.playTap();
                    setPlaybackSpeed(s.val);
                  }}
                  className={`py-2 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                    playbackSpeed === s.val
                      ? 'bg-teal-600 text-white font-black shadow-xs'
                      : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-stone-200/80 dark:border-white/10 flex items-center justify-between bg-stone-50/50 dark:bg-stone-900/40">
          <span className="text-[10px] text-stone-400">
            Changes take effect immediately
          </span>
          <div className="flex items-center gap-2">
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
              className="px-4 py-2 rounded-xl text-xs font-bold bg-teal-500 hover:bg-teal-400 text-stone-950 flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Save Preferences</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
