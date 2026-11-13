import React from 'react';
import { 
  X, Bell, Trophy, Sliders, Sparkles, CheckCheck, 
  Trash2, RotateCcw, Plus, ChevronRight, ShieldCheck 
} from 'lucide-react';
import { AppNotification, NotificationCategory } from '../types';
import { sounds } from '../utils/soundEffects';

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: AppNotification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onDeleteNotification: (id: string) => void;
  onClearAll: () => void;
  onResetDefaults: () => void;
  onAddTestNotification: (category: NotificationCategory) => void;
  onNavigateAction?: (actionType?: string) => void;
}

export const NotificationModal: React.FC<NotificationModalProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onDeleteNotification,
  onClearAll,
  onResetDefaults,
  onAddTestNotification,
  onNavigateAction,
}) => {
  if (!isOpen) return null;

  const unreadCount = notifications.filter((n) => !n.read).length;

  const getCategoryBadge = (category: NotificationCategory) => {
    switch (category) {
      case 'achievement':
        return {
          label: 'Achievement',
          color: 'bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-200 border-amber-300 dark:border-amber-700/60',
          icon: Trophy,
          iconColor: 'text-amber-600 dark:text-amber-400',
        };
      case 'admin':
        return {
          label: 'Admin Update',
          color: 'bg-indigo-100 dark:bg-indigo-950/80 text-indigo-900 dark:text-indigo-200 border-indigo-300 dark:border-indigo-700/60',
          icon: Sliders,
          iconColor: 'text-indigo-600 dark:text-indigo-400',
        };
      case 'security':
        return {
          label: 'Security & RLS',
          color: 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-900 dark:text-emerald-200 border-emerald-300 dark:border-emerald-700/60',
          icon: ShieldCheck,
          iconColor: 'text-emerald-600 dark:text-emerald-400',
        };
      case 'system':
      default:
        return {
          label: 'AI Engine',
          color: 'bg-teal-100 dark:bg-teal-950/80 text-teal-900 dark:text-teal-200 border-teal-300 dark:border-teal-700/60',
          icon: Sparkles,
          iconColor: 'text-teal-600 dark:text-teal-400',
        };
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md max-h-[88vh] my-auto flex flex-col bg-white dark:bg-[#11222D] rounded-3xl shadow-2xl border border-stone-200 dark:border-white/15 overflow-hidden transition-all">
        {/* Modal Header: Responsive and Clean */}
        <div className="px-3.5 sm:px-4 py-3 border-b border-stone-200 dark:border-white/10 flex items-center justify-between bg-stone-50/90 dark:bg-[#152B37]/90 shrink-0 gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold shadow-xs shrink-0 relative">
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[15px] h-[15px] px-0.5 bg-rose-500 rounded-full border-2 border-white dark:border-[#11222D] flex items-center justify-center text-[8px] font-black text-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="font-display font-black text-sm sm:text-base text-stone-950 dark:text-white leading-tight">
                  Pahibalo & Updates
                </h3>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold font-mono bg-teal-100 dark:bg-teal-950/90 text-teal-900 dark:text-teal-200 border border-teal-300 dark:border-teal-700 shrink-0">
                    {unreadCount} bag-o
                  </span>
                )}
              </div>
              <p className="text-[10px] sm:text-[11px] text-stone-500 dark:text-stone-400 font-medium truncate mt-0.5">
                Achievements, admin updates & security logs
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {unreadCount > 0 && (
              <button
                onClick={() => {
                  sounds.playTap();
                  onMarkAllAsRead();
                }}
                className="p-1.5 sm:p-2 rounded-xl text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-800 transition-colors cursor-pointer"
                title="Basaha ang tanan (Mark all read)"
              >
                <CheckCheck className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              </button>
            )}
            <button
              onClick={() => {
                sounds.playTap();
                onClose();
              }}
              className="p-1.5 sm:p-2 rounded-xl text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-white hover:bg-stone-200 dark:hover:bg-stone-800 transition-colors cursor-pointer"
              title="Isira (Close)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Notification List: Unified single stream */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2.5 overscroll-contain">
          {notifications.length === 0 ? (
            <div className="py-10 text-center space-y-2.5">
              <div className="w-12 h-12 mx-auto rounded-full bg-stone-100 dark:bg-stone-800 text-stone-400 flex items-center justify-center">
                <Bell className="w-6 h-6" />
              </div>
              <div className="space-y-0.5 px-4">
                <p className="font-display font-bold text-sm text-stone-800 dark:text-white">
                  Walay mga pahibalo
                </p>
                <p className="text-[11px] text-stone-500 dark:text-stone-400">
                  No notifications yet. Complete daily Bisaya practice to earn achievements and updates!
                </p>
              </div>
              <button
                onClick={() => {
                  sounds.playTap();
                  onResetDefaults();
                }}
                className="inline-flex items-center gap-1 text-xs font-bold text-teal-600 dark:text-teal-400 hover:underline cursor-pointer pt-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Ibalik ang default notifications</span>
              </button>
            </div>
          ) : (
            notifications.map((item) => {
              const badge = getCategoryBadge(item.category);
              const IconComp = badge.icon;

              return (
                <div
                  key={item.id}
                  onClick={() => {
                    if (!item.read) {
                      onMarkAsRead(item.id);
                    }
                  }}
                  className={`p-3 sm:p-3.5 rounded-2xl border transition-all cursor-pointer relative ${
                    item.read
                      ? 'bg-stone-50/80 dark:bg-[#152B37]/60 border-stone-200 dark:border-white/10 hover:border-stone-300 dark:hover:border-white/20'
                      : 'bg-white dark:bg-[#152B37] border-teal-400 dark:border-teal-500/50 shadow-xs hover:border-teal-500'
                  }`}
                >
                  <div className="flex items-start gap-2.5 sm:gap-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border mt-0.5 ${badge.color}`}>
                      <IconComp className={`w-4 h-4 ${badge.iconColor}`} />
                    </div>

                    <div className="flex-1 min-w-0 space-y-1">
                      {/* Meta header: Category badge, Unread Dot, and Timestamp without overlapping */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className={`px-2 py-0.5 rounded text-[8.5px] font-black uppercase font-mono tracking-wider border truncate ${badge.color}`}>
                            {badge.label}
                          </span>
                          {!item.read && (
                            <span className="w-2 h-2 rounded-full bg-teal-500 shadow-xs animate-pulse inline-block shrink-0" />
                          )}
                        </div>
                        <span className="text-[10px] text-stone-400 dark:text-stone-500 font-mono shrink-0 whitespace-nowrap">
                          {item.timestamp}
                        </span>
                      </div>

                      {/* Notification Title with responsive wrap */}
                      <h4 className="font-display font-black text-xs sm:text-sm text-stone-900 dark:text-white leading-snug break-words">
                        {item.title}
                      </h4>

                      {/* Bisaya Subtitle */}
                      {item.titleBisaya && (
                        <p className="text-[11px] sm:text-xs text-teal-700 dark:text-teal-300 font-medium italic break-words">
                          "{item.titleBisaya}"
                        </p>
                      )}

                      {/* Message Body */}
                      <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed font-normal pt-0.5 break-words">
                        {item.message}
                      </p>

                      {/* Action Button & Delete Button with clean touch targets */}
                      <div className="pt-2 flex items-center justify-between gap-2">
                        {item.actionLabel ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              sounds.playTap();
                              if (!item.read) onMarkAsRead(item.id);
                              onClose();
                              onNavigateAction?.(item.actionType);
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-teal-50 dark:bg-teal-950/80 hover:bg-teal-100 dark:hover:bg-teal-900 text-teal-800 dark:text-teal-200 border border-teal-200 dark:border-teal-700 text-xs font-bold transition-all cursor-pointer active:scale-95"
                          >
                            <span>{item.actionLabel}</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <div />
                        )}

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            sounds.playTap();
                            onDeleteNotification(item.id);
                          }}
                          className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-all cursor-pointer shrink-0"
                          title="Papasa ang pahibalo (Delete)"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer: Compact Mobile Action Bar with Zero Overlap */}
        <div className="p-3 border-t border-stone-200 dark:border-white/10 bg-stone-50/90 dark:bg-[#152B37]/90 flex flex-col min-[380px]:flex-row items-stretch min-[380px]:items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
            <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-stone-400 shrink-0">
              Test:
            </span>
            <button
              onClick={() => {
                sounds.playCorrect();
                onAddTestNotification('achievement');
              }}
              className="px-2 py-1 rounded-lg bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-200 hover:bg-amber-200 border border-amber-300 dark:border-amber-700 text-[10px] font-bold cursor-pointer transition-all active:scale-95 flex items-center gap-0.5 shrink-0"
            >
              <Plus className="w-2.5 h-2.5" />
              <span>Achieve</span>
            </button>
            <button
              onClick={() => {
                sounds.playCorrect();
                onAddTestNotification('admin');
              }}
              className="px-2 py-1 rounded-lg bg-indigo-100 dark:bg-indigo-950/80 text-indigo-900 dark:text-indigo-200 hover:bg-indigo-200 border border-indigo-300 dark:border-indigo-700 text-[10px] font-bold cursor-pointer transition-all active:scale-95 flex items-center gap-0.5 shrink-0"
            >
              <Plus className="w-2.5 h-2.5" />
              <span>Admin</span>
            </button>
            <button
              onClick={() => {
                sounds.playCorrect();
                onAddTestNotification('security');
              }}
              className="px-2 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950/80 text-emerald-900 dark:text-emerald-200 hover:bg-emerald-200 border border-emerald-300 dark:border-emerald-700 text-[10px] font-bold cursor-pointer transition-all active:scale-95 flex items-center gap-0.5 shrink-0"
            >
              <Plus className="w-2.5 h-2.5" />
              <span>Security</span>
            </button>
          </div>

          <button
            onClick={() => {
              sounds.playTap();
              onClearAll();
            }}
            className="text-center min-[380px]:text-right text-[11px] font-bold text-stone-500 hover:text-rose-600 dark:text-stone-400 dark:hover:text-rose-400 transition-colors cursor-pointer shrink-0 py-1"
          >
            Clear all
          </button>
        </div>
      </div>
    </div>
  );
};
