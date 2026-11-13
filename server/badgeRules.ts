// ============================================================================
// Server-side badge + certificate rules
// ----------------------------------------------------------------------------
// Badges are earned from persisted lesson completions, never from browser
// localStorage or a hard-coded unlocked flag. This module is intentionally pure
// so it can be unit-tested without Supabase.
// ============================================================================
import { ALL_LANGUAGE_PATHS, MASTER_BADGES } from '../src/data/languageJourneyData';
import type { MajorLanguageId } from '../src/types';

export interface CompletedLessonRow {
  lesson_id: string;
  language: string;
  xp_awarded?: number | null;
  score?: number | null;
  completed_at?: string | null;
}

export interface BadgeProgress {
  id: string;
  progressPercent: number;
  eligible: boolean;
}

export interface CertificateEligibility {
  eligible: boolean;
  language: MajorLanguageId;
  completedChallenges: number;
  totalChallenges: number;
  averageScore: number | null;
}

export const LANGUAGE_IDS: MajorLanguageId[] = ['cebuano', 'filipino', 'english'];

export function normalizeLanguage(value: unknown): MajorLanguageId | null {
  return value === 'cebuano' || value === 'filipino' || value === 'english'
    ? value
    : null;
}

export function getLanguageChallenges(language: MajorLanguageId) {
  return ALL_LANGUAGE_PATHS[language].levels.flatMap((level) =>
    level.challenges.map((challenge) => ({ ...challenge, levelId: level.id, language })),
  );
}

export function getCebuanoChallengeIds(): string[] {
  return ALL_LANGUAGE_PATHS.cebuano.levels.flatMap((level) =>
    level.challenges.map((challenge) => challenge.id),
  );
}

function clampPercent(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function evaluateBadgeProgress(
  completed: CompletedLessonRow[],
  streakDays: number,
): BadgeProgress[] {
  const completedSet = new Set(completed.map((row) => row.lesson_id));
  const progressById = new Map<string, number>();
  const earned = new Set<string>();

  const record = (badgeId: string, done: number, target: number) => {
    const safeTarget = Math.max(1, target);
    const percent = clampPercent((Math.max(0, done) / safeTarget) * 100);
    const previous = progressById.get(badgeId) || 0;
    progressById.set(badgeId, Math.max(previous, percent));
    if (done >= safeTarget) earned.add(badgeId);
  };

  // Completion and streak milestones.
  record('first_steps', completedSet.size, 1);
  record('seven_day_speaker', Math.max(0, Math.round(streakDays)), 7);

  // Listening is the only badge with a cross-path count.
  const listeningIds = LANGUAGE_IDS.flatMap((language) =>
    getLanguageChallenges(language)
      .filter((challenge) => challenge.type === 'listening')
      .map((challenge) => challenge.id),
  );
  record('good_listener', listeningIds.filter((id) => completedSet.has(id)).length, Math.max(1, listeningIds.length));

  // Level-reward badges come from the Journey definition. The final Cebuano
  // level shares `cebuano_master`, so that badge is evaluated against the whole
  // Cebuano pathway below instead of being awarded at Level 8.
  for (const language of LANGUAGE_IDS) {
    for (const level of ALL_LANGUAGE_PATHS[language].levels) {
      const badgeId = level.rewardBadgeId;
      if (!badgeId || badgeId === 'cebuano_master') continue;
      const done = level.challenges.filter((challenge) => completedSet.has(challenge.id)).length;
      record(badgeId, done, level.challenges.length);
    }
  }

  const cebuanoIds = getCebuanoChallengeIds();
  record('cebuano_master', cebuanoIds.filter((id) => completedSet.has(id)).length, cebuanoIds.length);

  return MASTER_BADGES.map((badge) => ({
    id: badge.id,
    progressPercent: progressById.get(badge.id) || 0,
    eligible: earned.has(badge.id),
  }));
}

export function getCertificateEligibility(
  completed: CompletedLessonRow[],
): CertificateEligibility {
  const cebuanoIds = getCebuanoChallengeIds();
  const completedSet = new Set(
    completed
      .filter((row) => normalizeLanguage(row.language) === 'cebuano')
      .map((row) => row.lesson_id),
  );
  const completedChallenges = cebuanoIds.filter((id) => completedSet.has(id)).length;

  const scores = completed
    .filter((row) => normalizeLanguage(row.language) === 'cebuano')
    .filter((row) => row.score !== null && row.score !== undefined)
    .map((row) => Number(row.score))
    .filter((score) => Number.isFinite(score) && score >= 0 && score <= 100);

  const averageScore = scores.length
    ? Math.round(scores.reduce((total, score) => total + score, 0) / scores.length)
    : null;

  return {
    eligible: cebuanoIds.length > 0 && completedChallenges === cebuanoIds.length,
    language: 'cebuano',
    completedChallenges,
    totalChallenges: cebuanoIds.length,
    averageScore,
  };
}
