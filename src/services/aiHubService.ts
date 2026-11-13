import { supabase } from './supabaseClient';
import { AiConversation, AiChatMessage, AiVoiceSession, AiCoachId, MajorAiLanguage } from '../types/aiHub';

const STORAGE_KEY_CONVERSATIONS = 'sultiai_ai_conversations';
const STORAGE_KEY_MESSAGES = 'sultiai_ai_messages_map';
const STORAGE_KEY_VOICE_SESSIONS = 'sultiai_ai_voice_sessions';

// ----------------------------------------------------------------------------
// Local Storage Helpers
// ----------------------------------------------------------------------------

function getLocalConversations(): AiConversation[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CONVERSATIONS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalConversations(convos: AiConversation[]) {
  try {
    localStorage.setItem(STORAGE_KEY_CONVERSATIONS, JSON.stringify(convos));
  } catch {
    // ignore
  }
}

function getLocalMessagesMap(): Record<string, AiChatMessage[]> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_MESSAGES);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveLocalMessagesMap(map: Record<string, AiChatMessage[]>) {
  try {
    localStorage.setItem(STORAGE_KEY_MESSAGES, JSON.stringify(map));
  } catch {
    // ignore
  }
}

function getLocalVoiceSessions(): AiVoiceSession[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_VOICE_SESSIONS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalVoiceSessions(sessions: AiVoiceSession[]) {
  try {
    localStorage.setItem(STORAGE_KEY_VOICE_SESSIONS, JSON.stringify(sessions));
  } catch {
    // ignore
  }
}

// ----------------------------------------------------------------------------
// Conversations API
// ----------------------------------------------------------------------------

export async function fetchUserConversations(userId: string): Promise<AiConversation[]> {
  if (!userId) return [];
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('ai_conversations')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (!error && data && data.length > 0) {
        return data.map((d: any) => ({
          id: d.id,
          userId: d.user_id,
          title: d.title,
          scenarioId: d.scenario_id,
          agentId: d.agent_id as AiCoachId,
          targetLanguage: d.target_language as MajorAiLanguage,
          supportingLanguage: d.supporting_language as MajorAiLanguage,
          status: d.status,
          messageCount: d.message_count || 0,
          createdAt: d.created_at,
          updatedAt: d.updated_at,
        }));
      }
    } catch (err) {
      console.warn('Supabase fetchUserConversations error, falling back to local cache:', err);
    }
  }

  // Fallback to local storage
  const localList = getLocalConversations().filter((c) => !c.userId || c.userId === userId);
  return localList.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

export async function createConversation(data: {
  userId?: string;
  title: string;
  scenarioId?: string;
  scenarioTitle?: string;
  agentId: AiCoachId;
  targetLanguage: MajorAiLanguage;
  supportingLanguage?: MajorAiLanguage;
  initialMessage?: {
    role: 'assistant' | 'user';
    content: string;
    translation?: string;
    phoneticGuide?: string;
    suggestedFollowUps?: string[];
  };
}): Promise<AiConversation> {
  const newId = 'conv_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
  const now = new Date().toISOString();
  // Real authenticated user id — never a hardcoded mock identity.
  const userId = data.userId || '';

  const newConvo: AiConversation = {
    id: newId,
    userId,
    title: data.title,
    scenarioId: data.scenarioId,
    scenarioTitle: data.scenarioTitle,
    agentId: data.agentId,
    targetLanguage: data.targetLanguage,
    supportingLanguage: data.supportingLanguage || 'english',
    status: 'active',
    messageCount: data.initialMessage ? 1 : 0,
    lastMessagePreview: data.initialMessage?.content.substring(0, 80),
    createdAt: now,
    updatedAt: now,
  };

  // Try Supabase insert
  if (supabase && userId) {
    try {
      const { data: dbData, error } = await supabase.from('ai_conversations').insert([
        {
          id: newId,
          user_id: userId,
          title: data.title,
          scenario_id: data.scenarioId || null,
          agent_id: data.agentId,
          target_language: data.targetLanguage,
          supporting_language: data.supportingLanguage || 'english',
          status: 'active',
          message_count: data.initialMessage ? 1 : 0,
        },
      ]).select().single();

      if (!error && dbData) {
        newConvo.id = dbData.id;
      }
    } catch (err) {
      console.warn('Supabase createConversation error, using local:', err);
    }
  }

  // Save to local cache
  const localList = getLocalConversations();
  saveLocalConversations([newConvo, ...localList]);

  // If initial message provided, save it
  if (data.initialMessage) {
    await saveChatMessage({
      conversationId: newConvo.id,
      userId,
      role: data.initialMessage.role,
      content: data.initialMessage.content,
      translation: data.initialMessage.translation,
      phoneticGuide: data.initialMessage.phoneticGuide,
      suggestedFollowUps: data.initialMessage.suggestedFollowUps,
    });
  }

  return newConvo;
}

export async function updateConversationTitle(convoId: string, title: string): Promise<void> {
  if (supabase) {
    try {
      await supabase
        .from('ai_conversations')
        .update({ title, updated_at: new Date().toISOString() })
        .eq('id', convoId);
    } catch {
      // ignore
    }
  }

  const list = getLocalConversations().map((c) =>
    c.id === convoId ? { ...c, title, updatedAt: new Date().toISOString() } : c
  );
  saveLocalConversations(list);
}

export async function archiveConversation(convoId: string, archive: boolean = true): Promise<void> {
  const newStatus = archive ? 'archived' : 'active';
  if (supabase) {
    try {
      await supabase
        .from('ai_conversations')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', convoId);
    } catch {
      // ignore
    }
  }

  const list = getLocalConversations().map((c) =>
    c.id === convoId ? { ...c, status: newStatus as any, updatedAt: new Date().toISOString() } : c
  );
  saveLocalConversations(list);
}

export async function deleteConversation(convoId: string): Promise<void> {
  if (supabase) {
    try {
      await supabase.from('ai_conversations').delete().eq('id', convoId);
      await supabase.from('ai_messages').delete().eq('conversation_id', convoId);
    } catch {
      // ignore
    }
  }

  // Remove from local storage
  const list = getLocalConversations().filter((c) => c.id !== convoId);
  saveLocalConversations(list);

  const messagesMap = getLocalMessagesMap();
  delete messagesMap[convoId];
  saveLocalMessagesMap(messagesMap);
}

// ----------------------------------------------------------------------------
// Messages API
// ----------------------------------------------------------------------------

export async function fetchConversationMessages(convoId: string): Promise<AiChatMessage[]> {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('ai_messages')
        .select('*')
        .eq('conversation_id', convoId)
        .order('created_at', { ascending: true });

      if (!error && data && data.length > 0) {
        return data.map((d: any) => ({
          id: d.id,
          conversationId: d.conversation_id,
          role: d.role,
          content: d.content,
          translation: d.translation,
          phoneticGuide: d.phonetic_guide,
          createdAt: d.created_at,
          ...(d.structured_content || {}),
        }));
      }
    } catch (err) {
      console.warn('Supabase fetchConversationMessages fallback:', err);
    }
  }

  const map = getLocalMessagesMap();
  return map[convoId] || [];
}

export async function saveChatMessage(msg: Omit<AiChatMessage, 'id' | 'createdAt'> & { userId?: string }): Promise<AiChatMessage> {
  const newMsgId = 'msg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
  const now = new Date().toISOString();

  const newMsg: AiChatMessage = {
    id: newMsgId,
    conversationId: msg.conversationId,
    role: msg.role,
    content: msg.content,
    translation: msg.translation,
    phoneticGuide: msg.phoneticGuide,
    createdAt: now,
    vocabularyBreakdown: msg.vocabularyBreakdown,
    corrections: msg.corrections,
    suggestedFollowUps: msg.suggestedFollowUps,
    culturalTip: msg.culturalTip,
    groundingSources: msg.groundingSources,
    mapsLinks: msg.mapsLinks,
    codeBlock: msg.codeBlock,
    tableData: msg.tableData,
  };

  // Try Supabase insert (only for a real, signed-in user)
  if (supabase && msg.userId) {
    try {
      await supabase.from('ai_messages').insert([
        {
          id: newMsgId,
          conversation_id: msg.conversationId,
          user_id: msg.userId,
          role: msg.role,
          content: msg.content,
          translation: msg.translation || null,
          phonetic_guide: msg.phoneticGuide || null,
          structured_content: {
            vocabularyBreakdown: msg.vocabularyBreakdown,
            corrections: msg.corrections,
            suggestedFollowUps: msg.suggestedFollowUps,
            culturalTip: msg.culturalTip,
            groundingSources: msg.groundingSources,
            mapsLinks: msg.mapsLinks,
            codeBlock: msg.codeBlock,
            tableData: msg.tableData,
          },
        },
      ]);

      // Update conversation updated_at and message_count
      await supabase
        .from('ai_conversations')
        .update({
          updated_at: now,
        })
        .eq('id', msg.conversationId);
    } catch {
      // ignore
    }
  }

  // Update local cache
  const map = getLocalMessagesMap();
  const existing = map[msg.conversationId] || [];
  map[msg.conversationId] = [...existing, newMsg];
  saveLocalMessagesMap(map);

  // Update conversation record preview & message count in local storage
  const convos = getLocalConversations().map((c) => {
    if (c.id === msg.conversationId) {
      return {
        ...c,
        messageCount: (c.messageCount || 0) + 1,
        lastMessagePreview: msg.content.substring(0, 90),
        updatedAt: now,
      };
    }
    return c;
  });
  saveLocalConversations(convos);

  return newMsg;
}

// ----------------------------------------------------------------------------
// Voice Sessions API (Enforces 2-minute limits & records evaluations)
// ----------------------------------------------------------------------------

export async function recordVoiceSession(session: Omit<AiVoiceSession, 'id'>): Promise<AiVoiceSession> {
  const newSessionId = 'vses_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
  const now = new Date().toISOString();

  // Enforce server-side limit check (max 120s for free sessions)
  const cappedDuration = Math.min(120, Math.max(0, session.durationSeconds));

  const newRecord: AiVoiceSession = {
    ...session,
    id: newSessionId,
    durationSeconds: cappedDuration,
    maxAllowedSeconds: 120,
    status: cappedDuration >= 120 ? 'timeout' : (session.status || 'completed'),
    endedAt: session.endedAt || now,
  };

  if (supabase && session.userId) {
    try {
      await supabase.from('ai_voice_sessions').insert([
        {
          id: newSessionId,
          user_id: session.userId,
          agent_id: session.agentId,
          target_language: session.targetLanguage,
          scenario_title: session.scenarioTitle || 'Free Speaking Practice',
          started_at: session.startedAt,
          ended_at: newRecord.endedAt,
          duration_seconds: cappedDuration,
          max_allowed_seconds: 120,
          transcript_reference: session.userTranscriptSnippet || null,
          speech_score_average: session.speechScoreAverage || 0,
          session_status: newRecord.status,
          feedback_summary: session.feedbackSummary || null,
          session_metadata: {
            wordCount: session.wordCount,
            xpEarned: session.xpEarned,
            corrections: session.corrections,
            recommendations: session.recommendations,
          },
        },
      ]);

      // Record in ai_usage table
      await supabase.from('ai_usage').insert([
        {
          user_id: session.userId,
          usage_type: 'voice_minutes',
          duration_or_units: Math.ceil(cappedDuration / 60),
        },
      ]);
    } catch (err) {
      console.warn('Supabase voice session save fallback:', err);
    }
  }

  // Local storage cache
  const list = getLocalVoiceSessions();
  saveLocalVoiceSessions([newRecord, ...list].slice(0, 30));

  return newRecord;
}

export async function fetchUserVoiceSessions(userId: string): Promise<AiVoiceSession[]> {
  if (!userId) return [];
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('ai_voice_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('started_at', { ascending: false })
        .limit(10);

      if (!error && data && data.length > 0) {
        return data.map((d: any) => ({
          id: d.id,
          userId: d.user_id,
          agentId: d.agent_id as AiCoachId,
          targetLanguage: d.target_language as MajorAiLanguage,
          scenarioTitle: d.scenario_title,
          startedAt: d.started_at,
          endedAt: d.ended_at,
          durationSeconds: d.duration_seconds,
          maxAllowedSeconds: d.max_allowed_seconds || 120,
          status: d.session_status,
          userTranscriptSnippet: d.transcript_reference,
          speechScoreAverage: Number(d.speech_score_average) || 0,
          transcriptCount: d.session_metadata?.transcriptCount || 1,
          wordCount: d.session_metadata?.wordCount || 0,
          xpEarned: d.session_metadata?.xpEarned || 20,
          feedbackSummary: d.feedback_summary,
          corrections: d.session_metadata?.corrections,
          recommendations: d.session_metadata?.recommendations,
        }));
      }
    } catch {
      // ignore
    }
  }

  return getLocalVoiceSessions().filter((s) => !s.userId || s.userId === userId);
}
