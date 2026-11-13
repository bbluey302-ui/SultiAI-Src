import React from 'react';
import { X, Check, Globe } from 'lucide-react';
import { TargetDialect } from '../types';

interface DialectModalProps {
  currentDialect: TargetDialect;
  onSelect: (dialect: TargetDialect) => void;
  onClose: () => void;
}

export const DialectModal: React.FC<DialectModalProps> = ({
  currentDialect,
  onSelect,
  onClose,
}) => {
  const dialects: { id: TargetDialect; name: string; region: string; description: string; sample: string }[] = [
    {
      id: 'davao_bisaya',
      name: 'Davao Bisaya',
      region: 'Southern Mindanao (Davao Region)',
      description: 'Widely spoken in Davao City. Features unique expressive discourse particles ("gud", "bitaw", "gani") and seamless colloquial blending.',
      sample: 'Asa ka mag-adto karon? Kaon tag durian!'
    },
    {
      id: 'cebuano_standard',
      name: 'Standard Cebuano',
      region: 'Central Visayas (Cebu, Negros Oriental)',
      description: 'The standard literary and educational variety of Cebuano with classic verbal morphology and rich traditional vocabulary.',
      sample: 'Asa ka moadto karon? Mangaon ta!'
    },
    {
      id: 'boholano',
      name: 'Boholano (Bol-anon)',
      region: 'Bohol Province',
      description: 'Known for distinct phonological features, where certain "y" sounds replace standard consonants (e.g. "iya" / "sija").',
      sample: 'Maajong buntag sa tanan!'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#11222D] rounded-3xl p-5 max-w-sm w-full space-y-4 shadow-2xl border border-stone-200 dark:border-white/10 transition-colors">
        <div className="flex items-center justify-between border-b border-stone-100 dark:border-white/10 pb-2">
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            <div>
              <h3 className="font-display font-bold text-sm text-stone-900 dark:text-white">
                Select Target Bisaya Variety
              </h3>
              <p className="text-[11px] text-stone-500 dark:text-stone-400">
                Tailors SULTI AI vocabulary & phrases
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 p-1 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-2">
          {dialects.map((d) => {
            const isSelected = currentDialect === d.id;

            return (
              <button
                key={d.id}
                onClick={() => {
                  onSelect(d.id);
                  onClose();
                }}
                className={`w-full p-3.5 rounded-2xl border text-left transition-all cursor-pointer glass-touch ${
                  isSelected
                    ? 'bg-teal-50 dark:bg-teal-950/70 border-teal-500 text-teal-950 dark:text-teal-200 shadow-sm ring-2 ring-teal-500/30'
                    : 'bg-stone-50 dark:bg-stone-800/60 border-stone-200 dark:border-white/10 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700/60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-stone-900 dark:text-white">{d.name}</span>
                  {isSelected && <Check className="w-4 h-4 text-teal-600 dark:text-teal-400" />}
                </div>
                <div className="text-[10px] text-teal-700 dark:text-teal-300 font-semibold">{d.region}</div>
                <p className="text-[11px] text-stone-600 dark:text-stone-400 mt-1 leading-normal">
                  {d.description}
                </p>
                <div className="text-[10px] font-mono text-stone-500 dark:text-stone-400 mt-1 italic">
                  "{d.sample}"
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
