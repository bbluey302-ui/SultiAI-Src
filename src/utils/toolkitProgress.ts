import { ALL_LANGUAGE_PATHS } from '../data/languageJourneyData';

/**
 * Derives toolkit-module progress from server-owned Journey challenge IDs.
 * A module with no mapped challenges reports 0% instead of a demo value.
 */
export function getToolkitProgress(completedLessons: string[]): Record<string, number> {
  const completedSet = new Set(completedLessons);
  const totals = new Map<string, { done: number; total: number }>();

  for (const path of Object.values(ALL_LANGUAGE_PATHS)) {
    for (const level of path.levels) {
      for (const challenge of level.challenges) {
        const moduleId = challenge.toolkitModuleId;
        if (!moduleId) continue;
        const current = totals.get(moduleId) || { done: 0, total: 0 };
        current.total += 1;
        if (completedSet.has(challenge.id)) current.done += 1;
        totals.set(moduleId, current);
      }
    }
  }

  const result: Record<string, number> = {};
  for (const [moduleId, { done, total }] of totals) {
    result[moduleId] = total > 0 ? Math.round((done / total) * 100) : 0;
  }
  return result;
}
