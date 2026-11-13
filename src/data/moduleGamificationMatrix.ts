// Module Educational Matrix & Gamification Blueprint
// Designed for SultiAI Capstone Research:
// "SultiAI: An AI-Powered Community Language and Communication Hub for Non-Native Speakers Using Whisper Speech Recognition and BERT-Based NLP"

export interface ModuleGamificationSpec {
  moduleId: string;
  name: string;
  primaryPurpose: string;
  coreLearningAction: string;
  gamificationMechanic: string;
  mechanicLabel: string;
  badgeMilestone: string;
  sampleMission: {
    title: string;
    description: string;
    targetSkill: string;
    xp: number;
  };
  metricsEvaluated: string[];
}

export const MODULE_GAMIFICATION_MATRIX: Record<string, ModuleGamificationSpec> = {
  voice: {
    moduleId: 'voice',
    name: 'Voice Practice',
    primaryPurpose: 'Communicate naturally in dynamic spoken interactions across authentic real-life Philippine destinations.',
    coreLearningAction: 'Explore city destinations and complete realistic speaking missions with audio recording & AI evaluation.',
    gamificationMechanic: 'The Speaking City: Open-World Exploration & Mission-Based Adventure',
    mechanicLabel: 'The Speaking City (5 Destinations)',
    badgeMilestone: '🏙️ Speaking City Explorer (Master missions across Cafe, Market, School, Terminal, and Community Center)',
    sampleMission: {
      title: 'Order at the Carenderia & Friendly Market Bargaining',
      description: 'Navigate real-world conversations in Cebuano or Filipino with constructive 4-criteria AI feedback.',
      targetSkill: 'Spoken communicative competence, situational etiquette, and natural fluency',
      xp: 45,
    },
    metricsEvaluated: ['Task completion', 'Vocabulary usage', 'Language use & grammar', 'Communication & politeness'],
  },
  scenario: {
    moduleId: 'scenario',
    name: 'Scenario Practice',
    primaryPurpose: 'Navigate practical, high-stakes everyday life situations in Philippine settings.',
    coreLearningAction: 'Make context-sensitive conversational choices and roleplay branching dialogues.',
    gamificationMechanic: 'Branching Dialogue Challenges & Situational Stars',
    mechanicLabel: 'Scenario Clear Badges & 3-Star Mastery',
    badgeMilestone: '🗺️ Local Navigator (Master Bankerohan Market, Jeepney, and Carenderia)',
    sampleMission: {
      title: 'Bargain at Tabo Market Day',
      description: 'Negotiate price for ripe mangoes and request a discount using polite Visayan etiquette.',
      targetSkill: 'Situational etiquette and pragmatic competence',
      xp: 50,
    },
    metricsEvaluated: ['Pragmatic appropriateness', 'Branch completion', 'Politeness markers'],
  },
  phrasebook: {
    moduleId: 'phrasebook',
    name: 'Phrasebook',
    primaryPurpose: 'Build an indexed, ready-to-use arsenal of daily Visayan/Filipino expressions.',
    coreLearningAction: 'Search, bookmark, listen to native audio, and test retrieval in daily context.',
    gamificationMechanic: 'Phrase Collector Milestones & Category Stamps',
    mechanicLabel: 'Collector Level & Unlockable Phrases',
    badgeMilestone: '📖 Pocket Polyglot (Unlock 50 essential survival expressions)',
    sampleMission: {
      title: 'Commuter Survival Toolkit',
      description: 'Save and pronounce all 5 essential jeepney transit phrases.',
      targetSkill: 'Lexical retrieval and situational readiness',
      xp: 30,
    },
    metricsEvaluated: ['Phrases bookmarked', 'Audio playback frequency', 'Recall speed'],
  },
  flashcards: {
    moduleId: 'flashcards',
    name: 'Flashcards',
    primaryPurpose: 'Commit core vocabulary and syntactic chunks to long-term memory.',
    coreLearningAction: 'Spaced repetition memory review with bidirectional recall.',
    gamificationMechanic: 'Spaced Repetition Mastery (SM-2), Streak Multipliers & Box Leaps',
    mechanicLabel: 'Repetition Streak & Mastery Boxes',
    badgeMilestone: '🃏 Memory Champion (Advance 30 cards into Permanent Memory Box)',
    sampleMission: {
      title: 'Daily 10-Card Memory Sprint',
      description: 'Review 10 spaced-repetition cards without missing 2 consecutive items.',
      targetSkill: 'Active memory retrieval & retention curves',
      xp: 35,
    },
    metricsEvaluated: ['Recall accuracy', 'Interval spacing tier', 'Review consistency streak'],
  },
  pronunciation: {
    moduleId: 'pronunciation',
    name: 'Pronunciation Lab',
    primaryPurpose: 'Achieve accurate acoustic pronunciation, glottal stops, and syllable stress.',
    coreLearningAction: 'Listen to native reference, record learner voice, and analyze acoustic concordance.',
    gamificationMechanic: 'Acoustic Concordance Meter, 3-Star Phoneme Rating & Retry Loops',
    mechanicLabel: 'Whisper ASR Phoneme Concordance (%)',
    badgeMilestone: '🎯 Native Accent Ring (Attain 90%+ acoustic score on 10 drills)',
    sampleMission: {
      title: 'Glottal Stop Accuracy Drill',
      description: 'Pronounce "buntag", "palihog", and "salamat" with clean Visayan acoustic cadence.',
      targetSkill: 'Phonetic accuracy, vowel purity, glottal alignment',
      xp: 40,
    },
    metricsEvaluated: ['Acoustic alignment score', 'Vowel formant accuracy', 'Repetition progress'],
  },
  grammar: {
    moduleId: 'grammar',
    name: 'Grammar',
    primaryPurpose: 'Understand Cebuano Austronesian voice alignment (Actor vs Goal focus) and topic markers.',
    coreLearningAction: 'Assemble words into syntactically valid sentences; distinguish focus markers.',
    gamificationMechanic: 'Sentence Assembly Puzzles & Syntactic Accuracy Meters',
    mechanicLabel: 'Puzzle Assembly Streak & Grammar Stars',
    badgeMilestone: '🧩 Syntax Architect (Solve 20 Philippine sentence-focus puzzles)',
    sampleMission: {
      title: 'Actor vs Goal Focus: "Mikaon" vs "Gikaon"',
      description: 'Assemble the sentence correctly depending on whether the eater or the food is the topic.',
      targetSkill: 'Austronesian voice system & marker alignment (ang, sa, ug)',
      xp: 45,
    },
    metricsEvaluated: ['Marker placement accuracy', 'Focus trigger understanding', 'Word order flow'],
  },
  vocabulary: {
    moduleId: 'vocabulary',
    name: 'Vocabulary Notebook',
    primaryPurpose: 'Expand thematic lexicon and transition words from passive recognition to active production.',
    coreLearningAction: 'Collect, group, and categorize words by semantic themes (food, kinship, transit).',
    gamificationMechanic: 'Thematic Word Vaults & Personal Vocabulary Mastery Level',
    mechanicLabel: 'Word Bank Tier (Bronze → Silver → Gold)',
    badgeMilestone: '📚 100-Word Lexicon Master (Master 100 verified vocabulary words)',
    sampleMission: {
      title: 'Carenderia & Cooking Lexicon Vault',
      description: 'Add and master 5 staple Cebuano dining terms into your active bank.',
      targetSkill: 'Thematic vocabulary acquisition and lexical breadth',
      xp: 35,
    },
    metricsEvaluated: ['Active words banked', 'Semantic retention', 'Contextual usage'],
  },
  listening: {
    moduleId: 'listening',
    name: 'Listening',
    primaryPurpose: 'Decipher real spoken Bisaya across natural speech rates, contractions, and regional accents.',
    coreLearningAction: 'Listen to audio clips without text first, answer comprehension checkpoints, then read transcript.',
    gamificationMechanic: 'Audio Detective Quests & Ear-Training Accuracy Checkpoints',
    mechanicLabel: 'Listening Comprehension Score (%)',
    badgeMilestone: '👂 Visayan Ear Specialist (Score 100% on 8 natural dialogue audios)',
    sampleMission: {
      title: 'Jeepney Route Audio Comprehension',
      description: 'Listen to a passenger conversation in Davao and identify the destination spoken.',
      targetSkill: 'Auditory processing, identifying contractions (e.g. "wa" for "wala")',
      xp: 40,
    },
    metricsEvaluated: ['Auditory comprehension rate', 'Listening retry count', 'Transcript reveal delay'],
  },
  writing: {
    moduleId: 'writing',
    name: 'Writing',
    primaryPurpose: 'Formulate written Bisaya and Filipino sentences, text messages, and social notes.',
    coreLearningAction: 'Type or construct written sentences responding to contextual writing prompts.',
    gamificationMechanic: 'Writing Quests with Instant Rubric Feedback (BERT/NLP Grammar Check)',
    mechanicLabel: 'Writing Fluency XP & Accuracy Rubric',
    badgeMilestone: '✍️ Visayan Scribe (Write 15 grammatically verified sentences)',
    sampleMission: {
      title: 'Text a Friend for Weekend Hangout',
      description: 'Write a 2-sentence SMS inviting your friend for coffee using conversational Bisaya.',
      targetSkill: 'Orthographic competence, particles (ba, bitaw, gyud), and texting etiquette',
      xp: 45,
    },
    metricsEvaluated: ['Grammatical correctness', 'Particle precision', 'Spelling concordance'],
  },
  reading: {
    moduleId: 'reading',
    name: 'Reading',
    primaryPurpose: 'Read and comprehend authentic Philippine texts: cultural stories, news, and signboards.',
    coreLearningAction: 'Read graded passages with inline tap-to-translate vocabulary, then answer story comprehension questions.',
    gamificationMechanic: 'Reading Quests, Story Unlocks & Comprehension Keys',
    mechanicLabel: 'Story Chapters Unlocked & Reading Speed',
    badgeMilestone: '📕 Story Reader (Complete 5 Visayan cultural folklore passages)',
    sampleMission: {
      title: 'The Legend of Mount Apo & Kadayawan Harvest',
      description: 'Read the short cultural summary and answer 3 questions about regional traditions.',
      targetSkill: 'Reading fluency, contextual inference, vocabulary expansion',
      xp: 40,
    },
    metricsEvaluated: ['Reading comprehension rate', 'Inline dictionary usage', 'Reading pace'],
  },
  sulti_switch: {
    moduleId: 'sulti_switch',
    name: 'Sulti Switch',
    primaryPurpose: 'Eliminate translation hesitation by training the brain to code-switch naturally without stutter.',
    coreLearningAction: 'Rapid-fire switching exercises: convert thoughts from English/Tagalog to Bisaya and vice-versa.',
    gamificationMechanic: 'Timed Speed Drills, Combo Multipliers & Reflex Meter',
    mechanicLabel: 'Switch Reflex Combo (x2, x3, x5)',
    badgeMilestone: '🔄 Bilingual Dynamo (Complete a 10-question rapid switch round with zero errors)',
    sampleMission: {
      title: '60-Second Reflex Challenge',
      description: 'Translate 5 key phrases within 60 seconds with increasing combo multipliers.',
      targetSkill: 'Mental processing speed, code-switching agility, cognitive fluidity',
      xp: 50,
    },
    metricsEvaluated: ['Reaction time (seconds)', 'Combo streak', 'Error-free accuracy'],
  },
  culture: {
    moduleId: 'culture',
    name: 'Culture Notes',
    primaryPurpose: 'Master Philippine social dynamics, regional etiquette, hospitality customs, and respectful address.',
    coreLearningAction: 'Explore cultural deep-dives with interactive etiquette scenarios and knowledge checkpoints.',
    gamificationMechanic: 'Cultural Discovery Quests, Etiquette Passport Stamps & Lore Unlocks',
    mechanicLabel: 'Cultural Passport Level & Regional Stamps',
    badgeMilestone: '🌏 Cultural Ambassador (Earn stamps for Visayas, Mindanao, and Luzon etiquette)',
    sampleMission: {
      title: 'Jeepney Etiquette & Bayad Passing Protocol',
      description: 'Learn why handing fare requires saying "palihog" and passing it with respectful eye contact.',
      targetSkill: 'Sociolinguistic awareness, respectful honorifics, cultural empathy',
      xp: 35,
    },
    metricsEvaluated: ['Cultural quiz accuracy', 'Etiquette scenario score', 'Cultural passport completed'],
  },
  review_center: {
    moduleId: 'review_center',
    name: 'Review Center',
    primaryPurpose: 'Consolidate weak points, review past errors, and prevent the forgetting curve.',
    coreLearningAction: 'Target personalized exercises dynamically generated from historical mistakes across all modules.',
    gamificationMechanic: 'Personalized Review Missions, Mistake Clean-Up Meter & Mastery Recovery',
    mechanicLabel: 'Error Clean-Up % & Fluency Shield',
    badgeMilestone: '🔁 Review Champion (Clear 25 previously flagged mistakes from memory)',
    sampleMission: {
      title: 'Weekly Error Clean-Up Drill',
      description: 'Review 5 phrases where you previously had lower acoustic or grammar scores.',
      targetSkill: 'Long-term memory stabilization and error correction',
      xp: 50,
    },
    metricsEvaluated: ['Weak items resolved', 'Error reduction percentage', 'Mastery retention'],
  },
};
