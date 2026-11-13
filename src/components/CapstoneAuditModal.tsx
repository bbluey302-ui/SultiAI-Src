import React, { useState } from 'react';
import { X, CheckCircle2, ShieldCheck, Database, Copy, Check, Terminal, FileCode, BookOpen, ExternalLink, Sparkles, Layers, Trophy, Target } from 'lucide-react';
import { CAPSTONE_CHECKLIST_DATA } from '../data/curriculumData';
import { CapstoneRequirement } from '../types';
import { MODULE_GAMIFICATION_MATRIX } from '../data/moduleGamificationMatrix';
import { TOOLKIT_MODULES } from '../data/toolkitModulesData';

interface CapstoneAuditModalProps {
  onClose: () => void;
}

const SUPABASE_MIGRATION_SQL = `-- ============================================================================
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

CREATE INDEX IF NOT EXISTS idx_profiles_target_dialect ON public.profiles(target_dialect);
CREATE INDEX IF NOT EXISTS idx_lesson_attempts_user_id ON public.lesson_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_lesson_attempts_lesson_id ON public.lesson_attempts(lesson_id);
CREATE INDEX IF NOT EXISTS idx_lesson_attempts_created_at ON public.lesson_attempts(created_at DESC);

-- ============================================================================
-- 2. Enable & Force Row Level Security (RLS)
-- ============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles FORCE ROW LEVEL SECURITY;

ALTER TABLE public.lesson_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_attempts FORCE ROW LEVEL SECURITY;

-- ============================================================================
-- 3. Idempotent Policy Cleanup
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

CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- ============================================================================
-- 5. Create Strict RLS Policies for 'lesson_attempts'
-- Enforces: Users can ONLY read, insert, and update their own learning records.
-- ============================================================================

CREATE POLICY "Users can view their own lesson attempts"
ON public.lesson_attempts
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own lesson attempts"
ON public.lesson_attempts
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

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
        id, email, full_name, avatar_url, target_dialect, xp, streak_days, level, daily_goal_minutes, today_minutes, vocabulary_mastered, speech_score_average, created_at, updated_at
    )
    VALUES (
        new.id, new.email,
        COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
        COALESCE(new.raw_user_meta_data->>'avatar_url', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=240&q=80'),
        COALESCE(new.raw_user_meta_data->>'target_dialect', 'davao_bisaya'),
        0, 1, 'Level 1: Beginner', 15, 0, 0, 0.0, now(), now()
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- 7. Timestamp Update Triggers
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
    FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();`;

export const CapstoneAuditModal: React.FC<CapstoneAuditModalProps> = ({ onClose }) => {
  const [modalTab, setModalTab] = useState<'checklist' | 'gamification' | 'supabase_rls' | 'ph_data'>('checklist');
  const [items, setItems] = useState<CapstoneRequirement[]>(CAPSTONE_CHECKLIST_DATA);
  const [selectedItem, setSelectedItem] = useState<CapstoneRequirement | null>(items[0]);
  const [copied, setCopied] = useState(false);

  const verifiedCount = items.filter((i) => i.status === 'verified').length;
  const progressPct = Math.round((verifiedCount / items.length) * 100);

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_MIGRATION_SQL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-sm flex items-center justify-center p-3">
      <div className="bg-stone-900 border border-stone-800 text-stone-100 rounded-3xl max-w-md w-full h-[90vh] flex flex-col justify-between shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-teal-400" />
            <div>
              <h2 className="font-display font-bold text-sm text-white">
                SultiAI Capstone Blueprint & Audit
              </h2>
              <p className="text-[11px] text-stone-400">
                BSIT Capstone Project · Jose Maria College Foundation, Inc.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-white p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="px-3 pt-2 pb-2 bg-stone-950 border-b border-stone-800 flex gap-1 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setModalTab('checklist')}
            className={`py-1.5 px-2.5 rounded-xl text-[10px] font-semibold transition-all shrink-0 ${
              modalTab === 'checklist'
                ? 'bg-stone-800 text-teal-300 border border-teal-500/40'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            Checklist (11)
          </button>
          <button
            onClick={() => setModalTab('gamification')}
            className={`py-1.5 px-2.5 rounded-xl text-[10px] font-semibold flex items-center justify-center gap-1 transition-all shrink-0 ${
              modalTab === 'gamification'
                ? 'bg-stone-800 text-teal-300 border border-teal-500/40'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Sparkles className="w-3 h-3 text-teal-400" />
            <span>13 Gamified Modules</span>
          </button>
          <button
            onClick={() => setModalTab('supabase_rls')}
            className={`py-1.5 px-2.5 rounded-xl text-[10px] font-semibold flex items-center justify-center gap-1 transition-all shrink-0 ${
              modalTab === 'supabase_rls'
                ? 'bg-stone-800 text-teal-300 border border-teal-500/40'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Database className="w-3 h-3 text-teal-400" />
            <span>Supabase</span>
          </button>
          <button
            onClick={() => setModalTab('ph_data')}
            className={`py-1.5 px-2.5 rounded-xl text-[10px] font-semibold flex items-center justify-center gap-1 transition-all shrink-0 ${
              modalTab === 'ph_data'
                ? 'bg-stone-800 text-teal-300 border border-teal-500/40'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <BookOpen className="w-3 h-3 text-teal-400" />
            <span>PH Data & AI</span>
          </button>
        </div>

        {/* TAB 1: CHECKLIST */}
        {modalTab === 'checklist' && (
          <>
            {/* Audit Status Bar */}
            <div className="p-3 bg-stone-950/70 border-b border-stone-800 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-stone-300">Defense Verification Status</span>
                <span className="font-mono font-bold text-teal-400">{verifiedCount} of {items.length} ({progressPct}%)</span>
              </div>
              <div className="w-full bg-stone-800 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-teal-400 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>

            {/* 11 Requirements Checklist Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
              {items.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setSelectedItem(item)}
                  className={`p-3 rounded-2xl border text-left cursor-pointer transition-all ${
                    selectedItem?.id === item.id
                      ? 'bg-stone-800/90 border-teal-500/80 shadow-md'
                      : 'bg-stone-950/40 border-stone-800 hover:border-stone-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5">
                      <div className="mt-0.5">
                        <CheckCircle2 className="w-4 h-4 text-teal-400 fill-teal-400/20" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white leading-snug">
                          {item.id}. {item.title}
                        </div>
                        <p className="text-[11px] text-stone-400 mt-1 leading-relaxed">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  </div>

                  {selectedItem?.id === item.id && (
                    <div className="mt-2.5 pt-2.5 border-t border-stone-700/60 text-[11px] space-y-1 text-teal-200/90 bg-teal-950/30 p-2.5 rounded-xl">
                      <div className="font-semibold text-teal-300">Audited Evidence:</div>
                      <div>{item.evidence}</div>
                      <div className="text-[10px] text-stone-400 font-mono pt-1">
                        Verified: {item.verifiedTimestamp}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {/* TAB: 13 GAMIFIED MODULES MATRIX */}
        {modalTab === 'gamification' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            <div className="p-3 bg-teal-950/40 border border-teal-800/60 rounded-2xl space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-xs text-teal-300">
                <Sparkles className="w-3.5 h-3.5 text-teal-400" />
                <span>13 Purpose-Driven Learning Modules & Gamification Matrix</span>
              </div>
              <p className="text-[10px] text-stone-300 leading-relaxed font-normal">
                Aligned with Capstone title: <em>"SultiAI: An AI-Powered Community Language and Communication Hub for Non-Native Speakers Using Whisper Speech Recognition and BERT-Based NLP"</em>. Each module couples its specific pedagogical purpose to a distinct gamification mechanic.
              </p>
            </div>

            <div className="space-y-2">
              {TOOLKIT_MODULES.map((mod) => {
                const spec = MODULE_GAMIFICATION_MATRIX[mod.id];
                return (
                  <div
                    key={mod.id}
                    className="p-3 bg-stone-950 rounded-2xl border border-stone-800 space-y-1.5 hover:border-teal-500/40 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{mod.icon}</span>
                        <div>
                          <div className="font-display font-bold text-xs text-white">
                            #{mod.num} · {mod.title}
                          </div>
                          <div className="text-[10px] text-teal-400 font-medium">
                            {mod.purpose}
                          </div>
                        </div>
                      </div>
                      <span className="text-[9px] font-mono bg-stone-900 text-stone-300 px-2 py-0.5 rounded border border-stone-800">
                        {mod.category} module
                      </span>
                    </div>

                    {spec && (
                      <div className="p-2 bg-stone-900/80 rounded-xl space-y-1 text-[10px] border border-stone-800/60">
                        <div className="flex items-start gap-1">
                          <span className="text-teal-400 font-bold shrink-0">🎯 Purpose:</span>
                          <span className="text-stone-300">{spec.primaryPurpose}</span>
                        </div>
                        <div className="flex items-start gap-1">
                          <span className="text-amber-400 font-bold shrink-0">🎮 Gameplay:</span>
                          <span className="text-stone-300 font-medium">{spec.gamificationMechanic}</span>
                        </div>
                        <div className="flex items-center justify-between pt-0.5 text-[9px] font-mono text-stone-400">
                          <span>Badge: {spec.badgeMilestone}</span>
                          <span className="text-teal-300 font-bold">{spec.mechanicLabel}</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: SUPABASE RLS MIGRATION */}
        {modalTab === 'supabase_rls' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Security Summary Cards */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-3 bg-stone-950 rounded-2xl border border-stone-800 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white">public.profiles</span>
                  <span className="text-[9px] bg-teal-500/20 text-teal-300 font-semibold px-1.5 py-0.5 rounded">RLS Active</span>
                </div>
                <div className="text-[10px] text-stone-400">
                  SELECT: <span className="font-mono text-teal-400">auth.uid() = id</span>
                </div>
                <div className="text-[10px] text-stone-400">
                  UPDATE: <span className="font-mono text-teal-400">auth.uid() = id</span>
                </div>
              </div>

              <div className="p-3 bg-stone-950 rounded-2xl border border-stone-800 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white">lesson_attempts</span>
                  <span className="text-[9px] bg-teal-500/20 text-teal-300 font-semibold px-1.5 py-0.5 rounded">RLS Active</span>
                </div>
                <div className="text-[10px] text-stone-400">
                  SELECT: <span className="font-mono text-teal-400">auth.uid() = user_id</span>
                </div>
                <div className="text-[10px] text-stone-400">
                  UPDATE: <span className="font-mono text-teal-400">auth.uid() = user_id</span>
                </div>
              </div>
            </div>

            {/* Migration File Header & Copy Button */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-1.5 text-xs text-stone-300">
                <FileCode className="w-4 h-4 text-teal-400" />
                <span className="font-mono text-[11px]">20260929000001_enforce_rls...sql</span>
              </div>
              <button
                onClick={handleCopySql}
                className="flex items-center gap-1 bg-stone-800 hover:bg-stone-700 text-teal-300 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all min-h-[36px]"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied SQL!' : 'Copy SQL'}</span>
              </button>
            </div>

            {/* SQL Code Viewer */}
            <div className="bg-stone-950 rounded-2xl p-3 border border-stone-800 text-[10px] font-mono text-stone-300 overflow-x-auto max-h-[320px] whitespace-pre leading-relaxed select-all">
              {SUPABASE_MIGRATION_SQL}
            </div>

            {/* Research Note */}
            <div className="p-2.5 bg-stone-950/80 rounded-xl border border-stone-800 text-[10px] text-stone-400 leading-normal">
              🔒 <span className="font-semibold text-stone-300">Security Rule Compliance:</span> Users can strictly read and modify only their own data rows. Automated signup triggers maintain zero orphaned records.
            </div>
          </div>
        )}

        {/* TAB 3: PHILIPPINE DATA & AI ARCHITECTURE */}
        {modalTab === 'ph_data' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
            {/* Header Banner */}
            <div className="p-3 bg-gradient-to-br from-teal-950/40 via-stone-950 to-stone-900 rounded-2xl border border-teal-500/30 space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-lg">🇵🇭</span>
                <span className="font-bold text-xs text-white">Philippine Linguistic & Cultural Grounding</span>
              </div>
              <p className="text-[11px] text-stone-300 leading-relaxed">
                SultiAI integrates authoritative Philippine language resources and cultural etiquette without requiring costly from-scratch foundation model pretraining.
              </p>
            </div>

            {/* Pillar 1: 3-Way Architectural Separation */}
            <div className="p-3 bg-stone-950 rounded-2xl border border-stone-800 space-y-2">
              <span className="text-xs font-bold text-teal-300 uppercase tracking-wider block">
                1. Three Core Architectural Pillars
              </span>
              <div className="space-y-2 text-[11px]">
                <div className="p-2 bg-stone-900/80 rounded-xl border border-stone-800/80">
                  <div className="font-semibold text-stone-200 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-teal-400" />
                    Language Data
                  </div>
                  <p className="text-stone-400 text-[10px] mt-0.5">
                    Words, grammatical focus markers (<span className="text-teal-300 font-mono">ang, sa, ug</span>), aspect inflections (<span className="text-teal-300 font-mono">nag-, mi-, gi-</span>), phonetic syllabification, and spoken phrases.
                  </p>
                </div>
                <div className="p-2 bg-stone-900/80 rounded-xl border border-stone-800/80">
                  <div className="font-semibold text-stone-200 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    Cultural & Historical Context
                  </div>
                  <p className="text-stone-400 text-[10px] mt-0.5">
                    Visayan customs: politeness via vocal inflection and <span className="text-amber-300 font-mono">"palihog"</span> (never "po/opo"), Davao particle blending (<span className="text-amber-300 font-mono">gud, bitaw, man</span>), tabo markets, jeepney code.
                  </p>
                </div>
                <div className="p-2 bg-stone-900/80 rounded-xl border border-stone-800/80">
                  <div className="font-semibold text-stone-200 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-sky-400" />
                    AI Capabilities Tier
                  </div>
                  <p className="text-stone-400 text-[10px] mt-0.5">
                    Gemini 3.8 Flash multi-turn reasoning, mBERT intent classification (8 intents), Whisper speech ASR + Word Error Rate (WER) scoring.
                  </p>
                </div>
              </div>
            </div>

            {/* Pillar 2: Authoritative Philippine Sources */}
            <div className="p-3 bg-stone-950 rounded-2xl border border-stone-800 space-y-2">
              <span className="text-xs font-bold text-teal-300 uppercase tracking-wider block">
                2. Authoritative Philippine Sources
              </span>
              <div className="space-y-2 text-[11px]">
                <div className="p-2.5 bg-stone-900/80 rounded-xl border border-stone-800 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white">Komisyon sa Wikang Filipino (KWF)</span>
                    <span className="text-[9px] bg-teal-500/20 text-teal-300 px-1.5 py-0.5 rounded font-mono">Tagalog / Filipino</span>
                  </div>
                  <p className="text-stone-400 text-[10px]">
                    <strong>KWF Diksiyonaryo</strong> (kwfdiksiyonaryo.ph) & <strong>Repositoryo ng mga Wika ng Pilipinas</strong> (kwfwikaatkultura.ph) for official spelling, grammatical structures, and national language inventory (130–195 living languages).
                  </p>
                </div>

                <div className="p-2.5 bg-stone-900/80 rounded-xl border border-stone-800 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white">Akademyang Bisaya</span>
                    <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-mono">Cebuano / Bisaya</span>
                  </div>
                  <p className="text-stone-400 text-[10px]">
                    <strong>English–Visayan Cebuano Dictionary</strong> for standard Visayan vocabulary, avoiding accidental Tagalog cross-contamination or invalid synthetic loanwords.
                  </p>
                </div>
              </div>
            </div>

            {/* Pillar 3: AI Implementation Strategy */}
            <div className="p-3 bg-stone-950 rounded-2xl border border-stone-800 space-y-2">
              <span className="text-xs font-bold text-teal-300 uppercase tracking-wider block">
                3. Three-Tier AI Strategy (Capstone Defense)
              </span>
              <div className="grid grid-cols-1 gap-2 text-[10px]">
                <div className="p-2 bg-stone-900/90 rounded-xl border border-emerald-500/30">
                  <div className="flex items-center justify-between font-semibold text-emerald-300">
                    <span>Tier 1: Curated Scaffolding & System Prompts</span>
                    <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1 py-0.5 rounded">Active in App</span>
                  </div>
                  <p className="text-stone-400 mt-1">
                    Carefully authored 13 learning modules, verified phonetics, and structured system instructions ensuring high linguistic fidelity with 0 model pretraining cost.
                  </p>
                </div>

                <div className="p-2 bg-stone-900/90 rounded-xl border border-sky-500/30">
                  <div className="flex items-center justify-between font-semibold text-sky-300">
                    <span>Tier 2: Knowledge Base & RAG Grounding</span>
                    <span className="text-[9px] bg-sky-500/20 text-sky-300 px-1 py-0.5 rounded">Active in App</span>
                  </div>
                  <p className="text-stone-400 mt-1">
                    Google Maps Grounding (Davao locations) + Google Search Grounding for current cultural events + mBERT intent routing.
                  </p>
                </div>

                <div className="p-2 bg-stone-900/90 rounded-xl border border-purple-500/30">
                  <div className="flex items-center justify-between font-semibold text-purple-300">
                    <span>Tier 3: Fine-Tuning & Speech Corpus</span>
                    <span className="text-[9px] bg-purple-500/20 text-purple-300 px-1 py-0.5 rounded">Future Roadmap</span>
                  </div>
                  <p className="text-stone-400 mt-1">
                    Collection of verified Visayan native speaker audio samples to fine-tune acoustic phoneme models for localized accents (Davao, Cebu, Bohol).
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-3 border-t border-stone-800 bg-stone-950 flex items-center justify-between text-xs">
          <span className="text-stone-400 text-[11px]">
            Lead Researcher: Genesis Diaz
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-stone-950 font-bold rounded-xl text-xs transition-colors"
          >
            Close Audit
          </button>
        </div>
      </div>
    </div>
  );
};

