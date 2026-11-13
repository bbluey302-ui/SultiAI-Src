import React, { useRef, useState } from 'react';
import { 
  X, Volume2, Mic, CheckCircle, AlertCircle, ArrowRight, 
  RotateCcw, Award, Heart, Sparkles, Check, Snail, AlertTriangle 
} from 'lucide-react';
import { Lesson, Activity, LessonCompletionResult } from '../types';
import { speakBisaya, startSpeechRecognition } from '../utils/audio';
import { sounds } from '../utils/soundEffects';
import { authHeaders } from '../services/tokenService';

interface LessonPlayerProps {
  lesson: Lesson;
  onClose: () => void;
  onComplete: (lessonId: string, score?: number | null) => Promise<LessonCompletionResult>;
}

export const LessonPlayer: React.FC<LessonPlayerProps> = ({
  lesson,
  onClose,
  onComplete,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [assembledWords, setAssembledWords] = useState<string[]>([]);
  const [isFlipped, setIsFlipped] = useState(false);
  const [feedback, setFeedback] = useState<{ isCorrect: boolean; message: string; solution?: string } | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [speechResult, setSpeechResult] = useState<{ text: string; wer: number; score: number } | null>(null);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [scores, setScores] = useState<number[]>([]);
  const [isFinished, setIsFinished] = useState(false);
  const [isCheckingSpeech, setIsCheckingSpeech] = useState(false);
  const [hearts, setHearts] = useState(5);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [slowAudio, setSlowAudio] = useState(false);
  const [saveState, setSaveState] = useState<{
    status: 'idle' | 'saving' | 'saved' | 'error';
    result?: LessonCompletionResult;
    error?: string;
  }>({ status: 'idle' });
  const saveInFlight = useRef(false);

  // Safely construct fallback activities if lesson.activities is undefined or empty
  const defaultFallback: Activity = {
    id: `act_${lesson?.id || 'default'}_1`,
    type: 'flashcard',
    prompt: `Core Concept: ${lesson?.title || 'Communication'}`,
    promptBisaya: lesson?.titleBisaya || lesson?.title || 'Maayong adlaw',
    phonetics: 'Natural cadence & intonation',
    explanation: lesson?.description || 'Learn and practice this essential communication concept.',
    culturalNote: 'SULTI AI companions accompany non-native and foreign learners with respectful regional phrasing.',
  };

  const fallbackActivities: Activity[] = [
    defaultFallback,
    {
      id: `act_${lesson?.id || 'default'}_2`,
      type: 'multiple_choice',
      prompt: `What is the key phrase for "${lesson?.title || 'this lesson'}"?`,
      options: [
        lesson?.titleBisaya || 'Maayong adlaw kaninyo',
        'Dili kini ang tubag',
        'Sayop nga kapilian',
        'Walay labot sa hilisgutan',
      ],
      correctAnswer: 0,
      explanation: `Insakto kaayo! The core expression is "${lesson?.titleBisaya || lesson?.title}".`,
    },
    {
      id: `act_${lesson?.id || 'default'}_3`,
      type: 'pronunciation_drill',
      prompt: `Pronounce: "${lesson?.titleBisaya || lesson?.title || 'Maayong buntag'}"`,
      promptBisaya: lesson?.titleBisaya || lesson?.title || 'Maayong buntag',
      phonetics: 'Speak clearly into the microphone',
      explanation: 'Whisper speech recognition evaluates your acoustic concordance and vowel crispness.',
    },
  ];

  // Robustly sanitize activities array
  const rawActivities = (lesson && Array.isArray(lesson.activities) && lesson.activities.length > 0)
    ? lesson.activities.filter((a): a is Activity => Boolean(a && typeof a === 'object' && a.type))
    : [];

  const activities: Activity[] = rawActivities.length > 0 ? rawActivities : fallbackActivities;

  const safeIndex = Math.min(Math.max(0, currentIndex), Math.max(0, activities.length - 1));
  const currentActivity: Activity = activities[safeIndex] || fallbackActivities[0] || defaultFallback;
  const progressPercent = Math.round(((safeIndex) / Math.max(1, activities.length)) * 100);

  // Play audio (with normal or slow rate)
  const handlePlayAudio = (text?: string, isSlow: boolean = false) => {
    sounds.playTap();
    const speechText = text || currentActivity?.promptBisaya || currentActivity?.prompt || 'Maayong adlaw';
    speakBisaya(speechText, isSlow ? 0.75 : 1.0);
  };

  // Multiple Choice check
  const handleSelectOption = (idx: number) => {
    if (feedback || !currentActivity) return;
    sounds.playTap();
    setSelectedOption(idx);
    const isCorrect = idx === currentActivity.correctAnswer;

    if (isCorrect) {
      sounds.playCorrect();
      setFeedback({
        isCorrect: true,
        message: currentActivity.explanation || 'Tukma kaayo! (Exactly right!)',
      });
      setScores((prev) => [...prev, 100]);
    } else {
      sounds.playWrong();
      setHearts((prev) => Math.max(1, prev - 1));
      const correctText = typeof currentActivity.correctAnswer === 'number' && currentActivity.options
        ? currentActivity.options[currentActivity.correctAnswer]
        : String(currentActivity.correctAnswer ?? 0);

      setFeedback({
        isCorrect: false,
        message: 'Sayop gamay. Take note of the right answer below!',
        solution: correctText,
      });
      setScores((prev) => [...prev, 50]);
    }
  };

  // Sentence Assembly tap
  const handleToggleWord = (word: string) => {
    if (feedback) return;
    sounds.playTap();
    if (assembledWords.includes(word)) {
      setAssembledWords(assembledWords.filter((w) => w !== word));
    } else {
      setAssembledWords([...assembledWords, word]);
    }
  };

  const handleVerifyAssembly = () => {
    if (!currentActivity) return;
    const constructed = assembledWords.join(' ');
    const isCorrect = constructed === currentActivity.correctAnswer;

    if (isCorrect) {
      sounds.playCorrect();
      setFeedback({
        isCorrect: true,
        message: 'Sakto gyud! Natural Bisaya word order and phrasing.',
      });
      setScores((prev) => [...prev, 100]);
    } else {
      sounds.playWrong();
      setHearts((prev) => Math.max(1, prev - 1));
      setFeedback({
        isCorrect: false,
        message: 'Not quite in the right order.',
        solution: String(currentActivity.correctAnswer ?? ''),
      });
      setScores((prev) => [...prev, 60]);
    }
  };

  // Pronunciation Drill recording
  const handleSpeechFailure = () => {
    setIsRecording(false);
    setIsCheckingSpeech(false);
    setSpeechResult(null);
    setSpeechError("We couldn't hear you, try again.");
    sounds.playWrong();
  };

  const handleStartSpeech = () => {
    if (!currentActivity) return;
    sounds.playMicBeep();
    setIsRecording(true);
    setIsCheckingSpeech(false);
    setSpeechResult(null);
    setSpeechError(null);

    const targetPhrase = currentActivity.promptBisaya || currentActivity.prompt || 'Maayong buntag';
    startSpeechRecognition(
      async (transcript) => {
        setIsRecording(false);
        setIsCheckingSpeech(true);

        try {
          const res = await fetch('/api/sulti/whisper-transcribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
            body: JSON.stringify({
              audioText: transcript,
              expectedText: targetPhrase,
            }),
          });
          if (!res.ok) throw new Error(`Speech evaluation failed (${res.status})`);

          const data = await res.json();
          const accuracyScore = Number(data.accuracyScore);
          if (!Number.isFinite(accuracyScore)) throw new Error('Speech evaluation returned no score');

          setSpeechResult({
            text: transcript,
            wer: data.whisperWer,
            score: accuracyScore,
          });
          const isGood = accuracyScore >= 70;
          if (isGood) {
            sounds.playCorrect();
          } else {
            sounds.playWrong();
          }
          setFeedback({
            isCorrect: isGood,
            message: `${data.phonemeFeedback} (Whisper WER: ${data.whisperWer}%)`,
          });
          setScores((prev) => [...prev, accuracyScore]);
        } catch (error) {
          console.warn('Speech evaluation unavailable:', error);
          handleSpeechFailure();
        } finally {
          setIsCheckingSpeech(false);
        }
      },
      (err) => {
        console.warn('Speech recognition failed:', err);
        handleSpeechFailure();
      },
      () => {
        setIsRecording(false);
      }
    );
  };

  const saveCompletion = async (avgScore: number | null) => {
    if (saveInFlight.current) return;
    saveInFlight.current = true;
    setSaveState({ status: 'saving', result: saveState.result });
    try {
      const result = await onComplete(lesson.id, avgScore);
      setSaveState({ status: 'saved', result });
    } catch (error: any) {
      setSaveState({
        status: 'error',
        error: error?.message || 'Could not save this lesson. Check your connection and try again.',
      });
    } finally {
      saveInFlight.current = false;
    }
  };

  // Reset only the current activity so the learner can try again. Prior
  // attempt scores stay recorded, but the lesson cannot advance while the
  // current answer is incorrect.
  const handleRetry = () => {
    sounds.playTap();
    setSelectedOption(null);
    setAssembledWords([]);
    setIsFlipped(false);
    setFeedback(null);
    setSpeechResult(null);
    setSpeechError(null);
  };

  // Next step. This is only reachable after a correct answer, or from an
  // informational flashcard. Incorrect answers must be retried.
  const handleNext = () => {
    if (feedback && !feedback.isCorrect) {
      handleRetry();
      return;
    }

    sounds.playTap();
    setSelectedOption(null);
    setAssembledWords([]);
    setIsFlipped(false);
    setFeedback(null);
    setSpeechResult(null);
    setSpeechError(null);

    if (currentIndex < activities.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      sounds.playFanfare();
      setIsFinished(true);
      const avgScore = scores.length > 0
        ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
        : null;
      void saveCompletion(avgScore);
    }
  };

  // LESSON COMPLETE CELEBRATION MODAL
  if (isFinished) {
    const finalScore = scores.length > 0
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : null;
    const savedResult = saveState.result;
    const displayScore = savedResult?.score ?? finalScore;
    const displayXp = savedResult?.xpAwarded ?? 0;

    return (
      <div className="fixed inset-0 z-50 bg-stone-950/90 backdrop-blur-md flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-6 max-w-sm w-full text-center space-y-5 shadow-2xl border border-stone-200 animate-in fade-in zoom-in duration-300">
          <div className="w-20 h-20 bg-gradient-to-tr from-amber-400 to-amber-300 text-amber-950 rounded-full mx-auto flex items-center justify-center shadow-lg shadow-amber-300/50">
            <Award className="w-11 h-11" />
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-teal-600 bg-teal-50 px-2.5 py-0.5 rounded-full">
              Lesson Complete!
            </span>
            <h2 className="font-display text-2xl font-black text-stone-900 mt-1">
              Nahuman na nimo!
            </h2>
            <p className="text-xs text-stone-500 font-medium">
              You mastered "{lesson.title}"
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 py-1">
            <div className="p-3.5 bg-teal-50/80 rounded-2xl border border-teal-200/60">
              <div className="text-xs text-teal-800 font-bold uppercase tracking-wider">Earned XP</div>
              <div className="text-2xl font-black font-mono text-teal-700 tabular-nums">
                {saveState.status === 'saving' ? '…' : saveState.status === 'error' ? '—' : `+${displayXp}`}
              </div>
            </div>
            <div className="p-3.5 bg-amber-50/80 rounded-2xl border border-amber-200/60">
              <div className="text-xs text-amber-800 font-bold uppercase tracking-wider">Accuracy</div>
              <div className="text-2xl font-black font-mono text-amber-900 tabular-nums">
                {displayScore === null || displayScore === undefined ? 'Not scored' : `${displayScore}%`}
              </div>
            </div>
          </div>

          {saveState.status === 'saving' && (
            <p className="text-[11px] font-mono text-teal-700 bg-teal-50 p-2.5 rounded-xl border border-teal-100">
              Saving this lesson to your server-verified progress…
            </p>
          )}
          {saveState.status === 'saved' && savedResult?.alreadyCompleted && (
            <p className="text-[11px] font-mono text-stone-600 bg-stone-50 p-2.5 rounded-xl border border-stone-100">
              This lesson was already completed, so no duplicate XP was awarded.
            </p>
          )}
          {saveState.status === 'error' && (
            <p className="text-[11px] font-mono text-rose-700 bg-rose-50 p-2.5 rounded-xl border border-rose-100">
              {saveState.error}
            </p>
          )}

          <p className="text-xs text-stone-600 italic bg-stone-50 p-2.5 rounded-xl border border-stone-100">
            "Maayo kaayo! Padayon sa pagkat-on aron mas molig-on ang imong Bisaya."
          </p>

          {saveState.status === 'error' ? (
            <div className="space-y-2">
              <button
                onClick={() => void saveCompletion(finalScore)}
                className="w-full min-h-[48px] bg-teal-600 hover:bg-teal-500 text-white rounded-2xl font-black text-xs py-3 px-4 transition-all btn-3d-teal shadow-md cursor-pointer"
              >
                Retry Save
              </button>
              <button
                onClick={() => {
                  sounds.playTap();
                  onClose();
                }}
                className="w-full py-2 text-xs font-bold text-stone-500 hover:text-stone-800 cursor-pointer"
              >
                Close without saving
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                sounds.playTap();
                onClose();
              }}
              disabled={saveState.status !== 'saved'}
              className="w-full min-h-[48px] bg-teal-600 hover:bg-teal-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-2xl font-black text-xs py-3 px-4 transition-all btn-3d-teal shadow-md cursor-pointer"
            >
              {saveState.status === 'saving' ? 'Saving Verified Progress…' : 'Continue'}
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-stone-950 flex flex-col justify-between max-w-md mx-auto text-stone-100 select-none">
      {/* Top Duolingo-style Navigation Bar */}
      <div className="p-3.5 border-b border-stone-800/90 flex items-center justify-between gap-3 bg-stone-900/90 backdrop-blur-md">
        <button
          onClick={() => setShowExitConfirm(true)}
          className="min-h-[40px] min-w-[40px] flex items-center justify-center text-stone-400 hover:text-white rounded-xl active:bg-stone-800 cursor-pointer"
          aria-label="Exit lesson"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Progress Bar with Beveled Capsule */}
        <div className="flex-1 space-y-1">
          <div className="w-full bg-stone-800 rounded-full h-3 p-0.5 overflow-hidden border border-stone-700/60">
            <div
              className="bg-gradient-to-r from-teal-500 to-emerald-400 h-full rounded-full transition-all duration-300 shadow-sm"
              style={{ width: `${Math.max(progressPercent, 5)}%` }}
            />
          </div>
        </div>

        {/* Hearts Indicator */}
        <div className="flex items-center gap-1 text-rose-400 font-mono text-xs font-bold bg-rose-950/40 border border-rose-500/30 px-2.5 py-1 rounded-xl">
          <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-400 animate-heart" />
          <span>{hearts}</span>
        </div>
      </div>

      {/* Main Interactive Stage */}
      <div className="flex-1 overflow-y-auto p-5 flex flex-col justify-center space-y-6">
        {/* Flashcard Activity */}
        {currentActivity?.type === 'flashcard' && (
          <div className="space-y-4">
            <div
              onClick={() => {
                sounds.playTap();
                setIsFlipped(!isFlipped);
              }}
              className="bg-stone-900 border-2 border-stone-800 rounded-3xl p-6 text-center shadow-xl cursor-pointer hover:border-teal-500/50 transition-all min-h-[230px] flex flex-col justify-center items-center relative active:scale-[0.98]"
            >
              <span className="absolute top-4 right-4 text-[10px] text-stone-400 uppercase tracking-widest font-mono">
                {isFlipped ? 'English & Etiquette' : 'Tap to Flip ↻'}
              </span>

              {!isFlipped ? (
                <div className="space-y-3">
                  <div className="text-xs text-teal-400 uppercase tracking-wider font-bold">
                    {currentActivity?.prompt || 'Lesson Core Concept'}
                  </div>
                  <div className="font-display text-2xl font-black text-white tracking-tight">
                    {currentActivity?.promptBisaya || currentActivity?.prompt || 'Maayong adlaw'}
                  </div>
                  {currentActivity?.phonetics && (
                    <div className="text-xs font-mono text-stone-400">
                      Pronunciation: {currentActivity.phonetics}
                    </div>
                  )}

                  <div className="flex items-center justify-center gap-2 pt-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePlayAudio(undefined, false);
                      }}
                      className="p-2 bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 rounded-xl flex items-center gap-1.5 text-xs font-bold transition-all border border-teal-500/30"
                      title="Normal Speed Audio"
                    >
                      <Volume2 className="w-4 h-4" />
                      <span>Listen</span>
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePlayAudio(undefined, true);
                      }}
                      className="p-2 bg-stone-800 hover:bg-stone-750 text-stone-300 rounded-xl flex items-center gap-1.5 text-xs font-bold transition-all border border-stone-700"
                      title="Slow Audio"
                    >
                      <Snail className="w-4 h-4 text-amber-400" />
                      <span>Slow</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="text-sm font-bold text-stone-200">
                    {currentActivity?.explanation || 'Practice and master this communication expression.'}
                  </div>
                  {currentActivity?.culturalNote && (
                    <div className="text-xs text-amber-300/90 bg-amber-950/40 border border-amber-800/50 p-3 rounded-2xl leading-relaxed text-left">
                      💡 <span className="font-bold">Cultural Etiquette:</span> {currentActivity.culturalNote}
                    </div>
                  )}
                </div>
              )}
            </div>

            <p className="text-[11px] text-center text-stone-400">
              Flip the card to reveal translation, cultural nuance, and practical usage notes.
            </p>
          </div>
        )}

        {/* Multiple Choice Activity */}
        {currentActivity?.type === 'multiple_choice' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <span className="text-[11px] uppercase tracking-wider text-teal-400 font-bold">
                Listening & Comprehension Quiz
              </span>
              <h3 className="text-base font-black text-white leading-snug font-display">
                {currentActivity?.prompt || 'Choose the correct answer:'}
              </h3>

              {currentActivity?.promptBisaya && (
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => handlePlayAudio(currentActivity.promptBisaya)}
                    className="p-2 bg-teal-500/20 text-teal-300 rounded-xl flex items-center gap-1.5 text-xs font-bold border border-teal-500/30 hover:bg-teal-500/30 cursor-pointer"
                  >
                    <Volume2 className="w-4 h-4" />
                    <span>Play Audio</span>
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-2.5 pt-2">
              {currentActivity?.options?.map((option, idx) => {
                const isSelected = selectedOption === idx;
                const isCorrect = idx === currentActivity?.correctAnswer;
                let btnStyle = 'bg-stone-900 border-2 border-stone-800 text-stone-200 hover:border-stone-700 btn-3d-dark';

                if (feedback) {
                  if (isSelected && isCorrect) {
                    btnStyle = 'bg-emerald-950/80 border-2 border-emerald-500 text-emerald-200 shadow-emerald-500/30';
                  } else if (isSelected && !isCorrect) {
                    btnStyle = 'bg-rose-950/80 border-2 border-rose-500 text-rose-200 shadow-rose-500/30';
                  } else if (isCorrect) {
                    btnStyle = 'bg-emerald-950/40 border-2 border-emerald-600/70 text-emerald-300';
                  }
                }

                return (
                  <button
                    key={idx}
                    onClick={() => handleSelectOption(idx)}
                    disabled={Boolean(feedback)}
                    className={`w-full min-h-[52px] p-4 rounded-2xl text-left text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${btnStyle}`}
                  >
                    <span>{option}</span>
                    {feedback && isCorrect && <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />}
                    {feedback && isSelected && !isCorrect && <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Pronunciation Drill Activity with Whisper */}
        {currentActivity?.type === 'pronunciation_drill' && (
          <div className="space-y-5 text-center">
            <div className="space-y-1.5">
              <span className="text-[11px] uppercase tracking-wider text-teal-400 font-bold">
                Whisper Speech Pronunciation Drill
              </span>
              <div className="font-display text-2xl font-black text-white tracking-tight">
                {currentActivity?.promptBisaya || currentActivity?.prompt}
              </div>
              {currentActivity?.phonetics && (
                <div className="text-xs font-mono text-stone-400">
                  {currentActivity.phonetics}
                </div>
              )}
            </div>

            <p className="text-xs text-stone-400 max-w-xs mx-auto">
              {currentActivity?.prompt}
            </p>

            <button
              onClick={() => handlePlayAudio(currentActivity?.promptBisaya || currentActivity?.prompt)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-900 border border-stone-800 text-teal-300 text-xs font-bold hover:bg-stone-800"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>Listen First</span>
            </button>

            {/* Record Trigger with Waveform effect */}
            <div className="pt-2">
              <button
                onClick={handleStartSpeech}
                disabled={isRecording || isCheckingSpeech}
                className={`w-20 h-20 rounded-full mx-auto flex items-center justify-center transition-all shadow-xl cursor-pointer ${
                  isRecording
                    ? 'bg-rose-600 animate-pulse text-white scale-110 shadow-rose-600/50'
                    : isCheckingSpeech
                    ? 'bg-stone-700 text-stone-400'
                    : 'bg-teal-500 hover:bg-teal-400 active:scale-95 text-stone-950 btn-3d-teal shadow-teal-500/30'
                }`}
                title="Tap to speak"
              >
                <Mic className="w-8 h-8" />
              </button>

              {isRecording && (
                <div className="flex items-center justify-center gap-1 mt-3 h-6">
                  <div className="w-1 bg-teal-400 rounded-full wave-bar-1" />
                  <div className="w-1 bg-teal-400 rounded-full wave-bar-2" />
                  <div className="w-1 bg-teal-400 rounded-full wave-bar-3" />
                  <div className="w-1 bg-teal-400 rounded-full wave-bar-4" />
                  <div className="w-1 bg-teal-400 rounded-full wave-bar-5" />
                </div>
              )}

              <div className="text-xs text-stone-400 mt-2 font-medium">
                {isRecording ? 'Listening to Bisaya speech...' : isCheckingSpeech ? 'Whisper ASR scoring...' : 'Tap mic and pronounce phrase'}
              </div>
            </div>

            {speechError && (
              <div className="p-3.5 bg-rose-950/50 rounded-2xl border border-rose-500/50 text-xs space-y-2.5 max-w-xs mx-auto">
                <div className="text-rose-200 font-bold">{speechError}</div>
                <p className="text-[11px] text-rose-200/80">
                  This pronunciation drill must be completed before the lesson can finish.
                </p>
                <button
                  onClick={handleStartSpeech}
                  className="w-full min-h-[44px] rounded-xl bg-rose-500 hover:bg-rose-400 text-rose-950 font-black px-3 transition-colors cursor-pointer"
                >
                  Try again
                </button>
              </div>
            )}

            {speechResult && (
              <div className="p-3.5 bg-stone-900 rounded-2xl border border-stone-800 text-xs space-y-1.5 max-w-xs mx-auto shadow-inner">
                <div className="text-stone-400">
                  Recognized: <span className="text-white font-bold">"{speechResult.text}"</span>
                </div>
                <div className="flex items-center justify-center gap-3 text-[11px] font-mono">
                  <span className="text-teal-400 font-bold">Accuracy: {speechResult.score}%</span>
                  <span className="text-stone-500">·</span>
                  <span className="text-amber-400 font-bold">Whisper WER: {speechResult.wer}%</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Sentence Assembly Activity */}
        {currentActivity?.type === 'sentence_assembly' && (
          <div className="space-y-5">
            <div className="space-y-1">
              <span className="text-[11px] uppercase tracking-wider text-teal-400 font-bold">
                Sentence Assembly
              </span>
              <h3 className="text-sm font-bold text-white font-display">
                {currentActivity?.prompt || 'Assemble the correct phrase:'}
              </h3>
            </div>

            {/* Construction Area */}
            <div className="min-h-[68px] p-3 rounded-2xl bg-stone-900 border-2 border-stone-800 flex flex-wrap gap-2 items-center shadow-inner">
              {assembledWords.length === 0 ? (
                <span className="text-xs text-stone-500 italic">Tap words below in natural order...</span>
              ) : (
                assembledWords.map((word, i) => (
                  <button
                    key={i}
                    onClick={() => handleToggleWord(word)}
                    className="px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold rounded-xl min-h-[36px] btn-3d-teal cursor-pointer"
                  >
                    {word}
                  </button>
                ))
              )}
            </div>

            {/* Word Bank */}
            <div className="flex flex-wrap gap-2 pt-1">
              {currentActivity?.options?.map((word, i) => {
                const isUsed = assembledWords.includes(word);
                return (
                  <button
                    key={i}
                    onClick={() => handleToggleWord(word)}
                    disabled={isUsed || Boolean(feedback)}
                    className={`px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all min-h-[44px] cursor-pointer ${
                      isUsed 
                        ? 'opacity-20 bg-stone-800 text-stone-500 pointer-events-none' 
                        : 'bg-stone-850 hover:bg-stone-800 text-stone-200 border border-stone-700 btn-3d-dark'
                    }`}
                  >
                    {word}
                  </button>
                );
              })}
            </div>

            {!feedback && assembledWords.length > 0 && (
              <button
                onClick={handleVerifyAssembly}
                className="w-full min-h-[46px] bg-teal-600 hover:bg-teal-500 text-white rounded-2xl text-xs font-black py-2.5 transition-all btn-3d-teal shadow-md cursor-pointer"
              >
                Check Phrasing
              </button>
            )}
          </div>
        )}
      </div>

      {/* Classic Duolingo Bottom Feedback Drawer */}
      {feedback ? (
        <div
          className={`p-4 border-t-2 animate-in slide-in-from-bottom duration-200 ${
            feedback.isCorrect
              ? 'bg-emerald-950 border-emerald-500 text-emerald-100'
              : 'bg-rose-950 border-rose-500 text-rose-100'
          }`}
        >
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-start gap-2.5">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                feedback.isCorrect ? 'bg-emerald-500 text-emerald-950' : 'bg-rose-500 text-rose-950'
              }`}>
                {feedback.isCorrect ? <Check className="w-5 h-5 font-black" /> : <X className="w-5 h-5 font-black" />}
              </div>
              <div className="space-y-0.5">
                <div className="font-display font-black text-sm">
                  {feedback.isCorrect ? 'Sakto kaayo! (Awesome!)' : 'Hapit na! (Almost!)'}
                </div>
                <div className="text-xs text-stone-300 leading-relaxed font-normal">
                  {feedback.message}
                </div>
                {feedback.solution && (
                  <div className="text-xs font-bold text-amber-300 pt-0.5">
                    Correct answer: <span className="font-mono underline">{feedback.solution}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={feedback.isCorrect ? handleNext : handleRetry}
            className={`w-full min-h-[48px] rounded-2xl font-black text-xs py-3 px-4 flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md ${
              feedback.isCorrect 
                ? 'bg-emerald-500 hover:bg-emerald-400 text-emerald-950 btn-3d-emerald' 
                : 'bg-rose-500 hover:bg-rose-400 text-white btn-3d-rose'
            }`}
          >
            {feedback.isCorrect ? (
              <>
                <span>{currentIndex < activities.length - 1 ? 'Continue' : 'Complete Lesson'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            ) : (
              <>
                <RotateCcw className="w-4 h-4" />
                <span>Try Again</span>
              </>
            )}
          </button>
        </div>
      ) : (
        /* If no feedback yet and it's flashcard, show Next button */
        currentActivity?.type === 'flashcard' && (
          <div className="p-4 border-t border-stone-800 bg-stone-950">
            <button
              onClick={handleNext}
              className="w-full min-h-[48px] bg-teal-500 hover:bg-teal-400 text-stone-950 rounded-2xl font-black text-xs py-3 px-4 flex items-center justify-center gap-2 transition-all btn-3d-teal shadow-md cursor-pointer"
            >
              <span>{currentIndex < activities.length - 1 ? 'Next Card' : 'Finish Lesson'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )
      )}

      {/* Exit Confirmation Modal */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-800 rounded-3xl p-5 max-w-xs w-full text-center space-y-4 shadow-2xl">
            <div className="w-12 h-12 bg-rose-950/80 text-rose-400 rounded-2xl mx-auto flex items-center justify-center border border-rose-500/30">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="font-display font-black text-base text-white">
                Undangon ang Leksiyon?
              </h3>
              <p className="text-xs text-stone-400">
                Are you sure you want to exit? Your progress in this session won't be saved.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={() => setShowExitConfirm(false)}
                className="py-2.5 px-3 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold btn-3d-teal"
              >
                Keep Learning
              </button>
              <button
                onClick={onClose}
                className="py-2.5 px-3 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-xl text-xs font-bold btn-3d-dark"
              >
                Exit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
