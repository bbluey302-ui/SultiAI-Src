import React, { useEffect, useState } from 'react';
import { 
  Flame, Check, Calendar, Shield, Zap, Sparkles, 
  ChevronRight, Clock, Award, Info, Heart, ArrowUpRight, 
  ChevronLeft, BarChart3, Trophy, Target, AlertCircle
} from 'lucide-react';
import { DayActivity } from '../types';
import { sounds } from '../utils/soundEffects';
import { LearnerActivityMonth, buildCurrentMonth } from '../services/activityService';
import { LearnDashboard } from './learn/LearnDashboard';

interface StreakCalendarProps {
  weeklyActivity: DayActivity[];
  monthActivity?: LearnerActivityMonth;
  streakDays: number;
  dailyGoalMinutes: number;
  todayMinutes: number;
  streakFreezes?: number;
  onQuickPractice?: () => void;
  onUseStreakFreeze?: () => void;
  inModal?: boolean;
}

export const StreakCalendar: React.FC<StreakCalendarProps> = ({
  weeklyActivity,
  monthActivity,
  streakDays,
  dailyGoalMinutes,
  todayMinutes,
  streakFreezes = 1,
  onQuickPractice,
  onUseStreakFreeze,
  inModal = false,
}) => {
  const [selectedDayId, setSelectedDayId] = useState<string | null>(() => {
    const today = weeklyActivity.find((d) => d.isToday);
    return today ? today.id : weeklyActivity[weeklyActivity.length - 1]?.id || null;
  });
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
  const [freezeApplied, setFreezeApplied] = useState(false);

  // Keep the selected node valid when the real week rolls over (e.g. at
  // midnight or when the server summary refreshes).
  useEffect(() => {
    if (weeklyActivity.some((day) => day.id === selectedDayId)) return;
    const today = weeklyActivity.find((day) => day.isToday);
    setSelectedDayId(today ? today.id : weeklyActivity[weeklyActivity.length - 1]?.id || null);
  }, [weeklyActivity, selectedDayId]);

  const selectedDay = weeklyActivity.find((d) => d.id === selectedDayId) || weeklyActivity[weeklyActivity.length - 1];
  const isTodayGoalMet = todayMinutes >= dailyGoalMinutes;
  const month = monthActivity || buildCurrentMonth(dailyGoalMinutes);
  
  // Calculate weekly statistics
  const daysGoalMetCount = weeklyActivity.filter((d) => d.goalMet || (d.isToday && isTodayGoalMet)).length;
  const totalWeeklyMinutes = weeklyActivity.reduce((acc, d) => acc + (d.isToday ? todayMinutes : d.minutes), 0);
  const totalWeeklyXp = weeklyActivity.reduce((acc, d) => acc + d.xpEarned, 0);

  const handleSelectDay = (day: DayActivity) => {
    sounds.playTap();
    setSelectedDayId(day.id);
  };

  const handleApplyFreeze = () => {
    if (streakFreezes <= 0 || freezeApplied) return;
    sounds.playCorrect();
    setFreezeApplied(true);
    onUseStreakFreeze?.();
  };

  // Real current-month grid from Supabase (goal-met flame per calendar day).
  const monthCells: Array<{ kind: 'blank'; key: string } | { kind: 'day'; key: string; day: LearnerActivityMonth['days'][number] }> = [
    ...Array.from({ length: month.firstWeekday }, (_, index) => ({
      kind: 'blank' as const,
      key: `blank-${index}`,
    })),
    ...month.days.map((day) => ({
      kind: 'day' as const,
      key: day.date,
      day,
    })),
  ];

  return (
    <div className={`${
      inModal 
        ? 'space-y-3.5' 
        : 'bg-white dark:bg-[#11222D] rounded-3xl p-4 sm:p-5 shadow-xs border border-stone-200/90 dark:border-white/10 space-y-4'
    } relative overflow-hidden transition-colors`}>
      {/* Background ambient decorative glow */}
      <div className="absolute top-0 right-0 w-36 h-36 bg-amber-50/70 dark:bg-amber-500/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />

      {/* Header with Streak Status - Responsive Flex Wrap */}
      <div className="flex flex-col min-[380px]:flex-row items-start min-[380px]:items-center justify-between gap-2.5 relative z-10">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center font-bold shadow-md shadow-amber-500/30 shrink-0">
            <Flame className="w-6 h-6 sm:w-7 sm:h-7 fill-white text-white animate-bounce" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="font-display font-black text-sm sm:text-base text-stone-900 dark:text-white leading-tight">
                {streakDays} Day Streak!
              </h3>
              <span className="text-[9px] sm:text-[10px] font-extrabold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/70 border border-amber-200/70 dark:border-amber-500/40 px-2 py-0.5 rounded-full shrink-0">
                {streakDays > 0 ? 'Active 🔥' : 'Start today'}
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-stone-500 dark:text-stone-400 font-medium truncate mt-0.5">
              Goal met on <span className="font-bold text-stone-800 dark:text-stone-200">{daysGoalMetCount} of 7 days</span> this week
            </p>
          </div>
        </div>

        {/* Streak Freeze Badge */}
        <div className="flex items-center gap-1 text-[11px] sm:text-xs font-bold text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/70 border border-sky-200/80 dark:border-sky-500/40 px-2.5 py-1 rounded-xl shadow-2xs shrink-0 self-start min-[380px]:self-auto">
          <Shield className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 fill-sky-200 dark:fill-sky-800 shrink-0" />
          <span>{freezeApplied ? 'Protected' : `${streakFreezes} Freeze`}</span>
        </div>
      </div>

      {/* View Switcher Tabs (Week vs Month) */}
      <div className="flex flex-col min-[380px]:flex-row items-stretch min-[380px]:items-center justify-between gap-2 border-t border-stone-100 dark:border-white/10 pt-2.5">
        <div className="flex items-center gap-1 bg-stone-100 dark:bg-stone-800 p-1 rounded-xl shrink-0">
          <button
            onClick={() => {
              sounds.playTap();
              setViewMode('week');
            }}
            className={`flex-1 min-[380px]:flex-none px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer text-center ${
              viewMode === 'week'
                ? 'bg-white dark:bg-[#152B37] text-stone-900 dark:text-white shadow-2xs font-black'
                : 'text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'
            }`}
          >
            Weekly
          </button>
          <button
            onClick={() => {
              sounds.playTap();
              setViewMode('month');
            }}
            className={`flex-1 min-[380px]:flex-none px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer text-center ${
              viewMode === 'month'
                ? 'bg-white dark:bg-[#152B37] text-stone-900 dark:text-white shadow-2xs font-black'
                : 'text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'
            }`}
          >
            30-Day
          </button>
        </div>

        <div className="text-[11px] font-mono text-stone-500 dark:text-stone-400 flex items-center justify-end gap-1 shrink-0">
          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block shrink-0" />
          <span>Goal: {dailyGoalMinutes} min/day</span>
        </div>
      </div>

      {/* VIEW 1: 7-DAY WEEKLY VISUAL CALENDAR */}
      {viewMode === 'week' && (
        <div className="space-y-3">
          {/* Week Goal Completion Summary Bar */}
          <div className="p-2.5 sm:p-3 bg-gradient-to-r from-amber-50 to-teal-50/50 dark:from-amber-950/40 dark:to-teal-950/40 rounded-2xl border border-amber-200/60 dark:border-amber-500/30 flex items-center justify-between text-xs gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <Trophy className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <div className="min-w-0">
                <span className="font-bold text-stone-800 dark:text-stone-200 block truncate">
                  {daysGoalMetCount === 7 ? 'Full Week Perfect Streak!' : `${daysGoalMetCount}/7 Days Goal Achieved`}
                </span>
                <p className="text-[10px] text-stone-500 dark:text-stone-400 font-medium truncate">
                  {totalWeeklyMinutes} mins practiced · +{totalWeeklyXp} XP
                </p>
              </div>
            </div>
            <span className="font-mono text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100/70 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-500/40 px-2 py-0.5 rounded-full shrink-0">
              {Math.round((daysGoalMetCount / 7) * 100)}%
            </span>
          </div>

          {/* 7 Interactive Day Nodes: Responsive grid that fits all screens */}
          <div className="grid grid-cols-7 gap-1 sm:gap-1.5 pt-0.5">
            {weeklyActivity.map((day) => {
              const isSelected = selectedDayId === day.id;
              const isToday = Boolean(day.isToday);
              const goalMet = day.goalMet || (isToday && isTodayGoalMet);
              const curMins = isToday ? todayMinutes : day.minutes;
              const progressRatio = Math.min(1, curMins / day.goalMinutes);

              return (
                <button
                  key={day.id}
                  onClick={() => handleSelectDay(day)}
                  className={`flex flex-col items-center py-1.5 sm:py-2 px-0.5 sm:px-1 rounded-2xl transition-all relative cursor-pointer glass-touch min-w-0 ${
                    isSelected
                      ? 'bg-stone-900 dark:bg-teal-500 text-white dark:text-stone-950 shadow-md scale-105 ring-2 ring-stone-900 dark:ring-teal-400 ring-offset-1 sm:ring-offset-2 dark:ring-offset-[#11222D]'
                      : goalMet
                      ? 'bg-amber-50/80 dark:bg-amber-950/40 hover:bg-amber-100/90 text-stone-800 dark:text-stone-200 border border-amber-300/80 dark:border-amber-500/40 shadow-2xs'
                      : isToday
                      ? 'bg-teal-50/80 dark:bg-teal-950/40 hover:bg-teal-100/90 text-stone-800 dark:text-stone-200 border border-teal-300 dark:border-teal-500/40 shadow-2xs'
                      : 'bg-stone-50 dark:bg-stone-800/60 hover:bg-stone-100 dark:hover:bg-stone-700/60 text-stone-700 dark:text-stone-300 border border-stone-200/60 dark:border-white/10'
                  }`}
                >
                  {/* Day Label (M, T, W, T, F, S, S) */}
                  <span className={`text-[9.5px] sm:text-[10px] font-black uppercase tracking-tight ${
                    isSelected ? 'text-stone-300 dark:text-stone-950' : 'text-stone-600 dark:text-stone-400'
                  }`}>
                    {day.dayOfWeek[0]}
                  </span>

                  {/* Day Number */}
                  <span className={`text-[11px] sm:text-xs font-mono font-bold my-0.5 ${
                    isSelected ? 'text-white dark:text-stone-950' : 'text-stone-800 dark:text-white'
                  }`}>
                    {day.dayNumber}
                  </span>

                  {/* Status Indicator Bubble */}
                  <div className="relative w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center my-0.5">
                    {goalMet ? (
                      /* Radiant Flame Icon for Goal Met Day */
                      <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center transition-transform ${
                        isSelected 
                          ? 'bg-gradient-to-tr from-amber-400 to-amber-300 text-stone-950 shadow-md shadow-amber-400/50 scale-110' 
                          : 'bg-gradient-to-tr from-amber-400 to-orange-400 text-white shadow-xs'
                      }`}>
                        <Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current text-current" />
                      </div>
                    ) : isToday ? (
                      /* Today's In-Progress Circular Gauge */
                      <div className="relative w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center">
                        <svg className="w-6 h-6 sm:w-7 sm:h-7 -rotate-90">
                          <circle
                            cx="14"
                            cy="14"
                            r="10"
                            className="stroke-stone-200 dark:stroke-stone-700 fill-none"
                            strokeWidth="2"
                          />
                          <circle
                            cx="14"
                            cy="14"
                            r="10"
                            className="stroke-teal-500 fill-none transition-all duration-500"
                            strokeWidth="2"
                            strokeDasharray={62.8}
                            strokeDashoffset={62.8 * (1 - progressRatio)}
                            strokeLinecap="round"
                          />
                        </svg>
                        <span className="absolute text-[8px] font-mono font-black text-teal-600 dark:text-teal-400">
                          {Math.round(progressRatio * 100)}%
                        </span>
                      </div>
                    ) : (
                      /* Missed / Rest Day */
                      <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-stone-200 dark:bg-stone-700 flex items-center justify-center">
                        <span className="w-1.5 h-1.5 rounded-full bg-stone-400 dark:bg-stone-500" />
                      </div>
                    )}
                  </div>

                  {/* Goal Met Check Badge or In-Progress Minutes */}
                  <div className="mt-0.5">
                    {goalMet ? (
                      <span className={`text-[7.5px] sm:text-[8px] font-mono font-bold px-1 rounded-sm ${
                        isSelected ? 'text-amber-300 dark:text-stone-900' : 'text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/70'
                      }`}>
                        {curMins}m
                      </span>
                    ) : isToday ? (
                      <span className={`text-[7.5px] sm:text-[8px] font-mono font-bold px-1 rounded-sm ${
                        isSelected ? 'text-teal-300 dark:text-stone-900' : 'text-teal-700 dark:text-teal-300 bg-teal-100 dark:bg-teal-950/70'
                      }`}>
                        {curMins}m
                      </span>
                    ) : (
                      <span className="text-[7.5px] sm:text-[8px] font-mono text-stone-400 dark:text-stone-500">
                        {curMins}m
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 2: 30-DAY MONTH CALENDAR GRID */}
      {viewMode === 'month' && (
        <div className="space-y-3 pt-1">
          <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400 font-medium">
            <span>{month.label}</span>
            <span className="text-amber-600 dark:text-amber-400 font-bold">🔥 {streakDays}-Day Streak</span>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((l, i) => (
              <span key={i} className="text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase py-1">
                {l}
              </span>
            ))}
            {monthCells.map((cell) => {
              if (cell.kind === 'blank') {
                return <span key={cell.key} aria-hidden="true" />;
              }
              const day = cell.day;
              return (
                <div
                  key={cell.key}
                  title={`${day.date}: ${day.minutes}m · +${day.xpEarned} XP`}
                  className={`p-1.5 sm:p-2 rounded-xl text-xs font-mono font-bold flex flex-col items-center justify-center gap-0.5 border ${
                    day.isToday
                      ? 'border-teal-500 bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-200 ring-2 ring-teal-500/20'
                      : day.goalMet
                      ? 'border-amber-300 dark:border-amber-500/40 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200'
                      : day.isFuture
                      ? 'border-stone-100 dark:border-white/5 bg-transparent text-stone-300 dark:text-stone-600'
                      : 'border-stone-100 dark:border-white/5 bg-stone-50 dark:bg-stone-800/40 text-stone-400 dark:text-stone-500'
                  }`}
                >
                  <span>{parseInt(day.date.slice(-2), 10)}</span>
                  {day.goalMet ? (
                    <Flame className="w-3 h-3 text-orange-500 fill-orange-500" />
                  ) : (
                    <span className="w-1 h-1 rounded-full bg-stone-300 dark:bg-stone-600" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Selected Day Activity Details Drawer: Responsive Mobile Presentation */}
      {selectedDay && (
        <div className="p-3 sm:p-3.5 bg-stone-50 dark:bg-stone-900/60 rounded-2xl border border-stone-200/80 dark:border-white/10 space-y-2.5 animate-in fade-in duration-200">
          <div className="flex flex-col min-[380px]:flex-row items-start min-[380px]:items-center justify-between gap-1.5 text-xs">
            <div className="flex items-center gap-1.5 min-w-0">
              <Calendar className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
              <span className="font-bold text-stone-900 dark:text-white font-display truncate">
                {selectedDay.dayBisaya} ({selectedDay.dayOfWeek[0]}), {selectedDay.date}
                {selectedDay.isToday && ' · Karon'}
              </span>
            </div>

            {selectedDay.goalMet || (selectedDay.isToday && isTodayGoalMet) ? (
              <span className="text-[9.5px] sm:text-[10px] font-extrabold text-emerald-800 dark:text-emerald-300 bg-emerald-100/90 dark:bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-500/40 flex items-center gap-1 shrink-0">
                <Check className="w-3 h-3" />
                Goal Met!
              </span>
            ) : selectedDay.isToday ? (
              <span className="text-[9.5px] sm:text-[10px] font-extrabold text-amber-800 dark:text-amber-300 bg-amber-100/90 dark:bg-amber-950/80 px-2 py-0.5 rounded-full border border-amber-300 dark:border-amber-500/40 shrink-0">
                In Progress ({todayMinutes}/{dailyGoalMinutes}m)
              </span>
            ) : (
              <span className="text-[9.5px] sm:text-[10px] font-bold text-stone-500 dark:text-stone-400 bg-stone-200 dark:bg-stone-800 px-2 py-0.5 rounded-full shrink-0">
                Rest Day
              </span>
            )}
          </div>

          {/* Metrics Breakdown for Selected Day */}
          <div className="grid grid-cols-3 gap-1.5 sm:gap-2 text-center text-xs">
            <div className="p-2 sm:p-2.5 bg-white dark:bg-[#11222D] rounded-xl border border-stone-200/70 dark:border-white/10 shadow-2xs">
              <div className="text-stone-500 dark:text-stone-400 text-[9.5px] sm:text-[10px] font-medium flex items-center justify-center gap-1">
                <Clock className="w-3 h-3 text-teal-600 dark:text-teal-400 shrink-0" />
                <span className="truncate">Time</span>
              </div>
              <div className="text-xs sm:text-sm font-black font-mono text-stone-900 dark:text-white mt-0.5 truncate">
                {selectedDay.isToday ? todayMinutes : selectedDay.minutes}/{selectedDay.goalMinutes}m
              </div>
            </div>

            <div className="p-2 sm:p-2.5 bg-white dark:bg-[#11222D] rounded-xl border border-stone-200/70 dark:border-white/10 shadow-2xs">
              <div className="text-stone-500 dark:text-stone-400 text-[9.5px] sm:text-[10px] font-medium flex items-center justify-center gap-1">
                <Zap className="w-3 h-3 text-amber-500 shrink-0" />
                <span className="truncate">XP</span>
              </div>
              <div className="text-xs sm:text-sm font-black font-mono text-amber-700 dark:text-amber-400 mt-0.5 truncate">
                +{selectedDay.xpEarned}
              </div>
            </div>

            <div className="p-2 sm:p-2.5 bg-white dark:bg-[#11222D] rounded-xl border border-stone-200/70 dark:border-white/10 shadow-2xs">
              <div className="text-stone-500 dark:text-stone-400 text-[9.5px] sm:text-[10px] font-medium flex items-center justify-center gap-1">
                <Award className="w-3 h-3 text-indigo-500 shrink-0" />
                <span className="truncate">Lessons</span>
              </div>
              <div className="text-xs sm:text-sm font-black font-mono text-indigo-700 dark:text-indigo-400 mt-0.5 truncate">
                {selectedDay.lessonsCompleted} done
              </div>
            </div>
          </div>

          {/* Quick Practice Trigger for Today if not yet met */}
          {selectedDay.isToday && !isTodayGoalMet && LearnDashboard && (
            <button
              onClick={() => {
                sounds.playTap();
                LearnDashboard
              }}
              className="w-full py-2.5 px-3 bg-gradient-to-r from-teal-600 to-emerald-500 hover:from-teal-500 hover:to-emerald-400 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all btn-3d-teal shadow-xs cursor-pointer active:scale-98"
            >
              <Sparkles className="w-3.5 h-3.5 shrink-0" />
              

            </button>
          )}

          {/* Streak Freeze Option if missed */}
          {!selectedDay.goalMet && !selectedDay.isToday && streakFreezes > 0 && !freezeApplied && (
            <button
              onClick={handleApplyFreeze}
              className="w-full py-2 px-3 bg-sky-50 dark:bg-sky-950/70 hover:bg-sky-100 text-sky-800 dark:text-sky-200 border border-sky-200 dark:border-sky-500/40 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-98"
            >
              <Shield className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 shrink-0" />
              <span className="text-center truncate">
                I-apply ang Streak Freeze ({streakDays}-Day Streak)
              </span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
