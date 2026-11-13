import React, { useState } from 'react';
import { X, Award, BookOpen, CheckCircle2, Flame, Sparkles, Trophy, Mic, Compass, ArrowRight, Lock, Target, ChevronRight } from 'lucide-react';
import { UserProfile, LearnerBadgeState } from '../../types';
import { TOOLKIT_MODULES } from '../../data/toolkitModulesData';
import { ALL_LANGUAGE_PATHS } from '../../data/languageJourneyData';
import { VOICE_LEVELS, getStoredVoiceProgress } from '../../data/voiceGamificationData';
import { mergeBadgeStates } from '../../utils/badges';
import { getToolkitProgress } from '../../utils/toolkitProgress';
import { sounds } from '../../utils/soundEffects';

interface LearningProgressModalProps {
  profile: UserProfile;
  badgeStates?: LearnerBadgeState[];
  onNavigateToLearn: () => void;
  onClose: () => void;
}

export const LearningProgressModal: React.FC<LearningProgressModalProps> = ({
  profile,
  badgeStates = [],
  onNavigateToLearn,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'modules' | 'badges' | 'levels'>('modules');
  const [voiceProgress] = useState(getStoredVoiceProgress);

  const completedSet = new Set(profile.completedLessons);
  const completedCount = completedSet.size;
  const toolkitProgress = getToolkitProgress(profile.completedLessons);
  const cebuanoLevels = ALL_LANGUAGE_PATHS.cebuano.levels;
  const cebuanoChallenges = cebuanoLevels.flatMap((level) => level.challenges);
  const completedCebuano = cebuanoChallenges.filter((challenge) => completedSet.has(challenge.id)).length;
  const overallCurriculumPercent = cebuanoChallenges.length > 0
    ? Math.min(100, Math.round((completedCebuano / cebuanoChallenges.length) * 100))
    : 0;
  const displayBadges = mergeBadgeStates(badgeStates);
  const unlockedBadges = displayBadges.filter((badge) => badge.unlocked).length;
  const currentLevel = cebuanoLevels.find((level) =>
    level.challenges.some((challenge) => !completedSet.has(challenge.id)),
  ) || cebuanoLevels[cebuanoLevels.length - 1];
  const currentLevelLabel = `Level ${currentLevel.levelNumber}: ${currentLevel.title}`;
  const roadmapLevels = cebuanoLevels.map((level, index) => {
    const done = level.challenges.filter((challenge) => completedSet.has(challenge.id)).length;
    const total = level.challenges.length;
    const previousComplete = index === 0 || cebuanoLevels[index - 1].challenges.every(
      (challenge) => completedSet.has(challenge.id),
    );
    const status = total > 0 && done >= total
      ? 'Completed'
      : previousComplete
      ? 'In Progress'
      : 'Locked';
    return {
      level: level.levelNumber,
      title: level.title,
      desc: level.subtitle,
      status,
      unlocked: previousComplete || done > 0,
      progress: `${done}/${total}`,
    };
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md bg-white dark:bg-[#11222D] rounded-3xl border border-stone-200 dark:border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        role="dialog"
        aria-labelledby="progress-modal-title"
      >
        {/* Header */}
        <div className="p-4 border-b border-stone-200/80 dark:border-white/10 flex items-center justify-between bg-stone-50/50 dark:bg-stone-900/40">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-teal-50 dark:bg-teal-950/70 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold">
              <Trophy className="w-4 h-4" />
            </div>
            <div>
              <h2 id="progress-modal-title" className="font-display font-black text-sm text-stone-900 dark:text-white">
                My Learning Progress
              </h2>
              <p className="text-[10px] text-stone-500 dark:text-stone-400">
                13 Modules · Level Mastery · Verified Milestones
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

        {/* Top Summary Card */}
        <div className="p-4 bg-gradient-to-r from-teal-500/10 via-emerald-500/10 to-teal-500/5 border-b border-stone-200/70 dark:border-white/5 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-teal-700 dark:text-teal-300 font-bold block">
                Current Level Mastery
              </span>
              <h3 className="font-display font-black text-base text-stone-900 dark:text-white">
                {currentLevelLabel}
              </h3>
            </div>
            <div className="text-right">
              <span className="text-xl font-black font-mono text-teal-600 dark:text-teal-400">
                {overallCurriculumPercent}%
              </span>
              <span className="text-[10px] text-stone-500 dark:text-stone-400 block font-medium">
                Curriculum Clear
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-stone-200 dark:bg-stone-800 h-2.5 rounded-full overflow-hidden">
            <div 
              className="bg-gradient-to-r from-teal-500 to-emerald-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${overallCurriculumPercent}%` }}
            />
          </div>

          {/* Quick Metrics Strip */}
          <div className="grid grid-cols-4 gap-2 pt-1 text-center text-xs">
            <div className="p-2 bg-white/80 dark:bg-stone-800/80 rounded-xl border border-stone-200/60 dark:border-white/5">
              <div className="font-mono font-black text-stone-900 dark:text-white">{completedCount}</div>
              <div className="text-[9px] text-stone-500 dark:text-stone-400">Lessons</div>
            </div>
            <div className="p-2 bg-white/80 dark:bg-stone-800/80 rounded-xl border border-stone-200/60 dark:border-white/5">
              <div className="font-mono font-black text-amber-600 dark:text-amber-400">{profile.streakDays}d</div>
              <div className="text-[9px] text-stone-500 dark:text-stone-400">Streak</div>
            </div>
            <div className="p-2 bg-white/80 dark:bg-stone-800/80 rounded-xl border border-stone-200/60 dark:border-white/5">
              <div className="font-mono font-black text-teal-600 dark:text-teal-400">{profile.vocabularyMastered}</div>
              <div className="text-[9px] text-stone-500 dark:text-stone-400">Vocab</div>
            </div>
            <div className="p-2 bg-white/80 dark:bg-stone-800/80 rounded-xl border border-stone-200/60 dark:border-white/5">
              <div className="font-mono font-black text-indigo-600 dark:text-indigo-400">{profile.speechScoreAverage}%</div>
              <div className="text-[9px] text-stone-500 dark:text-stone-400">ASR Score</div>
            </div>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center gap-1 p-2 bg-stone-100 dark:bg-stone-900 border-b border-stone-200/60 dark:border-white/5">
          <button
            onClick={() => {
              sounds.playTap();
              setActiveTab('modules');
            }}
            className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'modules'
                ? 'bg-white dark:bg-[#152B37] text-teal-700 dark:text-teal-300 shadow-xs font-black'
                : 'text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
            }`}
          >
            13 Learn Modules
          </button>
          <button
            onClick={() => {
              sounds.playTap();
              setActiveTab('badges');
            }}
            className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'badges'
                ? 'bg-white dark:bg-[#152B37] text-teal-700 dark:text-teal-300 shadow-xs font-black'
                : 'text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
            }`}
          >
            Badges ({unlockedBadges})
          </button>
          <button
            onClick={() => {
              sounds.playTap();
              setActiveTab('levels');
            }}
            className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'levels'
                ? 'bg-white dark:bg-[#152B37] text-teal-700 dark:text-teal-300 shadow-xs font-black'
                : 'text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
            }`}
          >
            Roadmap Levels
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-4 overflow-y-auto flex-1 space-y-3">
          {/* TAB 1: 13 LEARN MODULES */}
          {activeTab === 'modules' && (
            <div className="space-y-2">
              <div className="text-[11px] font-mono text-stone-500 dark:text-stone-400 font-bold uppercase tracking-wider">
                Integrated Learning Toolkit (13 Specialized Modules)
              </div>
              {TOOLKIT_MODULES.map((mod) => (
                <div
                  key={mod.id}
                  className="p-3 bg-stone-50 dark:bg-stone-800/60 rounded-2xl border border-stone-200/80 dark:border-white/5 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{mod.icon}</span>
                      <div>
                        <div className="font-display font-black text-xs text-stone-900 dark:text-white flex items-center gap-1.5">
                          <span>#{mod.num} · {mod.title}</span>
                          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-teal-100 dark:bg-teal-950/70 text-teal-800 dark:text-teal-300 font-bold">
                            {mod.category}
                          </span>
                        </div>
                        <div className="text-[10px] text-stone-500 dark:text-stone-400">
                          {mod.purpose}
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono font-bold text-teal-600 dark:text-teal-400">
                      {toolkitProgress[mod.id] || 0}%
                    </span>
                  </div>

                  <div className="w-full bg-stone-200 dark:bg-stone-700 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-teal-500 h-full rounded-full"
                      style={{ width: `${toolkitProgress[mod.id] || 0}%` }}
                    />
                  </div>

                  {mod.educationalPurpose && (
                    <p className="text-[10px] text-stone-400 leading-tight">
                      🎯 {mod.educationalPurpose}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* TAB 2: BADGES GALLERY */}
          {activeTab === 'badges' && (
            <div className="space-y-4">
              {/* Voice badges */}
              <div className="space-y-2">
                <div className="text-[11px] font-mono text-stone-500 dark:text-stone-400 font-bold uppercase tracking-wider">
                  Dalang Tingog (Voice Mastery Badges)
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {VOICE_LEVELS.map((lvl) => {
                    const isEarned = voiceProgress.earnedBadges.includes(lvl.badge.id);
                    return (
                      <div
                        key={lvl.badge.id}
                        className={`p-2.5 rounded-2xl border flex items-center gap-2.5 ${
                          isEarned
                            ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-300/80 dark:border-amber-500/30'
                            : 'bg-stone-50 dark:bg-stone-800/40 border-stone-200 dark:border-white/5 opacity-60'
                        }`}
                      >
                        <span className="text-2xl">{isEarned ? lvl.badge.icon : '🔒'}</span>
                        <div className="min-w-0 flex-1">
                          <div className="font-display font-black text-xs text-stone-900 dark:text-white">
                            {lvl.badge.nameBisaya} ({lvl.badge.name})
                          </div>
                          <div className="text-[10px] text-stone-500 dark:text-stone-400">
                            {lvl.badge.criteria}
                          </div>
                        </div>
                        <span className="text-[9px] font-mono font-bold text-amber-600 dark:text-amber-400">
                          +{lvl.badge.xpReward} XP
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Master badges */}
              <div className="space-y-2">
                <div className="text-[11px] font-mono text-stone-500 dark:text-stone-400 font-bold uppercase tracking-wider">
                  Core Milestones & Skill Badges
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {displayBadges.map((b) => (
                    <div
                      key={b.id}
                      className={`p-3 rounded-2xl border space-y-1.5 text-center ${
                        b.unlocked
                          ? 'bg-white dark:bg-stone-800/80 border-stone-200 dark:border-teal-500/30 shadow-2xs'
                          : 'bg-stone-50 dark:bg-stone-800/30 border-stone-200 dark:border-white/5 opacity-50'
                      }`}
                    >
                      <div className="text-2xl">{b.icon}</div>
                      <div className="font-display font-black text-xs text-stone-900 dark:text-white">
                        {b.title}
                      </div>
                      <div className="text-[9.5px] text-stone-500 dark:text-stone-400 leading-tight">
                        {b.criteria}
                      </div>
                      <span className={`inline-block text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full ${
                        b.unlocked
                          ? 'bg-teal-100 dark:bg-teal-950/70 text-teal-800 dark:text-teal-300'
                          : 'bg-stone-200 dark:bg-stone-700 text-stone-500'
                      }`}>
                        {b.unlocked ? 'Unlocked ✓' : `${b.progressPercent}%`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ROADMAP LEVELS */}
          {activeTab === 'levels' && (
            <div className="space-y-2.5">
              {roadmapLevels.map((lvl) => (
                <div
                  key={lvl.level}
                  className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 ${
                    lvl.status === 'In Progress'
                      ? 'bg-teal-50/80 dark:bg-teal-950/60 border-teal-500 shadow-xs'
                      : lvl.unlocked
                      ? 'bg-white dark:bg-stone-800/70 border-stone-200 dark:border-white/10'
                      : 'bg-stone-50 dark:bg-stone-800/30 border-stone-200 dark:border-white/5 opacity-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-display font-black text-xs ${
                      lvl.unlocked ? 'bg-teal-600 text-white' : 'bg-stone-200 dark:bg-stone-700 text-stone-500'
                    }`}>
                      {lvl.unlocked ? lvl.level : <Lock className="w-3.5 h-3.5" />}
                    </div>
                    <div>
                      <div className="font-display font-black text-xs text-stone-900 dark:text-white">
                        Level {lvl.level}: {lvl.title}
                      </div>
                      <div className="text-[10px] text-stone-500 dark:text-stone-400">
                        {lvl.desc}
                      </div>
                    </div>
                  </div>
                  <span className={`text-[9.5px] font-mono font-bold px-2 py-0.5 rounded-full shrink-0 ${
                    lvl.status === 'In Progress'
                      ? 'bg-teal-500 text-stone-950 font-black'
                      : lvl.unlocked
                      ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300'
                      : 'bg-stone-200 dark:bg-stone-700 text-stone-500'
                  }`}>
                    {lvl.status} · {lvl.progress}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-stone-200/80 dark:border-white/10 flex items-center justify-between bg-stone-50/50 dark:bg-stone-900/40">
          <button
            onClick={() => {
              sounds.playTap();
              onClose();
            }}
            className="px-4 py-2 rounded-xl text-xs font-bold text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
          >
            Close
          </button>
          <button
            onClick={() => {
              sounds.playTap();
              onClose();
              onNavigateToLearn();
            }}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-teal-500 hover:bg-teal-400 text-stone-950 flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
          >
            <span>Open Learn Roadmap</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
