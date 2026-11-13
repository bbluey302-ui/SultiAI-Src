// OAuth / email-link callback plumbing.
//
// Supabase sends the browser back to a redirect URL with either a PKCE
// `?code=` (OAuth + magic links) or an implicit `#access_token=…` fragment
// (older email templates), plus `error`/`error_description` when the provider
// refuses. The SPA is served for every path, so this module completes the
// handshake and then scrubs the URL so the tokens never linger in history.
//
// The Supabase client runs with `detectSessionInUrl: false` so this is the
// single, deterministic place where a callback is consumed — no double
// exchange racing `getSession()` on boot.

import { supabase, emailLinkSupabase, isSupabaseConfigured } from './supabaseClient';

export const AUTH_CALLBACK_PATH = '/auth/callback';

/**
 * Supabase returns a generic 500 when its mail sender (SMTP) is missing,
 * misconfigured, or over quota. Surface something a learner/admin can act on.
 *
 * The wording is provider-neutral on purpose: the project has used more than
 * one SMTP provider, and naming a specific one here goes stale as soon as it
 * changes.
 */
export const MAIL_DELIVERY_ERROR =
  'Supabase could not deliver the email. The auth mail sender (SMTP) is missing, over quota, or rejected by the provider — for example an unverified sender domain, a revoked SMTP password, or a provider test-sender restriction. An admin must check Supabase → Authentication → Emails → SMTP settings, then try again.';

export function describeAuthApiError(message?: string): string | undefined {
  if (!message) return message;
  if (/error sending .*email|error sending email|smtp|confirmation email/i.test(message)) {
    return MAIL_DELIVERY_ERROR;
  }
  return message;
}

/** Redirect target registered in Supabase Auth → URL Configuration. */
export function getAuthRedirectUrl(): string {
  return `${window.location.origin}${AUTH_CALLBACK_PATH}`;
}

/**
 * True when the app is running inside a frame (for example a browser
 * extension that previews the page at phone widths).
 *
 * Google refuses to render its OAuth consent screen in a framed context, and
 * a frame that also fakes a mobile user agent can be routed into Google's
 * mobile account-switch flow, which sometimes ends in a generic 400. OAuth
 * must therefore be started from the top-level browsing context.
 *
 * `window.frameElement` is deliberately not used: preview extensions may
 * hide it to make the page believe it is standalone.
 */
export function isEmbeddedAuthContext(): boolean {
  try {
    return window.top !== window.self;
  } catch {
    return true;
  }
}

// Password-recovery requests are remembered so a success notice can be shown
// after a stale link or a cross-device flow. The recovery screen itself is
// detected from the `type=recovery` fragment Supabase returns.
const PENDING_RECOVERY_KEY = 'sultiai_pending_password_recovery';
const PENDING_RECOVERY_TTL_MS = 30 * 60 * 1000;

function markPendingPasswordRecovery(email: string): void {
  try {
    localStorage.setItem(
      PENDING_RECOVERY_KEY,
      JSON.stringify({ email, requestedAt: Date.now() })
    );
  } catch {
    // ignore (private mode / storage disabled)
  }
}

export function clearPendingPasswordRecovery(): void {
  try {
    localStorage.removeItem(PENDING_RECOVERY_KEY);
  } catch {
    // ignore
  }
}

export function readPendingPasswordRecoveryEmail(): string | null {
  try {
    const raw = localStorage.getItem(PENDING_RECOVERY_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed?.requestedAt !== 'number') return null;
    if (Date.now() - parsed.requestedAt > PENDING_RECOVERY_TTL_MS) {
      localStorage.removeItem(PENDING_RECOVERY_KEY);
      return null;
    }
    return typeof parsed.email === 'string' ? parsed.email : null;
  } catch {
    return null;
  }
}

/**
 * Ask Supabase to email a recovery link.
 *
 * Uses the implicit-flow client so the link works even when the inbox is
 * opened on a different browser/device than the one that requested it.
 */
export async function sendPasswordResetEmail(
  email: string
): Promise<{ success: boolean; error?: string }> {
  if (!emailLinkSupabase || !isSupabaseConfigured) {
    return {
      success: false,
      error:
        'Supabase is not configured, so the recovery email could not be sent. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.',
    };
  }

  try {
    const { error } = await emailLinkSupabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: getAuthRedirectUrl(),
    });
    if (error) return { success: false, error: describeAuthApiError(error.message) };
    markPendingPasswordRecovery(email.trim().toLowerCase());
    return { success: true };
  } catch (err: any) {
    return {
      success: false,
      error:
        describeAuthApiError(err?.message) ||
        'Could not reach the password recovery service. Please try again.',
    };
  }
}

interface AuthCallbackParams {
  code?: string;
  accessToken?: string;
  refreshToken?: string;
  type?: string;
  error?: string;
  errorDescription?: string;
}

function readCallbackParams(): AuthCallbackParams {
  const search = new URLSearchParams(window.location.search);
  const rawHash = window.location.hash.startsWith('#')
    ? window.location.hash.slice(1)
    : window.location.hash;
  const hash = new URLSearchParams(rawHash);
  const pick = (key: string) => search.get(key) ?? hash.get(key) ?? undefined;

  return {
    code: pick('code'),
    accessToken: pick('access_token'),
    refreshToken: pick('refresh_token'),
    type: pick('type'),
    error: pick('error'),
    errorDescription: pick('error_description'),
  };
}

function hasCallbackParams(): boolean {
  const params = readCallbackParams();
  return Boolean(params.code || params.accessToken || params.error);
}

function describeError(error: string, description?: string): string {
  switch (error) {
    case 'access_denied':
      return 'Google sign-in was cancelled before it finished.';
    case 'otp_expired':
      return 'That sign-in link has expired. Request a new one and try again.';
    case 'server_error':
      return 'Supabase could not complete the sign-in. Check Auth → URL Configuration in your Supabase project.';
    case 'invalid_request':
      return description || 'Supabase rejected the callback. The redirect URL is probably not allow-listed.';
    default:
      return description ? `${description} (${error})` : error;
  }
}

/** Remove code/token/error params while keeping any other query state. */
function cleanCallbackUrl(): void {
  const url = new URL(window.location.href);
  for (const key of [
    'code',
    'state',
    'error',
    'error_code',
    'error_description',
    'access_token',
    'refresh_token',
    'expires_in',
    'expires_at',
    'token_type',
    'provider_token',
    'provider_refresh_token',
    'type',
  ]) {
    url.searchParams.delete(key);
  }
  url.hash = '';
  if (url.pathname === AUTH_CALLBACK_PATH) url.pathname = '/';
  window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`);
}

export interface AuthRedirectResult {
  /** Present when the provider or Supabase rejected the callback. */
  error?: string;
  /** True when this boot actually consumed a callback (vs. a normal reload). */
  handled: boolean;
  /** True when the callback came from a password-recovery email. */
  recovery?: boolean;
}

/**
 * Complete a pending OAuth / email-link redirect.
 *
 * Call once, before reading the stored session. Safe on normal loads: it
 * returns `{ handled: false }` when the URL carries no auth params.
 */
export async function completeAuthRedirect(): Promise<AuthRedirectResult> {
  if (!hasCallbackParams()) return { handled: false };

  const params = readCallbackParams();
  const isRecovery = params.type === 'recovery';

  if (params.error) {
    cleanCallbackUrl();
    clearPendingPasswordRecovery();
    return { handled: true, error: describeError(params.error, params.errorDescription) };
  }

  if (!supabase || !isSupabaseConfigured) {
    cleanCallbackUrl();
    clearPendingPasswordRecovery();
    return {
      handled: true,
      error: 'Supabase is not configured, so the sign-in callback could not be completed.',
    };
  }

  if (params.code) {
    const { error } = await supabase.auth.exchangeCodeForSession(params.code);
    if (error) {
      // The PKCE verifier lives in localStorage: it is missing when the
      // callback is opened in a different browser/tab than the one that
      // started the flow, or when the code was already consumed.
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        cleanCallbackUrl();
        clearPendingPasswordRecovery();
        return {
          handled: true,
          error: /code verifier|both auth code/i.test(error.message)
            ? 'This email link was opened in a different browser than the one that started it. Request a new link, or open it in the same browser.'
            : `Sign-in could not be completed: ${error.message}`,
        };
      }
    }
  } else if (params.accessToken && params.refreshToken) {
    const { error } = await supabase.auth.setSession({
      access_token: params.accessToken,
      refresh_token: params.refreshToken,
    });
    if (error) {
      cleanCallbackUrl();
      clearPendingPasswordRecovery();
      return { handled: true, error: `Sign-in could not be completed: ${error.message}` };
    }
  }

  cleanCallbackUrl();
  clearPendingPasswordRecovery();
  return { handled: true, recovery: isRecovery };
}
