export type CourseLanguageCategory = 'cebuano' | 'filipino' | 'english';

export interface CourseRoadmapStep {
  id: string;
  stepNumber: string;
  title: string;
  titleBisaya: string;
  description: string;
  lessonsCount: number;
  moduleId?: string;
  isAssessment?: boolean;
  isCertificate?: boolean;
}

export interface CourseData {
  id: string;
  languageCategory: CourseLanguageCategory;
  title: string;
  titleBisaya: string;
  subtitle: string;
  description: string;
  level: 'Beginner' | 'Elementary' | 'Intermediate' | 'Advanced';
  tag: string;
  accentColor: string;
  progressPercent: number;
  totalLessons: number;
  completedLessonsCount: number;
  estimatedHours: string;
  roadmapSteps: CourseRoadmapStep[];
}

export const COURSES: CourseData[] = [
  // ---------------------------------------------------------------------------
  // 1. CEBUANO / BISAYA COURSES
  // ---------------------------------------------------------------------------
  {
    id: 'course_beginner',
    languageCategory: 'cebuano',
    title: 'Beginner Bisaya',
    titleBisaya: 'Panugod nga Bisaya',
    subtitle: 'Build your confidence in everyday Cebuano & Davao Bisaya.',
    description: 'Master essential greetings, polite forms of address, asking for help, and basic questions with confidence.',
    level: 'Beginner',
    tag: 'Core Foundation',
    accentColor: 'teal',
    progressPercent: 72,
    totalLessons: 10,
    completedLessonsCount: 7,
    estimatedHours: '4.5 hrs',
    roadmapSteps: [
      {
        id: 'step_beg_1',
        stepNumber: '01',
        title: 'Foundations & Greetings',
        titleBisaya: 'Mga Pangumusta ug Pamatasan',
        description: 'Morning, afternoon, and evening greetings, asking "Kumusta ka?", and respectful polite address.',
        lessonsCount: 2,
        moduleId: 'mod_1',
      },
      {
        id: 'step_beg_2',
        stepNumber: '02',
        title: 'Everyday Life & Commute',
        titleBisaya: 'Sakay sa Jeepney ug Pagbiyahe',
        description: 'Passing fares inside jeepneys, saying "Lugar lang!", asking fare prices, and basic directions.',
        lessonsCount: 2,
        moduleId: 'mod_2',
      },
      {
        id: 'step_beg_3',
        stepNumber: '03',
        title: 'Real Conversations & Market',
        titleBisaya: 'Pamalit sa Merkado ug Carenderia',
        description: 'Inquiring about fruit prices, polite "Hangyo" bargaining etiquette, and ordering rice & viands.',
        lessonsCount: 2,
        moduleId: 'mod_3',
      },
      {
        id: 'step_beg_4',
        stepNumber: '04',
        title: 'Real-World Situations & Directions',
        titleBisaya: 'Pangutana sa Dalan ug Lokasyon',
        description: 'Asking where landmarks, banks, and passenger terminals are located without getting lost.',
        lessonsCount: 2,
      },
      {
        id: 'step_beg_5',
        stepNumber: '05',
        title: 'Speaking Challenge with SULTI',
        titleBisaya: 'Pagsulay sa Pagsulti Kauban ang AI',
        description: 'Continuous dialogue practice evaluated by Whisper speech recognition.',
        lessonsCount: 2,
      },
      {
        id: 'step_beg_eval',
        stepNumber: '06',
        title: 'Final Assessment',
        titleBisaya: 'Katapusang Pagsusi sa Kaabtik',
        description: 'Comprehensive oral comprehension test to evaluate pronunciation concordance and vocabulary recall.',
        lessonsCount: 1,
        isAssessment: true,
      },
      {
        id: 'step_beg_cert',
        stepNumber: '07',
        title: 'Certificate of Fluency',
        titleBisaya: 'Sertipiko sa Pagkahanas',
        description: 'Official SultiAI Beginner Bisaya Credential accredited with speech concordance metrics.',
        lessonsCount: 0,
        isCertificate: true,
      },
    ],
  },
  {
    id: 'course_everyday',
    languageCategory: 'cebuano',
    title: 'Everyday Bisaya',
    titleBisaya: 'Adlaw-Adlaw nga Bisaya',
    subtitle: 'Practical Visayas & Mindanao daily interactions.',
    description: 'Handle wet markets, pharmacy inquiries, clinic visits, transportation transfers, and friendly neighborhood chitchat.',
    level: 'Elementary',
    tag: 'Survival Fluency',
    accentColor: 'amber',
    progressPercent: 25,
    totalLessons: 12,
    completedLessonsCount: 3,
    estimatedHours: '6.0 hrs',
    roadmapSteps: [
      {
        id: 'step_eve_1',
        stepNumber: '01',
        title: 'Bankerohan Market Bargaining',
        titleBisaya: 'Diskwento sa Merkado Publiko',
        description: 'Bargaining for fish, vegetables, and fruit per kilo with native vendor jargon.',
        lessonsCount: 2,
      },
      {
        id: 'step_eve_2',
        stepNumber: '02',
        title: 'Carenderia & Local Dining',
        titleBisaya: 'Kaon sa Carenderia ug Kapehan',
        description: 'Ordering "sud-an", asking for extra soup ("sabaw"), and settling bills ("pila tanan?").',
        lessonsCount: 2,
      },
      {
        id: 'step_eve_3',
        stepNumber: '03',
        title: 'Habal-habal & Tricycle Routes',
        titleBisaya: 'Pasahe sa Tricycle ug Habal-habal',
        description: 'Negotiating special trips, clarifying landmarks, and asking for safe speeds.',
        lessonsCount: 2,
      },
      {
        id: 'step_eve_4',
        stepNumber: '04',
        title: 'Pharmacy & Health Symptoms',
        titleBisaya: 'Palit Tambal ug Sakit sa Lawas',
        description: 'Explaining headaches, fever, stomach aches, and dosage inquiries in Visayan terms.',
        lessonsCount: 2,
      },
      {
        id: 'step_eve_5',
        stepNumber: '05',
        title: 'Community & Neighborly Chit-Chat',
        titleBisaya: 'Pakighinabi sa mga Silingan',
        description: 'Friendly neighborhood banter, weather commentary, and communal celebrations.',
        lessonsCount: 2,
      },
      {
        id: 'step_eve_eval',
        stepNumber: '06',
        title: 'Everyday Situational Assessment',
        titleBisaya: 'Pagsusi sa Adlaw-adlaw nga Kahanas',
        description: 'Evaluate practical problem solving in simulated Mindanao scenarios.',
        lessonsCount: 1,
        isAssessment: true,
      },
      {
        id: 'step_eve_cert',
        stepNumber: '07',
        title: 'Everyday Bisaya Certificate',
        titleBisaya: 'Sertipiko sa Adlaw-adlaw nga Bisaya',
        description: 'Demonstrated communicative autonomy across everyday social situations.',
        lessonsCount: 0,
        isCertificate: true,
      },
    ],
  },
  {
    id: 'course_conversational',
    languageCategory: 'cebuano',
    title: 'Conversational Bisaya',
    titleBisaya: 'Madasigong Panagsulti',
    subtitle: 'Expressive discourse particles, humor & colloquial banter.',
    description: 'Sound like a genuine local using emotive particles (gud, bitaw, diay, ba, man, kuno), jokes, storytelling, and Mindanao colloquial flow.',
    level: 'Intermediate',
    tag: 'Native Nuance',
    accentColor: 'indigo',
    progressPercent: 10,
    totalLessons: 14,
    completedLessonsCount: 1,
    estimatedHours: '7.5 hrs',
    roadmapSteps: [
      {
        id: 'step_con_1',
        stepNumber: '01',
        title: 'Expressive Particles: Gud, Bitaw, Diay',
        titleBisaya: 'Paggamit sa Gud, Bitaw, ug Diay',
        description: 'Express agreement ("Bitaw no!"), surprise ("Mao diay!"), and emphasis ("Ngano gud?").',
        lessonsCount: 2,
      },
      {
        id: 'step_con_2',
        stepNumber: '02',
        title: 'Clarification Particles: Ba, Man, Kuno',
        titleBisaya: 'Pagklaro: Ba, Man, ug Kuno',
        description: 'Soften inquiries and report hearsay without appearing blunt or demanding.',
        lessonsCount: 2,
      },
      {
        id: 'step_con_3',
        stepNumber: '03',
        title: 'Storytelling & Humor (Tabi-tabi)',
        titleBisaya: 'Pagsugilon ug Pagpakatawa',
        description: 'Narrating recent trips, shared memories, and teasing friends courteously.',
        lessonsCount: 2,
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // 2. FILIPINO / TAGALOG COURSES
  // ---------------------------------------------------------------------------
  {
    id: 'course_filipino_foundations',
    languageCategory: 'filipino',
    title: 'Beginner Filipino',
    titleBisaya: 'Panimulang Filipino',
    subtitle: 'Build confidence in standard Filipino & Tagalog expressions.',
    description: 'Master respectful greetings (po / opo), introducing yourself, simple questions, and everyday Metro Manila communication.',
    level: 'Beginner',
    tag: 'Core Foundation',
    accentColor: 'rose',
    progressPercent: 30,
    totalLessons: 10,
    completedLessonsCount: 3,
    estimatedHours: '4.5 hrs',
    roadmapSteps: [
      {
        id: 'step_fil_1',
        stepNumber: '01',
        title: 'Magagalang na Pagbati (Po & Opo)',
        titleBisaya: 'Magagalang na Pagbati',
        description: 'Morning, noon, and evening greetings with respectful honorifics.',
        lessonsCount: 2,
      },
      {
        id: 'step_fil_2',
        stepNumber: '02',
        title: 'Pagsakay sa Jeep at MRT',
        titleBisaya: 'Sakay sa Jeep at Tren',
        description: 'Passing fares ("Makikisuyo po"), calling stops ("Para po!"), and asking train routes.',
        lessonsCount: 2,
      },
      {
        id: 'step_fil_3',
        stepNumber: '03',
        title: 'Pamilihan at Pagtawad',
        titleBisaya: 'Pamimili sa Palengke',
        description: 'Asking prices ("Magkano po?"), bargaining courteously ("Pwede pong tumawad?").',
        lessonsCount: 2,
      },
      {
        id: 'step_fil_eval',
        stepNumber: '04',
        title: 'Pagsusulit sa Filipino',
        titleBisaya: 'Pagsusulit sa Kasanayan',
        description: 'Comprehensive evaluation of spoken Filipino politeness and vocabulary.',
        lessonsCount: 1,
        isAssessment: true,
      },
      {
        id: 'step_fil_cert',
        stepNumber: '05',
        title: 'Sertipiko sa Wikang Filipino',
        titleBisaya: 'Sertipiko sa Filipino',
        description: 'Certified beginner fluency in conversational Filipino.',
        lessonsCount: 0,
        isCertificate: true,
      },
    ],
  },
  {
    id: 'course_filipino_everyday',
    languageCategory: 'filipino',
    title: 'Everyday Filipino',
    titleBisaya: 'Pang-araw-araw na Filipino',
    subtitle: 'Fluid conversations, street directions, dining, and culture.',
    description: 'Order food, ask directions, navigate emergency needs, and converse with colleagues comfortably.',
    level: 'Elementary',
    tag: 'Survival Fluency',
    accentColor: 'purple',
    progressPercent: 15,
    totalLessons: 12,
    completedLessonsCount: 1,
    estimatedHours: '6.0 hrs',
    roadmapSteps: [
      {
        id: 'step_fil_eve_1',
        stepNumber: '01',
        title: 'Kainan at Karinderya',
        titleBisaya: 'Kainan at Pag-order',
        description: 'Ordering rice, viands, extra broth, and paying restaurant bills.',
        lessonsCount: 2,
      },
      {
        id: 'step_fil_eve_2',
        stepNumber: '02',
        title: 'Direksyon at Kalye',
        titleBisaya: 'Pagtatanong ng Daan',
        description: 'Navigating Metro Manila and provincial streets with confidence.',
        lessonsCount: 2,
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // 3. ENGLISH FOR FILIPINOS & REGIONAL LEARNERS
  // ---------------------------------------------------------------------------
  {
    id: 'course_english_fluency',
    languageCategory: 'english',
    title: 'English Fluency & Communication',
    titleBisaya: 'Pagsulti sa Iningles',
    subtitle: 'Conversational, workplace & academic English fluency.',
    description: 'Clear pronunciation, stress-timed rhythm, workplace discussions, and international everyday conversation.',
    level: 'Intermediate',
    tag: 'English Mastery',
    accentColor: 'blue',
    progressPercent: 40,
    totalLessons: 10,
    completedLessonsCount: 4,
    estimatedHours: '5.0 hrs',
    roadmapSteps: [
      {
        id: 'step_eng_1',
        stepNumber: '01',
        title: 'Clear Articulation & Vowels',
        titleBisaya: 'Klarong Pagsulti sa Iningles',
        description: 'Master vowel contrasts and consonant clusters without hesitation.',
        lessonsCount: 2,
      },
      {
        id: 'step_eng_2',
        stepNumber: '02',
        title: 'Workplace & Meeting Dialogue',
        titleBisaya: 'Panag-istorya sa Trabaho',
        description: 'Polite collaboration, asking questions, and pitching ideas.',
        lessonsCount: 2,
      },
    ],
  },
];
