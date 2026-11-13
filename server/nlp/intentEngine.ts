// Offline NLP intent engine for SultiAI.
//
// This is the deterministic fallback used when no hosted embedding model is
// configured (and the fast path used by every chat turn). It is a genuine NLP
// pipeline — tokenisation, uni/bigram TF-IDF vectors, cosine similarity to
// per-intent centroids, calibrated softmax, rule priors, language ID, entity
// extraction and sentiment — not a table of hard-coded confidence values.
//
// The optional multilingual transformer encoder in `embeddings.ts` upgrades
// this to semantic embeddings without changing the response shape.

export const INTENTS = [
  'greeting_inquiry',
  'fare_navigation_jeepney',
  'price_bargaining',
  'courtesy_gratitude',
  'directional_inquiry',
  'food_ordering',
  'pedagogical_clarification',
  'casual_social',
] as const;

export type IntentId = (typeof INTENTS)[number];

export type LanguageLabel =
  | 'Cebuano (Bisaya)'
  | 'Davao Bisaya'
  | 'Filipino (Tagalog)'
  | 'English'
  | 'Mixed (Bisaya + English)'
  | 'Mixed (Filipino + English)'
  | 'Mixed / Unknown';

export type SentimentLabel = 'Polite' | 'Casual' | 'Inquiring' | 'Hesitant' | 'Formal';

export type EntityType =
  | 'amount'
  | 'number'
  | 'transport'
  | 'food'
  | 'place'
  | 'time'
  | 'polite_marker';

export interface NlpEntity {
  type: EntityType;
  value: string;
}

export interface NlpToken {
  token: string;
  weight: number;
}

export interface IntentAlternative {
  intent: IntentId;
  confidence: number;
}

export interface LocalNlpResult {
  predictedIntent: IntentId;
  intentConfidence: number;
  detectedLanguage: LanguageLabel;
  languageConfidence: number;
  dialect: string;
  sentiment: SentimentLabel;
  sentimentScore: number;
  keyTokens: NlpToken[];
  entities: NlpEntity[];
  alternatives: IntentAlternative[];
  negated: boolean;
  tokenCount: number;
  bertModelRef: string;
  engine: string;
  latencyMs: number;
  lowConfidence: boolean;
  threshold: number;
}

// ---------------------------------------------------------------------------
// Training exemplars (Cebuano, Filipino, English) — 10 per intent.
// These are the "training set" for the centroid classifier. Kept in source so
// the model is deterministic, auditable and works offline.
// ---------------------------------------------------------------------------
export const INTENT_EXEMPLARS: Record<IntentId, string[]> = {
  greeting_inquiry: [
    'Maayong buntag! Kumusta ka?',
    'Maayong hapon, kumusta imong adlaw?',
    'Halo! Musta na man ka?',
    'Kumusta! Unsa may balita nimo karon?',
    'Maayong gabii sa imong tanan.',
    'Magandang umaga po! Kumusta po kayo?',
    'Kumusta ka na? Matagal na tayong hindi nagkita.',
    'Hello po, good morning! How are you?',
    'Hi there! How is your day going?',
    'Good evening! Nice to see you again.',
  ],
  fare_navigation_jeepney: [
    'Pila ang plete sa jeep padulong Bankerohan?',
    'Lugar lang, nong! Palihog hunong sa kanto.',
    'Asa ko mosakay og jeep padulong sa terminal?',
    'Bayad ko, usa lang ka pasahero sa multicab.',
    'Naa bay sukli ang singkwenta pesos sa plete?',
    'Magkano po ang pamasahe papuntang palengke?',
    'Para po! Bababa ako sa kanto.',
    'How much is the jeepney fare to the market?',
    'Please stop at the corner, I am getting off.',
    'Do I take a jeep or a tricycle to the terminal?',
  ],
  price_bargaining: [
    'Tagpila ang isda karon, nang?',
    'Pila ang kilo sa mangga? Mahal man kaayo.',
    'Pwede ba hangyo, palihog? Barato lang unta.',
    'Unsa ang presyo sa usa ka kilo nga karne?',
    'Mahal ra kaayo, naa kay mas barato?',
    'Magkano po ang isang kilo ng isda?',
    'Mura naman po, pwedeng tawaran?',
    'How much is one kilo of mango?',
    'That is too expensive, can you lower the price?',
    'Is there a cheaper option for this fish?',
  ],
  courtesy_gratitude: [
    'Salamat kaayo sa imong tabang!',
    'Daghang salamat, Ma\'am!',
    'Pasalamat ko nga nakaila tika.',
    'Salamat sa pagtudlo nako og Bisaya.',
    'Palihog ug salamat sa paghulat.',
    'Maraming salamat po sa tulong ninyo!',
    'Salamat po, napakabait ninyo.',
    'Thank you so much for your help!',
    'Thanks a lot, I really appreciate it.',
    'Please and thank you, that was kind of you.',
  ],
  directional_inquiry: [
    'Asa dapit ang merkado dinhi?',
    'Diin ang pinakaduol nga banko?',
    'Unsaon nako pag-adto sa Roxas Avenue?',
    'Layo ba ang terminal gikan dinhi?',
    'Naa ba duol nga kan-anan sa eskina?',
    'Saan po ang pinakamalapit na tindahan?',
    'Paano pumunta sa palengke mula dito?',
    'Where is the nearest market around here?',
    'How do I get to Roxas Avenue from here?',
    'Is the terminal far from this place?',
  ],
  food_ordering: [
    'Gusto ko mokaon og isda ug kan-on.',
    'Unsa ang lami nga sud-an karon?',
    'Palihog usa ka tubig ug kape.',
    'Naa moy adobong manok ug pancit?',
    'Gutom na ko, asa ta mangaon?',
    'Pahingi po ng kanin at ulam.',
    'Isang tubig po at isang order ng isda.',
    'I would like to order fish and rice, please.',
    'What is the best dish on the menu today?',
    'Can I have a glass of water and coffee?',
  ],
  pedagogical_clarification: [
    'Unsaon pagsulti og thank you sa Bisaya?',
    'Unsa ang buot ipasabot sa bitaw?',
    'Palihog tudlo-i ko sa grammar niini.',
    'Unsa ang kalainan sa "ikaw" ug "ka"?',
    'Giunsa paglitok ang "maayong buntag"?',
    'Paano po sabihin ang "good morning" sa Bisaya?',
    'Ano ang ibig sabihin ng salitang ito?',
    'How do you say "thank you" in Cebuano?',
    'What does that particle mean in this sentence?',
    'Can you explain the grammar rule again?',
  ],
  casual_social: [
    'Unsa may gibuhat nimo karong adlawa?',
    'Nalingaw ko sa atong estorya.',
    'Gusto ko makig-uban nimo ugma.',
    'Kapoy kaayo ang adlaw pero okay ra.',
    'Naa koy bag-ong nakat-onan karon.',
    'Ang saya ng araw natin ngayon.',
    'Kwento mo naman ang araw mo.',
    'I had a long day, but I am doing okay.',
    'That sounds fun, tell me more about it.',
    'Let us just chat and relax for a while.',
  ],
};

// High-signal regex priors. Cosine similarity is intentionally smooth, so
// explicit markers like "tagpila" or "salamat" get a calibrated nudge.
const RULES: { intent: IntentId; re: RegExp; boost: number }[] = [
  { intent: 'greeting_inquiry', re: /\b(maayong|magandang)\s+(buntag|hapon|gabii|umaga|hapon|gabi)\b/, boost: 0.38 },
  { intent: 'greeting_inquiry', re: /\b(kumusta|musta|kamusta)\b/, boost: 0.3 },
  { intent: 'greeting_inquiry', re: /\b(hello|hi|hey|good morning|good evening)\b/, boost: 0.26 },
  { intent: 'fare_navigation_jeepney', re: /\b(plete|pamasahe|pasahe|bayad|sukli)\b/, boost: 0.36 },
  { intent: 'fare_navigation_jeepney', re: /\b(jeep|jeepney|multicab|tricycle|traysikel|bus)\b/, boost: 0.26 },
  { intent: 'fare_navigation_jeepney', re: /\b(lugar lang|para po|manaog|bababa)\b/, boost: 0.34 },
  { intent: 'price_bargaining', re: /\b(tagpila|magkano|how much)\b/, boost: 0.4 },
  { intent: 'price_bargaining', re: /\b(hangyo|tawad|mahal|barato|mura|expensive|cheap|discount)\b/, boost: 0.28 },
  { intent: 'price_bargaining', re: /\b(kilo|presyo|price|per kilo)\b/, boost: 0.18 },
  { intent: 'courtesy_gratitude', re: /\b(salamat|pasalamat|daghang salamat|maraming salamat|thank you|thanks)\b/, boost: 0.42 },
  { intent: 'courtesy_gratitude', re: /\b(palihog|please)\b/, boost: 0.12 },
  { intent: 'directional_inquiry', re: /\b(asa|diin|saan|where)\b/, boost: 0.32 },
  { intent: 'directional_inquiry', re: /\b(padulong|paano pumunta|how do i get|layo|duol|near|far)\b/, boost: 0.24 },
  { intent: 'directional_inquiry', re: /\b(eskina|kanto|terminal|merkado|palengke|market)\b/, boost: 0.12 },
  { intent: 'food_ordering', re: /\b(kaon|mokaon|mangaon|kain|kumain|order|eat)\b/, boost: 0.34 },
  { intent: 'food_ordering', re: /\b(isda|fish|manok|chicken|karne|meat|utan|ulam|kan-on|kanin|rice)\b/, boost: 0.26 },
  { intent: 'food_ordering', re: /\b(tubig|water|kape|coffee|juice|sabaw|soup)\b/, boost: 0.22 },
  { intent: 'pedagogical_clarification', re: /\b(unsaon|paano|how do you say|how to say|ipasabot|ibig sabihin|meaning)\b/, boost: 0.36 },
  { intent: 'pedagogical_clarification', re: /\b(grammar|gramatika|tudlo|turo|explain|palihog tudlo)\b/, boost: 0.3 },
  { intent: 'pedagogical_clarification', re: /\b(unsa ang|ano ang|what does|what is the difference)\b/, boost: 0.22 },
  { intent: 'casual_social', re: /\b(estorya|kwento|chika|chat|uban|kasama|together)\b/, boost: 0.22 },
  { intent: 'casual_social', re: /\b(gibuhat|ginagawa|doing|adlaw|araw|day)\b/, boost: 0.1 },
];

const TEMPERATURE = 0.12;
const MIN_SCORE = 0.06;
export const DEFAULT_CONFIDENCE_THRESHOLD = 0.55;

// ---------------------------------------------------------------------------
// Tokenisation + TF-IDF
// ---------------------------------------------------------------------------
const TOKEN_RE = /[\p{L}\p{N}]+(?:['’\-][\p{L}\p{N}]+)*/gu;

export function tokenize(text: string): string[] {
  const matches = (text || '').toLowerCase().normalize('NFKC').match(TOKEN_RE) || [];
  return matches.filter((token) => token.length > 1 || token === 'a' || token === 'i');
}

function features(tokens: string[]): string[] {
  const out = [...tokens];
  for (let i = 0; i < tokens.length - 1; i += 1) {
    out.push(`${tokens[i]}_${tokens[i + 1]}`);
  }
  return out;
}

const DOC_FEATURES = INTENTS.map((intent) => INTENT_EXEMPLARS[intent].map((doc) => features(tokenize(doc))));
const ALL_DOCS = DOC_FEATURES.flat();
const DOC_FREQUENCY = new Map<string, number>();
for (const doc of ALL_DOCS) {
  for (const term of new Set(doc)) {
    DOC_FREQUENCY.set(term, (DOC_FREQUENCY.get(term) || 0) + 1);
  }
}
const DOC_COUNT = ALL_DOCS.length;
const IDF = new Map<string, number>();
for (const [term, df] of DOC_FREQUENCY) {
  IDF.set(term, Math.log((1 + DOC_COUNT) / (1 + df)) + 1);
}

function vectorize(tokens: string[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const term of features(tokens)) {
    if (!IDF.has(term)) continue;
    counts.set(term, (counts.get(term) || 0) + 1);
  }

  const vector = new Map<string, number>();
  let norm = 0;
  for (const [term, count] of counts) {
    const weight = (1 + Math.log(count)) * (IDF.get(term) || 1);
    vector.set(term, weight);
    norm += weight * weight;
  }
  const length = Math.sqrt(norm) || 1;
  for (const [term, weight] of vector) vector.set(term, weight / length);
  return vector;
}

function cosine(a: Map<string, number>, b: Map<string, number>): number {
  const [small, large] = a.size <= b.size ? [a, b] : [b, a];
  let dot = 0;
  for (const [term, weight] of small) {
    const other = large.get(term);
    if (other) dot += weight * other;
  }
  return dot;
}

const EXEMPLAR_VECTORS: Record<IntentId, { vector: Map<string, number>; tokens: string[] }[]> = Object.fromEntries(
  INTENTS.map((intent) => [
    intent,
    INTENT_EXEMPLARS[intent].map((doc) => {
      const tokens = tokenize(doc);
      return { vector: vectorize(tokens), tokens };
    }),
  ])
) as Record<IntentId, { vector: Map<string, number>; tokens: string[] }[]>;

const INTENT_CENTROIDS: Record<IntentId, Map<string, number>> = Object.fromEntries(
  INTENTS.map((intent) => {
    const sum = new Map<string, number>();
    for (const { vector } of EXEMPLAR_VECTORS[intent]) {
      for (const [term, weight] of vector) {
        sum.set(term, (sum.get(term) || 0) + weight);
      }
    }
    let norm = 0;
    for (const weight of sum.values()) norm += weight * weight;
    const length = Math.sqrt(norm) || 1;
    for (const [term, weight] of sum) sum.set(term, weight / length);
    return [intent, sum];
  })
) as Record<IntentId, Map<string, number>>;

// ---------------------------------------------------------------------------
// Language ID lexicons
// ---------------------------------------------------------------------------
const CEBUANO = new Set([
  'maayong', 'buntag', 'hapon', 'gabii', 'udto', 'kumusta', 'musta', 'palihog',
  'unsa', 'asa', 'diin', 'ngano', 'pila', 'tagpila', 'kaayo', 'bitaw', 'gud',
  'karon', 'ganina', 'ugma', 'nimo', 'imong', 'ako', 'ikaw', 'siya', 'kami',
  'kita', 'ninyo', 'nila', 'dinhi', 'didto', 'wala', 'naa', 'naay', 'kinsa',
  'unsaon', 'plete', 'lugar', 'kan-anan', 'sud-an', 'tubig', 'isda', 'mangga',
  'mahal', 'barato', 'bayad', 'sukli', 'jeep', 'kanto', 'eskina', 'lami',
  'kaon', 'inom', 'palit', 'balay', 'eskwela', 'maestro', 'estudyante',
  'amigo', 'amiga', 'bata', 'mama', 'papa', 'adlaw', 'tabang', 'tudlo',
  'estorya', 'uban', 'gibuhat', 'nalingaw', 'kapoy', 'salamat', 'pasalamat',
  'daghang', 'mokaon', 'mangaon', 'manaog', 'padulong', 'duol', 'layo',
  'presyo', 'tindahan', 'merkado', 'multicab', 'traysikel', 'kan-on', 'sabaw',
  'bisaya', 'cebuano', 'pagsulti', 'sulti', 'litok', 'sinulti', 'istorya',
]);

const FILIPINO = new Set([
  'ang', 'ng', 'mga', 'sa', 'ako', 'ikaw', 'siya', 'kami', 'tayo', 'natin',
  'namin', 'ninyo', 'kanila', 'po', 'opo', 'paki', 'ano', 'saan', 'bakit',
  'magkano', 'napaka', 'masyado', 'din', 'rin', 'daw', 'raw', 'naman', 'kasi',
  'pamasahe', 'pasahe', 'kainan', 'ulam', 'eskinita', 'kuya', 'ate', 'salamat',
  'kumusta', 'kamusta', 'mahal', 'mura', 'bayad', 'sukli', 'jeep', 'merkado',
  'tindahan', 'bili', 'kain', 'kumain', 'tubig', 'isda', 'mangga', 'kanin',
  'ulitaw', 'dalaga', 'magandang', 'umaga', 'hapon', 'gabi', 'araw', 'gabi',
  'paano', 'pumunta', 'malapit', 'malayo', 'magkano', 'presyo', 'tawad',
]);

const ENGLISH = new Set([
  'hello', 'hi', 'hey', 'thanks', 'thank', 'please', 'how', 'where', 'why',
  'what', 'when', 'who', 'much', 'many', 'the', 'this', 'that', 'these',
  'those', 'is', 'are', 'am', 'was', 'were', 'be', 'been', 'do', 'does',
  'did', 'can', 'could', 'would', 'should', 'will', 'want', 'need', 'like',
  'go', 'going', 'eat', 'buy', 'price', 'cheap', 'expensive', 'fare',
  'jeepney', 'market', 'food', 'water', 'fish', 'mango', 'good', 'morning',
  'afternoon', 'evening', 'night', 'yes', 'no', 'not', 'sorry', 'excuse',
  'me', 'my', 'your', 'our', 'they', 'them', 'we', 'you', 'i', 'is', 'it',
  'there', 'here', 'near', 'far', 'get', 'take', 'order', 'menu', 'rice',
  'chicken', 'coffee', 'kilo', 'discount', 'lower', 'option', 'kind', 'help',
  'appreciate', 'again', 'day', 'long', 'chat', 'relax', 'fun', 'sounds',
]);

const SHARED_MARKERS = new Set([
  'kumusta', 'kamusta', 'salamat', 'mahal', 'bayad', 'sukli', 'jeep',
  'merkado', 'tindahan', 'tubig', 'isda', 'mangga', 'presyo', 'palit', 'bili',
  'kain', 'kaon', 'kanto', 'lugar', 'terminal', 'piso', 'pesos',
]);

const DAVAO_MARKERS = /\b(bitaw|gud|gani|karon|mao\s+ba|unsa|asa|naa|naay|dinhi|didto|kaayo)\b/;

// ---------------------------------------------------------------------------
// Entities
// ---------------------------------------------------------------------------
const NUMBER_WORDS: Record<string, number> = {
  usa: 1, isa: 1, duha: 2, dalawa: 2, tulo: 3, tatlo: 3, upat: 4, apat: 4,
  lima: 5, unom: 6, anim: 6, pito: 7, walo: 8, siyam: 9, napulo: 10,
  sampu: 10, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7,
  eight: 8, nine: 9, ten: 10,
};

const TRANSPORT = ['jeep', 'jeepney', 'multicab', 'tricycle', 'traysikel', 'taxi', 'bus', 'habal-habal', 'grab'];
const FOOD = ['isda', 'fish', 'manok', 'chicken', 'karne', 'meat', 'utan', 'ulam', 'kan-on', 'kanin', 'rice', 'pancit', 'adobo', 'mangga', 'mango', 'tubig', 'water', 'kape', 'coffee', 'juice', 'sabaw', 'soup'];
const PLACES = ['bankerohan', 'roxas', 'davao', 'cebu', 'sm', 'gaisano', 'aldevinco', 'magsaysay', 'matina', 'bajada', 'toril', 'calinan', 'tagum', 'digos', 'terminal', 'merkado', 'palengke', 'market', 'eskina', 'kanto'];
const TIME_MARKERS = ['buntag', 'udto', 'hapon', 'gabii', 'umaga', 'gabi', 'karon', 'ngayon', 'ugma', 'bukas', 'ganina', 'kanina', 'today', 'tomorrow', 'morning', 'afternoon', 'evening', 'night'];
const POLITE_MARKERS = ['palihog', 'please', 'po', 'opo', 'salamat', 'thank you', 'thanks', 'ma\'am', 'sir'];

function extractEntities(tokens: string[], rawText: string): NlpEntity[] {
  const found: NlpEntity[] = [];
  const seen = new Set<string>();
  const add = (type: EntityType, value: string) => {
    const key = `${type}:${value.toLowerCase()}`;
    if (seen.has(key)) return;
    seen.add(key);
    found.push({ type, value });
  };

  // Currency / amount with explicit money context.
  const money = rawText.match(/(?:₱|php|piso|pesos?)\s*([0-9]{1,5}(?:\.[0-9]{1,2})?)|([0-9]{1,5}(?:\.[0-9]{1,2})?)\s*(?:pesos?|piso|php|₱)/i);
  if (money) {
    const amount = money[1] || money[2];
    if (amount) add('amount', `₱${amount}`);
  }

  for (const token of tokens) {
    const number = NUMBER_WORDS[token];
    if (number !== undefined) add('number', String(number));
    if (TRANSPORT.includes(token)) add('transport', token);
    if (FOOD.includes(token)) add('food', token);
    if (PLACES.includes(token)) add('place', token);
    if (TIME_MARKERS.includes(token)) add('time', token);
    if (POLITE_MARKERS.includes(token)) add('polite_marker', token);
  }

  return found.slice(0, 10);
}

// ---------------------------------------------------------------------------
// Language ID
// ---------------------------------------------------------------------------
function detectLanguage(tokens: string[], rawText: string): {
  language: LanguageLabel;
  confidence: number;
  dialect: string;
} {
  let cebuano = 0;
  let filipino = 0;
  let english = 0;

  for (const token of tokens) {
    if (SHARED_MARKERS.has(token)) {
      cebuano += 0.35;
      filipino += 0.35;
      continue;
    }
    if (CEBUANO.has(token)) cebuano += 1;
    if (FILIPINO.has(token)) filipino += 1;
    if (ENGLISH.has(token)) english += 1;
  }

  const total = Math.max(1, tokens.length);
  const scoreList: { label: LanguageLabel; score: number }[] = [
    { label: 'Cebuano (Bisaya)', score: cebuano / total },
    { label: 'Filipino (Tagalog)', score: filipino / total },
    { label: 'English', score: english / total },
  ];
  const scores = scoreList.sort((a, b) => b.score - a.score);

  const top = scores[0];
  const second = scores[1];

  if (top.score === 0) {
    return { language: 'Mixed / Unknown', confidence: 0.35, dialect: 'Unknown' };
  }

  // Both Bisaya and Filipino borrow heavily; when the margin is tiny, report a
  // mixed label instead of pretending to be certain.
  if (second.score > 0 && top.score - second.score < 0.1) {
    const mixed: LanguageLabel =
      top.label === 'English' && second.label === 'Cebuano (Bisaya)'
        ? 'Mixed (Bisaya + English)'
        : top.label === 'English' && second.label === 'Filipino (Tagalog)'
          ? 'Mixed (Filipino + English)'
          : 'Mixed (Bisaya + English)';
    return {
      language: mixed,
      confidence: Math.min(0.8, 0.5 + (top.score - second.score) * 0.6),
      dialect: DAVAO_MARKERS.test(rawText.toLowerCase()) ? 'Davao Bisaya' : 'Mixed',
    };
  }

  const confidence = Math.min(0.99, 0.55 + (top.score - second.score) * 0.9 + top.score * 0.25);
  const dialect =
    top.label === 'Cebuano (Bisaya)'
      ? DAVAO_MARKERS.test(rawText.toLowerCase())
        ? 'Davao Bisaya'
        : 'Cebuano (Bisaya)'
      : top.label === 'Filipino (Tagalog)'
        ? 'Filipino (Tagalog)'
        : 'English';

  return { language: top.label, confidence, dialect };
}

// ---------------------------------------------------------------------------
// Sentiment
// ---------------------------------------------------------------------------
function detectSentiment(tokens: string[], rawText: string): { sentiment: SentimentLabel; score: number } {
  const lower = rawText.toLowerCase();
  if (/\b(hindi ko alam|ambot|dili ko kahibalo|i don't know|not sure|maybe|tingali|siguro)\b/.test(lower)) {
    return { sentiment: 'Hesitant', score: 0.82 };
  }
  if (/\b(salamat|thank|pasalamat|please|palihog|po|opo|ma'am|sir)\b/.test(lower)) {
    return { sentiment: 'Polite', score: 0.93 };
  }
  if (/\b(saan|ano|bakit|paano|magkano|asa|unsa|diin|ngano|pila|tagpila|unsaon|how|where|why|what|much)\b/.test(lower) || rawText.includes('?')) {
    return { sentiment: 'Inquiring', score: 0.88 };
  }
  if (tokens.some((token) => ['po', 'opo', 'maam', 'sir', 'respectfully'].includes(token))) {
    return { sentiment: 'Formal', score: 0.84 };
  }
  return { sentiment: 'Casual', score: 0.8 };
}

// ---------------------------------------------------------------------------
// Main local classifier
// ---------------------------------------------------------------------------
export function analyzeLocal(
  text: string,
  options: { threshold?: number } = {}
): LocalNlpResult {
  const startedAt = performance.now();
  const threshold = Number.isFinite(options.threshold)
    ? Math.min(1, Math.max(0, Number(options.threshold)))
    : DEFAULT_CONFIDENCE_THRESHOLD;

  const clean = (text || '').trim().slice(0, 1200);
  const tokens = tokenize(clean);
  const vector = vectorize(tokens);
  const lower = clean.toLowerCase();

  const scored = INTENTS.map((intent) => {
    const centroidScore = cosine(vector, INTENT_CENTROIDS[intent]);
    const exemplarScore = EXEMPLAR_VECTORS[intent].reduce(
      (best, example) => Math.max(best, cosine(vector, example.vector)),
      0
    );
    const ruleScore = RULES.reduce(
      (sum, rule) => (rule.intent === intent && rule.re.test(lower) ? sum + rule.boost : sum),
      0
    );
    return {
      intent,
      score: centroidScore * 0.68 + exemplarScore * 0.22 + Math.min(0.8, ruleScore),
    };
  }).sort((a, b) => b.score - a.score);

  const topScore = scored[0]?.score || 0;
  const exps = scored.map((entry) => Math.exp((entry.score - topScore) / TEMPERATURE));
  const sum = exps.reduce((acc, value) => acc + value, 0) || 1;
  const probabilities = scored.map((entry, index) => ({
    intent: entry.intent,
    confidence: exps[index] / sum,
    score: entry.score,
  }));

  let confidence = probabilities[0]?.confidence || 0;
  if (tokens.length < 2) confidence = Math.min(confidence, 0.42);
  if (topScore < MIN_SCORE) confidence = Math.min(confidence, 0.38);
  confidence = Math.max(0, Math.min(1, confidence));

  const alternatives = probabilities.slice(0, 3).map((entry) => ({
    intent: entry.intent,
    confidence: Math.round(entry.confidence * 1000) / 1000,
  }));

  const language = detectLanguage(tokens, clean);
  const sentiment = detectSentiment(tokens, clean);
  const entities = extractEntities(tokens, clean);
  const negated = /\b(dili|wala|hindi|no|not|never|ayaw)\b/.test(lower);

  const keyTokens: NlpToken[] = [...vector.entries()]
    .filter(([term]) => !term.includes('_'))
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([token, weight], index) => ({
      token,
      weight: Math.round(Math.max(0.42, Math.min(0.98, weight * 4 - index * 0.05)) * 100) / 100,
    }));

  const fallbackTokens: NlpToken[] =
    keyTokens.length > 0
      ? keyTokens
      : tokens.slice(0, 8).map((token, index) => ({
          token,
          weight: Math.max(0.42, 0.95 - index * 0.08),
        }));

  return {
    predictedIntent: probabilities[0]?.intent || 'casual_social',
    intentConfidence: Math.round(confidence * 1000) / 1000,
    detectedLanguage: language.language,
    languageConfidence: Math.round(Math.min(0.99, language.confidence) * 1000) / 1000,
    dialect: language.dialect,
    sentiment: sentiment.sentiment,
    sentimentScore: sentiment.score,
    keyTokens: fallbackTokens,
    entities,
    alternatives,
    negated,
    tokenCount: tokens.length,
    bertModelRef: 'sulti-nlp-intent-v1 (offline TF-IDF cosine)',
    engine: 'local-tfidf',
    latencyMs: Math.round((performance.now() - startedAt) * 100) / 100,
    lowConfidence: confidence < threshold,
    threshold,
  };
}

/** Human-readable label used by the UI. */
export function intentLabel(intent: IntentId): string {
  return intent.replace(/_/g, ' ');
}
