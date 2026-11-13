import React, { useMemo, useState } from 'react';
import { Search, X, Wrench, ChevronRight } from 'lucide-react';
import { UserProfile } from '../../types';
import {
  TOOLKIT_CATEGORIES,
  TOOLKIT_MODULES,
  ToolkitCategory,
  filterToolkitModules,
} from '../../data/toolkitModulesData';
import { getToolkitProgress } from '../../utils/toolkitProgress';
import { sounds } from '../../utils/soundEffects';

interface LearningToolsHubProps {
  profile?: UserProfile;
  onOpenTool: (toolId: string) => void;
}

const CATEGORY_LABELS: Record<ToolkitCategory, string> = {
  speaking: 'Speaking',
  core: 'Vocabulary & Grammar',
  comprehension: 'Listening & Reading',
  culture: 'Culture & Review',
};

export const LearningToolsHub: React.FC<LearningToolsHubProps> = ({ profile, onOpenTool }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | ToolkitCategory>('all');

  const toolkitProgress = useMemo(
    () => getToolkitProgress(profile?.completedLessons || []),
    [profile?.completedLessons]
  );

  const filteredModules = useMemo(
    () => filterToolkitModules(TOOLKIT_MODULES, selectedCategory, searchQuery),
    [selectedCategory, searchQuery]
  );

  const startedCount = TOOLKIT_MODULES.filter((tool) => (toolkitProgress[tool.id] || 0) > 0).length;

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      {/* Section Header */}
      <div className="flex items-start gap-3 px-1">
        <span className="p-2 rounded-2xl bg-teal-100 dark:bg-teal-950/80 text-teal-700 dark:text-teal-400 border border-teal-200/60 dark:border-teal-500/30 shadow-2xs shrink-0">
          <Wrench className="w-4 h-4" />
        </span>
        <div className="min-w-0">
          <h2 className="font-display font-black uppercase tracking-wider text-stone-900 dark:text-white text-xs sm:text-sm">
            13 Learning Tools
          </h2>
          <p className="text-[10.5px] text-stone-500 dark:text-stone-400 font-medium">
            Independent practice for speaking, vocabulary, comprehension, and culture.
          </p>
          <p className="text-[10px] font-mono font-bold text-teal-700 dark:text-teal-300 mt-1">
            {startedCount} of {TOOLKIT_MODULES.length} tools started
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search tools (e.g. voice, flashcards, grammar)..."
          className="w-full min-h-[44px] pl-10 pr-10 py-2.5 bg-white dark:bg-[#11222D] border border-stone-200/90 dark:border-white/10 focus:border-teal-500 dark:focus:border-teal-400 rounded-2xl text-xs text-stone-900 dark:text-white placeholder:text-stone-400 focus:outline-none transition-colors shadow-2xs"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => {
              sounds.playTap();
              setSearchQuery('');
            }}
            aria-label="Clear search"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-white/5 cursor-pointer transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Category Filters */}
      <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold" role="group" aria-label="Tool categories">
        {TOOLKIT_CATEGORIES.map((cat) => {
          const active = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => {
                sounds.playTap();
                setSelectedCategory(cat.id);
              }}
              aria-pressed={active}
              className={`min-h-[36px] px-3 py-1.5 rounded-xl transition-all cursor-pointer border ${
                active
                  ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                  : 'bg-white dark:bg-[#11222D] text-stone-600 dark:text-stone-400 border-stone-200/90 dark:border-white/10 hover:border-teal-400/50'
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Tool Grid */}
      {filteredModules.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {filteredModules.map((tool) => {
            const progress = toolkitProgress[tool.id] || 0;
            return (
              <button
                key={tool.id}
                type="button"
                onClick={() => {
                  sounds.playTap();
                  onOpenTool(tool.id);
                }}
                className="p-3 bg-white dark:bg-[#11222D] hover:bg-stone-50 dark:hover:bg-[#152B37] rounded-2xl border border-stone-200/90 dark:border-white/10 text-left transition-all active:scale-[0.98] cursor-pointer shadow-2xs group flex flex-col justify-between min-h-[136px]"
              >
                <div className="flex items-start justify-between w-full">
                  <span className="w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200/60 dark:border-teal-500/20 flex items-center justify-center text-lg shrink-0 group-hover:scale-105 transition-transform">
                    {tool.icon}
                  </span>
                  <span className="text-[10px] font-mono font-black text-stone-400 dark:text-stone-500">
                    #{tool.num}
                  </span>
                </div>

                <div className="my-1.5 w-full">
                  <h4 className="font-display font-black text-xs text-stone-900 dark:text-white leading-tight group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                    {tool.title}
                  </h4>
                  <p className="text-[10px] text-stone-500 dark:text-stone-400 line-clamp-2 mt-0.5 font-medium">
                    {tool.purpose}
                  </p>
                </div>

                <div className="pt-1 w-full space-y-1">
                  <div className="w-full bg-stone-100 dark:bg-stone-800 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-teal-500 h-full rounded-full transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[9px] font-mono text-stone-400 dark:text-stone-500">
                    <span className="truncate max-w-[72%] uppercase">{CATEGORY_LABELS[tool.category]}</span>
                    <span className="flex items-center gap-0.5 text-teal-600 dark:text-teal-400 font-bold shrink-0">
                      {progress}%
                      <ChevronRight className="w-2.5 h-2.5 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="p-8 rounded-3xl bg-white dark:bg-[#11222D] border border-dashed border-stone-300 dark:border-white/15 text-center space-y-1.5">
          <p className="text-2xl">🔍</p>
          <p className="font-display font-black text-sm text-stone-900 dark:text-white">No tools found</p>
          <p className="text-[11px] text-stone-500 dark:text-stone-400">
            Try a different search term or category.
          </p>
          <button
            type="button"
            onClick={() => {
              sounds.playTap();
              setSearchQuery('');
              setSelectedCategory('all');
            }}
            className="mt-1 px-3 py-1.5 rounded-xl bg-teal-50 dark:bg-teal-950/70 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-600/30 font-bold text-[11px] cursor-pointer"
          >
            Reset filters
          </button>
        </div>
      )}
    </div>
  );
};
