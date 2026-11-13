// Multilingual transformer embeddings for the SultiAI NLP pipeline.
//
// Backend order:
//   1. Local ONNX encoder (the real google-bert/bert-base-multilingual-cased
//      base model exported by server/scripts/export-bert-onnx.py). This is the
//      primary path and runs on CPU without a network call.
//   2. Hosted Hugging Face feature-extraction, only when HF_TOKEN is present
//      and BERT_REMOTE_DISABLED is not "true". Some fine-grained tokens are
//      read-only and cannot call Inference Providers; a failure here simply
//      moves to the next backend.
//   3. NVIDIA Nemotron embeddings, using the same NVIDIA_API_KEY as the LLM
//      router, when configured.
//   4. No encoder -> the caller keeps the offline TF-IDF/rule result.
//
// The classifier is similarity-based, not fine-tuned: mean-pooled, L2-normalised
// BERT vectors are compared with the existing labelled exemplars using a blend
// of centroid cosine and nearest-exemplar cosine. The local exemplar vectors and
// centroids are cached on disk so a server restart does not recompute 80 BERT
// forward passes.

import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { INTENTS, INTENT_EXEMPLARS, tokenize, type IntentId } from './intentEngine';
import {
  embedWithLocalBert,
  getLocalModelDir,
  isLocalBertAvailable,
  LOCAL_BERT_MODEL_ID,
} from './localBert';

export interface EmbeddingBackend {
  id: 'local_bert' | 'huggingface_bert' | 'nvidia_embed';
  model: string;
  label: string;
}

interface EmbeddingExample {
  text: string;
  intent: IntentId;
}

export interface RemoteIntentResult {
  intent: IntentId;
  confidence: number;
  alternatives: { intent: IntentId; confidence: number }[];
  backend: EmbeddingBackend;
  latencyMs: number;
  /** Honest description of the classification method. */
  method: string;
}

interface CentroidData {
  key: string;
  centroids: Map<IntentId, number[]>;
  exemplars: Map<IntentId, number[][]>;
}

const BATCH_SIZE = 24;
const RESULT_TTL_MS = 30 * 60 * 1000;
const MAX_CACHE = 500;

// Same exemplars as the local engine, flattened for passage embedding.
const EXEMPLAR_TEXTS: EmbeddingExample[] = INTENTS.flatMap((intent) =>
  INTENT_EXEMPLARS[intent].map((text) => ({ text, intent }))
);

let lastLocalWarningAt = 0;

function warnLocalOnce(message: string): void {
  if (process.env.NODE_ENV === 'test') return;
  if (Date.now() - lastLocalWarningAt < 60_000) return;
  lastLocalWarningAt = Date.now();
  console.warn('[NLP] local BERT inference unavailable:', message);
}

export function getEmbeddingBackends(): EmbeddingBackend[] {
  const backends: EmbeddingBackend[] = [];

  if (isLocalBertAvailable()) {
    backends.push({
      id: 'local_bert',
      model: (process.env.BERT_MODEL_ID || LOCAL_BERT_MODEL_ID).trim(),
      label: 'Local mBERT encoder (ONNX, frozen)',
    });
  }

  if (process.env.BERT_REMOTE_DISABLED === 'true') return backends;

  const hfToken = (process.env.HF_TOKEN || process.env.HUGGINGFACE_API_KEY || '').trim();
  if (hfToken && process.env.BERT_HOSTED_ENABLED !== 'false') {
    backends.push({
      id: 'huggingface_bert',
      model: (process.env.BERT_MODEL_ID || 'google-bert/bert-base-multilingual-cased').trim(),
      label: 'mBERT multilingual encoder (Hugging Face)',
    });
  }

  const nvidiaKey = (process.env.NVIDIA_API_KEY || '').trim();
  if (nvidiaKey && process.env.BERT_NVIDIA_ENABLED !== 'false') {
    backends.push({
      id: 'nvidia_embed',
      model: (process.env.BERT_EMBED_MODEL_ID || 'nvidia/nemotron-3.5-embed-1b').trim(),
      label: 'Nemotron multilingual embeddings (NVIDIA)',
    });
  }

  return backends;
}

/** First configured backend, kept for older callers/status displays. */
export function getEmbeddingBackend(): EmbeddingBackend | null {
  return getEmbeddingBackends()[0] || null;
}

function meanPool(tokenVectors: number[][]): number[] | null {
  if (!Array.isArray(tokenVectors) || tokenVectors.length === 0) return null;
  const first = tokenVectors[0];
  if (!Array.isArray(first) || typeof first[0] !== 'number') return null;
  const width = first.length;
  const out = new Array<number>(width).fill(0);
  let count = 0;
  for (const vector of tokenVectors) {
    if (!Array.isArray(vector) || vector.length !== width) continue;
    count += 1;
    for (let i = 0; i < width; i += 1) out[i] += Number(vector[i]) || 0;
  }
  if (count === 0) return null;
  return out.map((value) => value / count);
}

function l2(vector: number[]): number[] {
  let norm = 0;
  for (const value of vector) norm += value * value;
  const length = Math.sqrt(norm) || 1;
  return vector.map((value) => (Number.isFinite(value) ? value / length : 0));
}

function dot(a: number[], b: number[]): number {
  const limit = Math.min(a.length, b.length);
  let sum = 0;
  for (let i = 0; i < limit; i += 1) sum += a[i] * b[i];
  return sum;
}

async function postJson(url: string, body: unknown, headers: Record<string, string>): Promise<any | null> {
  const controller = new AbortController();
  const timeoutMs = Number(process.env.BERT_EMBED_TIMEOUT_MS) || 9000;
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!response.ok) {
      if (process.env.NODE_ENV !== 'test') {
        console.warn(`[NLP] embedding request failed (${response.status})`);
      }
      return null;
    }
    return await response.json();
  } catch (error: any) {
    if (process.env.NODE_ENV !== 'test' && error?.name !== 'AbortError') {
      console.warn('[NLP] embedding request error:', error?.message || error);
    }
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function embedRemoteBatch(
  config: EmbeddingBackend,
  texts: string[],
  kind: 'query' | 'passage'
): Promise<number[][] | null> {
  if (config.id === 'huggingface_bert') {
    const base = (process.env.HF_INFERENCE_BASE || 'https://api-inference.huggingface.co/models').replace(/\/$/, '');
    const token = (process.env.HF_TOKEN || process.env.HUGGINGFACE_API_KEY || '').trim();
    const json = await postJson(
      `${base}/${config.model}`,
      { inputs: texts, options: { wait_for_model: true } },
      { Authorization: `Bearer ${token}` }
    );
    if (!json) return null;

    // Feature-extraction response: number[][] for one text, number[][][] for a
    // batch. Some deployments return a flat pooled vector instead.
    const rows: any[] = Array.isArray(json) ? json : [];
    if (rows.length === 0) return null;
    if (rows.length !== texts.length) return null;

    const vectors: number[][] = [];
    for (const row of rows) {
      if (Array.isArray(row) && typeof row[0] === 'number') {
        vectors.push(l2(row.map(Number)));
        continue;
      }
      const pooled = meanPool(row as number[][]);
      if (!pooled) return null;
      vectors.push(l2(pooled));
    }
    return vectors;
  }

  const base = (process.env.NVIDIA_BASE_URL || 'https://integrate.api.nvidia.com/v1').replace(/\/$/, '');
  const key = (process.env.NVIDIA_API_KEY || '').trim();
  const json = await postJson(
    `${base}/embeddings`,
    {
      input: texts,
      model: config.model,
      input_type: kind,
      encoding_format: 'float',
    },
    { Authorization: `Bearer ${key}` }
  );
  if (!json || !Array.isArray(json.data)) return null;
  if (json.data.length !== texts.length) return null;

  const vectors: number[][] = [];
  for (const row of json.data) {
    if (!Array.isArray(row?.embedding)) return null;
    vectors.push(l2(row.embedding.map(Number)));
  }
  return vectors;
}

// ONNX Runtime sessions are thread-safe, but serialising local inference keeps
// one chat turn from spawning several CPU-heavy forward passes at once. Remote
// backends stay concurrent.
let localInferenceQueue: Promise<void> = Promise.resolve();

function serialiseLocal<T>(task: () => Promise<T>): Promise<T> {
  const run = localInferenceQueue.then(task, task);
  localInferenceQueue = run.then(
    () => undefined,
    () => undefined
  );
  return run;
}

async function embedBatchFor(
  config: EmbeddingBackend,
  texts: string[],
  kind: 'query' | 'passage',
  timeoutMs?: number
): Promise<number[][] | null> {
  if (config.id === 'local_bert') {
    try {
      return await serialiseLocal(() =>
        embedWithLocalBert(texts, {
          timeoutMs: timeoutMs ?? (Number(process.env.BERT_INFERENCE_TIMEOUT_MS) || 15_000),
        })
      );
    } catch (error: any) {
      warnLocalOnce(error?.message || String(error));
      return null;
    }
  }
  return embedRemoteBatch(config, texts, kind);
}

async function embedAllFor(
  config: EmbeddingBackend,
  texts: string[],
  kind: 'query' | 'passage',
  timeoutMs?: number
): Promise<number[][] | null> {
  if (config.id === 'local_bert') {
    // embedWithLocalBert already batches internally; call it once.
    return embedBatchFor(config, texts, kind, timeoutMs);
  }

  const chunks: string[][] = [];
  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    chunks.push(texts.slice(i, i + BATCH_SIZE));
  }

  const results = await Promise.all(chunks.map((chunk) => embedBatchFor(config, chunk, kind, timeoutMs)));
  if (results.some((vectors) => !vectors)) return null;
  return results.flatMap((vectors) => vectors as number[][]);
}

function centroidKey(config: EmbeddingBackend): string {
  const exemplarSignature = createHash('sha256')
    .update(JSON.stringify(EXEMPLAR_TEXTS))
    .digest('hex')
    .slice(0, 24);
  const localConfig =
    config.id === 'local_bert'
      ? `${(process.env.BERT_DTYPE || 'fp32').trim()}:${process.env.BERT_MAX_LENGTH || '128'}`
      : 'remote';
  return `v1:${config.id}:${config.model}:${localConfig}:${exemplarSignature}`;
}

function centroidCacheFile(): string {
  return path.join(getLocalModelDir(), 'nlp-centroids-v1.json');
}

function readCentroidFile(key: string): CentroidData | null {
  const file = centroidCacheFile();
  if (!existsSync(file)) return null;
  try {
    const parsed = JSON.parse(readFileSync(file, 'utf8'));
    if (parsed?.version !== 1 || parsed?.key !== key) return null;
    if (!parsed.centroids || !parsed.exemplars) return null;

    const centroids = new Map<IntentId, number[]>();
    const exemplars = new Map<IntentId, number[][]>();
    for (const intent of INTENTS) {
      const centroid = parsed.centroids[intent];
      const rows = parsed.exemplars[intent];
      if (!Array.isArray(centroid) || centroid.length === 0) return null;
      if (!Array.isArray(rows) || rows.length === 0) return null;
      if (!rows.every((row: unknown) => Array.isArray(row) && row.length === centroid.length)) return null;
      centroids.set(intent, l2(centroid.map(Number)));
      exemplars.set(intent, rows.map((row: number[]) => l2(row.map(Number))));
    }
    return { key, centroids, exemplars };
  } catch {
    return null;
  }
}

async function writeCentroidFile(config: EmbeddingBackend, key: string, data: CentroidData): Promise<void> {
  if (config.id !== 'local_bert') return;
  try {
    const file = centroidCacheFile();
    await mkdir(path.dirname(file), { recursive: true });
    const payload = {
      version: 1,
      key,
      model: config.model,
      dtype: (process.env.BERT_DTYPE || 'fp32').trim(),
      maxLength: Number(process.env.BERT_MAX_LENGTH) || 128,
      createdAt: new Date().toISOString(),
      centroids: Object.fromEntries(data.centroids),
      exemplars: Object.fromEntries(data.exemplars),
    };
    await writeFile(file, JSON.stringify(payload), 'utf8');
  } catch (error: any) {
    if (process.env.NODE_ENV !== 'test') {
      console.warn('[NLP] could not persist BERT centroid cache:', error?.message || error);
    }
  }
}

let centroidCache: CentroidData | null = null;
let centroidPromise: { key: string; promise: Promise<CentroidData | null> } | null = null;

async function buildCentroids(config: EmbeddingBackend): Promise<CentroidData | null> {
  const key = centroidKey(config);
  const texts = EXEMPLAR_TEXTS.map((example) => example.text);
  const vectors = await embedAllFor(config, texts, 'passage', Number(process.env.BERT_ANALYZE_TIMEOUT_MS) || undefined);
  if (!vectors || vectors.length !== texts.length) return null;

  const dimensions = vectors[0]?.length || 0;
  if (dimensions === 0) return null;

  const sums = new Map<IntentId, number[]>();
  const exemplars = new Map<IntentId, number[][]>();
  for (const intent of INTENTS) {
    sums.set(intent, new Array<number>(dimensions).fill(0));
    exemplars.set(intent, []);
  }

  vectors.forEach((vector, index) => {
    const intent = EXEMPLAR_TEXTS[index]?.intent;
    if (!intent || !vector || vector.length !== dimensions) return;
    const target = sums.get(intent);
    if (!target) return;
    for (let i = 0; i < dimensions; i += 1) target[i] += Number(vector[i]) || 0;
    exemplars.get(intent)?.push(l2(vector));
  });

  const centroids = new Map<IntentId, number[]>();
  for (const [intent, sum] of sums) centroids.set(intent, l2(sum));

  const data: CentroidData = { key, centroids, exemplars };
  centroidCache = data;
  await writeCentroidFile(config, key, data);
  return data;
}

async function ensureCentroids(config: EmbeddingBackend): Promise<CentroidData | null> {
  const key = centroidKey(config);
  if (centroidCache && centroidCache.key === key) return centroidCache;

  if (config.id === 'local_bert') {
    const persisted = readCentroidFile(key);
    if (persisted) {
      centroidCache = persisted;
      return persisted;
    }
  }

  if (centroidPromise?.key === key) return centroidPromise.promise;

  const promise = buildCentroids(config).finally(() => {
    if (centroidPromise?.key === key) centroidPromise = null;
  });
  centroidPromise = { key, promise };
  return promise;
}

const resultCache = new Map<string, { at: number; result: RemoteIntentResult }>();

function resultCacheKey(config: EmbeddingBackend, normalized: string): string {
  return `${config.id}:${config.model}:${normalized}`;
}

/**
 * Classify text with the configured encoder. Returns null when no backend is
 * available or every backend fails, so the caller can keep the offline result.
 */
export async function classifyWithEmbeddings(
  text: string,
  options: { timeoutMs?: number; localOnly?: boolean } = {}
): Promise<RemoteIntentResult | null> {
  const backends = getEmbeddingBackends().filter(
    (backend) => !options.localOnly || backend.id === 'local_bert'
  );
  if (backends.length === 0) return null;

  const normalized = tokenize(text).join(' ');
  if (!normalized) return null;

  const startedAt = performance.now();

  for (const config of backends) {
    const cacheKey = resultCacheKey(config, normalized);
    const cached = resultCache.get(cacheKey);
    if (cached && Date.now() - cached.at < RESULT_TTL_MS) return cached.result;

    const data = await ensureCentroids(config);
    if (!data) continue;

    const queryVectors = await embedBatchFor(config, [text], 'query', options.timeoutMs);
    const query = queryVectors?.[0];
    if (!query) continue;

    const scored = INTENTS.map((intent) => {
      const centroid = data.centroids.get(intent);
      const neighbors = data.exemplars.get(intent) || [];
      const centroidScore = centroid ? dot(query, centroid) : 0;
      const neighborScore = neighbors.reduce((max, vector) => Math.max(max, dot(query, vector)), 0);
      return { intent, score: 0.4 * centroidScore + 0.6 * neighborScore };
    }).sort((a, b) => b.score - a.score);

    const topScore = scored[0]?.score || 0;
    const temperature =
      Number(process.env.BERT_EMBED_TEMPERATURE) || (config.id === 'local_bert' ? 0.05 : 0.06);
    const exps = scored.map((entry) => Math.exp((entry.score - topScore) / temperature));
    const sum = exps.reduce((acc, value) => acc + value, 0) || 1;
    const probabilities = scored.map((entry, index) => ({
      intent: entry.intent,
      confidence: exps[index] / sum,
    }));

    const result: RemoteIntentResult = {
      intent: probabilities[0]?.intent || 'casual_social',
      confidence: Math.round((probabilities[0]?.confidence || 0) * 1000) / 1000,
      alternatives: probabilities.slice(0, 3).map((entry) => ({
        intent: entry.intent,
        confidence: Math.round(entry.confidence * 1000) / 1000,
      })),
      backend: config,
      latencyMs: Math.round((performance.now() - startedAt) * 100) / 100,
      method:
        config.id === 'local_bert'
          ? 'frozen-bert-mean-pooling-cosine (not fine-tuned)'
          : 'embedding-centroid-cosine (not fine-tuned)',
    };

    if (resultCache.size >= MAX_CACHE) {
      const oldest = [...resultCache.entries()].sort((a, b) => a[1].at - b[1].at)[0];
      if (oldest) resultCache.delete(oldest[0]);
    }
    resultCache.set(cacheKey, { at: Date.now(), result });
    return result;
  }

  return null;
}

export function clearEmbeddingCaches(): void {
  centroidCache = null;
  centroidPromise = null;
  resultCache.clear();
}
