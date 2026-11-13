// ============================================================================
// SultiAI Server-Side Supabase Integration
// Shared by BOTH backends:
//   - server.ts       (Learner backend)  -> writes learner activity + audit logs
//   - admin-server.ts (Admin backend)    -> reads/writes the admin console data
//
// Supabase is the SINGLE SOURCE OF TRUTH connecting the two backends, which
// never call each other directly.
// ============================================================================
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const anonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

// Prefer the service_role key on the server: it bypasses RLS and can read the
// whole learner roster. Fall back to the anon key so local demos still work.
const serverKey = serviceRoleKey || anonKey;

export const isSupabaseServerConfigured = Boolean(supabaseUrl && serverKey);
export const usingServiceRole = Boolean(serviceRoleKey);

export const supabaseServer: SupabaseClient | null = isSupabaseServerConfigured
  ? createClient(supabaseUrl, serverKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  : null;

export interface AuditLogInput {
  userId?: string;
  eventType: string;
  category: 'AI_INFERENCE' | 'SPEECH_WER' | 'LEARNING_ACTIVITY' | 'SECURITY_RLS' | 'SYSTEM_CONFIG';
  actor?: string;
  actorRole?: string;
  description: string;
  severity?: 'INFO' | 'SUCCESS' | 'WARNING' | 'CRITICAL';
  latencyMs?: number;
  metadata?: Record<string, any>;
}

/**
 * Persist an audit/telemetry event to Supabase. Fire-and-forget friendly:
 * returns the inserted row on success, or null when Supabase is not configured
 * or the insert fails (never throws).
 */
export async function writeAuditLog(entry: AuditLogInput): Promise<Record<string, any> | null> {
  if (!supabaseServer) return null;
  try {
    const { data, error } = await supabaseServer
      .from('audit_logs')
      .insert([
        {
          user_id: entry.userId || null,
          event_type: entry.eventType,
          category: entry.category,
          actor: entry.actor || 'system',
          actor_role: entry.actorRole || 'System',
          description: entry.description,
          severity: entry.severity || 'INFO',
          latency_ms: entry.latencyMs ?? null,
          metadata: entry.metadata || {},
        },
      ])
      .select()
      .single();

    if (error) {
      console.warn('[Supabase] writeAuditLog error:', error.message);
      return null;
    }
    return data;
  } catch (err: any) {
    console.warn('[Supabase] writeAuditLog exception:', err?.message);
    return null;
  }
}

export interface LearnerAccountUpsert {
  id: string;
  name: string;
  email?: string | null;
  targetDialect?: string;
  /**
   * Server-derived values only. Never populate these from a browser payload.
   * Omitted progress fields (xp, hearts, speech score, vocabulary, role and
   * status) are left untouched on UPDATE and use the table defaults on INSERT.
   */
  streakDays?: number;
  todayMinutes?: number;
  dailyGoalMinutes?: number;
}

/**
 * Upsert the safe, non-authoritative part of a learner's account row so the
 * Admin Console can still show the learner's identity and real activity.
 *
 * Stage 1 deliberately does NOT accept XP, hearts, badges, streak, role or
 * account status from this path. Those values are owned by server-side
 * operations (and, after Stage 2, server-issued lesson completion events).
 * A partial Supabase upsert preserves any existing authoritative columns when
 * the row already exists.
 */
export async function upsertLearnerAccount(account: LearnerAccountUpsert): Promise<boolean> {
  if (!supabaseServer) return false;
  try {
    const row: Record<string, unknown> = {
      id: account.id,
      name: account.name,
      target_dialect: account.targetDialect ?? 'davao_bisaya',
      daily_goal_minutes: account.dailyGoalMinutes ?? 15,
      last_active: 'Just now',
      updated_at: new Date().toISOString(),
    };

    // Omit email when the token has none so an existing verified email is not
    // cleared by a phone/anonymous-auth session.
    if (account.email) row.email = account.email;

    if (typeof account.streakDays === 'number' && Number.isFinite(account.streakDays)) {
      row.streak_days = Math.max(0, Math.round(account.streakDays));
    }
    if (typeof account.todayMinutes === 'number' && Number.isFinite(account.todayMinutes)) {
      row.today_minutes = Math.max(0, Math.round(account.todayMinutes));
    }

    const { error } = await supabaseServer
      .from('learner_accounts')
      .upsert([row], { onConflict: 'id' });

    if (error) {
      console.warn('[Supabase] upsertLearnerAccount error:', error.message);
      return false;
    }
    return true;
  } catch (err: any) {
    console.warn('[Supabase] upsertLearnerAccount exception:', err?.message);
    return false;
  }
}
