import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { supabase, emailLinkSupabase, isSupabaseConfigured } from '../services/supabaseClient';
import {
  completeAuthRedirect,
  getAuthRedirectUrl,
  isEmbeddedAuthContext,
  sendPasswordResetEmail,
  clearPendingPasswordRecovery,
  readPendingPasswordRecoveryEmail,
  describeAuthApiError,
} from '../services/authRedirect';
import { PasswordRecoveryScreen } from '../components/auth/PasswordRecoveryScreen';
import { UserProfile, TargetDialect } from '../types';

export interface AuthSession {
  user: {
    id: string;
    email: string;
    name: string;
    avatarUrl?: string;
    provider: 'google' | 'email';
    createdAt: string;
  };
  token?: string;
  role?: string;
}

interface AuthContextType {
  session: AuthSession | null;
  isAuthenticated: boolean;
  /** True while the initial Supabase session restore is in flight */
  isLoading: boolean;
  isSupabaseLive: boolean;
  loginWithEmail: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUpWithEmail: (email: string, password: string, displayName?: string, targetLanguage?: 'bisaya' | 'filipino') => Promise<{ success: boolean; error?: string; message?: string }>;
  loginWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  /** Re-send the signup confirmation link through Supabase. */
  resendConfirmationEmail: (email: string) => Promise<{ success: boolean; error?: string }>;
  /**
   * Set when a password-recovery link was just consumed. The provider renders
   * the "choose a new password" screen instead of the app until this clears.
   */
  passwordRecovery: { email?: string } | null;
  completePasswordRecovery: (password: string) => Promise<{ success: boolean; error?: string }>;
  cancelPasswordRecovery: () => Promise<void>;
  /** Set when an OAuth / email-link callback came back with an error. */
  authError: string | null;
  clearAuthError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'sultiai_auth_session';

/** Map a Supabase session onto the app's AuthSession shape. */
function toAuthSession(supaSession: { user: any; access_token: string }): AuthSession {
  const u = supaSession.user;
  return {
    user: {
      id: u.id,
      email: u.email || '',
      name: u.user_metadata?.full_name || u.user_metadata?.name || u.email?.split('@')[0] || 'Learner',
      avatarUrl: u.user_metadata?.avatar_url || u.user_metadata?.picture,
      provider: (u.app_metadata?.provider === 'google' ? 'google' : 'email') as 'google' | 'email',
      createdAt: u.created_at || new Date().toISOString(),
    },
    token: supaSession.access_token,
  };
}

/** Shown whenever Supabase (the only real identity provider) is unreachable. */
const NOT_CONFIGURED_ERROR =
  'Supabase authentication is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY, then reload.';

export const AuthProvider: React.FC<{
  children: React.ReactNode;
  onSessionChange?: (session: AuthSession | null) => void;
}> = ({ children, onSessionChange }) => {
  // The ONLY source of truth is Supabase Auth. Any locally cached session from
  // older builds (including mock/demo accounts) is discarded on boot.
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(isSupabaseConfigured);
  const [authError, setAuthError] = useState<string | null>(null);
  const [passwordRecovery, setPasswordRecovery] = useState<{ email?: string } | null>(null);

  // Purge legacy mock/demo session caches from previous builds.
  useEffect(() => {
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    } catch {
      // ignore
    }
  }, []);

  // Sync session changes (only after the initial restore completes, so the
  // app never sees a transient "logged out" state on reload)
  //
  // The callback is held in a ref: callers pass it inline, so depending on it
  // directly re-ran this effect on every parent render. Since the callback
  // writes parent state, that produced an infinite "Maximum update depth"
  // loop for any signed-in learner.
  const onSessionChangeRef = useRef(onSessionChange);
  useEffect(() => {
    onSessionChangeRef.current = onSessionChange;
  }, [onSessionChange]);

  useEffect(() => {
    if (isLoading) return;
    onSessionChangeRef.current?.(session);
  }, [session, isLoading]);

  // Listen to Supabase auth state if configured
  useEffect(() => {
    if (!supabase || !isSupabaseConfigured) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    // Complete a pending OAuth / email-link callback first (PKCE code
    // exchange), then restore the session persisted by Supabase.
    (async () => {
      const isCallback = window.location.pathname === '/auth/callback' ||
        window.location.search.includes('code=') ||
        window.location.search.includes('error=') ||
        window.location.hash.includes('access_token=');

      const redirectResult = await completeAuthRedirect();
      if (cancelled) return;
      if (redirectResult.error) setAuthError(redirectResult.error);

      // If this isn't an auth callback, force sign-out so reloads don't auto-login.
      // We still keep persistSession true so PKCE code verifier can be read on callback.
      if (!isCallback && !redirectResult.handled) {
        try {
          await supabase.auth.signOut();
        } catch {
          // ignore
        }
        if (cancelled) return;
        setSession(null);
        return;
      }

      const { data } = await supabase.auth.getSession();
      if (cancelled) return;
      if (data.session?.user) {
        // Refresh identity from the server so a changed Google photo/name is
        // picked up instead of the cached copy in the persisted session.
        let freshUser = data.session.user;
        try {
          const { data: fresh } = await supabase.auth.getUser();
          if (fresh?.user) freshUser = fresh.user;
        } catch {
          // Offline: keep the cached user.
        }
        if (cancelled) return;
        setSession(toAuthSession({ user: freshUser, access_token: data.session.access_token }));
        if (redirectResult.recovery) {
          setPasswordRecovery({
            email:
              freshUser.email ||
              readPendingPasswordRecoveryEmail() ||
              undefined,
          });
        }
      } else {
        setSession(null);
        if (redirectResult.recovery) {
          setAuthError(
            'This password reset link is invalid or has expired. Request a new recovery email.'
          );
        }
      }
    })()
      .catch((err) => {
        console.warn('[SultiAI Auth] Failed to check Supabase session:', err);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, supaSession) => {
      if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && supaSession?.user) {
        setSession(toAuthSession(supaSession));
        setAuthError(null);
      } else if (event === 'SIGNED_OUT') {
        setSession(null);
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  // Reads the real role from `public.users` (created by the
  // `handle_new_auth_user()` trigger at signup). RLS restricts the select to
  // the caller's own row, so no filter is needed. Fire-and-forget: a role
  // lookup failure must never block sign-in.
  const refreshRoleFromDb = async (authUserId: string): Promise<string | null> => {
    if (!supabase) return null;
    try {
      const { data, error } = await supabase
        .from('users')
        .select('role')
        .eq('supabase_id', authUserId)
        .maybeSingle();
      if (error || !data) return null;
      return (data as any).role || 'user';
    } catch {
      return null;
    }
  };

  const loginWithEmail = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    const cleanEmail = email.trim().toLowerCase();

    // Supabase is the source of truth for auth. If it is configured we NEVER
    // fall back to a local session — a wrong password must surface as a real
    // error, not silently sign the user in as a fake account.
    if (supabase && isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });

        if (error) {
          setIsLoading(false);
          if (/email not confirmed/i.test(error.message)) {
            return {
              success: false,
              error:
                'Your email is not confirmed yet. Open the confirmation link we sent you, then sign in.',
            };
          }
          return { success: false, error: error.message };
        }

        if (data.user) {
          const authUser: AuthSession = {
            user: {
              id: data.user.id,
              email: data.user.email || cleanEmail,
              name: data.user.user_metadata?.full_name || cleanEmail.split('@')[0],
              avatarUrl: data.user.user_metadata?.avatar_url,
              provider: 'email',
              createdAt: data.user.created_at,
            },
            token: data.session?.access_token,
          };
          setSession(authUser);
          setIsLoading(false);
          clearPendingPasswordRecovery();

          // Pick up the real role and merge it onto the session.
          refreshRoleFromDb(data.user.id).then((role) => {
            if (role) {
              setSession((prev) => (prev ? { ...prev, role } as AuthSession : prev));
            }
          });

          return { success: true };
        }

        setIsLoading(false);
        return { success: false, error: 'Sign-in returned no user. Please try again.' };
      } catch (err: any) {
        console.warn('[SultiAI Auth] Supabase sign-in exception:', err);
        setIsLoading(false);
        return {
          success: false,
          error: err?.message || 'Could not reach the sign-in service. Please try again.',
        };
      }
    }

    // Supabase is NOT configured — there is no real identity provider, so we
    // refuse to fabricate a local account. Authentication must be real.
    setIsLoading(false);
    return { success: false, error: NOT_CONFIGURED_ERROR };
  };

  const signUpWithEmail = async (
    email: string,
    password: string,
    displayName?: string,
    targetLanguage: 'bisaya' | 'filipino' = 'bisaya'
  ): Promise<{ success: boolean; error?: string; message?: string }> => {
    setIsLoading(true);
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = displayName?.trim() || cleanEmail.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

    if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setIsLoading(false);
      return { success: false, error: 'Please provide a valid email address.' };
    }
    if (password.length < 8) {
      setIsLoading(false);
      return { success: false, error: 'Password must be at least 8 characters.' };
    }

    // 1. Supabase Auth Registration
    // Email confirmation links must work when opened on another device, so the
    // signup request goes through the implicit-flow client (see supabaseClient).
    if (emailLinkSupabase && supabase && isSupabaseConfigured) {
      try {
        const { data, error } = await emailLinkSupabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            emailRedirectTo: getAuthRedirectUrl(),
            data: {
              full_name: cleanName,
              // Same metadata the old React Native app wrote at signup, so the
              // `handle_new_auth_user()` trigger and profile reads stay in sync.
              native_language: 'English',
              target_language: targetLanguage === 'filipino' ? 'Filipino' : 'Bisaya',
            },
          },
        });

        if (error) {
          setIsLoading(false);
          // Never claim the account was created when the confirmation email
          // failed to send — GoTrue rolls the signup back in that case.
          return { success: false, error: describeAuthApiError(error.message) };
        }

        if (data.user) {
          // If auto-signed in (email confirmation turned off), hand the tokens
          // to the main client so every later AI/DB request is authenticated.
          if (data.session) {
            const { data: mainSession, error: mainError } = await supabase.auth.setSession({
              access_token: data.session.access_token,
              refresh_token: data.session.refresh_token,
            });
            if (mainError) {
              setIsLoading(false);
              return { success: false, error: mainError.message };
            }
            if (mainSession?.session?.user) {
              setSession(toAuthSession(mainSession.session));
              setIsLoading(false);
              return { success: true };
            }
          }

          // Email confirmation is enabled on the project
          // (mailer_autoconfirm is false), so a successful signUp with no
          // session means "check your inbox".
          setIsLoading(false);
          return {
            success: true,
            message: `Your SultiAI account is ready. We sent a confirmation link to ${cleanEmail} — open it to activate your account, then sign in.`,
          };
        }

        setIsLoading(false);
        return { success: false, error: 'Account creation returned no user. Please try again.' };
      } catch (err: any) {
        console.warn('[SultiAI Auth] Supabase sign up exception:', err);
        setIsLoading(false);
        return {
          success: false,
          error: err?.message || 'Could not reach the sign-up service. Please try again.',
        };
      }
    }

    // No Supabase = no real account. Never create a fake local account.
    setIsLoading(false);
    return { success: false, error: NOT_CONFIGURED_ERROR };
  };

  const loginWithGoogle = async (): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);

    const embeddedPreview = isEmbeddedAuthContext();
    // Open the popup immediately, while the click still counts as a user
    // gesture. Waiting for Supabase's redirect URL first can lose that gesture
    // and get the popup blocked. This also escapes sandboxed preview frames,
    // which allow popups but block top-level navigation.
    const oauthPopup = embeddedPreview ? window.open('', '_blank') : null;
    const discardOauthPopup = () => {
      try {
        oauthPopup?.close();
      } catch {
        // ignore
      }
    };

    // Google OAuth is only possible through Supabase. No simulation, no fake
    // "Google Learner" account — if OAuth is unavailable we surface the error.
    if (supabase && isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            // Must match a Redirect URL in Supabase Auth → URL Configuration.
            redirectTo: getAuthRedirectUrl(),
            // We navigate manually below so a framed preview can hand the
            // OAuth round trip to a real top-level context. Letting Supabase
            // redirect the iframe itself is what produces Google's 400 page.
            skipBrowserRedirect: true,
            // Force Google to re-authenticate on every explicit sign-in click.
            // `select_account` alone can reuse an existing Google SSO session
            // and sign the learner straight in; `login` always asks for the
            // account credentials again (plus max_age=0 as a second guard).
            queryParams: {
              prompt: 'login',
              max_age: '0',
              include_granted_scopes: 'false',
            },
          },
        });
        if (error) {
          discardOauthPopup();
          setIsLoading(false);
          return { success: false, error: error.message };
        }
        if (!data?.url) {
          discardOauthPopup();
          setIsLoading(false);
          return {
            success: false,
            error: 'Google sign-in did not return a redirect URL. Please try again.',
          };
        }

        // Browser extensions that preview the site at phone sizes run the page
        // inside a sandboxed frame. Google blocks its consent page from being
        // framed, and the sandbox blocks top-level navigation, so finish the
        // OAuth trip in the popup we opened while the click was still active.
        if (oauthPopup) {
          try {
            oauthPopup.location.href = data.url;
            oauthPopup.focus();
            return { success: true };
          } catch {
            discardOauthPopup();
          }
        }

        // Non-sandboxed embeds can hand off to the real top-level tab.
        if (embeddedPreview) {
          try {
            window.top!.location.assign(data.url);
            return { success: true };
          } catch {
            // A sandboxed/cross-origin parent may refuse top-level
            // navigation. Fall back to a clear message below instead of
            // letting Google render its generic 400 page in the frame.
          }
          setIsLoading(false);
          return {
            success: false,
            error:
              'Google sign-in is blocked inside this preview. Open SultiAI in a normal browser tab, or allow popups for this site.',
          };
        }

        window.location.assign(data.url);
        // Redirecting to Google — the SIGNED_IN listener updates the session.
        return { success: true };
      } catch (err: any) {
        discardOauthPopup();
        setIsLoading(false);
        return {
          success: false,
          error: err?.message || 'Could not reach Google sign-in. Please try again.',
        };
      }
    }

    discardOauthPopup();
    setIsLoading(false);
    return { success: false, error: NOT_CONFIGURED_ERROR };
  };

  const logout = async () => {
    setIsLoading(true);
    if (supabase && isSupabaseConfigured) {
      try {
        await supabase.auth.signOut();
      } catch {
        // ignore
      }
    }
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    } catch {
      // ignore
    }
    clearPendingPasswordRecovery();
    setSession(null);
    setIsLoading(false);
  };

  const resetPassword = async (email: string): Promise<{ success: boolean; error?: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return { success: false, error: 'Please enter a valid email address (e.g. ikaw@gmail.com).' };
    }

    // Never pretend the email was sent: Supabase is the only sender here.
    if (!supabase || !isSupabaseConfigured) {
      return { success: false, error: NOT_CONFIGURED_ERROR };
    }

    setIsLoading(true);
    const result = await sendPasswordResetEmail(cleanEmail);
    setIsLoading(false);
    return result;
  };

  const resendConfirmationEmail = async (
    email: string
  ): Promise<{ success: boolean; error?: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    if (!emailLinkSupabase || !isSupabaseConfigured) {
      return { success: false, error: NOT_CONFIGURED_ERROR };
    }
    try {
      const { error } = await emailLinkSupabase.auth.resend({
        type: 'signup',
        email: cleanEmail,
        options: { emailRedirectTo: getAuthRedirectUrl() },
      });
      if (error) return { success: false, error: describeAuthApiError(error.message) };
      return { success: true };
    } catch (err: any) {
      return {
        success: false,
        error:
          describeAuthApiError(err?.message) ||
          'Could not resend the confirmation email. Please try again.',
      };
    }
  };

  const completePasswordRecovery = async (
    newPassword: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!supabase || !isSupabaseConfigured) {
      return { success: false, error: NOT_CONFIGURED_ERROR };
    }
    if (newPassword.length < 8) {
      return { success: false, error: 'Password must be at least 8 characters.' };
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        setIsLoading(false);
        return { success: false, error: error.message };
      }

      // The recovery session must not become a normal signed-in session.
      try {
        await supabase.auth.signOut();
      } catch {
        // ignore
      }
      clearPendingPasswordRecovery();
      setSession(null);
      setIsLoading(false);
      return { success: true };
    } catch (err: any) {
      setIsLoading(false);
      return {
        success: false,
        error: err?.message || 'Could not update the password. Please try again.',
      };
    }
  };

  const cancelPasswordRecovery = async (): Promise<void> => {
    if (supabase && isSupabaseConfigured) {
      try {
        await supabase.auth.signOut();
      } catch {
        // ignore
      }
    }
    clearPendingPasswordRecovery();
    setSession(null);
    setPasswordRecovery(null);
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        isAuthenticated: Boolean(session),
        isLoading,
        isSupabaseLive: isSupabaseConfigured,
        loginWithEmail,
        signUpWithEmail,
        loginWithGoogle,
        logout,
        resetPassword,
        resendConfirmationEmail,
        passwordRecovery,
        completePasswordRecovery,
        cancelPasswordRecovery,
        authError,
        clearAuthError: () => setAuthError(null),
      }}
    >
      {passwordRecovery ? (
        <PasswordRecoveryScreen
          email={passwordRecovery.email}
          onSubmit={completePasswordRecovery}
          onCancel={cancelPasswordRecovery}
          onDone={() => setPasswordRecovery(null)}
        />
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
