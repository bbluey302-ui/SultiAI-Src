import React from 'react';
import { Target, ArrowRight, CheckCircle2, Flame, Sparkles } from 'lucide-react';
import { sounds } from '../../utils/soundEffects';

interface DailyMissionCardProps {
  todayMinutes: number;
  goalMinutes: number;
  streakDays: number;
  onContinuePractice: () => void;
}

export const DailyMissionCard: React.FC<DailyMissionCardProps> = ({
  todayMinutes,
  goalMinutes,
  streakDays,
  onContinuePractice,
}) => {
  const progressRatio = Math.min(1, todayMinutes / Math.max(1, goalMinutes));
  const progressPercent = Math.round(progressRatio * 100);
  const isGoalMet = todayMinutes >= goalMinutes;

  const handleClick = () => {
    sounds.playTap();
    onContinuePractice();
  };

  return (
    <div className="bg-white dark:bg-[#11222D] rounded-3xl p-5 border border-stone-200/90 dark:border-white/10 shadow-xs space-y-4 relative overflow-hidden transition-all hover:shadow-sm">
      {/* Subtle brand tint background */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-teal-50/60 dark:bg-teal-500/10 rounded-full blur-2xl -mr-8 -mt-8 pointer-events-none" />

      {/* Header Row */}
      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-teal-50 dark:bg-teal-950/80 text-teal-700 dark:text-teal-300 flex items-center justify-center font-bold border border-teal-200/60 dark:border-teal-500/30">
            <Target className="w-4 h-4 text-teal-600 dark:text-teal-400" />
          </div>
          <div>
            <span className="text-[10px] font-extrabold tracking-wider uppercase text-teal-700 dark:text-teal-300 bg-teal-50/80 dark:bg-teal-950/80 px-2 py-0.5 rounded-md border border-teal-200/50 dark:border-teal-500/30">
              Today's Mission
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs font-mono font-bold">
          {isGoalMet ? (
            <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-500/40">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Goal Reached!
            </span>
          ) : (
            <span className="text-stone-700 dark:text-stone-300 bg-stone-100 dark:bg-stone-800 px-2.5 py-0.5 rounded-full border border-stone-200 dark:border-white/10">
              <span className="text-teal-700 dark:text-teal-400 font-black">{todayMinutes}</span> / {goalMinutes} min
            </span>
          )}
        </div>
      </div>

      {/* Mission Title & Narrative */}
      <div className="space-y-1 relative z-10">
        <h2 className="font-display font-black text-lg text-stone-900 dark:text-white leading-snug">
          {isGoalMet
            ? "Bulahan! You hit today's practice target."
            : `Practice speaking & vocabulary for ${goalMinutes} minutes`}
        </h2>
        <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed font-normal">
          {isGoalMet
            ? "Your Bisaya retention is accelerating. Continue with extra drills or conversational practice."
            : `${Math.max(0, goalMinutes - todayMinutes)} minutes remaining to maintain your ${streakDays}-day streak.`}
        </p>
      </div>

      {/* Progress Bar with Bevel */}
      <div className="space-y-1.5 relative z-10">
        <div className="w-full bg-stone-100 dark:bg-stone-800 rounded-full h-3 p-0.5 overflow-hidden border border-stone-200/60 dark:border-white/10 shadow-inner">
          <div
            className={`h-full rounded-full transition-all duration-700 shadow-xs ${
              isGoalMet
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                : 'bg-gradient-to-r from-teal-500 to-teal-600'
            }`}
            style={{ width: `${Math.max(progressPercent, 4)}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-[11px] font-mono text-stone-500 dark:text-stone-400">
          <span>{todayMinutes} of {goalMinutes} mins</span>
          <span className="font-bold text-stone-800 dark:text-stone-200">{progressPercent}%</span>
        </div>
      </div>

      {/* Primary Hero CTA */}
      <button
        onClick={handleClick}
        className="w-full min-h-[48px] bg-teal-600 hover:bg-teal-500 dark:bg-teal-500 dark:hover:bg-teal-400 text-white dark:text-stone-950 rounded-2xl text-xs font-black py-3 px-4 flex items-center justify-center gap-2 transition-all btn-3d-teal shadow-sm cursor-pointer relative z-10"
      >
        <span>{isGoalMet ? 'Keep Practicing (Bonus XP)' : 'Continue Today\'s Mission'}</span>
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
};
