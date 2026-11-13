// Learner-created Sulti AI coaches (bots).
//
// Custom bots are stored on this device, so no database migration is required
// and nothing is shared between accounts. They borrow a built-in ElevenLabs
// voice but keep their own name, personality, greeting and scenarios.

import { useSyncExternalStore } from 'react';
import { AI_COACHES } from '../data/aiCoachesData';
import type { AiCoach, BaseVoiceId, CoachScope, MajorAiLanguage } from '../types/aiHub';

const STORAGE_KEY = 'sultiai_custom_agents_v1';
const MAX_CUSTOM_BOTS = 12;

export const CUSTOM_AVATARS = [
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=260&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=260&q=80',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=260&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=260&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=260&q=80',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=260&q=80',
  'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=260&q=80',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=260&q=80',
];

export const CUSTOM_VOICES: { id: BaseVoiceId; label: string; hint: string }[] = [
  { id: 'jen', label: 'Jen', hint: 'Warm female · Bisaya friendly' },
  { id: 'adam', label: 'Adam', hint: 'Confident male · professional' },
  { id: 'gentech', label: 'GenTech', hint: 'Clear male · technical' },
  { id: 'kevin', label: 'Kevin', hint: 'Casual male · everyday banter' },
  { id: 'mika', label: 'Mika', hint: 'Bright female · Filipino' },
];

export const CUSTOM_ACCENTS = ['#00B8A9', '#3B82F6', '#8B5CF6', '#F59E0B', '#EC4899', '#10B981'];

export const CUSTOM_FLAGS = ['🇵🇭', '🌏', '☕', '💼', '⚡', '🎭', '🧑‍🏫', '🏝️'];

export const LANGUAGE_OPTIONS: { id: MajorAiLanguage; label: string }[] = [
  { id: 'cebuano', label: 'Bisaya / Cebuano' },
  { id: 'filipino', label: 'Filipino / Tagalog' },
  { id: 'english', label: 'English' },
];

const listeners = new Set<() => void>();

function cleanText(value: unknown, max: number): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function normaliseLanguage(value: unknown): MajorAiLanguage {
  return value === 'filipino' || value === 'english' ? value : 'cebuano';
}

function normaliseCoach(raw: any): AiCoach | null {
  if (!raw || typeof raw.id !== 'string' || !raw.id.startsWith('custom_')) return null;
  const name = cleanText(raw.name, 50);
  if (!name) return null;

  const languages = Array.isArray(raw.supportedLanguages)
    ? (raw.supportedLanguages as unknown[])
        .filter(
          (value): value is MajorAiLanguage =>
            value === 'cebuano' || value === 'filipino' || value === 'english'
        )
        .slice(0, 3)
    : [];
  const supportedLanguages: MajorAiLanguage[] =
    languages.length > 0 ? [...new Set(languages)] : ['cebuano', 'english'];

  const primaryLanguage = normaliseLanguage(raw.primaryLanguage);
  if (!supportedLanguages.includes(primaryLanguage)) supportedLanguages.unshift(primaryLanguage);

  const scope: CoachScope =
    raw.scope === 'chat' || raw.scope === 'voice' ? raw.scope : 'both';
  const voiceAgentId: BaseVoiceId =
    CUSTOM_VOICES.some((voice) => voice.id === raw.voiceAgentId)
      ? (raw.voiceAgentId as BaseVoiceId)
      : 'jen';

  const persona = cleanText(raw.persona ?? raw.systemPromptIntro, 900);
  const greetingText = cleanText(raw.greetingMessage?.text, 400);
  const greetingTranslation = cleanText(raw.greetingMessage?.translation, 400);
  const practiceExamples = Array.isArray(raw.practiceExamples)
    ? raw.practiceExamples
        .map((item: unknown) => cleanText(item, 140))
        .filter(Boolean)
        .slice(0, 8)
    : [];

  return {
    id: raw.id,
    name,
    role: cleanText(raw.role, 60) || 'Language Coach',
    specialty: cleanText(raw.specialty, 90) || 'Personalised conversation practice',
    tagline: cleanText(raw.tagline, 140),
    description:
      cleanText(raw.description, 280) ||
      persona ||
      'Your own Sulti AI coach for friendly, focused speaking practice.',
    avatar:
      typeof raw.avatar === 'string' && raw.avatar.startsWith('https://')
        ? raw.avatar
        : CUSTOM_AVATARS[0],
    flag: cleanText(raw.flag, 8) || '🇵🇭',
    accentColor: /^#[0-9a-f]{6}$/i.test(raw.accentColor) ? raw.accentColor : CUSTOM_ACCENTS[0],
    supportedLanguages,
    primaryLanguage,
    recommendedCategories: [],
    practiceExamples:
      practiceExamples.length > 0
        ? practiceExamples
        : ['Free conversation practice with your own coach'],
    systemPromptIntro:
      persona ||
      `You are "${name}", a friendly ${primaryLanguage} language coach created by the learner.`,
    greetingMessage: {
      text: greetingText || 'Kumusta! Andam na ba ka magpraktis uban kanako?',
      translation: greetingTranslation || 'Hello! Are you ready to practise with me?',
      language: primaryLanguage,
    },
    isCustom: true,
    scope,
    voiceAgentId,
    persona,
    createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : new Date().toISOString(),
  };
}

function load(): AiCoach[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .slice(0, MAX_CUSTOM_BOTS)
      .map(normaliseCoach)
      .filter((coach): coach is AiCoach => Boolean(coach));
  } catch {
    return [];
  }
}

let snapshot: AiCoach[] = load();

function persist(next: AiCoach[]) {
  snapshot = next;
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Private mode: keep the in-memory list.
    }
  }
  listeners.forEach((listener) => listener());
}

export function subscribeCustomCoaches(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getCustomCoaches(): AiCoach[] {
  return snapshot;
}

export function getCustomCoach(id: string): AiCoach | null {
  return snapshot.find((coach) => coach.id === id) || null;
}

export function createCustomCoachId(): string {
  return `custom_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

export function isCustomCoachId(id: string): boolean {
  return typeof id === 'string' && id.startsWith('custom_');
}

/** Insert or update a custom bot. Returns the stored record. */
export function saveCustomCoach(coach: AiCoach): AiCoach {
  const normalised = normaliseCoach({ ...coach, isCustom: true, scope: coach.scope || 'both' });
  if (!normalised) throw new Error('A bot needs a name before it can be saved.');

  const exists = snapshot.some((entry) => entry.id === normalised.id);
  if (!exists && snapshot.length >= MAX_CUSTOM_BOTS) {
    throw new Error(`You can keep up to ${MAX_CUSTOM_BOTS} custom bots on this device.`);
  }

  const next = exists
    ? snapshot.map((entry) => (entry.id === normalised.id ? normalised : entry))
    : [normalised, ...snapshot];
  persist(next);
  return normalised;
}

export function deleteCustomCoach(id: string): void {
  persist(snapshot.filter((coach) => coach.id !== id));
}

/** Resolve any coach id, including a learner-created bot. */
export function resolveCoach(id: string): AiCoach {
  return (
    getCustomCoach(id) ||
    AI_COACHES.find((coach) => coach.id === id) ||
    AI_COACHES[0]
  );
}

export function useCustomCoaches(): AiCoach[] {
  return useSyncExternalStore(subscribeCustomCoaches, getCustomCoaches, getCustomCoaches);
}

/** Built-in + custom coaches that belong on a given Sulti surface. */
export function coachesForSurface(surface: 'chat' | 'voice'): AiCoach[] {
  const custom = snapshot.filter(
    (coach) => coach.scope === 'both' || coach.scope === surface
  );
  return [...AI_COACHES, ...custom];
}
