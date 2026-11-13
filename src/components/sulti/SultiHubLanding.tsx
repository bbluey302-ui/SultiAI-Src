import React, { useEffect, useMemo, useState } from 'react';
import { AiConversation, AiVoiceSession, MajorAiLanguage } from '../../types/aiHub';
import { LearningLanguageSelector } from '../shared/LearningLanguageSelector';
import { CHAT_SCENARIOS } from '../../data/chatScenariosData';
import { AI_COACHES } from '../../data/aiCoachesData';
import { SultiGreetingHeader } from './SultiGreetingHeader';
import { AgentModeSwitch, AgentMode } from './AgentModeSwitch';
import { AgentHeroCard } from './AgentHeroCard';
import { ContinueLearningCard } from './ContinueLearningCard';

interface SultiHubLandingProps {
  userName?: string;
  targetLanguage: MajorAiLanguage;
  onSelectLanguage?: (lang: MajorAiLanguage) => void;
  onNavigateToChat: () => void;
  onNavigateToVoice: () => void;
  onOpenConversation: (convoId: string) => void;
  onReviewVoiceSession?: (session: AiVoiceSession) => void;
  recentConversations: AiConversation[];
  recentVoiceSessions: AiVoiceSession[];
  onOpenProfile?: () => void;
  /** AI token wallet state + handler for the header chip */
  tokenBalance?: number | null;
  tokenPlan?: string;
  tokenLoading?: boolean;
  onOpenTokenStore?: () => void;
}

const LANGUAGE_LABELS: Record<MajorAiLanguage, string> = {
  cebuano: 'Bisaya',
  filipino: 'Filipino',
  english: 'English',
};

export const SultiHubLanding: React.FC<SultiHubLandingProps> = ({
  userName = 'Learner',
  targetLanguage,
  onSelectLanguage,
  onNavigateToChat,
  onNavigateToVoice,
  onOpenConversation,
  onReviewVoiceSession,
  recentConversations,
  recentVoiceSessions,
  tokenBalance,
  tokenPlan,
  tokenLoading,
  onOpenTokenStore,
}) => {
  const [mode, setMode] = useState<AgentMode>('chat');
  const [chatScenarioId, setChatScenarioId] = useState(CHAT_SCENARIOS[0]?.id ?? '');
  const [voiceScenarioId, setVoiceScenarioId] = useState<string>(AI_COACHES[0]?.id ?? '');

  // Scenarios available for the active learning language
  const chatScenarios = useMemo(
    () =>
      CHAT_SCENARIOS.filter(
        (s) => s.supportedLanguages.includes(targetLanguage) || s.supportedLanguages.length === 0
      ).slice(0, 5),
    [targetLanguage]
  );

  // Voice "scenarios" are the specialized AI coach personas
  const voiceScenarios = useMemo(
    () =>
      AI_COACHES.filter((c) => c.supportedLanguages.includes(targetLanguage)).slice(0, 5),
    [targetLanguage]
  );

  const heroChatScenarios = chatScenarios.map((s) => ({
    id: s.id,
    label: s.title,
    emoji:
      s.category === 'everyday_life'
        ? '☕'
        : s.category === 'work_career'
          ? '💼'
          : s.category === 'travel_transport'
            ? '🚌'
            : s.category === 'social_conversations'
              ? '👋'
              : '📚',
  }));

  const heroVoiceScenarios = voiceScenarios.map((c) => ({
    id: c.id,
    label: c.name,
    emoji: c.flag,
  }));

  // Keep the highlighted scenario valid when the learning language changes.
  useEffect(() => {
    if (chatScenarios.length > 0 && !chatScenarios.some((s) => s.id === chatScenarioId)) {
      setChatScenarioId(chatScenarios[0].id);
    }
  }, [chatScenarios, chatScenarioId]);

  useEffect(() => {
    if (voiceScenarios.length > 0 && !voiceScenarios.some((c) => c.id === voiceScenarioId)) {
      setVoiceScenarioId(voiceScenarios[0].id);
    }
  }, [voiceScenarios, voiceScenarioId]);

  // Live preview coach for the hero card. Voice mode mirrors the selected coach;
  // chat mode uses the language's default coach.
  const previewCoach = useMemo(() => {
    if (mode === 'voice') {
      const selected =
        voiceScenarios.find((c) => c.id === voiceScenarioId) ?? voiceScenarios[0];
      if (selected) {
        return {
          name: selected.name.replace('Sulti AI ', ''),
          avatar: selected.avatar,
          greeting: selected.greetingMessage.text,
        };
      }
    }

    const preferredId =
      targetLanguage === 'filipino' ? 'mika' : targetLanguage === 'english' ? 'adam' : 'jen';
    const coach =
      AI_COACHES.find((c) => c.id === preferredId && c.supportedLanguages.includes(targetLanguage)) ??
      AI_COACHES.find((c) => c.supportedLanguages.includes(targetLanguage)) ??
      AI_COACHES[0];
    return {
      name: coach.name.replace('Sulti AI ', ''),
      avatar: coach.avatar,
      greeting: coach.greetingMessage.text,
    };
  }, [mode, targetLanguage, voiceScenarioId, voiceScenarios]);

  // Real dashboard stats for the header band
  const headerStats = useMemo(
    () => [
      { id: 'chats', emoji: '💬', value: recentConversations.length, label: 'Chats' },
      { id: 'voice', emoji: '🎙️', value: recentVoiceSessions.length, label: 'Voice' },
      {
        id: 'lang',
        emoji: '🇵🇭',
        value: LANGUAGE_LABELS[targetLanguage],
        label: 'Journey',
      },
    ],
    [recentConversations.length, recentVoiceSessions.length, targetLanguage]
  );

  const handleStartPractice = () => {
    if (mode === 'chat') {
      onNavigateToChat();
    } else {
      onNavigateToVoice();
    }
  };

  return (
    <div className="space-y-4 pb-12 select-none dash-enter">
      {/* ============================================================ */}
      {/* 1. SEAMLESS GREETING HEADER (no card chrome)                 */}
      {/* ============================================================ */}
      <SultiGreetingHeader
        userName={userName}
        tagline={
          mode === 'chat'
            ? `Chat mode ready — practice real ${LANGUAGE_LABELS[targetLanguage]} conversations`
            : `Voice mode ready — speak ${LANGUAGE_LABELS[targetLanguage]} out loud with instant feedback`
        }
        stats={headerStats}
        tokenBalance={tokenBalance}
        tokenPlan={tokenPlan}
        tokenLoading={tokenLoading}
        onOpenTokenStore={onOpenTokenStore}
      />

      {/* ============================================================ */}
      {/* 2. LEARNING LANGUAGE SELECTOR                                 */}
      {/* ============================================================ */}
      {onSelectLanguage && (
        <LearningLanguageSelector
          value={targetLanguage}
          onChange={onSelectLanguage}
          className="-mt-1"
        />
      )}

      {/* ============================================================ */}
      {/* 3. AGENT MODE SWITCHER + CONVERSATIONAL HERO CARD              */}
      {/* ============================================================ */}
      <div className="space-y-2.5">
        <AgentModeSwitch value={mode} onChange={setMode} />

        <AgentHeroCard
          mode={mode}
          scenarios={mode === 'chat' ? heroChatScenarios : heroVoiceScenarios}
          selectedScenarioId={mode === 'chat' ? chatScenarioId : voiceScenarioId}
          onSelectScenario={(id) =>
            mode === 'chat' ? setChatScenarioId(id) : setVoiceScenarioId(id)
          }
          onStartPractice={handleStartPractice}
          previewCoach={previewCoach}
        />

        {/* Contextual hint under the card */}
        <p className="text-center text-[10.5px] font-medium text-muted px-2 min-h-[16px] leading-snug">
          {mode === 'chat' ? (
            <>
              Practicing{' '}
              <span className="text-brand font-bold">
                {chatScenarios.find((s) => s.id === chatScenarioId)?.title ?? 'open chat'}
              </span>{' '}
              in {LANGUAGE_LABELS[targetLanguage]}
            </>
          ) : (
            <>
              Coach{' '}
              <span className="text-brand font-bold">
                {voiceScenarios.find((c) => c.id === voiceScenarioId)?.name ?? 'SULTI'}
              </span>{' '}
              is ready to talk in {LANGUAGE_LABELS[targetLanguage]}
            </>
          )}
        </p>
      </div>

      {/* ============================================================ */}
      {/* 4. CONTINUE LEARNING (progress ring + recent activity)       */}
      {/* ============================================================ */}
      <ContinueLearningCard
        recentConversations={recentConversations}
        recentVoiceSessions={recentVoiceSessions}
        onOpenConversation={onOpenConversation}
        onReviewVoiceSession={onReviewVoiceSession}
        onBrowseAll={onNavigateToChat}
      />
    </div>
  );
};
