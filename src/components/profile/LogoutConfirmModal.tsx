import React, { useState } from 'react';
import { X, LogOut, AlertTriangle, Loader2 } from 'lucide-react';
import { sounds } from '../../utils/soundEffects';

interface LogoutConfirmModalProps {
  userName: string;
  onConfirmLogout: () => Promise<void> | void;
  onClose: () => void;
}

export const LogoutConfirmModal: React.FC<LogoutConfirmModalProps> = ({
  userName,
  onConfirmLogout,
  onClose,
}) => {
  const [loggingOut, setLoggingOut] = useState(false);

  const handleConfirm = async () => {
    setLoggingOut(true);
    sounds.playTap();
    try {
      await onConfirmLogout();
      sounds.playCorrect();
    } finally {
      setLoggingOut(false);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div 
        className="w-full max-w-sm bg-white dark:bg-[#11222D] rounded-3xl border border-stone-200 dark:border-white/10 shadow-2xl p-6 space-y-4"
        role="dialog"
        aria-labelledby="logout-title"
      >
        <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
          <LogOut className="w-6 h-6" />
        </div>

        <div className="text-center space-y-1">
          <h2 id="logout-title" className="font-display font-black text-base text-stone-900 dark:text-white">
            Log Out of SultiAI?
          </h2>
          <p className="text-xs text-stone-500 dark:text-stone-400">
            Are you sure you want to log out, <strong>{userName}</strong>? Your learning progress and badges are securely stored.
          </p>
        </div>

        <div className="p-3 bg-stone-50 dark:bg-stone-800/60 rounded-2xl border border-stone-200/80 dark:border-white/5 text-[10.5px] text-stone-500 dark:text-stone-400 text-center leading-normal">
          🔒 Private transcripts and in-memory caches will be cleared safely from this device.
        </div>

        <div className="flex items-center gap-2 pt-2">
          <button
            type="button"
            onClick={() => {
              sounds.playTap();
              onClose();
            }}
            disabled={loggingOut}
            className="flex-1 py-2.5 rounded-2xl text-xs font-bold bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loggingOut}
            className="flex-1 py-2.5 rounded-2xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center gap-1.5 shadow-md transition-colors cursor-pointer"
          >
            {loggingOut ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Logging out...</span>
              </>
            ) : (
              <span>Confirm Log Out</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
