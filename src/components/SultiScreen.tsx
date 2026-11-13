import React, { useState, useEffect } from 'react';
import { TargetDialect } from '../types';
import { 
  AiConversation, AiChatMessage, AiVoiceSession, 
  MajorAiLanguage, AiCoachId 
} from '../types/aiHub';
import { 
  fetchUserConversations, createConversation, updateConversationTitle, 
  archiveConversation, deleteConversation, fetchConversationMessages, 
  saveChatMessage, recordVoiceSession, fetchUserVoiceSessions 
} from '../services/aiHubService';
import { SultiHubLanding } from './sulti/SultiHubLanding';
import { SultiChatAgentHub } from './sulti/SultiChatAgentHub';
import { SultiChatWorkspace } from './sulti/SultiChatWorkspace';
import { SultiVoiceAgentHub } from './sulti/SultiVoiceAgentHub';
import { SultiVoiceSessionModal } from './sulti/SultiVoiceSessionModal';
import { SultiCreationStudio } from './SultiCreationStudio';
import { TokenStoreModal } from './sulti/TokenStoreModal';
import {
  TokenWalletSummary,
  fetchWalletSummary,
} from '../services/tokenService';
import { resolveCoach } from '../services/customAgentsService';
import { sounds } from '../utils/soundEffects';
import { useLearningLanguage } from '../hooks/useLearningLanguage';

interface SultiScreenProps {
  /** Real Supabase user id — all AI hub data is scoped to this account */
  userId?: string;
  /** Supabase JWT used to authenticate backend AI calls */
  authToken?: string;
  /** Signed-in learner's display name (for the greeting header) */
  userName?: string;
  targetDialect: TargetDialect;
  onActivityPerformed?: () => void;
  initialPrompt?: string;
  initialVoiceMode?: boolean;
}

export type SultiViewMode = 'hub' | 'chat_hub' | 'chat_workspace' | 'voice_hub' | 'studio';

export const SultiScreen: React.FC<SultiScreenProps> = ({
  userId,
  authToken,
  userName,
  targetDialect,
  onActivityPerformed,
  initialPrompt,
  initialVoiceMode = false,
}) => {
  const [viewMode, setViewMode] = useState<SultiViewMode>(initialVoiceMode ? 'voice_hub' : 'hub');
  const [targetLanguage, setTargetLanguage] = useLearningLanguage();
  
  // Conversations and Messages State
  const [conversations, setConversations] = useState<AiConversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [currentMessages, setCurrentMessages] = useState<AiChatMessage[]>([]);
  
  // Voice Sessions State
  const [voiceSessions, setVoiceSessions] = useState<AiVoiceSession[]>([]);
  const [activeVoiceSessionConfig, setActiveVoiceSessionConfig] = useState<{
    coachId: AiCoachId;
    targetLanguage: MajorAiLanguage;
    scenarioTitle: string;
    difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  } | null>(null);

  // AI token wallet
  const [walletSummary, setWalletSummary] = useState<TokenWalletSummary | null>(null);
  const [walletLoading, setWalletLoading] = useState(true);
  const [tokenStoreOpen, setTokenStoreOpen] = useState(false);

  const refreshWallet = async () => {
    if (!userId) {
      setWalletSummary(null);
      setWalletLoading(false);
      return;
    }
    try {
      const summary = await fetchWalletSummary();
      setWalletSummary(summary);
    } catch {
      // Keep the last known balance; the store sheet surfaces auth errors.
    } finally {
      setWalletLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    setWalletLoading(true);
    if (!userId) {
      setWalletSummary(null);
      setWalletLoading(false);
      return;
    }
    fetchWalletSummary()
      .then((summary) => {
        if (mounted) setWalletSummary(summary);
      })
      .catch(() => {
        // Wallet is optional decoration in the header.
      })
      .finally(() => {
        if (mounted) setWalletLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [userId, authToken]);

  // Load conversations and previous voice sessions on mount
  useEffect(() => {
    if (!userId) {
      setConversations([]);
      setVoiceSessions([]);
      return;
    }
    let mounted = true;
    const loadData = async () => {
      try {
        const [convos, vSessions] = await Promise.all([
          fetchUserConversations(userId),
          fetchUserVoiceSessions(userId),
        ]);
        if (mounted) {
          setConversations(convos);
          setVoiceSessions(vSessions);
        }
      } catch (err) {
        console.warn('Error loading AI Hub data:', err);
      }
    };
    loadData();
    return () => { mounted = false; };
  }, [userId]);

  // Handle prefill prompt if passed from another screen
  useEffect(() => {
    if (initialPrompt && initialPrompt.trim()) {
      handleStartNewConversation({
        title: initialPrompt.slice(0, 35) + '...',
        agentId: targetLanguage === 'filipino' ? 'mika' : (targetLanguage === 'english' ? 'adam' : 'jen'),
        targetLanguage,
        initialPrompt,
      });
    }
  }, [initialPrompt]);

  // When active conversation changes, load its message history
  useEffect(() => {
    if (!activeConversationId) {
      setCurrentMessages([]);
      return;
    }
    let mounted = true;
    fetchConversationMessages(activeConversationId).then((msgs) => {
      if (mounted) {
        setCurrentMessages(msgs);
      }
    });
    return () => { mounted = false; };
  }, [activeConversationId]);

  // Handler: Start a new conversation workspace
  const handleStartNewConversation = async (params: {
    title: string;
    scenarioId?: string;
    scenarioTitle?: string;
    agentId: AiCoachId;
    targetLanguage: MajorAiLanguage;
    initialPrompt?: string;
  }) => {
    if (!userId) return;
    const coach = resolveCoach(params.agentId);
    const greetingText = params.initialPrompt || coach.greetingMessage.text;

    const newConvo = await createConversation({
      userId,
      title: params.title,
      scenarioId: params.scenarioId,
      scenarioTitle: params.scenarioTitle,
      agentId: params.agentId,
      targetLanguage: params.targetLanguage,
      initialMessage: {
        role: 'assistant',
        content: greetingText,
        translation: coach.greetingMessage.translation,
        phoneticGuide: coach.greetingMessage.language === 'cebuano' ? 'Mah-ah-YONG ad-LAW!' : undefined,
        suggestedFollowUps: coach.practiceExamples.slice(0, 3),
      },
    });

    setConversations((prev) => [newConvo, ...prev]);
    setActiveConversationId(newConvo.id);
    setViewMode('chat_workspace');
    onActivityPerformed?.();
  };

  // Handler: Open an existing conversation workspace
  const handleOpenConversation = (convoId: string) => {
    setActiveConversationId(convoId);
    setViewMode('chat_workspace');
  };

  // Handler: Send a message inside the active conversation workspace
  const handleSendMessageInWorkspace = async (
    text: string,
    opts?: { alreadySaved?: boolean },
  ) => {
    if (!activeConversationId || !userId) return;

    const activeConvo = conversations.find((c) => c.id === activeConversationId);
    const agentId = activeConvo?.agentId || 'jen';
    const lang = activeConvo?.targetLanguage || targetLanguage;
    const activeCoach = resolveCoach(agentId);

    // 1. Optimistically save and render the user message (skipped on retry so
    //    the user's turn is never duplicated in history).
    if (!opts?.alreadySaved) {
      const userMsg = await saveChatMessage({
        conversationId: activeConversationId,
        userId,
        role: 'user',
        content: text,
      });
      setCurrentMessages((prev) => [...prev, userMsg]);
    }

    // 2. Query backend /api/sulti/chat
    const response = await fetch('/api/sulti/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      },
      body: JSON.stringify({
        message: text,
        userId,
        history: currentMessages.slice(-5).map((m) => ({
          role: m.role === 'user' ? 'user' : 'model',
          text: m.content,
        })),
        scenario: activeConvo?.scenarioTitle || activeConvo?.title || 'General practice',
        agentId,
        targetLanguage: lang,
        targetDialect,
        agentName: activeCoach.isCustom ? activeCoach.name : undefined,
        agentPersona: activeCoach.isCustom ? activeCoach.systemPromptIntro : undefined,
      }),
    });

    if (response.status === 402) {
      // Out of tokens — surface the top-up sheet instead of a dead-end error.
      sounds.playTap();
      setTokenStoreOpen(true);
      void refreshWallet();
      return;
    }

    if (!response.ok) {
      throw new Error('Server returned error response');
    }

    const data = await response.json();

    // 3. Save assistant reply with rich structured content
    const botMsg = await saveChatMessage({
      conversationId: activeConversationId,
      userId,
      role: 'assistant',
      content: data.content || data.replyBisaya || data.replyEnglish || 'Maayo kaayo! Padayon ta sa pagpraktis.',
      translation: data.replyEnglish,
      phoneticGuide: data.phoneticGuide,
      vocabularyBreakdown: data.breakdown,
      corrections: data.corrections || (data.grammarCorrection && data.grammarCorrection !== 'Maayo kaayo! Natural paminawon.' ? {
        original: text,
        improved: data.grammarCorrection,
        explanation: 'Grammatical guidance from your coach',
      } : undefined),
      suggestedFollowUps: data.suggestedReplies,
      culturalTip: data.culturalTip,
      groundingSources: data.searchSources,
      mapsLinks: data.mapsLinks,
    });

    setCurrentMessages((prev) => [...prev, botMsg]);
    onActivityPerformed?.();
    void refreshWallet();
  };

  // Handler: Rename conversation
  const handleRenameConversation = async (convoId: string, newTitle: string) => {
    await updateConversationTitle(convoId, newTitle);
    setConversations((prev) =>
      prev.map((c) => (c.id === convoId ? { ...c, title: newTitle } : c))
    );
  };

  // Handler: Archive conversation
  const handleArchiveConversation = async (convoId: string, archive: boolean) => {
    await archiveConversation(convoId, archive);
    setConversations((prev) =>
      prev.map((c) => (c.id === convoId ? { ...c, status: archive ? 'archived' : 'active' } : c))
    );
  };

  // Handler: Delete conversation
  const handleDeleteConversation = async (convoId: string) => {
    await deleteConversation(convoId);
    setConversations((prev) => prev.filter((c) => c.id !== convoId));
    if (activeConversationId === convoId) {
      setActiveConversationId(null);
      setViewMode('chat_hub');
    }
  };

  // Handler: Save voice session from modal
  const handleSaveVoiceSession = async (sessionData: Omit<AiVoiceSession, 'id'>) => {
    const recorded = await recordVoiceSession(sessionData);
    setVoiceSessions((prev) => [recorded, ...prev]);
    onActivityPerformed?.();
  };

  const activeConvo = conversations.find((c) => c.id === activeConversationId);

  const isWorkspace = viewMode === 'chat_workspace';

  return (
    <div
      className={
        isWorkspace
          ? 'mx-auto w-full max-w-none px-0 pb-0 sm:max-w-2xl sm:px-3'
          : 'select-none mx-auto max-w-md space-y-4 px-4 pb-[calc(7rem+env(safe-area-inset-bottom))]'
      }
    >
      {/* ======================================================================= */}
      {/* VIEW 1: CREATION STUDIO                                                 */}
      {/* ======================================================================= */}
      {viewMode === 'studio' && (
        <SultiCreationStudio
          targetDialect={targetDialect}
          onInsufficientTokens={() => {
            setTokenStoreOpen(true);
            void refreshWallet();
          }}
        />
      )}

      {/* ======================================================================= */}
      {/* VIEW 2: SULTI HUB LANDING (Main Landing Page)                           */}
      {/* ======================================================================= */}
      {viewMode === 'hub' && (
        <SultiHubLanding
          userName={userName}
          targetLanguage={targetLanguage}
          onSelectLanguage={(lang) => setTargetLanguage(lang)}
          onNavigateToChat={() => setViewMode('chat_hub')}
          onNavigateToVoice={() => setViewMode('voice_hub')}
          onOpenConversation={handleOpenConversation}
          recentConversations={conversations}
          recentVoiceSessions={voiceSessions}
          tokenBalance={walletSummary ? walletSummary.wallet.balance : undefined}
          tokenPlan={
            walletSummary?.plan && walletSummary.plan.id !== 'free'
              ? walletSummary.plan.name
              : undefined
          }
          tokenLoading={walletLoading}
          onOpenTokenStore={() => {
            sounds.playTap();
            setTokenStoreOpen(true);
          }}
        />
      )}

      {/* ======================================================================= */}
      {/* VIEW 3: DEDICATED CHAT AGENT HUB                                        */}
      {/* ======================================================================= */}
      {viewMode === 'chat_hub' && (
        <SultiChatAgentHub
          conversations={conversations}
          targetLanguage={targetLanguage}
          onBackToHub={() => setViewMode('hub')}
          onOpenConversation={handleOpenConversation}
          onStartNewConversation={handleStartNewConversation}
          onRenameConversation={handleRenameConversation}
          onArchiveConversation={handleArchiveConversation}
          onDeleteConversation={handleDeleteConversation}
        />
      )}

      {/* ======================================================================= */}
      {/* VIEW 4: CONVERSATION WORKSPACE                                          */}
      {/* ======================================================================= */}
      {viewMode === 'chat_workspace' && activeConvo && (
        <SultiChatWorkspace
          conversation={activeConvo}
          messages={currentMessages}
          onBack={() => setViewMode('chat_hub')}
          onSendMessage={handleSendMessageInWorkspace}
          onRename={(newTitle) => handleRenameConversation(activeConvo.id, newTitle)}
          onArchive={(archive) => handleArchiveConversation(activeConvo.id, archive)}
          onDelete={() => handleDeleteConversation(activeConvo.id)}
        />
      )}

      {/* ======================================================================= */}
      {/* VIEW 5: DEDICATED VOICE AGENT HUB                                       */}
      {/* ======================================================================= */}
      {viewMode === 'voice_hub' && (
        <SultiVoiceAgentHub
          currentLanguage={targetLanguage}
          recentSessions={voiceSessions}
          onBackToHub={() => setViewMode('hub')}
          onStartVoiceSession={(config) => {
            setActiveVoiceSessionConfig(config);
          }}
        />
      )}

      {/* ======================================================================= */}
      {/* 2-MINUTE VOICE SESSION MODAL                                            */}
      {/* ======================================================================= */}
      {activeVoiceSessionConfig && (
        <SultiVoiceSessionModal
          userId={userId}
          authToken={authToken}
          coachId={activeVoiceSessionConfig.coachId}
          targetLanguage={activeVoiceSessionConfig.targetLanguage}
          scenarioTitle={activeVoiceSessionConfig.scenarioTitle}
          difficulty={activeVoiceSessionConfig.difficulty}
          onClose={() => setActiveVoiceSessionConfig(null)}
          onSaveSession={handleSaveVoiceSession}
          onAwardXp={() => onActivityPerformed?.()}
          onInsufficientTokens={() => {
            setTokenStoreOpen(true);
            void refreshWallet();
          }}
        />
      )}

      {/* ======================================================================= */}
      {/* AI TOKEN STORE (bottom sheet)                                           */}
      {/* ======================================================================= */}
      {tokenStoreOpen && (
        <TokenStoreModal
          onClose={() => setTokenStoreOpen(false)}
          onChanged={() => {
            void refreshWallet();
          }}
        />
      )}
    </div>
  );
};
