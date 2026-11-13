import React, { useEffect, useState } from 'react';
import { ArrowRight, Check, Clock, Mic, Sparkles } from 'lucide-react';
import { AgentMode } from './AgentModeSwitch';
import { sounds } from '../../utils/soundEffects';

interface HeroScenario {
  id: string;
  label: string;
  emoji: string;
}

interface PreviewCoach {
  name: string;
  avatar: string;
  greeting: string;
}

interface AgentHeroCardProps {
  mode: AgentMode;
  scenarios: HeroScenario[];
  selectedScenarioId: string;
  onSelectScenario: (id: string) => void;
  onStartPractice: () => void;
  /** Coach used for the live preview block (typing bubble / waveform) */
  previewCoach?: PreviewCoach;
}

const MODE_COPY: Record<
  AgentMode,
  {
    eyebrow: string;
    title: string;
    description: string;
    tags: string[];
    badge: React.ReactNode;
    ctaHint: string;
  }
> = {
  chat: {
    eyebrow: 'Interactive chat',
    title: 'Chat with SULTI anytime',
    description:
      'Roleplay real-world scenarios, build vocabulary, and get gentle grammar tips without breaking the flow.',
    tags: ['Scenario practice', 'Smart feedback', 'Persistent chat'],
    badge: null,
    ctaHint: 'Text-based practice',
  },
  voice: {
    eyebrow: 'Live speaking',
    title: 'Speak out loud with SULTI',
    description:
      'Practice pronunciation and confidence with live transcription and post-session speaking tips.',
    tags: ['Pronunciation', 'Live speaking', 'Roleplay'],
    badge: (
      <span className="inline-flex items-center gap-1 h-6 px-2 rounded-lg bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border border-cyan-500/25 text-[9.5px] font-mono font-bold uppercase tracking-wider shrink-0">
        <Clock className="w-3 h-3" />
        <span>2-min free</span>
      </span>
    ),
    ctaHint: '2-minute session',
  },
};

/**
 * Coach preview inside the hero card.
 * Chat mode shows the coach greeting with an explicit expand/collapse control;
 * voice mode shows the listening state + timer.
 */
const LivePreview: React.FC<{ mode: AgentMode; coach?: PreviewCoach }> = ({ mode, coach }) => {
  const [expanded, setExpanded] = useState(false);
  const isChat = mode === 'chat';

  useEffect(() => {
    setExpanded(false);
  }, [mode, coach?.name]);

  if (!coach) return null;

  const canExpand = coach.greeting.length > 92;

  return (
    <div className="relative z-10 mt-3 rounded-2xl p-2.5 border border-line bg-elevated/70">
      <div className="flex items-start gap-2.5">
        <img
          src={coach.avatar}
          alt={coach.name}
          className={`w-9 h-9 rounded-xl object-cover shrink-0 border ${
            isChat ? 'border-brand/40' : 'border-cyan-500/40'
          }`}
        />

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="text-[9px] font-mono font-black uppercase tracking-wider text-muted">
                {isChat ? 'Coach preview' : 'Live preview'}
              </div>
              <div className="text-[12px] font-black text-ink leading-tight">{coach.name}</div>
            </div>

            {isChat ? (
              <span className="inline-flex items-center gap-1 shrink-0 h-5 px-1.5 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 text-[8.5px] font-mono font-bold uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Online
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 shrink-0 h-6 px-2 rounded-lg bg-cyan-500/10 border border-cyan-500/25 text-cyan-700 dark:text-cyan-300 font-mono text-[10px] font-black tabular-nums">
                <Clock className="w-3 h-3" />
                02:00
              </span>
            )}
          </div>

          {isChat ? (
            <>
              <p
                className={`mt-1.5 text-[11.5px] font-medium text-ink/85 leading-snug ${
                  expanded ? '' : 'line-clamp-2'
                }`}
              >
                {coach.greeting}
              </p>

              <div className="mt-1.5 flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-[9px] font-medium text-muted">
                  <span className="flex items-end gap-[3px]">
                    {[0, 1, 2].map((i) => (
                      <span
                        key={i}
                        className="w-1 h-1 rounded-full bg-brand/80 animate-bounce"
                        style={{ animationDelay: `${i * 0.15}s`, animationDuration: '1s' }}
                      />
                    ))}
                  </span>
                  Ready to reply
                </span>

                {canExpand && (
                  <button
                    type="button"
                    onClick={() => {
                      sounds.playTap();
                      setExpanded((prev) => !prev);
                    }}
                    aria-expanded={expanded}
                    className="text-[9.5px] font-bold text-brand hover:underline cursor-pointer shrink-0"
                  >
                    {expanded ? 'Show less' : 'Read more'}
                  </button>
                )}
              </div>
            </>
          ) : (
            <div className="mt-1.5 flex items-end justify-between gap-2">
              <div className="min-w-0">
                <div className="text-[11.5px] font-bold text-ink">SULTI is listening…</div>
                <div className="text-[9.5px] text-muted">Speak naturally in your target language</div>
              </div>
              <div className="flex items-end gap-[3px] h-6 shrink-0 pr-0.5" aria-hidden>
                {[1, 2, 3, 4, 5].map((n) => (
                  <span
                    key={n}
                    className={`w-[3px] h-3 rounded-full bg-gradient-to-t from-cyan-500 to-teal-400 wave-bar-${n}`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Primary interactive card for the Sulti dashboard.
 * The same structure renders Chat and Voice modes; only copy, preview and
 * scenario set change, so theme and layout stay consistent.
 */
export const AgentHeroCard: React.FC<AgentHeroCardProps> = ({
  mode,
  scenarios,
  selectedScenarioId,
  onSelectScenario,
  onStartPractice,
  previewCoach,
}) => {
  const copy = MODE_COPY[mode];
  const isChat = mode === 'chat';

  return (
    <section
      key={mode}
      className="relative rounded-3xl p-4 bg-surface border border-line shadow-soft dash-enter overflow-hidden"
    >
      {/* Restrained brand accent instead of a full-card gradient */}
      <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-brand via-cyan-400 to-transparent pointer-events-none" />

      {/* Top row: icon + eyebrow + title + optional badge */}
      <div className="relative z-10 flex items-start justify-between gap-2">
        <div className="flex items-start gap-2.5 min-w-0">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
              isChat
                ? 'bg-brand-soft border-brand/20 text-brand'
                : 'bg-cyan-500/10 border-cyan-500/20 text-cyan-600 dark:text-cyan-300'
            }`}
          >
            {isChat ? <Sparkles className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </div>

          <div className="min-w-0">
            <div className="text-[9.5px] font-mono font-bold uppercase tracking-wider text-muted">
              {copy.eyebrow}
            </div>
            <h3 className="font-display font-black text-[15px] leading-snug text-ink break-words">
              {copy.title}
            </h3>
          </div>
        </div>
        {copy.badge}
      </div>

      <p className="relative z-10 mt-2 text-[12px] text-muted leading-relaxed">
        {copy.description}
      </p>

      {/* Feature tags */}
      <div className="relative z-10 flex flex-wrap gap-1.5 mt-2.5">
        {copy.tags.map((tag, index) => (
          <span
            key={tag}
            className={`inline-flex items-center h-6 px-2 rounded-lg text-[9.5px] font-mono font-semibold border ${
              index === 0
                ? isChat
                  ? 'bg-brand-soft border-brand/20 text-brand'
                  : 'bg-cyan-500/10 border-cyan-500/20 text-cyan-700 dark:text-cyan-300'
                : 'bg-elevated border-line text-muted'
            }`}
          >
            {tag}
          </span>
        ))}
      </div>

      <LivePreview mode={mode} coach={previewCoach} />

      {/* Scenario picker */}
      <div className="relative z-10 mt-3">
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <span className="text-[9px] font-mono font-black uppercase tracking-wider text-muted">
            Pick a scenario
          </span>
          {isChat && scenarios.length > 2 && (
            <span className="text-[8.5px] font-medium text-muted">Swipe for more →</span>
          )}
        </div>

        <div
          className={`flex gap-1.5 ${
            isChat ? 'overflow-x-auto pb-1 -mb-1 scrollbar-none' : 'flex-wrap'
          }`}
        >
          {scenarios.map((scenario) => {
            const selected = scenario.id === selectedScenarioId;
            return (
              <button
                key={scenario.id}
                onClick={() => {
                  sounds.playTap();
                  onSelectScenario(scenario.id);
                }}
                aria-pressed={selected}
                className={`shrink-0 min-h-[40px] max-w-full flex items-center gap-1.5 px-2.5 rounded-xl text-[10.5px] font-bold border transition-all cursor-pointer active:scale-[0.98] ${
                  isChat ? 'whitespace-nowrap' : 'text-left'
                } ${
                  selected
                    ? isChat
                      ? 'bg-brand text-on-brand border-brand shadow-xs'
                      : 'bg-cyan-700 text-white border-cyan-700 shadow-xs'
                    : 'bg-elevated border-line text-muted hover:text-ink hover:border-brand/40'
                }`}
              >
                <span className="text-[13px] leading-none shrink-0">{scenario.emoji}</span>
                <span>{scenario.label}</span>
                {selected && <Check className="w-3 h-3 shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Primary action */}
      <button
        onClick={() => {
          sounds.playTap();
          onStartPractice();
        }}
        aria-label={`Start practice in ${mode} mode`}
        className={`relative z-10 w-full min-h-[48px] mt-3.5 rounded-2xl px-3.5 flex items-center justify-between gap-3 transition-all cursor-pointer active:scale-[0.99] shadow-sm ${
          isChat
            ? 'bg-brand text-on-brand hover:bg-brand/90'
            : 'bg-cyan-700 text-white hover:bg-cyan-800'
        }`}
      >
        <span className="flex items-center gap-2 min-w-0">
          <span className="w-7 h-7 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
            {isChat ? <Sparkles className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </span>
          <span className="font-display text-[13px] font-black truncate">Start Practice</span>
        </span>
        <span className="flex items-center gap-1.5 shrink-0">
          <span className="hidden min-[360px]:inline text-[9.5px] font-mono font-bold opacity-90">
            {copy.ctaHint}
          </span>
          <ArrowRight className="w-4 h-4" />
        </span>
      </button>
    </section>
  );
};
