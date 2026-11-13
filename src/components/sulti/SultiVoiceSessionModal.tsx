import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  Volume2,
  Clock,
  PhoneOff,
  Sparkles,
  ArrowRight,
  Trophy,
  BookOpen,
  Loader2,
  Send,
  AlertTriangle,
  Check,
  RotateCcw,
  Pencil,
} from 'lucide-react';
import { AiCoachId, AiVoiceSession, MajorAiLanguage } from '../../types/aiHub';
import { resolveCoach } from '../../services/customAgentsService';
import { getAiPreferences } from '../../services/aiPreferences';
import {
  speakBisaya,
  createVoiceLoopRecorder,
  VoiceLoopRecorder,
} from '../../utils/audio';
import { sounds } from '../../utils/soundEffects';
import confetti from 'canvas-confetti';

interface SultiVoiceSessionModalProps {
  /** Real Supabase user id the session belongs to */
  userId?: string;
  /** Supabase JWT for metered ElevenLabs STT/TTS calls */
  authToken?: string;
  coachId: AiCoachId;
  targetLanguage: MajorAiLanguage;
  scenarioTitle: string;
  difficulty?: 'Beginner' | 'Intermediate' | 'Advanced';
  onClose: () => void;
  onSaveSession: (sessionData: Omit<AiVoiceSession, 'id'>) => Promise<void>;
  onAwardXp?: (xp: number) => void;
  /** Fired when the wallet is empty so the parent can open the token store. */
  onInsufficientTokens?: () => void;
}

type Turn = {
  speaker: 'coach' | 'user';
  text: string;
  /** English translation shown (and optionally spoken) after the target line. */
  translation?: string;
  /** Key target-language words with English meanings. */
  vocab?: { term: string; meaning: string }[];
  /** NLP intent attached to a learner turn for transparency. */
  intent?: string;
  intentConfidence?: number;
  detectedLanguage?: string;
};
type Phase = 'connecting' | 'listening' | 'confirm' | 'thinking' | 'speaking' | 'ended';
type EndReason = 'user' | 'timeout' | 'tokens' | 'auth';

interface CoachReply {
  text: string;
  translation?: string;
  vocab?: { term: string; meaning: string }[];
  analysis?: { intent: string; confidence: number; language?: string };
}

const INTENT_LABELS: Record<string, string> = {
  greeting_inquiry: 'greeting',
  fare_navigation_jeepney: 'jeepney fare',
  price_bargaining: 'price & bargaining',
  courtesy_gratitude: 'courtesy & thanks',
  directional_inquiry: 'asking directions',
  food_ordering: 'food & ordering',
  pedagogical_clarification: 'language question',
  casual_social: 'casual chat',
};

interface VoiceSessionPayload {
  speechScore?: number;
  durationSeconds?: number;
  wordsSpoken?: number;
  earnedXp?: number;
  summary?: string;
  feedback?: string[];
  recommendations?: string[];
}

/** RMS threshold (0..1) above which a frame is treated as learner speech. */
const VOICE_THRESHOLD = 0.02;
/** How long the learner must pause before their turn is submitted. */
const SILENCE_MS = 1000;
/** If nothing is said for this long, hand the turn back to the coach. */
const NO_SPEECH_MS = 9000;
/** Hard cap on a single learner turn. */
const MAX_TURN_MS = 20000;
/** Shortest audio clip worth sending to speech-to-text. */
const MIN_CLIP_CHARS = 600;

const NUDGE_LINES = [
  'Wala ko kadungog nimo. Palihog isulti pag-usab, hinay-hinay lang.',
  'Sige, andam ko maminaw. Isulti ang imong tubag.',
  'Kumusta? Pagsulti lang og bisan mubo nga sentence, maminaw ko.',
];

const FALLBACK_LINES = [
  'Maayo! Padayon ta. Unsay sunod nimong gusto isulti?',
  'Sige, sabta ko. Puyde nimo isulti pag-usab sa laing paagi?',
  'Nindot kaayo! Hatagi ko og laing detalye mahitungod niana.',
  'Salamat sa pagpaambit. Unsa may imong gibati bahin niini?',
];

const coachFirstName = (name: string) => name.replace('Sulti AI ', '');

/** Strip Markdown and emoji so text-to-speech reads clean language. */
function sanitizeForSpeech(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[#*_>`~|]/g, ' ')
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 700);
}

export const SultiVoiceSessionModal: React.FC<SultiVoiceSessionModalProps> = ({
  userId,
  authToken,
  coachId,
  targetLanguage,
  scenarioTitle,
  difficulty = 'Beginner',
  onClose,
  onSaveSession,
  onAwardXp,
  onInsufficientTokens,
}) => {
  const coach = resolveCoach(coachId);
  const shortName = coachFirstName(coach.name);
  /** Custom bots borrow one of the five built-in ElevenLabs voices. */
  const voiceAgentId = coach.voiceAgentId || coachId;
  const MAX_FREE_SECONDS = 120; // 2 minutes strict limit

  const [secondsRemaining, setSecondsRemaining] = useState<number>(MAX_FREE_SECONDS);
  const [sessionActive, setSessionActive] = useState<boolean>(true);
  const [coachSpeaking, setCoachSpeaking] = useState<boolean>(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'ended'>(
    'connecting'
  );
  const [phase, setPhase] = useState<Phase>('connecting');
  const [statusText, setStatusText] = useState<string>('Connecting to your coach…');
  const [dialogueTurns, setDialogueTurns] = useState<Turn[]>([]);
  const [micLevel, setMicLevel] = useState<number>(0);
  const [micError, setMicError] = useState<string | null>(null);
  const [textFallback, setTextFallback] = useState<boolean>(false);
  const [offlineMode, setOfflineMode] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [textInput, setTextInput] = useState<string>('');
  const [pendingTurn, setPendingTurn] = useState<string | null>(null);
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [sessionSummary, setSessionSummary] = useState<{
    speechScore: number;
    durationSeconds: number;
    wordsSpoken: number;
    earnedXp: number;
    summary: string;
    feedback: string[];
    recommendations: string[];
  } | null>(null);

  const timerRef = useRef<any>(null);
  const vadTimerRef = useRef<any>(null);
  const secondsRef = useRef<number>(MAX_FREE_SECONDS);
  const turnsRef = useRef<Turn[]>([]);
  const sessionActiveRef = useRef<boolean>(true);
  const hasSavedRef = useRef<boolean>(false);
  const turnIdRef = useRef<number>(0);
  const generationRef = useRef<number>(0);
  const loopRef = useRef<VoiceLoopRecorder | null>(null);
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement | null>(null);
  const fallbackLineRef = useRef<number>(0);
  const emptyTurnsRef = useRef<number>(0);
  const micErrorRef = useRef<string | null>(null);
  const pendingTurnRef = useRef<string | null>(null);

  /** Auth + content headers for the metered voice endpoints. */
  const apiHeaders = (): Record<string, string> => ({
    'Content-Type': 'application/json',
    ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
  });

  const isCurrent = (generation: number) =>
    generationRef.current === generation && sessionActiveRef.current;

  const pushTurn = (speaker: 'coach' | 'user', text: string, extras?: Omit<Turn, 'speaker' | 'text'>) => {
    const clean = text.trim();
    if (!clean) return;
    const next = [...turnsRef.current, { speaker, text: clean, ...extras }];
    // Keep the rendered thread light; history sent to the model is capped later.
    turnsRef.current = next.slice(-30);
    setDialogueTurns(turnsRef.current);
  };

  const stopPlayback = () => {
    const audio = audioElRef.current;
    if (audio) {
      try {
        audio.pause();
        audio.src = '';
      } catch {
        // ignore
      }
      audioElRef.current = null;
    }
    try {
      window.speechSynthesis?.cancel();
    } catch {
      // ignore
    }
  };

  const nextFallbackLine = () => {
    const line = FALLBACK_LINES[fallbackLineRef.current % FALLBACK_LINES.length];
    fallbackLineRef.current += 1;
    return line;
  };

  /**
   * Speak a line with the character's ElevenLabs voice.
   * Falls back to the browser voice when the gateway is unavailable.
   */
  const speakLine = async (text: string, generation: number): Promise<void> => {
    if (!isCurrent(generation)) return;
    try {
      const response = await fetch('/api/sulti/tts', {
        method: 'POST',
        headers: apiHeaders(),
        body: JSON.stringify({ text, agentId: voiceAgentId, language: targetLanguage }),
      });

      if (response.status === 402) {
        onInsufficientTokens?.();
        setErrorMessage('You ran out of AI tokens, so the coach cannot speak.');
        void endSession('tokens');
        return;
      }
      if (response.status === 401) {
        setErrorMessage('Your session expired. Please sign in again.');
        void endSession('auth');
        return;
      }
      if (!response.ok) throw new Error(`TTS failed with ${response.status}`);

      const blob = await response.blob();
      if (!isCurrent(generation)) return;
      const url = URL.createObjectURL(blob);
      await new Promise<void>((resolve) => {
        const audio = new Audio(url);
        audioElRef.current = audio;
        const done = () => {
          URL.revokeObjectURL(url);
          if (audioElRef.current === audio) audioElRef.current = null;
          resolve();
        };
        audio.onended = done;
        audio.onerror = done;
        void audio.play().catch(done);
      });
    } catch {
      if (!isCurrent(generation)) return;
      // Browser speech can also hang, so cap it.
      await Promise.race([speakBisaya(text, 0.9), new Promise((r) => setTimeout(r, 20_000))]);
    }
  };

  const transcribeClip = async (
    clip: { base64Audio: string; mimeType: string },
    generation: number
  ): Promise<string> => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25_000);
    try {
      const response = await fetch('/api/sulti/stt', {
        method: 'POST',
        headers: apiHeaders(),
        signal: controller.signal,
        body: JSON.stringify({
          audioBase64: clip.base64Audio,
          mimeType: clip.mimeType,
          language: targetLanguage,
          agentId: voiceAgentId,
        }),
      });

      if (response.status === 402) {
        onInsufficientTokens?.();
        setErrorMessage('You ran out of AI tokens, so speech recognition stopped.');
        void endSession('tokens');
        return '';
      }
      if (response.status === 401) {
        setErrorMessage('Your session expired. Please sign in again.');
        void endSession('auth');
        return '';
      }
      if (!response.ok) return '';

      const data = await response.json();
      if (!isCurrent(generation)) return '';
      return typeof data?.text === 'string' ? data.text.trim() : '';
    } catch {
      return '';
    } finally {
      clearTimeout(timeout);
    }
  };

  const requestReply = async (
    message: string,
    generation: number
  ): Promise<CoachReply | null> => {
    // Only the last few turns are relevant for a 2-minute drill. The current
    // learner turn is sent as `message`, so leave it out of the history.
    const turns = turnsRef.current;
    const last = turns[turns.length - 1];
    const historyTurns =
      last && last.speaker === 'user' && last.text === message ? turns.slice(0, -1) : turns;
    const history = historyTurns.slice(-8).map((turn) => ({
      role: turn.speaker === 'coach' ? 'assistant' : 'user',
      content: turn.text,
    }));

    try {
      const response = await fetch('/api/sulti/chat', {
        method: 'POST',
        headers: apiHeaders(),
        body: JSON.stringify({
          message,
          history,
          scenario: scenarioTitle,
          agentId: coach.id,
          agentName: coach.isCustom ? coach.name : undefined,
          agentPersona: coach.isCustom ? coach.systemPromptIntro : undefined,
          targetLanguage,
          userLevel: difficulty,
          targetDialect: 'davao_bisaya',
        }),
      });

      if (response.status === 402) {
        onInsufficientTokens?.();
        setErrorMessage('You ran out of AI tokens, so the coach cannot reply.');
        void endSession('tokens');
        return null;
      }
      if (response.status === 401) {
        setErrorMessage('Your session expired. Please sign in again.');
        void endSession('auth');
        return null;
      }
      if (response.status === 429) {
        setOfflineMode(true);
        return { text: nextFallbackLine() };
      }
      if (!response.ok) throw new Error(`Chat failed with ${response.status}`);

      const data = await response.json();
      if (!isCurrent(generation)) return null;

      const raw =
        typeof data?.replyBisaya === 'string' && data.replyBisaya.trim()
          ? data.replyBisaya
          : typeof data?.content === 'string'
            ? data.content
            : '';
      const text = sanitizeForSpeech(raw) || nextFallbackLine();
      const translation =
        typeof data?.replyEnglish === 'string' ? sanitizeForSpeech(data.replyEnglish) : '';

      const vocab = Array.isArray(data?.breakdown)
        ? data.breakdown
            .slice(0, 4)
            .map((item: any) => ({
              term:
                typeof item?.bisaya === 'string'
                  ? item.bisaya
                  : typeof item?.term === 'string'
                    ? item.term
                    : '',
              meaning:
                typeof item?.english === 'string'
                  ? item.english
                  : typeof item?.meaning === 'string'
                    ? item.meaning
                    : '',
            }))
            .filter((item: { term: string; meaning: string }) => item.term && item.meaning)
        : [];

      const analysis =
        data?.bertAnalysis && typeof data.bertAnalysis.predictedIntent === 'string'
          ? {
              intent: String(data.bertAnalysis.predictedIntent),
              confidence:
                typeof data.bertAnalysis.intentConfidence === 'number'
                  ? data.bertAnalysis.intentConfidence
                  : 0,
              language:
                typeof data.bertAnalysis.detectedLanguage === 'string'
                  ? data.bertAnalysis.detectedLanguage
                  : undefined,
            }
          : undefined;

      // The API answered without usable text: never leave the learner in silence.
      return {
        text,
        translation: translation || undefined,
        vocab: vocab.length > 0 ? vocab : undefined,
        analysis,
      };
    } catch {
      if (!isCurrent(generation)) return null;
      setOfflineMode(true);
      return { text: nextFallbackLine() };
    }
  };

  function beginListening(generation: number) {
    if (!isCurrent(generation)) return;

    if (micErrorRef.current) {
      setPhase('listening');
      setStatusText('Microphone unavailable — type your reply');
      setCoachSpeaking(false);
      return;
    }

    const loop = loopRef.current;
    // The microphone is still being acquired; the bootstrap path calls
    // beginListening again as soon as the recorder is ready.
    if (!loop) return;

    const turnId = turnIdRef.current + 1;
    turnIdRef.current = turnId;

    if (!loop.startTurn()) {
      micErrorRef.current = 'The microphone could not start recording.';
      setMicError(micErrorRef.current);
      return;
    }

    setPhase('listening');
    setStatusText('Your turn — speak now');
    setMicLevel(0);

    const startedAt = Date.now();
    // Ignore the first few frames so speaker reverb from the coach's line does
    // not get mistaken for the learner starting to talk. Those frames also set
    // a noise floor so a quiet mic still registers speech.
    const settleUntil = startedAt + 300;
    let noisePeak = 0;
    let heardSpeech = false;
    let lastVoiceAt = 0;

    if (vadTimerRef.current) clearInterval(vadTimerRef.current);
    vadTimerRef.current = setInterval(() => {
      if (turnIdRef.current !== turnId || !sessionActiveRef.current) return;

      const level = loop.getLevel();
      setMicLevel(level);

      const now = Date.now();
      if (now <= settleUntil) noisePeak = Math.max(noisePeak, level);

      const threshold = Math.max(0.012, noisePeak * 2.5);
      if (now > settleUntil && level > threshold) {
        heardSpeech = true;
        lastVoiceAt = now;
      }

      const elapsed = now - startedAt;
      const silentFor = now - lastVoiceAt;

      if (heardSpeech && silentFor > SILENCE_MS) {
        void finishTurn(generation, turnId);
        return;
      }
      if (!heardSpeech && elapsed > NO_SPEECH_MS) {
        void finishTurn(generation, turnId);
        return;
      }
      if (elapsed > MAX_TURN_MS) {
        void finishTurn(generation, turnId);
      }
    }, 100);
  }

  async function speakAndResume(
    text: string,
    generation: number,
    extras?: { translation?: string; vocab?: { term: string; meaning: string }[] }
  ) {
    if (!isCurrent(generation)) return;
    const bilingual = getAiPreferences().bilingualReplies;
    pushTurn(
      'coach',
      text,
      bilingual && (extras?.translation || extras?.vocab)
        ? { translation: extras?.translation, vocab: extras?.vocab }
        : undefined
    );

    setPhase('speaking');
    setStatusText(`${shortName} is speaking…`);
    setCoachSpeaking(true);
    try {
      await speakLine(text, generation);
      // Follow the target-language line with its English translation so a
      // beginner always understands what the coach just said.
      if (
        bilingual &&
        extras?.translation &&
        targetLanguage !== 'english' &&
        isCurrent(generation)
      ) {
        await speakLine(`In English: ${extras.translation}`, generation);
      }
    } finally {
      if (isCurrent(generation)) setCoachSpeaking(false);
    }
    if (!isCurrent(generation)) return;
    beginListening(generation);
  }

  async function finishTurn(generation: number, turnId: number) {
    if (turnIdRef.current !== turnId || !sessionActiveRef.current) return;
    turnIdRef.current = turnId + 1;

    if (vadTimerRef.current) {
      clearInterval(vadTimerRef.current);
      vadTimerRef.current = null;
    }

    const loop = loopRef.current;
    setMicLevel(0);
    setPhase('thinking');
    setStatusText('Transcribing your turn…');

    const clip = loop ? await loop.stopTurn() : null;
    if (!isCurrent(generation)) return;

    let learnerText = '';
    if (clip && clip.base64Audio.length > MIN_CLIP_CHARS) {
      learnerText = await transcribeClip(clip, generation);
    }
    if (!isCurrent(generation)) return;

    learnerText = learnerText.trim();
    if (!learnerText) {
      emptyTurnsRef.current += 1;
      if (emptyTurnsRef.current === 1) {
        // Ask once out loud, then keep the loop cheap and silent.
        const nudge = NUDGE_LINES[turnIdRef.current % NUDGE_LINES.length];
        await speakAndResume(nudge, generation);
        return;
      }
      setTextFallback(true);
      setStatusText('Still listening — speak again or type your reply');
      setPhase('listening');
      setCoachSpeaking(false);
      beginListening(generation);
      return;
    }

    emptyTurnsRef.current = 0;
    setTextFallback(false);

    // Settings → "Confirm before sending": show the transcript first.
    if (getAiPreferences().voiceReplyMode === 'confirm') {
      pendingTurnRef.current = learnerText;
      setPendingTurn(learnerText);
      setPhase('confirm');
      setStatusText('Confirm what was heard');
      setCoachSpeaking(false);
      return;
    }

    await respondToTurn(learnerText, generation);
  }

  async function respondToTurn(learnerText: string, generation: number) {
    if (!isCurrent(generation)) return;
    pushTurn('user', learnerText);
    setPhase('thinking');
    setStatusText(`${shortName} is thinking…`);

    const reply = await requestReply(learnerText, generation);
    if (reply === null || !isCurrent(generation)) return;

    if (reply.analysis) annotateLastUserTurn(reply.analysis);

    await speakAndResume(reply.text, generation, reply);
  }

  const annotateLastUserTurn = (analysis: {
    intent: string;
    confidence: number;
    language?: string;
  }) => {
    const next = [...turnsRef.current];
    for (let index = next.length - 1; index >= 0; index -= 1) {
      const turn = next[index];
      if (turn.speaker !== 'user') continue;
      if (turn.intent) return;
      next[index] = {
        ...turn,
        intent: analysis.intent,
        intentConfidence: analysis.confidence,
        detectedLanguage: analysis.language,
      };
      turnsRef.current = next;
      setDialogueTurns(next);
      return;
    }
  };

  const submitTypedReply = async () => {
    const text = textInput.trim();
    if (!text || !sessionActiveRef.current) return;
    const generation = generationRef.current;
    setTextInput('');

    if (vadTimerRef.current) {
      clearInterval(vadTimerRef.current);
      vadTimerRef.current = null;
    }
    turnIdRef.current += 1;
    emptyTurnsRef.current = 0;
    if (loopRef.current) {
      // Drop whatever the mic captured; the typed reply wins this turn.
      void loopRef.current.stopTurn();
    }

    await respondToTurn(text, generation);
  };

  const confirmPendingTurn = async () => {
    const text = pendingTurnRef.current;
    if (!text || !sessionActiveRef.current) return;
    sounds.playTap();
    pendingTurnRef.current = null;
    setPendingTurn(null);
    await respondToTurn(text, generationRef.current);
  };

  const retryPendingTurn = () => {
    sounds.playTap();
    pendingTurnRef.current = null;
    setPendingTurn(null);
    setStatusText('Your turn — speak now');
    beginListening(generationRef.current);
  };

  const editPendingTurn = () => {
    sounds.playTap();
    const text = pendingTurnRef.current;
    pendingTurnRef.current = null;
    setPendingTurn(null);
    setTextInput(text || '');
    setTextFallback(true);
    setPhase('confirm');
    setStatusText('Edit your reply, then send');
  };

  async function endSession(reason: EndReason = 'user') {
    if (hasSavedRef.current) return;
    hasSavedRef.current = true;
    sessionActiveRef.current = false;
    turnIdRef.current += 1;

    if (timerRef.current) clearInterval(timerRef.current);
    if (vadTimerRef.current) clearInterval(vadTimerRef.current);
    timerRef.current = null;
    vadTimerRef.current = null;

    stopPlayback();
    loopRef.current?.dispose();
    loopRef.current = null;

    setSessionActive(false);
    setConnectionStatus('ended');
    setPhase('ended');
    setCoachSpeaking(false);
    setMicLevel(0);
    sounds.playTap();
    setIsEvaluating(true);

    const elapsedSeconds = Math.min(
      MAX_FREE_SECONDS,
      Math.max(0, MAX_FREE_SECONDS - secondsRef.current)
    );

    // Grade only the learner's own words so the score is not inflated by the
    // coach's scripted turns.
    const learnerTranscript = turnsRef.current
      .filter((turn) => turn.speaker === 'user')
      .map((turn) => turn.text)
      .concat(pendingTurnRef.current ? [pendingTurnRef.current] : [])
      .join(' ')
      .trim();

    try {
      const res = await fetch('/api/sulti/voice-session/complete', {
        method: 'POST',
        headers: apiHeaders(),
        body: JSON.stringify({
          userId,
          agentId: coach.id,
          targetLanguage,
          durationSeconds: elapsedSeconds,
          transcript: learnerTranscript,
          scenarioTitle,
        }),
      });

      if (res.status === 402) {
        onInsufficientTokens?.();
        setSessionSummary({
          speechScore: 0,
          durationSeconds: elapsedSeconds,
          wordsSpoken: 0,
          earnedXp: 0,
          summary: 'You ran out of AI tokens before this session could be scored.',
          feedback: ['Top up your tokens, then try the voice session again.'],
          recommendations: ['Open AI Tokens from the dashboard header to add more.'],
        });
        return;
      }

      if (res.status === 401) {
        setErrorMessage('Your session expired. Please sign in again.');
      }

      const data = (await res.json().catch(() => ({}))) as VoiceSessionPayload;

      setSessionSummary({
        speechScore: data.speechScore ?? 0,
        durationSeconds: data.durationSeconds ?? elapsedSeconds,
        wordsSpoken: data.wordsSpoken ?? learnerTranscript.split(/\s+/).filter(Boolean).length,
        earnedXp: data.earnedXp ?? 0,
        summary:
          data.summary ||
          `${reason === 'timeout' ? 'Time is up!' : 'Session complete.'} Great effort speaking with ${coach.name}!`,
        feedback: data.feedback || ['Keep practising out loud — every turn builds fluency.'],
        recommendations:
          data.recommendations || ['Try the same scenario again and add one longer sentence.'],
      });

      await onSaveSession({
        // Empty string = not signed in; aiHubService skips remote persistence
        userId: userId || '',
        agentId: coach.id,
        targetLanguage,
        scenarioTitle,
        difficulty,
        startedAt: new Date(Date.now() - elapsedSeconds * 1000).toISOString(),
        endedAt: new Date().toISOString(),
        durationSeconds: elapsedSeconds,
        maxAllowedSeconds: MAX_FREE_SECONDS,
        status: reason === 'timeout' ? 'timeout' : 'completed',
        userTranscriptSnippet: (learnerTranscript || 'No speech captured').substring(0, 140),
        transcriptCount: turnsRef.current.filter((turn) => turn.speaker === 'user').length,
        speechScoreAverage: data.speechScore ?? 0,
        wordCount:
          data.wordsSpoken ?? learnerTranscript.split(/\s+/).filter(Boolean).length,
        xpEarned: data.earnedXp ?? 0,
        feedbackSummary: data.summary,
        corrections: data.feedback,
        recommendations: data.recommendations,
      });

      if (onAwardXp && (data.earnedXp ?? 0) > 0) {
        onAwardXp(data.earnedXp as number);
      }

      confetti({ particleCount: 40, spread: 60, origin: { y: 0.6 } });
      sounds.playCorrect();
    } catch (err) {
      console.warn('Voice session complete error:', err);
      setSessionSummary({
        speechScore: 0,
        durationSeconds: elapsedSeconds,
        wordsSpoken: learnerTranscript.split(/\s+/).filter(Boolean).length,
        earnedXp: 0,
        summary: `Session ended, but the score could not be saved. Your practice with ${coach.name} still counts!`,
        feedback: ['The scoring service was unreachable.'],
        recommendations: ['Reconnect and try another 2-minute session.'],
      });
    } finally {
      setIsEvaluating(false);
    }
  }

  // Initialize the voice session: greeting, microphone, then turn-by-turn loop.
  useEffect(() => {
    const generation = generationRef.current + 1;
    generationRef.current = generation;
    sessionActiveRef.current = true;

    sounds.playCorrect();

    // 2-minute strict countdown, started immediately.
    timerRef.current = setInterval(() => {
      const next = Math.max(0, secondsRef.current - 1);
      secondsRef.current = next;
      setSecondsRemaining(next);
      if (next <= 0) {
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = null;
        void endSession('timeout');
      }
    }, 1000);

    const connectTimer = setTimeout(async () => {
      if (!isCurrent(generation)) return;
      setConnectionStatus('connected');

      // Request the mic in parallel with the greeting so the first learner turn
      // is ready as soon as the coach stops talking.
      const micPromise = createVoiceLoopRecorder();

      await speakAndResume(coach.greetingMessage.text, generation, {
        translation: coach.greetingMessage.translation,
      });
      if (!isCurrent(generation)) {
        (await micPromise)?.dispose();
        return;
      }

      const loop = await micPromise;
      if (!isCurrent(generation)) {
        loop?.dispose();
        return;
      }
      if (!loop) {
        micErrorRef.current =
          'Microphone access was blocked. Allow the mic, or type your reply below.';
        setMicError(micErrorRef.current);
        setPhase('listening');
        setStatusText('Microphone unavailable — type your reply');
        setCoachSpeaking(false);
        return;
      }

      loopRef.current = loop;
      // The greeting path already tried to listen; start a fresh turn now that
      // the recorder exists.
      beginListening(generation);
    }, 600);

    return () => {
      generationRef.current = generation + 1;
      sessionActiveRef.current = false;
      clearTimeout(connectTimer);
      if (timerRef.current) clearInterval(timerRef.current);
      if (vadTimerRef.current) clearInterval(vadTimerRef.current);
      timerRef.current = null;
      vadTimerRef.current = null;
      turnIdRef.current += 1;
      stopPlayback();
      loopRef.current?.dispose();
      loopRef.current = null;
    };
    // Session props never change while the modal is open.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep the conversation thread pinned to the newest turn.
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [dialogueTurns, phase]);

  // Format seconds into MM:SS
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
  };

  const isListening = phase === 'listening' && sessionActive;
  const isThinking = phase === 'thinking' && sessionActive;

  const waveform = [12, 28, 44, 20, 36, 48, 22, 16, 32, 40, 18].map((base, index) => {
    if (!sessionActive) return 3;
    if (!isListening) return Math.max(4, base * 0.28);
    const amp = Math.min(1, micLevel / 0.12);
    const jitter = index % 2 === 0 ? 1 : 0.82;
    return Math.max(5, Math.min(48, base * (0.28 + amp * 0.9) * jitter));
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 select-none animate-in fade-in">
      <div className="w-full max-w-md bg-[#0A121D] rounded-3xl border border-cyan-500/30 overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* ===================================================================== */}
        {/* 1. TOP STATUS BAR                                                     */}
        {/* ===================================================================== */}
        <div className="p-3.5 sm:p-4 bg-[#11222D] border-b border-white/10 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span
              className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                sessionActive ? 'bg-emerald-400 animate-ping' : 'bg-stone-500'
              }`}
            />
            <div className="min-w-0">
              <span className="block text-[10px] sm:text-[11px] font-mono font-bold text-white uppercase tracking-wider truncate">
                {sessionActive ? 'ElevenLabs Scribe' : 'Session Ended'}
              </span>
              <span className="block text-[9.5px] text-stone-400 truncate">{statusText}</span>
            </div>
          </div>

          <div
            className={`shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-2xl font-mono text-xs font-black shadow-inner ${
              secondsRemaining <= 20
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/50 animate-pulse'
                : 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span className="text-sm tabular-nums">{formatTime(secondsRemaining)}</span>
          </div>
        </div>

        {/* ===================================================================== */}
        {/* 2. MAIN ACTIVE SESSION INTERFACE (or EVALUATION SUMMARY)              */}
        {/* ===================================================================== */}
        <div className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-4 flex flex-col">
          {!sessionSummary ? (
            <>
              {/* Coach Banner */}
              <div className="text-center space-y-2">
                <div className="relative inline-block mx-auto">
                  <img
                    src={coach.avatar}
                    alt={coach.name}
                    className={`w-20 h-20 rounded-3xl object-cover border-4 mx-auto transition-transform ${
                      coachSpeaking
                        ? 'border-teal-400 scale-105 shadow-lg shadow-teal-500/30'
                        : 'border-cyan-500/40'
                    }`}
                  />
                  {coachSpeaking && (
                    <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-teal-500 text-white font-mono text-[9px] font-bold uppercase tracking-wider shadow-sm flex items-center gap-1">
                      <Volume2 className="w-3 h-3 animate-bounce" />
                      <span>Speaking</span>
                    </span>
                  )}
                  {isThinking && (
                    <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-cyan-500 text-white font-mono text-[9px] font-bold uppercase tracking-wider shadow-sm flex items-center gap-1">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span>Thinking</span>
                    </span>
                  )}
                </div>

                <div className="min-w-0 px-2">
                  <h2 className="font-display font-black text-lg sm:text-xl text-white break-words">
                    {coach.name}
                  </h2>
                  <p className="text-[11px] sm:text-xs text-cyan-400 font-medium leading-snug break-words">
                    {coach.role} ·{' '}
                    {targetLanguage === 'cebuano' ? 'Cebuano / Bisaya' : targetLanguage}
                  </p>
                  <p className="text-[11px] text-stone-400 italic pt-1 line-clamp-2 max-w-xs mx-auto">
                    Scenario: "{scenarioTitle}"
                  </p>
                </div>
              </div>

              {/* Live conversation thread */}
              <div className="p-3 rounded-2xl bg-[#11222D] border border-white/10 space-y-2 min-h-[140px] max-h-[210px] overflow-y-auto">
                {dialogueTurns.length === 0 && (
                  <p className="text-center text-[11px] text-stone-400 italic py-6">
                    Your coach is about to say hello…
                  </p>
                )}

                {dialogueTurns.map((turn, index) => (
                  <div
                    key={`${index}-${turn.speaker}`}
                    className={`flex ${turn.speaker === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-3 py-2 border ${
                        turn.speaker === 'user'
                          ? 'bg-cyan-600/25 border-cyan-500/40 text-right'
                          : 'bg-[#0A121D] border-white/10'
                      }`}
                    >
                      <div
                        className={`text-[9px] font-mono uppercase tracking-wider font-bold mb-0.5 ${
                          turn.speaker === 'user' ? 'text-cyan-300' : 'text-teal-400'
                        }`}
                      >
                        {turn.speaker === 'user' ? 'You' : shortName}
                      </div>
                      <p className="text-[12px] text-stone-100 leading-relaxed break-words">
                        {turn.text}
                      </p>

                      {turn.speaker === 'user' && turn.intent && (
                        <div className="mt-1 pt-1 border-t border-cyan-500/20 flex flex-wrap items-center justify-end gap-1 text-[8.5px] font-mono text-cyan-300/80">
                          <span className="uppercase tracking-wider font-bold">Understood</span>
                          <span>{INTENT_LABELS[turn.intent] || turn.intent.replace(/_/g, ' ')}</span>
                          {typeof turn.intentConfidence === 'number' && (
                            <span>· {Math.round(turn.intentConfidence * 100)}%</span>
                          )}
                        </div>
                      )}

                      {turn.translation && (
                        <div className="mt-1.5 pt-1.5 border-t border-white/10 text-left">
                          <span className="text-[8.5px] font-mono uppercase tracking-wider text-stone-500 font-bold">
                            English
                          </span>
                          <p className="text-[11px] text-stone-300 leading-snug break-words">
                            {turn.translation}
                          </p>
                        </div>
                      )}

                      {turn.vocab && turn.vocab.length > 0 && (
                        <div className="mt-1.5 flex flex-wrap gap-1 justify-end">
                          {turn.vocab.map((word, wordIndex) => (
                            <span
                              key={`${word.term}-${wordIndex}`}
                              className="text-[9px] px-1.5 py-0.5 rounded-md bg-teal-500/10 border border-teal-500/25 text-teal-200"
                            >
                              <strong className="font-bold">{word.term}</strong> = {word.meaning}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {isThinking && (
                  <div className="flex items-center gap-2 text-[11px] text-cyan-300 italic">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>{shortName} is thinking…</span>
                  </div>
                )}

                {isListening && (
                  <div className="flex items-center justify-end gap-1.5 text-[10.5px] text-stone-400 italic">
                    <Mic
                      className={`w-3.5 h-3.5 ${
                        micLevel > VOICE_THRESHOLD ? 'text-emerald-400' : 'text-stone-500'
                      }`}
                    />
                    <span>
                      {micLevel > VOICE_THRESHOLD ? 'I hear you — keep going…' : 'Listening…'}
                    </span>
                  </div>
                )}

                <div ref={transcriptEndRef} />
              </div>

              {/* Pulsing Audio Waveform Visualizer */}
              <div className="flex items-center justify-center gap-1.5 py-1">
                {waveform.map((h, i) => (
                  <div
                    key={i}
                    style={{ height: `${h}px` }}
                    className={`w-1.5 rounded-full transition-all duration-150 ${
                      sessionActive
                        ? isListening
                          ? 'bg-cyan-400'
                          : coachSpeaking
                            ? 'bg-teal-400'
                            : 'bg-cyan-500/40'
                        : 'bg-stone-700'
                    }`}
                  />
                ))}
              </div>

              {errorMessage && (
                <div className="flex items-start gap-2 p-2.5 rounded-2xl bg-rose-500/15 border border-rose-500/40 text-[11px] text-rose-200">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {offlineMode && !errorMessage && (
                <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[10.5px] text-amber-200 text-center">
                  AI provider is slow right now — using offline coach replies.
                </div>
              )}

              {/* Typed fallback when the microphone or speech recognition fails */}
              {(micError || textFallback) && (
                <div className="space-y-2">
                  <p className="text-[11px] text-amber-300 flex items-start gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <span>
                      {micError ||
                        'I could not understand the audio. Type your reply, or keep speaking.'}
                    </span>
                  </p>
                  <form
                    onSubmit={(event) => {
                      event.preventDefault();
                      void submitTypedReply();
                    }}
                    className="flex items-center gap-2"
                  >
                    <input
                      value={textInput}
                      onChange={(event) => setTextInput(event.target.value)}
                      placeholder="Type your reply to the coach…"
                      aria-label="Type your reply to the coach"
                      className="flex-1 min-h-[42px] px-3 rounded-2xl bg-[#11222D] border border-white/10 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-cyan-500"
                    />
                    <button
                      type="submit"
                      disabled={!textInput.trim() || isThinking || !sessionActive}
                      className="shrink-0 w-11 h-11 rounded-2xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white flex items-center justify-center cursor-pointer"
                      aria-label="Send typed reply"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                </div>
              )}

              {/* Controls */}
              <div className="pt-1 space-y-2">
                {pendingTurn && (
                  <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 space-y-2 animate-in fade-in">
                    <div className="text-[9px] font-mono uppercase tracking-wider text-cyan-300 font-bold">
                      I heard you say
                    </div>
                    <p className="text-[12px] text-white leading-snug break-words">
                      “{pendingTurn}”
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => void confirmPendingTurn()}
                        className="min-h-[38px] rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] flex items-center justify-center gap-1.5 cursor-pointer active:scale-98 transition-all"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Send to coach</span>
                      </button>
                      <button
                        onClick={retryPendingTurn}
                        className="min-h-[38px] rounded-2xl bg-[#11222D] border border-white/15 text-stone-200 font-bold text-[11px] flex items-center justify-center gap-1.5 cursor-pointer active:scale-98 transition-all"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Say again</span>
                      </button>
                    </div>
                    <button
                      onClick={editPendingTurn}
                      className="w-full min-h-[32px] rounded-xl text-[10.5px] font-bold text-stone-400 hover:text-white flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Pencil className="w-3 h-3" />
                      <span>Type a correction instead</span>
                    </button>
                  </div>
                )}

                {isListening && !micError && !pendingTurn && (
                  <button
                    onClick={() => {
                      sounds.playTap();
                      void finishTurn(generationRef.current, turnIdRef.current);
                    }}
                    className="w-full py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-display font-black text-[11px] flex items-center justify-center gap-2 cursor-pointer active:scale-98 transition-all"
                  >
                    <ArrowRight className="w-4 h-4" />
                    <span>Done speaking — send my answer</span>
                  </button>
                )}

                <button
                  onClick={() => void endSession('user')}
                  disabled={isEvaluating}
                  className="w-full py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-display font-black text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-98 transition-all disabled:opacity-60"
                >
                  <PhoneOff className="w-4 h-4" />
                  <span>Tap to End Session &amp; View Feedback</span>
                </button>
              </div>
            </>
          ) : (
            /* =================================================================== */
            /* 3. POST-SESSION SUMMARY (Speech Score, Feedback, Next Steps)        */
            /* =================================================================== */
            <div className="space-y-4 animate-in fade-in">
              <div className="text-center space-y-1">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto text-2xl shadow-inner">
                  <Trophy className="w-6 h-6 text-emerald-400" />
                </div>
                <h3 className="font-display font-black text-base text-white">Session Completed!</h3>
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#11222D] border border-white/10 max-w-full">
                  <img
                    src={coach.avatar}
                    alt={coach.name}
                    className="w-5 h-5 rounded-full object-cover shrink-0 border border-cyan-500/30"
                  />
                  <span className="text-[10.5px] font-black text-white truncate">{coach.name}</span>
                  <span className="hidden sm:inline text-[9.5px] text-stone-400 truncate">
                    {coach.role}
                  </span>
                </div>
                <p className="text-xs text-stone-300">{sessionSummary.summary}</p>
              </div>

              {/* KPI Score Cards */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-3 rounded-2xl bg-[#11222D] border border-white/10">
                  <div className="text-lg font-black text-emerald-400 font-mono">
                    {sessionSummary.speechScore}%
                  </div>
                  <div className="text-[10px] font-mono text-stone-400 uppercase">Score</div>
                </div>
                <div className="p-3 rounded-2xl bg-[#11222D] border border-white/10">
                  <div className="text-lg font-black text-cyan-400 font-mono">
                    {sessionSummary.durationSeconds}s
                  </div>
                  <div className="text-[10px] font-mono text-stone-400 uppercase">Duration</div>
                </div>
                <div className="p-3 rounded-2xl bg-[#11222D] border border-white/10">
                  <div className="text-lg font-black text-amber-400 font-mono">
                    +{sessionSummary.earnedXp}
                  </div>
                  <div className="text-[10px] font-mono text-stone-400 uppercase">XP Earned</div>
                </div>
              </div>

              {/* Key Coach Feedback */}
              <div className="p-3.5 rounded-2xl bg-[#11222D] border border-white/10 space-y-2">
                <div className="text-xs font-bold text-teal-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Coach Observations:</span>
                </div>
                <ul className="space-y-1 text-xs text-stone-200">
                  {sessionSummary.feedback.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="text-emerald-400 font-bold">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Learning Recommendations */}
              <div className="p-3.5 rounded-2xl bg-cyan-950/40 border border-cyan-800/40 space-y-2">
                <div className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Next Speaking Steps:</span>
                </div>
                <ul className="space-y-1 text-xs text-stone-300">
                  {sessionSummary.recommendations.map((rec, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="text-cyan-400 font-bold">•</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center gap-2">
                <button
                  onClick={onClose}
                  className="flex-1 py-3 rounded-2xl bg-teal-600 hover:bg-teal-500 text-white font-display font-black text-xs cursor-pointer shadow-md active:scale-95 transition-all text-center"
                >
                  Back to Voice Coaches
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
