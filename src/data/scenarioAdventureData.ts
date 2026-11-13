// ============================================================================
// SultiAI: Scenario Practice — Interactive Story Adventure
// Grounded in Philippine Sociolinguistics (Akademyang Bisaya & KWF)
// ============================================================================

export type ScenarioLanguageId = 'cebuano' | 'filipino' | 'english';

export type ScenarioCategory = 
  | 'everyday' 
  | 'food_shopping' 
  | 'school_work' 
  | 'travel_directions' 
  | 'community_culture';

export type ScenarioDifficulty = 'Beginner' | 'Intermediate' | 'Advanced';

export type SceneInteractionType = 
  | 'read_continue' 
  | 'choose_response' 
  | 'complete_phrase' 
  | 'speak_response';

export interface SceneChoice {
  id: string;
  text: string;
  translation: string;
  isOptimal: boolean;
  nextNodeId: string;
  feedbackNote?: string;
}

export interface SceneFillBlank {
  prompt: string;
  missingWord: string;
  options: string[];
  nextNodeId: string;
  explanation: string;
}

export interface SceneSpeakingPrompt {
  instruction: string;
  targetObjective: string;
  referenceText: string;
  phonetics: string;
  expectedKeyWords: string[];
  politenessMarker: string;
  nextNodeId: string;
}

export interface SceneNode {
  id: string;
  speakerName: string;
  speakerRole: string;
  speakerAvatar: string;
  isLearnerTurn?: boolean;
  dialogueText: string;
  phonetics?: string;
  translation: string;
  culturalNote?: string;
  interactionType: SceneInteractionType;
  choices?: SceneChoice[];
  fillBlank?: SceneFillBlank;
  speakingPrompt?: SceneSpeakingPrompt;
  nextNodeId?: string;
  isEnding?: boolean;
  endingData?: {
    outcomeTitle: string;
    outcomeDescription: string;
    objectivesAchieved: string[];
    success: boolean;
    rewardXp: number;
  };
}

export interface AdventureScenario {
  id: string;
  category: ScenarioCategory;
  title: string;
  titleNative: string;
  shortDescription: string;
  situation: string;
  charactersInvolved: string[];
  learnerRole: string;
  communicationObjectives: string[];
  difficulty: ScenarioDifficulty;
  estimatedMinutes: number;
  xpReward: number;
  gemsReward: number;
  backdropTheme: string;
  backdropColor: string;
  usefulVocabulary: { word: string; translation: string; phonetic: string }[];
  culturalEtiquetteTip: string;
  initialNodeId: string;
  nodes: Record<string, SceneNode>;
}

export interface ScenarioAdventureProgress {
  language: ScenarioLanguageId;
  completedScenarios: string[];
  currentScenarioId?: string;
  unlockedCategories: ScenarioCategory[];
  totalScenarioXp: number;
  totalAttempts: number;
  highestScore: number;
}

export const SCENARIO_CATEGORIES: { id: ScenarioCategory; label: string; icon: string; description: string }[] = [
  { id: 'everyday', label: 'Everyday Encounters', icon: '🤝', description: 'Greetings, introductions, friendly requests, and apologies.' },
  { id: 'food_shopping', label: 'Food & Shopping', icon: '🍲', description: 'Dining at cafes, market bargaining, and clarifying orders.' },
  { id: 'school_work', label: 'School & Work', icon: '🏫', description: 'Campus interactions, asking teachers for clarity, and peer teamwork.' },
  { id: 'travel_directions', label: 'Travel & Directions', icon: '🚙', description: 'Commuting on jeepneys, asking transit routes, and navigating streets.' },
  { id: 'community_culture', label: 'Community & Culture', icon: '🏛️', description: 'Interacting with neighbors, barangay civic life, and local traditions.' },
];

export const INITIAL_SCENARIO_PROGRESS: Record<ScenarioLanguageId, ScenarioAdventureProgress> = {
  cebuano: {
    language: 'cebuano',
    completedScenarios: [],
    unlockedCategories: ['everyday', 'food_shopping'],
    totalScenarioXp: 0,
    totalAttempts: 0,
    highestScore: 0,
  },
  filipino: {
    language: 'filipino',
    completedScenarios: [],
    unlockedCategories: ['everyday', 'food_shopping'],
    totalScenarioXp: 0,
    totalAttempts: 0,
    highestScore: 0,
  },
  english: {
    language: 'english',
    completedScenarios: [],
    unlockedCategories: ['everyday', 'food_shopping'],
    totalScenarioXp: 0,
    totalAttempts: 0,
    highestScore: 0,
  },
};

// ============================================================================
// 1. CEBUANO / BISAYA ADVENTURE SCENARIOS
// ============================================================================
export const CEBUANO_ADVENTURE_SCENARIOS: AdventureScenario[] = [
  {
    id: 'ceb_story_cafe',
    category: 'food_shopping',
    title: 'Your First Visit to Carenderia ni Nang Lita',
    titleNative: 'Paniudto sa Carenderia ni Nang Lita',
    shortDescription: 'Navigate lunch at a bustling roadside eatery: greet, choose viands, request broth, and pay politely.',
    situation: 'It is a warm Friday noon. You step into a cozy carenderia near the city terminal with steaming stainless pots.',
    charactersInvolved: ['Nang Lita (Carenderia Owner)', 'You (Customer)', 'Kuya Bert (Fellow Patron)'],
    learnerRole: 'Hungry diner ordering lunch',
    communicationObjectives: [
      'Greet the server courteously in Bisaya',
      'Order your selected viand with extra rice',
      'Politely request hot soup ("sabaw")',
      'Settle the bill and thank the host'
    ],
    difficulty: 'Beginner',
    estimatedMinutes: 5,
    xpReward: 50,
    gemsReward: 15,
    backdropTheme: 'Eatery Counter',
    backdropColor: 'from-amber-950 via-stone-900 to-[#0e1b24]',
    usefulVocabulary: [
      { word: 'Maayong udto', translation: 'Good afternoon / lunchtime', phonetic: 'Mah-AH-yong OOD-toh' },
      { word: 'Sud-an', translation: 'Viand / Main dish', phonetic: 'SOOD-ahn' },
      { word: 'Palihog', translation: 'Please', phonetic: 'Pah-LEE-hog' },
      { word: 'Sabaw', translation: 'Broth / Soup', phonetic: 'SAH-bow' },
    ],
    culturalEtiquetteTip: 'In Bisaya culture, asking for "libreng sabaw" (free hot broth) is a standard dining tradition, always asked with a polite "Nang/Nong".',
    initialNodeId: 'node_cafe_1',
    nodes: {
      node_cafe_1: {
        id: 'node_cafe_1',
        speakerName: 'Nang Lita',
        speakerRole: 'Carenderia Owner',
        speakerAvatar: '🍲',
        dialogueText: 'Maayong udto kanimo! Dali, sulod diri kay init pa kaayo ang atong mga pot! Unsay imong paborito nga sud-an karon?',
        phonetics: 'Mah-ah-yong ood-toh kah-nee-moh! Dah-lee, soo-lod dee-ree...',
        translation: 'Good afternoon to you! Come in, our pots are still very hot! What is your favorite viand today?',
        interactionType: 'choose_response',
        choices: [
          {
            id: 'c1',
            text: 'Maayong udto sab, Nang! Unsay inyong espesyal nga sud-an karon?',
            translation: 'Good afternoon too, ma\'am! What is your specialty viand today?',
            isOptimal: true,
            nextNodeId: 'node_cafe_2_optimal',
            feedbackNote: 'Natural greeting! Acknowledging the server with "Nang" builds instant rapport.'
          },
          {
            id: 'c2',
            text: 'Gutom na kaayo ko, tagaig pagkaon dayon.',
            translation: 'I am very hungry, give me food immediately.',
            isOptimal: false,
            nextNodeId: 'node_cafe_2_blunt',
            feedbackNote: 'A bit too abrupt. It is customary to greet first before demanding food.'
          }
        ]
      },

      node_cafe_2_optimal: {
        id: 'node_cafe_2_optimal',
        speakerName: 'Nang Lita',
        speakerRole: 'Carenderia Owner',
        speakerAvatar: '🍲',
        dialogueText: 'Naa mi presko kaayong Tinolang Isda ug lamiang Humba! Bag-o pa gyung luto ang duha.',
        phonetics: 'Nah-ah mee pres-koh kah-ah-yong tee-noh-lahng ees-dah...',
        translation: 'We have very fresh fish in ginger broth and savory braised pork humba! Both are freshly cooked.',
        interactionType: 'complete_phrase',
        fillBlank: {
          prompt: 'Complete your order for Tinolang Isda with rice politely:',
          missingWord: 'Palihog',
          options: ['Palihog', 'Kusog', 'Dali'],
          nextNodeId: 'node_cafe_3_speak',
          explanation: '"Palihog" is the essential Visayan courtesy marker, equivalent to "please".'
        }
      },

      node_cafe_2_blunt: {
        id: 'node_cafe_2_blunt',
        speakerName: 'Nang Lita',
        speakerRole: 'Carenderia Owner',
        speakerAvatar: '🍲',
        dialogueText: 'Ay, hinay-hinay lang, Dong/Day! Naa mi Tinola ug Humba. Unsay imong pilion?',
        phonetics: 'Aye, hee-nye-hee-nye lahng...',
        translation: 'Oh, take it easy, dear! We have Tinola and Humba. What will you choose?',
        interactionType: 'read_continue',
        nextNodeId: 'node_cafe_3_speak'
      },

      node_cafe_3_speak: {
        id: 'node_cafe_3_speak',
        speakerName: 'Nang Lita',
        speakerRole: 'Carenderia Owner',
        speakerAvatar: '🍲',
        dialogueText: 'Sige, akong andamon imong plato. Naa pa ba kay laing hangyo sa imong order?',
        phonetics: 'See-geh, ah-kong ahn-dah-mon ee-mong plah-toh...',
        translation: 'Alright, I will prepare your plate. Do you have any other requests with your order?',
        interactionType: 'speak_response',
        speakingPrompt: {
          instruction: 'Speak out loud to ask for free soup and water politely:',
          targetObjective: 'Request hot soup and a glass of water using "palihog"',
          referenceText: 'Pangayo ko og init nga sabaw ug usa ka basong tubig, Nang, palihog.',
          phonetics: 'Pah-ngah-yoh koh og ee-neet ngah sah-bow oog oo-sah kah bah-song too-beeg...',
          expectedKeyWords: ['sabaw', 'tubig', 'nang', 'palihog'],
          politenessMarker: 'Nang / palihog',
          nextNodeId: 'node_cafe_4_settle'
        }
      },

      node_cafe_4_settle: {
        id: 'node_cafe_4_settle',
        speakerName: 'Nang Lita',
        speakerRole: 'Carenderia Owner',
        speakerAvatar: '🍲',
        dialogueText: 'Dia ang imong lamiang pagkaon uban ang init nga sabaw! Human nimo og kaon, duola lang ko sa cashier.',
        phonetics: 'Dee-ah ang ee-mong lah-mee-ahng pahg-kah-on...',
        translation: 'Here is your delicious food with hot soup! When you finish, just approach me at the cashier.',
        interactionType: 'choose_response',
        choices: [
          {
            id: 'pay_1',
            text: 'Nang, pila tanan among nabayran? Dia ang bayad, salamat kaayo!',
            translation: 'Ma\'am, how much is our total bill? Here is the payment, thank you so much!',
            isOptimal: true,
            nextNodeId: 'node_cafe_ending_success',
            feedbackNote: 'Polite inquiry with sincere gratitude.'
          },
          {
            id: 'pay_2',
            text: 'Ibilin ra nako ang kwarta sa lamesa.',
            translation: 'I will just leave the money on the table.',
            isOptimal: false,
            nextNodeId: 'node_cafe_ending_success',
            feedbackNote: 'Leaving cash unattended is less customary; handing it directly is preferred.'
          }
        ]
      },

      node_cafe_ending_success: {
        id: 'node_cafe_ending_success',
        speakerName: 'Nang Lita',
        speakerRole: 'Carenderia Owner',
        speakerAvatar: '🍲',
        dialogueText: 'Daghang salamat, higala! Sakto kaayo imong bayad. Balik-balik diri ha, suki na ka namo!',
        phonetics: 'Dahg-hahng sah-lah-maht, hee-gah-lah!...',
        translation: 'Many thanks, friend! Your payment is exact. Come back often, you are our suki now!',
        interactionType: 'read_continue',
        isEnding: true,
        endingData: {
          outcomeTitle: 'Carenderia Suki Achievement Conferred!',
          outcomeDescription: 'You navigated your first local eatery with warmth and genuine Visayan manners.',
          objectivesAchieved: [
            'Courteous greeting in lunchtime context',
            'Selected food and requested extra rice accurately',
            'Practiced spoken request for broth and water',
            'Settled bill and established warm suki friendship'
          ],
          success: true,
          rewardXp: 50
        }
      }
    }
  },

  {
    id: 'ceb_story_commute',
    category: 'travel_directions',
    title: 'Commuter Journey: Riding the Multicab to Matina',
    titleNative: 'Pagsakay sa Multicab padulong sa Matina',
    shortDescription: 'Board a passenger jeepney, pass your fare down the aisle, and hail your stop with confidence.',
    situation: 'You are on McArthur Highway during afternoon rush hour. You need to take the multicab and alight at Matina Crossing.',
    charactersInvolved: ['Manong Driver', 'Ate Joy (Fellow Commuter)', 'You (Passenger)'],
    learnerRole: 'Commuter riding public transit',
    communicationObjectives: [
      'Confirm destination route with the driver',
      'Politely request fellow riders to pass your fare forward',
      'Call out your drop-off corner accurately using "Lugar lang!"'
    ],
    difficulty: 'Beginner',
    estimatedMinutes: 4,
    xpReward: 45,
    gemsReward: 15,
    backdropTheme: 'Jeepney Transit Aisle',
    backdropColor: 'from-blue-950 via-stone-900 to-[#0e1b24]',
    usefulVocabulary: [
      { word: 'Plete', translation: 'Fare', phonetic: 'PLEH-teh' },
      { word: 'Palihog ko', translation: 'Please (pass)', phonetic: 'Pah-LEE-hog koh' },
      { word: 'Lugar lang', translation: 'Stop here / Pull over', phonetic: 'LOO-gahr lahng' },
      { word: 'Kanto', translation: 'Street corner', phonetic: 'KAHN-toh' },
    ],
    culturalEtiquetteTip: 'Always call out "Lugar lang, Nong!" in Bisaya instead of Tagalog "Para po" when asking the driver to pull over.',
    initialNodeId: 'node_commute_1',
    nodes: {
      node_commute_1: {
        id: 'node_commute_1',
        speakerName: 'Manong Driver',
        speakerRole: 'Jeepney Driver',
        speakerAvatar: '🚙',
        dialogueText: 'Matina Crossing! Toril! Sakay na, duha na lay kulang!',
        phonetics: 'Mah-tee-nah kros-eeng! Toh-reel! Sah-kye nah...',
        translation: 'Matina Crossing! Toril! Hop in, only two spots left!',
        interactionType: 'choose_response',
        choices: [
          {
            id: 'c_com_1',
            text: 'Nong, moagi ba ni sa may simbahan sa Matina?',
            translation: 'Driver, does this pass by the church in Matina?',
            isOptimal: true,
            nextNodeId: 'node_commute_2_fare',
            feedbackNote: 'Clear route confirmation before boarding.'
          },
          {
            id: 'c_com_2',
            text: 'Sakay ko bisan asa ka padulong.',
            translation: 'I will board wherever you are heading.',
            isOptimal: false,
            nextNodeId: 'node_commute_2_fare',
            feedbackNote: 'Vague! Always verify your exact landmark.'
          }
        ]
      },

      node_commute_2_fare: {
        id: 'node_commute_2_fare',
        speakerName: 'Ate Joy',
        speakerRole: 'Fellow Commuter',
        speakerAvatar: '👩',
        dialogueText: 'Kasya pa ang usa diri, bay. Plete nimo i-tunol lang aron maabot sa drayber.',
        phonetics: 'Kahs-yah pah ang oo-sah dee-ree, bye...',
        translation: 'One more can fit here, friend. Hand over your fare so it reaches the driver.',
        interactionType: 'complete_phrase',
        fillBlank: {
          prompt: 'Complete the fare-passing request phrase:',
          missingWord: 'plete',
          options: ['plete', 'kamot', 'lingkod'],
          nextNodeId: 'node_commute_3_stop',
          explanation: '"Plete" refers specifically to passenger fare in Bisaya.'
        }
      },

      node_commute_3_stop: {
        id: 'node_commute_3_stop',
        speakerName: 'Manong Driver',
        speakerRole: 'Jeepney Driver',
        speakerAvatar: '🚙',
        dialogueText: 'Dawat nako ang plete sa Matina! Duol na ta sa kanto, kinsay manaog dinhi?',
        phonetics: 'Dah-wat nah-koh ang pleh-teh... Doo-ol nah tah sah kahn-toh...',
        translation: 'Fare for Matina received! We are nearing the corner, who is getting off here?',
        interactionType: 'speak_response',
        speakingPrompt: {
          instruction: 'Speak out loud clearly to call out your stop:',
          targetObjective: 'Say "Lugar lang, Nong! Sa may kanto ra ko manaog."',
          referenceText: 'Lugar lang, Nong! Sa kanto ra ko manaog.',
          phonetics: 'Loo-GAHR lahng, NONG! Sah KAHN-toh rah koh mah-NAH-og.',
          expectedKeyWords: ['lugar', 'lang', 'nong', 'kanto', 'manaog'],
          politenessMarker: 'Lugar lang / Nong',
          nextNodeId: 'node_commute_ending'
        }
      },

      node_commute_ending: {
        id: 'node_commute_ending',
        speakerName: 'Manong Driver',
        speakerRole: 'Jeepney Driver',
        speakerAvatar: '🚙',
        dialogueText: '(Tungod sa kanto) Sige, manaog na! Amping sa pagkanaug, Dong/Day!',
        phonetics: 'See-geh, mah-nah-og nah! Ahm-ping sah pahg-kah-nah-oog...',
        translation: '(Halts at the corner) Alright, disembark now! Take care stepping down!',
        interactionType: 'read_continue',
        isEnding: true,
        endingData: {
          outcomeTitle: 'Smooth Commuter Navigation Mastered!',
          outcomeDescription: 'You navigated public transport with authentic Visayan transit terminology.',
          objectivesAchieved: [
            'Confirmed destination route with driver',
            'Passed commuter fare courteously down the aisle',
            'Accurately spoke the iconic "Lugar lang!" callout'
          ],
          success: true,
          rewardXp: 45
        }
      }
    }
  },

  {
    id: 'ceb_story_market',
    category: 'food_shopping',
    title: 'The Art of Hangyo at Bankerohan Market',
    titleNative: 'Ang Arte sa Hangyo sa Merkado sa Bankerohan',
    shortDescription: 'Purchase fresh ripe mangoes and practice courteous bargaining ("hangyo") with vendor Nong Tasyo.',
    situation: 'You are walking along the fruit section of Bankerohan Market in Davao City, smelling the fragrance of golden mangoes.',
    charactersInvolved: ['Nong Tasyo (Fruit Vendor)', 'You (Shopper)'],
    learnerRole: 'Market shopper bargaining for fruits',
    communicationObjectives: [
      'Inquire about the price per kilo',
      'Politely request a friendly discount ("hangyo")',
      'Agree on quantity and thank the vendor'
    ],
    difficulty: 'Intermediate',
    estimatedMinutes: 5,
    xpReward: 55,
    gemsReward: 20,
    backdropTheme: 'Bustling Wet Market',
    backdropColor: 'from-emerald-950 via-stone-900 to-[#0e1b24]',
    usefulVocabulary: [
      { word: 'Tagpila', translation: 'How much each', phonetic: 'Tag-PEE-lah' },
      { word: 'Hangyo', translation: 'Discount request', phonetic: 'HAHNG-yoh' },
      { word: 'Tamis', translation: 'Sweet', phonetic: 'TAH-mees' },
      { word: 'Presko', translation: 'Fresh', phonetic: 'PRES-koh' },
    ],
    culturalEtiquetteTip: 'Bargaining ("hangyo") in Visayan markets is a social icebreaker. Always smile and ask politely rather than demanding an aggressive price.',
    initialNodeId: 'node_market_1',
    nodes: {
      node_market_1: {
        id: 'node_market_1',
        speakerName: 'Nong Tasyo',
        speakerRole: 'Fruit Vendor',
        speakerAvatar: '🛒',
        dialogueText: 'Maayong buntag, Suki! Bag-ong abot ning tam-is kaayong mangga gikan sa Davao farm. Pila ka kilo imong kuhaon?',
        phonetics: 'Mah-ah-yong boon-tag, Soo-kee!...',
        translation: 'Good morning, valued customer! These very sweet mangoes just arrived from the Davao farm. How many kilos will you take?',
        interactionType: 'choose_response',
        choices: [
          {
            id: 'm1',
            text: 'Tagpila man ang kilo ani, Nong? Puyde makatilaw gamay?',
            translation: 'How much is a kilo of this, sir? May I have a little taste test?',
            isOptimal: true,
            nextNodeId: 'node_market_2_quote',
            feedbackNote: 'Friendly inquiry! Vendors gladly give a small slice to prove quality.'
          },
          {
            id: 'm2',
            text: 'Mahal man siguro na, ayaw na lang.',
            translation: 'That is probably expensive, never mind.',
            isOptimal: false,
            nextNodeId: 'node_market_2_quote',
            feedbackNote: 'Too dismissive. It is better to inquire about the price first.'
          }
        ]
      },

      node_market_2_quote: {
        id: 'node_market_2_quote',
        speakerName: 'Nong Tasyo',
        speakerRole: 'Fruit Vendor',
        speakerAvatar: '🛒',
        dialogueText: 'Tag-usa ka gatos ug baynte (₱120) ra ang kilo, Dong/Day! Tilawi ra gud, puros gyud tam-is.',
        phonetics: 'Tag-oo-sah kah gah-tos oog bye-teh rah...',
        translation: 'It is only ₱120 per kilo, dear! Just taste it, it is purely sweet.',
        interactionType: 'speak_response',
        speakingPrompt: {
          instruction: 'Request a friendly courtesy discount for 3 kilos:',
          targetObjective: 'Politely ask if you can get 3 kilos for ₱100 each using "hangyo"',
          referenceText: 'Puyde hangyo gamay, Nong? Kung tulo ka kilo, mahimo bang usa ka gatos na lang?',
          phonetics: 'Pooy-deh HAHNG-yoh GAH-my, NONG?...',
          expectedKeyWords: ['hangyo', 'gamay', 'nong', 'kilo', 'puyde'],
          politenessMarker: 'Nong / hangyo gamay',
          nextNodeId: 'node_market_ending'
        }
      },

      node_market_ending: {
        id: 'node_market_ending',
        speakerName: 'Nong Tasyo',
        speakerRole: 'Fruit Vendor',
        speakerAvatar: '🛒',
        dialogueText: 'Haha! Sige na lang kay maayo kaayo kang mohangyo. Tagaan tikag ₱100 ang kilo basta tulo ka kilo. Salamat kaayo, Suki!',
        phonetics: 'Hah-hah! See-geh nah lahng... Sah-lah-maht kah-ah-yoh, Soo-kee!',
        translation: 'Haha! Alright then since you bargain so courteously. I will give it at ₱100 per kilo as long as you take three kilos. Thank you very much, patron!',
        interactionType: 'read_continue',
        isEnding: true,
        endingData: {
          outcomeTitle: 'Master of Hangyo Conferred!',
          outcomeDescription: 'You established friendly rapport with the local vendor and secured fresh mangoes.',
          objectivesAchieved: [
            'Inquired price per kilo politely in Bisaya',
            'Expressed interest in fruit quality and sweetness',
            'Successfully practiced polite conversational bargaining ("hangyo")'
          ],
          success: true,
          rewardXp: 55
        }
      }
    }
  }
];

// ============================================================================
// 2. FILIPINO / TAGALOG ADVENTURE SCENARIOS
// ============================================================================
export const FILIPINO_ADVENTURE_SCENARIOS: AdventureScenario[] = [
  {
    id: 'fil_story_cafe',
    category: 'food_shopping',
    title: 'Your First Visit to Karinderya ni Aling Nena',
    titleNative: 'Pananghalian sa Karinderya ni Aling Nena',
    shortDescription: 'Experience authentic dining in a Metro Manila eatery: greet with "po", order viands, and ask for soup.',
    situation: 'It is lunchtime in Quiapo. You enter a popular eatery filled with stainless trays displaying savory Filipino stews.',
    charactersInvolved: ['Aling Nena (Tindera)', 'Ikaw (Customer)'],
    learnerRole: 'Hungry diner placing an order',
    communicationObjectives: [
      'Greet the store owner with respectful honorifics ("po/opo")',
      'Order food and extra rice clearly',
      'Ask for complimentary hot soup politely',
      'Pay the bill with gratitude'
    ],
    difficulty: 'Beginner',
    estimatedMinutes: 5,
    xpReward: 50,
    gemsReward: 15,
    backdropTheme: 'Karinderya Counter',
    backdropColor: 'from-amber-950 via-stone-900 to-[#0e1b24]',
    usefulVocabulary: [
      { word: 'Magandang tanghali po', translation: 'Good afternoon (polite)', phonetic: 'Mah-gahn-DAHNG tahng-HAH-lee poh' },
      { word: 'Ulam', translation: 'Viand / Main dish', phonetic: 'OO-lahm' },
      { word: 'Pabili po', translation: 'May I buy please', phonetic: 'Pah-BEE-lee poh' },
      { word: 'Sabaw', translation: 'Soup / Broth', phonetic: 'Sah-BOW' },
    ],
    culturalEtiquetteTip: 'In Tagalog/Filipino, maintaining consistent use of "po" and "opo" conveys heartfelt respect to shopkeepers and elders.',
    initialNodeId: 'node_fil_cafe_1',
    nodes: {
      node_fil_cafe_1: {
        id: 'node_fil_cafe_1',
        speakerName: 'Aling Nena',
        speakerRole: 'Tindera',
        speakerAvatar: '🍲',
        dialogueText: 'Magandang tanghali po! Halika, mainit pa ang mga ulam natin. Ano po ang gusto ninyong orderin ngayon?',
        phonetics: 'Mah-gahn-dahng tahng-hah-lee poh! Hah-lee-kah...',
        translation: 'Good afternoon! Come, our dishes are still hot. What would you like to order today?',
        interactionType: 'choose_response',
        choices: [
          {
            id: 'fc1',
            text: 'Magandang tanghali po, Ate! Ano po ang espesyal ninyong ulam ngayon?',
            translation: 'Good afternoon, ma\'am! What is your specialty dish today?',
            isOptimal: true,
            nextNodeId: 'node_fil_cafe_2_optimal',
            feedbackNote: 'Respectful and courteous greeting with proper honorifics.'
          },
          {
            id: 'fc2',
            text: 'Gusto ko ng pagkain ngayon na.',
            translation: 'I want food right now.',
            isOptimal: false,
            nextNodeId: 'node_fil_cafe_2_optimal',
            feedbackNote: 'Too blunt. In Filipino culture, always preface with a polite greeting and "po".'
          }
        ]
      },

      node_fil_cafe_2_optimal: {
        id: 'node_fil_cafe_2_optimal',
        speakerName: 'Aling Nena',
        speakerRole: 'Tindera',
        speakerAvatar: '🍲',
        dialogueText: 'Mayroon po kaming bagong lutong Sinigang na Bangus at masarap na Inihaw na Liempo. Alin po ang pipiliin ninyo?',
        phonetics: 'May-roh-on poh kah-meeng bah-gong loo-tong see-nee-gahng...',
        translation: 'We have freshly cooked Bangus in sour broth and delicious grilled pork belly. Which one will you choose?',
        interactionType: 'complete_phrase',
        fillBlank: {
          prompt: 'Complete your order politely with the standard purchasing prefix:',
          missingWord: 'Pabili',
          options: ['Pabili', 'Takbo', 'Gising'],
          nextNodeId: 'node_fil_cafe_3_speak',
          explanation: '"Pabili po" is the standard respectful way to request food or items in stores.'
        }
      },

      node_fil_cafe_3_speak: {
        id: 'node_fil_cafe_3_speak',
        speakerName: 'Aling Nena',
        speakerRole: 'Tindera',
        speakerAvatar: '🍲',
        dialogueText: 'Sige po, ihahanda ko na po ang inyong plato. May iba pa po ba kayong kailangan?',
        phonetics: 'See-geh poh, ee-hah-hahn-dah koh nah poh...',
        translation: 'Alright, I will prepare your plate. Is there anything else you need?',
        interactionType: 'speak_response',
        speakingPrompt: {
          instruction: 'Speak out loud to ask for soup and water politely:',
          targetObjective: 'Politely ask for hot broth and a glass of water using "po"',
          referenceText: 'Pahingi na rin po ng mainit na sabaw at isang basong tubig, Ate.',
          phonetics: 'Pah-heeng-ee nah reen poh ng mah-ee-neet ngah sah-bow...',
          expectedKeyWords: ['pahingi', 'sabaw', 'tubig', 'po', 'ate'],
          politenessMarker: 'po / Ate',
          nextNodeId: 'node_fil_cafe_ending'
        }
      },

      node_fil_cafe_ending: {
        id: 'node_fil_cafe_ending',
        speakerName: 'Aling Nena',
        speakerRole: 'Tindera',
        speakerAvatar: '🍲',
        dialogueText: 'Ito na po ang inyong pagkain. Maraming salamat po sa pagbisita! Balik po kayo uli, ha?',
        phonetics: 'Ee-toh nah poh ang een-yong pahg-kah-een...',
        translation: 'Here is your food. Thank you very much for visiting! Please come again, okay?',
        interactionType: 'read_continue',
        isEnding: true,
        endingData: {
          outcomeTitle: 'Matagumpay na Pananghalian!',
          outcomeDescription: 'You completed your first dining conversation in Filipino with natural politeness.',
          objectivesAchieved: [
            'Used "po" and "Ate" in daytime greeting',
            'Ordered food accurately using "Pabili po"',
            'Spoke request for broth and drinking water',
            'Exchanged warm gratitude with local store owner'
          ],
          success: true,
          rewardXp: 50
        }
      }
    }
  },

  {
    id: 'fil_story_commute',
    category: 'travel_directions',
    title: 'Commuter Journey: Riding the Manila Jeepney',
    titleNative: 'Pagsakay ng Jeep sa Maynila',
    shortDescription: 'Ride an iconic Manila jeepney: pass your fare with "makikisuyo po", and call out "Para po sa tabi!".',
    situation: 'You are on Taft Avenue in Manila during afternoon rush hour. You need to board a jeepney heading to Ermita.',
    charactersInvolved: ['Kuya Tsuper (Jeepney Driver)', 'Ate May (Kasabay na Pasahero)', 'Ikaw (Pasahero)'],
    learnerRole: 'Commuter riding a public jeepney',
    communicationObjectives: [
      'Inquire whether the jeep passes your landmark',
      'Politely request fellow riders to pass your fare',
      'Call out your stop using the iconic "Para po sa tabi!"'
    ],
    difficulty: 'Beginner',
    estimatedMinutes: 4,
    xpReward: 45,
    gemsReward: 15,
    backdropTheme: 'Manila Jeepney Interior',
    backdropColor: 'from-blue-950 via-stone-900 to-[#0e1b24]',
    usefulVocabulary: [
      { word: 'Makikisuyo po', translation: 'May I ask a favor please', phonetic: 'Mah-kee-kee-SOO-yoh poh' },
      { word: 'Bayad', translation: 'Payment / Fare', phonetic: 'BAH-yad' },
      { word: 'Para po', translation: 'Stop here please', phonetic: 'PAH-rah poh' },
      { word: 'Sa tabi', translation: 'By the curb / roadside', phonetic: 'Sah TAH-bee' },
    ],
    culturalEtiquetteTip: 'In Metro Manila, "Para po sa tabi!" is the universal callout to stop the vehicle. Saying "Makikisuyo po ng bayad" is the highest courtesy when passing coins.',
    initialNodeId: 'node_fil_com_1',
    nodes: {
      node_fil_com_1: {
        id: 'node_fil_com_1',
        speakerName: 'Kuya Tsuper',
        speakerRole: 'Jeepney Driver',
        speakerAvatar: '🚙',
        dialogueText: 'Ermita! Lawton! Sakay na po kayo, kasya pa ang dalawa sa kanan!',
        phonetics: 'Ehr-mee-tah! Low-ton! Sah-kye nah poh kay-oh...',
        translation: 'Ermita! Lawton! Hop in please, two more can fit on the right!',
        interactionType: 'choose_response',
        choices: [
          {
            id: 'fcom1',
            text: 'Kuya, dadaan po ba ito sa tapat ng Robinson\'s?',
            translation: 'Driver, does this pass right in front of Robinson\'s?',
            isOptimal: true,
            nextNodeId: 'node_fil_com_2_pass',
            feedbackNote: 'Clear landmark verification with respectful honorific.'
          },
          {
            id: 'fcom2',
            text: 'Sasakay na lang ako kahit saan.',
            translation: 'I will just ride wherever.',
            isOptimal: false,
            nextNodeId: 'node_fil_com_2_pass',
            feedbackNote: 'Vague! Always confirm your destination.'
          }
        ]
      },

      node_fil_com_2_pass: {
        id: 'node_fil_com_2_pass',
        speakerName: 'Ate May',
        speakerRole: 'Kasabay na Pasahero',
        speakerAvatar: '👩',
        dialogueText: 'Kausapin mo lang ang katabi mo kung malayo ka sa drayber para maabot ang bayad.',
        phonetics: 'Kah-oo-sah-peen moh lahng ang kah-tah-bee moh...',
        translation: 'Just ask the person next to you if you are far from the driver so they can pass your fare.',
        interactionType: 'complete_phrase',
        fillBlank: {
          prompt: 'Complete the polite fare-passing request in Filipino:',
          missingWord: 'Makikisuyo',
          options: ['Makikisuyo', 'Magmadali', 'Umalis'],
          nextNodeId: 'node_fil_com_3_speak',
          explanation: '"Makikisuyo po" is the pinnacle of everyday courtesy in Filipino.'
        }
      },

      node_fil_com_3_speak: {
        id: 'node_fil_com_3_speak',
        speakerName: 'Kuya Tsuper',
        speakerRole: 'Jeepney Driver',
        speakerAvatar: '🚙',
        dialogueText: 'Natanggap ko po ang bayad sa Robinson\'s! Malapit na po tayo sa kanto, sino po ang bababa rito?',
        phonetics: 'Nah-tahng-gahp koh poh ang bah-yad... Mah-lah-peet nah poh...',
        translation: 'I received the fare for Robinson\'s! We are nearing the corner, who is alighting here?',
        interactionType: 'speak_response',
        speakingPrompt: {
          instruction: 'Speak out loud clearly to call out your stop:',
          targetObjective: 'Say "Para po sa tabi, Kuya!" clearly',
          referenceText: 'Para po sa tabi, Kuya! Bababa na po ako.',
          phonetics: 'PAH-rah poh sah TAH-bee, KOO-yah! Bah-bah-BAH nah poh ah-koh.',
          expectedKeyWords: ['para po', 'sa tabi', 'kuya', 'bababa'],
          politenessMarker: 'Para po / Kuya',
          nextNodeId: 'node_fil_com_ending'
        }
      },

      node_fil_com_ending: {
        id: 'node_fil_com_ending',
        speakerName: 'Kuya Tsuper',
        speakerRole: 'Jeepney Driver',
        speakerAvatar: '🚙',
        dialogueText: '(Huminto sa tabi) Sige po, dahan-dahan po sa pagbaba. Ingat po sa biyahe!',
        phonetics: 'See-geh poh, dah-hahn dah-hahn poh... Eeng-aht poh...',
        translation: '(Halts by the curb) Alright, alight slowly. Take care on your trip!',
        interactionType: 'read_continue',
        isEnding: true,
        endingData: {
          outcomeTitle: 'Matagumpay na Pagbiyahe sa Jeep!',
          outcomeDescription: 'You navigated Manila transit using authentic commuter expressions.',
          objectivesAchieved: [
            'Verified route with the driver using polite honorifics',
            'Requested fare passing using "Makikisuyo po"',
            'Spoke the iconic "Para po sa tabi!" stop command accurately'
          ],
          success: true,
          rewardXp: 45
        }
      }
    }
  }
];

// Helper functions for retrieval and progress
export const ADVENTURE_SCENARIOS_BY_LANGUAGE: Record<ScenarioLanguageId, AdventureScenario[]> = {
  cebuano: CEBUANO_ADVENTURE_SCENARIOS,
  filipino: FILIPINO_ADVENTURE_SCENARIOS,
  english: CEBUANO_ADVENTURE_SCENARIOS,
};

export function getScenariosForLanguage(lang: ScenarioLanguageId): AdventureScenario[] {
  return ADVENTURE_SCENARIOS_BY_LANGUAGE[lang] || CEBUANO_ADVENTURE_SCENARIOS;
}

export function getStoredScenarioProgress(lang: ScenarioLanguageId = 'cebuano'): ScenarioAdventureProgress {
  if (typeof window === 'undefined') return INITIAL_SCENARIO_PROGRESS[lang];
  try {
    const key = `sultiai_scenario_adventure_${lang}`;
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch {
    // fallback
  }
  return INITIAL_SCENARIO_PROGRESS[lang];
}

export function saveScenarioProgress(progress: ScenarioAdventureProgress): void {
  if (typeof window === 'undefined') return;
  try {
    const key = `sultiai_scenario_adventure_${progress.language}`;
    localStorage.setItem(key, JSON.stringify(progress));
  } catch {
    // fallback
  }
}
