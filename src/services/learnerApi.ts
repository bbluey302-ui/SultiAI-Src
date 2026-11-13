// Backwards-compatible wrappers for older Stage 2 callers. New code should use
// `learnerProgressService` directly. The language argument is intentionally
// ignored: the server derives it from the canonical lesson catalog.
import {
  completeLearnerLesson,
  fetchLearnerProgress,
} from './learnerProgressService';

export async function completeLessonServer(
  lessonId: string,
  _language?: string,
  score?: number | null,
) {
  return completeLearnerLesson({ lessonId, score });
}

export const fetchProgress = fetchLearnerProgress;
