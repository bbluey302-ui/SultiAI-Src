import React from 'react';
import { Check, Languages, Mic, Radio, X } from 'lucide-react';
import { sounds } from '../../utils/soundEffects';
import {
  updateAiPreferences,
  useAiPreferences,
  type VoiceReplyMode,
} from '../../services/aiPreferences';

interface AgentSettingsSheetProps {
  onClose: () => void;
}

const REPLY_MODES: {
  id: VoiceReplyMode;
  label: string;
  description: string;
  icon: React.ReactNode;
}[] = [
  {
    id: 'auto',
    label: 'Auto-detect my voice',
    description: 'The coach replies as soon as you stop talking. Hands-free.',
    icon: <Radio className="w-4 h-4" />,
  },
  {
    id: 'confirm',
    label: 'Confirm before sending',
    description: 'You see what was heard, then tap Send. Best on noisy rooms.',
    icon: <Mic className="w-4 h-4" />,
  },
];

export const AgentSettingsSheet: React.FC<AgentSettingsSheetProps> = ({ onClose }) => {
  const preferences = useAiPreferences();

  const chooseReplyMode = (mode: VoiceReplyMode) => {
    sounds.playTap();
    updateAiPreferences({ voiceReplyMode: mode });
  };

  const toggleBilingual = () => {
    sounds.playTap();
    updateAiPreferences({ bilingualReplies: !preferences.bilingualReplies });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
      <div className="w-full max-w-md bg-white dark:bg-[#11222D] rounded-t-3xl sm:rounded-3xl border border-stone-200 dark:border-white/15 p-4 sm:p-5 space-y-4 shadow-2xl max-h-[92vh] overflow-y-auto">
        <div className="flex items-start justify-between gap-3 pb-2 border-b border-stone-200 dark:border-white/10">
          <div>
            <h3 className="font-display font-black text-sm text-stone-900 dark:text-white">
              Voice &amp; Coach Settings
            </h3>
            <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
              Saved on this device and applied to every coach.
            </p>
          </div>
          <button
            onClick={() => {
              sounds.playTap();
              onClose();
            }}
            aria-label="Close settings"
            className="shrink-0 w-8 h-8 rounded-full bg-stone-100 dark:bg-white/10 text-stone-500 hover:text-stone-900 dark:hover:text-white flex items-center justify-center cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Reply mode */}
        <section className="space-y-2">
          <div>
            <h4 className="text-xs font-bold text-stone-900 dark:text-white">
              How should the coach reply?
            </h4>
            <p className="text-[10.5px] text-stone-500 dark:text-stone-400">
              Controls voice sessions. Chat is always tap-to-send.
            </p>
          </div>

          <div className="space-y-1.5">
            {REPLY_MODES.map((mode) => {
              const active = preferences.voiceReplyMode === mode.id;
              return (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => chooseReplyMode(mode.id)}
                  aria-pressed={active}
                  className={`w-full text-left p-3 rounded-2xl border transition-all cursor-pointer flex items-start gap-2.5 ${
                    active
                      ? 'bg-cyan-50 dark:bg-cyan-950/60 border-cyan-500 ring-1 ring-cyan-500/30'
                      : 'bg-stone-50 dark:bg-black/30 border-stone-200 dark:border-white/10 hover:border-cyan-400'
                  }`}
                >
                  <span
                    className={`shrink-0 w-8 h-8 rounded-xl flex items-center justify-center ${
                      active
                        ? 'bg-cyan-600 text-white'
                        : 'bg-stone-200 dark:bg-white/10 text-stone-600 dark:text-stone-300'
                    }`}
                  >
                    {mode.icon}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs font-black text-stone-900 dark:text-white">
                      {mode.label}
                    </span>
                    <span className="block text-[10.5px] text-stone-500 dark:text-stone-400 leading-snug mt-0.5">
                      {mode.description}
                    </span>
                  </span>
                  {active && <Check className="w-4 h-4 text-cyan-500 shrink-0 mt-1" />}
                </button>
              );
            })}
          </div>
        </section>

        {/* Bilingual */}
        <section className="space-y-2">
          <h4 className="text-xs font-bold text-stone-900 dark:text-white flex items-center gap-1.5">
            <Languages className="w-4 h-4 text-teal-500" />
            Bilingual coaching
          </h4>

          <button
            type="button"
            role="switch"
            aria-checked={preferences.bilingualReplies}
            onClick={toggleBilingual}
            className={`w-full p-3 rounded-2xl border transition-all cursor-pointer flex items-center gap-3 ${
              preferences.bilingualReplies
                ? 'bg-teal-50 dark:bg-teal-950/50 border-teal-500'
                : 'bg-stone-50 dark:bg-black/30 border-stone-200 dark:border-white/10'
            }`}
          >
            <span className="min-w-0 flex-1 text-left">
              <span className="block text-xs font-black text-stone-900 dark:text-white">
                Speak Bisaya, then English
              </span>
              <span className="block text-[10.5px] text-stone-500 dark:text-stone-400 leading-snug mt-0.5">
                The coach speaks the target language, then its English translation, and
                shows key words with meanings.
              </span>
            </span>
            <span
              className={`shrink-0 w-11 h-6 rounded-full p-0.5 transition-colors ${
                preferences.bilingualReplies ? 'bg-teal-600' : 'bg-stone-300 dark:bg-white/20'
              }`}
            >
              <span
                className={`block w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                  preferences.bilingualReplies ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </span>
          </button>

          <p className="text-[10px] text-stone-500 dark:text-stone-400 leading-relaxed px-0.5">
            Turn it off if you want full immersion in Bisaya, Filipino, or English only.
          </p>
        </section>

        <button
          onClick={() => {
            sounds.playTap();
            onClose();
          }}
          className="w-full min-h-[44px] rounded-2xl bg-stone-900 dark:bg-white text-white dark:text-stone-900 font-display font-black text-xs cursor-pointer active:scale-98 transition-all"
        >
          Done
        </button>
      </div>
    </div>
  );
};
