// Gemini adapter — kept as the last-resort provider and the only one that can
// do Google Search / Maps grounding. Uses the official @google/genai SDK.

import { GoogleGenAI } from '@google/genai';
import type { ChatMessage, ProviderAccount, TokenUsage } from '../types';
import { ProviderHttpError } from './chat';

let client: GoogleGenAI | null = null;
let clientKey = '';

function getClient(apiKey: string): GoogleGenAI {
  if (!client || clientKey !== apiKey) {
    client = new GoogleGenAI({
      apiKey,
      httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
    });
    clientKey = apiKey;
  }
  return client;
}

function estimateTokens(text: string): number {
  return Math.max(1, Math.ceil(text.length / 4));
}

export interface GeminiCompletion {
  content: string;
  usage: TokenUsage;
  model: string;
}

export async function geminiChat(
  account: ProviderAccount,
  messages: ChatMessage[],
  options: { temperature?: number; maxTokens?: number; jsonMode?: boolean; timeoutMs?: number } = {}
): Promise<GeminiCompletion> {
  const { temperature = 0.7, maxTokens = 1200, jsonMode = false, timeoutMs = 20000 } = options;

  const system = messages
    .filter((m) => m.role === 'system')
    .map((m) => m.content)
    .join('\n\n');
  const contents = messages
    .filter((m) => m.role !== 'system')
    .map((m) => (m.role === 'assistant' ? `Assistant: ${m.content}` : m.content))
    .join('\n\n');

  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new ProviderHttpError(`Gemini timed out after ${timeoutMs}ms`, 504)), timeoutMs)
  );

  try {
    const response = await Promise.race([
      getClient(account.apiKey).models.generateContent({
        model: account.model,
        contents,
        config: {
          temperature,
          maxOutputTokens: maxTokens,
          ...(system ? { systemInstruction: system } : {}),
          ...(jsonMode ? { responseMimeType: 'application/json' } : {}),
        },
      }),
      timeout,
    ]);

    const content = response.text || '';
    if (!content.trim()) {
      throw new ProviderHttpError('Gemini returned an empty completion', 502);
    }

    const usageMeta = response.usageMetadata;
    const usage: TokenUsage = {
      inputTokens: usageMeta?.promptTokenCount ?? estimateTokens(contents + system),
      outputTokens: usageMeta?.candidatesTokenCount ?? estimateTokens(content),
      totalTokens:
        usageMeta?.totalTokenCount ??
        (usageMeta?.promptTokenCount ?? 0) + (usageMeta?.candidatesTokenCount ?? 0),
    };

    return { content, usage, model: account.model };
  } catch (error: any) {
    if (error instanceof ProviderHttpError) throw error;
    throw new ProviderHttpError(error?.message || 'Gemini request failed', 502);
  }
}
