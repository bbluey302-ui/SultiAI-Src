import React from 'react';
import { X, Lock, Unlock, CheckCircle2, Circle, AlertCircle, ArrowRight, Sparkles } from 'lucide-react';
import { JourneyLevel } from '../../types';
import { sounds } from '../../utils/soundEffects';

interface LevelMasteryModalProps {
  isOpen: boolean;
  level: JourneyLevel | null;
  onClose: () => void;
  onStartPrerequisiteLesson?: () => void;
}

export const LevelMasteryModal: React.FC<LevelMasteryModalProps> = ({
  isOpen,
  level,
  onClose,
  onStartPrerequisiteLesson,
}) => {
  if (!isOpen || !level) return null;

  const requirements = level.unlockRequirements || [];
  const allMet = requirements.length > 0 && requirements.every((r) => r.completed);

  const handleUnlockClick = () => {
    sounds.playTap();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in select-none">
      <div className="w-full max-w-sm bg-white dark:bg-[#11222D] rounded-3xl p-6 shadow-2xl border border-stone-200 dark:border-white/10 space-y-4 text-center relative overflow-hidden">
        
        {/* Close Button */}
        <button
          onClick={() => {
            sounds.playTap();
            onClose();
          }}
          className="absolute top-4 right-4 p-1 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-white cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Lock / Unlock Icon Header */}
        <div className="mx-auto w-16 h-16 rounded-3xl flex items-center justify-center text-3xl shadow-inner transition-transform duration-300 transform hover:scale-105 border">
          {allMet ? (
            <div className="w-full h-full rounded-3xl bg-teal-50 dark:bg-teal-950/80 border-teal-300 dark:border-teal-700 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <Unlock className="w-8 h-8 animate-bounce" />
            </div>
          ) : (
            <div className="w-full h-full rounded-3xl bg-amber-50 dark:bg-amber-950/80 border-amber-300 dark:border-amber-700 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Lock className="w-8 h-8" />
            </div>
          )}
        </div>

        {/* Title */}
        <div className="space-y-1">
          <span className="text-[11px] font-mono font-black uppercase tracking-wider text-teal-800 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/80 px-2.5 py-0.5 rounded-full border border-teal-200 dark:border-teal-700">
            {level.code} UNLOCK REQUIREMENTS
          </span>
          <h3 className="font-display font-black text-xl text-stone-900 dark:text-white pt-1">
            {level.icon} {level.title}
          </h3>
          <p className="text-xs text-stone-500 dark:text-stone-400">
            {level.subtitle}
          </p>
        </div>

        {/* Checklist */}
        <div className="bg-stone-50 dark:bg-[#152B37] rounded-2xl p-4 border border-stone-200/90 dark:border-white/10 text-left space-y-2.5 font-mono text-xs">
          {requirements.map((req) => (
            <div
              key={req.id}
              className={`flex items-start gap-2.5 p-2 rounded-xl transition-colors ${
                req.completed
                  ? 'bg-teal-50/70 dark:bg-teal-950/40 text-teal-950 dark:text-teal-200'
                  : 'bg-stone-100/60 dark:bg-stone-800/40 text-stone-600 dark:text-stone-300'
              }`}
            >
              {req.completed ? (
                <CheckCircle2 className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
              ) : (
                <Circle className="w-4 h-4 text-stone-400 shrink-0 mt-0.5" />
              )}
              <div className="flex-1 leading-snug">
                <span className={req.completed ? 'font-bold' : 'font-medium'}>
                  {req.label}
                </span>
                <div className="text-[10px] text-stone-400 font-normal">
                  Progress: {req.currentCount} / {req.targetCount}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Action Button */}
        {allMet ? (
          <button
            onClick={handleUnlockClick}
            className="w-full py-3.5 px-4 bg-teal-600 hover:bg-teal-500 active:scale-98 text-white rounded-2xl font-display font-black text-sm shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            <Sparkles className="w-4 h-4" />
            <span>🔓 Continue to {level.code}</span>
          </button>
        ) : (
          <div className="space-y-2">
            <button
              onClick={() => {
                sounds.playTap();
                onClose();
                if (onStartPrerequisiteLesson) {
                  onStartPrerequisiteLesson();
                }
              }}
              className="w-full py-3 px-4 bg-stone-900 dark:bg-white text-white dark:text-stone-900 hover:opacity-90 active:scale-98 rounded-2xl font-display font-black text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-sm transition-all"
            >
              <span>Practice to Meet Requirements</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <p className="text-[10px] text-stone-400">
              Complete remaining exercises and voice drills to unlock this level!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
