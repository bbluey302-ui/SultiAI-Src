import React, { useState } from 'react';
import { Layers, Plus, BookOpen, Edit, CheckCircle, Sparkles } from 'lucide-react';
import { INITIAL_MODULES } from '@/src/data/curriculumData';
import { Module } from '@/src/types';

export function ModulesManagementView() {
  const [modules, setModules] = useState<Module[]>(INITIAL_MODULES);

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-[#11222D] p-5 rounded-2xl border border-stone-200 dark:border-white/10 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-stone-900 dark:text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-teal-600" />
            Instructional Modules Manager (/admin/modules)
          </h2>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
            Organize thematic progression tracks from basic daily greetings to complex market negotiations.
          </p>
        </div>

        <button
          onClick={() => alert('New Module Dialog')}
          className="px-4 py-2 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white flex items-center gap-1.5 shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Module</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {modules.map((m, idx) => (
          <div
            key={m.id}
            className="bg-white dark:bg-[#11222D] rounded-2xl p-5 border border-stone-200 dark:border-white/10 shadow-sm space-y-4 hover:border-teal-500/50 transition-all"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-600 flex items-center justify-center font-bold text-sm">
                  #{idx + 1}
                </div>
                <div>
                  <h3 className="font-bold text-stone-900 dark:text-white text-sm">{m.title}</h3>
                  <span className="text-xs font-medium text-teal-600 block">{m.titleBisaya}</span>
                </div>
              </div>

              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                ACTIVE
              </span>
            </div>

            <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
              {m.description}
            </p>

            <div className="pt-3 border-t border-stone-100 dark:border-white/5 flex items-center justify-between text-xs">
              <span className="font-semibold text-stone-500">
                📚 {m.lessons.length} Core Lessons Assigned
              </span>
              <button
                onClick={() => alert(`Editing module: ${m.title}`)}
                className="px-3 py-1 rounded-lg bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 font-semibold transition-colors"
              >
                Configure
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
