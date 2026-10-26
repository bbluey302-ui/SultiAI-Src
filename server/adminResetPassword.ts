import { Request, Response } from 'express';
import { resolveIdentity } from './ai';
import { supabaseServer } from './supabaseServer';

export async function adminResetPassword(req: Request, res: Response) {
  const identity = await resolveIdentity(req);
  if (!identity.userId) return res.status(401).json({ error: 'Auth required' });
  const { userEmail, newPassword } = req.body || {};
  if (!userEmail || !newPassword) return res.status(400).json({ error: 'userEmail and newPassword required' });
  if (!supabaseServer) return res.status(503).json({ error: 'Server not configured' });
  try {
    // Lookup user by email
    const { data: users } = await supabaseServer.auth.admin.listUsers({ perPage: 10 });
    const target = (users?.users || []).find((u: any) => u.email === userEmail);
    if (!target) return res.status(404).json({ error: 'User not found' });
    await supabaseServer.auth.admin.updateUserById(target.id, { password: newPassword });
    res.json({ success: true, userId: target.id });
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'Failed' });
  }
}
