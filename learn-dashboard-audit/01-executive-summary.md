# 01 — Executive Summary

Back to [README](README.md) · Next: [02-dashboard-and-courses.md](02-dashboard-and-courses.md)

**Scope:** The Learn tab as a learner experiences it.
**Status of this document:** Read-only audit, source-code evidence only.

---

## 1. What the learner sees

The Learn tab is one screen with a two-button view switcher (`src/components/LearnScreen.tsx` 62–92):

| Button | Internal view | Component |
|---|---|---|
| **Language Journey** | `journey_map` | `src/components/learn/LanguageJourneyMap.tsx` |
| **Curriculum Hub** (default) | `dashboard` | `src/components/learn/LearnDashboard.tsx` |

A third view, `course_view` → `CourseRoadmapView.tsx`, opens when a course card is tapped.
All 13 "modules" open inside a single modal, `QuickPracticeModal.tsx`.

---

## 2. Verdict in plain language

The Learn experience is a **polished UI over mostly static content**.

- The dashboard **looks** data-driven, but the displayed progress numbers are typed-in literals. A brand-new account (`xp: 0`, `streakDays: 0`, `completedLessons: []` — `App.tsx` 44–65) still sees **72% course progress, 7-day streak, 1,240 XP, 6 badges** in Curriculum Hub (`LearnDashboard.tsx` 553–609).
- **Language Journey cannot progress.** Challenge completion is a frozen, hardcoded array; the setter that would advance it (`setCompletedChallengeIds`) is never called (`LanguageJourneyMap.tsx` 64–67).
- **Curriculum Hub cannot resume.** `LearnScreen` computes `nextLessonToLearn` and passes it down, but `LearnDashboard` never renders it (`LearnScreen.tsx` 43–44, 116–117; `LearnDashboard.tsx` 19–34).
- **Course roadmaps are a hardcoded index rule,** not prerequisites: steps 0–1 = Complete, step 2 = Current, rest = Locked (`CourseRoadmapView.tsx` 32–44).
- **Persistence is partial.** Lesson completion posts `{ minutes: 5, xp, lessons: 1 }` to `/api/learner/activity`, which writes `learner_daily_activity` with a server-assigned date and rate limiting. But lesson IDs, total XP, badges, and journey progress are **not** stored or restored. On re-login the profile starts from zero.
- **SULTI is real.** `/api/sulti/chat`, `/api/sulti/whisper-transcribe`, speaking-mission and scenario evaluation routes exist in the repository-root `server.ts` and require a verified Supabase user.

---

## 3. Top findings

| # | Finding | Status | Evidence |
|---|---|---|---|
| 1 | Journey challenge completion frozen; setter unused | Broken | `LanguageJourneyMap.tsx` 64–67 (no other reference in `src/`) |
| 2 | No resume/continue in Curriculum Hub | Broken | `LearnDashboard.tsx` 19–34; `LearnScreen.tsx` 43–44 |
| 3 | Dashboard progress numbers are literals | Static/hardcoded | `LearnDashboard.tsx` 41–44 vs 553–609 |
| 4 | Course + module progress never change | Static/hardcoded | `coursesData.ts` 46–340; `toolkitModulesData.ts` 23–191 |
| 5 | XP and completed lessons lost on re-login | Broken | `App.tsx` 136–158, 437–492 |
| 6 | Speech score can be faked by fallback | Broken | `LessonPlayer.tsx` 222–250; `server.ts` 1147 |
| 7 | Certificate static, reachable while locked | Static/hardcoded | `LearnScreen.tsx` 53, 178–198; `CourseRoadmapView.tsx` 337–351 |
| 8 | English missing in Voice/Scenario modules | Partially implemented | `SpeakingCityModal.tsx` 42–45; `ScenarioAdventureModal.tsx` 39–42 |
| 9 | `ApplyTutorModal` can never open | UI only | `LearnDashboard.tsx` 68, 735–738 |
| 10 | Daily goals + Learn Journey diagram are display-only | Static/hardcoded | `LearnDashboard.tsx` 616–722 |

---

## 4. Actual architecture (Learn-relevant)

| Layer | What it actually is | Evidence |
|---|---|---|
| Learner app | React 19 + Vite 8 + TypeScript + Tailwind v4 | `package.json` 21–47 |
| Entry point | `npm run dev` → `tsx server.ts`; same file serves the built SPA | `package.json` 7–13; `server.ts` 1815–1825 |
| Learner backend | Repository-root `server.ts` (Express) | `server.ts` 49, 223, 268, 375, 1142 |
| Second backend | `server/src/` (`/api/learning/*`, `/api/whisper/*`) — **not called by the Learn UI** | `server/src/index.ts` 217–251; no `/api/learning` in `src/` |
| Auth | Supabase Auth (email/password + Google) | `src/context/AuthContext.tsx` 176–208 |
| Database | Supabase/Postgres; SQL in `supabase/migrations/` | e.g. `20261023000001_add_learner_daily_activity.sql` |
| Progress state | React state + `localStorage` (`sultiai_user_profile`) | `App.tsx` 136–168 |
| Language state | `localStorage` (`sultiai_selected_language`) | `LearnDashboard.tsx` 47–55; `LanguageJourneyMap.tsx` 41–49 |
| AI | Google GenAI (`@google/genai`) in `server.ts` | `server.ts` 375, 945, 1012, 1142 |

---

## 5. Screen map

| Level | Screen / overlay | Component | Opened by |
|---|---|---|---|
| 1 | Language Journey | `LanguageJourneyMap.tsx` | Switcher button |
| 1 | Curriculum Hub | `LearnDashboard.tsx` | Switcher button (default) |
| 2 | Course Roadmap | `CourseRoadmapView.tsx` | Course card / "Explore Roadmap" |
| 2 | Lesson Player | `LessonPlayer.tsx` | Roadmap step "Start" / journey node |
| 2 | Quick Practice (13 modules) | `QuickPracticeModal.tsx` | Toolkit card / "13 Tools" drawer |
| 3 | Speaking City | `SpeakingCityModal.tsx` | Voice module → "Explore The Speaking City Map" |
| 3 | Scenario Adventure | `ScenarioAdventureModal.tsx` | Scenario module |
| 2 | Badges | `BadgesModal.tsx` | Journey header |
| 2 | Level requirements | `LevelMasteryModal.tsx` | Locked level |
| 2 | Tutor directory | `TutorDirectoryModal.tsx` | "Find a Tutor" |
| 2 | Certificate | inline modal in `LearnScreen.tsx` | Journey final level / roadmap certificate step |
| — | SULTI chat | `SultiScreen.tsx` | CTAs in both tabs |

---

## 6. One-line summary per view

- **Curriculum Hub:** good catalog layout; fake progress; real tutor directory shell; 13 static practice tools; real SULTI hand-off.
- **Language Journey:** excellent visual map; content is real static syllabus data; progression state is not connected to anything.
- **Course Roadmap:** readable syllabus; status is index-based; assessment missing; certificate premature.
- **Lesson Player:** the only place where a lesson truly completes and XP is added — locally, plus a daily aggregate POST.
