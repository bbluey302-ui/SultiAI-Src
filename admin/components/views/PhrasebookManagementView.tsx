import React, { useState } from 'react';
import { MessageSquare, Plus, Search, Tag, Volume2, Globe } from 'lucide-react';

interface PhraseItem {
  id: string;
  category: 'Jeepney & Transport' | 'Market & Bargaining' | 'Carenderia & Food' | 'Discourse Particles' | 'Greetings';
  bisaya: string;
  english: string;
  phonetics: string;
  dialectNote: string;
}

const INITIAL_PHRASES: PhraseItem[] = [
  {
    id: 'p1',
    category: 'Jeepney & Transport',
    bisaya: 'Palihog ko sa plete, Nong.',
    english: 'Please pass my fare, sir.',
    phonetics: 'Pah-LEE-hog koh sah PLEH-teh, NONG.',
    dialectNote: 'Universal throughout Visayas and Mindanao jeepneys.',
  },
  {
    id: 'p2',
    category: 'Jeepney & Transport',
    bisaya: 'Lugar lang, Nong! / Sa eskina lang.',
    english: 'Pull over here, sir! / Just at the corner please.',
    phonetics: 'Loo-GAR lang, NONG!',
    dialectNote: 'Replaces Tagalog "Para po!". Using "Para" sounds foreign.',
  },
  {
    id: 'p3',
    category: 'Market & Bargaining',
    bisaya: 'Tagpila ang kilo sa mangga ug suha?',
    english: 'How much per kilo for the mangoes and pomelo?',
    phonetics: 'Tag-PEE-lah ang KEE-loh sah mang-GAH?',
    dialectNote: 'Common in Bankerohan and Carbon public wet markets.',
  },
  {
    id: 'p4',
    category: 'Market & Bargaining',
    bisaya: 'Puyde hangyo gamay, Nang?',
    english: 'Can I get a slight discount, ma\'am?',
    phonetics: 'POOY-deh HANG-yoh gah-MY, NANG?',
    dialectNote: 'Polite bargaining formula without offending vendors.',
  },
  {
    id: 'p5',
    category: 'Discourse Particles',
    bisaya: 'Bitaw no? Mao gyud!',
    english: 'Indeed, right?! That is so true!',
    phonetics: 'BEE-tahw noh? MAH-oh gyood!',
    dialectNote: 'Signature agreement marker replacing "Oo nga naman".',
  },
  {
    id: 'p6',
    category: 'Discourse Particles',
    bisaya: 'Ngano gud tawn? / Ayaw gud!',
    english: 'Why on earth? / Please don\'t!',
    phonetics: 'NGAH-noh good tahwn? / Ah-YOW good!',
    dialectNote: 'Colloquial Davao expressive particle showing empathy/tone.',
  },
  {
    id: 'p7',
    category: 'Discourse Particles',
    bisaya: 'Mao diay! Nakasabot na ko.',
    english: 'So that\'s why! Now I understand.',
    phonetics: 'MAH-oh dee-EYE! Nah-kah-sah-BOT nah koh.',
    dialectNote: '"Diay" marks sudden discovery or realization.',
  },
];

export function PhrasebookManagementView() {
  const [phrases, setPhrases] = useState<PhraseItem[]>(INITIAL_PHRASES);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  const categories = ['ALL', 'Jeepney & Transport', 'Market & Bargaining', 'Discourse Particles', 'Carenderia & Food', 'Greetings'];

  const filtered = phrases.filter((p) => {
    if (selectedCategory !== 'ALL' && p.category !== selectedCategory) return false;
    if (!searchTerm) return true;
    const s = searchTerm.toLowerCase();
    return p.bisaya.toLowerCase().includes(s) || p.english.toLowerCase().includes(s) || p.dialectNote.toLowerCase().includes(s);
  });

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-[#11222D] p-5 rounded-2xl border border-stone-200 dark:border-white/10 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-stone-900 dark:text-white flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-teal-600" />
            Phrasebook & Colloquial Particles Manager (/admin/phrasebook)
          </h2>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
            Maintain high-frequency communicative expressions, situational phrases, and discourse nuance markers.
          </p>
        </div>

        <button
          onClick={() => alert('New Phrase Creator')}
          className="px-4 py-2 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white flex items-center gap-1.5 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Add Phrase</span>
        </button>
      </div>

      {/* Filter and Search */}
      <div className="bg-white dark:bg-[#11222D] p-4 rounded-2xl border border-stone-200 dark:border-white/10 shadow-sm flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search phrases or cultural notes..."
            className="w-full pl-9 pr-4 py-2 rounded-xl text-xs bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-stone-500">Category:</span>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 rounded-xl text-xs font-semibold bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Phrases List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((item) => (
          <div
            key={item.id}
            className="bg-white dark:bg-[#11222D] p-5 rounded-2xl border border-stone-200 dark:border-white/10 shadow-sm space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                {item.category}
              </span>
              <button className="text-stone-400 hover:text-stone-600 text-xs font-medium">Edit</button>
            </div>

            <div>
              <h4 className="text-base font-bold text-stone-900 dark:text-white">{item.bisaya}</h4>
              <p className="text-xs font-semibold text-teal-600 dark:text-teal-400 mt-0.5">{item.english}</p>
            </div>

            <div className="text-[11px] text-stone-500 dark:text-stone-400 flex items-center gap-1.5 font-mono">
              <Volume2 className="w-3.5 h-3.5 text-indigo-500" />
              <span>{item.phonetics}</span>
            </div>

            <div className="pt-2 border-t border-stone-100 dark:border-white/5 text-[11px] text-stone-600 dark:text-stone-300">
              💡 <span className="font-medium">{item.dialectNote}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
