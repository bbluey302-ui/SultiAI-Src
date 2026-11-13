export type VoiceLanguageCategory = 'cebuano' | 'filipino' | 'english';

export type VoiceDifficulty = 'Easy' | 'Medium' | 'Hard' | 'Expert';

export interface VoiceChallenge {
  id: string;
  phraseNative: string;
  phraseEnglish: string;
  phoneticGuide: string;
  contextTip: string;
  dialectNuance: string;
  recommendedTone: string;
  difficulty: VoiceDifficulty;
}

export interface VoiceBadge {
  id: string;
  name: string;
  nameNative: string;
  nameBisaya?: string;
  tier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond';
  icon: string;
  description: string;
  descriptionBisaya?: string;
  criteria: string;
  xpReward: number;
  gemsReward: number;
}

export interface VoiceLevel {
  id: number;
  title: string;
  titleNative: string;
  subtitle: string;
  difficulty: VoiceDifficulty;
  badge: VoiceBadge;
  accentColor: string;
  bgGradient: string;
  minAccuracy: number;
  challenges: VoiceChallenge[];
}

export interface VoiceUserProgress {
  unlockedLevel: number;
  completedLevels: number[];
  completedChallenges: string[];
  earnedBadges: string[];
  totalVoiceXp: number;
  highestAccuracy: number;
}

export const INITIAL_VOICE_PROGRESS: VoiceUserProgress = {
  unlockedLevel: 1,
  completedLevels: [],
  completedChallenges: [],
  earnedBadges: [],
  totalVoiceXp: 0,
  highestAccuracy: 88,
};

// -----------------------------------------------------------------------------
// 1. CEBUANO / BISAYA VOICE LEARNING PATH (Levels 1 to 5 with Hard challenges)
// -----------------------------------------------------------------------------
export const CEBUANO_VOICE_LEVELS: VoiceLevel[] = [
  {
    id: 1,
    title: 'Level 1: Speech Foundations',
    titleNative: 'Antas 1: Sukaranan sa Pagsulti',
    subtitle: 'Warm up your tongue with core Bisaya greetings & polite expressions',
    difficulty: 'Easy',
    minAccuracy: 75,
    accentColor: 'emerald',
    bgGradient: 'from-emerald-500 to-teal-600',
    badge: {
      id: 'badge_voice_ceb_lv1',
      name: 'Bisaya Voice Starter',
      nameNative: 'Tingog Nagsugod 🥉',
      tier: 'Bronze',
      icon: '🥉',
      description: 'Mastered introductory Bisaya phonemes and daily greetings.',
      criteria: 'Pass all Level 1 drills with ≥75% accuracy',
      xpReward: 60,
      gemsReward: 15,
    },
    challenges: [
      {
        id: 'v_ceb_1_1',
        phraseNative: 'Maayong buntag! Kumusta man ka karon?',
        phraseEnglish: 'Good morning! How are you doing today?',
        phoneticGuide: 'mah-AH-yong BOON-tag! koo-MOOS-tah mahn kah kah-ROHN?',
        contextTip: 'Keep a warm, smiling tone. Bisaya vowels are crisp and open.',
        dialectNuance: 'Davao & Cebu standard greeting across all social settings.',
        recommendedTone: 'Cheerful & welcoming',
        difficulty: 'Easy',
      },
      {
        id: 'v_ceb_1_2',
        phraseNative: 'Salamat kaayo, amping pirmi sa biyahe.',
        phraseEnglish: 'Thank you very much, always take care on your trip.',
        phoneticGuide: 'sah-LAH-maht KAH-ah-yoh, ahm-PING PEER-mee sah bee-YAH-heh.',
        contextTip: '"Amping" is a heartfelt Bisaya way to show care and solidarity.',
        dialectNuance: '"Pirmi" means always; universally understood in Mindanao & Visayas.',
        recommendedTone: 'Polite & caring',
        difficulty: 'Easy',
      },
      {
        id: 'v_ceb_1_3',
        phraseNative: 'Walay sapayan, higala. Malipayon ko.',
        phraseEnglish: 'You are very welcome, friend. I am happy.',
        phoneticGuide: 'wah-LIE sah-PAH-yahn, hee-GAH-lah. mah-lee-PAH-yohn koh.',
        contextTip: 'Pronounce "walay" without rushing; the glottal stop is gentle.',
        dialectNuance: 'Higala (friend) adds genuine warmth to any interaction.',
        recommendedTone: 'Friendly & courteous',
        difficulty: 'Easy',
      },
    ],
  },
  {
    id: 2,
    title: 'Level 2: Commute & Daily Flow',
    titleNative: 'Antas 2: Pagsakay ug Plete',
    subtitle: 'Commuter phrases for jeepneys, tricycles & passenger navigation',
    difficulty: 'Medium',
    minAccuracy: 80,
    accentColor: 'blue',
    bgGradient: 'from-blue-500 to-indigo-600',
    badge: {
      id: 'badge_voice_ceb_lv2',
      name: 'Jeepney Commuter Pro',
      nameNative: 'Haniti sa Sakayan 🥈',
      tier: 'Silver',
      icon: '🥈',
      description: 'Navigated commuter acoustic speech without hesitation.',
      criteria: 'Pass all Level 2 drills with ≥80% accuracy',
      xpReward: 90,
      gemsReward: 25,
    },
    challenges: [
      {
        id: 'v_ceb_2_1',
        phraseNative: 'Palihog ko sa plete, Nong. Usa lang sa kanto.',
        phraseEnglish: 'Please pass my fare, driver. Just one to the corner.',
        phoneticGuide: 'pah-LEE-hog koh sah PLEH-teh, NONG. OO-sah lahng sah KAHN-toh.',
        contextTip: 'Project your voice clearly over the rumbling jeepney engine.',
        dialectNuance: '"Nong" is the affectionate, respectful contraction for Manong.',
        recommendedTone: 'Confident & loud enough for driver',
        difficulty: 'Medium',
      },
      {
        id: 'v_ceb_2_2',
        phraseNative: 'Lugar lang, Nong! Sa unahan ra ko manaog.',
        phraseEnglish: 'Pull over here, driver! I will disembark just ahead.',
        phoneticGuide: 'loo-GAHR lahng, NONG! sah oo-NAH-hahn rah koh mah-NAH-og.',
        contextTip: 'Say "Lugar lang!" 20 meters before your intended corner.',
        dialectNuance: 'Crucial cultural marker: Bisaya speakers say "Lugar lang" instead of Tagalog "Para".',
        recommendedTone: 'Clear & assertive call',
        difficulty: 'Medium',
      },
      {
        id: 'v_ceb_2_3',
        phraseNative: 'Naa bay sukli ang singkwenta pesos para sa duha?',
        phraseEnglish: 'Is there change for fifty pesos for two passengers?',
        phoneticGuide: 'NAH-ah by SOOK-lee ahng sing-KWEN-tah PEH-sohs PAH-rah sah doo-HAH?',
        contextTip: 'Inquire politely so the driver or front passenger prepares coins.',
        dialectNuance: '"Naa bay" is the standard existential interrogative.',
        recommendedTone: 'Polite inquiry',
        difficulty: 'Medium',
      },
    ],
  },
  {
    id: 3,
    title: 'Level 3: Market & Public Bargaining',
    titleNative: 'Antas 3: Hangyo sa Merkado',
    subtitle: 'Negotiate fresh produce & ask prices courteously',
    difficulty: 'Medium',
    minAccuracy: 82,
    accentColor: 'amber',
    bgGradient: 'from-amber-500 to-orange-600',
    badge: {
      id: 'badge_voice_ceb_lv3',
      name: 'Palengke Negotiator',
      nameNative: 'Hawod Manghangyo 🥇',
      tier: 'Gold',
      icon: '🥇',
      description: 'Mastered marketplace bargaining etiquette and pricing intonation.',
      criteria: 'Pass all Level 3 drills with ≥82% accuracy',
      xpReward: 120,
      gemsReward: 35,
    },
    challenges: [
      {
        id: 'v_ceb_3_1',
        phraseNative: 'Tagpila ang kilo sa preskong mangga, Nang? Puyde hangyo?',
        phraseEnglish: 'How much per kilo for the fresh mangoes, ma\'am? Can I get a discount?',
        phoneticGuide: 'tag-PEE-lah ahng KEE-loh sah PREHS-kohng MAHN-gah, NAHNG? POOY-deh HAHNG-yoh?',
        contextTip: 'Blend respectful titles ("Nang") with a warm, pleading smile.',
        dialectNuance: '"Hangyo" is the quintessential Visayan art of friendly bargaining.',
        recommendedTone: 'Playful & respectful inquiry',
        difficulty: 'Medium',
      },
      {
        id: 'v_ceb_3_2',
        phraseNative: 'Tagaan ko nimog dos kilos kung tag-otsenta pesos na lang?',
        phraseEnglish: 'Will you give me two kilos if we make it eighty pesos each?',
        phoneticGuide: 'tah-gah-AHN koh NEE-mohg DOHS KEE-lohs koong tag-oht-SEHN-tah PEH-sohs nah lahng?',
        contextTip: 'Maintain steady cadence when combining Spanish loan numbers with Bisaya.',
        dialectNuance: 'Davao wet markets routinely blend Spanish numbers for peso prices.',
        recommendedTone: 'Good-natured counter-offer',
        difficulty: 'Medium',
      },
      {
        id: 'v_ceb_3_3',
        phraseNative: 'Paki-timbang palihog, Nang. Isagol ang hinog ug hilaw.',
        phraseEnglish: 'Please weigh it, ma\'am. Mix the ripe and green ones.',
        phoneticGuide: 'PAH-kee tim-BAHNG pah-LEE-hog, NAHNG. ee-SAH-gol ahng HEE-nog oog HEE-law.',
        contextTip: 'Clear terminal consonants on "hinog" and "hilaw".',
        dialectNuance: 'Vendor instruction standard in Bankerohan and Carbon markets.',
        recommendedTone: 'Polite customer instruction',
        difficulty: 'Medium',
      },
    ],
  },
  {
    id: 4,
    title: 'Level 4: Intonation & Glottal Precision',
    titleNative: 'Antas 4: Tukma nga Patingog ug Diin',
    subtitle: 'Master complex glottal stops, vowel contrasts & particle nuances',
    difficulty: 'Hard',
    minAccuracy: 85,
    accentColor: 'rose',
    bgGradient: 'from-rose-500 to-pink-600',
    badge: {
      id: 'badge_voice_ceb_lv4',
      name: 'Glottal Master',
      nameNative: 'Tukma nga Tingog 💎',
      tier: 'Platinum',
      icon: '💎',
      description: 'Conquered subtle Visayan glottal stops and vowel length contrasts.',
      criteria: 'Pass all Level 4 drills with ≥85% accuracy',
      xpReward: 160,
      gemsReward: 50,
    },
    challenges: [
      {
        id: 'v_ceb_4_1',
        phraseNative: 'Basaha ang bag-ong basahon samtang basa pa ang salog.',
        phraseEnglish: 'Read the new book while the floor is still wet.',
        phoneticGuide: 'bah-sah-HAH ahng BAG-ong bah-sah-HOHN sahm-TAHNG BAH-sah pah ahng SAH-log.',
        contextTip: 'Hard phoneme contrast: Notice the difference between "basa" (wet) and "basaha" (read it).',
        dialectNuance: 'Minimal pair drill distinguishing open vs glottal vowels.',
        recommendedTone: 'Deliberate & crisp articulation',
        difficulty: 'Hard',
      },
      {
        id: 'v_ceb_4_2',
        phraseNative: 'Gusto kog sud-an nga walay mantika ug daghang sabaw.',
        phraseEnglish: 'I want a dish that has no oil and plenty of broth.',
        phoneticGuide: 'GOOS-toh kog SOOD-ahn ngah wah-LIE mahn-TEE-kah oog dag-HAHNG sah-BAW.',
        contextTip: 'Ensure crisp glottal catch between "sud" and "an" (sud-an).',
        dialectNuance: 'Hyphenated glottal stop is distinctive to Visayan morphology.',
        recommendedTone: 'Discerning diner tone',
        difficulty: 'Hard',
      },
      {
        id: 'v_ceb_4_3',
        phraseNative: 'Dili ba diay ka moadto sa Tagum unyang hapon?',
        phraseEnglish: 'Are you really not going to Tagum this afternoon after all?',
        phoneticGuide: 'DEE-lee bah dee-EYE kah moh-AHD-toh sah TAH-goom OON-yahng HAH-pon?',
        contextTip: 'Combine clarification particles "ba" and "diay" naturally without pausing.',
        dialectNuance: 'Intonation peaks on "diay" then resolves gently on "Tagum".',
        recommendedTone: 'Surprised & inquiring',
        difficulty: 'Hard',
      },
    ],
  },
  {
    id: 5,
    title: 'Level 5: Rapid Fluent Banter & Slang',
    titleNative: 'Antas 5: Madasigong Sulti sa Kadalanan',
    subtitle: 'Speak at full conversational native speed with emotive particles & slang',
    difficulty: 'Hard',
    minAccuracy: 88,
    accentColor: 'purple',
    bgGradient: 'from-purple-600 to-violet-700',
    badge: {
      id: 'badge_voice_ceb_lv5',
      name: 'Bisaya Voice Master',
      nameNative: 'Tingog Haniti sa Katawhan 👑',
      tier: 'Diamond',
      icon: '👑',
      description: 'Mastered spontaneous native conversational pace with authentic Visayan flavor.',
      criteria: 'Pass all Level 5 drills with ≥88% accuracy',
      xpReward: 220,
      gemsReward: 75,
    },
    challenges: [
      {
        id: 'v_ceb_5_1',
        phraseNative: 'Mao bitaw na akong giingon! Ngano gud tawn nga nagduha-duha pa ka?',
        phraseEnglish: 'That is exactly what I said! Why on earth were you still hesitating?',
        phoneticGuide: 'MAH-oh bee-TAW nah AH-kong gee-EENG-on! NGAH-noh good tawn ngah nag-doo-hah-DOO-hah pah kah?',
        contextTip: 'Deliver "Mao bitaw na!" rapidly as a single rhythmic speech burst.',
        dialectNuance: '"Gud tawn" blends exasperation and playful affectionate emphasis.',
        recommendedTone: 'Expressive & impassioned friend banter',
        difficulty: 'Hard',
      },
      {
        id: 'v_ceb_5_2',
        phraseNative: 'Grabeha ka lingaw didto sa baybayon, mura mig wa kaila ug kapoy!',
        phraseEnglish: 'It was so tremendously fun at the beach, as if we did not know exhaustion!',
        phoneticGuide: 'grah-BEH-hah kah LEENG-aw DEED-toh sah by-BY-on, MOO-rah meeg wah kah-EE-lah oog KAH-poy!',
        contextTip: 'Capture the joyful, animated Visayan storytelling cadence.',
        dialectNuance: '"Grabeha ka..." is the signature Southern superlative construction.',
        recommendedTone: 'Thrilled & animated narration',
        difficulty: 'Hard',
      },
      {
        id: 'v_ceb_5_3',
        phraseNative: 'Hala uy, ayaw kog binuangi kay kabalo gyud ko sa tinuod nga istorya!',
        phraseEnglish: 'Oh my, do not fool around with me because I truly know the real story!',
        phoneticGuide: 'HAH-lah ooy, ah-YAW kog bee-NWANG-ee kye kah-BAH-loh gyood koh sah tee-NOO-od ngah ees-TOHR-yah!',
        contextTip: 'Rapid conversational flow with Davao particle "Hala uy" and emphasis "gyud".',
        dialectNuance: 'Playful confrontational banter between close peers.',
        recommendedTone: 'Feigned disbelief & teasing tone',
        difficulty: 'Hard',
      },
    ],
  },
];

// -----------------------------------------------------------------------------
// 2. FILIPINO / TAGALOG VOICE LEARNING PATH (Levels 1 to 5 with Hard challenges)
// -----------------------------------------------------------------------------
export const FILIPINO_VOICE_LEVELS: VoiceLevel[] = [
  {
    id: 1,
    title: 'Level 1: Polite Foundations',
    titleNative: 'Antas 1: Pagbati at Magagalang na Pananalita',
    subtitle: 'Master Filipino honorifics (po/opo), daily greetings, and polite inquiries',
    difficulty: 'Easy',
    minAccuracy: 75,
    accentColor: 'emerald',
    bgGradient: 'from-emerald-500 to-teal-600',
    badge: {
      id: 'badge_voice_fil_lv1',
      name: 'Filipino Voice Starter',
      nameNative: 'Nagsisimulang Tinig 🥉',
      tier: 'Bronze',
      icon: '🥉',
      description: 'Mastered introductory Filipino greetings and respectful honorifics.',
      criteria: 'Pass all Level 1 drills with ≥75% accuracy',
      xpReward: 60,
      gemsReward: 15,
    },
    challenges: [
      {
        id: 'v_fil_1_1',
        phraseNative: 'Magandang umaga po! Kumusta po kayo ngayon?',
        phraseEnglish: 'Good morning! How are you doing today? (polite)',
        phoneticGuide: 'mah-gan-DANG oo-MAH-gah poh! koo-MOOS-tah poh kah-YOH ngah-YOHN?',
        contextTip: 'Keep a gentle, respectful vocal tone with clear "po" pronunciation.',
        dialectNuance: 'National standard polite greeting for elders, teachers, and strangers.',
        recommendedTone: 'Respectful & warm',
        difficulty: 'Easy',
      },
      {
        id: 'v_fil_1_2',
        phraseNative: 'Maraming salamat po sa inyong tulong at gabay.',
        phraseEnglish: 'Thank you very much for your help and guidance.',
        phoneticGuide: 'mah-rah-MEENG sah-LAH-mat poh sah een-YONG TOO-long aht gah-BYE.',
        contextTip: 'Enunciate the linker "-ng" connecting "marami" and "salamat".',
        dialectNuance: 'Standard courteous expression in formal and everyday situations.',
        recommendedTone: 'Heartfelt gratitude',
        difficulty: 'Easy',
      },
      {
        id: 'v_fil_1_3',
        phraseNative: 'Walang anuman po, ikinagagalak ko pong makatulong.',
        phraseEnglish: 'You are welcome, I am pleased to be of help.',
        phoneticGuide: 'wah-LAHNG ah-NOO-mahn poh, ee-kee-nah-gah-gah-LAK koh pohng mah-kah-TOO-long.',
        contextTip: 'Soft cadence on "walang anuman".',
        dialectNuance: 'Courteous customer service or neighborly reply.',
        recommendedTone: 'Polite & accommodating',
        difficulty: 'Easy',
      },
    ],
  },
  {
    id: 2,
    title: 'Level 2: Commute & Daily Flow',
    titleNative: 'Antas 2: Pagsakay at Pang-araw-araw na Biyahe',
    subtitle: 'Commuting by jeepney, LRT/MRT, and asking fares in Tagalog',
    difficulty: 'Medium',
    minAccuracy: 80,
    accentColor: 'blue',
    bgGradient: 'from-blue-500 to-indigo-600',
    badge: {
      id: 'badge_voice_fil_lv2',
      name: 'Biyaherong Sanay',
      nameNative: 'Manlalakbay sa Lungsod 🥈',
      tier: 'Silver',
      icon: '🥈',
      description: 'Navigated commuter dialogue in public transportation seamlessly.',
      criteria: 'Pass all Level 2 drills with ≥80% accuracy',
      xpReward: 90,
      gemsReward: 25,
    },
    challenges: [
      {
        id: 'v_fil_2_1',
        phraseNative: 'Makikisuyo po ng bayad, kuya. Isa lang po sa may kanto.',
        phraseEnglish: 'Please pass my fare, driver. Just one to the corner.',
        phoneticGuide: 'mah-kee-kee-SOO-yoh poh ng BAH-yad, KOO-yah. EE-sah lahng poh sah my KAHN-toh.',
        contextTip: '"Makikisuyo" is the polite Tagalog formula for requesting fare assistance.',
        dialectNuance: 'Universal across Metro Manila jeepneys and UV expresses.',
        recommendedTone: 'Clear & polite commuter voice',
        difficulty: 'Medium',
      },
      {
        id: 'v_fil_2_2',
        phraseNative: 'Para po! Sa tabi na lang po ako bababa.',
        phraseEnglish: 'Stop please! I will get off right by the curb.',
        phoneticGuide: 'PAH-rah poh! sah tah-BEE nah lahng poh ah-KOH bah-bah-BAH.',
        contextTip: 'Call out "Para po!" firmly with rising inflection before your stop.',
        dialectNuance: 'Standard Tagalog vehicle stop command (contrasted with Bisaya "Lugar lang").',
        recommendedTone: 'Decisive call',
        difficulty: 'Medium',
      },
      {
        id: 'v_fil_2_3',
        phraseNative: 'Magkano po ang pamasahe papuntang estasyon ng tren?',
        phraseEnglish: 'How much is the fare going to the train station?',
        phoneticGuide: 'mag-KAH-noh poh ahng pah-mah-SAH-heh pah-poon-TAHNG es-tahs-YOHN ng TREHN?',
        contextTip: '"Magkano" specifically asks for cost/price in Tagalog.',
        dialectNuance: 'Everyday Manila commuter inquiry.',
        recommendedTone: 'Inquiring & respectful',
        difficulty: 'Medium',
      },
    ],
  },
  {
    id: 3,
    title: 'Level 3: Market & Public Bargaining',
    titleNative: 'Antas 3: Pamimili at Pagtawad sa Palengke',
    subtitle: 'Bargaining at wet markets, ordering food and checking freshness',
    difficulty: 'Medium',
    minAccuracy: 82,
    accentColor: 'amber',
    bgGradient: 'from-amber-500 to-orange-600',
    badge: {
      id: 'badge_voice_fil_lv3',
      name: 'Bihasang Mamimili',
      nameNative: 'Eksperto sa Pamilihan 🥇',
      tier: 'Gold',
      icon: '🥇',
      description: 'Mastered marketplace bargaining etiquette in Tagalog.',
      criteria: 'Pass all Level 3 drills with ≥82% accuracy',
      xpReward: 120,
      gemsReward: 35,
    },
    challenges: [
      {
        id: 'v_fil_3_1',
        phraseNative: 'Magkano po ang kilo ng mangga, ate? Pwede po bang tumawad?',
        phraseEnglish: 'How much per kilo for the mangoes, ma\'am? Can I ask for a discount?',
        phoneticGuide: 'mag-KAH-noh poh ahng KEE-loh ng MAHN-gah, AH-teh? PWEH-deh poh bahng too-MAH-wad?',
        contextTip: '"Tumawad" is the Tagalog equivalent of Bisaya "hangyo".',
        dialectNuance: 'Delivered with a courteous, warm tone.',
        recommendedTone: 'Friendly bargaining',
        difficulty: 'Medium',
      },
      {
        id: 'v_fil_3_2',
        phraseNative: 'Pabili po ng dalawang kilong bangus, pakilinis na rin po.',
        phraseEnglish: 'I would like to buy two kilos of milkfish, please clean them as well.',
        phoneticGuide: 'pah-bee-LEE poh ng dah-lah-WAHNG KEE-long bah-NGUS, pah-kee-lee-NEES nah reen poh.',
        contextTip: 'Prefix "Pabili" expresses intent to purchase with politeness.',
        dialectNuance: 'Wet market staple instruction.',
        recommendedTone: 'Clear customer instruction',
        difficulty: 'Medium',
      },
    ],
  },
  {
    id: 4,
    title: 'Level 4: Intonation & Syllable Stress',
    titleNative: 'Antas 4: Wastong Diin at Tuldik sa Tagalog',
    subtitle: 'Navigate malumay, malumi, mabilis, and maragsa syllable accents',
    difficulty: 'Hard',
    minAccuracy: 85,
    accentColor: 'rose',
    bgGradient: 'from-rose-500 to-pink-600',
    badge: {
      id: 'badge_voice_fil_lv4',
      name: 'Diin at Balarila Master',
      nameNative: 'Tukma sa Pagbigkas 💎',
      tier: 'Platinum',
      icon: '💎',
      description: 'Conquered subtle Tagalog minimal pairs and glottal stop stresses.',
      criteria: 'Pass all Level 4 drills with ≥85% accuracy',
      xpReward: 160,
      gemsReward: 50,
    },
    challenges: [
      {
        id: 'v_fil_4_1',
        phraseNative: 'Bumili siya ng pito para sa pitong batang naglalaro sa kalsada.',
        phraseEnglish: 'He bought a whistle for the seven children playing in the street.',
        phoneticGuide: 'boo-mee-LEE see-YAH ng PEE-toh PAH-rah sah pee-TONG BAH-tahng nag-lah-lah-ROH sah kal-SAH-dah.',
        contextTip: 'Stress contrast: "pito" (whistle - stress on first syllable) vs "pitó" (seven - stress on last syllable).',
        dialectNuance: 'Critical phonemic stress drill in Tagalog linguistics.',
        recommendedTone: 'Deliberate & distinct',
        difficulty: 'Hard',
      },
      {
        id: 'v_fil_4_2',
        phraseNative: 'Hindi ba\'t sinabi ko nang huwag mong iiwan ang pinto na bukas?',
        phraseEnglish: 'Didn\'t I already say not to leave the door open?',
        phoneticGuide: 'heen-DEE ba\'t see-NAH-bee koh nahng HOO-wag mong ee-EE-wan ahng peen-TOH nah BOO-kas?',
        contextTip: 'Crisp glottal stop on "Hindi ba\'t" and rapid negation particle delivery.',
        dialectNuance: 'Intonation carries emotional urgency without being rude.',
        recommendedTone: 'Firm & precise cadence',
        difficulty: 'Hard',
      },
      {
        id: 'v_fil_4_3',
        phraseNative: 'Nais ko sanang magtanong kung may bakante pa sa susunod na klase.',
        phraseEnglish: 'I would like to inquire if there is still a vacancy in the next class.',
        phoneticGuide: 'NAH-ees koh SAH-nahng mag-tah-NONG koong my bah-KAHN-teh pah sah soo-SOO-nod nah KLAH-seh.',
        contextTip: 'Express polite hesitation with conditional particle "sanang".',
        dialectNuance: 'Formal workplace & academic inquiry.',
        recommendedTone: 'Diplomatic & polished',
        difficulty: 'Hard',
      },
    ],
  },
  {
    id: 5,
    title: 'Level 5: Rapid Conversational Fluency & Manila Slang',
    titleNative: 'Antas 5: Mabilisang Usapan at Salitang Kalye',
    subtitle: 'Speak like a true local: colloquial Manila idioms, fast banter & expressions',
    difficulty: 'Hard',
    minAccuracy: 88,
    accentColor: 'purple',
    bgGradient: 'from-purple-600 to-violet-700',
    badge: {
      id: 'badge_voice_fil_lv5',
      name: 'Tunay na Manilenyo',
      nameNative: 'Hari ng Usapan 👑',
      tier: 'Diamond',
      icon: '👑',
      description: 'Mastered spontaneous native conversational pace with Manila Tagalog flair.',
      criteria: 'Pass all Level 5 drills with ≥88% accuracy',
      xpReward: 220,
      gemsReward: 75,
    },
    challenges: [
      {
        id: 'v_fil_5_1',
        phraseNative: 'Susmaryosep! Akala ko ba napag-usapan na natin \'yan kahapon pa?',
        phraseEnglish: 'Goodness gracious! I thought we already talked about that yesterday?',
        phoneticGuide: 'soos-mahr-YOH-sep! ah-KAH-lah koh bah nah-pag-oo-SAH-pahn nah NAH-teen \'yahn kah-hah-POHN pah?',
        contextTip: 'Exclamatory burst on "Susmaryosep!" with natural rhythmic flow.',
        dialectNuance: 'Colloquial dramatic emphasis shared among close Filipino peers.',
        recommendedTone: 'Animated & theatrical disbelief',
        difficulty: 'Hard',
      },
      {
        id: 'v_fil_5_2',
        phraseNative: 'Sobrang ganda ng palabas, parang ayaw ko na ngang umuwi sa sobrang saya!',
        phraseEnglish: 'The show was exceptionally wonderful, as if I did not even want to go home!',
        phoneticGuide: 'SOB-rahng GAHN-dah ng pah-lah-BAS, PAH-rahng AH-yaw koh nah ngahtg oo-moo-WEE sah SOB-rahng SAH-yah!',
        contextTip: 'Expressive enthusiasm with particle "ngang" and rhythmic cadence.',
        dialectNuance: 'Urban conversational Tagalog story sharing.',
        recommendedTone: 'Enthusiastic narration',
        difficulty: 'Hard',
      },
      {
        id: 'v_fil_5_3',
        phraseNative: 'Hay naku, tara na nga bago pa tayo maunahan ng napakaraming tao!',
        phraseEnglish: 'Oh well, let us get going already before we are overtaken by a huge crowd!',
        phoneticGuide: 'hye nah-KOO, TAH-rah nah ngah BAH-goh pah TAH-yoh mah-oo-nah-HAHN ng nah-pah-kah-RAH-meeng TAH-oh!',
        contextTip: 'Rapid delivery of colloquial urge "tara na nga".',
        dialectNuance: 'Everyday peer invitation in bustling Manila districts.',
        recommendedTone: 'Urgent & lively camaraderie',
        difficulty: 'Hard',
      },
    ],
  },
];

// -----------------------------------------------------------------------------
// 3. ENGLISH VOICE LEARNING PATH (Levels 1 to 5 with Hard challenges)
// -----------------------------------------------------------------------------
export const ENGLISH_VOICE_LEVELS: VoiceLevel[] = [
  {
    id: 1,
    title: 'Level 1: Speech Foundations',
    titleNative: 'Level 1: Speech Foundations',
    subtitle: 'Warm up your articulation with natural English greetings & polite forms',
    difficulty: 'Easy',
    minAccuracy: 75,
    accentColor: 'blue',
    bgGradient: 'from-blue-500 to-indigo-600',
    badge: {
      id: 'badge_voice_eng_lv1',
      name: 'English Voice Starter',
      nameNative: 'English Voice Starter 🥉',
      tier: 'Bronze',
      icon: '🥉',
      description: 'Mastered introductory English greetings and natural polite expressions.',
      criteria: 'Pass all Level 1 drills with ≥75% accuracy',
      xpReward: 60,
      gemsReward: 15,
    },
    challenges: [
      {
        id: 'v_eng_1_1',
        phraseNative: 'Hello there! How have you been doing today?',
        phraseEnglish: 'Standard friendly greeting inquiring about someone’s well-being.',
        phoneticGuide: 'hel-LOH THAIR! HOW have yoo been DOO-ing too-DAY?',
        contextTip: 'Keep a gentle rise on "today" to convey genuine interest and warmth.',
        dialectNuance: 'Universal conversational greeting in both professional and social settings.',
        recommendedTone: 'Warm & engaging',
        difficulty: 'Easy',
      },
      {
        id: 'v_eng_1_2',
        phraseNative: 'Thank you very much. I really appreciate your time.',
        phraseEnglish: 'Polite expression of gratitude for someone’s assistance or attention.',
        phoneticGuide: 'THANK yoo VEH-ree much. eye REE-uh-lee uh-PREE-shee-ayt yor TYME.',
        contextTip: 'Stress the first syllable of "thank" and "really" for sincere emphasis.',
        dialectNuance: 'Polite standard closing across international English conversations.',
        recommendedTone: 'Courteous & sincere',
        difficulty: 'Easy',
      },
      {
        id: 'v_eng_1_3',
        phraseNative: 'Nice to meet you! It is a pleasure to connect.',
        phraseEnglish: 'First-time introduction phrase for welcoming new acquaintances.',
        phoneticGuide: 'NYCE too MEET yoo! it iz uh PLEH-zher too kuh-NEKT.',
        contextTip: 'Blend "pleasure to" smoothly without abrupt consonant stops.',
        dialectNuance: 'Standard introduction etiquette in international networking.',
        recommendedTone: 'Enthusiastic & friendly',
        difficulty: 'Easy',
      },
    ],
  },
  {
    id: 2,
    title: 'Level 2: Everyday Flow & Inquiries',
    titleNative: 'Level 2: Everyday Flow & Inquiries',
    subtitle: 'Navigate transit, orders, and daily questions with clarity',
    difficulty: 'Medium',
    minAccuracy: 78,
    accentColor: 'teal',
    bgGradient: 'from-teal-500 to-cyan-600',
    badge: {
      id: 'badge_voice_eng_lv2',
      name: 'Clear Communicator',
      nameNative: 'Clear Communicator 🥈',
      tier: 'Silver',
      icon: '🥈',
      description: 'Handled daily inquiries, coffee orders, and transit directions smoothly.',
      criteria: 'Pass all Level 2 drills with ≥78% accuracy',
      xpReward: 90,
      gemsReward: 25,
    },
    challenges: [
      {
        id: 'v_eng_2_1',
        phraseNative: 'Could you please tell me where the nearest train station is?',
        phraseEnglish: 'Polite inquiry asking for directions to public transit.',
        phoneticGuide: 'KOOD yoo pleez TEL mee WAIR thuh NEER-ist TRAYN STAY-shun iz?',
        contextTip: 'Start with a soft "Could you please" and finish with a slight intonation dip.',
        dialectNuance: 'Universal transit inquiry used in global metro transit hubs.',
        recommendedTone: 'Polite & clear',
        difficulty: 'Medium',
      },
      {
        id: 'v_eng_2_2',
        phraseNative: 'I would like to order an iced coffee with oat milk, please.',
        phraseEnglish: 'Everyday café order specifying preferences politely.',
        phoneticGuide: 'eye wood LYKE too OR-der un EYEST KAW-fee with OHT MILK, pleez.',
        contextTip: 'Link "an iced" smoothly: an-iced-coffee.',
        dialectNuance: 'Everyday casual café interaction across global cities.',
        recommendedTone: 'Relaxed & polite',
        difficulty: 'Medium',
      },
      {
        id: 'v_eng_2_3',
        phraseNative: 'Let me double-check the details and get back to you shortly.',
        phraseEnglish: 'Professional reassurance before confirming information.',
        phoneticGuide: 'LET mee DUB-ul CHEK thuh DEE-taylz und GET BAK too yoo SHORT-lee.',
        contextTip: 'Maintain a steady cadence to sound dependable and organized.',
        dialectNuance: 'Standard workplace reassurance in collaborative projects.',
        recommendedTone: 'Confident & composed',
        difficulty: 'Medium',
      },
    ],
  },
  {
    id: 3,
    title: 'Level 3: Professional Discussions',
    titleNative: 'Level 3: Professional Discussions',
    subtitle: 'Present ideas, share feedback, and coordinate meetings',
    difficulty: 'Medium',
    minAccuracy: 82,
    accentColor: 'indigo',
    bgGradient: 'from-indigo-600 to-blue-700',
    badge: {
      id: 'badge_voice_eng_lv3',
      name: 'Workplace Speaker',
      nameNative: 'Workplace Speaker 🥇',
      tier: 'Gold',
      icon: '🥇',
      description: 'Delivered structured work dialogue and project coordination seamlessly.',
      criteria: 'Pass all Level 3 drills with ≥82% accuracy',
      xpReward: 130,
      gemsReward: 40,
    },
    challenges: [
      {
        id: 'v_eng_3_1',
        phraseNative: 'From our research analysis, the user retention rate increased significantly.',
        phraseEnglish: 'Presenting analytical findings with quantitative credibility.',
        phoneticGuide: 'FRUM our ree-SURCH uh-NAL-uh-sis, thuh YOO-zer ree-TEN-shun rayt in-KREEST sig-NIF-ih-kunt-lee.',
        contextTip: 'Stress the second syllable of "analysis" and third syllable of "significantly".',
        dialectNuance: 'Academic and product presentation standard.',
        recommendedTone: 'Analytical & articulate',
        difficulty: 'Medium',
      },
      {
        id: 'v_eng_3_2',
        phraseNative: 'I agree with your perspective, though we should also consider the timeline.',
        phraseEnglish: 'Diplomatic agreement while introducing a constructive constraint.',
        phoneticGuide: 'eye uh-GREE with yor per-SPEK-tiv, thoh wee shood AWL-soh kun-SID-er thuh TYME-lyne.',
        contextTip: 'Soft transition on "though" to maintain constructive collaboration.',
        dialectNuance: 'Key diplomatic nuance in cross-functional meeting consensus.',
        recommendedTone: 'Diplomatic & constructive',
        difficulty: 'Medium',
      },
      {
        id: 'v_eng_3_3',
        phraseNative: 'Let us schedule a quick sync tomorrow morning to finalize the proposal.',
        phraseEnglish: 'Proposing an actionable follow-up meeting with stakeholders.',
        phoneticGuide: 'LET us SKEDJ-ool uh KWIK SINK tuh-MOR-oh MOR-ning too FYNE-uh-lyze thuh pruh-POH-zul.',
        contextTip: 'Crisp rhythm on "quick sync tomorrow morning".',
        dialectNuance: 'Common collaborative terminology in modern knowledge workplaces.',
        recommendedTone: 'Proactive & decisive',
        difficulty: 'Medium',
      },
    ],
  },
  {
    id: 4,
    title: 'Level 4: Complex Sentences & Phonics',
    titleNative: 'Level 4: Complex Sentences & Phonics',
    subtitle: 'Tackle multi-clause sentences, acoustic stress contrasts & technical precision',
    difficulty: 'Hard',
    minAccuracy: 85,
    accentColor: 'rose',
    bgGradient: 'from-rose-600 to-pink-700',
    badge: {
      id: 'badge_voice_eng_lv4',
      name: 'Articulation Master',
      nameNative: 'Articulation Master 💎',
      tier: 'Platinum',
      icon: '💎',
      description: 'Mastered tongue placement for complex consonant clusters and multi-clause statements.',
      criteria: 'Pass all Level 4 drills with ≥85% accuracy',
      xpReward: 170,
      gemsReward: 55,
    },
    challenges: [
      {
        id: 'v_eng_4_1',
        phraseNative: 'Although the prototype faced bandwidth bottlenecks, our architectural refactor resolved the latency.',
        phraseEnglish: 'Describing technical problem-solving with complex sub-clauses.',
        phoneticGuide: 'awl-THOH thuh PROH-tuh-type fayst BAND-width BOT-ul-neks, our ahr-kih-TEK-cher-ul ree-FAK-ter ree-ZOLVD thuh LAY-ten-see.',
        contextTip: 'Ensure crisp articulation of consonant clusters in "prototype", "bottlenecks", and "refactor".',
        dialectNuance: 'Technical debrief requiring breath control across two subordinate clauses.',
        recommendedTone: 'Authoritative & precise',
        difficulty: 'Hard',
      },
      {
        id: 'v_eng_4_2',
        phraseNative: 'The committee specifically prioritized sustainable infrastructure over short-term budgetary expedience.',
        phraseEnglish: 'Articulating strategic policy decisions with multisyllabic vocabulary.',
        phoneticGuide: 'thuh kuh-MIT-ee spuh-SIF-ik-lee pry-OR-ih-tyzd sus-TAYN-uh-bul IN-fruh-struk-cher OH-ver short-term BUJ-uh-tehr-ee ek-SPEE-dee-unss.',
        contextTip: 'Maintain rhythmic pacing so multisyllabic words remain crisp without rushing.',
        dialectNuance: 'Executive discourse requiring exact vowel timbre and stress placement.',
        recommendedTone: 'Deliberate & distinguished',
        difficulty: 'Hard',
      },
      {
        id: 'v_eng_4_3',
        phraseNative: 'Notice how crisp vowel articulation prevents ambiguity between minimal pairs like sheep and ship.',
        phraseEnglish: 'Pronunciation clinic drill emphasizing tense versus lax vowel distinctions.',
        phoneticGuide: 'NOH-tis how KRISP VOW-ul ahr-tik-yuh-LAY-shun pree-VENTS am-bih-GYOO-ih-tee bee-TWEEN MIN-ih-mul PAIRZ lyke SHEEP und SHIP.',
        contextTip: 'Elongate the /iː/ in "sheep" versus the crisp short /ɪ/ in "ship".',
        dialectNuance: 'Core acoustic phonetics distinction crucial for non-native fluency.',
        recommendedTone: 'Focused & educational',
        difficulty: 'Hard',
      },
    ],
  },
  {
    id: 5,
    title: 'Level 5: Rapid Fluent Banter & Idioms',
    titleNative: 'Level 5: Rapid Fluent Banter & Idioms',
    subtitle: 'Speak at full native conversational speed with real-world idioms & quick retorts',
    difficulty: 'Hard',
    minAccuracy: 88,
    accentColor: 'purple',
    bgGradient: 'from-purple-600 to-violet-700',
    badge: {
      id: 'badge_voice_eng_lv5',
      name: 'English Voice Master',
      nameNative: 'English Voice Master 👑',
      tier: 'Diamond',
      icon: '👑',
      description: 'Mastered spontaneous native conversational pace with authentic idiomatic cadence.',
      criteria: 'Pass all Level 5 drills with ≥88% accuracy',
      xpReward: 220,
      gemsReward: 75,
    },
    challenges: [
      {
        id: 'v_eng_5_1',
        phraseNative: 'To be completely honest, we hit the ground running and knocked it out of the park before the deadline!',
        phraseEnglish: 'Expressing high achievement using vivid everyday idioms in rapid banter.',
        phoneticGuide: 'too bee kum-PLEET-lee ON-ist, wee HIT thuh GROWND RUN-ing und NOKT it OWT uv thuh PARK bee-FOR thuh DED-lyne!',
        contextTip: 'Deliver "hit the ground running" as a single rapid rhythmic phrase.',
        dialectNuance: 'Idiomatic peer conversation demonstrating full native fluency.',
        recommendedTone: 'Energetic & triumphant',
        difficulty: 'Hard',
      },
      {
        id: 'v_eng_5_2',
        phraseNative: 'Do not beat around the bush; let us cut to the chase and find common ground that works for everyone.',
        phraseEnglish: 'Direct negotiation urging clarity and collaborative solutions.',
        phoneticGuide: 'DOO not BEET uh-ROWND thuh BOOSH; LET us KUT too thuh CHAYS und FYND KOM-un GROWND that WURKS for EV-ree-wun.',
        contextTip: 'Deliver the contrasting idioms "beat around the bush" and "cut to the chase" with sharp tempo.',
        dialectNuance: 'High-stakes direct conversation commonly used in international partnerships.',
        recommendedTone: 'Direct & persuasive',
        difficulty: 'Hard',
      },
      {
        id: 'v_eng_5_3',
        phraseNative: 'I was initially on the fence, but the convincing data completely turned the tide in their favor!',
        phraseEnglish: 'Reflecting on an evolving viewpoint swayed by compelling evidence.',
        phoneticGuide: 'eye wuz in-ISH-uh-lee ON thuh FENSS, but thuh kun-VIN-sing DAY-tuh kum-PLEET-lee TURND thuh TYDE in thair FAY-ver!',
        contextTip: 'Emphasize "turned the tide" with a dramatic, expressive vocal sweep.',
        dialectNuance: 'Storytelling idiom signifying a major shift in opinion or momentum.',
        recommendedTone: 'Expressive & animated',
        difficulty: 'Hard',
      },
    ],
  },
];

export const VOICE_LEVELS_BY_CATEGORY: Record<VoiceLanguageCategory, VoiceLevel[]> = {
  cebuano: CEBUANO_VOICE_LEVELS,
  filipino: FILIPINO_VOICE_LEVELS,
  english: ENGLISH_VOICE_LEVELS,
};

// Backwards compatibility default export
export const VOICE_LEVELS: VoiceLevel[] = CEBUANO_VOICE_LEVELS;

export function getVoiceLevelsForCategory(category: VoiceLanguageCategory): VoiceLevel[] {
  return VOICE_LEVELS_BY_CATEGORY[category] || CEBUANO_VOICE_LEVELS;
}

export function getStoredVoiceProgress(category: VoiceLanguageCategory = 'cebuano'): VoiceUserProgress {
  if (typeof window === 'undefined') return INITIAL_VOICE_PROGRESS;
  try {
    const key = `sultiai_voice_progress_${category}`;
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
    // Fallback to legacy key for cebuano
    if (category === 'cebuano') {
      const legacy = localStorage.getItem('sultiai_voice_progress');
      if (legacy) return JSON.parse(legacy);
    }
  } catch {
    // ignore
  }
  return INITIAL_VOICE_PROGRESS;
}

export function saveVoiceProgress(progress: VoiceUserProgress, category: VoiceLanguageCategory = 'cebuano'): void {
  if (typeof window === 'undefined') return;
  try {
    const key = `sultiai_voice_progress_${category}`;
    localStorage.setItem(key, JSON.stringify(progress));
    if (category === 'cebuano') {
      localStorage.setItem('sultiai_voice_progress', JSON.stringify(progress));
    }
  } catch {
    // ignore
  }
}
