import React, { useRef, useState } from 'react';
import { X, Check, Sparkles, Upload, Loader2, ImagePlus, AlertCircle } from 'lucide-react';
import { SULTI_AVATARS } from './types';
import { sounds } from '../../utils/soundEffects';
import { addNotification } from '../../utils/notificationService';
import { supabase } from '../../services/supabaseClient';
import { prepareAvatarImage, uploadAvatarToSupabase } from '../../utils/imageUpload';

interface AvatarSelectionModalProps {
  currentAvatar: string;
  onSelectAvatar: (avatarUrl: string) => void;
  onClose: () => void;
  userId?: string;
}

export const AvatarSelectionModal: React.FC<AvatarSelectionModalProps> = ({
  currentAvatar,
  onSelectAvatar,
  onClose,
  userId,
}) => {
  const [selectedUrl, setSelectedUrl] = useState(currentAvatar);
  const [processing, setProcessing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedPreset = SULTI_AVATARS.find((avatar) => avatar.url === selectedUrl);
  const isCustomPhoto = !selectedPreset && Boolean(selectedUrl);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    // Reset so choosing the same file again still triggers onChange.
    event.target.value = '';
    if (!file) return;

    setError(null);
    setProcessing(true);
    sounds.playTap();

    try {
      const prepared = await prepareAvatarImage(file);
      setSelectedUrl(prepared);
      sounds.playCorrect();
    } catch (err: any) {
      setError(err?.message || 'Could not process that photo. Please try another image.');
      sounds.playWrong();
    } finally {
      setProcessing(false);
    }
  };

  const handleConfirm = async () => {
    if (saving || processing) return;

    setSaving(true);
    sounds.playTap();

    try {
      const finalUrl = await uploadAvatarToSupabase(selectedUrl, userId);
      onSelectAvatar(finalUrl);

      // Sync to Supabase profiles table if available.
      if (supabase && userId) {
        try {
          await supabase.from('profiles').update({
            avatar_url: finalUrl,
            updated_at: new Date().toISOString(),
          }).eq('id', userId);
        } catch (err) {
          console.warn('Avatar update warning:', err);
        }

        // Keep the auth session metadata in sync so the photo survives reloads.
        // Skip data URLs — they are too large to embed in the session token.
        if (!finalUrl.startsWith('data:')) {
          try {
            await supabase.auth.updateUser({ data: { avatar_url: finalUrl } });
          } catch (err) {
            console.warn('Auth avatar metadata warning:', err);
          }
        }
      }

      addNotification({
        category: 'system',
        title: '📸 Profile Photo Updated',
        titleBisaya: 'Gibag-o ang Imong Profile Photo',
        message: 'Your new profile picture is now shown across your learning dashboard.',
        iconType: 'sparkles',
      });

      sounds.playCorrect();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Could not save your profile photo. Please try again.');
      sounds.playWrong();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md bg-white dark:bg-[#11222D] rounded-3xl border border-stone-200 dark:border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        role="dialog"
        aria-labelledby="avatar-picker-title"
      >
        {/* Header */}
        <div className="p-4 border-b border-stone-200/80 dark:border-white/10 flex items-center justify-between bg-stone-50/50 dark:bg-stone-900/40">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-teal-50 dark:bg-teal-950/70 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 id="avatar-picker-title" className="font-display font-black text-sm text-stone-900 dark:text-white">
                Profile Photo & Avatar
              </h2>
              <p className="text-[10px] text-stone-500 dark:text-stone-400">
                Upload your own photo or choose a SultiAI avatar
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

        {/* Selected Preview Hero */}
        <div className="p-4 bg-gradient-to-b from-teal-50/40 to-transparent dark:from-teal-950/20 dark:to-transparent flex items-center gap-4 border-b border-stone-100 dark:border-white/5">
          <div className="relative">
            {selectedUrl ? (
              <img
                src={selectedUrl}
                alt="Selected Preview"
                className="w-16 h-16 rounded-full object-cover border-4 border-teal-500 shadow-md"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-stone-100 dark:bg-stone-800 border-4 border-teal-500 shadow-md flex items-center justify-center text-stone-400">
                <ImagePlus className="w-6 h-6" />
              </div>
            )}
            <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] border-2 border-white dark:border-[#11222D]">
              ✓
            </span>
          </div>
          <div>
            <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">
              Active Selection Preview
            </div>
            <div className="font-display font-black text-sm text-stone-900 dark:text-white">
              {selectedPreset?.name || (isCustomPhoto ? 'Your Profile Photo' : 'SultiAI Learner')}
            </div>
            <div className="text-[11px] text-stone-500 dark:text-stone-400">
              {selectedPreset?.role || (isCustomPhoto ? 'Uploaded from your device' : 'SultiAI Learner')}
            </div>
          </div>
        </div>

        {/* Upload Own Photo */}
        <div className="px-4 pt-4">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={handleFileChange}
          />
          <button
            type="button"
            onClick={() => {
              sounds.playTap();
              fileInputRef.current?.click();
            }}
            disabled={processing || saving}
            className="w-full flex items-center gap-3 p-3 rounded-2xl border border-dashed border-teal-500/60 bg-teal-50/60 dark:bg-teal-950/30 hover:bg-teal-50 dark:hover:bg-teal-950/50 transition-colors cursor-pointer text-left disabled:opacity-60 disabled:cursor-wait"
          >
            <span className="w-10 h-10 shrink-0 rounded-xl bg-teal-500 text-stone-950 flex items-center justify-center shadow-sm">
              {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[11.5px] font-black text-stone-900 dark:text-white">
                {processing ? 'Processing photo…' : isCustomPhoto ? 'Change profile photo' : 'Upload photo from device'}
              </span>
              <span className="block text-[10px] text-stone-500 dark:text-stone-400">
                JPG, PNG, WEBP or GIF · up to 10 MB
              </span>
            </span>
            <span className="shrink-0 text-[10px] font-bold px-2 py-1 rounded-lg bg-white dark:bg-stone-800 border border-teal-500/30 text-teal-700 dark:text-teal-300">
              Browse
            </span>
          </button>

          {error && (
            <div className="mt-2 p-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-500/30 rounded-xl flex items-center gap-2 text-rose-700 dark:text-rose-300 text-[10.5px]">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Avatars Grid */}
        <div className="p-4 pt-3 overflow-y-auto grid grid-cols-3 gap-3 flex-1">
          {SULTI_AVATARS.map((avatar) => {
            const isSelected = selectedUrl === avatar.url;
            return (
              <button
                key={avatar.id}
                type="button"
                onClick={() => {
                  sounds.playTap();
                  setSelectedUrl(avatar.url);
                  setError(null);
                }}
                className={`p-2.5 rounded-2xl border text-center transition-all flex flex-col items-center gap-2 cursor-pointer relative group ${
                  isSelected
                    ? 'bg-teal-50/80 dark:bg-teal-950/60 border-teal-500 shadow-md ring-2 ring-teal-500/30 scale-[1.02]'
                    : 'bg-white dark:bg-stone-800/60 border-stone-200 dark:border-white/10 hover:border-teal-400/60'
                }`}
              >
                <div className="relative">
                  <img
                    src={avatar.url}
                    alt={avatar.name}
                    className="w-14 h-14 rounded-full object-cover border-2 border-stone-200 dark:border-white/10 group-hover:scale-105 transition-transform"
                  />
                  {isSelected && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-teal-500 text-stone-950 flex items-center justify-center text-[11px] font-black shadow-xs">
                      ✓
                    </span>
                  )}
                </div>
                <div className="min-w-0 w-full">
                  <div className="font-display font-black text-[11.5px] text-stone-900 dark:text-white truncate">
                    {avatar.name}
                  </div>
                  <div className="text-[9.5px] text-stone-500 dark:text-stone-400 truncate">
                    {avatar.tag}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-stone-200/80 dark:border-white/10 flex items-center justify-between bg-stone-50/50 dark:bg-stone-900/40">
          <span className="text-[10px] text-stone-400">
            {SULTI_AVATARS.length} official avatars + your own photo
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                sounds.playTap();
                onClose();
              }}
              disabled={saving}
              className="px-4 py-2 rounded-xl text-xs font-bold text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={saving || processing || !selectedUrl}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-teal-500 hover:bg-teal-400 text-stone-950 flex items-center gap-1.5 shadow-md transition-all cursor-pointer disabled:opacity-60 disabled:cursor-wait"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              <span>{saving ? 'Saving…' : 'Save Photo'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
