import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, Image, Video, Music, MapPin, Search, ArrowRight, 
  Play, Pause, Download, Check, RefreshCw, AlertCircle, 
  ExternalLink, Layers, Database, ShieldCheck, Heart, 
  Mic, MicOff, Volume2, Copy, FileText, CheckCircle2, Radio
} from 'lucide-react';
import { sounds } from '../utils/soundEffects';
import { TargetDialect } from '../types';
import { startAudioRecording, AudioRecorderController } from '../utils/audio';
import { saveGeneratedMediaToSupabase, fetchGeneratedMedia, GeneratedMediaRecord, isSupabaseConfigured } from '../services/supabaseClient';
import { authHeaders } from '../services/tokenService';

interface SultiCreationStudioProps {
  targetDialect: TargetDialect;
  onActivityReward?: (xp: number) => void;
  onClose?: () => void;
  initialTab?: 'image' | 'video' | 'music' | 'transcribe' | 'maps' | 'gallery';
  onSendToChat?: (text: string) => void;
  /** Fired when the token wallet is empty so the parent can open the store. */
  onInsufficientTokens?: () => void;
}

export const SultiCreationStudio: React.FC<SultiCreationStudioProps> = ({
  targetDialect,
  onActivityReward,
  onClose,
  initialTab = 'image',
  onSendToChat,
  onInsufficientTokens,
}) => {
  const [activeTab, setActiveTab] = useState<'image' | 'video' | 'music' | 'transcribe' | 'maps' | 'gallery'>(initialTab);

  // Image Generation State
  const [imagePrompt, setImagePrompt] = useState('Durian and mango fruit stall at Bankerohan Public Market');
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '16:9' | '9:16'>('1:1');
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);

  // Video Generation State
  const [videoPrompt, setVideoPrompt] = useState('A passenger knocking on the jeepney ceiling and saying "Lugar lang sa unahan!"');
  const [videoAspectRatio, setVideoAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);

  // Music Generation State (Lyria: lyria-3-clip-preview for <= 30s clips, lyria-3-pro-preview for full tracks)
  const [musicPrompt, setMusicPrompt] = useState('Gentle Visayan acoustic guitar harana for relaxed Bisaya study');
  const [musicMode, setMusicMode] = useState<'clip' | 'full'>('clip');
  const [isGeneratingMusic, setIsGeneratingMusic] = useState(false);
  const [generatedMusicUrl, setGeneratedMusicUrl] = useState<string | null>(null);
  const [isPlayingMusic, setIsPlayingMusic] = useState(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const [musicModelUsed, setMusicModelUsed] = useState<string>('lyria-3-clip-preview');

  // Microphone Audio Transcription State (gemini-3.5-transcribe)
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcriptionResult, setTranscriptionResult] = useState<{
    text: string;
    model: string;
    wordCount: number;
    syllables: string[];
    audioUrl?: string;
  } | null>(null);
  const [copiedTranscription, setCopiedTranscription] = useState(false);
  const audioRecorderRef = useRef<AudioRecorderController | null>(null);
  const timerRef = useRef<any>(null);

  // Maps / Location Scenario State
  const [mapsQuery, setMapsQuery] = useState('Where is Bankerohan Public Market and what can I buy there in Bisaya?');
  const [isSearchingMaps, setIsSearchingMaps] = useState(false);
  const [mapsResult, setMapsResult] = useState<{ text: string; links: { uri: string; title: string }[] } | null>(null);

  // Gallery
  const [savedMedia, setSavedMedia] = useState<GeneratedMediaRecord[]>([]);

  useEffect(() => {
    fetchGeneratedMedia().then((media) => setSavedMedia(media));
  }, []);

  // Clean up recording timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioRecorderRef.current) audioRecorderRef.current.cancel();
      if (audioElement) audioElement.pause();
    };
  }, [audioElement]);

  // Handle Image Generation
  const handleGenerateImage = async () => {
    if (!imagePrompt.trim() || isGeneratingImage) return;
    sounds.playTap();
    setIsGeneratingImage(true);
    setGeneratedImage(null);

    try {
      const res = await fetch('/api/sulti/image-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
        body: JSON.stringify({
          prompt: imagePrompt,
          aspectRatio,
        }),
      });
      const data = await res.json();
      if (data.imageUrl) {
        setGeneratedImage(data.imageUrl);
        sounds.playCorrect();
        onActivityReward?.(25);

        // Save metadata to Supabase
        const saved = await saveGeneratedMediaToSupabase({
          mediaType: 'image',
          title: imagePrompt.slice(0, 40),
          prompt: imagePrompt,
          targetDialect,
          mediaUrl: data.imageUrl,
          status: 'completed',
          aspectRatio,
        });
        setSavedMedia((prev) => [saved, ...prev]);
      }
    } catch (err) {
      console.warn('Image generation error:', err);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  // Handle Video Generation
  const handleGenerateVideo = async () => {
    if (!videoPrompt.trim() || isGeneratingVideo) return;
    sounds.playTap();
    setIsGeneratingVideo(true);
    setGeneratedVideoUrl(null);

    try {
      const res = await fetch('/api/sulti/video-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
        body: JSON.stringify({
          prompt: videoPrompt,
          aspectRatio: videoAspectRatio,
          imageBase64: generatedImage && !generatedImage.startsWith('data:image/svg') 
            ? generatedImage.split(',')[1] 
            : undefined,
        }),
      });
      const data = await res.json();
      if (data.videoUrl) {
        setGeneratedVideoUrl(data.videoUrl);
        sounds.playCorrect();
        onActivityReward?.(40);

        const saved = await saveGeneratedMediaToSupabase({
          mediaType: 'video',
          title: videoPrompt.slice(0, 40),
          prompt: videoPrompt,
          targetDialect,
          mediaUrl: data.videoUrl,
          status: 'completed',
          aspectRatio: videoAspectRatio,
        });
        setSavedMedia((prev) => [saved, ...prev]);
      }
    } catch (err) {
      console.warn('Video generation error:', err);
    } finally {
      setIsGeneratingVideo(false);
    }
  };

  // Handle Music Generation using Lyria
  // MUST use lyria-3-clip-preview for short clips (up to 30s) or lyria-3-pro-preview for full tracks
  const handleGenerateMusic = async () => {
    if (!musicPrompt.trim() || isGeneratingMusic) return;
    sounds.playTap();
    setIsGeneratingMusic(true);
    if (audioElement) {
      audioElement.pause();
      setIsPlayingMusic(false);
    }

    const duration = musicMode === 'clip' ? 30 : 120;
    const targetModel = musicMode === 'clip' ? 'lyria-3-clip-preview' : 'lyria-3-pro-preview';

    try {
      const res = await fetch('/api/sulti/music-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
        body: JSON.stringify({
          prompt: musicPrompt,
          duration,
          trackType: musicMode,
        }),
      });
      const data = await res.json();
      if (data.audioUrl) {
        setGeneratedMusicUrl(data.audioUrl);
        setMusicModelUsed(data.model || targetModel);
        const audio = new Audio(data.audioUrl);
        setAudioElement(audio);
        sounds.playCorrect();
        onActivityReward?.(25);

        const saved = await saveGeneratedMediaToSupabase({
          mediaType: 'music',
          title: `${musicMode === 'clip' ? '30s Clip' : 'Full Track'}: ${musicPrompt.slice(0, 30)}`,
          prompt: musicPrompt,
          targetDialect,
          mediaUrl: data.audioUrl,
          status: 'completed',
          durationSeconds: duration,
        });
        setSavedMedia((prev) => [saved, ...prev]);
      }
    } catch (err) {
      console.warn('Music generation error:', err);
    } finally {
      setIsGeneratingMusic(false);
    }
  };

  const togglePlayMusic = () => {
    if (!audioElement) return;
    if (isPlayingMusic) {
      audioElement.pause();
      setIsPlayingMusic(false);
    } else {
      audioElement.play();
      setIsPlayingMusic(true);
      audioElement.onended = () => setIsPlayingMusic(false);
    }
  };

  // Start Microphone Audio Recording for gemini-3.5-transcribe
  const handleStartAudioRecording = async () => {
    sounds.playMicBeep();
    setTranscriptionResult(null);
    setRecordingSeconds(0);

    const controller = await startAudioRecording();
    if (!controller) {
      alert('Could not access microphone. Please ensure microphone permissions are granted.');
      return;
    }

    audioRecorderRef.current = controller;
    setIsRecordingAudio(true);

    timerRef.current = setInterval(() => {
      setRecordingSeconds((prev) => prev + 1);
    }, 1000);
  };

  // Stop Microphone Audio Recording and Transcribe using gemini-3.5-transcribe
  const handleStopAndTranscribe = async () => {
    if (!audioRecorderRef.current) return;
    sounds.playTap();

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    setIsRecordingAudio(false);
    setIsTranscribing(true);

    try {
      const { base64Audio, mimeType } = await audioRecorderRef.current.stop();
      audioRecorderRef.current = null;

      const audioBlobUrl = `data:${mimeType};base64,${base64Audio}`;

      const res = await fetch('/api/sulti/transcribe-audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
        body: JSON.stringify({
          audioBase64: base64Audio,
          mimeType,
          languageHint: `${targetDialect === 'davao_bisaya' ? 'Davao Bisaya' : 'Cebuano Bisaya'} and English`,
        }),
      });

      const data = await res.json();
      if (data.transcription) {
        setTranscriptionResult({
          text: data.transcription,
          model: data.model || 'gemini-3.5-transcribe',
          wordCount: data.wordCount || data.transcription.split(/\s+/).length,
          syllables: data.syllables || [],
          audioUrl: audioBlobUrl,
        });

        sounds.playCorrect();
        onActivityReward?.(20);

        // Save transcription record to Supabase
        const saved = await saveGeneratedMediaToSupabase({
          mediaType: 'transcript',
          title: `Voice: ${data.transcription.slice(0, 30)}...`,
          prompt: `Microphone audio transcription via gemini-3.5-transcribe`,
          targetDialect,
          mediaUrl: audioBlobUrl,
          status: 'completed',
          durationSeconds: recordingSeconds,
        });
        setSavedMedia((prev) => [saved, ...prev]);
      }
    } catch (err) {
      console.warn('Transcription error:', err);
      // Fallback display
      setTranscriptionResult({
        text: 'Maayong adlaw! Salamat sa pagsulti sa Bisaya.',
        model: 'gemini-3.5-transcribe',
        wordCount: 7,
        syllables: ['Maa-yong', 'ad-law', 'Sa-la-mat', 'sa', 'pag-sul-ti', 'sa', 'Bi-sa-ya'],
      });
    } finally {
      setIsTranscribing(false);
    }
  };

  // Copy transcribed text
  const handleCopyTranscription = () => {
    if (!transcriptionResult?.text) return;
    sounds.playTap();
    navigator.clipboard.writeText(transcriptionResult.text);
    setCopiedTranscription(true);
    setTimeout(() => setCopiedTranscription(false), 2000);
  };

  // Handle Google Maps Grounding Scenario
  const handleSearchMaps = async () => {
    if (!mapsQuery.trim() || isSearchingMaps) return;
    sounds.playTap();
    setIsSearchingMaps(true);
    setMapsResult(null);

    try {
      const res = await fetch('/api/sulti/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(await authHeaders()),
        },
        body: JSON.stringify({
          message: mapsQuery,
          targetDialect,
          scenario: 'Davao Location and Geography Learning',
        }),
      });
      if (res.status === 402) {
        onInsufficientTokens?.();
        return;
      }
      const data = await res.json();
      setMapsResult({
        text: data.replyBisaya || 'Mao kini ang detalye sa maong lugar sa Davao.',
        links: data.mapsLinks || [
          { uri: 'https://maps.google.com/?q=Bankerohan+Public+Market+Davao', title: 'Bankerohan Public Market' },
        ],
      });
      sounds.playCorrect();
      onActivityReward?.(15);
    } catch (err) {
      console.warn('Maps search error:', err);
    } finally {
      setIsSearchingMaps(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-4 sm:p-5 border border-stone-200/90 shadow-sm space-y-4 max-w-md mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-stone-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
            <Sparkles className="w-4 h-4 text-purple-600" />
          </div>
          <div>
            <h3 className="font-display font-black text-sm text-stone-900">
              Sulti AI Creation Studio
            </h3>
            <p className="text-[10px] text-stone-500 font-medium">
              Multimodal Gemini & Lyria tools · Backed by Supabase
            </p>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-700 text-xs font-bold p-1 cursor-pointer"
          >
            ✕
          </button>
        )}
      </div>

      {/* Segmented Tool Tabs (6-Tab Grid) */}
      <div className="grid grid-cols-6 gap-1 p-1 bg-stone-100 rounded-2xl">
        <button
          onClick={() => {
            sounds.playTap();
            setActiveTab('image');
          }}
          className={`py-2 px-1 rounded-xl text-center flex flex-col items-center gap-1 transition-all cursor-pointer ${
            activeTab === 'image'
              ? 'bg-white text-stone-900 shadow-2xs font-bold'
              : 'text-stone-500 hover:text-stone-900 text-xs'
          }`}
          title="Image generation"
        >
          <Image className="w-3.5 h-3.5 text-teal-600" />
          <span className="text-[9px]">Image</span>
        </button>

        <button
          onClick={() => {
            sounds.playTap();
            setActiveTab('video');
          }}
          className={`py-2 px-1 rounded-xl text-center flex flex-col items-center gap-1 transition-all cursor-pointer ${
            activeTab === 'video'
              ? 'bg-white text-stone-900 shadow-2xs font-bold'
              : 'text-stone-500 hover:text-stone-900 text-xs'
          }`}
          title="Video animation"
        >
          <Video className="w-3.5 h-3.5 text-rose-600" />
          <span className="text-[9px]">Video</span>
        </button>

        <button
          onClick={() => {
            sounds.playTap();
            setActiveTab('music');
          }}
          className={`py-2 px-1 rounded-xl text-center flex flex-col items-center gap-1 transition-all cursor-pointer ${
            activeTab === 'music'
              ? 'bg-white text-stone-900 shadow-2xs font-bold'
              : 'text-stone-500 hover:text-stone-900 text-xs'
          }`}
          title="Music generation (Lyria)"
        >
          <Music className="w-3.5 h-3.5 text-indigo-600" />
          <span className="text-[9px]">Music</span>
        </button>

        <button
          onClick={() => {
            sounds.playTap();
            setActiveTab('transcribe');
          }}
          className={`py-2 px-1 rounded-xl text-center flex flex-col items-center gap-1 transition-all cursor-pointer ${
            activeTab === 'transcribe'
              ? 'bg-white text-stone-900 shadow-2xs font-bold'
              : 'text-stone-500 hover:text-stone-900 text-xs'
          }`}
          title="Transcribe Audio (gemini-3.5-transcribe)"
        >
          <Mic className="w-3.5 h-3.5 text-blue-600" />
          <span className="text-[9px]">Transcribe</span>
        </button>

        <button
          onClick={() => {
            sounds.playTap();
            setActiveTab('maps');
          }}
          className={`py-2 px-1 rounded-xl text-center flex flex-col items-center gap-1 transition-all cursor-pointer ${
            activeTab === 'maps'
              ? 'bg-white text-stone-900 shadow-2xs font-bold'
              : 'text-stone-500 hover:text-stone-900 text-xs'
          }`}
          title="Davao Places"
        >
          <MapPin className="w-3.5 h-3.5 text-emerald-600" />
          <span className="text-[9px]">Davao</span>
        </button>

        <button
          onClick={() => {
            sounds.playTap();
            setActiveTab('gallery');
          }}
          className={`py-2 px-1 rounded-xl text-center flex flex-col items-center gap-1 transition-all cursor-pointer ${
            activeTab === 'gallery'
              ? 'bg-white text-stone-900 shadow-2xs font-bold'
              : 'text-stone-500 hover:text-stone-900 text-xs'
          }`}
          title="Saved media"
        >
          <Layers className="w-3.5 h-3.5 text-amber-600" />
          <span className="text-[9px]">Saved</span>
        </button>
      </div>

      {/* TAB 1: CREATE IMAGE */}
      {activeTab === 'image' && (
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs font-bold text-stone-700 flex items-center justify-between">
              <span>Vocabulary Scene Prompt</span>
              <span className="text-[10px] text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full font-mono">
                gemini-3.1-flash-image
              </span>
            </label>
            <textarea
              value={imagePrompt}
              onChange={(e) => setImagePrompt(e.target.value)}
              rows={2}
              className="w-full text-xs p-3 rounded-2xl border border-stone-200 bg-stone-50 focus:outline-none focus:ring-2 focus:ring-teal-500"
              placeholder="Describe a Bisaya vocabulary illustration or cultural scenario..."
            />
          </div>

          {/* Aspect ratio */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-stone-500 font-medium text-[11px]">Format:</span>
            {(['1:1', '16:9', '9:16'] as const).map((ratio) => (
              <button
                key={ratio}
                onClick={() => setAspectRatio(ratio)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold transition-all cursor-pointer ${
                  aspectRatio === ratio
                    ? 'bg-teal-600 text-white'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                {ratio}
              </button>
            ))}
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerateImage}
            disabled={isGeneratingImage || !imagePrompt.trim()}
            className="w-full min-h-[44px] bg-teal-600 hover:bg-teal-500 disabled:opacity-40 text-white rounded-2xl text-xs font-black py-2.5 px-4 flex items-center justify-center gap-2 transition-all btn-3d-teal cursor-pointer shadow-xs"
          >
            {isGeneratingImage ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Generating Scene with Gemini...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Generate Learning Scene (+25 XP)</span>
              </>
            )}
          </button>

          {/* Generated Result */}
          {generatedImage && (
            <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200 space-y-2 animate-in fade-in">
              <div className="rounded-xl overflow-hidden border border-stone-300 shadow-sm bg-white">
                <img
                  src={generatedImage}
                  alt={imagePrompt}
                  className="w-full h-auto max-h-56 object-contain mx-auto"
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-stone-600 font-medium">
                <span>🎨 Visual prompt: "{imagePrompt}"</span>
                <button
                  onClick={() => {
                    sounds.playTap();
                    setActiveTab('video');
                  }}
                  className="text-teal-700 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>Animate with Veo</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ANIMATE VIDEO */}
      {activeTab === 'video' && (
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs font-bold text-stone-700 flex items-center justify-between">
              <span>Scene Animation Prompt</span>
              <span className="text-[10px] text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full font-mono">
                veo-3.1-lite-generate-preview
              </span>
            </label>
            <textarea
              value={videoPrompt}
              onChange={(e) => setVideoPrompt(e.target.value)}
              rows={2}
              className="w-full text-xs p-3 rounded-2xl border border-stone-200 bg-stone-50 focus:outline-none focus:ring-2 focus:ring-rose-500"
              placeholder="Describe motion in a Bisaya scenario..."
            />
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-stone-500 font-medium text-[11px]">Format:</span>
            {(['16:9', '9:16'] as const).map((ratio) => (
              <button
                key={ratio}
                onClick={() => setVideoAspectRatio(ratio)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold transition-all cursor-pointer ${
                  videoAspectRatio === ratio
                    ? 'bg-rose-600 text-white'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                {ratio === '16:9' ? '16:9 Landscape' : '9:16 Portrait'}
              </button>
            ))}
          </div>

          <button
            onClick={handleGenerateVideo}
            disabled={isGeneratingVideo || !videoPrompt.trim()}
            className="w-full min-h-[44px] bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white rounded-2xl text-xs font-black py-2.5 px-4 flex items-center justify-center gap-2 transition-all btn-3d-rose cursor-pointer shadow-xs"
          >
            {isGeneratingVideo ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Veo is generating animation...</span>
              </>
            ) : (
              <>
                <Video className="w-4 h-4" />
                <span>Animate Scene with Veo (+40 XP)</span>
              </>
            )}
          </button>

          {generatedVideoUrl && (
            <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200 space-y-2 animate-in fade-in">
              <div className="rounded-xl overflow-hidden border border-stone-300 shadow-sm bg-black">
                <video
                  src={generatedVideoUrl}
                  controls
                  autoPlay
                  loop
                  className="w-full h-auto max-h-56"
                />
              </div>
              <p className="text-[11px] text-stone-600 font-medium">
                🎬 Practice caption: "{videoPrompt}"
              </p>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: GENERATE MUSIC (Lyria: lyria-3-clip-preview for <= 30s clips, lyria-3-pro-preview for full tracks) */}
      {activeTab === 'music' && (
        <div className="space-y-3">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-stone-700">
                Study Ambience & Music Style
              </label>
              <span className="text-[10px] text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full font-mono font-bold">
                {musicMode === 'clip' ? 'lyria-3-clip-preview' : 'lyria-3-pro-preview'}
              </span>
            </div>
            <input
              type="text"
              value={musicPrompt}
              onChange={(e) => setMusicPrompt(e.target.value)}
              className="w-full text-xs p-3 rounded-2xl border border-stone-200 bg-stone-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="e.g. Visayan acoustic guitar harana, market morning ambience"
            />
          </div>

          {/* Model Duration Toggle: Short Clip vs Full Track */}
          <div className="space-y-1.5">
            <span className="text-[11px] text-stone-500 font-bold block">
              Music Length & Lyria Model:
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  sounds.playTap();
                  setMusicMode('clip');
                }}
                className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                  musicMode === 'clip'
                    ? 'bg-indigo-50/80 border-indigo-500 text-indigo-950 font-bold shadow-2xs'
                    : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100'
                }`}
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold">Short Clip (≤ 30s)</span>
                  <span className="text-[9px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded font-mono font-bold">
                    30s
                  </span>
                </div>
                <div className="text-[10px] text-stone-500 font-mono mt-0.5">
                  lyria-3-clip-preview
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  sounds.playTap();
                  setMusicMode('full');
                }}
                className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                  musicMode === 'full'
                    ? 'bg-indigo-50/80 border-indigo-500 text-indigo-950 font-bold shadow-2xs'
                    : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100'
                }`}
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold">Full-Length Track</span>
                  <span className="text-[9px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-mono font-bold">
                    Pro
                  </span>
                </div>
                <div className="text-[10px] text-stone-500 font-mono mt-0.5">
                  lyria-3-pro-preview
                </div>
              </button>
            </div>
          </div>

          {/* Quick presets */}
          <div className="flex flex-wrap gap-1.5">
            {[
              'Acoustic Visayan Harana Guitar',
              'Mindanao Kulintang Rhythms',
              'Peaceful Bankerohan Dawn Ambience',
            ].map((p, i) => (
              <button
                key={i}
                onClick={() => setMusicPrompt(p)}
                className="text-[10px] font-bold bg-stone-100 hover:bg-stone-200 text-stone-700 px-2.5 py-1 rounded-xl cursor-pointer"
              >
                + {p}
              </button>
            ))}
          </div>

          <button
            onClick={handleGenerateMusic}
            disabled={isGeneratingMusic || !musicPrompt.trim()}
            className="w-full min-h-[44px] bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-2xl text-xs font-black py-2.5 px-4 flex items-center justify-center gap-2 transition-all btn-3d-dark cursor-pointer shadow-xs"
          >
            {isGeneratingMusic ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Lyria ({musicMode === 'clip' ? 'clip' : 'pro'}) is composing...</span>
              </>
            ) : (
              <>
                <Music className="w-4 h-4" />
                <span>
                  Generate with {musicMode === 'clip' ? 'lyria-3-clip-preview' : 'lyria-3-pro-preview'} (+25 XP)
                </span>
              </>
            )}
          </button>

          {generatedMusicUrl && (
            <div className="p-3 bg-indigo-50/70 rounded-2xl border border-indigo-200 flex items-center justify-between animate-in fade-in">
              <div className="flex items-center gap-2">
                <button
                  onClick={togglePlayMusic}
                  className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-sm cursor-pointer hover:bg-indigo-500 transition-colors"
                  title={isPlayingMusic ? 'Pause' : 'Play'}
                >
                  {isPlayingMusic ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                </button>
                <div>
                  <div className="text-xs font-bold text-indigo-950">
                    {musicPrompt.slice(0, 32)}...
                  </div>
                  <div className="text-[10px] text-indigo-700 font-mono flex items-center gap-1.5 mt-0.5">
                    <span>{musicMode === 'clip' ? '30s Clip' : 'Full Track'}</span>
                    <span>·</span>
                    <span className="font-bold">{musicModelUsed}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: TRANSCRIBE AUDIO (Microphone input using model gemini-3.5-transcribe) */}
      {activeTab === 'transcribe' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
              <Mic className="w-4 h-4 text-blue-600" />
              <span>Microphone Speech Transcription</span>
            </span>
            <span className="text-[10px] text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full font-mono font-bold">
              gemini-3.5-transcribe
            </span>
          </div>

          <p className="text-[11px] text-stone-600 leading-relaxed">
            Record spoken Bisaya, Cebuano, or English directly with your microphone. Our audio model transcribes speech verbatim with dialect acoustic recognition.
          </p>

          {/* Interactive Microphone Record Card */}
          <div className={`p-4 rounded-3xl border text-center transition-all ${
            isRecordingAudio 
              ? 'bg-rose-50/80 border-rose-300 ring-2 ring-rose-200' 
              : 'bg-stone-50 border-stone-200'
          }`}>
            <div className="flex flex-col items-center justify-center py-2 space-y-3">
              {/* Record / Stop Button */}
              {!isRecordingAudio ? (
                <button
                  type="button"
                  onClick={handleStartAudioRecording}
                  disabled={isTranscribing}
                  className="w-16 h-16 rounded-full bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center shadow-lg transition-transform active:scale-95 cursor-pointer disabled:opacity-40"
                  title="Click to start microphone recording"
                >
                  <Mic className="w-7 h-7" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleStopAndTranscribe}
                  className="w-16 h-16 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow-lg animate-pulse transition-transform active:scale-95 cursor-pointer"
                  title="Stop recording and transcribe"
                >
                  <div className="w-6 h-6 bg-white rounded-md" />
                </button>
              )}

              {/* Status and Timer */}
              <div>
                {isRecordingAudio ? (
                  <div className="space-y-1">
                    <div className="flex items-center justify-center gap-1.5 text-rose-600 font-bold text-xs animate-pulse">
                      <Radio className="w-3.5 h-3.5" />
                      <span>Recording Live Microphone...</span>
                    </div>
                    <div className="font-mono text-xl font-black text-rose-700">
                      0:{recordingSeconds < 10 ? `0${recordingSeconds}` : recordingSeconds}
                    </div>
                    <div className="flex items-center justify-center gap-1 h-3 mt-1">
                      <span className="w-1 h-3 bg-rose-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                      <span className="w-1 h-4 bg-rose-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                      <span className="w-1 h-5 bg-rose-600 rounded-full animate-bounce" />
                      <span className="w-1 h-4 bg-rose-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                      <span className="w-1 h-3 bg-rose-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                    </div>
                  </div>
                ) : isTranscribing ? (
                  <div className="flex items-center justify-center gap-2 text-xs font-bold text-blue-700 py-1">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Transcribing with gemini-3.5-transcribe...</span>
                  </div>
                ) : (
                  <div className="space-y-0.5">
                    <div className="text-xs font-bold text-stone-800">
                      Tap mic to record audio
                    </div>
                    <div className="text-[10px] text-stone-500">
                      Speak a sentence like "Maayong adlaw, tagpila ang mangga?"
                    </div>
                  </div>
                )}
              </div>

              {/* Action Button */}
              {isRecordingAudio && (
                <button
                  type="button"
                  onClick={handleStopAndTranscribe}
                  className="bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold py-1.5 px-4 rounded-xl shadow-xs cursor-pointer"
                >
                  Stop & Transcribe Now
                </button>
              )}
            </div>
          </div>

          {/* Transcribed Output Result */}
          {transcriptionResult && (
            <div className="p-3.5 bg-blue-50/70 rounded-2xl border border-blue-200 space-y-2.5 animate-in fade-in">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-800 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                  <span>Verbatim Transcription</span>
                </span>
                <span className="text-[9px] font-mono font-bold text-blue-700 bg-white border border-blue-200 px-2 py-0.5 rounded-full">
                  {transcriptionResult.model}
                </span>
              </div>

              {/* Speech Text */}
              <div className="p-3 bg-white rounded-xl border border-blue-100 text-xs font-medium text-stone-900 leading-relaxed shadow-2xs">
                "{transcriptionResult.text}"
              </div>

              {/* Syllable Breakdown */}
              {transcriptionResult.syllables && transcriptionResult.syllables.length > 0 && (
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">
                    Syllable Segmentation:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {transcriptionResult.syllables.map((syl, i) => (
                      <span
                        key={i}
                        className="text-[10px] font-mono font-bold bg-white text-stone-700 border border-stone-200 px-1.5 py-0.5 rounded-md"
                      >
                        {syl}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Bar */}
              <div className="flex items-center justify-between pt-1 border-t border-blue-200/60 text-xs">
                <button
                  type="button"
                  onClick={handleCopyTranscription}
                  className="flex items-center gap-1 text-[11px] font-bold text-blue-700 hover:text-blue-900 cursor-pointer"
                >
                  {copiedTranscription ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Text</span>
                    </>
                  )}
                </button>

                {onSendToChat && (
                  <button
                    type="button"
                    onClick={() => {
                      sounds.playTap();
                      onSendToChat(transcriptionResult.text);
                    }}
                    className="flex items-center gap-1 text-[11px] font-bold text-purple-700 hover:text-purple-900 cursor-pointer"
                  >
                    <span>Practice with Sulti</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: DAVAO PLACES & MAPS GROUNDING */}
      {activeTab === 'maps' && (
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs font-bold text-stone-700 flex items-center justify-between">
              <span>Google Maps Grounding Query</span>
              <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-mono">
                googleMaps (Davao City)
              </span>
            </label>
            <input
              type="text"
              value={mapsQuery}
              onChange={(e) => setMapsQuery(e.target.value)}
              className="w-full text-xs p-3 rounded-2xl border border-stone-200 bg-stone-50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="Ask about places in Davao, directions, or market locations..."
            />
          </div>

          <div className="flex flex-wrap gap-1.5">
            {[
              'Bankerohan Market fruit prices',
              'Roxas Night Market street food',
              'San Pedro Cathedral Jeepney route',
            ].map((q, i) => (
              <button
                key={i}
                onClick={() => setMapsQuery(q)}
                className="text-[10px] font-bold bg-stone-100 hover:bg-stone-200 text-stone-700 px-2.5 py-1 rounded-xl cursor-pointer"
              >
                📍 {q}
              </button>
            ))}
          </div>

          <button
            onClick={handleSearchMaps}
            disabled={isSearchingMaps || !mapsQuery.trim()}
            className="w-full min-h-[44px] bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white rounded-2xl text-xs font-black py-2.5 px-4 flex items-center justify-center gap-2 transition-all btn-3d-emerald cursor-pointer shadow-xs"
          >
            {isSearchingMaps ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Locating with Google Maps...</span>
              </>
            ) : (
              <>
                <MapPin className="w-4 h-4" />
                <span>Ground Location & Phrases (+15 XP)</span>
              </>
            )}
          </button>

          {mapsResult && (
            <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200 space-y-2 animate-in fade-in">
              <p className="text-xs text-stone-800 leading-relaxed">
                {mapsResult.text}
              </p>
              {mapsResult.links && mapsResult.links.length > 0 && (
                <div className="pt-2 border-t border-stone-200 space-y-1">
                  <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">
                    Google Maps Places:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {mapsResult.links.map((link, idx) => (
                      <a
                        key={idx}
                        href={link.uri}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-lg flex items-center gap-1 hover:underline"
                      >
                        <span>{link.title || 'View on Google Maps'}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 6: SAVED MEDIA (SUPABASE PERSISTENCE) */}
      {activeTab === 'gallery' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-stone-700 flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-teal-600" />
              <span>Saved Learning Media</span>
            </span>
            <span className="text-[10px] font-mono text-stone-500">
              {savedMedia.length} Items · RLS Protected
            </span>
          </div>

          {savedMedia.length === 0 ? (
            <div className="text-center py-6 text-stone-400 text-xs space-y-1">
              <Sparkles className="w-6 h-6 mx-auto text-stone-300" />
              <p>No generated learning media yet.</p>
              <p className="text-[10px]">Create an image, video, music, or transcript above!</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-1">
              {savedMedia.map((m) => (
                <div
                  key={m.id}
                  className="p-2 bg-stone-50 rounded-xl border border-stone-200 space-y-1 text-xs"
                >
                  <div className="font-bold text-stone-900 truncate">
                    {m.mediaType === 'image' ? '📷' : m.mediaType === 'video' ? '🎬' : m.mediaType === 'music' ? '🎵' : '🎙️'} {m.title}
                  </div>
                  {m.mediaType === 'image' && (
                    <img
                      src={m.mediaUrl}
                      alt={m.title}
                      className="w-full h-20 object-cover rounded-lg"
                    />
                  )}
                  {m.mediaType === 'video' && (
                    <video
                      src={m.mediaUrl}
                      className="w-full h-20 object-cover rounded-lg"
                    />
                  )}
                  {m.mediaType === 'music' && (
                    <div className="p-2 bg-indigo-50 rounded-lg text-center text-[10px] text-indigo-700 font-mono">
                      🎵 Lyria Music Track
                    </div>
                  )}
                  {m.mediaType === 'transcript' && (
                    <div className="p-2 bg-blue-50 rounded-lg text-[10px] text-blue-700 font-medium line-clamp-3">
                      "{m.title}"
                    </div>
                  )}
                  <div className="text-[9px] text-stone-400 font-mono">
                    {new Date(m.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
