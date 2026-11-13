# 08 — Issues, Strengths, Unverified Items & Recommendations

Back to [README](README.md) · Prev: [07-current-user-flows.md](07-current-user-flows.md)

**No implementation is authorized by this document.** It records findings and a proposed order.

---

## 1. Prioritized issues

### P0 — Critical (data integrity / core learning flow)

| ID | Issue | Evidence | Impact |
|---|---|---|---|
| P0-1 | **Journey never advances.** Challenge completion frozen; setter unused. | `LanguageJourneyMap.tsx` 64–67; no `setCompletedChallengeIds` call in repo | Language Journey non-functional as progression |
| P0-2 | **No resume path in Curriculum Hub.** `nextLesson` prop ignored. | `LearnScreen.tsx` 43–44, 116–117; `LearnDashboard.tsx` 19–34 | Learner cannot continue where they left off |
| P0-3 | **Progress not restorable.** Lesson IDs/total XP live only in localStorage and are wiped on logout. | `App.tsx` 136–158, 437–492; `/api/learner/sync` has no reader | Cross-device/re-login progress loss |
| P0-4 | **Speech score can be fabricated.** Fallback sends the expected text as the transcript. | `LessonPlayer.tsx` 222–250; `server.ts` 1147, 1176 | XP/accuracy granted without speaking |
| P0-5 | **Client-submitted XP is trusted.** No server verification of lesson completion/XP. | `App.tsx` 298–318; `learnerActivity.ts` 300–303 | Daily XP/streak inflatable |

### P1 — High

| ID | Issue | Evidence |
|---|---|---|
| P1-1 | All Curriculum Hub progress numbers are literals and contradict the real profile | `LearnDashboard.tsx` 553–609 |
| P1-2 | Course and module progress are static; never change after lessons | `coursesData.ts`; `toolkitModulesData.ts` |
| P1-3 | Roadmap status index-based; assessment always locked; certificate reachable while locked | `CourseRoadmapView.tsx` 32–44, 337–351 |
| P1-4 | No per-language progress; switching language keeps the same global progress | `App.tsx` 298–314; `types/index.ts` `UserProfile` |
| P1-5 | No prerequisites/locking for the 13 modules | `LearnDashboard.tsx` 422–474 |
| P1-6 | Badges never unlock; static `unlocked` flags/dates | `languageJourneyData.ts` 44–179 |
| P1-7 | English unsupported in Voice Practice and Scenario Practice | `SpeakingCityModal.tsx` 42–45; `ScenarioAdventureModal.tsx` 39–42 |
| P1-8 | Lesson Player sends no audio and hardcodes `lang='fil-PH'` | `LessonPlayer.tsx` 162–176; `utils/audio.ts` |

### P2 — Medium

| ID | Issue | Evidence |
|---|---|---|
| P2-1 | Reading shows the Filipino story when English is selected | `QuickPracticeModal.tsx` 1645–1650 |
| P2-2 | Review Center uses 3 hardcoded Cebuano mistakes for all users/languages | `QuickPracticeModal.tsx` 1851–1855 |
| P2-3 | Inline Voice Practice preview is simulated (fixed 96/95%) | `QuickPracticeModal.tsx` 879–893 |
| P2-4 | Pronunciation Lab score is random, no API | `QuickPracticeModal.tsx` 1260–1268 |
| P2-5 | Certificate is static: fixed code `SULTI-JMC-2026-GD88`, fixed 92% / 8 levels / 40 challenges | `LearnScreen.tsx` 53, 178–198 |
| P2-6 | Daily goals and Learn Journey diagram are display-only | `LearnDashboard.tsx` 616–722 |
| P2-7 | `ApplyTutorModal` unreachable | `LearnDashboard.tsx` 68, 735–738 |
| P2-8 | Journey XP strip always shows 72% | `LanguageJourneyMap.tsx` 261, 268 |
| P2-9 | Language preference not persisted server-side; sync payload omits it | `App.tsx` 254–269 |

### P3 — Low

| ID | Issue | Evidence |
|---|---|---|
| P3-1 | Tutor data/booking is static/localStorage only | `tutorsData.ts` 188–410 |
| P3-2 | Dialect vs learning language may confuse learners (two separate controls) | `DialectModal.tsx`; `LearnDashboard.tsx` 124–149 |
| P3-3 | Tablet layout: app container capped at `max-w-md` | `App.tsx` 544; `LearnScreen.tsx` 59 |
| P3-4 | Dead constants/props add maintenance noise | see [07](07-current-user-flows.md) Part 4 |

---

## 2. Current system strengths (preserve)

1. **Clear two-tab information architecture** — Language Journey vs Curriculum Hub is understandable and easy to extend.
2. **Supabase Auth is the only identity source** — no demo/mock login; sessions restored from JWT; sign-out clears cached data deliberately.
3. **Real daily-activity persistence already exists** — `learner_daily_activity` + server-side date + rate limiting + atomic RPC is a solid base for streaks and goal tracking.
4. **SULTI backend is real and guarded** — chat, transcription, speaking-mission and scenario-evaluation routes exist and require a verified user.
5. **Rich, consistent UI system** — dark mode, mobile-first, 44px+ touch targets, confetti, loading states; good foundation to wire data into.
6. **Complete content inventory** — 6 courses, 13 levels across 3 languages, 13 module datasets, tutor profiles, badge definitions. Content authoring is largely done; what is missing is data binding and persistence.

---

## 3. Unverified / not checked

| Item | Why |
|---|---|
| Live Supabase rows (`xp_logs`, `learner_accounts`, `learner_daily_activity`) | No live DB access; findings are from migrations and server code |
| RLS enforcement at runtime | Policies read from migration SQL only |
| Production deployment behavior (Render/Vercel) | Not exercised; depends on env vars |
| Actual microphone accuracy / Gemini transcription quality | No live calls performed (avoids paid credits) |
| `server/src/` runtime | Confirmed unused by the Learn UI, but not fully audited |
| `ScenarioAdventureModal` / `SpeakingCityModal` internals | Audited at integration level (routes, language support), not line-by-line |

---

## 4. Recommended implementation order (do not implement until authorized)

### Phase 1 — Make the Hub truthful (P1-1, P1-2, P2-6)

1. Replace literals in `LearnDashboard.tsx` (553–609) with `profile.streakDays`, `profile.xp`, `profile.speechScoreAverage`, `profile.vocabularyMastered`, and real badge counts.
2. Derive course % and module % from `completedLessons` / real module progress instead of `coursesData.ts` / `toolkitModulesData.ts` literals.
3. Wire "Today's Goals" to `activitySummary` (`todayXp`, `todayMinutes`, `daysGoalMet`).
4. Add a resume card using the already-passed `nextLesson` / `nextLessonModule`.

### Phase 2 — Make progression real (P0-1, P0-2, P1-3, P1-6)

5. Track challenge completion: on lesson completion, map `lesson.id` → challenge ID and call `setCompletedChallengeIds`; persist per user.
6. Replace index-based roadmap status with lesson/challenge-derived status; gate assessment and certificate.
7. Implement badge awarding from real counters; remove fixed `unlocked` data.

### Phase 3 — Make persistence authoritative (P0-3, P0-5)

8. Add `completed_lessons (user_id, lesson_id, language, completed_at)` and read it back on login to hydrate the profile.
9. Add a server-verified `POST /api/learner/lesson-complete` that validates the lesson, awards XP idempotently (reuse `award_xp()`), and returns canonical totals.
10. Stop trusting client XP; read totals from the server.

### Phase 4 — Language correctness (P1-4, P1-7, P2-1, P2-9)

11. Add `target_language` to profile/DB and include it in `/api/learner/sync`.
12. Scope progress/XP/completed lessons by language.
13. Add English to `SpeakingCityModal` and `ScenarioAdventureModal`, or explicitly hide those modules when English is selected.
14. Fix the Reading English fallback and make Review Center language-aware.

### Phase 5 — Voice integrity (P0-4, P2-3, P2-4)

15. Always upload audio (`MediaRecorder` → `audioBase64`) to `/api/sulti/whisper-transcribe`; remove the "send the answer as transcript" fallback.
16. Replace simulated toolkit voice/pronunciation with the real evaluation endpoints.
17. Set speech recognition locale from the selected language.

### Phase 6 — Polish (P2-5, P2-7, P3)

18. Real certificate generation (server-issued code, gated by assessment).
19. Expose the tutor application modal; decide booking source of truth.
20. Clarify dialect vs learning language; tablet layout.

---

## 5. Questions requiring your decision

1. **Language of record:** Should progress/XP/lessons be tracked **per learning language** (recommended) or remain one global account? This determines the DB schema and dashboard copy.
2. **Source of truth:** Should the server (`completed_lessons` + `award_xp()`) become the authority for XP/progress, with localStorage only as cache? Any reason to keep offline-first behavior?
3. **English support in Voice/Scenario:** Add English content, or hide those two modules when English is selected?
4. **Certificate:** Who issues it (SULTI vs Jose Maria College), and what exactly must be completed before it unlocks?
5. **Tutor bookings:** Keep localStorage-only, or add a server table/route?
6. **Scope for the next prompt:** Phase 1 (truthful dashboard wiring) only, or Phases 1–3 (wiring + real progression + server persistence)?

---

**End of split audit.** Every finding cites a real file and line. No application code, migration, environment value, or database record was changed during this audit. The consolidated original remains at `SULTI-AI-Learn-Dashboard-Audit-Report.md`.
