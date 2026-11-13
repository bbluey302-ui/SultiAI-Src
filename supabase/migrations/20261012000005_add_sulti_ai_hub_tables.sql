-- ============================================================================
-- SultiAI Capstone Project: Supabase Migration Script 5
-- Objective: Add SultiAI Chat & Voice Hub Tables, Usage Quotas, and Strict RLS
-- Target Database: Supabase / PostgreSQL
-- Institution: Jose Maria College Foundation, Inc. (JMCFI) - BSIT Capstone
-- Author: Genesis Diaz
-- Date: October 12, 2026
-- ============================================================================

-- 1. Table: public.ai_conversations
-- Persistent conversation workspaces per scenario/coach
CREATE TABLE IF NOT EXISTS public.ai_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    scenario_id TEXT,
    agent_id TEXT NOT NULL DEFAULT 'jen',
    target_language TEXT NOT NULL DEFAULT 'cebuano',
    supporting_language TEXT DEFAULT 'english',
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
    message_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ai_conversations_user_id ON public.ai_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_agent_id ON public.ai_conversations(agent_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_updated_at ON public.ai_conversations(updated_at DESC);

ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_conversations FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own ai_conversations" ON public.ai_conversations;
DROP POLICY IF EXISTS "Users can insert their own ai_conversations" ON public.ai_conversations;
DROP POLICY IF EXISTS "Users can update their own ai_conversations" ON public.ai_conversations;
DROP POLICY IF EXISTS "Users can delete their own ai_conversations" ON public.ai_conversations;

CREATE POLICY "Users can view their own ai_conversations"
ON public.ai_conversations FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own ai_conversations"
ON public.ai_conversations FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ai_conversations"
ON public.ai_conversations FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own ai_conversations"
ON public.ai_conversations FOR DELETE TO authenticated
USING (auth.uid() = user_id);


-- 2. Table: public.ai_messages
-- Messages stored inside each persistent conversation workspace
CREATE TABLE IF NOT EXISTS public.ai_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.ai_conversations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    translation TEXT,
    phonetic_guide TEXT,
    structured_content JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ai_messages_convo_id ON public.ai_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_ai_messages_user_id ON public.ai_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_messages_created_at ON public.ai_messages(created_at ASC);

ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_messages FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own ai_messages" ON public.ai_messages;
DROP POLICY IF EXISTS "Users can insert their own ai_messages" ON public.ai_messages;
DROP POLICY IF EXISTS "Users can delete their own ai_messages" ON public.ai_messages;

CREATE POLICY "Users can view their own ai_messages"
ON public.ai_messages FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own ai_messages"
ON public.ai_messages FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own ai_messages"
ON public.ai_messages FOR DELETE TO authenticated
USING (auth.uid() = user_id);


-- 3. Table: public.ai_voice_sessions
-- Live speaking practice sessions with 2-minute limits and evaluation
CREATE TABLE IF NOT EXISTS public.ai_voice_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    agent_id TEXT NOT NULL DEFAULT 'jen',
    target_language TEXT NOT NULL DEFAULT 'cebuano',
    scenario_title TEXT,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    ended_at TIMESTAMP WITH TIME ZONE,
    duration_seconds INTEGER DEFAULT 0 CHECK (duration_seconds >= 0),
    max_allowed_seconds INTEGER DEFAULT 120,
    transcript_reference TEXT,
    speech_score_average NUMERIC(5,2) DEFAULT 0.0,
    session_status TEXT NOT NULL DEFAULT 'completed' CHECK (session_status IN ('active', 'completed', 'timeout', 'interrupted')),
    feedback_summary TEXT,
    session_metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ai_voice_sessions_user_id ON public.ai_voice_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_voice_sessions_created_at ON public.ai_voice_sessions(created_at DESC);

ALTER TABLE public.ai_voice_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_voice_sessions FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own ai_voice_sessions" ON public.ai_voice_sessions;
DROP POLICY IF EXISTS "Users can insert their own ai_voice_sessions" ON public.ai_voice_sessions;
DROP POLICY IF EXISTS "Users can update their own ai_voice_sessions" ON public.ai_voice_sessions;

CREATE POLICY "Users can view their own ai_voice_sessions"
ON public.ai_voice_sessions FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own ai_voice_sessions"
ON public.ai_voice_sessions FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ai_voice_sessions"
ON public.ai_voice_sessions FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);


-- 4. Table: public.ai_usage
-- Real-time usage metering for free sessions and entitlements
CREATE TABLE IF NOT EXISTS public.ai_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    usage_type TEXT NOT NULL CHECK (usage_type IN ('voice_minutes', 'chat_turn', 'media_generation')),
    duration_or_units INTEGER NOT NULL DEFAULT 1,
    billing_period TEXT NOT NULL DEFAULT to_char(now(), 'YYYY-MM'),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_user_period ON public.ai_usage(user_id, billing_period);

ALTER TABLE public.ai_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_usage FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own ai_usage" ON public.ai_usage;
DROP POLICY IF EXISTS "Users can insert their own ai_usage" ON public.ai_usage;

CREATE POLICY "Users can view their own ai_usage"
ON public.ai_usage FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own ai_usage"
ON public.ai_usage FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);
