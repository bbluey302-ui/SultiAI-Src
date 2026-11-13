import React, { useState } from 'react';
import { Sparkles, MessageSquare, Volume2, ArrowRight, Brain } from 'lucide-react';
import { SultiRecommendation } from '../../types';
import { speakBisaya } from '../../utils/audio';
import { sounds } from '../../utils/soundEffects';

interface SultiRecommendationCardProps {
  recommendation?: SultiRecommendation;
  onPracticeWithSulti: (phrase: string) => void;
}

export const SultiRecommendationCard: React.FC<SultiRecommendationCardProps> = ({
  recommendation = {
    id: 'rec_market_bargain',
    title: 'Market Hesitation Detected',
    rationale: 'You understand most phrases but hesitate when speaking numbers and unit prices.',
    targetPhrase: 'Tagpila ni, Nang? Puyde hangyo?',
    targetPhraseEnglish: 'How much is this, ma\'am? Can I ask for a discount?',
    contextScenario: 'Inquiring about mango prices at Bankerohan Public Market',
    actionPrompt: 'Gusto kong magpraktis unsaon paghangyo sa merkado.',
  },
  onPracticeWithSulti,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlay = async (e: React.MouseEvent) => {
    e.stopPropagation();
    sounds.playTap();
    setIsPlaying(true);
    await speakBisaya(recommendation.targetPhrase);
    setIsPlaying(false);
  };

  const handleAction = () => {
    sounds.playTap();
    onPracticeWithSulti(recommendation.actionPrompt);
  };

  return (
    <div className="bg-gradient-to-br from-purple-50/70 via-white to-purple-50/40 dark:from-[#11222D] dark:via-[#132735] dark:to-purple-950/40 rounded-3xl p-5 border border-purple-200/80 dark:border-purple-500/30 shadow-xs space-y-3.5 relative overflow-hidden transition-all hover:shadow-sm">
      {/* Subtle purple aura glow in dark mode */}
      <div className="absolute top-0 right-0 w-36 h-36 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-purple-100/90 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border border-purple-200/60 dark:border-purple-500/30 flex items-center justify-center font-bold">
            <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-800 dark:text-purple-300 bg-purple-100/60 dark:bg-purple-950/80 border border-transparent dark:border-purple-500/30 px-2 py-0.5 rounded-md">
              Sulti's AI Recommendation
            </span>
          </div>
        </div>

        <span className="text-[10px] font-mono font-bold text-purple-700 dark:text-purple-300 bg-white dark:bg-[#11222D] border border-purple-200 dark:border-purple-500/30 px-2 py-0.5 rounded-full flex items-center gap-1 shadow-2xs">
          <Brain className="w-3 h-3 text-purple-500 dark:text-purple-400" />
          Adaptive NLP
        </span>
      </div>

      <div className="space-y-1 relative z-10">
        <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed font-normal">
          {recommendation.rationale}
        </p>
      </div>

      {/* Target Phrase Box */}
      <div className="bg-white dark:bg-[#152B37]/80 rounded-2xl p-3.5 border border-purple-100 dark:border-purple-500/20 shadow-2xs space-y-1.5 relative z-10">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold text-stone-400 dark:text-purple-300/70 uppercase tracking-wider font-mono">
              Target Speaking Drill
            </span>
            <div className="font-display font-black text-sm text-stone-900 dark:text-white leading-snug">
              "{recommendation.targetPhrase}"
            </div>
            <div className="text-xs text-stone-500 dark:text-stone-400 italic">
              {recommendation.targetPhraseEnglish}
            </div>
          </div>

          <button
            onClick={handlePlay}
            disabled={isPlaying}
            className={`p-2 rounded-xl text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/50 min-h-[38px] min-w-[38px] flex items-center justify-center transition-all cursor-pointer border border-transparent dark:border-purple-500/20 ${
              isPlaying ? 'bg-purple-100 dark:bg-purple-900/80 animate-pulse text-purple-900 dark:text-purple-100' : 'bg-purple-50/80 dark:bg-purple-950/60'
            }`}
            title="Hear native pronunciation"
          >
            <Volume2 className="w-4 h-4" />
          </button>
        </div>

        <div className="text-[11px] text-purple-900/80 dark:text-purple-200/90 pt-1 border-t border-purple-50 dark:border-purple-500/20 font-medium">
          💡 <span className="font-bold text-purple-950 dark:text-purple-100">Context:</span> {recommendation.contextScenario}
        </div>
      </div>

      {/* Action CTA */}
      <button
        onClick={handleAction}
        className="w-full min-h-[46px] bg-purple-700 hover:bg-purple-600 dark:bg-purple-600 dark:hover:bg-purple-500 text-white rounded-2xl text-xs font-black py-2.5 px-4 flex items-center justify-between transition-all btn-3d-dark cursor-pointer shadow-xs relative z-10"
      >
        <div className="flex items-center gap-1.5">
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Practice with Sulti Now</span>
        </div>
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
};
