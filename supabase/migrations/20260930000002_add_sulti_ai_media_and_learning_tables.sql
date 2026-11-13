-- ============================================================================
-- SultiAI Capstone Project: Supabase Migration Script 2
-- Objective: Add Tables for AI-Generated Media, Conversations, Live Voice & RLS
-- Target Database: Supabase / PostgreSQL (Single Source of Truth)
-- Institution: Jose Maria College Foundation, Inc. (JMCFI) - BSIT Capstone
-- Author: Genesis Diaz
-- Date: September 30, 2026
-- ============================================================================

-- ============================================================================
-- 1. Table: public.generated_media
-- Stores AI-generated learning images, animated videos, and cultural music clips
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.generated_media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video', 'music')),
    title TEXT NOT NULL,
    prompt TEXT NOT NULL,
    target_dialect TEXT DEFAULT 'davao_bisaya',
    storage_path TEXT,
    media_url TEXT NOT NULL,
    status TEXT DEFAULT 'completed' CHECK (status IN ('queued', 'processing', 'completed', 'failed')),
    aspect_ratio TEXT DEFAULT '1:1',
    duration_seconds INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_generated_media_user_id ON public.generated_media(user_id);
CREATE INDEX IF NOT EXISTS idx_generated_media_media_type ON public.generated_media(media_type);
CREATE INDEX IF NOT EXISTS idx_generated_media_created_at ON public.generated_media(created_at DESC);

-- Enable & Force RLS
ALTER TABLE public.generated_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generated_media FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own generated media" ON public.generated_media;
DROP POLICY IF EXISTS "Users can insert their own generated media" ON public.generated_media;
DROP POLICY IF EXISTS "Users can update their own generated media" ON public.generated_media;
DROP POLICY IF EXISTS "Users can delete their own generated media" ON public.generated_media;

CREATE POLICY "Users can view their own generated media"
ON public.generated_media FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own generated media"
ON public.generated_media FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own generated media"
ON public.generated_media FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own generated media"
ON public.generated_media FOR DELETE TO authenticated
USING (auth.uid() = user_id);

-- ============================================================================
-- 2. Table: public.conversations & public.conversation_messages
-- Stores Sulti AI conversational turns, scenarios, and BERT NLP intent tags
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    scenario_title TEXT DEFAULT 'General Bisaya Conversation',
    target_dialect TEXT DEFAULT 'davao_bisaya',
    total_turns INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.conversation_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    sender TEXT NOT NULL CHECK (sender IN ('user', 'sulti')),
    message_text TEXT NOT NULL,
    translation TEXT,
    phonetic_guide TEXT,
    bert_intent TEXT,
    bert_confidence NUMERIC(5,2),
    detected_sentiment TEXT,
    cultural_tip TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON public.conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_messages_convo_id ON public.conversation_messages(conversation_id);

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations FORCE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_messages FORCE ROW LEVEL SECURITY;

DO $_sguard_$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'conversations' AND column_name = 'user_id' AND data_type = 'uuid'
  ) THEN
    EXECUTE $_spol$CREATE POLICY "Users can view their own conversations"
ON public.conversations FOR SELECT TO authenticated
USING (auth.uid() = user_id)$_spol$;
  END IF;
END
$_sguard_$;

DO $_sguard_$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'conversations' AND column_name = 'user_id' AND data_type = 'uuid'
  ) THEN
    EXECUTE $_spol$CREATE POLICY "Users can insert their own conversations"
ON public.conversations FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id)$_spol$;
  END IF;
END
$_sguard_$;

DO $_sguard_$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'conversation_messages' AND column_name = 'user_id' AND data_type = 'uuid'
  ) THEN
    EXECUTE $_spol$CREATE POLICY "Users can view their conversation messages"
ON public.conversation_messages FOR SELECT TO authenticated
USING (auth.uid() = user_id)$_spol$;
  END IF;
END
$_sguard_$;

DO $_sguard_$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'conversation_messages' AND column_name = 'user_id' AND data_type = 'uuid'
  ) THEN
    EXECUTE $_spol$CREATE POLICY "Users can insert their conversation messages"
ON public.conversation_messages FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id)$_spol$;
  END IF;
END
$_sguard_$;

-- ============================================================================
-- 3. Table: public.voice_sessions
-- Stores live voice & Gemini Live real-time interaction metrics and WER
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.voice_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    duration_seconds INTEGER DEFAULT 0,
    words_spoken INTEGER DEFAULT 0,
    average_whisper_wer NUMERIC(5,2) DEFAULT 0.0,
    target_dialect TEXT DEFAULT 'davao_bisaya',
    transcription_engine TEXT DEFAULT 'whisper_v3',
    session_metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.voice_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voice_sessions FORCE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own voice sessions"
ON public.voice_sessions FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own voice sessions"
ON public.voice_sessions FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- 4. Supabase Storage Buckets Setup Guidance
-- ============================================================================
-- In Supabase dashboard or via API:
-- INSERT INTO storage.buckets (id, name, public) VALUES ('learning-images', 'learning-images', false);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('learning-videos', 'learning-videos', false);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('learning-music', 'learning-music', false);
