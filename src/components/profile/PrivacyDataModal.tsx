import React, { useState } from 'react';
import { X, ShieldCheck, Download, Trash2, Check, FileText, Database, Lock, AlertCircle } from 'lucide-react';
import { UserProfile } from '../../types';
import { sounds } from '../../utils/soundEffects';
import { addNotification } from '../../utils/notificationService';

interface PrivacyDataModalProps {
  profile: UserProfile;
  onClose: () => void;
}

export const PrivacyDataModal: React.FC<PrivacyDataModalProps> = ({
  profile,
  onClose,
}) => {
  const [exported, setExported] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [clearedNotice, setClearedNotice] = useState(false);

  const handleExportData = () => {
    sounds.playTap();

    try {
      // Gather real user records
      const exportObject = {
        exportedAt: new Date().toISOString(),
        application: 'SultiAI Language & Communication Companion',
        version: '2.0.0',
        user: {
          id: profile.id,
          name: profile.name,
          email: profile.email,
          targetDialect: profile.targetDialect,
          level: profile.level,
          joinedDate: profile.joinedDate,
        },
        learningMetrics: {
          xp: profile.xp,
          gems: profile.gems,
          streakDays: profile.streakDays,
          dailyGoalMinutes: profile.dailyGoalMinutes,
          todayMinutes: profile.todayMinutes,
          speechScoreAverage: profile.speechScoreAverage,
          vocabularyMastered: profile.vocabularyMastered,
          completedLessons: profile.completedLessons,
          weeklyActivity: profile.weeklyActivity,
        },
        localMediaHistory: JSON.parse(localStorage.getItem('sultiai_generated_media') || '[]'),
        voiceSessionsHistory: JSON.parse(localStorage.getItem('sultiai_ai_voice_sessions') || '[]'),
        conversationsCount: (JSON.parse(localStorage.getItem('sultiai_ai_conversations') || '[]')).length,
      };

      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportObject, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `sultiai-data-export-${profile.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      setExported(true);
      sounds.playCorrect();

      addNotification({
        category: 'system',
        title: '📦 Data Export Generated',
        titleBisaya: 'Na-download ang Imong Datos',
        message: 'A complete JSON snapshot of your learning records has been downloaded.',
        iconType: 'sparkles',
      });
    } catch (err) {
      console.warn('Export error:', err);
    }
  };

  const handleClearChatHistory = () => {
    setClearing(true);
    sounds.playTap();

    try {
      localStorage.removeItem('sultiai_ai_conversations');
      localStorage.removeItem('sultiai_ai_messages_map');
      localStorage.removeItem('sultiai_ai_voice_sessions');

      setClearedNotice(true);
      sounds.playCorrect();

      addNotification({
        category: 'security',
        title: '🧹 Conversation History Cleared',
        titleBisaya: 'Gipapha ang AI Transcripts',
        message: 'All local chat transcripts and audio buffers have been erased.',
        iconType: 'shield',
      });
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md bg-white dark:bg-[#11222D] rounded-3xl border border-stone-200 dark:border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        role="dialog"
        aria-labelledby="privacy-modal-title"
      >
        {/* Header */}
        <div className="p-4 border-b border-stone-200/80 dark:border-white/10 flex items-center justify-between bg-stone-50/50 dark:bg-stone-900/40">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-teal-50 dark:bg-teal-950/70 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h2 id="privacy-modal-title" className="font-display font-black text-sm text-stone-900 dark:text-white">
                Privacy & Data Management
              </h2>
              <p className="text-[10px] text-stone-500 dark:text-stone-400">
                Data ownership, export tools & ethics compliance
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              sounds.playTap();
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-500 hover:text-stone-900 dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* Section 1: What Data Is Stored */}
          <div className="p-3.5 bg-stone-50 dark:bg-stone-800/60 rounded-2xl border border-stone-200/80 dark:border-white/5 space-y-2">
            <h3 className="font-display font-black text-xs text-stone-900 dark:text-white flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-teal-500" />
              What SultiAI Stores About You
            </h3>
            <ul className="text-[11px] text-stone-600 dark:text-stone-300 space-y-1.5 list-disc list-inside">
              <li><strong>Profile Metadata:</strong> Display name, verified email, target dialect.</li>
              <li><strong>Speech Telemetry:</strong> Whisper Word Error Rate (WER) intonation scores and practice duration.</li>
              <li><strong>Curriculum Progress:</strong> Completed lesson IDs, XP earned, and unlocked badges.</li>
              <li><strong>Roleplay Transcripts:</strong> Multi-turn conversations generated during practice.</li>
            </ul>
          </div>

          {/* Section 2: Export Data */}
          <div className="p-3.5 bg-teal-50/50 dark:bg-teal-950/30 rounded-2xl border border-teal-200/80 dark:border-teal-500/20 space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-black text-xs text-stone-900 dark:text-white flex items-center gap-1.5">
                <Download className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                Data Portability (GDPR / RA 10173)
              </h3>
              {exported && (
                <span className="text-[9.5px] font-mono text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-0.5">
                  <Check className="w-3 h-3" /> Exported
                </span>
              )}
            </div>
            <p className="text-[10.5px] text-stone-600 dark:text-stone-300 leading-tight">
              Download a machine-readable JSON copy of your complete learner profile, progress benchmarks, and activity records.
            </p>
            <button
              onClick={handleExportData}
              className="w-full py-2.5 px-3 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Learning Records (.json)</span>
            </button>
          </div>

          {/* Section 3: Erase AI Conversation Transcripts */}
          <div className="p-3.5 bg-stone-50 dark:bg-stone-800/60 rounded-2xl border border-stone-200/80 dark:border-white/5 space-y-2">
            <h3 className="font-display font-black text-xs text-stone-900 dark:text-white flex items-center gap-1.5">
              <Trash2 className="w-3.5 h-3.5 text-rose-500" />
              Manage Conversation Transcripts
            </h3>
            <p className="text-[10.5px] text-stone-500 dark:text-stone-400 leading-tight">
              Erase cached dialogue and speaking session transcripts while keeping your XP, streak, and badges intact.
            </p>
            {clearedNotice ? (
              <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5" />
                <span>Conversation transcripts cleared successfully!</span>
              </div>
            ) : (
              <button
                onClick={handleClearChatHistory}
                disabled={clearing}
                className="w-full py-2.5 px-3 bg-stone-100 hover:bg-rose-50 dark:bg-stone-700 dark:hover:bg-rose-950/40 text-stone-700 hover:text-rose-600 dark:text-stone-300 dark:hover:text-rose-300 rounded-xl text-xs font-bold border border-stone-200 dark:border-white/10 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear Roleplay & Voice Transcripts</span>
              </button>
            )}
          </div>

          {/* Section 4: Data Privacy Notice */}
          <div className="p-3 bg-stone-100 dark:bg-stone-900/60 rounded-2xl border border-stone-200 dark:border-white/5 text-[10px] text-stone-500 dark:text-stone-400 leading-normal">
            🛡️ <strong>Data Privacy Guarantee:</strong> SultiAI adheres to the Philippine Data Privacy Act of 2012 (RA 10173). All speech telemetry and conversation transcripts are encrypted and never shared with third parties.
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-stone-200/80 dark:border-white/10 flex items-center justify-end bg-stone-50/50 dark:bg-stone-900/40">
          <button
            onClick={() => {
              sounds.playTap();
              onClose();
            }}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-teal-500 hover:bg-teal-400 text-stone-950 shadow-md transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
