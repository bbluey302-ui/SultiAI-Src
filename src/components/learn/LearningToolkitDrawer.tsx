import React, { useState } from 'react';
import { X, Search, ChevronRight } from 'lucide-react';
import {
  TOOLKIT_CATEGORIES,
  TOOLKIT_MODULES,
  ToolkitCategory,
  filterToolkitModules,
} from '../../data/toolkitModulesData';
import { sounds } from '../../utils/soundEffects';

interface LearningToolkitDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTool: (toolId: string) => void;
}

export const LearningToolkitDrawer: React.FC<LearningToolkitDrawerProps> = ({
  isOpen,
  onClose,
  onSelectTool,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | ToolkitCategory>('all');

  if (!isOpen) return null;

  const filteredModules = filterToolkitModules(TOOLKIT_MODULES, selectedCategory, searchQuery);

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in select-none">
      <div className="w-full max-w-md bg-white dark:bg-[#11222D] rounded-3xl p-5 shadow-2xl border border-stone-200 dark:border-white/10 space-y-4 max-h-[90vh] flex flex-col relative overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-stone-100 dark:border-white/5">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-2xl bg-teal-50 dark:bg-teal-950/70 text-teal-600 dark:text-teal-400 border border-teal-200 dark:border-teal-600/30 flex items-center justify-center font-bold text-lg shadow-2xs">
              🧰
            </div>
            <div>
              <h2 className="font-display font-black text-base text-stone-900 dark:text-white leading-tight">
                13 Learning Tools
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Integrated throughout your language journey
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

        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tools (e.g. voice, flashcards, grammar)..."
            className="w-full pl-9.5 pr-4 py-2 bg-stone-100 dark:bg-stone-800/70 border border-transparent focus:border-teal-500 rounded-2xl text-xs text-stone-900 dark:text-white placeholder:text-stone-400 focus:outline-none transition-colors"
          />
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pb-1 text-xs font-bold">
          {TOOLKIT_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                sounds.playTap();
                setSelectedCategory(cat.id);
              }}
              className={`px-3 py-1.5 rounded-xl shrink-0 transition-all cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'bg-stone-100 dark:bg-stone-800/60 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Modules List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {filteredModules.map((tool) => (
            <button
              key={tool.id}
              onClick={() => {
                sounds.playTap();
                onClose();
                onSelectTool(tool.id);
              }}
              className="w-full p-3 rounded-2xl bg-stone-50 dark:bg-[#152B37] border border-stone-200/80 dark:border-white/10 hover:border-teal-400 dark:hover:border-teal-500 transition-all flex items-center gap-3 text-left group cursor-pointer active:scale-99"
            >
              <div className="w-11 h-11 rounded-2xl bg-white dark:bg-stone-800/80 border border-stone-200/60 dark:border-white/10 flex items-center justify-center text-xl shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                {tool.icon}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-display font-black text-xs text-stone-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                    {tool.title}
                  </span>
                  <span className="text-[10px] font-mono text-stone-400">
                    #{tool.num}
                  </span>
                </div>
                <p className="text-[11px] text-stone-600 dark:text-stone-300 font-medium line-clamp-1 mt-0.5">
                  {tool.purpose}
                </p>
                {tool.gamificationMechanic && (
                  <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                    <span className="inline-flex items-center gap-1 text-[9px] font-mono font-bold text-teal-800 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/80 px-2 py-0.5 rounded-md border border-teal-200/50 dark:border-teal-600/30">
                      🎮 {tool.gamificationMechanic}
                    </span>
                  </div>
                )}
              </div>

              <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-teal-500 group-hover:translate-x-0.5 transition-all shrink-0" />
            </button>
          ))}
        </div>

        {/* Footer Brand Line */}
        <div className="pt-2 border-t border-stone-100 dark:border-white/5 text-center">
          <p className="text-[11px] font-mono font-medium text-stone-400">
            One language journey. Hundreds of challenges. One companion.
          </p>
        </div>
      </div>
    </div>
  );
};
