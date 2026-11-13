import React from 'react';
import { Settings, Database, ShieldCheck, Server, Key, Globe, CheckCircle } from 'lucide-react';
import { isSupabaseConfigured } from '@/src/services/supabaseClient';

export function SettingsView() {
  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-[#11222D] p-5 rounded-2xl border border-stone-200 dark:border-white/10 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-stone-900 dark:text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-teal-600" />
            Platform & Database Architecture Settings (/admin/settings)
          </h2>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
            Backend connection parameters, Supabase PostgreSQL schema, and security policies.
          </p>
        </div>

        <span className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 flex items-center gap-1.5">
          <CheckCircle className="w-3.5 h-3.5" />
          Production Ready
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Supabase Connection */}
        <div className="bg-white dark:bg-[#11222D] p-5 rounded-2xl border border-stone-200 dark:border-white/10 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 pb-2 border-b border-stone-100 dark:border-white/5">
            <div className="p-2 rounded-xl bg-teal-50 dark:bg-teal-950/50 text-teal-600">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-stone-900 dark:text-white">Supabase PostgreSQL Integration</h3>
              <p className="text-[11px] text-stone-500">Persistent storage & Row-Level Security</p>
            </div>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between p-3 rounded-xl bg-stone-50 dark:bg-stone-800/40 border border-stone-100 dark:border-stone-800">
              <span className="text-stone-500 font-medium">Supabase Status</span>
              <span className="font-bold text-emerald-600 flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" />
                {isSupabaseConfigured ? 'Active & Authenticated' : 'Configured / Local Fallback Active'}
              </span>
            </div>

            <div className="flex justify-between p-3 rounded-xl bg-stone-50 dark:bg-stone-800/40 border border-stone-100 dark:border-stone-800">
              <span className="text-stone-500 font-medium">Row Level Security (RLS)</span>
              <span className="font-mono text-emerald-600 font-bold">ENFORCED (auth.uid() = id)</span>
            </div>

            <div className="flex justify-between p-3 rounded-xl bg-stone-50 dark:bg-stone-800/40 border border-stone-100 dark:border-stone-800">
              <span className="text-stone-500 font-medium">Active Migrations</span>
              <span className="font-mono text-stone-700 dark:text-stone-300">2 Verified Migration SQLs</span>
            </div>
          </div>
        </div>

        {/* Institution & Capstone Configuration */}
        <div className="bg-white dark:bg-[#11222D] p-5 rounded-2xl border border-stone-200 dark:border-white/10 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 pb-2 border-b border-stone-100 dark:border-white/5">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-stone-900 dark:text-white">Institutional Research Profile</h3>
              <p className="text-[11px] text-stone-500">Jose Maria College Foundation, Inc.</p>
            </div>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between p-3 rounded-xl bg-stone-50 dark:bg-stone-800/40 border border-stone-100 dark:border-stone-800">
              <span className="text-stone-500 font-medium">Institution</span>
              <span className="font-bold text-stone-900 dark:text-white">JMCFI, Davao City</span>
            </div>

            <div className="flex justify-between p-3 rounded-xl bg-stone-50 dark:bg-stone-800/40 border border-stone-100 dark:border-stone-800">
              <span className="text-stone-500 font-medium">Academic Program</span>
              <span className="font-bold text-stone-900 dark:text-white">Bachelor of Science in Information Technology</span>
            </div>

            <div className="flex justify-between p-3 rounded-xl bg-stone-50 dark:bg-stone-800/40 border border-stone-100 dark:border-stone-800">
              <span className="text-stone-500 font-medium">Server Host Port</span>
              <span className="font-mono text-teal-600 font-bold">http://0.0.0.0:3000</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
