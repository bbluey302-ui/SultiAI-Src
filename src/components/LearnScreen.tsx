import React, { useEffect, useState } from 'react';
import {
  X, GraduationCap, Check, Share2, Sparkles, Map, BookOpen, Wrench
} from 'lucide-react';
import {
  Module, Lesson, UserProfile, LearnerBadgeState, LearnerCertificateState
} from '../types';
import { CourseData, COURSES } from '../data/coursesData';
import { LanguageJourneyMap } from './learn/LanguageJourneyMap';
import { LearnDashboard } from './learn/LearnDashboard';
import { CourseRoadmapView } from './learn/CourseRoadmapView';
import { LearningToolsHub } from './learn/LearningToolsHub';
import { withLiveCourseProgress } from './learn/courseProgress';
import { QuickPracticeModal } from './learn/QuickPracticeModal';
import { sounds } from '../utils/soundEffects';

type LearnSection = 'journey' | 'curriculum' | 'tools';

const LEARN_SECTION_STORAGE_KEY = 'sultiai_learn_section';

const LEARN_SECTIONS: Array<{
  id: LearnSection;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: 'journey', label: 'Language Journey', icon: Map },
  { id: 'curriculum', label: 'Curriculum Hub', icon: BookOpen },
  { id: 'tools', label: '13 Learning Tools', icon: Wrench },
];

function getInitialLearnSection(): LearnSection {
  if (typeof window === 'undefined') return 'journey';
  const saved = localStorage.getItem(LEARN_SECTION_STORAGE_KEY);
  if (saved === 'journey' || saved === 'curriculum' || saved === 'tools') {
    return saved;
  }
  return 'journey';
}

interface LearnScreenProps {
  modules: Module[];
  completedLessons: string[];
  onStartLesson: (lesson: Lesson) => void;
  onOpenSulti?: (prefillPrompt?: string) => void;
  profile?: UserProfile;
  onAddPracticeMinutes?: (mins: number) => void;
  onGoToProfile?: () => void;
  badgeStates?: LearnerBadgeState[];
  certificate?: LearnerCertificateState | null;
  onClaimCertificate?: (language: LearnerCertificateState['language']) => Promise<LearnerCertificateState>;
}

export const LearnScreen: React.FC<LearnScreenProps> = ({
  modules,
  completedLessons,
  onStartLesson,
  onOpenSulti,
  profile,
  onAddPracticeMinutes,
  onGoToProfile,
  badgeStates = [],
  certificate = null,
  onClaimCertificate,
}) => {
  // Three primary Learn sections. Language Journey is the default for first-time
  // learners; returning learners keep their last selected section.
  const [currentSection, setCurrentSection] = useState<LearnSection>(getInitialLearnSection);

  // Nested view inside Curriculum Hub: course list vs. one course roadmap.
  const [curriculumView, setCurriculumView] = useState<'list' | 'course_view'>('list');
  const [selectedCourse, setSelectedCourse] = useState<CourseData>(COURSES[0]);

  // Shared learning-modal state
  const [activeQuickTool, setActiveQuickTool] = useState<string | null>(null);
  const [showCertificateModal, setShowCertificateModal] = useState(false);
  const [copiedCert, setCopiedCert] = useState(false);
  const [certificateState, setCertificateState] = useState<LearnerCertificateState | null>(certificate);
  const [certLoading, setCertLoading] = useState(false);
  const [certError, setCertError] = useState<string | null>(null);

  useEffect(() => {
    setCertificateState(certificate);
  }, [certificate]);

  const activeCertificate = certificateState || certificate;
  const certificateLanguageLabel =
    activeCertificate?.language === 'filipino'
      ? 'Filipino'
      : activeCertificate?.language === 'english'
      ? 'English'
      : 'Cebuano';

  // Course progress comes from the learner's completed lessons, not static literals
  const liveCourses = COURSES.map((course) => withLiveCourseProgress(course, modules, completedLessons));
  const selectedCourseLive = liveCourses.find((course) => course.id === selectedCourse.id)
    || withLiveCourseProgress(selectedCourse, modules, completedLessons);

  const handleSelectSection = (section: LearnSection) => {
    sounds.playTap();
    setCurrentSection(section);
    if (typeof window !== 'undefined') {
      localStorage.setItem(LEARN_SECTION_STORAGE_KEY, section);
    }
    // Re-entering Curriculum Hub shows the course list first.
    if (section === 'curriculum') {
      setCurriculumView('list');
    }
  };

  const handleSelectCourse = (course: CourseData) => {
    setSelectedCourse(course);
    setCurrentSection('curriculum');
    setCurriculumView('course_view');
    if (typeof window !== 'undefined') {
      localStorage.setItem(LEARN_SECTION_STORAGE_KEY, 'curriculum');
    }
  };

  const handleCopyCertCode = () => {
    sounds.playTap();
    if (!activeCertificate?.code) return;
    navigator.clipboard?.writeText(activeCertificate.code);
    setCopiedCert(true);
    setTimeout(() => setCopiedCert(false), 2000);
  };

  const handleOpenCertificate = async () => {
    if (!activeCertificate?.eligible && !activeCertificate?.code) return;
    sounds.playCelebration();
    setShowCertificateModal(true);
    setCertError(null);

    if (activeCertificate?.code || !onClaimCertificate) return;

    setCertLoading(true);
    try {
      const issued = await onClaimCertificate(activeCertificate.language);
      setCertificateState(issued);
    } catch (error: any) {
      setCertError(error?.message || 'Could not issue the certificate.');
    } finally {
      setCertLoading(false);
    }
  };

  return (
    <div className="pb-24 px-4 pt-1 max-w-md mx-auto select-none space-y-3">
      {/* ========================================================================= */}
      {/* 1. THREE PRIMARY LEARN SECTIONS                                           */}
      {/* ========================================================================= */}
      <div
        className="grid grid-cols-3 gap-1 p-1 bg-white dark:bg-[#11222D] rounded-2xl border border-stone-200/80 dark:border-white/10 shadow-2xs"
        role="tablist"
        aria-label="Learn sections"
      >
        {LEARN_SECTIONS.map((section) => {
          const Icon = section.icon;
          const active = currentSection === section.id;
          return (
            <button
              key={section.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => handleSelectSection(section.id)}
              className={`min-h-[52px] px-1.5 py-1.5 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer ${
                active
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'text-stone-500 hover:text-stone-900 dark:hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="text-[9px] sm:text-[10px] font-bold leading-tight text-center">
                {section.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* 2. LANGUAGE JOURNEY                                                       */}
      {/* ========================================================================= */}
      {currentSection === 'journey' && (
        <LanguageJourneyMap
          profile={profile}
          completedLessons={completedLessons}
          modules={modules}
          onStartLesson={onStartLesson}
          onOpenSulti={onOpenSulti}
          onOpenQuickPractice={(toolId) => setActiveQuickTool(toolId)}
          onOpenCertificateModal={handleOpenCertificate}
          onGoToProfile={onGoToProfile}
          badgeStates={badgeStates}
          certificate={activeCertificate}
        />
      )}

      {/* ========================================================================= */}
      {/* 3. CURRICULUM HUB (course list or one course roadmap)                     */}
      {/* ========================================================================= */}
      {currentSection === 'curriculum' && (
        curriculumView === 'course_view' ? (
          <CourseRoadmapView
            course={selectedCourseLive}
            modules={modules}
            completedLessons={completedLessons}
            onBackToDashboard={() => setCurriculumView('list')}
            onStartLesson={onStartLesson}
            onOpenSulti={onOpenSulti}
            onOpenCertificateModal={handleOpenCertificate}
            certificate={activeCertificate}
          />
        ) : (
          <LearnDashboard
            courses={liveCourses}
            onSelectCourse={handleSelectCourse}
            certificate={activeCertificate}
            onOpenCertificateModal={handleOpenCertificate}
          />
        )
      )}

      {/* ========================================================================= */}
      {/* 4. 13 LEARNING TOOLS                                                      */}
      {/* ========================================================================= */}
      {currentSection === 'tools' && (
        <LearningToolsHub
          profile={profile}
          onOpenTool={(toolId) => setActiveQuickTool(toolId)}
        />
      )}

      {/* ========================================================================= */}
      {/* 5. INDEPENDENT QUICK PRACTICE MODAL (13 distinct tool experiences)        */}
      {/* ========================================================================= */}
      <QuickPracticeModal
        isOpen={Boolean(activeQuickTool)}
        tool={activeQuickTool}
        onClose={() => setActiveQuickTool(null)}
        onOpenSulti={onOpenSulti}
      />

      {/* ========================================================================= */}
      {/* 6. VERIFIED ACADEMIC CREDENTIAL CERTIFICATE MODAL                         */}
      {/* ========================================================================= */}
      {showCertificateModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="w-full max-w-sm bg-white dark:bg-[#11222D] rounded-3xl p-6 shadow-2xl border border-stone-200 dark:border-white/10 space-y-4 text-center relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => {
                sounds.playTap();
                setShowCertificateModal(false);
              }}
              className="absolute top-4 right-4 text-stone-400 hover:text-stone-700 dark:hover:text-white p-1 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Official Academic Seal */}
            <div className="w-16 h-16 rounded-full bg-amber-50 dark:bg-amber-950/70 text-amber-500 border-2 border-amber-300 dark:border-amber-600 flex items-center justify-center mx-auto shadow-inner">
              <GraduationCap className="w-8 h-8 text-amber-600 dark:text-amber-400" />
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-widest text-teal-800 dark:text-teal-300 font-extrabold bg-teal-50 dark:bg-teal-950/80 px-2.5 py-0.5 rounded-full border border-teal-200 dark:border-teal-700">
                SultiAI Language Journey
              </span>
              <h3 className="font-display font-black text-lg text-stone-900 dark:text-white pt-1">
                Certificate of {certificateLanguageLabel} Completion
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
                Conferred to <span className="font-bold text-stone-900 dark:text-white">{profile?.name || 'Learner'}</span> for completing every server-verified challenge in the {certificateLanguageLabel} Journey.
              </p>
            </div>

            {/* Server-verified credential data */}
            <div className="bg-stone-50 dark:bg-[#152B37] rounded-2xl p-3.5 border border-stone-200 dark:border-white/10 text-left space-y-1.5 text-xs font-mono">
              <div className="flex justify-between text-stone-600 dark:text-stone-300">
                <span>Curriculum:</span>
                <span className="font-bold text-stone-900 dark:text-white">
                  {activeCertificate?.completedChallenges || 0} / {activeCertificate?.totalChallenges || 0} Challenges
                </span>
              </div>
              <div className="flex justify-between text-stone-600 dark:text-stone-300">
                <span>Average Score:</span>
                <span className="font-bold text-teal-600 dark:text-teal-400">
                  {activeCertificate?.averageScore === null || activeCertificate?.averageScore === undefined
                    ? 'Not scored'
                    : `${activeCertificate.averageScore}%`}
                </span>
              </div>
              <div className="flex justify-between gap-3 text-stone-600 dark:text-stone-300">
                <span>Verification Code:</span>
                <span className="font-bold text-stone-900 dark:text-white text-right break-all">
                  {activeCertificate?.code || (certLoading ? 'Issuing…' : 'Not issued')}
                </span>
              </div>
              {activeCertificate?.issuedAt && (
                <div className="flex justify-between text-stone-600 dark:text-stone-300">
                  <span>Issued:</span>
                  <span className="font-bold text-stone-900 dark:text-white">
                    {new Date(activeCertificate.issuedAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              )}
            </div>

            {certError && (
              <p className="text-[11px] text-rose-600 dark:text-rose-400 font-mono bg-rose-50 dark:bg-rose-950/30 rounded-xl p-2">
                {certError}
              </p>
            )}

            {/* Action Buttons */}
            <div className="space-y-2 pt-2">
              <button
                onClick={handleCopyCertCode}
                disabled={!activeCertificate?.code || certLoading}
                className="w-full py-3 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-98 transition-all"
              >
                {certLoading ? (
                  <>
                    <Sparkles className="w-4 h-4 animate-pulse" />
                    <span>Issuing Server-Verified Credential…</span>
                  </>
                ) : copiedCert ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Copied Verification Code!</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-4 h-4" />
                    <span>Copy Verification Credential</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
