export type TargetDialect = 'cebuano_standard' | 'davao_bisaya' | 'boholano';

export type MajorLanguageId = 'cebuano' | 'filipino' | 'english';

export type ChallengeType = 
  | 'lesson' 
  | 'vocabulary' 
  | 'listening' 
  | 'voice' 
  | 'scenario' 
  | 'pronunciation' 
  | 'grammar' 
  | 'writing'
  | 'reading'
  | 'sulti_switch'
  | 'culture' 
  | 'review'
  | 'challenge' 
  | 'assessment';

export interface JourneyChallenge {
  id: string;
  orderNumber: string;
  title: string;
  titleNative?: string;
  description: string;
  type: ChallengeType;
  toolkitModuleId: string;
  xpReward: number;
  estimatedMinutes: number;
  targetPhrases?: { native: string; english: string; phonetics?: string }[];
  activities?: Activity[];
}

export interface LevelMasteryRequirement {
  id: string;
  label: string;
  targetCount: number;
  currentCount: number;
  completed: boolean;
  type: 'lessons' | 'score' | 'vocab' | 'speaking' | 'streak';
}

export interface JourneyLevel {
  id: string;
  levelNumber: number;
  code: string;
  title: string;
  subtitle: string;
  icon: string;
  accentColor: string;
  targetXp: number;
  rewardBadgeId: string;
  challenges: JourneyChallenge[];
  unlockRequirements: LevelMasteryRequirement[];
}

export interface LanguagePathData {
  id: MajorLanguageId;
  name: string;
  nativeName: string;
  flag: string;
  tagline: string;
  description: string;
  levels: JourneyLevel[];
}

export interface LearnerBadge {
  id: string;
  title: string;
  icon: string;
  description: string;
  criteria: string;
  unlocked: boolean;
  unlockedDate?: string;
  progressPercent: number;
  category: 'milestone' | 'skill' | 'streak' | 'mastery';
}

/**
 * Server-owned badge state. The catalog in `MASTER_BADGES` supplies presentation
 * only; `earnedAt` and `progressPercent` must come from the learner API.
 */
export interface LearnerBadgeState {
  id: string;
  earnedAt: string | null;
  progressPercent: number;
}

export interface LearnerCertificateState {
  eligible: boolean;
  language: MajorLanguageId;
  code: string | null;
  issuedAt: string | null;
  completedChallenges: number;
  totalChallenges: number;
  averageScore: number | null;
}

export interface LearnerProgressSnapshot {
  completedLessons: string[];
  xp: number;
  xpByLanguage: Record<MajorLanguageId, number>;
  streakDays: number;
  completedCount: number;
  badges: LearnerBadgeState[];
  certificate: LearnerCertificateState;
}

export interface LessonCompletionResult {
  success: true;
  alreadyCompleted: boolean;
  lessonId: string;
  xpAwarded: number;
  score: number | null;
  progress: LearnerProgressSnapshot;
}

export interface DayActivity {
  id: string;
  date: string;
  dayOfWeek: string;
  dayBisaya: string;
  dayNumber: number;
  minutes: number;
  goalMinutes: number;
  goalMet: boolean;
  xpEarned: number;
  lessonsCompleted: number;
  isToday?: boolean;
}

export interface ContinueLearningActivity {
  id: string;
  lessonId: string;
  title: string;
  titleBisaya?: string;
  description?: string;
  type: 'voice' | 'lesson' | 'flashcards' | 'roleplay';
  categoryLabel: string;
  level: string;
  progressPercent: number;
  estimatedMinutes: number;
  xpReward: number;
}

export interface SultiRecommendation {
  id: string;
  title: string;
  rationale: string;
  targetPhrase: string;
  targetPhraseEnglish: string;
  contextScenario: string;
  actionPrompt: string;
  scenarioId?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar: string;
  targetDialect: TargetDialect;
  dailyGoalMinutes: number;
  todayMinutes: number;
  xp: number;
  /** Server-derived XP per language journey. */
  xpByLanguage?: Record<MajorLanguageId, number>;
  streakDays: number;
  level: string;
  gems?: number;
  hearts?: number;
  maxHearts?: number;
  streakFreezesAvailable?: number;
  weeklyActivity?: DayActivity[];
  completedLessons: string[];
  vocabularyMastered: number;
  speechScoreAverage: number;
  joinedDate: string;
  authProvider?: 'google' | 'email';
}

export type ActivityType = 
  | 'flashcard' 
  | 'multiple_choice' 
  | 'pronunciation_drill' 
  | 'sentence_assembly'
  | 'dialogue_prompt';

export interface Activity {
  id: string;
  type: ActivityType;
  prompt: string;
  promptBisaya?: string;
  phonetics?: string;
  options?: string[];
  correctAnswer?: string | number;
  explanation?: string;
  audioKey?: string;
  culturalNote?: string;
}

export interface Lesson {
  id: string;
  moduleId: string;
  title: string;
  titleBisaya: string;
  description: string;
  level: 'Beginner' | 'Elementary' | 'Intermediate';
  xpReward: number;
  estimatedMinutes: number;
  completed?: boolean;
  score?: number;
  activities: Activity[];
}

export interface Module {
  id: string;
  title: string;
  titleBisaya: string;
  description: string;
  icon: string;
  accentColor: string;
  lessons: Lesson[];
}

export interface BertNlpAnalysis {
  predictedIntent: string;
  intentConfidence: number;
  detectedLanguage: string;
  languageConfidence: number;
  sentiment: 'Polite' | 'Casual' | 'Inquiring' | 'Hesitant' | 'Formal';
  sentimentScore: number;
  keyTokens: { token: string; weight: number }[];
  bertModelRef: string; // "mBERT-cased-finetuned-cebuano" / "RoBERTa-Tagalog-Bisaya-Intent"
  latencyMs: number;
}

export interface SpeechAnalysis {
  transcription: string;
  confidence: number;
  accuracyScore: number;
  whisperWer: number; // Word Error Rate
  phonemeFeedback?: string;
  syllableBreakdown?: string[];
}

export interface SultiMessage {
  id: string;
  sender: 'user' | 'sulti';
  text: string;
  translation?: string;
  phoneticGuide?: string;
  timestamp: string;
  isAudio?: boolean;
  bertAnalysis?: BertNlpAnalysis;
  speechAnalysis?: SpeechAnalysis;
  suggestedReplies?: string[];
  culturalTip?: string;
  vocabularyBreakdown?: { bisaya: string; english: string; pos: string }[];
  grammarCorrection?: string;
  groundingType?: 'search' | 'maps';
  searchSources?: { uri: string; title: string }[];
  mapsLinks?: { uri: string; title: string }[];
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'music';
}

export interface RoleplayScenario {
  id: string;
  title: string;
  titleBisaya: string;
  context: string;
  location: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  initialPrompt: string;
  suggestedGoal: string;
  imagePromptUrl?: string;
  usefulPhrases: { bisaya: string; english: string }[];
}

export interface CommunityComment {
  id: string;
  authorName: string;
  authorRole: string;
  text: string;
  timestamp: string;
  likes: number;
}

export interface CommunityPost {
  id: string;
  authorName: string;
  authorAvatar: string;
  authorTag: string;
  category: 'Expression' | 'Grammar' | 'Cultural Tip' | 'Question' | 'Pronunciation';
  title: string;
  contentBisaya: string;
  contentEnglish: string;
  dialectNote?: string;
  likes: number;
  likedByMe: boolean;
  comments: CommunityComment[];
  timestamp: string;
  isReported?: boolean;
}

export interface CapstoneRequirement {
  id: number;
  title: string;
  status: 'verified' | 'in_progress' | 'ready_for_defense';
  description: string;
  evidence: string;
  verifiedTimestamp: string;
}

export interface ResearchMetricData {
  preTestAverage: number;
  postTestAverage: number;
  improvementPercentage: number;
  susScore: number; // System Usability Scale (0-100)
  whisperAvgWer: number; // Whisper Word Error Rate %
  bertIntentAccuracy: number; // %
  sampleSize: number;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  eventType: string;
  category: 'AI_INFERENCE' | 'SPEECH_WER' | 'LEARNING_ACTIVITY' | 'SECURITY_RLS' | 'SYSTEM_CONFIG';
  actor: string;
  actorRole: string;
  description: string;
  severity: 'INFO' | 'SUCCESS' | 'WARNING' | 'CRITICAL';
  latencyMs?: number;
  metadata?: Record<string, any>;
}

export interface SystemConfig {
  activeGeminiModel: string;
  whisperWerThreshold: number;
  bertConfidenceThreshold: number;
  maintenanceMode: boolean;
  rateLimitPerMin: number;
  groundingMapsEnabled: boolean;
  groundingSearchEnabled: boolean;
}

export interface AdminLearner {
  id: string;
  name: string;
  email: string;
  role: string;
  targetDialect: string;
  xp: number;
  streakDays: number;
  hearts: number;
  todayMinutes: number;
  dailyGoalMinutes: number;
  speechScoreAverage: number;
  vocabularyMastered: number;
  status: string;
  lastActive: string;
}

export interface SystemStats {
  activeLearnersCount: number;
  totalPracticeMinutes: number;
  totalPracticeHours: number;
  whisperAvgWer: number;
  bertIntentAccuracy: number;
  susUsabilityScore: number;
  sampleSize: number;
  aiRequestsToday: number;
  geminiStatus: string;
  supabaseRlsStatus: string;
  serverUptimeSeconds: number;
  memoryUsageMb: number;
}

export type NotificationCategory = 'achievement' | 'admin' | 'security' | 'system';

export interface AppNotification {
  id: string;
  category: NotificationCategory;
  title: string;
  titleBisaya?: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionLabel?: string;
  actionType?: 'audit' | 'learn' | 'admin' | 'dialect' | 'profile';
  iconType?: 'trophy' | 'flame' | 'shield' | 'bell' | 'sparkles' | 'sliders' | 'check' | 'lock';
}
