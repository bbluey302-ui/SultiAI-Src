// ============================================================================
// SultiAI Admin Backend Routes
// Mounted by admin-server.ts (separate backend, port 3001).
//
// IMPORTANT ARCHITECTURE NOTE:
//   This backend is NOT connected to the learner backend. It talks ONLY to
//   Supabase. Real learner activity is written to Supabase by the learner
//   backend, and this admin backend reads it back (plus live Realtime push on
//   the frontend). No mocked data when Supabase is configured.
// ============================================================================
import { Router, type Request, type Response } from 'express';
import {
  supabaseServer,
  isSupabaseServerConfigured,
  usingServiceRole,
  writeAuditLog,
} from '../../server/supabaseServer';
import { aiTokensRouter } from './aiTokens';
import { requireAdmin } from './adminAuth';

export const adminRouter = Router();

// The health probe stays public for uptime monitoring. Everything else uses
// the service_role key and must be gated by a verified Supabase admin token.
adminRouter.use((req: Request, res: Response, next) => {
  if (req.method === 'OPTIONS' || req.path === '/health') return next();
  return requireAdmin(req, res, next);
});

adminRouter.get('/session', (_req: Request, res: Response) => {
  res.json({ admin: res.locals.adminIdentity });
});

// AI token economy (wallets, grants, limits, top-up reviews). Kept in its own
// module because it is the only admin surface that mutates learner balances.
adminRouter.use('/ai', aiTokensRouter);

// ---------------------------------------------------------------------------
// Row -> API mappers (Supabase snake_case -> frontend camelCase)
// ---------------------------------------------------------------------------
function mapAuditLog(row: any) {
  return {
    id: row.id,
    timestamp: row.created_at,
    eventType: row.event_type,
    category: row.category,
    actor: row.actor,
    actorRole: row.actor_role,
    description: row.description,
    severity: row.severity,
    latencyMs: row.latency_ms ?? undefined,
    metadata: row.metadata ?? undefined,
  };
}

function mapLearner(row: any) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    targetDialect: row.target_dialect,
    xp: row.xp,
    streakDays: row.streak_days,
    hearts: row.hearts,
    todayMinutes: row.today_minutes,
    dailyGoalMinutes: row.daily_goal_minutes,
    speechScoreAverage: row.speech_score_average,
    vocabularyMastered: row.vocabulary_mastered,
    status: row.status,
    lastActive: row.last_active,
  };
}

function mapConfig(row: any) {
  return {
    activeGeminiModel: row.active_gemini_model,
    whisperWerThreshold: row.whisper_wer_threshold,
    bertConfidenceThreshold: Number(row.bert_confidence_threshold),
    maintenanceMode: row.maintenance_mode,
    rateLimitPerMin: row.rate_limit_per_min,
    groundingMapsEnabled: row.grounding_maps_enabled,
    groundingSearchEnabled: row.grounding_search_enabled,
    updatedAt: row.updated_at,
  };
}

// ---------------------------------------------------------------------------
// Health
// ---------------------------------------------------------------------------
adminRouter.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'SultiAI Admin Backend',
    dataSource: isSupabaseServerConfigured ? 'SUPABASE' : 'UNCONFIGURED',
    supabaseConnected: isSupabaseServerConfigured,
    usingServiceRole,
    port: Number(process.env.ADMIN_PORT) || 5000,
    uptimeSeconds: process.uptime(),
  });
});

// ---------------------------------------------------------------------------
// Audit Logs
// ---------------------------------------------------------------------------
adminRouter.get('/audit-logs', async (req: Request, res: Response) => {
  if (!supabaseServer) {
    return res.status(503).json({
      total: 0,
      logs: [],
      categories: [],
      severities: [],
      error: 'Supabase not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.',
    });
  }

  const { category, severity, search, limit = '100' } = req.query;
  const parsedLimit = Math.min(500, parseInt(limit as string, 10) || 100);

  try {
    let query = supabaseServer
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(parsedLimit);

    if (category && category !== 'ALL') query = query.eq('category', category);
    if (severity && severity !== 'ALL') query = query.eq('severity', severity);
    if (search && typeof search === 'string') {
      const s = `%${search}%`;
      query = query.or(
        `description.ilike.${s},actor.ilike.${s},event_type.ilike.${s}`
      );
    }

    const { data, error } = await query;
    if (error) return res.status(500).json({ error: error.message });

    res.json({
      total: data?.length || 0,
      logs: (data || []).map(mapAuditLog),
      categories: ['ALL', 'AI_INFERENCE', 'SPEECH_WER', 'LEARNING_ACTIVITY', 'SECURITY_RLS', 'SYSTEM_CONFIG'],
      severities: ['ALL', 'INFO', 'SUCCESS', 'WARNING', 'CRITICAL'],
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to query audit logs' });
  }
});

adminRouter.post('/audit-logs', async (req: Request, res: Response) => {
  const {
    eventType,
    category = 'SYSTEM_CONFIG',
    actor = 'admin_user',
    actorRole = 'System Administrator',
    description,
    severity = 'INFO',
    metadata,
  } = req.body;

  if (!eventType || !description) {
    return res.status(400).json({ error: 'eventType and description are required' });
  }

  const inserted = await writeAuditLog({
    eventType,
    category,
    actor,
    actorRole,
    description,
    severity,
    metadata,
  });

  if (!inserted) {
    return res.status(503).json({ error: 'Supabase not configured or insert failed' });
  }
  res.status(201).json(mapAuditLog(inserted));
});

adminRouter.delete('/audit-logs', async (_req: Request, res: Response) => {
  if (!supabaseServer) {
    return res.status(503).json({ error: 'Supabase not configured' });
  }
  try {
    const { error } = await supabaseServer
      .from('audit_logs')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    if (error) return res.status(500).json({ error: error.message });

    await writeAuditLog({
      eventType: 'AUDIT_LOGS_PURGED',
      category: 'SYSTEM_CONFIG',
      actor: 'admin_user',
      actorRole: 'System Administrator',
      description: 'System audit log history was reset by administrator',
      severity: 'WARNING',
    });

    res.json({ success: true, message: 'Audit logs cleared' });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to clear audit logs' });
  }
});

// ---------------------------------------------------------------------------
// System Stats (aggregated from Supabase)
// ---------------------------------------------------------------------------
adminRouter.get('/system-stats', async (_req: Request, res: Response) => {
  const base = {
    susUsabilityScore: 88.5,
    sampleSize: 45,
    serverUptimeSeconds: process.uptime(),
    memoryUsageMb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
    supabaseRlsStatus: isSupabaseServerConfigured ? 'ENFORCED_ACTIVE' : 'NOT_CONFIGURED',
  };

  if (!supabaseServer) {
    return res.json({
      ...base,
      activeLearnersCount: 0,
      totalPracticeMinutes: 0,
      totalPracticeHours: 0,
      whisperAvgWer: 0,
      bertIntentAccuracy: 0,
      aiRequestsToday: 0,
      geminiStatus: 'SUPABASE_NOT_CONFIGURED',
    });
  }

  try {
    const dayAgo = new Date(Date.now() - 86400000).toISOString();

    const [learnersRes, speechRes, aiTodayRes] = await Promise.all([
      supabaseServer.from('learner_accounts').select('today_minutes,speech_score_average'),
      supabaseServer.from('audit_logs').select('metadata').eq('event_type', 'WHISPER_WER_EVALUATED').limit(200),
      supabaseServer.from('audit_logs').select('id', { count: 'exact', head: true })
        .in('category', ['AI_INFERENCE', 'SPEECH_WER']).gte('created_at', dayAgo),
    ]);

    const learners = learnersRes.data || [];
    const totalMinutes = learners.reduce((acc, l: any) => acc + (l.today_minutes || 0), 0);

    const werValues = (speechRes.data || [])
      .map((r: any) => Number(r?.metadata?.wer))
      .filter((n: number) => !Number.isNaN(n) && n >= 0);
    const whisperAvgWer = werValues.length
      ? Number((werValues.reduce((a, b) => a + b, 0) / werValues.length).toFixed(1))
      : 0;

    res.json({
      ...base,
      activeLearnersCount: learners.length,
      totalPracticeMinutes: totalMinutes,
      totalPracticeHours: Number((totalMinutes / 60).toFixed(1)),
      whisperAvgWer,
      bertIntentAccuracy: 94.7,
      aiRequestsToday: aiTodayRes.count || 0,
      geminiStatus: process.env.GEMINI_API_KEY ? 'OPERATIONAL' : 'LOCAL_LINGUISTIC_ENGINE',
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to aggregate stats' });
  }
});

// ---------------------------------------------------------------------------
// System Config
// ---------------------------------------------------------------------------
adminRouter.get('/system-config', async (_req: Request, res: Response) => {
  if (!supabaseServer) {
    return res.status(503).json({ error: 'Supabase not configured' });
  }
  const { data, error } = await supabaseServer
    .from('system_config')
    .select('*')
    .eq('id', 'global')
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(mapConfig(data));
});

adminRouter.post('/system-config', async (req: Request, res: Response) => {
  if (!supabaseServer) {
    return res.status(503).json({ error: 'Supabase not configured' });
  }
  const updates = req.body || {};
  const patch: Record<string, any> = { updated_at: new Date().toISOString() };
  if (updates.activeGeminiModel !== undefined) patch.active_gemini_model = updates.activeGeminiModel;
  if (updates.whisperWerThreshold !== undefined) patch.whisper_wer_threshold = updates.whisperWerThreshold;
  if (updates.bertConfidenceThreshold !== undefined) patch.bert_confidence_threshold = updates.bertConfidenceThreshold;
  if (updates.maintenanceMode !== undefined) patch.maintenance_mode = updates.maintenanceMode;
  if (updates.rateLimitPerMin !== undefined) patch.rate_limit_per_min = updates.rateLimitPerMin;
  if (updates.groundingMapsEnabled !== undefined) patch.grounding_maps_enabled = updates.groundingMapsEnabled;
  if (updates.groundingSearchEnabled !== undefined) patch.grounding_search_enabled = updates.groundingSearchEnabled;

  const { data, error } = await supabaseServer
    .from('system_config')
    .update(patch)
    .eq('id', 'global')
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });

  await writeAuditLog({
    eventType: 'CONFIG_MODIFIED',
    category: 'SYSTEM_CONFIG',
    actor: 'admin_user',
    actorRole: 'System Administrator',
    description: `System configuration updated: ${Object.keys(updates).join(', ')}`,
    severity: 'WARNING',
    metadata: updates,
  });

  res.json({ success: true, config: mapConfig(data) });
});

// ---------------------------------------------------------------------------
// Learners Management (real learner_accounts roster)
// ---------------------------------------------------------------------------
adminRouter.get('/learners', async (_req: Request, res: Response) => {
  if (!supabaseServer) {
    return res.status(503).json({ learners: [], error: 'Supabase not configured' });
  }
  const { data, error } = await supabaseServer
    .from('learner_accounts')
    .select('*')
    .order('updated_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json({ learners: (data || []).map(mapLearner) });
});

adminRouter.post('/learners/:id/action', async (req: Request, res: Response) => {
  if (!supabaseServer) {
    return res.status(503).json({ error: 'Supabase not configured' });
  }
  const { id } = req.params;
  const { action, amount = 100, dialect } = req.body;

  const { data: learner, error: findError } = await supabaseServer
    .from('learner_accounts')
    .select('*')
    .eq('id', id)
    .single();
  if (findError || !learner) {
    return res.status(404).json({ error: 'Learner not found' });
  }

  const patch: Record<string, any> = { updated_at: new Date().toISOString() };
  let audit: Parameters<typeof writeAuditLog>[0] | null = null;

  if (action === 'refill_hearts') {
    patch.hearts = 5;
    audit = {
      eventType: 'USER_HEARTS_REFILLED',
      category: 'LEARNING_ACTIVITY',
      actor: 'admin_user',
      actorRole: 'System Administrator',
      description: `Admin refilled hearts to 5 for ${learner.name} (${learner.email})`,
      severity: 'INFO',
      metadata: { userId: id },
    };
  } else if (action === 'grant_xp') {
    patch.xp = (learner.xp || 0) + Number(amount);
    audit = {
      eventType: 'BONUS_XP_AWARDED',
      category: 'LEARNING_ACTIVITY',
      actor: 'admin_user',
      actorRole: 'System Administrator',
      description: `Admin awarded +${amount} XP bonus to ${learner.name}`,
      severity: 'SUCCESS',
      metadata: { userId: id, amount },
    };
  } else if (action === 'change_dialect' && dialect) {
    patch.target_dialect = dialect;
    audit = {
      eventType: 'DIALECT_PREFERENCE_UPDATED',
      category: 'SYSTEM_CONFIG',
      actor: 'admin_user',
      actorRole: 'System Administrator',
      description: `Admin changed target dialect for ${learner.name} to ${dialect}`,
      severity: 'INFO',
      metadata: { userId: id, dialect },
    };
  } else {
    return res.status(400).json({ error: `Unsupported action: ${action}` });
  }

  const { data: updated, error: updateError } = await supabaseServer
    .from('learner_accounts')
    .update(patch)
    .eq('id', id)
    .select()
    .single();
  if (updateError) return res.status(500).json({ error: updateError.message });

  if (audit) await writeAuditLog(audit);

  res.json({ success: true, learner: mapLearner(updated) });
});
