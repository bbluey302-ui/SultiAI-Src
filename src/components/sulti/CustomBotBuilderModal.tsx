import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Bot,
  Check,
  Languages,
  MessageSquare,
  Mic,
  Save,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import type { AiCoach, BaseVoiceId, CoachScope, MajorAiLanguage } from '../../types/aiHub';
import {
  CUSTOM_ACCENTS,
  CUSTOM_AVATARS,
  CUSTOM_FLAGS,
  CUSTOM_VOICES,
  LANGUAGE_OPTIONS,
  createCustomCoachId,
  deleteCustomCoach,
  saveCustomCoach,
} from '../../services/customAgentsService';
import { sounds } from '../../utils/soundEffects';

interface CustomBotBuilderModalProps {
  /** Pass a bot to edit it, or null to create a new one. */
  initialAgent?: AiCoach | null;
  defaultScope?: CoachScope;
  onClose: () => void;
  onSaved?: (agent: AiCoach) => void;
  onDeleted?: (agentId: string) => void;
}

const LANGUAGE_LABEL: Record<MajorAiLanguage, string> = {
  cebuano: 'Bisaya / Cebuano',
  filipino: 'Filipino / Tagalog',
  english: 'English',
};

const DEFAULT_GREETING: Record<MajorAiLanguage, { text: string; translation: string }> = {
  cebuano: {
    text: 'Kumusta! Ako ang imong bag-ong coach. Andam na ba ka magpraktis uban kanako?',
    translation: 'Hello! I am your new coach. Are you ready to practise with me?',
  },
  filipino: {
    text: 'Kumusta! Ako ang iyong bagong coach. Handa ka na bang magsanay kasama ako?',
    translation: 'Hello! I am your new coach. Are you ready to practise with me?',
  },
  english: {
    text: 'Hello! I am your new coach. Shall we start practising together?',
    translation: 'Kumusta! Ako ang imong bag-ong coach. Magpraktis na ba ta?',
  },
};

const SCOPE_OPTIONS: { id: CoachScope; label: string; hint: string; icon: React.ReactNode }[] = [
  {
    id: 'both',
    label: 'Chat + Voice',
    hint: 'Available in both agent hubs',
    icon: <Sparkles className="w-4 h-4" />,
  },
  {
    id: 'chat',
    label: 'Chat only',
    hint: 'Text conversations',
    icon: <MessageSquare className="w-4 h-4" />,
  },
  {
    id: 'voice',
    label: 'Voice only',
    hint: '2-minute speaking drills',
    icon: <Mic className="w-4 h-4" />,
  },
];

export const CustomBotBuilderModal: React.FC<CustomBotBuilderModalProps> = ({
  initialAgent = null,
  defaultScope = 'both',
  onClose,
  onSaved,
  onDeleted,
}) => {
  const isEditing = Boolean(initialAgent);

  const [name, setName] = useState(initialAgent?.name ?? '');
  const [role, setRole] = useState(initialAgent?.role ?? 'Bisaya Coach');
  const [specialty, setSpecialty] = useState(
    initialAgent?.specialty ?? 'Everyday Bisaya conversation practice'
  );
  const [description, setDescription] = useState(initialAgent?.description ?? '');
  const [persona, setPersona] = useState(initialAgent?.persona ?? '');
  const [supportedLanguages, setSupportedLanguages] = useState<MajorAiLanguage[]>(
    initialAgent?.supportedLanguages ?? ['cebuano', 'english']
  );
  const [primaryLanguage, setPrimaryLanguage] = useState<MajorAiLanguage>(
    initialAgent?.primaryLanguage ?? 'cebuano'
  );
  const [greetingText, setGreetingText] = useState(
    initialAgent?.greetingMessage.text ?? ''
  );
  const [greetingTranslation, setGreetingTranslation] = useState(
    initialAgent?.greetingMessage.translation ?? ''
  );
  const [practiceExamples, setPracticeExamples] = useState(
    (initialAgent?.practiceExamples ?? []).join('\n')
  );
  const [avatar, setAvatar] = useState(initialAgent?.avatar ?? CUSTOM_AVATARS[0]);
  const [flag, setFlag] = useState(initialAgent?.flag ?? '🇵🇭');
  const [accentColor, setAccentColor] = useState(
    initialAgent?.accentColor ?? CUSTOM_ACCENTS[0]
  );
  const [voiceAgentId, setVoiceAgentId] = useState<BaseVoiceId>(
    initialAgent?.voiceAgentId ?? 'jen'
  );
  const [scope, setScope] = useState<CoachScope>(initialAgent?.scope ?? defaultScope);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const availableLanguages = useMemo(
    () => LANGUAGE_OPTIONS.filter((option) => supportedLanguages.includes(option.id)),
    [supportedLanguages]
  );

  const toggleLanguage = (language: MajorAiLanguage) => {
    sounds.playTap();
    setSupportedLanguages((prev) => {
      const next = prev.includes(language)
        ? prev.filter((entry) => entry !== language)
        : [...prev, language];
      if (next.length === 0) return prev;
      if (!next.includes(primaryLanguage)) setPrimaryLanguage(next[0]);
      return next;
    });
  };

  const handleSave = () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Give your bot a name first.');
      return;
    }
    if (supportedLanguages.length === 0) {
      setError('Choose at least one language.');
      return;
    }

    const defaults = DEFAULT_GREETING[primaryLanguage];
    const examples = practiceExamples
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .slice(0, 8);

    const built: AiCoach = {
      id: initialAgent?.id ?? createCustomCoachId(),
      name: trimmedName,
      role: role.trim() || 'Language Coach',
      specialty: specialty.trim() || 'Personalised conversation practice',
      tagline: description.trim(),
      description:
        description.trim() ||
        persona.trim() ||
        'Your own Sulti AI coach for friendly, focused speaking practice.',
      avatar,
      flag,
      accentColor,
      supportedLanguages,
      primaryLanguage,
      recommendedCategories: [],
      practiceExamples:
        examples.length > 0 ? examples : ['Free conversation practice with your own coach'],
      systemPromptIntro:
        persona.trim() ||
        `You are "${trimmedName}", a ${role.trim() || 'language'} coach created by the learner.`,
      greetingMessage: {
        text: greetingText.trim() || defaults.text,
        translation: greetingTranslation.trim() || defaults.translation,
        language: primaryLanguage,
      },
      isCustom: true,
      scope,
      voiceAgentId,
      persona: persona.trim(),
      createdAt: initialAgent?.createdAt ?? new Date().toISOString(),
    };

    try {
      const stored = saveCustomCoach(built);
      sounds.playCorrect();
      onSaved?.(stored);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Could not save this bot.');
    }
  };

  const handleDelete = () => {
    if (!initialAgent) return;
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    deleteCustomCoach(initialAgent.id);
    sounds.playTap();
    onDeleted?.(initialAgent.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
      <div className="w-full max-w-md bg-white dark:bg-[#11222D] rounded-t-3xl sm:rounded-3xl border border-stone-200 dark:border-white/15 shadow-2xl max-h-[93vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-stone-200 dark:border-white/10 flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <span
              className="shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center text-white"
              style={{ backgroundColor: accentColor }}
            >
              <Bot className="w-5 h-5" />
            </span>
            <div className="min-w-0">
              <h3 className="font-display font-black text-sm text-stone-900 dark:text-white truncate">
                {isEditing ? 'Edit your bot' : 'Create your own bot'}
              </h3>
              <p className="text-[10.5px] text-stone-500 dark:text-stone-400">
                {isEditing ? 'Changes apply to your next session.' : 'Saved on this device.'}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              sounds.playTap();
              onClose();
            }}
            aria-label="Close bot builder"
            className="shrink-0 w-8 h-8 rounded-full bg-stone-100 dark:bg-white/10 text-stone-500 hover:text-stone-900 dark:hover:text-white flex items-center justify-center cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-4 overflow-y-auto">
          {/* Avatar + flag */}
          <section className="space-y-2">
            <label className="text-xs font-bold text-stone-900 dark:text-white">Look</label>
            <div className="flex items-center gap-3">
              <img
                src={avatar}
                alt="Selected bot avatar"
                className="w-14 h-14 rounded-2xl object-cover border-2 shrink-0"
                style={{ borderColor: accentColor }}
              />
              <div className="-mx-1 px-1 flex-1 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {CUSTOM_AVATARS.map((url) => (
                  <button
                    key={url}
                    type="button"
                    onClick={() => {
                      sounds.playTap();
                      setAvatar(url);
                    }}
                    aria-label="Choose avatar"
                    className={`shrink-0 w-10 h-10 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                      avatar === url ? 'border-cyan-500 scale-105' : 'border-transparent opacity-70'
                    }`}
                  >
                    <img src={url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              {CUSTOM_FLAGS.map((entry) => (
                <button
                  key={entry}
                  type="button"
                  onClick={() => {
                    sounds.playTap();
                    setFlag(entry);
                  }}
                  className={`w-8 h-8 rounded-lg border text-sm flex items-center justify-center cursor-pointer ${
                    flag === entry
                      ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-950/50'
                      : 'border-stone-200 dark:border-white/10'
                  }`}
                >
                  {entry}
                </button>
              ))}
              {CUSTOM_ACCENTS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => {
                    sounds.playTap();
                    setAccentColor(color);
                  }}
                  aria-label={`Use accent ${color}`}
                  className={`w-6 h-6 rounded-full border-2 cursor-pointer ${
                    accentColor === color ? 'border-stone-900 dark:border-white' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </section>

          {/* Identity */}
          <section className="space-y-2">
            <label htmlFor="bot-name" className="text-xs font-bold text-stone-900 dark:text-white">
              Name
            </label>
            <input
              id="bot-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={50}
              placeholder="e.g. Maria, Barangay Tour Guide"
              className="w-full min-h-[42px] px-3 rounded-2xl bg-stone-50 dark:bg-black/30 border border-stone-200 dark:border-white/10 text-xs text-stone-900 dark:text-white placeholder-stone-400 focus:outline-none focus:border-cyan-500"
            />

            <div className="grid grid-cols-2 gap-2">
              <input
                value={role}
                onChange={(event) => setRole(event.target.value)}
                maxLength={60}
                placeholder="Role (e.g. Market Guide)"
                aria-label="Bot role"
                className="min-h-[42px] px-3 rounded-2xl bg-stone-50 dark:bg-black/30 border border-stone-200 dark:border-white/10 text-xs text-stone-900 dark:text-white placeholder-stone-400 focus:outline-none focus:border-cyan-500"
              />
              <input
                value={specialty}
                onChange={(event) => setSpecialty(event.target.value)}
                maxLength={90}
                placeholder="Specialty"
                aria-label="Bot specialty"
                className="min-h-[42px] px-3 rounded-2xl bg-stone-50 dark:bg-black/30 border border-stone-200 dark:border-white/10 text-xs text-stone-900 dark:text-white placeholder-stone-400 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </section>

          {/* Languages */}
          <section className="space-y-2">
            <label className="text-xs font-bold text-stone-900 dark:text-white flex items-center gap-1.5">
              <Languages className="w-3.5 h-3.5 text-teal-500" />
              Languages
            </label>
            <div className="flex flex-wrap gap-1.5">
              {LANGUAGE_OPTIONS.map((option) => {
                const active = supportedLanguages.includes(option.id);
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => toggleLanguage(option.id)}
                    aria-pressed={active}
                    className={`min-h-[34px] px-2.5 rounded-xl text-[11px] font-bold border transition-all cursor-pointer flex items-center gap-1 ${
                      active
                        ? 'bg-teal-600 text-white border-teal-500'
                        : 'bg-stone-100 dark:bg-black/30 text-stone-600 dark:text-stone-300 border-stone-200 dark:border-white/10'
                    }`}
                  >
                    {active && <Check className="w-3 h-3" />}
                    {option.label}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] text-stone-500 dark:text-stone-400">Teaches in</span>
              <select
                value={primaryLanguage}
                onChange={(event) =>
                  setPrimaryLanguage(event.target.value as MajorAiLanguage)
                }
                aria-label="Primary teaching language"
                className="flex-1 min-h-[36px] px-2 rounded-xl bg-stone-50 dark:bg-black/30 border border-stone-200 dark:border-white/10 text-[11px] font-bold text-stone-900 dark:text-white focus:outline-none focus:border-cyan-500"
              >
                {availableLanguages.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </section>

          {/* Personality */}
          <section className="space-y-2">
            <label
              htmlFor="bot-persona"
              className="text-xs font-bold text-stone-900 dark:text-white"
            >
              Personality &amp; teaching style
            </label>
            <textarea
              id="bot-persona"
              value={persona}
              onChange={(event) => setPersona(event.target.value)}
              rows={3}
              maxLength={900}
              placeholder="e.g. Patient and playful. Uses Davao Bisaya, corrects gently, and always gives an English translation."
              className="w-full px-3 py-2 rounded-2xl bg-stone-50 dark:bg-black/30 border border-stone-200 dark:border-white/10 text-xs text-stone-900 dark:text-white placeholder-stone-400 focus:outline-none focus:border-cyan-500 resize-none"
            />
            <input
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              maxLength={280}
              placeholder="Short description shown on the bot card"
              aria-label="Bot description"
              className="w-full min-h-[42px] px-3 rounded-2xl bg-stone-50 dark:bg-black/30 border border-stone-200 dark:border-white/10 text-xs text-stone-900 dark:text-white placeholder-stone-400 focus:outline-none focus:border-cyan-500"
            />
            <textarea
              value={practiceExamples}
              onChange={(event) => setPracticeExamples(event.target.value)}
              rows={3}
              placeholder={'Scenarios, one per line\ne.g. Ordering at a carenderia\nRiding a jeepney'}
              aria-label="Practice scenarios"
              className="w-full px-3 py-2 rounded-2xl bg-stone-50 dark:bg-black/30 border border-stone-200 dark:border-white/10 text-xs text-stone-900 dark:text-white placeholder-stone-400 focus:outline-none focus:border-cyan-500 resize-none"
            />
          </section>

          {/* Greeting */}
          <section className="space-y-2">
            <label
              htmlFor="bot-greeting"
              className="text-xs font-bold text-stone-900 dark:text-white"
            >
              Opening line
            </label>
            <textarea
              id="bot-greeting"
              value={greetingText}
              onChange={(event) => setGreetingText(event.target.value)}
              rows={2}
              maxLength={400}
              placeholder={DEFAULT_GREETING[primaryLanguage].text}
              className="w-full px-3 py-2 rounded-2xl bg-stone-50 dark:bg-black/30 border border-stone-200 dark:border-white/10 text-xs text-stone-900 dark:text-white placeholder-stone-400 focus:outline-none focus:border-cyan-500 resize-none"
            />
            <textarea
              value={greetingTranslation}
              onChange={(event) => setGreetingTranslation(event.target.value)}
              rows={2}
              maxLength={400}
              placeholder={`English translation: ${DEFAULT_GREETING[primaryLanguage].translation}`}
              aria-label="Greeting English translation"
              className="w-full px-3 py-2 rounded-2xl bg-stone-50 dark:bg-black/30 border border-stone-200 dark:border-white/10 text-xs text-stone-900 dark:text-white placeholder-stone-400 focus:outline-none focus:border-cyan-500 resize-none"
            />
          </section>

          {/* Voice */}
          <section className="space-y-2">
            <label className="text-xs font-bold text-stone-900 dark:text-white flex items-center gap-1.5">
              <Mic className="w-3.5 h-3.5 text-cyan-500" />
              Speaking voice
            </label>
            <div className="space-y-1.5">
              {CUSTOM_VOICES.map((voice) => {
                const active = voiceAgentId === voice.id;
                return (
                  <button
                    key={voice.id}
                    type="button"
                    onClick={() => {
                      sounds.playTap();
                      setVoiceAgentId(voice.id);
                    }}
                    aria-pressed={active}
                    className={`w-full p-2.5 rounded-2xl border text-left flex items-center justify-between gap-2 cursor-pointer transition-all ${
                      active
                        ? 'bg-cyan-50 dark:bg-cyan-950/50 border-cyan-500'
                        : 'bg-stone-50 dark:bg-black/30 border-stone-200 dark:border-white/10'
                    }`}
                  >
                    <span className="min-w-0">
                      <span className="block text-[11.5px] font-black text-stone-900 dark:text-white">
                        {voice.label}
                      </span>
                      <span className="block text-[10px] text-stone-500 dark:text-stone-400">
                        {voice.hint}
                      </span>
                    </span>
                    {active && <Check className="w-4 h-4 text-cyan-500 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Scope */}
          <section className="space-y-2">
            <label className="text-xs font-bold text-stone-900 dark:text-white">
              Where can you use it?
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {SCOPE_OPTIONS.map((option) => {
                const active = scope === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => {
                      sounds.playTap();
                      setScope(option.id);
                    }}
                    aria-pressed={active}
                    className={`p-2 rounded-2xl border text-center transition-all cursor-pointer ${
                      active
                        ? 'bg-cyan-600 text-white border-cyan-500'
                        : 'bg-stone-50 dark:bg-black/30 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-white/10'
                    }`}
                  >
                    <span className="flex justify-center mb-0.5">{option.icon}</span>
                    <span className="block text-[10px] font-black leading-tight">
                      {option.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          {error && (
            <div className="flex items-start gap-2 p-2.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-[11px] text-rose-600 dark:text-rose-300">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-stone-200 dark:border-white/10 space-y-2">
          <button
            onClick={handleSave}
            className="w-full min-h-[46px] rounded-2xl bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white font-display font-black text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md active:scale-98 transition-all"
          >
            <Save className="w-4 h-4" />
            <span>{isEditing ? 'Save changes' : 'Create bot'}</span>
          </button>

          {isEditing && (
            <button
              onClick={handleDelete}
              className={`w-full min-h-[38px] rounded-2xl text-[11px] font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                confirmDelete
                  ? 'bg-rose-600 text-white'
                  : 'bg-rose-500/10 text-rose-600 dark:text-rose-300 hover:bg-rose-500/20'
              }`}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{confirmDelete ? 'Tap again to delete permanently' : 'Delete this bot'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
