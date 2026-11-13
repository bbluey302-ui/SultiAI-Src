// Central configuration for AI providers.
//
// SECURITY: every secret here is read from the server process environment at
// call time. Nothing in this file is imported by the browser bundle.

import type { AgentId, AiSettings, LlmProvider, ProviderAccount } from './types';

const DEFAULT_CHAINS: Record<AgentId, LlmProvider[]> = {
  // Bisaya coach leans on Groq for fast, cheap turns.
  jen: ['groq', 'openrouter', 'nvidia', 'gemini'],
  // Interview coach needs the strongest English reasoning first.
  adam: ['openrouter', 'nvidia', 'groq', 'gemini'],
  // Technical coach gets the NVIDIA reasoning slot.
  gentech: ['nvidia', 'openrouter', 'groq', 'gemini'],
  // Everyday banter is latency sensitive.
  kevin: ['groq', 'nvidia', 'openrouter', 'gemini'],
  // Filipino coach shares the second OpenRouter account.
  mika: ['openrouter', 'groq', 'nvidia', 'gemini'],
};

const DEFAULT_SETTINGS: AiSettings = {
  freeMonthlyTokens: 5000,
  costChatTurn: 1,
  costVoiceMinute: 25,
  costTts1kChars: 5,
  costSttMinute: 10,
  rateLimitPerMin: 30,
  providerChains: DEFAULT_CHAINS,
};

export const DEFAULT_AI_SETTINGS: AiSettings = DEFAULT_SETTINGS;
export const DEFAULT_PROVIDER_CHAINS = DEFAULT_CHAINS;

function env(key: string, fallback = ''): string {
  return (process.env[key] || fallback).trim();
}

function num(key: string, fallback: number): number {
  const parsed = Number(process.env[key]);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function providerModel(provider: LlmProvider): string {
  switch (provider) {
    case 'groq':
      return env('GROQ_MODEL', 'openai/gpt-oss-120b');
    case 'openrouter':
      return env('OPENROUTER_MODEL', 'google/gemma-4-26b-a4b-it:free');
    case 'nvidia':
      return env('NVIDIA_MODEL', 'z-ai/glm-5.3-flash');
    case 'gemini':
      return env('GEMINI_MODEL', 'gemini-3.8-flash');
  }
}

/**
 * Every credential slot for a provider. Two OpenRouter keys are two separate
 * accounts, so they are treated as independent quota slots.
 *
 * Per-character slots can be added with e.g. `OPENROUTER_KEY_JEN`; when absent
 * the shared slots are used. This keeps the app working with a single key while
 * letting an operator give each coach its own budget.
 */
export function providerAccounts(provider: LlmProvider, agentId: AgentId): ProviderAccount[] {
  const upper = agentId.toUpperCase();
  const accounts: ProviderAccount[] = [];

  const push = (suffix: string, apiKey: string, baseUrl: string) => {
    if (!apiKey) return;
    accounts.push({
      id: `${provider}:${suffix.toLowerCase()}`,
      provider,
      keyAlias: suffix,
      apiKey,
      baseUrl,
      model: providerModel(provider),
    });
  };

  if (provider === 'groq') {
    const baseUrl = env('GROQ_BASE_URL', 'https://api.groq.com/openai/v1');
    push(`GROQ_KEY_${upper}`, env(`GROQ_KEY_${upper}`), baseUrl);
    push('GROQ_API_KEY', env('GROQ_API_KEY'), baseUrl);
    push('GROQ_API_KEY_2', env('GROQ_API_KEY_2'), baseUrl);
    return accounts;
  }

  if (provider === 'openrouter') {
    const baseUrl = env('OPENROUTER_BASE_URL', 'https://openrouter.ai/api/v1');
    push(`OPENROUTER_KEY_${upper}`, env(`OPENROUTER_KEY_${upper}`), baseUrl);
    // Deterministic spread across the two shared accounts so one budget is not
    // drained first.
    const preferSecond = agentId === 'jen' || agentId === 'gentech';
    const first = env('OPENROUTER_API_KEY');
    const second = env('OPENROUTER_API_KEY_2');
    const order = preferSecond ? [second, first] : [first, second];
    order.forEach((key, index) => {
      push(index === 0 ? 'OPENROUTER_API_KEY' : 'OPENROUTER_API_KEY_2', key, baseUrl);
    });
    return accounts;
  }

  if (provider === 'nvidia') {
    const baseUrl = env('NVIDIA_BASE_URL', 'https://integrate.api.nvidia.com/v1');
    push(`NVIDIA_KEY_${upper}`, env(`NVIDIA_KEY_${upper}`), baseUrl);
    push('NVIDIA_API_KEY', env('NVIDIA_API_KEY'), baseUrl);
    return accounts;
  }

  // Gemini is handled by the Google SDK, not the OpenAI-compatible client.
  const geminiKey = env('GEMINI_API_KEY');
  if (geminiKey) {
    accounts.push({
      id: 'gemini:primary',
      provider: 'gemini',
      keyAlias: 'GEMINI_API_KEY',
      apiKey: geminiKey,
      baseUrl: '',
      model: providerModel('gemini'),
    });
  }
  return accounts;
}

export function elevenLabsKey(agentId: AgentId): string {
  return env(`ELEVENLABS_KEY_${agentId.toUpperCase()}`) || env('ELEVENLABS_API_KEY');
}

export function elevenLabsKeyAlias(agentId: AgentId): string {
  return env(`ELEVENLABS_KEY_${agentId.toUpperCase()}`)
    ? `ELEVENLABS_KEY_${agentId.toUpperCase()}`
    : 'ELEVENLABS_API_KEY';
}

/**
 * Premade ElevenLabs voice ids used until an operator provisions a custom one.
 * Verified against a free-tier account: library-locked voices (Rachel, Josh,
 * Elli, Domi…) return HTTP 402 there, so only free-usable ids are defaults.
 */
const DEFAULT_VOICE_IDS: Record<AgentId, string> = {
  jen: 'EXAVITQu4vr4xnSDxMaL', // Sarah — warm female
  adam: 'pNInz6obpgDQGcFmaJgB', // Adam — confident male
  gentech: 'ErXwobaYiN019PkySvjV', // Antoni — clear male
  kevin: 'iP95p4xoKVk53GoZ742B', // Chris — casual male
  mika: 'Xb7hH8MSUJpSbSDYk0k2', // Alice — bright female
};

/** Free-tier-safe fallbacks if the configured voice is library-locked (402). */
export const VOICE_FALLBACKS: Record<AgentId, string[]> = {
  jen: ['EXAVITQu4vr4xnSDxMaL', 'Xb7hH8MSUJpSbSDYk0k2', 'pFZP5JQG7iQjIQuC4Bku'],
  adam: ['pNInz6obpgDQGcFmaJgB', 'onwK4e9ZLuTAKqWW03F9', 'JBFqnCBsd6RMkjVDRZzb'],
  gentech: ['ErXwobaYiN019PkySvjV', 'onwK4e9ZLuTAKqWW03F9', 'pNInz6obpgDQGcFmaJgB'],
  kevin: ['iP95p4xoKVk53GoZ742B', 'onwK4e9ZLuTAKqWW03F9', 'JBFqnCBsd6RMkjVDRZzb'],
  mika: ['Xb7hH8MSUJpSbSDYk0k2', 'pFZP5JQG7iQjIQuC4Bku', 'EXAVITQu4vr4xnSDxMaL'],
};

export function elevenLabsVoiceId(agentId: AgentId, language: string): string {
  const lang = (language || 'english').toLowerCase();
  const suffix = lang === 'cebuano' || lang === 'bisaya' ? 'CEBUANO' : lang === 'filipino' ? 'FILIPINO' : 'ENGLISH';
  const specific = env(`ELEVENLABS_VOICE_${agentId.toUpperCase()}_${suffix}`);
  if (specific) return specific;
  const perAgent = env(`ELEVENLABS_VOICE_${agentId.toUpperCase()}`);
  if (perAgent) return perAgent;
  return DEFAULT_VOICE_IDS[agentId];
}

export function elevenLabsTtsModel(language: string): string {
  const lang = (language || '').toLowerCase();
  if (lang === 'english') return env('ELEVENLABS_TTS_MODEL_EN', env('ELEVENLABS_TTS_MODEL', 'eleven_turbo_v2_5'));
  return env('ELEVENLABS_TTS_MODEL', 'eleven_multilingual_v2');
}

export function elevenLabsSttModel(): string {
  return env('ELEVENLABS_STT_MODEL', 'scribe_v1');
}

export function envNumber(key: string, fallback: number): number {
  return num(key, fallback);
}

export function isElevenLabsConfigured(): boolean {
  return Boolean(env('ELEVENLABS_KEY_JEN') || env('ELEVENLABS_API_KEY'));
}
