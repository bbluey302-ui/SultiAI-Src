import { INITIAL_MODULES } from '../src/data/curriculumData';
import { COURSES } from '../src/data/coursesData';

export interface CatalogLesson {
  lessonId: string;
  moduleId: string;
  language: 'cebuano' | 'filipino' | 'english';
  xpReward: number;
}

function mapLessonToLanguage(lessonId: string, moduleId: string): 'cebuano' | 'filipino' | 'english' {
  for (const course of COURSES) {
    if (course.roadmapSteps?.some((step: any) => step.moduleId === moduleId)) {
      return course.languageCategory;
    }
  }
  if (lessonId.startsWith('les_')) return 'cebuano';
  if (lessonId.startsWith('fil_')) return 'filipino';
  if (lessonId.startsWith('eng_')) return 'english';
  return 'cebuano';
}

export function getLessonCatalog(): CatalogLesson[] {
  const catalog: CatalogLesson[] = [];
  for (const module of INITIAL_MODULES as any[]) {
    for (const lesson of module.lessons || []) {
      catalog.push({
        lessonId: lesson.id,
        moduleId: lesson.moduleId || module.id,
        language: mapLessonToLanguage(lesson.id, lesson.moduleId || module.id),
        xpReward: Number(lesson.xpReward) || 0,
      });
    }
  }
  return catalog;
}

export function getLessonFromCatalog(lessonId: string): CatalogLesson | undefined {
  return getLessonCatalog().find((l) => l.lessonId === lessonId);
}
