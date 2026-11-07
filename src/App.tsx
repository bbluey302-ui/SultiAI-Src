import React, { useState, useEffect, useRef } from 'react';
import { NavTab, Navigation } from './components/Navigation';
import { TopHeader } from './components/TopHeader';
import { HomeScreen } from './components/HomeScreen';
import { LearnScreen } from './components/LearnScreen';
import { SultiScreen } from './components/SultiScreen';
import { CommunityScreen } from './components/CommunityScreen';
import { ProfileScreen } from './components/ProfileScreen';
import { LessonPlayer } from './components/LessonPlayer';
import { CapstoneAuditModal } from './components/CapstoneAuditModal';
import { DialectModal } from './components/DialectModal';
import { 
  UserProfile, Lesson, TargetDialect, Module, DayActivity,
  LearnerProgressSnapshot, LearnerCertificateState, LessonCompletionResult,
} from './types';
import { INITIAL_MODULES } from './data/curriculumData';
import {
  LearnerActivityMonth,
  LearnerActivitySummary,
  buildCurrentMonth,
  buildCurrentWeek,
  fetchActivitySummary,
  getLocalDateString,
  logLearnerActivity,
  toDayActivity,
} from './services/activityService';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, AuthSession } from './context/AuthContext';
import { LoginScreen } from './components/LoginScreen';
import { addNotification } from './utils/notificationService';
import { supabase } from './services/supabaseClient';
import { authHeaders } from './services/tokenService';
import {
  claimLearnerCertificate,
  completeLearnerLesson,
  fetchLearnerProgress,
} from './services/learnerProgressService';
import { AUTH_CALLBACK_PATH } from './services/authRedirect';
import { AdminAuthProvider } from '../admin/components/AdminAuthContext';
import { AdminDashboard } from '../admin/components/AdminDashboard';

/**
 * A brand-new learner profile. Used for the initial state and whenever a
 * different Supabase user signs in, so progress is never inherited from a
 * mock/demo account or from another user on the same device.
 */
const createFreshProfile = (identity?: {
  id?: string;
  name?: string;
  email?: string;
  avatar?: string;
  provider?: 'google' | 'email';
}): UserProfile => ({
  id: identity?.id || '',
  name: identity?.name || 'Learner',
  email: identity?.email || '',
  avatar: identity?.avatar || '',
  targetDialect: 'davao_bisaya' as TargetDialect,
  dailyGoalMinutes: 15,
  todayMinutes: 0,
  xp: 0,
  xpByLanguage: { cebuano: 0, filipino: 0, english: 0 },
  gems: 0,
  hearts: 5,
  maxHearts: 5,
  streakDays: 0,
  streakFreezesAvailable: 1,
  weeklyActivity: buildCurrentWeek(15),
  level: 'Level 1: Bisaya Beginner',
  completedLessons: [],
  vocabularyMastered: 0,
  speechScoreAverage: 0,
  joinedDate: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
  authProvider: identity?.provider || 'email',
});

/** Mock identities from older builds that must never be resurrected. */
const isMockProfileId = (id?: string) =>
  !id || /^usr_(genesis|guest_|google_)/.test(id) || id.startsWith('usr__');

/** A cached week is only usable while it still contains the real current day. */
const isWeekCurrent = (week?: DayActivity[]) =>
  Array.isArray(week) &&
  week.length === 7 &&
  week.some((day) => day.isToday && day.id === `day_${getLocalDateString().replace(/-/g, '')}`);

/** Add practice to today's cached week entry (optimistic, before server sync). */
const bumpDailyActivity = (
  prev: UserProfile,
  add: { minutes?: number; xp?: number; lessons?: number },
): Pick<UserProfile, 'todayMinutes' | 'streakDays' | 'weeklyActivity'> => {
  const minutes = Math.max(0, Math.round(add.minutes || 0));
  const xp = Math.max(0, Math.round(add.xp || 0));
  const lessons = Math.max(0, Math.round(add.lessons || 0));
  const goal = prev.dailyGoalMinutes;
  const baseWeek = isWeekCurrent(prev.weeklyActivity)
    ? prev.weeklyActivity!
    : buildCurrentWeek(goal);
  const wasTodayMet = Boolean(baseWeek.find((day) => day.isToday)?.goalMet);

  const week = baseWeek.map((day) => {
    if (!day.isToday) return day;
    const nextMinutes = day.minutes + minutes;
    return {
      ...day,
      minutes: nextMinutes,
      xpEarned: day.xpEarned + xp,
      lessonsCompleted: day.lessonsCompleted + lessons,
      goalMinutes: goal,
      goalMet: nextMinutes > 0 && nextMinutes >= goal,
    };
  });

  const today = week.find((day) => day.isToday);
  const todayMet = Boolean(today?.goalMet);

  return {
    todayMinutes: today?.minutes ?? prev.todayMinutes + minutes,
    // A newly completed day extends the streak; the server response reconciles
    // the exact value (including longer, multi-week streaks).
    streakDays: todayMet && !wasTodayMet ? prev.streakDays + 1 : prev.streakDays,
    weeklyActivity: week,
  };
};

export default function App() {
  const [currentTab, setCurrentTab] = useState<NavTab>('home');
  const [modules, setModules] = useState<Module[]>(INITIAL_MODULES);
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [showDialectModal, setShowDialectModal] = useState(false);
  const [sultiPrefillPrompt, setSultiPrefillPrompt] = useState<string | undefined>();
  const [showAdminConsole, setShowAdminConsole] = useState(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.has('admin') || window.location.pathname.startsWith('/admin');
    }
    return false;
  });

  // Real Supabase auth state (restored from JWT on boot)
  const [authSession, setAuthSession] = useState<AuthSession | null>(null);
  const [authReady, setAuthReady] = useState(false);

  // Persistent User Profile State
  const [profile, setProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('sultiai_user_profile');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Never hydrate a mock/demo account from an older build.
        if (!isMockProfileId(parsed?.id) && parsed?.email) {
          // A stale cached week (e.g. the old hard-coded September demo dates)
          // must be replaced with the real current week.
          if (!isWeekCurrent(parsed.weeklyActivity)) {
            parsed.weeklyActivity = buildCurrentWeek(parsed.dailyGoalMinutes || 15);
            parsed.todayMinutes = 0;
            parsed.streakDays = 0;
          }
          return parsed;
        }
      } catch {
        // ignore
      }
    }
    localStorage.removeItem('sultiai_user_profile');
    return createFreshProfile();
  });

  // Real practice calendar synced from Supabase (week, month, streak)
  const [activitySummary, setActivitySummary] = useState<LearnerActivitySummary | null>(null);
  // Server-owned graded progress: completed lessons, XP, badges, certificates.
  const [learnerProgress, setLearnerProgress] = useState<LearnerProgressSnapshot | null>(null);
  const [learnerProgressError, setLearnerProgressError] = useState<string | null>(null);
  // Guards against a slow initial load overwriting a newer practice increment
  // (and against out-of-order mutation responses).
  const activityMutationSeq = useRef(0);
  const progressMutationSeq = useRef(0);
  const completionInFlight = useRef(0);

  useEffect(() => {
    localStorage.setItem('sultiai_user_profile', JSON.stringify(profile));
  }, [profile]);

  const applyActivitySummary = (summary: LearnerActivitySummary) => {
    setActivitySummary(summary);
    setProfile((prev) => ({
      ...prev,
      todayMinutes: summary.todayMinutes,
      streakDays: summary.streakDays,
      weeklyActivity: summary.days.map(toDayActivity),
    }));
  };

  const applyLearnerProgress = (snapshot: LearnerProgressSnapshot) => {
    setLearnerProgress(snapshot);
    setProfile((prev) => ({
      ...prev,
      xp: snapshot.xp,
      xpByLanguage: snapshot.xpByLanguage,
      completedLessons: snapshot.completedLessons,
      streakDays: snapshot.streakDays,
    }));
  };

  // Hydrate the authoritative graded snapshot for the signed-in learner. The
  // local profile is a cache only; it is replaced with the server response.
  useEffect(() => {
    if (!authSession?.user?.id) {
      setLearnerProgress(null);
      setLearnerProgressError(null);
      return;
    }

    let cancelled = false;
    const load = async () => {
      // A completion is authoritative and will return a fresh snapshot. Do not
      // let a concurrent GET overwrite it with pre-completion data.
      if (completionInFlight.current > 0) return;
      const seq = progressMutationSeq.current;
      try {
        const snapshot = await fetchLearnerProgress();
        if (!cancelled && seq === progressMutationSeq.current) {
          applyLearnerProgress(snapshot);
          setLearnerProgressError(null);
        }
      } catch (error: any) {
        if (!cancelled) {
          setLearnerProgressError(error?.message || 'Could not load learner progress');
        }
      }
    };

    void load();
    const onFocus = () => void load();
    window.addEventListener('focus', onFocus);
    return () => {
      cancelled = true;
      window.removeEventListener('focus', onFocus);
    };
  }, [authSession?.token, authSession?.user?.id]);

  // Load the real streak/calendar whenever the signed-in learner changes, the
  // daily goal changes, the tab regains focus, or the local day rolls over.
  useEffect(() => {
    if (!authSession?.user?.id) return;
    let cancelled = false;

    const load = async () => {
      const seqAtStart = activityMutationSeq.current;
      try {
        const summary = await fetchActivitySummary(profile.dailyGoalMinutes);
        if (!cancelled && seqAtStart === activityMutationSeq.current) applyActivitySummary(summary);
      } catch {
        // Offline/backend unavailable: keep the real local week fallback.
      }
    };

    void load();

    const onFocus = () => void load();
    const onVisibility = () => {
      if (document.visibilityState === 'visible') void load();
    };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);

    // Refresh exactly when the learner's local date changes (midnight PHT).
    let lastDate = getLocalDateString();
    const timer = window.setInterval(() => {
      const now = getLocalDateString();
      if (now !== lastDate) {
        lastDate = now;
        void load();
      }
    }, 60_000);

    return () => {
      cancelled = true;
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
      window.clearInterval(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authSession?.token, authSession?.user?.id, profile.dailyGoalMinutes]);

  /**
   * Persist daily practice to Supabase, then reconcile the optimistic local
   * update with the server-computed streak/week/month.
   */
  const recordActivity = (add: { minutes?: number; xp?: number; lessons?: number }) => {
    // XP and lesson counts from practice are not authoritative. Only the
    // server-side lesson completion path may award them.
    const optimisticMinutes = Math.max(0, Math.round(add.minutes || 0));
    setProfile((prev) => ({
      ...prev,
      ...bumpDailyActivity(prev, { minutes: optimisticMinutes }),
    }));
    if (!authSession?.user?.id) return;

    const seq = ++activityMutationSeq.current;
    void logLearnerActivity({ minutes: optimisticMinutes, goalMinutes: profile.dailyGoalMinutes })
      .then((summary) => {
        if (seq === activityMutationSeq.current) applyActivitySummary(summary);
      })
      .catch(() => {
        // Keep the optimistic minutes; the next focus/refresh will reconcile.
      });
  };

  const monthActivity: LearnerActivityMonth =
    activitySummary?.month || buildCurrentMonth(profile.dailyGoalMinutes);

  // Sync learner progress to Supabase through the LEARNER backend on every
  // change. The separate ADMIN backend reads this same row (and the console
  // live-subscribes via Supabase Realtime), so the admin reflects real activity.
  useEffect(() => {
    if (!profile.id || !authSession) return;
    const timer = setTimeout(async () => {
      const headers = await authHeaders();
      if (!headers.Authorization) return;

      await fetch('/api/learner/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        // Stage 1: only safe profile preferences are sent. The verified token
        // owns the row id/email; XP, hearts, streak and badges are server-owned.
        body: JSON.stringify({
          name: profile.name,
          targetDialect: profile.targetDialect,
          dailyGoalMinutes: profile.dailyGoalMinutes,
        }),
      }).catch(() => {
        // Learner backend offline or Supabase unconfigured — ignore.
      });
    }, 800);
    return () => clearTimeout(timer);
  }, [profile, authSession]);

  // Find the next recommended incomplete lesson
  const allLessons = modules.flatMap((m) => m.lessons || []);
  const nextLesson = allLessons.find((l) => !profile.completedLessons.includes(l.id)) || allLessons[0] || INITIAL_MODULES[0].lessons[0];

  // Handle lesson start
  const handleStartLesson = (lesson: Lesson) => {
    setActiveLesson(lesson);
  };

  // Handle lesson completion. The server owns the completion row, XP award,
  // badge unlocks and certificate eligibility.
  const handleCompleteLesson = async (
    lessonId: string,
    score?: number | null,
  ): Promise<LessonCompletionResult> => {
    const normalizedScore = typeof score === 'number' && Number.isFinite(score)
      ? Math.max(0, Math.min(100, Math.round(score)))
      : null;

    const seq = ++progressMutationSeq.current;
    completionInFlight.current += 1;
    let result: LessonCompletionResult;
    try {
      result = await completeLearnerLesson({
        lessonId,
        score: normalizedScore,
      });
    } finally {
      completionInFlight.current = Math.max(0, completionInFlight.current - 1);
    }

    if (seq === progressMutationSeq.current) {
      applyLearnerProgress(result.progress);
    }

    if (!result.alreadyCompleted) {
      setProfile((prev) => ({
        ...prev,
        gems: (prev.gems || 240) + 15,
      }));

      addNotification({
        category: 'achievement',
        title: result.xpAwarded > 0
          ? `Leksyon Nalampos! +${result.xpAwarded} XP`
          : 'Leksyon Nalampos!',
        titleBisaya: 'Maayo Kaayong Pag-uswag!',
        message: result.score === null
          ? 'Your lesson was saved to your verified progress. Practice XP is not awarded without a scored response.'
          : `Your lesson was saved with ${result.score}% accuracy. Badge progress is now updated.`,
        actionLabel: 'Tan-awa ang Profile',
        actionType: 'profile',
        iconType: 'trophy',
      });
    }

    // The server recorded the 5 practice minutes and lesson count. Refresh the
    // calendar so the weekly card reflects that server row.
    try {
      const summary = await fetchActivitySummary(profile.dailyGoalMinutes);
      applyActivitySummary(summary);
    } catch {
      // The progress snapshot is still saved; the next focus refresh will catch up.
    }

    return result;
  };

  const handleClaimCertificate = async (
    language: LearnerCertificateState['language'],
  ): Promise<LearnerCertificateState> => {
    const seq = ++progressMutationSeq.current;
    completionInFlight.current += 1;
    let certificate: LearnerCertificateState;
    try {
      certificate = await claimLearnerCertificate(language);
    } finally {
      completionInFlight.current = Math.max(0, completionInFlight.current - 1);
    }

    if (seq === progressMutationSeq.current) {
      setLearnerProgress((prev) => (prev ? { ...prev, certificate } : prev));
    }
    return certificate;
  };

  // Refill Hearts
  const handleRefillHearts = () => {
    addNotification({
      category: 'achievement',
      title: '💖 Hearts Refilled to Full',
      titleBisaya: 'Puno na Usab ang Kinabuhi (5/5)',
      message: 'You have maximum hearts ready for conversational roleplays and voice drills.',
      iconType: 'sparkles',
    });
    setProfile((prev) => ({
      ...prev,
      hearts: 5,
    }));
  };

  // Award Voice Practice & Gamification Rewards
  const handleAwardVoiceReward = (_earnedXp: number, earnedGems: number = 10, speechScore: number = 90) => {
    // Voice conversation is practice. It records minutes, but it cannot mint
    // authoritative XP or lesson completions.
    setProfile((prev) => ({
      ...prev,
      gems: (prev.gems || 240) + earnedGems,
      speechScoreAverage: Math.round((prev.speechScoreAverage * 4 + speechScore) / 5),
    }));

    recordActivity({ minutes: 2, xp: 0 });
  };

  // Use Streak Freeze
  const handleUseStreakFreeze = () => {
    addNotification({
      category: 'achievement',
      title: '🧊 Streak Freeze Activated',
      titleBisaya: 'Gipanalipdan ang Imong Daily Streak',
      message: 'Your 7-day practice streak is protected from reset today.',
      iconType: 'flame',
    });
    setProfile((prev) => ({
      ...prev,
      streakFreezesAvailable: Math.max(0, (prev.streakFreezesAvailable ?? 1) - 1),
    }));
  };

  // Handle SULTI conversation activity. Conversation is practice only.
  const handleSultiActivity = () => {
    recordActivity({ minutes: 2, xp: 0 });
  };

  // Add practice minutes from drills or quick actions
  const handleAddPracticeMinutes = (addedMinutes: number) => {
    const minutes = Math.max(0, addedMinutes);
    recordActivity({ minutes, xp: 0 });
  };

  // Update Dialect
  const handleUpdateDialect = (newDialect: TargetDialect) => {
    addNotification({
      category: 'admin',
      title: `🌐 Target Dialect Set: ${newDialect === 'davao_bisaya' ? 'Davao Bisaya' : 'Standard Cebuano'}`,
      titleBisaya: 'Giusab ang Imong Dialect',
      message: 'Pronunciation drills, speech recognition tolerances, and cultural phrases adapted to your dialect.',
      iconType: 'sliders',
      actionLabel: 'Browse Lessons',
      actionType: 'learn',
    });
    setProfile((prev) => ({
      ...prev,
      targetDialect: newDialect,
    }));
  };

  // Update Daily Goal
  const handleUpdateDailyGoal = (mins: number) => {
    setProfile((prev) => ({
      ...prev,
      dailyGoalMinutes: mins,
      weeklyActivity: (prev.weeklyActivity || buildCurrentWeek(mins)).map((day) =>
        day.isToday
          ? {
              ...day,
              goalMinutes: mins,
              goalMet: day.minutes > 0 && day.minutes >= mins,
            }
          : day,
      ),
    }));
  };

  // Update Profile attributes (name, avatar, goal, dialect, etc.)
  const handleUpdateProfile = (updates: Partial<UserProfile>) => {
    setProfile((prev) => ({
      ...prev,
      ...updates,
    }));
  };

  // Sign out and clear private session caches safely
  const handleLogout = async () => {
    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.warn('Supabase logout warning:', err);
      }
    }

    localStorage.removeItem('sultiai_user_profile');
    localStorage.removeItem('sultiai_ai_conversations');
    localStorage.removeItem('sultiai_ai_messages_map');
    localStorage.removeItem('sultiai_ai_voice_sessions');

    // No guest/demo fallback: signed out means signed out.
    setProfile(createFreshProfile());
    setAuthSession(null);
    setActivitySummary(null);
    setLearnerProgress(null);
    setLearnerProgressError(null);
    activityMutationSeq.current += 1;
    progressMutationSeq.current += 1;

    addNotification({
      category: 'system',
      title: '👋 Logged Out Safely',
      titleBisaya: 'Naka-logout na Ka',
      message: 'Private session and cached transcripts cleared safely.',
      iconType: 'shield',
    });
  };

  return (
    <ThemeProvider>
      <AuthProvider
        onSessionChange={(session) => {
          setAuthSession(session);
          setAuthReady(true);
          if (session?.user) {
            if (profile.id && profile.id !== session.user.id) {
              setLearnerProgress(null);
              setLearnerProgressError(null);
              progressMutationSeq.current += 1;
            }
            setProfile((prev) => {
              // Same real user: keep their synced progress, refresh identity.
              if (prev.id === session.user.id) {
                const next = {
                  ...prev,
                  name: session.user.name || prev.name,
                  email: session.user.email || prev.email,
                  // Prefer the fresh OAuth photo when the saved avatar is a
                  // Google-hosted image (it changes when the user changes their
                  // Google picture). Keep photos uploaded on this device.
                  avatar: (() => {
                    const fresh = session.user.avatarUrl || '';
                    const saved = prev.avatar || '';
                    const savedIsGoogle = saved.includes('googleusercontent.com');
                    if (!saved || savedIsGoogle) return fresh || saved;
                    return saved;
                  })(),
                  authProvider: session.user.provider,
                };
                // Avoid a fresh object (and a re-render) when nothing changed.
                const unchanged =
                  next.name === prev.name &&
                  next.email === prev.email &&
                  next.avatar === prev.avatar &&
                  next.authProvider === prev.authProvider;
                return unchanged ? prev : next;
              }
              // New user on this device: start clean (never inherit mock data).
              return createFreshProfile({
                id: session.user.id,
                name: session.user.name,
                email: session.user.email,
                avatar: session.user.avatarUrl,
                provider: session.user.provider,
              });
            });
          }
        }}
      >
        {showAdminConsole ? (
          <AdminAuthProvider>
            <AdminDashboard
              onSwitchToMobileApp={() => setShowAdminConsole(false)}
            />
          </AdminAuthProvider>
        ) : !authReady ? (
          /* Restoring the real Supabase session (JWT) before deciding */
          <div className="min-h-screen bg-[#0A121D] text-white flex flex-col items-center justify-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-400 to-violet-500 flex items-center justify-center animate-pulse">
              <span className="text-lg">🦉</span>
            </div>
            <p className="text-xs font-mono font-bold tracking-wider text-stone-400 uppercase">
              {window.location.pathname === AUTH_CALLBACK_PATH
                ? 'Completing sign-in…'
                : 'Restoring secure session…'}
            </p>
          </div>
        ) : !authSession ? (
          <LoginScreen />
        ) : (
          <div className="min-h-screen bg-app text-ink flex flex-col justify-between selection:bg-teal-500 selection:text-white transition-colors duration-200">
            {/* Top Mobile App Bar */}
            <TopHeader
              streak={profile.streakDays}
              xp={profile.xp}
              gems={profile.gems}
              hearts={profile.hearts}
              dialect={profile.targetDialect}
              onOpenDialectModal={() => setShowDialectModal(true)}
              onOpenAuditModal={() => setShowAuditModal(true)}
              onOpenAdminConsole={() => setShowAdminConsole(true)}
              onRefillHearts={handleRefillHearts}
              userName={profile.name}
              userAvatar={profile.avatar}
              showHeroGreeting={currentTab === 'home'}
              onNavigateAction={(actionType) => {
                if (actionType === 'learn') setCurrentTab('learn');
                else if (actionType === 'profile') setCurrentTab('profile');
              }}
              onOpenLogin={() => {
                // Avatar tap goes to the profile (switch/sign-out lives there)
                setCurrentTab('profile');
              }}
              isLoggedIn={Boolean(authSession)}
            />

            {/* Main Viewport Content */}
            <main className="flex-1 w-full max-w-md mx-auto">
              {currentTab === 'home' && (
                <HomeScreen
                  profile={profile}
                  weeklyActivity={profile.weeklyActivity || buildCurrentWeek(profile.dailyGoalMinutes)}
                  monthActivity={monthActivity}
                  nextLesson={nextLesson}
                  onStartLesson={handleStartLesson}
                  onOpenSulti={(prompt?: string) => {
                    setSultiPrefillPrompt(prompt);
                    setCurrentTab('sulti');
                  }}
                  onGoToLearn={() => setCurrentTab('learn')}
                  onGoToProfile={() => setCurrentTab('profile')}
                  onUseStreakFreeze={handleUseStreakFreeze}
                  onOpenDialectModal={() => setShowDialectModal(true)}
                  onAwardReward={handleAwardVoiceReward}
                />
              )}

              {currentTab === 'learn' && (
                <LearnScreen
                  modules={modules}
                  completedLessons={profile.completedLessons}
                  onStartLesson={handleStartLesson}
                  profile={profile}
                  onAddPracticeMinutes={handleAddPracticeMinutes}
                  onOpenSulti={(prompt?: string) => {
                    setSultiPrefillPrompt(prompt);
                    setCurrentTab('sulti');
                  }}
                  onGoToProfile={() => setCurrentTab('profile')}
                  badgeStates={learnerProgress?.badges || []}
                  certificate={learnerProgress?.certificate || null}
                  onClaimCertificate={handleClaimCertificate}
                />
              )}

              {currentTab === 'sulti' && (
                <SultiScreen
                  userId={profile.id}
                  authToken={authSession.token}
                  userName={profile.name}
                  targetDialect={profile.targetDialect}
                  onActivityPerformed={handleSultiActivity}
                  initialPrompt={sultiPrefillPrompt}
                />
              )}

              {currentTab === 'community' && (
                <CommunityScreen userName={profile.name} userAvatar={profile.avatar} />
              )}

              {currentTab === 'profile' && (
                <ProfileScreen
                  profile={profile}
                  monthActivity={monthActivity}
                  onUpdateDialect={handleUpdateDialect}
                  onUpdateDailyGoal={handleUpdateDailyGoal}
                  onOpenAuditModal={() => setShowAuditModal(true)}
                  onUpdateProfile={handleUpdateProfile}
                  onNavigateToLearn={() => setCurrentTab('learn')}
                  onOpenSultiChat={(prompt) => {
                    setSultiPrefillPrompt(prompt);
                    setCurrentTab('sulti');
                  }}
                  onLogout={handleLogout}
                  onOpenLogin={handleLogout}
                  badgeStates={learnerProgress?.badges || []}
                />
              )}
            </main>

            {/* Fixed Bottom Tab Navigation */}
            <Navigation
              currentTab={currentTab}
              onTabChange={(tab) => setCurrentTab(tab)}
            />

            {/* Interactive Lesson Player Modal */}
            {activeLesson && (
              <LessonPlayer
                lesson={activeLesson}
                onClose={() => setActiveLesson(null)}
                onComplete={handleCompleteLesson}
              />
            )}

            {/* Capstone Project Blueprint & Audit Modal */}
            {showAuditModal && (
              <CapstoneAuditModal onClose={() => setShowAuditModal(false)} />
            )}

            {/* Regional Dialect Selector Modal */}
            {showDialectModal && (
              <DialectModal
                currentDialect={profile.targetDialect}
                onSelect={handleUpdateDialect}
                onClose={() => setShowDialectModal(false)}
              />
            )}
          </div>
        )}
      </AuthProvider>
    </ThemeProvider>
  );
}
