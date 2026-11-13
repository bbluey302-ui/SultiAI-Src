import { TargetDialect } from './index';

export type MajorAiLanguage = 'cebuano' | 'filipino' | 'english';

/**
 * Built-in coach ids stay autocompleted, while `(string & {})` lets learner-made
 * bots use their own `custom_*` ids without a second parallel type.
 */
export type AiCoachId =
  | 'jen'
  | 'adam'
  | 'gentech'
  | 'kevin'
  | 'mika'
  | (string & {});

/** Built-in coach whose ElevenLabs voice a custom bot borrows. */
export type BaseVoiceId = 'jen' | 'adam' | 'gentech' | 'kevin' | 'mika';

export type CoachScope = 'chat' | 'voice' | 'both';

export interface AiCoach {
  id: AiCoachId;
  name: string;
  role: string;
  specialty: string;
  tagline: string;
  description: string;
  avatar: string;
  flag: string;
  accentColor: string;
  supportedLanguages: MajorAiLanguage[];
  primaryLanguage: MajorAiLanguage;
  recommendedCategories: string[];
  practiceExamples: string[];
  systemPromptIntro: string;
  greetingMessage: {
    text: string;
    translation: string;
    language: MajorAiLanguage;
  };
  /** True for learner-created bots saved on this device. */
  isCustom?: boolean;
  /** Which Sulti surfaces the custom bot appears in. */
  scope?: CoachScope;
  /** Built-in coach voice used for text-to-speech. */
  voiceAgentId?: BaseVoiceId;
  /** Free-form personality notes shown in the builder. */
  persona?: string;
  createdAt?: string;
}


export interface ChatScenario {
  id: string;
  title: string;
  category: string;
  categoryLabel: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  description: string;
  initialPrompt: string;
  suggestedGoal: string;
  recommendedCoachId: AiCoachId;
  supportedLanguages: MajorAiLanguage[];
  usefulPhrases: { phrase: string; translation: string; pronunciation?: string }[];
}

export interface AiChatMessage {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  translation?: string;
  phoneticGuide?: string;
  createdAt: string;
  vocabularyBreakdown?: { term: string; meaning: string; pos?: string }[];
  corrections?: {
    original: string;
    improved: string;
    explanation: string;
    example?: string;
  };
  suggestedFollowUps?: string[];
  culturalTip?: string;
  groundingSources?: { title: string; uri: string }[];
  mapsLinks?: { title: string; uri: string }[];
  codeBlock?: { language: string; code: string };
  tableData?: { headers: string[]; rows: string[][] };
}

export interface AiConversation {
  id: string;
  userId: string;
  title: string;
  scenarioId?: string;
  scenarioTitle?: string;
  agentId: AiCoachId;
  targetLanguage: MajorAiLanguage;
  supportingLanguage?: MajorAiLanguage;
  status: 'active' | 'archived';
  messageCount: number;
  lastMessagePreview?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AiVoiceSession {
  id: string;
  userId: string;
  agentId: AiCoachId;
  targetLanguage: MajorAiLanguage;
  scenarioTitle?: string;
  difficulty?: 'Beginner' | 'Intermediate' | 'Advanced';
  startedAt: string;
  endedAt?: string;
  durationSeconds: number;
  maxAllowedSeconds: number; // 120s for free users
  status: 'active' | 'completed' | 'timeout' | 'interrupted';
  userTranscriptSnippet?: string;
  transcriptCount: number;
  speechScoreAverage: number;
  wordCount: number;
  xpEarned: number;
  feedbackSummary?: string;
  corrections?: string[];
  recommendations?: string[];
}
