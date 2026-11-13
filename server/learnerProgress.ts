// ============================================================================
// Authoritative learner progress
// ----------------------------------------------------------------------------
// `completed_lessons` is the source of truth for graded progress. Badge rows
// and certificates are persisted server-side; the browser can only read them
// through its own RLS-scoped session.
// ============================================================================
import { randomBytes } from 'crypto';
import type {
  LearnerBadgeState,
  LearnerCertificateState,
  LearnerProgressSnapshot,
} from '../src/types';
import { getActivitySummary } from './learnerActivity';
import {
  evaluateBadgeProgress,
  getCertificateEligibility,
  LANGUAGE_IDS,
  type CompletedLessonRow,
} from './badgeRules';
import { supabaseServer } from './supabaseServer';

interface BadgeRow {
  badge_id: string;
  earned_at: string;
}

interface CertificateRow {
  verification_code: string;
  issued_at: string;
  average_score: number | null;
  completed_challenges: number;
  total_challenges: number;
}

export class LearnerProgressUnavailableError extends Error {
  code = 'LEARNER_PROGRESS_UNAVAILABLE';
}

export class CertificateNotEligibleError extends Error {
  code = 'CERTIFICATE_NOT_ELIGIBLE';
  progress: LearnerProgressSnapshot;
  constructor(progress: LearnerProgressSnapshot) {
    super('Complete every Cebuano Journey challenge before claiming a certificate.');
    this.name = 'CertificateNotEligibleError';
    this.progress = progress;
  }
}

function emptyXpByLanguage(): Record<(typeof LANGUAGE_IDS)[number], number> {
  return { cebuano: 0, filipino: 0, english: 0 };
}

function normalizeProgressRows(data: unknown): CompletedLessonRow[] {
  return Array.isArray(data) ? (data as CompletedLessonRow[]) : [];
}

async function loadCompletedLessons(userId: string): Promise<CompletedLessonRow[]> {
  if (!supabaseServer) throw new LearnerProgressUnavailableError('Supabase is not configured');

  const { data, error } = await supabaseServer
    .from('completed_lessons')
    .select('lesson_id, language, xp_awarded, score, completed_at')
    .eq('user_id', userId)
    .order('completed_at', { ascending: true });

  if (error) throw new Error(`Failed to load completed lessons: ${error.message}`);
  return normalizeProgressRows(data);
}

async function loadBadgeRows(userId: string): Promise<BadgeRow[]> {
  if (!supabaseServer) return [];

  const { data, error } = await supabaseServer
    .from('learner_badges')
    .select('badge_id, earned_at')
    .eq('user_id', userId);

  if (error) {
    // A missing table must not fabricate earned badges. Progress still loads;
    // the migration is reported separately by the deployment checks.
    console.warn('[learner-progress] badge table unavailable:', error.message);
    return [];
  }
  return (data || []) as BadgeRow[];
}

async function loadCertificateRow(userId: string): Promise<CertificateRow | null> {
  if (!supabaseServer) return null;

  const { data, error } = await supabaseServer
    .from('learner_certificates')
    .select('verification_code, issued_at, average_score, completed_challenges, total_challenges')
    .eq('user_id', userId)
    .eq('language', 'cebuano')
    .maybeSingle();

  if (error) {
    console.warn('[learner-progress] certificate table unavailable:', error.message);
    return null;
  }
  return (data as CertificateRow | null) || null;
}

async function awardBadgesIfNeeded(
  userId: string,
  completed: CompletedLessonRow[],
  streakDays: number,
): Promise<LearnerBadgeState[]> {
  if (!supabaseServer) throw new LearnerProgressUnavailableError('Supabase is not configured');

  const progress = evaluateBadgeProgress(completed, streakDays);
  const existingRows = await loadBadgeRows(userId);
  const earnedAtById = new Map(existingRows.map((row) => [row.badge_id, row.earned_at]));

  const missing = progress.filter((badge) => badge.eligible && !earnedAtById.has(badge.id));
  if (missing.length > 0) {
    const now = new Date().toISOString();
    const { data, error } = await supabaseServer
      .from('learner_badges')
      .upsert(
        missing.map((badge) => ({
          user_id: userId,
          badge_id: badge.id,
          earned_at: now,
        })),
        { onConflict: 'user_id,badge_id', ignoreDuplicates: true },
      )
      .select('badge_id, earned_at');

    if (error) {
      console.warn('[learner-progress] badge award failed:', error.message);
    } else {
      for (const row of (data || []) as BadgeRow[]) {
        earnedAtById.set(row.badge_id, row.earned_at);
      }
    }
  }

  return progress.map((badge) => ({
    id: badge.id,
    earnedAt: earnedAtById.get(badge.id) || null,
    progressPercent: badge.progressPercent,
  }));
}

function buildCertificateState(
  completed: CompletedLessonRow[],
  row: CertificateRow | null,
): LearnerCertificateState {
  const eligibility = getCertificateEligibility(completed);
  return {
    ...eligibility,
    code: row?.verification_code ?? null,
    issuedAt: row?.issued_at ?? null,
  };
}

export async function getLearnerProgress(userId: string): Promise<LearnerProgressSnapshot> {
  const completed = await loadCompletedLessons(userId);

  const xpByLanguage = emptyXpByLanguage();
  for (const row of completed) {
    const language = row.language === 'cebuano' || row.language === 'filipino' || row.language === 'english'
      ? row.language
      : null;
    if (!language) continue;
    xpByLanguage[language] += Math.max(0, Number(row.xp_awarded) || 0);
  }

  let streakDays = 0;
  try {
    const summary = await getActivitySummary(userId);
    streakDays = summary.streakDays;
  } catch (error) {
    console.warn('[learner-progress] activity summary unavailable:', error);
  }

  const badges = await awardBadgesIfNeeded(userId, completed, streakDays);
  const certificateRow = await loadCertificateRow(userId);

  return {
    completedLessons: completed.map((row) => row.lesson_id),
    xp: Object.values(xpByLanguage).reduce((total, value) => total + value, 0),
    xpByLanguage,
    streakDays,
    completedCount: completed.length,
    badges,
    certificate: buildCertificateState(completed, certificateRow),
  };
}

function generateCertificateCode(): string {
  const year = new Date().getUTCFullYear();
  return `SULTI-CEB-${year}-${randomBytes(4).toString('hex').toUpperCase()}`;
}

export async function claimLearnerCertificate(userId: string): Promise<LearnerCertificateState> {
  if (!supabaseServer) throw new LearnerProgressUnavailableError('Supabase is not configured');

  const progress = await getLearnerProgress(userId);
  if (!progress.certificate.eligible) {
    throw new CertificateNotEligibleError(progress);
  }
  if (progress.certificate.code) return progress.certificate;

  const { data, error } = await supabaseServer
    .from('learner_certificates')
    .insert({
      user_id: userId,
      language: 'cebuano',
      verification_code: generateCertificateCode(),
      average_score: progress.certificate.averageScore,
      completed_challenges: progress.certificate.completedChallenges,
      total_challenges: progress.certificate.totalChallenges,
    })
    .select('verification_code, issued_at, average_score, completed_challenges, total_challenges')
    .single();

  if (error) {
    // A concurrent claim may have won the unique constraint. Return the row
    // that already exists rather than issuing a second credential.
    if (error.code === '23505') {
      const existing = await loadCertificateRow(userId);
      if (existing) return buildCertificateState(await loadCompletedLessons(userId), existing);
    }
    throw new Error(`Failed to issue certificate: ${error.message}`);
  }

  const row = data as CertificateRow;
  return {
    ...progress.certificate,
    code: row.verification_code,
    issuedAt: row.issued_at,
    averageScore: row.average_score,
    completedChallenges: row.completed_challenges,
    totalChallenges: row.total_challenges,
  };
}

/**
 * Mirror server-derived totals into the admin roster row. Never called from a
 * browser payload; only after a server-verified completion.
 */
export async function syncLearnerAccountMirror(
  userId: string,
  progress: LearnerProgressSnapshot,
): Promise<void> {
  if (!supabaseServer) return;
  try {
    const { error } = await supabaseServer
      .from('learner_accounts')
      .update({
        xp: progress.xp,
        streak_days: progress.streakDays,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);
    if (error) console.warn('[learner-progress] mirror update failed:', error.message);
  } catch (error) {
    console.warn('[learner-progress] mirror exception:', error);
  }
}
