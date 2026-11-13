// ============================================================================
// SultiAI Admin Backend + Console  (separate app, default port 5000)
//
// This is the SECOND, independent app. It is NOT connected to the learner
// backend. Its only data source is Supabase:
//   - serves the Admin Console SPA (from ./admin root, Vite in dev)
//   - serves /api/admin/* endpoints backed by Supabase (service_role)
//
//   Learner app : server.ts        -> :3000   (src/ SPA + AI endpoints)
//   Admin app   : admin/server.ts  -> :5000   (admin/ SPA + /api/admin/*)
// ============================================================================
import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import http from 'http';
import path from 'path';
import dotenv from 'dotenv';
import { adminRouter } from './api/adminRoutes';
import { isSupabaseServerConfigured, usingServiceRole } from '../server/supabaseServer';

dotenv.config();

const app = express();
const ADMIN_PORT = Number(process.env.ADMIN_PORT) || 5000;
const isProduction = process.env.NODE_ENV === 'production';

app.use(express.json({ limit: '10mb' }));

// ---------------------------------------------------------------------------
// CORS — allow the learner app / other origins to call admin APIs if needed.
// Same-origin requests from the console don't need it, but this keeps the API
// usable from a separately hosted frontend.
// ---------------------------------------------------------------------------
const allowedOrigins = (process.env.ADMIN_ALLOWED_ORIGINS || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.use((req: Request, res: Response, next: NextFunction) => {
  const origin = req.headers.origin;
  if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin || '*');
  }
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// Root banner so hitting http://localhost:5000 shows API info in JSON when the
// SPA is not requested (browsers requesting `/` get the SPA in dev).
app.get('/api', (_req: Request, res: Response) => {
  res.json({
    service: 'SultiAI Admin Backend',
    status: 'running',
    dataSource: isSupabaseServerConfigured ? 'SUPABASE' : 'UNCONFIGURED',
    usingServiceRole,
    endpoints: [
      'GET  /api/admin/health',
      'GET  /api/admin/audit-logs',
      'POST /api/admin/audit-logs',
      'DEL  /api/admin/audit-logs',
      'GET  /api/admin/system-stats',
      'GET  /api/admin/system-config',
      'POST /api/admin/system-config',
      'GET  /api/admin/learners',
      'POST /api/admin/learners/:id/action',
    ],
  });
});

// Mount the admin API
app.use('/api/admin', adminRouter);

// ---------------------------------------------------------------------------
// Serve the Admin Console SPA
// ---------------------------------------------------------------------------
if (isProduction) {
  const adminDist = path.join(import.meta.dirname, 'dist');
  app.use(express.static(adminDist));
  app.get('*', (_req: Request, res: Response) => {
    res.sendFile(path.join(adminDist, 'index.html'));
  });
} else {
  import('vite').then(async ({ createServer }) => {
    const vite = await createServer({
      configFile: path.join(import.meta.dirname, 'vite.config.ts'),
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log('Admin Console Vite middleware mounted on the admin Express server');
  });
}

// Use an explicit http server (keeps parity with the learner backend and leaves
// room for websockets later).
const server = http.createServer(app);

server.listen(ADMIN_PORT, '0.0.0.0', () => {
  console.log(`SultiAI Admin Backend + Console running on http://0.0.0.0:${ADMIN_PORT}`);
  console.log(
    isSupabaseServerConfigured
      ? `   Data source: Supabase (${usingServiceRole ? 'service_role' : 'anon key'})`
      : '   WARNING: Supabase not configured — set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env'
  );
});
