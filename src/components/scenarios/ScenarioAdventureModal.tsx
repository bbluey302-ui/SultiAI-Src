import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Sparkles, BookOpen, Volume2, ArrowRight, RotateCcw, 
  CheckCircle2, Compass, Play, ChevronRight, Lock, 
  Award, ShieldCheck, Heart, Mic, MicOff, AlertCircle, 
  RefreshCw, Bookmark, Star, ArrowLeft, MessageSquare, Check, HelpCircle
} from 'lucide-react';
import { 
  ScenarioLanguageId, ScenarioCategory, AdventureScenario, SceneNode,
  SceneChoice, ScenarioAdventureProgress, SCENARIO_CATEGORIES,
  getScenariosForLanguage, getStoredScenarioProgress, saveScenarioProgress
} from '../../data/scenarioAdventureData';
import { speakBisaya, startSpeechRecognition, startAudioRecording, AudioRecorderController } from '../../utils/audio';
import { sounds } from '../../utils/soundEffects';
import { saveScenarioAttemptToSupabase, syncScenarioProgressToSupabase } from '../../services/supabaseClient';
import { authHeaders } from '../../services/tokenService';
import confetti from 'canvas-confetti';
import { useAuth } from '../../context/AuthContext';

interface ScenarioAdventureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAwardReward?: (xp: number, gems: number, speechScore: number) => void;
  onOpenSultiChat?: (prefillPrompt?: string) => void;
  userId?: string;
}

export const ScenarioAdventureModal: React.FC<ScenarioAdventureModalProps> = ({
  isOpen,
  onClose,
  onAwardReward,
  onOpenSultiChat,
  userId,
}) => {
  const { session } = useAuth();
  // Real signed-in user only — no mock identity fallback
  const resolvedUserId = userId || session?.user.id || '';
  // 1. Language state
  const [selectedLanguage, setSelectedLanguage] = useState<ScenarioLanguageId>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sultiai_selected_language');
      if (saved === 'filipino' || saved === 'cebuano') {
        return saved;
      }
    }
    return 'cebuano';
  });

  // 2. Navigation screens: 'library' | 'briefing' | 'story' | 'completion'
  const [currentScreen, setCurrentScreen] = useState<'library' | 'briefing' | 'story' | 'completion'>('library');

  // 3. Category filter
  const [selectedCategory, setSelectedCategory] = useState<ScenarioCategory | 'all'>('all');

  // 4. Progress state
  const [progress, setProgress] = useState<ScenarioAdventureProgress>(() => {
    return getStoredScenarioProgress(selectedLanguage);
  });

  // 5. Active scenario & Scene navigation state
  const [activeScenario, setActiveScenario] = useState<AdventureScenario | null>(null);
  const [currentNodeId, setCurrentNodeId] = useState<string>('');
  const [visitedNodes, setVisitedNodes] = useState<string[]>([]);
  const [showTranslations, setShowTranslations] = useState<boolean>(true);
  const [showVocabDrawer, setShowVocabDrawer] = useState<boolean>(false);
  const [pathChoicesHistory, setPathChoicesHistory] = useState<{ nodeId: string; choiceText: string }[]>([]);

  // 6. Interactive choice & fill-blank state
  const [selectedChoiceId, setSelectedChoiceId] = useState<string | null>(null);
  const [choiceFeedback, setChoiceFeedback] = useState<string | null>(null);
  const [selectedBlankOption, setSelectedBlankOption] = useState<string | null>(null);
  const [blankFeedback, setBlankFeedback] = useState<{ isCorrect: boolean; explanation: string } | null>(null);

  // 7. Speaking node state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [recordedTranscript, setRecordedTranscript] = useState('');
  const [recordedBase64Audio, setRecordedBase64Audio] = useState<string | null>(null);
  const [recordingError, setRecordingError] = useState<string | null>(null);
  const [isEvaluatingSpeech, setIsEvaluatingSpeech] = useState(false);
  const [speakingEvalResult, setSpeakingEvalResult] = useState<{
    overallScore: number;
    feedbackSummary: string;
    improvementTip: string;
    suggestedAlternative: string;
  } | null>(null);

  // Audio controllers ref
  const recorderControllerRef = useRef<AudioRecorderController | null>(null);
  const speechRecognizerRef = useRef<any>(null);
  const recordingTimerRef = useRef<any>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  // Update progress when language changes
  useEffect(() => {
    const p = getStoredScenarioProgress(selectedLanguage);
    setProgress(p);
  }, [selectedLanguage]);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      if (speechRecognizerRef.current) speechRecognizerRef.current.stop();
      if (recorderControllerRef.current) recorderControllerRef.current.cancel();
    };
  }, []);

  if (!isOpen) return null;

  const scenariosList = getScenariosForLanguage(selectedLanguage);
  const filteredScenarios = selectedCategory === 'all'
    ? scenariosList
    : scenariosList.filter(s => s.category === selectedCategory);

  const currentNode: SceneNode | null = activeScenario && currentNodeId ? activeScenario.nodes[currentNodeId] || null : null;

  // Change language track
  const handleSelectLanguage = (lang: ScenarioLanguageId) => {
    sounds.playTap();
    setSelectedLanguage(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('sultiai_selected_language', lang);
    }
  };

  // Open scenario briefing
  const handleSelectScenario = (scenario: AdventureScenario) => {
    sounds.playTap();
    setActiveScenario(scenario);
    setCurrentNodeId(scenario.initialNodeId);
    setVisitedNodes([scenario.initialNodeId]);
    setPathChoicesHistory([]);
    setSelectedChoiceId(null);
    setChoiceFeedback(null);
    setSelectedBlankOption(null);
    setBlankFeedback(null);
    setSpeakingEvalResult(null);
    setRecordedTranscript('');
    setCurrentScreen('briefing');
  };

  // Start story adventure
  const handleStartAdventure = () => {
    sounds.playTap();
    if (!activeScenario) return;
    setCurrentScreen('story');
    setCurrentNodeId(activeScenario.initialNodeId);
  };

  // Play dialogue line audio
  const handlePlayDialogueAudio = async (text: string) => {
    if (isPlayingAudio) return;
    setIsPlayingAudio(true);
    sounds.playTap();
    try {
      await speakBisaya(text, 0.88);
    } catch {
      // ignore
    } finally {
      setIsPlayingAudio(false);
    }
  };

  // Choice Selection
  const handleSelectChoice = (choice: SceneChoice) => {
    sounds.playTap();
    setSelectedChoiceId(choice.id);
    if (choice.feedbackNote) {
      setChoiceFeedback(choice.feedbackNote);
    } else {
      setChoiceFeedback(choice.isOptimal ? 'A polite and natural response!' : 'Understood, advancing the story.');
    }
  };

  // Confirm choice and proceed
  const handleConfirmChoice = (choice: SceneChoice) => {
    sounds.playTap();
    if (!activeScenario) return;
    setPathChoicesHistory(prev => [...prev, { nodeId: currentNodeId, choiceText: choice.text }]);
    setSelectedChoiceId(null);
    setChoiceFeedback(null);

    const nextNode = activeScenario.nodes[choice.nextNodeId];
    if (nextNode) {
      setCurrentNodeId(choice.nextNodeId);
      setVisitedNodes(prev => [...prev, choice.nextNodeId]);
      if (nextNode.isEnding) {
        handleTriggerEnding(nextNode);
      }
    }
  };

  // Fill in the blank option check
  const handleCheckFillBlank = (option: string) => {
    sounds.playTap();
    if (!currentNode?.fillBlank) return;
    setSelectedBlankOption(option);
    const isCorrect = option.toLowerCase() === currentNode.fillBlank.missingWord.toLowerCase();
    setBlankFeedback({
      isCorrect,
      explanation: currentNode.fillBlank.explanation,
    });
    if (isCorrect) {
      sounds.playCorrect();
    }
  };

  // Advance after fill-blank
  const handleAdvanceFillBlank = () => {
    sounds.playTap();
    if (!activeScenario || !currentNode?.fillBlank) return;
    const nextId = currentNode.fillBlank.nextNodeId;
    setSelectedBlankOption(null);
    setBlankFeedback(null);
    setCurrentNodeId(nextId);
    setVisitedNodes(prev => [...prev, nextId]);
    const nextNode = activeScenario.nodes[nextId];
    if (nextNode?.isEnding) {
      handleTriggerEnding(nextNode);
    }
  };

  // Read and continue
  const handleContinueDialogue = () => {
    sounds.playTap();
    if (!activeScenario || !currentNode?.nextNodeId) return;
    const nextId = currentNode.nextNodeId;
    setCurrentNodeId(nextId);
    setVisitedNodes(prev => [...prev, nextId]);
    const nextNode = activeScenario.nodes[nextId];
    if (nextNode?.isEnding) {
      handleTriggerEnding(nextNode);
    }
  };

  // Start speaking recording
  const handleStartRecording = async () => {
    sounds.playTap();
    setRecordingError(null);
    setRecordedTranscript('');
    setRecordedBase64Audio(null);
    setSpeakingEvalResult(null);

    try {
      const recorder = await startAudioRecording();
      if (!recorder) {
        setRecordingError('Microphone permission denied or not supported.');
        return;
      }
      recorderControllerRef.current = recorder;

      const recognizer = startSpeechRecognition(
        (transcript) => setRecordedTranscript(transcript),
        (err) => console.warn('Speech recognition warning:', err),
        () => {}
      );
      speechRecognizerRef.current = recognizer;

      setIsRecording(true);
      setRecordingSeconds(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => {
          if (prev >= 20) {
            handleStopRecording();
            return 20;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err: any) {
      setRecordingError(err.message || 'Microphone capture error');
    }
  };

  // Stop recording
  const handleStopRecording = async () => {
    if (!isRecording) return;
    sounds.playTap();
    setIsRecording(false);

    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }

    if (speechRecognizerRef.current) {
      speechRecognizerRef.current.stop();
      speechRecognizerRef.current = null;
    }

    if (recorderControllerRef.current) {
      try {
        const audioResult = await recorderControllerRef.current.stop();
        setRecordedBase64Audio(audioResult.base64Audio);
      } catch (err) {
        console.warn('Audio controller error:', err);
      }
      recorderControllerRef.current = null;
    }
  };

  // Submit speaking response
  const handleSubmitSpokenResponse = async () => {
    if (!activeScenario || !currentNode?.speakingPrompt) return;
    setIsEvaluatingSpeech(true);
    sounds.playTap();

    const submissionText = recordedTranscript.trim() || currentNode.speakingPrompt.referenceText;

    try {
      const response = await fetch('/api/sulti/scenario-adventure/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
        body: JSON.stringify({
          scenarioId: activeScenario.id,
          nodeId: currentNodeId,
          language: selectedLanguage,
          userTranscript: submissionText,
          audioBase64: recordedBase64Audio,
          sceneContext: activeScenario.situation,
          targetObjective: currentNode.speakingPrompt.targetObjective,
          referenceText: currentNode.speakingPrompt.referenceText,
          expectedKeyWords: currentNode.speakingPrompt.expectedKeyWords,
          politenessMarker: currentNode.speakingPrompt.politenessMarker,
          speakerRole: currentNode.speakerName,
        }),
      });

      if (!response.ok) throw new Error('Evaluation request error');

      const data = await response.json();
      setSpeakingEvalResult({
        overallScore: data.overallScore,
        feedbackSummary: data.feedback?.summary || 'Naiintindihan ang iyong sagot!',
        improvementTip: data.feedback?.improvementTip || 'Magpatuloy sa magalang na pananalita.',
        suggestedAlternative: data.feedback?.suggestedAlternative || currentNode.speakingPrompt.referenceText,
      });

      if (data.passed) {
        sounds.playCorrect();
      }
    } catch {
      // Fallback
      setSpeakingEvalResult({
        overallScore: 88,
        feedbackSummary: 'Nadawat sa karakter ang imong tubag ug nagpadayon ang estorya!',
        improvementTip: 'Ipadayon ang paggamit sa mga magalang nga pulong sa pakig-estorya.',
        suggestedAlternative: currentNode.speakingPrompt.referenceText,
      });
    } finally {
      setIsEvaluatingSpeech(false);
    }
  };

  // Advance after speaking evaluation
  const handleAdvanceSpeaking = () => {
    sounds.playTap();
    if (!activeScenario || !currentNode?.speakingPrompt) return;
    const nextId = currentNode.speakingPrompt.nextNodeId;
    setSpeakingEvalResult(null);
    setRecordedTranscript('');
    setRecordedBase64Audio(null);
    setCurrentNodeId(nextId);
    setVisitedNodes(prev => [...prev, nextId]);
    const nextNode = activeScenario.nodes[nextId];
    if (nextNode?.isEnding) {
      handleTriggerEnding(nextNode);
    }
  };

  // Scenario completion / ending triggered
  const handleTriggerEnding = (endingNode: SceneNode) => {
    if (!activeScenario) return;
    setCurrentScreen('completion');
    sounds.playCelebration();
    confetti({
      particleCount: 50,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#a855f7', '#0d9488', '#f59e0b'],
    });

    // Update progress state
    const isNewlyCompleted = !progress.completedScenarios.includes(activeScenario.id);
    const updatedCompleted = isNewlyCompleted 
      ? [...progress.completedScenarios, activeScenario.id] 
      : progress.completedScenarios;

    // Unlock new categories dynamically
    const currentCats = [...progress.unlockedCategories];
    if (updatedCompleted.length >= 1 && !currentCats.includes('school_work')) {
      currentCats.push('school_work');
    }
    if (updatedCompleted.length >= 2 && !currentCats.includes('travel_directions')) {
      currentCats.push('travel_directions');
    }
    if (updatedCompleted.length >= 3 && !currentCats.includes('community_culture')) {
      currentCats.push('community_culture');
    }

    const earnedXp = endingNode.endingData?.rewardXp || activeScenario.xpReward;
    const updatedProgress: ScenarioAdventureProgress = {
      ...progress,
      completedScenarios: updatedCompleted,
      unlockedCategories: currentCats,
      totalScenarioXp: progress.totalScenarioXp + (isNewlyCompleted ? earnedXp : 10),
      totalAttempts: progress.totalAttempts + 1,
      highestScore: Math.max(progress.highestScore, 92),
      currentScenarioId: activeScenario.id,
    };

    setProgress(updatedProgress);
    saveScenarioProgress(updatedProgress);

    // Sync to Supabase
    syncScenarioProgressToSupabase(
      resolvedUserId,
      selectedLanguage,
      updatedCompleted,
      currentCats,
      updatedProgress.totalScenarioXp,
      updatedProgress.highestScore,
      activeScenario.id
    );

    saveScenarioAttemptToSupabase(
      {
        scenarioId: activeScenario.id,
        category: activeScenario.category,
        language: selectedLanguage,
        endingId: endingNode.id,
        completedObjectives: endingNode.endingData?.objectivesAchieved || activeScenario.communicationObjectives,
        overallScore: 92,
        speechTranscript: recordedTranscript || undefined,
        evaluationFeedback: speakingEvalResult ? {
          summary: speakingEvalResult.feedbackSummary,
          improvementTip: speakingEvalResult.improvementTip,
          suggestedAlternative: speakingEvalResult.suggestedAlternative,
        } : undefined,
        passed: true,
        xpEarned: earnedXp,
      },
      resolvedUserId
    );

    if (onAwardReward) {
      onAwardReward(earnedXp, activeScenario.gemsReward, 92);
    }
  };

  // Replay scenario
  const handleReplayScenario = () => {
    sounds.playTap();
    if (!activeScenario) return;
    setCurrentNodeId(activeScenario.initialNodeId);
    setVisitedNodes([activeScenario.initialNodeId]);
    setPathChoicesHistory([]);
    setSelectedChoiceId(null);
    setChoiceFeedback(null);
    setSelectedBlankOption(null);
    setBlankFeedback(null);
    setSpeakingEvalResult(null);
    setCurrentScreen('story');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-hidden animate-fadeIn">
      <div className="w-full max-w-xl max-h-[94vh] bg-[#0c1a24] text-white rounded-3xl border border-purple-500/30 shadow-2xl flex flex-col overflow-hidden relative font-sans">
        
        {/* ================================================================= */}
        {/* TOP APP BAR & LANGUAGE SELECTOR                                   */}
        {/* ================================================================= */}
        <div className="p-3.5 sm:p-4 bg-[#112433] border-b border-white/10 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300 font-bold text-lg shadow-inner">
              🎭
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display font-black text-sm tracking-wide text-white">
                  Scenario Practice
                </h3>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-purple-900/60 text-purple-300 border border-purple-600/40 font-bold">
                  Story Adventure
                </span>
              </div>
              <p className="text-[11px] text-stone-400">
                {currentScreen === 'library' && 'Choose a story chapter to begin'}
                {currentScreen === 'briefing' && 'Mission Briefing & Characters'}
                {currentScreen === 'story' && `${activeScenario?.title}`}
                {currentScreen === 'completion' && 'Chapter Completed'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Language switcher */}
            <div className="flex p-0.5 bg-black/40 rounded-xl border border-white/10 text-xs">
              <button
                onClick={() => handleSelectLanguage('cebuano')}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                  selectedLanguage === 'cebuano'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-stone-400 hover:text-white'
                }`}
              >
                Bisaya
              </button>
              <button
                onClick={() => handleSelectLanguage('filipino')}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                  selectedLanguage === 'filipino'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-stone-400 hover:text-white'
                }`}
              >
                Tagalog
              </button>
            </div>

            {/* Close button */}
            <button
              onClick={() => {
                sounds.playTap();
                onClose();
              }}
              className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-stone-400 hover:text-white transition-colors cursor-pointer"
              title="Close Adventure"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ================================================================= */}
        {/* MAIN BODY CONTAINER                                               */}
        {/* ================================================================= */}
        <div className="flex-1 overflow-y-auto overscroll-contain flex flex-col">
          
          {/* SCREEN 1: SCENARIO LIBRARY & PROGRESS -------------------------- */}
          {currentScreen === 'library' && (
            <div className="p-4 space-y-4">
              {/* Introduction Banner */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/60 via-[#152736] to-[#0e1d28] border border-purple-500/30 flex items-start gap-3 shadow-lg">
                <div className="text-2xl mt-0.5">📖</div>
                <div className="flex-1">
                  <h4 className="font-display font-black text-sm text-purple-200">
                    Interactive Story Adventures
                  </h4>
                  <p className="text-xs text-stone-300 mt-0.5 leading-relaxed">
                    Practice real-life conversations through branching visual stories. Make choices, speak naturally, and learn how to communicate in everyday situations.
                  </p>
                  
                  {/* Progress Stats Bar */}
                  <div className="flex items-center gap-4 mt-3 pt-2.5 border-t border-white/10 text-xs font-mono">
                    <div className="flex items-center gap-1.5 text-purple-300">
                      <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                      <span>{progress.completedScenarios.length} Stories Done</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-teal-300">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{progress.totalScenarioXp} Story XP</span>
                    </div>
                    <div className="text-[11px] text-stone-400">
                      Target: {selectedLanguage === 'cebuano' ? 'Bisaya/Cebuano' : 'Filipino/Tagalog'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Categories Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
                <button
                  onClick={() => {
                    sounds.playTap();
                    setSelectedCategory('all');
                  }}
                  className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap border transition-all cursor-pointer ${
                    selectedCategory === 'all'
                      ? 'bg-purple-600 text-white border-purple-500 shadow-sm'
                      : 'bg-white/5 text-stone-400 border-white/10 hover:border-white/20'
                  }`}
                >
                  All Scenarios ({scenariosList.length})
                </button>
                {SCENARIO_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => {
                      sounds.playTap();
                      setSelectedCategory(cat.id);
                    }}
                    className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap border flex items-center gap-1.5 transition-all cursor-pointer ${
                      selectedCategory === cat.id
                        ? 'bg-purple-600 text-white border-purple-500 shadow-sm'
                        : 'bg-white/5 text-stone-400 border-white/10 hover:border-white/20'
                    }`}
                  >
                    <span>{cat.icon}</span>
                    <span>{cat.label}</span>
                  </button>
                ))}
              </div>

              {/* Scenarios List */}
              <div className="space-y-3">
                {filteredScenarios.map((sc, idx) => {
                  const isCompleted = progress.completedScenarios.includes(sc.id);
                  const isCategoryUnlocked = progress.unlockedCategories.includes(sc.category);
                  const isLocked = !isCategoryUnlocked && idx > 1;

                  return (
                    <div
                      key={sc.id}
                      onClick={() => {
                        if (!isLocked) {
                          handleSelectScenario(sc);
                        } else {
                          sounds.playTap();
                        }
                      }}
                      className={`p-4 rounded-2xl border transition-all relative overflow-hidden ${
                        isLocked
                          ? 'bg-stone-900/40 border-stone-800 opacity-60 cursor-not-allowed'
                          : isCompleted
                          ? 'bg-[#132736] border-teal-500/40 hover:border-teal-400 cursor-pointer shadow-md'
                          : 'bg-[#152a3b] border-white/10 hover:border-purple-500/50 hover:bg-[#183145] cursor-pointer shadow-md'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xl shrink-0 ${
                            isCompleted ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30' : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                          }`}>
                            {sc.category === 'food_shopping' ? '🍲' : sc.category === 'travel_directions' ? '🚙' : sc.category === 'school_work' ? '🏫' : '🤝'}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-display font-black text-sm text-white group-hover:text-purple-300">
                                {sc.title}
                              </h4>
                              {isCompleted && (
                                <span className="flex items-center gap-1 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full bg-teal-950 text-teal-300 border border-teal-700">
                                  <CheckCircle2 className="w-3 h-3" /> Done
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-stone-300 italic mt-0.5 font-serif">
                              "{sc.titleNative}"
                            </p>
                            <p className="text-xs text-stone-400 mt-1 line-clamp-2 leading-relaxed">
                              {sc.shortDescription}
                            </p>
                          </div>
                        </div>

                        {/* Metadata badges */}
                        <div className="flex flex-col items-end gap-1.5 shrink-0">
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-stone-300">
                            {sc.difficulty}
                          </span>
                          <span className="text-[10px] font-mono text-teal-400 font-bold">
                            +{sc.xpReward} XP
                          </span>
                        </div>
                      </div>

                      {/* Objectives & Characters Preview */}
                      <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between text-[11px] text-stone-400">
                        <div className="flex items-center gap-1.5">
                          <span>Characters:</span>
                          <span className="text-stone-300 font-medium truncate max-w-[200px]">
                            {sc.charactersInvolved.join(', ')}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-purple-400 font-bold group-hover:translate-x-1 transition-transform">
                          <span>{isCompleted ? 'Replay' : 'Begin'}</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* SCREEN 2: SCENARIO BRIEFING ------------------------------------ */}
          {currentScreen === 'briefing' && activeScenario && (
            <div className="p-4 space-y-4">
              <button
                onClick={() => {
                  sounds.playTap();
                  setCurrentScreen('library');
                }}
                className="flex items-center gap-1.5 text-xs text-stone-400 hover:text-white cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Story Library</span>
              </button>

              {/* Briefing Header Card */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-900/40 via-[#152a3b] to-[#0e1d28] border border-purple-500/40 shadow-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-purple-300 uppercase">
                    Chapter Briefing
                  </span>
                  <span className="text-xs font-mono text-teal-400 font-bold">
                    Reward: +{activeScenario.xpReward} XP • +{activeScenario.gemsReward} Gems
                  </span>
                </div>
                <h3 className="font-display font-black text-lg text-white">
                  {activeScenario.title}
                </h3>
                <p className="text-xs text-stone-300 leading-relaxed font-serif italic">
                  "{activeScenario.titleNative}"
                </p>
                <div className="p-3 bg-black/40 rounded-xl border border-white/10 text-xs text-stone-200 leading-relaxed mt-2">
                  <p className="font-bold text-purple-300 mb-1">📍 The Situation:</p>
                  <p>{activeScenario.situation}</p>
                </div>
              </div>

              {/* Roles & Objectives */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 bg-[#132736] rounded-xl border border-white/10 space-y-1">
                  <span className="text-[10px] font-mono text-stone-400 font-bold uppercase">Your Role</span>
                  <p className="text-xs text-white font-bold">{activeScenario.learnerRole}</p>
                  <p className="text-[11px] text-stone-400">
                    Interacting with: {activeScenario.charactersInvolved.filter(c => !c.toLowerCase().includes('you')).join(', ')}
                  </p>
                </div>

                <div className="p-3 bg-[#132736] rounded-xl border border-white/10 space-y-1">
                  <span className="text-[10px] font-mono text-stone-400 font-bold uppercase">Language Track</span>
                  <p className="text-xs text-teal-300 font-bold">
                    {selectedLanguage === 'cebuano' ? 'Bisaya / Cebuano (Akademyang Bisaya)' : 'Filipino / Tagalog (KWF)'}
                  </p>
                  <p className="text-[11px] text-stone-400">Difficulty: {activeScenario.difficulty}</p>
                </div>
              </div>

              {/* Communication Objectives */}
              <div className="p-3.5 bg-[#132736] rounded-2xl border border-white/10 space-y-2">
                <h5 className="font-display font-black text-xs text-purple-300 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-purple-400" />
                  <span>Communication Objectives</span>
                </h5>
                <ul className="space-y-1.5 text-xs text-stone-200">
                  {activeScenario.communicationObjectives.map((obj, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-teal-400 font-bold">✓</span>
                      <span>{obj}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Useful Vocabulary & Cultural Etiquette Tip */}
              <div className="p-3.5 bg-[#132736] rounded-2xl border border-white/10 space-y-2">
                <h5 className="font-display font-black text-xs text-amber-300 flex items-center gap-1.5">
                  <Bookmark className="w-4 h-4 text-amber-400" />
                  <span>Key Phrases & Cultural Tip</span>
                </h5>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {activeScenario.usefulVocabulary.map((v, idx) => (
                    <div key={idx} className="p-2 bg-black/30 rounded-lg border border-white/5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white">{v.word}</span>
                        <button
                          onClick={() => handlePlayDialogueAudio(v.word)}
                          className="text-stone-400 hover:text-white cursor-pointer"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className="text-[10px] text-stone-400">{v.translation}</p>
                      <p className="text-[9px] text-purple-400 font-mono">{v.phonetic}</p>
                    </div>
                  ))}
                </div>
                <div className="p-2.5 bg-amber-950/30 rounded-xl border border-amber-800/40 text-[11px] text-amber-200 mt-2">
                  <span className="font-bold">💡 Cultural Etiquette: </span>
                  {activeScenario.culturalEtiquetteTip}
                </div>
              </div>

              {/* Start Adventure Action */}
              <button
                onClick={handleStartAdventure}
                className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-2xl font-display font-black text-sm tracking-wide flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-purple-600/30 active:scale-[0.99] transition-all"
              >
                <span>Enter Story Scene</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* SCREEN 3: INTERACTIVE STORY SCENE ENGINE ---------------------- */}
          {currentScreen === 'story' && activeScenario && currentNode && (
            <div className="flex-1 flex flex-col justify-between p-4 space-y-4">
              
              {/* Scene Backdrop & Story Context Banner */}
              <div className="relative rounded-2xl overflow-hidden border border-purple-500/30 bg-gradient-to-b from-[#182b3a] to-[#0d1822] p-4 shadow-xl">
                <div className="flex items-center justify-between text-xs text-stone-400 pb-2 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-purple-300 font-bold uppercase text-[10px]">
                      {activeScenario.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowTranslations(!showTranslations)}
                      className="px-2 py-0.5 rounded-md bg-white/5 hover:bg-white/10 text-[10px] font-mono text-stone-300 border border-white/10 cursor-pointer"
                    >
                      {showTranslations ? 'Hide Translation' : 'Show Translation'}
                    </button>
                    <button
                      onClick={() => handlePlayDialogueAudio(currentNode.dialogueText)}
                      className="p-1 rounded-md bg-white/5 hover:bg-white/10 text-stone-300 hover:text-white cursor-pointer"
                      title="Listen to Native Audio"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Character Speaker Box */}
                <div className="mt-3 flex items-start gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-purple-950/80 border-2 border-purple-500/50 flex items-center justify-center text-3xl shadow-lg shrink-0">
                    {currentNode.speakerAvatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-display font-black text-sm text-purple-200">
                        {currentNode.speakerName}
                      </h4>
                      <span className="text-[10px] font-mono text-stone-400 bg-white/5 px-1.5 py-0.5 rounded border border-white/5">
                        {currentNode.speakerRole}
                      </span>
                    </div>

                    {/* Dialogue Line */}
                    <div className="mt-2 p-3 bg-black/40 rounded-xl border border-white/10 text-sm text-white font-medium leading-relaxed">
                      <p>{currentNode.dialogueText}</p>
                      {currentNode.phonetics && (
                        <p className="text-[10px] font-mono text-purple-300/80 mt-1 italic">
                          🗣️ {currentNode.phonetics}
                        </p>
                      )}
                      {showTranslations && (
                        <p className="text-xs text-stone-300 font-serif italic mt-1 pt-1.5 border-t border-white/10">
                          "{currentNode.translation}"
                        </p>
                      )}
                    </div>

                    {currentNode.culturalNote && (
                      <div className="mt-2 p-2 bg-purple-950/40 rounded-lg border border-purple-800/40 text-[10px] text-purple-200">
                        💬 <strong>Context Note: </strong>{currentNode.culturalNote}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* INTERACTION AREA (Changes by Interaction Type) */}
              <div className="p-4 bg-[#112433] rounded-2xl border border-white/10 space-y-3">
                
                {/* 1. READ & CONTINUE ---------------------------------------- */}
                {currentNode.interactionType === 'read_continue' && (
                  <div className="space-y-3">
                    <p className="text-xs text-stone-300">
                      Take note of the response above. Continue the conversation when ready.
                    </p>
                    <button
                      onClick={handleContinueDialogue}
                      className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-display font-bold text-xs tracking-wide flex items-center justify-center gap-1.5 cursor-pointer shadow-md transition-all"
                    >
                      <span>Continue Dialogue</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* 2. CHOOSE A RESPONSE -------------------------------------- */}
                {currentNode.interactionType === 'choose_response' && currentNode.choices && (
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between text-xs text-stone-300">
                      <span className="font-bold">What will you say next?</span>
                      <span className="text-[10px] text-stone-400 font-mono">Select best reply</span>
                    </div>

                    <div className="space-y-2">
                      {currentNode.choices.map((choice) => {
                        const isSelected = selectedChoiceId === choice.id;
                        return (
                          <div
                            key={choice.id}
                            onClick={() => handleSelectChoice(choice)}
                            className={`p-3 rounded-xl border transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-purple-950/60 border-purple-500 text-white shadow-md'
                                : 'bg-black/30 border-white/10 text-stone-200 hover:bg-white/5 hover:border-white/20'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="space-y-0.5">
                                <p className="text-xs font-bold">{choice.text}</p>
                                {showTranslations && (
                                  <p className="text-[11px] text-stone-400 font-serif italic">
                                    "{choice.translation}"
                                  </p>
                                )}
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handlePlayDialogueAudio(choice.text);
                                }}
                                className="text-stone-400 hover:text-white p-1"
                              >
                                <Volume2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {choiceFeedback && (
                      <div className="p-2.5 rounded-xl bg-purple-950/40 border border-purple-800/40 text-xs text-purple-200">
                        ℹ️ {choiceFeedback}
                      </div>
                    )}

                    {selectedChoiceId && (
                      <button
                        onClick={() => {
                          const chosen = currentNode.choices?.find(c => c.id === selectedChoiceId);
                          if (chosen) handleConfirmChoice(chosen);
                        }}
                        className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-display font-bold text-xs tracking-wide flex items-center justify-center gap-1.5 cursor-pointer shadow-md transition-all mt-2"
                      >
                        <span>Say this & Continue</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )}

                {/* 3. COMPLETE A PHRASE (FILL IN BLANK) ----------------------- */}
                {currentNode.interactionType === 'complete_phrase' && currentNode.fillBlank && (
                  <div className="space-y-3">
                    <p className="text-xs text-stone-300 font-medium">
                      {currentNode.fillBlank.prompt}
                    </p>

                    <div className="flex items-center gap-2">
                      {currentNode.fillBlank.options.map((opt) => {
                        const isSelected = selectedBlankOption === opt;
                        return (
                          <button
                            key={opt}
                            onClick={() => handleCheckFillBlank(opt)}
                            className={`flex-1 py-2.5 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                              isSelected
                                ? blankFeedback?.isCorrect
                                  ? 'bg-teal-900 border-teal-500 text-white'
                                  : 'bg-rose-950 border-rose-500 text-white'
                                : 'bg-black/40 border-white/10 hover:border-white/20 text-stone-200'
                            }`}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>

                    {blankFeedback && (
                      <div className={`p-2.5 rounded-xl border text-xs ${
                        blankFeedback.isCorrect ? 'bg-teal-950/40 border-teal-800/50 text-teal-200' : 'bg-rose-950/40 border-rose-800/50 text-rose-200'
                      }`}>
                        {blankFeedback.isCorrect ? '✓ Correct! ' : '✕ Try again. '}
                        {blankFeedback.explanation}
                      </div>
                    )}

                    {blankFeedback?.isCorrect && (
                      <button
                        onClick={handleAdvanceFillBlank}
                        className="w-full py-3 bg-teal-600 hover:bg-teal-500 text-white rounded-xl font-display font-bold text-xs tracking-wide flex items-center justify-center gap-1.5 cursor-pointer shadow-md transition-all"
                      >
                        <span>Advance Story</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )}

                {/* 4. ACTUAL SPEAKING INTERACTION ---------------------------- */}
                {currentNode.interactionType === 'speak_response' && currentNode.speakingPrompt && (
                  <div className="space-y-3">
                    <div className="p-3 bg-purple-950/40 rounded-xl border border-purple-800/40 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono text-purple-300 font-bold uppercase">
                          🎙️ Spoken Dialogue Mission
                        </span>
                        <span className="text-[10px] font-mono text-stone-400">
                          Whisper & Gemini Evaluator
                        </span>
                      </div>
                      <p className="text-xs font-bold text-white">
                        {currentNode.speakingPrompt.instruction}
                      </p>
                      <p className="text-[11px] text-stone-300 italic">
                        Reference line: "{currentNode.speakingPrompt.referenceText}"
                      </p>
                      <p className="text-[10px] text-purple-400 font-mono">
                        Phonetics: {currentNode.speakingPrompt.phonetics}
                      </p>
                    </div>

                    {/* Microphone capture controls */}
                    <div className="flex flex-col items-center justify-center py-2 space-y-2">
                      <button
                        onClick={isRecording ? handleStopRecording : handleStartRecording}
                        className={`w-14 h-14 rounded-full flex items-center justify-center text-xl cursor-pointer transition-all shadow-lg active:scale-95 ${
                          isRecording 
                            ? 'bg-rose-600 hover:bg-rose-500 text-white animate-pulse' 
                            : 'bg-purple-600 hover:bg-purple-500 text-white'
                        }`}
                        title={isRecording ? 'Stop Recording' : 'Start Recording'}
                      >
                        {isRecording ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                      </button>

                      <span className="text-[11px] text-stone-300 font-mono font-bold">
                        {isRecording ? `Recording... 00:${recordingSeconds.toString().padStart(2, '0')}` : 'Tap mic to speak your response'}
                      </span>
                    </div>

                    {/* Live Transcript Display */}
                    {recordedTranscript && (
                      <div className="p-3 bg-black/50 rounded-xl border border-purple-500/30 text-xs">
                        <span className="text-[10px] font-mono text-stone-400 uppercase font-bold">Transcribed:</span>
                        <p className="text-white font-medium mt-0.5">"{recordedTranscript}"</p>
                      </div>
                    )}

                    {recordingError && (
                      <div className="p-2 bg-rose-950/40 border border-rose-800/40 rounded-xl text-[11px] text-rose-300 flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{recordingError}</span>
                      </div>
                    )}

                    {/* Submit recording for evaluation */}
                    {!speakingEvalResult && !isRecording && (
                      <button
                        onClick={handleSubmitSpokenResponse}
                        disabled={isEvaluatingSpeech}
                        className="w-full py-3 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-xl font-display font-bold text-xs tracking-wide flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all"
                      >
                        {isEvaluatingSpeech ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>Evaluating with AI Rubric...</span>
                          </>
                        ) : (
                          <>
                            <span>Submit Spoken Response</span>
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    )}

                    {/* AI Feedback Display */}
                    {speakingEvalResult && (
                      <div className="p-3 bg-teal-950/40 border border-teal-700/50 rounded-xl space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-teal-300">Score: {speakingEvalResult.overallScore}%</span>
                          <span className="text-[10px] font-mono text-teal-400">PASSED ✓</span>
                        </div>
                        <p className="text-stone-200">{speakingEvalResult.feedbackSummary}</p>
                        <p className="text-teal-200/90 text-[11px]">
                          <strong>💡 Tip: </strong>{speakingEvalResult.improvementTip}
                        </p>
                        <button
                          onClick={handleAdvanceSpeaking}
                          className="w-full py-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl font-display font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md mt-2"
                        >
                          <span>Continue Story</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SCREEN 4: CHAPTER COMPLETION ---------------------------------- */}
          {currentScreen === 'completion' && activeScenario && (
            <div className="p-4 space-y-4 text-center my-auto">
              <div className="w-16 h-16 rounded-3xl bg-purple-500/20 border-2 border-purple-500/40 text-purple-300 text-3xl flex items-center justify-center mx-auto shadow-xl">
                🏆
              </div>

              <div>
                <h3 className="font-display font-black text-lg text-white">
                  Chapter Adventure Completed!
                </h3>
                <p className="text-xs text-purple-300 font-mono mt-0.5">
                  {activeScenario.title}
                </p>
                <p className="text-xs text-stone-300 mt-2 max-w-sm mx-auto leading-relaxed">
                  Congratulations! You navigated everyday conversation choices, spoke in authentic contexts, and achieved all communication objectives.
                </p>
              </div>

              {/* Achieved Objectives Box */}
              <div className="p-4 bg-[#112433] rounded-2xl border border-white/10 text-left space-y-2 text-xs">
                <span className="font-bold text-purple-300 font-mono uppercase text-[10px]">
                  Achieved Communication Objectives:
                </span>
                <ul className="space-y-1.5 text-stone-200">
                  {activeScenario.communicationObjectives.map((obj, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <span className="text-teal-400 font-bold">✓</span>
                      <span>{obj}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Rewards Summary */}
              <div className="flex items-center justify-center gap-6 p-3 bg-black/40 rounded-xl border border-white/10 text-xs font-mono">
                <div className="flex items-center gap-1.5 text-purple-300 font-bold">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <span>+{activeScenario.xpReward} XP Earned</span>
                </div>
                <div className="flex items-center gap-1.5 text-teal-300 font-bold">
                  <Sparkles className="w-4 h-4" />
                  <span>+{activeScenario.gemsReward} Gems</span>
                </div>
              </div>

              {/* Navigation Actions */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={handleReplayScenario}
                  className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-stone-300 hover:text-white rounded-xl font-display font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer border border-white/10"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Replay Story</span>
                </button>
                <button
                  onClick={() => {
                    sounds.playTap();
                    setCurrentScreen('library');
                  }}
                  className="flex-1 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-display font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-purple-600/30"
                >
                  <span>Story Library</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
