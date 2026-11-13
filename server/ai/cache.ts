// Two-tier AI response cache.
//
//   Tier 1 — in-process LRU (microseconds, lost on restart)
//   Tier 2 — `ai_cache_entries` in Supabase (shared across restarts/instances)
//
// Only deterministic, non-personalised calls are cached (see `router.ts`).
// Audio caching lives in `elevenlabs.ts` because it needs binary payloads.

import crypto from 'crypto';
import { supabaseServer } from '../supabaseServer';

interface CacheEntry {
  payload: unknown;
  expiresAt: number;
}

const MAX_MEMORY_ENTRIES = 500;
const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000;

const memory = new Map<string, CacheEntry>();
const stats = { hits: 0, misses: 0, writes: 0 };

export function cacheKey(parts: unknown): string {
  return crypto.createHash('sha256').update(JSON.stringify(parts)).digest('hex');
}

function pruneMemory() {
  const now = Date.now();
  for (const [key, entry] of memory) {
    if (entry.expiresAt <= now) memory.delete(key);
  }
  while (memory.size > MAX_MEMORY_ENTRIES) {
    const oldest = memory.keys().next().value;
    if (oldest === undefined) break;
    memory.delete(oldest);
  }
}

export function getMemory<T>(key: string): T | null {
  const entry = memory.get(key);
  if (!entry) return null;
  if (entry.expiresAt <= Date.now()) {
    memory.delete(key);
    return null;
  }
  // Refresh LRU position.
  memory.delete(key);
  memory.set(key, entry);
  return entry.payload as T;
}

export function setMemory(key: string, payload: unknown, ttlMs = DEFAULT_TTL_MS) {
  memory.set(key, { payload, expiresAt: Date.now() + ttlMs });
  pruneMemory();
  stats.writes += 1;
}

export async function getCached<T>(key: string, scope = 'chat'): Promise<T | null> {
  const local = getMemory<T>(key);
  if (local !== null) {
    stats.hits += 1;
    return local;
  }

  if (supabaseServer) {
    try {
      const { data, error } = await supabaseServer
        .from('ai_cache_entries')
        .select('payload, expires_at')
        .eq('cache_key', key)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle();
      if (!error && data?.payload) {
        setMemory(key, data.payload);
        stats.hits += 1;
        void supabaseServer
          .from('ai_cache_entries')
          .update({ hits: 1 })
          .eq('cache_key', key);
        return data.payload as T;
      }
    } catch {
      // Cache must never break a request.
    }
  }

  stats.misses += 1;
  void scope;
  return null;
}

export async function setCached(key: string, payload: unknown, scope = 'chat', ttlMs = DEFAULT_TTL_MS) {
  setMemory(key, payload, ttlMs);
  if (!supabaseServer) return;
  try {
    await supabaseServer.from('ai_cache_entries').upsert(
      [
        {
          cache_key: key,
          scope,
          payload,
          expires_at: new Date(Date.now() + ttlMs).toISOString(),
        },
      ],
      { onConflict: 'cache_key' }
    );
  } catch {
    // Ignore cache write failures.
  }
}

export function cacheStats() {
  return { ...stats, size: memory.size, maxSize: MAX_MEMORY_ENTRIES };
}

export function clearCache() {
  memory.clear();
}
