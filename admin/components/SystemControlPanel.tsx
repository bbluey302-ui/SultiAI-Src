import React, { useState, useEffect } from 'react';
import { 
  Sliders, Save, RefreshCw, AlertTriangle, CheckCircle, 
  Cpu, Mic, Compass, Globe, Shield, Zap, Info, Database 
} from 'lucide-react';
import { SystemConfig } from '@/src/types';
import { adminApi } from '../services/adminApi';

interface SystemControlPanelProps {
  onConfigSaved?: () => void;
}

export function SystemControlPanel({ onConfigSaved }: SystemControlPanelProps) {
  const [config, setConfig] = useState<SystemConfig>({
    activeGeminiModel: 'gemini-3.8-flash',
    whisperWerThreshold: 15,
    bertConfidenceThreshold: 0.85,
    maintenanceMode: false,
    rateLimitPerMin: 60,
    groundingMapsEnabled: true,
    groundingSearchEnabled: true,
  });

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    adminApi('/api/admin/system-config')
      .then((res) => res.json())
      .then((data) => {
        if (data.activeGeminiModel) setConfig(data);
      })
      .catch((err) => console.error('Failed to load system config:', err));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaveSuccess(false);
    try {
      const res = await adminApi('/api/admin/system-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 4000);
        if (onConfigSaved) onConfigSaved();
      }
    } catch (err) {
      console.error('Failed to save config:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-[#11222D] p-5 rounded-2xl border border-stone-200 dark:border-white/10 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-stone-900 dark:text-white flex items-center gap-2">
            <Sliders className="w-5 h-5 text-teal-600" />
            System Control & Model Orchestration
          </h2>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
            Configure real-time hyperparameters for mBERT intent inference, Whisper STT tolerance, and Gemini models.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-2.5 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white flex items-center gap-2 transition-all shadow-md active:scale-95 disabled:opacity-50"
        >
          {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? 'Updating System...' : 'Apply & Save Config'}
        </button>
      </div>

      {saveSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-semibold flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          System configuration successfully deployed and committed to immutable audit trail.
        </div>
      )}

      {/* Control Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: AI Model Selection */}
        <div className="bg-white dark:bg-[#11222D] p-5 rounded-2xl border border-stone-200 dark:border-white/10 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 pb-2 border-b border-stone-100 dark:border-white/5">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-stone-900 dark:text-white">Conversational Model Tier</h3>
              <p className="text-[11px] text-stone-500">Gemini LLM model powering SULTI multi-turn dialogues</p>
            </div>
          </div>

          <div className="space-y-2.5">
            {[
              { id: 'gemini-3.8-flash', label: 'Gemini 3.8 Flash (Recommended)', desc: 'Lowest latency, specialized for real-time mobile multilingual dialogues' },
              { id: 'gemini-3.5-turbo', label: 'Gemini 3.5 Turbo', desc: 'Standard high-speed reasoning model' },
              { id: 'local-linguistic-engine', label: 'Local Linguistic Engine (Offline Fallback)', desc: 'Rule-based Bisaya generator when API keys are unconfigured' },
            ].map((model) => (
              <label
                key={model.id}
                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  config.activeGeminiModel === model.id
                    ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30'
                    : 'border-stone-200 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800/40'
                }`}
              >
                <input
                  type="radio"
                  name="geminiModel"
                  checked={config.activeGeminiModel === model.id}
                  onChange={() => setConfig({ ...config, activeGeminiModel: model.id })}
                  className="mt-0.5 text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <span className="text-xs font-bold text-stone-900 dark:text-white block">{model.label}</span>
                  <span className="text-[11px] text-stone-500 dark:text-stone-400">{model.desc}</span>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Card 2: BERT Intent Classifier Calibration */}
        <div className="bg-white dark:bg-[#11222D] p-5 rounded-2xl border border-stone-200 dark:border-white/10 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 pb-2 border-b border-stone-100 dark:border-white/5">
            <div className="p-2 rounded-xl bg-teal-50 dark:bg-teal-950/50 text-teal-600">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-stone-900 dark:text-white">mBERT Classifier Confidence</h3>
              <p className="text-[11px] text-stone-500">Threshold required before classifying learner intent</p>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <div className="flex justify-between items-center text-xs font-semibold">
              <span className="text-stone-600 dark:text-stone-300">Minimum Confidence Score</span>
              <span className="px-2.5 py-0.5 rounded-lg bg-teal-100 dark:bg-teal-900/50 text-teal-800 dark:text-teal-200 font-mono">
                {(config.bertConfidenceThreshold * 100).toFixed(0)}%
              </span>
            </div>

            <input
              type="range"
              min="0.5"
              max="0.99"
              step="0.01"
              value={config.bertConfidenceThreshold}
              onChange={(e) => setConfig({ ...config, bertConfidenceThreshold: parseFloat(e.target.value) })}
              className="w-full h-2 bg-stone-200 dark:bg-stone-700 rounded-lg appearance-none cursor-pointer accent-teal-600"
            />

            <div className="flex justify-between text-[10px] text-stone-400 font-mono">
              <span>50% (Permissive)</span>
              <span>85% (Optimal)</span>
              <span>99% (Strict)</span>
            </div>

            <p className="text-[11px] text-stone-500 dark:text-stone-400 bg-stone-50 dark:bg-stone-800/40 p-2.5 rounded-xl border border-stone-100 dark:border-stone-800">
              Higher values ensure the model only triggers specific conversational intents (e.g., jeepney fare, market bargaining) when probability is elevated.
            </p>
          </div>
        </div>

        {/* Card 3: Whisper STT Word Error Rate (WER) */}
        <div className="bg-white dark:bg-[#11222D] p-5 rounded-2xl border border-stone-200 dark:border-white/10 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 pb-2 border-b border-stone-100 dark:border-white/5">
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600">
              <Mic className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-stone-900 dark:text-white">Whisper WER Acceptance Gate</h3>
              <p className="text-[11px] text-stone-500">Maximum Word Error Rate % allowed for pronunciation drills</p>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <div className="flex justify-between items-center text-xs font-semibold">
              <span className="text-stone-600 dark:text-stone-300">WER Tolerance Cutoff</span>
              <span className="px-2.5 py-0.5 rounded-lg bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200 font-mono">
                {config.whisperWerThreshold}% WER
              </span>
            </div>

            <input
              type="range"
              min="5"
              max="30"
              step="1"
              value={config.whisperWerThreshold}
              onChange={(e) => setConfig({ ...config, whisperWerThreshold: parseInt(e.target.value, 10) })}
              className="w-full h-2 bg-stone-200 dark:bg-stone-700 rounded-lg appearance-none cursor-pointer accent-amber-600"
            />

            <div className="flex justify-between text-[10px] text-stone-400 font-mono">
              <span>5% (Native Articulation)</span>
              <span>15% (Empirical Baseline)</span>
              <span>30% (Beginner Friendly)</span>
            </div>

            <p className="text-[11px] text-stone-500 dark:text-stone-400 bg-stone-50 dark:bg-stone-800/40 p-2.5 rounded-xl border border-stone-100 dark:border-stone-800">
              The Capstone research study established an empirical baseline of 11.2% WER among Visayan participants at JMCFI.
            </p>
          </div>
        </div>

        {/* Card 4: Grounding & System Protection */}
        <div className="bg-white dark:bg-[#11222D] p-5 rounded-2xl border border-stone-200 dark:border-white/10 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 pb-2 border-b border-stone-100 dark:border-white/5">
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-stone-900 dark:text-white">Grounding & Maintenance Control</h3>
              <p className="text-[11px] text-stone-500">Live external API connections and security mode</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-stone-50 dark:bg-stone-800/40 border border-stone-100 dark:border-stone-800">
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-teal-600" />
                <div>
                  <span className="text-xs font-bold text-stone-900 dark:text-white block">Google Maps Local Grounding</span>
                  <span className="text-[10px] text-stone-500">Anchor directions to Davao City (7.0731° N, 125.6128° E)</span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={config.groundingMapsEnabled}
                onChange={(e) => setConfig({ ...config, groundingMapsEnabled: e.target.checked })}
                className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-stone-50 dark:bg-stone-800/40 border border-stone-100 dark:border-stone-800">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-indigo-600" />
                <div>
                  <span className="text-xs font-bold text-stone-900 dark:text-white block">Google Search Real-Time Grounding</span>
                  <span className="text-[10px] text-stone-500">Provide live context for news & Kadayawan cultural events</span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={config.groundingSearchEnabled}
                onChange={(e) => setConfig({ ...config, groundingSearchEnabled: e.target.checked })}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <div>
                  <span className="text-xs font-bold text-rose-900 dark:text-rose-200 block">Maintenance Lockdown Mode</span>
                  <span className="text-[10px] text-rose-700 dark:text-rose-400">Suspend non-admin chat interactions</span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={config.maintenanceMode}
                onChange={(e) => setConfig({ ...config, maintenanceMode: e.target.checked })}
                className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
