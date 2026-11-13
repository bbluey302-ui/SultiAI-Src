import React, { useState } from 'react';
import { 
  ArrowLeft, Check, Lock, Play, Sparkles, Trophy, Award, 
  ChevronRight, Mic, MessageSquare, BookOpen, Clock, Zap 
} from 'lucide-react';
import { CourseData, CourseRoadmapStep } from '../../data/coursesData';
import { Lesson, Module, LearnerCertificateState } from '../../types';
import { sounds } from '../../utils/soundEffects';

interface CourseRoadmapViewProps {
  course: CourseData;
  modules: Module[];
  completedLessons: string[];
  onBackToDashboard: () => void;
  onStartLesson: (lesson: Lesson) => void;
  onOpenSulti?: (prompt?: string) => void;
  onOpenCertificateModal?: () => void;
  certificate?: LearnerCertificateState | null;
}

export const CourseRoadmapView: React.FC<CourseRoadmapViewProps> = ({
  course,
  modules,
  completedLessons,
  onBackToDashboard,
  onStartLesson,
  onOpenSulti,
  onOpenCertificateModal,
  certificate = null,
}) => {
  const [expandedStepId, setExpandedStepId] = useState<string>('step_beg_3'); // default expand current active step

  const completedSet = new Set(completedLessons);

  const getStepCompletion = (step: CourseRoadmapStep) => {
    if (step.moduleId) {
      const mod = modules.find((m) => m.id === step.moduleId);
      const lessons = mod?.lessons || [];
      if (lessons.length > 0) {
        const done = lessons.filter((lesson) => completedSet.has(lesson.id)).length;
        return { done, total: lessons.length };
      }
    }
    // Roadmap steps without a curriculum module use a practice lesson. It has
    // its own ID and is completed only when the server has that ID.
    return { done: completedSet.has(`les_step_${step.id}`) ? 1 : 0, total: 1 };
  };

  const allPreviousStepsComplete = (index: number) => {
    return course.roadmapSteps.slice(0, index).every((previous) => {
      if (previous.isCertificate) return true;
      const completion = getStepCompletion(previous);
      return completion.total > 0 && completion.done >= completion.total;
    });
  };

  // Associate steps with real curriculum modules
  const getStepStatus = (step: CourseRoadmapStep, index: number) => {
    if (step.isCertificate) {
      const eligible = course.languageCategory === 'cebuano'
        && Boolean(certificate?.eligible || certificate?.code);
      return { status: eligible ? 'unlocked' : 'locked', label: eligible ? 'Unlocked' : 'Locked' };
    }

    const completion = getStepCompletion(step);
    const isComplete = completion.total > 0 && completion.done >= completion.total;

    if (step.isAssessment) {
      if (isComplete) return { status: 'completed', label: 'Complete' };
      return allPreviousStepsComplete(index)
        ? { status: 'current', label: 'Ready to Assess' }
        : { status: 'locked', label: 'Locked' };
    }

    if (isComplete) return { status: 'completed', label: 'Complete' };
    if (completion.done > 0 || allPreviousStepsComplete(index)) {
      return { status: 'current', label: 'YOU ARE HERE' };
    }
    return { status: 'locked', label: 'Locked' };
  };

  // Find module lessons for this step
  const getModuleLessons = (step: CourseRoadmapStep): Lesson[] => {
    if (step.moduleId) {
      const mod = modules.find((m) => m.id === step.moduleId);
      if (mod && mod.lessons && mod.lessons.length > 0) return mod.lessons;
    }
    // Interactive practice lesson for this step
    return [
      {
        id: `les_step_${step.id}`,
        moduleId: step.moduleId || 'mod_roadmap',
        title: `${step.title} · Core Practice`,
        titleBisaya: step.titleBisaya,
        description: step.description,
        level: course.level === 'Beginner' ? 'Beginner' : 'Intermediate',
        xpReward: 0,
        estimatedMinutes: 6,
        activities: [
          {
            id: `act_${step.id}_1`,
            type: 'flashcard',
            prompt: `Master Phrasing: ${step.title}`,
            promptBisaya: step.titleBisaya,
            phonetics: 'Natural intonation and regional cadence',
            explanation: step.description,
            culturalNote: 'SULTI AI ensures respectful phrasing and natural speech patterns for non-native learners.',
          },
          {
            id: `act_${step.id}_2`,
            type: 'multiple_choice',
            prompt: `How do you express "${step.titleBisaya}" in authentic everyday conversation?`,
            options: [
              step.titleBisaya,
              'Dili kini ang husto nga kapilian',
              'Sayop nga pamulong sa sitwasyon',
              'Walay labot sa panag-estorya',
            ],
            correctAnswer: 0,
            explanation: `Sakto kaayo! "${step.titleBisaya}" is the natural phrasing for ${step.title.toLowerCase()}.`,
          },
          {
            id: `act_${step.id}_3`,
            type: 'pronunciation_drill',
            prompt: `Pronounce: "${step.titleBisaya}"`,
            promptBisaya: step.titleBisaya,
            phonetics: 'Speak clearly into the microphone',
            explanation: 'Whisper STT evaluates acoustic alignment, vowel clarity, and Visayan stress.',
          },
        ],
      },
    ];
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-300 pb-12">
      {/* 1. TOP NAVIGATION & BACK BUTTON */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => {
            sounds.playTap();
            onBackToDashboard();
          }}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white px-3 py-1.5 rounded-xl bg-white dark:bg-[#11222D] border border-stone-200 dark:border-white/10 shadow-2xs transition-all active:scale-95 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Curriculum Hub</span>
        </button>

        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-teal-800 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/80 px-2.5 py-1 rounded-full border border-teal-200/60 dark:border-teal-500/30">
          Course Roadmap
        </span>
      </div>

      {/* 2. COURSE HERO OVERVIEW */}
      <div className="bg-white dark:bg-[#11222D] rounded-3xl p-5 border border-stone-200/90 dark:border-white/10 shadow-xs space-y-3 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-36 h-36 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="space-y-1 relative z-10">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-black uppercase tracking-widest text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/80 px-2 py-0.5 rounded-md border border-teal-200/50 dark:border-teal-500/30">
              {course.level} Level
            </span>
            <span className="text-xs text-stone-400 font-mono">
              {course.estimatedHours}
            </span>
          </div>

          <h2 className="font-display font-black text-xl text-stone-900 dark:text-white leading-tight">
            {course.title}
          </h2>
          <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed font-normal">
            {course.description}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5 pt-1 relative z-10">
          <div className="flex items-center justify-between text-[11px] font-mono text-stone-500 dark:text-stone-400">
            <span>Overall Completion</span>
            <span className="font-bold text-stone-900 dark:text-white">{course.progressPercent}% Complete</span>
          </div>
          <div className="w-full bg-stone-100 dark:bg-stone-800 rounded-full h-2.5 p-0.5 overflow-hidden border border-stone-200/50 dark:border-white/10 shadow-inner">
            <div
              className="bg-gradient-to-r from-teal-500 to-teal-400 h-full rounded-full transition-all duration-700"
              style={{ width: `${course.progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* 3. THE VISUAL ROADMAP JOURNEY (PATHWAY) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs px-1">
          <span className="font-display font-black uppercase tracking-wider text-stone-500 dark:text-stone-400 text-[11px]">
            Your Roadmap Journey
          </span>
          <span className="text-[10px] text-stone-400 font-mono">Step-by-step path</span>
        </div>

        {/* Start Marker */}
        <div className="flex items-center justify-center">
          <span className="px-3 py-1 rounded-full text-[10px] font-mono font-black uppercase tracking-widest bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-300 dark:border-white/10 shadow-2xs">
            🏁 START
          </span>
        </div>

        {/* Vertical Connected Pathway */}
        <div className="relative space-y-4 pt-1">
          {course.roadmapSteps.map((step, idx) => {
            const { status, label } = getStepStatus(step, idx);
            const isCompleted = status === 'completed';
            const isCurrent = status === 'current';
            const isLocked = status === 'locked';
            const isExpanded = expandedStepId === step.id;
            const stepLessons = getModuleLessons(step);

            return (
              <div key={step.id} className="relative flex flex-col items-center">
                {/* Connecting Vertical Line */}
                {idx > 0 && (
                  <div className={`w-0.5 h-6 -mt-3 mb-1 ${
                    isCompleted || isCurrent ? 'bg-teal-500' : 'bg-stone-200 dark:bg-stone-800'
                  }`} />
                )}

                {/* Node Card */}
                <div 
                  onClick={() => {
                    if (!isLocked) {
                      sounds.playTap();
                      setExpandedStepId(isExpanded ? '' : step.id);
                    }
                  }}
                  className={`w-full rounded-3xl p-4.5 border transition-all select-none ${
                    isCurrent
                      ? 'bg-white dark:bg-[#11222D] border-teal-500 dark:border-teal-400 shadow-md ring-2 ring-teal-500/20'
                      : isCompleted
                      ? 'bg-white dark:bg-[#11222D] border-emerald-300 dark:border-emerald-600/40 shadow-xs'
                      : 'bg-stone-50/70 dark:bg-stone-900/40 border-stone-200 dark:border-stone-800/80 opacity-70'
                  } ${!isLocked ? 'cursor-pointer hover:shadow-sm' : 'cursor-not-allowed'}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    {/* Left: Step Number & Check / Lock Icon */}
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-display font-black text-sm shrink-0 shadow-xs ${
                        isCurrent
                          ? 'bg-teal-600 text-white animate-pulse'
                          : isCompleted
                          ? 'bg-emerald-600 text-white'
                          : 'bg-stone-200 dark:bg-stone-800 text-stone-500'
                      }`}>
                        {isCompleted ? (
                          <Check className="w-5 h-5 stroke-[3]" />
                        ) : isLocked ? (
                          <Lock className="w-4 h-4" />
                        ) : (
                          step.stepNumber
                        )}
                      </div>

                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className={`text-[9px] font-mono font-black uppercase tracking-wider px-2 py-0.5 rounded ${
                            isCurrent
                              ? 'bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-200 border border-teal-300 dark:border-teal-700'
                              : isCompleted
                              ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700'
                              : 'bg-stone-100 dark:bg-stone-800 text-stone-500'
                          }`}>
                            {label}
                          </span>

                          <span className="text-[10px] text-stone-400 font-mono">
                            {step.isCertificate
                              ? 'Credential'
                              : step.isAssessment
                              ? 'Assessment'
                              : `${stepLessons.length} ${stepLessons.length === 1 ? 'Lesson' : 'Lessons'}`}
                          </span>
                        </div>

                        <h4 className="font-display font-black text-sm sm:text-base text-stone-900 dark:text-white leading-snug">
                          {step.title}
                        </h4>
                        <p className="text-xs text-teal-700 dark:text-teal-300 font-mono italic">
                          "{step.titleBisaya}"
                        </p>
                      </div>
                    </div>

                    {/* Expand indicator */}
                    {!isLocked && (
                      <ChevronRight className={`w-4 h-4 text-stone-400 transition-transform ${
                        isExpanded ? 'rotate-90 text-teal-600' : ''
                      }`} />
                    )}
                  </div>

                  <p className="text-xs text-stone-500 dark:text-stone-400 pt-2 leading-relaxed">
                    {step.description}
                  </p>

                  {/* EXPANDED LESSONS & SULTI ACTIVITIES */}
                  {isExpanded && !isLocked && (
                    <div className="mt-3.5 pt-3 border-t border-stone-100 dark:border-white/10 space-y-2.5 animate-in fade-in">
                      <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-stone-400">
                        Module Lessons & Practice:
                      </div>

                      <div className="space-y-2">
                        {stepLessons.map((les) => (
                          <div
                            key={les.id}
                            className="p-3 bg-stone-50 dark:bg-[#152B37] rounded-2xl border border-stone-200/80 dark:border-white/10 flex items-center justify-between gap-2.5"
                          >
                            <div className="min-w-0 space-y-0.5">
                              <div className="flex items-center gap-1.5">
                                <span className="font-display font-black text-xs text-stone-900 dark:text-white truncate">
                                  {les.title}
                                </span>
                              </div>
                              <div className="text-[11px] text-stone-500 dark:text-stone-400 flex items-center gap-2">
                                <span className="flex items-center gap-0.5">
                                  <Clock className="w-3 h-3" />
                                  {les.estimatedMinutes} min
                                </span>
                                <span>·</span>
                                <span className="text-amber-600 dark:text-amber-400 font-mono font-bold">
                                  +{les.xpReward} XP
                                </span>
                              </div>
                            </div>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                sounds.playTap();
                                onStartLesson(les);
                              }}
                              className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-black text-xs btn-3d-teal cursor-pointer shrink-0 flex items-center gap-1"
                            >
                              <span>Start</span>
                              <Play className="w-3 h-3 fill-current" />
                            </button>
                          </div>
                        ))}

                        {/* Embedded Roleplay with Sulti for this Module */}
                        <div className="p-3 bg-purple-50/70 dark:bg-purple-950/40 rounded-2xl border border-purple-200 dark:border-purple-800/60 flex items-center justify-between gap-2">
                          <div className="space-y-0.5">
                            <div className="font-display font-black text-xs text-purple-900 dark:text-purple-200 flex items-center gap-1">
                              <MessageSquare className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                              <span>Roleplay Drill with Sulti</span>
                            </div>
                            <p className="text-[10px] text-purple-700/80 dark:text-purple-300">
                              Practice "{step.titleBisaya}" with conversational AI voice
                            </p>
                          </div>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              sounds.playTap();
                              onOpenSulti?.(`Gusto kong magpraktis og panagsulti bahin sa ${step.titleBisaya}.`);
                            }}
                            className="px-3 py-1.5 rounded-xl bg-purple-700 hover:bg-purple-600 text-white font-bold text-xs cursor-pointer shadow-xs shrink-0"
                          >
                            Speak
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* SPECIAL ASSESSMENT / CERTIFICATE ACTION */}
                  {step.isCertificate && (
                    <div className="mt-3 pt-3 border-t border-stone-100 dark:border-white/10">
                      {(course.languageCategory === 'cebuano' && Boolean(certificate?.eligible || certificate?.code)) ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            sounds.playTap();
                            onOpenCertificateModal?.();
                          }}
                          className="w-full py-2.5 px-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                        >
                          <Trophy className="w-4 h-4" />
                          <span>{certificate?.code ? 'View Verified Certificate' : 'Claim Verified Certificate'}</span>
                        </button>
                      ) : (
                        <div className="w-full rounded-2xl border border-dashed border-stone-300 dark:border-white/15 bg-stone-50 dark:bg-stone-900/40 px-3 py-2 text-center">
                          <div className="flex items-center justify-center gap-1.5 text-[11px] font-bold text-stone-500 dark:text-stone-400">
                            <Lock className="w-3.5 h-3.5" />
                            <span>Certificate locked</span>
                          </div>
                          <p className="mt-0.5 text-[9px] font-mono text-stone-400">
                            {course.languageCategory === 'cebuano'
                              ? 'Complete every Cebuano Journey challenge to claim it.'
                              : 'Verified certificates are not available for this pathway yet.'}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
