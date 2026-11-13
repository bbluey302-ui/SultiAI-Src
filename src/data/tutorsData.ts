export type TutorLanguage = 'cebuano' | 'filipino' | 'both';
export type TutorApplicationStatus = 'approved' | 'pending_review' | 'rejected';

export interface Tutor {
  id: string;
  name: string;
  title: string;
  location: string;
  language: TutorLanguage;
  languageLabel: string;
  dialectTags: string[];
  hourlyRatePhp: number;
  rating: number;
  reviewCount: number;
  experienceYears: number;
  totalStudents: number;
  linkedinUrl: string;
  bio: string;
  bioBisaya?: string;
  specialties: string[];
  availability: string;
  featured?: boolean;
  avatarInitials: string;
  /** Status in the review pipeline - Only 'approved' tutors appear in the public directory */
  status: TutorApplicationStatus;
  /** SultiAI academic vetting badge (NOT a claim of official LinkedIn verification) */
  academicVetted: boolean;
  isUserApplicant?: boolean;
  submittedAt?: string;
  approvedAt?: string;
  reviewedBy?: string;
  reviewNotes?: string;
}

export const INITIAL_TUTORS: Tutor[] = [
  {
    id: 'tutor-thea-yap',
    name: 'Ma. Theresa "Thea" Yap, LPT',
    title: 'Licensed Cebuano & Bisaya Language Coach',
    location: 'Cebu City, Central Visayas',
    language: 'cebuano',
    languageLabel: 'Cebuano / Bisaya',
    dialectTags: ['Urban Cebuano', 'Everyday Sinugboanon', 'Accent Neutralization'],
    hourlyRatePhp: 400,
    rating: 4.98,
    reviewCount: 142,
    experienceYears: 6,
    totalStudents: 320,
    linkedinUrl: 'https://www.linkedin.com/in/thea-yap-cebuano-tutor',
    bio: 'Licensed Professional Teacher and native Cebuana. Specializes in helping expats, balikbayans, and beginners speak natural Cebuano with proper pitch and conversational rhythm.',
    bioBisaya: 'Natawo ug nagdako sa Sugbo. Gitutokan nako ang tinuod nga adlaw-adlaw nga Sinugboanon para dali ka makasabot ug makatubag.',
    specialties: ['Natural Conversation', 'Pronunciation & Pitch', 'Palengke & Commuting Practice', 'Expat Immersion'],
    availability: 'Available Today · Morning & Evening slots',
    featured: true,
    avatarInitials: 'TY',
    status: 'approved',
    academicVetted: true,
    approvedAt: '2026-09-15T08:00:00Z',
    reviewedBy: 'SultiAI Academic Panel',
  },
  {
    id: 'tutor-dan-ramos',
    name: 'Prof. Danilo "Dan" Ramos, MA',
    title: 'Filipino & Tagalog Linguistics Specialist',
    location: 'Quezon City, Metro Manila',
    language: 'filipino',
    languageLabel: 'Filipino / Tagalog',
    dialectTags: ['Manila Tagalog', 'Formal & Academic', 'Everyday Conversational'],
    hourlyRatePhp: 450,
    rating: 4.96,
    reviewCount: 186,
    experienceYears: 8,
    totalStudents: 410,
    linkedinUrl: 'https://www.linkedin.com/in/danilo-ramos-filipino-linguist',
    bio: 'UP Diliman Filipino language instructor. Focuses on conversational ease, grammatical clarity, and building real-world vocabulary for corporate professionals and travelers.',
    bioBisaya: 'Eksperto sa Tagalog ug Filipino sentence construction. Sayon ra sundon ug praktikal ang matag sesyon.',
    specialties: ['Conversational Filipino', 'Sentence Structure & Grammar', 'Business Tagalog', 'Heritage Learners'],
    availability: 'Available Tomorrow · Flexible schedule',
    featured: true,
    avatarInitials: 'DR',
    status: 'approved',
    academicVetted: true,
    approvedAt: '2026-09-16T10:30:00Z',
    reviewedBy: 'SultiAI Academic Panel',
  },
  {
    id: 'tutor-kenjie-alcantara',
    name: 'Kenjie "Ken" Alcantara',
    title: 'Bilingual Bisaya & Tagalog Conversation Mentor',
    location: 'Davao City, Mindanao',
    language: 'both',
    languageLabel: 'Bilingual (Bisaya & Filipino)',
    dialectTags: ['Davao Bisaya', 'Mindanao Slang', 'TagBis Code-switching'],
    hourlyRatePhp: 350,
    rating: 4.93,
    reviewCount: 98,
    experienceYears: 4,
    totalStudents: 230,
    linkedinUrl: 'https://www.linkedin.com/in/kenjie-alcantara-davao-tutor',
    bio: 'Mindanao native fluent in both Southern Bisaya and conversational Filipino. Great for learners moving to Davao or wanting to understand Filipino and Bisaya nuances side-by-side.',
    bioBisaya: 'Taga-Davao nga hanas sa Bisaya ug Tagalog. Mokat-on ta pinaagi sa tinuod nga istoryahay sa komunidad.',
    specialties: ['Davao Bisaya Nuances', 'Filipino-Bisaya Code Switch', 'Street Smarts & Slang', 'Friendly Q&A'],
    availability: 'Available Today · Afternoon slots',
    featured: true,
    avatarInitials: 'KA',
    status: 'approved',
    academicVetted: true,
    approvedAt: '2026-09-18T14:00:00Z',
    reviewedBy: 'SultiAI Academic Panel',
  },
  {
    id: 'tutor-carmela-canete',
    name: 'Carmela "Mel" Cañete',
    title: 'Visayan Dialects & Cultural Communication Coach',
    location: 'Tagbilaran, Bohol / Dumaguete',
    language: 'cebuano',
    languageLabel: 'Cebuano / Bisaya',
    dialectTags: ['Boholano Dialect', 'Gentle Cebuano', 'Zero-Beginner Friendly'],
    hourlyRatePhp: 380,
    rating: 4.97,
    reviewCount: 114,
    experienceYears: 5,
    totalStudents: 275,
    linkedinUrl: 'https://www.linkedin.com/in/carmela-canete-bisaya-coach',
    bio: 'Patient and encouraging coach specializing in zero-level beginners. Learn how to speak Bisaya without feeling shy or self-conscious.',
    bioBisaya: 'Mapailubon kaayo sa mga bag-o pa lang nagkat-on. Dili ka maikog o mahadlok masayop.',
    specialties: ['Zero-Beginner Warmup', 'Everyday Greetings', 'Boholano Intonation', 'Travel Survival'],
    availability: 'Available weekends & evenings',
    featured: false,
    avatarInitials: 'MC',
    status: 'approved',
    academicVetted: true,
    approvedAt: '2026-09-20T09:15:00Z',
    reviewedBy: 'SultiAI Academic Panel',
  },
  {
    id: 'tutor-janine-santos',
    name: 'Janine "Nina" Santos',
    title: 'Modern Tagalog & Accent Reduction Coach',
    location: 'Makati City, Metro Manila',
    language: 'filipino',
    languageLabel: 'Filipino / Tagalog',
    dialectTags: ['Metro Manila Tagalog', 'Modern Slang', 'Speech Flow'],
    hourlyRatePhp: 480,
    rating: 4.95,
    reviewCount: 130,
    experienceYears: 5,
    totalStudents: 310,
    linkedinUrl: 'https://www.linkedin.com/in/janine-santos-tagalog-coach',
    bio: 'Modern communication trainer. Focuses on speaking Tagalog naturally like a local friend, getting rid of textbook awkwardness.',
    bioBisaya: 'Gitudlo ang tinuod nga paagi sa pag-istorya sa Tagalog nga natural paminawon.',
    specialties: ['Natural Slang & Idioms', 'Pronunciation Tuning', 'Confidence Building', 'Mock Conversations'],
    availability: 'Available Weekdays · Flexible',
    featured: false,
    avatarInitials: 'JS',
    status: 'approved',
    academicVetted: true,
    approvedAt: '2026-09-21T11:45:00Z',
    reviewedBy: 'SultiAI Academic Panel',
  },
  {
    id: 'tutor-rodrigo-tan',
    name: 'Rodrigo "Digong" Tan',
    title: 'Northern Mindanao Bisaya & Market Negotiation',
    location: 'Cagayan de Oro City, Misamis Oriental',
    language: 'cebuano',
    languageLabel: 'Cebuano / Bisaya',
    dialectTags: ['CDO Bisaya', 'Business & Trade', 'Practical Negotiation'],
    hourlyRatePhp: 360,
    rating: 4.91,
    reviewCount: 82,
    experienceYears: 4,
    totalStudents: 190,
    linkedinUrl: 'https://www.linkedin.com/in/rodrigo-tan-bisaya-coach',
    bio: 'Practical language trainer emphasizing real-world usage in commerce, markets, and business setups in Northern Mindanao.',
    bioBisaya: 'Praktikal nga Bisaya para sa negosyo, transaksyon sa merkado, ug pakighilambigit sa mga lokal.',
    specialties: ['Market Haggling', 'CDO & Northern Dialects', 'Business Interaction', 'Survival Phrases'],
    availability: 'Available Evenings',
    featured: false,
    avatarInitials: 'RT',
    status: 'approved',
    academicVetted: true,
    approvedAt: '2026-09-22T16:20:00Z',
    reviewedBy: 'SultiAI Academic Panel',
  }
];

const LOCAL_STORAGE_CUSTOM_TUTORS_KEY = 'sulti_custom_tutors_v2';
const LOCAL_STORAGE_BOOKINGS_KEY = 'sulti_tutor_bookings_v2';

/**
 * Returns all tutors stored in the system (including pending and rejected for admin).
 */
export function getAllTutors(): Tutor[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_CUSTOM_TUTORS_KEY);
    if (!raw) return INITIAL_TUTORS;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      const customTutors: Tutor[] = parsed;
      // Combine custom with initial, without duplicating IDs
      const combined = [...customTutors];
      INITIAL_TUTORS.forEach(init => {
        if (!combined.some(c => c.id === init.id)) {
          combined.push(init);
        }
      });
      return combined;
    }
  } catch (err) {
    console.error('Failed to load all tutors:', err);
  }
  return INITIAL_TUTORS;
}

/**
 * Returns ONLY 'approved' tutors for the public Learner directory.
 * CRITICAL: Pending applicants NEVER appear here until admin reviews and approves!
 */
export function getApprovedTutors(): Tutor[] {
  const all = getAllTutors();
  return all.filter(t => t.status === 'approved');
}

/**
 * Returns any applications submitted by the current learner/session.
 */
export function getUserApplications(): Tutor[] {
  const all = getAllTutors();
  return all.filter(t => t.isUserApplicant);
}

/**
 * Saves a new tutor applicant in 'pending_review' status.
 * CRITICAL: Does NOT automatically publish! Requires Admin approval.
 */
export function submitTutorApplication(applicant: {
  name: string;
  title: string;
  location: string;
  language: TutorLanguage;
  languageLabel: string;
  dialectTags: string[];
  hourlyRatePhp: number;
  experienceYears: number;
  linkedinUrl: string;
  bio: string;
  specialties: string[];
  availability: string;
}): Tutor {
  const all = getAllTutors();
  const initials = applicant.name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(p => p[0].toUpperCase())
    .join('') || 'TU';

  const newApplicant: Tutor = {
    ...applicant,
    id: `applicant-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    rating: 5.0,
    reviewCount: 0,
    totalStudents: 0,
    status: 'pending_review', // STRICT: Pending admin review
    academicVetted: false,
    avatarInitials: initials,
    isUserApplicant: true,
    submittedAt: new Date().toISOString(),
  };

  try {
    const customOnly = all.filter(t => t.id.startsWith('applicant-'));
    const updated = [newApplicant, ...customOnly];
    localStorage.setItem(LOCAL_STORAGE_CUSTOM_TUTORS_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to save tutor applicant:', err);
  }

  return newApplicant;
}

/**
 * Admin action: Approve a tutor applicant.
 */
export function approveTutorApplication(tutorId: string, reviewerName = 'Admin', notes = 'Approved after credentials verification'): boolean {
  try {
    const all = getAllTutors();
    const updated = all.map(t => {
      if (t.id === tutorId) {
        return {
          ...t,
          status: 'approved' as TutorApplicationStatus,
          academicVetted: true,
          approvedAt: new Date().toISOString(),
          reviewedBy: reviewerName,
          reviewNotes: notes,
        };
      }
      return t;
    });

    const customOnly = updated.filter(t => t.id.startsWith('applicant-'));
    localStorage.setItem(LOCAL_STORAGE_CUSTOM_TUTORS_KEY, JSON.stringify(customOnly));
    return true;
  } catch (err) {
    console.error('Failed to approve tutor:', err);
    return false;
  }
}

/**
 * Admin action: Reject a tutor applicant with notes.
 */
export function rejectTutorApplication(tutorId: string, reviewerName = 'Admin', reason = 'Incomplete credentials or requirements'): boolean {
  try {
    const all = getAllTutors();
    const updated = all.map(t => {
      if (t.id === tutorId) {
        return {
          ...t,
          status: 'rejected' as TutorApplicationStatus,
          academicVetted: false,
          reviewedBy: reviewerName,
          reviewNotes: reason,
        };
      }
      return t;
    });

    const customOnly = updated.filter(t => t.id.startsWith('applicant-'));
    localStorage.setItem(LOCAL_STORAGE_CUSTOM_TUTORS_KEY, JSON.stringify(customOnly));
    return true;
  } catch (err) {
    console.error('Failed to reject tutor:', err);
    return false;
  }
}

/**
 * Seed a demo applicant for immediate testing in the Admin panel if none exists.
 */
export function seedDemoApplicantIfNeeded(): Tutor | null {
  const all = getAllTutors();
  const hasPending = all.some(t => t.status === 'pending_review');
  if (hasPending) return null;

  return submitTutorApplication({
    name: 'Jaymark "Mark" Villacin, LPT',
    title: 'Visayan Language Instructor & Cultural Historian',
    location: 'Mandaue City, Cebu',
    language: 'cebuano',
    languageLabel: 'Cebuano / Bisaya',
    dialectTags: ['Conversational Cebuano', 'Cebuano Grammar', 'Accent Coach'],
    hourlyRatePhp: 380,
    experienceYears: 4,
    linkedinUrl: 'https://www.linkedin.com/in/jaymark-villacin-educator',
    bio: 'Secondary school teacher with 4 years experience conducting Bisaya language drills for foreign exchange students and Cebu relocators.',
    specialties: ['Beginner Fundamentals', 'Conversational Confidence', 'Cebuano History'],
    availability: 'Available Weekday Mornings & Evenings',
  });
}

export interface TutorBooking {
  id: string;
  tutorId: string;
  tutorName: string;
  tutorLinkedin: string;
  learnerName: string;
  learnerContact: string;
  learnerLinkedin?: string;
  topic: string;
  preferredTime: string;
  sessionMinutes: number;
  ratePhp: number;
  platformFeePhp: number;
  tutorPayoutPhp: number;
  bookingType: 'sulti_platform' | 'external_linkedin_inquiry';
  notes: string;
  createdAt: string;
  status: 'pending' | 'confirmed';
}

export function saveTutorBooking(booking: Omit<TutorBooking, 'id' | 'createdAt' | 'status'>): TutorBooking {
  const newBooking: TutorBooking = {
    ...booking,
    id: `book-${Date.now()}`,
    createdAt: new Date().toISOString(),
    status: 'pending',
  };

  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_BOOKINGS_KEY);
    const current: TutorBooking[] = raw ? JSON.parse(raw) : [];
    localStorage.setItem(LOCAL_STORAGE_BOOKINGS_KEY, JSON.stringify([newBooking, ...current]));
  } catch (err) {
    console.error('Failed to save booking:', err);
  }

  return newBooking;
}

export function getStoredBookings(): TutorBooking[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_BOOKINGS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
