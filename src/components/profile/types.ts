import { TargetDialect, UserProfile } from '../../types';
import { ASSETS } from '../../assets/images';

export type ProfileActiveModal = 
  | null
  | 'edit_profile'
  | 'avatar_picker'
  | 'learning_prefs'
  | 'progress'
  | 'ai_activity'
  | 'notifications'
  | 'security'
  | 'privacy'
  | 'subscription'
  | 'help_support'
  | 'logout_confirm';

export interface SultiAvatar {
  id: string;
  name: string;
  role: string;
  url: string;
  tag: string;
}

export const SULTI_AVATARS: SultiAvatar[] = [
  {
    id: 'sultiai-logo',
    name: 'SultiAI',
    role: 'Official SultiAI Brand',
    url: ASSETS.logo,
    tag: 'Official',
  },
  {
    id: 'explorer',
    name: 'Explorer',
    role: 'Bisaya Explorer Scholar',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=240&q=80',
    tag: 'Explorer',
  },
  {
    id: 'jen',
    name: 'Coach Jen',
    role: 'Cebuano / Bisaya Coach',
    url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=260&q=80',
    tag: 'Bisaya Coach',
  },
  {
    id: 'adam',
    name: 'Coach Adam',
    role: 'Interview & BPO Coach',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=260&q=80',
    tag: 'Interview Coach',
  },
  {
    id: 'gentech',
    name: 'Coach GenTech',
    role: 'IT & Workplace Speaker',
    url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=260&q=80',
    tag: 'Technical',
  },
  {
    id: 'kevin',
    name: 'Coach Kevin',
    role: 'Casual Banter Partner',
    url: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=260&q=80',
    tag: 'Everyday',
  },
  {
    id: 'mika',
    name: 'Coach Mika',
    role: 'Filipino / Tagalog Coach',
    url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=260&q=80',
    tag: 'Tagalog Coach',
  },
  {
    id: 'marco',
    name: 'Marco',
    role: 'Davao Jeepney Commuter',
    url: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=260&q=80',
    tag: 'Commuter',
  },
  {
    id: 'lani',
    name: 'Lani',
    role: 'Market Diplomat',
    url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=260&q=80',
    tag: 'Palengke',
  },
];

export interface NotificationPreferences {
  dailyPracticeReminder: boolean;
  streakMilestones: boolean;
  whisperAcousticFeedback: boolean;
  accountSecurityAlerts: boolean;
  curriculumUpdates: boolean;
}

export const DEFAULT_NOTIFICATION_PREFS: NotificationPreferences = {
  dailyPracticeReminder: true,
  streakMilestones: true,
  whisperAcousticFeedback: true,
  accountSecurityAlerts: true,
  curriculumUpdates: false,
};
