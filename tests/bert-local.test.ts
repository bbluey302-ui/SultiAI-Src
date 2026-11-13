import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  assertLocalModelFiles,
  disposeLocalBert,
  embedWithLocalBert,
  getLocalBertStatus,
  isLocalBertAvailable,
  loadLocalBert,
} from '../server/nlp/localBert';
import {
  analyzeForChat,
  analyzeLearnerText,
  getNlpStatus,
} from '../server/nlp';
import {
  classifyWithEmbeddings,
  clearEmbeddingCaches,
} from '../server/nlp/embeddings';

const MODEL_AVAILABLE = isLocalBertAvailable();
const modelSkip = MODEL_AVAILABLE
  ? false
  : 'local BERT model not exported; run `npm run nlp:export-bert`';

function cosine(a: number[], b: number[]): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < Math.min(a.length, b.length); i += 1) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return dot / ((Math.sqrt(na) || 1) * (Math.sqrt(nb) || 1));
}

test('rejects a missing local model directory with a clear error', () => {
  const missing = path.join(os.tmpdir(), `sulti-bert-missing-${Date.now()}`);
  assert.throws(
    () => assertLocalModelFiles(missing),
    /Missing: tokenizer\.json, config\.json/
  );
});

test('a missing model makes the loader fail locally, not over the network', async () => {
  const previousDir = process.env.BERT_LOCAL_DIR;
  const previousEnabled = process.env.BERT_LOCAL_ENABLED;
  const missing = path.join(os.tmpdir(), `sulti-bert-missing-${Date.now()}`);
  process.env.BERT_LOCAL_DIR = missing;
  process.env.BERT_LOCAL_ENABLED = 'true';
  disposeLocalBert();

  try {
    await assert.rejects(loadLocalBert(true), /Missing: tokenizer\.json, config\.json/);
    const status = getLocalBertStatus();
    assert.equal(status.loaded, false);
    assert.match(String(status.error), /Missing:/);
  } finally {
    if (previousDir === undefined) delete process.env.BERT_LOCAL_DIR;
    else process.env.BERT_LOCAL_DIR = previousDir;
    if (previousEnabled === undefined) delete process.env.BERT_LOCAL_ENABLED;
    else process.env.BERT_LOCAL_ENABLED = previousEnabled;
    disposeLocalBert();
  }
});

test(
  'loads the real BERT tokenizer and encoder once and caches the session',
  { skip: modelSkip },
  async () => {
    disposeLocalBert();
    const first = await loadLocalBert();
    const second = await loadLocalBert();
    const status = getLocalBertStatus();

    assert.equal(first, second, 'concurrent/repeated loads must share the same model');
    assert.equal(status.loaded, true);
    assert.equal(status.loadCount, 1);
    assert.equal(status.dimensions, 768);
    assert.equal(status.dtype, 'fp32');
    assert.equal(status.baseModelId, 'google-bert/bert-base-multilingual-cased');
    assert.equal(status.provenance?.architecture, 'BertModel');
    assert.equal(status.provenance?.tokenizerMatchesBase, true);
    assert.equal(status.provenance?.verified, true);
  }
);

test(
  'actual BERT inference returns finite, normalized 768-dimensional vectors',
  { skip: modelSkip },
  async () => {
    await loadLocalBert();
    const [greeting, fare] = await embedWithLocalBert([
      'Maayong buntag, kumusta ka?',
      'Tagpila ang plete sa jeep padulong Bankerohan?',
    ]);

    for (const vector of [greeting, fare]) {
      assert.equal(vector.length, 768);
      assert.ok(vector.every((value) => Number.isFinite(value)));
      const norm = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0));
      assert.ok(Math.abs(norm - 1) < 1e-3, `vector norm was ${norm}`);
    }
    assert.ok(Math.abs(cosine(greeting, fare)) < 0.999, 'different sentences must not collapse');
  }
);

test(
  'classifies representative Bisaya, Davao, Filipino, English and mixed input',
  { skip: modelSkip },
  async () => {
    await loadLocalBert();
    const cases: { text: string; intent: string; note?: string }[] = [
      { text: 'Maayong buntag sa imong tanan!', intent: 'greeting_inquiry' },
      { text: 'Kumusta na man ka karon?', intent: 'greeting_inquiry' },
      { text: 'Magandang hapon po!', intent: 'greeting_inquiry' },
      { text: 'Good morning, how are you?', intent: 'greeting_inquiry' },
      { text: 'Pila man ang plete sa jeep ngadto sa Bankerohan?', intent: 'fare_navigation_jeepney' },
      { text: 'Lugar lang sa eskina, palihog.', intent: 'fare_navigation_jeepney' },
      { text: 'Pila ang fare sa jeep pa-Bankerohan?', intent: 'fare_navigation_jeepney', note: 'mixed' },
      { text: 'Gutom na ko, gusto ko mokaon og isda.', intent: 'food_ordering' },
      { text: 'Dili ko gusto mokaon og isda.', intent: 'food_ordering', note: 'negation' },
      { text: 'Asa man ang terminal sa Ecoland, boss?', intent: 'directional_inquiry', note: 'Davao' },
      { text: 'Saan po ang terminal?', intent: 'directional_inquiry' },
      { text: 'Where is the nearest market?', intent: 'directional_inquiry' },
      { text: 'Tagpila man ang kilo sa mangga?', intent: 'price_bargaining' },
      { text: 'Ang mahal naman, pwede tawaran?', intent: 'price_bargaining' },
      { text: 'Palihog ko, salamat kaayo.', intent: 'courtesy_gratitude', note: 'polite' },
      { text: 'Maraming salamat po.', intent: 'courtesy_gratitude' },
      { text: 'Unsaon nako pagsulti og good morning?', intent: 'pedagogical_clarification' },
      { text: 'How do you say thank you in Bisaya?', intent: 'pedagogical_clarification' },
      { text: 'Kapoy kaayo ang adlaw pero okay ra.', intent: 'casual_social' },
      { text: "I had a long day, let's just chat.", intent: 'casual_social' },
    ];

    for (const item of cases) {
      const result = await analyzeLearnerText(item.text, { remote: true });
      assert.equal(
        result.predictedIntent,
        item.intent,
        `${item.text} -> ${result.predictedIntent} (${result.intentConfidence}); ${JSON.stringify(result.alternatives)}`
      );
      assert.equal(result.lowConfidence, false, `${item.text} was unexpectedly low-confidence`);
      assert.ok(result.engine.includes('bert+local'), `engine was ${result.engine}`);
      assert.equal(result.classifierMethod, 'frozen-bert-mean-pooling-cosine (not fine-tuned)');
    }
  }
);

test(
  'flags short, ambiguous, time-less-schema and out-of-scope input instead of guessing',
  { skip: modelSkip },
  async () => {
    await loadLocalBert();
    for (const text of [
      'Pila?',
      'Asa?',
      'Okay ra ba kung ugma na lang?',
      'What is the capital of France?',
      'Can you write Python code for me?',
      'My phone battery is dead.',
      'Unsa na oras karon?',
    ]) {
      const result = await analyzeLearnerText(text, { remote: true });
      assert.equal(result.lowConfidence, true, `${text} should be low-confidence, got ${result.predictedIntent}`);
    }
  }
);

test(
  'analyzeForChat stays fast after warmup and uses the local encoder',
  { skip: modelSkip },
  async () => {
    await loadLocalBert();
    const result = await analyzeForChat('Pila ang plete sa jeep?');
    assert.equal(result.predictedIntent, 'fare_navigation_jeepney');
    assert.ok(result.engine.includes('bert+local'), `engine was ${result.engine}`);
    assert.ok(result.latencyMs < 1000, `chat NLP latency was ${result.latencyMs}ms`);
  }
);

test(
  'enforces the configured confidence threshold',
  { skip: modelSkip },
  async () => {
    await loadLocalBert();
    const result = await analyzeForChat('zxcv qwer asdf', { threshold: 0.8 });
    assert.equal(result.threshold, 0.8);
    assert.equal(result.lowConfidence, true);
    assert.ok(result.intentConfidence < 0.8);
  }
);

test(
  'caches inference results while keeping the encoder loaded',
  { skip: modelSkip },
  async () => {
    await loadLocalBert();
    const text = 'Unsa ang presyo sa saging karon?';
    const before = getLocalBertStatus().inferenceTexts;
    const first = await classifyWithEmbeddings(text);
    const afterFirst = getLocalBertStatus().inferenceTexts;
    const second = await classifyWithEmbeddings(text);
    const afterSecond = getLocalBertStatus().inferenceTexts;

    assert.ok(first, 'first classification should succeed');
    assert.deepEqual(second, first, 'cached result must be identical');
    assert.ok(afterFirst > before, 'first call should run encoder inference');
    assert.equal(afterSecond, afterFirst, 'second call should be served from the result cache');
  }
);

test('reports loaded BERT state honestly in getNlpStatus', { skip: modelSkip }, async () => {
  await loadLocalBert();
  const status = getNlpStatus();
  assert.equal(status.localBert.loaded, true);
  assert.equal(status.activeEngine, 'bert+local');
  assert.ok(status.lastEngine.includes('bert+local') || status.lastEngine === 'local-tfidf');
  assert.equal(status.offlineFallback, true);
  assert.ok(status.classifierMethod.includes('not fine-tuned'));
  assert.ok(status.backends.some((backend) => backend.id === 'local_bert'));
});

test('bert-analyze and nlp-status keep auth, rate-limit and length guards', () => {
  const source = readFileSync(path.join(process.cwd(), 'server.ts'), 'utf8');
  const analyzeStart = source.indexOf("app.post('/api/sulti/bert-analyze'");
  const statusStart = source.indexOf("app.get('/api/sulti/nlp-status'", analyzeStart);
  assert.ok(analyzeStart > 0 && statusStart > analyzeStart, 'routes must exist in server.ts');

  const analyzeBlock = source.slice(analyzeStart, statusStart);
  assert.ok(analyzeBlock.includes('resolveIdentity(req)'));
  assert.ok(analyzeBlock.includes('requireVerifiedUser(identity, res)'));
  assert.ok(analyzeBlock.includes('checkRateLimit(`bert:${identity.userId || req.ip}`'));
  assert.ok(analyzeBlock.includes('text.length > 1200'));
  assert.ok(analyzeBlock.includes('analyzeLearnerText'));
  assert.ok(analyzeBlock.includes('timeoutMs'));

  const statusBlock = source.slice(statusStart, source.indexOf('app.post(', statusStart));
  assert.ok(statusBlock.includes('resolveIdentity(req)'));
  assert.ok(statusBlock.includes('requireVerifiedUser(identity, res)'));
  assert.ok(statusBlock.includes('getNlpStatus()'));
});

test('falls back to the offline classifier when local BERT and remote encoders are unavailable', async () => {
  const previous = {
    local: process.env.BERT_LOCAL_ENABLED,
    remote: process.env.BERT_REMOTE_DISABLED,
    hf: process.env.HF_TOKEN,
    hf2: process.env.HUGGINGFACE_API_KEY,
    nvidia: process.env.NVIDIA_API_KEY,
  };
  process.env.BERT_LOCAL_ENABLED = 'false';
  process.env.BERT_REMOTE_DISABLED = 'true';
  delete process.env.HF_TOKEN;
  delete process.env.HUGGINGFACE_API_KEY;
  delete process.env.NVIDIA_API_KEY;
  clearEmbeddingCaches();

  try {
    const result = await analyzeLearnerText('Maayong buntag!', { remote: true });
    assert.equal(result.source, 'local');
    assert.equal(result.engine, 'local-tfidf');
    assert.equal(result.remoteModel, undefined);
  } finally {
    if (previous.local === undefined) delete process.env.BERT_LOCAL_ENABLED;
    else process.env.BERT_LOCAL_ENABLED = previous.local;
    if (previous.remote === undefined) delete process.env.BERT_REMOTE_DISABLED;
    else process.env.BERT_REMOTE_DISABLED = previous.remote;
    if (previous.hf !== undefined) process.env.HF_TOKEN = previous.hf;
    if (previous.hf2 !== undefined) process.env.HUGGINGFACE_API_KEY = previous.hf2;
    if (previous.nvidia !== undefined) process.env.NVIDIA_API_KEY = previous.nvidia;
    clearEmbeddingCaches();
  }
});
