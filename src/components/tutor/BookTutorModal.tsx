import React, { useState } from 'react';
import { 
  X, CheckCircle2, ShieldCheck, MapPin, Calendar, Clock, 
  MessageSquare, ExternalLink, Sparkles, Send, Star, User,
  DollarSign, Check, Info, FileText
} from 'lucide-react';
import { Tutor, saveTutorBooking } from '../../data/tutorsData';
import { LinkedInIcon } from './LinkedInIcon';
import { sounds } from '../../utils/soundEffects';
import { addNotification } from '../../utils/notificationService';

interface BookTutorModalProps {
  tutor: Tutor | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccessBooking?: () => void;
}

export const BookTutorModal: React.FC<BookTutorModalProps> = ({
  tutor,
  isOpen,
  onClose,
  onSuccessBooking,
}) => {
  const [learnerName, setLearnerName] = useState('');
  const [learnerContact, setLearnerContact] = useState('');
  const [learnerLinkedin, setLearnerLinkedin] = useState('');
  const [topic, setTopic] = useState('Everyday Conversation & Pronunciation');
  const [preferredTime, setPreferredTime] = useState('Weekend Morning (9:00 AM - 11:00 AM)');
  const [sessionDuration, setSessionDuration] = useState<number>(60);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  if (!isOpen || !tutor) return null;

  // Transparent Platform Fee Breakdown (SultiAI Monetization Architecture)
  const baseTutorFee = Math.round((tutor.hourlyRatePhp * sessionDuration) / 60);
  const platformFee = Math.round(baseTutorFee * 0.15); // 15% platform fee for AI study sync & escrow
  const totalSessionCost = baseTutorFee + platformFee;

  const TOPIC_PRESETS = [
    'Everyday Conversation & Pronunciation',
    'Palengke, Commuting & Real Life Practice',
    'Grammar & Sentence Construction',
    'Relocation / Living in the Visayas',
    'Tagalog / Bisaya Differences & Nuances',
  ];

  const handleOpenLinkedinDirectly = () => {
    sounds.playTap();
    window.open(tutor.linkedinUrl, '_blank', 'noopener,noreferrer');
  };

  const handleSendBooking = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    sounds.playTap();

    setTimeout(() => {
      saveTutorBooking({
        tutorId: tutor.id,
        tutorName: tutor.name,
        tutorLinkedin: tutor.linkedinUrl,
        learnerName: learnerName.trim() || 'Learner',
        learnerContact: learnerContact.trim() || 'In-App Booking',
        learnerLinkedin: learnerLinkedin.trim(),
        topic,
        preferredTime,
        sessionMinutes: sessionDuration,
        ratePhp: totalSessionCost,
        platformFeePhp: platformFee,
        tutorPayoutPhp: baseTutorFee,
        bookingType: 'sulti_platform',
        notes: notes.trim(),
      });

      sounds.playCorrect();
      setIsSubmitting(false);
      setBookingSuccess(true);

      addNotification({
        category: 'admin',
        title: `📬 Booking Request Sent to ${tutor.name}!`,
        titleBisaya: `Gipadala ang Hangyo sa Klase kang ${tutor.name}`,
        message: `Session booked: "${topic}" (${sessionDuration} mins · ₱${totalSessionCost}). Tutor payout: ₱${baseTutorFee}, Platform fee: ₱${platformFee}. AI Notes Sync is active.`,
        actionLabel: 'View Schedule',
        actionType: 'learn',
        iconType: 'check',
      });

      onSuccessBooking?.();
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#11222D] rounded-3xl w-full max-w-lg max-h-[92vh] flex flex-col shadow-2xl border border-stone-200 dark:border-white/10 overflow-hidden">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-stone-100 dark:border-white/10 flex items-center justify-between bg-stone-50/70 dark:bg-stone-800/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-600 text-white font-black flex items-center justify-center font-display text-sm shrink-0 shadow-xs">
              {tutor.avatarInitials}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="font-display font-black text-sm text-stone-900 dark:text-white truncate">
                  {tutor.name}
                </h3>
                {tutor.academicVetted && (
                  <span title="SultiAI Academic Vetted">
                    <ShieldCheck className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                  </span>
                )}
              </div>
              <p className="text-[11px] text-teal-700 dark:text-teal-300 font-semibold truncate">
                {tutor.languageLabel} Specialist · ₱{tutor.hourlyRatePhp}/hr
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              sounds.playTap();
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-500 dark:text-stone-300 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          
          {bookingSuccess ? (
            <div className="py-4 space-y-4 text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center border-2 border-emerald-500/40 shadow-inner">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <div className="space-y-1">
                <h4 className="font-display font-black text-lg text-stone-900 dark:text-white">
                  Na-save ang Imong Booking sa SultiAI! 📬
                </h4>
                <p className="text-xs text-stone-600 dark:text-stone-300 max-w-sm mx-auto leading-relaxed">
                  Gipadala na ang imong session schedule kang <strong>{tutor.name}</strong>. Ang tanang bag-ong pulong nga inyong hisgutan i-sync sa imong <strong>Vocabulary Notebook</strong> ug <strong>Pronunciation Lab</strong>.
                </p>
              </div>

              {/* Booking receipt with clear fee breakdown */}
              <div className="p-4 bg-stone-50 dark:bg-stone-800/60 rounded-2xl border border-stone-200 dark:border-white/10 text-left space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-stone-500 dark:text-stone-400">Gipili nga Hilisgutan:</span>
                  <span className="font-bold text-stone-800 dark:text-stone-200">{topic}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-stone-500 dark:text-stone-400">Gidugayon:</span>
                  <span className="font-bold text-stone-800 dark:text-stone-200">{sessionDuration} ka minuto</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-stone-500 dark:text-stone-400">Oras:</span>
                  <span className="font-bold text-stone-800 dark:text-stone-200">{preferredTime}</span>
                </div>

                <div className="pt-2 border-t border-stone-200 dark:border-white/10 space-y-1 text-[11px]">
                  <div className="flex justify-between text-stone-500">
                    <span>Tutor Payout ({sessionDuration}m):</span>
                    <span>₱{baseTutorFee}</span>
                  </div>
                  <div className="flex justify-between text-stone-500">
                    <span>SultiAI AI Sync & Platform Fee (15%):</span>
                    <span>₱{platformFee}</span>
                  </div>
                  <div className="flex justify-between font-bold text-stone-900 dark:text-white pt-1 border-t border-stone-200/50">
                    <span>Total Session Cost:</span>
                    <span className="font-mono text-teal-600 font-black">₱{totalSessionCost}</span>
                  </div>
                </div>
              </div>

              {/* Optional external LinkedIn check */}
              <div className="p-3 bg-blue-50/50 dark:bg-blue-950/30 rounded-2xl border border-blue-200/60 dark:border-blue-700/30 text-left flex items-center justify-between">
                <div className="text-[11px] text-stone-600 dark:text-stone-300">
                  <span className="font-semibold text-stone-900 dark:text-white block">LinkedIn Profile:</span>
                  <span>Gusto ka motan-aw sa propesyonal nga profile ni {tutor.name.split(' ')[0]}?</span>
                </div>
                <button
                  onClick={handleOpenLinkedinDirectly}
                  className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-stone-800 text-[#0A66C2] border border-[#0A66C2]/30 text-[11px] font-bold flex items-center gap-1 shrink-0 cursor-pointer hover:bg-stone-50"
                >
                  <LinkedInIcon className="w-3 h-3 fill-[#0A66C2]" />
                  <span>View ↗</span>
                </button>
              </div>

              <div className="space-y-2 pt-2">
                <button
                  onClick={() => {
                    sounds.playTap();
                    onClose();
                  }}
                  className="w-full py-3 bg-stone-900 dark:bg-white text-white dark:text-stone-900 font-black rounded-2xl transition-all cursor-pointer shadow-xs text-xs"
                >
                  Nahuman na ang Booking
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSendBooking} className="space-y-4">
              
              {/* Value proposition banner */}
              <div className="p-3 bg-teal-50/80 dark:bg-teal-950/40 rounded-2xl border border-teal-200/80 dark:border-teal-700/30 flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
                <p className="text-[11px] text-teal-900 dark:text-teal-200 leading-relaxed">
                  <strong>Integrated SultiAI Learning:</strong> Ang mga tips, koreksyon, ug bokabularyo gikan sa imong sesyon kang <strong>{tutor.name}</strong> ma-sync direkta sa imong SULTI AI practice drills.
                </p>
              </div>

              {/* Topic Selector */}
              <div className="space-y-1.5">
                <label className="font-bold text-stone-700 dark:text-stone-300 text-[11px] block uppercase tracking-wider">
                  Unsay gusto nimong tun-an? *
                </label>
                <div className="space-y-1">
                  {TOPIC_PRESETS.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => {
                        sounds.playTap();
                        setTopic(t);
                      }}
                      className={`w-full p-2.5 rounded-xl text-left border transition-all cursor-pointer text-xs flex items-center justify-between ${
                        topic === t
                          ? 'bg-teal-50 dark:bg-teal-950/60 border-teal-500 font-bold text-teal-900 dark:text-teal-200 shadow-2xs'
                          : 'bg-stone-50 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-white/10 hover:bg-stone-100'
                      }`}
                    >
                      <span>{t}</span>
                      {topic === t && <Check className="w-3.5 h-3.5 text-teal-600" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Session Duration Selector */}
              <div className="space-y-1.5">
                <label className="font-bold text-stone-700 dark:text-stone-300 text-[11px] block uppercase tracking-wider">
                  Gidugayon sa Sesyon
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { mins: 30, label: '30 mins (Warmup)' },
                    { mins: 60, label: '60 mins (Standard)' },
                    { mins: 90, label: '90 mins (Deep Dive)' },
                  ].map((dur) => (
                    <button
                      key={dur.mins}
                      type="button"
                      onClick={() => {
                        sounds.playTap();
                        setSessionDuration(dur.mins);
                      }}
                      className={`p-2 rounded-xl text-center border text-[11px] font-bold cursor-pointer transition-all ${
                        sessionDuration === dur.mins
                          ? 'bg-stone-900 text-white dark:bg-white dark:text-stone-900 border-stone-900'
                          : 'bg-stone-50 dark:bg-stone-800 text-stone-600 dark:text-stone-300 border-stone-200 dark:border-white/10'
                      }`}
                    >
                      {dur.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Preferred Schedule Time */}
              <div className="space-y-1">
                <label className="font-bold text-stone-700 dark:text-stone-300 text-[11px] block">
                  Gusto nga Oras / Petsa
                </label>
                <div className="relative">
                  <Clock className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={preferredTime}
                    onChange={(e) => setPreferredTime(e.target.value)}
                    placeholder="e.g. Saturday afternoon, Weekday 7:00 PM"
                    className="w-full pl-8 pr-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-white/10 text-stone-900 dark:text-white placeholder-stone-400 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              {/* Learner Info */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-stone-700 dark:text-stone-300 text-[11px]">
                    Ngalan sa Estudyante
                  </label>
                  <input
                    type="text"
                    required
                    value={learnerName}
                    onChange={(e) => setLearnerName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-white/10 text-stone-900 dark:text-white text-xs font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-stone-700 dark:text-stone-300 text-[11px]">
                    Kontak (Email / Mobile)
                  </label>
                  <input
                    type="text"
                    value={learnerContact}
                    onChange={(e) => setLearnerContact(e.target.value)}
                    placeholder="e.g. genesis@example.com"
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-white/10 text-stone-900 dark:text-white text-xs font-medium"
                  />
                </div>
              </div>

              {/* Special Learning Requests */}
              <div className="space-y-1">
                <label className="font-bold text-stone-700 dark:text-stone-300 text-[11px]">
                  Mga Pahinumdom o Hangyo para sa Tutor
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Gusto ko mag-practice og palengke phrases ug pangayo og discount..."
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-white/10 text-stone-900 dark:text-white placeholder-stone-400 text-xs font-medium"
                />
              </div>

              {/* Pricing Breakdown & Monetization Card */}
              <div className="p-3.5 bg-stone-50 dark:bg-stone-800/70 rounded-2xl border border-stone-200 dark:border-white/10 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">
                  Transparent Session Price Breakdown
                </span>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-stone-600 dark:text-stone-400">
                    Tutor Base Rate ({sessionDuration} mins):
                  </span>
                  <span className="font-mono font-bold text-stone-900 dark:text-white">
                    ₱{baseTutorFee}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-stone-600 dark:text-stone-400 flex items-center gap-1">
                    <span>SultiAI Platform & Study Sync (15%):</span>
                    <span title="Includes automated vocabulary recording and escrow protection">
                      <Info className="w-3 h-3 text-stone-400" />
                    </span>
                  </span>
                  <span className="font-mono font-bold text-teal-600 dark:text-teal-400">
                    ₱{platformFee}
                  </span>
                </div>
                <div className="pt-2 border-t border-stone-200/80 dark:border-white/10 flex justify-between items-center text-xs font-bold">
                  <span className="text-stone-900 dark:text-white">Total Amount:</span>
                  <span className="font-mono font-black text-sm text-teal-600 dark:text-teal-400">
                    ₱{totalSessionCost}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    sounds.playTap();
                    onClose();
                  }}
                  className="px-4 py-2.5 rounded-xl border border-stone-200 dark:border-white/10 font-bold text-stone-600 dark:text-stone-300 hover:bg-stone-100 cursor-pointer text-xs"
                >
                  I-kansela
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-black flex items-center gap-2 shadow-xs cursor-pointer transition-all disabled:opacity-50 text-xs"
                >
                  {isSubmitting ? (
                    <span>Gipadala...</span>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Kumpirmaha ang Booking (₱{totalSessionCost})</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
