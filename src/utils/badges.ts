import { MASTER_BADGES } from '../data/languageJourneyData';
import type { LearnerBadge, LearnerBadgeState } from '../types';

function formatEarnedDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Merge the static badge catalog with server-owned earned/progress state.
 * The catalog never supplies an unlock on its own.
 */
export function mergeBadgeStates(states: LearnerBadgeState[] = []): LearnerBadge[] {
  const stateById = new Map(states.map((state) => [state.id, state]));

  return MASTER_BADGES.map((badge) => {
    const state = stateById.get(badge.id);
    const earned = Boolean(state?.earnedAt);
    return {
      ...badge,
      unlocked: earned,
      unlockedDate: state?.earnedAt ? formatEarnedDate(state.earnedAt) : undefined,
      progressPercent: earned
        ? 100
        : Math.max(0, Math.min(100, Math.round(state?.progressPercent || 0))),
    };
  });
}

export function countEarnedBadges(states: LearnerBadgeState[] = []): number {
  return states.filter((state) => Boolean(state.earnedAt)).length;
}

export function getNextLockedBadge(states: LearnerBadgeState[] = []): LearnerBadge | undefined {
  return mergeBadgeStates(states).find((badge) => !badge.unlocked);
}
