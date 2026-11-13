// Provider router: per-character failover with cooldowns and caching.
//
// Order for each coach comes from `ai_settings.provider_chains` (admin-editable)
// and falls back to the built-in defaults in `config.ts`.

import { cacheKey, getCached, setCached } from './cache';
import { DEFAULT_PROVIDER_CHAINS, providerAccounts } from './config';
import { openAiChat, ProviderHttpError } from './providers/chat';
import { geminiChat } from './providers/gemini';
import { getAiSettings, recordUsage } from './tokens';
import type { AgentId, ChatOptions, ChatResult, LlmProvider, ProviderAccount } from './types';
import { ProviderError } from './types';

const COOLDOWN_MS = 60_000;
const cooldowns = new Map<string, number>();

function inCooldown(accountId: string): boolean {
  const until = cooldowns.get(accountId);
  if (!until) return false;
  if (until <= Date.now()) {
    cooldowns.delete(accountId);
    return false;
  }
  return true;
}

function cool(accountId: string, status?: number) {
  // Auth/quota failures get the full minute; transient errors a shorter break.
  const duration = status === 401 || status === 403 || status === 429 ? COOLDOWN_MS : COOLDOWN_MS / 2;
  cooldowns.set(accountId, Date.now() + duration);
}

export function providerHealth() {
  const now = Date.now();
  return [...cooldowns.entries()]
    .filter(([, until]) => until > now)
    .map(([accountId, until]) => ({ accountId, cooldownMs: until - now }));
}

function normalizeForCache(messages: ChatOptions['messages']) {
  return messages.map((m) => ({ role: m.role, content: m.content.trim().replace(/\s+/g, ' ') }));
}

export async function chatComplete(options: ChatOptions): Promise<ChatResult> {
  const startedAt = Date.now();
  const settings = await getAiSettings();
  const chain: LlmProvider[] =
    (settings.providerChains?.[options.agentId] as LlmProvider[] | undefined) ||
    DEFAULT_PROVIDER_CHAINS[options.agentId] ||
    ['groq', 'openrouter', 'nvidia', 'gemini'];

  const shouldCache = options.cache !== false && (options.temperature ?? 0.7) <= 0.85;
  const key = cacheKey({
    v: 1,
    agent: options.agentId,
    messages: normalizeForCache(options.messages),
    temperature: Math.round((options.temperature ?? 0.7) * 100) / 100,
    json: Boolean(options.jsonMode),
    max: options.maxTokens ?? 1200,
  });

  if (shouldCache) {
    const hit = await getCached<ChatResult>(key, 'chat');
    if (hit) {
      void recordUsage({
        userId: options.userId ?? null,
        agentId: options.agentId,
        mode: options.mode || 'chat',
        provider: hit.provider,
        model: hit.model,
        keyAlias: hit.keyAlias,
        inputTokens: hit.usage?.inputTokens,
        outputTokens: hit.usage?.outputTokens,
        latencyMs: Date.now() - startedAt,
        cached: true,
        ok: true,
      });
      return { ...hit, cached: true, latencyMs: Date.now() - startedAt };
    }
  }

  let attempts = 0;
  const failures: { account: string; message: string; status?: number }[] = [];

  for (const provider of chain) {
    const accounts = providerAccounts(provider, options.agentId).filter((a) => !inCooldown(a.id));
    // Gemini needs a key before it can be tried; providerAccounts already
    // returns [] when unconfigured.
    for (const account of accounts) {
      attempts += 1;
      try {
        const result = await callProvider(account, options);
        const payload: ChatResult = {
          content: result.content,
          provider: account.provider,
          model: result.model,
          keyAlias: account.keyAlias,
          usage: result.usage,
          cached: false,
          latencyMs: Date.now() - startedAt,
          attempts,
        };

        void recordUsage({
          userId: options.userId ?? null,
          agentId: options.agentId,
          mode: options.mode || 'chat',
          provider: payload.provider,
          model: payload.model,
          keyAlias: payload.keyAlias,
          inputTokens: payload.usage.inputTokens,
          outputTokens: payload.usage.outputTokens,
          latencyMs: payload.latencyMs,
          cached: false,
          ok: true,
        });

        if (shouldCache) void setCached(key, payload, 'chat');
        return payload;
      } catch (error: any) {
        const status = error instanceof ProviderHttpError ? error.status : undefined;
        cool(account.id, status);
        failures.push({
          account: account.id,
          message: error?.message || String(error),
          status,
        });
      }
    }
  }

  const message = failures.length
    ? failures.map((f) => `${f.account}: ${f.message}`).join(' | ')
    : 'No AI provider is configured';

  void recordUsage({
    userId: options.userId ?? null,
    agentId: options.agentId,
    mode: options.mode || 'chat',
    provider: failures.at(-1)?.account,
    ok: false,
    error: message.slice(0, 500),
    latencyMs: Date.now() - startedAt,
  });

  throw new ProviderError(message, attempts, failures.at(-1)?.account);
}

async function callProvider(account: ProviderAccount, options: ChatOptions) {
  const common = {
    temperature: options.temperature,
    maxTokens: options.maxTokens,
    jsonMode: options.jsonMode,
    timeoutMs: options.timeoutMs,
  };
  if (account.provider === 'gemini') {
    return geminiChat(account, options.messages, common);
  }
  return openAiChat(account, options.messages, common);
}

/**
 * Chat + strict JSON parse. Retries once with a repair instruction when the
 * model wraps its JSON in prose or markdown fences.
 */
export async function chatJson<T>(options: ChatOptions): Promise<{ data: T; result: ChatResult }> {
  const first = await chatComplete({ ...options, jsonMode: true });
  const parsed = parseJsonLoose<T>(first.content);
  if (parsed !== null) return { data: parsed, result: first };

  const repair = await chatComplete({
    ...options,
    cache: false,
    jsonMode: false,
    messages: [
      ...options.messages,
      { role: 'assistant', content: first.content.slice(0, 4000) },
      {
        role: 'user',
        content:
          'The previous reply was not valid JSON. Reply with ONLY the JSON object, no markdown fences, no commentary.',
      },
    ],
  });
  const repaired = parseJsonLoose<T>(repair.content);
  if (repaired === null) {
    throw new ProviderError('Model did not return valid JSON after repair attempt', 2, repair.provider);
  }
  return { data: repaired, result: repair };
}

function parseJsonLoose<T>(raw: string): T | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  const candidates = [trimmed];

  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) candidates.push(fenced[1].trim());

  const firstBrace = trimmed.indexOf('{');
  const lastBrace = trimmed.lastIndexOf('}');
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    candidates.push(trimmed.slice(firstBrace, lastBrace + 1));
  }

  for (const candidate of candidates) {
    try {
      return JSON.parse(candidate) as T;
    } catch {
      // Try the next shape.
    }
  }
  return null;
}

export function resetCooldowns() {
  cooldowns.clear();
}

export function agentChain(agentId: AgentId): LlmProvider[] {
  return DEFAULT_PROVIDER_CHAINS[agentId] || [];
}
