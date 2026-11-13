import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '@/src/services/supabaseClient';
import { adminApi } from '../services/adminApi';

export interface AdminUser {
  id: string;
  email: string;
  fullName: string;
  role: 'super_admin' | 'lead_researcher' | 'linguistics_editor' | 'auditor';
  avatarUrl?: string;
  institution: string;
}

interface AdminAuthContextType {
  adminUser: AdminUser | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isSupabaseLive: boolean;
}

interface ServerAdmin {
  userId?: number | string;
  name?: string;
  email?: string;
  role?: string;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

function toAdminUser(server: ServerAdmin | undefined, fallbackEmail = ''): AdminUser {
  return {
    id: String(server?.userId ?? ''),
    email: server?.email || fallbackEmail,
    fullName: server?.name || 'System Administrator',
    // The UI has richer display roles; public.users.role must be exactly
    // 'admin' for the server gate to pass.
    role: 'super_admin',
    institution: 'Jose Maria College Foundation, Inc.',
  };
}

async function readErrorMessage(res: Response, fallback: string): Promise<string> {
  try {
    const body = await res.json();
    return typeof body?.error === 'string' ? body.error : fallback;
  } catch {
    return fallback;
  }
}

export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Restore an existing Supabase session only after the server confirms that
  // the account has public.users.role = 'admin'. A localStorage flag alone is
  // never treated as authentication.
  useEffect(() => {
    let cancelled = false;

    const restore = async () => {
      if (!supabase) {
        if (!cancelled) setLoading(false);
        return;
      }

      try {
        const { data } = await supabase.auth.getSession();
        if (!data.session) {
          if (!cancelled) setAdminUser(null);
          return;
        }

        const res = await adminApi('/api/admin/session');
        if (!res.ok) {
          // Do NOT sign out here: the shared Supabase session may belong to a
          // normal learner using the mobile app. Simply keep admin access off.
          if (!cancelled) setAdminUser(null);
          return;
        }

        const payload = await res.json();
        if (!cancelled && payload?.admin) {
          setAdminUser(toAdminUser(payload.admin, data.session.user.email || ''));
        }
      } catch {
        if (!cancelled) setAdminUser(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void restore();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = async (email: string, password?: string): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);

    try {
      if (!supabase) {
        return {
          success: false,
          error: 'Supabase is not configured. Admin access requires a Supabase account.',
        };
      }
      if (!password) {
        return {
          success: false,
          error: 'Password is required for administrator sign-in.',
        };
      }

      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        return { success: false, error: error.message };
      }
      if (!data.user) {
        return { success: false, error: 'Supabase did not return a signed-in user.' };
      }

      const res = await adminApi('/api/admin/session');
      if (!res.ok) {
        const message = await readErrorMessage(
          res,
          res.status === 403
            ? 'Access denied. This account does not have admin privileges.'
            : 'The server could not verify this admin session.',
        );
        await supabase.auth.signOut().catch(() => {});
        return { success: false, error: message };
      }

      const payload = await res.json();
      if (!payload?.admin) {
        await supabase.auth.signOut().catch(() => {});
        return { success: false, error: 'The server did not return an admin profile.' };
      }

      setAdminUser(toAdminUser(payload.admin, data.user.email || email));
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Administrator sign-in failed.' };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    if (supabase) {
      supabase.auth.signOut().catch(() => {});
    }
    setAdminUser(null);
  };

  return (
    <AdminAuthContext.Provider
      value={{
        adminUser,
        isAuthenticated: Boolean(adminUser),
        loading,
        login,
        logout,
        isSupabaseLive: isSupabaseConfigured,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};
