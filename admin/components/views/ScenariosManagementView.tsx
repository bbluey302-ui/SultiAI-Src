import React, { useState } from 'react';
import { Compass, Plus, MapPin, Target, MessageSquare, Edit } from 'lucide-react';
import { ROLEPLAY_SCENARIOS } from '@/src/data/curriculumData';
import { RoleplayScenario } from '@/src/types';

export function ScenariosManagementView() {
  const [scenarios, setScenarios] = useState<RoleplayScenario[]>(ROLEPLAY_SCENARIOS);

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-[#11222D] p-5 rounded-2xl border border-stone-200 dark:border-white/10 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-stone-900 dark:text-white flex items-center gap-2">
            <Compass className="w-5 h-5 text-teal-600" />
            Conversational Roleplay Scenarios (/admin/scenarios)
          </h2>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
            Simulate realistic conversational environments in Visayas and Mindanao with goal prompts and target phrases.
          </p>
        </div>

        <button
          onClick={() => alert('New Scenario Creator')}
          className="px-4 py-2 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white flex items-center gap-1.5 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Add Scenario</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {scenarios.map((scen) => (
          <div
            key={scen.id}
            className="bg-white dark:bg-[#11222D] rounded-2xl p-5 border border-stone-200 dark:border-white/10 shadow-sm space-y-4"
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400 block">
                  {scen.difficulty}
                </span>
                <h3 className="font-bold text-stone-900 dark:text-white text-base mt-0.5">{scen.title}</h3>
                <span className="text-xs font-semibold text-teal-600 block">{scen.titleBisaya}</span>
              </div>
              <button
                onClick={() => alert(`Editing scenario: ${scen.title}`)}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200"
              >
                Configure
              </button>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-stone-500">
              <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
              <span>{scen.location}</span>
            </div>

            <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed bg-stone-50 dark:bg-stone-800/40 p-3 rounded-xl border border-stone-100 dark:border-stone-800">
              {scen.context}
            </p>

            <div className="space-y-1.5 text-xs">
              <span className="font-bold text-stone-700 dark:text-stone-300 flex items-center gap-1">
                <Target className="w-3.5 h-3.5 text-indigo-500" />
                Target Communication Goal:
              </span>
              <p className="text-stone-600 dark:text-stone-400 pl-4">{scen.suggestedGoal}</p>
            </div>

            <div className="pt-2 border-t border-stone-100 dark:border-white/5">
              <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block mb-1.5">
                Key Phrasings ({scen.usefulPhrases.length})
              </span>
              <div className="space-y-1">
                {scen.usefulPhrases.slice(0, 3).map((ph, idx) => (
                  <div key={idx} className="text-[11px] text-stone-700 dark:text-stone-300 flex items-start gap-1.5">
                    <span className="text-teal-600 font-bold">•</span>
                    <span>
                      <strong className="text-teal-700 dark:text-teal-300">{ph.bisaya}</strong> ({ph.english})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
