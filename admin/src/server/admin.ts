import { serviceClient, HttpError } from '@/lib/supabase-admin';
import type {
  AdminSettings,
  AdminUser,
  AuditLog,
  AuditLogFilters,
  AuditLogResponse,
  AiProviderRow,
  AiSettingsPayload,
  AiTokenOverview,
  AiUpgradeRow,
  AiUsageEvent,
  AiUsageStats,
  AiVoiceProfileRow,
  AiWalletList,
  AiWalletRow,
  CommunityPost,
  CommunityReport,
  FeedbackItem,
  LessonModule,
  ModuleDifficulty,
  MonitorSnapshot,
  OverviewResponse,
  PreservedWord,
  ReportStatus,
  SeriesPoint,
  SystemHealth,
  TokenAvailability,
  TopUser,
  UserDetail,
  UserListResponse,
  UserRole,
  UserStats,
  UserStatus,
  XpLedgerEntry,
  XpOverview,
  VerificationStatus,
} from '@/types';

/**
 * Every admin read and write, expressed against Supabase.
 *
 * Called only from the catch-all route handler under `/api/admin`, after
 * `requireAdmin()` has verified the caller. `serviceClient()` bypasses RLS, so
 * each function is responsible for returning exactly the shape the console
 * renders.
 *
 * Scale note: the overview, XP and AI pages aggregate small alpha-stage tables
 * in JavaScript rather than in SQL. If a table grows into the millions of rows,
 * move these into `SECURITY DEFINER` RPCs that `GROUP BY` server-side.
 */

function svc() {
  return serviceClient();
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Matches `src/constants/xp.ts` `LEVEL_THRESHOLDS`, so the admin agrees with the app. */
const LEVEL_THRESHOLDS = [0, 100, 250, 500, 1000, 2000, 3500, 5000];

function levelFromXp(xp: number): number {
  let level = 1;
  for (let i = 0; i < LEVEL_THRESHOLDS.length; i += 1) {
    if (xp >= LEVEL_THRESHOLDS[i]) level = i + 1;
  }
  return level;
}

function one<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return (value[0] as T) ?? null;
  return (value as T) ?? null;
}

function toNumber(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

/** `weak_areas` / `strengths` are TEXT columns that may hold JSON or a CSV list. */
function parseList(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  if (value === null || value === undefined) return [];
  const text = String(value).trim();
  if (!text) return [];
  if (text.startsWith('[')) {
    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean);
    } catch {
      // fall through to CSV parsing
    }
  }
  return text
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
}

function dayKey(value: string | Date): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
}

/** The last `days` calendar days in UTC, oldest first, with short labels. */
function dayKeys(days: number): { key: string; label: string }[] {
  const out: { key: string; label: string }[] = [];
  const base = new Date();
  base.setUTCHours(0, 0, 0, 0);
  for (let i = days - 1; i >= 0; i -= 1) {
    const date = new Date(base);
    date.setUTCDate(date.getUTCDate() - i);
    out.push({
      key: date.toISOString().slice(0, 10),
      label: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }),
    });
  }
  return out;
}

async function countOf(table: string): Promise<number> {
  const { count, error } = await svc().from(table).select('*', { count: 'exact', head: true });
  if (error) throw new Error(error.message);
  return count ?? 0;
}

async function countWhere(table: string, column: string, value: string | number): Promise<number> {
  const { count, error } = await svc()
    .from(table)
    .select('*', { count: 'exact', head: true })
    .eq(column, value);
  if (error) throw new Error(error.message);
  return count ?? 0;
}

/**
 * Voice activity is logged as `learning_sessions` rows whose `activity_type`
 * starts with `voice`. That table is optional to the console, so a missing
 * relation degrades to 0 rather than failing the whole AI page.
 */
async function countVoiceSessions(): Promise<number> {
  try {
    const { count, error } = await svc()
      .from('learning_sessions')
      .select('*', { count: 'exact', head: true })
      .ilike('activity_type', 'voice%');
    if (error) throw new Error(error.message);
    return count ?? 0;
  } catch {
    return 0;
  }
}

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

interface ProfileEmbed {
  total_xp: number | null;
  streak: number | null;
  last_active: string | null;
}

interface UserRow {
  user_id: number;
  fullname: string;
  username: string | null;
  email: string;
  role: string;
  status: string;
  is_verified: number | null;
  is_native_speaker: number | null;
  country: string | null;
  google_id: string | null;
  supabase_id: string | null;
  auth_uuid: string | null;
  created_at: string;
  bio: string | null;
  learner_profiles: ProfileEmbed | ProfileEmbed[] | null;
}

const USER_SELECT =
  'user_id, fullname, username, email, role, status, is_verified, is_native_speaker, country, google_id, supabase_id, auth_uuid, created_at, bio, learner_profiles(total_xp, streak, last_active)';

async function fetchAllUsers(): Promise<UserRow[]> {
  const { data, error } = await svc()
    .from('users')
    .select(USER_SELECT)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as UserRow[];
}

async function loadUserRow(id: number): Promise<UserRow | null> {
  const { data, error } = await svc()
    .from('users')
    .select(USER_SELECT)
    .eq('user_id', id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as unknown as UserRow | null) ?? null;
}

interface UserXpAggregate {
  lessons: number;
  lessonXp: number;
  activityXp: number;
  manualXp: number;
  otherXp: number;
  xp: number;
}

/**
 * Effective XP per learner, matching the mobile app:
 * `max(activity XP, lesson + automatic ledger XP) + manual adjustments`.
 * `learner_profiles.total_xp` is a mirror and may be stale, so it is not used.
 */
async function loadXpAggregates(
  rows: UserRow[],
  auth: AuthLookup
): Promise<Map<number, UserXpAggregate>> {
  const [completionsRes, ledgerRes, activityRes] = await Promise.all([
    svc().from('completed_lessons').select('user_id, xp_awarded'),
    svc().from('xp_logs').select('user_id, amount, source, description, timestamp, id, idempotency_key'),
    svc().from('learner_daily_activity').select('user_id, xp_earned'),
  ]);

  const userById = new Set(rows.map((row) => row.user_id));
  const emailToUserId = new Map<string, number>();
  const uuidToUserId = new Map<string, number>();
  for (const row of rows) {
    emailToUserId.set(row.email.toLowerCase(), row.user_id);
    if (row.auth_uuid) uuidToUserId.set(row.auth_uuid, row.user_id);
    if (row.supabase_id) uuidToUserId.set(row.supabase_id, row.user_id);
  }
  for (const [email, authUser] of auth.byEmail) {
    const userId = emailToUserId.get(email);
    if (userId) uuidToUserId.set(authUser.id, userId);
  }

  const resolveUser = (raw: string | number | null): number | null => {
    if (raw === null || raw === undefined || raw === '') return null;
    if (typeof raw === 'number' || /^\d+$/.test(String(raw))) {
      const n = Number(raw);
      return userById.has(n) ? n : null;
    }
    return uuidToUserId.get(String(raw)) ?? null;
  };

  const aggregates = new Map<number, UserXpAggregate>();
  const ensure = (userId: number): UserXpAggregate => {
    let agg = aggregates.get(userId);
    if (!agg) {
      agg = { lessons: 0, lessonXp: 0, activityXp: 0, manualXp: 0, otherXp: 0, xp: 0 };
      aggregates.set(userId, agg);
    }
    return agg;
  };

  for (const completion of (completionsRes.data ?? []) as {
    user_id: string | number | null;
    xp_awarded: number | null;
  }[]) {
    const userId = resolveUser(completion.user_id);
    if (userId === null) continue;
    const agg = ensure(userId);
    agg.lessons += 1;
    agg.lessonXp += toNumber(completion.xp_awarded);
  }

  for (const entry of (ledgerRes.data ?? []) as {
    user_id: number | null;
    amount: number | null;
    source: string | null;
  }[]) {
    const userId = resolveUser(entry.user_id);
    if (userId === null) continue;
    const agg = ensure(userId);
    const amount = toNumber(entry.amount);
    const source = (entry.source ?? '').toLowerCase();
    if (source.includes('admin') || source.includes('manual') || source.includes('adjust')) {
      agg.manualXp += amount;
    } else if (
      source.includes('lesson') ||
      source.includes('completion') ||
      source === 'auto'
    ) {
      // Mirrors `completed_lessons`; already counted there.
    } else {
      agg.otherXp += amount;
    }
  }

  for (const entry of (activityRes.data ?? []) as {
    user_id: string | number | null;
    xp_earned: number | null;
  }[]) {
    const userId = resolveUser(entry.user_id);
    if (userId === null) continue;
    ensure(userId).activityXp += toNumber(entry.xp_earned);
  }

  for (const agg of aggregates.values()) {
    agg.xp = Math.max(agg.activityXp, agg.lessonXp + agg.otherXp) + agg.manualXp;
  }
  return aggregates;
}

function toAdminUser(
  row: UserRow,
  aggregate: UserXpAggregate | undefined,
  authUser: AuthUserLite | undefined
): AdminUser {
  const profile = one(row.learner_profiles);
  const xp = aggregate?.xp ?? 0;
  return {
    id: row.user_id,
    name: row.fullname,
    email: row.email,
    role: row.role as UserRole,
    status: row.status as UserStatus,
    level: levelFromXp(xp),
    xp,
    streak: toNumber(profile?.streak),
    lessons: aggregate?.lessons ?? 0,
    verified: row.is_verified === 1,
    nativeSpeaker: row.is_native_speaker === 1,
    joinedAt: row.created_at,
    lastActive: profile?.last_active ?? row.created_at,
    lastSignInAt: authUser?.lastSignInAt ?? null,
    authUuid: row.auth_uuid ?? row.supabase_id ?? authUser?.id ?? null,
    emailConfirmed: authUser?.emailConfirmed ?? false,
    country: row.country ?? undefined,
    authProvider: row.google_id ? 'google' : 'email',
  };
}

async function buildUserList(): Promise<{
  rows: UserRow[];
  auth: AuthLookup;
  aggregates: Map<number, UserXpAggregate>;
}> {
  const rows = await fetchAllUsers();
  const auth = await loadAuthLookup();
  const aggregates = await loadXpAggregates(rows, auth);
  return { rows, auth, aggregates };
}

export async function listUsers(query: {
  page: number;
  perPage: number;
  search: string;
  role: string;
  status: string;
  sort: string;
}): Promise<UserListResponse> {
  const { rows, auth, aggregates } = await buildUserList();

  const search = query.search.trim().toLowerCase();
  let items = rows
    .map((row) =>
      toAdminUser(row, aggregates.get(row.user_id), auth.byEmail.get(row.email.toLowerCase()))
    )
    .filter((user) => {
      if (query.role && query.role !== 'all' && user.role !== query.role) return false;
      if (query.status && query.status !== 'all' && user.status !== query.status) return false;
      if (!search) return true;
      return user.name.toLowerCase().includes(search) || user.email.toLowerCase().includes(search);
    });

  items = items.sort((a, b) => {
    switch (query.sort) {
      case 'xp':
        return b.xp - a.xp;
      case 'level':
        return b.level - a.level;
      case 'joined':
        return new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime();
      default:
        return new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime();
    }
  });

  const total = items.length;
  const page = Math.max(1, query.page || 1);
  const perPage = Math.max(1, query.perPage || 10);
  const start = (page - 1) * perPage;

  return { items: items.slice(start, start + perPage), total, page, perPage };
}

export async function getUserMonitor(): Promise<MonitorSnapshot> {
  const { data, error } = await svc()
    .from('users')
    .select(
      'user_id, fullname, username, email, clerk_id, google_id, supabase_id, avatar_id, preferred_lang, learning_lang, country, role, is_verified, is_native_speaker, bio, created_at'
    )
    .order('created_at', { ascending: false })
    .order('user_id', { ascending: false });
  if (error) throw new Error(error.message);

  type MonitorRow = MonitorSnapshot['users'][number];
  const users = (data ?? []) as unknown as MonitorRow[];

  const weekAgo = new Date();
  weekAgo.setUTCDate(weekAgo.getUTCDate() - 7);
  const weekAgoIso = weekAgo.toISOString();

  const stats: UserStats = {
    total: users.length,
    verified: users.filter((u) => u.is_verified === 1).length,
    nativeSpeakers: users.filter((u) => u.is_native_speaker === 1).length,
    admins: users.filter((u) => u.role === 'admin').length,
    newLast7Days: users.filter((u) => u.created_at >= weekAgoIso).length,
    latestSignup: users[0]?.created_at ?? null,
  };

  const database = await getHealth();
  return { ok: true, fetchedAt: new Date().toISOString(), stats, users, database };
}

export async function listPendingUsers(): Promise<{ items: AdminUser[]; total: number }> {
  const { rows, auth, aggregates } = await buildUserList();
  const items = rows
    .filter((row) => row.status === 'pending')
    .map((row) =>
      toAdminUser(row, aggregates.get(row.user_id), auth.byEmail.get(row.email.toLowerCase()))
    );
  return { items, total: items.length };
}

export async function getUserDetail(id: number): Promise<{ detail: UserDetail }> {
  const { rows, auth, aggregates } = await buildUserList();
  const row = rows.find((item) => item.user_id === id);
  if (!row) throw new HttpError(404, `User ${id} was not found.`);

  const authUser = auth.byEmail.get(row.email.toLowerCase());
  const authUuid = row.auth_uuid ?? row.supabase_id ?? authUser?.id ?? null;

  const [
    profile,
    badges,
    analytics,
    feedbackCount,
    xpHistoryRes,
    lessonsRes,
    activityRes,
    postsRes,
    commentsRes,
  ] = await Promise.all([
    svc()
      .from('learner_profiles')
      .select('weak_areas, coins, daily_goal')
      .eq('user_id', id)
      .maybeSingle(),
    svc().from('user_badges').select('badge_id').eq('user_id', id),
    svc().from('learning_analytics').select('favorite_category').eq('user_id', id).maybeSingle(),
    countWhere('feedback', 'user_id', id),
    svc()
      .from('xp_logs')
      .select('id, amount, source, description, timestamp, idempotency_key')
      .eq('user_id', id)
      .order('timestamp', { ascending: false })
      .limit(200),
    authUuid
      ? svc()
          .from('completed_lessons')
          .select('id, lesson_id, module_id, language, xp_awarded, score, completed_at')
          .eq('user_id', authUuid)
          .order('completed_at', { ascending: false })
          .limit(200)
      : Promise.resolve({ data: [] as Record<string, unknown>[] }),
    authUuid
      ? svc()
          .from('learner_daily_activity')
          .select('activity_date, minutes, xp_earned, lessons_completed')
          .eq('user_id', authUuid)
          .order('activity_date', { ascending: false })
          .limit(120)
      : Promise.resolve({ data: [] as Record<string, unknown>[] }),
    svc()
      .from('community_posts')
      .select('post_id, title, likes_count, bookmarks_count, is_hidden, created_at')
      .eq('user_id', id)
      .order('created_at', { ascending: false })
      .limit(100),
    svc()
      .from('comments')
      .select('comment_id, post_id, comment, created_at')
      .eq('user_id', id)
      .order('created_at', { ascending: false })
      .limit(100),
  ]);

  const xpRows = (xpHistoryRes.data ?? []) as {
    id: string;
    amount: number | null;
    source: string | null;
    description: string | null;
    timestamp: string;
    idempotency_key: string | null;
  }[];

  const lessonRows = (lessonsRes.data ?? []) as {
    id: string;
    lesson_id: string;
    module_id: string | null;
    language: string;
    xp_awarded: number | null;
    score: number | null;
    completed_at: string;
  }[];

  const activityRows = (activityRes.data ?? []) as {
    activity_date: string;
    minutes: number | null;
    xp_earned: number | null;
    lessons_completed: number | null;
  }[];

  const postRows = (postsRes.data ?? []) as {
    post_id: number;
    title: string;
    likes_count: number | null;
    bookmarks_count: number | null;
    is_hidden: boolean | null;
    created_at: string;
  }[];

  const commentRows = (commentsRes.data ?? []) as {
    comment_id: number;
    post_id: number;
    comment: string;
    created_at: string;
  }[];

  const postIds = [...new Set(commentRows.map((comment) => comment.post_id))];
  const titlesRes = postIds.length
    ? await svc().from('community_posts').select('post_id, title').in('post_id', postIds)
    : { data: [] as { post_id: number; title: string }[] };
  const titleById = new Map(
    ((titlesRes.data ?? []) as { post_id: number; title: string }[]).map((post) => [
      post.post_id,
      post.title,
    ])
  );

  const userPostIds = postRows.map((post) => post.post_id);
  const commentCountRes = userPostIds.length
    ? await svc().from('comments').select('post_id').in('post_id', userPostIds)
    : { data: [] as { post_id: number }[] };
  const commentCountByPost = new Map<number, number>();
  for (const comment of (commentCountRes.data ?? []) as { post_id: number }[]) {
    commentCountByPost.set(comment.post_id, (commentCountByPost.get(comment.post_id) ?? 0) + 1);
  }

  const aggregate = aggregates.get(id);
  const lessonXp = lessonRows.reduce((sum, lesson) => sum + toNumber(lesson.xp_awarded), 0);
  const adjustmentXp = xpRows
    .filter((entry) => {
      const source = (entry.source ?? '').toLowerCase();
      return !(source.includes('lesson') || source.includes('completion') || source === 'auto');
    })
    .reduce((sum, entry) => sum + toNumber(entry.amount), 0);

  const detail: UserDetail = {
    ...toAdminUser(row, aggregate, authUser),
    badges: ((badges.data ?? []) as { badge_id: string }[]).map((b) => b.badge_id),
    weakAreas: parseList(profile.data?.weak_areas),
    favoriteCategory: (analytics.data?.favorite_category as string) ?? '',
    totalCoins: toNumber(profile.data?.coins),
    dailyGoal: toNumber(profile.data?.daily_goal, 50),
    feedbackCount,
    lessonXp,
    adjustmentXp,
    xpHistory: xpRows.map((entry) => ({
      id: entry.id,
      amount: toNumber(entry.amount),
      source: entry.source ?? 'unknown',
      description: entry.description ?? '',
      timestamp: entry.timestamp,
      idempotencyKey: entry.idempotency_key,
    })),
    lessonHistory: lessonRows.map((lesson) => ({
      id: lesson.id,
      lessonId: lesson.lesson_id,
      moduleId: lesson.module_id,
      language: lesson.language,
      xpAwarded: toNumber(lesson.xp_awarded),
      score: lesson.score,
      completedAt: lesson.completed_at,
    })),
    activityHistory: activityRows.map((activity) => ({
      date: activity.activity_date,
      minutes: toNumber(activity.minutes),
      xp: toNumber(activity.xp_earned),
      lessons: toNumber(activity.lessons_completed),
    })),
    posts: postRows.map((post) => ({
      id: post.post_id,
      title: post.title,
      createdAt: post.created_at,
      likes: toNumber(post.likes_count),
      comments: commentCountByPost.get(post.post_id) ?? 0,
      hidden: post.is_hidden === true,
    })),
    comments: commentRows.map((comment) => ({
      id: comment.comment_id,
      postId: comment.post_id,
      postTitle: titleById.get(comment.post_id) ?? `Post #${comment.post_id}`,
      comment: comment.comment,
      createdAt: comment.created_at,
    })),
  };
  return { detail };
}

const ROLES: UserRole[] = ['user', 'admin', 'moderator'];
const STATUSES: UserStatus[] = ['pending', 'approved', 'rejected', 'banned', 'suspended', 'active'];

export async function updateUserRole(id: number, role: UserRole): Promise<AdminUser> {
  if (!ROLES.includes(role)) throw new HttpError(400, `Unknown role "${role}".`);
  return patchUser(id, { role });
}

export async function updateUserStatus(id: number, status: UserStatus): Promise<AdminUser> {
  if (!STATUSES.includes(status)) throw new HttpError(400, `Unknown status "${status}".`);
  return patchUser(id, { status });
}

export async function setUserVerified(id: number, verified: boolean): Promise<AdminUser> {
  return patchUser(id, { is_verified: verified ? 1 : 0 });
}

async function patchUser(id: number, patch: Record<string, unknown>): Promise<AdminUser> {
  const { data, error } = await svc()
    .from('users')
    .update(patch)
    .eq('user_id', id)
    .select('user_id')
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new HttpError(404, `User ${id} was not found.`);

  const { rows, auth, aggregates } = await buildUserList();
  const row = rows.find((item) => item.user_id === id);
  if (!row) throw new HttpError(404, `User ${id} was not found.`);
  return toAdminUser(row, aggregates.get(id), auth.byEmail.get(row.email.toLowerCase()));
}

export async function createUser(input: {
  fullname?: string;
  email?: string;
  password?: string;
  role?: UserRole;
}): Promise<{ id: number; name: string; email: string; role: string }> {
  const fullname = (input.fullname ?? '').trim();
  const email = (input.email ?? '').trim();
  const password = input.password ?? '';
  if (!fullname || !email || !password) {
    throw new HttpError(400, 'Full name, email and password are required.');
  }
  if (password.length < 6) {
    throw new HttpError(400, 'Password must be at least 6 characters.');
  }

  const { data, error } = await svc().auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullname },
  });
  if (error || !data.user) {
    throw new HttpError(400, error?.message ?? 'Could not create the account.');
  }

  const { data: row } = await svc()
    .from('users')
    .select('user_id, fullname, email, role')
    .eq('supabase_id', data.user.id)
    .maybeSingle();

  let role = (row?.role as string) ?? 'user';
  if (row && input.role && input.role !== role && ROLES.includes(input.role)) {
    const { error: roleError } = await svc()
      .from('users')
      .update({ role: input.role })
      .eq('user_id', row.user_id);
    if (roleError) throw new Error(roleError.message);
    role = input.role;
  }

  return {
    id: (row?.user_id as number) ?? 0,
    name: (row?.fullname as string) ?? fullname,
    email: (row?.email as string) ?? email,
    role,
  };
}

export async function deleteUser(id: number): Promise<void> {
  const { data, error } = await svc()
    .from('users')
    .select('user_id, supabase_id')
    .eq('user_id', id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return;

  const { error: deleteError } = await svc().from('users').delete().eq('user_id', id);
  if (deleteError) throw new Error(deleteError.message);

  if (data.supabase_id) {
    const { error: authError } = await svc().auth.admin.deleteUser(data.supabase_id as string);
    if (authError && !/not found/i.test(authError.message)) {
      throw new Error(authError.message);
    }
  }
}

export async function approveUser(id: number): Promise<{ id: number; status: string }> {
  await patchUser(id, { status: 'approved' });
  return { id, status: 'approved' };
}

export async function rejectUser(id: number): Promise<{ id: number; status: string }> {
  await patchUser(id, { status: 'rejected' });
  return { id, status: 'rejected' };
}

export async function bulkApproveUsers(userIds: number[]): Promise<{ approved: number }> {
  const ids = userIds.map(Number).filter((n) => Number.isFinite(n));
  if (ids.length === 0) return { approved: 0 };
  const { data, error } = await svc()
    .from('users')
    .update({ status: 'approved' })
    .in('user_id', ids)
    .select('user_id');
  if (error) throw new Error(error.message);
  return { approved: (data ?? []).length };
}

// ---------------------------------------------------------------------------
// Lessons
// ---------------------------------------------------------------------------

interface ModuleRow {
  module_id: number;
  module_key: string | null;
  module_title: string;
  difficulty: string | null;
  language: string | null;
  is_published: number | null;
  updated_at: string | null;
  created_at: string | null;
}

export async function listLessons(): Promise<LessonModule[]> {
  const [modulesRes, itemsRes, progressRes, completionsRes] = await Promise.all([
    svc()
      .from('learning_modules')
      .select(
        'module_id, module_key, module_title, difficulty, language, is_published, updated_at, created_at'
      )
      .order('module_id', { ascending: true }),
    svc().from('lesson_items').select('module_id'),
    svc().from('learning_progress').select('module_id, completion_percent'),
    svc().from('completed_lessons').select('module_id'),
  ]);
  if (modulesRes.error) throw new Error(modulesRes.error.message);

  const modules = (modulesRes.data ?? []) as unknown as ModuleRow[];

  const itemCount = new Map<number, number>();
  for (const item of (itemsRes.data ?? []) as { module_id: number }[]) {
    itemCount.set(item.module_id, (itemCount.get(item.module_id) ?? 0) + 1);
  }

  // Verified completions come from `completed_lessons`; learning_progress is a
  // module-level mirror that can lag behind the lesson ledger.
  const lessonCompletions = new Map<string, number>();
  for (const row of (completionsRes.data ?? []) as { module_id: string | null }[]) {
    if (!row.module_id) continue;
    lessonCompletions.set(row.module_id, (lessonCompletions.get(row.module_id) ?? 0) + 1);
  }

  const completions = new Map<number, number>();
  const percentSum = new Map<number, number>();
  const percentCount = new Map<number, number>();
  for (const row of (progressRes.data ?? []) as {
    module_id: number;
    completion_percent: number | null;
  }[]) {
    if (toNumber(row.completion_percent) >= 100) {
      completions.set(row.module_id, (completions.get(row.module_id) ?? 0) + 1);
    }
    percentSum.set(
      row.module_id,
      (percentSum.get(row.module_id) ?? 0) + toNumber(row.completion_percent)
    );
    percentCount.set(row.module_id, (percentCount.get(row.module_id) ?? 0) + 1);
  }

  return modules.map((m) =>
    mapModule(m, itemCount, completions, percentSum, percentCount, lessonCompletions)
  );
}

function mapModule(
  m: ModuleRow,
  itemCount: Map<number, number>,
  completions: Map<number, number>,
  percentSum: Map<number, number>,
  percentCount: Map<number, number>,
  lessonCompletions: Map<string, number>
): LessonModule {
  const count = percentCount.get(m.module_id) ?? 0;
  const verified = m.module_key ? (lessonCompletions.get(m.module_key) ?? 0) : 0;
  return {
    id: m.module_id,
    moduleKey: m.module_key,
    title: m.module_title,
    difficulty: (m.difficulty as ModuleDifficulty) ?? 'beginner',
    language: m.language ?? 'Bisaya',
    lessons: itemCount.get(m.module_id) ?? 0,
    completions: Math.max(completions.get(m.module_id) ?? 0, verified),
    avgCompletionPercent: count ? Math.round((percentSum.get(m.module_id) ?? 0) / count) : 0,
    published: m.is_published !== 0,
    updatedAt: m.updated_at ?? m.created_at ?? new Date().toISOString(),
  };
}

function lessonPatch(data: Partial<LessonModule>): Record<string, unknown> {
  const patch: Record<string, unknown> = {};
  if (data.title !== undefined) patch.module_title = data.title;
  if (data.difficulty !== undefined) patch.difficulty = data.difficulty;
  if (data.language !== undefined) patch.language = data.language;
  if (data.published !== undefined) patch.is_published = data.published ? 1 : 0;
  return patch;
}

export async function createLesson(data: Partial<LessonModule>): Promise<LessonModule> {
  const patch = lessonPatch(data);
  if (!patch.module_title) throw new HttpError(400, 'A module title is required.');

  const { data: inserted, error } = await svc()
    .from('learning_modules')
    .insert(patch)
    .select('module_id')
    .single();
  if (error || !inserted) throw new Error(error?.message ?? 'Could not create the module.');

  return requireLesson(inserted.module_id as number);
}

export async function updateLesson(id: number, data: Partial<LessonModule>): Promise<LessonModule> {
  const patch = lessonPatch(data);
  if (Object.keys(patch).length === 0) return requireLesson(id);

  const { error } = await svc().from('learning_modules').update(patch).eq('module_id', id);
  if (error) throw new Error(error.message);
  return requireLesson(id);
}

export async function deleteLesson(id: number): Promise<void> {
  const { error } = await svc().from('learning_modules').delete().eq('module_id', id);
  if (error) throw new Error(error.message);
}

async function requireLesson(id: number): Promise<LessonModule> {
  const lesson = (await listLessons()).find((m) => m.id === id);
  if (!lesson) throw new HttpError(404, `Module ${id} was not found.`);
  return lesson;
}

// ---------------------------------------------------------------------------
// Community
// ---------------------------------------------------------------------------

interface PostRow {
  post_id: number;
  user_id: number;
  title: string | null;
  content: string | null;
  category: string | null;
  likes_count: number | null;
  bookmarks_count: number | null;
  is_featured: number | null;
  is_hidden: number | null;
  created_at: string;
  users: { fullname: string } | { fullname: string }[] | null;
}

function mapPost(row: PostRow, comments: number, reports: number): CommunityPost {
  const author = one(row.users);
  return {
    id: row.post_id,
    author: { id: row.user_id, name: author?.fullname ?? 'Unknown' },
    title: row.title ?? '',
    content: row.content ?? '',
    category: row.category ?? 'general',
    likes: toNumber(row.likes_count),
    bookmarks: toNumber(row.bookmarks_count),
    comments,
    reports,
    featured: row.is_featured === 1,
    hidden: row.is_hidden === 1,
    createdAt: row.created_at,
  };
}

export async function listPosts(): Promise<CommunityPost[]> {
  const [postsRes, commentsRes, reportsRes] = await Promise.all([
    svc()
      .from('community_posts')
      .select(
        'post_id, user_id, title, content, category, likes_count, bookmarks_count, is_featured, is_hidden, created_at, users(fullname)'
      )
      .order('created_at', { ascending: false }),
    svc().from('comments').select('post_id'),
    svc().from('community_reports').select('post_id'),
  ]);
  if (postsRes.error) throw new Error(postsRes.error.message);

  const comments = new Map<number, number>();
  for (const row of (commentsRes.data ?? []) as { post_id: number }[]) {
    comments.set(row.post_id, (comments.get(row.post_id) ?? 0) + 1);
  }
  const reports = new Map<number, number>();
  for (const row of (reportsRes.data ?? []) as { post_id: number }[]) {
    reports.set(row.post_id, (reports.get(row.post_id) ?? 0) + 1);
  }

  return ((postsRes.data ?? []) as unknown as PostRow[]).map((row) =>
    mapPost(row, comments.get(row.post_id) ?? 0, reports.get(row.post_id) ?? 0)
  );
}

async function loadPost(id: number): Promise<CommunityPost> {
  const { data, error } = await svc()
    .from('community_posts')
    .select(
      'post_id, user_id, title, content, category, likes_count, bookmarks_count, is_featured, is_hidden, created_at, users(fullname)'
    )
    .eq('post_id', id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new HttpError(404, `Post ${id} was not found.`);

  const [comments, reports] = await Promise.all([
    countWhere('comments', 'post_id', id),
    countWhere('community_reports', 'post_id', id),
  ]);
  return mapPost(data as unknown as PostRow, comments, reports);
}

export async function toggleFeatured(id: number): Promise<CommunityPost> {
  const { data, error } = await svc()
    .from('community_posts')
    .select('is_featured')
    .eq('post_id', id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new HttpError(404, `Post ${id} was not found.`);

  const { error: updateError } = await svc()
    .from('community_posts')
    .update({ is_featured: data.is_featured === 1 ? 0 : 1 })
    .eq('post_id', id);
  if (updateError) throw new Error(updateError.message);
  return loadPost(id);
}

export async function setPostHidden(id: number, hidden: boolean): Promise<CommunityPost> {
  const { error } = await svc()
    .from('community_posts')
    .update({ is_hidden: hidden ? 1 : 0 })
    .eq('post_id', id);
  if (error) throw new Error(error.message);
  return loadPost(id);
}

export async function deletePost(id: number): Promise<void> {
  const { error } = await svc().from('community_posts').delete().eq('post_id', id);
  if (error) throw new Error(error.message);
}

interface ReportRow {
  report_id: number;
  post_id: number;
  reporter_id: number | null;
  reason: string | null;
  status: string | null;
  created_at: string;
  users: { fullname: string } | { fullname: string }[] | null;
}

function mapReport(row: ReportRow): CommunityReport {
  const reporter = one(row.users);
  return {
    id: row.report_id,
    postId: row.post_id,
    reportedBy: { id: row.reporter_id ?? 0, name: reporter?.fullname ?? 'Unknown' },
    reason: row.reason ?? '',
    status: (row.status as ReportStatus) ?? 'open',
    createdAt: row.created_at,
  };
}

const REPORT_SELECT =
  'report_id, post_id, reporter_id, reason, status, created_at, users(fullname)';

export async function listReports(): Promise<CommunityReport[]> {
  const { data, error } = await svc()
    .from('community_reports')
    .select(REPORT_SELECT)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return ((data ?? []) as unknown as ReportRow[]).map(mapReport);
}

export async function updateReportStatus(
  id: number,
  status: ReportStatus
): Promise<CommunityReport> {
  if (!['open', 'resolved', 'dismissed'].includes(status)) {
    throw new HttpError(400, `Unknown report status "${status}".`);
  }
  const { error } = await svc().from('community_reports').update({ status }).eq('report_id', id);
  if (error) throw new Error(error.message);

  const { data, error: readError } = await svc()
    .from('community_reports')
    .select(REPORT_SELECT)
    .eq('report_id', id)
    .maybeSingle();
  if (readError) throw new Error(readError.message);
  if (!data) throw new HttpError(404, `Report ${id} was not found.`);
  return mapReport(data as unknown as ReportRow);
}

// ---------------------------------------------------------------------------
// Analytics
// ---------------------------------------------------------------------------

export async function getOverview(): Promise<OverviewResponse> {
  const days = dayKeys(7);
  const since7 = days[0].key;
  const since30 = dayKeys(30)[0].key;

  const [
    profilesRes,
    activityRes,
    progressRes,
    conversationsRes,
    speechRes,
    tutorRes,
    sessionsRes,
    aiEventsRes,
    completedLessonsRes,
    xpLogsRes,
    totalUsers,
    reportsCount,
    conversationCount,
    speechCount,
    tutorCount,
    aiEventCount,
    completedCount,
  ] = await Promise.all([
    svc().from('learner_profiles').select('user_id, total_xp, streak'),
    svc().from('daily_activity').select('user_id, activity_date, xp_earned'),
    svc().from('learning_progress').select('completion_percent, created_at'),
    svc().from('conversations').select('created_at').gte('created_at', since30),
    svc().from('speech_records').select('created_at').gte('created_at', since30),
    svc().from('tutor_sessions').select('started_at').gte('started_at', since30),
    svc().from('learning_sessions').select('duration_seconds'),
    svc().from('ai_usage_events').select('ok, created_at'),
    svc().from('completed_lessons').select('xp_awarded, completed_at'),
    svc().from('xp_logs').select('amount, source'),
    countOf('users'),
    countOf('community_reports'),
    countOf('conversations'),
    countOf('speech_records'),
    countOf('tutor_sessions'),
    countOf('ai_usage_events'),
    countOf('completed_lessons'),
  ]);

  const profiles = (profilesRes.data ?? []) as { total_xp: number | null; streak: number | null }[];
  const activity = (activityRes.data ?? []) as { user_id: number; activity_date: string }[];
  const progress = (progressRes.data ?? []) as {
    completion_percent: number | null;
    created_at: string;
  }[];
  const conversations = (conversationsRes.data ?? []) as { created_at: string }[];
  const speech = (speechRes.data ?? []) as { created_at: string }[];
  const tutors = (tutorRes.data ?? []) as { started_at: string }[];
  const sessions = (sessionsRes.data ?? []) as { duration_seconds: number | null }[];
  const aiEvents = (aiEventsRes.data ?? []) as { ok: boolean | null; created_at: string }[];
  const completedLessons = (completedLessonsRes.data ?? []) as {
    xp_awarded: number | null;
    completed_at: string;
  }[];
  const xpLogs = (xpLogsRes.data ?? []) as { amount: number | null; source: string | null }[];

  const today = dayKey(new Date());
  const distinct = (rows: { user_id: number }[]) => new Set(rows.map((r) => r.user_id));

  const activeToday = distinct(activity.filter((a) => a.activity_date === today)).size;
  const weeklyActive = distinct(activity.filter((a) => a.activity_date >= since7)).size;
  const monthlyActive = distinct(activity.filter((a) => a.activity_date >= since30)).size;

  const ledgerXp = xpLogs
    .filter((entry) => {
      const source = (entry.source ?? '').toLowerCase();
      return !(source.includes('lesson') || source.includes('completion') || source === 'auto');
    })
    .reduce((sum, entry) => sum + toNumber(entry.amount), 0);
  const lessonXp = completedLessons.reduce((sum, entry) => sum + toNumber(entry.xp_awarded), 0);
  const totalXp = lessonXp + ledgerXp;
  const streakDays = profiles.reduce((max, p) => Math.max(max, toNumber(p.streak)), 0);

  const aiSuccessRequests = aiEvents.filter((event) => event.ok !== false).length;
  const aiFailedRequests = aiEvents.length - aiSuccessRequests;
  const aiFailureRate = aiEvents.length
    ? Math.round((aiFailedRequests / aiEvents.length) * 1000) / 10
    : 0;

  const avgSessionSeconds = sessions.length
    ? sessions.reduce((sum, s) => sum + toNumber(s.duration_seconds), 0) / sessions.length
    : 0;

  const weeklyActiveTrend: SeriesPoint[] = days.map((day) => ({
    label: day.label,
    value: distinct(activity.filter((a) => a.activity_date === day.key)).size,
  }));

  const lessonsTrend: SeriesPoint[] = days.map((day) => ({
    label: day.label,
    value: completedLessons.filter((lesson) => dayKey(lesson.completed_at) === day.key).length,
  }));

  const aiTrend: SeriesPoint[] = days.map((day) => ({
    label: day.label,
    value: aiEvents.filter((event) => dayKey(event.created_at) === day.key).length,
  }));

  const lastLessonCompletedAt =
    completedLessons.reduce<string | null>(
      (latest, lesson) =>
        !latest || new Date(lesson.completed_at) > new Date(latest) ? lesson.completed_at : latest,
      null
    ) ?? null;
  const lastAiRequestAt =
    aiEvents.reduce<string | null>(
      (latest, event) =>
        !latest || new Date(event.created_at) > new Date(latest) ? event.created_at : latest,
      null
    ) ?? null;

  return {
    stats: {
      totalUsers,
      activeToday,
      weeklyActive,
      monthlyActive,
      // Verified lesson completions; `learning_progress` is only a mirror.
      lessonsCompleted: completedCount,
      avgXpPerUser: totalUsers ? Math.round(totalXp / totalUsers) : 0,
      avgSessionMinutes: Math.round(avgSessionSeconds / 60),
      aiRequests: aiEventCount,
      aiSuccessRequests,
      aiFailedRequests,
      aiFailureRate,
      communityReports: reportsCount,
      streakDays,
      lastLessonCompletedAt,
      lastAiRequestAt,
    },
    weeklyActive: weeklyActiveTrend,
    lessonsTrend,
    aiTrend,
    generatedAt: new Date().toISOString(),
    rangeDays: 7,
  };
}

/**
 * Truthful service health.
 *
 * Every value is the result of an actual check performed right now, never a
 * static default:
 *
 *   - db   : a real round-trip through the service-role client. A failure means
 *            PostgREST or Postgres is unreachable, reported as `error`.
 *   - api  : `up` — the fact that this handler ran proves the admin API is up.
 *   - groq / whisper / storage : `unknown`. Groq and Whisper run inside
 *            Supabase Edge Functions and their keys are Edge Function secrets
 *            this app cannot introspect; Storage needs its own credentials.
 *            None can be verified from here, so they report `unknown` rather
 *            than a green `configured`. The AI Usage page shows the real
 *            request volume these providers actually serve.
 */
async function readSuccessfulCheck(): Promise<string | null> {
  try {
    const { data } = await svc()
      .from('platform_settings')
      .select('value')
      .eq('key', 'monitor.last_successful_check')
      .maybeSingle();
    const value = (data as { value?: unknown } | null)?.value;
    return typeof value === 'string' ? value : null;
  } catch {
    return null;
  }
}

async function stampSuccessfulCheck(iso: string): Promise<void> {
  try {
    await svc()
      .from('platform_settings')
      .upsert(
        { key: 'monitor.last_successful_check', value: iso, updated_at: iso },
        { onConflict: 'key' }
      );
  } catch {
    // A monitor stamp is best-effort; never fail a health probe over it.
  }
}

export async function getHealth(): Promise<SystemHealth> {
  let db: SystemHealth['db'] = 'error';
  const started = Date.now();
  try {
    // `avatars` is a tiny catalogue table; a counted head request is the
    // cheapest full round-trip (auth -> PostgREST -> Postgres -> response).
    const { error } = await svc()
      .from('avatars')
      .select('avatar_id', { head: true, count: 'exact' });
    db = error ? 'error' : 'connected';
  } catch {
    db = 'error';
  }
  const latencyMs = Date.now() - started;
  const reachable = db === 'connected';
  const now = new Date().toISOString();
  if (reachable) await stampSuccessfulCheck(now);
  const lastSuccessfulCheck = reachable ? now : await readSuccessfulCheck();

  return {
    // `unknown` providers are not proof of failure, so the platform is only
    // `down` when the database itself is unreachable.
    status: reachable ? 'healthy' : 'down',
    db,
    api: 'up',
    groq: 'unknown',
    whisper: 'unknown',
    storage: 'unknown',
    lastChecked: now,
    latencyMs,
    lastSuccessfulCheck,
  };
}

export async function getAiUsage(): Promise<AiUsageStats> {
  const days = dayKeys(7);
  const since = `${days[0].key}T00:00:00.000Z`;

  const [eventsRes, users, legacyConversations, legacySpeech, legacyTutor, voiceCount] =
    await Promise.all([
      svc()
        .from('ai_usage_events')
        .select(
          'id, user_id, agent_id, mode, provider, model, key_alias, input_tokens, output_tokens, units, tokens_charged, latency_ms, cached, ok, error, created_at'
        )
        .gte('created_at', since)
        .order('created_at', { ascending: false })
        .limit(5000),
      loadAuthUsers(),
      countOf('conversations'),
      countOf('speech_records'),
      countOf('tutor_sessions'),
      countVoiceSessions(),
    ]);
  if (eventsRes.error) throw new Error(eventsRes.error.message);

  type EventRow = {
    id: number | string;
    user_id: string | null;
    agent_id: string | null;
    mode: string | null;
    provider: string | null;
    model: string | null;
    key_alias: string | null;
    input_tokens: number | null;
    output_tokens: number | null;
    units: number | null;
    tokens_charged: number | null;
    latency_ms: number | null;
    cached: boolean | null;
    ok: boolean | null;
    error: string | null;
    created_at: string;
  };

  const events: AiUsageEvent[] = ((eventsRes.data ?? []) as EventRow[]).map((row) => {
    const owner = row.user_id ? users.get(row.user_id) : undefined;
    const inputTokens = toNumber(row.input_tokens);
    const outputTokens = toNumber(row.output_tokens);
    const totalTokens = inputTokens + outputTokens;
    return {
      id: String(row.id),
      userId: row.user_id,
      userName: owner?.name ?? (row.user_id ? 'Learner' : 'System'),
      userEmail: owner?.email ?? '',
      agentId: row.agent_id,
      mode: row.mode ?? 'unknown',
      provider: row.provider ?? 'unknown',
      model: row.model ?? 'unknown',
      keyAlias: row.key_alias,
      inputTokens: inputTokens || null,
      outputTokens: outputTokens || null,
      totalTokens: totalTokens || null,
      units: toNumber(row.units) || null,
      tokensCharged: toNumber(row.tokens_charged) || null,
      latencyMs: toNumber(row.latency_ms) || null,
      cached: row.cached === true,
      ok: row.ok !== false,
      error: row.error,
      tokenSource: totalTokens > 0 ? 'provider' : 'unavailable',
      createdAt: row.created_at,
    };
  });

  const totalRequests = events.length;
  const successRequests = events.filter((event) => event.ok).length;
  const failedRequests = totalRequests - successRequests;
  const latencies = events
    .filter((event) => event.ok && toNumber(event.latencyMs) > 0)
    .map((event) => toNumber(event.latencyMs));
  const inputTokens = events.reduce((sum, event) => sum + toNumber(event.inputTokens), 0);
  const outputTokensTotal = events.reduce((sum, event) => sum + toNumber(event.outputTokens), 0);
  const totalUnits = events.reduce((sum, event) => sum + toNumber(event.units), 0);

  const providerMap = new Map<
    string,
    {
      name: string;
      requests: number;
      failed: number;
      tokens: number;
      units: number;
      latencyTotal: number;
      latencyCount: number;
    }
  >();
  const modeMap = new Map<string, { mode: string; requests: number; failed: number; tokens: number }>();
  const modelMap = new Map<
    string,
    {
      provider: string;
      model: string;
      requests: number;
      failed: number;
      tokens: number;
      latencyTotal: number;
      latencyCount: number;
    }
  >();

  for (const event of events) {
    const tokens = toNumber(event.inputTokens) + toNumber(event.outputTokens);
    const provider = providerMap.get(event.provider) ?? {
      name: event.provider,
      requests: 0,
      failed: 0,
      tokens: 0,
      units: 0,
      latencyTotal: 0,
      latencyCount: 0,
    };
    provider.requests += 1;
    if (!event.ok) provider.failed += 1;
    provider.tokens += tokens;
    provider.units += toNumber(event.units);
    if (event.ok && toNumber(event.latencyMs) > 0) {
      provider.latencyTotal += toNumber(event.latencyMs);
      provider.latencyCount += 1;
    }
    providerMap.set(event.provider, provider);

    const mode = modeMap.get(event.mode) ?? {
      mode: event.mode,
      requests: 0,
      failed: 0,
      tokens: 0,
    };
    mode.requests += 1;
    if (!event.ok) mode.failed += 1;
    mode.tokens += tokens;
    modeMap.set(event.mode, mode);

    const modelKey = `${event.provider}\u0000${event.model}`;
    const model = modelMap.get(modelKey) ?? {
      provider: event.provider,
      model: event.model,
      requests: 0,
      failed: 0,
      tokens: 0,
      latencyTotal: 0,
      latencyCount: 0,
    };
    model.requests += 1;
    if (!event.ok) model.failed += 1;
    model.tokens += tokens;
    if (event.ok && toNumber(event.latencyMs) > 0) {
      model.latencyTotal += toNumber(event.latencyMs);
      model.latencyCount += 1;
    }
    modelMap.set(modelKey, model);
  }

  const trend: SeriesPoint[] = days.map((day) => ({
    label: day.label,
    value: events.filter((event) => dayKey(event.createdAt) === day.key).length,
  }));

  return {
    totalRequests,
    successRequests,
    conversations: events.filter((event) => event.mode === 'chat').length || legacyConversations,
    voiceRequests:
      events.filter((event) => ['tts', 'stt', 'voice'].includes(event.mode)).length || voiceCount,
    whisperRequests:
      events.filter((event) => event.model.includes('scribe')).length || legacySpeech,
    tutorRequests: events.filter((event) => event.mode === 'tutor').length || legacyTutor,
    failedRequests,
    failureRate: totalRequests ? Math.round((failedRequests / totalRequests) * 1000) / 10 : 0,
    avgResponseMs: latencies.length
      ? Math.round(latencies.reduce((sum, value) => sum + value, 0) / latencies.length)
      : 0,
    totalTokens: inputTokens + outputTokensTotal,
    totalUnits,
    inputTokens,
    outputTokens: outputTokensTotal,
    tokenAvailability: inputTokens + outputTokensTotal > 0 ? 'provider' : 'unavailable',
    providers: [...providerMap.values()]
      .map((provider) => ({
        name: provider.name,
        requests: provider.requests,
        failed: provider.failed,
        tokens: provider.tokens,
        units: provider.units,
        avgLatencyMs: provider.latencyCount
          ? Math.round(provider.latencyTotal / provider.latencyCount)
          : 0,
      }))
      .sort((a, b) => b.requests - a.requests),
    modes: [...modeMap.values()].sort((a, b) => b.requests - a.requests),
    models: [...modelMap.values()]
      .map((model) => ({
        provider: model.provider,
        model: model.model,
        requests: model.requests,
        failed: model.failed,
        tokens: model.tokens,
        avgLatencyMs: model.latencyCount
          ? Math.round(model.latencyTotal / model.latencyCount)
          : 0,
      }))
      .sort((a, b) => b.requests - a.requests),
    events,
    trend,
    generatedAt: new Date().toISOString(),
    rangeDays: 7,
  };
}

export async function getXpOverview(): Promise<XpOverview> {
  const days = dayKeys(7);
  const since = days[0].key;

  const { rows, aggregates } = await buildUserList();
  const [ledgerRes, weeklyActivityRes, weeklyLessonsRes] = await Promise.all([
    svc()
      .from('xp_logs')
      .select('id, user_id, amount, source, description, timestamp, idempotency_key')
      .order('timestamp', { ascending: false })
      .limit(5000),
    svc()
      .from('learner_daily_activity')
      .select('user_id, xp_earned, activity_date')
      .gte('activity_date', since),
    svc()
      .from('completed_lessons')
      .select('xp_awarded, completed_at')
      .gte('completed_at', `${since}T00:00:00.000Z`),
  ]);

  const userById = new Map(rows.map((row) => [row.user_id, row]));

  type LedgerRow = {
    id: string;
    user_id: number | null;
    amount: number | null;
    source: string | null;
    description: string | null;
    timestamp: string;
    idempotency_key: string | null;
  };
  const ledgerRows = (ledgerRes.data ?? []) as LedgerRow[];

  const aggregatesList = [...aggregates.values()];
  const totalXpAwarded = aggregatesList.reduce((sum, agg) => sum + agg.xp, 0);
  const earnedFromLessons = aggregatesList.reduce((sum, agg) => sum + agg.lessonXp, 0);
  const manualAdjustments = aggregatesList.reduce((sum, agg) => sum + agg.manualXp, 0);

  const weeklyActivityXp = ((weeklyActivityRes.data ?? []) as { xp_earned: number | null }[]).reduce(
    (sum, row) => sum + toNumber(row.xp_earned),
    0
  );
  const weeklyLessonXp = ((weeklyLessonsRes.data ?? []) as { xp_awarded: number | null }[]).reduce(
    (sum, row) => sum + toNumber(row.xp_awarded),
    0
  );
  const weeklyXp = Math.max(weeklyActivityXp, weeklyLessonXp);

  const dailyRewardsClaimed = ((weeklyActivityRes.data ?? []) as { xp_earned: number | null }[]).filter(
    (row) => toNumber(row.xp_earned) > 0
  ).length;

  const buckets = new Map<number, number>();
  for (const row of rows) {
    const xp = aggregates.get(row.user_id)?.xp ?? 0;
    const level = levelFromXp(xp);
    buckets.set(level, (buckets.get(level) ?? 0) + 1);
  }
  const maxLevel = Math.max(LEVEL_THRESHOLDS.length, ...[...buckets.keys()]);
  const levelDistribution: SeriesPoint[] = [];
  for (let level = 1; level <= maxLevel; level += 1) {
    levelDistribution.push({ label: `L${level}`, value: buckets.get(level) ?? 0 });
  }

  const topUsers: TopUser[] = [...rows]
    .map((row) => {
      const agg = aggregates.get(row.user_id);
      const xp = agg?.xp ?? 0;
      return {
        id: row.user_id,
        name: row.fullname,
        level: levelFromXp(xp),
        xp,
        streak: toNumber(one(row.learner_profiles)?.streak),
      };
    })
    .sort((a, b) => b.xp - a.xp)
    .slice(0, 5);

  const ledger: XpLedgerEntry[] = ledgerRows.map((entry) => {
    const owner = entry.user_id !== null ? userById.get(entry.user_id) : undefined;
    return {
      id: entry.id,
      userId: entry.user_id ?? 0,
      userName: owner?.fullname ?? 'Unknown',
      userEmail: owner?.email ?? '',
      amount: toNumber(entry.amount),
      source: entry.source ?? 'unknown',
      description: entry.description ?? '',
      timestamp: entry.timestamp,
      idempotencyKey: entry.idempotency_key,
    };
  });

  return {
    totalXpAwarded,
    earnedFromLessons,
    manualAdjustments,
    avgDailyXp: Math.round(weeklyXp / days.length),
    dailyRewardsClaimed,
    levelDistribution,
    topUsers,
    ledger: ledger.slice(0, 100),
    ledgerTotal: ledgerRows.reduce((sum, entry) => sum + toNumber(entry.amount), 0),
    generatedAt: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Feedback
// ---------------------------------------------------------------------------

interface FeedbackRow {
  feedback_id: number;
  functionality: number | null;
  usability: number | null;
  reliability: number | null;
  comment: string | null;
  resolved: number | null;
  created_at: string;
  category?: string | null;
  status?: string | null;
  admin_response?: string | null;
  responded_at?: string | null;
  responded_by?: string | null;
  source?: string | null;
  users:
    | { user_id: number; fullname: string; email: string }
    | { user_id: number; fullname: string; email: string }[]
    | null;
}

// `category`, `status`, `admin_response`, `responded_at` and `source` are added
// by the additive migration. `*` keeps this working before it is applied.
const FEEDBACK_SELECT = '*, users(user_id, fullname, email)';

function mapFeedback(row: FeedbackRow): FeedbackItem {
  const user = one(row.users);
  const resolved = row.resolved === 1;
  return {
    id: row.feedback_id,
    user: { id: user?.user_id ?? 0, name: user?.fullname ?? 'Unknown', email: user?.email ?? '' },
    functionality: toNumber(row.functionality),
    usability: toNumber(row.usability),
    reliability: toNumber(row.reliability),
    comment: row.comment ?? undefined,
    resolved,
    createdAt: row.created_at,
    category: row.category ?? 'general',
    status: (row.status as FeedbackItem['status']) ?? (resolved ? 'resolved' : 'open'),
    adminResponse: row.admin_response ?? null,
    respondedAt: row.responded_at ?? null,
    respondedBy: row.responded_by ?? null,
    source: row.source ?? 'app',
  };
}

export async function listFeedback(): Promise<FeedbackItem[]> {
  const { data, error } = await svc()
    .from('feedback')
    .select(FEEDBACK_SELECT)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return ((data ?? []) as unknown as FeedbackRow[]).map(mapFeedback);
}

export async function resolveFeedback(id: number): Promise<FeedbackItem> {
  const { data, error } = await svc()
    .from('feedback')
    .select('resolved')
    .eq('feedback_id', id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new HttpError(404, `Feedback ${id} was not found.`);

  const { error: updateError } = await svc()
    .from('feedback')
    .update({ resolved: data.resolved === 1 ? 0 : 1 })
    .eq('feedback_id', id);
  if (updateError) throw new Error(updateError.message);

  const { data: row, error: readError } = await svc()
    .from('feedback')
    .select(FEEDBACK_SELECT)
    .eq('feedback_id', id)
    .maybeSingle();
  if (readError) throw new Error(readError.message);
  if (!row) throw new HttpError(404, `Feedback ${id} was not found.`);
  return mapFeedback(row as unknown as FeedbackRow);
}

// ---------------------------------------------------------------------------
// Preservation
// ---------------------------------------------------------------------------

interface PreservedRow {
  word_id: number;
  word: string;
  definition: string | null;
  dialectal_region: string | null;
  variations: string[] | null;
  submitted_by: number | null;
  status: string | null;
  created_at: string;
  users: { fullname: string } | { fullname: string }[] | null;
}

const PRESERVED_SELECT =
  'word_id, word, definition, dialectal_region, variations, submitted_by, status, created_at, users(fullname)';

function mapPreserved(row: PreservedRow): PreservedWord {
  const submitter = one(row.users);
  return {
    id: row.word_id,
    word: row.word,
    dialect: row.dialectal_region ?? 'Unknown',
    meaning: row.definition ?? '',
    submittedBy: { id: row.submitted_by ?? 0, name: submitter?.fullname ?? 'Unknown' },
    status: (row.status as VerificationStatus) ?? 'pending',
    variations: Array.isArray(row.variations) ? row.variations : [],
    createdAt: row.created_at,
  };
}

export async function listPreserved(): Promise<PreservedWord[]> {
  const { data, error } = await svc()
    .from('preserved_words')
    .select(PRESERVED_SELECT)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return ((data ?? []) as unknown as PreservedRow[]).map(mapPreserved);
}

export async function verifyPreserved(
  id: number,
  status: VerificationStatus
): Promise<PreservedWord> {
  if (!['pending', 'approved', 'rejected'].includes(status)) {
    throw new HttpError(400, `Unknown verification status "${status}".`);
  }
  const { error } = await svc().from('preserved_words').update({ status }).eq('word_id', id);
  if (error) throw new Error(error.message);

  const { data, error: readError } = await svc()
    .from('preserved_words')
    .select(PRESERVED_SELECT)
    .eq('word_id', id)
    .maybeSingle();
  if (readError) throw new Error(readError.message);
  if (!data) throw new HttpError(404, `Word ${id} was not found.`);
  return mapPreserved(data as unknown as PreservedRow);
}

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

const SETTINGS_KEY = 'admin';

const DEFAULT_SETTINGS: Omit<AdminSettings, 'admins' | 'updatedAt'> = {
  maintenanceMode: false,
  allowSignups: true,
  allowCommunity: true,
  requireVerificationForCommunity: false,
  dailyXpGoal: 50,
  maxDailyAiRequests: 100,
  aiProvider: 'auto',
};

async function listAdmins(): Promise<AdminSettings['admins']> {
  const { data, error } = await svc()
    .from('users')
    .select('user_id, fullname, email, role')
    .in('role', ['admin', 'moderator'])
    .order('fullname', { ascending: true });
  if (error) throw new Error(error.message);
  return ((data ?? []) as { user_id: number; fullname: string; email: string; role: string }[]).map(
    (row) => ({
      id: row.user_id,
      name: row.fullname,
      email: row.email,
      role: row.role as UserRole,
    })
  );
}

export async function getSettings(): Promise<AdminSettings> {
  const [row, admins] = await Promise.all([
    svc()
      .from('platform_settings')
      .select('value, updated_at')
      .eq('key', SETTINGS_KEY)
      .maybeSingle(),
    listAdmins(),
  ]);
  if (row.error) throw new Error(row.error.message);

  const value = (row.data?.value ?? {}) as Partial<AdminSettings>;
  return {
    ...DEFAULT_SETTINGS,
    ...value,
    admins,
    updatedAt: (row.data?.updated_at as string) ?? new Date().toISOString(),
  };
}

export async function updateSettings(patch: Partial<AdminSettings>): Promise<AdminSettings> {
  const current = await svc()
    .from('platform_settings')
    .select('value')
    .eq('key', SETTINGS_KEY)
    .maybeSingle();
  if (current.error) throw new Error(current.error.message);

  const existing = (current.data?.value ?? {}) as Record<string, unknown>;
  const safePatch: Record<string, unknown> = { ...patch };
  // `admins` and `updatedAt` are derived, never persisted as operator input.
  delete safePatch.admins;
  delete safePatch.updatedAt;
  const merged = { ...existing, ...safePatch };

  const { error } = await svc()
    .from('platform_settings')
    .upsert(
      { key: SETTINGS_KEY, value: merged, updated_at: new Date().toISOString() },
      { onConflict: 'key' }
    );
  if (error) throw new Error(error.message);

  return getSettings();
}

// ---------------------------------------------------------------------------
// Audit logs
// ---------------------------------------------------------------------------

interface AuditLogRow {
  id: number;
  user_id: string | number | null;
  action: string | null;
  resource_type: string | null;
  resource_id: string | null;
  details: string | null;
  timestamp: string | null;
  event_type: string | null;
  category: string | null;
  actor: string | null;
  actor_role: string | null;
  description: string | null;
  severity: string | null;
  latency_ms: number | null;
  metadata: Record<string, unknown> | null;
  created_at: string | null;
}

interface AuditActor {
  id: number;
  name: string;
  email: string;
  role?: string;
  authUuid?: string;
}

type AuditActorDirectory = {
  byId: Map<number, AuditActor>;
  byAuth: Map<string, AuditActor>;
};

/**
 * Resolves `audit_logs.user_id` (a TEXT auth UUID) to the matching profile.
 * The `users` table is small, so one directory load covers every row on a page.
 */
async function loadAuditActorDirectory(): Promise<AuditActorDirectory> {
  const { data, error } = await svc()
    .from('users')
    .select('user_id, fullname, email, role, auth_uuid, supabase_id');
  if (error) throw new Error(error.message);

  const byId = new Map<number, AuditActor>();
  const byAuth = new Map<string, AuditActor>();
  for (const row of (data ?? []) as {
    user_id: number;
    fullname: string | null;
    email: string | null;
    role: string | null;
    auth_uuid: string | null;
    supabase_id: string | null;
  }[]) {
    const actor: AuditActor = {
      id: row.user_id,
      name: row.fullname ?? '',
      email: row.email ?? '',
      role: row.role ?? 'user',
      authUuid: row.auth_uuid ?? row.supabase_id ?? undefined,
    };
    byId.set(row.user_id, actor);
    if (row.auth_uuid) byAuth.set(row.auth_uuid, actor);
    if (row.supabase_id) byAuth.set(row.supabase_id, actor);
  }
  return { byId, byAuth };
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function resolveAuditActor(row: AuditLogRow, directory: AuditActorDirectory) {
  const raw = row.user_id === null || row.user_id === undefined ? null : String(row.user_id);
  const actor =
    raw !== null
      ? directory.byAuth.get(raw) ??
        (/^\d+$/.test(raw) ? directory.byId.get(Number(raw)) : undefined)
      : undefined;

  const actorText = (row.actor ?? '').trim();
  const actorRole = (row.actor_role ?? '').trim().toLowerCase();

  let actorKind: AuditLog['actorKind'] = 'unknown';
  if (actor) {
    actorKind =
      actor.role === 'admin' ? 'admin' : actor.role === 'moderator' ? 'moderator' : 'user';
  } else if (
    /^(system|automation|service|cron|supabase|trigger|postgres)/i.test(actorText) ||
    actorRole === 'system'
  ) {
    actorKind = 'system';
  }

  let actorLabel: string;
  if (actor) {
    actorLabel = actor.name || actor.email || 'Unknown Actor';
  } else if (actorKind === 'system') {
    actorLabel = actorText || 'System';
  } else if (actorText && !UUID_RE.test(actorText)) {
    actorLabel = actorText;
  } else {
    actorLabel = 'Unknown Actor';
  }

  return { actor: actor ?? null, actorLabel, actorKind };
}

export async function listAuditLogs(query: AuditLogFilters & {
  page: number;
  perPage: number;
}): Promise<AuditLogResponse> {
  const page = Math.max(1, Math.floor(query.page) || 1);
  const perPage = Math.min(100, Math.max(1, Math.floor(query.perPage) || 20));
  const from = (page - 1) * perPage;

  const directory = await loadAuditActorDirectory();

  let q = svc().from('audit_logs').select('*', { count: 'exact' });

  if (query.resourceType && query.resourceType !== 'all') {
    q = q.or(
      `resource_type.eq.${query.resourceType},category.eq.${query.resourceType}`
    );
  }
  if (query.actorId && query.actorId !== 'all') {
    const actor = directory.byId.get(query.actorId);
    const candidates = [String(query.actorId)];
    if (actor?.authUuid) candidates.unshift(actor.authUuid);
    q = q.in('user_id', candidates);
  }
  if (query.search) {
    const term = query.search.replace(/[%_,]/g, '');
    if (term) {
      q = q.or(
        `action.ilike.%${term}%,details.ilike.%${term}%,description.ilike.%${term}%,event_type.ilike.%${term}%`
      );
    }
  }

  const { data, error, count } = await q
    .order('created_at', { ascending: false })
    .range(from, from + perPage - 1);
  if (error) throw new Error(error.message);

  const rows = (data ?? []) as AuditLogRow[];

  const items: AuditLog[] = rows.map((row) => {
    const resolved = resolveAuditActor(row, directory);
    return {
      id: row.id,
      action: row.action || row.event_type || row.category || 'unknown',
      resourceType: row.resource_type || row.category || 'system',
      resourceId: row.resource_id,
      details: row.details ?? row.description,
      timestamp: row.timestamp || row.created_at || new Date().toISOString(),
      eventType: row.event_type ?? (row.action || null),
      category: row.category ?? (row.resource_type || null),
      severity: row.severity,
      description: row.description ?? row.details,
      latencyMs: row.latency_ms === null ? null : toNumber(row.latency_ms),
      metadata: row.metadata && typeof row.metadata === 'object' ? row.metadata : null,
      actor: resolved.actor,
      actorLabel: resolved.actorLabel,
      actorKind: resolved.actorKind,
    };
  });

  return {
    items,
    total: count ?? items.length,
    page,
    perPage,
    generatedAt: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// AI token economy (wallets, providers, settings, voice profiles, upgrades)
// ---------------------------------------------------------------------------

type AuthUserLite = {
  id: string;
  email: string;
  name: string;
  lastSignInAt: string | null;
  emailConfirmed: boolean;
};

type AuthLookup = {
  byId: Map<string, AuthUserLite>;
  byEmail: Map<string, AuthUserLite>;
};

/**
 * Auth-side identities for names, sign-in timestamps and UUID resolution.
 * Failures degrade to an empty lookup instead of breaking a page.
 */
async function loadAuthLookup(): Promise<AuthLookup> {
  const byId = new Map<string, AuthUserLite>();
  const byEmail = new Map<string, AuthUserLite>();
  try {
    const { data } = await svc().auth.admin.listUsers({ page: 1, perPage: 1000 });
    for (const user of data?.users ?? []) {
      const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
      const entry: AuthUserLite = {
        id: user.id,
        email: user.email ?? '',
        name:
          (typeof meta.full_name === 'string' && meta.full_name) ||
          (typeof meta.name === 'string' && meta.name) ||
          (user.email ? user.email.split('@')[0] : 'Learner'),
        lastSignInAt: user.last_sign_in_at ?? null,
        emailConfirmed: Boolean(user.email_confirmed_at),
      };
      byId.set(user.id, entry);
      if (entry.email) byEmail.set(entry.email.toLowerCase(), entry);
    }
  } catch {
    // Names are decorative; ignore failures.
  }
  return { byId, byEmail };
}

/** Auth-side names for wallets and upgrade rows, keyed by auth UUID. */
async function loadAuthUsers(): Promise<Map<string, AuthUserLite>> {
  return (await loadAuthLookup()).byId;
}

function availabilityOf(inputTokens: number, outputTokens: number): TokenAvailability {
  if (inputTokens + outputTokens > 0) return 'provider';
  return 'unavailable';
}

export async function getAiTokenOverview(): Promise<AiTokenOverview> {
  const days = dayKeys(7);
  const since7 = `${days[0].key}T00:00:00.000Z`;
  const since30 = new Date(Date.now() - 30 * 86400_000).toISOString();

  const [walletsRes, eventsRes, ledgerRes, pendingRes, users] = await Promise.all([
    svc()
      .from('ai_token_wallets')
      .select(
        'user_id, plan_id, balance, lifetime_granted, lifetime_spent, monthly_override, period_end, updated_at'
      )
      .limit(5000),
    svc()
      .from('ai_usage_events')
      .select(
        'user_id, agent_id, mode, provider, model, key_alias, input_tokens, output_tokens, units, tokens_charged, latency_ms, cached, ok, error, created_at'
      )
      .gte('created_at', since30)
      .limit(50000),
    svc()
      .from('ai_token_ledger')
      .select('user_id, delta, reason, created_at')
      .gte('created_at', since30)
      .limit(50000),
    svc()
      .from('ai_upgrade_requests')
      .select('id', { head: true, count: 'exact' })
      .eq('status', 'pending'),
    loadAuthUsers(),
  ]);

  type WalletRow = {
    user_id: string;
    plan_id: string;
    balance: number | null;
    lifetime_granted: number | null;
    lifetime_spent: number | null;
    monthly_override: number | null;
    period_end: string;
    updated_at: string;
  };
  type EventRow = {
    user_id: string | null;
    agent_id: string | null;
    mode: string | null;
    provider: string | null;
    model: string | null;
    input_tokens: number | null;
    output_tokens: number | null;
    units: number | null;
    tokens_charged: number | null;
    latency_ms: number | null;
    cached: boolean | null;
    ok: boolean | null;
    created_at: string;
  };
  type LedgerRow = {
    user_id: string;
    delta: number | null;
    reason: string | null;
    created_at: string;
  };

  const wallets = (walletsRes.data ?? []) as WalletRow[];
  const events = (eventsRes.data ?? []) as EventRow[];
  const ledger = (ledgerRes.data ?? []) as LedgerRow[];

  // Ledger is authoritative for token movement; usage events carry provider
  // telemetry (tokens, latency, cache) and can miss provider-level retries.
  const spendByUser = new Map<string, number>();
  const requestByUser = new Map<string, number>();
  for (const entry of ledger) {
    if (!entry.user_id || toNumber(entry.delta) >= 0) continue;
    spendByUser.set(entry.user_id, (spendByUser.get(entry.user_id) ?? 0) - toNumber(entry.delta));
    requestByUser.set(entry.user_id, (requestByUser.get(entry.user_id) ?? 0) + 1);
  }

  const events7 = events.filter((event) => event.created_at >= since7);
  const cached7 = events7.filter((event) => event.cached).length;
  const failed7 = events7.filter((event) => event.ok === false).length;
  const latency7 = events7
    .filter((event) => event.ok !== false && toNumber(event.latency_ms) > 0)
    .map((event) => toNumber(event.latency_ms));

  const monthStart = new Date();
  monthStart.setUTCDate(1);
  monthStart.setUTCHours(0, 0, 0, 0);
  const ledgerMonth = ledger.filter((entry) => new Date(entry.created_at) >= monthStart);

  const grantedThisMonth = ledgerMonth
    .filter((entry) => toNumber(entry.delta) > 0)
    .reduce((sum, entry) => sum + toNumber(entry.delta), 0);
  const spentThisMonth = ledgerMonth
    .filter((entry) => toNumber(entry.delta) < 0)
    .reduce((sum, entry) => sum - toNumber(entry.delta), 0);

  const reasonToMode = (reason: string | null): string => {
    switch (reason) {
      case 'chat_turn':
        return 'chat';
      case 'voice_minute':
        return 'voice';
      case 'tts':
        return 'tts';
      case 'stt':
        return 'stt';
      case 'evaluation':
        return 'evaluation';
      default:
        return 'other';
    }
  };

  // Usage mix prefers provider-reported tokens; falls back to charged tokens
  // only when the provider meters units rather than tokens.
  const byModeMap = new Map<string, { requests: number; tokens: number }>();
  for (const event of events) {
    const mode = event.mode || 'unknown';
    const bucket = byModeMap.get(mode) ?? { requests: 0, tokens: 0 };
    bucket.requests += 1;
    bucket.tokens +=
      toNumber(event.input_tokens) + toNumber(event.output_tokens) ||
      toNumber(event.tokens_charged);
    byModeMap.set(mode, bucket);
  }
  for (const entry of ledger) {
    const delta = toNumber(entry.delta);
    if (delta >= 0) continue;
    const mode = reasonToMode(entry.reason);
    if (byModeMap.has(mode)) continue;
    byModeMap.set(mode, { requests: 1, tokens: -delta });
  }

  const byProviderMap = new Map<
    string,
    { requests: number; tokens: number; failed: number; latencyTotal: number; latencyCount: number }
  >();
  for (const event of events) {
    const provider = event.provider || 'unknown';
    const bucket =
      byProviderMap.get(provider) ??
      { requests: 0, tokens: 0, failed: 0, latencyTotal: 0, latencyCount: 0 };
    bucket.requests += 1;
    bucket.tokens +=
      toNumber(event.input_tokens) + toNumber(event.output_tokens) ||
      toNumber(event.tokens_charged);
    if (event.ok === false) bucket.failed += 1;
    if (event.ok !== false && toNumber(event.latency_ms) > 0) {
      bucket.latencyTotal += toNumber(event.latency_ms);
      bucket.latencyCount += 1;
    }
    byProviderMap.set(provider, bucket);
  }

  const modelMap = new Map<
    string,
    {
      provider: string;
      model: string;
      requests: number;
      inputTokens: number;
      outputTokens: number;
    }
  >();
  for (const event of events) {
    const provider = event.provider || 'unknown';
    const model = event.model || 'unknown';
    const key = `${provider}\u0000${model}`;
    const bucket =
      modelMap.get(key) ??
      { provider, model, requests: 0, inputTokens: 0, outputTokens: 0 };
    bucket.requests += 1;
    bucket.inputTokens += toNumber(event.input_tokens);
    bucket.outputTokens += toNumber(event.output_tokens);
    modelMap.set(key, bucket);
  }

  const userTokenMap = new Map<
    string,
    { requests: number; inputTokens: number; outputTokens: number }
  >();
  for (const event of events) {
    const key = event.user_id ?? 'anonymous';
    const bucket =
      userTokenMap.get(key) ?? { requests: 0, inputTokens: 0, outputTokens: 0 };
    bucket.requests += 1;
    bucket.inputTokens += toNumber(event.input_tokens);
    bucket.outputTokens += toNumber(event.output_tokens);
    userTokenMap.set(key, bucket);
  }

  const dayTokenMap = new Map<string, { inputTokens: number; outputTokens: number; requests: number }>();
  for (const day of days) {
    dayTokenMap.set(day.key, { inputTokens: 0, outputTokens: 0, requests: 0 });
  }
  for (const event of events) {
    const key = dayKey(event.created_at);
    const bucket = dayTokenMap.get(key);
    if (!bucket) continue;
    bucket.requests += 1;
    bucket.inputTokens += toNumber(event.input_tokens);
    bucket.outputTokens += toNumber(event.output_tokens);
  }

  const topUsers = wallets
    .map((wallet) => {
      const owner = users.get(wallet.user_id);
      return {
        userId: wallet.user_id,
        name: owner?.name ?? 'Learner',
        email: owner?.email ?? '',
        planId: wallet.plan_id,
        balance: toNumber(wallet.balance),
        spent30d: spendByUser.get(wallet.user_id) ?? 0,
        requests30d: requestByUser.get(wallet.user_id) ?? 0,
      };
    })
    .sort((a, b) => b.spent30d - a.spent30d || b.balance - a.balance)
    .slice(0, 8);

  const byModel = [...modelMap.values()]
    .map((bucket) => {
      const totalTokens = bucket.inputTokens + bucket.outputTokens;
      return {
        provider: bucket.provider,
        model: bucket.model,
        requests: bucket.requests,
        inputTokens: bucket.inputTokens,
        outputTokens: bucket.outputTokens,
        totalTokens,
        availability: availabilityOf(bucket.inputTokens, bucket.outputTokens),
      };
    })
    .sort((a, b) => b.totalTokens - a.totalTokens || b.requests - a.requests);

  const byUser = [...userTokenMap.entries()]
    .map(([userId, bucket]) => {
      const owner = users.get(userId);
      const totalTokens = bucket.inputTokens + bucket.outputTokens;
      return {
        userId,
        name: owner?.name ?? (userId === 'anonymous' ? 'Anonymous' : 'Learner'),
        email: owner?.email ?? '',
        requests: bucket.requests,
        inputTokens: bucket.inputTokens,
        outputTokens: bucket.outputTokens,
        totalTokens,
        availability: availabilityOf(bucket.inputTokens, bucket.outputTokens),
      };
    })
    .sort((a, b) => b.totalTokens - a.totalTokens || b.requests - a.requests);

  const byDay = days.map((day) => {
    const bucket = dayTokenMap.get(day.key) ?? { inputTokens: 0, outputTokens: 0, requests: 0 };
    return {
      date: day.key,
      inputTokens: bucket.inputTokens,
      outputTokens: bucket.outputTokens,
      totalTokens: bucket.inputTokens + bucket.outputTokens,
      requests: bucket.requests,
    };
  });

  const hasProviderTokens = byModel.some((row) => row.availability === 'provider');

  const trend: SeriesPoint[] = days.map((day) => ({
    label: day.label,
    value: ledger
      .filter((entry) => toNumber(entry.delta) < 0 && dayKey(entry.created_at) === day.key)
      .reduce((sum, entry) => sum - toNumber(entry.delta), 0),
  }));

  return {
    totalWallets: wallets.length,
    totalBalance: wallets.reduce((sum, wallet) => sum + toNumber(wallet.balance), 0),
    grantedThisMonth,
    spentThisMonth,
    activeUsers30d: new Set(ledger.map((entry) => entry.user_id)).size,
    cachedRequests7d: cached7,
    cacheHitRate: events7.length ? Math.round((cached7 / events7.length) * 1000) / 10 : 0,
    failedRequests7d: failed7,
    avgLatencyMs: latency7.length
      ? Math.round(latency7.reduce((sum, ms) => sum + ms, 0) / latency7.length)
      : 0,
    pendingUpgrades: pendingRes.count ?? 0,
    trend,
    byMode: [...byModeMap.entries()]
      .map(([mode, value]) => ({ mode, ...value }))
      .sort((a, b) => b.tokens - a.tokens || b.requests - a.requests),
    byProvider: [...byProviderMap.entries()]
      .map(([provider, value]) => ({
        provider,
        requests: value.requests,
        tokens: value.tokens,
        failed: value.failed,
        avgLatencyMs: value.latencyCount
          ? Math.round(value.latencyTotal / value.latencyCount)
          : 0,
      }))
      .sort((a, b) => b.requests - a.requests),
    topUsers,
    byModel,
    byUser,
    byDay,
    tokenAvailability: hasProviderTokens ? 'provider' : 'unavailable',
    generatedAt: new Date().toISOString(),
  };
}

export async function listAiWallets(query: {
  search?: string;
  page?: number;
  perPage?: number;
} = {}): Promise<AiWalletList> {
  const search = (query.search ?? '').trim().toLowerCase();
  const page = Math.max(1, Math.floor(toNumber(query.page, 1)));
  const perPage = Math.min(200, Math.max(1, Math.floor(toNumber(query.perPage, 20))));
  const since30 = new Date(Date.now() - 30 * 86400_000).toISOString();

  const [walletsRes, ledgerRes, users] = await Promise.all([
    svc()
      .from('ai_token_wallets')
      .select(
        'user_id, plan_id, balance, lifetime_granted, lifetime_spent, monthly_override, note, period_start, period_end, updated_at'
      )
      .limit(5000),
    svc()
      .from('ai_token_ledger')
      .select('user_id, delta, created_at')
      .gte('created_at', since30)
      .limit(50000),
    loadAuthUsers(),
  ]);
  if (walletsRes.error) throw new Error(walletsRes.error.message);
  if (ledgerRes.error) throw new Error(ledgerRes.error.message);

  type WalletRow = {
    user_id: string;
    plan_id: string;
    balance: number | null;
    lifetime_granted: number | null;
    lifetime_spent: number | null;
    monthly_override: number | null;
    note: string | null;
    period_start: string;
    period_end: string;
    updated_at: string;
  };

  const spendByUser = new Map<string, number>();
  const requestByUser = new Map<string, number>();
  for (const row of (ledgerRes.data ?? []) as {
    user_id: string;
    delta: number | null;
  }[]) {
    if (toNumber(row.delta) >= 0) continue;
    spendByUser.set(row.user_id, (spendByUser.get(row.user_id) ?? 0) - toNumber(row.delta));
    requestByUser.set(row.user_id, (requestByUser.get(row.user_id) ?? 0) + 1);
  }

  let rows: AiWalletRow[] = ((walletsRes.data ?? []) as WalletRow[]).map((wallet) => {
    const owner = users.get(wallet.user_id);
    return {
      userId: wallet.user_id,
      name: owner?.name ?? 'Learner',
      email: owner?.email ?? '',
      planId: wallet.plan_id,
      balance: toNumber(wallet.balance),
      lifetimeGranted: toNumber(wallet.lifetime_granted),
      lifetimeSpent: toNumber(wallet.lifetime_spent),
      monthlyOverride: wallet.monthly_override,
      note: wallet.note,
      spent30d: spendByUser.get(wallet.user_id) ?? 0,
      requests30d: requestByUser.get(wallet.user_id) ?? 0,
      periodStart: wallet.period_start,
      periodEnd: wallet.period_end,
      updatedAt: wallet.updated_at,
    };
  });

  if (search) {
    rows = rows.filter(
      (row) =>
        row.name.toLowerCase().includes(search) ||
        row.email.toLowerCase().includes(search) ||
        row.userId.toLowerCase().includes(search)
    );
  }

  rows.sort((a, b) => b.balance - a.balance || b.spent30d - a.spent30d);
  const total = rows.length;
  const start = (page - 1) * perPage;
  return { rows: rows.slice(start, start + perPage), total, page, perPage };
}

export async function adminUpdateAiWallet(input: {
  userId: string;
  planId?: string;
  monthlyOverride?: number | null;
  note?: string | null;
  adjustBalance?: number;
  adminEmail?: string;
}): Promise<{ ok: true }> {
  const userId = String(input.userId ?? '').trim();
  if (!userId) throw new HttpError(400, 'userId is required.');

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (input.planId !== undefined) patch.plan_id = input.planId;
  if (input.monthlyOverride !== undefined) patch.monthly_override = input.monthlyOverride;
  if (input.note !== undefined) patch.note = input.note;

  const adjust = toNumber(input.adjustBalance, 0);
  if (adjust !== 0) {
    const { data: wallet, error } = await svc()
      .from('ai_token_wallets')
      .select('balance')
      .eq('user_id', userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!wallet) throw new HttpError(404, 'Token wallet was not found.');

    const next = Math.max(0, toNumber(wallet.balance) + adjust);
    patch.balance = next;

    const { error: ledgerError } = await svc().from('ai_token_ledger').insert({
      user_id: userId,
      delta: adjust,
      balance_after: next,
      reason: 'admin_adjustment',
      source: 'admin',
      metadata: { admin: input.adminEmail ?? null },
    });
    if (ledgerError) throw new Error(ledgerError.message);
  }

  const { error: updateError } = await svc()
    .from('ai_token_wallets')
    .update(patch)
    .eq('user_id', userId);
  if (updateError) throw new Error(updateError.message);

  return { ok: true };
}

export async function adminGrantAiTokens(input: {
  userId: string;
  amount: number;
  reason?: string;
  adminEmail?: string;
}): Promise<{ ok: true; balance: number }> {
  const userId = String(input.userId ?? '').trim();
  const amount = Math.floor(toNumber(input.amount));
  if (!userId) throw new HttpError(400, 'userId is required.');
  if (amount <= 0) throw new HttpError(400, 'amount must be a positive integer.');

  const { data, error } = await svc().rpc('ai_grant_tokens', {
    p_user: userId,
    p_amount: amount,
    p_reason: input.reason || 'Admin grant',
    p_source: 'admin',
    p_metadata: { admin: input.adminEmail ?? null },
  });
  if (error) throw new Error(error.message);

  const balance = toNumber((data as { balance?: number } | null)?.balance, 0);
  return { ok: true, balance };
}

export async function listAiProviders(): Promise<AiProviderRow[]> {
  const { data, error } = await svc()
    .from('ai_provider_accounts')
    .select(
      'id, provider, key_alias, agent_ids, monthly_quota, used_units, status, cooldown_until, last_error, last_used_at, updated_at'
    )
    .order('provider', { ascending: true });
  if (error) throw new Error(error.message);

  return ((data ?? []) as {
    id: string;
    provider: string;
    key_alias: string;
    agent_ids: string[] | null;
    monthly_quota: number | null;
    used_units: number | null;
    status: string;
    cooldown_until: string | null;
    last_error: string | null;
    last_used_at: string | null;
    updated_at: string;
  }[]).map((row) => ({
    id: row.id,
    provider: row.provider,
    keyAlias: row.key_alias,
    agentIds: Array.isArray(row.agent_ids) ? row.agent_ids : [],
    monthlyQuota: toNumber(row.monthly_quota),
    usedUnits: toNumber(row.used_units),
    status: row.status,
    cooldownUntil: row.cooldown_until,
    lastError: row.last_error,
    lastUsedAt: row.last_used_at,
    updatedAt: row.updated_at,
  }));
}

export async function adminUpdateAiProvider(input: {
  id: string;
  status?: string;
  monthlyQuota?: number;
}): Promise<{ ok: true }> {
  const id = String(input.id ?? '').trim();
  if (!id) throw new HttpError(400, 'Provider id is required.');

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (input.status !== undefined) patch.status = input.status;
  if (input.monthlyQuota !== undefined) patch.monthly_quota = input.monthlyQuota;

  const { error } = await svc().from('ai_provider_accounts').update(patch).eq('id', id);
  if (error) throw new Error(error.message);
  return { ok: true };
}

const DEFAULT_AI_SETTINGS: Omit<AiSettingsPayload, 'updatedAt'> = {
  freeMonthlyTokens: 5000,
  costChatTurn: 1,
  costVoiceMinute: 25,
  costTts1kChars: 5,
  costSttMinute: 10,
  rateLimitPerMin: 30,
  providerChains: {
    jen: ['groq', 'openrouter', 'nvidia', 'gemini'],
    adam: ['openrouter', 'nvidia', 'groq', 'gemini'],
    gentech: ['nvidia', 'openrouter', 'groq', 'gemini'],
    kevin: ['groq', 'nvidia', 'openrouter', 'gemini'],
    mika: ['openrouter', 'groq', 'nvidia', 'gemini'],
  },
};

export async function getAiSettingsAdmin(): Promise<AiSettingsPayload> {
  const { data, error } = await svc()
    .from('ai_settings')
    .select(
      'free_monthly_tokens, cost_chat_turn, cost_voice_minute, cost_tts_1k_chars, cost_stt_minute, rate_limit_per_min, provider_chains, updated_at'
    )
    .eq('id', 'global')
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) {
    return { ...DEFAULT_AI_SETTINGS, updatedAt: new Date().toISOString() };
  }

  const row = data as {
    free_monthly_tokens: number | null;
    cost_chat_turn: number | null;
    cost_voice_minute: number | null;
    cost_tts_1k_chars: number | null;
    cost_stt_minute: number | null;
    rate_limit_per_min: number | null;
    provider_chains: Record<string, string[]> | null;
    updated_at: string;
  };

  return {
    freeMonthlyTokens: toNumber(row.free_monthly_tokens, DEFAULT_AI_SETTINGS.freeMonthlyTokens),
    costChatTurn: toNumber(row.cost_chat_turn, DEFAULT_AI_SETTINGS.costChatTurn),
    costVoiceMinute: toNumber(row.cost_voice_minute, DEFAULT_AI_SETTINGS.costVoiceMinute),
    costTts1kChars: toNumber(row.cost_tts_1k_chars, DEFAULT_AI_SETTINGS.costTts1kChars),
    costSttMinute: toNumber(row.cost_stt_minute, DEFAULT_AI_SETTINGS.costSttMinute),
    rateLimitPerMin: toNumber(row.rate_limit_per_min, DEFAULT_AI_SETTINGS.rateLimitPerMin),
    providerChains:
      row.provider_chains && typeof row.provider_chains === 'object'
        ? row.provider_chains
        : DEFAULT_AI_SETTINGS.providerChains,
    updatedAt: row.updated_at,
  };
}

export async function adminUpdateAiSettings(
  patch: Partial<Omit<AiSettingsPayload, 'updatedAt'>>
): Promise<AiSettingsPayload> {
  const row: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (patch.freeMonthlyTokens !== undefined) row.free_monthly_tokens = patch.freeMonthlyTokens;
  if (patch.costChatTurn !== undefined) row.cost_chat_turn = patch.costChatTurn;
  if (patch.costVoiceMinute !== undefined) row.cost_voice_minute = patch.costVoiceMinute;
  if (patch.costTts1kChars !== undefined) row.cost_tts_1k_chars = patch.costTts1kChars;
  if (patch.costSttMinute !== undefined) row.cost_stt_minute = patch.costSttMinute;
  if (patch.rateLimitPerMin !== undefined) row.rate_limit_per_min = patch.rateLimitPerMin;
  if (patch.providerChains !== undefined) row.provider_chains = patch.providerChains;

  const { error } = await svc().from('ai_settings').update(row).eq('id', 'global');
  if (error) throw new Error(error.message);
  return getAiSettingsAdmin();
}

export async function listAiVoiceProfiles(): Promise<AiVoiceProfileRow[]> {
  const { data, error } = await svc()
    .from('ai_voice_profiles')
    .select(
      'id, agent_id, language, elevenlabs_voice_id, model_id, display_name, key_alias, is_active, created_at'
    )
    .order('agent_id', { ascending: true });
  if (error) throw new Error(error.message);

  return ((data ?? []) as {
    id: string;
    agent_id: string;
    language: string;
    elevenlabs_voice_id: string;
    model_id: string | null;
    display_name: string | null;
    key_alias: string | null;
    is_active: boolean | null;
    created_at: string;
  }[]).map((row) => ({
    id: row.id,
    agentId: row.agent_id,
    language: row.language,
    voiceId: row.elevenlabs_voice_id,
    modelId: row.model_id ?? 'eleven_multilingual_v2',
    displayName: row.display_name,
    keyAlias: row.key_alias,
    isActive: row.is_active !== false,
    updatedAt: row.created_at,
  }));
}

export async function adminUpsertAiVoiceProfile(input: {
  agentId: string;
  language: string;
  voiceId: string;
  modelId?: string;
  displayName?: string;
}): Promise<{ ok: true }> {
  const agentId = String(input.agentId ?? '').trim();
  const language = String(input.language ?? '').trim();
  const voiceId = String(input.voiceId ?? '').trim();
  if (!agentId || !language || !voiceId) {
    throw new HttpError(400, 'agentId, language and voiceId are required.');
  }

  const { error } = await svc().from('ai_voice_profiles').upsert(
    {
      agent_id: agentId,
      language,
      elevenlabs_voice_id: voiceId,
      model_id: input.modelId || 'eleven_multilingual_v2',
      display_name: input.displayName ?? null,
    },
    { onConflict: 'agent_id,language' }
  );
  if (error) throw new Error(error.message);
  return { ok: true };
}

export async function listAiUpgrades(status = 'pending'): Promise<AiUpgradeRow[]> {
  let q = svc()
    .from('ai_upgrade_requests')
    .select(
      'id, user_id, plan_id, tokens_requested, amount_php, payment_method, reference_no, receipt_url, status, admin_note, reviewed_by, reviewed_at, created_at'
    )
    .order('created_at', { ascending: false })
    .limit(500);
  if (status && status !== 'all') q = q.eq('status', status);

  const { data, error } = await q;
  if (error) throw new Error(error.message);

  const users = await loadAuthUsers();
  return ((data ?? []) as {
    id: string;
    user_id: string;
    plan_id: string | null;
    tokens_requested: number | null;
    amount_php: number | null;
    payment_method: string;
    reference_no: string | null;
    receipt_url: string | null;
    status: AiUpgradeRow['status'];
    admin_note: string | null;
    reviewed_by: string | null;
    reviewed_at: string | null;
    created_at: string;
  }[]).map((row) => {
    const owner = users.get(row.user_id);
    return {
      id: row.id,
      userId: row.user_id,
      userName: owner?.name ?? 'Learner',
      userEmail: owner?.email ?? '',
      planId: row.plan_id,
      tokensRequested: toNumber(row.tokens_requested),
      amountPhp: toNumber(row.amount_php),
      paymentMethod: row.payment_method,
      referenceNo: row.reference_no,
      receiptUrl: row.receipt_url,
      status: row.status,
      adminNote: row.admin_note,
      reviewedBy: row.reviewed_by,
      reviewedAt: row.reviewed_at,
      createdAt: row.created_at,
    };
  });
}

export async function adminReviewAiUpgrade(input: {
  id: string;
  action: 'approve' | 'reject';
  note?: string;
  adminEmail?: string;
}): Promise<{ ok: true; status: string }> {
  const id = String(input.id ?? '').trim();
  if (!id) throw new HttpError(400, 'Upgrade id is required.');

  const { data: request, error } = await svc()
    .from('ai_upgrade_requests')
    .select('id, user_id, tokens_requested, status')
    .eq('id', id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!request) throw new HttpError(404, 'Upgrade request was not found.');

  const row = request as {
    id: string;
    user_id: string;
    tokens_requested: number | null;
    status: string;
  };
  if (row.status !== 'pending') {
    throw new HttpError(409, `Upgrade request is already ${row.status}.`);
  }

  const nextStatus = input.action === 'approve' ? 'approved' : 'rejected';

  if (input.action === 'approve') {
    const amount = Math.floor(toNumber(row.tokens_requested));
    if (amount > 0) {
      const { error: grantError } = await svc().rpc('ai_grant_tokens', {
        p_user: row.user_id,
        p_amount: amount,
        p_reason: 'topup_approved',
        p_source: 'admin_topup',
        p_metadata: { upgrade_id: row.id, admin: input.adminEmail ?? null },
      });
      if (grantError) throw new Error(grantError.message);
    }
  }

  const { error: updateError } = await svc()
    .from('ai_upgrade_requests')
    .update({
      status: nextStatus,
      admin_note: input.note ?? null,
      reviewed_by: input.adminEmail ?? null,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', id);
  if (updateError) throw new Error(updateError.message);

  return { ok: true, status: nextStatus };
}
