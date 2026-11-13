// ============================================================================
// SultiAI: The Speaking City (Voice Practice Data & Curriculum Engine)
// Grounded in Philippine Sociolinguistic Culture (Akademyang Bisaya & KWF)
// ============================================================================

export type SpeakingLanguageId = 'cebuano' | 'filipino' | 'english';

export type MissionDifficulty = 'Beginner' | 'Intermediate' | 'Advanced';

export interface MissionVocabularyItem {
  word: string;
  translation: string;
  phonetic: string;
  context: string;
}

export interface MissionDialogueTurn {
  speaker: string;
  text: string;
  phonetics: string;
  translation: string;
}

export interface SpeakingMission {
  id: string;
  destinationId: string;
  title: string;
  situation: string;
  communicationObjective: string;
  learnerRole: string;
  partnerRole: string;
  difficulty: MissionDifficulty;
  durationMinutes: number;
  xpReward: number;
  gemsReward: number;
  keyVocabulary: MissionVocabularyItem[];
  helpfulPhrases: string[];
  hints: string[];
  exampleDialogue: MissionDialogueTurn[];
  expectedKeyWords: string[];
  referenceResponse: string;
  politenessMarker: string;
}

export interface CityDestination {
  id: string;
  name: string;
  nameNative: string;
  district: string;
  themeDescription: string;
  icon: string;
  colorScheme: 'amber' | 'emerald' | 'blue' | 'purple' | 'teal';
  accentHex: string;
  mapCoords: { x: number; y: number }; // Percentage position on the city map
  unlockRequirement: string;
  missions: SpeakingMission[];
}

export interface SpeakingCityProgress {
  language: SpeakingLanguageId;
  completedMissions: string[];
  unlockedDestinations: string[];
  totalSpeakingXp: number;
  totalAttempts: number;
  highestScore: number;
  lastVisitedDestinationId?: string;
}

export const INITIAL_SPEAKING_CITY_PROGRESS: Record<SpeakingLanguageId, SpeakingCityProgress> = {
  cebuano: {
    language: 'cebuano',
    completedMissions: [],
    unlockedDestinations: ['cafe_restaurant', 'transport_terminal'],
    totalSpeakingXp: 0,
    totalAttempts: 0,
    highestScore: 0,
  },
  filipino: {
    language: 'filipino',
    completedMissions: [],
    unlockedDestinations: ['cafe_restaurant', 'transport_terminal'],
    totalSpeakingXp: 0,
    totalAttempts: 0,
    highestScore: 0,
  },
  english: {
    language: 'english',
    completedMissions: [],
    unlockedDestinations: ['cafe_restaurant', 'transport_terminal'],
    totalSpeakingXp: 0,
    totalAttempts: 0,
    highestScore: 0,
  },
};

// ============================================================================
// 1. CEBUANO / BISAYA SPEAKING CITY DESTINATIONS & MISSIONS
// ============================================================================
export const CEBUANO_CITY_DESTINATIONS: CityDestination[] = [
  {
    id: 'cafe_restaurant',
    name: 'Cafe & Carenderia',
    nameNative: 'Carenderia ug Kapehan',
    district: 'Downtown Food Hub',
    themeDescription: 'Practice food orders, polite dining requests, and settling bills at local carenderias.',
    icon: '🍲',
    colorScheme: 'amber',
    accentHex: '#D97706',
    mapCoords: { x: 22, y: 30 },
    unlockRequirement: 'Available by default',
    missions: [
      {
        id: 'ceb_cafe_1',
        destinationId: 'cafe_restaurant',
        title: 'Greeting the Server & Asking for Specials',
        situation: 'You just arrived at a busy local carenderia during lunchtime. You want to greet the server politely and ask what special dishes are available today.',
        communicationObjective: 'Greet the food attendant courteously and ask "What is your specialty / best viand today?".',
        learnerRole: 'Hungry customer arriving at the carenderia counter',
        partnerRole: 'Friendly Carenderia Server (Nang Lita)',
        difficulty: 'Beginner',
        durationMinutes: 3,
        xpReward: 40,
        gemsReward: 10,
        keyVocabulary: [
          { word: 'Maayong udto', translation: 'Good afternoon', phonetic: 'Mah-AH-yong OOD-toh', context: 'Standard lunchtime greeting' },
          { word: 'Sud-an', translation: 'Viand / Main dish', phonetic: 'SOOD-ahn', context: 'Refers to dishes eaten with rice' },
          { word: 'Espesyal', translation: 'Special dish', phonetic: 'Es-pes-YAHL', context: 'Inquiring for recommendations' },
        ],
        helpfulPhrases: [
          'Maayong udto, Nang! Unsay inyong espesyal nga sud-an karon?',
          'Unsay lami nga sud-an ninyo karon?',
        ],
        hints: [
          'Bisaya does not use Tagalog "po/opo". Show respect through a warm, smiling vocal tone and using honorifics like "Nang" (Manang).',
        ],
        exampleDialogue: [
          {
            speaker: 'Nang Lita (Server)',
            text: 'Maayong udto sab! Naa mi presko nga tula nga isda ug sugbang baboy. Unsay imong pilion?',
            phonetics: 'Mah-ah-yong ood-toh sab! Nah-ah mee pres-koh ngah too-lah ngah ees-dah...',
            translation: 'Good afternoon too! We have fresh fish broth soup and grilled pork. What will you choose?',
          },
          {
            speaker: 'Learner (Customer)',
            text: 'Maayong udto, Nang! Palihog ko og usa ka tula nga isda ug duha ka kan-on.',
            phonetics: 'Mah-ah-yong ood-toh, Nahng! Pah-lee-hog koh og oo-sah kah too-lah ngah ees-dah...',
            translation: 'Good afternoon, ma\'am! Please give me one fish soup and two servings of rice.',
          },
        ],
        expectedKeyWords: ['maayong', 'udto', 'sud-an', 'espesyal', 'palihog'],
        referenceResponse: 'Maayong udto, Nang! Unsay inyong espesyal nga sud-an karon?',
        politenessMarker: 'palihog / Nang',
      },
      {
        id: 'ceb_cafe_2',
        destinationId: 'cafe_restaurant',
        title: 'Ordering a Meal with Extra Rice',
        situation: 'You are pointing at the counter trays to pick grilled fish and ordering two servings of steamed rice.',
        communicationObjective: 'Order your selected meal clearly and specify extra rice portions politely.',
        learnerRole: 'Customer giving their exact order',
        partnerRole: 'Carenderia Attendant',
        difficulty: 'Beginner',
        durationMinutes: 4,
        xpReward: 45,
        gemsReward: 15,
        keyVocabulary: [
          { word: 'Sugba', translation: 'Grilled', phonetic: 'SOOG-bah', context: 'Charcoal grilled fish or pork' },
          { word: 'Kan-on', translation: 'Cooked rice', phonetic: 'KAHN-on', context: 'Steamed rice staple' },
          { word: 'Palihog', translation: 'Please', phonetic: 'Pah-LEE-hog', context: 'Essential Visayan courtesy marker' },
        ],
        helpfulPhrases: [
          'Palihog ko og usa ka sugbang isda ug duha ka kan-on.',
          'Puyde dungagan og sabaw, Nang?',
        ],
        hints: [
          'Use "Palihog ko..." at the beginning of orders to make your request courteous and natural.',
        ],
        exampleDialogue: [
          {
            speaker: 'Nang Lita (Server)',
            text: 'Mao ra ni tanan, Dong/Day?',
            phonetics: 'Mah-oh rah nee tah-nahn, Dong/Die?',
            translation: 'Is this everything, young one?',
          },
          {
            speaker: 'Learner (Customer)',
            text: 'Oo, Nang. Palihog ko og usa ka baso nga bugnaw nga tubig sab.',
            phonetics: 'Oh-oh, Nahng. Pah-lee-hog koh og oo-sah kah bah-soh ngah boog-now...',
            translation: 'Yes, ma\'am. Please give me a glass of cold water too.',
          },
        ],
        expectedKeyWords: ['palihog', 'sugba', 'kan-on', 'isda', 'tubig'],
        referenceResponse: 'Palihog ko og usa ka sugbang isda ug duha ka kan-on, Nang.',
        politenessMarker: 'palihog',
      },
      {
        id: 'ceb_cafe_3',
        destinationId: 'cafe_restaurant',
        title: 'Asking About Spice Level & Ingredients',
        situation: 'You are sensitive to chili peppers and want to confirm whether the pork adobo or kinilaw has spicy chillies in it.',
        communicationObjective: 'Ask if the food is spicy and politely request a mild portion.',
        learnerRole: 'Customer with dietary questions',
        partnerRole: 'Carenderia Cook',
        difficulty: 'Intermediate',
        durationMinutes: 4,
        xpReward: 50,
        gemsReward: 15,
        keyVocabulary: [
          { word: 'Halang', translation: 'Spicy / Hot', phonetic: 'HAH-lahng', context: 'Peppery spice level' },
          { word: 'Sili', translation: 'Chili pepper', phonetic: 'SEE-lee', context: 'Hot peppers' },
          { word: 'Kinilaw', translation: 'Ceviche', phonetic: 'Kee-NEE-low', context: 'Vinegar-cured raw fish' },
        ],
        helpfulPhrases: [
          'Halang ba kaayo ning kinilaw, Nang?',
          'Dili ba daghang sili? Dili man gud ko mokaon og halang.',
        ],
        hints: [
          'In Bisaya, "halang" is the word for spicy, not "maanghang" (which is Tagalog).',
        ],
        exampleDialogue: [
          {
            speaker: 'Cook',
            text: 'Dili ra kaayo halang, sakto-sakto ra ang timpla.',
            phonetics: 'Dee-lee rah kah-AH-yoh hah-lahng, sahk-toh sahk-toh rah...',
            translation: 'It is not too spicy, the seasoning is just right.',
          },
          {
            speaker: 'Learner (Customer)',
            text: 'Salamat, Nang! Kana na lang akong kuhaon kay dili ko kaagwanta og halang.',
            phonetics: 'Sah-lah-maht, Nahng! Kah-nah nah lahng ah-kong koo-hah-on...',
            translation: 'Thank you, ma\'am! I will take that one because I cannot tolerate spicy food.',
          },
        ],
        expectedKeyWords: ['halang', 'sili', 'kinilaw', 'dili', 'salamat'],
        referenceResponse: 'Halang ba kaayo ni, Nang? Dili man gud ko mokaon og halang kaayo.',
        politenessMarker: 'Nang / man gud',
      },
      {
        id: 'ceb_cafe_4',
        destinationId: 'cafe_restaurant',
        title: 'Requesting the Total Bill Courteously',
        situation: 'You have finished your meal and want to call the server to calculate your bill and pay with a 500-peso banknote.',
        communicationObjective: 'Request the bill total politely and ask if there is change for your bill.',
        learnerRole: 'Customer ready to pay',
        partnerRole: 'Carenderia Cashier',
        difficulty: 'Intermediate',
        durationMinutes: 3,
        xpReward: 50,
        gemsReward: 20,
        keyVocabulary: [
          { word: 'Bayranan / Pila tanan', translation: 'Total bill / How much in all', phonetic: 'PEE-lah TAH-nahn', context: 'Settling dining tab' },
          { word: 'Sukli', translation: 'Monetary change', phonetic: 'SOOK-lee', context: 'Cash change returned' },
          { word: 'Singko siyentos', translation: 'Five hundred pesos', phonetic: 'SING-koh SYEN-tos', context: 'Denomination note' },
        ],
        helpfulPhrases: [
          'Nang, pila tanan among nabayran?',
          'Naa moy sukli sa lima ka gatos / singko siyentos?',
        ],
        hints: [
          'Politely ask about change ("sukli") beforehand when paying with large bills at modest stalls.',
        ],
        exampleDialogue: [
          {
            speaker: 'Nang Lita (Server)',
            text: 'Usa ka isda, duha ka kan-on... Usa ka gatos ug singkwenta ra tanan, Dong/Day.',
            phonetics: 'Oo-sah kah ees-dah... Oo-sah kah gah-tos oog seeng-kwen-tah...',
            translation: 'One fish, two rice... One hundred fifty pesos in total.',
          },
          {
            speaker: 'Learner (Customer)',
            text: 'Salamat, Nang. Dia ang bayad, palihog ko sa sukli.',
            phonetics: 'Sah-lah-maht, Nahng. Dee-ah ang bah-yad, pah-lee-hog koh sah sook-lee.',
            translation: 'Thank you, ma\'am. Here is the payment, please hand me the change.',
          },
        ],
        expectedKeyWords: ['pila', 'tanan', 'sukli', 'bayad', 'salamat'],
        referenceResponse: 'Nang, pila tanan among nabayran? Naa bay sukli sa singko siyentos?',
        politenessMarker: 'palihog / salamat',
      },
    ],
  },

  {
    id: 'public_market',
    name: 'Public Market',
    nameNative: 'Tabo sa Merkado',
    district: 'Bankerohan Fruits & Fish Stalls',
    themeDescription: 'Master the art of "hangyo" (courteous bargaining), price inquiries, and buying fresh produce.',
    icon: '🛒',
    colorScheme: 'emerald',
    accentHex: '#059669',
    mapCoords: { x: 74, y: 25 },
    unlockRequirement: 'Complete at least 1 Cafe mission or 1 Terminal mission',
    missions: [
      {
        id: 'ceb_market_1',
        destinationId: 'public_market',
        title: 'Asking Price per Kilo for Fresh Mangoes',
        situation: 'You are walking past a colorful fruit stall piled high with golden ripe mangoes. You want to ask the vendor the price per kilo.',
        communicationObjective: 'Ask how much one kilogram costs and check if the mangoes are sweet.',
        learnerRole: 'Market shopper inquiring at produce stall',
        partnerRole: 'Fruit Vendor (Nong Tasyo)',
        difficulty: 'Beginner',
        durationMinutes: 3,
        xpReward: 40,
        gemsReward: 10,
        keyVocabulary: [
          { word: 'Tagpila', translation: 'How much (each / per unit)', phonetic: 'Tag-PEE-lah', context: 'Standard price question' },
          { word: 'Kilo', translation: 'Kilogram', phonetic: 'KEE-loh', context: 'Metric produce unit' },
          { word: 'Mangga', translation: 'Mango', phonetic: 'MAHNG-gah', context: 'Fruit produce' },
          { word: 'Tamis', translation: 'Sweet', phonetic: 'TAH-mees', context: 'Flavor quality' },
        ],
        helpfulPhrases: [
          'Tagpila ang kilo sa mangga, Nong?',
          'Tamis ba gyud ning manggaha?',
        ],
        hints: [
          'Use "Tagpila" for prices in Bisaya, not Tagalog "Magkano".',
        ],
        exampleDialogue: [
          {
            speaker: 'Nong Tasyo (Vendor)',
            text: 'Tag-usa ka gatos ug baynte (₱120) ra ang kilo, Dong! Presko kaayo gikan sa Davao.',
            phonetics: 'Tag-oo-sah kah gah-tos oog bye-teh rah ang kee-loh...',
            translation: 'It is only ₱120 per kilo! Very fresh from Davao.',
          },
          {
            speaker: 'Learner (Shopper)',
            text: 'Tagpila ang kilo, Nong? Puyde makatilaw gamay kung tamis ba gyud?',
            phonetics: 'Tag-PEE-lah ang kee-loh, Nong? Pooy-deh mah-kah-tee-low gah-my...',
            translation: 'How much per kilo, sir? Can I taste a little slice to see if it\'s truly sweet?',
          },
        ],
        expectedKeyWords: ['tagpila', 'kilo', 'mangga', 'tamis', 'nong'],
        referenceResponse: 'Tagpila ang kilo sa mangga, Nong? Tamis ba gyud ni?',
        politenessMarker: 'Nong',
      },
      {
        id: 'ceb_market_2',
        destinationId: 'public_market',
        title: 'Requesting a Friendly Courtesy Discount ("Hangyo")',
        situation: 'The vendor quoted ₱120 per kilo. You plan to buy 3 kilos, so you want to ask if they can lower the price to ₱100 per kilo.',
        communicationObjective: 'Request a discount politely by using the cultural practice of "hangyo".',
        learnerRole: 'Shopper negotiating produce bundle',
        partnerRole: 'Fruit Vendor (Nong Tasyo)',
        difficulty: 'Intermediate',
        durationMinutes: 4,
        xpReward: 50,
        gemsReward: 15,
        keyVocabulary: [
          { word: 'Hangyo', translation: 'Discount / Bargain request', phonetic: 'HAHNG-yoh', context: 'Core Visayan interpersonal market art' },
          { word: 'Gamay', translation: 'A little / Small amount', phonetic: 'GAH-my', context: 'Softening polite request' },
          { word: 'Puyde', translation: 'Is it possible / Can I', phonetic: 'POOY-deh', context: 'Permissive question' },
        ],
        helpfulPhrases: [
          'Puyde hangyo gamay, Nong? Kung tulo ka kilo akong kuhaon?',
          'Puyde ₱100 na lang ang kilo, Nong?',
        ],
        hints: [
          'Bargaining in Visayan culture is friendly rapport-building. Smile and keep your tone light and respectful.',
        ],
        exampleDialogue: [
          {
            speaker: 'Nong Tasyo (Vendor)',
            text: 'Dili na man ko makaganansya ana, Dong! Pero sige, tagaan tikag ₱110 kay suki na ka.',
            phonetics: 'Dee-lee nah mahn koh mah-kah-gah-nahn-syah ah-nah...',
            translation: 'I wouldn\'t make a profit on that! But alright, I\'ll give it to you for ₱110 as a good patron.',
          },
          {
            speaker: 'Learner (Shopper)',
            text: 'Salamat kaayo, Nong! Kuhaon nako ang tulo ka kilo.',
            phonetics: 'Sah-lah-maht kah-ah-yoh, Nong! Koo-hah-on nah-koh ang too-loh kah kee-loh.',
            translation: 'Thank you very much, sir! I will take the three kilos.',
          },
        ],
        expectedKeyWords: ['hangyo', 'puyde', 'gamay', 'kilo', 'salamat'],
        referenceResponse: 'Puyde hangyo gamay, Nong? Kung tulo ka kilo, mahimo bang ₱100 na lang?',
        politenessMarker: 'Puyde hangyo / Nong',
      },
      {
        id: 'ceb_market_3',
        destinationId: 'public_market',
        title: 'Buying Seafood by Weight & Freshness',
        situation: 'At the fish section, you are inspecting freshly caught bangus (milkfish). You want to request two medium-sized fish and ask the vendor to clean and scale them.',
        communicationObjective: 'Select seafood by quantity and request cleaning/scaling services courteously.',
        learnerRole: 'Seafood shopper',
        partnerRole: 'Fishmonger (Nang Ising)',
        difficulty: 'Intermediate',
        durationMinutes: 4,
        xpReward: 50,
        gemsReward: 20,
        keyVocabulary: [
          { word: 'Isda', translation: 'Fish', phonetic: 'EES-dah', context: 'Seafood category' },
          { word: 'Hinloi', translation: 'Clean (it)', phonetic: 'HEEN-loh-ee', context: 'Requesting fish cleaning' },
          { word: 'Hiskisi', translation: 'Scale (the fish)', phonetic: 'HEES-kee-see', context: 'Removing fish scales' },
        ],
        helpfulPhrases: [
          'Palihog ko og duha kabuok bangus, Nang.',
          'Puyde palihog hinloan ug hiskisan daan?',
        ],
        hints: [
          'Use "kabuok" when counting whole items (e.g., "duha kabuok" = two pieces).',
        ],
        exampleDialogue: [
          {
            speaker: 'Nang Ising (Fishmonger)',
            text: 'Oo ba! Walay problema, akong hinloan ug hiskisan karon dayon.',
            phonetics: 'Oh-oh bah! Wah-lie prob-LEH-mah, ah-kong heen-loh-ahn...',
            translation: 'Of course! No problem, I will clean and scale it right away.',
          },
          {
            speaker: 'Learner (Shopper)',
            text: 'Salamat kaayo, Nang! Pila may total ani?',
            phonetics: 'Sah-lah-maht kah-ah-yoh, Nahng! Pee-lah my toh-tahl ah-nee?',
            translation: 'Thank you very much, ma\'am! How much is the total for this?',
          },
        ],
        expectedKeyWords: ['bangus', 'hinloan', 'hiskisan', 'palihog', 'duha'],
        referenceResponse: 'Palihog ko og duha kabuok bangus, Nang. Puyde ba nimo hinloan ug hiskisan?',
        politenessMarker: 'palihog / Nang',
      },
      {
        id: 'ceb_market_4',
        destinationId: 'public_market',
        title: 'Clarifying Change & Finalizing Purchase',
        situation: 'You hand the vendor a 1000-peso bill for a ₱320 purchase. You want to make sure you receive the correct ₱680 change politely.',
        communicationObjective: 'Confirm the bill denomination and verify the returned change with gratitude.',
        learnerRole: 'Paying customer',
        partnerRole: 'Market Vendor',
        difficulty: 'Advanced',
        durationMinutes: 4,
        xpReward: 60,
        gemsReward: 20,
        keyVocabulary: [
          { word: 'Usa ka libo', translation: 'One thousand pesos', phonetic: 'Oo-sah kah LEE-boh', context: 'High denomination bill' },
          { word: 'Sukli', translation: 'Change', phonetic: 'SOOK-lee', context: 'Cash returned' },
          { word: 'Insakto', translation: 'Exact / Correct', phonetic: 'Een-SAHK-toh', context: 'Verification' },
        ],
        helpfulPhrases: [
          'Dia ang usa ka libo, Nong. Naa ba moy sukli?',
          'Salamat, insakto kaayo ang sukli. Amping!',
        ],
        hints: [
          'Saying "Amping!" (take care) when leaving market stalls builds long-lasting suki goodwill.',
        ],
        exampleDialogue: [
          {
            speaker: 'Vendor',
            text: 'Dia imong sukli nga ₱680, Dong/Day. Ihapa palihog.',
            phonetics: 'Dee-ah ee-mong sook-lee ngah... Ee-hah-pah pah-lee-hog.',
            translation: 'Here is your change of ₱680. Please count it.',
          },
          {
            speaker: 'Learner (Shopper)',
            text: 'Insakto ra, Nong! Salamat kaayo, mobalik ra ko sunod semana.',
            phonetics: 'Een-sahk-toh rah, Nong! Sah-lah-maht kah-ah-yoh...',
            translation: 'It is exact, sir! Thank you very much, I will return next week.',
          },
        ],
        expectedKeyWords: ['usa ka libo', 'sukli', 'insakto', 'salamat', 'amping'],
        referenceResponse: 'Dia ang usa ka libo, Nong. Salamat, insakto kaayo ang sukli. Amping!',
        politenessMarker: 'salamat / amping',
      },
    ],
  },

  {
    id: 'school',
    name: 'School & Campus',
    nameNative: 'Tulunghaan ug Campus',
    district: 'University Academic District',
    themeDescription: 'Introduce yourself to classmates, ask professors for clarification, and practice campus student life.',
    icon: '🏫',
    colorScheme: 'purple',
    accentHex: '#9333EA',
    mapCoords: { x: 30, y: 70 },
    unlockRequirement: 'Complete at least 2 missions in any district',
    missions: [
      {
        id: 'ceb_school_1',
        destinationId: 'school',
        title: 'Introducing Yourself to a Classmate',
        situation: 'It is the first day of the semester in a university in Cebu/Davao. You take a seat beside a classmate and introduce yourself warmly.',
        communicationObjective: 'Say your name, where you are from, and express enthusiasm for meeting your classmate.',
        learnerRole: 'New student on campus',
        partnerRole: 'Classmate (Mark)',
        difficulty: 'Beginner',
        durationMinutes: 3,
        xpReward: 40,
        gemsReward: 10,
        keyVocabulary: [
          { word: 'Ako diay si...', translation: 'I am... (introducing name)', phonetic: 'Ah-koh dee-eye see...', context: 'Natural Visayan introduction formula' },
          { word: 'Taga-diin', translation: 'From where', phonetic: 'Tah-gah-DEE-een', context: 'Asking hometown' },
          { word: 'Nalipay ko', translation: 'I am glad / pleased', phonetic: 'Nah-lee-pie koh', context: 'Pleasure to meet you' },
        ],
        helpfulPhrases: [
          'Kumusta! Ako diay si Alex. Nalipay ko nga nakaila ka.',
          'Taga-diin man diay ka?',
        ],
        hints: [
          'The particle "diay" softens introductions and signals conversational naturalness.',
        ],
        exampleDialogue: [
          {
            speaker: 'Mark (Classmate)',
            text: 'Kumusta sab, Alex! Ako si Mark, taga-Davao ko. Bag-o ka diri sa campus?',
            phonetics: 'Koo-moos-tah sab, Alex! Ah-koh see Mark...',
            translation: 'Hello too, Alex! I am Mark, I am from Davao. Are you new here on campus?',
          },
          {
            speaker: 'Learner (Student)',
            text: 'Oo, Mark. Nagtuon ko og IT diri. Nalipay ko nga nakaila ka!',
            phonetics: 'Oh-oh, Mark. Nag-too-on koh og IT dee-ree...',
            translation: 'Yes, Mark. I am studying IT here. Glad to meet you!',
          },
        ],
        expectedKeyWords: ['kumusta', 'ako', 'diay', 'nalipay', 'nakaila'],
        referenceResponse: 'Kumusta! Ako diay si Alex. Nalipay ko nga nakaila ka karon.',
        politenessMarker: 'nalipay ko',
      },
      {
        id: 'ceb_school_2',
        destinationId: 'school',
        title: 'Asking the Teacher for Clarification',
        situation: 'The instructor explained a complex homework assignment quickly. You raise your hand to ask if they can repeat the instruction politely.',
        communicationObjective: 'Ask the professor courteously to repeat the deadline and instructions.',
        learnerRole: 'Student seeking academic clarification',
        partnerRole: 'Instructor (Sir Ramon)',
        difficulty: 'Intermediate',
        durationMinutes: 4,
        xpReward: 45,
        gemsReward: 15,
        keyVocabulary: [
          { word: 'Pasayloa ko', translation: 'Excuse me / Forgive me', phonetic: 'Pah-sy-LOH-ah koh', context: 'Formal polite interruption' },
          { word: 'Usba', translation: 'Repeat (it)', phonetic: 'OOS-bah', context: 'Requesting repetition' },
          { word: 'Wala nako makuha', translation: 'I did not catch it / grasp it', phonetic: 'Wah-lah nah-koh mah-KOO-hah', context: 'Explaining misunderstanding' },
        ],
        helpfulPhrases: [
          'Sir, pasayloa ko, puyde ba nimo ma-usab ang instruksiyon?',
          'Kanus-a gani ang deadline sa proyekto, Sir?',
        ],
        hints: [
          'Use "Sir" or "Ma\'am" combined with "palihog" when speaking to Philippine educators.',
        ],
        exampleDialogue: [
          {
            speaker: 'Sir Ramon (Teacher)',
            text: 'Walay problema. Ang deadline sa project karong Biyernes sa hapon.',
            phonetics: 'Wah-lie prob-LEH-mah. Ang deadline sah project...',
            translation: 'No problem. The deadline for the project is this Friday afternoon.',
          },
          {
            speaker: 'Learner (Student)',
            text: 'Salamat kaayo sa pagpasabot, Sir! Akong itala karon.',
            phonetics: 'Sah-lah-maht kah-ah-yoh sah pag-pah-sah-bot, Sir!',
            translation: 'Thank you very much for clarifying, Sir! I will write it down now.',
          },
        ],
        expectedKeyWords: ['sir', 'pasayloa', 'puyde', 'usab', 'salamat'],
        referenceResponse: 'Sir, pasayloa ko, puyde ba nimo ma-usab palihog ang deadline?',
        politenessMarker: 'Sir / pasayloa ko / palihog',
      },
      {
        id: 'ceb_school_3',
        destinationId: 'school',
        title: 'Borrowing Notes & Requesting Study Help',
        situation: 'You missed Tuesday\'s lecture due to a fever. You ask a reliable classmate if you can review their notes and study together.',
        communicationObjective: 'Explain your absence and politely ask to photocopy or borrow their class notes.',
        learnerRole: 'Student catching up on lectures',
        partnerRole: 'Classmate (Sarah)',
        difficulty: 'Intermediate',
        durationMinutes: 4,
        xpReward: 50,
        gemsReward: 15,
        keyVocabulary: [
          { word: 'Nakahilantan', translation: 'Had a fever / sick', phonetic: 'Nah-kah-hee-lahn-TAHN', context: 'Medical absence reason' },
          { word: 'Pahuwama', translation: 'Lend (me)', phonetic: 'Pah-hoo-WAH-mah', context: 'Borrowing request' },
          { word: 'Kopya', translation: 'Copy / Notes', phonetic: 'KOP-yah', context: 'Lecture notes' },
        ],
        helpfulPhrases: [
          'Sarah, puyde ba ko makahuwam sa imong notes pag-Martes?',
          'Nakahilantan man gud ko adtong adlawa.',
        ],
        hints: [
          'Add "man gud" when explaining circumstances to sound naturally Visayan.',
        ],
        exampleDialogue: [
          {
            speaker: 'Sarah (Classmate)',
            text: 'Hala, kumusta na imong paminaw karon? Naa ra diri akong notebook, picture-i lang.',
            phonetics: 'Hah-lah, koo-moos-tah nah ee-mong pah-mee-now...',
            translation: 'Oh, how are you feeling now? My notebook is right here, you can just take a photo.',
          },
          {
            speaker: 'Learner (Student)',
            text: 'Maayo na ko karon. Salamat kaayo, Sarah! Dako kaayo ni og tabang.',
            phonetics: 'Mah-ah-yoh nah koh kah-ron. Sah-lah-maht kah-ah-yoh...',
            translation: 'I feel better now. Thank you so much, Sarah! This is a big help.',
          },
        ],
        expectedKeyWords: ['puyde', 'huwam', 'notes', 'salamat', 'tabang'],
        referenceResponse: 'Sarah, puyde ba ko makahuwam sa imong notes? Nakahilantan man gud ko pag-Martes.',
        politenessMarker: 'palihog / salamat',
      },
      {
        id: 'ceb_school_4',
        destinationId: 'school',
        title: 'Asking Directions to the Campus Library',
        situation: 'The university campus is large and you need to find the main research library before your afternoon study group.',
        communicationObjective: 'Ask a campus security guard or student how to get to the library building.',
        learnerRole: 'Student looking for a campus facility',
        partnerRole: 'Campus Guard (Kuya Bert)',
        difficulty: 'Advanced',
        durationMinutes: 3,
        xpReward: 55,
        gemsReward: 20,
        keyVocabulary: [
          { word: 'Asa dapit', translation: 'Where located / In which part', phonetic: 'Ah-sah DAH-peet', context: 'Direction inquiry' },
          { word: 'Layô', translation: 'Far', phonetic: 'LAH-yoh', context: 'Distance' },
          { word: 'Tapad', translation: 'Beside / Next to', phonetic: 'TAH-pahd', context: 'Spatial location' },
          { word: 'Laibrairi', translation: 'Library', phonetic: 'Lie-brah-ree', context: 'Campus building' },
        ],
        helpfulPhrases: [
          'Kuya, asa dapit ang main library diri?',
          'Layô pa ba gikan dinhi?',
        ],
        hints: [
          'Addressing campus security guards as "Kuya" or "Nong" is respectful and widely accepted across the Philippines.',
        ],
        exampleDialogue: [
          {
            speaker: 'Kuya Bert (Guard)',
            text: 'Dili ra layô. Diretso lang sa hallway, unya liko sa tuo. Tapad ra sa Science Building.',
            phonetics: 'Dee-lee rah lah-yoh. Dee-RET-soh lahng sah hallway...',
            translation: 'It is not far. Go straight down the hallway, then turn right. It\'s right beside the Science Building.',
          },
          {
            speaker: 'Learner (Student)',
            text: 'Salamat kaayo, Kuya! Diretso unya liko sa tuo. Amping kanunay!',
            phonetics: 'Sah-lah-maht kah-ah-yoh, Koo-yah! Dee-ret-soh...',
            translation: 'Thank you very much, Kuya! Straight then turn right. Take care always!',
          },
        ],
        expectedKeyWords: ['kuya', 'asa dapit', 'library', 'salamat', 'tapad'],
        referenceResponse: 'Kuya, asa dapit ang library diri? Layô pa ba gikan dinhi?',
        politenessMarker: 'Kuya / salamat',
      },
    ],
  },

  {
    id: 'transport_terminal',
    name: 'Transport Terminal',
    nameNative: 'Estasyon sa Jeepney',
    district: 'Colon - Boulevard Transit Depot',
    themeDescription: 'Master essential public commuting: asking routes, passing fare, and calling out your stop.',
    icon: '🚙',
    colorScheme: 'blue',
    accentHex: '#2563EB',
    mapCoords: { x: 50, y: 50 },
    unlockRequirement: 'Available by default',
    missions: [
      {
        id: 'ceb_transit_1',
        destinationId: 'transport_terminal',
        title: 'Asking Destination Route & Jeepney Signboard',
        situation: 'You are standing at a busy intersection with dozens of colorful jeepneys passing by. You want to verify if a jeepney passes SM City Davao or Carbon Market.',
        communicationObjective: 'Flag down the driver/conductor and ask if the vehicle passes your destination.',
        learnerRole: 'Commuter standing at roadside stop',
        partnerRole: 'Jeepney Conductor (Conductor Boy)',
        difficulty: 'Beginner',
        durationMinutes: 3,
        xpReward: 40,
        gemsReward: 10,
        keyVocabulary: [
          { word: 'Moagi ba ni sa...', translation: 'Does this pass by...?', phonetic: 'Moh-AH-gee bah nee sah...', context: 'Standard route verification' },
          { word: 'Padulong', translation: 'Bound for / Heading towards', phonetic: 'Pah-DOO-long', context: 'Direction of vehicle' },
          { word: 'Kanto', translation: 'Street corner', phonetic: 'KAHN-toh', context: 'Landmark' },
        ],
        helpfulPhrases: [
          'Nong, moagi ba ni sa SM City?',
          'Asa kutob kining jeep, Nong?',
        ],
        hints: [
          'Say "Moagi ba ni sa..." clearly to the conductor or driver before stepping up the rear ladder.',
        ],
        exampleDialogue: [
          {
            speaker: 'Conductor',
            text: 'Oo, moagi ni! Sakay na, duha na lang kuwang para mapuno.',
            phonetics: 'Oh-oh, moh-ah-gee nee! Sah-kye nah, doo-hah nah lahng...',
            translation: 'Yes, this passes there! Hop in, only two spots left before full.',
          },
          {
            speaker: 'Learner (Commuter)',
            text: 'Sige, Nong, mosakay ko. Tagpila ang plete padulong didto?',
            phonetics: 'See-geh, Nong, moh-sah-kye koh. Tag-PEE-lah ang pleh-teh...',
            translation: 'Okay, sir, I am getting in. How much is the fare heading there?',
          },
        ],
        expectedKeyWords: ['moagi', 'nong', 'padulong', 'sakay', 'plete'],
        referenceResponse: 'Nong, moagi ba ni sa SM City? Pila may plete?',
        politenessMarker: 'Nong',
      },
      {
        id: 'ceb_transit_2',
        destinationId: 'transport_terminal',
        title: 'Passing Fare Politely ("Palihog ko sa plete")',
        situation: 'You are seated near the rear exit of a crowded traditional jeepney. The driver is 3 meters in front of you. You need fellow passengers to pass your coin fare forward.',
        communicationObjective: 'Ask neighboring commuters courteously to pass your fare to the driver.',
        learnerRole: 'Commuter seated far from driver',
        partnerRole: 'Fellow Passenger (Ate Joy)',
        difficulty: 'Beginner',
        durationMinutes: 3,
        xpReward: 45,
        gemsReward: 15,
        keyVocabulary: [
          { word: 'Plete', translation: 'Fare payment', phonetic: 'PLEH-teh', context: 'Commuter fare' },
          { word: 'Palihog ko', translation: 'Please (pass)', phonetic: 'Pah-LEE-hog koh', context: 'Commuter courtesy phrase' },
          { word: 'Usa lang', translation: 'Just one person', phonetic: 'OO-sah lahng', context: 'Specifying passenger count' },
        ],
        helpfulPhrases: [
          'Palihog ko sa plete, Nong. Usa lang sa kanto.',
          'Palihog ko i-tunol sa drayber, Te.',
        ],
        hints: [
          'In Visayan jeepneys, "Palihog ko sa plete" is the universal golden rule of passenger etiquette.',
        ],
        exampleDialogue: [
          {
            speaker: 'Ate Joy (Passenger)',
            text: 'Dawat nako. (Passes forward to next passenger) Drayber, plete o!',
            phonetics: 'Dah-wat nah-koh... Dry-ber, pleh-teh oh!',
            translation: 'Received. Driver, here is a fare!',
          },
          {
            speaker: 'Learner (Commuter)',
            text: 'Salamat kaayo, Ate!',
            phonetics: 'Sah-lah-maht kah-ah-yoh, Ah-teh!',
            translation: 'Thank you very much, Ate!',
          },
        ],
        expectedKeyWords: ['palihog', 'plete', 'nong', 'usa', 'salamat'],
        referenceResponse: 'Palihog ko sa plete, Nong. Usa lang sa kanto unya.',
        politenessMarker: 'palihog / Ate / Nong',
      },
      {
        id: 'ceb_transit_3',
        destinationId: 'transport_terminal',
        title: 'Inquiring About Change for a Larger Bill',
        situation: 'You only have a ₱100 bill and the regular fare is ₱15. You want to notify the driver before paying so they have small change ready.',
        communicationObjective: 'Notify the driver of your bill denomination and ask if they have change.',
        learnerRole: 'Passenger paying with paper banknote',
        partnerRole: 'Jeepney Driver (Manong Bert)',
        difficulty: 'Intermediate',
        durationMinutes: 4,
        xpReward: 50,
        gemsReward: 15,
        keyVocabulary: [
          { word: 'Gatos', translation: 'Hundred', phonetic: 'GAH-tos', context: 'Hundred multiplier' },
          { word: 'Usa ka gatos', translation: 'One hundred pesos', phonetic: 'Oo-sah kah GAH-tos', context: 'Paper banknote' },
          { word: 'Sukli', translation: 'Change', phonetic: 'SOOK-lee', context: 'Change returned' },
        ],
        helpfulPhrases: [
          'Nong, naa moy sukli sa usa ka gatos?',
          'Plete nako, Nong, usa ka gatos ni.',
        ],
        hints: [
          'Stating the bill amount out loud prevents misunderstandings about how much change is owed.',
        ],
        exampleDialogue: [
          {
            speaker: 'Driver',
            text: 'Naa ra, Dong! Huwat kadiyot, akong i-sukli inig abot sa stoplight.',
            phonetics: 'Nah-ah rah, Dong! Hoo-wat kah-DEE-yot...',
            translation: 'I have change! Wait a moment, I will pass it when we reach the stoplight.',
          },
          {
            speaker: 'Learner (Commuter)',
            text: 'Sige, Nong, salamat. Tagai lang ko og sakto nga sukli inig undang.',
            phonetics: 'See-geh, Nong, sah-lah-maht...',
            translation: 'Alright, driver, thank you. Just give me the exact change when we stop.',
          },
        ],
        expectedKeyWords: ['usa ka gatos', 'sukli', 'nong', 'plete', 'salamat'],
        referenceResponse: 'Nong, plete nako palihog. Naa bay sukli sa usa ka gatos?',
        politenessMarker: 'palihog / Nong',
      },
      {
        id: 'ceb_transit_4',
        destinationId: 'transport_terminal',
        title: 'Calling for Stop / Pulling Over ("Lugar lang, Nong!")',
        situation: 'The jeepney is 30 meters away from your destination corner. You must project your voice clearly above the traffic noise to request the driver to pull over.',
        communicationObjective: 'Call out the iconic Visayan stop request with clear volume and precision.',
        learnerRole: 'Alighting commuter',
        partnerRole: 'Jeepney Driver',
        difficulty: 'Intermediate',
        durationMinutes: 3,
        xpReward: 55,
        gemsReward: 20,
        keyVocabulary: [
          { word: 'Lugar lang', translation: 'Pull over here / Stop here', phonetic: 'LOO-gahr lahng', context: 'The quintessential Visayan transit phrase' },
          { word: 'Unahan', translation: 'Just ahead / In front', phonetic: 'Oo-NAH-hahn', context: 'Location reference' },
          { word: 'Monaog', translation: 'To alight / Step down', phonetic: 'Moh-NAH-og', context: 'Disembarkation action' },
        ],
        helpfulPhrases: [
          'Lugar lang, Nong! Sa kanto ra ko manaog.',
          'Lugar lang sa may botika, Nong!',
        ],
        hints: [
          'NEVER say "Para po" in Cebu or Davao unless you want to sound like a visiting Manila tourist! In Bisaya, it is always "Lugar lang!"',
        ],
        exampleDialogue: [
          {
            speaker: 'Driver',
            text: '(Steps on brake, pulls over to curb) Sige, manaog na, pag-amping sa pagkanaug.',
            phonetics: 'See-geh, mah-nah-og nah, pahg-ahm-ping...',
            translation: 'Alright, alight now, take care stepping down.',
          },
          {
            speaker: 'Learner (Commuter)',
            text: 'Salamat, Nong! Lugar lang!',
            phonetics: 'Sah-lah-maht, Nong! LOO-gahr lahng!',
            translation: 'Thank you, driver! Pull over here!',
          },
        ],
        expectedKeyWords: ['lugar lang', 'nong', 'manaog', 'kanto', 'salamat'],
        referenceResponse: 'Lugar lang, Nong! Sa may kanto ra ko manaog. Salamat!',
        politenessMarker: 'Lugar lang / Nong / Salamat',
      },
    ],
  },

  {
    id: 'community_center',
    name: 'Community Center',
    nameNative: 'Barangay Hall ug Plasa',
    district: 'Civic Hall & Sports Complex',
    themeDescription: 'Participate in civic life, greet neighborhood elders, ask for assistance, and practice courteous dispute resolution.',
    icon: '🏛️',
    colorScheme: 'teal',
    accentHex: '#0D9488',
    mapCoords: { x: 75, y: 75 },
    unlockRequirement: 'Complete at least 3 missions across the city',
    missions: [
      {
        id: 'ceb_comm_1',
        destinationId: 'community_center',
        title: 'Introducing Yourself to a New Neighbor',
        situation: 'You have just moved into a new barangay (neighborhood). You meet an elder neighbor sweeping their front yard in the morning.',
        communicationObjective: 'Greet the neighbor with respect, explain that you are a new resident, and express your joy in being part of the community.',
        learnerRole: 'New resident in neighborhood',
        partnerRole: 'Elder Neighbor (Tiya Belen)',
        difficulty: 'Beginner',
        durationMinutes: 3,
        xpReward: 40,
        gemsReward: 10,
        keyVocabulary: [
          { word: ' silingan', translation: 'Neighbor', phonetic: 'See-LEENG-ahn', context: 'Community kinship' },
          { word: 'Bag-o', translation: 'New', phonetic: 'BAHG-oh', context: 'New resident' },
          { word: 'Puyo', translation: 'To reside / live', phonetic: 'POO-yoh', context: 'Residence' },
        ],
        helpfulPhrases: [
          'Maayong buntag, Tiya! Bag-o ko nga silingan diri.',
          'Ako diay si Alex, diha ko nagpuyo sa balay tapad sa mangga.',
        ],
        hints: [
          'Addressing neighborhood elders as "Tiyo" or "Tiya" creates immediate familial warmth.',
        ],
        exampleDialogue: [
          {
            speaker: 'Tiya Belen',
            text: 'Maayong buntag sab! Welcome sa atong barangay, Dong/Day. Kung naay problema, sultihi lang mi.',
            phonetics: 'Mah-ah-yong boon-tag sab! Welcome...',
            translation: 'Good morning too! Welcome to our barangay. If you have any problems, just let us know.',
          },
          {
            speaker: 'Learner (Resident)',
            text: 'Daghang salamat, Tiya! Nalipay kaayo ko nga makapuyo dinhi.',
            phonetics: 'Dahg-hahng sah-lah-maht, Tee-yah!...',
            translation: 'Many thanks, Tiya! I am very pleased to live here.',
          },
        ],
        expectedKeyWords: ['maayong buntag', 'silingan', 'tiya', 'salamat', 'bag-o'],
        referenceResponse: 'Maayong buntag, Tiya! Ako diay si Alex, inyong bag-ong silingan dinhi.',
        politenessMarker: 'Tiya / Daghang salamat',
      },
      {
        id: 'ceb_comm_2',
        destinationId: 'community_center',
        title: 'Inquiring About Barangay Clearance & Clinic',
        situation: 'You need to ask the Barangay Secretary for a residency document and check what day the free health clinic is open.',
        communicationObjective: 'Inquire politely about clinic hours and official clearance requirements.',
        learnerRole: 'Resident visiting the Barangay Hall desk',
        partnerRole: 'Barangay Secretary (Kapitan assistant)',
        difficulty: 'Intermediate',
        durationMinutes: 4,
        xpReward: 50,
        gemsReward: 15,
        keyVocabulary: [
          { word: 'Klinika', translation: 'Clinic', phonetic: 'KLEE-nee-kah', context: 'Health center' },
          { word: 'Dokumento', translation: 'Document', phonetic: 'Doh-koo-MEN-toh', context: 'Paperwork' },
          { word: 'Libre', translation: 'Free of charge', phonetic: 'LEEB-reh', context: 'Public health service' },
        ],
        helpfulPhrases: [
          'Maayong adlaw, sir. Kanus-a abli ang barangay health clinic?',
          'Unsay mga rekisito para sa barangay clearance?',
        ],
        hints: [
          'Civic centers appreciate courteous greetings ("Maayong adlaw, sir/ma\'am") before stating your business.',
        ],
        exampleDialogue: [
          {
            speaker: 'Barangay Secretary',
            text: 'Abli ang klinika kada Miyerkules ug Biyernes, gikan alas otso sa buntag.',
            phonetics: 'Ahb-lee ang klee-nee-kah kah-dah mee-yer-koo-les...',
            translation: 'The clinic is open every Wednesday and Friday, starting at 8:00 AM.',
          },
          {
            speaker: 'Learner (Resident)',
            text: 'Salamat kaayo, sir. Mobalik ra ko sa Miyerkules alang sa checkup.',
            phonetics: 'Sah-lah-maht kah-ah-yoh, sir...',
            translation: 'Thank you very much, sir. I will return on Wednesday for the checkup.',
          },
        ],
        expectedKeyWords: ['maayong adlaw', 'klinika', 'sir', 'salamat', 'abli'],
        referenceResponse: 'Maayong adlaw, sir. Puyde ba mangutana kanus-a abli ang health clinic?',
        politenessMarker: 'sir / palihog / salamat',
      },
      {
        id: 'ceb_comm_3',
        destinationId: 'community_center',
        title: 'Participating in Barangay Bayanihan Clean-Up',
        situation: 'The neighborhood is holding a weekend communal drainage and street clean-up (bayanihan / pahina). You volunteer to help with brooms and trash bags.',
        communicationObjective: 'Volunteer your assistance enthusiastically and ask what task you can do.',
        learnerRole: 'Community volunteer',
        partnerRole: 'Kagawad (Barangay Councilor)',
        difficulty: 'Intermediate',
        durationMinutes: 4,
        xpReward: 50,
        gemsReward: 15,
        keyVocabulary: [
          { word: 'Pahina / Bayanihan', translation: 'Communal volunteer labor', phonetic: 'Pah-HEE-nah', context: 'Collective community action' },
          { word: 'Motabang', translation: 'To help / assist', phonetic: 'Moh-TAH-bahng', context: 'Volunteer action' },
          { word: 'Silhig', translation: 'Broom', phonetic: 'SEEL-heeg', context: 'Cleaning tool' },
        ],
        helpfulPhrases: [
          'Maayong buntag, Kagawad! Ania ko aron motabang sa pahina.',
          'Asa dapit ang akong silhigon?',
        ],
        hints: [
          'In Visayan communities, communal clean-ups are called "pahina" or "bayanihan".',
        ],
        exampleDialogue: [
          {
            speaker: 'Kagawad',
            text: 'Salamat kaayo sa pag-apil, Dong! Tabangi palihog sila Nong Temyong sa plasa.',
            phonetics: 'Sah-lah-maht kah-ah-yoh sah pag-ah-peel...',
            translation: 'Thank you so much for joining! Please help Nong Temyong\'s group at the plaza.',
          },
          {
            speaker: 'Learner (Volunteer)',
            text: 'Walay problema, Kagawad! Magtinabangay ta para limpyo ang atong palibot.',
            phonetics: 'Wah-lie prob-LEH-mah, Kah-gah-wad! Mag-tee-nah-bah-ngye tah...',
            translation: 'No problem, Councilor! Let\'s help one another so our surroundings stay clean.',
          },
        ],
        expectedKeyWords: ['kagawad', 'motabang', 'pahina', 'salamat', 'limpyo'],
        referenceResponse: 'Maayong buntag, Kagawad! Ania ko aron motabang sa pahina karon.',
        politenessMarker: 'Kagawad / Walay problema',
      },
      {
        id: 'ceb_comm_4',
        destinationId: 'community_center',
        title: 'Politely Explaining a Neighborhood Noise Issue',
        situation: 'A neighbor has been playing loud karaoke late past midnight. You approach them gently the next day to ask if they could lower the volume late at night.',
        communicationObjective: 'Explain the issue constructively and politely without causing anger or loss of face.',
        learnerRole: 'Polite neighbor seeking mutual peace',
        partnerRole: 'Neighbor (Kuya Jun)',
        difficulty: 'Advanced',
        durationMinutes: 4,
        xpReward: 60,
        gemsReward: 20,
        keyVocabulary: [
          { word: 'Kasaba', translation: 'Noise / Loudness', phonetic: 'Kah-SAH-bah', context: 'Volume disturbance' },
          { word: 'Tugaw', translation: 'Disturb / Disrupt sleep', phonetic: 'TOO-gow', context: 'Sleep disruption' },
          { word: 'Hinayi', translation: 'Lower (the volume)', phonetic: 'HEE-nah-yee', context: 'Gentle request' },
        ],
        helpfulPhrases: [
          'Kuya Jun, pasayloa ko sa pagsamok. Puyde ba hinayan gamay ang videoke inig gabii?',
          'Nakatugaw man gud gamay sa pahuway sa mga bata.',
        ],
        hints: [
          'Philippine conflict resolution avoids direct confrontation. Frame requests around family rest ("pahuway sa mga bata") to show goodwill.',
        ],
        exampleDialogue: [
          {
            speaker: 'Kuya Jun',
            text: 'Ay, pasayloa mi, Bay! Wala mi kabantay sa oras. Hinayan namo sunod, promise.',
            phonetics: 'Aye, pah-sy-LOH-ah mee, Bye!...',
            translation: 'Oh, forgive us, buddy! We didn\'t notice the time. We will lower it next time, promise.',
          },
          {
            speaker: 'Learner (Neighbor)',
            text: 'Salamat kaayo sa pagsabot, Kuya Jun! Amping pirmi.',
            phonetics: 'Sah-lah-maht kah-ah-yoh sah pag-sah-bot, Koo-yah Jun!',
            translation: 'Thank you so much for understanding, Kuya Jun! Take care always.',
          },
        ],
        expectedKeyWords: ['kuya', 'pasayloa', 'hinayan', 'videoke', 'salamat'],
        referenceResponse: 'Kuya Jun, pasayloa ko sa pagsamok. Puyde ba palihog hinayan gamay ang videoke inig gabii?',
        politenessMarker: 'Kuya / pasayloa ko / palihog',
      },
    ],
  },
];

// ============================================================================
// 2. FILIPINO / TAGALOG SPEAKING CITY DESTINATIONS & MISSIONS
// ============================================================================
export const FILIPINO_CITY_DESTINATIONS: CityDestination[] = [
  {
    id: 'cafe_restaurant',
    name: 'Cafe & Restaurant',
    nameNative: 'Karinderya at Kapehan',
    district: 'Sentro ng Pagkain sa Nayon',
    themeDescription: 'Mag-order ng lutong-bahay, magtanong ng ulam, at humingi ng resibo o bill nang magalang gamit ang "po" at "opo".',
    icon: '🍲',
    colorScheme: 'amber',
    accentHex: '#D97706',
    mapCoords: { x: 22, y: 30 },
    unlockRequirement: 'Bukas sa umpisa',
    missions: [
      {
        id: 'fil_cafe_1',
        destinationId: 'cafe_restaurant',
        title: 'Pagbati at Pagtatanong ng Espesyal na Ulam',
        situation: 'Pumasok ka sa isang abalang karinderya sa tanghalian. Nais mong batiin ang tindera nang magalang at tanungin ang espesyal nilang ulam ngayon.',
        communicationObjective: 'Batiin ang tindera nang may paggalang at itanong kung ano ang pinakamasarap o specialty nilang ulam.',
        learnerRole: 'Gutom na customer sa harap ng mga kaldero',
        partnerRole: 'Tindera sa Karinderya (Aling Nena)',
        difficulty: 'Beginner',
        durationMinutes: 3,
        xpReward: 40,
        gemsReward: 10,
        keyVocabulary: [
          { word: 'Magandang tanghali po', translation: 'Good afternoon', phonetic: 'Mah-gahn-DAHNG tahng-HAH-lee poh', context: 'Magalang na pagbati sa tanghali' },
          { word: 'Ulam', translation: 'Viand', phonetic: 'OO-lahm', context: 'Pangunahing pagkain' },
          { word: 'Paborito / Espesyal', translation: 'Specialty', phonetic: 'Es-pes-YAHL', context: 'Inirerekomendang putahe' },
        ],
        helpfulPhrases: [
          'Magandang tanghali po, Ate! Ano po ang espesyal ninyong ulam ngayon?',
          'Ano po ang masarap na ulam dito ngayon?',
        ],
        hints: [
          'Laging gamitin ang "po" at "Ate/Aling" para sa magalang na Tagalog.',
        ],
        exampleDialogue: [
          {
            speaker: 'Aling Nena (Tindera)',
            text: 'Magandang tanghali rin po! May sariwa kaming sinigang na bangus at inihaw na liempo.',
            phonetics: 'Mah-gahn-dahng tahng-hah-lee reen poh...',
            translation: 'Good afternoon too! We have fresh bangus in sour tamarind broth and grilled pork belly.',
          },
          {
            speaker: 'Learner (Customer)',
            text: 'Magandang tanghali po! Pabili po ng isang sinigang na bangus at dalawang kanin.',
            phonetics: 'Pah-bee-lee poh ng ee-sahng see-nee-gahng...',
            translation: 'Good afternoon! Please let me buy one bangus soup and two servings of rice.',
          },
        ],
        expectedKeyWords: ['magandang', 'tanghali', 'po', 'ulam', 'espesyal'],
        referenceResponse: 'Magandang tanghali po, Ate! Ano po ang espesyal ninyong ulam ngayon?',
        politenessMarker: 'po / Ate',
      },
      {
        id: 'fil_cafe_2',
        destinationId: 'cafe_restaurant',
        title: 'Pag-order ng Ulam at Dagdag na Kanin',
        situation: 'Nais mong mag-order ng inihaw na manok kasama ang dalawang kanin at humingi ng sabaw.',
        communicationObjective: 'Sabihin ang iyong tiyak na order at humingi ng libreng sabaw nang magalang.',
        learnerRole: 'Customer na nag-oorder',
        partnerRole: 'Tindera sa Karinderya',
        difficulty: 'Beginner',
        durationMinutes: 3,
        xpReward: 45,
        gemsReward: 15,
        keyVocabulary: [
          { word: 'Pabili po', translation: 'May I buy please', phonetic: 'Pah-BEE-lee poh', context: 'Standard Filipino purchasing phrase' },
          { word: 'Kanin', translation: 'Cooked rice', phonetic: 'KAH-neen', context: 'Pangunahing butil' },
          { word: 'Sabaw', translation: 'Broth / Soup', phonetic: 'Sah-BOW', context: 'Libreng sabaw sa karinderya' },
        ],
        helpfulPhrases: [
          'Pabili po ng isang inihaw na manok at dalawang kanin.',
          'Pahingi na rin po ng sabaw, kung pwede.',
        ],
        hints: [
          'Gamitin ang "Pabili po..." sa pagsisimula ng order.',
        ],
        exampleDialogue: [
          {
            speaker: 'Aling Nena',
            text: 'Ito na po ang inihaw ninyo. May kasama na itong mainit na sabaw.',
            phonetics: 'Ee-toh nah poh ang ee-nee-how...',
            translation: 'Here is your grilled dish. It already comes with hot broth.',
          },
          {
            speaker: 'Learner',
            text: 'Maraming salamat po, Ate! Pahingi na rin po ng isang basong tubig.',
            phonetics: 'Mah-rah-meeng sah-lah-mat poh...',
            translation: 'Thank you very much, ma\'am! May I also ask for a glass of water.',
          },
        ],
        expectedKeyWords: ['pabili', 'po', 'inihaw', 'kanin', 'sabaw'],
        referenceResponse: 'Ate, pabili po ng isang inihaw at dalawang kanin, pakilagyan na rin po ng sabaw.',
        politenessMarker: 'po / pabili',
      },
      {
        id: 'fil_cafe_3',
        destinationId: 'cafe_restaurant',
        title: 'Pagtatanong Tungkol sa Antas ng Anghang',
        situation: 'Nais mong kumain ng Bicol Express o Sisig ngunit hindi ka gaanong kumakain ng maanghang. Nais mong itanong kung gaano ito kaanghang.',
        communicationObjective: 'Itanong kung maanghang ang pagkain at humiling ng hindi gaanong maanghang na bahagi.',
        learnerRole: 'Customer na may sensitibong panlasa',
        partnerRole: 'Kusinero / Tindera',
        difficulty: 'Intermediate',
        durationMinutes: 4,
        xpReward: 50,
        gemsReward: 15,
        keyVocabulary: [
          { word: 'Maanghang', translation: 'Spicy', phonetic: 'Mah-ahng-HAHNG', context: 'Antas ng sili' },
          { word: 'Sili', translation: 'Chili', phonetic: 'SEE-lee', context: 'Pampalasa' },
          { word: 'Katas', translation: 'Sauce / Broth', phonetic: 'KAH-tahs', context: 'Sarsa ng ulam' },
        ],
        helpfulPhrases: [
          'Masyado po bang maanghang ang Bicol Express?',
          'Hindi po kasi ako sanay sa sobrang anghang.',
        ],
        hints: [
          'Sa Filipino/Tagalog, ang salita ay "maanghang" (hindi "halang" na Bisaya).',
        ],
        exampleDialogue: [
          {
            speaker: 'Tindera',
            text: 'Katamtaman lang po ang anghang nito, pero pwede kong bawasan ang sili sa inyong plato.',
            phonetics: 'Kah-tahm-tah-mahn lahng poh...',
            translation: 'The spice level is just moderate, but I can lessen the chillies on your plate.',
          },
          {
            speaker: 'Learner',
            text: 'Naku, salamat po nang marami! Iyan na lang po ang aking kukunin.',
            phonetics: 'Nah-koo, sah-lah-mat poh...',
            translation: 'Oh, thank you very much! I will take that one then.',
          },
        ],
        expectedKeyWords: ['maanghang', 'po', 'sili', 'sobra', 'salamat'],
        referenceResponse: 'Ate, masyado po bang maanghang ito? Hindi po kasi ako gaanong kumakain ng maanghang.',
        politenessMarker: 'po / Ate / salamat po',
      },
      {
        id: 'fil_cafe_4',
        destinationId: 'cafe_restaurant',
        title: 'Paghingi ng Kabuuang Bayarin (Bill)',
        situation: 'Tapos ka nang kumain at nais mong bayaran ang iyong kinain gamit ang limang daang piso (₱500).',
        communicationObjective: 'Hingin ang kabuuang bayarin nang magalang at itanong kung may panukli sa malaking pera.',
        learnerRole: 'Customer na magbabayad',
        partnerRole: 'Kahera sa Karinderya',
        difficulty: 'Intermediate',
        durationMinutes: 3,
        xpReward: 50,
        gemsReward: 20,
        keyVocabulary: [
          { word: 'Magkano po lahat', translation: 'How much in all', phonetic: 'Mag-KAH-noh poh LAH-hat', context: 'Pagtatanong ng bill' },
          { word: 'Panukli', translation: 'Change (monetary)', phonetic: 'Pah-NOOK-lee', context: 'Barya o sukli' },
          { word: 'Limang daan', translation: 'Five hundred pesos', phonetic: 'Lee-mahng DAH-ahn', context: 'Pera' },
        ],
        helpfulPhrases: [
          'Ate, magkano po lahat ang babayaran ko?',
          'May panukli po ba kayo sa limang daan?',
        ],
        hints: [
          'Gamitin ang "Magkano po lahat..." bago iabot ang malaking papel na pera.',
        ],
        exampleDialogue: [
          {
            speaker: 'Aling Nena',
            text: 'Isang inihaw at dalawang kanin... Isang daan at limampu po lahat (₱150).',
            phonetics: 'Ee-sahng ee-nee-how... Ee-sahng dah-ahn...',
            translation: 'One grilled viand and two rice... One hundred fifty in total.',
          },
          {
            speaker: 'Learner',
            text: 'Ito po ang limang daan. Salamat po sa masarap na pagkain!',
            phonetics: 'Ee-toh poh ang lee-mahng dah-ahn...',
            translation: 'Here is five hundred. Thank you for the delicious food!',
          },
        ],
        expectedKeyWords: ['magkano', 'po', 'lahat', 'panukli', 'salamat'],
        referenceResponse: 'Ate, magkano po lahat ang babayaran? May panukli po ba kayo sa limang daan?',
        politenessMarker: 'po / Ate / Salamat po',
      },
    ],
  },

  {
    id: 'public_market',
    name: 'Public Market',
    nameNative: 'Pamilihan sa Nayon',
    district: 'Sariwang Gulay at Prutas sa Balintawak',
    themeDescription: 'Matutong magtanong ng presyo, humingi ng tawad, at makipag-suki sa palengke.',
    icon: '🛒',
    colorScheme: 'emerald',
    accentHex: '#059669',
    mapCoords: { x: 74, y: 25 },
    unlockRequirement: 'Kumpletuhin ang kahit 1 mission sa Karinderya o Terminal',
    missions: [
      {
        id: 'fil_market_1',
        destinationId: 'public_market',
        title: 'Pagtatanong ng Presyo ng Mangga bawat Kilo',
        situation: 'Nais mong bumili ng hinog na mangga sa prutasan sa palengke.',
        communicationObjective: 'Itanong kung magkano ang kilo ng mangga at kung matamis ito.',
        learnerRole: 'Mamimili sa prutasan',
        partnerRole: 'Tindero ng Prutas (Mang Tonyo)',
        difficulty: 'Beginner',
        durationMinutes: 3,
        xpReward: 40,
        gemsReward: 10,
        keyVocabulary: [
          { word: 'Magkano po', translation: 'How much is it', phonetic: 'Mag-KAH-noh poh', context: 'Standard Tagalog price inquiry' },
          { word: 'Bawat kilo', translation: 'Per kilo', phonetic: 'BAH-waht KEE-loh', context: 'Timbang' },
          { word: 'Matamis', translation: 'Sweet', phonetic: 'Mah-tah-MEES', context: 'Lasa ng prutas' },
        ],
        helpfulPhrases: [
          'Magkano po ang kilo ng mangga, Kuya?',
          'Matamis po ba talaga ito?',
        ],
        hints: [
          'Gamitin ang "Magkano" sa Tagalog (hindi "Tagpila" na Bisaya).',
        ],
        exampleDialogue: [
          {
            speaker: 'Mang Tonyo (Tindero)',
            text: 'Isang daan at dalawampu (₱120) lang po ang kilo, Suki! Bagong pitas galing Guimaras.',
            phonetics: 'Ee-sahng dah-ahn aht dah-lah-wahm-poo...',
            translation: 'Only ₱120 per kilo, valued patron! Freshly picked from Guimaras.',
          },
          {
            speaker: 'Learner (Mamimili)',
            text: 'Magkano po kapag dalawang kilo kukunin ko, Kuya? Pwede po bang tumawad?',
            phonetics: 'Mag-KAH-noh poh kah-pahg dah-lah-wahng kee-loh...',
            translation: 'How much if I take two kilos, Kuya? Can I ask for a discount?',
          },
        ],
        expectedKeyWords: ['magkano', 'po', 'kilo', 'mangga', 'kuya'],
        referenceResponse: 'Kuya, magkano po ang kilo ng mangga? Matamis po ba ito?',
        politenessMarker: 'po / Kuya',
      },
      {
        id: 'fil_market_2',
        destinationId: 'public_market',
        title: 'Pakikipagtawaran ("Tawad") sa Tindero',
        situation: 'Nais mong humingi ng tawad sa biniling tatlong kilong mangga upang maging ₱100 bawat kilo.',
        communicationObjective: 'Humingi ng tawad nang magalang at palakaibigan.',
        learnerRole: 'Matalinong mamimili',
        partnerRole: 'Tindero ng Prutas',
        difficulty: 'Intermediate',
        durationMinutes: 4,
        xpReward: 50,
        gemsReward: 15,
        keyVocabulary: [
          { word: 'Tawad', translation: 'Discount request', phonetic: 'TAH-wahd', context: 'Tagalog bargaining concept' },
          { word: 'Suki', translation: 'Favored patron / Loyal customer', phonetic: 'SOO-kee', context: 'Kultura ng tiwala sa palengke' },
          { word: 'Bawas', translation: 'Reduction in price', phonetic: 'BAH-was', context: 'Bawas sa presyo' },
        ],
        helpfulPhrases: [
          'Kuya, pwede po bang tumawad? Kung tatlong kilo po, pwedeng ₱100 na lang?',
          'Baka pwede pong bawasan nang kaunti, Kuya?',
        ],
        hints: [
          'Ang "tawad" sa Pilipinas ay tanda ng pakikipagkapwa-tao, hindi kawalan ng pera.',
        ],
        exampleDialogue: [
          {
            speaker: 'Mang Tonyo',
            text: 'Aba, mahirap po pero dahil mukhang magiging suki kita, sige po, ₱110 na lang!',
            phonetics: 'Ah-bah, mah-hee-rahp poh pero...',
            translation: 'Well, it\'s tough but since you look like a good future suki, alright, ₱110 then!',
          },
          {
            speaker: 'Learner',
            text: 'Salamat po nang marami, Kuya! Tatlong kilo po ang kukunin ko.',
            phonetics: 'Sah-lah-mat poh nahng mah-rah-mee...',
            translation: 'Thank you very much, Kuya! I will take three kilos.',
          },
        ],
        expectedKeyWords: ['tawad', 'pwede', 'po', 'kilo', 'salamat'],
        referenceResponse: 'Kuya, pwede po bang tumawad? Kung tatlong kilo po kukunin ko, pwedeng ₱100 na lang?',
        politenessMarker: 'po / Kuya / pwede po ba',
      },
      {
        id: 'fil_market_3',
        destinationId: 'public_market',
        title: 'Pagbili ng Sariwang Isda at Pagpapalinis',
        situation: 'Nais mong bumili ng sariwang bangus sa isdaan at ipatanggal ang kaliskis at bituka nito.',
        communicationObjective: 'Bumili ng isda ayon sa piraso at hilingin na linisin at kaliskisan ito nang maayos.',
        learnerRole: 'Mamimili sa isdaan',
        partnerRole: 'Mag-iisda (Ate Gina)',
        difficulty: 'Intermediate',
        durationMinutes: 4,
        xpReward: 50,
        gemsReward: 20,
        keyVocabulary: [
          { word: 'Kaliskis', translation: 'Fish scales', phonetic: 'Kah-lees-KEES', context: 'Pagtatanggal ng kaliskis' },
          { word: 'Linisin', translation: 'Clean (the fish)', phonetic: 'Lee-nee-SEEN', context: 'Paghahanda ng isda' },
          { word: 'Sariwa', translation: 'Fresh', phonetic: 'Sah-REE-wah', context: 'Kalidad ng isda' },
        ],
        helpfulPhrases: [
          'Ate, pabili po ng dalawang pirasong bangus.',
          'Pwede po bang pakilinis at pakitanggal ng kaliskis?',
        ],
        hints: [
          'Gamitin ang "pakilinis" at "pakitanggal" para sa magalang na pakiusap.',
        ],
        exampleDialogue: [
          {
            speaker: 'Ate Gina (Mag-iisda)',
            text: 'Walang anuman po! Lilinisin ko po kaagad para handa na pong iluto.',
            phonetics: 'Wah-lahng ah-noo-mahn poh...',
            translation: 'You are welcome! I will clean it right away so it is ready to cook.',
          },
          {
            speaker: 'Learner',
            text: 'Maraming salamat po, Ate! Magkano po lahat?',
            phonetics: 'Mah-rah-meeng sah-lah-mat poh, Ah-teh...',
            translation: 'Thank you very much, Ate! How much is everything?',
          },
        ],
        expectedKeyWords: ['bangus', 'pakilinis', 'kaliskis', 'po', 'ate'],
        referenceResponse: 'Ate, pabili po ng dalawang pirasong bangus. Pwede po bang pakilinis at pakitanggal ng kaliskis?',
        politenessMarker: 'paki- / po / Ate',
      },
      {
        id: 'fil_market_4',
        destinationId: 'public_market',
        title: 'Paglilinaw sa Sukli at Pagpapasalamat',
        situation: 'Nagbayad ka ng ₱1,000 para sa halagang ₱350 na bilihin. Nais mong tiyakin ang tamang sukli nang magalang.',
        communicationObjective: 'Iabot ang pera, kumpirmahin ang tamang panukli, at magpasalamat nang bukal sa loob.',
        learnerRole: 'Nagsusukling mamimili',
        partnerRole: 'Tindero sa palengke',
        difficulty: 'Advanced',
        durationMinutes: 4,
        xpReward: 60,
        gemsReward: 20,
        keyVocabulary: [
          { word: 'Isang libo', translation: 'One thousand pesos', phonetic: 'Ee-sahng LEE-boh', context: 'Malaking pera' },
          { word: 'Sukli', translation: 'Change', phonetic: 'SOOK-lee', context: 'Barya o papel na pabalik' },
          { word: 'Wasto / Tama', translation: 'Correct / Exact', phonetic: 'WAHS-toh', context: 'Eksaktong halaga' },
        ],
        helpfulPhrases: [
          'Ito po ang isang libo, Kuya. May panukli po ba kayo?',
          'Salamat po, tama po ang sukli. Ingat po kayo!',
        ],
        hints: [
          'Ang pagsasabi ng "Ingat po!" sa pamamaalam ay nagpapakita ng magandang asal.',
        ],
        exampleDialogue: [
          {
            speaker: 'Tindero',
            text: 'Ito po ang sukli ninyong ₱650. Paki-bilang po kung tama.',
            phonetics: 'Ee-toh poh ang sook-lee neen-yong...',
            translation: 'Here is your change of ₱650. Please count if it\'s right.',
          },
          {
            speaker: 'Learner',
            text: 'Tama po lahat, Kuya! Maraming salamat po, sa uulitin!',
            phonetics: 'Tah-mah poh lah-hat, Koo-yah...',
            translation: 'Everything is correct, Kuya! Many thanks, until next time!',
          },
        ],
        expectedKeyWords: ['isang libo', 'sukli', 'po', 'tama', 'salamat'],
        referenceResponse: 'Kuya, ito po ang isang libo. Maraming salamat po, tama po ang sukli. Ingat po kayo!',
        politenessMarker: 'po / Kuya / Salamat po',
      },
    ],
  },

  {
    id: 'school',
    name: 'School & Campus',
    nameNative: 'Paaralan at Pamantasan',
    district: 'Sona ng Edukasyon sa Unibersidad',
    themeDescription: 'Magpakilala sa kaklase, magtanong sa guro, at magsanay ng mga usapang pang-akademiko.',
    icon: '🏫',
    colorScheme: 'purple',
    accentHex: '#9333EA',
    mapCoords: { x: 30, y: 70 },
    unlockRequirement: 'Kumpletuhin ang kahit 2 missions sa ibang lokasyon',
    missions: [
      {
        id: 'fil_school_1',
        destinationId: 'school',
        title: 'Pagpapakilala sa Bagong Kaklase',
        situation: 'Unang araw ng klase sa pamantasan. Tumabi ka sa isang kaklase at nais mong magpakilala nang masigla at magalang.',
        communicationObjective: 'Sabihin ang iyong pangalan, kung saan ka nagmula, at magpahayag ng galak na makilala siya.',
        learnerRole: 'Bagong estudyante sa silid-aralan',
        partnerRole: 'Kaklase (John)',
        difficulty: 'Beginner',
        durationMinutes: 3,
        xpReward: 40,
        gemsReward: 10,
        keyVocabulary: [
          { word: 'Ako nga pala si...', translation: 'I am... (casual introduction)', phonetic: 'Ah-koh ngah PAH-lah see...', context: 'Likas na pormula sa Tagalog' },
          { word: 'Ikinagagalak ko', translation: 'Pleased / Delighted to meet you', phonetic: 'Ee-kee-nah-gah-gah-LAHK koh', context: 'Pormal at magalang na galak' },
          { word: 'Taga-saan', translation: 'From where', phonetic: 'Tah-gah-sah-AHN', context: 'Pinanggalingang bayan' },
        ],
        helpfulPhrases: [
          'Kumusta! Ako nga pala si Alex. Ikinagagalak kong makilala ka.',
          'Taga-saan ka nga pala?',
        ],
        hints: [
          'Ang "Ako nga pala si..." ay mas natural kaysa sa "Ang pangalan ko ay...".',
        ],
        exampleDialogue: [
          {
            speaker: 'John (Kaklase)',
            text: 'Kumusta rin, Alex! Ako naman si John, taga-Quezon City ako. Bagong lipat ka ba rito?',
            phonetics: 'Koo-moos-tah reen, Alex! Ah-koh nah-mahn see John...',
            translation: 'Hello too, Alex! I am John, from Quezon City. Did you just move here?',
          },
          {
            speaker: 'Learner',
            text: 'Oo, John. Nag-aaral ako ng Computer Science rito. Natutuwa akong makilala ka!',
            phonetics: 'Oh-oh, John. Nag-ah-ah-rahl ah-koh...',
            translation: 'Yes, John. I am studying Computer Science here. Glad to meet you!',
          },
        ],
        expectedKeyWords: ['kumusta', 'ako nga pala', 'ikinagagalak', 'makilala', 'kaklase'],
        referenceResponse: 'Kumusta! Ako nga pala si Alex. Ikinagagalak kitang makilala rito sa klase.',
        politenessMarker: 'ikinagagalak ko',
      },
      {
        id: 'fil_school_2',
        destinationId: 'school',
        title: 'Paghingi ng Paglilinaw sa Propesor',
        situation: 'Mabilis na nagsalita ang propesor tungkol sa takdang-aralin. Nais mong itanong kung kailan ang eksaktong araw ng pasahan.',
        communicationObjective: 'Makiusap sa propesor na ulitin ang panuntunan o deadline nang buong paggalang.',
        learnerRole: 'Estudyanteng naglilinaw ng takdang-aralin',
        partnerRole: 'Propesor (Sir David)',
        difficulty: 'Intermediate',
        durationMinutes: 4,
        xpReward: 45,
        gemsReward: 15,
        keyVocabulary: [
          { word: 'Ipagpaumanhin po', translation: 'Pardon me / Excuse me', phonetic: 'Ee-pahg-pah-oo-mahn-HEEN poh', context: 'Magalang na paghingi ng paumanhin' },
          { word: 'Ulitin', translation: 'Repeat', phonetic: 'Oo-lee-TEEN', context: 'Pakiusap na ulitin' },
          { word: 'Pasahan', translation: 'Submission deadline', phonetic: 'Pah-sah-HAHN', context: 'Araw ng pagsusumite' },
        ],
        helpfulPhrases: [
          'Sir, ipagpaumanhin po, pwede po bang pakiulit ang araw ng pasahan?',
          'Kailan po uli ang deadline ng proyekto, Sir?',
        ],
        hints: [
          'Palaging gamitin ang "Sir/Ma\'am" na may "po" sa mga guro.',
        ],
        exampleDialogue: [
          {
            speaker: 'Sir David',
            text: 'Walang anuman. Ang pasahan po ng proyekto ay sa darating na Biyernes bago mag-alas singko ng hapon.',
            phonetics: 'Wah-lahng ah-noo-mahn. Ang pah-sah-hahn poh...',
            translation: 'No worries. The project submission is this coming Friday before 5:00 PM.',
          },
          {
            speaker: 'Learner',
            text: 'Maraming salamat po sa paglilinaw, Sir! Isusulat ko na po agad.',
            phonetics: 'Mah-rah-meeng sah-lah-mat poh...',
            translation: 'Thank you very much for clarifying, Sir! I will write it down right away.',
          },
        ],
        expectedKeyWords: ['sir', 'ipagpaumanhin', 'po', 'pakiulit', 'pasahan'],
        referenceResponse: 'Sir, ipagpaumanhin po ninyo, pwede po bang pakiulit ang petsa ng pasahan ng proyekto?',
        politenessMarker: 'po / Sir / ipagpaumanhin po',
      },
      {
        id: 'fil_school_3',
        destinationId: 'school',
        title: 'Panghihiram ng Tala (Notes) sa Kaklase',
        situation: 'Lumiban ka noong nakaraang Martes dahil nagkasakit ka. Nais mong hiramin ang tala ng iyong kaklase upang makahabol sa aralin.',
        communicationObjective: 'Ipaliwanag ang dahilan ng pagliban at magalang na humiram ng kwaderno o litrato ng notes.',
        learnerRole: 'Estudyanteng humahabol sa aralin',
        partnerRole: 'Kaklase (Bea)',
        difficulty: 'Intermediate',
        durationMinutes: 4,
        xpReward: 50,
        gemsReward: 15,
        keyVocabulary: [
          { word: 'Naliban / Umabsent', translation: 'Was absent', phonetic: 'Nah-lee-BAHN', context: 'Hindi nakapasok' },
          { word: 'Pahiram', translation: 'Please lend me', phonetic: 'Pah-HEE-rahm', context: 'Panghihiram' },
          { word: 'Tala / Notes', translation: 'Lecture notes', phonetic: 'TAH-lah', context: 'Sulat sa aralin' },
        ],
        helpfulPhrases: [
          'Bea, pwede ba akong makahiram ng notes mo noong Martes?',
          'Nagkasakit kasi ako noong araw na iyon.',
        ],
        hints: [
          'Gamitin ang "kasi" upang magpaliwanag sa paraang pambata o pangkaklase.',
        ],
        exampleDialogue: [
          {
            speaker: 'Bea (Kaklase)',
            text: 'Ay, kumusta na ang pakiramdam mo ngayon? Heto ang notebook ko, litratuhan mo na lang.',
            phonetics: 'Aye, koo-moos-tah nah ang pah-kee-rahm-dahm...',
            translation: 'Oh, how are you feeling now? Here is my notebook, you can just take photos.',
          },
          {
            speaker: 'Learner',
            text: 'Mabuti na ako ngayon. Maraming salamat, Bea! Malaking tulong ito para sa akin.',
            phonetics: 'Mah-boo-tee nah ah-koh... Mah-rah-meeng sah-lah-mat...',
            translation: 'I am better now. Thank you so much, Bea! This is a big help for me.',
          },
        ],
        expectedKeyWords: ['pwede', 'pahiram', 'notes', 'salamat', 'tulong'],
        referenceResponse: 'Bea, pwede ba akong makahiram ng notes mo noong Martes? Nagkasakit kasi ako noong araw na iyon.',
        politenessMarker: 'pwede ba / salamat',
      },
      {
        id: 'fil_school_4',
        destinationId: 'school',
        title: 'Pagtatanong ng Direksyon Patungo sa Aklatan (Library)',
        situation: 'Naliligaw ka sa malawak na pamantasan at nais mong itanong sa gwardya kung saan ang aklatan.',
        communicationObjective: 'Makisuyo sa gwardya at magtanong kung paano makakarating sa pangunahing aklatan.',
        learnerRole: 'Naliligaw na estudyante',
        partnerRole: 'Gwardya sa Unibersidad (Kuya Cardo)',
        difficulty: 'Advanced',
        durationMinutes: 3,
        xpReward: 55,
        gemsReward: 20,
        keyVocabulary: [
          { word: 'Saan po banda', translation: 'Where around is it located', phonetic: 'Sah-AHN poh BAHN-dah', context: 'Pagtatanong ng direksyon' },
          { word: 'Aklatan', translation: 'Library', phonetic: 'Ahk-lah-TAHN', context: 'Pasilidad sa paaralan' },
          { word: 'Kumanan / Kumaliwa', translation: 'Turn right / Turn left', phonetic: 'Koo-MAH-nahn', context: 'Direksyon' },
        ],
        helpfulPhrases: [
          'Kuya, saan po banda ang aklatan dito?',
          'Malayo pa po ba mula rito?',
        ],
        hints: [
          'Ang "saan po banda" ay mas natural na Tagalog kaysa sa literal na "nasaan".',
        ],
        exampleDialogue: [
          {
            speaker: 'Kuya Cardo (Gwardya)',
            text: 'Diretso ka lang po sa dulo ng pasilyo, tapos kumanan ka po sa may Science Building.',
            phonetics: 'Dee-ret-soh kah lahng poh...',
            translation: 'Just go straight to the end of the hallway, then turn right by the Science Building.',
          },
          {
            speaker: 'Learner',
            text: 'Maraming salamat po, Kuya! Diretso po at kakanan. Ingat po kayo!',
            phonetics: 'Mah-rah-meeng sah-lah-mat poh, Koo-yah...',
            translation: 'Thank you very much, Kuya! Straight then turn right. Take care!',
          },
        ],
        expectedKeyWords: ['kuya', 'saan po banda', 'aklatan', 'diretso', 'salamat'],
        referenceResponse: 'Kuya, saan po banda rito ang aklatan? Malayo pa po ba?',
        politenessMarker: 'po / Kuya / Maraming salamat po',
      },
    ],
  },

  {
    id: 'transport_terminal',
    name: 'Transport Terminal',
    nameNative: 'Terminal ng Jeep at Bus',
    district: 'Sentro ng Sakayan sa Quiapo - Taft',
    themeDescription: 'Alamin ang biyahe, mag-abot ng bayad gamit ang "makikisuyo po", at sumigaw ng "Para po sa tabi!".',
    icon: '🚙',
    colorScheme: 'blue',
    accentHex: '#2563EB',
    mapCoords: { x: 50, y: 50 },
    unlockRequirement: 'Bukas sa umpisa',
    missions: [
      {
        id: 'fil_transit_1',
        destinationId: 'transport_terminal',
        title: 'Pagtatanong Kung Dadaan ang Jeep sa Pupuntahan',
        situation: 'Nakatayo ka sa sakayan sa kanto at nais mong malaman kung dadaan ang paparating na jeep sa Quezon City Hall.',
        communicationObjective: 'Tawagin ang tsuper o konduktor at itanong kung dadaan ang sasakyan sa iyong destinasyon.',
        learnerRole: 'Komuter sa sakayan',
        partnerRole: 'Tsuper ng Jeep (Kuya Boy)',
        difficulty: 'Beginner',
        durationMinutes: 3,
        xpReward: 40,
        gemsReward: 10,
        keyVocabulary: [
          { word: 'Dadaan po ba ito sa...', translation: 'Does this pass by...?', phonetic: 'Dah-DAH-ahn poh bah ee-toh sah...', context: 'Pagtitiyak ng ruta' },
          { word: 'Sakay na po', translation: 'Hop in please', phonetic: 'SAH-kye nah poh', context: 'Tawag ng tsuper' },
          { word: 'Pamasahe', translation: 'Fare', phonetic: 'Pah-mah-SAH-heh', context: 'Bayad sa biyahe' },
        ],
        helpfulPhrases: [
          'Kuya, dadaan po ba ito sa City Hall?',
          'Magkano po ang pamasahe papunta roon?',
        ],
        hints: [
          'Sa Maynila, ginagamit ang "Kuya, dadaan po ba...".',
        ],
        exampleDialogue: [
          {
            speaker: 'Kuya Boy (Tsuper)',
            text: 'Opo, dadaan po roon! Sakay na po kayo, maluwag pa sa loob.',
            phonetics: 'Oh-poh, dah-dah-ahn poh roh-on!...',
            translation: 'Yes, it passes there! Hop in, there is still space inside.',
          },
          {
            speaker: 'Learner',
            text: 'Sige po, Kuya, sasakay po ako. Magkano po ang pamasahe?',
            phonetics: 'See-geh poh, Koo-yah...',
            translation: 'Alright, driver, I will get on. How much is the fare?',
          },
        ],
        expectedKeyWords: ['dadaan', 'po', 'kuya', 'city hall', 'pamasahe'],
        referenceResponse: 'Kuya, dadaan po ba ito sa City Hall? Magkano po ang pamasahe?',
        politenessMarker: 'po / Kuya',
      },
      {
        id: 'fil_transit_2',
        destinationId: 'transport_terminal',
        title: 'Pag-aabot ng Bayad ("Makikisuyo po ng bayad")',
        situation: 'Nasa dulo ka ng jeep malapit sa labasan at kailangan mong ipaabot ang barya sa drayber sa harap.',
        communicationObjective: 'Makiusap sa kapwa pasahero na iabot ang pamasahe nang may buong paggalang.',
        learnerRole: 'Pasaherong malayo sa tsuper',
        partnerRole: 'Katabing Pasahero (Ate May)',
        difficulty: 'Beginner',
        durationMinutes: 3,
        xpReward: 45,
        gemsReward: 15,
        keyVocabulary: [
          { word: 'Makikisuyo po', translation: 'May I request a favor please', phonetic: 'Mah-kee-kee-SOO-yoh poh', context: 'Ehemplo ng magalang na pakiusap' },
          { word: 'Bayad', translation: 'Fare payment', phonetic: 'BAH-yad', context: 'Pera ng pasahero' },
          { word: 'Isa lang po', translation: 'Just one person', phonetic: 'Ee-sah lahng poh', context: 'Bilang ng pasahero' },
        ],
        helpfulPhrases: [
          'Makikisuyo po ng bayad, Kuya/Ate. Isa lang po sa kanto.',
          'Pakiabot po sa drayber, salamat po.',
        ],
        hints: [
          'Ang "Makikisuyo po" ay ang pinakapinagpipitagang paraan sa pag-abot ng bayad sa Tagalog.',
        ],
        exampleDialogue: [
          {
            speaker: 'Ate May (Pasahero)',
            text: 'Akin na po, iaabot ko po. (Inaabot sa tsuper) Kuya, bayad daw po!',
            phonetics: 'Ah-keen nah poh, ee-ah-ah-bot koh poh...',
            translation: 'Let me take it, I will pass it forward. Driver, here is a fare!',
          },
          {
            speaker: 'Learner',
            text: 'Maraming salamat po, Ate!',
            phonetics: 'Mah-rah-meeng sah-lah-mat poh, Ah-teh!',
            translation: 'Thank you very much, Ate!',
          },
        ],
        expectedKeyWords: ['makikisuyo', 'po', 'bayad', 'isa lang', 'salamat'],
        referenceResponse: 'Makikisuyo po ng bayad, Ate. Isa lang po sa kanto unya. Salamat po!',
        politenessMarker: 'Makikisuyo po / Ate',
      },
      {
        id: 'fil_transit_3',
        destinationId: 'transport_terminal',
        title: 'Paghingi ng Panukli sa Malaking Pera sa Biyinahe',
        situation: 'Mayroon kang ₱100 na papel at ang pamasahe ay ₱13 lamang. Nais mong ipaalam sa tsuper na may panukli ka.',
        communicationObjective: 'Sabihin ang halaga ng perang ibinayad at hilingin ang panukli nang magalang.',
        learnerRole: 'Pasaherong nagbabayad ng papel',
        partnerRole: 'Tsuper ng Jeep',
        difficulty: 'Intermediate',
        durationMinutes: 4,
        xpReward: 50,
        gemsReward: 15,
        keyVocabulary: [
          { word: 'Isang daan', translation: 'One hundred pesos', phonetic: 'Ee-sahng DAH-ahn', context: 'Halaga ng pera' },
          { word: 'Panukli', translation: 'Change', phonetic: 'Pah-NOOK-lee', context: 'Barya pabalik' },
          { word: 'Ipaabot', translation: 'To hand over / Pass forward', phonetic: 'Ee-pah-AH-bot', context: 'Pagpapasa' },
        ],
        helpfulPhrases: [
          'Kuya, bayad po, isang daan po ito. May panukli po sa kanto.',
          'Makikisuyo po ng panukli sa isang daan, salamat po.',
        ],
        hints: [
          'Sabihin nang malinaw ang "isang daan po ito" upang hindi malimutan ng tsuper ang sukli.',
        ],
        exampleDialogue: [
          {
            speaker: 'Tsuper',
            text: 'Sandali lang po, iaabot ko po ang sukli paghinto sa ilaw-trapiko.',
            phonetics: 'Sahn-dah-lee lahng poh, ee-ah-ah-bot koh poh...',
            translation: 'Just a moment, I will pass the change when we halt at the traffic light.',
          },
          {
            speaker: 'Learner',
            text: 'Sige po, Kuya, maraming salamat po. Hihintayin ko po.',
            phonetics: 'See-geh poh, Koo-yah...',
            translation: 'Alright, driver, thank you very much. I will wait for it.',
          },
        ],
        expectedKeyWords: ['isang daan', 'panukli', 'po', 'kuya', 'salamat'],
        referenceResponse: 'Kuya, makikisuyo po ng bayad, isang daan po ito. May panukli po, salamat po!',
        politenessMarker: 'po / Kuya / Makikisuyo po',
      },
      {
        id: 'fil_transit_4',
        destinationId: 'transport_terminal',
        title: 'Pagpapahinto ng Jeep ("Para po sa tabi!")',
        situation: 'Malapit na ang jeep sa iyong bababaan. Kailangan mong sumigaw nang may sapat na lakas upang marinig ng tsuper sa kabila ng ingay ng makina.',
        communicationObjective: 'Sumigaw ng klasikong Tagalog transit call nang malinaw at may paggalang.',
        learnerRole: 'Bumababang pasahero',
        partnerRole: 'Tsuper ng Jeep',
        difficulty: 'Intermediate',
        durationMinutes: 3,
        xpReward: 55,
        gemsReward: 20,
        keyVocabulary: [
          { word: 'Para po', translation: 'Stop here please', phonetic: 'PAH-rah poh', context: 'Ang klasikong Tagalog tawag sa paghinto' },
          { word: 'Sa tabi lang po', translation: 'By the curb please', phonetic: 'Sah TAH-bee lahng poh', context: 'Ligtas na pagbaba' },
          { word: 'Bababa na po', translation: 'Alighting now', phonetic: 'Bah-bah-BAH nah poh', context: 'Aksyon ng pagbaba' },
        ],
        helpfulPhrases: [
          'Para po sa tabi, Kuya!',
          'Para po! Sa may kanto lang po ako bababa.',
        ],
        hints: [
          'Sa Tagalog, laging "Para po!" ang ginagamit (hindi "Lugar lang" na Bisaya).',
        ],
        exampleDialogue: [
          {
            speaker: 'Tsuper',
            text: '(Pumreno sa gilid ng kalsada) Sige po, dahan-dahan lang po sa pagbaba.',
            phonetics: 'See-geh poh, dah-hahn dah-hahn lahng poh...',
            translation: 'Alright, step down carefully.',
          },
          {
            speaker: 'Learner',
            text: 'Salamat po, Kuya! Ingat po sa biyahe!',
            phonetics: 'Sah-lah-mat poh, Koo-yah! Eeng-aht poh...',
            translation: 'Thank you, driver! Take care on your trip!',
          },
        ],
        expectedKeyWords: ['para po', 'sa tabi', 'kuya', 'bababa', 'salamat'],
        referenceResponse: 'Para po sa tabi, Kuya! Diyan na lang po sa kanto. Maraming salamat po!',
        politenessMarker: 'Para po / Kuya / Salamat po',
      },
    ],
  },

  {
    id: 'community_center',
    name: 'Community Center',
    nameNative: 'Barangay Hall at Plasa',
    district: 'Sentro ng Pamahalaang Pambarangay',
    themeDescription: 'Makipagkapwa-tao sa bagong kapitbahay, magtanong ng serbisyong pambarangay, at makilahok sa bayanihan.',
    icon: '🏛️',
    colorScheme: 'teal',
    accentHex: '#0D9488',
    mapCoords: { x: 75, y: 75 },
    unlockRequirement: 'Kumpletuhin ang kahit 3 missions sa iba\'t ibang lokasyon',
    missions: [
      {
        id: 'fil_comm_1',
        destinationId: 'community_center',
        title: 'Pagpapakilala sa Bagong Kapitbahay',
        situation: 'Kakalipat mo lang sa isang bagong barangay. Nakasalubong mo ang isang nakatatandang kapitbahay na nagwawalis sa bakuran.',
        communicationObjective: 'Batiin ang kapitbahay nang magalang, sabihing bagong lipat ka, at magpahayag ng pagnanais na maging mabuting kapitbahay.',
        learnerRole: 'Bagong lipat na residente',
        partnerRole: 'Nakatatandang Kapitbahay (Aling Carmen)',
        difficulty: 'Beginner',
        durationMinutes: 3,
        xpReward: 40,
        gemsReward: 10,
        keyVocabulary: [
          { word: 'Kapitbahay', translation: 'Neighbor', phonetic: 'Kah-peet-BAH-hye', context: 'Ugnayan sa pamayanan' },
          { word: 'Bago pong lipat', translation: 'Newly moved in', phonetic: 'BAH-goh pohng LEE-paht', context: 'Kalagayan' },
          { word: 'Ikinagagalak ko po', translation: 'I am pleased (polite)', phonetic: 'Ee-kee-nah-gah-gah-LAHK koh poh', context: 'Pagpapakilala' },
        ],
        helpfulPhrases: [
          'Magandang umaga po, Aling Carmen! Ako po si Alex, bagong kapitbahay po ninyo.',
          'Nakatira po ako sa katabing bahay.',
        ],
        hints: [
          'Tawagin ang mga nakatatanda sa kapitbahayan na "Aling" o "Mang".',
        ],
        exampleDialogue: [
          {
            speaker: 'Aling Carmen',
            text: 'Magandang umaga rin sa iyo! Maligayang pagdating sa ating barangay. Kung may kailangan ka, magsabi ka lang.',
            phonetics: 'Mah-gahn-dahng oo-mah-gah reen...',
            translation: 'Good morning too! Welcome to our barangay. If you need anything, just let us know.',
          },
          {
            speaker: 'Learner',
            text: 'Maraming salamat po, Aling Carmen! Natutuwa po akong makatira rito.',
            phonetics: 'Mah-rah-meeng sah-lah-mat poh...',
            translation: 'Thank you very much, Aling Carmen! I am glad to live here.',
          },
        ],
        expectedKeyWords: ['magandang umaga', 'po', 'kapitbahay', 'bago', 'salamat'],
        referenceResponse: 'Magandang umaga po! Ako po si Alex, bagong lipat po kaming kapitbahay ninyo.',
        politenessMarker: 'po / Aling / Maraming salamat po',
      },
      {
        id: 'fil_comm_2',
        destinationId: 'community_center',
        title: 'Pagtatanong Tungkol sa Health Center at Dokumento',
        situation: 'Nais mong magtanong sa Barangay Secretary kung anong araw bukas ang libreng bakuna o checkup sa health center.',
        communicationObjective: 'Itanong nang maayos at magalang ang oras at araw ng serbisyong medikal sa barangay.',
        learnerRole: 'Residenteng bumibisita sa Barangay Hall',
        partnerRole: 'Barangay Secretary',
        difficulty: 'Intermediate',
        durationMinutes: 4,
        xpReward: 50,
        gemsReward: 15,
        keyVocabulary: [
          { word: 'Health Center', translation: 'Klinika sa barangay', phonetic: 'Health Center', context: 'Pasilidad medikal' },
          { word: 'Libreng checkup', translation: 'Free medical consultation', phonetic: 'LEEB-rehng checkup', context: 'Serbisyo' },
          { word: 'Kailan po bukas', translation: 'When is it open', phonetic: 'KY-lahn poh BOO-kahs', context: 'Pagtatanong ng iskedyul' },
        ],
        helpfulPhrases: [
          'Magandang araw po, Sir. Kailan po bukas ang barangay health center?',
          'Ano-ano po ang mga kailangang dalhin para sa libreng checkup?',
        ],
        hints: [
          'Maging magalang at pormal kapag humihingi ng tulong sa pamahalaan.',
        ],
        exampleDialogue: [
          {
            speaker: 'Barangay Secretary',
            text: 'Bukas po ang health center tuwing Martes at Huwebes, simula alas-otso ng umaga.',
            phonetics: 'BOO-kahs poh ang health center...',
            translation: 'The health center is open every Tuesday and Thursday, starting at 8:00 AM.',
          },
          {
            speaker: 'Learner',
            text: 'Maraming salamat po sa impormasyon, Sir! Babalik po ako sa Martes.',
            phonetics: 'Mah-rah-meeng sah-lah-mat poh...',
            translation: 'Thank you very much for the information, Sir! I will return on Tuesday.',
          },
        ],
        expectedKeyWords: ['magandang araw', 'po', 'health center', 'sir', 'salamat'],
        referenceResponse: 'Magandang araw po, Sir. Pwede po bang magtanong kung kailan po bukas ang health center?',
        politenessMarker: 'po / Sir / Maraming salamat po',
      },
      {
        id: 'fil_comm_3',
        destinationId: 'community_center',
        title: 'Pakikilahok sa Bayanihan / Oplan Linis',
        situation: 'May gaganaping Oplan Linis o Bayanihan sa barangay sa Sabado. Nais mong magboluntaryo at tumulong sa paglilinis ng kanal at plasa.',
        communicationObjective: 'Magpahayag ng kahandaang tumulong at itanong kung anong gawain ang maaari mong simulan.',
        learnerRole: 'Boluntaryong residente',
        partnerRole: 'Barangay Kagawad',
        difficulty: 'Intermediate',
        durationMinutes: 4,
        xpReward: 50,
        gemsReward: 15,
        keyVocabulary: [
          { word: 'Bayanihan', translation: 'Communal volunteer unity', phonetic: 'Bah-yah-NEE-hahn', context: 'Kultura ng pagtutulungan' },
          { word: 'Tumulong', translation: 'To help', phonetic: 'Too-MOO-long', context: 'Pagboboluntaryo' },
          { word: 'Magwalis', translation: 'To sweep', phonetic: 'Mag-wah-LEES', context: 'Gawain sa paglilinis' },
        ],
        helpfulPhrases: [
          'Magandang umaga po, Kagawad! Nandito po ako para tumulong sa Bayanihan.',
          'Saan po ba ako pwedeng magsimula maglinis?',
        ],
        hints: [
          'Ang "Bayanihan" ay isa sa mga pinakatampok na pagpapahalaga sa kulturang Pilipino.',
        ],
        exampleDialogue: [
          {
            speaker: 'Kagawad',
            text: 'Aba, salamat sa pagdating! Paki-samahan po sila Mang Tonyo sa paglilinis ng plasa.',
            phonetics: 'Ah-bah, sah-lah-mat sah pag-dah-teeng...',
            translation: 'Well, thanks for coming! Please join Mang Tonyo\'s group cleaning the plaza.',
          },
          {
            speaker: 'Learner',
            text: 'Walang anuman po, Kagawad! Masaya po akong makatulong sa ating komunidad.',
            phonetics: 'Wah-lahng ah-noo-mahn poh...',
            translation: 'You are very welcome, Councilor! I am happy to help our community.',
          },
        ],
        expectedKeyWords: ['kagawad', 'tumulong', 'bayanihan', 'po', 'salamat'],
        referenceResponse: 'Magandang umaga po, Kagawad! Nais ko po sanang tumulong sa Bayanihan natin ngayon.',
        politenessMarker: 'po / Kagawad / Walang anuman po',
      },
      {
        id: 'fil_comm_4',
        destinationId: 'community_center',
        title: 'Mhinahong Pakikipag-usap Tungkol sa Ingay sa Gabi',
        situation: 'Nagkakaroon ng malakas na karaoke ang kapitbahay lampas hatinggabi. Kinaumagahan, nilapitan mo siya nang mahinahon upang makiusap na hinaan ang boses kapag gabi na.',
        communicationObjective: 'Ipaliwanag ang sitwasyon nang mapayapa at iwasang mapahiya ang kapitbahay habang humihiling ng konsiderasyon.',
        learnerRole: 'Respetadong kapitbahay na naghahanap ng kapayapaan',
        partnerRole: 'Kapitbahay (Kuya Jun)',
        difficulty: 'Advanced',
        durationMinutes: 4,
        xpReward: 60,
        gemsReward: 20,
        keyVocabulary: [
          { word: 'Ipagpaumanhin po', translation: 'Excuse / Forgive me', phonetic: 'Ee-pahg-pah-oo-mahn-HEEN poh', context: 'Paghingi ng paumanhin sa abala' },
          { word: 'Hinaan po nang kaunti', translation: 'Lower slightly', phonetic: 'Hee-nah-AHN poh', context: 'Pakiusap sa volume' },
          { word: 'Pahinga', translation: 'Rest / Sleep', phonetic: 'Pah-HEENG-ah', context: 'Pangangailangan ng tulog' },
        ],
        helpfulPhrases: [
          'Kuya Jun, magandang araw po. Pasensya na po sa abala, pwede po kayang pakihinaan nang kaunti ang videoke pag gabi?',
          'Kailangan po kasing magpahinga ng mga bata para sa eskwela.',
        ],
        hints: [
          'Gamitin ang pangangailangan ng mga bata o matatanda sa pahinga bilang magalang na dahilan upang hindi magmukhang mapanghusga.',
        ],
        exampleDialogue: [
          {
            speaker: 'Kuya Jun',
            text: 'Naku, pasensya na po kayo! Hindi namin namalayan ang oras kagabi. Hihinaan na po namin simula ngayon.',
            phonetics: 'Nah-koo, pah-sen-syah nah poh kay-oh!...',
            translation: 'Oh, our apologies! We didn\'t notice the time last night. We will lower it starting now.',
          },
          {
            speaker: 'Learner',
            text: 'Maraming salamat po sa pag-unawa, Kuya Jun! Ingat po kayo.',
            phonetics: 'Mah-rah-meeng sah-lah-mat poh sah pag-oo-nah-wah...',
            translation: 'Thank you very much for understanding, Kuya Jun! Take care.',
          },
        ],
        expectedKeyWords: ['kuya', 'pasensya na po', 'pakihinaan', 'videoke', 'salamat'],
        referenceResponse: 'Kuya Jun, magandang araw po. Ipagpaumanhin po ninyo, pwede po kayang pakihinaan nang kaunti ang videoke kapag gabi? Salamat po!',
        politenessMarker: 'po / Kuya / Ipagpaumanhin po / pakihinaan',
      },
    ],
  },
];

// ============================================================================
// 3. STORAGE & RECOVERY HELPERS FOR PROGRESS
// ============================================================================
export const CITY_DESTINATIONS_BY_LANGUAGE: Record<SpeakingLanguageId, CityDestination[]> = {
  cebuano: CEBUANO_CITY_DESTINATIONS,
  filipino: FILIPINO_CITY_DESTINATIONS,
  english: CEBUANO_CITY_DESTINATIONS, // Falls back to Cebuano language track with English explanations
};

export function getDestinationsForLanguage(lang: SpeakingLanguageId): CityDestination[] {
  return CITY_DESTINATIONS_BY_LANGUAGE[lang] || CEBUANO_CITY_DESTINATIONS;
}

export function getStoredSpeakingProgress(lang: SpeakingLanguageId = 'cebuano'): SpeakingCityProgress {
  if (typeof window === 'undefined') return INITIAL_SPEAKING_CITY_PROGRESS[lang];
  try {
    const key = `sultiai_speaking_city_${lang}`;
    const raw = localStorage.getItem(key);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // fallback
  }
  return INITIAL_SPEAKING_CITY_PROGRESS[lang];
}

export function saveSpeakingProgress(progress: SpeakingCityProgress): void {
  if (typeof window === 'undefined') return;
  try {
    const key = `sultiai_speaking_city_${progress.language}`;
    localStorage.setItem(key, JSON.stringify(progress));
  } catch {
    // fallback
  }
}
