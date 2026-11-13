// Stage 1: administrator gate for the Express admin API.
//
// The admin backend uses the service_role key, so every route behind this
// middleware can read/write any learner. It must therefore verify a Supabase
// access token AND confirm that the matching public.users row has role=admin.
// The browser can never mint that row: role/status are server-owned columns.
import type { NextFunction, Request, Response } from 'express';
import { resolveIdentity } from '../../server/ai/guard';
import { supabaseServer } from '../../server/supabaseServer';

export interface AdminIdentity {
  userId: number;
  name: string;
  email: string;
  role: string;
}

export async function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  if (!supabaseServer) {
    res.status(503).json({
      error: 'Supabase is not configured on the admin backend',
      code: 'SUPABASE_UNCONFIGURED',
    });
    return;
  }

  try {
    const identity = await resolveIdentity(req);
    if (!identity.verified || !identity.userId) {
      res.status(401).json({
        error: 'Admin sign-in required',
        code: 'UNAUTHENTICATED',
      });
      return;
    }

    const { data: profile, error } = await supabaseServer
      .from('users')
      .select('user_id, fullname, email, role')
      .eq('supabase_id', identity.userId)
      .maybeSingle();

    if (error) {
      res.status(500).json({ error: 'Admin authorization failed' });
      return;
    }

    if (!profile || String(profile.role) !== 'admin') {
      res.status(403).json({
        error: 'Access denied. This account does not have admin privileges.',
        code: 'FORBIDDEN',
      });
      return;
    }

    const admin: AdminIdentity = {
      userId: Number(profile.user_id),
      name: (profile.fullname as string) || identity.email || 'Admin',
      email: (profile.email as string) || identity.email || '',
      role: String(profile.role),
    };
    res.locals.adminIdentity = admin;
    next();
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'Admin authorization failed' });
  }
}
