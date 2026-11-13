export type ToolkitCategory = 'speaking' | 'core' | 'comprehension' | 'culture';

export interface ToolkitModule {
  id: string;
  num: string;
  title: string;
  purpose: string;
  icon: string;
  category: ToolkitCategory;
  promptSuggestion?: string;
  quickDescription: string;
  educationalPurpose?: string;
  gamificationMechanic?: string;
  gamificationBadge?: string;
}

export const TOOLKIT_CATEGORIES: Array<{ id: 'all' | ToolkitCategory; label: string }> = [
  { id: 'all', label: 'All 13 Tools' },
  { id: 'speaking', label: 'Speaking' },
  { id: 'core', label: 'Vocabulary & Grammar' },
  { id: 'comprehension', label: 'Listening & Reading' },
  { id: 'culture', label: 'Culture & Review' },
];

export function filterToolkitModules(
  modules: ToolkitModule[],
  category: 'all' | ToolkitCategory,
  searchQuery: string
): ToolkitModule[] {
  const query = searchQuery.trim().toLowerCase();
  return modules.filter((module) => {
    const matchesCategory = category === 'all' || module.category === category;
    const matchesSearch =
      !query ||
      module.title.toLowerCase().includes(query) ||
      module.purpose.toLowerCase().includes(query) ||
      module.quickDescription.toLowerCase().includes(query);
    return matchesCategory && matchesSearch;
  });
}

export const TOOLKIT_MODULES: ToolkitModule[] = [
  {
    id: 'voice',
    num: '01',
    title: 'Voice Practice',
    purpose: 'The Speaking City: Real-life missions',
    icon: '🏙️',    category: 'speaking',
    promptSuggestion: 'Gusto kong magpraktis og pagsulti sa The Speaking City destinations.',
    quickDescription: 'Explorable city destinations with real-life speaking missions and AI rubric evaluation.',
    educationalPurpose: 'Navigate realistic spoken situations across explorable city destinations with 4-criteria AI assessment.',
    gamificationMechanic: 'The Speaking City: Open-World Exploration & Missions',
    gamificationBadge: '🏙️ Speaking City',
  },
  {
    id: 'scenario',
    num: '02',
    title: 'Scenario Practice',
    purpose: 'Respond to everyday situations',
    icon: '🎭',    category: 'speaking',
    promptSuggestion: 'Mag-roleplay ta sa Bankerohan public market sa Davao.',
    quickDescription: 'Conversational roleplays in public markets, jeepneys, restaurants, and clinic visits.',
    educationalPurpose: 'Apply pragmatic cultural etiquette and decision-making in Philippine environments.',
    gamificationMechanic: 'Branching Scenarios, Decision Challenges & 3-Star Clear',
    gamificationBadge: '🗺️ Local Navigator',
  },
  {
    id: 'phrasebook',
    num: '03',
    title: 'Phrasebook',
    purpose: 'Learn useful expressions',
    icon: '💬',    category: 'core',
    promptSuggestion: 'Ilista ang labing importanteng mga pahayag sa adlaw-adlaw nga Bisaya.',
    quickDescription: 'Curated pocket dictionary of daily expressions, directions, and greetings.',
    educationalPurpose: 'Build an organized index of high-utility expressions with native pronunciation audio.',
    gamificationMechanic: 'Phrase-Collection Milestones & Stamp Books',
    gamificationBadge: '📖 Pocket Polyglot',
  },
  {
    id: 'flashcards',
    num: '04',
    title: 'Flashcards',
    purpose: 'Memorize words & meanings',
    icon: '🃏',    category: 'core',
    promptSuggestion: 'Magpraktis ta og flashcard review sa mga bag-ong pulong.',
    quickDescription: 'Spaced repetition flashcards with bidirectional Bisaya-English recall.',
    educationalPurpose: 'Encode lexical items into long-term memory via spaced repetition intervals.',
    gamificationMechanic: 'XP Multipliers, Streaks & Spaced Repetition Boxes',
    gamificationBadge: '🃏 Memory Champion',
  },
  {
    id: 'pronunciation',
    num: '05',
    title: 'Pronunciation Lab',
    purpose: 'Improve pronunciation accuracy',
    icon: '🎯',    category: 'speaking',
    promptSuggestion: 'I-check akong pronunciation ug intonation sa Bisaya.',
    quickDescription: 'Whisper ASR phoneme matching and acoustic tone concordance scoring.',
    educationalPurpose: 'Calibrate phonetic accuracy, vowel length, and regional Visayan glottal stops.',
    gamificationMechanic: 'Listen, Record, Compare, Retry & Concordance Meter (%)',
    gamificationBadge: '🎯 Native Accent Ring',
  },
  {
    id: 'grammar',
    num: '06',
    title: 'Grammar',
    purpose: 'Build correct sentences',
    icon: '📖',    category: 'core',
    promptSuggestion: 'Ipasabot kanako ang focus system ug markers (ang, sa, ug) sa Bisaya.',
    quickDescription: 'Actor vs object focus triggers, topic markers, aspect inflections, and word order.',
    educationalPurpose: 'Deconstruct Austronesian alignment, focus triggers (mag-/mi- vs -on/-an), and case markers.',
    gamificationMechanic: 'Progressive Exercises & Sentence Puzzles',
    gamificationBadge: '🧩 Syntax Architect',
  },
  {
    id: 'vocabulary',
    num: '07',
    title: 'Vocabulary Notebook',
    purpose: 'Save and reinforce words',
    icon: '📚',    category: 'core',
    promptSuggestion: 'Tudloi ko og bag-ong bokabularyo sa Bisaya bahin sa pagkaon ug pamuyo.',
    quickDescription: 'Track active and passive vocabulary mastery with thematic word clusters.',
    educationalPurpose: 'Organize words by semantic domains and shift passive recognition to active production.',
    gamificationMechanic: 'Personal Word Goals & Mastery Tracking Vaults',
    gamificationBadge: '📚 100-Word Master',
  },
  {
    id: 'listening',
    num: '08',
    title: 'Listening',
    purpose: 'Understand spoken language',
    icon: '🎧',    category: 'comprehension',
    promptSuggestion: 'Paminawon nako ang audio recording sa tinuod nga panag-istoryahanay.',
    quickDescription: 'Comprehension exercises listening to diverse Visayan and Mindanao accents.',
    educationalPurpose: 'Train the auditory cortex to segment continuous speech and understand dialectal variations.',
    gamificationMechanic: 'Audio Comprehension Missions & Ear Detective Checkpoints',
    gamificationBadge: '👂 Visayan Ear Specialist',
  },
  {
    id: 'writing',
    num: '09',
    title: 'Writing',
    purpose: 'Construct written responses',
    icon: '✍️',    category: 'core',
    promptSuggestion: 'Tabangi ko sa pagsulat og mensahe o sulat sa Bisaya.',
    quickDescription: 'Sentence creation drills, texting slang, and polite formal Bisaya writing.',
    educationalPurpose: 'Formulate coherent written sentences, text messages, and social expressions.',
    gamificationMechanic: 'Writing Challenges & Rubric-Based NLP Feedback',
    gamificationBadge: '✍️ Visayan Scribe',
  },
  {
    id: 'reading',
    num: '10',
    title: 'Reading',
    purpose: 'Understand written passages',
    icon: '📕',    category: 'comprehension',
    promptSuggestion: 'Basahon nato kining Bisaya nga sugilanon o balita.',
    quickDescription: 'Local folk narratives, news headlines, and dialogue transcripts.',
    educationalPurpose: 'Develop reading comprehension and cultural fluency through authentic short stories.',
    gamificationMechanic: 'Reading Quests & Comprehension Checkpoints',
    gamificationBadge: '📕 Story Reader',
  },
  {
    id: 'sulti_switch',
    num: '11',
    title: 'Sulti Switch',
    purpose: 'Practice switching between languages',
    icon: '🔄',    category: 'comprehension',
    promptSuggestion: 'Maghimo ta og paspas nga translation drills tali sa English ug Bisaya.',
    quickDescription: 'Rapid translation drills shifting your thoughts from English to Bisaya without stutter.',
    educationalPurpose: 'Eliminate translation lag and foster cognitive code-switching reflexes.',
    gamificationMechanic: 'Speed Drills, Reflex Combos & Translation Challenges',
    gamificationBadge: '🔄 Bilingual Dynamo',
  },
  {
    id: 'culture',
    num: '12',
    title: 'Culture Notes',
    purpose: 'Learn cultural context & usage',
    icon: '🌏',    category: 'culture',
    promptSuggestion: 'Ipaambit ang mga kostumbre ug kultura sa mga Bisaya ug taga-Mindanao.',
    quickDescription: 'Social etiquette, pasalubong customs, tabo market days, and regional hospitality.',
    educationalPurpose: 'Internalize regional etiquette, honorific nuances, and community norms.',
    gamificationMechanic: 'Cultural Quests, Etiquette Passport Stamps & Lore Unlocks',
    gamificationBadge: '🌏 Cultural Ambassador',
  },
  {
    id: 'review_center',
    num: '13',
    title: 'Review Center',
    purpose: 'Reinforce previously learned material',
    icon: '🔁',    category: 'culture',
    promptSuggestion: 'I-review nato ang tanang napakyas o lisud nga mga leksyon karong semanaha.',
    quickDescription: 'Smart review algorithm compiling your past mistakes and weak phonemes.',
    educationalPurpose: 'Reinforce fragile memories through intelligent review of past errors.',
    gamificationMechanic: 'Personalized Review Missions & Mistake Clean-Up Meter',
    gamificationBadge: '🔁 Review Champion',
  },
];
