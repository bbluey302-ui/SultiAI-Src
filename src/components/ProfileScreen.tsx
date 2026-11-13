import React, { useState } from 'react';
import { 
  User, Award, Flame, BookOpen, Mic, CheckCircle2, Shield, 
  Settings, ChevronRight, BarChart2, Gem, Heart, 
  Trophy, Sparkles, Database, Check, Copy, Volume2, ShieldCheck, 
  Activity, ArrowUpRight, Sun, Moon, Monitor, Edit3, Camera,
  Sliders, Bell, Lock, HelpCircle, LogOut, ArrowRight, Compass,
  Laptop, Download, MessageSquare, Zap, RefreshCw, KeyRound,
  Trash2, AlertTriangle, ExternalLink, Upload
} from 'lucide-react';
import { UserProfile, TargetDialect, MajorLanguageId, LearnerBadgeState } from '../types';
import { buildCurrentWeek, LearnerActivityMonth } from '../services/activityService';
import { sounds } from '../utils/soundEffects';
import { StreakCalendar } from './StreakCalendar';
import { useTheme } from '../context/ThemeContext';
import { VOICE_LEVELS, getStoredVoiceProgress } from '../data/voiceGamificationData';
import { ALL_LANGUAGE_PATHS } from '../data/languageJourneyData';
import { TOOLKIT_MODULES } from '../data/toolkitModulesData';
import { authHeaders } from '../services/tokenService';
import { getToolkitProgress } from '../utils/toolkitProgress';
import { ProfileActiveModal, SULTI_AVATARS } from './profile/types';
import { EditProfileModal } from './profile/EditProfileModal';
import { AvatarSelectionModal } from './profile/AvatarSelectionModal';
import { LearningPreferencesModal } from './profile/LearningPreferencesModal';
import { LearningProgressModal } from './profile/LearningProgressModal';
import { AiActivityModal } from './profile/AiActivityModal';
import { NotificationSettingsModal } from './profile/NotificationSettingsModal';
import { AccountSecurityModal } from './profile/AccountSecurityModal';
import { PrivacyDataModal } from './profile/PrivacyDataModal';
import { SubscriptionUsageModal } from './profile/SubscriptionUsageModal';
import { HelpSupportModal } from './profile/HelpSupportModal';
import { LogoutConfirmModal } from './profile/LogoutConfirmModal';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';
import { sendPasswordResetEmail } from '../services/authRedirect';
import { addNotification } from '../utils/notificationService';

interface ProfileScreenProps {
  profile: UserProfile;
  monthActivity?: LearnerActivityMonth;
  onUpdateDialect: (dialect: TargetDialect) => void;
  onUpdateDailyGoal: (minutes: number) => void;
  onOpenAuditModal?: () => void;
  onUpdateProfile?: (updates: Partial<UserProfile>) => void;
  onNavigateToLearn?: () => void;
  onOpenSultiChat?: (prompt?: string) => void;
  onLogout?: () => void;
  onOpenLogin?: () => void;
  badgeStates?: LearnerBadgeState[];
}

export type ProfileTab = 'overview' | 'account' | 'progress' | 'preferences' | 'security';

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  profile,
  monthActivity,
  onUpdateDialect,
  onUpdateDailyGoal,
  onUpdateProfile,
  onNavigateToLearn,
  onOpenSultiChat,
  onLogout,
  onOpenLogin,
  badgeStates = [],
}) => {
  const { themeMode, setThemeMode } = useTheme();
  const [activeModal, setActiveModal] = useState<ProfileActiveModal>(null);
  const [activeTab, setActiveTab] = useState<ProfileTab>('overview');
  const [voiceProgress] = useState(getStoredVoiceProgress);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncedTime, setLastSyncedTime] = useState<string>('Just now');
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  // Selected language state
  const [selectedLanguage, setSelectedLanguage] = useState<MajorLanguageId>(() => {
    return (localStorage.getItem('sultiai_selected_language') as MajorLanguageId) || 'cebuano';
  });

  // Password reset state in security tab
  const [pwdResetSent, setPwdResetSent] = useState(false);
  const [pwdResetLoading, setPwdResetLoading] = useState(false);
  const [pwdResetError, setPwdResetError] = useState<string | null>(null);

  // Total badges unlocked calculation
  const totalBadgesUnlocked = badgeStates.filter((b) => Boolean(b.earnedAt)).length;
  const completedSet = new Set(profile.completedLessons);
  const toolkitProgress = getToolkitProgress(profile.completedLessons);
  const cebuanoChallenges = ALL_LANGUAGE_PATHS.cebuano.levels.flatMap((level) => level.challenges);
  const completedCebuano = cebuanoChallenges.filter((challenge) => completedSet.has(challenge.id)).length;
  const coreProgress = cebuanoChallenges.length > 0
    ? Math.min(100, Math.round((completedCebuano / cebuanoChallenges.length) * 100))
    : 0;

  const currentLanguageLabel = (() => {
    if (selectedLanguage === 'filipino') return 'Filipino (Tagalog)';
    if (selectedLanguage === 'english') return 'English (Professional)';
    return 'Cebuano / Bisaya';
  })();

  const currentDialectLabel = (() => {
    if (profile.targetDialect === 'davao_bisaya') return 'Davao Bisaya';
    if (profile.targetDialect === 'cebuano_standard') return 'Standard Cebuano';
    return 'Boholano (Bol-anon)';
  })();

  // Trigger real Supabase Cloud Sync
  const handleCloudSync = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    sounds.playTap();

    try {
      // 1. Sync only safe profile preferences through the authenticated learner
      // backend. XP, hearts, streaks and badges are server-owned.
      const headers = await authHeaders();
      const res = await fetch('/api/learner/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({
          name: profile.name,
          targetDialect: profile.targetDialect,
          dailyGoalMinutes: profile.dailyGoalMinutes,
        }),
      });
      if (!res.ok) {
        throw new Error(`Sync failed with HTTP ${res.status}`);
      }

      // 2. Also sync to profiles table directly if Supabase client is active
      if (supabase && profile.id) {
        try {
          await supabase.from('profiles').upsert([
            {
              id: profile.id,
              full_name: profile.name,
              avatar_url: profile.avatar,
              target_dialect: profile.targetDialect,
              daily_goal_minutes: profile.dailyGoalMinutes,
              updated_at: new Date().toISOString(),
            },
          ]);
        } catch {
          // ignore client direct table warning
        }
      }

      setLastSyncedTime('Just now');
      setSyncFeedback('Synced with Cloud ✓');
      sounds.playCorrect();

      addNotification({
        category: 'system',
        title: '☁️ Cloud Sync Completed',
        titleBisaya: 'Na-synchronize sa Supabase',
        message: 'Your profile preferences are synced. XP, badges and certificates are saved by the server-owned lesson API.',
        iconType: 'sparkles',
      });

      setTimeout(() => setSyncFeedback(null), 3000);
    } catch (err) {
      setSyncFeedback('Saved locally (Offline)');
      setTimeout(() => setSyncFeedback(null), 3000);
    } finally {
      setIsSyncing(false);
    }
  };

  // Handle password reset directly in Security tab
  const handleSecurityPasswordReset = async () => {
    setPwdResetLoading(true);
    setPwdResetError(null);
    sounds.playTap();

    const result = await sendPasswordResetEmail(profile.email);
    setPwdResetLoading(false);

    if (!result.success) {
      setPwdResetError(result.error || 'Could not send the recovery email. Please try again.');
      sounds.playWrong();
      return;
    }

    setPwdResetSent(true);
    sounds.playCorrect();
    addNotification({
      category: 'security',
      title: '🔑 Password Reset Dispatched',
      titleBisaya: 'Gipadala ang Password Reset Link',
      message: `A secure password recovery email has been sent to ${profile.email}.`,
      iconType: 'shield',
    });
  };

  return (
    <div className="space-y-4 pb-24 px-4 pt-3 max-w-md mx-auto animate-in fade-in duration-200">
      {/* ==================================================================== */}
      {/* TOP PROFILE CARD: Identity Hero & Supabase Live Status               */}
      {/* ==================================================================== */}
      <div className="bg-white dark:bg-[#11222D] rounded-3xl p-5 border border-stone-200/90 dark:border-white/10 shadow-sm space-y-4 relative overflow-hidden transition-all">
        {/* Subtle background ambient teal highlight */}
        <div className="absolute top-0 right-0 w-36 h-36 bg-teal-500/10 dark:bg-teal-500/15 rounded-full blur-2xl -mr-8 -mt-8 pointer-events-none" />

        {/* Top Status & Sync Action Row */}
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-teal-50 dark:bg-teal-950/70 text-teal-800 dark:text-teal-300 px-2.5 py-1 rounded-full border border-teal-200/60 dark:border-teal-500/30 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-teal-500" />
              User Plan
            </span>

            {/* Supabase Live Cloud Status Badge */}
            <button
              onClick={handleCloudSync}
              disabled={isSyncing}
              className="text-[10px] font-mono font-bold uppercase tracking-wider bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 px-2 py-1 rounded-full border border-stone-200 dark:border-white/10 flex items-center gap-1 hover:border-teal-500/50 transition-colors cursor-pointer"
              title="Click to sync your records to Supabase now"
            >
              <RefreshCw className={`w-2.5 h-2.5 text-teal-500 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{syncFeedback || (isSupabaseConfigured ? 'Cloud Synced' : 'Sync Saved')}</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                sounds.playTap();
                setActiveModal('edit_profile');
              }}
              className="p-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300 transition-colors cursor-pointer"
              title="Edit Profile Information"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => {
                sounds.playTap();
                setActiveTab('security');
              }}
              className="p-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300 transition-colors cursor-pointer"
              title="Account & Security"
            >
              <Shield className="w-3.5 h-3.5 text-teal-500" />
            </button>
          </div>
        </div>

        {/* Identity Details */}
        <div className="flex flex-col items-center text-center space-y-2 relative z-10">
          <div 
            className="relative group cursor-pointer" 
            onClick={() => {
              sounds.playTap();
              setActiveModal('avatar_picker');
            }}
            title="Tap to upload or change your profile photo"
          >
            <img
              src={profile.avatar}
              alt={profile.name}
              referrerPolicy="no-referrer"
              className="w-20 h-20 rounded-full object-cover border-4 border-teal-500 dark:border-[#00B8A9] shadow-lg group-hover:opacity-90 transition-opacity"
            />
            <button
              type="button"
              className="absolute -bottom-1 -right-1 bg-teal-500 text-stone-950 p-1.5 rounded-full shadow-md border-2 border-white dark:border-[#11222D] cursor-pointer group-hover:scale-105 transition-transform"
              title="Upload or change profile photo"
            >
              <Camera className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-0.5">
            <div className="flex items-center justify-center gap-1.5">
              <h2 className="font-display font-black text-xl text-stone-900 dark:text-white tracking-tight">
                {profile.name}
              </h2>
              <span title="Verified SultiAI Learner" className="text-teal-600 dark:text-teal-400">
                <CheckCircle2 className="w-4 h-4 fill-teal-500/20" />
              </span>
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400 font-mono">
              {profile.email}
            </p>
            <div className="flex items-center justify-center gap-2 text-[10px] text-stone-400 mt-0.5">
              <span>Member since {profile.joinedDate}</span>
              <span>•</span>
              <span className="text-teal-600 dark:text-teal-400 font-medium">Active Learner</span>
            </div>
          </div>
        </div>

        {/* Target Dialect & Learning Level Strip */}
        <div 
          onClick={() => {
            sounds.playTap();
            setActiveTab('preferences');
          }}
          className="p-3 bg-stone-50 dark:bg-stone-800/60 rounded-2xl border border-stone-200/80 dark:border-white/5 flex items-center justify-between cursor-pointer hover:border-teal-500/40 transition-all group"
          title="Tap to update language and dialect preferences"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-teal-100 dark:bg-teal-950/70 text-teal-700 dark:text-teal-300 flex items-center justify-center font-bold text-sm">
              🇵🇭
            </div>
            <div className="text-left">
              <div className="text-[10px] font-mono uppercase tracking-wider text-teal-700 dark:text-teal-300 font-bold">
                {currentLanguageLabel}
              </div>
              <div className="font-display font-black text-xs text-stone-900 dark:text-white">
                {currentDialectLabel} · {profile.level}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 text-[11px] font-bold text-teal-600 dark:text-teal-400 group-hover:translate-x-0.5 transition-transform">
            <span>{profile.dailyGoalMinutes}m/day</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* 4 Core Summary Metrics (Real Application Records) */}
        <div className="grid grid-cols-4 gap-2 pt-1 border-t border-stone-100 dark:border-white/10 text-center">
          <div className="p-2.5 bg-amber-50/70 dark:bg-amber-950/40 rounded-2xl border border-amber-200/60 dark:border-amber-500/30">
            <div className="text-base font-black font-mono text-amber-900 dark:text-amber-200 tabular-nums">
              {profile.streakDays}d
            </div>
            <div className="text-[10px] text-amber-800 dark:text-amber-300 font-bold uppercase tracking-wider">Streak</div>
          </div>
          <div className="p-2.5 bg-teal-50/70 dark:bg-teal-950/40 rounded-2xl border border-teal-200/60 dark:border-teal-500/30">
            <div className="text-base font-black font-mono text-teal-900 dark:text-teal-200 tabular-nums">
              {profile.xp}
            </div>
            <div className="text-[10px] text-teal-800 dark:text-teal-300 font-bold uppercase tracking-wider">Total XP</div>
          </div>
          <div className="p-2.5 bg-sky-50/70 dark:bg-sky-950/40 rounded-2xl border border-sky-200/60 dark:border-sky-500/30">
            <div className="text-base font-black font-mono text-sky-900 dark:text-sky-200 tabular-nums">
              {profile.gems || 240}
            </div>
            <div className="text-[10px] text-sky-800 dark:text-sky-300 font-bold uppercase tracking-wider">Gems</div>
          </div>
          <div className="p-2.5 bg-indigo-50/70 dark:bg-indigo-950/40 rounded-2xl border border-indigo-200/60 dark:border-indigo-500/30">
            <div className="text-base font-black font-mono text-indigo-900 dark:text-indigo-200 tabular-nums">
              {profile.speechScoreAverage}%
            </div>
            <div className="text-[10px] text-indigo-800 dark:text-indigo-300 font-bold uppercase tracking-wider">Whisper</div>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 5-SEGMENTED CORE NAVIGATION: Overview · Account · Progress · Preferences · Security */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-5 gap-1 p-1 bg-stone-200/80 dark:bg-stone-900/80 rounded-2xl border border-stone-300/50 dark:border-white/10 shadow-inner">
        <button
          onClick={() => {
            sounds.playTap();
            setActiveTab('overview');
          }}
          className={`min-h-[38px] py-1.5 px-1 text-[11px] font-bold rounded-xl transition-all cursor-pointer text-center truncate ${
            activeTab === 'overview'
              ? 'bg-white dark:bg-[#152B37] text-teal-700 dark:text-teal-300 shadow-sm font-black'
              : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => {
            sounds.playTap();
            setActiveTab('account');
          }}
          className={`min-h-[38px] py-1.5 px-1 text-[11px] font-bold rounded-xl transition-all cursor-pointer text-center truncate ${
            activeTab === 'account'
              ? 'bg-white dark:bg-[#152B37] text-teal-700 dark:text-teal-300 shadow-sm font-black'
              : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
          }`}
        >
          Account
        </button>
        <button
          onClick={() => {
            sounds.playTap();
            setActiveTab('progress');
          }}
          className={`min-h-[38px] py-1.5 px-1 text-[11px] font-bold rounded-xl transition-all cursor-pointer text-center truncate ${
            activeTab === 'progress'
              ? 'bg-white dark:bg-[#152B37] text-teal-700 dark:text-teal-300 shadow-sm font-black'
              : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
          }`}
        >
          Progress
        </button>
        <button
          onClick={() => {
            sounds.playTap();
            setActiveTab('preferences');
          }}
          className={`min-h-[38px] py-1.5 px-1 text-[11px] font-bold rounded-xl transition-all cursor-pointer text-center truncate ${
            activeTab === 'preferences'
              ? 'bg-white dark:bg-[#152B37] text-teal-700 dark:text-teal-300 shadow-sm font-black'
              : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
          }`}
        >
          Settings
        </button>
        <button
          onClick={() => {
            sounds.playTap();
            setActiveTab('security');
          }}
          className={`min-h-[38px] py-1.5 px-1 text-[11px] font-bold rounded-xl transition-all cursor-pointer text-center truncate ${
            activeTab === 'security'
              ? 'bg-white dark:bg-[#152B37] text-teal-700 dark:text-teal-300 shadow-sm font-black'
              : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
          }`}
        >
          Security
        </button>
      </div>

      {/* ==================================================================== */}
      {/* TAB 1: OVERVIEW — QUICK ACTIONS & STREAK PREVIEW                     */}
      {/* ==================================================================== */}
      {activeTab === 'overview' && (
        <div className="space-y-3.5 animate-in fade-in duration-150">
          {/* Quick Actions Shortcuts */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-[11px] font-mono text-stone-500 dark:text-stone-400 font-bold uppercase tracking-wider">
                Quick Shortcuts
              </span>
              <span className="text-[10px] text-stone-400">
                Learning Hub
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {/* Action 1: Continue Learning */}
              <button
                onClick={() => {
                  sounds.playTap();
                  onNavigateToLearn?.();
                }}
                className="p-3 bg-white dark:bg-[#11222D] rounded-2xl border border-stone-200/80 dark:border-white/10 hover:border-teal-500/40 shadow-xs flex items-center gap-2.5 text-left transition-all cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="font-display font-black text-xs text-stone-900 dark:text-white truncate group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                    Continue Learning
                  </div>
                  <div className="text-[10px] text-stone-500 dark:text-stone-400 truncate">
                    13 Lesson Roadmaps
                  </div>
                </div>
              </button>

              {/* Action 2: View My Progress */}
              <button
                onClick={() => {
                  sounds.playTap();
                  setActiveTab('progress');
                }}
                className="p-3 bg-white dark:bg-[#11222D] rounded-2xl border border-stone-200/80 dark:border-white/10 hover:border-teal-500/40 shadow-xs flex items-center gap-2.5 text-left transition-all cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <Trophy className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="font-display font-black text-xs text-stone-900 dark:text-white truncate group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                    My Progress
                  </div>
                  <div className="text-[10px] text-stone-500 dark:text-stone-400 truncate">
                    {totalBadgesUnlocked} Badges Unlocked
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Streak & Consistency Card */}
          <div className="bg-white dark:bg-[#11222D] rounded-3xl p-4 border border-stone-200/90 dark:border-white/10 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-500" />
                <h3 className="font-display font-black text-xs text-stone-900 dark:text-white">
                  Active Practice Streak
                </h3>
              </div>
              <span className="text-xs font-mono font-black text-amber-600 dark:text-amber-400">
                {profile.streakDays} {profile.streakDays === 1 ? 'Day' : 'Days'} in a Row
              </span>
            </div>

            <StreakCalendar
              weeklyActivity={profile.weeklyActivity || buildCurrentWeek(profile.dailyGoalMinutes)}
              monthActivity={monthActivity}
              streakDays={profile.streakDays}
              dailyGoalMinutes={profile.dailyGoalMinutes}
              todayMinutes={profile.todayMinutes}
              streakFreezes={profile.streakFreezesAvailable ?? 1}
            />
          </div>

          {/* Voice Coach & Speech Level Banner */}
          <div className="p-4 rounded-3xl bg-gradient-to-r from-teal-500/15 via-emerald-500/10 to-transparent border border-teal-500/20 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-teal-700 dark:text-teal-300 flex items-center gap-1">
                <Mic className="w-3 h-3 text-teal-500" />
                Voice Gamification Tier
              </span>
              <span className="text-[10px] font-bold bg-teal-500 text-stone-950 px-2 py-0.5 rounded-full">
                Level {voiceProgress.unlockedLevel}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-display font-black text-sm text-stone-900 dark:text-white">
                  {voiceProgress.earnedBadges.length > 0 ? 'Dila sa Sugbo (Confident Speaker)' : 'Bag-ong Magsusulti (Beginner)'}
                </h4>
                <p className="text-[11px] text-stone-500 dark:text-stone-400">
                  {profile.speechScoreAverage}% Whisper Concordance · {profile.vocabularyMastered} Words Mastered
                </p>
              </div>
              <button
                onClick={() => {
                  sounds.playTap();
                  setActiveTab('progress');
                }}
                className="text-xs font-bold text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Details</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 2: ACCOUNT — PERSONAL INFO, AVATARS, AND SUPABASE SYNC           */}
      {/* ==================================================================== */}
      {activeTab === 'account' && (
        <div className="space-y-3.5 animate-in fade-in duration-150">
          {/* Account Details Card */}
          <div className="bg-white dark:bg-[#11222D] rounded-3xl p-4 border border-stone-200/90 dark:border-white/10 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-black text-xs text-stone-900 dark:text-white flex items-center gap-2">
                <User className="w-4 h-4 text-teal-500" />
                Personal Information
              </h3>
              <button
                onClick={() => {
                  sounds.playTap();
                  setActiveModal('edit_profile');
                }}
                className="text-xs font-bold text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Edit3 className="w-3 h-3" />
                <span>Edit</span>
              </button>
            </div>

            <div className="space-y-2 text-xs divide-y divide-stone-100 dark:divide-white/5">
              <div className="pt-1.5 flex items-center justify-between">
                <span className="text-stone-500 dark:text-stone-400">Display Name</span>
                <span className="font-bold text-stone-900 dark:text-white font-display">{profile.name}</span>
              </div>
              <div className="pt-2 flex items-center justify-between">
                <span className="text-stone-500 dark:text-stone-400">Email Address</span>
                <span className="font-mono text-stone-700 dark:text-stone-300">{profile.email}</span>
              </div>
              <div className="pt-2 flex items-center justify-between">
                <span className="text-stone-500 dark:text-stone-400">Account ID</span>
                <span className="font-mono text-[11px] text-stone-500 dark:text-stone-400">{profile.id}</span>
              </div>
              <div className="pt-2 flex items-center justify-between">
                <span className="text-stone-500 dark:text-stone-400">Sign-in Provider</span>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-teal-600 dark:text-teal-300 border border-stone-200 dark:border-white/10">
                  {profile.authProvider === 'google' ? 'Google Provider' : 'Email Provider'}
                </span>
              </div>
              <div className="pt-2 flex items-center justify-between">
                <span className="text-stone-500 dark:text-stone-400">Account Action</span>
                {onOpenLogin ? (
                  <button
                    onClick={() => {
                      sounds.playTap();
                      onOpenLogin();
                    }}
                    className="text-[11px] font-bold text-teal-600 dark:text-teal-400 hover:underline cursor-pointer"
                  >
                    Switch or Sign In with Another Account →
                  </button>
                ) : (
                  <span className="text-[11px] text-stone-400">Signed In</span>
                )}
              </div>
            </div>
          </div>

          {/* SultiAI Avatar Selection Roster */}
          <div className="bg-white dark:bg-[#11222D] rounded-3xl p-4 border border-stone-200/90 dark:border-white/10 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-black text-xs text-stone-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                Profile Photo & Avatar
              </h3>
              <span className="text-[10px] text-stone-400">Tap to select</span>
            </div>

            <button
              type="button"
              onClick={() => {
                sounds.playTap();
                setActiveModal('avatar_picker');
              }}
              className="w-full flex items-center gap-2.5 p-2.5 rounded-2xl border border-dashed border-teal-500/60 bg-teal-50/60 dark:bg-teal-950/30 hover:bg-teal-50 dark:hover:bg-teal-950/50 transition-colors cursor-pointer text-left"
            >
              <span className="w-9 h-9 shrink-0 rounded-xl bg-teal-500 text-stone-950 flex items-center justify-center shadow-sm">
                <Upload className="w-4 h-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[11px] font-black text-stone-900 dark:text-white">
                  Upload or change profile photo
                </span>
                <span className="block text-[10px] text-stone-500 dark:text-stone-400">
                  Choose a photo from your device or pick a SultiAI avatar
                </span>
              </span>
              <ChevronRight className="w-4 h-4 shrink-0 text-teal-600 dark:text-teal-400" />
            </button>

            <div className="grid grid-cols-4 gap-2.5">
              {SULTI_AVATARS.map((av) => {
                const isSelected = profile.avatar === av.url;
                return (
                  <button
                    key={av.id}
                    onClick={() => {
                      sounds.playTap();
                      onUpdateProfile?.({ avatar: av.url });
                      if (supabase && profile.id) {
                        Promise.resolve(supabase.from('profiles').update({ avatar_url: av.url }).eq('id', profile.id)).catch(() => {});
                      }
                      sounds.playCorrect();
                    }}
                    className={`relative p-1.5 rounded-2xl border flex flex-col items-center gap-1 transition-all cursor-pointer group ${
                      isSelected
                        ? 'bg-teal-50/80 dark:bg-teal-950/50 border-teal-500 ring-2 ring-teal-400/40 shadow-xs'
                        : 'bg-stone-50 dark:bg-stone-800/40 border-stone-200/70 dark:border-white/5 hover:border-teal-500/40'
                    }`}
                  >
                    <img
                      src={av.url}
                      alt={av.name}
                      referrerPolicy="no-referrer"
                      className="w-11 h-11 rounded-full object-cover border-2 border-white dark:border-stone-800"
                    />
                    <span className="text-[9.5px] font-bold text-stone-800 dark:text-stone-200 truncate w-full text-center">
                      {av.name}
                    </span>
                    {isSelected && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-teal-500 text-stone-950 rounded-full flex items-center justify-center text-[9px] font-black border border-white dark:border-[#11222D]">
                        ✓
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Supabase Synchronization Status & Live Trigger */}
          <div className="bg-white dark:bg-[#11222D] rounded-3xl p-4 border border-stone-200/90 dark:border-white/10 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-500" />
                <div>
                  <h3 className="font-display font-black text-xs text-stone-900 dark:text-white">
                    Supabase Database Sync
                  </h3>
                  <p className="text-[10px] text-stone-500 dark:text-stone-400">
                    Real-time state & multi-device learner sync
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30 font-bold">
                {isSupabaseConfigured ? 'Active' : 'Local+Proxy'}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/70 dark:border-white/5 flex items-center justify-between text-xs">
              <div className="space-y-0.5">
                <div className="font-bold text-stone-800 dark:text-stone-200 text-[11px]">
                  Connected Table: <span className="font-mono text-teal-600 dark:text-teal-400">learner_accounts</span>
                </div>
                <div className="text-[10px] text-stone-400">
                  Last synchronized: {lastSyncedTime}
                </div>
              </div>

              <button
                onClick={handleCloudSync}
                disabled={isSyncing}
                className="py-1.5 px-3 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
              </button>
            </div>
          </div>

          {/* Subscription Quotas Shortcut */}
          <button
            onClick={() => {
              sounds.playTap();
              setActiveModal('subscription');
            }}
            className="w-full p-3.5 bg-white dark:bg-[#11222D] rounded-2xl border border-stone-200/80 dark:border-white/10 hover:border-teal-500/40 shadow-xs flex items-center justify-between text-left transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <Award className="w-4 h-4" />
              </div>
              <div>
                <div className="font-display font-black text-xs text-stone-900 dark:text-white">
                  Subscription & AI Quota Entitlements
                </div>
                <div className="text-[10px] text-stone-500 dark:text-stone-400">
                  Scholar tier access & 2-minute voice session details
                </div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-stone-400 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 3: MY PROGRESS — 13 MODULES, ACHIEVEMENTS, AND LESSONS           */}
      {/* ==================================================================== */}
      {activeTab === 'progress' && (
        <div className="space-y-3.5 animate-in fade-in duration-150">
          {/* Top Progress Summary Card */}
          <div className="p-4 bg-gradient-to-r from-teal-500/15 via-emerald-500/10 to-teal-500/5 rounded-3xl border border-teal-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-teal-700 dark:text-teal-300 font-bold block">
                  Curriculum Completion
                </span>
                <h3 className="font-display font-black text-base text-stone-900 dark:text-white">
                  {completedCebuano} Completed Challenges
                </h3>
              </div>
              <div className="text-right">
                <span className="text-lg font-black font-mono text-teal-800 dark:text-teal-200">
                  {coreProgress}%
                </span>
                <span className="text-[10px] text-stone-500 dark:text-stone-400 block">Core Progress</span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-2.5 bg-stone-200 dark:bg-stone-800 rounded-full overflow-hidden p-0.5">
              <div 
                className="h-full bg-gradient-to-r from-teal-500 to-emerald-400 rounded-full transition-all duration-500"
                style={{ width: `${Math.max(8, coreProgress)}%` }}
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[10.5px] text-stone-600 dark:text-stone-300 font-medium">
                {profile.vocabularyMastered} Cebuano / Bisaya words active in memory
              </span>
              <button
                onClick={() => {
                  sounds.playTap();
                  onNavigateToLearn?.();
                }}
                className="text-[11px] font-bold text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Go to Lessons</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* 13 Toolkit Modules Breakdown */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-[11px] font-mono text-stone-500 dark:text-stone-400 font-bold uppercase tracking-wider">
                13 SultiAI Learning Modules
              </span>
              <span className="text-[10px] text-stone-400">
                Course Tracks
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {TOOLKIT_MODULES.slice(0, 6).map((mod) => (
                <div
                  key={mod.id}
                  className="p-3 bg-white dark:bg-[#11222D] rounded-2xl border border-stone-200/80 dark:border-white/10 shadow-2xs space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{mod.icon}</span>
                      <div className="min-w-0">
                        <div className="font-display font-black text-xs text-stone-900 dark:text-white truncate">
                          {mod.title}
                        </div>
                        <div className="text-[10px] text-stone-500 dark:text-stone-400 truncate">
                          {mod.purpose}
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono font-bold text-teal-600 dark:text-teal-400">
                      {toolkitProgress[mod.id] || 0}%
                    </span>
                  </div>

                  <div className="w-full h-1.5 bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-teal-500 rounded-full"
                      style={{ width: `${toolkitProgress[mod.id] || 0}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => {
                sounds.playTap();
                setActiveModal('progress');
              }}
              className="w-full py-2.5 px-3 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800/80 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 rounded-2xl text-xs font-bold text-center transition-colors cursor-pointer border border-stone-200 dark:border-white/5"
            >
              View Full 13 Modules & Mastery Badges Breakdown →
            </button>
          </div>

          {/* Voice Levels & Earned Badges */}
          <div className="bg-white dark:bg-[#11222D] rounded-3xl p-4 border border-stone-200/90 dark:border-white/10 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-black text-xs text-stone-900 dark:text-white flex items-center gap-2">
                <Mic className="w-4 h-4 text-teal-500" />
                Whisper Voice Mastery Badges
              </h3>
              <span className="text-[10px] font-mono text-teal-600 dark:text-teal-400 font-bold">
                {voiceProgress.earnedBadges.length} Earned
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {VOICE_LEVELS.slice(0, 4).map((level) => {
                const isEarned = voiceProgress.earnedBadges.includes(level.badge.id);
                return (
                  <div
                    key={level.badge.id}
                    className={`p-2.5 rounded-2xl border flex items-center gap-2 transition-all ${
                      isEarned
                        ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200/80 dark:border-amber-500/30'
                        : 'bg-stone-50 dark:bg-stone-900/30 border-stone-200/60 dark:border-white/5 opacity-60'
                    }`}
                  >
                    <div className="text-xl shrink-0">
                      {isEarned ? level.badge.icon : '🔒'}
                    </div>
                    <div className="min-w-0">
                      <div className="font-display font-black text-xs text-stone-900 dark:text-white truncate">
                        {level.badge.nameBisaya}
                      </div>
                      <div className="text-[9.5px] text-stone-500 dark:text-stone-400 truncate">
                        {level.badge.name}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Weekly Learning Activity */}
          <div className="bg-white dark:bg-[#11222D] rounded-3xl p-4 border border-stone-200/90 dark:border-white/10 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-black text-xs text-stone-900 dark:text-white flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-indigo-500" />
                Weekly Learning Activity
              </h3>
              <span className="text-[10px] font-mono text-stone-400">
                Daily Minutes
              </span>
            </div>

            <div className="grid grid-cols-7 gap-1.5 pt-2 text-center">
              {(profile.weeklyActivity || buildCurrentWeek(profile.dailyGoalMinutes)).slice(-7).map((d, i) => (
                <div key={i} className="flex flex-col items-center gap-1.5">
                  <div className="w-full bg-stone-100 dark:bg-stone-800 rounded-lg h-16 flex items-end p-1 justify-center">
                    <div
                      className={`w-full rounded-md transition-all ${
                        d.goalMet ? 'bg-teal-500' : 'bg-amber-400'
                      }`}
                      style={{
                        height: `${Math.min(100, Math.max(15, (d.minutes / (d.goalMinutes || 15)) * 100))}%`,
                      }}
                      title={`${d.dayBisaya || d.dayOfWeek}: ${d.minutes} mins`}
                    />
                  </div>
                  <span className="text-[10px] font-bold text-stone-600 dark:text-stone-400">
                    {d.dayBisaya || d.dayOfWeek}
                  </span>
                  <span className="text-[9px] font-mono text-stone-400 tabular-nums">
                    {d.minutes}m
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 4: SETTINGS — APPEARANCE & THEME ONLY                            */}
      {/* ==================================================================== */}
      {activeTab === 'preferences' && (
        <div className="space-y-3.5 animate-in fade-in duration-150">
          {/* Theme Switcher (Light / Dark Navy / System) */}
          <div className="p-4 rounded-3xl bg-white dark:bg-[#11222D] border border-stone-200/90 dark:border-white/10 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black text-stone-900 dark:text-white flex items-center gap-2 font-display">
                <Sun className="w-4 h-4 text-amber-500" />
                Appearance & Theme
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 font-bold border border-teal-200/60 dark:border-teal-500/30">
                {themeMode === 'light' ? 'Light Theme' : themeMode === 'dark' ? 'Dark Navy' : 'Device System'}
              </span>
            </div>

            <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
              Customize the visual interface of SultiAI. Choose between crisp daylight light mode, midnight dark navy, or synchronize automatically with your device system preferences.
            </p>

            <div className="grid grid-cols-3 gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  sounds.playTap();
                  setThemeMode('light');
                }}
                className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                  themeMode === 'light'
                    ? 'bg-amber-50/90 border-amber-400 text-amber-950 font-black shadow-sm ring-2 ring-amber-400/50'
                    : 'bg-stone-50 dark:bg-stone-800/60 border-stone-200 dark:border-white/10 text-stone-600 dark:text-stone-300'
                }`}
              >
                <Sun className="w-5 h-5 text-amber-500" />
                <span className="text-xs font-bold">Light</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  sounds.playTap();
                  setThemeMode('dark');
                }}
                className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                  themeMode === 'dark'
                    ? 'bg-teal-950/70 border-teal-400 text-teal-200 font-black shadow-sm ring-2 ring-teal-400/50'
                    : 'bg-stone-50 dark:bg-stone-800/60 border-stone-200 dark:border-white/10 text-stone-600 dark:text-stone-300'
                }`}
              >
                <Moon className="w-5 h-5 text-teal-400" />
                <span className="text-xs font-bold">Dark Navy</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  sounds.playTap();
                  setThemeMode('system');
                }}
                className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                  themeMode === 'system'
                    ? 'bg-indigo-50/90 dark:bg-indigo-950/70 border-indigo-400 text-indigo-950 dark:text-indigo-200 font-black shadow-sm ring-2 ring-indigo-400/50'
                    : 'bg-stone-50 dark:bg-stone-800/60 border-stone-200 dark:border-white/10 text-stone-600 dark:text-stone-300'
                }`}
              >
                <Monitor className="w-5 h-5 text-indigo-500" />
                <span className="text-xs font-bold">System</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 5: SECURITY — PASSWORD, PRIVACY, SESSIONS, DANGER ZONE           */}
      {/* ==================================================================== */}
      {activeTab === 'security' && (
        <div className="space-y-3.5 animate-in fade-in duration-150">
          {/* Password Recovery Card */}
          <div className="p-4 rounded-3xl bg-white dark:bg-[#11222D] border border-stone-200/90 dark:border-white/10 shadow-sm space-y-3">
            <h3 className="text-xs font-black text-stone-900 dark:text-white flex items-center gap-2 font-display">
              <KeyRound className="w-4 h-4 text-teal-500" />
              Password & Credentials
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Manage your login password and access tokens securely via Supabase Auth.
            </p>

            <div className="p-3 bg-stone-50 dark:bg-stone-800/60 rounded-2xl border border-stone-200/80 dark:border-white/5 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-stone-500 dark:text-stone-400">Registered Email</span>
                <span className="font-mono font-bold text-stone-800 dark:text-stone-200">{profile.email}</span>
              </div>

              {pwdResetSent ? (
                <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-500/30 rounded-xl text-emerald-800 dark:text-emerald-200 text-xs font-medium flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Password reset email dispatched to {profile.email}!</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleSecurityPasswordReset}
                  disabled={pwdResetLoading}
                  className="w-full py-2.5 px-3 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>{pwdResetLoading ? 'Sending...' : 'Send Password Reset Email'}</span>
                </button>
              )}

              {pwdResetError && (
                <p className="text-[11px] text-rose-600 dark:text-rose-400 font-medium leading-snug">
                  {pwdResetError}
                </p>
              )}
            </div>
          </div>

          {/* Active Session Card */}
          <div className="p-4 rounded-3xl bg-white dark:bg-[#11222D] border border-stone-200/90 dark:border-white/10 shadow-sm space-y-3">
            <h3 className="text-xs font-black text-stone-900 dark:text-white flex items-center gap-2 font-display">
              <Laptop className="w-4 h-4 text-indigo-500" />
              Active Browser Session
            </h3>

            <div className="p-3 bg-stone-50 dark:bg-stone-800/60 rounded-2xl border border-stone-200/80 dark:border-white/5 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-stone-500 dark:text-stone-400">Current Device</span>
                <span className="font-bold text-stone-900 dark:text-white">Web Applet (Vite SPA)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-stone-500 dark:text-stone-400">Authentication</span>
                <span className="font-mono text-teal-600 dark:text-teal-400 font-bold">Supabase Persistent Session</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-stone-500 dark:text-stone-400">Status</span>
                <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold text-[11px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Encrypted & Active
                </span>
              </div>
            </div>
          </div>

          {/* Privacy & Data Management */}
          <div className="p-4 rounded-3xl bg-white dark:bg-[#11222D] border border-stone-200/90 dark:border-white/10 shadow-sm space-y-3">
            <h3 className="text-xs font-black text-stone-900 dark:text-white flex items-center gap-2 font-display">
              <Database className="w-4 h-4 text-blue-500" />
              Data & Privacy Controls
            </h3>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  sounds.playTap();
                  setActiveModal('privacy');
                }}
                className="p-3 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-white/10 text-left hover:border-teal-500/40 transition-colors cursor-pointer group"
              >
                <Download className="w-4 h-4 text-teal-500 mb-1 group-hover:scale-110 transition-transform" />
                <div className="font-bold text-xs text-stone-900 dark:text-white">Export My Data</div>
                <div className="text-[10px] text-stone-400">Download JSON records</div>
              </button>

              <button
                type="button"
                onClick={() => {
                  sounds.playTap();
                  setActiveModal('privacy');
                }}
                className="p-3 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-white/10 text-left hover:border-teal-500/40 transition-colors cursor-pointer group"
              >
                <Trash2 className="w-4 h-4 text-amber-500 mb-1 group-hover:scale-110 transition-transform" />
                <div className="font-bold text-xs text-stone-900 dark:text-white">Clear AI History</div>
                <div className="text-[10px] text-stone-400">Erase chat transcripts</div>
              </button>
            </div>
          </div>

          {/* Danger Zone: Log Out & Account Deletion */}
          <div className="p-4 rounded-3xl bg-rose-50/40 dark:bg-rose-950/20 border border-rose-200/80 dark:border-rose-500/20 shadow-sm space-y-3">
            <h3 className="text-xs font-black text-rose-800 dark:text-rose-300 flex items-center gap-2 font-display">
              <AlertTriangle className="w-4 h-4 text-rose-500" />
              Account Actions
            </h3>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => {
                  sounds.playTap();
                  setActiveModal('logout_confirm');
                }}
                className="w-full py-3 px-4 bg-white dark:bg-[#11222D] hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-800 dark:text-stone-200 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer border border-stone-200 dark:border-white/10"
              >
                <LogOut className="w-4 h-4 text-stone-500" />
                <span>Log Out of SultiAI</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  sounds.playTap();
                  setActiveModal('security');
                }}
                className="w-full py-2.5 px-4 bg-transparent hover:bg-rose-100/50 dark:hover:bg-rose-900/30 text-rose-700 dark:text-rose-400 rounded-2xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Account & Erase All Progress</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL FLOWS (Deep flows connected to real state and Supabase)        */}
      {/* ==================================================================== */}

      {/* Edit Profile Modal */}
      {activeModal === 'edit_profile' && (
        <EditProfileModal
          profile={profile}
          onSave={(updates) => {
            if (updates.targetDialect) onUpdateDialect(updates.targetDialect);
            if (updates.dailyGoalMinutes) onUpdateDailyGoal(updates.dailyGoalMinutes);
            onUpdateProfile?.(updates);
          }}
          onOpenAvatarPicker={() => setActiveModal('avatar_picker')}
          onClose={() => setActiveModal(null)}
        />
      )}

      {/* Avatar Selection Modal */}
      {activeModal === 'avatar_picker' && (
        <AvatarSelectionModal
          currentAvatar={profile.avatar}
          userId={profile.id}
          onSelectAvatar={(newAvatar) => {
            onUpdateProfile?.({ avatar: newAvatar });
          }}
          onClose={() => setActiveModal(null)}
        />
      )}

      {/* Learning Preferences Modal */}
      {activeModal === 'learning_prefs' && (
        <LearningPreferencesModal
          profile={profile}
          onSavePreferences={(prefs) => {
            if (prefs.targetDialect) onUpdateDialect(prefs.targetDialect);
            if (prefs.dailyGoalMinutes) onUpdateDailyGoal(prefs.dailyGoalMinutes);
            onUpdateProfile?.({
              targetDialect: prefs.targetDialect,
              dailyGoalMinutes: prefs.dailyGoalMinutes,
            });
          }}
          onClose={() => setActiveModal(null)}
        />
      )}

      {/* My Learning Progress Modal */}
      {activeModal === 'progress' && (
        <LearningProgressModal
          profile={profile}
          badgeStates={badgeStates}
          onNavigateToLearn={() => {
            setActiveModal(null);
            onNavigateToLearn?.();
          }}
          onClose={() => setActiveModal(null)}
        />
      )}

      {/* AI Activity History Modal */}
      {activeModal === 'ai_activity' && (
        <AiActivityModal
          userId={profile.id}
          onOpenSultiChat={(prompt) => {
            setActiveModal(null);
            onOpenSultiChat?.(prompt);
          }}
          onClose={() => setActiveModal(null)}
        />
      )}

      {/* Notification Preferences Modal */}
      {activeModal === 'notifications' && (
        <NotificationSettingsModal
          onClose={() => setActiveModal(null)}
        />
      )}

      {/* Account & Security Modal */}
      {activeModal === 'security' && (
        <AccountSecurityModal
          profile={profile}
          onOpenLogoutConfirm={() => setActiveModal('logout_confirm')}
          onDeleteAccount={() => {
            setActiveModal(null);
            onLogout?.();
          }}
          onClose={() => setActiveModal(null)}
        />
      )}

      {/* Privacy & Data Management Modal */}
      {activeModal === 'privacy' && (
        <PrivacyDataModal
          profile={profile}
          onClose={() => setActiveModal(null)}
        />
      )}

      {/* Subscription & Usage Modal */}
      {activeModal === 'subscription' && (
        <SubscriptionUsageModal
          onClose={() => setActiveModal(null)}
        />
      )}

      {/* Help & Support Modal */}
      {activeModal === 'help_support' && (
        <HelpSupportModal
          onClose={() => setActiveModal(null)}
        />
      )}

      {/* Logout Confirmation Dialog */}
      {activeModal === 'logout_confirm' && (
        <LogoutConfirmModal
          userName={profile.name}
          onConfirmLogout={() => {
            onLogout?.();
          }}
          onClose={() => setActiveModal(null)}
        />
      )}
    </div>
  );
};
