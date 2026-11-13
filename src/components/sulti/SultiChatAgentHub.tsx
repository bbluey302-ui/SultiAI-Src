import React, { useMemo, useState } from 'react';
import { 
  Search, Plus, ArrowLeft, MessageSquare, ChevronRight, 
  Sparkles, BookOpen, Trash2, Edit2, Archive, ArchiveRestore, 
  X, Check, AlertCircle, Clock, Settings2, Pencil, Bot
} from 'lucide-react';
import { AiCoach, AiConversation, ChatScenario, MajorAiLanguage, AiCoachId } from '../../types/aiHub';
import { SCENARIO_CATEGORIES, CHAT_SCENARIOS, ScenarioCategory } from '../../data/chatScenariosData';
import { resolveCoach, useCustomCoaches } from '../../services/customAgentsService';
import { AgentSettingsSheet } from './AgentSettingsSheet';
import { CustomBotBuilderModal } from './CustomBotBuilderModal';
import { sounds } from '../../utils/soundEffects';

interface SultiChatAgentHubProps {
  conversations: AiConversation[];
  targetLanguage: MajorAiLanguage;
  onBackToHub: () => void;
  onOpenConversation: (convoId: string) => void;
  onStartNewConversation: (params: {
    title: string;
    scenarioId?: string;
    scenarioTitle?: string;
    agentId: AiCoachId;
    targetLanguage: MajorAiLanguage;
    initialPrompt?: string;
  }) => void;
  onRenameConversation: (convoId: string, newTitle: string) => void;
  onArchiveConversation: (convoId: string, archive: boolean) => void;
  onDeleteConversation: (convoId: string) => void;
}

export const SultiChatAgentHub: React.FC<SultiChatAgentHubProps> = ({
  conversations,
  targetLanguage,
  onBackToHub,
  onOpenConversation,
  onStartNewConversation,
  onRenameConversation,
  onArchiveConversation,
  onDeleteConversation,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'scenarios' | 'history'>('scenarios');
  const [historyFilter, setHistoryFilter] = useState<'all' | 'active' | 'archived'>('active');

  // Modal dialog states
  const [renamingConvo, setRenamingConvo] = useState<{ id: string; currentTitle: string } | null>(null);
  const [renameInput, setRenameInput] = useState('');
  const [deletingConvoId, setDeletingConvoId] = useState<string | null>(null);

  // Learner-created bots + shared settings
  const customCoaches = useCustomCoaches();
  const chatBots = useMemo(
    () => customCoaches.filter((coach) => coach.scope === 'both' || coach.scope === 'chat'),
    [customCoaches]
  );
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [builderOpen, setBuilderOpen] = useState(false);
  const [editingBot, setEditingBot] = useState<AiCoach | null>(null);

  const openBuilder = (bot: AiCoach | null = null) => {
    sounds.playTap();
    setEditingBot(bot);
    setBuilderOpen(true);
  };

  const handleStartBotChat = (bot: AiCoach) => {
    sounds.playTap();
    const language = bot.supportedLanguages.includes(targetLanguage)
      ? targetLanguage
      : bot.primaryLanguage;
    onStartNewConversation({
      title: `Chat with ${bot.name}`,
      scenarioTitle: bot.practiceExamples[0] || bot.specialty,
      agentId: bot.id,
      targetLanguage: language,
      initialPrompt: bot.greetingMessage.text,
    });
  };

  // Filtered scenarios
  const filteredScenarios = CHAT_SCENARIOS.filter((scen) => {
    const matchesCategory = selectedCategory === 'all' || scen.category === selectedCategory;
    const matchesSearch = !searchQuery || 
      scen.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      scen.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      scen.categoryLabel.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Filtered conversations
  const filteredConversations = conversations.filter((convo) => {
    const matchesStatus = historyFilter === 'all' || convo.status === historyFilter;
    const matchesSearch = !searchQuery || 
      convo.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (convo.lastMessagePreview && convo.lastMessagePreview.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  const handleLaunchScenario = (scenario: ChatScenario) => {
    sounds.playTap();
    onStartNewConversation({
      title: scenario.title,
      scenarioId: scenario.id,
      scenarioTitle: scenario.title,
      agentId: scenario.recommendedCoachId,
      targetLanguage,
      initialPrompt: scenario.initialPrompt,
    });
  };

  const handleStartGeneralChat = () => {
    sounds.playTap();
    onStartNewConversation({
      title: `General Chat (${targetLanguage === 'cebuano' ? 'Bisaya' : targetLanguage})`,
      agentId: targetLanguage === 'filipino' ? 'mika' : (targetLanguage === 'english' ? 'adam' : 'jen'),
      targetLanguage,
    });
  };

  const handleConfirmRename = () => {
    if (renamingConvo && renameInput.trim()) {
      sounds.playTap();
      onRenameConversation(renamingConvo.id, renameInput.trim());
      setRenamingConvo(null);
      setRenameInput('');
    }
  };

  const handleConfirmDelete = () => {
    if (deletingConvoId) {
      sounds.playTap();
      onDeleteConversation(deletingConvoId);
      setDeletingConvoId(null);
    }
  };

  return (
    <div className="space-y-4 pb-12 select-none animate-in fade-in duration-200">
      {/* Top Bar with Back Button */}
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={() => {
            sounds.playTap();
            onBackToHub();
          }}
          className="p-2 rounded-2xl bg-stone-100 dark:bg-[#11222D] hover:bg-stone-200 dark:hover:bg-[#152B37] text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-white/10 flex items-center gap-1.5 text-xs font-bold cursor-pointer active:scale-95 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Sulti Hub</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              sounds.playTap();
              setSettingsOpen(true);
            }}
            aria-label="Chat settings"
            className="min-h-[34px] min-w-[34px] rounded-2xl bg-stone-100 dark:bg-[#11222D] hover:bg-stone-200 dark:hover:bg-[#152B37] text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-white/10 flex items-center justify-center cursor-pointer active:scale-95 transition-all"
          >
            <Settings2 className="w-4 h-4" />
          </button>
          <button
            onClick={handleStartGeneralChat}
            className="px-3 py-1.5 rounded-2xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all shadow-md"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Chat</span>
          </button>
        </div>
      </div>

      {/* Screen Title */}
      <div>
        <h1 className="text-xl sm:text-2xl font-display font-black text-stone-900 dark:text-white">
          Sulti AI Chat Agent
        </h1>
        <p className="text-xs text-[#8E9BAE]">
          Choose a scenario or continue a persistent conversation with smart feedback.
        </p>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search scenarios or conversations..."
          className="w-full pl-9 pr-4 py-2.5 rounded-2xl bg-white dark:bg-[#11222D] border border-stone-200 dark:border-white/10 text-xs text-stone-900 dark:text-white placeholder-stone-400 focus:outline-none focus:border-teal-500 transition-colors shadow-xs"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 p-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* View Switcher: Scenarios vs My Conversations */}
      <div className="flex items-center p-1 rounded-2xl bg-stone-100 dark:bg-[#11222D] border border-stone-200 dark:border-white/10">
        <button
          onClick={() => {
            sounds.playTap();
            setActiveTab('scenarios');
          }}
          className={`flex-1 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === 'scenarios'
              ? 'bg-teal-600 text-white shadow-xs'
              : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Practice a Scenario</span>
        </button>
        <button
          onClick={() => {
            sounds.playTap();
            setActiveTab('history');
          }}
          className={`flex-1 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === 'history'
              ? 'bg-teal-600 text-white shadow-xs'
              : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>My Conversations ({conversations.length})</span>
        </button>
      </div>

      {/* ======================================================================= */}
      {/* TAB 1: PRACTICE A SCENARIO (Categorized by 8 categories)                */}
      {/* ======================================================================= */}
      {activeTab === 'scenarios' && (
        <div className="space-y-4">
          {/* Your own bots */}
          <section className="space-y-2">
            <div className="flex items-end justify-between gap-2">
              <div className="min-w-0">
                <h2 className="font-display font-black text-sm text-stone-900 dark:text-white flex items-center gap-1.5">
                  <Bot className="w-3.5 h-3.5 text-teal-500" />
                  Your bots
                </h2>
                <p className="text-[10.5px] text-stone-500 dark:text-stone-400">
                  {chatBots.length > 0
                    ? `${chatBots.length} custom coach${chatBots.length > 1 ? 'es' : ''} on this device`
                    : 'Create a coach with its own personality and scenarios.'}
                </p>
              </div>
              <button
                onClick={() => openBuilder(null)}
                className="shrink-0 min-h-[32px] px-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-[11px] flex items-center gap-1 cursor-pointer active:scale-95 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create bot</span>
              </button>
            </div>

            {chatBots.length > 0 && (
              <div className="grid grid-cols-1 gap-2">
                {chatBots.map((bot) => (
                  <div
                    key={bot.id}
                    className="p-2.5 rounded-3xl bg-white dark:bg-[#11222D] border border-stone-200 dark:border-white/10 flex items-center gap-2.5 shadow-xs"
                  >
                    <img
                      src={bot.avatar}
                      alt={bot.name}
                      className="w-10 h-10 rounded-2xl object-cover shrink-0 border border-teal-500/30"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-bold text-xs text-stone-900 dark:text-white truncate">
                          {bot.name}
                        </h3>
                        <span className="shrink-0 text-[8.5px] font-mono font-black uppercase tracking-wider px-1 py-0.5 rounded bg-fuchsia-500/15 text-fuchsia-700 dark:text-fuchsia-300 border border-fuchsia-500/25">
                          Your bot
                        </span>
                      </div>
                      <p className="text-[10.5px] text-stone-500 dark:text-stone-400 truncate">
                        {bot.role} · {bot.specialty}
                      </p>
                    </div>
                    <button
                      onClick={() => handleStartBotChat(bot)}
                      className="shrink-0 min-h-[32px] px-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-[11px] cursor-pointer active:scale-95 transition-all"
                    >
                      Chat
                    </button>
                    <button
                      onClick={() => openBuilder(bot)}
                      aria-label={`Edit ${bot.name}`}
                      className="shrink-0 w-8 h-8 rounded-xl text-stone-500 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-white/10 flex items-center justify-center cursor-pointer"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Horizontal Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => {
                sounds.playTap();
                setSelectedCategory('all');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                selectedCategory === 'all'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'bg-stone-100 dark:bg-[#11222D] text-stone-600 dark:text-stone-400 border border-stone-200 dark:border-white/10'
              }`}
            >
              All Scenarios
            </button>
            {SCENARIO_CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    sounds.playTap();
                    setSelectedCategory(cat.id);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-teal-600 text-white shadow-xs'
                      : 'bg-stone-100 dark:bg-[#11222D] text-stone-600 dark:text-stone-400 border border-stone-200 dark:border-white/10 hover:border-teal-400'
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.name}</span>
                </button>
              );
            })}
          </div>

          {/* Scenarios Grid */}
          {filteredScenarios.length === 0 ? (
            <div className="p-8 text-center rounded-3xl bg-white dark:bg-[#11222D] border border-stone-200 dark:border-white/10 space-y-2">
              <p className="text-sm font-bold text-stone-900 dark:text-white">No scenarios found</p>
              <p className="text-xs text-stone-500 dark:text-stone-400">Try adjusting your search query or category filter.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-2.5">
              {filteredScenarios.map((scen) => {
                const coach = resolveCoach(scen.recommendedCoachId);
                return (
                  <div
                    key={scen.id}
                    onClick={() => handleLaunchScenario(scen)}
                    className="group p-4 rounded-3xl bg-white dark:bg-[#11222D] hover:bg-stone-50 dark:hover:bg-[#152B37] border border-stone-200 dark:border-white/10 hover:border-teal-500/50 transition-all cursor-pointer shadow-xs active:scale-[0.99] space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-lg bg-teal-500/10 text-teal-400 font-bold uppercase tracking-wider">
                            {scen.categoryLabel}
                          </span>
                          <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-lg font-bold ${
                            scen.difficulty === 'Beginner'
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : scen.difficulty === 'Intermediate'
                              ? 'bg-amber-500/10 text-amber-400'
                              : 'bg-rose-500/10 text-rose-400'
                          }`}>
                            {scen.difficulty}
                          </span>
                        </div>
                        <h3 className="font-display font-black text-sm text-stone-900 dark:text-white group-hover:text-teal-400 transition-colors">
                          {scen.title}
                        </h3>
                      </div>

                      {/* Coach Avatar */}
                      <div className="flex items-center gap-1.5 shrink-0 bg-stone-100 dark:bg-[#0A121D] px-2 py-1 rounded-2xl border border-stone-200 dark:border-white/10">
                        <img
                          src={coach.avatar}
                          alt={coach.name}
                          className="w-6 h-6 rounded-full object-cover"
                        />
                        <span className="text-[10px] font-bold text-stone-700 dark:text-stone-300 hidden sm:inline">
                          {coach.name}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-stone-600 dark:text-[#8E9BAE] leading-relaxed">
                      {scen.description}
                    </p>

                    <div className="pt-1 flex items-center justify-between text-xs border-t border-stone-100 dark:border-white/5">
                      <span className="text-[11px] text-stone-500 dark:text-stone-400 truncate max-w-[200px]">
                        🎯 {scen.suggestedGoal}
                      </span>
                      <div className="flex items-center gap-1 text-teal-600 dark:text-teal-400 font-bold group-hover:translate-x-1 transition-transform">
                        <span>Start Scenario</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ======================================================================= */}
      {/* TAB 2: MY CONVERSATIONS (History Management, Rename, Archive, Delete)   */}
      {/* ======================================================================= */}
      {activeTab === 'history' && (
        <div className="space-y-3">
          {/* Status Sub-filter */}
          <div className="flex items-center gap-1.5">
            {(['active', 'archived', 'all'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => {
                  sounds.playTap();
                  setHistoryFilter(filter);
                }}
                className={`px-3 py-1 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer ${
                  historyFilter === filter
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'bg-stone-100 dark:bg-[#11222D] text-stone-600 dark:text-stone-400 border border-stone-200 dark:border-white/10'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>

          {filteredConversations.length === 0 ? (
            <div className="p-8 text-center rounded-3xl bg-white dark:bg-[#11222D] border border-stone-200 dark:border-white/10 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-teal-500/10 text-teal-400 flex items-center justify-center mx-auto text-xl">
                💬
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-stone-900 dark:text-white">
                  No {historyFilter !== 'all' ? historyFilter : ''} conversations found
                </p>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  Start a scenario or general chat above to begin your persistent conversation history.
                </p>
              </div>
              <button
                onClick={handleStartGeneralChat}
                className="px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs cursor-pointer"
              >
                Start a Conversation
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredConversations.map((convo) => {
                const coach = resolveCoach(convo.agentId);
                const isArchived = convo.status === 'archived';

                return (
                  <div
                    key={convo.id}
                    className="p-3.5 rounded-3xl bg-white dark:bg-[#11222D] border border-stone-200 dark:border-white/10 hover:border-teal-500/40 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs"
                  >
                    <div
                      onClick={() => {
                        sounds.playTap();
                        onOpenConversation(convo.id);
                      }}
                      className="flex items-center gap-3 min-w-0 cursor-pointer flex-1"
                    >
                      <img
                        src={coach.avatar}
                        alt={coach.name}
                        className="w-10 h-10 rounded-2xl object-cover shrink-0 border border-teal-500/30"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-xs text-stone-900 dark:text-white truncate">
                            {convo.title}
                          </h4>
                          {isArchived && (
                            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-stone-500/20 text-stone-400">
                              Archived
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-stone-500 dark:text-stone-400 truncate mt-0.5">
                          {convo.lastMessagePreview || `Conversation with ${coach.name}`}
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-[10px] font-mono text-stone-400">
                          <span>{coach.name}</span>
                          <span>•</span>
                          <span className="capitalize">{convo.targetLanguage}</span>
                          <span>•</span>
                          <span>{new Date(convo.updatedAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions: Resume, Rename, Archive, Delete */}
                    <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                      <button
                        onClick={() => {
                          sounds.playTap();
                          onOpenConversation(convo.id);
                        }}
                        className="px-2.5 py-1 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs cursor-pointer transition-colors shadow-xs"
                      >
                        Resume
                      </button>

                      <button
                        onClick={() => {
                          sounds.playTap();
                          setRenamingConvo({ id: convo.id, currentTitle: convo.title });
                          setRenameInput(convo.title);
                        }}
                        className="p-1.5 rounded-xl hover:bg-stone-100 dark:hover:bg-white/10 text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white cursor-pointer"
                        title="Rename conversation"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => {
                          sounds.playTap();
                          onArchiveConversation(convo.id, !isArchived);
                        }}
                        className="p-1.5 rounded-xl hover:bg-stone-100 dark:hover:bg-white/10 text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white cursor-pointer"
                        title={isArchived ? 'Restore conversation' : 'Archive conversation'}
                      >
                        {isArchived ? <ArchiveRestore className="w-3.5 h-3.5" /> : <Archive className="w-3.5 h-3.5" />}
                      </button>

                      <button
                        onClick={() => {
                          sounds.playTap();
                          setDeletingConvoId(convo.id);
                        }}
                        className="p-1.5 rounded-xl hover:bg-rose-500/10 text-stone-500 dark:text-stone-400 hover:text-rose-500 cursor-pointer"
                        title="Delete conversation"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ======================================================================= */}
      {/* RENAME CONVERSATION MODAL                                               */}
      {/* ======================================================================= */}
      {renamingConvo && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-[#11222D] border border-stone-200 dark:border-white/15 p-5 space-y-4 shadow-2xl">
            <h3 className="font-display font-black text-sm text-stone-900 dark:text-white">
              Rename Conversation
            </h3>
            <input
              type="text"
              value={renameInput}
              onChange={(e) => setRenameInput(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-black/40 border border-stone-200 dark:border-white/10 text-xs text-stone-900 dark:text-white focus:outline-none focus:border-teal-500"
              placeholder="Conversation title..."
              autoFocus
            />
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                onClick={() => setRenamingConvo(null)}
                className="px-3 py-1.5 rounded-xl bg-stone-100 dark:bg-white/10 text-stone-700 dark:text-stone-300 font-bold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmRename}
                className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs cursor-pointer"
              >
                Save Title
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================================= */}
      {/* DELETE CONFIRMATION DIALOG                                              */}
      {/* ======================================================================= */}
      {deletingConvoId && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-[#11222D] border border-rose-500/30 p-5 space-y-3 shadow-2xl">
            <div className="flex items-center gap-2 text-rose-500 font-bold text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>Delete Conversation?</span>
            </div>
            <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
              Are you sure you want to delete this conversation workspace? This action cannot be undone and will permanently remove all message history for this session.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setDeletingConvoId(null)}
                className="px-3 py-1.5 rounded-xl bg-stone-100 dark:bg-white/10 text-stone-700 dark:text-stone-300 font-bold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs cursor-pointer"
              >
                Delete Session
              </button>
            </div>
          </div>
        </div>
      )}

      {settingsOpen && <AgentSettingsSheet onClose={() => setSettingsOpen(false)} />}

      {builderOpen && (
        <CustomBotBuilderModal
          initialAgent={editingBot}
          defaultScope="chat"
          onClose={() => {
            setBuilderOpen(false);
            setEditingBot(null);
          }}
        />
      )}
    </div>
  );
};
