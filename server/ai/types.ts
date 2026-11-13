// Shared types for the SultiAI provider gateway.

export type AgentId = 'jen' | 'adam' | 'gentech' | 'kevin' | 'mika';

export const AGENT_IDS: AgentId[] = ['jen', 'adam', 'gentech', 'kevin', 'mika'];

export type LlmProvider = 'groq' | 'openrouter' | 'nvidia' | 'gemini';

export type AiMode = 'chat' | 'voice' | 'tts' | 'stt' | 'evaluation' | 'media';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ProviderAccount {
  /** Stable id, e.g. `openrouter:primary`. Used for cooldowns + telemetry. */
  id: string;
  provider: LlmProvider;
  /** Env var name that holds the secret (never the secret itself). */
  keyAlias: string;
  apiKey: string;
  baseUrl: string;
  model: string;
}

export interface ChatOptions {
  agentId: AgentId;
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  jsonMode?: boolean;
  timeoutMs?: number;
  cache?: boolean;
  /** Learner whose wallet is charged — attributes usage telemetry. */
  userId?: string | null;
  /** Logical mode for telemetry (chat, voice, evaluation, media). */
  mode?: AiMode;
  /** Tokens charged to the learner (recorded in usage events). */
  tokensCharged?: number;
}

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}

export interface ChatResult {
  content: string;
  provider: LlmProvider;
  model: string;
  keyAlias: string;
  usage: TokenUsage;
  cached: boolean;
  latencyMs: number;
  attempts: number;
}

export interface UsageEvent {
  userId?: string | null;
  agentId?: string | null;
  mode: AiMode;
  provider?: string | null;
  model?: string | null;
  keyAlias?: string | null;
  inputTokens?: number;
  outputTokens?: number;
  units?: number;
  tokensCharged?: number;
  latencyMs?: number;
  cached?: boolean;
  ok?: boolean;
  error?: string | null;
}

export interface AiSettings {
  freeMonthlyTokens: number;
  costChatTurn: number;
  costVoiceMinute: number;
  costTts1kChars: number;
  costSttMinute: number;
  rateLimitPerMin: number;
  providerChains: Partial<Record<AgentId, LlmProvider[]>>;
}

export interface TokenWallet {
  userId: string;
  planId: string;
  balance: number;
  lifetimeGranted: number;
  lifetimeSpent: number;
  periodStart: string;
  periodEnd: string;
  updatedAt: string;
}

export class ProviderError extends Error {
  attempts: number;
  lastProvider?: string;
  constructor(message: string, attempts: number, lastProvider?: string) {
    super(message);
    this.name = 'ProviderError';
    this.attempts = attempts;
    this.lastProvider = lastProvider;
  }
}

export class InsufficientTokensError extends Error {
  balance: number;
  required: number;
  constructor(balance: number, required: number) {
    super('INSUFFICIENT_TOKENS');
    this.name = 'InsufficientTokensError';
    this.balance = balance;
    this.required = required;
  }
}
