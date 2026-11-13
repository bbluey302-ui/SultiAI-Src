import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { UserProfile, DayActivity } from '../types';

// Retrieve Supabase credentials if configured
const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        // Keep storage enabled for PKCE code verifier so /auth/callback can
        // exchange ?code= in the same browser that started the OAuth flow.
        // "Auto-login on reload" is prevented in AuthContext instead.
        persistSession: true,
        autoRefreshToken: true,
        // PKCE gives us `?code=` callbacks, which are exchanged explicitly by
        // services/authRedirect.ts. Auto-detection is off so the exchange
        // happens in exactly one place instead of racing on boot.
        flowType: 'pkce',
        detectSessionInUrl: false,
      },
    })
  : null;

/**
 * Secondary client used only for email links (signup confirmation + password
 * recovery).
 *
 * PKCE stores a verifier in the browser that started the flow, so a
 * confirmation / recovery email opened on another device (very common: sign up
 * on desktop, open Gmail on a phone) can never be exchanged. The implicit flow
 * puts the tokens in the callback fragment, which `services/authRedirect.ts`
 * consumes with `setSession()` — so these links work from any browser.
 *
 * It never persists a session; the main client owns the real session. A
 * distinct storage key keeps GoTrue from treating it as a second writer for
 * the main client's session (the "Multiple GoTrueClient instances" warning).
 */
export const emailLinkSupabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        flowType: 'implicit',
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
        storageKey: 'sultiai-email-link-auth',
      },
    })
  : null;

export interface GeneratedMediaRecord {
  id: string;
  userId?: string;
  mediaType: 'image' | 'video' | 'music' | 'audio' | 'transcript';
  title: string;
  prompt: string;
  targetDialect: string;
  mediaUrl: string;
  status: 'completed' | 'processing' | 'failed';
  aspectRatio?: string;
  durationSeconds?: number;
  metadata?: Record<string, any>;
  createdAt: string;
}

// Service helper to save generated learning media to Supabase
export async function saveGeneratedMediaToSupabase(
  media: Omit<GeneratedMediaRecord, 'id' | 'createdAt'>
): Promise<GeneratedMediaRecord> {
  const newRecord: GeneratedMediaRecord = {
    ...media,
    id: 'media_' + Date.now(),
    createdAt: new Date().toISOString(),
  };

  // If Supabase is connected, persist into Supabase
  if (supabase) {
    try {
      const { data, error } = await supabase.from('generated_media').insert([
        {
          media_type: media.mediaType,
          title: media.title,
          prompt: media.prompt,
          target_dialect: media.targetDialect,
          media_url: media.mediaUrl,
          status: media.status,
          aspect_ratio: media.aspectRatio || '1:1',
          duration_seconds: media.durationSeconds || 0,
          metadata: media.metadata || {},
        },
      ]).select().single();

      if (!error && data) {
        return {
          id: data.id,
          userId: data.user_id,
          mediaType: data.media_type,
          title: data.title,
          prompt: data.prompt,
          targetDialect: data.target_dialect,
          mediaUrl: data.media_url,
          status: data.status,
          aspectRatio: data.aspect_ratio,
          durationSeconds: data.duration_seconds,
          metadata: data.metadata,
          createdAt: data.created_at,
        };
      }
    } catch (err) {
      console.warn('Supabase media save fallback to local storage:', err);
    }
  }

  // Local storage cache fallback
  try {
    const existing = JSON.parse(localStorage.getItem('sultiai_generated_media') || '[]');
    localStorage.setItem('sultiai_generated_media', JSON.stringify([newRecord, ...existing]));
  } catch {
    // ignore
  }

  return newRecord;
}

// Fetch generated media
export async function fetchGeneratedMedia(): Promise<GeneratedMediaRecord[]> {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('generated_media')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        return data.map((d: any) => ({
          id: d.id,
          userId: d.user_id,
          mediaType: d.media_type,
          title: d.title,
          prompt: d.prompt,
          targetDialect: d.target_dialect,
          mediaUrl: d.media_url,
          status: d.status,
          aspectRatio: d.aspect_ratio,
          durationSeconds: d.duration_seconds,
          metadata: d.metadata,
          createdAt: d.created_at,
        }));
      }
    } catch (err) {
      console.warn('Supabase media fetch fallback:', err);
    }
  }

  try {
    return JSON.parse(localStorage.getItem('sultiai_generated_media') || '[]');
  } catch {
    return [];
  }
}

// ----------------------------------------------------------------------------
// Speaking City Mission Persistence Helpers
// ----------------------------------------------------------------------------

export interface SpeakingMissionAttemptRecord {
  missionId: string;
  destinationId: string;
  language: string;
  userTranscript: string;
  audioUrl?: string;
  overallScore: number;
  scores: {
    taskCompletion: number;
    vocabulary: number;
    languageUse: number;
    communication: number;
  };
  passed: boolean;
  feedback: {
    summary: string;
    improvementTip: string;
    suggestedBetterResponse: string;
  };
  xpEarned: number;
}

export async function saveSpeakingAttemptToSupabase(
  attempt: SpeakingMissionAttemptRecord,
  userId?: string
): Promise<void> {
  if (supabase && userId) {
    try {
      await supabase.from('speaking_mission_attempts').insert([
        {
          user_id: userId,
          mission_id: attempt.missionId,
          destination_id: attempt.destinationId,
          language: attempt.language,
          user_transcript: attempt.userTranscript,
          audio_url: attempt.audioUrl || null,
          overall_score: attempt.overallScore,
          scores: attempt.scores,
          passed: attempt.passed,
          feedback: attempt.feedback,
          xp_earned: attempt.xpEarned,
        },
      ]);
    } catch (err) {
      console.warn('Supabase speaking attempt save fallback to local:', err);
    }
  }

  // Also persist to local attempts history
  try {
    const key = `sultiai_speaking_attempts_${attempt.language}`;
    const existing = JSON.parse(localStorage.getItem(key) || '[]');
    localStorage.setItem(key, JSON.stringify([attempt, ...existing].slice(0, 50)));
  } catch {
    // ignore
  }
}

export async function syncSpeakingProgressToSupabase(
  userId: string,
  language: string,
  completedMissions: string[],
  unlockedDestinations: string[],
  totalXp: number,
  highestScore: number
): Promise<void> {
  if (!supabase || !userId) return;
  try {
    await supabase.from('speaking_mission_progress').upsert(
      [
        {
          user_id: userId,
          language,
          completed_missions: completedMissions,
          unlocked_destinations: unlockedDestinations,
          total_speaking_xp: totalXp,
          total_missions_completed: completedMissions.length,
          highest_score: highestScore,
          updated_at: new Date().toISOString(),
        },
      ],
      { onConflict: 'user_id,language' }
    );
  } catch (err) {
    console.warn('Supabase speaking progress upsert error:', err);
  }
}

// ----------------------------------------------------------------------------
// Scenario Practice — Interactive Story Adventure Persistence Helpers
// ----------------------------------------------------------------------------

export interface ScenarioAttemptRecord {
  scenarioId: string;
  category: string;
  language: string;
  endingId: string;
  completedObjectives: string[];
  overallScore: number;
  speechTranscript?: string;
  evaluationFeedback?: {
    summary: string;
    improvementTip: string;
    suggestedAlternative: string;
  };
  passed: boolean;
  xpEarned: number;
}

export async function saveScenarioAttemptToSupabase(
  attempt: ScenarioAttemptRecord,
  userId?: string
): Promise<void> {
  if (supabase && userId) {
    try {
      await supabase.from('scenario_attempts').insert([
        {
          user_id: userId,
          scenario_id: attempt.scenarioId,
          category: attempt.category,
          language: attempt.language,
          ending_id: attempt.endingId,
          completed_objectives: attempt.completedObjectives,
          overall_score: attempt.overallScore,
          speech_transcript: attempt.speechTranscript || null,
          evaluation_feedback: attempt.evaluationFeedback || {},
          passed: attempt.passed,
          xp_earned: attempt.xpEarned,
        },
      ]);
    } catch (err) {
      console.warn('Supabase scenario attempt save fallback to local:', err);
    }
  }

  // Also persist to local attempts cache
  try {
    const key = `sultiai_scenario_attempts_${attempt.language}`;
    const existing = JSON.parse(localStorage.getItem(key) || '[]');
    localStorage.setItem(key, JSON.stringify([attempt, ...existing].slice(0, 50)));
  } catch {
    // ignore
  }
}

export async function syncScenarioProgressToSupabase(
  userId: string,
  language: string,
  completedScenarios: string[],
  unlockedCategories: string[],
  totalXp: number,
  highestScore: number,
  currentScenarioId?: string
): Promise<void> {
  if (!supabase || !userId) return;
  try {
    await supabase.from('scenario_progress').upsert(
      [
        {
          user_id: userId,
          language,
          completed_scenarios: completedScenarios,
          current_scenario_id: currentScenarioId || null,
          unlocked_categories: unlockedCategories,
          total_scenario_xp: totalXp,
          total_scenarios_completed: completedScenarios.length,
          highest_score: highestScore,
          updated_at: new Date().toISOString(),
        },
      ],
      { onConflict: 'user_id,language' }
    );
  } catch (err) {
    console.warn('Supabase scenario progress upsert error:', err);
  }
}

