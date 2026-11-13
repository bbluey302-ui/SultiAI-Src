import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  Mic,
  Clock,
  Sparkles,
  Check,
  ChevronRight,
  Volume2,
  Search,
  X,
  Trophy,
  Settings2,
  Plus,
  Pencil,
  Bot,
} from 'lucide-react';
import { AiCoach, AiCoachId, AiVoiceSession, MajorAiLanguage } from '../../types/aiHub';
import { AI_COACHES } from '../../data/aiCoachesData';
import { resolveCoach, useCustomCoaches } from '../../services/customAgentsService';
import { AgentSettingsSheet } from './AgentSettingsSheet';
import { CustomBotBuilderModal } from './CustomBotBuilderModal';
import { sounds } from '../../utils/soundEffects';

interface SultiVoiceAgentHubProps {
  currentLanguage: MajorAiLanguage;
  recentSessions?: AiVoiceSession[];
  onBackToHub: () => void;
  onStartVoiceSession: (config: {
    coachId: AiCoachId;
    targetLanguage: MajorAiLanguage;
    scenarioTitle: string;
    difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  }) => void;
}

const LANGUAGE_LABELS: Record<MajorAiLanguage, string> = {
  cebuano: 'Bisaya',
  filipino: 'Filipino',
  english: 'English',
};

const LANGUAGE_FILTERS: { id: 'all' | MajorAiLanguage; label: string; flag: string }[] = [
  { id: 'all', label: 'All coaches', flag: '✨' },
  { id: 'cebuano', label: 'Bisaya', flag: '🇵🇭' },
  { id: 'filipino', label: 'Filipino', flag: '🇵🇭' },
  { id: 'english', label: 'English', flag: '🌎' },
];

const formatDuration = (seconds: number) => {
  const safe = Math.max(0, Math.round(seconds || 0));
  return `${Math.floor(safe / 60)}:${String(safe % 60).padStart(2, '0')}`;
};

const coachFirstName = (coach: AiCoach) => coach.name.replace('Sulti AI ', '');

export const SultiVoiceAgentHub: React.FC<SultiVoiceAgentHubProps> = ({
  currentLanguage,
  recentSessions = [],
  onBackToHub,
  onStartVoiceSession,
}) => {
  const [configuringCoach, setConfiguringCoach] = useState<AiCoach | null>(null);
  const [targetLang, setTargetLang] = useState<MajorAiLanguage>(currentLanguage);
  const [selectedScenarioGoal, setSelectedScenarioGoal] = useState<string>('');
  const [difficulty, setDifficulty] = useState<'Beginner' | 'Intermediate' | 'Advanced'>(
    'Beginner'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [languageFilter, setLanguageFilter] = useState<'all' | MajorAiLanguage>('all');

  // Learner-created bots saved on this device, plus the shared settings sheet.
  const customCoaches = useCustomCoaches();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [builderOpen, setBuilderOpen] = useState(false);
  const [editingBot, setEditingBot] = useState<AiCoach | null>(null);

  const voiceCoaches = useMemo(
    () => [
      ...AI_COACHES,
      ...customCoaches.filter((coach) => coach.scope === 'both' || coach.scope === 'voice'),
    ],
    [customCoaches]
  );

  const openBuilder = (bot: AiCoach | null = null) => {
    sounds.playTap();
    setEditingBot(bot);
    setBuilderOpen(true);
  };

  const handleOpenConfig = (coach: AiCoach) => {
    sounds.playTap();
    setConfiguringCoach(coach);
    setTargetLang(coach.primaryLanguage);
    setSelectedScenarioGoal(coach.practiceExamples[0] || 'Everyday conversational practice');
  };

  const handleStartSession = () => {
    if (!configuringCoach) return;
    sounds.playTap();
    onStartVoiceSession({
      coachId: configuringCoach.id,
      targetLanguage: targetLang,
      scenarioTitle: selectedScenarioGoal,
      difficulty,
    });
  };

  const filteredCoaches = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return voiceCoaches.filter((coach) => {
      const matchesLanguage =
        languageFilter === 'all' || coach.supportedLanguages.includes(languageFilter);
      if (!matchesLanguage) return false;
      if (!query) return true;

      const haystack = [
        coach.name,
        coach.role,
        coach.specialty,
        coach.description,
        ...coach.practiceExamples,
      ]
        .join(' ')
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [languageFilter, searchQuery, voiceCoaches]);

  const sessionStats = useMemo(() => {
    const finished = recentSessions.filter(
      (session) => session.status === 'completed' || session.status === 'timeout'
    );
    const totalSeconds = finished.reduce((sum, session) => sum + (session.durationSeconds || 0), 0);
    const totalScore = finished.reduce(
      (sum, session) => sum + (session.speechScoreAverage || 0),
      0
    );

    return {
      sessions: finished.length,
      minutes: totalSeconds > 0 ? Math.max(1, Math.round(totalSeconds / 60)) : 0,
      averageScore: finished.length ? Math.round(totalScore / finished.length) : 0,
    };
  }, [recentSessions]);

  const latestSessions = useMemo(
    () =>
      [...recentSessions]
        .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
        .slice(0, 3),
    [recentSessions]
  );

  return (
    <div className="space-y-4 pb-12 select-none animate-in fade-in duration-200">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-2">
        <button
          onClick={() => {
            sounds.playTap();
            onBackToHub();
          }}
          className="min-h-[40px] px-2.5 rounded-2xl bg-stone-100 dark:bg-[#11222D] hover:bg-stone-200 dark:hover:bg-[#152B37] text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-white/10 flex items-center gap-1.5 text-xs font-bold cursor-pointer active:scale-95 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Sulti Hub</span>
        </button>

        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-700 dark:text-cyan-300 font-mono text-[9.5px] font-bold whitespace-nowrap">
            <Clock className="w-3 h-3 shrink-0" />
            <span>
              2-min free<span className="hidden min-[360px]:inline"> session</span>
            </span>
          </div>
          <button
            onClick={() => {
              sounds.playTap();
              setSettingsOpen(true);
            }}
            aria-label="Voice settings"
            className="min-h-[34px] min-w-[34px] rounded-2xl bg-stone-100 dark:bg-[#11222D] hover:bg-stone-200 dark:hover:bg-[#152B37] text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-white/10 flex items-center justify-center cursor-pointer active:scale-95 transition-all"
          >
            <Settings2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Screen title */}
      <div>
        <h1 className="text-xl sm:text-2xl font-display font-black text-stone-900 dark:text-white leading-tight">
          Voice Agent Dashboard
        </h1>
        <p className="text-xs text-stone-500 dark:text-[#8E9BAE] mt-0.5">
          Choose a coach, speak out loud, and get instant pronunciation feedback.
        </p>
      </div>

      {/* Voice practice snapshot */}
      <section className="relative overflow-hidden rounded-3xl border border-cyan-500/25 bg-gradient-to-br from-cyan-500/15 via-teal-500/10 to-transparent dark:from-cyan-950/50 dark:via-teal-950/30 dark:to-transparent p-3.5 shadow-xs">
        <div className="absolute -top-10 -right-8 w-32 h-32 rounded-full bg-cyan-500/20 blur-3xl pointer-events-none" />

        <div className="relative flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-700 dark:text-cyan-300 text-[9.5px] font-mono font-black uppercase tracking-wider">
              <Volume2 className="w-3 h-3" />
              <span>Live Voice Studio</span>
            </div>
            <h2 className="font-display font-black text-sm text-stone-900 dark:text-white mt-2">
              Ready to speak, loud and proud
            </h2>
            <p className="text-[11px] text-stone-500 dark:text-stone-300 leading-snug mt-0.5">
              Live transcript · pronunciation score · coach feedback
            </p>
          </div>

          <span className="shrink-0 w-11 h-11 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-xl shadow-inner">
            🎙️
          </span>
        </div>

        <div className="relative grid grid-cols-3 gap-2 mt-3">
          <div className="rounded-2xl bg-white/80 dark:bg-black/25 border border-white/60 dark:border-white/10 p-2.5 text-center backdrop-blur-xs">
            <div className="flex items-center justify-center gap-1 text-[9px] font-mono font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
              <Mic className="w-3 h-3" />
              <span>Sessions</span>
            </div>
            <div className="text-lg font-black font-mono text-stone-900 dark:text-white leading-tight">
              {sessionStats.sessions}
            </div>
          </div>

          <div className="rounded-2xl bg-white/80 dark:bg-black/25 border border-white/60 dark:border-white/10 p-2.5 text-center backdrop-blur-xs">
            <div className="flex items-center justify-center gap-1 text-[9px] font-mono font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
              <Clock className="w-3 h-3" />
              <span>Minutes</span>
            </div>
            <div className="text-lg font-black font-mono text-cyan-700 dark:text-cyan-300 leading-tight">
              {sessionStats.minutes}
            </div>
          </div>

          <div className="rounded-2xl bg-white/80 dark:bg-black/25 border border-white/60 dark:border-white/10 p-2.5 text-center backdrop-blur-xs">
            <div className="flex items-center justify-center gap-1 text-[9px] font-mono font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
              <Trophy className="w-3 h-3" />
              <span>Avg score</span>
            </div>
            <div className="text-lg font-black font-mono text-emerald-700 dark:text-emerald-300 leading-tight">
              {sessionStats.sessions ? `${sessionStats.averageScore}%` : '—'}
            </div>
          </div>
        </div>
      </section>

      {/* Coach directory */}
      <section className="space-y-2.5">
        <div className="flex items-end justify-between gap-2">
          <div>
            <h2 className="font-display font-black text-sm text-stone-900 dark:text-white">
              Choose your voice coach
            </h2>
            <p className="text-[10.5px] text-stone-500 dark:text-stone-400">
              {filteredCoaches.length} of {voiceCoaches.length} coaches available
            </p>
          </div>
          <span className="text-[9.5px] font-mono font-bold uppercase tracking-wider text-cyan-700 dark:text-cyan-300 bg-cyan-500/10 border border-cyan-500/25 px-2 py-1 rounded-lg">
            Tap to start
          </span>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            inputMode="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search coach name, role, or scenario..."
            aria-label="Search voice coaches"
            className="w-full min-h-[44px] pl-9 pr-10 rounded-2xl bg-white dark:bg-[#11222D] border border-stone-200 dark:border-white/10 text-xs text-stone-900 dark:text-white placeholder-stone-400 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all shadow-xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              aria-label="Clear search"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center text-stone-400 hover:text-stone-700 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-white/10 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Language filters */}
        <div className="-mx-4 px-4 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {LANGUAGE_FILTERS.map((filter) => {
            const active = languageFilter === filter.id;
            return (
              <button
                key={filter.id}
                onClick={() => {
                  sounds.playTap();
                  setLanguageFilter(filter.id);
                }}
                aria-pressed={active}
                className={`shrink-0 min-h-[34px] px-2.5 rounded-xl text-[11px] font-bold border transition-all cursor-pointer active:scale-95 flex items-center gap-1 ${
                  active
                    ? 'bg-cyan-600 text-white border-cyan-500 shadow-sm'
                    : 'bg-stone-100 dark:bg-[#11222D] text-stone-600 dark:text-stone-300 border-stone-200 dark:border-white/10 hover:border-cyan-400/60'
                }`}
              >
                <span>{filter.flag}</span>
                <span>{filter.label}</span>
              </button>
            );
          })}
        </div>

        {/* Create your own bot */}
        <button
          onClick={() => openBuilder(null)}
          className="w-full p-3 rounded-3xl border-2 border-dashed border-cyan-500/40 bg-cyan-500/5 hover:bg-cyan-500/10 transition-all cursor-pointer flex items-center gap-3 active:scale-[0.99]"
        >
          <span className="shrink-0 w-10 h-10 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-600 dark:text-cyan-300 flex items-center justify-center">
            <Bot className="w-5 h-5" />
          </span>
          <span className="min-w-0 flex-1 text-left">
            <span className="block text-xs font-black text-stone-900 dark:text-white">
              Create your own bot
            </span>
            <span className="block text-[10.5px] text-stone-500 dark:text-stone-400 leading-snug">
              Choose its name, voice, personality and practice scenarios.
            </span>
          </span>
          <Plus className="w-4 h-4 text-cyan-600 dark:text-cyan-300 shrink-0" />
        </button>

        {/* Coach cards */}
        {filteredCoaches.length === 0 ? (
          <div className="p-6 text-center rounded-3xl bg-white dark:bg-[#11222D] border border-stone-200 dark:border-white/10 space-y-2">
            <div className="w-11 h-11 rounded-2xl bg-cyan-500/10 text-cyan-500 flex items-center justify-center mx-auto">
              <Search className="w-5 h-5" />
            </div>
            <p className="text-sm font-bold text-stone-900 dark:text-white">No coaches found</p>
            <p className="text-[11px] text-stone-500 dark:text-stone-400">
              Try another name or language filter.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setLanguageFilter('all');
              }}
              className="min-h-[38px] px-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-[11px] font-bold cursor-pointer active:scale-95 transition-all"
            >
              Reset filters
            </button>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filteredCoaches.map((coach) => {
              const matchesCurrentLanguage = coach.supportedLanguages.includes(currentLanguage);

              return (
                <article
                  key={coach.id}
                  className="p-3.5 rounded-3xl bg-white dark:bg-[#11222D] border border-stone-200 dark:border-white/10 hover:border-cyan-500/50 transition-all shadow-xs space-y-3"
                >
                  <div className="flex items-start gap-3">
                    <div className="relative shrink-0">
                      <img
                        src={coach.avatar}
                        alt={coach.name}
                        className="w-14 h-14 rounded-2xl object-cover border-2 border-cyan-500/40"
                      />
                      <span className="absolute -bottom-1 -right-1 text-[12px] leading-none bg-stone-900 border border-white/15 px-1 py-0.5 rounded-md shadow-xs">
                        {coach.flag}
                      </span>
                    </div>

                    <div className="min-w-0 flex-1">
                      {/* Name gets its own full-width line so it never truncates */}
                      <h3 className="font-display font-black text-[15px] leading-tight text-stone-900 dark:text-white break-words">
                        {coach.name}
                      </h3>

                      <div className="mt-1 flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border border-cyan-500/20">
                          {coach.role}
                        </span>
                        {coach.isCustom && (
                          <span className="text-[9px] font-mono font-black uppercase tracking-wider px-1.5 py-0.5 rounded-lg bg-fuchsia-500/15 text-fuchsia-700 dark:text-fuchsia-300 border border-fuchsia-500/25">
                            Your bot
                          </span>
                        )}
                        {matchesCurrentLanguage && (
                          <span className="text-[9px] font-mono font-black uppercase tracking-wider px-1.5 py-0.5 rounded-lg bg-teal-500/15 text-teal-700 dark:text-teal-300 border border-teal-500/25">
                            {LANGUAGE_LABELS[currentLanguage]} ready
                          </span>
                        )}
                      </div>

                      <p className="mt-1.5 text-[11px] font-semibold text-teal-600 dark:text-teal-400 leading-snug line-clamp-2">
                        {coach.specialty}
                      </p>
                    </div>
                  </div>

                  <p className="text-[11.5px] text-stone-600 dark:text-stone-400 leading-relaxed line-clamp-2">
                    {coach.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-1.5">
                    {coach.supportedLanguages.map((language) => (
                      <span
                        key={language}
                        className={`text-[9.5px] font-bold px-1.5 py-0.5 rounded-lg border ${
                          language === currentLanguage
                            ? 'bg-teal-500/15 text-teal-700 dark:text-teal-300 border-teal-500/25'
                            : 'bg-stone-100 dark:bg-black/30 text-stone-600 dark:text-stone-300 border-stone-200 dark:border-white/10'
                        }`}
                      >
                        {LANGUAGE_LABELS[language]}
                      </span>
                    ))}
                    <span className="ml-auto text-[9.5px] font-mono font-bold text-stone-400">
                      {coach.practiceExamples.length} scenarios
                    </span>
                    {coach.isCustom && (
                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          openBuilder(coach);
                        }}
                        aria-label={`Edit ${coach.name}`}
                        className="ml-1 min-h-[26px] px-2 rounded-lg bg-stone-100 dark:bg-black/30 border border-stone-200 dark:border-white/10 text-[9.5px] font-bold text-stone-600 dark:text-stone-300 flex items-center gap-1 cursor-pointer active:scale-95 transition-all"
                      >
                        <Pencil className="w-3 h-3" />
                        Edit
                      </button>
                    )}
                  </div>

                  <button
                    onClick={() => handleOpenConfig(coach)}
                    aria-label={`Start a voice session with ${coach.name}`}
                    className="w-full min-h-[44px] px-3 rounded-2xl bg-cyan-600 hover:bg-cyan-500 text-white font-display font-black text-xs flex items-center justify-between gap-2 cursor-pointer active:scale-[0.99] transition-all shadow-sm"
                  >
                    <span className="flex items-center gap-1.5 min-w-0">
                      <Mic className="w-4 h-4 shrink-0" />
                      <span className="truncate">Start with {coachFirstName(coach)}</span>
                    </span>
                    <ChevronRight className="w-4 h-4 shrink-0" />
                  </button>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Recent voice sessions */}
      {latestSessions.length > 0 && (
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-black text-sm text-stone-900 dark:text-white flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-500" />
              Recent voice sessions
            </h2>
            <span className="text-[10px] font-mono text-stone-400">
              {latestSessions.length} latest
            </span>
          </div>

          <div className="space-y-1.5">
            {latestSessions.map((session) => {
              const sessionCoach = resolveCoach(session.agentId);
              return (
                <div
                  key={session.id}
                  className="flex items-center gap-2.5 p-2.5 rounded-2xl bg-white dark:bg-[#11222D] border border-stone-200 dark:border-white/10 shadow-xs"
                >
                  <img
                    src={sessionCoach.avatar}
                    alt={sessionCoach.name}
                    className="w-9 h-9 rounded-xl object-cover shrink-0 border border-cyan-500/30"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11.5px] font-black text-stone-900 dark:text-white truncate">
                        {sessionCoach.name}
                      </span>
                      {session.status === 'timeout' && (
                        <span className="shrink-0 text-[8.5px] font-mono font-bold uppercase tracking-wider px-1 py-0.5 rounded bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/25">
                          Timeout
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-stone-500 dark:text-stone-400 truncate">
                      {session.scenarioTitle || 'Free speaking practice'}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xs font-mono font-black text-cyan-700 dark:text-cyan-300">
                      {session.speechScoreAverage}%
                    </div>
                    <div className="text-[9px] font-mono text-stone-400">
                      {formatDuration(session.durationSeconds)} min
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ======================================================================= */}
      {/* COACH CONFIGURATION SHEET                                               */}
      {/* ======================================================================= */}
      {configuringCoach && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-[#11222D] rounded-t-3xl sm:rounded-3xl border border-stone-200 dark:border-white/15 p-4 sm:p-5 space-y-4 shadow-2xl max-h-[92vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between gap-3 pb-2 border-b border-stone-200 dark:border-white/10">
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src={configuringCoach.avatar}
                  alt={configuringCoach.name}
                  className="w-11 h-11 rounded-2xl object-cover border border-cyan-500/40 shrink-0"
                />
                <div className="min-w-0">
                  <h3 className="font-display font-black text-sm text-stone-900 dark:text-white break-words">
                    {configuringCoach.name}
                  </h3>
                  <p className="text-[11px] text-cyan-600 dark:text-cyan-400 font-semibold leading-snug break-words">
                    {configuringCoach.role} · {configuringCoach.specialty}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setConfiguringCoach(null)}
                aria-label="Close coach settings"
                className="shrink-0 w-8 h-8 rounded-full bg-stone-100 dark:bg-white/10 text-stone-500 hover:text-stone-900 dark:hover:text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Target Language Selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-900 dark:text-white">
                Target Speaking Language
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['cebuano', 'filipino', 'english'] as MajorAiLanguage[]).map((lang) => {
                  const isSupported = configuringCoach.supportedLanguages.includes(lang);
                  const isSelected = targetLang === lang;
                  return (
                    <button
                      key={lang}
                      disabled={!isSupported}
                      onClick={() => setTargetLang(lang)}
                      className={`min-h-[40px] p-2 rounded-2xl text-xs font-bold text-center border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-cyan-600 text-white border-cyan-400 shadow-xs'
                          : isSupported
                            ? 'bg-stone-50 dark:bg-black/30 border-stone-200 dark:border-white/10 text-stone-800 dark:text-stone-300 hover:border-cyan-400'
                            : 'opacity-40 cursor-not-allowed bg-stone-100 dark:bg-white/5 border-transparent text-stone-400'
                      }`}
                    >
                      {LANGUAGE_LABELS[lang]}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Practice Goal / Scenario Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-900 dark:text-white">
                Practice Goal / Scenario
              </label>
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {configuringCoach.practiceExamples.map((example, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setSelectedScenarioGoal(example)}
                    className={`w-full min-h-[40px] p-2.5 rounded-2xl border text-left text-xs cursor-pointer transition-all flex items-center justify-between gap-2 ${
                      selectedScenarioGoal === example
                        ? 'bg-cyan-50 dark:bg-cyan-950/60 border-cyan-500 text-stone-900 dark:text-white font-bold ring-1 ring-cyan-500/30'
                        : 'bg-stone-50 dark:bg-black/30 border-stone-200 dark:border-white/10 text-stone-700 dark:text-stone-300 hover:border-cyan-400'
                    }`}
                  >
                    <span className="min-w-0 break-words">{example}</span>
                    {selectedScenarioGoal === example && (
                      <Check className="w-4 h-4 text-cyan-500 shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Difficulty Level */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-900 dark:text-white">
                Difficulty Level
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['Beginner', 'Intermediate', 'Advanced'] as const).map((level) => (
                  <button
                    key={level}
                    onClick={() => setDifficulty(level)}
                    className={`min-h-[40px] p-2 rounded-2xl text-[11px] font-bold text-center border transition-all cursor-pointer ${
                      difficulty === level
                        ? 'bg-teal-600 text-white border-teal-400 shadow-xs'
                        : 'bg-stone-50 dark:bg-black/30 border-stone-200 dark:border-white/10 text-stone-800 dark:text-stone-300'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            {/* Session Duration & Free Plan Notice */}
            <div className="p-3 rounded-2xl bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-800/60 text-xs text-cyan-800 dark:text-cyan-200 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-cyan-700 dark:text-cyan-300">
                <Clock className="w-4 h-4 shrink-0" />
                <span>Session Duration: 2 Minutes (Free Plan)</span>
              </div>
              <p className="text-[11px] text-cyan-700/80 dark:text-cyan-300/80 leading-relaxed">
                You get a visible countdown, live transcript, and a full pronunciation score with
                coach recommendations when the session ends.
              </p>
            </div>

            {/* Start Button */}
            <button
              onClick={handleStartSession}
              className="w-full min-h-[50px] py-3 rounded-2xl bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white font-display font-black text-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-98 transition-all"
            >
              <Mic className="w-4 h-4" />
              <span>Start 2-Minute Voice Session</span>
            </button>
          </div>
        </div>
      )}

      {settingsOpen && <AgentSettingsSheet onClose={() => setSettingsOpen(false)} />}

      {builderOpen && (
        <CustomBotBuilderModal
          initialAgent={editingBot}
          defaultScope="voice"
          onClose={() => {
            setBuilderOpen(false);
            setEditingBot(null);
          }}
        />
      )}
    </div>
  );
};
