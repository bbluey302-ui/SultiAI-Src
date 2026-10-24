import React from 'react';
import { Globe } from 'lucide-react';
import { sounds } from '../../utils/soundEffects';

export type LearningLanguage = 'cebuano' | 'filipino' | 'english';

interface LanguageSelectorProps {
  value: LearningLanguage;
  onChange: (lang: LearningLanguage) => void;
}

const LANGUAGES: Array<{ id: LearningLanguage; label: string; flag: string }> = [
  { id: 'cebuano', label: 'Cebuano / Bisaya', flag: '????' },
  { id: 'filipino', label: 'Filipino / Tagalog', flag: '????' },
  { id: 'english', label: 'English', flag: '????' },
];

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({ value, onChange }) => {
  return (
    <div className="flex items-center gap-2">
      <Globe className="w-4 h-4 text-stone-500" />
      <select
        value={value}
        onChange={(e) => {
          sounds.playTap();
          onChange(e.target.value as LearningLanguage);
          if (typeof window !== 'undefined') {
            localStorage.setItem('sultiai_selected_language', e.target.value);
          }
        }}
        className="text-xs font-bold bg-white dark:bg-[#11222D] border border-stone-200 dark:border-white/10 rounded-xl px-2 py-1.5"
      >
        {LANGUAGES.map((lang) => (
          <option key={lang.id} value={lang.id}>
            {lang.flag} {lang.label}
          </option>
        ))}
      </select>
    </div>
  );
};
