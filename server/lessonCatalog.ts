import { INITIAL_MODULES } from '../src/data/curriculumData';
import { COURSES } from '../src/data/coursesData';
import { ALL_LANGUAGE_PATHS } from '../src/data/languageJourneyData';
import type { ChallengeType, MajorLanguageId } from '../src/types';

export interface CatalogLesson {
  lessonId: string;
  moduleId: string;
  language: MajorLanguageId;
  xpReward: number;
  source: 'curriculum' | 'journey' | 'roadmap';
  challengeType?: ChallengeType;
  journeyLevelId?: string;
}

function mapLessonToLanguage(lessonId: string, moduleId: string): MajorLanguageId {
  for (const course of COURSES) {
    if (course.roadmapSteps?.some((step) => step.moduleId === moduleId)) {
      return course.languageCategory;
    }
  }
  if (lessonId.startsWith('les_')) return 'cebuano';
  if (lessonId.startsWith('fil_')) return 'filipino';
  if (lessonId.startsWith('eng_')) return 'english';
  return 'cebuano';
}

let cachedCatalog: CatalogLesson[] | null = null;

export function getLessonCatalog(): CatalogLesson[] {
  if (cachedCatalog) return cachedCatalog;

  const byId = new Map<string, CatalogLesson>();

  // Curriculum lessons (the Course Roadmap path).
  for (const module of INITIAL_MODULES as any[]) {
    for (const lesson of module.lessons || []) {
      if (!lesson?.id) continue;
      const moduleId = lesson.moduleId || module.id;
      byId.set(lesson.id, {
        lessonId: lesson.id,
        moduleId,
        language: mapLessonToLanguage(lesson.id, moduleId),
        xpReward: Number(lesson.xpReward) || 0,
        source: 'curriculum',
      });
    }
  }

  // Roadmap practice steps without a curriculum module. They can be marked
  // complete, but award no graded XP and never count toward course progress.
  for (const course of COURSES) {
    for (const step of course.roadmapSteps || []) {
      const lessonId = `les_step_${step.id}`;
      if (byId.has(lessonId)) continue;
      byId.set(lessonId, {
        lessonId,
        moduleId: step.moduleId || 'mod_roadmap',
        language: course.languageCategory,
        xpReward: 0,
        source: 'roadmap',
      });
    }
  }

  // Journey challenges are completable lessons too. Keeping their own IDs here
  // is what allows the Language Journey map to be server-backed instead of
  // relying on a static completed-ID array in the browser.
  for (const language of Object.keys(ALL_LANGUAGE_PATHS) as MajorLanguageId[]) {
    for (const level of ALL_LANGUAGE_PATHS[language].levels) {
      for (const challenge of level.challenges) {
        if (!challenge?.id || byId.has(challenge.id)) continue;
        byId.set(challenge.id, {
          lessonId: challenge.id,
          moduleId: level.id,
          language,
          xpReward: Math.min(Math.max(Number(challenge.xpReward) || 0, 0), 250),
          source: 'journey',
          challengeType: challenge.type,
          journeyLevelId: level.id,
        });
      }
    }
  }

  cachedCatalog = Array.from(byId.values());
  return cachedCatalog;
}

export function getLessonFromCatalog(lessonId: string): CatalogLesson | undefined {
  return getLessonCatalog().find((lesson) => lesson.lessonId === lessonId);
}
