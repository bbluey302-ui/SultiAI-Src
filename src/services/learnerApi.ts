import { authHeaders } from './tokenService';

export async function completeLessonServer(lessonId: string, language?: string, score?: number | null) {
  const headers = await authHeaders();
  const res = await fetch('/api/learner/lesson-complete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(headers as any) },
    body: JSON.stringify({ lessonId, language, score }),
  });
  if (!res.ok) {
    throw new Error(lesson-complete failed: );
  }
  return res.json();
}

export async function fetchProgress() {
  const headers = await authHeaders();
  const res = await fetch('/api/learner/progress', {
    method: 'GET',
    headers: { ...(headers as any) },
  });
  if (!res.ok) throw new Error(progress failed: );
  return res.json();
}
