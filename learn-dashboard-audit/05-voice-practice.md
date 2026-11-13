# 05 — Voice Practice & Pronunciation Integrity

Back to [README](README.md) · Prev: [04-thirteen-modules.md](04-thirteen-modules.md) · Next: [06-database-and-progress.md](06-database-and-progress.md)

**Why this document exists:** Voice is the product's core promise ("Sulti" = speak). The audit found that some voice scores are simulated, and one fallback can award near-perfect accuracy without any speech.

---

## 1. The three voice paths

| Path | Component | What happens | Status |
|---|---|---|---|
| **A. Inline Voice Practice preview** | `QuickPracticeModal.tsx` 820–900 | Learner taps a mission; `setTimeout` returns hardcoded 96% / 95% scores and confetti | **Simulated** |
| **B. Full Speaking City** | `SpeakingCityModal.tsx` | Records audio, posts to `/api/sulti/speaking-mission/evaluate`, renders real feedback | **Partially implemented** (2 languages) |
| **C. Lesson Player pronunciation drill** | `LessonPlayer.tsx` 150–260 | Web Speech recognition → text → `/api/sulti/whisper-transcribe` → text-vs-text WER | **Partially implemented / Broken fallback** |

---

## 2. Path C in detail (the one that awards lesson scores)

1. `startSpeechRecognition` uses the browser Web Speech API with **`lang = 'fil-PH'` hardcoded** (`LessonPlayer.tsx` 162–176; `src/utils/audio.ts`). English and Cebuano targets are therefore recognized with a Filipino acoustic model.
2. The recognized **text** is POSTed to `/api/sulti/whisper-transcribe` (`LessonPlayer.tsx` 205–220).
3. The server computes word-error-rate between the submitted transcript and the target sentence (`server.ts` 1147, 1176). **No audio is uploaded in this path**, so the endpoint measures text similarity, not pronunciation.
4. If recognition fails (unsupported browser, denied mic, network error), the catch block POSTs **the target phrase itself** as `audioText` (`LessonPlayer.tsx` 222–250). The server then compares the target to itself and returns ~100%.
5. `avgScore` feeds the celebration modal and `onComplete(lesson.id, xpReward, avgScore)` (`LessonPlayer.tsx` 271–275), which the parent stores in the profile (`App.tsx` 287–319).

**Impact:** a learner can receive full XP and a high pronunciation score with no microphone, or with a wrong-language recognition model. Because client XP is trusted, this also inflates the daily aggregate.

---

## 3. Path B — the only real audio evaluation

- `SpeakingCityModal.tsx` records audio and sends `audioBase64` to `/api/sulti/speaking-mission/evaluate` (`server.ts` 1273+), which can use Gemini audio.
- Requires a verified Supabase user (`requireVerifiedUser`, `server.ts` 365–372).
- Language support: `if (saved === 'filipino' || saved === 'cebuano')` — **`english` is rejected and falls back to Cebuano** (`SpeakingCityModal.tsx` 42–45).
- Progress inside the modal is its own local state; it does not update the Curriculum Hub or Language Journey.

---

## 4. Scenario Practice

- Entry: `ScenarioAdventureModal.tsx`.
- Same language restriction — English rejected, falls back to Cebuano (`39–42`).
- Uses `/api/sulti/scenario-adventure/evaluate` (`server.ts` 1442+), which does accept audio.
- Its progress is local to the modal.

---

## 5. Pronunciation Lab (module 5)

- `PRONUNCIATION_DRILLS` data is real static content.
- Scoring is `setTimeout` + random number generation (`QuickPracticeModal.tsx` 1260–1268). No API call.
- Feedback text and concordance are generated from the random score, so they are not diagnostic.

---

## 6. Voice integrity findings

| ID | Finding | Severity | Evidence |
|---|---|---|---|
| V-1 | Fallback submits the expected sentence as the learner's transcript → ~100% score | **P0** | `LessonPlayer.tsx` 222–250 |
| V-2 | Lesson path uploads no audio; server does text WER | High | `LessonPlayer.tsx` 205–220; `server.ts` 1147, 1176 |
| V-3 | Recognition locale hardcoded `fil-PH` regardless of target language | High | `LessonPlayer.tsx` 162–176 |
| V-4 | Inline Voice preview is simulated (fixed 96/95%) | Medium | `QuickPracticeModal.tsx` 879–893 |
| V-5 | Pronunciation Lab score is random | Medium | `QuickPracticeModal.tsx` 1260–1268 |
| V-6 | English unsupported in both real voice modals; silent Cebuano fallback | High | `SpeakingCityModal.tsx` 42–45; `ScenarioAdventureModal.tsx` 39–42 |

---

## 7. What is genuinely good

- The real evaluation endpoints **exist and are guarded** (`requireVerifiedUser`).
- `SpeakingCityModal` already implements a full audio → evaluate → feedback loop that the rest of the app could reuse.
- UI states (recording, processing, error, retry) are present in the full modal.

---

## 8. Recommended fixes (not authorized)

1. **Remove V-1 entirely.** On failure, show "we couldn't hear you — try again", award no score.
2. Always upload audio via `MediaRecorder` → `audioBase64` for pronunciation scoring.
3. Derive the recognition language from `selectedLanguage` (`ceb-PH` / `fil-PH` / `en-US`).
4. Reuse `SpeakingCityModal`'s evaluation path for the inline preview and Pronunciation Lab.
5. Add English content or explicitly disable voice modules for English with a clear message.
