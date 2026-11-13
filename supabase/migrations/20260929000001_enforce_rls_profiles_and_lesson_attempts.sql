-- ============================================================================
-- SultiAI Capstone Project: Supabase Migration Script
-- Objective: Enforce Row Level Security (RLS) on 'profiles' and 'lesson_attempts'
-- Target Database: Supabase / PostgreSQL
-- Institution: Jose Maria College Foundation, Inc. (JMCFI) - BSIT Capstone
-- Author: Genesis Diaz
-- Date: September 2026
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. Table Definitions (Guaranteed existence & constraints)
-- ============================================================================

-- Table: public.profiles
-- Stores persistent learner profile, target dialect, streaks, and progress records
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    full_name TEXT,
    avatar_url TEXT,
    target_dialect TEXT DEFAULT 'davao_bisaya' CHECK (target_dialect IN ('davao_bisaya', 'cebuano_standard', 'boholano')),
    xp INTEGER DEFAULT 0 CHECK (xp >= 0),
    streak_days INTEGER DEFAULT 0 CHECK (streak_days >= 0),
    level TEXT DEFAULT 'Level 1: Beginner',
    daily_goal_minutes INTEGER DEFAULT 15 CHECK (daily_goal_minutes > 0),
    today_minutes INTEGER DEFAULT 0 CHECK (today_minutes >= 0),
    vocabulary_mastered INTEGER DEFAULT 0 CHECK (vocabulary_mastered >= 0),
    speech_score_average NUMERIC(5,2) DEFAULT 0.0 CHECK (speech_score_average >= 0.0 AND speech_score_average <= 100.0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table: public.lesson_attempts
-- Stores every individual lesson activity attempt, Whisper WER benchmark, and score
CREATE TABLE IF NOT EXISTS public.lesson_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    lesson_id TEXT NOT NULL,
    module_id TEXT NOT NULL,
    score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
    accuracy_score NUMERIC(5,2) NOT NULL DEFAULT 0.0 CHECK (accuracy_score >= 0.0 AND accuracy_score <= 100.0),
    whisper_wer NUMERIC(5,2) DEFAULT 0.0 CHECK (whisper_wer >= 0.0),
    completed BOOLEAN DEFAULT true NOT NULL,
    xp_earned INTEGER DEFAULT 0 CHECK (xp_earned >= 0),
    attempt_metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indices for rapid querying by user_id & lesson_id
CREATE INDEX IF NOT EXISTS idx_profiles_target_dialect ON public.profiles(target_dialect);
CREATE INDEX IF NOT EXISTS idx_lesson_attempts_user_id ON public.lesson_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_lesson_attempts_lesson_id ON public.lesson_attempts(lesson_id);
CREATE INDEX IF NOT EXISTS idx_lesson_attempts_created_at ON public.lesson_attempts(created_at DESC);

-- ============================================================================
-- 2. Enable & Force Row Level Security (RLS)
-- ============================================================================

-- Enable RLS on 'profiles' table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles FORCE ROW LEVEL SECURITY;

-- Enable RLS on 'lesson_attempts' table
ALTER TABLE public.lesson_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_attempts FORCE ROW LEVEL SECURITY;

-- ============================================================================
-- 3. Idempotent Policy Cleanup (Drop existing policies if any)
-- ============================================================================

DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can delete their own profile" ON public.profiles;

DROP POLICY IF EXISTS "Users can view their own lesson attempts" ON public.lesson_attempts;
DROP POLICY IF EXISTS "Users can insert their own lesson attempts" ON public.lesson_attempts;
DROP POLICY IF EXISTS "Users can update their own lesson attempts" ON public.lesson_attempts;
DROP POLICY IF EXISTS "Users can delete their own lesson attempts" ON public.lesson_attempts;

-- ============================================================================
-- 4. Create Strict RLS Policies for 'profiles'
-- Enforces: Users can ONLY read and update their own profile data.
-- ============================================================================

-- Policy 1: SELECT (Read own profile only)
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Policy 2: INSERT (Users can only insert a profile matching their auth.uid())
CREATE POLICY "Users can insert their own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Policy 3: UPDATE (Users can only update their own profile row)
CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Note: DELETE is restricted to cascade on auth.users deletion or administrative role.

-- ============================================================================
-- 5. Create Strict RLS Policies for 'lesson_attempts'
-- Enforces: Users can ONLY read, insert, and update their own learning records.
-- ============================================================================

-- Policy 1: SELECT (Read own lesson attempts only)
CREATE POLICY "Users can view their own lesson attempts"
ON public.lesson_attempts
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Policy 2: INSERT (Insert attempts only for their own user_id)
CREATE POLICY "Users can insert their own lesson attempts"
ON public.lesson_attempts
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Policy 3: UPDATE (Users can only update their own attempt records)
CREATE POLICY "Users can update their own lesson attempts"
ON public.lesson_attempts
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- 6. Automated Profile Creation Trigger on Supabase Auth Signup
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.profiles (
        id,
        email,
        full_name,
        avatar_url,
        target_dialect,
        xp,
        streak_days,
        level,
        daily_goal_minutes,
        today_minutes,
        vocabulary_mastered,
        speech_score_average,
        created_at,
        updated_at
    )
    VALUES (
        new.id,
        new.email,
        COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
        COALESCE(new.raw_user_meta_data->>'avatar_url', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=240&q=80'),
        COALESCE(new.raw_user_meta_data->>'target_dialect', 'davao_bisaya'),
        0,
        1,
        'Level 1: Beginner',
        15,
        0,
        0,
        0.0,
        now(),
        now()
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger execution on auth.users table
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- 7. Timestamp Update Triggers (Maintains accurate updated_at)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.set_current_timestamp_updated_at()
RETURNS trigger AS $$
BEGIN
    new.updated_at = timezone('utc'::text, now());
    RETURN new;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();

DROP TRIGGER IF EXISTS set_lesson_attempts_updated_at ON public.lesson_attempts;
CREATE TRIGGER set_lesson_attempts_updated_at
    BEFORE UPDATE ON public.lesson_attempts
    FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();

-- ============================================================================
-- 8. Verification Queries (For Capstone Defense Panel & Automated Tests)
-- ============================================================================

-- Query to verify RLS is ACTIVE on both tables:
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('profiles', 'lesson_attempts');

-- Query to verify active policies:
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
-- FROM pg_policies 
-- WHERE tablename IN ('profiles', 'lesson_attempts');
