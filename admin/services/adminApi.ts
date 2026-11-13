// ============================================================================
// Admin API client
// The Admin Console runs inside the SPA served by the LEARNER backend (:3000),
// but all admin data now comes from the SEPARATE Admin backend (:3001), which
// is backed only by Supabase. This helper prefixes every admin call with the
// admin backend base URL.
// ============================================================================
import { supabase, isSupabaseConfigured } from '@/src/services/supabaseClient';

// The Admin Console and its backend are served by the SAME process on :5000,
// so admin API calls default to the current origin. Override with
// VITE_ADMIN_API_URL only if you split them across hosts.
export const ADMIN_API_BASE: string =
  (import.meta as any).env?.VITE_ADMIN_API_URL || '';

/** Fetch wrapper for the dedicated admin backend. */
export async function adminApi(path: string, init?: RequestInit): Promise<Response> {
  const url = `${ADMIN_API_BASE}${path}`;

  // Attach the Supabase access token. Every admin route except /health now
  // requires a verified token whose public.users role is exactly 'admin'.
  let authorization: Record<string, string> = {};
  if (supabase) {
    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (token) authorization = { Authorization: `Bearer ${token}` };
    } catch {
      // A missing session is fine for the legacy local admin login.
    }
  }

  return fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...authorization,
      ...(init?.headers || {}),
    },
  });
}

export { isSupabaseConfigured };

/**
 * Subscribe to Supabase Realtime changes on a table so the Admin Console
 * live-syncs whenever the LEARNER backend writes new activity. Returns an
 * unsubscribe function (no-op when Supabase is not configured).
 */
export function subscribeToTable(
  table: 'audit_logs' | 'learner_accounts',
  onChange: () => void
): () => void {
  const client = supabase;
  if (!client) return () => {};
  const channel = client
    .channel(`admin-live-${table}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table },
      () => onChange()
    )
    .subscribe();

  return () => {
    try {
      client.removeChannel(channel);
    } catch {
      // ignore
    }
  };
}
