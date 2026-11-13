import React, { useState } from 'react';
import { Map, ArrowRight, ShieldCheck, Award } from 'lucide-react';
import { LearnerCertificateState } from '../../types';
import { CourseData, COURSES } from '../../data/coursesData';
import { sounds } from '../../utils/soundEffects';
import { TutorDirectoryModal } from '../tutor/TutorDirectoryModal';
import { ApplyTutorModal } from '../tutor/ApplyTutorModal';
import { getApprovedTutors, Tutor, TutorLanguage } from '../../data/tutorsData';
import { LearningLanguageSelector } from '../shared/LearningLanguageSelector';
import { useLearningLanguage } from '../../hooks/useLearningLanguage';

interface LearnDashboardProps {
  courses?: CourseData[];
  onSelectCourse: (course: CourseData) => void;
  certificate?: LearnerCertificateState | null;
  onOpenCertificateModal?: () => void;
}

/**
 * Curriculum Hub — courses, roadmaps, tutor support, and earned certificates.
 * Language Journey content and the 13 Learning Tools live in their own tabs.
 */
export const LearnDashboard: React.FC<LearnDashboardProps> = ({
  courses = COURSES,
  onSelectCourse,
  certificate = null,
  onOpenCertificateModal,
}) => {
  // Shared learning-language selection (same state as Sulti AI + Language Journey)
  const [courseCategoryFilter, setCourseCategoryFilter] = useLearningLanguage();

  // Filter courses by selected language category
  const filteredCourses = courses.filter((course) => course.languageCategory === courseCategoryFilter);

  // Certificate is shown only for the language that legitimately earned it.
  const certificateReady = Boolean(
    certificate &&
      (certificate.eligible || certificate.code) &&
      certificate.language === courseCategoryFilter
  );

  // Tutor Hub State
  const [showTutorDirectory, setShowTutorDirectory] = useState(false);
  const [tutorFilter, setTutorFilter] = useState<TutorLanguage | 'all'>('all');
  const [showApplyTutorModal, setShowApplyTutorModal] = useState(false);
  const [activeTutorsList, setActiveTutorsList] = useState<Tutor[]>(() => getApprovedTutors());

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* ========================================================================= */}
      {/* 1. COURSES & ROADMAPS                                                     */}
      {/* ========================================================================= */}
      <div className="space-y-3.5">
        {/* Section Header */}
        <div className="flex items-center justify-between text-xs px-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-2xl bg-teal-100 dark:bg-teal-950/80 text-teal-700 dark:text-teal-400 border border-teal-200/60 dark:border-teal-500/30 shadow-2xs">
              <Map className="w-4 h-4" />
            </span>
            <div>
              <h2 className="font-display font-black uppercase tracking-wider text-stone-900 dark:text-white text-xs sm:text-sm flex items-center gap-1.5">
                <span>Courses & Roadmaps</span>
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-md bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 border border-teal-200/60 dark:border-teal-700/40 font-bold uppercase">
                  Curriculum Hub
                </span>
              </h2>
              <p className="text-[10.5px] text-stone-500 dark:text-stone-400 font-medium">
                Choose your learning language and explore step-by-step milestone roadmaps
              </p>
            </div>
          </div>
        </div>

        {/* Shared Learning Language Selector */}
        <LearningLanguageSelector
          value={courseCategoryFilter}
          onChange={setCourseCategoryFilter}
        />

        {/* Dynamic Categorized Course Cards with Rich Roadmap Previews */}
        <div className="space-y-3">
          {filteredCourses.map((courseItem) => {
            const flag =
              courseItem.languageCategory === 'filipino'
                ? '🇵🇭'
                : courseItem.languageCategory === 'english'
                ? '🌎'
                : '🇵🇭';

            return (
              <div
                key={courseItem.id}
                onClick={() => {
                  sounds.playTap();
                  onSelectCourse(courseItem);
                }}
                className="p-4 sm:p-5 bg-white dark:bg-[#11222D] hover:bg-stone-50 dark:hover:bg-[#152B37] rounded-3xl border border-stone-200/90 dark:border-white/10 shadow-xs hover:shadow-sm transition-all cursor-pointer group space-y-3.5 relative overflow-hidden"
              >
                {/* Accent glow corner */}
                <div className="absolute top-0 right-0 w-28 h-28 bg-teal-500/5 dark:bg-teal-400/5 rounded-full blur-xl pointer-events-none" />

                {/* Card Title Row */}
                <div className="flex items-start justify-between gap-3 relative z-10">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-lg">{flag}</span>
                      <h3 className="font-display font-black text-sm sm:text-base text-stone-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                        {courseItem.title}
                      </h3>
                      <span className="px-2 py-0.5 rounded-md text-[9px] font-mono font-black uppercase bg-teal-50 dark:bg-teal-950/80 text-teal-800 dark:text-teal-300 border border-teal-200/60 dark:border-teal-500/30">
                        {courseItem.level}
                      </span>
                    </div>
                    <p className="text-xs text-stone-500 dark:text-stone-400 font-medium">
                      {courseItem.subtitle}
                    </p>
                    <p className="text-[10.5px] text-stone-500 dark:text-stone-400 leading-relaxed line-clamp-2">
                      {courseItem.description}
                    </p>
                  </div>

                  <div className="flex flex-col items-end shrink-0">
                    <span className="font-mono font-black text-xs text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/80 border border-teal-200/60 dark:border-teal-700/40 px-2.5 py-1 rounded-xl shadow-2xs">
                      {courseItem.progressPercent}%
                    </span>
                    <span className="text-[9px] font-mono text-stone-400 dark:text-stone-500 mt-0.5">
                      {courseItem.completedLessonsCount}/{courseItem.totalLessons} lessons
                    </span>
                  </div>
                </div>

                {/* Roadmap Milestone Steps Ribbon */}
                {courseItem.roadmapSteps && courseItem.roadmapSteps.length > 0 && (
                  <div className="p-2.5 bg-stone-50 dark:bg-stone-900/50 rounded-2xl border border-stone-150 dark:border-white/5 space-y-1.5 relative z-10">
                    <div className="flex items-center justify-between text-[10px] font-mono text-stone-400 dark:text-stone-500 font-bold uppercase tracking-wider">
                      <span>Curriculum Roadmap</span>
                      <span className="text-teal-600 dark:text-teal-400">
                        {courseItem.roadmapSteps.length} Milestones
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap py-0.5">
                      {courseItem.roadmapSteps.slice(0, 5).map((step, idx) => (
                        <div
                          key={step.id}
                          className="flex items-center gap-1.5 shrink-0 px-2 py-1 rounded-lg bg-white dark:bg-[#11222D] border border-stone-200/70 dark:border-white/10 text-[10px] font-mono font-bold text-stone-600 dark:text-stone-300"
                        >
                          <span className="w-3.5 h-3.5 rounded-full bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 text-[9px] flex items-center justify-center font-black">
                            {idx + 1}
                          </span>
                          <span className="truncate max-w-[90px]">{step.title}</span>
                        </div>
                      ))}
                      {courseItem.roadmapSteps.length > 5 && (
                        <span className="text-[10px] font-mono text-stone-400 px-1 font-bold">
                          +{courseItem.roadmapSteps.length - 5}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Progress Bar & Open Roadmap Button */}
                <div className="space-y-2 relative z-10">
                  <div className="w-full bg-stone-100 dark:bg-stone-800 h-2 rounded-full overflow-hidden p-0.5 border border-stone-200/50 dark:border-white/5">
                    <div
                      className="h-full bg-gradient-to-r from-teal-500 to-teal-400 rounded-full transition-all duration-300"
                      style={{ width: `${courseItem.progressPercent}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-mono text-stone-400">
                    <span>{courseItem.totalLessons} Lessons · {courseItem.estimatedHours}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        sounds.playTap();
                        onSelectCourse(courseItem);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95"
                    >
                      <span>Explore Roadmap</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {filteredCourses.length === 0 && (
            <div className="p-8 rounded-3xl bg-white dark:bg-[#11222D] border border-dashed border-stone-300 dark:border-white/15 text-center space-y-1.5">
              <p className="text-2xl">📚</p>
              <p className="font-display font-black text-sm text-stone-900 dark:text-white">
                No courses available yet
              </p>
              <p className="text-[11px] text-stone-500 dark:text-stone-400">
                Courses for this language are being prepared.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. EARNED CERTIFICATE (ONLY WHEN LEGITIMATE)                              */}
      {/* ========================================================================= */}
      {certificateReady && (
        <div className="p-4 bg-white dark:bg-[#11222D] rounded-3xl border border-amber-200/80 dark:border-amber-500/30 shadow-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/70 text-amber-600 dark:text-amber-300 border border-amber-200 dark:border-amber-600/30 flex items-center justify-center shrink-0">
              <Award className="w-5 h-5" />
            </span>
            <div className="min-w-0">
              <span className="text-[9px] font-mono font-black uppercase tracking-wider text-amber-700 dark:text-amber-300">
                {certificate?.code ? 'Verified Certificate' : 'Certificate Ready'}
              </span>
              <p className="font-display font-black text-xs text-stone-900 dark:text-white truncate">
                {certificate?.completedChallenges || 0} / {certificate?.totalChallenges || 0} challenges verified
              </p>
            </div>
          </div>

          {onOpenCertificateModal && (
            <button
              onClick={() => {
                sounds.playTap();
                onOpenCertificateModal();
              }}
              className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-white font-bold text-[11px] shrink-0 cursor-pointer active:scale-95 transition-all"
            >
              {certificate?.code ? 'View' : 'Claim'}
            </button>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. FIND A PERSONAL TUTOR (HUMAN TUTOR HUB)                                */}
      {/* ========================================================================= */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between text-xs px-1">
          <div>
            <span className="font-display font-black uppercase tracking-wider text-stone-500 dark:text-stone-400 text-[11px]">
              Find a Tutor
            </span>
            <span className="text-[10px] text-stone-400 block font-medium">
              Practice with a real language tutor and improve your confidence.
            </span>
          </div>

          <button
            onClick={() => {
              sounds.playTap();
              setTutorFilter('all');
              setShowTutorDirectory(true);
            }}
            className="text-[11px] font-bold text-teal-700 dark:text-teal-300 hover:underline flex items-center gap-0.5 cursor-pointer shrink-0"
          >
            <span>View All Tutors →</span>
          </button>
        </div>

        {/* 2-Column Choice: Bisaya Tutor vs Filipino Tutor */}
        <div className="grid grid-cols-2 gap-2.5">
          {/* Bisaya Tutor Card */}
          <div
            onClick={() => {
              sounds.playTap();
              setTutorFilter('cebuano');
              setShowTutorDirectory(true);
            }}
            className="p-3.5 bg-gradient-to-br from-blue-50/90 to-white dark:from-[#132735] dark:to-[#11222D] hover:from-blue-100/80 dark:hover:from-[#173244] rounded-2xl border border-blue-200/80 dark:border-blue-500/30 shadow-2xs transition-all cursor-pointer group flex flex-col justify-between min-h-[136px]"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xl">🟦</span>
                <span className="px-1.5 py-0.5 rounded-md bg-blue-100 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300 text-[9px] font-mono font-bold">
                  Vetted
                </span>
              </div>
              <h4 className="font-display font-black text-xs sm:text-sm text-stone-900 dark:text-white mt-1.5 group-hover:text-blue-600 transition-colors">
                Bisaya Tutor
              </h4>
              <p className="text-[10px] text-stone-500 dark:text-stone-400 font-medium leading-tight mt-0.5">
                Cebuano conversation, pronunciation, grammar
              </p>
            </div>

            <div className="pt-2 flex items-center justify-between text-[11px] font-bold text-blue-700 dark:text-blue-300">
              <span>Find Bisaya Tutor</span>
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </div>
          </div>

          {/* Filipino Tutor Card */}
          <div
            onClick={() => {
              sounds.playTap();
              setTutorFilter('filipino');
              setShowTutorDirectory(true);
            }}
            className="p-3.5 bg-gradient-to-br from-amber-50/90 to-white dark:from-[#2a2415] dark:to-[#11222D] hover:from-amber-100/80 dark:hover:from-[#352c17] rounded-2xl border border-amber-200/80 dark:border-amber-500/30 shadow-2xs transition-all cursor-pointer group flex flex-col justify-between min-h-[136px]"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xl">🟨</span>
                <span className="px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-700 dark:bg-amber-950/70 dark:text-amber-300 text-[9px] font-mono font-bold">
                  Vetted
                </span>
              </div>
              <h4 className="font-display font-black text-xs sm:text-sm text-stone-900 dark:text-white mt-1.5 group-hover:text-amber-600 transition-colors">
                Filipino Tutor
              </h4>
              <p className="text-[10px] text-stone-500 dark:text-stone-400 font-medium leading-tight mt-0.5">
                Tagalog conversation, pronunciation, grammar
              </p>
            </div>

            <div className="pt-2 flex items-center justify-between text-[11px] font-bold text-amber-700 dark:text-amber-300">
              <span>Find Filipino Tutor</span>
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </div>
          </div>
        </div>

        {/* Featured Tutor Spotlight */}
        {activeTutorsList.slice(0, 1).map((topTutor) => (
          <div
            key={topTutor.id}
            className="p-3 bg-white dark:bg-[#11222D] rounded-2xl border border-stone-200/90 dark:border-white/10 shadow-2xs space-y-2.5"
          >
            <div className="flex items-start justify-between gap-2.5">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-blue-600 text-white font-black font-display text-xs flex items-center justify-center shrink-0">
                  {topTutor.avatarInitials}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1">
                    <h5 className="font-display font-bold text-xs text-stone-900 dark:text-white truncate">
                      {topTutor.name}
                    </h5>
                    <span title="SultiAI Academic Vetted">
                      <ShieldCheck className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                    </span>
                  </div>
                  <p className="text-[10px] text-stone-500 dark:text-stone-400 truncate">
                    {topTutor.title} · ₱{topTutor.hourlyRatePhp}/hr
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  sounds.playTap();
                  setTutorFilter(topTutor.language === 'both' ? 'all' : topTutor.language);
                  setShowTutorDirectory(true);
                }}
                className="px-2.5 py-1.5 rounded-xl bg-stone-900 dark:bg-white text-white dark:text-stone-900 font-bold text-[10px] flex items-center gap-1 transition-all shrink-0 shadow-2xs cursor-pointer"
              >
                <span>Book Tutor →</span>
              </button>
            </div>
          </div>
        ))}

        {/* Discreet Academic Contact / Collaboration Note */}
        <div className="pt-1 px-1 flex items-center justify-between gap-2 text-[10.5px] text-stone-600 dark:text-stone-300">
          <span>Interested in teaching or academic partnership?</span>
          <a
            href="mailto:genesis.diaz@jmc.edu.ph?subject=SultiAI%20Tutor%20%26%20Academic%20Inquiry"
            className="text-teal-700 dark:text-teal-300 hover:underline font-bold shrink-0"
          >
            Contact Developer →
          </a>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TUTOR DIRECTORY & APPLICATION MODALS                                      */}
      {/* ========================================================================= */}
      <TutorDirectoryModal
        isOpen={showTutorDirectory}
        onClose={() => setShowTutorDirectory(false)}
        initialFilter={tutorFilter}
      />

      <ApplyTutorModal
        isOpen={showApplyTutorModal}
        onClose={() => setShowApplyTutorModal(false)}
        onSuccess={() => {
          setActiveTutorsList(getApprovedTutors());
          setShowApplyTutorModal(false);
          setShowTutorDirectory(true);
        }}
      />
    </div>
  );
};
