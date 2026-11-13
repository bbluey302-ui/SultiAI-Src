import React, { useState } from 'react';
import { X, HelpCircle, ChevronDown, ChevronUp, AlertCircle, Send, Check, Mic, Volume2, Shield, Info } from 'lucide-react';
import { sounds } from '../../utils/soundEffects';
import { addNotification } from '../../utils/notificationService';

interface HelpSupportModalProps {
  onClose: () => void;
}

export const HelpSupportModal: React.FC<HelpSupportModalProps> = ({ onClose }) => {
  const [activeFaq, setActiveFaq] = useState<number | null>(0);
  const [feedbackCategory, setFeedbackCategory] = useState<'audio' | 'speech' | 'content' | 'other'>('speech');
  const [feedbackText, setFeedbackText] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const faqs = [
    {
      q: 'Which regional dialect does SultiAI focus on?',
      a: 'SultiAI supports Davao Bisaya (Mindanao urban dialect with particles like bitaw, gud, and lagi), Standard Cebuano (Central Visayas), and Boholano. You can switch between them anytime in Learning Preferences.',
    },
    {
      q: 'How does the Whisper AI speech concordance score work?',
      a: 'When you speak, our speech recognition pipeline measures your spoken words against ground-truth Visayan acoustic targets. It computes Word Error Rate (WER) and gives you phoneme intonation feedback.',
    },
    {
      q: 'Why are free voice practice sessions limited to 2 minutes?',
      a: 'The 2-minute session duration is calibrated for focused, high-retention conversational drills without cognitive overload, while ensuring responsive server evaluation for all student learners.',
    },
    {
      q: 'Can I use SultiAI offline?',
      a: 'Yes! Core flashcards, phrasebooks, curriculum roadmaps, and local audio recordings work seamlessly offline using cached application state.',
    },
  ];

  const handleSubmitFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackText.trim()) return;

    sounds.playTap();
    setSubmitted(true);

    addNotification({
      category: 'system',
      title: '📩 Feedback Received',
      titleBisaya: 'Nadawat ang Imong Report',
      message: 'Thank you! Your feedback has been logged for the research development team.',
      iconType: 'sparkles',
    });

    sounds.playCorrect();
    setTimeout(() => {
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md bg-white dark:bg-[#11222D] rounded-3xl border border-stone-200 dark:border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        role="dialog"
        aria-labelledby="help-title"
      >
        {/* Header */}
        <div className="p-4 border-b border-stone-200/80 dark:border-white/10 flex items-center justify-between bg-stone-50/50 dark:bg-stone-900/40">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-teal-50 dark:bg-teal-950/70 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold">
              <HelpCircle className="w-4 h-4" />
            </div>
            <div>
              <h2 id="help-title" className="font-display font-black text-sm text-stone-900 dark:text-white">
                Help & Support Center
              </h2>
              <p className="text-[10px] text-stone-500 dark:text-stone-400">
                FAQs, acoustic troubleshooting & feedback
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
          {/* Section 1: FAQs */}
          <div className="space-y-2">
            <h3 className="text-xs font-black text-stone-900 dark:text-white uppercase tracking-wider font-mono">
              Frequently Asked Questions
            </h3>
            <div className="space-y-1.5">
              {faqs.map((faq, idx) => {
                const isOpen = activeFaq === idx;
                return (
                  <div
                    key={idx}
                    className="p-3 bg-stone-50 dark:bg-stone-800/60 rounded-2xl border border-stone-200/80 dark:border-white/5 transition-colors"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        sounds.playTap();
                        setActiveFaq(isOpen ? null : idx);
                      }}
                      className="w-full flex items-center justify-between text-left cursor-pointer"
                    >
                      <span className="font-display font-bold text-xs text-stone-900 dark:text-white pr-2">
                        {faq.q}
                      </span>
                      {isOpen ? (
                        <ChevronUp className="w-3.5 h-3.5 text-teal-500 shrink-0" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                      )}
                    </button>
                    {isOpen && (
                      <p className="text-[11px] text-stone-600 dark:text-stone-300 mt-2 pt-2 border-t border-stone-200/60 dark:border-white/5 leading-relaxed">
                        {faq.a}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 2: Troubleshooting Microphone & Audio */}
          <div className="p-3.5 bg-stone-50 dark:bg-stone-800/60 rounded-2xl border border-stone-200/80 dark:border-white/5 space-y-2">
            <h3 className="font-display font-black text-xs text-stone-900 dark:text-white flex items-center gap-1.5">
              <Mic className="w-3.5 h-3.5 text-teal-500" />
              Microphone Troubleshooting
            </h3>
            <div className="text-[10.5px] text-stone-500 dark:text-stone-400 space-y-1 leading-normal">
              <p>• If voice recording does not start, verify that microphone access is allowed in your browser permissions bar.</p>
              <p>• Speak clearly into the microphone at a normal conversational volume for accurate acoustic concordance.</p>
            </div>
          </div>

          {/* Section 3: Feedback & Report Form */}
          <div className="p-3.5 bg-teal-50/50 dark:bg-teal-950/30 rounded-2xl border border-teal-200/80 dark:border-teal-500/20 space-y-2.5">
            <h3 className="font-display font-black text-xs text-stone-900 dark:text-white flex items-center gap-1.5">
              <Send className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              Report an Issue or Send Feedback
            </h3>

            {submitted ? (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl text-xs text-emerald-800 dark:text-emerald-200 flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Thank you! Your feedback has been received.</span>
              </div>
            ) : (
              <form onSubmit={handleSubmitFeedback} className="space-y-2">
                <div className="grid grid-cols-4 gap-1.5 text-center">
                  {[
                    { id: 'speech', label: 'Speech' },
                    { id: 'audio', label: 'Audio' },
                    { id: 'content', label: 'Lessons' },
                    { id: 'other', label: 'Other' },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setFeedbackCategory(cat.id as any)}
                      className={`py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                        feedbackCategory === cat.id
                          ? 'bg-teal-600 text-white font-black'
                          : 'bg-stone-200 dark:bg-stone-700 text-stone-600 dark:text-stone-300'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                <textarea
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder="Describe your issue or suggestion..."
                  rows={2}
                  className="w-full bg-white dark:bg-stone-900 border border-stone-200 dark:border-white/10 rounded-xl p-2.5 text-xs text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                />

                <button
                  type="submit"
                  disabled={!feedbackText.trim()}
                  className="w-full py-2 bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-stone-950 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Report</span>
                </button>
              </form>
            )}
          </div>

          {/* App Version & Credits */}
          <div className="p-3 bg-stone-100 dark:bg-stone-900/60 rounded-2xl border border-stone-200 dark:border-white/5 text-[10px] text-stone-500 dark:text-stone-400 space-y-0.5">
            <div className="font-bold text-stone-700 dark:text-stone-300">
              SultiAI v2.2.0 (Language Learning Platform)
            </div>
            <div>Companion: AI Bisaya & Regional Philippine Dialect Hub</div>
            <div>Built for immersive, conversational fluency</div>
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
