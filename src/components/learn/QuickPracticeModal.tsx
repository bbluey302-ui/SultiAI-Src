import React, { useState, useEffect } from 'react';
import { 
  X, Mic, MessageSquare, Layers, BookOpen, Volume2, 
  Sparkles, Check, ArrowRight, RotateCcw, Bus, ShoppingBag, 
  UtensilsCrossed, Stethoscope, Search, Bookmark, Target, 
  BookMarked, Headphones, Edit3, BookOpenCheck, RefreshCw, 
  Globe2, RotateCw, Play, CheckCircle2, Award, Zap, Trophy,
  Star, HelpCircle, Flame, Compass, Send, Heart, Building2,
  MapPin, Store, School, ShieldCheck, Clock, CheckCheck
} from 'lucide-react';
import { ROLEPLAY_SCENARIOS } from '../../data/curriculumData';
import { TOOLKIT_MODULES, ToolkitModule } from '../../data/toolkitModulesData';
import { MODULE_GAMIFICATION_MATRIX, ModuleGamificationSpec } from '../../data/moduleGamificationMatrix';
import { speakBisaya } from '../../utils/audio';
import { sounds } from '../../utils/soundEffects';
import { SpeakingCityModal } from '../voice/SpeakingCityModal';
import { ScenarioAdventureModal } from '../scenarios/ScenarioAdventureModal';
import confetti from 'canvas-confetti';

interface QuickPracticeModalProps {
  isOpen: boolean;
  tool: string | null;
  onClose: () => void;
  onOpenSulti?: (prompt?: string) => void;
}

// ---------------------------------------------------------------------------
// 1. DATASETS FOR THE 13 DISTINCT EXPERIENCES
// ---------------------------------------------------------------------------

// 1. VOICE PRACTICE: The Speaking City Locations & Missions
const SPEAKING_CITY_LOCATIONS = {
  cebuano: [
    {
      id: 'loc_carenderia',
      name: 'Carenderia sa Eskina',
      district: 'Downtown Carbon Market',
      icon: '🍲',
      missionTitle: 'Order Sugba & Extra Rice',
      targetPhrase: 'Nang, palihog ko og usa ka sugba nga isda ug duha ka kan-on.',
      englishTranslation: 'Ma\'am, please give me one grilled fish and two servings of rice.',
      companionPrompt: 'Maayong udto! Unsay imong ganahan kan-on karon?',
      xp: 45,
    },
    {
      id: 'loc_terminal',
      name: 'Jeepney Terminal',
      district: 'Colon - SM City Route',
      icon: '🚙',
      missionTitle: 'Pass Fare & Request Stop',
      targetPhrase: 'Palihog ko sa plete, Nong. Lugar lang sa kanto unya.',
      englishTranslation: 'Please pass my fare, driver. Stop right by the street corner.',
      companionPrompt: 'Plete palihog! Asa man ka dapit monaog?',
      xp: 40,
    },
    {
      id: 'loc_market',
      name: 'Tabo Wet Market',
      district: 'Bankerohan Fruits Section',
      icon: '🛒',
      missionTitle: 'Friendly Mango Bargaining',
      targetPhrase: 'Tagpila ang kilo sa mangga, Nang? Puyde hangyo og gamay?',
      englishTranslation: 'How much is a kilo of mangoes, ma\'am? May I ask for a small discount?',
      companionPrompt: 'Presko kaayo ning mangga gikan sa Davao! Pila ka kilo imong kuhaon?',
      xp: 50,
    },
    {
      id: 'loc_barangay',
      name: 'Barangay Hall / Plaza',
      district: 'Community Center',
      icon: '🏛️',
      missionTitle: 'Ask for Directions to Health Center',
      targetPhrase: 'Maayong adlaw, sir. Asa dapit ang duol nga klinika dinhi?',
      englishTranslation: 'Good day, sir. Where is the nearest clinic located around here?',
      companionPrompt: 'Maayong adlaw sab! Naa ra sa tabok sa plasa ang klinika.',
      xp: 35,
    },
  ],
  filipino: [
    {
      id: 'loc_carenderia',
      name: 'Karinderya sa Kanto',
      district: 'Quiapo Food Street',
      icon: '🍲',
      missionTitle: 'Order Inihaw & Kanin',
      targetPhrase: 'Ate, pabili po ng isang inihaw na bangus at dalawang kanin.',
      englishTranslation: 'Ma\'am, please give me one grilled milkfish and two servings of rice.',
      companionPrompt: 'Magandang tanghali po! Ano po ang order ninyo ngayon?',
      xp: 45,
    },
    {
      id: 'loc_terminal',
      name: 'Jeepney Terminal',
      district: 'Espana - Taft Route',
      icon: '🚙',
      missionTitle: 'Pass Fare & Request Stop',
      targetPhrase: 'Makikisuyo po ng bayad, Kuya. Para po sa tabi.',
      englishTranslation: 'Please pass my fare, driver. Stop right by the curb.',
      companionPrompt: 'Bayad po! Saan po kayo banda bababa?',
      xp: 40,
    },
    {
      id: 'loc_market',
      name: 'Pamilihan ng Nayon',
      district: 'Balintawak Fruits Section',
      icon: '🛒',
      missionTitle: 'Friendly Mango Bargaining',
      targetPhrase: 'Magkano po ang kilo ng mangga, Ate? Pwede po bang tumawad?',
      englishTranslation: 'How much is a kilo of mangoes, ma\'am? May I ask for a small discount?',
      companionPrompt: 'Sariwang-sariwa po ito mula Guimaras! Ilang kilo po?',
      xp: 50,
    },
    {
      id: 'loc_barangay',
      name: 'Barangay Hall / Plaza',
      district: 'Sentro ng Komunidad',
      icon: '🏛️',
      missionTitle: 'Ask for Directions to Health Center',
      targetPhrase: 'Magandang araw po, sir. Saan po banda ang pinakamalapit na klinika?',
      englishTranslation: 'Good day, sir. Where is the nearest clinic around here?',
      companionPrompt: 'Magandang araw din po! Doon po sa tapat ng plasa ang klinika.',
      xp: 35,
    },
  ],
  english: [
    {
      id: 'loc_carenderia',
      name: 'Local Diner & Café',
      district: 'City Center Eatery',
      icon: '🍲',
      missionTitle: 'Order Lunch & Side Dish',
      targetPhrase: 'Excuse me, could I please get one grilled fish and a side of rice?',
      englishTranslation: 'Clear polite dining order.',
      companionPrompt: 'Good afternoon! What would you like to have today?',
      xp: 45,
    },
    {
      id: 'loc_terminal',
      name: 'Bus & Transit Terminal',
      district: 'Metro Commuter Stop',
      icon: '🚙',
      missionTitle: 'Pass Fare & Request Stop',
      targetPhrase: 'Could you please pass my fare forward? Pull over at the next corner, please.',
      englishTranslation: 'Transit etiquette request.',
      companionPrompt: 'Passing your fare forward! Where are you alighting?',
      xp: 40,
    },
    {
      id: 'loc_market',
      name: 'Farmer\'s Market',
      district: 'Fresh Produce Stalls',
      icon: '🛒',
      missionTitle: 'Inquire About Produce',
      targetPhrase: 'How much are the fresh mangoes per kilo? Is there a bundle discount?',
      englishTranslation: 'Produce unit pricing inquiry.',
      companionPrompt: 'These mangoes arrived fresh this morning! How many kilos would you like?',
      xp: 50,
    },
    {
      id: 'loc_barangay',
      name: 'Information Center',
      district: 'Civic Plaza',
      icon: '🏛️',
      missionTitle: 'Ask for Community Directions',
      targetPhrase: 'Hello, could you point me to the nearest medical clinic, please?',
      englishTranslation: 'Polite community orientation inquiry.',
      companionPrompt: 'Hello there! It is located right across from the town square.',
      xp: 35,
    },
  ],
};

// 4. FLASHCARDS: Spaced Repetition Flashcards
const FLASHCARDS_BY_CATEGORY = {
  cebuano: [
    { id: 'fc_ceb_1', native: 'Palihog ko sa plete, Nong.', english: 'Please pass my fare, driver.', context: 'Jeepney Commuting', box: 1, phonetics: 'Pah-LEE-hog koh sah PLEH-teh, NONG.' },
    { id: 'fc_ceb_2', native: 'Tagpila man ni, Nang?', english: 'How much is this, ma\'am?', context: 'Market Bargaining', box: 2, phonetics: 'Tag-PEE-lah mahn nee, NAHNG?' },
    { id: 'fc_ceb_3', native: 'Puyde hangyo gamay?', english: 'Can I ask for a small discount?', context: 'Palengke Etiquette', box: 1, phonetics: 'POOY-deh HAHNG-yoh GAH-my?' },
    { id: 'fc_ceb_4', native: 'Lugar lang, Nong!', english: 'Stop here, driver!', context: 'Pulling Over', box: 3, phonetics: 'LOO-gahr lahng, NONG!' },
    { id: 'fc_ceb_5', native: 'Bitaw no? Lami gyud!', english: 'I know right? Truly delicious!', context: 'Conversational Agreement', box: 2, phonetics: 'BEE-taw noh? LAH-mee gyood!' },
  ],
  filipino: [
    { id: 'fc_fil_1', native: 'Makikisuyo po ng bayad, Kuya.', english: 'Please pass my fare, driver.', context: 'Jeepney Commuting', box: 1, phonetics: 'Mah-kee-kee-SOO-yoh poh ng BAH-yad, KOO-yah.' },
    { id: 'fc_fil_2', native: 'Magkano po ito, Ate?', english: 'How much is this, ma\'am?', context: 'Market Bargaining', box: 2, phonetics: 'Mag-KAH-noh poh ee-TOH, AH-teh?' },
    { id: 'fc_fil_3', native: 'Pwede po bang tumawad?', english: 'Can I ask for a small discount?', context: 'Palengke Etiquette', box: 1, phonetics: 'PWEH-deh poh bahng too-MAH-wad?' },
    { id: 'fc_fil_4', native: 'Para po sa tabi!', english: 'Stop here by the curb, driver!', context: 'Pulling Over', box: 3, phonetics: 'PAH-rah poh sah TAH-bee!' },
    { id: 'fc_fil_5', native: 'Talaga po? Ang sarap naman!', english: 'Really? That is truly delicious!', context: 'Conversational Agreement', box: 2, phonetics: 'Tah-lah-GAH poh? Ahng sah-RAP nah-MAN!' },
  ],
  english: [
    { id: 'fc_eng_1', native: 'Could you please point me in the right direction?', english: 'Asking for directions politely.', context: 'Transit & Navigation', box: 1, phonetics: 'KOOD yoo pleez POYNT mee in thuh RYT duh-REK-shun?' },
    { id: 'fc_eng_2', native: 'How much does this cost including taxes?', english: 'Inquiring about total price.', context: 'Market & Shopping', box: 2, phonetics: 'HOW much duz this KOST in-KLOO-ding TAKS-iz?' },
    { id: 'fc_eng_3', native: 'Is there any chance of getting a discount?', english: 'Requesting a courtesy discount.', context: 'Bargaining & Discounts', box: 1, phonetics: 'iz thair EN-ee chans uv GET-ing uh DIS-kownt?' },
    { id: 'fc_eng_4', native: 'Please pull over right here by the curb.', english: 'Instructing driver to halt.', context: 'Ride & Taxi Stop', box: 3, phonetics: 'PLEEZ pool OH-ver RYT heer by thuh KURB.' },
    { id: 'fc_eng_5', native: 'I completely agree with you on that point!', english: 'Expressing strong alignment.', context: 'Conversational Agreement', box: 2, phonetics: 'eye kum-PLEET-lee uh-GREE with yoo on that POYNT!' },
  ],
};

// 3. PHRASEBOOK: The Pin Collection & Category Stamps
const PHRASES_BY_CATEGORY = {
  cebuano: [
    { id: 'ph_1', native: 'Lugar lang, Nong!', english: 'Stop here, driver!', category: 'Jeepney', note: 'Polite way to ask driver to pull over in Bisaya', pinned: true },
    { id: 'ph_2', native: 'Palihog ko sa plete, Nong.', english: 'Please pass my fare, sir.', category: 'Jeepney', note: 'Pass fare politely along passengers', pinned: true },
    { id: 'ph_3', native: 'Naa bay sukli ang singkwenta?', english: 'Is there change for 50 pesos?', category: 'Jeepney', note: 'Ask beforehand for larger bills', pinned: false },
    { id: 'ph_4', native: 'Tagpila ang kilo sa mangga?', english: 'How much is a kilo of mangoes?', category: 'Market', note: 'Ask price per unit', pinned: true },
    { id: 'ph_5', native: 'Puyde hangyo, Nang?', english: 'May I request a discount, ma\'am?', category: 'Market', note: 'Friendly discount request', pinned: false },
    { id: 'ph_6', native: 'Pila tanan among nabayran?', english: 'How much is our bill in total?', category: 'Dining', note: 'Settling carenderia bill', pinned: true },
    { id: 'ph_7', native: 'Asa dapit ang parmasya?', english: 'Where is the pharmacy located?', category: 'Directions', note: 'Inquiring for landmarks', pinned: false },
    { id: 'ph_8', native: 'Salamat kaayo, amping!', english: 'Thank you very much, take care!', category: 'Etiquette', note: 'Heartfelt Visayan gratitude', pinned: true },
  ],
  filipino: [
    { id: 'ph_1', native: 'Para po sa tabi!', english: 'Stop here by the curb, driver!', category: 'Jeepney', note: 'Universal Metro Manila jeepney stop call', pinned: true },
    { id: 'ph_2', native: 'Makikisuyo po ng bayad, Kuya.', english: 'Please pass my fare, driver.', category: 'Jeepney', note: 'Polite honorific when passing coins', pinned: true },
    { id: 'ph_3', native: 'May panukli po ba sa singkwenta?', english: 'Is there change for 50 pesos?', category: 'Jeepney', note: 'Ask driver before paying big bills', pinned: false },
    { id: 'ph_4', native: 'Magkano po ang kilo ng mangga?', english: 'How much is a kilo of mangoes?', category: 'Market', note: 'Standard price inquiry', pinned: true },
    { id: 'ph_5', native: 'Pwede po bang tumawad, Ate?', english: 'May I ask for a small discount, ma\'am?', category: 'Market', note: 'Friendly market bargaining', pinned: false },
    { id: 'ph_6', native: 'Magkano po lahat ang babayaran?', english: 'How much is our total bill?', category: 'Dining', note: 'Settling restaurant bill', pinned: true },
    { id: 'ph_7', native: 'Saan po banda ang botika?', english: 'Where is the pharmacy located?', category: 'Directions', note: 'Inquiring for nearby drugstore', pinned: false },
    { id: 'ph_8', native: 'Maraming salamat po, ingat!', english: 'Thank you very much, take care!', category: 'Etiquette', note: 'Respectful Tagalog expression', pinned: true },
  ],
  english: [
    { id: 'ph_1', native: 'Please pull over right by the sidewalk.', english: 'Stop here, driver!', category: 'Transit', note: 'Polite way to ask driver or cab to pull over', pinned: true },
    { id: 'ph_2', native: 'Could you please pass my fare forward?', english: 'Please pass my payment.', category: 'Transit', note: 'Commuter etiquette when seated far from conductor', pinned: true },
    { id: 'ph_3', native: 'Do you have change for a hundred-dollar bill?', english: 'Change inquiry.', category: 'Transit', note: 'Ask beforehand for larger denominations', pinned: false },
    { id: 'ph_4', native: 'What is the price per kilogram for fresh fruit?', english: 'Produce pricing inquiry.', category: 'Market', note: 'Standard unit pricing question', pinned: true },
    { id: 'ph_5', native: 'Would you be open to offering a slight discount?', english: 'Polite bargaining.', category: 'Market', note: 'Courteous discount inquiry', pinned: false },
    { id: 'ph_6', native: 'Could we please get the itemized bill?', english: 'Settling meal total.', category: 'Dining', note: 'Requesting check after dining', pinned: true },
    { id: 'ph_7', native: 'Excuse me, where can I find the nearest pharmacy?', english: 'Direction inquiry.', category: 'Directions', note: 'Locating essential medical services', pinned: false },
    { id: 'ph_8', native: 'Thank you very much, take good care!', english: 'Warm departing gratitude.', category: 'Etiquette', note: 'Universal friendly farewell', pinned: true },
  ],
};

// 5. PRONUNCIATION LAB: The Sound Spectrum & Acoustic Drills
const PRONUNCIATION_DRILLS = {
  cebuano: [
    {
      word: 'Maayong buntag',
      phonetics: 'Mah-AH-yong BOON-tag',
      glottalBreakdown: ['Mah (clean open /a/)', 'a-yong (gentle hiatal glottal)', 'BOON-tag (soft final /g/)'],
      focusNote: 'Visayan /a/ is open and bright; distinct from Tagalog schwa tendencies.',
      difficulty: 'Beginner',
    },
    {
      word: 'Palihog',
      phonetics: 'Pah-LEE-hog',
      glottalBreakdown: ['Pah (unstressed)', 'LEE (primary syllable stress)', 'hog (voiced glottal aspiration)'],
      focusNote: 'Stress is firmly on the penultimate syllable "li".',
      difficulty: 'Intermediate',
    },
    {
      word: 'Salamat kaayo',
      phonetics: 'Sah-LAH-mat kah-AH-yoh',
      glottalBreakdown: ['Sah-LAH-mat (clear dental /t/)', 'kah-AH-yoh (hiatus between /a/ and /a/)'],
      focusNote: 'Pronounce both "a" vowels in "kaayo" with a brief glottal separation.',
      difficulty: 'Advanced',
    },
  ],
  filipino: [
    {
      word: 'Magandang umaga',
      phonetics: 'Mah-gahn-DAHNG oo-MAH-gah',
      glottalBreakdown: ['Mah-gahn-DAHNG (nasal /ng/)', 'oo-MAH-gah (penultimate stress on "MAH")'],
      focusNote: 'The ligature "-ng" smoothly connects "maganda" to "umaga".',
      difficulty: 'Beginner',
    },
    {
      word: 'Makikisuyo po',
      phonetics: 'Mah-kee-kee-SOO-yoh poh',
      glottalBreakdown: ['Mah-kee-kee (reduplication precision)', 'SOO-yoh (open /o/)', 'poh (respectful particle)'],
      focusNote: 'Keep reduplicated "kee-kee" syllables equally metered.',
      difficulty: 'Intermediate',
    },
    {
      word: 'Maraming salamat',
      phonetics: 'Mah-RAH-meeng sah-LAH-mat',
      glottalBreakdown: ['Mah-RAH-meeng (tapped alveolar /r/)', 'sah-LAH-mat (soft final dental /t/)'],
      focusNote: 'Lightly tap the tongue on the alveolar ridge for "r".',
      difficulty: 'Intermediate',
    },
  ],
  english: [
    {
      word: 'Good morning',
      phonetics: 'Good MOR-ning',
      glottalBreakdown: ['Good (lax vowel /ʊ/)', 'MOR-ning (rhotic coloring)'],
      focusNote: 'Natural rising-falling greeting intonation contour.',
      difficulty: 'Beginner',
    },
    {
      word: 'Could you please',
      phonetics: 'Kood yoo pleez',
      glottalBreakdown: ['Kood (silent \'l\')', 'yoo (smooth palatal glide)', 'pleez (voiced alveolar /z/)'],
      focusNote: 'Connect words smoothly in connected speech.',
      difficulty: 'Intermediate',
    },
    {
      word: 'Thank you very much',
      phonetics: 'Thank yoo VEH-ree much',
      glottalBreakdown: ['Thank (voiceless dental /θ/)', 'VEH-ree (labiodental /v/)', 'much (affricate /tʃ/)'],
      focusNote: 'Carefully articulate the "th" dental fricative.',
      difficulty: 'Intermediate',
    },
  ],
};

// 7. VOCABULARY NOTEBOOK: The Thematic Word Vaults
const THEMATIC_WORD_VAULTS = {
  cebuano: [
    {
      theme: '🍲 Carenderia & Dining',
      words: [
        { native: 'Sugba', english: 'Grilled / Barbecue', stars: 3, note: 'Common for fish and pork in Cebu and Davao' },
        { native: 'Tula / Tuwa', english: 'Fish broth soup', stars: 2, note: 'Fresh clear sour soup with ginger and lemongrass' },
        { native: 'Kinilaw', english: 'Visayan ceviche', stars: 3, note: 'Raw fish cured in native vinegar and calamansi' },
        { native: 'Pusô', english: 'Hanging rice', stars: 3, note: 'Rice cooked in woven diamond coconut palm pouches' },
      ],
    },
    {
      theme: '🚙 Jeepney & Transit',
      words: [
        { native: 'Plete', english: 'Fare', stars: 3, note: 'The coin payment passed up to the driver' },
        { native: 'Lugar', english: 'Stop / Pull over', stars: 3, note: 'Call out when approaching your drop-off point' },
        { native: 'Sukli', english: 'Monetary change', stars: 2, note: 'Always check your change when paying bigger bills' },
        { native: 'Irog', english: 'Move / Scoot over', stars: 2, note: 'Used when passengers scoot down the bench' },
      ],
    },
    {
      theme: '🤝 Social & Respect',
      words: [
        { native: 'Palihog', english: 'Please', stars: 3, note: 'Essential politeness marker in daily requests' },
        { native: 'Salamat', english: 'Thank you', stars: 3, note: 'Heartfelt gratitude' },
        { native: 'Amping', english: 'Take care / Be safe', stars: 3, note: 'Warm Visayan parting blessing' },
        { native: 'Puhon', english: 'God willing / Soon', stars: 2, note: 'Expressing optimistic future hope' },
      ],
    },
  ],
  filipino: [
    {
      theme: '🍲 Karinderya & Pagkain',
      words: [
        { native: 'Inihaw', english: 'Grilled', stars: 3, note: 'Charcoal grilled fish, pork or chicken' },
        { native: 'Sinigang', english: 'Sour tamarind soup', stars: 3, note: 'Iconic Filipino savory broth' },
        { native: 'Kilawin', english: 'Raw seafood dish', stars: 2, note: 'Vinegar-cured seafood delicacy' },
        { native: 'Kanin', english: 'Cooked rice', stars: 3, note: 'The staple food of every Filipino meal' },
      ],
    },
    {
      theme: '🚙 Biyahe & Transportasyon',
      words: [
        { native: 'Bayad', english: 'Payment / Fare', stars: 3, note: 'The transportation fee passed to driver' },
        { native: 'Para', english: 'Stop / Pull over', stars: 3, note: 'Call to driver when arriving at destination' },
        { native: 'Panukli', english: 'Change', stars: 2, note: 'Remaining change from larger denomination' },
        { native: 'Usog', english: 'Scoot over', stars: 2, note: 'Making room for waiting commuters' },
      ],
    },
    {
      theme: '🤝 Magalang na Pakikipagkapwa',
      words: [
        { native: 'Paki / Pakisuyo', english: 'Please', stars: 3, note: 'Respectful prefix for favors and requests' },
        { native: 'Salamat', english: 'Thank you', stars: 3, note: 'Universal Tagalog expression of gratitude' },
        { native: 'Ingat', english: 'Take care', stars: 3, note: 'Friendly affectionate farewell' },
        { native: 'Bayanihan', english: 'Community spirit', stars: 3, note: 'Communal unity and mutual assistance' },
      ],
    },
  ],
  english: [
    {
      theme: '🍲 Dining & Eatery',
      words: [
        { native: 'Grilled', english: 'Cooked over direct flame', stars: 3, note: 'Charcoal barbecue specialty' },
        { native: 'Broth', english: 'Savory clear soup', stars: 2, note: 'Simmered meat and vegetable stock' },
        { native: 'Ceviche', english: 'Acid-cured fresh seafood', stars: 2, note: 'Seafood marinated in citrus or vinegar' },
        { native: 'Steamed Rice', english: 'Staple grain', stars: 3, note: 'Everyday foundation of meals' },
      ],
    },
    {
      theme: '🚙 Transit & Commute',
      words: [
        { native: 'Fare', english: 'Ticket / Transit payment', stars: 3, note: 'Commuter fee' },
        { native: 'Pull Over', english: 'Halt vehicle at curb', stars: 3, note: 'Calling stop for disembarkation' },
        { native: 'Change', english: 'Returned currency', stars: 2, note: 'Balance returned from banknote' },
        { native: 'Step aside', english: 'Clear the aisle', stars: 2, note: 'Making space for incoming passengers' },
      ],
    },
    {
      theme: '🤝 Courtesy & Rapport',
      words: [
        { native: 'Please', english: 'Polite request marker', stars: 3, note: 'Essential everyday courtesy' },
        { native: 'Thank you', english: 'Expression of gratitude', stars: 3, note: 'Universal friendly appreciation' },
        { native: 'Take care', english: 'Warm departing wish', stars: 3, note: 'Friendly goodbye' },
        { native: 'Hospitality', english: 'Warm welcoming manner', stars: 3, note: 'Generous reception of visitors' },
      ],
    },
  ],
};

// 6. GRAMMAR LAB: Sentence Assembly Puzzles
const GRAMMAR_PUZZLES = {
  cebuano: [
    {
      id: 'g1',
      prompt: 'Construct the sentence: "I will eat bread."',
      targetText: 'Mokaon ko og tinapay',
      tokens: ['Mokaon', 'ko', 'og', 'tinapay', 'si', 'sa', 'ang'],
      ruleNote: 'Actor focus trigger: prefix "mo-" with pronoun "ko", followed by non-topic object marker "og".',
    },
    {
      id: 'g2',
      prompt: 'Construct the sentence: "The mango was eaten by Maria."',
      targetText: 'Gikaon ni Maria ang mangga',
      tokens: ['Gikaon', 'ni', 'Maria', 'ang', 'mangga', 'og', 'si'],
      ruleNote: 'Goal focus: infix "-i-" / prefix "gi-" marks completed action on the topic "ang mangga". Actor takes "ni".',
    },
  ],
  filipino: [
    {
      id: 'g1',
      prompt: 'Construct the sentence: "I will eat bread."',
      targetText: 'Kakain ako ng tinapay',
      tokens: ['Kakain', 'ako', 'ng', 'tinapay', 'sa', 'ang', 'kay'],
      ruleNote: 'Actor focus: reduplication "ka-kain" + topic pronoun "ako" + direct object marker "ng".',
    },
    {
      id: 'g2',
      prompt: 'Construct the sentence: "The mango was eaten by Maria."',
      targetText: 'Kinain ni Maria ang mangga',
      tokens: ['Kinain', 'ni', 'Maria', 'ang', 'mangga', 'ng', 'si'],
      ruleNote: 'Object focus: infix "-in-" marks completed aspect. Topic is "ang mangga", actor is marked by "ni".',
    },
  ],
  english: [
    {
      id: 'g1',
      prompt: 'Construct the sentence: "I will eat bread."',
      targetText: 'I will eat bread',
      tokens: ['I', 'will', 'eat', 'bread', 'eating', 'ate', 'to'],
      ruleNote: 'Subject-Verb-Object word order with auxiliary modal "will" for future tense.',
    },
    {
      id: 'g2',
      prompt: 'Construct the sentence: "The mango was eaten by Maria."',
      targetText: 'The mango was eaten by Maria',
      tokens: ['The', 'mango', 'was', 'eaten', 'by', 'Maria', 'eats'],
      ruleNote: 'Passive voice transformation: Patient subject + auxiliary "was" + past participle "eaten" + agent preposition "by".',
    },
  ],
};

// 8. LISTENING LAB: Audio Detective Comprehension
const LISTENING_CHALLENGES = {
  cebuano: [
    {
      id: 'l1',
      speaker: 'Manong Temyong (Jeepney Driver in Davao)',
      audioPhrase: 'Bay, palihog ko i-irog gamay para maigo ang tulo.',
      englishMeaning: 'Buddy, please move over a bit so three people can fit.',
      question: 'What is the driver asking the passengers to do?',
      options: ['Pay their fare', 'Scoot over to make room for 3 passengers', 'Get off the jeepney', 'Hand him the change'],
      correctAnswer: 1,
      accentNote: 'Urban Davao Bisaya cadence with friendly contraction "bay" (abbreviation of "bayani / abay").',
    },
  ],
  filipino: [
    {
      id: 'l1',
      speaker: 'Kuya Boy (Jeepney Driver in Quiapo)',
      audioPhrase: 'Kasya pa ang dalawa sa kanan, usog-usog lang po nang kaunti.',
      englishMeaning: 'Two more can fit on the right side, just scoot over a bit please.',
      question: 'What is the driver asking the passengers to do?',
      options: ['Pay their fare', 'Scoot over to fit 2 more people', 'Stop the jeepney', 'Hold on tightly'],
      correctAnswer: 1,
      accentNote: 'Metro Manila colloquial cadence with courteous marker "po" and reduplication "usog-usog".',
    },
  ],
  english: [
    {
      id: 'l1',
      speaker: 'City Bus Operator',
      audioPhrase: 'Please step towards the rear to clear room for boarding commuters.',
      englishMeaning: 'Move back so other riders can enter.',
      question: 'What is the operator asking passengers to do?',
      options: ['Pay fare', 'Step towards the rear to make space', 'Exit the vehicle', 'Remain seated'],
      correctAnswer: 1,
      accentNote: 'Clear public transit directive.',
    },
  ],
};

// 11. SULTI SWITCH: Rapid Reflex Drills
const SULTI_SWITCH_ITEMS = {
  cebuano: [
    { prompt: 'Translate instantly: "Where are you going?"', target: 'Asa ka padulong?', timeLimit: 15 },
    { prompt: 'Translate instantly: "Thank you so much!"', target: 'Salamat kaayo!', timeLimit: 12 },
    { prompt: 'Translate instantly: "It is delicious!"', target: 'Lami kaayo!', timeLimit: 10 },
  ],
  filipino: [
    { prompt: 'Translate instantly: "Where are you going?"', target: 'Saan ka pupunta?', timeLimit: 15 },
    { prompt: 'Translate instantly: "Thank you so much!"', target: 'Maraming salamat po!', timeLimit: 12 },
    { prompt: 'Translate instantly: "It is delicious!"', target: 'Masarap talaga!', timeLimit: 10 },
  ],
  english: [
    { prompt: 'Translate into English: "Asa ka padulong?" / "Saan ka pupunta?"', target: 'Where are you going?', timeLimit: 15 },
    { prompt: 'Translate into English: "Salamat kaayo!" / "Maraming salamat po!"', target: 'Thank you very much!', timeLimit: 12 },
    { prompt: 'Translate into English: "Lami kaayo!" / "Masarap talaga!"', target: 'It is very delicious!', timeLimit: 10 },
  ],
};

// 12. CULTURE NOTES: Passport Lore & Dilemmas
const CULTURE_LORE = {
  cebuano: [
    {
      title: 'The Art of "Hangyo" & Respectful Bargaining',
      region: 'Visayas & Northern Mindanao',
      loreText: 'In Visayan wet markets (tabo/palengke), asking for "hangyo" (discount) is not seen as cheapness; it is an interpersonal icebreaker that acknowledges the vendor as a human being rather than an automated transaction. Always start with a friendly greeting like "Maayong adlaw, Nang!" before asking "Puyde hangyo gamay?".',
      quizQuestion: 'Why is "hangyo" culturally valued in Visayan public markets?',
      options: ['It proves you have no money', 'It is an interpersonal rapport builder with the vendor', 'It is mandatory by local law', 'It replaces paying the base price'],
      correctIndex: 1,
    },
  ],
  filipino: [
    {
      title: 'Tawad & the Concept of "Suki"',
      region: 'Metro Manila & Luzon',
      loreText: 'In Filipino culture, "tawad" leads to becoming a "suki" (favored patron). When you become a vendor\'s suki, you receive extra portions ("dagdag") or discounts naturally as a token of mutual community loyalty.',
      quizQuestion: 'What relationship is forged when a customer and vendor establish mutual loyalty?',
      options: ['Barangay captain', 'Suki relationship', 'Kaklase', 'Kumpare'],
      correctIndex: 1,
    },
  ],
  english: [
    {
      title: 'Philippine Market Etiquette for Foreigners',
      region: 'Philippines Nationwide',
      loreText: 'When visiting traditional public markets, smiling, greeting elderly vendors with respectful honorifics ("Kuya", "Ate", "Manong", "Manang"), and using basic local phrases creates warm social connections that money alone cannot buy.',
      quizQuestion: 'What creates the warmest social connection in Philippine community spaces?',
      options: ['Strict silent efficiency', 'Respectful honorifics and local language greetings', 'Demanding manager assistance', 'Walking away quickly'],
      correctIndex: 1,
    },
  ],
};

export const QuickPracticeModal: React.FC<QuickPracticeModalProps> = ({
  isOpen,
  tool,
  onClose,
  onOpenSulti,
}) => {
  // Category switcher: 'cebuano' | 'filipino' | 'english'
  const [selectedCategory, setSelectedCategory] = useState<'cebuano' | 'filipino' | 'english'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sultiai_selected_language');
      if (saved === 'filipino' || saved === 'english' || saved === 'cebuano') {
        return saved;
      }
    }
    return 'cebuano';
  });

  // Keep category in sync with active journey selection when opened
  useEffect(() => {
    if (isOpen && typeof window !== 'undefined') {
      const saved = localStorage.getItem('sultiai_selected_language');
      if (saved === 'filipino' || saved === 'english' || saved === 'cebuano') {
        setSelectedCategory(saved);
      }
    }
  }, [isOpen]);

  // Audio playing indicator
  const [playingPhrase, setPlayingPhrase] = useState<string | null>(null);

  // Gamification rewards & streak
  const [xpEarned, setXpEarned] = useState(0);

  // 1. VOICE PRACTICE: Speaking City state
  const [showSpeakingCityFull, setShowSpeakingCityFull] = useState(false);
  const [showScenarioAdventureFull, setShowScenarioAdventureFull] = useState(false);
  const [selectedCityLocation, setSelectedCityLocation] = useState(0);
  const [voiceMicActive, setVoiceMicActive] = useState(false);
  const [voiceMissionSuccess, setVoiceMissionSuccess] = useState(false);
  const [voiceSpeechFeedback, setVoiceSpeechFeedback] = useState<string | null>(null);

  // 3. PHRASEBOOK: Search & Pin state
  const [searchPhrase, setSearchPhrase] = useState('');
  const [pinnedPhrases, setPinnedPhrases] = useState<string[]>(['ph_1', 'ph_2', 'ph_4', 'ph_6', 'ph_8']);
  const [selectedPhraseCategory, setSelectedPhraseCategory] = useState<string>('All');

  // 4. FLASHCARDS: Spaced Repetition state
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [cardMasteryBox, setCardMasteryBox] = useState<{ [cardId: string]: number }>({});
  const [flashcardStreak, setFlashcardStreak] = useState(4);

  // 5. PRONUNCIATION LAB: Acoustic Concordance state
  const [selectedDrillIndex, setSelectedDrillIndex] = useState(0);
  const [pronounceMicActive, setPronounceMicActive] = useState(false);
  const [phoneticAnalysis, setPhoneticAnalysis] = useState<string | null>(null);

  // 6. GRAMMAR LAB: Sentence Assembly state
  const [puzzleTokens, setPuzzleTokens] = useState<string[]>([]);
  const [assembledTokens, setAssembledTokens] = useState<string[]>([]);
  const [puzzleAnswered, setPuzzleAnswered] = useState<boolean | null>(null);

  // 7. VOCABULARY NOTEBOOK: Word Vault state
  const [selectedVaultTheme, setSelectedVaultTheme] = useState(0);
  const [masteredWords, setMasteredWords] = useState<string[]>(['Sugba', 'Plete', 'Palihog', 'Inihaw', 'Bayad', 'Paki']);

  // 8. LISTENING LAB: Audio Detective state
  const [listeningSelectedOption, setListeningSelectedOption] = useState<number | null>(null);
  const [listeningRevealed, setListeningRevealed] = useState(false);
  const [audioSpeedSlow, setAudioSpeedSlow] = useState(false);

  // 9. WRITING: Scribe Quests state
  const [writtenInput, setWrittenInput] = useState('');
  const [writingFeedback, setWritingFeedback] = useState<string | null>(null);

  // 10. READING: Interactive Storybook state
  const [readingAnswered, setReadingAnswered] = useState<boolean | null>(null);
  const [activeStoryGlossaryWord, setActiveStoryGlossaryWord] = useState<string | null>(null);

  // 11. SULTI SWITCH: Reflex Speed state
  const [switchIndex, setSwitchIndex] = useState(0);
  const [switchInput, setSwitchInput] = useState('');
  const [switchFeedback, setSwitchFeedback] = useState<string | null>(null);
  const [switchCombo, setSwitchCombo] = useState(3);

  // 12. CULTURE NOTES: Passport state
  const [cultureQuizSelection, setCultureQuizSelection] = useState<number | null>(null);
  const [passportStamped, setPassportStamped] = useState(false);

  // 13. REVIEW CENTER: Boss / Mistake Clean-up state
  const [reviewLives, setReviewLives] = useState(3);
  const [clearedMistakes, setClearedMistakes] = useState<string[]>([]);

  // Initialize grammar puzzle when tool is grammar
  useEffect(() => {
    if (tool === 'grammar') {
      const puzzle = GRAMMAR_PUZZLES[selectedCategory][0];
      setPuzzleTokens([...puzzle.tokens].sort(() => 0.5 - Math.random()));
      setAssembledTokens([]);
      setPuzzleAnswered(null);
    }
  }, [tool, selectedCategory]);

  if (!isOpen || !tool) return null;

  const currentModule = TOOLKIT_MODULES.find((m) => m.id === tool);
  const gamificationSpec: ModuleGamificationSpec | undefined = MODULE_GAMIFICATION_MATRIX[tool];
  
  const flashcards = FLASHCARDS_BY_CATEGORY[selectedCategory];
  const colloquialPhrases = PHRASES_BY_CATEGORY[selectedCategory];
  const currentFlashcard = flashcards[currentCardIndex % flashcards.length];
  const speakingLocations = SPEAKING_CITY_LOCATIONS[selectedCategory];
  const currentCityLocation = speakingLocations[selectedCityLocation % speakingLocations.length];
  const pronunciationDrills = PRONUNCIATION_DRILLS[selectedCategory];
  const currentPronounceDrill = pronunciationDrills[selectedDrillIndex % pronunciationDrills.length];
  const wordVaultThemes = THEMATIC_WORD_VAULTS[selectedCategory];
  const currentVaultTheme = wordVaultThemes[selectedVaultTheme % wordVaultThemes.length];

  const handlePlayAudio = async (text: string) => {
    setPlayingPhrase(text);
    sounds.playTap();
    await speakBisaya(text);
    setPlayingPhrase(null);
  };

  const awardXp = (amount: number) => {
    setXpEarned((prev) => prev + amount);
    confetti({
      particleCount: 25,
      spread: 50,
      origin: { y: 0.8 },
      colors: ['#0d9488', '#0284c7', '#f59e0b'],
    });
  };

  // Filter phrases in phrasebook
  const filteredPhrases = colloquialPhrases.filter((p) => {
    const matchesCategory = selectedPhraseCategory === 'All' || p.category === selectedPhraseCategory;
    const matchesSearch = 
      p.native.toLowerCase().includes(searchPhrase.toLowerCase()) ||
      p.english.toLowerCase().includes(searchPhrase.toLowerCase()) ||
      p.category.toLowerCase().includes(searchPhrase.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200 select-none">
      <div className="w-full max-w-lg max-h-[92vh] sm:max-h-[88vh] flex flex-col bg-white dark:bg-[#11222D] rounded-t-3xl sm:rounded-3xl shadow-2xl border border-stone-300 dark:border-white/15 overflow-hidden transition-all animate-in slide-in-from-bottom-4 duration-250">
        
        {/* Mobile Drag Indicator */}
        <div className="flex sm:hidden justify-center pt-2 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-stone-300 dark:bg-stone-700" />
        </div>

        {/* Header */}
        <div className="p-4 border-b border-stone-200 dark:border-white/10 space-y-2 bg-stone-50/80 dark:bg-[#152B37]/80 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-2xl flex items-center justify-center font-bold text-lg bg-teal-50 dark:bg-teal-950/80 border border-teal-200 dark:border-teal-500/30 text-teal-800 dark:text-teal-300 shadow-xs shrink-0">
                {currentModule?.icon || '📚'}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] font-mono font-bold text-teal-600 dark:text-teal-400">
                    Module #{currentModule?.num || '01'}
                  </span>
                  <h3 className="font-display font-black text-sm text-stone-900 dark:text-white truncate">
                    {currentModule?.title || 'Learning Tool'}
                  </h3>
                </div>
                <p className="text-[11px] text-stone-600 dark:text-stone-300 font-medium truncate">
                  {currentModule?.purpose || 'Targeted educational activity'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {xpEarned > 0 && (
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-mono text-[11px] font-black animate-bounce">
                  <Flame className="w-3.5 h-3.5 fill-amber-500" />
                  <span>+{xpEarned} XP</span>
                </div>
              )}
              <button
                onClick={() => {
                  sounds.playTap();
                  onClose();
                }}
                className="w-8 h-8 rounded-full flex items-center justify-center text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-white hover:bg-stone-200 dark:hover:bg-stone-800 transition-colors cursor-pointer shrink-0"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Gamification Mechanic Badge Banner */}
          {gamificationSpec && (
            <div className="p-2 bg-white dark:bg-stone-900/90 rounded-xl border border-stone-200 dark:border-white/10 flex items-center justify-between gap-2 text-[10px]">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-teal-600 dark:text-teal-400 font-bold shrink-0">🎮 Gameplay:</span>
                <span className="text-stone-700 dark:text-stone-300 font-medium truncate">
                  {gamificationSpec.gamificationMechanic}
                </span>
              </div>
              <span className="font-mono text-[9px] bg-teal-50 dark:bg-teal-950/80 text-teal-700 dark:text-teal-300 px-2 py-0.5 rounded-md font-bold shrink-0 border border-teal-200/50">
                {gamificationSpec.mechanicLabel}
              </span>
            </div>
          )}

          {/* MAJOR LANGUAGE CATEGORY PILLS */}
          <div className="grid grid-cols-3 gap-1 p-1 bg-stone-200/60 dark:bg-stone-900/80 rounded-2xl border border-stone-200 dark:border-white/5 text-xs font-bold">
            <button
              onClick={() => {
                sounds.playTap();
                setSelectedCategory('cebuano');
                setCurrentCardIndex(0);
              }}
              className={`py-1.5 px-2 rounded-xl flex items-center justify-center gap-1 transition-all cursor-pointer ${
                selectedCategory === 'cebuano'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
              }`}
            >
              <span>🇵🇭</span>
              <span className="truncate">Cebuano</span>
            </button>

            <button
              onClick={() => {
                sounds.playTap();
                setSelectedCategory('filipino');
                setCurrentCardIndex(0);
              }}
              className={`py-1.5 px-2 rounded-xl flex items-center justify-center gap-1 transition-all cursor-pointer ${
                selectedCategory === 'filipino'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
              }`}
            >
              <span>🇵🇭</span>
              <span className="truncate">Filipino</span>
            </button>

            <button
              onClick={() => {
                sounds.playTap();
                setSelectedCategory('english');
                setCurrentCardIndex(0);
              }}
              className={`py-1.5 px-2 rounded-xl flex items-center justify-center gap-1 transition-all cursor-pointer ${
                selectedCategory === 'english'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
              }`}
            >
              <span>🌎</span>
              <span className="truncate">English</span>
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-4 space-y-4">
          
          {/* ========================================================================= */}
          {/* MODULE 1: VOICE PRACTICE — The Speaking City (World Exploration)          */}
          {/* ========================================================================= */}
          {tool === 'voice' && (
            <div className="space-y-4 py-1">
              {/* Full Speaking City Map Launcher Banner */}
              <button
                onClick={() => {
                  sounds.playTap();
                  setShowSpeakingCityFull(true);
                }}
                className="w-full p-3 rounded-2xl bg-gradient-to-r from-teal-600 via-teal-700 to-cyan-700 hover:from-teal-500 hover:to-cyan-600 text-white font-display font-black text-xs flex items-center justify-between shadow-md cursor-pointer active:scale-98 transition-all border border-teal-400/30"
              >
                <div className="flex items-center gap-2.5 text-left">
                  <span className="text-2xl">🏙️</span>
                  <div>
                    <div className="text-white text-xs font-black">Explore The Speaking City Map</div>
                    <div className="text-[10px] text-teal-200 font-normal">All 5 districts & full interactive speaking missions</div>
                  </div>
                </div>
                <div className="px-2.5 py-1 rounded-xl bg-white/20 text-white text-[10px] font-mono font-bold flex items-center gap-1">
                  <span>Enter</span>
                  <ArrowRight className="w-3 h-3" />
                </div>
              </button>

              {/* Active Location Mission Card */}
              <div className="p-4 bg-teal-950/40 border border-teal-800/60 rounded-3xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-teal-300 bg-teal-900/60 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <Target className="w-3 h-3" />
                    <span>Speaking Mission: {currentCityLocation.missionTitle}</span>
                  </span>
                  <span className="text-[10px] font-mono text-amber-400 font-bold">
                    Practice (not scored)
                  </span>
                </div>

                {/* Companion Dialogue Prompt */}
                <div className="p-3 bg-stone-900/60 rounded-2xl border border-white/10 space-y-1">
                  <div className="text-[10px] font-mono text-teal-400 flex items-center gap-1 font-bold">
                    <span>SULTI Companion:</span>
                  </div>
                  <p className="text-xs text-white font-medium italic">
                    "{currentCityLocation.companionPrompt}"
                  </p>
                </div>

                {/* Target Response Phrase */}
                <div className="space-y-1">
                  <div className="text-[10px] font-mono uppercase text-stone-400">
                    Your Target Spoken Reply:
                  </div>
                  <div className="font-display font-black text-sm text-stone-900 dark:text-white">
                    "{currentCityLocation.targetPhrase}"
                  </div>
                  <div className="text-xs text-stone-500 dark:text-stone-400 italic">
                    ({currentCityLocation.englishTranslation})
                  </div>
                </div>

                {/* Audio Listen & Mic Action */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => handlePlayAudio(currentCityLocation.targetPhrase)}
                    className="flex-1 py-2.5 px-3 rounded-2xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold text-xs flex items-center justify-center gap-1.5 border border-white/10 cursor-pointer active:scale-95 transition-all"
                  >
                    <Volume2 className="w-4 h-4 text-teal-400" />
                    <span>Listen Model</span>
                  </button>

                  <button
                    onClick={() => {
                      sounds.playTap();
                      setVoiceMicActive(true);
                      setVoiceSpeechFeedback(null);
                      setTimeout(() => {
                        setVoiceMicActive(false);
                        setVoiceMissionSuccess(true);
                        setVoiceSpeechFeedback(
                          'Practice complete — no score is recorded for this preview.'
                        );
                        sounds.playTap();
                      }, 1800);
                    }}
                    disabled={voiceMicActive}
                    className={`flex-1 py-2.5 px-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all shadow-xs ${
                      voiceMicActive
                        ? 'bg-rose-600 text-white animate-pulse'
                        : 'bg-teal-600 hover:bg-teal-500 text-white'
                    }`}
                  >
                    <Mic className="w-4 h-4" />
                    <span>{voiceMicActive ? 'Listening...' : 'Speak Reply'}</span>
                  </button>
                </div>

                {voiceSpeechFeedback && (
                  <div className="p-3 bg-emerald-950/60 border border-emerald-700/60 rounded-2xl text-xs text-emerald-300 font-mono space-y-1">
                    <div>{voiceSpeechFeedback}</div>
                    <div className="text-[10px] text-emerald-400">
                      Practice complete in {currentCityLocation.name}.
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* MODULE 2: SCENARIOS (Interactive Story Adventures)                         */}
          {/* ========================================================================= */}
          {tool === 'scenario' && (
            <div className="space-y-3">
              <div className="p-3 bg-purple-50 dark:bg-purple-950/30 rounded-2xl border border-purple-200 dark:border-purple-800/50 text-xs text-purple-900 dark:text-purple-200 flex items-center justify-between">
                <span className="font-bold flex items-center gap-1.5">
                  <span>🎭 Interactive Story Adventures</span>
                </span>
                <button
                  onClick={() => {
                    sounds.playTap();
                    setShowScenarioAdventureFull(true);
                  }}
                  className="px-2.5 py-1 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold font-mono text-[11px] shadow-xs cursor-pointer flex items-center gap-1 transition-all"
                >
                  <span>Open Full Story Studio</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              <div className="space-y-2">
                {ROLEPLAY_SCENARIOS.map((sc) => (
                  <div
                    key={sc.id}
                    onClick={() => {
                      sounds.playTap();
                      setShowScenarioAdventureFull(true);
                    }}
                    className="p-3.5 bg-stone-50 dark:bg-[#152B37] hover:bg-purple-50 dark:hover:bg-purple-950/40 rounded-2xl border border-stone-200 dark:border-white/10 hover:border-purple-300 dark:hover:border-purple-500/40 transition-all cursor-pointer group flex items-start gap-3"
                  >
                    <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 flex items-center justify-center shrink-0 text-lg shadow-inner">
                      {sc.id === 'sc_market' ? '🛒' : sc.id === 'sc_jeepney' ? '🚙' : sc.id === 'sc_dining' ? '🍲' : '🩺'}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="font-display font-black text-xs text-stone-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400">
                          {sc.title}
                        </h4>
                        <span className="text-[10px] font-mono text-stone-400">{sc.difficulty}</span>
                      </div>
                      <p className="text-[11px] text-stone-500 dark:text-stone-400 line-clamp-1 mt-0.5">
                        {sc.context}
                      </p>
                      <div className="text-[10px] text-purple-600 dark:text-purple-400 font-bold flex items-center gap-1 mt-1">
                        <span>Launch Story Chapter (+50 XP)</span>
                        <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* MODULE 3: PHRASEBOOK — The Pin Collection / Badge Album                   */}
          {/* ========================================================================= */}
          {tool === 'phrasebook' && (
            <div className="space-y-3">
              <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-2xl border border-amber-200 dark:border-amber-800/50 flex items-center justify-between text-xs text-amber-900 dark:text-amber-200">
                <span className="font-bold flex items-center gap-1.5">
                  <Bookmark className="w-4 h-4 text-amber-600" />
                  <span>The Pin Collection · Category Album</span>
                </span>
                <span className="font-mono font-bold bg-amber-100 dark:bg-amber-900/60 px-2 py-0.5 rounded-full">
                  {pinnedPhrases.length} Pinned Stamps
                </span>
              </div>

              {/* Category filter pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px]">
                {['All', 'Jeepney', 'Market', 'Dining', 'Directions', 'Etiquette'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => {
                      sounds.playTap();
                      setSelectedPhraseCategory(cat);
                    }}
                    className={`px-3 py-1 rounded-xl font-bold whitespace-nowrap cursor-pointer transition-all ${
                      selectedPhraseCategory === cat
                        ? 'bg-amber-600 text-white shadow-2xs'
                        : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="relative">
                <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchPhrase}
                  onChange={(e) => setSearchPhrase(e.target.value)}
                  placeholder={`Search ${selectedCategory === 'cebuano' ? 'Bisaya' : 'Filipino'} expressions...`}
                  className="w-full pl-9 pr-4 py-2 bg-stone-100 dark:bg-stone-800 border border-transparent focus:border-amber-500 rounded-xl text-xs text-stone-900 dark:text-white placeholder:text-stone-400 focus:outline-none"
                />
              </div>

              <div className="space-y-2">
                {filteredPhrases.map((phrase) => {
                  const isPinned = pinnedPhrases.includes(phrase.id);
                  return (
                    <div
                      key={phrase.id}
                      className="p-3 bg-stone-50 dark:bg-[#152B37] rounded-2xl border border-stone-200 dark:border-white/10 space-y-1 hover:border-amber-400 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono uppercase text-amber-700 dark:text-amber-400 font-bold bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-md">
                          {phrase.category}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              sounds.playTap();
                              if (isPinned) {
                                setPinnedPhrases((prev) => prev.filter((id) => id !== phrase.id));
                              } else {
                                setPinnedPhrases((prev) => [...prev, phrase.id]);
                                awardXp(5);
                              }
                            }}
                            className={`p-1 rounded-lg cursor-pointer transition-colors ${
                              isPinned ? 'text-amber-500 fill-amber-500' : 'text-stone-400 hover:text-amber-500'
                            }`}
                            title={isPinned ? 'Pinned in Album' : 'Pin to Album'}
                          >
                            <Bookmark className={`w-4 h-4 ${isPinned ? 'fill-amber-500' : ''}`} />
                          </button>
                          <button
                            onClick={() => handlePlayAudio(phrase.native)}
                            className="p-1 rounded-lg text-stone-400 hover:text-amber-600 cursor-pointer"
                            title="Listen"
                          >
                            <Volume2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="font-display font-black text-sm text-stone-900 dark:text-white">
                        "{phrase.native}"
                      </div>
                      <div className="text-xs text-stone-600 dark:text-stone-300">
                        {phrase.english}
                      </div>
                      <div className="text-[10px] text-stone-400 italic pt-0.5">
                        💡 {phrase.note}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* MODULE 4: FLASHCARDS — Memory Grid & Spaced Repetition (SM-2)             */}
          {/* ========================================================================= */}
          {tool === 'flashcards' && (
            <div className="space-y-4 py-2">
              <div className="flex items-center justify-between text-xs text-stone-400 px-1 font-mono">
                <span>Card {currentCardIndex + 1} of {flashcards.length} ({selectedCategory === 'cebuano' ? 'Bisaya' : 'Filipino'})</span>
                <span className="text-teal-600 dark:text-teal-400 font-bold flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  <span>Streak: {flashcardStreak} Cards</span>
                </span>
              </div>

              {/* Leitner Box Level Indicator */}
              <div className="p-2.5 bg-stone-100 dark:bg-stone-900 rounded-2xl flex items-center justify-between text-[11px] font-mono">
                <span className="text-stone-500 dark:text-stone-400">Leitner Memory Tier:</span>
                <div className="flex items-center gap-1.5">
                  <span className={`px-2 py-0.5 rounded-md ${currentFlashcard.box === 1 ? 'bg-amber-500 text-white font-bold' : 'bg-stone-200 dark:bg-stone-800 text-stone-500'}`}>Box 1 (Daily)</span>
                  <span className={`px-2 py-0.5 rounded-md ${currentFlashcard.box === 2 ? 'bg-teal-500 text-white font-bold' : 'bg-stone-200 dark:bg-stone-800 text-stone-500'}`}>Box 2 (3-Days)</span>
                  <span className={`px-2 py-0.5 rounded-md ${currentFlashcard.box === 3 ? 'bg-emerald-500 text-white font-bold' : 'bg-stone-200 dark:bg-stone-800 text-stone-500'}`}>Box 3 (Permanent)</span>
                </div>
              </div>

              {/* Flashcard container */}
              <div
                onClick={() => {
                  sounds.playTap();
                  setIsFlipped(!isFlipped);
                }}
                className={`min-h-[190px] p-6 rounded-3xl border text-center flex flex-col justify-between transition-all cursor-pointer select-none shadow-sm ${
                  isFlipped
                    ? 'bg-teal-600 text-white border-teal-500'
                    : 'bg-stone-50 dark:bg-[#152B37] border-stone-200 dark:border-white/10 text-stone-900 dark:text-white'
                }`}
              >
                <div className="text-[10px] font-mono uppercase tracking-wider opacity-75">
                  {currentFlashcard.context}
                </div>

                <div className="py-2 space-y-1">
                  <div className="font-display font-black text-2xl">
                    {isFlipped ? currentFlashcard.english : currentFlashcard.native}
                  </div>
                  {!isFlipped && (
                    <div className="text-xs opacity-80 font-mono">
                      {currentFlashcard.phonetics}
                    </div>
                  )}
                </div>

                <div className="text-[11px] opacity-75 font-medium flex items-center justify-center gap-1">
                  <RotateCw className="w-3 h-3" />
                  <span>{isFlipped ? 'Tap to see native phrase' : 'Tap to reveal English translation'}</span>
                </div>
              </div>

              {/* Flashcard Response Grading Buttons */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={() => {
                    sounds.playTap();
                    setIsFlipped(false);
                    setCurrentCardIndex((prev) => (prev + 1) % flashcards.length);
                  }}
                  className="py-3 px-3 rounded-2xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-800 dark:text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 border border-stone-200 dark:border-white/10"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-stone-400" />
                  <span>Hard (Review Again)</span>
                </button>

                <button
                  onClick={() => {
                    sounds.playCorrect();
                    setIsFlipped(false);
                    setCurrentCardIndex((prev) => (prev + 1) % flashcards.length);
                    setFlashcardStreak((prev) => prev + 1);
                    awardXp(15);
                  }}
                  className="py-3 px-3 rounded-2xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 shadow-xs"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Mastered (+15 XP)</span>
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* MODULE 5: PRONUNCIATION LAB — Sound Spectrum & Acoustic Concordance       */}
          {/* ========================================================================= */}
          {tool === 'pronunciation' && (
            <div className="space-y-4 py-1">
              <div className="flex justify-end">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/60 px-2.5 py-0.5 rounded-full">
                  Practice (not scored)
                </span>
              </div>

              {/* Drill Selector Tabs */}
              <div className="flex items-center gap-1.5">
                {pronunciationDrills.map((drill, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      sounds.playTap();
                      setSelectedDrillIndex(idx);
                      setPhoneticAnalysis(null);
                    }}
                    className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer truncate ${
                      selectedDrillIndex === idx
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300'
                    }`}
                  >
                    {drill.word}
                  </button>
                ))}
              </div>

              {/* Sound Spectrum Card */}
              <div className="p-4 bg-blue-950/40 border border-blue-800/60 rounded-3xl space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-blue-300 bg-blue-900/60 px-2.5 py-0.5 rounded-full">
                    Acoustic Concordance & Glottal Alignment
                  </span>
                  <span className="text-[10px] font-mono text-blue-400">
                    Difficulty: {currentPronounceDrill.difficulty}
                  </span>
                </div>

                <div className="text-center py-1 space-y-1">
                  <div className="font-display font-black text-2xl text-white">
                    "{currentPronounceDrill.word}"
                  </div>
                  <div className="font-mono text-xs text-blue-300">
                    {currentPronounceDrill.phonetics}
                  </div>
                </div>

                {/* Simulated Acoustic Waveform / Spectrum */}
                <div className="h-12 bg-blue-900/40 rounded-2xl border border-blue-700/50 flex items-center justify-center gap-1 px-4 overflow-hidden">
                  {[30, 45, 60, 85, 95, 70, 85, 40, 65, 90, 75, 55, 80, 95, 60, 40, 70, 90, 50].map((h, i) => (
                    <div
                      key={i}
                      className={`w-1 rounded-full transition-all duration-300 ${
                        pronounceMicActive
                          ? 'bg-rose-400 animate-pulse'
                          : phoneticAnalysis
                          ? 'bg-emerald-400'
                          : 'bg-blue-400/60'
                      }`}
                      style={{ height: pronounceMicActive ? `${Math.random() * 80 + 20}%` : `${h}%` }}
                    />
                  ))}
                </div>

                {/* Glottal Breakdown Chips */}
                <div className="space-y-1">
                  <div className="text-[10px] font-mono text-stone-400 uppercase">
                    Phonetic Syllable Breakdown:
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {currentPronounceDrill.glottalBreakdown.map((part, i) => (
                      <span key={i} className="text-[10px] font-mono bg-blue-900/80 text-blue-200 px-2 py-0.5 rounded-md border border-blue-700/60">
                        {part}
                      </span>
                    ))}
                  </div>
                  <p className="text-[10px] text-stone-400 italic pt-1">
                    💡 {currentPronounceDrill.focusNote}
                  </p>
                </div>

                {/* Audio Controls */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => handlePlayAudio(currentPronounceDrill.word)}
                    className="flex-1 py-2.5 px-3 rounded-2xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold text-xs flex items-center justify-center gap-1.5 border border-white/10 cursor-pointer active:scale-95 transition-all"
                  >
                    <Volume2 className="w-4 h-4 text-blue-400" />
                    <span>Listen Native Model</span>
                  </button>

                  <button
                    onClick={() => {
                      sounds.playTap();
                      setPronounceMicActive(true);
                      setPhoneticAnalysis(null);
                      setTimeout(() => {
                        setPronounceMicActive(false);
                        setPhoneticAnalysis('Practice complete — no score is recorded.');
                        sounds.playTap();
                      }, 1800);
                    }}
                    disabled={pronounceMicActive}
                    className={`flex-1 py-2.5 px-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all shadow-xs ${
                      pronounceMicActive
                        ? 'bg-rose-600 text-white animate-pulse'
                        : 'bg-blue-600 hover:bg-blue-500 text-white'
                    }`}
                  >
                    <Mic className="w-4 h-4" />
                    <span>{pronounceMicActive ? 'Analyzing Waveform...' : 'Record My Voice'}</span>
                  </button>
                </div>

                {phoneticAnalysis && (
                  <div className="p-3 bg-blue-950/60 border border-blue-700/60 rounded-2xl space-y-1 animate-in fade-in">
                    <div className="text-xs font-bold text-blue-200">Practice complete</div>
                    <p className="text-[10px] font-mono text-blue-300">
                      {phoneticAnalysis}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* MODULE 6: GRAMMAR — Sentence Assembly Puzzles                             */}
          {/* ========================================================================= */}
          {tool === 'grammar' && (
            <div className="space-y-4 py-1">
              <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 rounded-2xl border border-indigo-200 dark:border-indigo-800/60 space-y-1.5">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
                  Sentence Assembly Puzzle · Focus Markers
                </span>
                <p className="text-xs font-bold text-stone-900 dark:text-white">
                  {GRAMMAR_PUZZLES[selectedCategory][0].prompt}
                </p>
                <p className="text-[10px] text-stone-500 dark:text-stone-400">
                  💡 {GRAMMAR_PUZZLES[selectedCategory][0].ruleNote}
                </p>
              </div>

              {/* Assembled Area */}
              <div className="min-h-[60px] p-3 rounded-2xl border border-dashed border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900/50 flex flex-wrap items-center gap-1.5">
                {assembledTokens.length === 0 ? (
                  <span className="text-xs text-stone-400 italic">Tap words below to build the sentence...</span>
                ) : (
                  assembledTokens.map((w, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        sounds.playTap();
                        setAssembledTokens((prev) => prev.filter((_, i) => i !== idx));
                        setPuzzleTokens((prev) => [...prev, w]);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-bold shadow-2xs hover:bg-rose-500 transition-colors"
                    >
                      {w} ✕
                    </button>
                  ))
                )}
              </div>

              {/* Available Tokens */}
              <div className="flex flex-wrap gap-2 justify-center py-2">
                {puzzleTokens.map((w, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      sounds.playTap();
                      setPuzzleTokens((prev) => prev.filter((_, i) => i !== idx));
                      setAssembledTokens((prev) => [...prev, w]);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-stone-100 hover:bg-indigo-50 dark:bg-stone-800 dark:hover:bg-indigo-950/60 border border-stone-200 dark:border-white/10 text-xs font-bold text-stone-800 dark:text-white cursor-pointer active:scale-95 transition-all"
                  >
                    {w}
                  </button>
                ))}
              </div>

              {/* Check Answer Button */}
              <button
                onClick={() => {
                  const target = GRAMMAR_PUZZLES[selectedCategory][0].targetText;
                  const current = assembledTokens.join(' ');
                  if (current === target) {
                    sounds.playCorrect();
                    setPuzzleAnswered(true);
                    awardXp(30);
                  } else {
                    sounds.playWrong();
                    setPuzzleAnswered(false);
                  }
                }}
                disabled={assembledTokens.length === 0}
                className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-xs disabled:opacity-50 cursor-pointer active:scale-98 transition-all"
              >
                Validate Sentence Assembly
              </button>

              {puzzleAnswered !== null && (
                <div className={`p-3 rounded-2xl text-xs font-medium border ${
                  puzzleAnswered 
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-300' 
                    : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-300'
                }`}>
                  {puzzleAnswered ? '🎉 Sakto kaayo! Perfect sentence focus markers placement.' : '❌ Try again! Notice which noun is the topic (ang) versus the actor (ni/ko).'}
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* MODULE 7: VOCABULARY NOTEBOOK — The Word Vault & Personal Lexicon          */}
          {/* ========================================================================= */}
          {tool === 'vocabulary' && (
            <div className="space-y-4 py-1">
              {/* Thematic Vault Selector */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {wordVaultThemes.map((v, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      sounds.playTap();
                      setSelectedVaultTheme(idx);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-all ${
                      selectedVaultTheme === idx
                        ? 'bg-teal-600 text-white shadow-2xs'
                        : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300'
                    }`}
                  >
                    {v.theme}
                  </button>
                ))}
              </div>

              {/* Word Vault List */}
              <div className="space-y-2">
                {currentVaultTheme.words.map((w, idx) => {
                  const isMastered = masteredWords.includes(w.native);
                  return (
                    <div
                      key={idx}
                      className="p-3.5 bg-stone-50 dark:bg-[#152B37] rounded-2xl border border-stone-200 dark:border-white/10 space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-display font-black text-sm text-stone-900 dark:text-white">
                            {w.native}
                          </span>
                          <span className="text-xs text-stone-500 dark:text-stone-400">
                            • {w.english}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {/* 3-Star Mastery Indicator */}
                          <div className="flex text-amber-400 text-xs">
                            {'★'.repeat(w.stars)}{'☆'.repeat(3 - w.stars)}
                          </div>
                          <button
                            onClick={() => handlePlayAudio(w.native)}
                            className="p-1 rounded-lg text-stone-400 hover:text-teal-600 cursor-pointer"
                          >
                            <Volume2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="text-[11px] text-stone-600 dark:text-stone-300">
                        💡 {w.note}
                      </div>

                      <div className="flex items-center justify-between pt-1 text-[10px]">
                        <span className="text-stone-400 font-mono">
                          Frequency: Common Core Lexicon
                        </span>
                        <button
                          onClick={() => {
                            sounds.playCorrect();
                            if (isMastered) {
                              setMasteredWords((prev) => prev.filter((item) => item !== w.native));
                            } else {
                              setMasteredWords((prev) => [...prev, w.native]);
                              awardXp(10);
                            }
                          }}
                          className={`px-2.5 py-1 rounded-lg font-bold cursor-pointer transition-all ${
                            isMastered
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-teal-600 hover:text-white'
                          }`}
                        >
                          {isMastered ? '✓ Banked in Vault' : '+ Add to My Vault'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* MODULE 8: LISTENING — Audio Detective & Ear-Training                       */}
          {/* ========================================================================= */}
          {tool === 'listening' && (
            <div className="space-y-4 py-1">
              <div className="p-4 bg-teal-50/70 dark:bg-teal-950/40 rounded-3xl border border-teal-200 dark:border-teal-800/60 text-center space-y-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-teal-800 dark:text-teal-300">
                  Audio Detective · Native Speech Processing
                </span>
                <p className="text-xs text-stone-600 dark:text-stone-300 font-medium">
                  {LISTENING_CHALLENGES[selectedCategory][0].speaker}
                </p>

                <div className="flex items-center justify-center gap-2 pt-1">
                  <button
                    onClick={() => handlePlayAudio(LISTENING_CHALLENGES[selectedCategory][0].audioPhrase)}
                    className="px-4 py-2 rounded-2xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs inline-flex items-center gap-2 shadow-xs cursor-pointer active:scale-95"
                  >
                    <Volume2 className="w-4 h-4" />
                    <span>Play Audio ({audioSpeedSlow ? '0.8x Slow' : '1.0x Normal'})</span>
                  </button>

                  <button
                    onClick={() => {
                      sounds.playTap();
                      setAudioSpeedSlow(!audioSpeedSlow);
                    }}
                    className={`px-3 py-2 rounded-2xl text-xs font-bold border transition-colors cursor-pointer ${
                      audioSpeedSlow
                        ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border-amber-300'
                        : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 border-stone-200 dark:border-white/10'
                    }`}
                  >
                    <span>🐢 0.8x</span>
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-bold text-stone-900 dark:text-white">
                  {LISTENING_CHALLENGES[selectedCategory][0].question}
                </p>

                {LISTENING_CHALLENGES[selectedCategory][0].options.map((opt, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      sounds.playTap();
                      setListeningSelectedOption(idx);
                      if (idx === LISTENING_CHALLENGES[selectedCategory][0].correctAnswer) {
                        sounds.playCorrect();
                        awardXp(25);
                      } else {
                        sounds.playWrong();
                      }
                    }}
                    className={`w-full p-3 rounded-2xl border text-xs font-medium text-left transition-all cursor-pointer ${
                      listeningSelectedOption === idx
                        ? idx === LISTENING_CHALLENGES[selectedCategory][0].correctAnswer
                          ? 'bg-emerald-500 text-white border-emerald-600'
                          : 'bg-rose-500 text-white border-rose-600'
                        : 'bg-stone-50 dark:bg-[#152B37] border-stone-200 dark:border-white/10 text-stone-800 dark:text-stone-200 hover:border-teal-400'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setListeningRevealed(!listeningRevealed)}
                className="text-[11px] text-stone-500 dark:text-stone-400 underline cursor-pointer"
              >
                {listeningRevealed ? 'Hide Audio Transcript' : 'Reveal Audio Transcript & Spoken Contractions'}
              </button>

              {listeningRevealed && (
                <div className="p-3 bg-stone-100 dark:bg-stone-800/80 rounded-2xl text-xs space-y-1">
                  <p className="font-bold">"{LISTENING_CHALLENGES[selectedCategory][0].audioPhrase}"</p>
                  <p className="italic text-stone-500">({LISTENING_CHALLENGES[selectedCategory][0].englishMeaning})</p>
                  <p className="text-[10px] text-teal-600 dark:text-teal-400 font-mono">
                    {LISTENING_CHALLENGES[selectedCategory][0].accentNote}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* MODULE 9: WRITING — Scribe Quests & BERT/NLP Rubric Feedback               */}
          {/* ========================================================================= */}
          {tool === 'writing' && (
            <div className="space-y-4 py-1">
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-2xl border border-amber-200 dark:border-amber-800/60 space-y-1">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">
                  Writing Scribe Quest · SMS Invitation
                </span>
                <p className="text-xs text-stone-700 dark:text-stone-300">
                  Write a short SMS message in {selectedCategory === 'cebuano' ? 'Bisaya' : 'Filipino'} inviting a friend for coffee (e.g. "Magkape ta unya?").
                </p>
              </div>

              {/* Conversational particle chips helpers */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-mono text-stone-400">Helper Particles:</span>
                {(selectedCategory === 'cebuano' ? ['ta', 'unya', 'gyud', 'ba', 'bitaw'] : ['tayo', 'mamaya', 'talaga', 'ba', 'po']).map((part) => (
                  <button
                    key={part}
                    onClick={() => {
                      sounds.playTap();
                      setWrittenInput((prev) => (prev ? `${prev} ${part}` : part));
                    }}
                    className="px-2 py-0.5 rounded-lg bg-stone-100 dark:bg-stone-800 text-[11px] font-mono hover:bg-amber-100 dark:hover:bg-amber-950 cursor-pointer"
                  >
                    +{part}
                  </button>
                ))}
              </div>

              <textarea
                value={writtenInput}
                onChange={(e) => setWrittenInput(e.target.value)}
                rows={3}
                placeholder={selectedCategory === 'cebuano' ? 'Isuwat imong mensahe diri...' : 'Isulat ang iyong mensahe dito...'}
                className="w-full p-3 rounded-2xl bg-stone-50 dark:bg-stone-800/70 border border-stone-200 dark:border-white/10 text-xs text-stone-900 dark:text-white placeholder:text-stone-400 focus:outline-none focus:border-amber-500"
              />

              <button
                onClick={() => {
                  sounds.playTap();
                  if (!writtenInput.trim()) return;
                  setTimeout(() => {
                    sounds.playCorrect();
                    setWritingFeedback(
                      selectedCategory === 'cebuano'
                        ? '✓ BERT NLP Rubric: Natural colloquial phrasing! High mark on particle placement ("ta", "unya").'
                        : '✓ BERT NLP Rubric: Grammatically natural Tagalog! Polite tone and clear communicative intent.'
                    );
                    awardXp(30);
                  }, 600);
                }}
                disabled={!writtenInput.trim()}
                className="w-full py-3 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-xs disabled:opacity-50 cursor-pointer active:scale-98 transition-all"
              >
                Submit for NLP Rubric Feedback
              </button>

              {writingFeedback && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-300 text-xs text-emerald-800 dark:text-emerald-300 font-medium">
                  {writingFeedback}
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* MODULE 10: READING — Interactive Storybook & Cultural Passages            */}
          {/* ========================================================================= */}
          {tool === 'reading' && (
            <div className="space-y-4 py-1">
              <div className="p-4 bg-stone-50 dark:bg-[#152B37] rounded-3xl border border-stone-200 dark:border-white/10 space-y-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded-full">
                  Interactive Storybook · Graded Cultural Reading
                </span>
                <h4 className="font-display font-black text-sm text-stone-900 dark:text-white">
                  {selectedCategory === 'cebuano' ? 'Ang Sugilanon sa Tabo sa Banwa' : 'Ang Araw ng Palengke sa Nayon'}
                </h4>
                <p className="text-xs text-stone-700 dark:text-stone-300 leading-relaxed font-normal">
                  {selectedCategory === 'cebuano' 
                    ? 'Kada Domingo, magtapok ang mga mag-uuma sa plasa aron ibaligya ang ilang presko nga mga utanon, saging, ug isda gikan sa dagat. Ang mga tawo mag-estoryahanay ug magbinayloay og balita.'
                    : 'Tuwing Linggo, nagtitipon ang mga magsasaka sa plasa upang magbenta ng sariwang gulay, saging, at isda mula sa dagat. Masayang nagkukwentuhan ang mga tao.'}
                </p>

                {/* Tap-to-translate glossary chip */}
                <div className="pt-1 flex items-center gap-1.5 text-[10px]">
                  <span className="text-stone-400">Glossary hint:</span>
                  <button
                    onClick={() => setActiveStoryGlossaryWord('magtapok / nagtitipon = gather / convene')}
                    className="px-2 py-0.5 rounded-md bg-stone-200 dark:bg-stone-800 text-teal-600 dark:text-teal-400 font-mono font-bold cursor-pointer"
                  >
                    magtapok 🔍
                  </button>
                  <button
                    onClick={() => setActiveStoryGlossaryWord('presko / sariwa = fresh produce')}
                    className="px-2 py-0.5 rounded-md bg-stone-200 dark:bg-stone-800 text-teal-600 dark:text-teal-400 font-mono font-bold cursor-pointer"
                  >
                    presko 🔍
                  </button>
                </div>

                {activeStoryGlossaryWord && (
                  <div className="p-2 bg-stone-100 dark:bg-stone-800 rounded-xl text-[11px] font-mono text-teal-600 dark:text-teal-400">
                    💡 {activeStoryGlossaryWord}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <p className="text-xs font-bold text-stone-900 dark:text-white">
                  Check comprehension: When do the farmers gather at the plaza?
                </p>

                <button
                  onClick={() => {
                    sounds.playCorrect();
                    setReadingAnswered(true);
                    awardXp(25);
                  }}
                  className={`w-full p-3 rounded-2xl border text-xs font-medium text-left cursor-pointer transition-all ${
                    readingAnswered ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-stone-50 dark:bg-[#152B37] border-stone-200 hover:border-teal-400'
                  }`}
                >
                  ✓ Every Sunday (Kada Domingo / Tuwing Linggo)
                </button>

                <button
                  onClick={() => sounds.playWrong()}
                  className="w-full p-3 rounded-2xl border text-xs font-medium text-left bg-stone-50 dark:bg-[#152B37] border-stone-200 hover:border-teal-400 cursor-pointer"
                >
                  Every Friday evening
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* MODULE 11: SULTI SWITCH — Timed Speed Drills & Reflex Combo               */}
          {/* ========================================================================= */}
          {tool === 'sulti_switch' && (
            <div className="space-y-4 py-1 text-center">
              <div className="p-4 bg-orange-50 dark:bg-orange-950/40 rounded-3xl border border-orange-200 dark:border-orange-800/60 space-y-2">
                <div className="flex items-center justify-between text-[10px] font-mono font-bold text-orange-800 dark:text-orange-300">
                  <span className="flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5 fill-orange-500" />
                    <span>Sulti Switch · Reflex Drill</span>
                  </span>
                  <span className="px-2 py-0.5 bg-orange-200 dark:bg-orange-900 rounded-full">
                    Combo: x{switchCombo} Multiplier
                  </span>
                </div>

                <div className="font-display font-black text-base text-stone-900 dark:text-white">
                  {SULTI_SWITCH_ITEMS[selectedCategory][switchIndex % SULTI_SWITCH_ITEMS[selectedCategory].length].prompt}
                </div>

                {/* Rapid timer countdown simulation */}
                <div className="w-full bg-orange-200 dark:bg-orange-900 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-orange-500 h-full rounded-full w-3/4 animate-pulse" />
                </div>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={switchInput}
                  onChange={(e) => setSwitchInput(e.target.value)}
                  placeholder="Type translation rapidly..."
                  className="flex-1 p-3 rounded-2xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-white/10 text-xs text-stone-900 dark:text-white"
                />
                <button
                  onClick={() => {
                    sounds.playCorrect();
                    setSwitchFeedback('⚡ Fast reflex! 1.2s response time (+25 XP)');
                    setSwitchIndex((prev) => prev + 1);
                    setSwitchInput('');
                    setSwitchCombo((prev) => Math.min(prev + 1, 5));
                    awardXp(25);
                  }}
                  className="px-4 py-3 bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs rounded-2xl shadow-xs cursor-pointer active:scale-95"
                >
                  Switch!
                </button>
              </div>

              {switchFeedback && (
                <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 rounded-xl text-xs font-mono">
                  {switchFeedback}
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* MODULE 12: CULTURE NOTES — Cultural Codex & Passport Stamps               */}
          {/* ========================================================================= */}
          {tool === 'culture' && (
            <div className="space-y-4 py-1">
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 rounded-3xl border border-emerald-200 dark:border-emerald-800/60 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold uppercase text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/60 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Globe2 className="w-3 h-3" />
                    <span>Cultural Passport Stamp</span>
                  </span>
                  <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400">
                    {CULTURE_LORE[selectedCategory][0].region}
                  </span>
                </div>

                <h4 className="font-display font-black text-sm text-stone-900 dark:text-white">
                  {CULTURE_LORE[selectedCategory][0].title}
                </h4>

                <p className="text-xs text-stone-700 dark:text-stone-300 leading-relaxed">
                  {CULTURE_LORE[selectedCategory][0].loreText}
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-bold text-stone-900 dark:text-white">
                  {CULTURE_LORE[selectedCategory][0].quizQuestion}
                </p>

                {CULTURE_LORE[selectedCategory][0].options.map((opt, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      sounds.playTap();
                      setCultureQuizSelection(idx);
                      if (idx === CULTURE_LORE[selectedCategory][0].correctIndex) {
                        sounds.playCorrect();
                        setPassportStamped(true);
                        awardXp(35);
                      } else {
                        sounds.playWrong();
                      }
                    }}
                    className={`w-full p-3 rounded-2xl border text-xs font-medium text-left transition-all cursor-pointer ${
                      cultureQuizSelection === idx
                        ? idx === CULTURE_LORE[selectedCategory][0].correctIndex
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-rose-500 text-white border-rose-600'
                        : 'bg-stone-50 dark:bg-[#152B37] border-stone-200 dark:border-white/10 hover:border-emerald-500'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>

              {passportStamped && (
                <div className="p-3 bg-emerald-100 dark:bg-emerald-950 rounded-2xl border border-emerald-300 dark:border-emerald-700 flex items-center gap-2.5 text-xs text-emerald-800 dark:text-emerald-300 font-mono">
                  <span className="text-2xl">💮</span>
                  <div>
                    <div className="font-bold">Passport Stamp Conferred!</div>
                    <div className="text-[10px]">Visayan Etiquette & Suki Rapport certified</div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* MODULE 13: REVIEW CENTER — Defeat the Boss / Mistake Clean-Up             */}
          {/* ========================================================================= */}
          {tool === 'review_center' && (
            <div className="space-y-4 py-1">
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 rounded-2xl border border-rose-200 dark:border-rose-800/60 flex items-center justify-between text-xs">
                <span className="font-bold text-rose-800 dark:text-rose-300 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-rose-600" />
                  <span>Defeat Weak Points · Error Clean-Up</span>
                </span>
                
                {/* Heart / Life Gauge */}
                <div className="flex items-center gap-1 text-rose-500">
                  {[1, 2, 3].map((heart) => (
                    <Heart key={heart} className={`w-3.5 h-3.5 ${heart <= reviewLives ? 'fill-rose-500' : 'opacity-30'}`} />
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                {[
                  { id: 'm1', phrase: 'Palihog ko sa plete, Nong', reason: 'Vowel stress on "palihog" needed calibration', xp: 20 },
                  { id: 'm2', phrase: 'Tagpila man ni, Nang?', reason: 'Glottal stop on "man" softened', xp: 20 },
                  { id: 'm3', phrase: 'Lugar lang sa kanto!', reason: 'Code-switch hesitation eliminated', xp: 25 },
                ].map((item) => (
                  <div
                    key={item.id}
                    className="p-3 bg-stone-50 dark:bg-[#152B37] rounded-2xl border border-stone-200 dark:border-white/10 flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="font-bold text-xs text-stone-900 dark:text-white">
                        {item.phrase}
                      </div>
                      <div className="text-[10px] text-stone-500 dark:text-stone-400">
                        {item.reason}
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        sounds.playCorrect();
                        setClearedMistakes((prev) => [...prev, item.id]);
                        awardXp(item.xp);
                      }}
                      disabled={clearedMistakes.includes(item.id)}
                      className={`px-3 py-1.5 rounded-xl font-bold text-xs cursor-pointer transition-all ${
                        clearedMistakes.includes(item.id)
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-teal-600 text-white hover:bg-teal-500'
                      }`}
                    >
                      {clearedMistakes.includes(item.id) ? '✓ Cleared' : 'Re-practice'}
                    </button>
                  </div>
                ))}
              </div>

              {clearedMistakes.length === 3 && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-300 text-center space-y-1">
                  <div className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                    🛡️ Fluency Shield Fully Activated!
                  </div>
                  <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono">
                    All historical error points resolved across Whisper ASR and BERT NLP
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      <SpeakingCityModal
        isOpen={showSpeakingCityFull}
        onClose={() => setShowSpeakingCityFull(false)}
        onOpenSultiChat={onOpenSulti}
      />

      <ScenarioAdventureModal
        isOpen={showScenarioAdventureFull}
        onClose={() => setShowScenarioAdventureFull(false)}
        onOpenSultiChat={onOpenSulti}
      />
    </div>
  );
};
