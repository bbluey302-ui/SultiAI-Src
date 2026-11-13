import React, { useState, useEffect } from 'react';
import { X, Bot, Mic, MessageSquare, Clock, Award, Shield, Sparkles, ArrowRight, ExternalLink } from 'lucide-react';
import { fetchUserConversations, fetchUserVoiceSessions } from '../../services/aiHubService';
import { AiConversation, AiVoiceSession } from '../../types/aiHub';
import { resolveCoach } from '../../services/customAgentsService';
import { sounds } from '../../utils/soundEffects';
import { useAuth } from '../../context/AuthContext';

interface AiActivityModalProps {
  userId?: string;
  onOpenSultiChat: (prompt?: string) => void;
  onClose: () => void;
}

export const AiActivityModal: React.FC<AiActivityModalProps> = ({
  userId,
  onOpenSultiChat,
  onClose,
}) => {
  const { session } = useAuth();
  // Real signed-in user only — no mock identity fallback
  const resolvedUserId = userId || session?.user.id || '';
  const [activeTab, setActiveTab] = useState<'voice' | 'chat'>('voice');
  const [conversations, setConversations] = useState<AiConversation[]>([]);
  const [voiceSessions, setVoiceSessions] = useState<AiVoiceSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function loadData() {
      setLoading(true);
      try {
        const [cList, vList] = await Promise.all([
          fetchUserConversations(resolvedUserId),
          fetchUserVoiceSessions(resolvedUserId),
        ]);
        if (mounted) {
          setConversations(cList);
          setVoiceSessions(vList);
        }
      } catch (err) {
        console.warn('Error loading AI activity:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadData();
    return () => {
      mounted = false;
    };
  }, [resolvedUserId]);

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md bg-white dark:bg-[#11222D] rounded-3xl border border-stone-200 dark:border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        role="dialog"
        aria-labelledby="ai-activity-title"
      >
        {/* Header */}
        <div className="p-4 border-b border-stone-200/80 dark:border-white/10 flex items-center justify-between bg-stone-50/50 dark:bg-stone-900/40">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-teal-50 dark:bg-teal-950/70 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <h2 id="ai-activity-title" className="font-display font-black text-sm text-stone-900 dark:text-white">
                AI Coach & Voice History
              </h2>
              <p className="text-[10px] text-stone-500 dark:text-stone-400">
                Speaking drills, Whisper concordance & roleplay sessions
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              sounds.playTap();
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-500 hover:text-stone-900 dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center gap-1 p-2 bg-stone-100 dark:bg-stone-900 border-b border-stone-200/60 dark:border-white/5">
          <button
            onClick={() => {
              sounds.playTap();
              setActiveTab('voice');
            }}
            className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'voice'
                ? 'bg-white dark:bg-[#152B37] text-teal-700 dark:text-teal-300 shadow-xs font-black'
                : 'text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
            }`}
          >
            <Mic className="w-3.5 h-3.5" />
            <span>Voice Sessions ({voiceSessions.length})</span>
          </button>
          <button
            onClick={() => {
              sounds.playTap();
              setActiveTab('chat');
            }}
            className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'chat'
                ? 'bg-white dark:bg-[#152B37] text-teal-700 dark:text-teal-300 shadow-xs font-black'
                : 'text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Chat Conversations ({conversations.length})</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 overflow-y-auto flex-1 space-y-3">
          {loading ? (
            <div className="py-12 text-center space-y-2">
              <div className="w-8 h-8 mx-auto border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-stone-400">Loading AI activity records...</p>
            </div>
          ) : activeTab === 'voice' ? (
            voiceSessions.length === 0 ? (
              <div className="py-10 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 mx-auto flex items-center justify-center text-xl">
                  🎙️
                </div>
                <div className="space-y-1">
                  <h4 className="font-display font-black text-sm text-stone-900 dark:text-white">
                    No Voice Sessions Yet
                  </h4>
                  <p className="text-xs text-stone-500 dark:text-stone-400 max-w-xs mx-auto">
                    Start a 2-minute live speaking practice with Coach Jen or Coach Adam to receive Whisper acoustic evaluation.
                  </p>
                </div>
                <button
                  onClick={() => {
                    sounds.playTap();
                    onClose();
                    onOpenSultiChat('Magpraktis ta og pagsulti sa Bisaya');
                  }}
                  className="px-4 py-2 rounded-xl bg-teal-500 text-stone-950 text-xs font-bold inline-flex items-center gap-1.5 shadow-md cursor-pointer"
                >
                  <Mic className="w-3.5 h-3.5" />
                  <span>Start Voice Drill</span>
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {voiceSessions.map((s) => {
                  const coach = resolveCoach(s.agentId);
                  return (
                    <div
                      key={s.id}
                      className="p-3.5 bg-stone-50 dark:bg-stone-800/60 rounded-2xl border border-stone-200/80 dark:border-white/5 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <img
                            src={coach?.avatar || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=260&q=80'}
                            alt={coach?.name || 'Coach'}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                          <div>
                            <div className="font-display font-black text-xs text-stone-900 dark:text-white">
                              {s.scenarioTitle || 'Speaking Practice'}
                            </div>
                            <div className="text-[10px] text-stone-500 dark:text-stone-400">
                              Coach: {coach?.name || s.agentId} · {s.targetLanguage}
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-xs font-mono font-black text-emerald-600 dark:text-emerald-400">
                            {s.speechScoreAverage}%
                          </span>
                          <span className="text-[9px] font-mono text-stone-400 block">
                            {Math.floor(s.durationSeconds / 60)}m {s.durationSeconds % 60}s
                          </span>
                        </div>
                      </div>

                      {s.userTranscriptSnippet && (
                        <div className="p-2 bg-white/80 dark:bg-stone-900/60 rounded-xl border border-stone-200/60 dark:border-white/5 text-[10.5px] text-stone-600 dark:text-stone-300 italic">
                          "{s.userTranscriptSnippet.slice(0, 110)}..."
                        </div>
                      )}

                      {s.feedbackSummary && (
                        <p className="text-[10px] text-stone-500 dark:text-stone-400 leading-tight">
                          💡 {s.feedbackSummary}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )
          ) : (
            conversations.length === 0 ? (
              <div className="py-10 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 mx-auto flex items-center justify-center text-xl">
                  💬
                </div>
                <div className="space-y-1">
                  <h4 className="font-display font-black text-sm text-stone-900 dark:text-white">
                    No Chat History Yet
                  </h4>
                  <p className="text-xs text-stone-500 dark:text-stone-400 max-w-xs mx-auto">
                    Roleplay market bargaining, asking directions, or daily greetings with our BERT NLP-guided AI coaches.
                  </p>
                </div>
                <button
                  onClick={() => {
                    sounds.playTap();
                    onClose();
                    onOpenSultiChat();
                  }}
                  className="px-4 py-2 rounded-xl bg-teal-500 text-stone-950 text-xs font-bold inline-flex items-center gap-1.5 shadow-md cursor-pointer"
                >
                  <Bot className="w-3.5 h-3.5" />
                  <span>Open Sulti AI Hub</span>
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {conversations.map((c) => {
                  const coach = resolveCoach(c.agentId);
                  return (
                    <div
                      key={c.id}
                      onClick={() => {
                        sounds.playTap();
                        onClose();
                        onOpenSultiChat(c.title);
                      }}
                      className="p-3 bg-stone-50 dark:bg-stone-800/60 rounded-2xl border border-stone-200/80 dark:border-white/5 hover:border-teal-400/50 cursor-pointer transition-all flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={coach?.avatar || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=260&q=80'}
                          alt={coach?.name || 'Coach'}
                          className="w-8 h-8 rounded-full object-cover shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="font-display font-black text-xs text-stone-900 dark:text-white truncate">
                            {c.title}
                          </div>
                          <div className="text-[10px] text-stone-500 dark:text-stone-400 truncate">
                            {coach?.name} · {c.messageCount} messages · {c.targetLanguage}
                          </div>
                        </div>
                      </div>

                      <ArrowRight className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                    </div>
                  );
                })}
              </div>
            )
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-stone-200/80 dark:border-white/10 flex items-center justify-between bg-stone-50/50 dark:bg-stone-900/40">
          <span className="text-[10px] text-stone-400 flex items-center gap-1">
            <Shield className="w-3 h-3 text-teal-500" />
            Transcripts isolated with Supabase RLS
          </span>
          <button
            onClick={() => {
              sounds.playTap();
              onClose();
            }}
            className="px-4 py-2 rounded-xl text-xs font-bold text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
