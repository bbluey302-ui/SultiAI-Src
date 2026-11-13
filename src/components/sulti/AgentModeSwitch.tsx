import React from 'react';
import { MessageSquare, Mic } from 'lucide-react';
import { sounds } from '../../utils/soundEffects';

export type AgentMode = 'chat' | 'voice';

interface AgentModeSwitchProps {
  value: AgentMode;
  onChange: (mode: AgentMode) => void;
}

const OPTIONS: { id: AgentMode; label: string; icon: React.ReactNode }[] = [
  { id: 'chat', label: 'Chat Agent', icon: <MessageSquare className="w-4 h-4" /> },
  { id: 'voice', label: 'Voice Agent', icon: <Mic className="w-4 h-4" /> },
];

/**
 * Segmented control for Chat vs Voice mode.
 * Sliding surface + clear selected label; stable heights on narrow phones.
 */
export const AgentModeSwitch: React.FC<AgentModeSwitchProps> = ({ value, onChange }) => {
  return (
    <div
      role="tablist"
      aria-label="Choose Sulti agent mode"
      className="relative grid grid-cols-2 gap-1 p-1 rounded-2xl bg-elevated border border-line"
    >
      {/* Sliding indicator */}
      <div
        aria-hidden
        className={`absolute inset-y-1 left-1 w-[calc(50%-4px)] rounded-xl bg-surface shadow-xs border transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
          value === 'chat' ? 'translate-x-0 border-brand/40' : 'translate-x-[calc(100%+2px)] border-cyan-500/40'
        }`}
      />

      {OPTIONS.map((opt) => {
        const active = value === opt.id;
        return (
          <button
            key={opt.id}
            role="tab"
            aria-selected={active}
            onClick={() => {
              sounds.playTap();
              onChange(opt.id);
            }}
            className={`relative z-10 min-h-[44px] flex items-center justify-center gap-1.5 rounded-xl text-xs font-extrabold transition-colors cursor-pointer active:scale-[0.99] ${
              active
                ? opt.id === 'chat'
                  ? 'text-brand'
                  : 'text-cyan-700 dark:text-cyan-300'
                : 'text-muted hover:text-ink'
            }`}
          >
            {opt.icon}
            <span>{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
};
