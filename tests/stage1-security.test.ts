import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import {
  buildSafeLearnerProfile,
  parseClientActivityIncrement,
} from '../server/learnerSecurity.ts';

const IDENTITY = {
  userId: '11111111-1111-4111-8111-111111111111',
  email: 'learner@example.com',
};

describe('Stage 1 learner sync allow-list', () => {
  it('binds identity from the verified token and ignores client-owned fields', () => {
    const result = buildSafeLearnerProfile(
      {
        id: '22222222-2222-4222-8222-222222222222',
        email: 'attacker@example.com',
        name: '  Ana\u0000  ',
        role: 'Super Admin',
        status: 'BANNED',
        targetDialect: 'davao_bisaya',
        dailyGoalMinutes: '30',
        xp: 999999,
        streakDays: 999,
        hearts: 0,
        speechScoreAverage: 100,
        vocabularyMastered: 99999,
        lastActive: 'never',
      },
      IDENTITY,
    );

    assert.equal(result.ok, true);
    if (!result.ok) return;

    assert.deepEqual(
      Object.keys(result.profile).sort(),
      ['dailyGoalMinutes', 'email', 'name', 'targetDialect'],
    );
    assert.equal(result.profile.email, IDENTITY.email);
    assert.equal(result.profile.name, 'Ana');
    assert.equal(result.profile.dailyGoalMinutes, 30);
    assert.equal(result.profile.targetDialect, 'davao_bisaya');
    assert.equal('xp' in result.profile, false);
    assert.equal('hearts' in result.profile, false);
    assert.equal('streakDays' in result.profile, false);
    assert.equal('role' in result.profile, false);
    assert.equal('status' in result.profile, false);
  });

  it('never trusts a body email when the token has no email', () => {
    const result = buildSafeLearnerProfile(
      { name: 'Ana', email: 'body@example.com' },
      { userId: IDENTITY.userId, email: null },
    );

    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(result.profile.email, null);
  });

  it('rejects a missing name and a missing verified identity', () => {
    assert.deepEqual(
      buildSafeLearnerProfile({ name: '   ' }, IDENTITY),
      { ok: false, error: 'name is required' },
    );
    assert.deepEqual(
      buildSafeLearnerProfile({ name: 'Ana' }, { userId: '' }),
      { ok: false, error: 'Verified learner identity is required' },
    );
  });

  it('normalizes dialect and daily-goal preferences safely', () => {
    const invalid = buildSafeLearnerProfile(
      { name: 'Ana', targetDialect: 'not-a-dialect', dailyGoalMinutes: -10 },
      IDENTITY,
    );
    assert.equal(invalid.ok, true);
    if (!invalid.ok) return;
    assert.equal(invalid.profile.targetDialect, 'davao_bisaya');
    assert.equal(invalid.profile.dailyGoalMinutes, 15);

    const huge = buildSafeLearnerProfile(
      { name: 'Ana', dailyGoalMinutes: 99999 },
      IDENTITY,
    );
    assert.equal(huge.ok, true);
    if (!huge.ok) return;
    assert.equal(huge.profile.dailyGoalMinutes, 1440);
  });
});

describe('Stage 1 client activity allow-list', () => {
  it('discards browser-submitted XP and lesson counts', () => {
    const increment = parseClientActivityIncrement({
      minutes: '5',
      goalMinutes: '20',
      xp: 250,
      lessons: 50,
      userId: '22222222-2222-4222-8222-222222222222',
    });

    assert.deepEqual(increment, { minutes: 5, goalMinutes: 20 });
    assert.equal('xp' in increment, false);
    assert.equal('lessons' in increment, false);
  });

  it('clamps minutes and ignores invalid goal values', () => {
    assert.deepEqual(parseClientActivityIncrement({ minutes: -5 }), {
      minutes: 0,
      goalMinutes: undefined,
    });
    assert.deepEqual(parseClientActivityIncrement({ minutes: 99999 }), {
      minutes: 600,
      goalMinutes: undefined,
    });
  });
});

describe('Stage 1 database migration invariants', () => {
  const migration = readFileSync(
    new URL(
      '../supabase/migrations/20261024140000_stage1_secure_learner_data_authority.sql',
      import.meta.url,
    ),
    'utf8',
  );

  it('casts the text learner id before comparing it with auth.uid()', () => {
    assert.match(migration, /id = auth\.uid\(\)::text/);
  });

  it('removes direct browser writes from learner tables', () => {
    assert.match(
      migration,
      /REVOKE INSERT, UPDATE, DELETE ON public\.learner_accounts FROM anon, authenticated/,
    );
    assert.match(
      migration,
      /REVOKE INSERT, UPDATE, DELETE ON public\.learner_daily_activity FROM anon, authenticated/,
    );
    assert.doesNotMatch(
      migration,
      /CREATE POLICY[^;]*FOR INSERT[^;]*public\.learner_accounts/is,
    );
    assert.doesNotMatch(
      migration,
      /CREATE POLICY[^;]*FOR UPDATE[^;]*public\.learner_accounts/is,
    );
    assert.match(
      migration,
      /REVOKE INSERT, UPDATE, DELETE ON public\.audit_logs FROM anon, authenticated/,
    );
    assert.match(migration, /Audit logs readable by admins/);
  });

  it('keeps the previously committed owner-write migration runnable', () => {
    const ownerMigration = readFileSync(
      new URL(
        '../supabase/migrations/20261024120000_restrict_learner_accounts_rls.sql',
        import.meta.url,
      ),
      'utf8',
    );
    assert.match(ownerMigration, /id = auth\.uid\(\)::text/);
    assert.doesNotMatch(ownerMigration, /USING \(id = auth\.uid\(\)\)/);
    assert.doesNotMatch(ownerMigration, /WITH CHECK \(id = auth\.uid\(\)\)/);
  });
});

describe('Stage 1 learner route wiring', () => {
  const source = readFileSync(new URL('../server.ts', import.meta.url), 'utf8');

  it('requires a verified token for learner sync and activity', () => {
    assert.match(
      source,
      /app\.post\('\/api\/learner\/sync'[\s\S]*?requireVerifiedUser\(identity, res\)/,
    );
    assert.match(
      source,
      /app\.get\('\/api\/learner\/activity'[\s\S]*?requireVerifiedUser\(identity, res\)/,
    );
    assert.match(
      source,
      /app\.post\('\/api\/learner\/activity'[\s\S]*?requireVerifiedUser\(identity, res\)/,
    );
  });

  it('does not forward browser XP/lessons into the activity writer', () => {
    assert.match(
      source,
      /parseClientActivityIncrement\(req\.body\)[\s\S]*?xp: 0,[\s\S]*?lessons: 0,/,
    );
    assert.doesNotMatch(source, /xp: Number\(xp\)/);
    assert.doesNotMatch(source, /lessons: Number\(lessons\)/);
  });

  it('requires verified tokens for wallet and upgrade requests', () => {
    assert.match(
      source,
      /app\.get\('\/api\/sulti\/wallet'[\s\S]*?requireVerifiedUser\(identity, res\)/,
    );
    assert.match(
      source,
      /app\.get\('\/api\/sulti\/tokens\/requests'[\s\S]*?requireVerifiedUser\(identity, res\)/,
    );
    assert.match(
      source,
      /app\.post\('\/api\/sulti\/tokens\/request'[\s\S]*?requireVerifiedUser\(identity, res\)/,
    );
  });
});

describe('Stage 1 admin API gate', () => {
  const routes = readFileSync(
    new URL('../admin/api/adminRoutes.ts', import.meta.url),
    'utf8',
  );
  const gate = readFileSync(
    new URL('../admin/api/adminAuth.ts', import.meta.url),
    'utf8',
  );
  const authContext = readFileSync(
    new URL('../admin/components/AdminAuthContext.tsx', import.meta.url),
    'utf8',
  );

  it('protects every admin route except the public health probe', () => {
    assert.match(routes, /req\.path === '\/health'/);
    assert.match(routes, /requireAdmin\(req, res, next\)/);
    assert.ok(
      routes.indexOf('requireAdmin(req, res, next)') <
        routes.indexOf("adminRouter.use('/ai'"),
      'admin auth must run before the AI token routes',
    );
  });

  it('requires public.users.role to be exactly admin', () => {
    assert.match(gate, /profile\.role\) !== 'admin'/);
    assert.match(gate, /identity\.verified/);
  });

  it('does not restore a fake local/demo administrator', () => {
    assert.doesNotMatch(authContext, /DEMO_ADMIN/);
    assert.doesNotMatch(authContext, /jmc\.edu\.ph/);
    assert.doesNotMatch(authContext, /falling back to local admin/);
  });
});
