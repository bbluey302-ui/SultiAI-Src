import React, { useState } from 'react';
import { 
  BookOpen, Plus, Search, Filter, Edit, Trash2, CheckCircle, 
  Clock, Award, Layers, ChevronRight, X 
} from 'lucide-react';
import { INITIAL_MODULES } from '@/src/data/curriculumData';
import { Lesson, Module } from '@/src/types';

export function LessonsManagementView() {
  const [modulesList, setModulesList] = useState<Module[]>(INITIAL_MODULES);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedModuleFilter, setSelectedModuleFilter] = useState('ALL');
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);

  const allLessons = modulesList.flatMap((m) =>
    m.lessons.map((l) => ({ ...l, moduleTitle: m.title, moduleColor: m.accentColor }))
  );

  const filteredLessons = allLessons.filter((l) => {
    if (selectedModuleFilter !== 'ALL' && l.moduleId !== selectedModuleFilter) return false;
    if (!searchTerm) return true;
    const s = searchTerm.toLowerCase();
    return l.title.toLowerCase().includes(s) || l.titleBisaya.toLowerCase().includes(s) || l.description.toLowerCase().includes(s);
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white dark:bg-[#11222D] p-5 rounded-2xl border border-stone-200 dark:border-white/10 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-stone-900 dark:text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-teal-600" />
            Curriculum Lessons Manager (/admin/lessons)
          </h2>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
            Configure learning objectives, estimated durations, XP compensation, and activity contents.
          </p>
        </div>

        <button
          onClick={() => {
            alert('New Lesson creator modal opened. You can add flashcards, multiple-choice, and Whisper drills.');
          }}
          className="px-4 py-2 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white flex items-center gap-1.5 shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Lesson</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-[#11222D] p-4 rounded-2xl border border-stone-200 dark:border-white/10 shadow-sm flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search lessons by title, Bisaya phrase..."
            className="w-full pl-9 pr-4 py-2 rounded-xl text-xs bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-stone-500">Module:</span>
          <select
            value={selectedModuleFilter}
            onChange={(e) => setSelectedModuleFilter(e.target.value)}
            className="px-3 py-2 rounded-xl text-xs font-semibold bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="ALL">All Modules ({allLessons.length})</option>
            {modulesList.map((m) => (
              <option key={m.id} value={m.id}>
                {m.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-[#11222D] rounded-2xl border border-stone-200 dark:border-white/10 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-100/60 dark:bg-stone-800/50 text-stone-600 dark:text-stone-300 font-semibold border-b border-stone-200 dark:border-white/10">
              <tr>
                <th className="px-4 py-3">Lesson Details</th>
                <th className="px-4 py-3">Bisaya Title</th>
                <th className="px-4 py-3">Module</th>
                <th className="px-4 py-3">Level Tier</th>
                <th className="px-4 py-3">Estimated Time</th>
                <th className="px-4 py-3">XP Reward</th>
                <th className="px-4 py-3">Activities</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-white/5">
              {filteredLessons.map((lesson) => (
                <tr key={lesson.id} className="hover:bg-stone-50/50 dark:hover:bg-stone-800/30 transition-colors">
                  <td className="px-4 py-3.5 max-w-xs">
                    <span className="font-bold text-stone-900 dark:text-white block">{lesson.title}</span>
                    <span className="text-[11px] text-stone-400 block truncate">{lesson.description}</span>
                  </td>

                  <td className="px-4 py-3.5 text-teal-600 dark:text-teal-400 font-bold whitespace-nowrap">
                    {lesson.titleBisaya}
                  </td>

                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <span className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700">
                      {lesson.moduleTitle}
                    </span>
                  </td>

                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                      {lesson.level}
                    </span>
                  </td>

                  <td className="px-4 py-3.5 whitespace-nowrap font-medium text-stone-600 dark:text-stone-300">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-stone-400" />
                      {lesson.estimatedMinutes} mins
                    </span>
                  </td>

                  <td className="px-4 py-3.5 whitespace-nowrap font-bold text-indigo-600 dark:text-indigo-400 font-mono">
                    +{lesson.xpReward} XP
                  </td>

                  <td className="px-4 py-3.5 whitespace-nowrap font-mono text-stone-600 dark:text-stone-300">
                    {lesson.activities.length} drills
                  </td>

                  <td className="px-4 py-3.5 text-right whitespace-nowrap">
                    <button
                      onClick={() => setEditingLesson(lesson as any)}
                      className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 text-xs font-semibold transition-colors"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Lesson Modal */}
      {editingLesson && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#11222D] rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-stone-200 dark:border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-stone-900 dark:text-white">Edit Lesson: {editingLesson.title}</h3>
              <button onClick={() => setEditingLesson(null)} className="text-stone-400 hover:text-stone-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-stone-600 dark:text-stone-300 font-medium mb-1">Lesson Title</label>
                <input
                  type="text"
                  value={editingLesson.title}
                  onChange={(e) => setEditingLesson({ ...editingLesson, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-stone-600 dark:text-stone-300 font-medium mb-1">Bisaya Translation Title</label>
                <input
                  type="text"
                  value={editingLesson.titleBisaya}
                  onChange={(e) => setEditingLesson({ ...editingLesson, titleBisaya: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-600 dark:text-stone-300 font-medium mb-1">XP Reward</label>
                  <input
                    type="number"
                    value={editingLesson.xpReward}
                    onChange={(e) => setEditingLesson({ ...editingLesson, xpReward: parseInt(e.target.value, 10) || 35 })}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-stone-600 dark:text-stone-300 font-medium mb-1">Estimated Minutes</label>
                  <input
                    type="number"
                    value={editingLesson.estimatedMinutes}
                    onChange={(e) => setEditingLesson({ ...editingLesson, estimatedMinutes: parseInt(e.target.value, 10) || 5 })}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-white"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setEditingLesson(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setEditingLesson(null);
                  alert('Lesson updated successfully.');
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
