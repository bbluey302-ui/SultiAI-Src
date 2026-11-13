// Web Speech API and Audio synthesis utilities for Bisaya speech practice
// Uses ElevenLabs TTS server-side for natural-sounding audio, falls back to Web Speech API
export async function speakBisaya(text: string, rate: number = 0.88): Promise<void> {
  // Try ElevenLabs TTS first for natural-sounding audio
  try {
    const res = await fetch('/api/sulti/tts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        agentId: 'jen',
        language: 'english',
      }),
    });
    if (!res.ok) throw new Error('ElevenLabs TTS failed');
    const blob = await res.blob();
    // Create a temporary audio URL and play it
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    audio.onended = () => {
      URL.revokeObjectURL(url);
    };
    audio.onerror = () => {
      URL.revokeObjectURL(url);
    };
    audio.play();
    return;
  } catch (e) {
    console.warn('ElevenLabs TTS failed, falling back to Web Speech API:', e);
  }

  // Fall back to Web Speech API
  if (!('speechSynthesis' in window)) {
    console.warn('Speech synthesis not supported in this browser');
    return;
  }

  window.speechSynthesis.cancel(); // Cancel any ongoing speech

  const utterance = new SpeechSynthesisUtterance(text);
  // Find Filipino / Asian / English voices
  const voices = window.speechSynthesis.getVoices();
  const preferredVoice = voices.find(v =>
    v.lang.includes('fil') ||
    v.lang.includes('tl') ||
    v.lang.includes('id') ||
    v.lang.includes('ms') ||
    v.lang.includes('en-PH')
  ) || voices.find(v => v.lang.includes('en-US')) || voices[0];

  if (preferredVoice) {
    utterance.voice = preferredVoice;
  }

  utterance.rate = rate; // Support normal or slower audio for learners
  utterance.pitch = 1.0;

  // Speak and wait for completion
  return new Promise<void>((resolve) => {
    utterance.onend = () => resolve();
    utterance.onerror = () => resolve();
    window.speechSynthesis.speak(utterance);
  });
}

// Browser speech recognition interface
export interface SpeechRecognitionResult {
  transcript: string;
  confidence: number;
}

// MediaRecorder Audio Recorder for Whisper / Gemini Audio transcription
export interface AudioRecorderController {
  stop: () => Promise<{ base64Audio: string; mimeType: string }>;
  cancel: () => void;
}

export async function startAudioRecording(): Promise<AudioRecorderController | null> {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    console.warn('getUserMedia not supported in this environment');
    return null;
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mimeType = MediaRecorder.isTypeSupported('audio/webm')
      ? 'audio/webm'
      : (MediaRecorder.isTypeSupported('audio/mp4') ? 'audio/mp4' : 'audio/ogg');

    const mediaRecorder = new MediaRecorder(stream, { mimeType });
    const chunks: Blob[] = [];

    mediaRecorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        chunks.push(e.data);
      }
    };

    mediaRecorder.start(100);

    return {
      stop: () => {
        return new Promise<{ base64Audio: string; mimeType: string }>((resolve) => {
          mediaRecorder.onstop = () => {
            // Stop all audio tracks
            stream.getTracks().forEach((track) => track.stop());
            const blob = new Blob(chunks, { type: mimeType });
            const reader = new FileReader();
            reader.onloadend = () => {
              const dataUrl = reader.result as string;
              const base64Audio = dataUrl.split(',')[1] || '';
              resolve({ base64Audio, mimeType });
            };
            reader.readAsDataURL(blob);
          };
          mediaRecorder.stop();
        });
      },
      cancel: () => {
        try {
          stream.getTracks().forEach((track) => track.stop());
          if (mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
          }
        } catch {
          // ignore
        }
      },
    };
  } catch (err) {
    console.warn('Failed to start microphone stream:', err);
    return null;
  }
}

/** Reusable microphone recorder for turn-taking voice conversations.
 * One `getUserMedia` stream is opened for the whole session and a new
 * MediaRecorder is started per learner turn, so the browser does not show a new
 * permission prompt / mic hand-off on every turn. The live `getLevel()` reading
 * (RMS of the time-domain signal) drives client-side voice activity detection.
 */
export interface VoiceLoopRecorder {
  startTurn: () => boolean;
  stopTurn: () => Promise<{ base64Audio: string; mimeType: string } | null>;
  getLevel: () => number;
  dispose: () => void;
}

export async function createVoiceLoopRecorder(): Promise<VoiceLoopRecorder | null> {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    console.warn('getUserMedia not supported in this environment');
    return null;
  }

  let stream: MediaStream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });
  } catch (err) {
    console.warn('Microphone access failed:', err);
    return null;
  }

  const supportsType = (type: string): boolean => {
    try {
      return (
        typeof MediaRecorder !== 'undefined' &&
        typeof MediaRecorder.isTypeSupported === 'function' &&
        MediaRecorder.isTypeSupported(type)
      );
    } catch {
      return false;
    }
  };

  const mimeType = supportsType('audio/webm;codecs=opus')
    ? 'audio/webm;codecs=opus'
    : supportsType('audio/webm')
      ? 'audio/webm'
      : supportsType('audio/mp4')
        ? 'audio/mp4'
        : '';

  // Optional level metering. If Web Audio is unavailable the conversation still
  // works; the caller falls back to tap-to-finish.
  let audioCtx: AudioContext | null = null;
  let analyser: AnalyserNode | null = null;
  let timeData: Uint8Array<ArrayBuffer> | null = null;
  try {
    const AudioCtxCtor: typeof AudioContext | undefined = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (AudioCtxCtor) {
      audioCtx = new AudioCtxCtor();
      const source = audioCtx.createMediaStreamSource(stream);
      analyser = audioCtx.createAnalyser();
      analyser.fftSize = 1024;
      source.connect(analyser);
      timeData = new Uint8Array(new ArrayBuffer(analyser.fftSize));
      if (audioCtx.state === 'suspended') void audioCtx.resume().catch(() => undefined);
    }
  } catch {
    analyser = null;
    timeData = null;
  }

  let recorder: MediaRecorder | null = null;
  let chunks: Blob[] = [];

  const getLevel = (): number => {
    if (!analyser || !timeData) return 0;
    try {
      analyser.getByteTimeDomainData(timeData);
      let sum = 0;
      for (let i = 0; i < timeData.length; i += 1) {
        const v = (timeData[i] - 128) / 128;
        sum += v * v;
      }
      return Math.sqrt(sum / timeData.length);
    } catch {
      return 0;
    }
  };

  const startTurn = (): boolean => {
    if (recorder) {
      if (recorder.state === 'inactive') {
        recorder = null;
      } else {
        return true;
      }
    }
    if (typeof MediaRecorder === 'undefined') return false;
    try {
      chunks = [];
      recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) chunks.push(event.data);
      };
      recorder.start(150);
      return true;
    } catch (err) {
      console.warn('Could not start recorder:', err);
      recorder = null;
      return false;
    }
  };

  const stopTurn = (): Promise<{ base64Audio: string; mimeType: string } | null> => {
    const current = recorder;
    if (!current) return Promise.resolve(null);

    return new Promise((resolve) => {
      const finish = () => {
        recorder = null;
        const captured = chunks;
        chunks = [];
        if (!captured.length) {
          resolve(null);
          return;
        }
        const blob = new Blob(captured, { type: current.mimeType || mimeType || 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          const dataUrl = typeof reader.result === 'string' ? reader.result : '';
          const base64Audio = dataUrl.includes(',') ? dataUrl.split(',')[1] : '';
          resolve(
            base64Audio
              ? { base64Audio, mimeType: current.mimeType || mimeType || 'audio/webm' }
              : null
          );
        };
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(blob);
      };

      current.onstop = finish;
      try {
        current.stop();
      } catch {
        finish();
      }
    });
  };

  const dispose = () => {
    try {
      if (recorder && recorder.state !== 'inactive') recorder.stop();
    } catch {
      // ignore
    }
    recorder = null;
    chunks = [];
    stream.getTracks().forEach((track) => track.stop());
    if (audioCtx) {
      try {
        void audioCtx.close();
      } catch {
        // ignore
      }
    }
    analyser = null;
    timeData = null;
  };

  return { startTurn, stopTurn, getLevel, dispose };
}

export function startSpeechRecognition(
  onResult: (result: string) => void,
  onError: (err: string) => void,
  onEnd: () => void
): { stop: () => void } | null {
  const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

  if (!SpeechRecognition) {
    onError('Speech recognition is not supported in this browser. You can type or tap the quick phrases.');
    return null;
  }

  try {
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'fil-PH'; // Closest native phoneme model for Philippine languages

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      onResult(transcript);
    };

    recognition.onerror = (event: any) => {
      onError(event.error || 'Speech capture failed');
    };

    recognition.onend = () => {
      onEnd();
    };

    recognition.start();

    return {
      stop: () => {
        try {
          recognition.stop();
        } catch {
          // ignore
        }
      },
    };
  } catch (err: any) {
    onError(err.message || 'Microphone access denied');
    return null;
  }
}