import React from 'react';
import { X, Award, CheckCircle2, Mic, Bot, Sparkles, Clock, ShieldCheck, Zap } from 'lucide-react';
import { sounds } from '../../utils/soundEffects';

interface SubscriptionUsageModalProps {
  onClose: () => void;
}

export const SubscriptionUsageModal: React.FC<SubscriptionUsageModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md bg-white dark:bg-[#11222D] rounded-3xl border border-stone-200 dark:border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        role="dialog"
        aria-labelledby="subscription-title"
      >
        {/* Header */}
        <div className="p-4 border-b border-stone-200/80 dark:border-white/10 flex items-center justify-between bg-stone-50/50 dark:bg-stone-900/40">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-teal-50 dark:bg-teal-950/70 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <h2 id="subscription-title" className="font-display font-black text-sm text-stone-900 dark:text-white">
                Subscription & Usage Quotas
              </h2>
              <p className="text-[10px] text-stone-500 dark:text-stone-400">
                Transparent entitlement and AI session limits
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              sounds.playTap();
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-500 hover:text-stone-900 dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* Active Tier Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-teal-500/15 via-emerald-500/10 to-transparent border border-teal-500/30 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-teal-700 dark:text-teal-300">
                Active Plan Tier
              </span>
              <span className="text-[9.5px] font-mono font-bold bg-teal-500 text-stone-950 px-2 py-0.5 rounded-full">
                Active / Scholar
              </span>
            </div>
            <h3 className="font-display font-black text-base text-stone-900 dark:text-white">
              SultiAI Scholar Plan
            </h3>
            <p className="text-xs text-stone-600 dark:text-stone-300 leading-tight">
              Full premium access granted: unlimited lesson modules, conversational roleplays, and daily AI voice practice sessions.
            </p>
          </div>

          {/* Real Usage Entitlements Breakdown */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-black text-stone-900 dark:text-white uppercase tracking-wider font-mono">
              Entitlements & Live Limits
            </h4>

            {/* Feature 1: AI Voice Agent Sessions */}
            <div className="p-3 bg-stone-50 dark:bg-stone-800/60 rounded-2xl border border-stone-200/80 dark:border-white/5 space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mic className="w-4 h-4 text-teal-500" />
                  <span className="font-display font-black text-xs text-stone-900 dark:text-white">
                    Live AI Voice Coach Practice
                  </span>
                </div>
                <span className="text-[10px] font-mono font-bold text-teal-600 dark:text-teal-400">
                  2 min / session
                </span>
              </div>
              <p className="text-[10.5px] text-stone-500 dark:text-stone-400 leading-tight">
                Free speaking drills are strictly capped at 120 seconds per session on the server to prevent fatigue and support acoustic evaluation.
              </p>
            </div>

            {/* Feature 2: Multi-turn Chat Agent */}
            <div className="p-3 bg-stone-50 dark:bg-stone-800/60 rounded-2xl border border-stone-200/80 dark:border-white/5 space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bot className="w-4 h-4 text-indigo-500" />
                  <span className="font-display font-black text-xs text-stone-900 dark:text-white">
                    Conversational Roleplay
                  </span>
                </div>
                <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  Unlimited
                </span>
              </div>
              <p className="text-[10.5px] text-stone-500 dark:text-stone-400 leading-tight">
                Unlimited text roleplays with mBERT intent classification and Google Search / Maps grounding.
              </p>
            </div>

            {/* Feature 3: Curriculum Modules */}
            <div className="p-3 bg-stone-50 dark:bg-stone-800/60 rounded-2xl border border-stone-200/80 dark:border-white/5 space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span className="font-display font-black text-xs text-stone-900 dark:text-white">
                    13 Toolkit Learning Modules
                  </span>
                </div>
                <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  100% Unlocked
                </span>
              </div>
              <p className="text-[10.5px] text-stone-500 dark:text-stone-400 leading-tight">
                All grammar, flashcard decks, phrasebook entries, and cultural notes are fully available.
              </p>
            </div>
          </div>

          {/* Honest Monetization Disclosure */}
          <div className="p-3 bg-stone-100 dark:bg-stone-900/60 rounded-2xl border border-stone-200 dark:border-white/5 text-[10px] text-stone-500 dark:text-stone-400 leading-normal">
            💡 <strong>Tier Transparency:</strong> SultiAI does not charge learners or store credit cards. The application is developed as open educational technology for non-native Bisaya speakers.
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-stone-200/80 dark:border-white/10 flex items-center justify-end bg-stone-50/50 dark:bg-stone-900/40">
          <button
            onClick={() => {
              sounds.playTap();
              onClose();
            }}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-teal-500 hover:bg-teal-400 text-stone-950 shadow-md transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
