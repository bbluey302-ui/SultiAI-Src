import React, { useState } from 'react';
import { 
  X, Search, Filter, ShieldCheck, MapPin, Star, 
  MessageSquare, ExternalLink, Sparkles, Check, Briefcase, 
  ChevronRight, ArrowUpRight, Clock, Info, BookOpen
} from 'lucide-react';
import { 
  Tutor, TutorLanguage, getApprovedTutors, getUserApplications 
} from '../../data/tutorsData';
import { LinkedInIcon } from './LinkedInIcon';
import { ApplyTutorModal } from './ApplyTutorModal';
import { BookTutorModal } from './BookTutorModal';
import { sounds } from '../../utils/soundEffects';

interface TutorDirectoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialFilter?: TutorLanguage | 'all';
}

export const TutorDirectoryModal: React.FC<TutorDirectoryModalProps> = ({
  isOpen,
  onClose,
  initialFilter = 'all',
}) => {
  // STRICT: Only approved tutors are loaded for public directory
  const [tutors, setTutors] = useState<Tutor[]>(() => getApprovedTutors());
  const [userApplications, setUserApplications] = useState<Tutor[]>(() => getUserApplications());
  const [filterLang, setFilterLang] = useState<TutorLanguage | 'all'>(initialFilter);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Sub-modals
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [selectedTutorForBooking, setSelectedTutorForBooking] = useState<Tutor | null>(null);

  if (!isOpen) return null;

  // Refresh tutor list when an applicant submits
  const handleApplicantSuccess = () => {
    setTutors(getApprovedTutors());
    setUserApplications(getUserApplications());
  };

  const filteredTutors = tutors.filter((tutor) => {
    // Language filter
    if (filterLang !== 'all') {
      if (filterLang === 'cebuano' && tutor.language !== 'cebuano' && tutor.language !== 'both') return false;
      if (filterLang === 'filipino' && tutor.language !== 'filipino' && tutor.language !== 'both') return false;
      if (filterLang === 'both' && tutor.language !== 'both') return false;
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = tutor.name.toLowerCase().includes(q);
      const matchLocation = tutor.location.toLowerCase().includes(q);
      const matchSpecialty = tutor.specialties.some(s => s.toLowerCase().includes(q));
      const matchDialect = tutor.dialectTags.some(d => d.toLowerCase().includes(q));
      const matchBio = tutor.bio.toLowerCase().includes(q);
      return matchName || matchLocation || matchSpecialty || matchDialect || matchBio;
    }

    return true;
  });

  const handleOpenLinkedIn = (tutor: Tutor, e: React.MouseEvent) => {
    e.stopPropagation();
    sounds.playTap();
    window.open(tutor.linkedinUrl, '_blank', 'noopener,noreferrer');
  };

  const pendingUserApp = userApplications.find(a => a.status === 'pending_review');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-stone-900/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#f8f9fa] dark:bg-[#0f1d27] rounded-3xl w-full max-w-2xl max-h-[94vh] flex flex-col shadow-2xl border border-stone-200 dark:border-white/10 overflow-hidden">
        
        {/* Top Header */}
        <div className="px-5 py-4 bg-white dark:bg-[#11222D] border-b border-stone-200/80 dark:border-white/10 flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">👨‍🏫</span>
              <h2 className="font-display font-black text-base sm:text-lg text-stone-900 dark:text-white">
                Find a Language Tutor
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-teal-100 text-teal-800 dark:bg-teal-950/80 dark:text-teal-300 border border-teal-300/60 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-teal-600 dark:text-teal-400" />
                <span>Academic Vetted</span>
              </span>
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400 font-medium">
              Cebuano & Filipino mentors. Book sessions with SULTI AI study sync or view professional profiles.
            </p>
          </div>

          <div className="flex items-center gap-2">
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
        </div>

        {/* Filter & Search Bar */}
        <div className="px-5 py-3 bg-white/80 dark:bg-[#11222D]/80 backdrop-blur-sm border-b border-stone-200/80 dark:border-white/10 space-y-2.5 shrink-0">
          {/* Language Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none text-xs">
            <button
              onClick={() => {
                sounds.playTap();
                setFilterLang('all');
              }}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap ${
                filterLang === 'all'
                  ? 'bg-stone-900 text-white dark:bg-white dark:text-stone-900 shadow-xs'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200'
              }`}
            >
              Tanan ({tutors.length})
            </button>

            <button
              onClick={() => {
                sounds.playTap();
                setFilterLang('cebuano');
              }}
              className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                filterLang === 'cebuano'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-700/40 hover:bg-blue-100'
              }`}
            >
              <span>🟦 Bisaya / Cebuano</span>
            </button>

            <button
              onClick={() => {
                sounds.playTap();
                setFilterLang('filipino');
              }}
              className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                filterLang === 'filipino'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-700/40 hover:bg-amber-100'
              }`}
            >
              <span>🟨 Filipino / Tagalog</span>
            </button>

            <button
              onClick={() => {
                sounds.playTap();
                setFilterLang('both');
              }}
              className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                filterLang === 'both'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-700/40 hover:bg-emerald-100'
              }`}
            >
              <span>🌐 Bilingual</span>
            </button>
          </div>

          {/* Search box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Pangita pinaagi sa ngalan, dialect, o hilisgutan..."
              className="w-full pl-8 pr-3 py-1.5 bg-stone-100 dark:bg-stone-800 rounded-xl text-xs text-stone-900 dark:text-white placeholder-stone-400 border border-stone-200/60 dark:border-white/5 focus:outline-none focus:ring-1 focus:ring-teal-500 font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2 text-stone-400 hover:text-stone-600 text-xs cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Tutors Scrollable Directory */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-3.5 flex-1">
          
          {/* User's own pending application banner if any */}
          {pendingUserApp && (
            <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 rounded-2xl border border-amber-300 dark:border-amber-700/40 flex items-start gap-3 shadow-2xs">
              <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-display font-black text-xs text-amber-900 dark:text-amber-200">
                    Imong Aplikasyon: {pendingUserApp.name}
                  </h4>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-amber-200/80 text-amber-900 dark:bg-amber-900 dark:text-amber-200">
                    Pending Admin Review
                  </span>
                </div>
                <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed pt-0.5">
                  Gisusi karon sa Academic Board ang imong gipasa nga background ug LinkedIn profile. Dili pa kini makita sa ubang estudyante hangtod ma-aprobahan sa Admin.
                </p>
              </div>
            </div>
          )}

          {/* Banner: Transparent Dual-Option Guide */}
          <div className="p-3.5 bg-gradient-to-r from-blue-50 via-teal-50/40 to-white dark:from-[#132735] dark:via-[#11222D] dark:to-[#0f1d27] rounded-2xl border border-blue-200/80 dark:border-blue-500/20 flex items-start justify-between gap-3 shadow-2xs">
            <div className="flex items-start gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                <BookOpen className="w-4 h-4 text-white" />
              </div>
              <div>
                <h4 className="font-display font-black text-xs text-stone-900 dark:text-white leading-tight">
                  SultiAI Human Learning Companion
                </h4>
                <p className="text-[11px] text-stone-600 dark:text-stone-300 leading-relaxed pt-0.5">
                  I-book ang klase sa <strong>SultiAI</strong> aron ma-sync ang bag-ong bokabularyo direkta sa imong 13 modules, o bisitaha ang ilang <strong>LinkedIn Profile</strong> para sa ilang propesyonal nga kasinatian.
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                sounds.playTap();
                setShowApplyModal(true);
              }}
              className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-stone-800 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-500/30 text-[10px] font-black shrink-0 hover:bg-stone-50 cursor-pointer hidden md:block"
            >
              Gusto ka mag-tutor? Apply diri →
            </button>
          </div>

          {/* List of Tutors */}
          {filteredTutors.length === 0 ? (
            <div className="p-8 text-center space-y-2 bg-white dark:bg-[#11222D] rounded-2xl border border-stone-200 dark:border-white/10">
              <div className="text-3xl">🔍</div>
              <h4 className="font-display font-black text-sm text-stone-900 dark:text-white">
                Walay aprobado nga tutor nga nakit-an
              </h4>
              <p className="text-xs text-stone-500 dark:text-stone-400 max-w-xs mx-auto">
                Sulayi pag-ilis ang filter o mag-apply isip bag-ong tutor para sa review!
              </p>
              <button
                onClick={() => {
                  setFilterLang('all');
                  setSearchQuery('');
                }}
                className="mt-2 px-3 py-1.5 rounded-xl bg-stone-100 dark:bg-stone-800 text-xs font-bold text-stone-700 dark:text-stone-200 cursor-pointer"
              >
                I-reset ang filter
              </button>
            </div>
          ) : (
            filteredTutors.map((tutor) => {
              const isBisaya = tutor.language === 'cebuano';
              const isFilipino = tutor.language === 'filipino';

              return (
                <div
                  key={tutor.id}
                  className="p-4 bg-white dark:bg-[#11222D] rounded-2xl sm:rounded-3xl border border-stone-200/90 dark:border-white/10 shadow-xs hover:shadow-md transition-all space-y-3 relative group"
                >
                  {/* Top line: Avatar + Name + Language badge + Hourly Rate */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-display font-black text-white text-sm shrink-0 shadow-xs ${
                        isBisaya ? 'bg-blue-600' : isFilipino ? 'bg-amber-600' : 'bg-emerald-600'
                      }`}>
                        {tutor.avatarInitials}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h3 className="font-display font-black text-sm text-stone-900 dark:text-white truncate">
                            {tutor.name}
                          </h3>
                          {tutor.academicVetted && (
                            <span className="inline-flex items-center gap-0.5 text-teal-600 dark:text-teal-400" title="Vetted by SultiAI Academic Board">
                              <ShieldCheck className="w-4 h-4 fill-teal-500/10 text-teal-500" />
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-stone-500 dark:text-stone-400 font-medium line-clamp-1">
                          {tutor.title}
                        </p>

                        <div className="flex items-center gap-2 text-[11px] text-stone-500 dark:text-stone-400 pt-0.5">
                          <span className="flex items-center gap-0.5">
                            <MapPin className="w-3 h-3 text-stone-400" />
                            <span>{tutor.location}</span>
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-0.5 text-amber-500 font-bold">
                            <Star className="w-3 h-3 fill-amber-400" />
                            <span>{tutor.rating}</span>
                            <span className="text-stone-400 font-normal">({tutor.reviewCount})</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Hourly rate badge */}
                    <div className="text-right shrink-0">
                      <div className="font-mono font-black text-base text-stone-900 dark:text-white">
                        ₱{tutor.hourlyRatePhp}
                      </div>
                      <div className="text-[10px] text-stone-400 font-medium uppercase tracking-wider">
                        kada oras
                      </div>
                    </div>
                  </div>

                  {/* Bio & Dialect tags */}
                  <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                    {tutor.bio}
                  </p>

                  <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                      isBisaya
                        ? 'bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700/40'
                        : isFilipino
                        ? 'bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-700/40'
                        : 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700/40'
                    }`}>
                      {tutor.languageLabel}
                    </span>

                    {tutor.dialectTags.map((tag) => (
                      <span key={tag} className="px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 text-[10px] font-medium border border-stone-200/50 dark:border-white/5">
                        {tag}
                      </span>
                    ))}

                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono ml-auto">
                      ● {tutor.availability.split('·')[0]}
                    </span>
                  </div>

                  {/* Dual Action Buttons: (1) Book Session on SultiAI, (2) LinkedIn Profile ↗ */}
                  <div className="pt-2 border-t border-stone-100 dark:border-white/5 flex items-center gap-2">
                    
                    {/* PRIMARY BOOK SESSION ON SULTIAI */}
                    <button
                      onClick={() => {
                        sounds.playTap();
                        setSelectedTutorForBooking(tutor);
                      }}
                      className="flex-1 min-h-[40px] px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer active:scale-[0.98]"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Book on SultiAI</span>
                      <span className="text-[10px] opacity-80 font-normal hidden sm:inline">(AI Sync)</span>
                    </button>

                    {/* SECONDARY EXTERNAL LINKEDIN PROFILE BUTTON */}
                    <button
                      onClick={(e) => handleOpenLinkedIn(tutor, e)}
                      className="px-3 min-h-[40px] py-2 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap active:scale-[0.98] border border-stone-200/60 dark:border-white/5"
                      title="View tutor's professional background on LinkedIn"
                    >
                      <LinkedInIcon className="w-3.5 h-3.5 fill-[#0A66C2]" />
                      <span className="text-[#0A66C2] dark:text-blue-300">LinkedIn Profile</span>
                      <ArrowUpRight className="w-3 h-3 text-stone-400" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer: Quick summary & Academic notice */}
        <div className="px-5 py-3 bg-white dark:bg-[#11222D] border-t border-stone-200/80 dark:border-white/10 flex items-center justify-between text-xs shrink-0">
          <div className="flex items-center gap-2 text-stone-500 dark:text-stone-400 text-[11px]">
            <span>{filteredTutors.length} ka buok approved tutors</span>
            <span>•</span>
            <span className="flex items-center gap-1 text-teal-600 dark:text-teal-400 font-semibold">
              <ShieldCheck className="w-3 h-3" />
              <span>Vetting Active</span>
            </span>
          </div>

          <a
            href="mailto:genesis.diaz@jmc.edu.ph?subject=SultiAI%20Academic%20Tutor%20%26%20Research%20Collaboration"
            className="text-[11px] font-bold text-teal-700 dark:text-teal-300 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>Partner / Contact Developer</span>
            <ChevronRight className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* Sub Modals */}
      <ApplyTutorModal
        isOpen={showApplyModal}
        onClose={() => setShowApplyModal(false)}
        onSuccess={handleApplicantSuccess}
      />

      <BookTutorModal
        tutor={selectedTutorForBooking}
        isOpen={Boolean(selectedTutorForBooking)}
        onClose={() => setSelectedTutorForBooking(null)}
      />
    </div>
  );
};
