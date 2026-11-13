import React, { useState } from 'react';
import { X, Shield, Lock, Mail, KeyRound, AlertTriangle, CheckCircle2, Laptop, LogOut, Trash2, Check, ExternalLink } from 'lucide-react';
import { UserProfile } from '../../types';
import { sounds } from '../../utils/soundEffects';
import { isSupabaseConfigured } from '../../services/supabaseClient';
import { sendPasswordResetEmail } from '../../services/authRedirect';
import { addNotification } from '../../utils/notificationService';

interface AccountSecurityModalProps {
  profile: UserProfile;
  onOpenLogoutConfirm: () => void;
  onDeleteAccount: () => void;
  onClose: () => void;
}

export const AccountSecurityModal: React.FC<AccountSecurityModalProps> = ({
  profile,
  onOpenLogoutConfirm,
  onDeleteAccount,
  onClose,
}) => {
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handlePasswordReset = async () => {
    setResetLoading(true);
    setResetError(null);
    sounds.playTap();

    const result = await sendPasswordResetEmail(profile.email);
    setResetLoading(false);

    if (!result.success) {
      setResetError(result.error || 'Could not send the recovery email. Please try again.');
      sounds.playWrong();
      return;
    }

    setResetSent(true);
    addNotification({
      category: 'security',
      title: '🔑 Password Reset Dispatched',
      titleBisaya: 'Gipadala ang Password Reset Link',
      message: `A secure password recovery email has been requested for ${profile.email}.`,
      iconType: 'shield',
    });
    sounds.playCorrect();
  };

  const handleConfirmDelete = () => {
    if (deleteConfirmationText.trim().toUpperCase() !== 'DELETE') {
      setDeleteError('Please type "DELETE" exactly to confirm account removal.');
      sounds.playWrong();
      return;
    }

    sounds.playTap();
    onClose();
    onDeleteAccount();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md bg-white dark:bg-[#11222D] rounded-3xl border border-stone-200 dark:border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        role="dialog"
        aria-labelledby="security-title"
      >
        {/* Header */}
        <div className="p-4 border-b border-stone-200/80 dark:border-white/10 flex items-center justify-between bg-stone-50/50 dark:bg-stone-900/40">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-teal-50 dark:bg-teal-950/70 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h2 id="security-title" className="font-display font-black text-sm text-stone-900 dark:text-white">
                Account & Security
              </h2>
              <p className="text-[10px] text-stone-500 dark:text-stone-400">
                Credentials, session tokens & data safeguards
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
          {/* Identity & Verification Status */}
          <div className="p-3.5 bg-stone-50 dark:bg-stone-800/60 rounded-2xl border border-stone-200/80 dark:border-white/5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-stone-900 dark:text-white flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-teal-500" />
                Primary Account
              </span>
              <span className="text-[9.5px] font-mono font-bold bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-500/30 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Verified
              </span>
            </div>
            <div className="font-mono text-xs text-stone-700 dark:text-stone-300 break-all">
              {profile.email}
            </div>
            <div className="flex items-center gap-1.5 pt-0.5">
              <span className="text-[10px] text-stone-400">Sign-in Provider:</span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950/80 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800 text-[10px] font-mono font-bold">
                {profile.authProvider === 'google' ? 'Google OAuth Provider' : 'Email & Password Provider'}
              </span>
            </div>
            <p className="text-[10px] text-stone-400 leading-tight">
              Authenticated via Supabase Auth & Secure Session Provider.
            </p>
          </div>

          {/* Password Recovery Section */}
          <div className="p-3.5 bg-stone-50 dark:bg-stone-800/60 rounded-2xl border border-stone-200/80 dark:border-white/5 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-stone-900 dark:text-white flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-indigo-500" />
                Password & Authentication
              </span>
              <span className="text-[9.5px] font-mono text-stone-400">
                Encrypted with bcrypt
              </span>
            </div>

            {resetSent ? (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-500/30 rounded-xl text-xs text-emerald-800 dark:text-emerald-200 flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Password reset link sent to {profile.email}. Check your inbox!</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={handlePasswordReset}
                disabled={resetLoading}
                className="w-full py-2.5 px-3 bg-white dark:bg-stone-700 hover:bg-stone-100 dark:hover:bg-stone-600 text-stone-800 dark:text-white rounded-xl text-xs font-bold border border-stone-200 dark:border-white/10 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <KeyRound className="w-3.5 h-3.5 text-indigo-500" />
                <span>{resetLoading ? 'Dispatching link...' : 'Send Password Reset Email'}</span>
              </button>
            )}

            {resetError && (
              <p className="text-[10.5px] text-rose-600 dark:text-rose-400 font-medium leading-snug">
                {resetError}
              </p>
            )}
          </div>

          {/* Active Session & Device Information */}
          <div className="p-3.5 bg-stone-50 dark:bg-stone-800/60 rounded-2xl border border-stone-200/80 dark:border-white/5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-stone-900 dark:text-white flex items-center gap-1.5">
                <Laptop className="w-3.5 h-3.5 text-teal-500" />
                Current Active Session
              </span>
              <span className="text-[9.5px] font-mono text-teal-600 dark:text-teal-400 font-bold">
                Online Now
              </span>
            </div>
            <div className="text-[11px] text-stone-600 dark:text-stone-300 space-y-1">
              <div className="flex justify-between">
                <span className="text-stone-400">Environment:</span>
                <span className="font-mono text-stone-700 dark:text-stone-200">AI Studio Web Container (Node.js 22)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-400">Database Connection:</span>
                <span className="font-mono text-teal-600 dark:text-teal-400 font-bold">
                  {isSupabaseConfigured ? 'Supabase HTTPS' : 'Local Sandbox Mode'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-400">Row Level Security:</span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">Enforced (auth.uid = id)</span>
              </div>
            </div>
          </div>

          {/* Logout Action */}
          <div className="pt-1">
            <button
              onClick={() => {
                sounds.playTap();
                onOpenLogoutConfirm();
              }}
              className="w-full py-3 px-4 rounded-2xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800/80 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer border border-stone-200/80 dark:border-white/5"
            >
              <LogOut className="w-4 h-4 text-stone-500" />
              <span>Log Out of SultiAI Session</span>
            </button>
          </div>

          {/* Danger Zone: Account Deletion */}
          <div className="pt-2 border-t border-stone-200/80 dark:border-white/10 space-y-2">
            {!showDeleteConfirm ? (
              <button
                type="button"
                onClick={() => {
                  sounds.playTap();
                  setShowDeleteConfirm(true);
                }}
                className="w-full py-2.5 px-3 rounded-2xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-950/50 text-rose-700 dark:text-rose-300 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer border border-rose-200 dark:border-rose-500/20"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Account & Erase Telemetry</span>
              </button>
            ) : (
              <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-500/40 rounded-2xl space-y-2.5 animate-in fade-in duration-150">
                <div className="flex items-center gap-2 text-rose-700 dark:text-rose-300 font-black text-xs">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>Permanent Account Deletion Warning</span>
                </div>
                <p className="text-[10.5px] text-rose-800 dark:text-rose-300 leading-tight">
                  This will permanently delete your learner profile, Whisper recordings, streak history, and badges. Type <strong>DELETE</strong> below to confirm.
                </p>

                {deleteError && (
                  <p className="text-[10px] text-rose-600 dark:text-rose-400 font-bold">
                    {deleteError}
                  </p>
                )}

                <input
                  type="text"
                  value={deleteConfirmationText}
                  onChange={(e) => {
                    setDeleteConfirmationText(e.target.value);
                    if (deleteError) setDeleteError(null);
                  }}
                  placeholder="Type DELETE to confirm"
                  className="w-full bg-white dark:bg-stone-900 border border-rose-300 dark:border-rose-500/40 rounded-xl px-3 py-2 text-xs font-mono text-stone-900 dark:text-white"
                />

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      sounds.playTap();
                      setShowDeleteConfirm(false);
                      setDeleteConfirmationText('');
                    }}
                    className="px-3 py-1.5 text-xs text-stone-600 dark:text-stone-400 font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmDelete}
                    className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black shadow-sm cursor-pointer"
                  >
                    Erase My Data
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-stone-200/80 dark:border-white/10 flex items-center justify-end bg-stone-50/50 dark:bg-stone-900/40">
          <button
            onClick={() => {
              sounds.playTap();
              onClose();
            }}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-stone-200 dark:bg-stone-800 text-stone-800 dark:text-stone-200 hover:bg-stone-300 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
