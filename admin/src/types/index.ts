export type SystemStatus = 'healthy' | 'degraded' | 'down';

export type UserRole = 'user' | 'admin' | 'moderator';

export type UserStatus = 'pending' | 'approved' | 'rejected' | 'banned' | 'suspended' | 'active';

export type ModuleDifficulty = 'beginner' | 'intermediate' | 'advanced';

export type ReportStatus = 'open' | 'resolved' | 'dismissed';

export type VerificationStatus = 'pending' | 'approved' | 'rejected';

export interface AdminSession {
  id: string;
  name: string;
  email: string;
  provider: 'google' | 'email';
  role: UserRole;
  avatar: string;
  signedInAt: string;
}

export interface OverviewStats {
  totalUsers: number;
  activeToday: number;
  weeklyActive: number;
  monthlyActive: number;
  lessonsCompleted: number;
  avgXpPerUser: number;
  avgSessionMinutes: number;
  aiRequests: number;
  aiSuccessRequests: number;
  aiFailedRequests: number;
  /** Failed / total AI requests, 0–100 with one decimal. */
  aiFailureRate: number;
  communityReports: number;
  streakDays: number;
  /** Most recent verified lesson completion, or null when none exists. */
  lastLessonCompletedAt: string | null;
  /** Most recent AI usage event, or null when none exists. */
  lastAiRequestAt: string | null;
}

export interface SystemHealth {
  status: SystemStatus;
  db: 'connected' | 'error';
  api: 'up' | 'down';
  /**
   * Groq/Whisper run inside Supabase Edge Functions; their API keys are Edge
   * Function secrets this app cannot introspect, and Storage needs its own
   * credentials. None can be verified from here, so they report `unknown`
   * rather than a green `configured`. Only a real request/health probe flips
   * them to `configured`/`error`.
   */
  groq: 'configured' | 'not_set' | 'error' | 'unknown';
  whisper: 'configured' | 'not_set' | 'error' | 'unknown';
  storage: 'up' | 'down' | 'unknown';
  lastChecked: string;
  /** Round-trip time of the live database probe, in milliseconds. */
  latencyMs: number | null;
  /** Last successful probe persisted by the monitor, or null. */
  lastSuccessfulCheck: string | null;
  /** Per-table availability and latency for the monitor sidebar. */
  tables?: DbTableStatus[] | undefined;
}

export type DbConnectionState = 'connected' | 'degraded' | 'disconnected' | 'unknown';

export interface DbTableStatus {
  table: string;
  ok: boolean;
  count: number | null;
  error: string | null;
  latencyMs: number | null;
}

export interface DatabaseMonitor {
  ok: boolean;
  state: DbConnectionState;
  latencyMs: number | null;
  checkedAt: string;
  lastSuccessfulCheck: string | null;
  tables: DbTableStatus[];
  error: string | null;
}

export interface SeriesPoint {
  label: string;
  value: number;
}

export interface DailyActivityPoint {
  date: string;
  active: number;
  lessons: number;
  ai: number;
}

export interface OverviewResponse {
  stats: OverviewStats;
  weeklyActive: SeriesPoint[];
  lessonsTrend: SeriesPoint[];
  aiTrend: SeriesPoint[];
  /** ISO timestamp of the query that produced these figures. */
  generatedAt: string;
  rangeDays: number;
}

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  level: number;
  /**
   * Effective XP balance: verified lesson XP plus non-lesson ledger
   * adjustments. This matches the number the mobile app derives from
   * `completed_lessons`, not the stale `learner_profiles.total_xp` mirror.
   */
  xp: number;
  streak: number;
  lessons: number;
  verified: boolean;
  nativeSpeaker: boolean;
  joinedAt: string;
  lastActive: string;
  /** Auth-record sign-in timestamp, or null if the account never signed in. */
  lastSignInAt: string | null;
  /** Supabase auth UUID (`users.supabase_id` / `users.auth_uuid`). */
  authUuid: string | null;
  emailConfirmed: boolean;
  country?: string;
  authProvider?: string;
}

export interface UserListResponse {
  items: AdminUser[];
  total: number;
  page: number;
  perPage: number;
}

export interface UserXpEntry {
  id: string;
  amount: number;
  source: string;
  description: string;
  timestamp: string;
  idempotencyKey: string | null;
}

export interface UserLessonEntry {
  id: string;
  lessonId: string;
  moduleId: string | null;
  language: string;
  xpAwarded: number;
  score: number | null;
  completedAt: string;
}

export interface UserActivityEntry {
  date: string;
  minutes: number;
  xp: number;
  lessons: number;
}

export interface UserCommunityEntry {
  id: number;
  title: string;
  createdAt: string;
  likes: number;
  comments: number;
  hidden: boolean;
}

export interface UserCommentEntry {
  id: number;
  postId: number;
  postTitle: string;
  comment: string;
  createdAt: string;
}

export interface UserDetail extends AdminUser {
  badges: string[];
  weakAreas: string[];
  favoriteCategory: string;
  totalCoins: number;
  dailyGoal: number;
  feedbackCount: number;
  /** Lesson XP, matching the mobile balance. */
  lessonXp: number;
  /** Non-lesson ledger total (admin adjustments, legacy awards). */
  adjustmentXp: number;
  xpHistory: UserXpEntry[];
  lessonHistory: UserLessonEntry[];
  activityHistory: UserActivityEntry[];
  posts: UserCommunityEntry[];
  comments: UserCommentEntry[];
}

export interface UserFilters {
  search: string;
  role: UserRole | 'all';
  status: UserStatus | 'all';
  sort: 'xp' | 'level' | 'recent' | 'joined';
}

export interface LessonModule {
  id: number;
  moduleKey: string | null;
  title: string;
  difficulty: ModuleDifficulty;
  language: string;
  lessons: number;
  completions: number;
  avgCompletionPercent: number;
  published: boolean;
  updatedAt: string;
}

/** One verified `completed_lessons` row, joined to its learner. */
export interface LessonCompletion {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  lessonId: string;
  moduleId: string | null;
  language: string;
  xpAwarded: number;
  score: number | null;
  completedAt: string;
}

export interface CommunityPost {
  id: number;
  author: { id: number; name: string };
  title: string;
  content: string;
  category: string;
  likes: number;
  bookmarks: number;
  comments: number;
  reports: number;
  featured: boolean;
  hidden: boolean;
  createdAt: string;
}

export interface CommunityComment {
  id: number;
  postId: number;
  author: { id: number; name: string };
  comment: string;
  createdAt: string;
}

export interface CommunityPostDetail extends CommunityPost {
  phrase: string;
  translation: string;
  commentList: CommunityComment[];
}

export interface CommunityReport {
  id: number;
  postId: number;
  reportedBy: { id: number; name: string };
  reason: string;
  status: ReportStatus;
  createdAt: string;
}

/** Whether a token figure came from the provider or cannot be known. */
export type TokenAvailability = 'provider' | 'estimated' | 'unavailable';

export interface AiUsageEvent {
  id: string;
  userId: string | null;
  userName: string;
  userEmail: string;
  agentId: string | null;
  mode: string;
  provider: string;
  model: string;
  keyAlias: string | null;
  inputTokens: number | null;
  outputTokens: number | null;
  totalTokens: number | null;
  units: number | null;
  tokensCharged: number | null;
  latencyMs: number | null;
  cached: boolean;
  ok: boolean;
  error: string | null;
  tokenSource: TokenAvailability;
  createdAt: string;
}

export interface AiUsageStats {
  /** Every request recorded in `ai_usage_events` for the selected window. */
  totalRequests: number;
  successRequests: number;
  conversations: number;
  voiceRequests: number;
  whisperRequests: number;
  tutorRequests: number;
  failedRequests: number;
  failureRate: number;
  avgResponseMs: number;
  totalTokens: number;
  totalUnits: number;
  /** Provider-confirmed input/output token totals when available. */
  inputTokens: number;
  outputTokens: number;
  tokenAvailability: TokenAvailability;
  providers: {
    name: string;
    requests: number;
    failed: number;
    tokens: number;
    units: number;
    avgLatencyMs: number;
  }[];
  modes: { mode: string; requests: number; failed: number; tokens: number }[];
  models: {
    provider: string;
    model: string;
    requests: number;
    failed: number;
    tokens: number;
    avgLatencyMs: number;
  }[];
  events: AiUsageEvent[];
  trend: SeriesPoint[];
  generatedAt: string;
  rangeDays: number;
}

// ---- AI token economy ------------------------------------------------------

export interface AiTokenOverview {
  totalWallets: number;
  totalBalance: number;
  grantedThisMonth: number;
  spentThisMonth: number;
  activeUsers30d: number;
  cachedRequests7d: number;
  cacheHitRate: number;
  failedRequests7d: number;
  avgLatencyMs: number;
  pendingUpgrades: number;
  trend: SeriesPoint[];
  byMode: { mode: string; requests: number; tokens: number }[];
  byProvider: {
    provider: string;
    requests: number;
    tokens: number;
    failed: number;
    avgLatencyMs: number;
  }[];
  topUsers: {
    userId: string;
    name: string;
    email: string;
    planId: string;
    balance: number;
    spent30d: number;
    requests30d: number;
  }[];
  /** Provider-reported token usage by model. No character-count estimates. */
  byModel: {
    provider: string;
    model: string;
    requests: number;
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    availability: TokenAvailability;
  }[];
  /** Provider-reported token usage by learner, newest 30 days. */
  byUser: {
    userId: string;
    name: string;
    email: string;
    requests: number;
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    availability: TokenAvailability;
  }[];
  /** Daily provider-reported token totals for the last 7 days. */
  byDay: {
    date: string;
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    requests: number;
  }[];
  tokenAvailability: TokenAvailability;
  generatedAt: string;
}

export interface AiWalletRow {
  userId: string;
  name: string;
  email: string;
  planId: string;
  balance: number;
  lifetimeGranted: number;
  lifetimeSpent: number;
  monthlyOverride: number | null;
  note: string | null;
  spent30d: number;
  requests30d: number;
  periodStart: string;
  periodEnd: string;
  updatedAt: string;
}

export interface AiWalletList {
  rows: AiWalletRow[];
  total: number;
  page: number;
  perPage: number;
}

export interface AiProviderRow {
  id: string;
  provider: string;
  keyAlias: string;
  agentIds: string[];
  monthlyQuota: number;
  usedUnits: number;
  status: string;
  cooldownUntil: string | null;
  lastError: string | null;
  lastUsedAt: string | null;
  updatedAt: string;
}

export interface AiSettingsPayload {
  freeMonthlyTokens: number;
  costChatTurn: number;
  costVoiceMinute: number;
  costTts1kChars: number;
  costSttMinute: number;
  rateLimitPerMin: number;
  providerChains: Record<string, string[]>;
  updatedAt: string;
}

export interface AiVoiceProfileRow {
  id: string;
  agentId: string;
  language: string;
  voiceId: string;
  modelId: string;
  displayName: string | null;
  keyAlias: string | null;
  isActive: boolean;
  updatedAt?: string;
}

export interface AiUpgradeRow {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  planId: string | null;
  tokensRequested: number;
  amountPhp: number;
  paymentMethod: string;
  referenceNo: string | null;
  receiptUrl: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  adminNote: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdAt: string;
}

export interface XpLedgerEntry {
  id: string;
  userId: number;
  userName: string;
  userEmail: string;
  amount: number;
  source: string;
  description: string;
  timestamp: string;
  idempotencyKey: string | null;
}

export interface XpOverview {
  /**
   * Effective platform XP: verified lesson XP plus non-lesson ledger
   * adjustments. This is the balance the mobile app reports.
   */
  totalXpAwarded: number;
  earnedFromLessons: number;
  manualAdjustments: number;
  avgDailyXp: number;
  dailyRewardsClaimed: number;
  levelDistribution: SeriesPoint[];
  topUsers: TopUser[];
  ledger: XpLedgerEntry[];
  ledgerTotal: number;
  generatedAt: string;
}

export interface TopUser {
  id: number;
  name: string;
  level: number;
  xp: number;
  streak: number;
}

export type FeedbackStatus = 'open' | 'reviewing' | 'resolved' | 'dismissed';

export interface FeedbackItem {
  id: number;
  user: { id: number; name: string; email: string };
  functionality: number;
  usability: number;
  reliability: number;
  comment?: string;
  resolved: boolean;
  createdAt: string;
  category: string;
  status: FeedbackStatus;
  adminResponse: string | null;
  respondedAt: string | null;
  respondedBy: string | null;
  source: string | null;
}

export interface PreservedWord {
  id: number;
  word: string;
  dialect: string;
  meaning: string;
  submittedBy: { id: number; name: string };
  status: VerificationStatus;
  variations: string[];
  createdAt: string;
}

export interface AdminSettings {
  maintenanceMode: boolean;
  allowSignups: boolean;
  allowCommunity: boolean;
  requireVerificationForCommunity: boolean;
  dailyXpGoal: number;
  maxDailyAiRequests: number;
  aiProvider: 'groq' | 'openai' | 'auto';
  admins: { id: number; name: string; email: string; role: UserRole }[];
  updatedAt: string;
}

/** A raw `public.users` row, as rendered by the live DB monitor. */
export interface MonitoredUser {
  user_id: number;
  fullname: string;
  username: string | null;
  email: string;
  clerk_id: string | null;
  google_id: string | null;
  supabase_id: string | null;
  avatar_id: number | null;
  preferred_lang: string | null;
  learning_lang: string | null;
  country: string | null;
  role: string;
  is_verified: number;
  is_native_speaker: number;
  bio: string | null;
  created_at: string;
}

export interface UserStats {
  total: number;
  verified: number;
  nativeSpeakers: number;
  admins: number;
  newLast7Days: number;
  latestSignup: string | null;
}

export interface MonitorSnapshot {
  ok: true;
  fetchedAt: string;
  stats: UserStats;
  users: MonitoredUser[];
  /** Live database health for the monitor header. */
  database: SystemHealth;
}

export type AuditActorKind = 'admin' | 'moderator' | 'user' | 'system' | 'unknown';

export interface AuditLog {
  id: number;
  /** Human-readable action, coalesced from `action` / `event_type`. */
  action: string;
  resourceType: string;
  resourceId: string | null;
  details: string | null;
  timestamp: string;
  eventType: string | null;
  category: string | null;
  severity: string | null;
  description: string | null;
  latencyMs: number | null;
  metadata: Record<string, unknown> | null;
  actor: {
    id: number;
    name: string;
    email: string;
    role?: string;
    authUuid?: string;
  } | null;
  /** Display label: resolved profile name, raw actor text, or `Unknown Actor`. */
  actorLabel: string;
  actorKind: AuditActorKind;
}

export interface AuditLogResponse {
  items: AuditLog[];
  total: number;
  page: number;
  perPage: number;
  generatedAt: string;
}

export interface AuditLogFilters {
  search: string;
  resourceType: string;
  actorId: number | 'all';
  /** Optional actor classification filter. */
  actorKind: AuditActorKind | 'all';
}
