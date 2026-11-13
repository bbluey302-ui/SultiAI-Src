import React, { useState } from 'react';
import { ArrowLeft, Send, Languages } from 'lucide-react';
import { AiConversation, AiChatMessage } from '../../types/aiHub';
import { SultiMessageRenderer } from './SultiMessageRenderer';
import { sounds } from '../../utils/soundEffects';
import { resolveCoach } from '../../services/customAgentsService';

interface SultiChatWorkspaceProps {
  conversation: AiConversation;
  messages: AiChatMessage[];
  onBack: () => void;
  onSendMessage: (text: string, opts?: { alreadySaved?: boolean }) => Promise<void>;
  onRename: (newTitle: string) => void;
  onArchive: (archive: boolean) => void;
  onDelete: () => void;
}

const LANGUAGE_LABELS: Record<string, string> = {
  cebuano: 'Cebuano/Bisaya',
  filipino: 'Filipino',
  english: 'English',
};

export const SultiChatWorkspace: React.FC<SultiChatWorkspaceProps> = ({
  conversation,
  messages,
  onBack,
  onSendMessage,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [sending, setSending] = useState(false);

  const coach = resolveCoach(conversation.agentId);
  const targetLanguage = conversation.targetLanguage || 'cebuano';
  const targetLabel = LANGUAGE_LABELS[targetLanguage] || targetLanguage;

  const handleSend = async () => {
    const text = inputValue.trim();
    if (!text || sending) return;
    setInputValue('');
    setSending(true);
    try {
      await onSendMessage(text, { alreadySaved: false });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-8rem)] flex-col select-none">
      {/* Header: coach + language context */}
      <div className="sticky top-0 z-10 border-b border-line bg-surface/95 backdrop-blur px-1 pb-2.5 pt-1">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              sounds.playTap();
              onBack();
            }}
            className="flex min-h-[34px] items-center gap-1.5 rounded-2xl border border-line bg-elevated px-2.5 text-xs font-bold text-ink transition-all hover:border-brand/40 active:scale-95"
            aria-label="Back to Chat Hub"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Chat Hub</span>
          </button>

          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-bold text-ink">{coach.name}</p>
            <p className="truncate text-[10.5px] text-muted">
              {conversation.scenarioTitle || conversation.title || 'General practice'}
            </p>
          </div>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <span className="rounded-lg border border-brand/25 bg-brand-soft px-1.5 py-0.5 text-[9.5px] font-mono font-black uppercase tracking-wider text-brand">
            Learning target: {targetLabel}
          </span>
          <span className="rounded-lg border border-line bg-elevated px-1.5 py-0.5 text-[9.5px] font-mono font-bold uppercase tracking-wider text-muted">
            Explanation: English
          </span>
          <span className="flex items-center gap-1 rounded-lg border border-line bg-elevated px-1.5 py-0.5 text-[9.5px] font-mono font-bold uppercase tracking-wider text-muted">
            <Languages className="h-2.5 w-2.5" />
            {targetLanguage === 'english' ? 'English' : `English ↔ ${targetLabel}`}
          </span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-3 px-1 py-3">
        {messages.length === 0 && (
          <div className="rounded-2xl border border-line bg-elevated p-6 text-center">
            <p className="text-sm font-bold text-ink">Start the conversation</p>
            <p className="mt-1 text-xs text-muted">
              Ask in English or try a {targetLabel} phrase — SULTI explains in English and replies in{' '}
              {targetLabel}.
            </p>
          </div>
        )}

        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              className={`rounded-2xl border p-3 ${
                isUser
                  ? 'border-brand/25 bg-brand-soft/60'
                  : 'border-line bg-elevated'
              }`}
            >
              <div className="mb-1.5 flex items-center justify-between gap-2 text-[10.5px] text-muted">
                <span className="font-bold text-ink">{isUser ? 'You' : coach.name}</span>
                <span>
                  {new Date(msg.createdAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>

              <SultiMessageRenderer
                content={msg.content}
                translation={msg.translation}
                phoneticGuide={msg.phoneticGuide}
                role={msg.role}
                targetLanguage={targetLanguage}
                vocabularyBreakdown={msg.vocabularyBreakdown}
                corrections={msg.corrections}
                suggestedFollowUps={msg.suggestedFollowUps}
                culturalTip={msg.culturalTip}
                groundingSources={msg.groundingSources}
                mapsLinks={msg.mapsLinks}
                codeBlock={msg.codeBlock}
                tableData={msg.tableData}
                onSelectSuggestion={(text) => {
                  setInputValue(text);
                  void handleSendWith(text);
                }}
              />
            </div>
          );
        })}
      </div>

      {/* Composer */}
      <div className="sticky bottom-0 border-t border-line bg-surface/95 px-1 py-2 backdrop-blur">
        <div className="flex items-end gap-2 rounded-2xl border border-line bg-elevated p-1.5">
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                void handleSend();
              }
            }}
            rows={1}
            placeholder={`Message ${coach.name}...`}
            className="max-h-28 min-h-[34px] flex-1 resize-none bg-transparent px-2 py-1.5 text-[13px] text-ink outline-none placeholder:text-muted"
          />
          <button
            type="button"
            onClick={() => void handleSend()}
            disabled={!inputValue.trim() || sending}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand text-on-brand transition-all active:scale-90 disabled:opacity-50"
            aria-label="Send message"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );

  async function handleSendWith(text: string) {
    if (!text.trim() || sending) return;
    setInputValue('');
    setSending(true);
    try {
      await onSendMessage(text.trim(), { alreadySaved: false });
    } finally {
      setSending(false);
    }
  }
};