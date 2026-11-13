import React, { useState } from 'react';
import { 
  X, CheckCircle2, AlertCircle, Sparkles, User, Briefcase, 
  MapPin, DollarSign, Globe, Award, ShieldCheck, ArrowRight,
  Clock, ExternalLink, Info, Check
} from 'lucide-react';
import { Tutor, TutorLanguage, submitTutorApplication } from '../../data/tutorsData';
import { LinkedInIcon } from './LinkedInIcon';
import { sounds } from '../../utils/soundEffects';
import { addNotification } from '../../utils/notificationService';

interface ApplyTutorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newTutor: Tutor) => void;
  onOpenAdminConsole?: () => void;
}

export const ApplyTutorModal: React.FC<ApplyTutorModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onOpenAdminConsole,
}) => {
  const [fullName, setFullName] = useState('');
  const [title, setTitle] = useState('');
  const [language, setLanguage] = useState<TutorLanguage>('cebuano');
  const [location, setLocation] = useState('Cebu City, Philippines');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [hourlyRate, setHourlyRate] = useState('400');
  const [experienceYears, setExperienceYears] = useState('3');
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([
    'Everyday Conversation',
    'Pronunciation & Pitch',
  ]);
  const [customSpecialty, setCustomSpecialty] = useState('');
  const [bio, setBio] = useState('');
  const [availability, setAvailability] = useState('Available Weekdays & Weekends · Flexible hours');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showSuccessCard, setShowSuccessCard] = useState(false);
  const [createdTutor, setCreatedTutor] = useState<Tutor | null>(null);

  if (!isOpen) return null;

  const COMMON_SPECIALTIES = [
    'Everyday Conversation',
    'Pronunciation & Pitch',
    'Zero-Beginner Warmup',
    'Market & Commuting Practice',
    'Grammar & Sentence Flow',
    'Business / Relocation Bisaya',
    'Modern Slang & Idioms',
    'Heritage / Balikbayan Learners',
  ];

  const toggleSpecialty = (item: string) => {
    sounds.playTap();
    if (selectedSpecialties.includes(item)) {
      setSelectedSpecialties(selectedSpecialties.filter(s => s !== item));
    } else {
      setSelectedSpecialties([...selectedSpecialties, item]);
    }
  };

  const cleanLinkedinUrl = (url: string) => {
    let clean = url.trim();
    if (!clean) return '';
    if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
      if (clean.startsWith('linkedin.com')) {
        clean = 'https://' + clean;
      } else if (clean.startsWith('www.linkedin.com')) {
        clean = 'https://' + clean;
      } else {
        clean = `https://www.linkedin.com/in/${clean.replace('@', '')}`;
      }
    }
    return clean;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!fullName.trim() || fullName.trim().length < 3) {
      setErrorMsg('Palihug isulat ang imong kompletong pangalan (Full Name).');
      return;
    }

    if (!linkedinUrl.trim()) {
      setErrorMsg('Palihug ibutang ang imong LinkedIn profile URL para sa credential vetting sa Academic Panel.');
      return;
    }

    const formattedLinkedin = cleanLinkedinUrl(linkedinUrl);
    if (!formattedLinkedin.includes('linkedin.com/')) {
      setErrorMsg('Palihug pagsulod og saktong LinkedIn URL (pananglitan: https://linkedin.com/in/imong-username).');
      return;
    }

    const rate = parseInt(hourlyRate, 10);
    if (isNaN(rate) || rate < 150) {
      setErrorMsg('Palihug pagsulod og rate nga labing menos ₱150 kada oras.');
      return;
    }

    setIsSubmitting(true);
    sounds.playTap();

    setTimeout(() => {
      const languageLabels: Record<TutorLanguage, string> = {
        cebuano: 'Cebuano / Bisaya',
        filipino: 'Filipino / Tagalog',
        both: 'Bilingual (Bisaya & Filipino)',
      };

      // STRICT: Submits with status: 'pending_review'
      const newTutor = submitTutorApplication({
        name: fullName.trim(),
        title: title.trim() || `${languageLabels[language]} Coach & Language Mentor`,
        location: location.trim() || 'Philippines',
        language,
        languageLabel: languageLabels[language],
        dialectTags: selectedSpecialties.slice(0, 3),
        hourlyRatePhp: rate,
        experienceYears: parseInt(experienceYears, 10) || 1,
        linkedinUrl: formattedLinkedin,
        bio: bio.trim() || `Kumusta! Ako si ${fullName.trim()}. Andam motabang nimo nga makasulti og ${languageLabels[language]} nga walay kahadlok.`,
        specialties: selectedSpecialties.length > 0 ? selectedSpecialties : ['Conversational Fluency'],
        availability: availability.trim() || 'Flexible scheduling',
      });

      sounds.playCorrect();
      setCreatedTutor(newTutor);
      setShowSuccessCard(true);
      setIsSubmitting(false);

      addNotification({
        category: 'admin',
        title: `⏳ Tutor Application Submitted for Review`,
        titleBisaya: `Nadawat ang Imong Aplikasyon isip Tutor!`,
        message: `Your application for ${newTutor.languageLabel} is currently under academic review. Once approved by an Admin, your profile will be published to the public directory.`,
        actionLabel: 'Check Status',
        actionType: 'learn',
        iconType: 'shield',
      });

      onSuccess(newTutor);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#11222D] rounded-3xl w-full max-w-lg max-h-[92vh] flex flex-col shadow-2xl border border-stone-200 dark:border-white/10 overflow-hidden">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-stone-100 dark:border-white/10 flex items-center justify-between bg-stone-50/70 dark:bg-stone-800/40 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 flex items-center justify-center text-teal-600 dark:text-teal-300">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-black text-base text-stone-900 dark:text-white leading-tight">
                Apply as Personal Tutor
              </h3>
              <p className="text-[11px] text-stone-500 dark:text-stone-400 font-medium">
                SultiAI Academic Vetting & Review Pipeline
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

        {/* Body content */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {showSuccessCard && createdTutor ? (
            <div className="space-y-4 py-3 text-center">
              <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center border-2 border-amber-500/40 shadow-inner">
                <Clock className="w-9 h-9" />
              </div>

              <div className="space-y-1">
                <h4 className="font-display font-black text-lg text-stone-900 dark:text-white">
                  Aplikasyon Napadala para sa Pagsusi! ⏳
                </h4>
                <p className="text-xs text-stone-600 dark:text-stone-300 max-w-sm mx-auto leading-relaxed">
                  Salamat sa pagsumite, <strong>{createdTutor.name}</strong>. Ang imong aplikasyon gipahimutang sa <strong>Pending Admin Review</strong>. Susihon sa Academic Board ang imong background sa dili pa kini i-publish sa publikong Tutor Directory.
                </p>
              </div>

              {/* Tutor preview card with Pending Status */}
              <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-white/10 text-left space-y-2.5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-amber-500 text-white font-black flex items-center justify-center font-display">
                      {createdTutor.avatarInitials}
                    </div>
                    <div>
                      <div className="font-bold text-stone-900 dark:text-white text-sm flex items-center gap-1.5">
                        <span>{createdTutor.name}</span>
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300">
                          Pending Review
                        </span>
                      </div>
                      <div className="text-[11px] text-stone-500 dark:text-stone-400 font-medium">
                        {createdTutor.languageLabel} Tutor
                      </div>
                    </div>
                  </div>

                  <span className="font-mono font-black text-xs text-stone-900 dark:text-white bg-white dark:bg-stone-700 px-2.5 py-1 rounded-lg border border-stone-200 dark:border-white/10">
                    ₱{createdTutor.hourlyRatePhp}/hr
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-[11px] text-stone-500 dark:text-stone-400">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{createdTutor.location}</span>
                </div>

                <div className="p-2.5 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-white/10 flex items-center justify-between text-[11px]">
                  <span className="text-stone-500 flex items-center gap-1">
                    <LinkedInIcon className="w-3.5 h-3.5 fill-[#0A66C2]" />
                    <span>LinkedIn Profile:</span>
                  </span>
                  <a
                    href={createdTutor.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#0A66C2] hover:underline flex items-center gap-1 font-semibold truncate max-w-[200px]"
                  >
                    <span>View Profile</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-700/30 text-[11px] text-amber-800 dark:text-amber-300 flex items-start gap-2">
                  <Info className="w-4 h-4 shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    Dili pa kini makita sa publikong listahan sa mga estudyante samtang nagpaabot sa pag-aprobar sa admin.
                  </p>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <button
                  onClick={() => {
                    sounds.playTap();
                    onClose();
                  }}
                  className="w-full py-3 bg-stone-900 dark:bg-white text-white dark:text-stone-900 font-black rounded-2xl transition-all cursor-pointer shadow-xs text-xs"
                >
                  Salamat, Nakasabot Ko
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Vetting explanation banner */}
              <div className="p-3 bg-stone-50 dark:bg-stone-800/60 rounded-2xl border border-stone-200 dark:border-white/10 text-stone-700 dark:text-stone-300 space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-[11px] text-stone-900 dark:text-white">
                  <ShieldCheck className="w-4 h-4 text-teal-600" />
                  <span>SultiAI Two-Stage Review Process</span>
                </div>
                <p className="text-[11px] leading-relaxed text-stone-500 dark:text-stone-400">
                  Ang matag magtutudlo moagi og academic evaluation. Inig submit, ang aplikasyon mosulod sa <strong>Admin Review</strong>. Human ma-verify ang kasinatian ug credentials, i-publish kini sa publikong Tutor Hub.
                </p>
              </div>

              {errorMsg && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/50 rounded-2xl border border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span className="text-[11px] font-medium">{errorMsg}</span>
                </div>
              )}

              {/* Language Selection */}
              <div className="space-y-1.5">
                <label className="font-bold text-stone-700 dark:text-stone-300 text-[11px] block uppercase tracking-wider">
                  Unsang pinulongan ang imong itudlo? *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      sounds.playTap();
                      setLanguage('cebuano');
                    }}
                    className={`p-2.5 rounded-2xl border text-center transition-all cursor-pointer ${
                      language === 'cebuano'
                        ? 'bg-blue-600 text-white border-blue-700 font-black shadow-xs ring-2 ring-blue-300 dark:ring-blue-800'
                        : 'bg-stone-50 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-white/10 hover:bg-stone-100'
                    }`}
                  >
                    <div className="text-base mb-0.5">🟦</div>
                    <div className="font-bold text-[11px]">Bisaya / Cebuano</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      sounds.playTap();
                      setLanguage('filipino');
                    }}
                    className={`p-2.5 rounded-2xl border text-center transition-all cursor-pointer ${
                      language === 'filipino'
                        ? 'bg-amber-600 text-white border-amber-700 font-black shadow-xs ring-2 ring-amber-300 dark:ring-amber-800'
                        : 'bg-stone-50 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-white/10 hover:bg-stone-100'
                    }`}
                  >
                    <div className="text-base mb-0.5">🟨</div>
                    <div className="font-bold text-[11px]">Filipino / Tagalog</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      sounds.playTap();
                      setLanguage('both');
                    }}
                    className={`p-2.5 rounded-2xl border text-center transition-all cursor-pointer ${
                      language === 'both'
                        ? 'bg-emerald-600 text-white border-emerald-700 font-black shadow-xs ring-2 ring-emerald-300 dark:ring-emerald-800'
                        : 'bg-stone-50 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-white/10 hover:bg-stone-100'
                    }`}
                  >
                    <div className="text-base mb-0.5">🌐</div>
                    <div className="font-bold text-[11px]">Both (Bilingual)</div>
                  </button>
                </div>
              </div>

              {/* Full Name & Title */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-stone-700 dark:text-stone-300 text-[11px]">
                    Kompletong Pangalan *
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Maria Clara Santos"
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-white/10 text-stone-900 dark:text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-stone-700 dark:text-stone-300 text-[11px]">
                    Professional Title / Headline
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Cebuano Language Coach & Educator"
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-white/10 text-stone-900 dark:text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
                  />
                </div>
              </div>

              {/* LinkedIn URL Field (Safe Non-Misleading copy) */}
              <div className="space-y-1.5 p-3 rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-white/10">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-stone-800 dark:text-stone-200 text-[11px] flex items-center gap-1.5">
                    <LinkedInIcon className="w-3.5 h-3.5 fill-[#0A66C2]" />
                    <span>LinkedIn Profile URL * (Credential Reference)</span>
                  </label>
                  <span className="text-[10px] text-stone-400 font-mono">Required for Vetting</span>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={linkedinUrl}
                    onChange={(e) => setLinkedinUrl(e.target.value)}
                    placeholder="https://www.linkedin.com/in/imong-username"
                    className="w-full px-3 py-2 pr-8 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-white/10 text-stone-900 dark:text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono text-[11px]"
                  />
                  {linkedinUrl && (
                    <div className="absolute right-2.5 top-2.5 text-emerald-500">
                      <Check className="w-4 h-4" />
                    </div>
                  )}
                </div>
                <p className="text-[10px] text-stone-500 dark:text-stone-400 leading-normal">
                  Gamiton sa academic reviewers aron masusi ang imong edukasyon ug kasinatian. (Pahinumdom: Ang SultiAI wala mag-isyu og opisyal nga LinkedIn verification).
                </p>
              </div>

              {/* Location & Hourly Rate */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-stone-700 dark:text-stone-300 text-[11px]">
                    Lugar / Location
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Cebu City, Philippines"
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-white/10 text-stone-900 dark:text-white font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-stone-700 dark:text-stone-300 text-[11px]">
                    Hourly Rate (₱ PHP / hr)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-stone-400 font-bold">₱</span>
                    <input
                      type="number"
                      min="150"
                      max="3000"
                      step="50"
                      value={hourlyRate}
                      onChange={(e) => setHourlyRate(e.target.value)}
                      placeholder="400"
                      className="w-full pl-7 pr-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-white/10 text-stone-900 dark:text-white font-mono font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* Experience & Availability */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-stone-700 dark:text-stone-300 text-[11px]">
                    Katuigan nga Eksperyensya
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="40"
                    value={experienceYears}
                    onChange={(e) => setExperienceYears(e.target.value)}
                    placeholder="3"
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-white/10 text-stone-900 dark:text-white font-mono font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-stone-700 dark:text-stone-300 text-[11px]">
                    Oras / Availability
                  </label>
                  <input
                    type="text"
                    value={availability}
                    onChange={(e) => setAvailability(e.target.value)}
                    placeholder="e.g. Available evenings & weekends"
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-white/10 text-stone-900 dark:text-white text-[11px]"
                  />
                </div>
              </div>

              {/* Specialties / Focus Areas */}
              <div className="space-y-1.5">
                <label className="font-bold text-stone-700 dark:text-stone-300 text-[11px] block">
                  Mga Espesyalisasyon & Pamaagi sa Pagtudlo
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {COMMON_SPECIALTIES.map((spec) => {
                    const isSelected = selectedSpecialties.includes(spec);
                    return (
                      <button
                        key={spec}
                        type="button"
                        onClick={() => toggleSpecialty(spec)}
                        className={`px-2.5 py-1 rounded-xl text-[11px] font-medium transition-colors cursor-pointer border ${
                          isSelected
                            ? 'bg-teal-600 text-white border-teal-700 shadow-2xs font-bold'
                            : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 border-stone-200/80 dark:border-white/5 hover:bg-stone-200'
                        }`}
                      >
                        {isSelected && '✓ '}
                        {spec}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Bio & Intro */}
              <div className="space-y-1">
                <label className="font-bold text-stone-700 dark:text-stone-300 text-[11px]">
                  Mubo nga Pailaila / Teaching Bio
                </label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Ipaambit ang imong estilo sa pagtudlo, nganong ganahan ka magtudlo og Bisaya/Filipino, ug unsaon nimo pagtabang sa estudyante..."
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-white/10 text-stone-900 dark:text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium text-[11px]"
                />
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
                    <span>Gisumite...</span>
                  ) : (
                    <>
                      <span>I-sumite Para sa Admin Review</span>
                      <ArrowRight className="w-3.5 h-3.5" />
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
