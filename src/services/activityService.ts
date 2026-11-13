// ============================================================================
// Learner practice calendar client
// ----------------------------------------------------------------------------
// Talks to the learner backend (`/api/learner/activity`) so the streak card,
// weekly goal and month grid are backed by real Supabase rows instead of the
// hard-coded September demo week.
// ============================================================================
import { DayActivity } from '../types';
import { authHeaders } from './tokenService';

export interface LearnerActivityDay {
  date: string;
  minutes: number;
  xpEarned: number;
  lessonsCompleted: number;
  goalMinutes: number;
  goalMet: boolean;
  isToday: boolean;
  isFuture: boolean;
}

export interface LearnerActivityMonth {
  year: number;
  month: number;
  label: string;
  daysInMonth: number;
  firstWeekday: number;
  days: LearnerActivityDay[];
}

export interface LearnerActivitySummary {
  today: string;
  timeZone: string;
  weekStart: string;
  weekEnd: string;
  days: LearnerActivityDay[];
  month: LearnerActivityMonth;
  streakDays: number;
  todayMinutes: number;
  todayXp: number;
  weeklyMinutes: number;
  weeklyXp: number;
  daysGoalMet: number;
  dailyGoalMinutes: number;
}

export interface ActivityIncrement {
  minutes?: number;
  xp?: number;
  lessons?: number;
  goalMinutes?: number;
  date?: string;
}

const WEEKDAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
const WEEKDAY_BISAYA: Record<(typeof WEEKDAY_NAMES)[number], string> = {
  Sun: 'Dom',
  Mon: 'Lun',
  Tue: 'Mar',
  Wed: 'Miy',
  Thu: 'Hwe',
  Fri: 'Biy',
  Sat: 'Sab',
};
const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTH_LONG = [
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

/** Parse a `YYYY-MM-DD` string without timezone drift. */
function parseDateParts(iso: string): { year: number; month: number; day: number; weekday: number } {
  const [year, month, day] = iso.split('-').map(Number);
  const date = new Date(Date.UTC(year, (month || 1) - 1, day || 1, 12, 0, 0));
  return { year, month, day, weekday: date.getUTCDay() };
}

export function getLocalDateString(date: Date = new Date()): string {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Manila',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(date);
  } catch {
    return date.toISOString().slice(0, 10);
  }
}

/** Convert a backend activity day into the shape the existing UI expects. */
export function toDayActivity(day: LearnerActivityDay): DayActivity {
  const { year, month, day: dayNumber, weekday } = parseDateParts(day.date);
  const dayOfWeek = WEEKDAY_NAMES[weekday];
  return {
    id: `day_${year}${String(month).padStart(2, '0')}${String(dayNumber).padStart(2, '0')}`,
    date: `${MONTH_SHORT[month - 1]} ${dayNumber}`,
    dayOfWeek,
    dayBisaya: WEEKDAY_BISAYA[dayOfWeek],
    dayNumber,
    minutes: day.minutes,
    goalMinutes: day.goalMinutes,
    goalMet: day.goalMet,
    xpEarned: day.xpEarned,
    lessonsCompleted: day.lessonsCompleted,
    isToday: day.isToday,
  };
}

/** Current Sunday→Saturday week built locally (offline / signed-out fallback). */
export function buildCurrentWeek(goalMinutes = 15, reference: Date = new Date()): DayActivity[] {
  const today = getLocalDateString(reference);
  const { weekday } = parseDateParts(today);
  const start = new Date(`${today}T12:00:00Z`);
  start.setUTCDate(start.getUTCDate() - weekday);

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start);
    date.setUTCDate(start.getUTCDate() + index);
    const iso = date.toISOString().slice(0, 10);
    return toDayActivity({
      date: iso,
      minutes: 0,
      xpEarned: 0,
      lessonsCompleted: 0,
      goalMinutes,
      goalMet: false,
      isToday: iso === today,
      isFuture: iso > today,
    });
  });
}

/** Current month grid with zero progress (used before the first fetch). */
export function buildCurrentMonth(goalMinutes = 15, reference: Date = new Date()): LearnerActivityMonth {
  const today = getLocalDateString(reference);
  const { year, month } = parseDateParts(today);
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const firstWeekday = new Date(Date.UTC(year, month - 1, 1, 12)).getUTCDay();
  const days: LearnerActivityDay[] = Array.from({ length: daysInMonth }, (_, index) => {
    const dayNumber = index + 1;
    const iso = `${year}-${String(month).padStart(2, '0')}-${String(dayNumber).padStart(2, '0')}`;
    return {
      date: iso,
      minutes: 0,
      xpEarned: 0,
      lessonsCompleted: 0,
      goalMinutes,
      goalMet: false,
      isToday: iso === today,
      isFuture: iso > today,
    };
  });

  return {
    year,
    month: month - 1,
    label: `${MONTH_LONG[month - 1]} ${year}`,
    daysInMonth,
    firstWeekday,
    days,
  };
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: {
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...(await authHeaders()),
      ...(init?.headers || {}),
    },
  });

  const payload = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(payload?.error || `Activity request failed (HTTP ${res.status})`);
  }
  return payload as T;
}

export async function fetchActivitySummary(
  goalMinutes = 15,
): Promise<LearnerActivitySummary> {
  const params = new URLSearchParams({ goalMinutes: String(goalMinutes) });
  return request<LearnerActivitySummary>(`/api/learner/activity?${params.toString()}`);
}

export async function logLearnerActivity(
  increment: ActivityIncrement,
): Promise<LearnerActivitySummary> {
  // Stage 1: the browser may report practice minutes and a goal preference
  // only. XP and lesson completion are server-awarded, so they are not sent
  // from this path even though callers still update their optimistic local UI.
  return request<LearnerActivitySummary>('/api/learner/activity', {
    method: 'POST',
    body: JSON.stringify({
      minutes: increment.minutes,
      goalMinutes: increment.goalMinutes,
    }),
  });
}
