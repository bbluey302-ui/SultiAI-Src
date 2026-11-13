// Local ONNX inference for the real google-bert/bert-base-multilingual-cased
// encoder.
//
// Why an exported ONNX graph?
// ---------------------------
// The public ONNX conversions of this checkpoint (Xenova, onnx-community)
// expose the masked-language-model head (`logits`), not the base encoder's
// `last_hidden_state`. SultiAI needs the 768-dimensional contextual hidden
// states for similarity-based intent classification, so
// `server/scripts/export-bert-onnx.py` exports the base `BertModel` and writes:
//
//   models/bert/sulti-bert-base-multilingual-cased/
//     config.json                     (architectures = ["BertModel"])
//     tokenizer.json
//     onnx/model.onnx                 (fp32, exact PyTorch parity)
//     onnx/model_quantized.onnx       (optional int8, lower memory)
//     sulti-model.json                (provenance + export verification)
//
// This module is lazy: importing it never loads the model. The first
// `/api/sulti/bert-analyze` call, or the background warmup in server.ts, loads
// it once and caches the tokenizer/model/session in memory. If anything fails,
// callers fall back to the offline TF-IDF classifier and then to the optional
// hosted encoders.
//
// Honest labelling:
//   * The encoder weights are the pretrained multilingual BERT checkpoint.
//   * The intent classifier is NOT fine-tuned. It is a frozen-encoder,
//     mean-pooled cosine-similarity classifier over the existing labelled
//     exemplars (see embeddings.ts).
//   * `sulti-model.json` records the source model SHA, tokenizer vocabulary
//     hash, ONNX file hash, and fp32/q8 parity checks.

import { createHash } from 'node:crypto';
import { createReadStream, existsSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

export type LocalBertDtype = 'fp32' | 'q8' | 'fp16';

export interface LocalBertProvenance {
  baseModelId: string;
  baseModelSha: string | null;
  onnxSha256: string | null;
  fp32Sha256: string | null;
  quantizedSha256: string | null;
  quantization: string | null;
  exportedAt: string | null;
  hiddenSize: number | null;
  vocabSize: number | null;
  architecture: string | null;
  tokenizerVocabSha256: string | null;
  tokenizerMatchesBase: boolean;
  onnxHashMatches: boolean | null;
  verified: boolean;
  notes: string[];
}

export interface LocalBertFiles {
  tokenizer: boolean;
  config: boolean;
  metadata: boolean;
  model: boolean;
  fp32: boolean;
  q8: boolean;
  fp16: boolean;
}

export interface LocalBertStatus {
  enabled: boolean;
  available: boolean;
  loaded: boolean;
  loading: boolean;
  modelId: string;
  baseModelId: string;
  requestedDtype: LocalBertDtype;
  dtype: LocalBertDtype;
  dtypeFallback: boolean;
  device: 'cpu';
  dimensions: number | null;
  loadMs: number | null;
  lastInferenceMs: number | null;
  inferenceBatches: number;
  inferenceTexts: number;
  loadCount: number;
  error: string | null;
  files: LocalBertFiles;
  provenance: LocalBertProvenance | null;
}

interface LoadedBert {
  tokenizer: any;
  model: any;
  dimensions: number;
  loadMs: number;
}

// Hash of the `model.vocab` object in google-bert/bert-base-multilingual-cased's
// tokenizer.json. Verified against the original repo and both public ONNX
// conversions. This is a public file hash, not a secret.
const EXPECTED_TOKENIZER_VOCAB_SHA256 =
  '681b1731550af830860eac1cdbe91f0cd8117e85e78f50d7bdf07f0f47d50b85';

const DEFAULT_BASE_MODEL_ID = 'google-bert/bert-base-multilingual-cased';
const DEFAULT_LOCAL_MODEL_ID = 'sulti-bert-base-multilingual-cased';

let loaded: LoadedBert | null = null;
let loadPromise: Promise<LoadedBert> | null = null;
let loadCount = 0;
let lastFailureAt = 0;
let lastError: string | null = null;
let lastInferenceMs: number | null = null;
let inferenceBatches = 0;
let inferenceTexts = 0;
let provenanceCache: LocalBertProvenance | null = null;
let provenanceCacheKey = '';

function envNumber(name: string, fallback: number): number {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function normalizeDtype(value: string | undefined): LocalBertDtype {
  const normalized = (value || 'fp32').trim().toLowerCase();
  if (normalized === 'q8' || normalized === 'int8') return 'q8';
  if (normalized === 'fp16') return 'fp16';
  return 'fp32';
}

export function isLocalBertEnabled(): boolean {
  return (process.env.BERT_LOCAL_ENABLED || 'true').trim().toLowerCase() !== 'false';
}

export function getLocalModelRoot(): string {
  const configured = (process.env.BERT_LOCAL_DIR || '').trim();
  const root = configured || path.join(process.cwd(), 'models', 'bert');
  return path.isAbsolute(root) ? root : path.join(process.cwd(), root);
}

export function getLocalModelId(): string {
  return (process.env.BERT_LOCAL_MODEL_ID || DEFAULT_LOCAL_MODEL_ID).trim();
}

export function getLocalModelDir(): string {
  const id = getLocalModelId();
  return path.isAbsolute(id) ? id : path.join(getLocalModelRoot(), id);
}

function modelFileName(dtype: LocalBertDtype): string {
  if (dtype === 'q8') return 'model_quantized.onnx';
  if (dtype === 'fp16') return 'model_fp16.onnx';
  return 'model.onnx';
}

function fileExists(modelDir: string, ...parts: string[]): boolean {
  return existsSync(path.join(modelDir, ...parts));
}

/**
 * Pick the requested dtype, but fall back to whichever graph actually exists.
 * This keeps a deployment working when only the int8 graph was shipped.
 */
function resolveDtype(modelDir = getLocalModelDir()): {
  requested: LocalBertDtype;
  effective: LocalBertDtype;
  fallback: boolean;
} {
  const requested = normalizeDtype(process.env.BERT_DTYPE);
  if (fileExists(modelDir, 'onnx', modelFileName(requested))) {
    return { requested, effective: requested, fallback: false };
  }
  for (const candidate of ['fp32', 'q8', 'fp16'] as LocalBertDtype[]) {
    if (fileExists(modelDir, 'onnx', modelFileName(candidate))) {
      return { requested, effective: candidate, fallback: candidate !== requested };
    }
  }
  return { requested, effective: requested, fallback: false };
}

export function getLocalBertFiles(modelDir = getLocalModelDir()): LocalBertFiles {
  return {
    tokenizer: fileExists(modelDir, 'tokenizer.json'),
    config: fileExists(modelDir, 'config.json'),
    metadata: fileExists(modelDir, 'sulti-model.json'),
    model: fileExists(modelDir, 'onnx', modelFileName(resolveDtype(modelDir).effective)),
    fp32: fileExists(modelDir, 'onnx', 'model.onnx'),
    q8: fileExists(modelDir, 'onnx', 'model_quantized.onnx'),
    fp16: fileExists(modelDir, 'onnx', 'model_fp16.onnx'),
  };
}

export function isLocalBertAvailable(): boolean {
  if (!isLocalBertEnabled()) return false;
  const files = getLocalBertFiles();
  return files.tokenizer && files.config && files.model;
}

/**
 * Pure file validation, exported for tests and for a clear error message.
 * Never reaches the network.
 */
export function assertLocalModelFiles(modelDir = getLocalModelDir()): void {
  const files = getLocalBertFiles(modelDir);
  const dtype = resolveDtype(modelDir);
  const missing: string[] = [];
  if (!files.tokenizer) missing.push('tokenizer.json');
  if (!files.config) missing.push('config.json');
  if (!files.model) missing.push(path.join('onnx', modelFileName(dtype.effective)));
  if (missing.length > 0) {
    throw new Error(
      `Local BERT model is not available in ${modelDir}. Missing: ${missing.join(', ')}. ` +
        'Run `npm run nlp:export-bert` to build it from google-bert/bert-base-multilingual-cased.'
    );
  }
}

function vocabHash(tokenizerJson: any): string | null {
  const vocab = tokenizerJson?.model?.vocab;
  if (!vocab || typeof vocab !== 'object') return null;
  const sorted = Object.keys(vocab)
    .sort()
    .map((key) => `${key}:${(vocab as Record<string, unknown>)[key]}`)
    .join('\n');
  return createHash('sha256').update(sorted).digest('hex');
}

function readJson(file: string): any | null {
  try {
    return JSON.parse(readFileSync(file, 'utf8'));
  } catch {
    return null;
  }
}

function readProvenance(modelDir: string): LocalBertProvenance | null {
  const tokenizerPath = path.join(modelDir, 'tokenizer.json');
  const configPath = path.join(modelDir, 'config.json');
  const metadataPath = path.join(modelDir, 'sulti-model.json');

  let tokenizerStat: { mtimeMs: number; size: number } | null = null;
  try {
    // Small synchronous stat is fine here: this runs once per model directory.
    const fsStat = statSync(tokenizerPath);
    tokenizerStat = { mtimeMs: fsStat.mtimeMs, size: fsStat.size };
  } catch {
    tokenizerStat = null;
  }

  const cacheKey = `${modelDir}:${tokenizerStat?.mtimeMs || 0}:${tokenizerStat?.size || 0}`;
  if (provenanceCache && provenanceCacheKey === cacheKey) return provenanceCache;

  const metadata = readJson(metadataPath);
  const config = readJson(configPath);
  const tokenizer = readJson(tokenizerPath);
  if (!config && !metadata) return null;

  const tokenizerVocabSha256 = vocabHash(tokenizer);
  const tokenizerMatchesBase = tokenizerVocabSha256 === EXPECTED_TOKENIZER_VOCAB_SHA256;
  const hiddenSize = Number(config?.hidden_size) || null;
  const vocabSize = Number(config?.vocab_size) || null;
  const architecture = Array.isArray(config?.architectures) ? config.architectures[0] || null : null;

  const configMatches =
    config?.model_type === 'bert' &&
    hiddenSize === 768 &&
    vocabSize === 119547 &&
    Number(config?.num_hidden_layers) === 12;

  const configuredBase = (process.env.BERT_MODEL_ID || DEFAULT_BASE_MODEL_ID).trim();
  const baseModelId = String(metadata?.baseModelId || configuredBase);
  const baseModelMatches = baseModelId === configuredBase;

  const notes: string[] = [];
  if (architecture === 'BertForMaskedLM') {
    notes.push('ONNX graph exposes the MLM logits head, not last_hidden_state; rebuild with nlp:export-bert.');
  } else if (architecture === 'BertModel') {
    notes.push('ONNX graph exposes the base encoder last_hidden_state output.');
  }
  if (metadata?.verification?.meanPooledCosineVsPyTorch) {
    notes.push(
      `Export verification: mean-pooled cosine vs PyTorch ${JSON.stringify(
        metadata.verification.meanPooledCosineVsPyTorch
      )}.`
    );
  }
  if (normalizeDtype(process.env.BERT_DTYPE) === 'q8') {
    notes.push('int8 dynamic quantization is lower-memory but changes embeddings; fp32 is the default for fidelity.');
  }

  const provenance: LocalBertProvenance = {
    baseModelId,
    baseModelSha: metadata?.baseModelSha || null,
    onnxSha256: metadata?.onnxSha256 || null,
    fp32Sha256: metadata?.fp32Sha256 || null,
    quantizedSha256: metadata?.quantizedSha256 || metadata?.onnxSha256 || null,
    quantization: metadata?.quantization || null,
    exportedAt: metadata?.exportedAt || null,
    hiddenSize,
    vocabSize,
    architecture,
    tokenizerVocabSha256,
    tokenizerMatchesBase,
    onnxHashMatches: null,
    verified: Boolean(configMatches && tokenizerMatchesBase && baseModelMatches),
    notes,
  };

  if (!configMatches) notes.push('config.json does not match the expected 12-layer, 768-hidden BERT architecture.');
  if (!tokenizerMatchesBase) notes.push('Tokenizer vocabulary hash does not match google-bert/bert-base-multilingual-cased.');
  if (!baseModelMatches) notes.push(`Configured BERT_MODEL_ID (${configuredBase}) differs from metadata (${baseModelId}).`);

  provenanceCache = provenance;
  provenanceCacheKey = cacheKey;
  return provenance;
}

export function getLocalBertProvenance(): LocalBertProvenance | null {
  return readProvenance(getLocalModelDir());
}

async function sha256File(file: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = createHash('sha256');
    const stream = createReadStream(file);
    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('error', reject);
    stream.on('end', () => resolve(hash.digest('hex')));
  });
}

function withTimeout<T>(task: Promise<T>, timeoutMs: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${label} timed out after ${timeoutMs}ms`)), timeoutMs);
    task.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      }
    );
  });
}

function describeError(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

/**
 * Load the tokenizer and ONNX encoder exactly once. Concurrent callers share the
 * same promise. A failure is cached briefly so a broken install does not retry
 * (and block) on every chat turn.
 */
export async function loadLocalBert(force = false): Promise<LoadedBert> {
  if (loaded) return loaded;
  if (loadPromise) return loadPromise;

  if (!isLocalBertEnabled()) {
    throw new Error('Local BERT is disabled (BERT_LOCAL_ENABLED=false).');
  }

  if (!force && lastFailureAt > 0 && Date.now() - lastFailureAt < envNumber('BERT_RETRY_MS', 60_000)) {
    throw new Error(lastError || 'Local BERT is temporarily unavailable.');
  }

  const modelDir = getLocalModelDir();
  try {
    assertLocalModelFiles(modelDir);
  } catch (error: unknown) {
    lastFailureAt = Date.now();
    lastError = describeError(error);
    throw error;
  }
  const dtype = resolveDtype(modelDir);
  const modelFile = path.join(modelDir, 'onnx', modelFileName(dtype.effective));
  const loadStarted = performance.now();
  const startedAt = Date.now();
  lastError = null;

  loadPromise = (async () => {
    // Hash the graph while the tokenizer/model load so startup is not serialised
    // on 700 MB of disk reads, but still verify integrity before declaring ready.
    const hashPromise = sha256File(modelFile);

    const transformers: any = await import('@huggingface/transformers');
    const { env, AutoTokenizer, BertModel } = transformers;

    // Local-only: never silently download a different model at request time.
    const configuredModelId = getLocalModelId();
    const absoluteModelId = path.isAbsolute(configuredModelId);
    env.localModelPath = absoluteModelId ? path.dirname(configuredModelId) : getLocalModelRoot();
    env.allowRemoteModels = false;
    env.allowLocalModels = true;
    env.logLevel = process.env.BERT_DEBUG === 'true' ? 'info' : 'error';

    const localModelId = absoluteModelId ? path.basename(configuredModelId) : configuredModelId;

    const loadTimeout = envNumber('BERT_LOAD_TIMEOUT_MS', 120_000);
    const tokenizer: any = await withTimeout(
      AutoTokenizer.from_pretrained(localModelId),
      loadTimeout,
      'BERT tokenizer load'
    );
    const model: any = await withTimeout(
      BertModel.from_pretrained(localModelId, { dtype: dtype.effective }),
      loadTimeout,
      'BERT model load'
    );

    // Warm the session and confirm the graph really returns last_hidden_state.
    const warmEncoded = await tokenizer(['Maayong buntag'], {
      padding: true,
      truncation: true,
      max_length: 16,
    });
    const warmOutput: any = await withTimeout(
      model(warmEncoded),
      envNumber('BERT_INFERENCE_TIMEOUT_MS', 15_000),
      'BERT warmup inference'
    );
    const hidden = warmOutput?.last_hidden_state;
    if (!hidden || !Array.isArray(hidden.dims) || hidden.dims.length !== 3) {
      throw new Error(
        'The loaded ONNX graph did not return last_hidden_state [batch, sequence, hidden]. ' +
          'This usually means the MLM-head export is installed instead of the base encoder export.'
      );
    }

    const dimensions = Number(hidden.dims[2]) || 0;
    if (dimensions !== 768) {
      throw new Error(`Unexpected BERT hidden size: ${dimensions} (expected 768).`);
    }

    const onnxSha256 = await hashPromise;
    const provenance = readProvenance(modelDir);
    if (provenance) {
      const expected =
        dtype.effective === 'q8' ? provenance.quantizedSha256 : provenance.fp32Sha256;
      provenance.onnxSha256 = onnxSha256;
      if (expected) provenance.onnxHashMatches = expected === onnxSha256;
      else provenance.onnxHashMatches = null;
      provenance.verified =
        provenance.verified && provenance.tokenizerMatchesBase && provenance.onnxHashMatches !== false;
      provenanceCache = provenance;
    }

    const loadMs = Math.round(performance.now() - loadStarted);
    inferenceBatches = 0;
    inferenceTexts = 0;
    lastInferenceMs = null;
    loadCount += 1;

    const result: LoadedBert = { tokenizer, model, dimensions, loadMs };
    loaded = result;
    lastFailureAt = 0;
    console.log(
      `[NLP] local BERT ready: ${getLocalModelId()} (${dtype.effective}, ${dimensions}-d) in ${loadMs}ms` +
        (provenance?.verified ? ' [provenance verified]' : ' [provenance warning]')
    );
    return result;
  })();

  try {
    return await loadPromise;
  } catch (error: unknown) {
    lastFailureAt = Date.now();
    lastError = describeError(error);
    loaded = null;
    console.warn(`[NLP] local BERT unavailable (${dtype.requested}): ${lastError}`);
    throw error;
  } finally {
    loadPromise = null;
  }
}

function meanPoolAndNormalize(hidden: any, attentionMask: any): number[][] {
  const dims = hidden?.dims;
  const maskDims = attentionMask?.dims;
  if (!Array.isArray(dims) || dims.length !== 3) {
    throw new Error('BERT output tensor has an unexpected shape.');
  }
  if (!Array.isArray(maskDims) || maskDims.length !== 2) {
    throw new Error('BERT attention mask has an unexpected shape.');
  }

  const [batch, sequence, width] = dims.map(Number);
  const data = hidden.data as Float32Array | number[];
  const mask = attentionMask.data as ArrayLike<number | bigint>;

  const vectors: number[][] = [];
  for (let b = 0; b < batch; b += 1) {
    const sum = new Array<number>(width).fill(0);
    let count = 0;
    for (let t = 0; t < sequence; t += 1) {
      if (Number(mask[b * sequence + t]) === 0) continue;
      count += 1;
      const offset = (b * sequence + t) * width;
      for (let d = 0; d < width; d += 1) sum[d] += Number(data[offset + d]) || 0;
    }
    // BERT always emits [CLS] and [SEP], so count is at least 2 for a normal
    // tokenizer call. The guard keeps a malformed mask from producing NaN.
    const divisor = count || 1;
    let norm = 0;
    for (let d = 0; d < width; d += 1) {
      sum[d] /= divisor;
      norm += sum[d] * sum[d];
    }
    const length = Math.sqrt(norm) || 1;
    vectors.push(sum.map((value) => value / length));
  }
  return vectors;
}

/**
 * Embed texts with the frozen local BERT encoder. Vectors are mean-pooled over
 * the attention mask and L2-normalised, so cosine similarity is a dot product.
 */
export async function embedWithLocalBert(
  texts: string[],
  options: { timeoutMs?: number } = {}
): Promise<number[][]> {
  if (texts.length === 0) return [];
  const { tokenizer, model } = await loadLocalBert();

  const maxLength = Math.round(envNumber('BERT_MAX_LENGTH', 128));
  const batchSize = Math.max(1, Math.round(envNumber('BERT_BATCH_SIZE', 16)));
  const timeoutMs = options.timeoutMs ?? envNumber('BERT_INFERENCE_TIMEOUT_MS', 15_000);
  const vectors: number[][] = [];

  for (let start = 0; start < texts.length; start += batchSize) {
    const batch = texts
      .slice(start, start + batchSize)
      .map((text) => String(text || '').slice(0, 4000));

    const inferenceStarted = performance.now();
    const encoded = await tokenizer(batch, {
      padding: true,
      truncation: true,
      max_length: maxLength,
    });
    const output: any = await withTimeout(model(encoded), timeoutMs, 'local BERT inference');
    const hidden = output?.last_hidden_state;
    const pooled = meanPoolAndNormalize(hidden, encoded.attention_mask);
    vectors.push(...pooled);

    lastInferenceMs = Math.round((performance.now() - inferenceStarted) * 100) / 100;
    inferenceBatches += 1;
    inferenceTexts += batch.length;
  }

  return vectors;
}

export const LOCAL_BERT_MODEL_ID = DEFAULT_BASE_MODEL_ID;

export function getLocalBertStatus(): LocalBertStatus {
  const modelDir = getLocalModelDir();
  const dtype = resolveDtype(modelDir);
  const files = getLocalBertFiles(modelDir);
  const provenance = getLocalBertProvenance();
  const available = Boolean(files.tokenizer && files.config && files.model);

  return {
    enabled: isLocalBertEnabled(),
    available,
    loaded: Boolean(loaded),
    loading: Boolean(loadPromise),
    modelId: getLocalModelId(),
    baseModelId: provenance?.baseModelId || (process.env.BERT_MODEL_ID || DEFAULT_BASE_MODEL_ID).trim(),
    requestedDtype: dtype.requested,
    dtype: dtype.effective,
    dtypeFallback: dtype.fallback,
    device: 'cpu',
    dimensions: loaded?.dimensions ?? null,
    loadMs: loaded?.loadMs ?? null,
    lastInferenceMs,
    inferenceBatches,
    inferenceTexts,
    loadCount,
    error: lastError,
    files,
    provenance,
  };
}

/** Background warmup used by server.ts; never throws. */
export async function warmLocalBert(): Promise<LocalBertStatus> {
  if (isLocalBertEnabled() && isLocalBertAvailable()) {
    try {
      await loadLocalBert();
    } catch {
      // loadLocalBert already recorded a concise status/error.
    }
  }
  return getLocalBertStatus();
}

/** Test helper: release the cached session and reset counters. */
export function disposeLocalBert(): void {
  loaded = null;
  loadPromise = null;
  loadCount = 0;
  lastFailureAt = 0;
  lastError = null;
  lastInferenceMs = null;
  inferenceBatches = 0;
  inferenceTexts = 0;
  provenanceCache = null;
  provenanceCacheKey = '';
}
