import { AppNotification } from '../types';

const NOTIFICATIONS_STORAGE_KEY = 'sultiai_app_notifications';

export const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif_1',
    category: 'achievement',
    title: '🔥 7-Day Bisaya Streak Reached!',
    titleBisaya: '7 ka Adlaw nga Walay Putol nga Pagsulti!',
    message: 'Maayo kaayo! Consistent daily practice earned you the "Determined Bisaya Speaker" milestone badge.',
    timestamp: '10 min ago',
    read: false,
    actionLabel: 'View Stats',
    actionType: 'profile',
    iconType: 'flame',
  },
  {
    id: 'notif_2',
    category: 'security',
    title: '🛡️ Supabase RLS Security Verified',
    titleBisaya: 'Protektado ang Imong Datos sa Supabase Cloud',
    message: 'Row-Level Security policies active. User profile, speech attempts, and transcripts are encrypted and isolated.',
    timestamp: '1 hour ago',
    read: false,
    actionLabel: 'Audit Blueprint',
    actionType: 'audit',
    iconType: 'shield',
  },
  {
    id: 'notif_3',
    category: 'admin',
    title: '📢 Admin Curriculum: Bankerohan Market Live',
    titleBisaya: 'Bag-ong Roleplay Scenario: Merkado & Jeepney',
    message: 'New Mindanao colloquial bargaining drills with Whisper speech scoring have been published by the Admin Team.',
    timestamp: '3 hours ago',
    read: false,
    actionLabel: 'Go to Learn',
    actionType: 'learn',
    iconType: 'sliders',
  },
  {
    id: 'notif_4',
    category: 'achievement',
    title: '🏆 91% Speech Pronunciation Concordance',
    titleBisaya: 'Taas nga Marka sa Paglitok sa Bisaya!',
    message: 'Whisper ASR evaluated your intonation for "Lugar lang, Nong!" with top marks.',
    timestamp: 'Yesterday',
    read: true,
    actionLabel: 'Review Phrases',
    actionType: 'learn',
    iconType: 'trophy',
  },
  {
    id: 'notif_5',
    category: 'system',
    title: '⚡ SultiAI Voice & NLP Engine Online',
    titleBisaya: 'Andam ang BERT Intent & Whisper ASR',
    message: 'All language modules and speech synthesis pipelines are operational with sub-180ms latency.',
    timestamp: 'Yesterday',
    read: true,
    iconType: 'sparkles',
  },
];

type Listener = (notifs: AppNotification[]) => void;
const listeners: Set<Listener> = new Set();

export const getStoredNotifications = (): AppNotification[] => {
  if (typeof window === 'undefined') return INITIAL_NOTIFICATIONS;
  try {
    const saved = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {
    // fallback
  }
  return INITIAL_NOTIFICATIONS;
};

export const saveNotifications = (notifs: AppNotification[]): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(notifs));
    listeners.forEach((listener) => listener(notifs));
  } catch {
    // ignore
  }
};

export const addNotification = (
  item: Omit<AppNotification, 'id' | 'timestamp' | 'read'> & { timestamp?: string }
): AppNotification => {
  const current = getStoredNotifications();
  const newNotif: AppNotification = {
    ...item,
    id: 'notif_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    timestamp: item.timestamp || 'Just now',
    read: false,
  };
  const updated = [newNotif, ...current];
  saveNotifications(updated);
  return newNotif;
};

export const markNotificationAsRead = (id: string): void => {
  const current = getStoredNotifications();
  const updated = current.map((n) => (n.id === id ? { ...n, read: true } : n));
  saveNotifications(updated);
};

export const markAllNotificationsAsRead = (): void => {
  const current = getStoredNotifications();
  const updated = current.map((n) => ({ ...n, read: true }));
  saveNotifications(updated);
};

export const deleteNotification = (id: string): void => {
  const current = getStoredNotifications();
  const updated = current.filter((n) => n.id !== id);
  saveNotifications(updated);
};

export const clearAllNotifications = (): void => {
  saveNotifications([]);
};

export const resetToDefaultNotifications = (): void => {
  saveNotifications(INITIAL_NOTIFICATIONS);
};

export const subscribeNotifications = (listener: Listener): (() => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
