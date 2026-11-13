// ============================================================================
// Real learner practice calendar (server side)
// ----------------------------------------------------------------------------
// Reads/writes `learner_daily_activity` and derives everything the streak card
// shows: today's minutes, the current Sunday→Saturday week, the current month,
// consecutive goal-met days (streak) and per-day XP/lesson totals.
//
// All dates are resolved in the learner's local timezone (Asia/Manila by
// default) so a practice at 00:30 PHT lands on the correct calendar day.
// ============================================================================
import { supabaseServer } from './supabaseServer';

export const DEFAULT_TIMEZONE = process.env.LEARNER_TIMEZONE || 'Asia/Manila';
export const DEFAULT_DAILY_GOAL_MINUTES = 15;

export interface LearnerActivityRow {
  user_id: string;
  activity_date: string;
  minutes: number;
  xp_earned: number;
  lessons_completed: number;
  goal_minutes: number;
}

export interface ActivityDaySummary {
  date: string;
  minutes: number;
  xpEarned: number;
  lessonsCompleted: number;
  goalMinutes: number;
  goalMet: boolean;
  isToday: boolean;
  isFuture: boolean;
}

export interface ActivityMonthSummary {
  year: number;
  month: number;
  label: string;
  daysInMonth: number;
  firstWeekday: number;
  days: ActivityDaySummary[];
}

export interface ActivitySummaryPayload {
  today: string;
  timeZone: string;
  weekStart: string;
  weekEnd: string;
  days: ActivityDaySummary[];
  month: ActivityMonthSummary;
  streakDays: number;
  todayMinutes: number;
  todayXp: number;
  weeklyMinutes: number;
  weeklyXp: number;
  daysGoalMet: number;
  dailyGoalMinutes: number;
}

const WEEKDAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

/** `YYYY-MM-DD` for the given instant in the learner timezone. */
export function getLocalDateString(date: Date = new Date(), timeZone: string = DEFAULT_TIMEZONE): string {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(date);
  } catch {
    return date.toISOString().slice(0, 10);
  }
}

function toUtcDate(iso: string): Date {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(Date.UTC(year, (month || 1) - 1, day || 1, 12, 0, 0));
}

export function addDays(iso: string, days: number): string {
  const date = toUtcDate(iso);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function normalizeGoal(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.min(Math.round(parsed), 1440) : DEFAULT_DAILY_GOAL_MINUTES;
}

function buildDaySummary(
  date: string,
  row: LearnerActivityRow | undefined,
  today: string,
  fallbackGoal: number,
): ActivityDaySummary {
  const isToday = date === today;
  const minutes = Math.max(0, Number(row?.minutes) || 0);
  // Today follows the learner's current goal; past days keep the goal that was
  // active when they practiced.
  const goalMinutes = isToday ? fallbackGoal : normalizeGoal(row?.goal_minutes || fallbackGoal);
  return {
    date,
    minutes,
    xpEarned: Math.max(0, Number(row?.xp_earned) || 0),
    lessonsCompleted: Math.max(0, Number(row?.lessons_completed) || 0),
    goalMinutes,
    goalMet: minutes > 0 && minutes >= goalMinutes,
    isToday,
    isFuture: date > today,
  };
}

function computeStreak(
  rowsByDate: Map<string, LearnerActivityRow>,
  today: string,
  fallbackGoal: number,
): number {
  const isGoalMet = (date: string) => {
    const row = rowsByDate.get(date);
    const minutes = Math.max(0, Number(row?.minutes) || 0);
    const goal = normalizeGoal(row?.goal_minutes || fallbackGoal);
    return minutes > 0 && minutes >= goal;
  };

  // A streak stays alive while today is still in progress; it only breaks once
  // yesterday (and today) are both below the goal.
  let cursor = isGoalMet(today) ? today : addDays(today, -1);
  let streak = 0;
  // Safety cap: five years of consecutive days.
  while (streak < 1825 && isGoalMet(cursor)) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

function emptySummary(today: string, fallbackGoal: number): ActivitySummaryPayload {
  const weekStart = addDays(today, -toUtcDate(today).getUTCDay());
  const days: ActivityDaySummary[] = Array.from({ length: 7 }, (_, index) => {
    const date = addDays(weekStart, index);
    return buildDaySummary(date, undefined, today, fallbackGoal);
  });
  const monthDate = toUtcDate(today);
  const year = monthDate.getUTCFullYear();
  const month = monthDate.getUTCMonth();
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const firstWeekday = new Date(Date.UTC(year, month, 1)).getUTCDay();
  const monthDays: ActivityDaySummary[] = Array.from({ length: daysInMonth }, (_, index) => {
    const date = `${year}-${String(month + 1).padStart(2, '0')}-${String(index + 1).padStart(2, '0')}`;
    return buildDaySummary(date, undefined, today, fallbackGoal);
  });

  return {
    today,
    timeZone: DEFAULT_TIMEZONE,
    weekStart,
    weekEnd: addDays(weekStart, 6),
    days,
    month: {
      year,
      month,
      label: `${MONTH_NAMES[month]} ${year}`,
      daysInMonth,
      firstWeekday,
      days: monthDays,
    },
    streakDays: 0,
    todayMinutes: 0,
    todayXp: 0,
    weeklyMinutes: 0,
    weeklyXp: 0,
    daysGoalMet: 0,
    dailyGoalMinutes: fallbackGoal,
  };
}

/**
 * Load the activity rows for a learner and derive the streak card payload.
 * Never throws: a missing table / offline Supabase returns an empty but real
 * current-week/month calendar (correct dates, zero progress).
 */
export async function getActivitySummary(
  userId: string,
  options: { goalMinutes?: number; date?: string } = {},
): Promise<ActivitySummaryPayload> {
  const timeZone = DEFAULT_TIMEZONE;
  const today = options.date || getLocalDateString(new Date(), timeZone);
  const goal = normalizeGoal(options.goalMinutes);

  if (!supabaseServer) return emptySummary(today, goal);

  const monthDate = toUtcDate(today);
  const year = monthDate.getUTCFullYear();
  const month = monthDate.getUTCMonth();
  const monthStart = `${year}-${String(month + 1).padStart(2, '0')}-01`;
  // Fetch enough history for a one-year streak plus the current month.
  const from = monthStart < addDays(today, -366) ? monthStart : addDays(today, -366);

  let rows: LearnerActivityRow[] = [];
  try {
    const { data, error } = await supabaseServer
      .from('learner_daily_activity')
      .select('user_id, activity_date, minutes, xp_earned, lessons_completed, goal_minutes')
      .eq('user_id', userId)
      .gte('activity_date', from)
      .lte('activity_date', today)
      .order('activity_date', { ascending: true });

    if (error) {
      console.warn('[activity] load failed:', error.message);
    } else {
      rows = (data || []) as LearnerActivityRow[];
    }
  } catch (err: any) {
    console.warn('[activity] load exception:', err?.message);
  }

  const rowsByDate = new Map<string, LearnerActivityRow>();
  for (const row of rows) {
    rowsByDate.set(String(row.activity_date).slice(0, 10), row);
  }

  const weekStart = addDays(today, -toUtcDate(today).getUTCDay());
  const days: ActivityDaySummary[] = Array.from({ length: 7 }, (_, index) => {
    const date = addDays(weekStart, index);
    return buildDaySummary(date, rowsByDate.get(date), today, goal);
  });

  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const firstWeekday = new Date(Date.UTC(year, month, 1)).getUTCDay();
  const monthDays: ActivityDaySummary[] = Array.from({ length: daysInMonth }, (_, index) => {
    const date = `${year}-${String(month + 1).padStart(2, '0')}-${String(index + 1).padStart(2, '0')}`;
    return buildDaySummary(date, rowsByDate.get(date), today, goal);
  });

  const todaySummary = buildDaySummary(today, rowsByDate.get(today), today, goal);
  const weeklyMinutes = days.reduce((total, day) => total + (day.isFuture ? 0 : day.minutes), 0);
  const weeklyXp = days.reduce((total, day) => total + (day.isFuture ? 0 : day.xpEarned), 0);
  const daysGoalMet = days.filter((day) => !day.isFuture && day.goalMet).length;

  return {
    today,
    timeZone,
    weekStart,
    weekEnd: addDays(weekStart, 6),
    days,
    month: {
      year,
      month,
      label: `${MONTH_NAMES[month]} ${year}`,
      daysInMonth,
      firstWeekday,
      days: monthDays,
    },
    streakDays: computeStreak(rowsByDate, today, goal),
    todayMinutes: todaySummary.minutes,
    todayXp: todaySummary.xpEarned,
    weeklyMinutes,
    weeklyXp,
    daysGoalMet,
    dailyGoalMinutes: goal,
  };
}

export interface ActivityIncrementInput {
  minutes?: number;
  xp?: number;
  lessons?: number;
  goalMinutes?: number;
  date?: string;
}

// The largest single lesson/challenge reward currently defined is 250 XP
// (the Language Journey capstone assessment), so one activity call cannot
// legitimately add more than that.
// TODO(M2): replace this per-call stopgap with server-verified lesson XP.
const MAX_XP_PER_ACTIVITY_CALL = 250;

/**
 * Add practice to a learner's local day, then return the refreshed summary.
 * Uses the atomic `learner_add_activity` RPC (service role only).
 */
export async function recordActivity(
  userId: string,
  input: ActivityIncrementInput,
): Promise<ActivitySummaryPayload> {
  const today = input.date || getLocalDateString(new Date(), DEFAULT_TIMEZONE);
  const goal = normalizeGoal(input.goalMinutes);
  const minutes = Math.min(Math.max(Math.round(Number(input.minutes) || 0), 0), 600);
  const xp = Math.min(Math.max(Math.round(Number(input.xp) || 0), 0), MAX_XP_PER_ACTIVITY_CALL);
  const lessons = Math.min(Math.max(Math.round(Number(input.lessons) || 0), 0), 100);

  if (supabaseServer && (minutes || xp || lessons)) {
    try {
      const { error } = await supabaseServer.rpc('learner_add_activity', {
        p_user: userId,
        p_date: today,
        p_minutes: minutes,
        p_xp: xp,
        p_lessons: lessons,
        p_goal: goal,
      });
      if (error) throw new Error(error.message);
    } catch (err: any) {
      console.warn('[activity] rpc failed, falling back to upsert:', err?.message);
      await fallbackUpsert(userId, today, { minutes, xp, lessons, goal });
    }
  }

  return getActivitySummary(userId, { goalMinutes: goal, date: today });
}

async function fallbackUpsert(
  userId: string,
  date: string,
  add: { minutes: number; xp: number; lessons: number; goal: number },
): Promise<void> {
  if (!supabaseServer) return;
  try {
    const { data } = await supabaseServer
      .from('learner_daily_activity')
      .select('minutes, xp_earned, lessons_completed')
      .eq('user_id', userId)
      .eq('activity_date', date)
      .maybeSingle();

    const next = {
      user_id: userId,
      activity_date: date,
      minutes: Math.max(0, Number(data?.minutes) || 0) + add.minutes,
      xp_earned: Math.max(0, Number(data?.xp_earned) || 0) + add.xp,
      lessons_completed: Math.max(0, Number(data?.lessons_completed) || 0) + add.lessons,
      goal_minutes: add.goal,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabaseServer
      .from('learner_daily_activity')
      .upsert([next], { onConflict: 'user_id,activity_date' });
    if (error) console.warn('[activity] upsert failed:', error.message);
  } catch (err: any) {
    console.warn('[activity] upsert exception:', err?.message);
  }
}

/** Exposed for callers that need real weekday labels without duplicating them. */
export function weekdayLabel(iso: string): string {
  return WEEKDAY_NAMES[toUtcDate(iso).getUTCDay()];
}
