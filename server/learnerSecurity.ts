// Stage 1: server-side allow-lists for learner-authored data.
//
// The browser may describe who it is (via a verified bearer token) and may
// change presentation preferences such as the display name, dialect and daily
// goal. It must never be able to set authoritative progress fields (XP, hearts,
// streak, badges, certificate eligibility, role or account status) through the
// sync/activity endpoints.
//
// This module is deliberately pure so the allow-lists can be unit tested
// without Express, Supabase or any provider credentials.

export interface VerifiedLearnerIdentity {
  userId: string;
  email?: string | null;
}

export interface SafeLearnerSyncProfile {
  name: string;
  email: string | null;
  targetDialect: string;
  dailyGoalMinutes: number;
}

export type SafeLearnerSyncResult =
  | { ok: true; profile: SafeLearnerSyncProfile }
  | { ok: false; error: string };

export interface SafeActivityIncrement {
  minutes: number;
  goalMinutes?: number;
}

const ALLOWED_DIALECTS = new Set([
  'cebuano_standard',
  'davao_bisaya',
  'boholano',
]);

const DEFAULT_DIALECT = 'davao_bisaya';
const DEFAULT_DAILY_GOAL_MINUTES = 15;
const MAX_DAILY_GOAL_MINUTES = 1440;
const MAX_NAME_LENGTH = 80;

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function normalizeName(value: unknown): string {
  if (typeof value !== 'string') return '';
  // Remove control characters and collapse whitespace before enforcing a
  // bounded display name.
  return value
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX_NAME_LENGTH);
}

function normalizeDailyGoal(value: unknown): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_DAILY_GOAL_MINUTES;
  return Math.min(Math.round(parsed), MAX_DAILY_GOAL_MINUTES);
}

function normalizeMinutes(value: unknown): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return 0;
  // The current UI never reports more than a long lesson in one call. Keeping a
  // hard cap means a malformed client cannot create absurd daily totals in one
  // request. Stage 2 replaces this with server-issued completion events.
  return Math.min(Math.round(parsed), 600);
}

/**
 * Build the only learner profile payload the server is willing to persist from
 * a browser request. The authenticated identity owns `id` and `email`; body
 * values for `id`, `email`, `role`, `status`, `xp`, `hearts`, `streakDays`,
 * `speechScoreAverage`, `vocabularyMastered` and `lastActive` are ignored.
 */
export function buildSafeLearnerProfile(
  input: unknown,
  identity: VerifiedLearnerIdentity,
): SafeLearnerSyncResult {
  if (!identity?.userId) {
    return { ok: false, error: 'Verified learner identity is required' };
  }

  const body = asRecord(input);
  const name = normalizeName(body.name);
  if (!name) {
    return { ok: false, error: 'name is required' };
  }

  const requestedDialect = typeof body.targetDialect === 'string'
    ? body.targetDialect.trim()
    : '';

  return {
    ok: true,
    profile: {
      name,
      email: identity.email ?? null,
      targetDialect: ALLOWED_DIALECTS.has(requestedDialect)
        ? requestedDialect
        : DEFAULT_DIALECT,
      dailyGoalMinutes: normalizeDailyGoal(body.dailyGoalMinutes),
    },
  };
}

/**
 * Extract the only activity fields a browser is allowed to report. XP and
 * lesson counts are deliberately discarded here; those are awarded by the
 * server-side lesson completion path.
 */
export function parseClientActivityIncrement(input: unknown): SafeActivityIncrement {
  const body = asRecord(input);
  const goal = Number(body.goalMinutes);
  return {
    minutes: normalizeMinutes(body.minutes),
    goalMinutes:
      Number.isFinite(goal) && goal > 0
        ? Math.min(Math.round(goal), MAX_DAILY_GOAL_MINUTES)
        : undefined,
  };
}
