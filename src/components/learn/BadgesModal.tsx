import React, { useState } from 'react';
import { X, Award, CheckCircle2, Lock, Sparkles, Share2 } from 'lucide-react';
import { LearnerBadge } from '../../types';
import { sounds } from '../../utils/soundEffects';
import confetti from 'canvas-confetti';

interface BadgesModalProps {
  isOpen: boolean;
  onClose: () => void;
  userBadges?: LearnerBadge[];
}

export const BadgesModal: React.FC<BadgesModalProps> = ({
  isOpen,
  onClose,
  userBadges = [],
}) => {
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'unlocked' | 'locked'>('all');
  const [selectedBadge, setSelectedBadge] = useState<LearnerBadge | null>(null);

  if (!isOpen) return null;

  const unlockedCount = userBadges.filter((b) => b.unlocked).length;
  const filteredBadges = userBadges.filter((b) => {
    if (selectedFilter === 'unlocked') return b.unlocked;
    if (selectedFilter === 'locked') return !b.unlocked;
    return true;
  });

  const handleBadgeClick = (badge: LearnerBadge) => {
    sounds.playTap();
    setSelectedBadge(badge);
    if (badge.unlocked) {
      confetti({
        particleCount: 25,
        spread: 40,
        origin: { y: 0.6 },
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in select-none">
      <div className="w-full max-w-md bg-white dark:bg-[#11222D] rounded-3xl p-5 shadow-2xl border border-stone-200 dark:border-white/10 space-y-4 max-h-[90vh] flex flex-col relative overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-stone-100 dark:border-white/5">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-2xl bg-amber-50 dark:bg-amber-950/70 text-amber-500 border border-amber-200 dark:border-amber-600/30 flex items-center justify-center font-bold text-lg shadow-2xs">
              🏅
            </div>
            <div>
              <h2 className="font-display font-black text-base text-stone-900 dark:text-white leading-tight">
                Learner Badges & Trophies
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                {unlockedCount} of {userBadges.length} achievements unlocked
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              sounds.playTap();
              onClose();
            }}
            className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-white/5 cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 p-1 bg-stone-100 dark:bg-stone-800/60 rounded-2xl text-xs font-bold">
          <button
            onClick={() => {
              sounds.playTap();
              setSelectedFilter('all');
            }}
            className={`flex-1 py-1.5 rounded-xl transition-all ${
              selectedFilter === 'all'
                ? 'bg-white dark:bg-[#152B37] text-stone-900 dark:text-white shadow-xs'
                : 'text-stone-500 hover:text-stone-900 dark:hover:text-white'
            }`}
          >
            All ({userBadges.length})
          </button>
          <button
            onClick={() => {
              sounds.playTap();
              setSelectedFilter('unlocked');
            }}
            className={`flex-1 py-1.5 rounded-xl transition-all ${
              selectedFilter === 'unlocked'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'text-stone-500 hover:text-stone-900 dark:hover:text-white'
            }`}
          >
            Unlocked ({unlockedCount})
          </button>
          <button
            onClick={() => {
              sounds.playTap();
              setSelectedFilter('locked');
            }}
            className={`flex-1 py-1.5 rounded-xl transition-all ${
              selectedFilter === 'locked'
                ? 'bg-white dark:bg-[#152B37] text-stone-900 dark:text-white shadow-xs'
                : 'text-stone-500 hover:text-stone-900 dark:hover:text-white'
            }`}
          >
            Locked ({userBadges.length - unlockedCount})
          </button>
        </div>

        {/* Badges Grid */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
          <div className="grid grid-cols-3 gap-2.5">
            {filteredBadges.map((badge) => {
              const isSelected = selectedBadge?.id === badge.id;
              return (
                <button
                  key={badge.id}
                  onClick={() => handleBadgeClick(badge)}
                  className={`flex flex-col items-center text-center p-3 rounded-2xl border transition-all cursor-pointer relative ${
                    badge.unlocked
                      ? isSelected
                        ? 'bg-teal-50 dark:bg-teal-950/40 border-teal-500 dark:border-teal-400 ring-2 ring-teal-500/20'
                        : 'bg-stone-50 dark:bg-[#152B37] border-stone-200/80 dark:border-white/10 hover:border-teal-300'
                      : 'bg-stone-100/60 dark:bg-stone-900/40 border-dashed border-stone-300 dark:border-white/10 opacity-70'
                  }`}
                >
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-inner mb-1.5 ${
                      badge.unlocked
                        ? 'bg-gradient-to-tr from-amber-100 to-amber-50 dark:from-amber-900/40 dark:to-amber-800/20 border border-amber-300/60 dark:border-amber-600/30'
                        : 'bg-stone-200 dark:bg-stone-800 text-stone-400 grayscale'
                    }`}
                  >
                    {badge.icon}
                  </div>

                  <span className="font-bold text-xs text-stone-900 dark:text-white line-clamp-1">
                    {badge.title}
                  </span>

                  <span className="text-[10px] text-stone-400 line-clamp-1 font-mono">
                    {badge.unlocked ? '✓ Unlocked' : `${badge.progressPercent}%`}
                  </span>

                  {!badge.unlocked && (
                    <div className="absolute top-2 right-2">
                      <Lock className="w-3 h-3 text-stone-400" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Selected Badge Detail Inspector */}
          {selectedBadge && (
            <div className="mt-3 p-4 rounded-2xl bg-stone-50 dark:bg-[#152B37] border border-stone-200 dark:border-white/10 space-y-2 animate-in fade-in">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center text-xl shrink-0">
                  {selectedBadge.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="font-display font-black text-sm text-stone-900 dark:text-white">
                    {selectedBadge.title}
                  </h4>
                  <p className="text-xs text-stone-500 dark:text-stone-300 leading-tight">
                    {selectedBadge.description}
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-stone-200/60 dark:border-white/5 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-stone-400 font-medium">Requirements:</span>
                  <span className="font-mono text-stone-700 dark:text-stone-300 font-bold">
                    {selectedBadge.criteria}
                  </span>
                </div>

                <div className="w-full bg-stone-200 dark:bg-stone-800 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      selectedBadge.unlocked ? 'bg-teal-500' : 'bg-amber-500'
                    }`}
                    style={{ width: `${selectedBadge.progressPercent}%` }}
                  />
                </div>

                {selectedBadge.unlocked && selectedBadge.unlockedDate && (
                  <p className="text-[10px] text-teal-600 dark:text-teal-400 font-mono font-bold text-right pt-0.5">
                    Conferred on {selectedBadge.unlockedDate}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-stone-100 dark:border-white/5 text-center">
          <p className="text-[11px] text-stone-400">
            Earn badges by practicing with SULTI, completing daily challenges & mastering vocabulary!
          </p>
        </div>
      </div>
    </div>
  );
};
