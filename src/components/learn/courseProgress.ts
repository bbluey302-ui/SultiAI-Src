import { CourseData } from '../../data/coursesData';
import { Module } from '../../types';

/**
 * Derives a course's progress from the learner's real completed lessons.
 * A course's lessons are the lessons of the modules referenced by its roadmap
 * steps (`step.moduleId`). Returns the course with live `progressPercent`,
 * `completedLessonsCount` and `totalLessons`. A course with no linked modules
 * keeps 0 progress instead of a hardcoded value.
 */
export function withLiveCourseProgress(
  course: CourseData,
  modules: Module[],
  completedLessons: string[],
): CourseData {
  const moduleIds = new Set(
    course.roadmapSteps.map((s) => s.moduleId).filter((id): id is string => Boolean(id)),
  );
  const lessons = modules
    .filter((m) => moduleIds.has(m.id))
    .flatMap((m) => m.lessons || []);
  const completedSet = new Set(completedLessons);
  const completedCount = lessons.filter((l) => completedSet.has(l.id)).length;
  const total = lessons.length;

  return {
    ...course,
    totalLessons: total,
    completedLessonsCount: completedCount,
    progressPercent: total > 0 ? Math.round((completedCount / total) * 100) : 0,
  };
}
