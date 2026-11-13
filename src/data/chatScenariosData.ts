import { ChatScenario } from '../types/aiHub';

export interface ScenarioCategory {
  id: string;
  name: string;
  icon: string;
  description: string;
}

export const SCENARIO_CATEGORIES: ScenarioCategory[] = [
  { id: 'everyday_life', name: 'Everyday Life', icon: '☕', description: 'Daily routines, dining, shopping, and errands' },
  { id: 'work_career', name: 'Work and Career', icon: '💼', description: 'Job interviews, meetings, BPO calls, and presentations' },
  { id: 'travel_transport', name: 'Travel and Transportation', icon: '🚌', description: 'Jeepneys, navigation, asking directions, and transit' },
  { id: 'social_conversations', name: 'Social Conversations', icon: '👋', description: 'Making friends, casual banter, hobbies, and gatherings' },
  { id: 'cebuano_practice', name: 'Bisaya/Cebuano Practice', icon: '🏝️', description: 'Deep dive into authentic Visayan & Mindanao expressions' },
  { id: 'filipino_practice', name: 'Filipino/Tagalog Practice', icon: '🇵🇭', description: 'Polite markers, Manila dialogue, and Tagalog idioms' },
  { id: 'english_communication', name: 'English Communication', icon: '🌎', description: 'Professional fluency, clarity, and business speech' },
  { id: 'grammar_vocabulary', name: 'Grammar and Vocabulary', icon: '📚', description: 'Sentence patterns, verb inflections, and vocabulary mastery' },
];

export const CHAT_SCENARIOS: ChatScenario[] = [
  // 1. Everyday Life
  {
    id: 'cafe_ordering',
    title: 'Ordering at a Café',
    category: 'everyday_life',
    categoryLabel: 'Everyday Life',
    difficulty: 'Beginner',
    description: 'Order your favorite iced coffee, ask about pastries, and customize your drink with ease.',
    initialPrompt: 'Welcome to Sunburst Café! Good day! What drink or snack can I get started for you today?',
    suggestedGoal: 'Order a coffee drink with custom sugar/ice levels and ask about available pastries.',
    recommendedCoachId: 'kevin',
    supportedLanguages: ['cebuano', 'filipino', 'english'],
    usefulPhrases: [
      { phrase: 'Usa ka iced latte, palihog.', translation: 'One iced latte, please.', pronunciation: 'Oo-sah kah iced latte, pah-LEE-hog.' },
      { phrase: 'Puyde minus tam-is?', translation: 'Can it be less sweet?', pronunciation: 'Pwooy-deh MEE-noos tam-IS?' },
      { phrase: 'Pila ni tanan?', translation: 'How much is everything?', pronunciation: 'PEE-lah nee TAH-nan?' }
    ]
  },
  {
    id: 'market_shopping',
    title: 'Shopping at a Market',
    category: 'everyday_life',
    categoryLabel: 'Everyday Life',
    difficulty: 'Intermediate',
    description: 'Bargain with local vendors for fresh fruits, fish, and vegetables at the public market.',
    initialPrompt: 'Maayong buntag, suki! Presko kaayo among mangga ug isda karon. Tagpila imong kuhaon?',
    suggestedGoal: 'Ask for the price per kilo, inspect freshness, and politely request a small discount.',
    recommendedCoachId: 'jen',
    supportedLanguages: ['cebuano', 'filipino'],
    usefulPhrases: [
      { phrase: 'Tagpila ang kilo sa mangga, Nang?', translation: 'How much is a kilo of mangoes, maam?', pronunciation: 'Tag-PEE-lah ang KEE-loh sah mang-GAH, nang?' },
      { phrase: 'Puyde hangyo gamay?', translation: 'Could you give a small discount?', pronunciation: 'Pwooy-deh HANG-yoh gah-MAY?' },
      { phrase: 'Tulo ka kilo akong kuhaon.', translation: 'I will take three kilos.', pronunciation: 'TOO-loh kah KEE-loh AH-kong koo-HAH-on.' }
    ]
  },

  // 2. Work and Career
  {
    id: 'bpo_mock_call',
    title: 'Mock BPO Interview & Call',
    category: 'work_career',
    categoryLabel: 'Work and Career',
    difficulty: 'Intermediate',
    description: 'Handle an American customer support scenario with empathy, active listening, and solution clarity.',
    initialPrompt: "Hello, thank you for calling TechSphere Global Support. I am calling because my internet service has been down since morning, and I have a remote meeting in 20 minutes!",
    suggestedGoal: 'Acknowledge the customer urgency, empathize, troubleshoot politely, and assure a resolution.',
    recommendedCoachId: 'adam',
    supportedLanguages: ['english'],
    usefulPhrases: [
      { phrase: 'I completely understand how frustrating that is, and I will resolve this immediately.', translation: 'Constructive empathy opener.', pronunciation: 'Clear professional cadence' },
      { phrase: 'May I verify your account number while I check line diagnostics?', translation: 'Polite verification question.', pronunciation: 'Natural customer service tone' }
    ]
  },
  {
    id: 'job_interview_practice',
    title: 'Job Interview Practice',
    category: 'work_career',
    categoryLabel: 'Work and Career',
    difficulty: 'Advanced',
    description: 'Practice behavioral interview questions using the STAR technique (Situation, Task, Action, Result).',
    initialPrompt: "Welcome to our interview session. Let's start: Can you tell me about a time you handled a difficult deadline and how you prioritized your work?",
    suggestedGoal: 'Structure your response with STAR framework, highlighting teamwork and problem-solving.',
    recommendedCoachId: 'adam',
    supportedLanguages: ['english', 'filipino'],
    usefulPhrases: [
      { phrase: 'In my previous project, we faced an unexpected dependency blocker...', translation: 'Situation statement.', pronunciation: 'Confident business articulation' },
      { phrase: 'My action was to reorganize the sprint backlog and coordinate daily with QA.', translation: 'Action statement.', pronunciation: 'Clear outcome-driven tone' }
    ]
  },
  {
    id: 'tech_standup_presentation',
    title: 'IT Standup & Tech Pitch',
    category: 'work_career',
    categoryLabel: 'Work and Career',
    difficulty: 'Intermediate',
    description: 'Deliver your daily developer update, explain an architectural blocker, and propose a clean fix.',
    initialPrompt: "Good morning team! Let's kick off our sprint standup. What did you finish yesterday, what are you working on today, and are there any blockers?",
    suggestedGoal: 'Provide a concise 3-part update: completed task, current focus, and clean blocker escalation.',
    recommendedCoachId: 'gentech',
    supportedLanguages: ['english', 'cebuano'],
    usefulPhrases: [
      { phrase: 'Yesterday I finished deploying the Supabase RLS policies and audit logger.', translation: 'Completed progress note.', pronunciation: 'Concise engineering delivery' },
      { phrase: 'Today I am hooking up the WebSocket speech streams to the client.', translation: 'Current work focus.', pronunciation: 'Clear and direct' }
    ]
  },

  // 3. Travel and Transportation
  {
    id: 'asking_directions',
    title: 'Asking for Directions',
    category: 'travel_transport',
    categoryLabel: 'Travel and Transportation',
    difficulty: 'Beginner',
    description: 'Navigate unfamiliar streets, locate terminals, and ask locals for landmarks.',
    initialPrompt: 'Kumusta! Naa bay akong ikatabang nimo? Murag nangita kag lugar dinhi dapit sa downtown.',
    suggestedGoal: 'Ask how to reach the central terminal and clarify distance and walking turns.',
    recommendedCoachId: 'jen',
    supportedLanguages: ['cebuano', 'filipino', 'english'],
    usefulPhrases: [
      { phrase: 'Asa dapit ang sakayan padulong sa Roxas Night Market?', translation: 'Where is the ride going to Roxas Night Market?', pronunciation: 'AH-sah DAH-pit ang sah-kah-YAN pah-DOO-long...' },
      { phrase: 'Layo pa ba kon baktason?', translation: 'Is it still far if walked?', pronunciation: 'LAH-yoh PAH bah kon bak-TAH-son?' },
      { phrase: 'Salamat kaayo sa pagtudlo, bay!', translation: 'Thank you very much for guiding, friend!', pronunciation: 'Sah-LAH-mat KAH-ah-yoh sah pag-TOOD-loh, bay!' }
    ]
  },

  // 4. Social Conversations
  {
    id: 'introducing_yourself',
    title: 'Introducing Yourself',
    category: 'social_conversations',
    categoryLabel: 'Social Conversations',
    difficulty: 'Beginner',
    description: 'Break the ice, share where you are from, and express enthusiasm for learning the local language.',
    initialPrompt: 'Halo! Nalipay ko nga nagkaila ta. Ako diay si Kevin. Taga-asa man ka ug unsay imong trabaho o gitun-an?',
    suggestedGoal: 'State your name, hometown, passion for language, and ask a return question.',
    recommendedCoachId: 'kevin',
    supportedLanguages: ['cebuano', 'filipino', 'english'],
    usefulPhrases: [
      { phrase: 'Ako diay si Genesis, taga-Davao ko.', translation: 'I am Genesis, from Davao.', pronunciation: 'Ah-KOH dee-AY see Genesis, tah-GAH Dah-vow koh.' },
      { phrase: 'Nalipay ko nga nagkaila ta!', translation: 'Nice to meet you!', pronunciation: 'Nah-lee-PAY koh ngah nag-kah-EE-lah tah!' },
      { phrase: 'Naningkamot ko nga magtuon og Bisaya.', translation: 'I am striving to learn Bisaya.', pronunciation: 'Nah-ning-kah-MOT koh ngah mag-TOO-on og Bisaya.' }
    ]
  },
  {
    id: 'meeting_new_friends',
    title: 'Meeting New Friends',
    category: 'social_conversations',
    categoryLabel: 'Social Conversations',
    difficulty: 'Beginner',
    description: 'Hang out with friendly peers, discuss favorite foods, weekend plans, and local spots.',
    initialPrompt: 'Uy! Nag-order na mi og halo-halo ug kape. Lingkod diri tupad namo! Unsay lingaw nimo karong weekend?',
    suggestedGoal: 'Join the group conversation, talk about weekend activities, and suggest a food spot.',
    recommendedCoachId: 'kevin',
    supportedLanguages: ['cebuano', 'filipino'],
    usefulPhrases: [
      { phrase: 'Salamat sa pagdapit! Walay kurat.', translation: 'Thanks for inviting! No pressure.', pronunciation: 'Sah-lah-mat sah pag-DAH-pit! Wah-LAY koo-RAT.' },
      { phrase: 'Ganahan kaayo ko mokaon og seafood.', translation: 'I really love eating seafood.', pronunciation: 'Gah-nah-HAN KAH-ah-yoh koh moh-KAH-on og seafood.' }
    ]
  },

  // 5. Bisaya / Cebuano Practice
  {
    id: 'everyday_bisaya_phrases',
    title: 'Practicing Everyday Bisaya',
    category: 'cebuano_practice',
    categoryLabel: 'Bisaya/Cebuano Practice',
    difficulty: 'Intermediate',
    description: 'Master authentic modal particles (bitaw, gud, lagi, man, ba) and polite everyday banter.',
    initialPrompt: 'Maayong adlaw! Magpraktis ta sa mga pulong nga pirmi madungog sa Visayas ug Mindanao. Andam ka na ba magkat-on og "bitaw" ug "gud"?',
    suggestedGoal: 'Construct 3 sentences using common Visayan conversational particles naturally.',
    recommendedCoachId: 'jen',
    supportedLanguages: ['cebuano'],
    usefulPhrases: [
      { phrase: 'Mao gyud bitaw! Sakto ka.', translation: 'That is truly it indeed! You are right.', pronunciation: 'Mah-oh GYUD bee-TAW! SAK-toh kah.' },
      { phrase: 'Karon pa gud ko kabalo.', translation: 'I only just found out now.', pronunciation: 'Kah-RON pah GUD koh kah-BAH-loh.' }
    ]
  },

  // 6. Filipino / Tagalog Practice
  {
    id: 'filipino_expressions_politeness',
    title: 'Practicing Filipino Expressions',
    category: 'filipino_practice',
    categoryLabel: 'Filipino/Tagalog Practice',
    difficulty: 'Beginner',
    description: 'Practice respectful Tagalog communication, polite markers (po / opo), and natural Manila phrasing.',
    initialPrompt: 'Magandang araw po! Ako si Mika. Nais mo bang magsanay ng tamang paggamit ng "po" at "opo" sa iba\'t ibang sitwasyon?',
    suggestedGoal: 'Respond politely with appropriate honorific markers in an everyday scenario.',
    recommendedCoachId: 'mika',
    supportedLanguages: ['filipino'],
    usefulPhrases: [
      { phrase: 'Maraming salamat po sa inyong tulong.', translation: 'Thank you very much for your help.', pronunciation: 'Mah-RAH-ming sah-LAH-mat poh sah in-YONG too-LONG.' },
      { phrase: 'Opo, handa na po ako magsimula.', translation: 'Yes, I am ready to begin.', pronunciation: 'OH-poh, han-DAH nah poh ah-KOH mag-see-MOO-lah.' }
    ]
  },

  // 7. English Communication
  {
    id: 'workplace_clarity_english',
    title: 'Workplace Clarity & Executive Speaking',
    category: 'english_communication',
    categoryLabel: 'English Communication',
    difficulty: 'Intermediate',
    description: 'Express opinions in meetings, disagree tactfully, and summarize next steps with confidence.',
    initialPrompt: "In our quarterly strategy sync, we need to decide between two vendor platforms. How would you pitch the more reliable option while staying within budget?",
    suggestedGoal: 'Present a structured recommendation with clear business justification and risk mitigation.',
    recommendedCoachId: 'gentech',
    supportedLanguages: ['english'],
    usefulPhrases: [
      { phrase: 'From a long-term scalability perspective, I recommend option A.', translation: 'Executive viewpoint statement.', pronunciation: 'Direct, clear delivery' },
      { phrase: 'To mitigate initial costs, we can phase the rollout over two sprints.', translation: 'Solution compromise note.', pronunciation: 'Strategic business tone' }
    ]
  },

  // 8. Grammar and Vocabulary
  {
    id: 'verb_inflections_grammar',
    title: 'Grammar and Sentence Structure Clinic',
    category: 'grammar_vocabulary',
    categoryLabel: 'Grammar and Vocabulary',
    difficulty: 'Intermediate',
    description: 'Learn focus inflections (mo-, nag-, gi-, ma-) and sentence word order in Philippine languages.',
    initialPrompt: 'Kumusta! Niining sesyon, atong tun-an kon kanus-a gamiton ang "nagkaon" (past/continuous) batok sa "mokaon" (future/infinitive). Unsay gusto nimong ehemplo?',
    suggestedGoal: 'Demonstrate understanding of actor vs object focus verb prefixes.',
    recommendedCoachId: 'jen',
    supportedLanguages: ['cebuano', 'filipino'],
    usefulPhrases: [
      { phrase: 'Nagkaon ko og saging ganina.', translation: 'I ate a banana earlier.', pronunciation: 'Nag-KAH-on koh og sah-GING gah-NEE-nah.' },
      { phrase: 'Mokaon ko unya inig uli nako.', translation: 'I will eat later when I get home.', pronunciation: 'Moh-KAH-on koh OON-yah ee-nig OO-lee NAH-koh.' }
    ]
  }
];

export function getScenarioById(id: string): ChatScenario | undefined {
  return CHAT_SCENARIOS.find((s) => s.id === id);
}
