// ============================================================================
// Learner progress client
// ----------------------------------------------------------------------------
// The browser sends a lesson id and an optional self-reported score. It never
// sends XP, language, badge state or certificate eligibility. The server returns
// the canonical snapshot after every completion.
// ============================================================================
import type {
  LearnerCertificateState,
  LearnerProgressSnapshot,
  LessonCompletionResult,
  MajorLanguageId,
} from '../types';
import { authHeaders } from './tokenService';

export class LearnerProgressApiError extends Error {
  status: number;
  code?: string;
  certificate?: LearnerCertificateState;
  constructor(message: string, status: number, code?: string, certificate?: LearnerCertificateState) {
    super(message);
    this.name = 'LearnerProgressApiError';
    this.status = status;
    this.code = code;
    this.certificate = certificate;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: {
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...(await authHeaders()),
      ...(init?.headers || {}),
    },
  });

  let payload: any = null;
  try {
    payload = await res.json();
  } catch {
    payload = null;
  }

  if (!res.ok) {
    throw new LearnerProgressApiError(
      payload?.error || `Request failed with HTTP ${res.status}`,
      res.status,
      payload?.code,
      payload?.certificate,
    );
  }
  return payload as T;
}

export async function fetchLearnerProgress(): Promise<LearnerProgressSnapshot> {
  return request<LearnerProgressSnapshot>('/api/learner/progress');
}

export async function completeLearnerLesson(input: {
  lessonId: string;
  score?: number | null;
}): Promise<LessonCompletionResult> {
  return request<LessonCompletionResult>('/api/learner/lesson-complete', {
    method: 'POST',
    body: JSON.stringify({
      lessonId: input.lessonId,
      score: typeof input.score === 'number' && Number.isFinite(input.score)
        ? input.score
        : null,
    }),
  });
}

export async function claimLearnerCertificate(
  _language: MajorLanguageId = 'cebuano',
): Promise<LearnerCertificateState> {
  return request<LearnerCertificateState>('/api/learner/certificate/claim', {
    method: 'POST',
    body: JSON.stringify({}),
  });
}
