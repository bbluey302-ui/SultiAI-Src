import test from 'node:test';
import assert from 'node:assert/strict';
import {
  INTENTS,
  analyzeLocal,
  tokenize,
} from '../server/nlp/intentEngine';
import { analyzeLearnerText } from '../server/nlp';

const INTENT_CASES: { text: string; intent: string }[] = [
  { text: 'Maayong buntag! Kumusta ka?', intent: 'greeting_inquiry' },
  { text: 'Pila ang plete sa jeep padulong Bankerohan?', intent: 'fare_navigation_jeepney' },
  { text: 'Tagpila ang isda karon, nang?', intent: 'price_bargaining' },
  { text: 'Salamat kaayo sa imong tabang!', intent: 'courtesy_gratitude' },
  { text: 'Asa dapit ang merkado dinhi?', intent: 'directional_inquiry' },
  { text: 'Gusto ko mokaon og isda ug kan-on.', intent: 'food_ordering' },
  { text: 'Unsaon pagsulti og thank you sa Bisaya?', intent: 'pedagogical_clarification' },
  { text: 'How much is one kilo of mango?', intent: 'price_bargaining' },
  { text: 'Where is the nearest market around here?', intent: 'directional_inquiry' },
  { text: 'I would like to order fish and rice, please.', intent: 'food_ordering' },
  { text: 'Magkano po ang pamasahe papuntang palengke?', intent: 'fare_navigation_jeepney' },
  { text: 'Maraming salamat po sa tulong ninyo!', intent: 'courtesy_gratitude' },
];

test('tokenizer keeps Bisaya, Filipino and English words', () => {
  assert.deepEqual(tokenize('Maayong buntag, kaon ta!'), ['maayong', 'buntag', 'kaon', 'ta']);
  assert.deepEqual(tokenize('How much is the jeepney?'), ['how', 'much', 'is', 'the', 'jeepney']);
  assert.deepEqual(tokenize('   '), []);
});

for (const testCase of INTENT_CASES) {
  test(`classifies "${testCase.text}" as ${testCase.intent}`, () => {
    const result = analyzeLocal(testCase.text);
    assert.equal(result.predictedIntent, testCase.intent, JSON.stringify(result.alternatives));
    assert.ok(result.intentConfidence > 0.5, `confidence was ${result.intentConfidence}`);
  });
}

test('detects Cebuano, Filipino and English input', () => {
  assert.match(analyzeLocal('Maayong buntag, unsa imong gibuhat karon?').detectedLanguage, /Bisaya/);
  assert.match(analyzeLocal('Magkano po ang pamasahe papuntang palengke?').detectedLanguage, /Filipino/);
  assert.equal(analyzeLocal('Where is the nearest market around here?').detectedLanguage, 'English');
});

test('extracts money, transport, food and place entities', () => {
  const result = analyzeLocal('Bayad ko ₱50 sa jeep padulong Bankerohan, palihog.');
  assert.ok(result.entities.some((entity) => entity.type === 'amount' && entity.value === '₱50'));
  assert.ok(result.entities.some((entity) => entity.type === 'transport' && entity.value === 'jeep'));
  assert.ok(result.entities.some((entity) => entity.type === 'place' && entity.value === 'bankerohan'));

  const food = analyzeLocal('Pila ang kilo sa mangga?');
  assert.ok(food.entities.some((entity) => entity.type === 'food' && entity.value === 'mangga'));
});

test('flags unclear input as low confidence instead of guessing', () => {
  const gibberish = analyzeLocal('zxcv qwer asdf');
  assert.equal(gibberish.lowConfidence, true);
  assert.ok(gibberish.intentConfidence < 0.55);

  const empty = analyzeLocal('   ');
  assert.equal(empty.lowConfidence, true);
  assert.ok(empty.intentConfidence >= 0 && empty.intentConfidence <= 1);
});

test('respects a custom confidence threshold', () => {
  const result = analyzeLocal('Kumusta ka?', { threshold: 0.99 });
  assert.equal(result.threshold, 0.99);
  assert.equal(result.lowConfidence, true);
});

test('returns sorted alternatives and bounded key-token weights', () => {
  const result = analyzeLocal('Tagpila ang isda sa merkado?');
  assert.ok(result.alternatives.length >= 1 && result.alternatives.length <= 3);
  for (let index = 1; index < result.alternatives.length; index += 1) {
    assert.ok(result.alternatives[index - 1].confidence >= result.alternatives[index].confidence);
  }
  assert.ok(result.keyTokens.length > 0);
  for (const token of result.keyTokens) {
    assert.ok(token.weight >= 0.42 && token.weight <= 0.98);
  }
  assert.ok(INTENTS.includes(result.predictedIntent));
  assert.ok(result.latencyMs >= 0);
});

test('is deterministic for the same input', () => {
  const first = analyzeLocal('Pila ang plete sa jeep?');
  const second = analyzeLocal('Pila ang plete sa jeep?');
  assert.equal(first.predictedIntent, second.predictedIntent);
  assert.equal(first.intentConfidence, second.intentConfidence);
});

test('handles Davao Bisaya, mixed-language, polite and negated input', () => {
  const davao = analyzeLocal('Asa man ang terminal sa Ecoland, boss?');
  assert.equal(davao.predictedIntent, 'directional_inquiry');

  const mixed = analyzeLocal('Pila ang fare sa jeep pa-Bankerohan?');
  assert.equal(mixed.predictedIntent, 'fare_navigation_jeepney');

  const polite = analyzeLocal('Palihog ko, salamat kaayo.');
  assert.equal(polite.predictedIntent, 'courtesy_gratitude');

  const negated = analyzeLocal('Dili ko gusto mokaon og isda.');
  assert.equal(negated.predictedIntent, 'food_ordering');
  assert.equal(negated.negated, true);
});

test('flags a question with no dedicated time intent and out-of-scope input', () => {
  const time = analyzeLocal('Unsa na oras karon?');
  assert.equal(time.lowConfidence, true, 'the current schema has no dedicated time intent');

  const outOfScope = analyzeLocal('What is the capital of France?');
  assert.equal(outOfScope.lowConfidence, true);
  assert.ok(outOfScope.intentConfidence < 0.55);
});

test('hybrid analyser falls back to offline NLP when no encoder is configured', async () => {
  const previous = {
    local: process.env.BERT_LOCAL_ENABLED,
    hf: process.env.HF_TOKEN,
    hf2: process.env.HUGGINGFACE_API_KEY,
    nvidia: process.env.NVIDIA_API_KEY,
    disabled: process.env.BERT_REMOTE_DISABLED,
  };
  process.env.BERT_LOCAL_ENABLED = 'false';
  process.env.BERT_REMOTE_DISABLED = 'true';
  delete process.env.HF_TOKEN;
  delete process.env.HUGGINGFACE_API_KEY;
  delete process.env.NVIDIA_API_KEY;

  try {
    const result = await analyzeLearnerText('Maayong buntag!', { remote: true });
    assert.equal(result.source, 'local');
    assert.equal(result.engine, 'local-tfidf');
    assert.equal(result.remoteModel, undefined);
  } finally {
    if (previous.local === undefined) delete process.env.BERT_LOCAL_ENABLED;
    else process.env.BERT_LOCAL_ENABLED = previous.local;
    if (previous.hf !== undefined) process.env.HF_TOKEN = previous.hf;
    if (previous.hf2 !== undefined) process.env.HUGGINGFACE_API_KEY = previous.hf2;
    if (previous.nvidia !== undefined) process.env.NVIDIA_API_KEY = previous.nvidia;
    if (previous.disabled !== undefined) process.env.BERT_REMOTE_DISABLED = previous.disabled;
  }
});
