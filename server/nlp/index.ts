// Public NLP surface for SultiAI.
//
// `analyzeLocal` is the synchronous, dependency-free TF-IDF/rule classifier and
// is always available. `analyzeForChat` adds the local ONNX BERT encoder with a
// short timeout (default 700 ms) so a chat/voice turn never waits on a cold model
// or a hosted service; the offline result is used when BERT is still warming up.
// `analyzeLearnerText` is the diagnostics path: it can wait for BERT and, if the
// local encoder is unavailable, use the optional hosted HF/NVIDIA backends.

import {
  analyzeLocal,
  intentLabel,
  DEFAULT_CONFIDENCE_THRESHOLD,
  INTENTS,
  type IntentId,
  type LocalNlpResult,
} from './intentEngine';
import {
  classifyWithEmbeddings,
  getEmbeddingBackend,
  getEmbeddingBackends,
  type EmbeddingBackend,
  type RemoteIntentResult,
} from './embeddings';
import {
  getLocalBertStatus,
  warmLocalBert,
  type LocalBertStatus,
} from './localBert';

export {
  analyzeLocal,
  intentLabel,
  DEFAULT_CONFIDENCE_THRESHOLD,
  INTENTS,
  getEmbeddingBackend,
  getEmbeddingBackends,
  getLocalBertStatus,
  warmLocalBert,
};
export type { IntentId, LocalNlpResult, EmbeddingBackend, LocalBertStatus };

export type NlpSource = 'local' | 'hybrid' | 'embedding';

export interface BertNlpResult extends Omit<LocalNlpResult, 'engine'> {
  /** e.g. `local-tfidf`, `bert+local+tfidf`, `bert+local`, `bert+hf+tfidf`. */
  engine: string;
  source: NlpSource;
  /** Present only when a transformer encoder answered successfully. */
  remoteModel?: string;
  remoteLatencyMs?: number;
  /** Whether the local and encoder classifiers agreed. */
  remoteAgreement?: boolean;
  /** Honest description of the classifier, e.g. similarity-based (not fine-tuned). */
  classifierMethod?: string;
}

export interface AnalyzeOptions {
  /** Confidence below this value is flagged as low confidence. */
  threshold?: number;
  /**
   * Allow the diagnostics endpoint to wait for encoders. Chat uses
   * `BERT_CHAT_ENABLED`/`BERT_CHAT_TIMEOUT_MS` instead.
   */
  remote?: boolean;
  /** Per-inference timeout passed to the encoder. */
  timeoutMs?: number;
}

export interface NlpStatus {
  localBert: LocalBertStatus;
  backends: EmbeddingBackend[];
  /** Engine used for the next analysis when the local encoder is ready. */
  activeEngine: string;
  /** Engine that actually produced the most recent result. */
  lastEngine: string;
  offlineFallback: boolean;
  intents: number;
  localClassifier: string;
  remoteConfigured: boolean;
  classifierMethod: string;
  note: string;
}

let lastEngine = 'local-tfidf';

function engineName(source: NlpSource, backendId?: string): string {
  if (source === 'local') return 'local-tfidf';
  const remote =
    backendId === 'local_bert'
      ? 'bert+local'
      : backendId === 'huggingface_bert'
        ? 'bert+hf'
        : backendId === 'nvidia_embed'
          ? 'transformer+nvidia'
          : 'transformer';
  return source === 'hybrid' ? `${remote}+tfidf` : remote;
}

function mergeAlternatives(
  predicted: IntentId,
  confidence: number,
  local: LocalNlpResult,
  remoteAlternatives?: { intent: IntentId; confidence: number }[]
): { intent: IntentId; confidence: number }[] {
  const merged = new Map<IntentId, number>();
  merged.set(predicted, confidence);
  for (const entry of [local.alternatives[0], ...(remoteAlternatives || []), ...local.alternatives]) {
    if (!entry) continue;
    if (entry.intent === predicted) continue;
    merged.set(entry.intent, Math.max(merged.get(entry.intent) || 0, entry.confidence));
  }
  return [...merged.entries()]
    .map(([intent, value]) => ({ intent, confidence: Math.round(value * 1000) / 1000 }))
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 3);
}

function localResult(local: LocalNlpResult, startedAt: number): BertNlpResult {
  const latencyMs = Math.round((performance.now() - startedAt) * 100) / 100;
  lastEngine = 'local-tfidf';
  return {
    ...local,
    engine: 'local-tfidf',
    source: 'local',
    latencyMs,
  };
}

function applyRemote(
  local: LocalNlpResult,
  remote: RemoteIntentResult,
  threshold: number,
  startedAt: number
): BertNlpResult {
  const agreement = remote.intent === local.predictedIntent;
  let predictedIntent = local.predictedIntent;
  let confidence = local.intentConfidence;
  let source: NlpSource = 'hybrid';

  if (agreement) {
    confidence = Math.min(0.99, Math.max(local.intentConfidence, remote.confidence) + 0.06);
  } else if (local.intentConfidence >= 0.9) {
    // Very strong lexical/rule evidence (e.g. "tagpila", "salamat") wins.
    confidence = local.intentConfidence;
  } else if (remote.confidence >= threshold) {
    // BERT is the semantic primary once it is calibrated/confident enough.
    predictedIntent = remote.intent;
    confidence = remote.confidence;
    source = 'embedding';
  } else if (local.intentConfidence >= 0.7) {
    confidence = local.intentConfidence;
  } else if (remote.confidence > local.intentConfidence + 0.05) {
    predictedIntent = remote.intent;
    confidence = remote.confidence;
    source = 'embedding';
  } else {
    confidence = local.intentConfidence;
  }

  confidence = Math.max(0, Math.min(1, confidence));
  const engine = engineName(source, remote.backend.id);
  lastEngine = engine;

  return {
    ...local,
    predictedIntent,
    intentConfidence: Math.round(confidence * 1000) / 1000,
    alternatives: mergeAlternatives(predictedIntent, confidence, local, remote.alternatives),
    lowConfidence: confidence < threshold,
    engine,
    source,
    remoteModel: remote.backend.model,
    remoteLatencyMs: remote.latencyMs,
    remoteAgreement: agreement,
    classifierMethod: remote.method,
    bertModelRef:
      source === 'embedding'
        ? `${remote.backend.label}: ${remote.backend.model}`
        : `${remote.backend.label}: ${remote.backend.model} + offline TF-IDF`,
    latencyMs: Math.round((performance.now() - startedAt) * 100) / 100,
  };
}

/** Resolve with the task result, or null on timeout/rejection. The task keeps running. */
function settleWithin<T>(task: Promise<T>, timeoutMs: number): Promise<T | null> {
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
    return task.catch(() => null);
  }
  return new Promise<T | null>((resolve) => {
    let settled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const finish = (value: T | null) => {
      if (settled) return;
      settled = true;
      if (timer) clearTimeout(timer);
      resolve(value);
    };
    timer = setTimeout(() => finish(null), timeoutMs);
    task.then(
      (value) => finish(value),
      () => finish(null)
    );
  });
}

/**
 * Fast path for `/api/sulti/chat` and the voice agent. Tries the local ONNX
 * encoder first, but never waits longer than BERT_CHAT_TIMEOUT_MS (default 700).
 * The model/centroid build continues in the background after a timeout, so a
 * later turn uses BERT. Hosted encoders are not used here unless explicitly
 * enabled with BERT_CHAT_REMOTE_FALLBACK=true.
 */
export async function analyzeForChat(
  text: string,
  options: AnalyzeOptions = {}
): Promise<BertNlpResult> {
  const startedAt = performance.now();
  const threshold = options.threshold ?? DEFAULT_CONFIDENCE_THRESHOLD;
  const local = analyzeLocal(text, { threshold });
  const chatEnabled = (process.env.BERT_CHAT_ENABLED || 'true').trim().toLowerCase() !== 'false';
  if (!chatEnabled) return localResult(local, startedAt);

  const timeoutMs =
    options.timeoutMs ?? (Number(process.env.BERT_CHAT_TIMEOUT_MS) || 700);
  const localOnly = (process.env.BERT_CHAT_REMOTE_FALLBACK || 'false').trim().toLowerCase() !== 'true';

  const remote = await settleWithin(
    classifyWithEmbeddings(text, { timeoutMs, localOnly }),
    timeoutMs
  );
  if (!remote) return localResult(local, startedAt);
  return applyRemote(local, remote, threshold, startedAt);
}

/**
 * Diagnostics path used by `/api/sulti/bert-analyze`. It can wait for the local
 * model and, if that is unavailable, fall through to hosted HF/NVIDIA encoders.
 */
export async function analyzeLearnerText(
  text: string,
  options: AnalyzeOptions = {}
): Promise<BertNlpResult> {
  const startedAt = performance.now();
  const threshold = options.threshold ?? DEFAULT_CONFIDENCE_THRESHOLD;
  const local = analyzeLocal(text, { threshold });

  if (options.remote === false || getEmbeddingBackends().length === 0) {
    return localResult(local, startedAt);
  }

  const remote = await classifyWithEmbeddings(text, {
    timeoutMs: options.timeoutMs ?? (Number(process.env.BERT_ANALYZE_TIMEOUT_MS) || undefined),
  });
  if (!remote) return localResult(local, startedAt);
  return applyRemote(local, remote, threshold, startedAt);
}

/**
 * Capability/status probe. It reports `loaded` only after the ONNX session and
 * tokenizer actually loaded; merely having HF_TOKEN or model files is not
 * enough to call BERT active.
 */
export function getNlpStatus(): NlpStatus {
  const localBert = getLocalBertStatus();
  const backends = getEmbeddingBackends();
  const remoteConfigured = backends.some((backend) => backend.id !== 'local_bert');
  const activeEngine = localBert.loaded ? 'bert+local' : 'local-tfidf';

  return {
    localBert,
    backends,
    activeEngine,
    lastEngine,
    offlineFallback: true,
    intents: INTENTS.length,
    localClassifier: 'sulti-nlp-intent-v1 (tfidf + rules)',
    remoteConfigured,
    classifierMethod: localBert.loaded
      ? 'frozen-bert-mean-pooling-cosine (not fine-tuned)'
      : 'tfidf-cosine (offline)',
    note: localBert.loaded
      ? 'Real local BERT weights are loaded. Intent classification is similarity-based, not fine-tuned.'
      : localBert.available
        ? 'Local BERT files are present but the encoder is not loaded yet. It loads on the first /api/sulti/bert-analyze call or during warmup.'
        : 'Local BERT files are not installed. The offline TF-IDF/rule classifier is active; hosted encoders are optional.',
  };
}
