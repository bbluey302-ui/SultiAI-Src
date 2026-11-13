import React, { useState, useEffect } from 'react';
import { 
  Search, Filter, Download, Trash2, RefreshCw, PlusCircle, 
  CheckCircle, AlertTriangle, Info, AlertOctagon, ShieldCheck, 
  Cpu, Mic, Activity, Sliders, ChevronDown, ChevronRight, X
} from 'lucide-react';
import { AuditLogEntry } from '@/src/types';
import { adminApi, subscribeToTable, isSupabaseConfigured } from '../services/adminApi';

interface AuditLogViewerProps {
  onRefreshStats?: () => void;
}

export function AuditLogViewer({ onRefreshStats }: AuditLogViewerProps) {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // New manual audit event state
  const [newEvent, setNewEvent] = useState({
    eventType: 'MANUAL_INSPECTION_CHECK',
    category: 'SYSTEM_CONFIG',
    actor: 'admin_officer',
    actorRole: 'System Administrator',
    description: 'Manual system security & data audit inspection executed',
    severity: 'INFO' as 'INFO' | 'SUCCESS' | 'WARNING' | 'CRITICAL',
  });

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCategory !== 'ALL') params.set('category', selectedCategory);
      if (selectedSeverity !== 'ALL') params.set('severity', selectedSeverity);
      if (searchTerm) params.set('search', searchTerm);

      const res = await adminApi(`/api/admin/audit-logs?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
      }
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [selectedCategory, selectedSeverity]);

  // Live sync via Supabase Realtime: whenever the LEARNER backend writes a new
  // audit event (AI inference, Whisper WER, lesson completion), refresh here.
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const unsubscribe = subscribeToTable('audit_logs', () => fetchLogs());
    return unsubscribe;
  }, [selectedCategory, selectedSeverity, searchTerm]);

  // Periodic polling when auto-refresh is active (fallback when Realtime or the
  // admin backend is not configured).
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(fetchLogs, 5000);
    return () => clearInterval(interval);
  }, [autoRefresh, selectedCategory, selectedSeverity, searchTerm]);

  const handleClearLogs = async () => {
    if (!confirm('Are you sure you want to clear all audit logs?')) return;
    try {
      await adminApi('/api/admin/audit-logs', { method: 'DELETE' });
      fetchLogs();
      if (onRefreshStats) onRefreshStats();
    } catch (err) {
      console.error('Failed to clear logs:', err);
    }
  };

  const handleAddLog = async () => {
    try {
      const res = await adminApi('/api/admin/audit-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEvent),
      });
      if (res.ok) {
        setShowAddModal(false);
        fetchLogs();
        if (onRefreshStats) onRefreshStats();
      }
    } catch (err) {
      console.error('Failed to create audit log:', err);
    }
  };

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(logs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `sultiai_audit_logs_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const categories = [
    { id: 'ALL', label: 'All Events', icon: Activity },
    { id: 'AI_INFERENCE', label: 'mBERT & AI Inference', icon: Cpu },
    { id: 'SPEECH_WER', label: 'Whisper STT & WER', icon: Mic },
    { id: 'LEARNING_ACTIVITY', label: 'Learner Activities', icon: Activity },
    { id: 'SECURITY_RLS', label: 'Security & RLS', icon: ShieldCheck },
    { id: 'SYSTEM_CONFIG', label: 'System & Config', icon: Sliders },
  ];

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'SUCCESS':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
            <CheckCircle className="w-3 h-3" /> SUCCESS
          </span>
        );
      case 'WARNING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
            <AlertTriangle className="w-3 h-3" /> WARNING
          </span>
        );
      case 'CRITICAL':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300">
            <AlertOctagon className="w-3 h-3" /> CRITICAL
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300">
            <Info className="w-3 h-3" /> INFO
          </span>
        );
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'AI_INFERENCE':
        return <Cpu className="w-4 h-4 text-indigo-500" />;
      case 'SPEECH_WER':
        return <Mic className="w-4 h-4 text-teal-500" />;
      case 'SECURITY_RLS':
        return <ShieldCheck className="w-4 h-4 text-emerald-500" />;
      case 'SYSTEM_CONFIG':
        return <Sliders className="w-4 h-4 text-purple-500" />;
      default:
        return <Activity className="w-4 h-4 text-amber-500" />;
    }
  };

  const filteredLogs = logs.filter((log) => {
    if (!searchTerm) return true;
    const s = searchTerm.toLowerCase();
    return (
      log.description.toLowerCase().includes(s) ||
      log.eventType.toLowerCase().includes(s) ||
      log.actor.toLowerCase().includes(s)
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#11222D] p-5 rounded-2xl border border-stone-200 dark:border-white/10 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-stone-900 dark:text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-teal-600" />
            System Audit & Telemetry Log Explorer
          </h2>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
            Real-time immutable logging of AI intent inference, speech evaluations, database security, and administrator actions.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors border ${
              autoRefresh
                ? 'bg-teal-50 border-teal-200 text-teal-700 dark:bg-teal-950/40 dark:border-teal-700 dark:text-teal-300'
                : 'bg-stone-50 border-stone-200 text-stone-600 dark:bg-stone-800 dark:border-stone-700 dark:text-stone-300'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${autoRefresh ? 'animate-spin' : ''}`} />
            {autoRefresh ? 'Live Streaming' : 'Polling Paused'}
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            Trigger Test Event
          </button>

          <button
            onClick={handleExportJson}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 flex items-center gap-1.5 transition-colors border border-stone-200 dark:border-white/10"
          >
            <Download className="w-3.5 h-3.5" />
            Export JSON
          </button>

          <button
            onClick={handleClearLogs}
            className="p-1.5 rounded-xl text-stone-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
            title="Clear logs"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-[#11222D] p-4 rounded-2xl border border-stone-200 dark:border-white/10 shadow-sm space-y-4">
        {/* Category Filter Pills */}
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => {
            const IconComponent = cat.icon;
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  isSelected
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'bg-stone-100 dark:bg-stone-800/70 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-800'
                }`}
              >
                <IconComponent className="w-3.5 h-3.5" />
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Search input and severity filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by event type, description, actor ID..."
              className="w-full pl-9 pr-4 py-2 rounded-xl text-sm bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-stone-500 dark:text-stone-400">Severity:</span>
            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              className="px-3 py-2 rounded-xl text-xs font-semibold bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="ALL">All Severities</option>
              <option value="INFO">INFO Only</option>
              <option value="SUCCESS">SUCCESS Only</option>
              <option value="WARNING">WARNING Only</option>
              <option value="CRITICAL">CRITICAL Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white dark:bg-[#11222D] rounded-2xl border border-stone-200 dark:border-white/10 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-stone-200 dark:border-white/10 flex items-center justify-between bg-stone-50/50 dark:bg-stone-800/30">
          <span className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
            Showing {filteredLogs.length} Events ({logs.length} Total Captured)
          </span>
          {loading && <span className="text-xs text-teal-600 font-medium">Syncing telemetry...</span>}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-100/60 dark:bg-stone-800/50 text-stone-600 dark:text-stone-300 font-semibold border-b border-stone-200 dark:border-white/10">
              <tr>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Event Type</th>
                <th className="px-4 py-3">Actor / Role</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3">Severity</th>
                <th className="px-4 py-3 text-right">Latency</th>
                <th className="px-4 py-3 text-center">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-white/5 font-mono text-[12px]">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-stone-500 font-sans">
                    No audit records match the selected filters.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr 
                    key={log.id} 
                    className="hover:bg-teal-50/40 dark:hover:bg-teal-950/20 transition-colors group cursor-pointer"
                    onClick={() => setSelectedLog(log)}
                  >
                    <td className="px-4 py-3 text-stone-500 dark:text-stone-400 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      <span className="block text-[10px] text-stone-400 dark:text-stone-500">
                        {new Date(log.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </span>
                    </td>

                    <td className="px-4 py-3 font-semibold text-stone-900 dark:text-white whitespace-nowrap">
                      <div className="flex items-center gap-1.5 font-sans">
                        {getCategoryIcon(log.category)}
                        <span>{log.eventType}</span>
                      </div>
                    </td>

                    <td className="px-4 py-3 text-stone-600 dark:text-stone-300 whitespace-nowrap font-sans">
                      <span className="font-medium text-stone-900 dark:text-white">{log.actor}</span>
                      <span className="block text-[10px] text-stone-400">{log.actorRole}</span>
                    </td>

                    <td className="px-4 py-3 text-stone-800 dark:text-stone-200 font-sans max-w-md truncate">
                      {log.description}
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap font-sans">
                      {getSeverityBadge(log.severity)}
                    </td>

                    <td className="px-4 py-3 text-right text-stone-500 dark:text-stone-400 whitespace-nowrap">
                      {log.latencyMs ? `${log.latencyMs}ms` : '—'}
                    </td>

                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedLog(log);
                        }}
                        className="px-2 py-1 rounded bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300 text-[10px] font-sans font-medium transition-colors"
                      >
                        JSON
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inspect Log Details Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#11222D] rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-stone-200 dark:border-white/10 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs uppercase font-bold tracking-wider text-teal-600">Audit Record Telemetry</span>
                <h3 className="text-lg font-bold text-stone-900 dark:text-white mt-0.5">{selectedLog.eventType}</h3>
                <p className="text-xs text-stone-500 mt-1">{selectedLog.description}</p>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs bg-stone-50 dark:bg-stone-800/50 p-3.5 rounded-xl border border-stone-100 dark:border-stone-700">
              <div>
                <span className="text-stone-400 block">Record ID</span>
                <span className="font-mono text-stone-700 dark:text-stone-300">{selectedLog.id}</span>
              </div>
              <div>
                <span className="text-stone-400 block">Severity</span>
                <div className="mt-0.5">{getSeverityBadge(selectedLog.severity)}</div>
              </div>
              <div>
                <span className="text-stone-400 block">Actor</span>
                <span className="text-stone-700 dark:text-stone-300 font-medium">{selectedLog.actor} ({selectedLog.actorRole})</span>
              </div>
              <div>
                <span className="text-stone-400 block">Timestamp</span>
                <span className="font-mono text-stone-700 dark:text-stone-300">{selectedLog.timestamp}</span>
              </div>
            </div>

            <div>
              <span className="text-xs font-bold text-stone-700 dark:text-stone-300 block mb-1">Payload Metadata & Telemetry</span>
              <pre className="p-3.5 bg-stone-900 text-emerald-400 rounded-xl text-[11px] font-mono overflow-x-auto max-h-60 border border-stone-800">
                {JSON.stringify(selectedLog.metadata || { status: 'logged_without_payload' }, null, 2)}
              </pre>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 transition-colors"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Test Event Creator Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#11222D] rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stone-200 dark:border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-stone-900 dark:text-white">Trigger Audit Test Event</h3>
              <button onClick={() => setShowAddModal(false)} className="text-stone-400 hover:text-stone-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-stone-600 dark:text-stone-300 font-medium mb-1">Event Type Identifier</label>
                <input
                  type="text"
                  value={newEvent.eventType}
                  onChange={(e) => setNewEvent({ ...newEvent, eventType: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-stone-600 dark:text-stone-300 font-medium mb-1">Category</label>
                <select
                  value={newEvent.category}
                  onChange={(e) => setNewEvent({ ...newEvent, category: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-white"
                >
                  <option value="AI_INFERENCE">AI_INFERENCE</option>
                  <option value="SPEECH_WER">SPEECH_WER</option>
                  <option value="LEARNING_ACTIVITY">LEARNING_ACTIVITY</option>
                  <option value="SECURITY_RLS">SECURITY_RLS</option>
                  <option value="SYSTEM_CONFIG">SYSTEM_CONFIG</option>
                </select>
              </div>

              <div>
                <label className="block text-stone-600 dark:text-stone-300 font-medium mb-1">Severity Level</label>
                <select
                  value={newEvent.severity}
                  onChange={(e) => setNewEvent({ ...newEvent, severity: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-white"
                >
                  <option value="INFO">INFO</option>
                  <option value="SUCCESS">SUCCESS</option>
                  <option value="WARNING">WARNING</option>
                  <option value="CRITICAL">CRITICAL</option>
                </select>
              </div>

              <div>
                <label className="block text-stone-600 dark:text-stone-300 font-medium mb-1">Event Description</label>
                <textarea
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300"
              >
                Cancel
              </button>
              <button
                onClick={handleAddLog}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white shadow-sm"
              >
                Dispatch Event
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
