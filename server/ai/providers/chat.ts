// OpenAI-compatible chat client used by Groq, OpenRouter and NVIDIA NIM.
// One implementation, three base URLs — no provider SDK required.

import type { ChatMessage, ProviderAccount, TokenUsage } from '../types';

export interface OpenAICompletion {
  content: string;
  usage: TokenUsage;
  model: string;
}

interface CompletionChoice {
  message?: { content?: string | null };
  finish_reason?: string;
}

interface CompletionBody {
  choices?: CompletionChoice[];
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
  model?: string;
  error?: { message?: string; code?: string | number; type?: string };
}

export class ProviderHttpError extends Error {
  status: number;
  retryable: boolean;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ProviderHttpError';
    this.status = status;
    // 408/409/429 and 5xx are worth retrying on another account/provider.
    this.retryable = status === 408 || status === 409 || status === 429 || status >= 500;
  }
}

function estimateTokens(text: string): number {
  return Math.max(1, Math.ceil(text.length / 4));
}

function estimateUsage(messages: ChatMessage[], content: string): TokenUsage {
  const input = messages.reduce((sum, m) => sum + estimateTokens(m.content) + 4, 0);
  const output = estimateTokens(content);
  return { inputTokens: input, outputTokens: output, totalTokens: input + output };
}

export async function openAiChat(
  account: ProviderAccount,
  messages: ChatMessage[],
  options: {
    temperature?: number;
    maxTokens?: number;
    jsonMode?: boolean;
    timeoutMs?: number;
    extraHeaders?: Record<string, string>;
  } = {}
): Promise<OpenAICompletion> {
  const { temperature = 0.7, maxTokens = 1200, jsonMode = false, timeoutMs = 20000 } = options;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const body: Record<string, unknown> = {
      model: account.model,
      messages,
      temperature,
      max_tokens: maxTokens,
      stream: false,
    };
    if (jsonMode) body.response_format = { type: 'json_object' };

    const res = await fetch(`${account.baseUrl.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${account.apiKey}`,
        'Content-Type': 'application/json',
        ...(account.provider === 'openrouter'
          ? {
              'HTTP-Referer': 'https://sultiai.app',
              'X-Title': 'SultiAI',
            }
          : {}),
        ...options.extraHeaders,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    const text = await res.text();
    let parsed: CompletionBody = {};
    try {
      parsed = text ? (JSON.parse(text) as CompletionBody) : {};
    } catch {
      parsed = {};
    }

    if (!res.ok) {
      const message =
        parsed?.error?.message ||
        (text ? text.slice(0, 200) : '') ||
        `Provider responded with HTTP ${res.status}`;
      throw new ProviderHttpError(message, res.status);
    }

    const content = parsed.choices?.[0]?.message?.content ?? '';
    if (!content.trim()) {
      throw new ProviderHttpError('Provider returned an empty completion', 502);
    }

    const usage: TokenUsage = parsed.usage
      ? {
          inputTokens: parsed.usage.prompt_tokens ?? 0,
          outputTokens: parsed.usage.completion_tokens ?? 0,
          totalTokens:
            parsed.usage.total_tokens ??
            (parsed.usage.prompt_tokens ?? 0) + (parsed.usage.completion_tokens ?? 0),
        }
      : estimateUsage(messages, content);

    return { content, usage, model: parsed.model || account.model };
  } catch (error: any) {
    if (error?.name === 'AbortError') {
      throw new ProviderHttpError(`Provider timed out after ${timeoutMs}ms`, 504);
    }
    if (error instanceof ProviderHttpError) throw error;
    throw new ProviderHttpError(error?.message || 'Network error contacting provider', 502);
  } finally {
    clearTimeout(timer);
  }
}
