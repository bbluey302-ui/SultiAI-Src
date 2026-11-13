import React, { useState, useEffect } from 'react';
import { 
  Flame, ShieldCheck, Gem, Volume2, Globe, ChevronRight, 
  Award, Sun, Moon, Sparkles, Sliders, Bell, User, LogIn 
} from 'lucide-react';
import { TargetDialect, NotificationCategory } from '../types';
import { sounds } from '../utils/soundEffects';
import { speakBisaya } from '../utils/audio';
import { ASSETS } from '../assets/images';
import { useTheme } from '../context/ThemeContext';
import { 
  getStoredNotifications, 
  markNotificationAsRead, 
  markAllNotificationsAsRead, 
  deleteNotification, 
  clearAllNotifications, 
  resetToDefaultNotifications, 
  addNotification, 
  subscribeNotifications 
} from '../utils/notificationService';
import { NotificationModal } from './NotificationModal';

interface TopHeaderProps {
  streak: number;
  xp: number;
  gems?: number;
  hearts?: number;
  dialect: TargetDialect;
  onOpenDialectModal: () => void;
  onOpenAuditModal: () => void;
  onOpenAdminConsole?: () => void;
  onRefillHearts?: () => void;
  userName?: string;
  userAvatar?: string;
  showHeroGreeting?: boolean;
  onNavigateAction?: (actionType?: string) => void;
  onOpenLogin?: () => void;
  isLoggedIn?: boolean;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  streak,
  xp,
  gems = 285,
  hearts = 5,
  dialect,
  onOpenDialectModal,
  onOpenAuditModal,
  onOpenAdminConsole,
  userName = 'Learner',
  userAvatar,
  showHeroGreeting = true,
  onNavigateAction,
  onOpenLogin,
  isLoggedIn = true,
}) => {
  const { themeMode, setThemeMode, isDark, toggleTheme } = useTheme();
  const [isPlayingGreeting, setIsPlayingGreeting] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState(getStoredNotifications);

  useEffect(() => {
    const unsubscribe = subscribeNotifications((updated) => {
      setNotifications([...updated]);
    });
    return unsubscribe;
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const [activeLang, setActiveLang] = useState<'cebuano' | 'filipino' | 'english'>('cebuano');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sultiai_selected_language');
      if (saved === 'filipino' || saved === 'english' || saved === 'cebuano') {
        setActiveLang(saved);
      }
    }
  }, []);

  // Time-aware greeting supporting Cebuano, Filipino, and English journeys
  const getGreeting = () => {
    const hour = new Date().getHours();
    const name = userName.split(' ')[0] || 'Learner';

    if (activeLang === 'filipino') {
      if (hour < 12) {
        return { text: `Magandang umaga, ${name}! 👋`, subtext: 'Ready for your Filipino communication practice today?' };
      } else if (hour < 18) {
        return { text: `Magandang hapon, ${name}! 👋`, subtext: 'Ready for your Filipino communication practice today?' };
      } else {
        return { text: `Magandang gabi, ${name}! 👋`, subtext: 'Ready for your Filipino communication practice today?' };
      }
    }

    if (activeLang === 'english') {
      if (hour < 12) {
        return { text: `Good morning, ${name}! 👋`, subtext: 'Ready for your English communication practice today?' };
      } else if (hour < 18) {
        return { text: `Good afternoon, ${name}! 👋`, subtext: 'Ready for your English communication practice today?' };
      } else {
        return { text: `Good evening, ${name}! 👋`, subtext: 'Ready for your English communication practice today?' };
      }
    }

    // Default: Cebuano / Bisaya
    if (hour < 12) {
      return { text: `Maayong buntag, ${name} 👋`, subtext: 'Ready for your Bisaya communication practice today?' };
    } else if (hour < 18) {
      return { text: `Maayong hapon, ${name} 👋`, subtext: 'Ready for your Bisaya communication practice today?' };
    } else {
      return { text: `Maayong gabii, ${name} 👋`, subtext: 'Ready for your Bisaya communication practice today?' };
    }
  };

  const greeting = getGreeting();

  const handlePlayAudio = async () => {
    setIsPlayingGreeting(true);
    sounds.playTap();
    await speakBisaya(greeting.text.replace('👋', ''));
    setIsPlayingGreeting(false);
  };

  const handleAddTestNotification = (category: NotificationCategory) => {
    if (category === 'achievement') {
      addNotification({
        category: 'achievement',
        title: '🎉 New Achievement: Quick Practice Master',
        titleBisaya: 'Nakuha ang Pasidungog sa Pagsulti!',
        message: 'Completed a rapid Bisaya conversation drill with 95% pronunciation clarity. +40 XP earned!',
        iconType: 'trophy',
        actionLabel: 'View Progress',
        actionType: 'profile',
      });
    } else if (category === 'admin') {
      addNotification({
        category: 'admin',
        title: '📢 Admin Notice: Mindanao Lexicon Updated',
        titleBisaya: 'Bag-ong Bokabularyo gikan sa Admin',
        message: 'New regional idioms from Davao and Bukidnon are now active in the phrasebook and Sulti AI prompts.',
        iconType: 'sliders',
        actionLabel: 'Learn Phrases',
        actionType: 'learn',
      });
    } else {
      addNotification({
        category: 'security',
        title: '🛡️ Security Check: Cloud Session Verified',
        titleBisaya: 'Gipamatud-an ang Session Security',
        message: 'Supabase TLS 1.3 handshake verified. Audio recording buffers safely cleaned from memory.',
        iconType: 'shield',
        actionLabel: 'View Audit',
        actionType: 'audit',
      });
    }
  };

  return (
    <>
      {/* ROW 1: DEDICATED STICKY TOP APP BAR (Full-width, clean containment, zero overlap) */}
      <header
        data-app-header
        className="sticky top-0 z-40 w-full bg-surface/95 backdrop-blur-md border-b border-line shadow-xs transition-colors"
      >
        <div className="w-full max-w-md mx-auto px-3 sm:px-4 py-2.5 flex items-center justify-between gap-2">
          {/* SultiAI Logo Brand Anchor */}
          <button
            type="button"
            onClick={() => {
              sounds.playTap();
              onOpenAuditModal();
            }}
            aria-label="Open SultiAI project blueprint"
            className="flex items-center gap-2 cursor-pointer group active:scale-98 transition-transform select-none min-w-0 shrink-0 text-left"
            title="SultiAI Language Companion · Tap for Project Blueprint"
          >
            <div className="relative shrink-0">
              <div className="w-8 h-8 rounded-xl overflow-hidden border border-brand/30 bg-brand-soft shadow-xs flex items-center justify-center group-hover:border-brand transition-colors">
                <img
                  src={ASSETS.logo}
                  alt="SultiAI logo"
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-surface shadow-xs" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-display text-sm sm:text-base font-black tracking-tight text-ink group-hover:text-brand transition-colors leading-none">
                Sulti<span className="text-brand">AI</span>
              </span>
              <span className="text-[8.5px] font-mono font-extrabold uppercase tracking-wider text-muted mt-0.5 leading-none truncate hidden min-[360px]:inline">
                Language Hub
              </span>
            </div>
          </button>

          {/* Unified status controls: notifications, theme, account */}
          <div className="flex items-center gap-1 shrink-0 bg-elevated p-1 rounded-full border border-line">
            {/* Notification Center Bell Action with Unread Badge */}
            <button
              onClick={() => {
                sounds.playTap();
                setShowNotifications(true);
              }}
              className="relative w-10 h-10 rounded-full bg-surface hover:bg-elevated text-ink hover:text-brand border border-line shadow-xs flex items-center justify-center transition-all active:scale-95 cursor-pointer shrink-0"
              title={`Notifications (${unreadCount} unread). Tap to open.`}
              aria-label={`Open notifications, ${unreadCount} unread`}
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[14px] h-[14px] px-0.5 rounded-full bg-rose-500 border-2 border-surface text-white text-[8px] font-black font-mono flex items-center justify-center shadow-xs">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Quick Theme Switcher */}
            <button
              onClick={() => {
                sounds.playTap();
                toggleTheme();
              }}
              className="w-10 h-10 rounded-full bg-surface hover:bg-elevated text-ink border border-line shadow-xs flex items-center justify-center transition-all active:scale-95 cursor-pointer shrink-0"
              title={`Currently in ${isDark ? 'Dark' : 'Light'} Mode. Tap to toggle.`}
              aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
            >
              {isDark ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-ink" />
              )}
            </button>

            {/* User Account / Login Button */}
            <button
              onClick={() => {
                sounds.playTap();
                if (onOpenLogin) {
                  onOpenLogin();
                } else if (onNavigateAction) {
                  onNavigateAction('profile');
                }
              }}
              className="w-10 h-10 rounded-full bg-surface hover:bg-elevated text-ink border border-line shadow-xs flex items-center justify-center transition-all active:scale-95 cursor-pointer shrink-0 overflow-hidden"
              title={isLoggedIn ? `Account: ${userName}. Tap to view profile or switch account.` : 'Sign In to SultiAI'}
              aria-label={isLoggedIn ? `Open profile for ${userName}` : 'Sign in to SultiAI'}
            >
              {userAvatar ? (
                <img src={userAvatar} alt={userName} className="w-full h-full object-cover" />
              ) : isLoggedIn ? (
                <User className="w-4 h-4 text-brand" />
              ) : (
                <LogIn className="w-4 h-4 text-brand" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* ROW 2: UNIFIED HERO GREETING & INTEGRATED LEARNER STATUS SECTION */}
      {showHeroGreeting && (
        <div className="w-full max-w-md mx-auto px-3 sm:px-4 pt-3 pb-1">
          <div className="relative rounded-2xl sm:rounded-3xl p-3.5 sm:p-4.5 bg-white dark:bg-[#132532] border border-stone-200 dark:border-white/15 shadow-sm overflow-hidden transition-all animate-in fade-in slide-in-from-top-1 duration-300">
            {/* Subtle background ambient warmth */}
            <div className="absolute top-0 right-0 w-36 h-36 bg-teal-500/5 dark:bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />

            {/* Main Greeting Row: Typography + Audio Pronunciation button */}
            <div className="flex items-start justify-between gap-2.5 relative z-10">
              <div className="space-y-1 min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-teal-600 dark:bg-teal-400 animate-pulse shrink-0" />
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[9.5px] font-mono font-black uppercase tracking-wider bg-teal-50 dark:bg-teal-950/80 text-teal-900 dark:text-teal-200 border border-teal-200 dark:border-teal-800 shrink-0">
                    {activeLang === 'filipino' ? '🇵🇭 Filipino Journey' : activeLang === 'english' ? '🌎 English Journey' : '🇵🇭 Bisaya Journey'}
                  </span>
                </div>
                <h1 className="font-display font-black text-lg sm:text-xl text-stone-950 dark:text-white tracking-tight leading-snug break-words">
                  {greeting.text}
                </h1>
                <p className="text-xs sm:text-[13px] text-stone-750 dark:text-stone-200 font-medium leading-relaxed">
                  {greeting.subtext}
                </p>
              </div>

              <button
                onClick={handlePlayAudio}
                className="p-2 sm:p-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-900 dark:text-stone-100 hover:text-teal-700 dark:hover:text-teal-300 border border-stone-300 dark:border-stone-700 shadow-2xs active:scale-95 transition-all cursor-pointer shrink-0 mt-0.5"
                title="Paminawa ang Bisaya nga pagtimbaya (Listen to native pronunciation)"
              >
                <Volume2 className={`w-4 h-4 ${isPlayingGreeting ? 'animate-pulse text-teal-600 dark:text-teal-400' : ''}`} />
              </button>
            </div>

            {/* INTEGRATED SECONDARY LEARNER STATUS ROW (Target Dialect & Level 3) */}
            <div className="mt-3 pt-2.5 border-t border-stone-200 dark:border-white/15 flex flex-wrap items-center justify-between gap-2 relative z-10">
              {/* Target Dialect Area */}
              <button
                onClick={() => {
                  sounds.playTap();
                  onOpenDialectModal();
                }}
                className="flex items-center gap-2 text-left group cursor-pointer active:scale-[0.98] transition-transform min-w-0"
                title="Switch target dialect (Davao Bisaya, Standard Cebuano, Hiligaynon)"
              >
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-teal-100 dark:bg-teal-950 border border-teal-300 dark:border-teal-500/40 text-teal-900 dark:text-teal-200 flex items-center justify-center shrink-0 group-hover:bg-teal-200 dark:group-hover:bg-teal-900 transition-colors">
                  <Globe className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-teal-800 dark:text-teal-300" />
                </div>
                <div className="min-w-0">
                  <div className="text-[9.5px] font-mono font-black tracking-wider uppercase text-teal-950 dark:text-teal-300 leading-none">
                    TARGET DIALECT
                  </div>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                    <span className="text-xs sm:text-sm font-black text-stone-950 dark:text-white group-hover:text-teal-700 dark:group-hover:text-teal-300 transition-colors truncate max-w-[120px] sm:max-w-none">
                      {dialect === 'davao_bisaya' ? 'Davao Bisaya' : 'Standard Cebuano'}
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-stone-500 dark:text-stone-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
                  </div>
                </div>
              </button>

              {/* Level Status Area */}
              <div className="text-right shrink-0">
                <div className="text-[9.5px] font-mono font-black tracking-wider uppercase text-stone-700 dark:text-stone-300 leading-none">
                  LEVEL
                </div>
                <div className="flex items-center justify-end gap-1 mt-0.5">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md bg-stone-100 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-950 dark:text-white text-[11px] sm:text-xs font-black font-mono shadow-2xs">
                    <Award className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-500 shrink-0" />
                    <span>Level 3</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Notification Center Modal */}
      <NotificationModal
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
        notifications={notifications}
        onMarkAsRead={markNotificationAsRead}
        onMarkAllAsRead={markAllNotificationsAsRead}
        onDeleteNotification={deleteNotification}
        onClearAll={clearAllNotifications}
        onResetDefaults={resetToDefaultNotifications}
        onAddTestNotification={handleAddTestNotification}
        onNavigateAction={(actionType) => {
          if (actionType === 'audit') {
            onOpenAuditModal();
          } else if (actionType === 'dialect') {
            onOpenDialectModal();
          } else if (onNavigateAction) {
            onNavigateAction(actionType);
          }
        }}
      />
    </>
  );
};
