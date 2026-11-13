import React, { useState } from 'react';
import { Sparkles, Plus, Search, Edit, Volume2, Info } from 'lucide-react';
import { INITIAL_MODULES } from '@/src/data/curriculumData';

export function FlashcardsManagementView() {
  const [searchTerm, setSearchTerm] = useState('');

  // Extract all flashcard activities from lessons
  const flashcards = INITIAL_MODULES.flatMap((m) =>
    m.lessons.flatMap((l) =>
      l.activities
        .filter((a) => a.type === 'flashcard')
        .map((a) => ({
          ...a,
          lessonTitle: l.title,
          moduleTitle: m.title,
        }))
    )
  );

  const filtered = flashcards.filter((f) => {
    if (!searchTerm) return true;
    const s = searchTerm.toLowerCase();
    return (
      f.prompt.toLowerCase().includes(s) ||
      (f.promptBisaya && f.promptBisaya.toLowerCase().includes(s)) ||
      (f.explanation && f.explanation.toLowerCase().includes(s))
    );
  });

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-[#11222D] p-5 rounded-2xl border border-stone-200 dark:border-white/10 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-stone-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-teal-600" />
            Cultural Flashcards Repository (/admin/flashcards)
          </h2>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
            Review Bisaya vocabulary cards, phonetic guides, and regional cultural etiquette notes.
          </p>
        </div>

        <button
          onClick={() => alert('New Flashcard Creator')}
          className="px-4 py-2 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white flex items-center gap-1.5 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>New Flashcard</span>
        </button>
      </div>

      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search flashcards by Bisaya phrase, prompt, phonetic guide..."
          className="w-full pl-9 pr-4 py-2.5 rounded-xl text-xs bg-white dark:bg-[#11222D] border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((card) => (
          <div
            key={card.id}
            className="bg-white dark:bg-[#11222D] p-5 rounded-2xl border border-stone-200 dark:border-white/10 shadow-sm space-y-3 flex flex-col justify-between"
          >
            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400 block">
                {card.lessonTitle}
              </span>

              <h4 className="text-base font-black text-stone-900 dark:text-white">
                {card.promptBisaya || card.prompt}
              </h4>

              {card.phonetics && (
                <div className="text-xs font-medium text-stone-500 dark:text-stone-400 flex items-center gap-1.5">
                  <Volume2 className="w-3.5 h-3.5 text-indigo-500" />
                  <span>{card.phonetics}</span>
                </div>
              )}

              <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                {card.explanation || card.prompt}
              </p>

              {card.culturalNote && (
                <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 text-[11px] text-amber-900 dark:text-amber-200 flex items-start gap-1.5">
                  <Info className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                  <span>{card.culturalNote}</span>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-stone-100 dark:border-white/5 flex justify-end">
              <button
                onClick={() => alert(`Editing flashcard: ${card.promptBisaya}`)}
                className="px-3 py-1 rounded-lg text-xs font-semibold bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 transition-colors"
              >
                Edit Card
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
