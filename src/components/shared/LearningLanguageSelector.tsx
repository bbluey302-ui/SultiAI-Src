import React from 'react';
import { Check } from 'lucide-react';
import { LearningLanguage } from '../../utils/language';
import { sounds } from '../../utils/soundEffects';

export const LEARNING_LANGUAGE_OPTIONS: Array<{
  id: LearningLanguage;
  label: string;
  flag: string;
}> = [
  { id: 'cebuano', label: 'Bisaya', flag: '🇵🇭' },
  { id: 'filipino', label: 'Filipino', flag: '🇵🇭' },
  { id: 'english', label: 'English', flag: '🌎' },
];

interface LearningLanguageSelectorProps {
  value: LearningLanguage;
  onChange: (lang: LearningLanguage) => void;
  className?: string;
}

/**
 * Canonical Learning Language selector.
 *
 * Used by the Sulti AI dashboard, the Curriculum Hub, and the Language Journey
 * so all three surfaces share the same structure, labels, and behaviour.
 */
export const LearningLanguageSelector: React.FC<LearningLanguageSelectorProps> = ({
  value,
  onChange,
  className = '',
}) => {
  return (
    <section className={`space-y-1.5 ${className}`}>
      <div className="flex items-center justify-between gap-2 px-0.5">
        <span className="text-[9.5px] font-mono font-black uppercase tracking-wider text-muted">
          Learning language
        </span>
        <span className="text-[9.5px] font-medium text-muted">Tap to switch</span>
      </div>
      <div className="grid grid-cols-3 gap-1.5" role="group" aria-label="Learning language">
        {LEARNING_LANGUAGE_OPTIONS.map((lang) => {
          const active = lang.id === value;
          return (
            <button
              key={lang.id}
              type="button"
              onClick={() => {
                sounds.playTap();
                onChange(lang.id);
              }}
              aria-pressed={active}
              className={`min-h-[44px] px-2 rounded-xl text-[11.5px] font-bold border transition-all cursor-pointer active:scale-[0.98] flex items-center justify-center gap-1.5 ${
                active
                  ? 'bg-brand text-on-brand border-brand shadow-xs'
                  : 'bg-surface text-muted border-line hover:text-ink hover:border-brand/40'
              }`}
            >
              <span className="text-[13px] leading-none">{lang.flag}</span>
              <span>{lang.label}</span>
              {active && <Check className="w-3 h-3 shrink-0" />}
            </button>
          );
        })}
      </div>
    </section>
  );
};
