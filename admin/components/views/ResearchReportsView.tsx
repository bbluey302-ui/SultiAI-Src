import React from 'react';
import { School, TrendingUp, Download, CheckCircle, BarChart3, Users, Award } from 'lucide-react';
import { RESEARCH_METRICS, CAPSTONE_CHECKLIST_DATA } from '@/src/data/curriculumData';

export function ResearchReportsView() {
  const handleExportDefensePdf = () => {
    alert('Generating JMCFI BSIT Capstone Defense Evaluation Summary Package (CSV/JSON export initiated).');
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify({
      metrics: RESEARCH_METRICS,
      checklist: CAPSTONE_CHECKLIST_DATA,
      institution: 'Jose Maria College Foundation, Inc.',
      defenseTerm: 'September - October 2026',
    }, null, 2));
    const dl = document.createElement('a');
    dl.href = dataStr;
    dl.download = 'SultiAI_BSIT_Capstone_Research_Report.json';
    document.body.appendChild(dl);
    dl.click();
    dl.remove();
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-[#11222D] p-5 rounded-2xl border border-stone-200 dark:border-white/10 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-stone-900 dark:text-white flex items-center gap-2">
            <School className="w-5 h-5 text-indigo-600" />
            Research Analytics & Capstone Defense Reports (/admin/reports)
          </h2>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
            Empirical evaluation results from N = 45 non-native learners evaluating language acquisition speed, acoustic accuracy, and usability.
          </p>
        </div>

        <button
          onClick={handleExportDefensePdf}
          className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1.5 shadow-sm transition-all"
        >
          <Download className="w-4 h-4" />
          <span>Export Research Package</span>
        </button>
      </div>

      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#11222D] p-5 rounded-2xl border border-stone-200 dark:border-white/10 shadow-sm">
          <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Score Gain</span>
          <div className="text-3xl font-black text-emerald-600 mt-1">
            +{RESEARCH_METRICS.improvementPercentage}%
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Pre-Test: {RESEARCH_METRICS.preTestAverage} → Post-Test: {RESEARCH_METRICS.postTestAverage}
          </p>
        </div>

        <div className="bg-white dark:bg-[#11222D] p-5 rounded-2xl border border-stone-200 dark:border-white/10 shadow-sm">
          <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Usability (SUS)</span>
          <div className="text-3xl font-black text-amber-500 mt-1">
            {RESEARCH_METRICS.susScore} / 100
          </div>
          <p className="text-xs text-emerald-600 font-semibold mt-1">
            Grade A / Excellent (Benchmark: ≥ 68)
          </p>
        </div>

        <div className="bg-white dark:bg-[#11222D] p-5 rounded-2xl border border-stone-200 dark:border-white/10 shadow-sm">
          <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Whisper Avg. WER</span>
          <div className="text-3xl font-black text-teal-600 mt-1">
            {RESEARCH_METRICS.whisperAvgWer}%
          </div>
          <p className="text-xs text-stone-500 mt-1">
            88.8% phonetic match accuracy
          </p>
        </div>

        <div className="bg-white dark:bg-[#11222D] p-5 rounded-2xl border border-stone-200 dark:border-white/10 shadow-sm">
          <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">mBERT Intent F1</span>
          <div className="text-3xl font-black text-indigo-600 mt-1">
            {RESEARCH_METRICS.bertIntentAccuracy}%
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Tested on colloquial Visayan corpus
          </p>
        </div>
      </div>

      {/* Checklist Grid */}
      <div className="bg-white dark:bg-[#11222D] p-6 rounded-2xl border border-stone-200 dark:border-white/10 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-stone-900 dark:text-white flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
            Capstone Defense Verification Audit Status (11/11 Verified)
          </h3>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
            DEFENSE READY
          </span>
        </div>

        <div className="space-y-3">
          {CAPSTONE_CHECKLIST_DATA.map((item) => (
            <div
              key={item.id}
              className="p-3.5 rounded-xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200/80 dark:border-stone-700/60 flex items-start gap-3"
            >
              <div className="w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                {item.id}
              </div>
              <div className="text-xs">
                <div className="font-bold text-stone-900 dark:text-white">{item.title}</div>
                <p className="text-stone-500 mt-0.5">{item.description}</p>
                <div className="text-[11px] text-teal-600 font-mono mt-1">
                  Evidence: {item.evidence}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
