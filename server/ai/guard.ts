// Request identity + rate limiting for AI endpoints.
//
// Identity resolution is best-effort but never trusts a raw id when a Supabase
// bearer token is present. In production the learner client sends the access
// token, so the wallet is keyed to a verified auth user.

import { supabaseServer } from '../supabaseServer';

// Structural request shape: avoids a duplicate `@types/express` identity clash
// between the root and `server/` node_modules trees.
interface IncomingRequest {
  headers: Record<string, string | string[] | undefined>;
  body?: unknown;
  query?: Record<string, unknown>;
  ip?: string;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUuid(value: unknown): value is string {
  return typeof value === 'string' && UUID_RE.test(value);
}

export interface RequestIdentity {
  userId: string | null;
  email?: string | null;
  verified: boolean;
  reason?: string;
}

export async function resolveIdentity(req: IncomingRequest): Promise<RequestIdentity> {
  const rawHeader = req.headers.authorization;
  const header = Array.isArray(rawHeader) ? rawHeader[0] : rawHeader;
  const token = header?.startsWith('Bearer ') ? header.slice(7).trim() : '';

  if (token && supabaseServer) {
    try {
      const { data, error } = await supabaseServer.auth.getUser(token);
      if (!error && data?.user?.id) {
        return {
          userId: data.user.id,
          email: data.user.email ?? null,
          verified: true,
        };
      }
    } catch {
      // Fall through to the body id.
    }
  }

  const bodyId = (req.body as Record<string, unknown> | undefined)?.userId;
  const queryId = req.query?.userId;
  const candidate = isUuid(bodyId) ? bodyId : isUuid(queryId) ? queryId : null;

  if (candidate) {
    return { userId: candidate, verified: false, reason: token ? 'invalid_token' : 'no_token' };
  }
  return { userId: null, verified: false, reason: 'anonymous' };
}

// ---- sliding-window rate limit --------------------------------------------

const windows = new Map<string, number[]>();

export function checkRateLimit(key: string, limitPerMinute: number): { ok: boolean; retryAfterSeconds: number } {
  const now = Date.now();
  const cutoff = now - 60_000;
  const hits = (windows.get(key) || []).filter((ts) => ts > cutoff);

  if (hits.length >= limitPerMinute) {
    const oldest = hits[0] ?? now;
    windows.set(key, hits);
    return { ok: false, retryAfterSeconds: Math.max(1, Math.ceil((oldest + 60_000 - now) / 1000)) };
  }

  hits.push(now);
  windows.set(key, hits);
  if (windows.size > 5000) {
    // Prevent unbounded growth in long-running processes.
    for (const [k, list] of windows) {
      if (!list.some((ts) => ts > cutoff)) windows.delete(k);
    }
  }
  return { ok: true, retryAfterSeconds: 0 };
}
