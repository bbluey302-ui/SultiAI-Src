// ============================================================================
// SultiAI Admin — AI token economy endpoints
// ============================================================================
// Mounted at /api/admin/ai by the admin Express app (port 5000).
//
// Everything here talks to Supabase with the service role: wallets, the token
// ledger, usage telemetry, provider slots, global limits and GCash upgrade
// requests. The learner backend is the only writer of balances during normal
// operation; this router exists to *support* learners (grants, refunds) and to
// approve top-ups, so every mutation goes through the same RPCs to keep the
// ledger authoritative.
// ============================================================================
import { Router, type Request, type Response } from 'express';
import { supabaseServer } from '../../server/supabaseServer';

export const aiTokensRouter = Router();

// ---------------------------------------------------------------------------
// Guard
// ---------------------------------------------------------------------------
// The legacy admin console supports two sign-in paths: real Supabase auth and a
// local allowlist for offline demos. When a Supabase token is present we verify
// it and require `public.users.role = 'admin'`; when it is absent we preserve
// the existing local-admin behaviour. This raises the bar for the only admin
// surface that moves learner balances without breaking local demos.
aiTokensRouter.use(async (req: Request, res: Response, next) => {
  const header = req.headers.authorization ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) return next();
  if (!supabaseServer) return res.status(503).json({ error: 'Supabase is not configured.' });

  const { data, error } = await supabaseServer.auth.getUser(token);
  if (error || !data.user) return res.status(401).json({ error: 'Invalid or expired session.' });

  const { data: profile } = await supabaseServer
    .from('users')
    .select('role')
    .eq('user_id', data.user.id)
    .maybeSingle();
  if (profile?.role !== 'admin') return res.status(403).json({ error: 'Admin access required.' });

  (req as Request & { adminEmail?: string }).adminEmail = data.user.email ?? undefined;
  return next();
});

const num = (value: unknown, fallback = 0): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const dayKey = (value: string): string => new Date(value).toISOString().slice(0, 10);

function lastDays(count: number): { key: string; label: string }[] {
  const out: { key: string; label: string }[] = [];
  const now = new Date();
  for (let i = count - 1; i >= 0; i -= 1) {
    const date = new Date(now);
    date.setUTCDate(now.getUTCDate() - i);
    out.push({
      key: date.toISOString().slice(0, 10),
      label: date.toLocaleDateString('en-PH', { weekday: 'short' }),
    });
  }
  return out;
}

/** Supabase client or a 503 response already sent. */
function db(res: Response) {
  if (!supabaseServer) {
    res.status(503).json({ error: 'Supabase is not configured for the admin app.' });
    return null;
  }
  return supabaseServer;
}

async function authUsers(): Promise<Map<string, { name: string; email: string }>> {
  const map = new Map<string, { name: string; email: string }>();
  if (!supabaseServer) return map;
  try {
    const { data } = await supabaseServer.auth.admin.listUsers({ page: 1, perPage: 1000 });
    for (const user of data?.users ?? []) {
      const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
      const name =
        (typeof meta.full_name === 'string' && meta.full_name) ||
        (typeof meta.name === 'string' && meta.name) ||
        (user.email ? user.email.split('@')[0] : 'Learner');
      map.set(user.id, { name, email: user.email ?? '' });
    }
  } catch {
    // Names are decorative.
  }
  return map;
}

// ---------------------------------------------------------------------------
// GET /api/admin/ai/tokens/overview
// ---------------------------------------------------------------------------
aiTokensRouter.get('/tokens/overview', async (_req: Request, res: Response) => {
  const client = db(res);
  if (!client) return;

  const days = lastDays(7);
  const since7 = `${days[0].key}T00:00:00.000Z`;
  const since30 = new Date(Date.now() - 30 * 86400_000).toISOString();
  const monthStart = new Date();
  monthStart.setUTCDate(1);
  monthStart.setUTCHours(0, 0, 0, 0);

  const [walletsRes, ledgerRes, eventsRes, pendingRes, users] = await Promise.all([
    client
      .from('ai_token_wallets')
      .select('user_id, plan_id, balance, lifetime_granted, lifetime_spent, period_end, updated_at')
      .limit(5000),
    client
      .from('ai_token_ledger')
      .select('user_id, delta, reason, created_at')
      .gte('created_at', since30)
      .limit(50000),
    client
      .from('ai_usage_events')
      .select('user_id, provider, input_tokens, output_tokens, latency_ms, cached, ok, created_at')
      .gte('created_at', since30)
      .limit(50000),
    client.from('ai_upgrade_requests').select('id', { head: true, count: 'exact' }).eq('status', 'pending'),
    authUsers(),
  ]);

  const wallets = (walletsRes.data ?? []) as any[];
  const ledger = (ledgerRes.data ?? []) as any[];
  const events = (eventsRes.data ?? []) as any[];

  const spendByUser = new Map<string, { tokens: number; requests: number }>();
  for (const entry of ledger) {
    const delta = num(entry.delta);
    if (!entry.user_id || delta >= 0) continue;
    const bucket = spendByUser.get(entry.user_id) ?? { tokens: 0, requests: 0 };
    bucket.tokens += -delta;
    bucket.requests += 1;
    spendByUser.set(entry.user_id, bucket);
  }

  const ledgerMonth = ledger.filter((entry) => new Date(entry.created_at) >= monthStart);
  const grantedThisMonth = ledgerMonth.filter((e) => num(e.delta) > 0).reduce((s, e) => s + num(e.delta), 0);
  const spentThisMonth = ledgerMonth.filter((e) => num(e.delta) < 0).reduce((s, e) => s - num(e.delta), 0);

  const reasonToMode = (reason: string | null): string => {
    switch (reason) {
      case 'chat_turn':
        return 'chat';
      case 'voice_minute':
        return 'voice';
      case 'tts':
        return 'tts';
      case 'stt':
        return 'stt';
      case 'evaluation':
        return 'evaluation';
      default:
        return 'other';
    }
  };

  const modeMap = new Map<string, { mode: string; requests: number; tokens: number }>();
  for (const entry of ledger) {
    const delta = num(entry.delta);
    if (delta >= 0) continue;
    const mode = reasonToMode(entry.reason);
    const bucket = modeMap.get(mode) ?? { mode, requests: 0, tokens: 0 };
    bucket.requests += 1;
    bucket.tokens += -delta;
    modeMap.set(mode, bucket);
  }

  const providerMap = new Map<
    string,
    { provider: string; requests: number; tokens: number; failed: number; latencyTotal: number; latencyCount: number }
  >();
  for (const event of events) {
    const provider = event.provider || 'unknown';
    const bucket =
      providerMap.get(provider) ??
      { provider, requests: 0, tokens: 0, failed: 0, latencyTotal: 0, latencyCount: 0 };
    bucket.requests += 1;
    bucket.tokens += num(event.input_tokens) + num(event.output_tokens);
    if (event.ok === false) bucket.failed += 1;
    if (event.ok !== false && num(event.latency_ms) > 0) {
      bucket.latencyTotal += num(event.latency_ms);
      bucket.latencyCount += 1;
    }
    providerMap.set(provider, bucket);
  }

  const events7 = events.filter((event) => event.created_at >= since7);
  const cached7 = events7.filter((event) => event.cached === true).length;
  const failed7 = events7.filter((event) => event.ok === false).length;
  const latency7 = events7.filter((event) => event.ok !== false && num(event.latency_ms) > 0);

  return res.json({
    totalWallets: wallets.length,
    totalBalance: wallets.reduce((sum, wallet) => sum + num(wallet.balance), 0),
    grantedThisMonth,
    spentThisMonth,
    activeUsers30d: spendByUser.size,
    cachedRequests7d: cached7,
    cacheHitRate: events7.length ? Math.round((cached7 / events7.length) * 1000) / 10 : 0,
    failedRequests7d: failed7,
    avgLatencyMs: latency7.length
      ? Math.round(latency7.reduce((sum, event) => sum + num(event.latency_ms), 0) / latency7.length)
      : 0,
    pendingUpgrades: pendingRes.count ?? 0,
    trend: days.map((day) => ({
      label: day.label,
      value: ledger
        .filter((entry) => num(entry.delta) < 0 && dayKey(entry.created_at) === day.key)
        .reduce((sum, entry) => sum - num(entry.delta), 0),
    })),
    byMode: [...modeMap.values()].sort((a, b) => b.tokens - a.tokens),
    byProvider: [...providerMap.values()]
      .map((bucket) => ({
        provider: bucket.provider,
        requests: bucket.requests,
        tokens: bucket.tokens,
        failed: bucket.failed,
        avgLatencyMs: bucket.latencyCount ? Math.round(bucket.latencyTotal / bucket.latencyCount) : 0,
      }))
      .sort((a, b) => b.requests - a.requests),
    topUsers: wallets
      .map((wallet) => ({
        userId: wallet.user_id,
        name: users.get(wallet.user_id)?.name ?? 'Learner',
        email: users.get(wallet.user_id)?.email ?? '',
        planId: wallet.plan_id,
        balance: num(wallet.balance),
        spent30d: spendByUser.get(wallet.user_id)?.tokens ?? 0,
        requests30d: spendByUser.get(wallet.user_id)?.requests ?? 0,
      }))
      .sort((a, b) => b.spent30d - a.spent30d)
      .slice(0, 8),
  });
});

// ---------------------------------------------------------------------------
// GET /api/admin/ai/tokens/wallets?search=&page=&perPage=
// ---------------------------------------------------------------------------
aiTokensRouter.get('/tokens/wallets', async (req: Request, res: Response) => {
  const client = db(res);
  if (!client) return;

  const page = Math.max(1, num(req.query.page, 1));
  const perPage = Math.min(100, Math.max(5, num(req.query.perPage, 100)));
  const search = String(req.query.search ?? '').trim().toLowerCase();
  const since30 = new Date(Date.now() - 30 * 86400_000).toISOString();

  const [walletsRes, ledgerRes, users] = await Promise.all([
    client
      .from('ai_token_wallets')
      .select(
        'user_id, plan_id, balance, lifetime_granted, lifetime_spent, monthly_override, note, period_start, period_end, updated_at'
      )
      .order('updated_at', { ascending: false })
      .limit(5000),
    client.from('ai_token_ledger').select('user_id, delta').gte('created_at', since30).limit(50000),
    authUsers(),
  ]);

  const spend = new Map<string, { tokens: number; requests: number }>();
  for (const entry of (ledgerRes.data ?? []) as any[]) {
    const delta = num(entry.delta);
    if (!entry.user_id || delta >= 0) continue;
    const bucket = spend.get(entry.user_id) ?? { tokens: 0, requests: 0 };
    bucket.tokens += -delta;
    bucket.requests += 1;
    spend.set(entry.user_id, bucket);
  }

  let rows = ((walletsRes.data ?? []) as any[]).map((wallet) => ({
    userId: wallet.user_id,
    name: users.get(wallet.user_id)?.name ?? 'Learner',
    email: users.get(wallet.user_id)?.email ?? '',
    planId: wallet.plan_id,
    balance: num(wallet.balance),
    lifetimeGranted: num(wallet.lifetime_granted),
    lifetimeSpent: num(wallet.lifetime_spent),
    monthlyOverride: wallet.monthly_override ?? null,
    note: wallet.note ?? null,
    spent30d: spend.get(wallet.user_id)?.tokens ?? 0,
    requests30d: spend.get(wallet.user_id)?.requests ?? 0,
    periodStart: wallet.period_start,
    periodEnd: wallet.period_end,
    updatedAt: wallet.updated_at,
  }));

  if (search) {
    rows = rows.filter(
      (row) =>
        row.userId.toLowerCase().includes(search) ||
        row.name.toLowerCase().includes(search) ||
        row.email.toLowerCase().includes(search)
    );
  }

  rows.sort((a, b) => b.spent30d - a.spent30d || b.balance - a.balance);
  const start = (page - 1) * perPage;

  return res.json({ rows: rows.slice(start, start + perPage), total: rows.length, page, perPage });
});

// ---------------------------------------------------------------------------
// POST /api/admin/ai/tokens/grant   { userId, amount, reason }
// ---------------------------------------------------------------------------
aiTokensRouter.post('/tokens/grant', async (req: Request, res: Response) => {
  const client = db(res);
  if (!client) return;

  const { userId, amount, reason } = req.body ?? {};
  const value = Math.round(num(amount));
  if (!userId) return res.status(400).json({ error: 'userId is required.' });
  if (value <= 0) return res.status(400).json({ error: 'Amount must be positive.' });

  const { data, error } = await client.rpc('ai_grant_tokens', {
    p_user: userId,
    p_amount: value,
    p_reason: 'grant',
    p_source: 'admin_console',
    p_metadata: { note: reason ?? '', admin: (req as Request & { adminEmail?: string }).adminEmail ?? req.body?.adminEmail ?? 'admin' },
  });
  if (error) return res.status(500).json({ error: error.message });

  const row = Array.isArray(data) ? data[0] : data;
  return res.json({ ok: true, balance: num(row?.balance) });
});

// ---------------------------------------------------------------------------
// PATCH /api/admin/ai/tokens/wallets/:userId
// ---------------------------------------------------------------------------
aiTokensRouter.patch('/tokens/wallets/:userId', async (req: Request, res: Response) => {
  const client = db(res);
  if (!client) return;

  const userId = req.params.userId;
  const { planId, monthlyOverride, note, adjustBalance } = req.body ?? {};

  const patch: Record<string, unknown> = {};
  if (planId !== undefined) {
    if (!['free', 'plus', 'pro'].includes(planId)) return res.status(400).json({ error: 'Unknown plan.' });
    patch.plan_id = planId;
  }
  if (monthlyOverride !== undefined) {
    if (monthlyOverride !== null && num(monthlyOverride) < 0) {
      return res.status(400).json({ error: 'Monthly limit must be zero or positive.' });
    }
    patch.monthly_override = monthlyOverride === null ? null : Math.round(num(monthlyOverride));
  }
  if (note !== undefined) patch.note = note;

  if (Object.keys(patch).length) {
    const { error } = await client.from('ai_token_wallets').update(patch).eq('user_id', userId);
    if (error) return res.status(500).json({ error: error.message });
  }

  const delta = Math.round(num(adjustBalance));
  if (delta > 0) {
    const { error } = await client.rpc('ai_grant_tokens', {
      p_user: userId,
      p_amount: delta,
      p_reason: 'grant',
      p_source: 'admin_console',
      p_metadata: { note: note ?? 'Manual adjustment', admin: (req as Request & { adminEmail?: string }).adminEmail ?? req.body?.adminEmail ?? 'admin' },
    });
    if (error) return res.status(500).json({ error: error.message });
  } else if (delta < 0) {
    const { error } = await client.rpc('ai_spend_tokens', {
      p_user: userId,
      p_amount: Math.abs(delta),
      p_reason: 'adjustment',
      p_source: 'admin_console',
      p_metadata: { note: note ?? '', admin: (req as Request & { adminEmail?: string }).adminEmail ?? req.body?.adminEmail ?? 'admin' },
    });
    if (error) return res.status(400).json({ error: error.message });
  }

  return res.json({ ok: true });
});

// ---------------------------------------------------------------------------
// Providers
// ---------------------------------------------------------------------------
aiTokensRouter.get('/tokens/providers', async (_req: Request, res: Response) => {
  const client = db(res);
  if (!client) return;
  const { data, error } = await client.from('ai_provider_accounts').select('*').order('provider');
  if (error) return res.status(500).json({ error: error.message });
  return res.json(
    ((data ?? []) as any[]).map((row) => ({
      id: String(row.id),
      provider: String(row.provider),
      keyAlias: String(row.key_alias),
      agentIds: Array.isArray(row.agent_ids) ? row.agent_ids : [],
      monthlyQuota: num(row.monthly_quota),
      usedUnits: num(row.used_units),
      status: String(row.status ?? 'active'),
      cooldownUntil: row.cooldown_until ?? null,
      lastError: row.last_error ?? null,
      lastUsedAt: row.last_used_at ?? null,
      updatedAt: row.updated_at ?? '',
    }))
  );
});

aiTokensRouter.patch('/tokens/providers/:id', async (req: Request, res: Response) => {
  const client = db(res);
  if (!client) return;
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  const { status, monthlyQuota } = req.body ?? {};
  if (status !== undefined) {
    if (!['active', 'cooling', 'disabled', 'exhausted'].includes(status)) {
      return res.status(400).json({ error: 'Unknown provider status.' });
    }
    patch.status = status;
  }
  if (monthlyQuota !== undefined) patch.monthly_quota = Math.max(0, Math.round(num(monthlyQuota)));
  const { error } = await client.from('ai_provider_accounts').update(patch).eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  return res.json({ ok: true });
});

// ---------------------------------------------------------------------------
// Global settings
// ---------------------------------------------------------------------------
async function readSettings(client: NonNullable<typeof supabaseServer>) {
  const { data } = await client.from('ai_settings').select('*').eq('id', 'global').maybeSingle();
  return {
    freeMonthlyTokens: num(data?.free_monthly_tokens, 5000),
    costChatTurn: num(data?.cost_chat_turn, 1),
    costVoiceMinute: num(data?.cost_voice_minute, 25),
    costTts1kChars: num(data?.cost_tts_1k_chars, 5),
    costSttMinute: num(data?.cost_stt_minute, 10),
    rateLimitPerMin: num(data?.rate_limit_per_min, 30),
    providerChains:
      data?.provider_chains && typeof data.provider_chains === 'object'
        ? (data.provider_chains as Record<string, string[]>)
        : {},
    updatedAt: String(data?.updated_at ?? ''),
  };
}

aiTokensRouter.get('/tokens/settings', async (_req: Request, res: Response) => {
  const client = db(res);
  if (!client) return;
  return res.json(await readSettings(client));
});

aiTokensRouter.put('/tokens/settings', async (req: Request, res: Response) => {
  const client = db(res);
  if (!client) return;

  const body = req.body ?? {};
  const row: Record<string, unknown> = { updated_at: new Date().toISOString() };
  const numeric: [string, string][] = [
    ['freeMonthlyTokens', 'free_monthly_tokens'],
    ['costChatTurn', 'cost_chat_turn'],
    ['costVoiceMinute', 'cost_voice_minute'],
    ['costTts1kChars', 'cost_tts_1k_chars'],
    ['costSttMinute', 'cost_stt_minute'],
    ['rateLimitPerMin', 'rate_limit_per_min'],
  ];
  for (const [key, column] of numeric) {
    if (body[key] === undefined) continue;
    const parsed = Math.round(num(body[key]));
    if (parsed < 0) return res.status(400).json({ error: `Invalid value for ${key}.` });
    row[column] = parsed;
  }

  if (body.providerChains !== undefined) {
    const allowed = ['groq', 'openrouter', 'nvidia', 'gemini'];
    const chains: Record<string, string[]> = {};
    for (const [agent, chain] of Object.entries(body.providerChains ?? {})) {
      if (!Array.isArray(chain)) continue;
      const cleaned = (chain as unknown[]).filter(
        (entry): entry is string => typeof entry === 'string' && allowed.includes(entry)
      );
      if (cleaned.length) chains[agent] = [...new Set(cleaned)];
    }
    row.provider_chains = chains;
  }

  const { error } = await client.from('ai_settings').update(row).eq('id', 'global');
  if (error) return res.status(500).json({ error: error.message });
  return res.json(await readSettings(client));
});

// ---------------------------------------------------------------------------
// Voice profiles
// ---------------------------------------------------------------------------
aiTokensRouter.get('/tokens/voice-profiles', async (_req: Request, res: Response) => {
  const client = db(res);
  if (!client) return;
  const { data, error } = await client.from('ai_voice_profiles').select('*').order('agent_id');
  if (error) return res.status(500).json({ error: error.message });
  return res.json(
    ((data ?? []) as any[]).map((row) => ({
      id: String(row.id),
      agentId: String(row.agent_id),
      language: String(row.language),
      voiceId: String(row.elevenlabs_voice_id),
      modelId: String(row.model_id ?? 'eleven_multilingual_v2'),
      displayName: row.display_name ?? null,
      keyAlias: row.key_alias ?? null,
      isActive: Boolean(row.is_active),
    }))
  );
});

aiTokensRouter.put('/tokens/voice-profiles', async (req: Request, res: Response) => {
  const client = db(res);
  if (!client) return;
  const { agentId, language, voiceId, modelId, displayName } = req.body ?? {};
  if (!agentId || !language || !voiceId) {
    return res.status(400).json({ error: 'agentId, language and voiceId are required.' });
  }
  const { error } = await client.from('ai_voice_profiles').upsert(
    [
      {
        agent_id: agentId,
        language,
        elevenlabs_voice_id: voiceId,
        model_id: modelId || 'eleven_multilingual_v2',
        display_name: displayName || null,
        is_active: true,
      },
    ],
    { onConflict: 'agent_id,language' }
  );
  if (error) return res.status(500).json({ error: error.message });
  return res.json({ ok: true });
});

// ---------------------------------------------------------------------------
// Upgrade requests
// ---------------------------------------------------------------------------
aiTokensRouter.get('/tokens/upgrades', async (req: Request, res: Response) => {
  const client = db(res);
  if (!client) return;

  const status = String(req.query.status ?? 'pending');
  let query = client.from('ai_upgrade_requests').select('*').order('created_at', { ascending: false }).limit(200);
  if (status !== 'all') query = query.eq('status', status);

  const [{ data, error }, users] = await Promise.all([query, authUsers()]);
  if (error) return res.status(500).json({ error: error.message });

  const rows = (data ?? []) as any[];
  const paths = rows
    .map((row) => row.receipt_url)
    .filter((value: unknown): value is string => typeof value === 'string' && value.length > 0 && !/^https?:/i.test(value));

  const signed = new Map<string, string>();
  if (paths.length) {
    try {
      const { data: signedRows } = await client.storage.from('ai-receipts').createSignedUrls(paths, 3600);
      for (const item of signedRows ?? []) {
        if (item.path && item.signedUrl) signed.set(item.path, item.signedUrl);
      }
    } catch {
      // A missing receipt must not block the queue.
    }
  }

  return res.json(
    rows.map((row) => {
      const receipt = (row.receipt_url as string | null) ?? null;
      return {
        id: String(row.id),
        userId: String(row.user_id),
        userName: users.get(row.user_id)?.name ?? 'Learner',
        userEmail: users.get(row.user_id)?.email ?? '',
        planId: row.plan_id ?? null,
        tokensRequested: num(row.tokens_requested),
        amountPhp: num(row.amount_php),
        paymentMethod: row.payment_method ?? 'gcash',
        referenceNo: row.reference_no ?? null,
        receiptUrl: receipt ? (/^https?:/i.test(receipt) ? receipt : signed.get(receipt) ?? null) : null,
        status: row.status ?? 'pending',
        adminNote: row.admin_note ?? null,
        reviewedBy: row.reviewed_by ?? null,
        reviewedAt: row.reviewed_at ?? null,
        createdAt: row.created_at,
      };
    })
  );
});

aiTokensRouter.post('/tokens/upgrades/:id/review', async (req: Request, res: Response) => {
  const client = db(res);
  if (!client) return;

  const { action, note, adminEmail } = req.body ?? {};
  const approve = action !== 'reject';

  const { data: request, error } = await client
    .from('ai_upgrade_requests')
    .select('*')
    .eq('id', req.params.id)
    .maybeSingle();
  if (error) return res.status(500).json({ error: error.message });
  if (!request) return res.status(404).json({ error: 'Upgrade request not found.' });
  if (request.status !== 'pending') return res.status(409).json({ error: 'This request was already reviewed.' });

  const reviewedAt = new Date().toISOString();

  if (approve) {
    const tokens = num(request.tokens_requested);
    if (tokens > 0) {
      const { error: grantError } = await client.rpc('ai_grant_tokens', {
        p_user: request.user_id,
        p_amount: Math.round(tokens),
        p_reason: 'purchase',
        p_source: 'gcash_upgrade',
        p_metadata: {
          requestId: req.params.id,
          referenceNo: request.reference_no,
          planId: request.plan_id,
          admin: adminEmail ?? 'admin',
        },
      });
      if (grantError) return res.status(500).json({ error: grantError.message });
    }
    if (request.plan_id) {
      const { error: planError } = await client
        .from('ai_token_wallets')
        .update({ plan_id: request.plan_id, plan_started_at: reviewedAt })
        .eq('user_id', request.user_id);
      if (planError) return res.status(500).json({ error: planError.message });
    }
  }

  const { error: updateError } = await client
    .from('ai_upgrade_requests')
    .update({
      status: approve ? 'approved' : 'rejected',
      admin_note: note ?? null,
      reviewed_by: adminEmail ?? 'admin',
      reviewed_at: reviewedAt,
    })
    .eq('id', req.params.id);
  if (updateError) return res.status(500).json({ error: updateError.message });

  return res.json({ ok: true, status: approve ? 'approved' : 'rejected' });
});
