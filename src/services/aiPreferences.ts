// Learner preferences for the Sulti AI chat + voice agents.
//
// Stored on the device so the setting applies without a schema migration. The
// store is a tiny external store so every mounted hub re-renders when the
// learner changes an option.

import { useSyncExternalStore } from 'react';

export type VoiceReplyMode = 'auto' | 'confirm';

export interface AiPreferences {
  /**
   * `auto`   — submit the learner's turn as soon as they stop talking.
   * `confirm` — show the transcript first; the learner taps Send.
   */
  voiceReplyMode: VoiceReplyMode;
  /**
   * Speak/print the English translation after every target-language line and
   * show key vocabulary with English meanings.
   */
  bilingualReplies: boolean;
}

const STORAGE_KEY = 'sultiai_ai_preferences_v1';

export const DEFAULT_AI_PREFERENCES: AiPreferences = {
  voiceReplyMode: 'auto',
  bilingualReplies: true,
};

const listeners = new Set<() => void>();

function load(): AiPreferences {
  if (typeof window === 'undefined') return DEFAULT_AI_PREFERENCES;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_AI_PREFERENCES;
    const parsed = JSON.parse(raw) as Partial<AiPreferences> | null;
    return {
      voiceReplyMode: parsed?.voiceReplyMode === 'confirm' ? 'confirm' : 'auto',
      bilingualReplies: parsed?.bilingualReplies !== false,
    };
  } catch {
    return DEFAULT_AI_PREFERENCES;
  }
}

let snapshot: AiPreferences = load();

function emit() {
  listeners.forEach((listener) => listener());
}

export function getAiPreferences(): AiPreferences {
  return snapshot;
}

export function updateAiPreferences(patch: Partial<AiPreferences>): AiPreferences {
  snapshot = { ...snapshot, ...patch };
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
    } catch {
      // Storage can be unavailable in private mode; keep the in-memory value.
    }
  }
  emit();
  return snapshot;
}

export function subscribeAiPreferences(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useAiPreferences(): AiPreferences {
  return useSyncExternalStore(subscribeAiPreferences, getAiPreferences, getAiPreferences);
}
