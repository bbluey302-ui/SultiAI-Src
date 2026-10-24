import { useMemo } from 'react';
import { CourseData } from '../../data/coursesData';
import { Lesson, Module } from '../../types';

export interface LearnerProgressState {
  coursePercent: number;
  completedLessonIds: string[];
  nextLesson?: Lesson;
  nextLessonModule?: Module;
  getStepStatus: (stepIndex: number) => 'completed' | 'current' | 'locked';
  roadmapStepsDerived: Array<{ title: string; status: 'done' | 'current' | 'locked' }>;
}

export function useLearnerProgress(
  courses: CourseData[] = [],
  modules: Module[] = [],
  completedLessons: string[] = [],
): LearnerProgressState {
  return useMemo(() => {
    const allLessons = modules.flatMap((m: Module) => m.lessons || []);
    const completedSet = new Set(completedLessons);
    const completedCount = allLessons.filter((l: Lesson) => completedSet.has(l.id)).length;
    const totalCount = allLessons.length || 1;
    const coursePercent = Math.round((completedCount / totalCount) * 100);

    const nextLesson = allLessons.find((l: Lesson) => !completedSet.has(l.id)) || allLessons[0];
    let nextLessonModule: Module | undefined;
    if (nextLesson) {
      nextLessonModule = modules.find((m: Module) => m.id === nextLesson.moduleId || m.lessons?.some((l: Lesson) => l.id === nextLesson.id));
    }

    const getStepStatus = (stepIndex: number): 'completed' | 'current' | 'locked' => {
      if (completedCount > stepIndex * 2) return 'completed';
      if (completedCount >= stepIndex * 2) return 'current';
      return 'locked';
    };

    const roadmapStepsDerived = [
      { title: 'Foundation', status: completedCount >= 2 ? 'done' : completedCount >= 0 ? 'current' : 'locked' },
      { title: 'Everyday Bisaya', status: completedCount >= 4 ? 'done' : completedCount >= 2 ? 'current' : 'locked' },
      { title: 'Real Conversations', status: completedCount >= 6 ? 'done' : completedCount >= 4 ? 'current' : 'locked' },
      { title: 'Real-World Practice', status: completedCount >= 8 ? 'done' : completedCount >= 6 ? 'current' : 'locked' },
      { title: 'Speaking Challenge', status: completedCount >= 10 ? 'done' : completedCount >= 8 ? 'current' : 'locked' },
      { title: 'Assessment', status: completedCount >= 12 ? 'done' : completedCount >= 10 ? 'current' : 'locked' },
      { title: 'Certificate', status: coursePercent >= 100 ? 'done' : completedCount >= 12 ? 'current' : 'locked' },
    ];

    return {
      coursePercent,
      completedLessonIds: completedLessons,
      nextLesson,
      nextLessonModule,
      getStepStatus,
      roadmapStepsDerived,
    };
  }, [courses, modules, completedLessons]);
}
