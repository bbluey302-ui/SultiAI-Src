import React, { useMemo, useState } from 'react';
import { 
  Check, Lock, Play, Sparkles, Trophy, Award, Star, Flame, 
  ChevronDown, MessageCircle, Wrench, ShieldCheck, ArrowRight,
  Zap, Compass, RefreshCw, Volume2, Globe, Heart, Target
} from 'lucide-react';
import { 
  JourneyLevel, JourneyChallenge, UserProfile, Lesson, Module,
  LearnerBadgeState, LearnerCertificateState,
} from '../../types';
import { 
  ALL_LANGUAGE_PATHS, SULTI_COMPANION_TIPS
} from '../../data/languageJourneyData';
import { LevelMasteryModal } from './LevelMasteryModal';
import { BadgesModal } from './BadgesModal';
import { LearningToolkitDrawer } from './LearningToolkitDrawer';
import { sounds } from '../../utils/soundEffects';
import { mergeBadgeStates } from '../../utils/badges';
import { LearningLanguageSelector } from '../shared/LearningLanguageSelector';
import { useLearningLanguage } from '../../hooks/useLearningLanguage';

interface LanguageJourneyMapProps {
  profile?: UserProfile;
  completedLessons: string[];
  modules: Module[];
  onStartLesson: (lesson: Lesson) => void;
  onOpenSulti?: (prompt?: string) => void;
  onOpenQuickPractice?: (toolId: string) => void;
  onOpenCertificateModal?: () => void;
  onGoToProfile?: () => void;
  badgeStates?: LearnerBadgeState[];
  certificate?: LearnerCertificateState | null;
}

export const LanguageJourneyMap: React.FC<LanguageJourneyMapProps> = ({
  profile,
  completedLessons,
  modules,
  onStartLesson,
  onOpenSulti,
  onOpenQuickPractice,
  onOpenCertificateModal,
  onGoToProfile,
  badgeStates = [],
  certificate,
}) => {
  // Current active language path (shared with Sulti AI + Curriculum Hub)
  const [selectedLanguage, setSelectedLanguage] = useLearningLanguage();

  // Modals state
  const [inspectingLockedLevel, setInspectingLockedLevel] = useState<JourneyLevel | null>(null);
  const [showBadgesModal, setShowBadgesModal] = useState(false);
  const [showToolsDrawer, setShowToolsDrawer] = useState(false);

  // Companion feedback index
  const [companionTipIndex, setCompanionTipIndex] = useState(0);

  const currentLanguageData = ALL_LANGUAGE_PATHS[selectedLanguage];
  const levels = currentLanguageData.levels;

  // Completion is server-owned. The Journey map only renders the snapshot it
  // receives from `completedLessons`; no local demo IDs or state can unlock a
  // level.
  const completedSet = useMemo(() => new Set(completedLessons), [completedLessons]);
  const isChallengeCompleted = (challengeId: string) => completedSet.has(challengeId);

  // Determine which challenge is currently active/in-progress
  let activeChallenge: JourneyChallenge | null = null;
  let activeLevel: JourneyLevel = levels[0];

  for (const lvl of levels) {
    for (const ch of lvl.challenges) {
      if (!isChallengeCompleted(ch.id)) {
        activeChallenge = ch;
        activeLevel = lvl;
        break;
      }
    }
    if (activeChallenge) break;
  }
  if (!activeChallenge) activeLevel = levels[levels.length - 1];

  // Level unlock logic based on mastery requirements
  const isLevelUnlocked = (lvl: JourneyLevel) => {
    if (lvl.levelNumber === 1) return true;
    if (lvl.levelNumber === 2) {
      const lvl1 = levels[0];
      return lvl1.challenges.every((challenge) => completedSet.has(challenge.id));
    }
    // For subsequent levels, check if the previous level is complete.
    const prevLvl = levels[lvl.levelNumber - 2];
    if (!prevLvl) return false;
    return prevLvl.challenges.every((challenge) => completedSet.has(challenge.id));
  };

  // Convert challenge into a playable Lesson format
  const handleLaunchChallenge = (challenge: JourneyChallenge, level: JourneyLevel) => {
    sounds.playTap();

    // Reuse matching curriculum activities when available, but the completion
    // ID must stay the Journey challenge ID so the server records the node the
    // learner actually tapped.
    const matchingModule = modules.find((m) => m.lessons.some((l) => l.title.includes(challenge.title)));
    const matchingLesson = matchingModule?.lessons.find((l) => l.title.includes(challenge.title));

    const fallbackActivities: Lesson['activities'] = [
      {
        id: `act_${challenge.id}_1`,
        type: challenge.type === 'pronunciation' ? 'pronunciation_drill' : 'flashcard',
        prompt: challenge.targetPhrases?.[0]?.english
          ? `How do you express: "${challenge.targetPhrases[0].english}"?`
          : `Challenge Drill: ${challenge.title}`,
        promptBisaya: challenge.targetPhrases?.[0]?.native || challenge.title,
        phonetics: challenge.targetPhrases?.[0]?.phonetics || 'Natural Visayan cadence',
        explanation: challenge.description,
        culturalNote: 'SULTI Companion evaluates both your pronunciation accuracy and situational etiquette.',
      },
      {
        id: `act_${challenge.id}_2`,
        type: 'sentence_assembly',
        prompt: 'Assemble the natural expression:',
        options: (challenge.targetPhrases?.[0]?.native || 'Maayong adlaw kaninyong tanan').split(' '),
        correctAnswer: challenge.targetPhrases?.[0]?.native || 'Maayong adlaw kaninyong tanan',
        explanation: 'Good work! Word order in Bisaya typically places the predicate first.',
      },
    ];

    const lessonForChallenge: Lesson = {
      ...(matchingLesson || {
        id: challenge.id,
        moduleId: 'mod_journey',
        title: challenge.title,
        titleBisaya: challenge.titleNative || challenge.title,
        description: challenge.description,
        level: level.levelNumber <= 2 ? 'Beginner' : level.levelNumber <= 5 ? 'Elementary' : 'Intermediate',
        xpReward: challenge.xpReward,
        estimatedMinutes: challenge.estimatedMinutes,
        activities: fallbackActivities,
      }),
      id: challenge.id,
      moduleId: 'mod_journey',
      title: challenge.title,
      titleBisaya: challenge.titleNative || matchingLesson?.titleBisaya || challenge.title,
      description: challenge.description,
      xpReward: challenge.xpReward,
      estimatedMinutes: challenge.estimatedMinutes,
      activities: matchingLesson?.activities?.length ? matchingLesson.activities : fallbackActivities,
    };

    onStartLesson(lessonForChallenge);
  };

  const handleNextCompanionTip = () => {
    sounds.playTap();
    setCompanionTipIndex((prev) => (prev + 1) % SULTI_COMPANION_TIPS.length);
  };

  const currentTip = SULTI_COMPANION_TIPS[companionTipIndex];
  const userXp = profile?.xpByLanguage?.[selectedLanguage] ?? 0;
  const xpPercent = activeLevel.targetXp > 0
    ? Math.min(100, Math.max(0, Math.round((userXp / activeLevel.targetXp) * 100)))
    : 0;

  const displayBadges = mergeBadgeStates(badgeStates);
  const earnedBadgeCount = displayBadges.filter((badge) => badge.unlocked).length;
  const nextBadge = displayBadges.find((badge) => !badge.unlocked);
  const certificateReady = Boolean(certificate?.eligible || certificate?.code);

  // Real streak and daily-goal data from the learner profile snapshot.
  const streak = profile?.streakDays ?? 0;
  const dailyGoal = profile?.dailyGoalMinutes ?? 0;
  const todayMinutes = profile?.todayMinutes ?? 0;
  const todayActivity = profile?.weeklyActivity?.find((day) => day.isToday);
  const todayXp = todayActivity?.xpEarned ?? 0;
  const goalMet = todayActivity?.goalMet ?? (dailyGoal > 0 && todayMinutes >= dailyGoal);
  const todayProgressPercent = dailyGoal > 0
    ? Math.min(100, Math.round((todayMinutes / dailyGoal) * 100))
    : 0;
  const remainingGoalMinutes = dailyGoal > 0 ? Math.max(0, dailyGoal - todayMinutes) : 0;

  // The static Journey data carries demo requirement counts. Derive the modal
  // checklist from the real completed set instead.
  const inspectedLevel = useMemo(() => {
    if (!inspectingLockedLevel) return null;
    const index = levels.findIndex((level) => level.id === inspectingLockedLevel.id);
    if (index <= 0) {
      return {
        ...inspectingLockedLevel,
        unlockRequirements: [],
      };
    }
    const previous = levels[index - 1];
    const done = previous.challenges.filter((challenge) => completedSet.has(challenge.id)).length;
    return {
      ...inspectingLockedLevel,
      unlockRequirements: [
        {
          id: `req_previous_${previous.id}`,
          label: `Complete ${previous.code}: ${previous.title}`,
          targetCount: previous.challenges.length,
          currentCount: done,
          completed: done >= previous.challenges.length,
          type: 'lessons' as const,
        },
      ],
    };
  }, [inspectingLockedLevel, levels, completedSet]);

  return (
    <div className="space-y-4 animate-in fade-in select-none pb-12">
      
      {/* ======================================================================= */}
      {/* 1. TOP LEARNING LANGUAGE SELECTOR & JOURNEY PROGRESSION STRIP             */}
      {/* ======================================================================= */}
      <div className="bg-white dark:bg-[#11222D] rounded-3xl p-4 sm:p-5 border border-stone-200/90 dark:border-white/10 shadow-xs space-y-3.5 relative overflow-hidden transition-colors">
        
        {/* Category Header & Quick Action Buttons */}
        <div className="flex items-center justify-between gap-2">
          <div>
            <div className="text-[10.5px] font-mono font-black uppercase tracking-wider text-teal-700 dark:text-teal-400">
              LANGUAGE JOURNEY
            </div>
            <h2 className="text-sm sm:text-base font-black text-stone-900 dark:text-white font-display">
              Choose your learning language
            </h2>
          </div>

          {/* Quick Badges & Tools Badges */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => {
                sounds.playTap();
                setShowBadgesModal(true);
              }}
              className="px-2.5 py-1 rounded-2xl bg-amber-50 dark:bg-amber-950/70 border border-amber-200 dark:border-amber-600/30 text-amber-900 dark:text-amber-200 flex items-center gap-1 text-xs font-mono font-bold cursor-pointer hover:scale-102 active:scale-98 transition-all"
              title="View Badges & Achievements"
            >
              <span>🏅</span>
              <span>Badges {earnedBadgeCount}/{displayBadges.length}</span>
            </button>

            <button
              onClick={() => {
                sounds.playTap();
                setShowToolsDrawer(true);
              }}
              className="px-2.5 py-1 rounded-2xl bg-teal-50 dark:bg-teal-950/70 border border-teal-200 dark:border-teal-600/30 text-teal-900 dark:text-teal-200 flex items-center gap-1 text-xs font-mono font-bold cursor-pointer hover:scale-102 active:scale-98 transition-all"
              title="13 Learning Tools"
            >
              <span>🧰</span>
              <span>13 Tools</span>
            </button>
          </div>
        </div>

        {/* Shared Learning Language Selector (same structure as Sulti AI + Curriculum Hub) */}
        <LearningLanguageSelector
          value={selectedLanguage}
          onChange={setSelectedLanguage}
        />

        {/* Selected Journey Path Header & Level XP Progression Bar */}
        <div className="pt-2 border-t border-stone-100 dark:border-white/5 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <div className="min-w-0">
              <span className="text-[10px] font-mono font-black uppercase text-teal-700 dark:text-teal-400 block tracking-wider">
                {currentLanguageData.name.toUpperCase()} JOURNEY
              </span>
              <span className="font-display font-black text-sm text-stone-900 dark:text-white">
                {activeLevel.code} · {activeLevel.title}
              </span>
            </div>
            <span className="text-stone-500 dark:text-stone-400 text-[11px] font-mono font-bold shrink-0">
              {userXp} / {activeLevel.targetXp} XP ({xpPercent}%)
            </span>
          </div>

          <div className="w-full bg-stone-100 dark:bg-stone-800 h-2 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-teal-500 to-emerald-400 rounded-full transition-all duration-500"
              style={{ width: `${xpPercent}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[10px] text-stone-400 font-mono">
            <span>Goal: {activeLevel.subtitle}</span>
            <span className="text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1">
              <span>🏅                 {nextBadge
                  ? `Next: "${nextBadge.title}" Badge`
                  : 'All Journey badges unlocked'}</span>
            </span>
          </div>
        </div>
      </div>

      {/* ======================================================================= */}
      {/* 2. STREAKS & DAILY LEARNING GOALS                                        */}
      {/* ======================================================================= */}
      <div className="bg-white dark:bg-[#11222D] rounded-3xl p-4 border border-stone-200/90 dark:border-white/10 shadow-xs space-y-3 transition-colors">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-9 h-9 rounded-2xl bg-amber-50 dark:bg-amber-950/70 text-amber-600 dark:text-amber-300 border border-amber-200 dark:border-amber-600/30 flex items-center justify-center shrink-0">
              <Flame className="w-4 h-4" />
            </span>
            <div className="min-w-0">
              <span className="text-[9.5px] font-mono font-black uppercase tracking-wider text-stone-400 block">
                Streak & Goals
              </span>
              <p className="font-display font-black text-sm text-stone-900 dark:text-white truncate">
                {streak} day{streak === 1 ? '' : 's'} streak
              </p>
            </div>
          </div>

          {onGoToProfile && (
            <button
              onClick={() => {
                sounds.playTap();
                onGoToProfile();
              }}
              className="text-[10.5px] font-bold text-teal-700 dark:text-teal-300 hover:underline cursor-pointer shrink-0"
            >
              View Progress →
            </button>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-2 rounded-xl bg-stone-50 dark:bg-stone-800/60">
            <div className="font-display font-black text-xs text-stone-900 dark:text-white">
              {todayMinutes}
              <span className="text-stone-400 dark:text-stone-500 font-mono text-[10px]">
                /{dailyGoal > 0 ? dailyGoal : '—'}
              </span>
            </div>
            <div className="text-[9px] text-stone-400 font-medium">Minutes Today</div>
          </div>

          <div className="p-2 rounded-xl bg-stone-50 dark:bg-stone-800/60">
            <div className="font-display font-black text-xs text-teal-700 dark:text-teal-300 flex items-center justify-center gap-0.5">
              <Zap className="w-3 h-3" />
              {todayXp}
            </div>
            <div className="text-[9px] text-stone-400 font-medium">XP Today</div>
          </div>

          <div className="p-2 rounded-xl bg-stone-50 dark:bg-stone-800/60">
            <div className={`font-display font-black text-xs flex items-center justify-center gap-0.5 ${
              goalMet ? 'text-emerald-600 dark:text-emerald-400' : 'text-stone-900 dark:text-white'
            }`}>
              <Target className="w-3 h-3" />
              {goalMet ? 'Met' : dailyGoal > 0 ? `${remainingGoalMinutes}m` : 'Set goal'}
            </div>
            <div className="text-[9px] text-stone-400 font-medium">
              {goalMet ? 'Daily Goal' : dailyGoal > 0 ? 'Remaining' : 'In Profile'}
            </div>
          </div>
        </div>

        <div className="w-full bg-stone-100 dark:bg-stone-800 h-2 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-teal-500 to-emerald-400 rounded-full transition-all duration-500"
            style={{ width: `${todayProgressPercent}%` }}
          />
        </div>
      </div>

      {/* ======================================================================= */}
      {/* 3. SULTI — YOUR LANGUAGE COMPANION CARD                                  */}
      {/* ======================================================================= */}
      <div className="bg-gradient-to-br from-teal-50/80 to-emerald-50/50 dark:from-[#11222D] dark:to-[#152B37] rounded-3xl p-4 border border-teal-200/80 dark:border-teal-500/20 shadow-xs relative overflow-hidden transition-all">
        <div className="flex items-start gap-3">
          {/* SULTI Avatar */}
          <div className="relative shrink-0">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-600 to-emerald-500 flex items-center justify-center text-white shadow-md border-2 border-white dark:border-stone-800 text-2xl">
              🌺
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white dark:border-stone-800" />
          </div>

          {/* SULTI Companion Dialogue Bubble */}
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-black uppercase tracking-wider text-teal-800 dark:text-teal-300">
                SULTI — Your Language Companion
              </span>
              <button
                onClick={handleNextCompanionTip}
                className="text-[10px] text-stone-400 hover:text-teal-600 dark:hover:text-teal-400 font-mono flex items-center gap-1 cursor-pointer transition-colors"
                title="Next Tip"
              >
                <RefreshCw className="w-2.5 h-2.5" />
                <span>Tip</span>
              </button>
            </div>

            <p className="text-xs text-stone-800 dark:text-stone-200 font-medium leading-relaxed italic">
              "{currentTip.companionText}"
            </p>

            <div className="flex items-center justify-between pt-1 text-[10px]">
              <span className="font-mono text-teal-700 dark:text-teal-400 font-bold">
                🔊 {currentTip.audioHint}
              </span>

              {onOpenSulti && (
                <button
                  onClick={() => {
                    sounds.playTap();
                    onOpenSulti('Gusto kong magpraktis og pagsulti sa Bisaya karon.');
                  }}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-display font-black shadow-xs cursor-pointer active:scale-95 transition-all"
                >
                  <MessageCircle className="w-3 h-3" />
                  <span>Chat with SULTI</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================================= */}
      {/* 3. GAME MAP: CANDY CRUSH / DUOLINGO STYLE ROADMAP                        */}
      {/* ======================================================================= */}
      <div className="space-y-6 pt-2">
        {levels.map((level, levelIdx) => {
          const unlocked = isLevelUnlocked(level);
          const levelCompleted = level.challenges.every((c) => isChallengeCompleted(c.id));

          return (
            <div key={level.id} className="space-y-4">
              
              {/* Level Milestone Banner */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white dark:bg-[#11222D] border border-stone-200/90 dark:border-white/10 shadow-2xs">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-9 h-9 rounded-2xl flex items-center justify-center text-lg font-bold shadow-2xs ${
                      unlocked
                        ? 'bg-teal-50 dark:bg-teal-950/70 border border-teal-200 text-teal-700 dark:text-teal-300'
                        : 'bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-white/5 text-stone-400'
                    }`}
                  >
                    {level.icon}
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-mono font-black uppercase text-stone-400">
                        {level.code}
                      </span>
                      {levelCompleted && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 font-mono font-bold">
                          ✓ MASTERED
                        </span>
                      )}
                    </div>
                    <h3 className="font-display font-black text-sm text-stone-900 dark:text-white leading-tight">
                      {level.title}
                    </h3>
                  </div>
                </div>

                {!unlocked ? (
                  <button
                    onClick={() => {
                      sounds.playTap();
                      setInspectingLockedLevel(level);
                    }}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-50 dark:bg-amber-950/70 border border-amber-200 dark:border-amber-600/30 text-amber-900 dark:text-amber-300 text-xs font-mono font-bold cursor-pointer hover:bg-amber-100 transition-colors"
                  >
                    <Lock className="w-3 h-3" />
                    <span>View Requirements</span>
                  </button>
                ) : (
                  <span className="text-[10px] font-mono text-stone-400">
                    +{level.targetXp} XP
                  </span>
                )}
              </div>

              {/* Challenges Stepping Path */}
              <div className="relative py-2 flex flex-col items-center gap-4">
                
                {/* Winding Connecting Line */}
                <div className="absolute top-4 bottom-4 w-1 bg-stone-200 dark:bg-stone-800 rounded-full z-0" />

                {level.challenges.map((challenge, cIdx) => {
                  const completed = isChallengeCompleted(challenge.id);
                  const isCurrent = !completed && unlocked && (!level.challenges[cIdx - 1] || isChallengeCompleted(level.challenges[cIdx - 1].id));
                  const isLocked = !unlocked || (!completed && !isCurrent);

                  // Alternating zig-zag offset positions for Candy Crush / Duolingo look:
                  // center -> left -> right -> center
                  const offsetClasses = [
                    'self-center',
                    'self-start ml-8 sm:ml-16',
                    'self-center',
                    'self-end mr-8 sm:mr-16',
                    'self-center',
                  ][cIdx % 5];

                  return (
                    <div
                      key={challenge.id}
                      className={`relative z-10 flex flex-col items-center group ${offsetClasses}`}
                    >
                      {/* Node Button */}
                      <button
                        onClick={() => {
                          if (isLocked) {
                            sounds.playError();
                            setInspectingLockedLevel(level);
                          } else {
                            handleLaunchChallenge(challenge, level);
                          }
                        }}
                        disabled={isLocked && !unlocked}
                        className={`w-14 h-14 rounded-full flex flex-col items-center justify-center font-display font-black text-sm transition-all duration-200 cursor-pointer shadow-md relative ${
                          completed
                            ? 'bg-teal-600 hover:bg-teal-500 text-white border-4 border-teal-200 dark:border-teal-800 active:scale-95 shadow-teal-500/20'
                            : isCurrent
                            ? 'bg-amber-500 hover:bg-amber-400 text-white border-4 border-amber-200 dark:border-amber-700 animate-pulse scale-105 shadow-amber-500/30'
                            : 'bg-stone-200 dark:bg-stone-800 text-stone-400 border-4 border-stone-300 dark:border-stone-700 opacity-60'
                        }`}
                      >
                        {completed ? (
                          <Check className="w-6 h-6 stroke-[3]" />
                        ) : isCurrent ? (
                          <Play className="w-5 h-5 fill-white stroke-none translate-x-0.5" />
                        ) : (
                          <Lock className="w-4 h-4" />
                        )}
                      </button>

                      {/* Current Floating Marker */}
                      {isCurrent && (
                        <div className="absolute -top-7 px-2.5 py-0.5 rounded-full bg-amber-500 text-white font-mono font-black text-[10px] tracking-wider shadow-md animate-bounce flex items-center gap-1">
                          <Sparkles className="w-2.5 h-2.5" />
                          <span>START</span>
                        </div>
                      )}

                      {/* Node Label & XP badge */}
                      <div className="mt-1.5 text-center max-w-[140px]">
                        <span className="font-display font-black text-xs text-stone-800 dark:text-stone-200 block truncate">
                          {challenge.orderNumber} {challenge.title}
                        </span>
                        <span className="text-[10px] font-mono text-stone-400 flex items-center justify-center gap-1">
                          <span>+{challenge.xpReward} XP</span>
                          <span>·</span>
                          <span className="capitalize">{challenge.type}</span>
                        </span>
                      </div>
                    </div>
                  );
                })}

                {/* Final Mastery Certificate Checkpoint at end of Journey */}
                {level.id === 'ceb_lvl_final' && onOpenCertificateModal && (
                  <div className="pt-4 self-center text-center space-y-2">
                    {certificateReady ? (
                      <button
                        onClick={() => {
                          sounds.playCelebration();
                          onOpenCertificateModal();
                        }}
                        className="px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 text-white font-display font-black text-sm shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center gap-2 mx-auto cursor-pointer"
                      >
                        <Trophy className="w-5 h-5" />
                        <span>{certificate?.code ? 'View Verified Certificate' : 'Claim Verified Certificate'}</span>
                      </button>
                    ) : (
                      <div className="mx-auto max-w-[280px] rounded-2xl border border-dashed border-stone-300 dark:border-white/15 bg-stone-50 dark:bg-stone-900/40 px-4 py-3 text-stone-500 dark:text-stone-400">
                        <div className="flex items-center justify-center gap-1.5 text-xs font-bold">
                          <Lock className="w-4 h-4" />
                          <span>Certificate locked</span>
                        </div>
                        <p className="mt-1 text-[10px] font-mono leading-relaxed">
                          Complete all {certificate?.totalChallenges || 41} Cebuano Journey challenges to unlock a server-verified certificate.
                        </p>
                      </div>
                    )}
                    <p className="text-[10px] font-mono text-stone-400">
                      Issued only after the learner API confirms every Cebuano challenge.
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ======================================================================= */}
      {/* 4. MODALS (Level Mastery Requirements, Badges, 13 Tools Drawer)         */}
      {/* ======================================================================= */}
      <LevelMasteryModal
        isOpen={Boolean(inspectedLevel)}
        level={inspectedLevel}
        onClose={() => setInspectingLockedLevel(null)}
        onStartPrerequisiteLesson={() => {
          if (activeChallenge) {
            handleLaunchChallenge(activeChallenge, activeLevel);
          }
        }}
      />

      <BadgesModal
        isOpen={showBadgesModal}
        onClose={() => setShowBadgesModal(false)}
        userBadges={displayBadges}
      />

      <LearningToolkitDrawer
        isOpen={showToolsDrawer}
        onClose={() => setShowToolsDrawer(false)}
        onSelectTool={(toolId) => {
          if (onOpenQuickPractice) {
            onOpenQuickPractice(toolId);
          }
        }}
      />
    </div>
  );
};
