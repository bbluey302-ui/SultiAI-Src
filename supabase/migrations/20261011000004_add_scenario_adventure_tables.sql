-- ============================================================================
-- SultiAI Capstone Project: Supabase Migration Script 4
-- Objective: Add Tables for Scenario Practice — Interactive Story Adventure with RLS
-- Target Database: Supabase / PostgreSQL
-- Institution: Jose Maria College Foundation, Inc. (JMCFI) - BSIT Capstone
-- Author: Genesis Diaz
-- Date: October 11, 2026
-- ============================================================================

-- Table 1: public.scenario_progress
-- Stores user's language-separated narrative progression, unlocked chapters, and XP
CREATE TABLE IF NOT EXISTS public.scenario_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    language TEXT NOT NULL CHECK (language IN ('cebuano', 'filipino', 'english')),
    completed_scenarios TEXT[] DEFAULT '{}',
    current_scenario_id TEXT,
    unlocked_categories TEXT[] DEFAULT '{"everyday", "food_shopping"}',
    total_scenario_xp INTEGER DEFAULT 0 CHECK (total_scenario_xp >= 0),
    total_scenarios_completed INTEGER DEFAULT 0 CHECK (total_scenarios_completed >= 0),
    highest_score INTEGER DEFAULT 0 CHECK (highest_score >= 0 AND highest_score <= 100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_user_language_scenario_progress UNIQUE (user_id, language)
);

CREATE INDEX IF NOT EXISTS idx_scenario_progress_user ON public.scenario_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_scenario_progress_lang ON public.scenario_progress(language);

-- Table 2: public.scenario_attempts
-- Stores individual story run-throughs, chosen paths, spoken responses, and rubric evaluations
CREATE TABLE IF NOT EXISTS public.scenario_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    scenario_id TEXT NOT NULL,
    category TEXT NOT NULL,
    language TEXT NOT NULL CHECK (language IN ('cebuano', 'filipino', 'english')),
    ending_id TEXT NOT NULL,
    completed_objectives TEXT[] DEFAULT '{}',
    overall_score INTEGER NOT NULL CHECK (overall_score >= 0 AND overall_score <= 100),
    speech_transcript TEXT,
    evaluation_feedback JSONB DEFAULT '{}'::jsonb,
    passed BOOLEAN NOT NULL DEFAULT false,
    xp_earned INTEGER DEFAULT 0 CHECK (xp_earned >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_scenario_attempts_user ON public.scenario_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_scenario_attempts_scenario ON public.scenario_attempts(scenario_id);
CREATE INDEX IF NOT EXISTS idx_scenario_attempts_created ON public.scenario_attempts(created_at DESC);

-- Enable & Force Row Level Security (RLS)
ALTER TABLE public.scenario_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scenario_progress FORCE ROW LEVEL SECURITY;

ALTER TABLE public.scenario_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scenario_attempts FORCE ROW LEVEL SECURITY;

-- Idempotent RLS Policies for scenario_progress
DROP POLICY IF EXISTS "Users can view their own scenario progress" ON public.scenario_progress;
DROP POLICY IF EXISTS "Users can insert their own scenario progress" ON public.scenario_progress;
DROP POLICY IF EXISTS "Users can update their own scenario progress" ON public.scenario_progress;

CREATE POLICY "Users can view their own scenario progress"
ON public.scenario_progress FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own scenario progress"
ON public.scenario_progress FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own scenario progress"
ON public.scenario_progress FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Idempotent RLS Policies for scenario_attempts
DROP POLICY IF EXISTS "Users can view their own scenario attempts" ON public.scenario_attempts;
DROP POLICY IF EXISTS "Users can insert their own scenario attempts" ON public.scenario_attempts;

CREATE POLICY "Users can view their own scenario attempts"
ON public.scenario_attempts FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own scenario attempts"
ON public.scenario_attempts FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);
