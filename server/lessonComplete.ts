import { checkRateLimit, resolveIdentity } from './ai';
import { getLessonFromCatalog } from './lessonCatalog';
import { recordActivity } from './learnerActivity';
import {
  CertificateNotEligibleError,
  LearnerProgressUnavailableError,
  claimLearnerCertificate,
  getLearnerProgress,
  syncLearnerAccountMirror,
} from './learnerProgress';
import { supabaseServer } from './supabaseServer';

// The root app uses Express 4 while `server/` has its own Express 5 toolchain.
// Keep the handler contract structural so both versions can call these routes
// without cross-version Request/Response type conflicts.
interface LearnerRequest {
  headers: Record<string, string | string[] | undefined>;
  body?: Record<string, unknown>;
}

interface LearnerResponse {
  status(code: number): LearnerResponse;
  json(body: unknown): unknown;
}

function normalizeScore(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function progressUnavailable(res: LearnerResponse) {
  return res.status(503).json({
    error: 'Learner progress storage is not configured.',
    code: 'LEARNER_PROGRESS_UNAVAILABLE',
  });
}

export async function lessonCompleteHandler(req: LearnerRequest, res: LearnerResponse) {
  const identity = await resolveIdentity(req);
  if (!identity.verified || !identity.userId) {
    return res.status(401).json({ error: 'Sign in required', code: 'UNAUTHENTICATED' });
  }

  const limit = checkRateLimit(`learner-lesson-complete:${identity.userId}`, 60);
  if (!limit.ok) {
    return res.status(429).json({
      error: 'Too many lesson completion requests',
      retryAfterSeconds: limit.retryAfterSeconds,
    });
  }

  const { lessonId, score } = req.body || {};
  if (!lessonId || typeof lessonId !== 'string') {
    return res.status(400).json({ error: 'lessonId required', code: 'LESSON_ID_REQUIRED' });
  }

  const catalogLesson = getLessonFromCatalog(lessonId);
  if (!catalogLesson) {
    return res.status(400).json({ error: 'Unknown lesson', code: 'UNKNOWN_LESSON' });
  }
  if (!supabaseServer) return progressUnavailable(res);

  const xpAwarded = Math.min(Math.max(Number(catalogLesson.xpReward) || 0, 0), 250);
  const normalizedScore = normalizeScore(score);

  // The browser may report a score, but it can never choose the language, XP
  // amount or completion ID. Those come from the server catalog.
  const { data: inserted, error } = await supabaseServer
    .from('completed_lessons')
    .insert({
      user_id: identity.userId,
      lesson_id: lessonId,
      language: catalogLesson.language,
      module_id: catalogLesson.moduleId,
      xp_awarded: xpAwarded,
      score: normalizedScore,
    })
    .select('lesson_id, score, xp_awarded, completed_at')
    .single();

  if (error) {
    if (error.code === '23505') {
      const { data: existing } = await supabaseServer
        .from('completed_lessons')
        .select('score, xp_awarded, completed_at')
        .eq('user_id', identity.userId)
        .eq('lesson_id', lessonId)
        .maybeSingle();

      try {
        const progress = await getLearnerProgress(identity.userId);
        await syncLearnerAccountMirror(identity.userId, progress);
        return res.json({
          success: true,
          alreadyCompleted: true,
          lessonId,
          xpAwarded: 0,
          score: existing?.score ?? null,
          progress,
        });
      } catch (progressError) {
        console.error('[lesson-complete] duplicate progress load failed:', progressError);
        return res.status(500).json({ error: 'Could not load learner progress' });
      }
    }

    console.error('[lesson-complete] insert failed:', error);
    return res.status(500).json({ error: 'Could not save lesson completion' });
  }

  try {
    await recordActivity(identity.userId, {
      minutes: 5,
      xp: xpAwarded,
      lessons: 1,
    });
  } catch (activityError) {
    // Completion is already persisted and remains authoritative. The activity
    // row can be reconciled later; do not double-award XP by failing here.
    console.warn('[lesson-complete] activity write failed:', activityError);
  }

  try {
    const progress = await getLearnerProgress(identity.userId);
    await syncLearnerAccountMirror(identity.userId, progress);
    return res.json({
      success: true,
      alreadyCompleted: false,
      lessonId,
      xpAwarded,
      score: inserted?.score ?? normalizedScore,
      progress,
    });
  } catch (progressError) {
    console.error('[lesson-complete] progress load failed:', progressError);
    return res.status(500).json({ error: 'Lesson saved, but progress could not be loaded. Retry to sync.' });
  }
}

export async function progressHandler(req: LearnerRequest, res: LearnerResponse) {
  const identity = await resolveIdentity(req);
  if (!identity.verified || !identity.userId) {
    return res.status(401).json({ error: 'Sign in required', code: 'UNAUTHENTICATED' });
  }

  const limit = checkRateLimit(`learner-progress:${identity.userId}`, 120);
  if (!limit.ok) {
    return res.status(429).json({
      error: 'Too many progress requests',
      retryAfterSeconds: limit.retryAfterSeconds,
    });
  }

  try {
    const progress = await getLearnerProgress(identity.userId);
    return res.json(progress);
  } catch (error) {
    if (error instanceof LearnerProgressUnavailableError) return progressUnavailable(res);
    console.error('[learner-progress] load failed:', error);
    return res.status(500).json({ error: 'Could not load learner progress' });
  }
}

export async function claimCertificateHandler(req: LearnerRequest, res: LearnerResponse) {
  const identity = await resolveIdentity(req);
  if (!identity.verified || !identity.userId) {
    return res.status(401).json({ error: 'Sign in required', code: 'UNAUTHENTICATED' });
  }

  const limit = checkRateLimit(`learner-certificate:${identity.userId}`, 10);
  if (!limit.ok) {
    return res.status(429).json({
      error: 'Too many certificate requests',
      retryAfterSeconds: limit.retryAfterSeconds,
    });
  }

  try {
    const certificate = await claimLearnerCertificate(identity.userId);
    return res.json(certificate);
  } catch (error) {
    if (error instanceof CertificateNotEligibleError) {
      return res.status(409).json({
        error: error.message,
        code: error.code,
        certificate: error.progress.certificate,
      });
    }
    if (error instanceof LearnerProgressUnavailableError) return progressUnavailable(res);
    console.error('[learner-certificate] claim failed:', error);
    return res.status(500).json({ error: 'Could not issue certificate' });
  }
}
