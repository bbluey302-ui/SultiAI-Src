# SULTI AI — Learn Dashboard Audit (Index)

**Project:** SultiAI
**Audit scope:** The **Learn** tab only — what a learner actually sees: **Language Journey** and **Curriculum Hub**, plus the screens/modals those two open.
**Mode:** Read-only. No application code, migration, database record, environment variable, or dependency was changed.
**Evidence:** Every finding cites a real file and line in this workspace. No invented features, courses, tables, tests, or results.
**Date:** Oct 24, 2026

> The single consolidated report is still available at
> `SULTI-AI-Learn-Dashboard-Audit-Report.md`.
> This folder now contains the same findings split into reviewable documents.

---

## Documents

| File | Covers |
|---|---|
| [01-executive-summary.md](01-executive-summary.md) | Plain-language verdict, top findings, actual architecture, screen map |
| [02-dashboard-and-courses.md](02-dashboard-and-courses.md) | Curriculum Hub (all 7 sections), 6-course inventory, Course Roadmap, Lesson Player |
| [03-language-selection.md](03-language-selection.md) | Language identifiers, storage, per-screen consistency, per-language progress gap, dialect vs language |
| [04-thirteen-modules.md](04-thirteen-modules.md) | All 13 toolkit modules: content source, language behavior, tracking, status |
| [05-voice-practice.md](05-voice-practice.md) | Voice Practice end-to-end, Speaking City, pronunciation scoring, simulation risks |
| [06-database-and-progress.md](06-database-and-progress.md) | XP/streak/badges source of truth, persistence, backend routes, tables, integrity |
| [07-current-user-flows.md](07-current-user-flows.md) | Language Journey section-by-section, verified Mermaid flowchart, numbered learner journey, disconnected wiring |
| [08-issues-and-recommendations.md](08-issues-and-recommendations.md) | P0–P3 issues, strengths, unverified items, implementation order, open decisions |

---

## Status legend (used in every document)

| Label | Meaning |
|---|---|
| **Verified** | Direct source-code evidence supports the behavior. |
| **Partially implemented** | Some behavior exists; the flow is incomplete. |
| **UI only** | Interface exists; the action has no real effect. |
| **Static/hardcoded** | Displayed value/content is a literal in the source. |
| **Broken** | A specific implementation defect is provable from the code. |
| **Unverified** | Evidence is insufficient (e.g., live DB rows). |
| **Missing** | The feature or connection could not be found. |

---

## Confirmed: the Learn tab has two views

`src/components/LearnScreen.tsx` line 35 sets `currentView` with default `'dashboard'`.
Lines 62–92 render exactly two switcher buttons:

1. **Language Journey** → `journey_map` → `src/components/learn/LanguageJourneyMap.tsx`
2. **Curriculum Hub** → `dashboard` → `src/components/learn/LearnDashboard.tsx`

Everything else is a sub-screen or modal:
`CourseRoadmapView` (course detail), `LessonPlayer`, `QuickPracticeModal` (13 modules),
`BadgesModal`, `LevelMasteryModal`, `LearningToolkitDrawer`, `TutorDirectoryModal`,
`SpeakingCityModal`, `ScenarioAdventureModal`, and the certificate modal inside `LearnScreen`.

---

## Top 8 findings

| # | Finding | Status | Key evidence |
|---|---|---|---|
| 1 | Language Journey never advances — `setCompletedChallengeIds` is never called | Broken | `LanguageJourneyMap.tsx` 64–67 |
| 2 | Curriculum Hub has no "Continue" — `nextLesson` prop is ignored | Broken | `LearnDashboard.tsx` 19–34; `LearnScreen.tsx` 43–44 |
| 3 | "Your Progress" values (72/86/74/82%, 7 days, 1,240 XP, 6 badges) are literals | Static/hardcoded | `LearnDashboard.tsx` 553–609 |
| 4 | Course/module progress percentages are literals, never change | Static/hardcoded | `coursesData.ts`; `toolkitModulesData.ts` |
| 5 | XP + completed lesson IDs are localStorage-only; logout/login resets them | Broken | `App.tsx` 136–158, 437–492 |
| 6 | Speech score can be inflated — fallback sends the expected sentence as "transcript" | Broken | `LessonPlayer.tsx` 222–250; `server.ts` 1147 |
| 7 | Certificate is static and clickable while still locked | Static/hardcoded | `LearnScreen.tsx` 53, 178–198; `CourseRoadmapView.tsx` 337–351 |
| 8 | English is not supported by Voice Practice or Scenario Practice | Partially implemented | `SpeakingCityModal.tsx` 42–45; `ScenarioAdventureModal.tsx` 39–42 |

---

## What was NOT verified (honest limits)

- Live Supabase rows and runtime RLS enforcement (only migrations/server code were read).
- Production deployment behavior (Render/Vercel env-dependent).
- Actual microphone/Gemini transcription quality (no live paid AI calls made).
- `server/src/` runtime behavior (confirmed unused by the Learn UI, not fully audited).
- `SpeakingCityModal` / `ScenarioAdventureModal` internals beyond their integration points.

**No implementation should begin until you explicitly authorize it.**


