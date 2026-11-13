import React from 'react';
import { History, MessageSquare, Mic, Play, ChevronRight } from 'lucide-react';
import { AiConversation, AiVoiceSession } from '../../types/aiHub';
import { resolveCoach } from '../../services/customAgentsService';
import { sounds } from '../../utils/soundEffects';

interface ContinueLearningCardProps {
  recentConversations: AiConversation[];
  recentVoiceSessions: AiVoiceSession[];
  onOpenConversation: (convoId: string) => void;
  onReviewVoiceSession?: (session: AiVoiceSession) => void;
  onBrowseAll?: () => void;
}

const RING_RADIUS = 26;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

/** Compact SVG progress ring (56px) used inside the Continue Learning card. */
const ProgressRing: React.FC<{ percent: number; accent: 'teal' | 'cyan' }> = ({
  percent,
  accent,
}) => {
  const clamped = Math.max(0, Math.min(100, percent));
  const offset = RING_CIRCUMFERENCE - (clamped / 100) * RING_CIRCUMFERENCE;
  const stroke = accent === 'teal' ? '#14B8A6' : '#22D3EE';

  return (
    <div className="relative w-14 h-14 shrink-0">
      <svg viewBox="0 0 64 64" className="w-full h-full -rotate-90">
        <circle
          cx="32"
          cy="32"
          r={RING_RADIUS}
          fill="none"
          strokeWidth="6"
          className="stroke-[var(--border-subtle)]"
        />
        <circle
          cx="32"
          cy="32"
          r={RING_RADIUS}
          fill="none"
          stroke={stroke}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={RING_CIRCUMFERENCE}
          strokeDashoffset={offset}
          className="transition-[stroke-dashoffset] duration-700 ease-out"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[11px] font-mono font-black text-ink">
        {Math.round(clamped)}%
      </span>
    </div>
  );
};

/**
 * "Continue Learning" activity preview card with a progress ring,
 * built from the learner's most recent AI chat / voice activity.
 */
export const ContinueLearningCard: React.FC<ContinueLearningCardProps> = ({
  recentConversations,
  recentVoiceSessions,
  onOpenConversation,
  onReviewVoiceSession,
  onBrowseAll,
}) => {
  const latestConvo = recentConversations[0];
  const latestSession = recentVoiceSessions[0];

  // Prefer the most recently updated activity
  const convoTime = latestConvo ? new Date(latestConvo.updatedAt).getTime() : 0;
  const sessionTime = latestSession ? new Date(latestSession.startedAt).getTime() : 0;
  const showChat = Boolean(latestConvo && convoTime >= sessionTime);

  const source = showChat ? latestConvo : latestSession;
  const accent: 'teal' | 'cyan' = showChat ? 'teal' : 'cyan';

  const percent = !source
    ? 0
    : showChat
      ? Math.min(92, 25 + (latestConvo!.messageCount ?? 0) * 6)
      : Math.min(95, Math.round(latestSession!.speechScoreAverage || 30));

  const coach = source ? resolveCoach(source.agentId) : null;

  const title = !source
    ? 'Start your first SULTI session'
    : showChat
      ? latestConvo!.scenarioTitle || latestConvo!.title
      : latestSession!.scenarioTitle || 'Voice practice with ' + coach?.name;

  const meta = !source
    ? 'Your progress and streaks will appear here.'
    : showChat
      ? `💬 Chat with ${coach?.name} · ${latestConvo!.messageCount} messages`
      : `🎙️ ${Math.max(1, Math.round((latestSession!.durationSeconds || 0) / 60))} min speaking · ${latestSession!.speechScoreAverage}% clarity`;

  const openSource = () => {
    if (!source) return;
    sounds.playTap();
    if (showChat) {
      onOpenConversation(latestConvo!.id);
    } else if (onReviewVoiceSession) {
      onReviewVoiceSession(latestSession!);
    }
  };

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-6 h-6 rounded-lg bg-brand-soft text-brand flex items-center justify-center shrink-0">
            <History className="w-3.5 h-3.5" />
          </span>
          <h2 className="font-display font-black text-sm text-ink truncate">
            Continue Learning
          </h2>
        </div>
        {source && onBrowseAll && (
          <button
            onClick={() => {
              sounds.playTap();
              onBrowseAll();
            }}
            className="shrink-0 min-h-[32px] px-1.5 text-[11px] font-bold text-brand flex items-center gap-0.5 cursor-pointer rounded-lg hover:bg-brand-soft transition-colors"
          >
            <span>View all</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Primary preview card — a single button for a clear tap target */}
      <button
        type="button"
        onClick={openSource}
        disabled={!source}
        aria-label={source ? `Continue ${title}` : 'No recent SULTI activity yet'}
        className={`w-full text-left p-3.5 rounded-2xl bg-surface border border-line shadow-soft flex items-center gap-3.5 transition-all ${
          source
            ? 'hover:border-brand/40 cursor-pointer active:scale-[0.99]'
            : 'cursor-default opacity-90'
        }`}
      >
        <ProgressRing percent={percent} accent={accent} />

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span
              className={`shrink-0 w-5 h-5 rounded-md flex items-center justify-center ${
                accent === 'teal'
                  ? 'bg-brand-soft text-brand'
                  : 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-300'
              }`}
            >
              {showChat ? (
                <MessageSquare className="w-3 h-3" />
              ) : (
                <Mic className="w-3 h-3" />
              )}
            </span>
            <span className="text-[9.5px] font-mono font-black uppercase tracking-wider text-muted">
              {showChat ? 'Last conversation' : source ? 'Last voice session' : 'Your journey'}
            </span>
          </div>

          <h3 className="font-display font-black text-[13px] leading-snug text-ink line-clamp-2 mt-0.5">
            {title}
          </h3>
          <p className="text-[11px] text-muted line-clamp-1 mt-0.5">{meta}</p>
        </div>

        {source && (
          <span
            className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center ${
              accent === 'teal'
                ? 'bg-brand text-on-brand'
                : 'bg-cyan-700 text-white'
            }`}
            aria-hidden
          >
            <Play className="w-4 h-4 fill-current" />
          </span>
        )}
      </button>

      {/* Recent activity strip */}
      {recentConversations.length + recentVoiceSessions.length > 1 && (
        <div className="flex gap-1.5 overflow-x-auto pb-1 -mb-1 scrollbar-none">
          {recentConversations.slice(1, 4).map((convo) => (
            <button
              key={convo.id}
              onClick={() => {
                sounds.playTap();
                onOpenConversation(convo.id);
              }}
              title={convo.title}
              className="shrink-0 max-w-[200px] min-h-[34px] px-2.5 py-1.5 rounded-xl bg-elevated border border-line text-[11px] font-bold text-ink/80 hover:border-brand/40 hover:text-ink transition-colors cursor-pointer active:scale-95 truncate"
            >
              💬 {convo.title}
            </button>
          ))}
          {recentVoiceSessions.slice(0, 2).map((session) => {
            const label = session.scenarioTitle || `Voice · ${resolveCoach(session.agentId).name}`;
            return (
              <button
                key={session.id}
                onClick={() => {
                  sounds.playTap();
                  onReviewVoiceSession?.(session);
                }}
                title={label}
                className="shrink-0 max-w-[200px] min-h-[34px] px-2.5 py-1.5 rounded-xl bg-elevated border border-line text-[11px] font-bold text-ink/80 hover:border-cyan-500/40 hover:text-ink transition-colors cursor-pointer active:scale-95 truncate"
              >
                🎙️ {label}
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
};
