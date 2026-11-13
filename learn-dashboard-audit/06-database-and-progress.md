# 06 — Progress, XP, Streak, Badges & Backend

Back to [README](README.md) · Prev: [05-voice-practice.md](05-voice-practice.md) · Next: [07-current-user-flows.md](07-current-user-flows.md)

**Question answered here:** Where does every number on the Learn tab actually come from, what is persisted, and what does the backend really do?

---

## 1. Source of every displayed number

| Displayed value | Where it appears | Actual source | Persisted? |
|---|---|---|---|
| Course 72% / 25% / 10% / 30% / 15% / 40% | Curriculum Hub course cards | Literal `progressPercent` in `coursesData.ts` | No |
| Module 68% / 60% / 85% … | Toolkit cards | Literal in `toolkitModulesData.ts` | No |
| "Your Progress" 72% / 86% / 74% / 82% | Curriculum Hub | Literals (`LearnDashboard.tsx` 553–583) | No |
| 🔥 7 Days / ⭐ 1,240 XP / 🏆 6 Badges | Curriculum Hub | Literals (`LearnDashboard.tsx` 595–609) | No |
| Daily goals 3/5, bar 60% | Curriculum Hub | Literals (`LearnDashboard.tsx` 626, 678) | No |
| Journey XP `… / 500 XP (72%)` | Language Journey | `profile.xp` with fallback `420` + literal 72% (`LanguageJourneyMap.tsx` 212, 261, 268) | Profile localStorage only |
| Journey challenge completion | Language Journey | Frozen hardcoded array of 5 IDs | No |
| Badge unlocked state / dates | Badges modal | Static `MASTER_BADGES` | No |
| Header streak / XP / gems / hearts | App bar | Real `profile` state (`App.tsx` 520–523) | localStorage + write-only sync |
| Total XP after a lesson | Profile | `prev.xp + earnedXp` (`App.tsx` 301) | localStorage only |
| `completedLessons` | Profile | Client array (`App.tsx` 300) | localStorage only |
| Streak & weekly calendar | Home / Learn | Server-derived from `learner_daily_activity` | **Yes** |
| Daily XP / lessons count | Activity API | `learner_daily_activity.xp_earned`, `lessons_completed` | **Yes** (aggregate only) |

**Consequence:** the Curriculum Hub can show 1,240 XP / 7-day streak / 6 badges to a **brand-new** account while the header shows 0. The values are not bound to the profile.

---

## 2. Profile lifecycle

| Step | Behavior | Evidence |
|---|---|---|
| Fresh profile | `xp: 0`, `streakDays: 0`, `completedLessons: []`, etc. | `App.tsx` 44–65 |
| Hydration | Reads `localStorage.sultiai_user_profile` on mount | `App.tsx` 136–158 |
| Lesson completion | Adds XP/gems/vocab, appends lesson ID if new | `App.tsx` 287–319 |
| Activity sync | `POST /api/learner/activity` with `{ minutes: 5, xp, lessons: 1 }` | `App.tsx` 318 |
| Profile sync | `POST /api/learner/sync` (write-only) | `App.tsx` 254–269 |
| Logout | Deletes cached profile | `App.tsx` 437–492 |
| Re-login | Creates a **fresh** profile; only daily activity is restored | `App.tsx` 437–492; `learnerActivity.ts` |

So: **streak, weekly minutes and calendar survive; XP, lesson IDs, badges and journey state do not.** Language selection also resets (localStorage only, never synced).

---

## 3. XP / progress database objects

| Object | Defined in | Called from `src/`? | Notes |
|---|---|---|---|
| `award_xp()` RPC | `supabase/migrations/20261007130000_award_xp_and_tighten_grants.sql` | **No** | Has duplicate-award protection that is therefore unused |
| `xp_logs` | migrations | No | Server-side XP ledger not used by Learn |
| `learning_progress`, `completed_challenges`, `learning_sessions` | migrations | No | Not read/written by Learn flow |
| `learner_daily_activity` | `20261023000001_add_learner_daily_activity.sql` | **Yes** | Real streak source |
| `learner_accounts` | migration / server | Write via `/api/learner/sync` only | Never read back |

The second backend `server/src/` exposes `/api/learning/*` and `/api/whisper/*`, but **no Learn component calls it** (grep across `src/` finds no `/api/learning`).

---

## 4. Backend routes actually used by the Learn UI

| Frontend call | Handler | Behavior |
|---|---|---|
| `POST /api/learner/activity` | `server.ts` 284–317 | Auth required; server assigns date (Asia/Manila); validates non-negative values; 60/min rate limit; calls `recordActivity` → `learner_add_activity` RPC |
| `GET /api/learner/activity` | `server.ts` 268–282 | Returns week/month/streak summary |
| `POST /api/learner/sync` | `server.ts` 223–263 | Writes profile snapshot to `learner_accounts`; never read by the app |
| `POST /api/sulti/chat` | `server.ts` 375+ | Requires verified Supabase user (`requireVerifiedUser`, 365–372) |
| `POST /api/sulti/whisper-transcribe` | `server.ts` 1142+ | Text WER by default; audio path only if `audioBase64` is sent (Lesson Player does not) |
| `POST /api/sulti/speaking-mission/evaluate` | `server.ts` 1273+ | Used by full `SpeakingCityModal` |
| `POST /api/sulti/scenario-adventure/evaluate` | `server.ts` 1442+ | Used by `ScenarioAdventureModal` |

---

## 5. Integrity notes

- **Client-trusted XP:** lesson XP is computed and submitted by the client (`App.tsx` 301, 318). The server accepts any non-negative `xp` up to 100,000 per call (`learnerActivity.ts` 300–303). A modified client can inflate daily XP and streak-goal completion.
- **Duplicate protection** exists only in `award_xp()` (unused) and in the client's `completedLessons` de-duplication (`App.tsx` 299–300).
- **Service-role writes** to `learner_daily_activity` happen in `server.ts`; RLS at runtime was **not live-verified**.
- **Server-side date** prevents client clock manipulation for streaks — a genuine strength.

---

## 6. What "fixing persistence" would require (not authorized)

1. Add `completed_lessons (user_id, lesson_id, language, completed_at)` and read it on login.
2. Add `POST /api/learner/lesson-complete` that validates the lesson, awards XP idempotently (reuse `award_xp()`), and returns canonical totals.
3. Read totals from the server instead of trusting client XP.
4. Sync and restore `target_language` and `targetDialect`.
5. Optionally hydrate badges from real counters rather than static flags.
