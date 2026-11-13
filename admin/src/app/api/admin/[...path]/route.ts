import { NextResponse } from 'next/server';
import { HttpError, requireAdmin } from '@/lib/supabase-admin';
import type { AdminIdentity } from '@/lib/supabase-admin';
import * as db from '@/server/admin';
import type {
  AdminSettings,
  LessonModule,
  ReportStatus,
  UserRole,
  UserStatus,
  VerificationStatus,
} from '@/types';

/**
 * The admin console's single API surface.
 *
 * All console traffic (reads and writes) is routed through here so that
 * `requireAdmin()` runs exactly once per request and the browser never sees the
 * Supabase secret key. The `api` client in `@/lib/api` targets these paths
 * unchanged from the old Express routes.
 *
 * Lives at the app root (`/api/...`), not under `/admin/api`, so it is not
 * caught by the cookie-based proxy in `src/proxy.ts`. That proxy is a UX
 * redirect only; the real gate is the bearer-token check below.
 */

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type Segments = { params: Promise<{ path: string[] }> };

function numberParam(value: string | undefined, label: string): number {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) throw new HttpError(400, `Invalid ${label}.`);
  return n;
}

async function readJson(request: Request): Promise<Record<string, unknown>> {
  try {
    const body = await request.json();
    return body && typeof body === 'object' ? (body as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

async function dispatch(
  request: Request,
  segments: string[],
  admin: AdminIdentity
): Promise<unknown> {
  const method = request.method.toUpperCase();
  const url = new URL(request.url);
  const [root, second, third] = segments;

  // ---- Health --------------------------------------------------------------
  if (root === 'health' && method === 'GET') return db.getHealth();

  // ---- Dashboard -----------------------------------------------------------
  if (root === 'analytics' && second === 'overview' && method === 'GET') {
    return db.getOverview();
  }

  // ---- Users ---------------------------------------------------------------
  if (root === 'users') {
    if (!second && method === 'GET') {
      return db.listUsers({
        page: Number(url.searchParams.get('page') ?? 1),
        perPage: Number(url.searchParams.get('perPage') ?? 10),
        search: url.searchParams.get('search') ?? '',
        role: url.searchParams.get('role') ?? 'all',
        status: url.searchParams.get('status') ?? 'all',
        sort: url.searchParams.get('sort') ?? 'recent',
      });
    }
    if (!second && method === 'POST') {
      const body = await readJson(request);
      return db.createUser({
        fullname: body.fullname as string,
        email: body.email as string,
        password: body.password as string,
        role: body.role as UserRole | undefined,
      });
    }
    if (second === 'snapshot' && method === 'GET') return db.getUserMonitor();
    if (second === 'pending' && method === 'GET') return db.listPendingUsers();
    if (second === 'bulk-approve' && method === 'POST') {
      const body = await readJson(request);
      return db.bulkApproveUsers((body.userIds as number[]) ?? []);
    }

    const userId = numberParam(second, 'user id');
    if (!third && method === 'GET') return db.getUserDetail(userId);
    if (!third && method === 'DELETE') return db.deleteUser(userId);
    if (third === 'role' && method === 'PATCH') {
      const body = await readJson(request);
      return db.updateUserRole(userId, body.role as UserRole);
    }
    if (third === 'status' && method === 'PATCH') {
      const body = await readJson(request);
      return db.updateUserStatus(userId, body.status as UserStatus);
    }
    if (third === 'verify' && method === 'POST') {
      const body = await readJson(request);
      return db.setUserVerified(userId, Boolean(body.verified));
    }
    if (third === 'approve' && method === 'POST') return db.approveUser(userId);
    if (third === 'reject' && method === 'POST') return db.rejectUser(userId);
  }

  // ---- Lessons -------------------------------------------------------------
  if (root === 'lessons') {
    if (!second && method === 'GET') return db.listLessons();
    if (!second && method === 'POST') {
      return db.createLesson((await readJson(request)) as Partial<LessonModule>);
    }
    const lessonId = numberParam(second, 'lesson id');
    if (!third && method === 'PUT') {
      return db.updateLesson(lessonId, (await readJson(request)) as Partial<LessonModule>);
    }
    if (!third && method === 'DELETE') return db.deleteLesson(lessonId);
  }

  // ---- Community -----------------------------------------------------------
  if (root === 'community') {
    if (second === 'posts' && method === 'GET') return db.listPosts();
    if (second === 'reports' && method === 'GET') return db.listReports();
    if (second === 'posts' && method === 'PATCH' && !segments[3]) {
      return db.toggleFeatured(numberParam(third, 'post id'));
    }
    if (second === 'posts' && segments[3] === 'visibility' && method === 'PATCH') {
      const body = await readJson(request);
      return db.setPostHidden(numberParam(third, 'post id'), Boolean(body.hidden));
    }
    if (second === 'posts' && method === 'DELETE' && !segments[3]) {
      return db.deletePost(numberParam(third, 'post id'));
    }
    if (second === 'reports' && method === 'PATCH') {
      const body = await readJson(request);
      return db.updateReportStatus(numberParam(third, 'report id'), body.status as ReportStatus);
    }
  }

  // ---- AI / XP -------------------------------------------------------------
  if (root === 'ai' && second === 'usage' && method === 'GET') return db.getAiUsage();
  if (root === 'ai' && second === 'tokens') {
    if (third === 'overview' && method === 'GET') return db.getAiTokenOverview();

    if (third === 'wallets') {
      const walletUserId = segments[3];
      if (!walletUserId && method === 'GET') {
        return db.listAiWallets({
          search: url.searchParams.get('search') ?? '',
          page: Number(url.searchParams.get('page') ?? 1),
          perPage: Number(url.searchParams.get('perPage') ?? 20),
        });
      }
      if (walletUserId && method === 'PATCH') {
        const body = await readJson(request);
        return db.adminUpdateAiWallet({
          userId: walletUserId,
          planId: body.planId as string | undefined,
          monthlyOverride:
            body.monthlyOverride === undefined
              ? undefined
              : body.monthlyOverride === null
                ? null
                : Number(body.monthlyOverride),
          note: body.note === undefined ? undefined : (body.note as string | null),
          adjustBalance:
            body.adjustBalance === undefined ? undefined : Number(body.adjustBalance),
          adminEmail: admin.email,
        });
      }
    }

    if (third === 'grant' && method === 'POST') {
      const body = await readJson(request);
      return db.adminGrantAiTokens({
        userId: String(body.userId ?? ''),
        amount: Number(body.amount ?? 0),
        reason: (body.reason as string) || 'Manual grant',
        adminEmail: admin.email,
      });
    }

    if (third === 'providers') {
      const providerId = segments[3];
      if (!providerId && method === 'GET') return db.listAiProviders();
      if (providerId && method === 'PATCH') {
        const body = await readJson(request);
        return db.adminUpdateAiProvider({
          id: providerId,
          status: body.status as string | undefined,
          monthlyQuota:
            body.monthlyQuota === undefined ? undefined : Number(body.monthlyQuota),
        });
      }
    }

    if (third === 'settings') {
      if (method === 'GET') return db.getAiSettingsAdmin();
      if (method === 'PUT') {
        return db.adminUpdateAiSettings(
          (await readJson(request)) as Parameters<typeof db.adminUpdateAiSettings>[0]
        );
      }
    }

    if (third === 'voice-profiles') {
      if (method === 'GET') return db.listAiVoiceProfiles();
      if (method === 'PUT') {
        const body = await readJson(request);
        return db.adminUpsertAiVoiceProfile({
          agentId: String(body.agentId ?? ''),
          language: String(body.language ?? ''),
          voiceId: String(body.voiceId ?? ''),
          modelId: body.modelId ? String(body.modelId) : undefined,
          displayName: body.displayName ? String(body.displayName) : undefined,
        });
      }
    }

    if (third === 'upgrades') {
      const upgradeId = segments[3];
      if (!upgradeId && method === 'GET') {
        return db.listAiUpgrades(url.searchParams.get('status') ?? 'pending');
      }
      if (upgradeId && segments[4] === 'review' && method === 'POST') {
        const body = await readJson(request);
        return db.adminReviewAiUpgrade({
          id: upgradeId,
          action: body.action === 'reject' ? 'reject' : 'approve',
          note: body.note ? String(body.note) : undefined,
          adminEmail: admin.email,
        });
      }
    }
  }

  if (root === 'xp' && second === 'overview' && method === 'GET') return db.getXpOverview();

  // ---- Feedback ------------------------------------------------------------
  if (root === 'feedback') {
    if (!second && method === 'GET') return db.listFeedback();
    const feedbackId = numberParam(second, 'feedback id');
    if (!third && method === 'PATCH') return db.resolveFeedback(feedbackId);
  }

  // ---- Preservation --------------------------------------------------------
  if (root === 'preservation') {
    if (!second && method === 'GET') return db.listPreserved();
    const wordId = numberParam(second, 'word id');
    if (!third && method === 'POST') {
      const body = await readJson(request);
      return db.verifyPreserved(wordId, body.status as VerificationStatus);
    }
  }

  // ---- Settings ------------------------------------------------------------
  if (root === 'settings') {
    if (!second && method === 'GET') return db.getSettings();
    if (!second && method === 'PUT') {
      return db.updateSettings((await readJson(request)) as Partial<AdminSettings>);
    }
  }

  // ---- Audit logs ----------------------------------------------------------
  if (root === 'audit-logs' && method === 'GET') {
    const actorParam = url.searchParams.get('actorId');
    const actorNum = Number(actorParam);
    return db.listAuditLogs({
      page: Number(url.searchParams.get('page') ?? 1),
      perPage: Number(url.searchParams.get('perPage') ?? 20),
      search: url.searchParams.get('search') ?? '',
      resourceType: url.searchParams.get('resourceType') ?? 'all',
      actorId: actorParam && actorParam !== 'all' && Number.isFinite(actorNum) && actorNum > 0
        ? actorNum
        : 'all',
      actorKind: 'all',
    });
  }

  throw new HttpError(404, `No admin route for ${method} /${segments.join('/')}`);
}

function errorResponse(error: unknown): NextResponse {
  if (error instanceof HttpError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  const message = error instanceof Error ? error.message : 'Unexpected server error.';
  return NextResponse.json({ error: message }, { status: 500 });
}

async function run(request: Request, ctx: Segments): Promise<NextResponse> {
  try {
    const admin = await requireAdmin(request);
    const { path } = await ctx.params;
    const result = await dispatch(request, path ?? [], admin);
    return NextResponse.json(result === undefined ? { ok: true } : result);
  } catch (error) {
    return errorResponse(error);
  }
}

export function GET(request: Request, ctx: Segments) {
  return run(request, ctx);
}

export function POST(request: Request, ctx: Segments) {
  return run(request, ctx);
}

export function PATCH(request: Request, ctx: Segments) {
  return run(request, ctx);
}

export function PUT(request: Request, ctx: Segments) {
  return run(request, ctx);
}

export function DELETE(request: Request, ctx: Segments) {
  return run(request, ctx);
}
