import React from 'react';
import { Mic, Brain, MessageSquare } from 'lucide-react';
import { sounds } from '../../utils/soundEffects';

interface QuickPracticeRowProps {
  onStartVoice: () => void;
  onStartVocabulary: () => void;
  onStartChat: () => void;
  voiceLevel?: number;
  voiceBadgesCount?: number;
}

export const QuickPracticeRow: React.FC<QuickPracticeRowProps> = ({
  onStartVoice,
  onStartVocabulary,
  onStartChat,
  voiceLevel = 1,
  voiceBadgesCount = 0,
}) => {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="font-display font-extrabold uppercase tracking-wider text-stone-500 dark:text-stone-400 text-[11px]">
          START PRACTICE
        </span>
        <span className="text-[10px] text-stone-400 dark:text-stone-500 font-medium">Fast 3-5 min drills</span>
      </div>

      {/* Core Daily Drills */}
      <div className="grid grid-cols-3 gap-2">
        {/* Action 1: Speaking Practice (Voice Gamification Path & Badges) */}
        <button
          onClick={() => {
            sounds.playTap();
            onStartVoice();
          }}
          className="p-3 bg-white dark:bg-[#11222D] hover:bg-stone-50 dark:hover:bg-[#152B37] rounded-2xl border border-blue-300 dark:border-blue-500/40 text-left transition-all active:scale-[0.97] cursor-pointer shadow-xs group flex flex-col justify-between min-h-[96px] relative overflow-hidden"
        >
          {/* Subtle Accent Glow */}
          <div className="absolute top-0 right-0 w-12 h-12 bg-blue-500/10 dark:bg-blue-400/15 rounded-full blur-xl pointer-events-none" />

          <div className="flex items-start justify-between w-full">
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 border border-blue-200/50 dark:border-blue-500/30 flex items-center justify-center font-bold group-hover:scale-105 transition-transform shadow-2xs">
              <Mic className="w-4 h-4" />
            </div>
            <span className="text-[8px] font-black uppercase font-mono px-1.5 py-0.5 rounded-md bg-gradient-to-r from-teal-600 to-cyan-600 text-white shadow-2xs tracking-wider">
              City Map
            </span>
          </div>

          <div className="mt-1.5">
            <div className="font-display font-black text-xs text-stone-900 dark:text-white leading-tight flex items-center gap-1">
              <span>Speaking City</span>
            </div>
            <div className="text-[9.5px] text-teal-600 dark:text-teal-400 font-bold mt-0.5 flex items-center gap-1">
              <span>5 Destinations</span>
            </div>
            <div className="text-[9px] text-stone-400 dark:text-stone-500 font-mono font-medium">
              Bisaya · Filipino
            </div>
          </div>
        </button>

        {/* Action 2: Vocabulary & Words */}
        <button
          onClick={() => {
            sounds.playTap();
            onStartVocabulary();
          }}
          className="p-3 bg-white dark:bg-[#11222D] hover:bg-stone-50 dark:hover:bg-[#152B37] rounded-2xl border border-stone-200/90 dark:border-white/10 text-left transition-all active:scale-[0.97] cursor-pointer shadow-2xs group flex flex-col justify-between min-h-[92px]"
        >
          <div className="w-8 h-8 rounded-xl bg-teal-50 dark:bg-teal-950/70 text-teal-600 dark:text-teal-400 border border-transparent dark:border-teal-500/20 flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
            <Brain className="w-4 h-4" />
          </div>
          <div>
            <div className="font-display font-black text-xs text-stone-900 dark:text-white leading-tight">
              Words
            </div>
            <div className="text-[10px] text-stone-500 dark:text-stone-400 font-medium mt-0.5">
              3 min flashcards
            </div>
          </div>
        </button>

        {/* Action 3: Sulti AI Chat */}
        <button
          onClick={() => {
            sounds.playTap();
            onStartChat();
          }}
          className="p-3 bg-white dark:bg-[#11222D] hover:bg-stone-50 dark:hover:bg-[#152B37] rounded-2xl border border-stone-200/90 dark:border-white/10 text-left transition-all active:scale-[0.97] cursor-pointer shadow-2xs group flex flex-col justify-between min-h-[92px]"
        >
          <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/70 text-purple-600 dark:text-purple-400 border border-transparent dark:border-purple-500/20 flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <div className="font-display font-black text-xs text-stone-900 dark:text-white leading-tight">
              Sulti Chat
            </div>
            <div className="text-[10px] text-stone-500 dark:text-stone-400 font-medium mt-0.5">
              AI companion
            </div>
          </div>
        </button>
      </div>
    </div>
  );
};
