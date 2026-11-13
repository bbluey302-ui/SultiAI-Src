-- ============================================================================
-- SultiAI Capstone Project: Supabase Migration Script 3
-- Objective: Add Tables for The Speaking City Voice Missions & Attempts with RLS
-- Target Database: Supabase / PostgreSQL
-- Institution: Jose Maria College Foundation, Inc. (JMCFI) - BSIT Capstone
-- Author: Genesis Diaz
-- Date: October 11, 2026
-- ============================================================================

-- Table 1: public.speaking_mission_progress
-- Stores user's language-separated progress across Speaking City destinations
CREATE TABLE IF NOT EXISTS public.speaking_mission_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    language TEXT NOT NULL CHECK (language IN ('cebuano', 'filipino', 'english')),
    completed_missions TEXT[] DEFAULT '{}',
    unlocked_destinations TEXT[] DEFAULT '{"cafe_restaurant", "transport_terminal"}',
    total_speaking_xp INTEGER DEFAULT 0 CHECK (total_speaking_xp >= 0),
    total_missions_completed INTEGER DEFAULT 0 CHECK (total_missions_completed >= 0),
    highest_score INTEGER DEFAULT 0 CHECK (highest_score >= 0 AND highest_score <= 100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_user_language_progress UNIQUE (user_id, language)
);

CREATE INDEX IF NOT EXISTS idx_speaking_mission_progress_user ON public.speaking_mission_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_speaking_mission_progress_lang ON public.speaking_mission_progress(language);

-- Table 2: public.speaking_mission_attempts
-- Stores every actual audio submission and AI evaluation for auditing & review
CREATE TABLE IF NOT EXISTS public.speaking_mission_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    mission_id TEXT NOT NULL,
    destination_id TEXT NOT NULL,
    language TEXT NOT NULL CHECK (language IN ('cebuano', 'filipino', 'english')),
    user_transcript TEXT NOT NULL,
    audio_url TEXT,
    overall_score INTEGER NOT NULL CHECK (overall_score >= 0 AND overall_score <= 100),
    scores JSONB DEFAULT '{}'::jsonb, -- { taskCompletion, vocabulary, languageUse, communication }
    passed BOOLEAN NOT NULL DEFAULT false,
    feedback JSONB DEFAULT '{}'::jsonb, -- { summary, improvementTip, suggestedBetterResponse }
    xp_earned INTEGER DEFAULT 0 CHECK (xp_earned >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_speaking_mission_attempts_user ON public.speaking_mission_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_speaking_mission_attempts_mission ON public.speaking_mission_attempts(mission_id);
CREATE INDEX IF NOT EXISTS idx_speaking_mission_attempts_created ON public.speaking_mission_attempts(created_at DESC);

-- Enable & Force Row Level Security (RLS)
ALTER TABLE public.speaking_mission_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.speaking_mission_progress FORCE ROW LEVEL SECURITY;

ALTER TABLE public.speaking_mission_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.speaking_mission_attempts FORCE ROW LEVEL SECURITY;

-- Idempotent RLS Policies for speaking_mission_progress
DROP POLICY IF EXISTS "Users can view their own speaking progress" ON public.speaking_mission_progress;
DROP POLICY IF EXISTS "Users can insert their own speaking progress" ON public.speaking_mission_progress;
DROP POLICY IF EXISTS "Users can update their own speaking progress" ON public.speaking_mission_progress;

CREATE POLICY "Users can view their own speaking progress"
ON public.speaking_mission_progress FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own speaking progress"
ON public.speaking_mission_progress FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own speaking progress"
ON public.speaking_mission_progress FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Idempotent RLS Policies for speaking_mission_attempts
DROP POLICY IF EXISTS "Users can view their own speaking attempts" ON public.speaking_mission_attempts;
DROP POLICY IF EXISTS "Users can insert their own speaking attempts" ON public.speaking_mission_attempts;

CREATE POLICY "Users can view their own speaking attempts"
ON public.speaking_mission_attempts FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own speaking attempts"
ON public.speaking_mission_attempts FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);
