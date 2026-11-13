import React, { useState } from 'react';
import { 
  Sparkles, Volume2, Gift, X, Flame 
} from 'lucide-react';
import { UserProfile, Lesson, DayActivity, ContinueLearningActivity, SultiRecommendation } from '../types';
import { speakBisaya } from '../utils/audio';
import { sounds } from '../utils/soundEffects';
import { StreakCalendar } from './StreakCalendar';
import { VoicePathModal } from './voice/VoicePathModal';
import { getStoredVoiceProgress } from '../data/voiceGamificationData';
import { LearnerActivityMonth } from '../services/activityService';

// Modular Dashboard Subcomponents
import { QuickPracticeRow } from './dashboard/QuickPracticeRow';
import { ProgressSnapshot } from './dashboard/ProgressSnapshot';
import { SultiRecommendationCard } from './dashboard/SultiRecommendationCard';
import { CompactStreakStrip } from './dashboard/CompactStreakStrip';

interface HomeScreenProps {
  profile: UserProfile;
  weeklyActivity?: DayActivity[];
  monthActivity?: LearnerActivityMonth;
  nextLesson: Lesson;
  onStartLesson: (lesson: Lesson) => void;
  onOpenSulti: (prefillPrompt?: string) => void;
  onGoToLearn: () => void;
  onGoToProfile?: () => void;
  onUseStreakFreeze?: () => void;
  onOpenDialectModal?: () => void;
  onAwardReward?: (xp: number, gems: number, speechScore: number) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  profile,
  weeklyActivity = [],
  monthActivity,
  nextLesson,
  onStartLesson,
  onOpenSulti,
  onGoToLearn,
  onGoToProfile,
  onUseStreakFreeze,
  onOpenDialectModal,
  onAwardReward,
}) => {
  const [isPlayingExpression, setIsPlayingExpression] = useState(false);
  const [showRewardToast, setShowRewardToast] = useState<string | null>(null);
  const [showStreakModal, setShowStreakModal] = useState(false);
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [voiceProgress, setVoiceProgress] = useState(getStoredVoiceProgress);

  // Determine time-aware greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    const firstName = profile.name.split(' ')[0] || 'Learner';
    if (hour < 12) {
      return { bisaya: `Maayong buntag, ${firstName} 👋`, english: 'Good morning' };
    } else if (hour < 18) {
      return { bisaya: `Maayong hapon, ${firstName} 👋`, english: 'Good afternoon' };
    } else {
      return { bisaya: `Maayong gabi-i, ${firstName} 👋`, english: 'Good evening' };
    }
  };

  const greeting = getGreeting();

  // Dynamic Continue Learning activity based on next lesson or profile history
  const continueActivity: ContinueLearningActivity = {
    id: 'cont_' + nextLesson.id,
    lessonId: nextLesson.id,
    title: nextLesson.title,
    titleBisaya: nextLesson.titleBisaya,
    description: nextLesson.description,
    type: nextLesson.title.toLowerCase().includes('speak') || nextLesson.title.toLowerCase().includes('conversation') 
      ? 'voice' 
      : 'lesson',
    categoryLabel: nextLesson.level === 'Beginner' ? 'Fundamental Bisaya' : 'Conversational Fluency',
    level: nextLesson.level,
    progressPercent: profile.completedLessons.includes(nextLesson.id) ? 100 : 0,
    estimatedMinutes: nextLesson.estimatedMinutes,
    xpReward: nextLesson.xpReward,
  };

  // Sulti AI Adaptive Recommendation tying speech and NLP
  const sultiRecommendation: SultiRecommendation = {
    id: 'rec_market_bargain',
    title: 'Speaking Fluency Recommendation',
    rationale: 'You recognize common vocabulary accurately, but hesitate on conversational bargaining phrases.',
    targetPhrase: 'Tagpila ni, Nang? Puyde hangyo gamay?',
    targetPhraseEnglish: 'How much is this, ma\'am? May I ask for a small discount?',
    contextScenario: 'Inquiring about fruit prices at Bankerohan Public Market',
    actionPrompt: 'Gusto kong magpraktis unsaon paghangyo sa merkado.',
  };

  const handlePlayExpression = async () => {
    setIsPlayingExpression(true);
    sounds.playTap();
    await speakBisaya('Kaya ra na nimo! Ayaw kaluya.');
    setIsPlayingExpression(false);
  };

  return (
    <div className="space-y-4 pb-24 px-4 pt-1 max-w-md mx-auto relative select-none">
      {/* Toast Notification */}
      {showRewardToast && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white font-bold text-xs px-4 py-2 rounded-2xl shadow-xl flex items-center gap-2 border border-emerald-400 animate-bounce">
          <Gift className="w-4 h-4" />
          <span>{showRewardToast}</span>
        </div>
      )}



      {/* ZONE 4: QUICK PRACTICE ROW */}
      <QuickPracticeRow
        onStartVoice={() => setShowVoiceModal(true)}
        onStartVocabulary={() => onGoToLearn()}
        onStartChat={() => onOpenSulti()}
        voiceLevel={voiceProgress.unlockedLevel}
        voiceBadgesCount={voiceProgress.earnedBadges.length}
      />

      {/* ZONE 5: PROGRESS SNAPSHOT */}
      <ProgressSnapshot
        speechAccuracy={profile.speechScoreAverage}
        vocabularyCount={profile.vocabularyMastered}
        lessonsCompleted={profile.completedLessons.length}
        totalLessons={20}
        xp={profile.xp}
        onViewProgress={() => onGoToProfile?.()}
      />

      {/* ZONE 6: SULTI'S ADAPTIVE RECOMMENDATION (AI INTELLIGENCE) */}
      <SultiRecommendationCard
        recommendation={sultiRecommendation}
        onPracticeWithSulti={(prompt) => onOpenSulti(prompt)}
      />

      {/* ZONE 7: COMPACT STREAK STRIP */}
      <CompactStreakStrip
        streakDays={profile.streakDays}
        weeklyActivity={weeklyActivity}
        todayMinutes={profile.todayMinutes}
        dailyGoalMinutes={profile.dailyGoalMinutes}
        streakFreezes={profile.streakFreezesAvailable ?? 1}
        onViewStreakDetails={() => setShowStreakModal(true)}
      />

      {/* Visual Streak Calendar Modal */}
      {showStreakModal && (
        <div 
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowStreakModal(false);
          }}
        >
          <div className="w-full max-w-md max-h-[92vh] sm:max-h-[88vh] flex flex-col bg-white dark:bg-[#11222D] rounded-t-3xl sm:rounded-3xl shadow-2xl border-t sm:border border-stone-200 dark:border-white/15 overflow-hidden transition-all pb-safe">
            {/* Mobile Drag Indicator Bar */}
            <div className="w-12 h-1.5 bg-stone-300 dark:bg-stone-700 rounded-full mx-auto my-2 sm:hidden shrink-0" />

            {/* Modal Header */}
            <div className="px-4 py-3 border-b border-stone-200 dark:border-white/10 flex items-center justify-between bg-stone-50/90 dark:bg-[#152B37]/90 shrink-0 gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-orange-100 dark:bg-orange-950/80 text-orange-600 dark:text-orange-400 border border-orange-300 dark:border-orange-500/40 flex items-center justify-center shrink-0">
                  <Flame className="w-4 h-4 fill-orange-500 text-orange-500" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-display font-black text-sm sm:text-base text-stone-900 dark:text-white leading-tight truncate">
                    Streak & Activity
                  </h3>
                  <p className="text-[10px] sm:text-[11px] text-stone-500 dark:text-stone-400 font-medium truncate">
                    Weekly Bisaya Practice Consistency
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  sounds.playTap();
                  setShowStreakModal(false);
                }}
                className="p-1.5 sm:p-2 rounded-xl hover:bg-stone-200 dark:hover:bg-stone-800 text-stone-500 dark:text-stone-400 cursor-pointer transition-colors shrink-0"
                title="Isira (Close)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content Scroll Area */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 overscroll-contain">
              <StreakCalendar
                weeklyActivity={weeklyActivity}
                monthActivity={monthActivity}
                streakDays={profile.streakDays}
                dailyGoalMinutes={profile.dailyGoalMinutes}
                todayMinutes={profile.todayMinutes}
                streakFreezes={profile.streakFreezesAvailable ?? 1}
                onQuickPractice={() => {
                  setShowStreakModal(false);
                  onStartLesson(nextLesson);
                }}
                onUseStreakFreeze={onUseStreakFreeze}
                inModal
              />
            </div>
          </div>
        </div>
      )}

      {/* Visual Voice Gamification Path Modal */}
      <VoicePathModal
        isOpen={showVoiceModal}
        onClose={() => {
          setShowVoiceModal(false);
          setVoiceProgress(getStoredVoiceProgress());
        }}
        onAwardReward={(xp, gems, speechScore) => {
          setShowRewardToast(`Voice drill passed! +${gems} Gems (practice minutes recorded)`);
          setTimeout(() => setShowRewardToast(null), 3000);
          setVoiceProgress(getStoredVoiceProgress());
          if (onAwardReward) {
            onAwardReward(xp, gems, speechScore);
          }
        }}
        onOpenSultiChat={(prompt) => {
          setShowVoiceModal(false);
          onOpenSulti(prompt);
        }}
        targetDialect={profile.targetDialect}
      />

      {/* CULTURAL EXPRESSION OF THE DAY */}
      <div className="bg-stone-50 dark:bg-[#11222D] border border-stone-200/80 dark:border-white/10 rounded-3xl p-4 space-y-2 shadow-2xs transition-colors">
        <div className="flex items-center justify-between text-xs text-stone-700 dark:text-stone-300 font-bold">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span className="font-display font-black text-stone-900 dark:text-white text-xs">
              Bisaya Expression of the Day
            </span>
          </div>
          <button 
            onClick={handlePlayExpression}
            disabled={isPlayingExpression}
            className={`p-1.5 rounded-xl text-stone-700 dark:text-stone-200 hover:bg-stone-200 dark:hover:bg-stone-700 min-h-[36px] min-w-[36px] flex items-center justify-center transition-all cursor-pointer glass-touch ${
              isPlayingExpression ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-200 animate-pulse' : 'bg-white dark:bg-stone-800 border border-stone-200 dark:border-white/10'
            }`}
            title="Listen to native audio"
          >
            <Volume2 className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-0.5 bg-white dark:bg-stone-800/70 p-3 rounded-2xl border border-stone-200/60 dark:border-white/10 shadow-2xs">
          <div className="text-xs font-black text-stone-900 dark:text-white font-display">
            "Kaya ra na nimo! Ayaw kaluya."
          </div>
          <div className="text-[11px] text-stone-500 dark:text-stone-400 italic">
            "You can do it! Don't lose heart."
          </div>
          <p className="text-[10px] text-stone-500 dark:text-stone-400 leading-relaxed pt-1">
            <span className="font-bold text-stone-700 dark:text-stone-200">Cultural Etiquette:</span> Warm encouragement common before tests and challenges in Mindanao and Central Visayas.
          </p>
        </div>
      </div>
    </div>
  );
};
