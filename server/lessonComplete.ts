import { Request, Response } from 'express';
import { resolveIdentity } from './authIdentity';
import { getLessonFromCatalog } from './lessonCatalog';
import { recordActivity } from './learnerActivity';
import { supabaseServer } from './supabaseServer';

export async function lessonCompleteHandler(req: Request, res: Response) {
  const identity = await resolveIdentity(req);
  if (!identity.userId) {
    return res.status(401).json({ error: 'Sign in required', code: 'UNAUTHENTICATED' });
  }

  const { lessonId, language, score } = req.body || {};
  if (!lessonId || typeof lessonId !== 'string') {
    return res.status(400).json({ error: 'lessonId required' });
  }

  const catalogLesson = getLessonFromCatalog(lessonId);
  if (!catalogLesson) {
    return res.status(400).json({ error: 'Unknown lesson' });
  }

  const lessonLanguage = language || catalogLesson.language;

  // Check if already completed
  if (supabaseServer) {
    const { data: existing } = await supabaseServer
      .from('completed_lessons')
      .select('*')
      .eq('user_id', identity.userId)
      .eq('lesson_id', lessonId)
      .maybeSingle();
    
    if (existing) {
      return res.json({
        success: true,
        alreadyCompleted: true,
        lessonId,
        xpAwarded: existing.xp_awarded,
        score: existing.score,
        completedAt: existing.completed_at,
      });
    }
  }

  const xpAwarded = Math.min(Math.max(Number(catalogLesson.xpReward) || 0, 0), 250);
  const normalizedScore = typeof score === 'number' && Number.isFinite(score) ? Math.max(0, Math.min(100, Math.round(score))) : null;

  // Record to completed_lessons
  if (supabaseServer) {
    await supabaseServer.from('completed_lessons').insert({
      user_id: identity.userId,
      lesson_id: lessonId,
      language: lessonLanguage,
      module_id: catalogLesson.moduleId,
      xp_awarded: xpAwarded,
      score: normalizedScore,
    });
  }

  // Record activity (don't double-count XP in profile - activity tracks for calendar)
  try {
    await recordActivity(identity.userId, {
      minutes: 5,
      xp: xpAwarded,
      lessons: 1,
    });
  } catch (e) {
    // ignore
  }

  return res.json({
    success: true,
    alreadyCompleted: false,
    lessonId,
    xpAwarded,
    score: normalizedScore,
  });
}

export async function progressHandler(req: Request, res: Response) {
  const identity = await resolveIdentity(req);
  if (!identity.userId) {
    return res.status(401).json({ error: 'Sign in required', code: 'UNAUTHENTICATED' });
  }

  if (!supabaseServer) {
    return res.json({ completedLessons: [], xpByLanguage: {}, streakDays: 0 });
  }

  const { data: completed } = await supabaseServer
    .from('completed_lessons')
    .select('*')
    .eq('user_id', identity.userId);

  const xpByLanguage: Record<string, number> = {};
  const completedLessonIds: string[] = [];
  for (const c of completed || []) {
    completedLessonIds.push(c.lesson_id);
    xpByLanguage[c.language] = (xpByLanguage[c.language] || 0) + (c.xp_awarded || 0);
  }

  // Get streak from activity
  let streakDays = 0;
  try {
    const { getActivitySummary } = await import('./learnerActivity');
    const summary = await getActivitySummary(identity.userId);
    streakDays = summary.streakDays;
  } catch (e) {
    // ignore
  }

  return res.json({
    completedLessons: completedLessonIds,
    xpByLanguage,
    streakDays,
  });
}
