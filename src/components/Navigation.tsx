import React from 'react';
import { Home, BookOpen, MessageSquare, Users, User } from 'lucide-react';
import { sounds } from '../utils/soundEffects';

export type NavTab = 'home' | 'learn' | 'sulti' | 'community' | 'profile';

interface NavigationProps {
  currentTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  unreadCount?: number;
}

/**
 * Mobile bottom navigation.
 * Five stable tabs, safe-area aware, with a clear but restrained active state.
 */
export const Navigation: React.FC<NavigationProps> = ({ currentTab, onTabChange }) => {
  const tabs: { id: NavTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'learn', label: 'Learn', icon: BookOpen },
    { id: 'sulti', label: 'SULTI AI', icon: MessageSquare },
    { id: 'community', label: 'Community', icon: Users },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  const handleSelectTab = (tabId: NavTab) => {
    sounds.playTap();
    onTabChange(tabId);
  };

  return (
    <nav
      data-app-nav
      aria-label="Main Navigation"
      className="fixed bottom-0 left-0 right-0 z-40 max-w-md mx-auto bg-surface/95 backdrop-blur-xl text-ink border-t border-line shadow-soft pb-[env(safe-area-inset-bottom)] transition-colors"
    >
      <div className="grid grid-cols-5 items-stretch min-h-[60px] px-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          const isSulti = tab.id === 'sulti';

          return (
            <button
              key={tab.id}
              onClick={() => handleSelectTab(tab.id)}
              className={`min-h-[58px] min-w-[44px] flex flex-col items-center justify-center gap-0.5 px-0.5 relative transition-colors active:scale-[0.96] cursor-pointer ${
                isActive ? 'text-brand' : 'text-muted hover:text-ink'
              }`}
              aria-label={tab.label}
              aria-current={isActive ? 'page' : undefined}
            >
              <span
                className={`flex items-center justify-center rounded-xl transition-colors ${
                  isSulti
                    ? `w-9 h-8 ${isActive ? 'bg-brand text-on-brand shadow-sm' : 'bg-brand-soft text-brand border border-brand/20'}`
                    : `w-9 h-8 ${isActive ? 'bg-brand-soft text-brand' : 'bg-transparent text-muted'}`
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.4]' : 'stroke-[1.9]'}`} />
              </span>

              <span
                className={`text-[10px] leading-none tracking-tight ${
                  isActive ? 'font-bold text-brand' : 'font-medium text-muted'
                }`}
              >
                {tab.label}
              </span>

              {isActive && (
                <span className="absolute bottom-1 w-1 h-1 rounded-full bg-brand" aria-hidden />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
