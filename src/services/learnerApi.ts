import { authHeaders } from './tokenService';

export async function completeLessonServer(lessonId: string, language?: string, score?: number | null) {
  const headers = await authHeaders();
  const res = await fetch('/api/learner/lesson-complete', {
    method: 'POST',
    headers: Object.assign({ 'Content-Type': 'application/json' }, headers as any),
    body: JSON.stringify({ lessonId: lessonId, language: language, score: score }),
  });
  if (!res.ok) {
    throw new Error('lesson-complete failed: ' + res.status);
  }
  return res.json();
}

export async function fetchProgress() {
  const headers = await authHeaders();
  const res = await fetch('/api/learner/progress', {
    method: 'GET',
    headers: Object.assign({}, headers as any),
  });
  if (!res.ok) throw new Error('progress failed: ' + res.status);
  return res.json();
}
