# 02 — Curriculum Hub, Courses & Roadmaps, Lesson Player

Back to [README](README.md) · Prev: [01-executive-summary.md](01-executive-summary.md) · Next: [03-language-selection.md](03-language-selection.md)

**Primary file:** `src/components/learn/LearnDashboard.tsx` (745 lines)
**Default view:** yes (`LearnScreen.tsx` line 35).

---

## 1. Curriculum Hub — section by section

### 1.1 Courses & Roadmaps (lines 100–253)

| Aspect | Finding | Status |
|---|---|---|
| Language filter | 3 pills: Cebuano/Bisaya, Filipino/Tagalog, English | Verified |
| Filter persistence | Reads/writes `localStorage.sultiai_selected_language` | Verified |
| Filtering | `courses.filter(c => c.languageCategory === courseCategoryFilter)` (58–60) | Verified |
| Data source | `COURSES` static array (6 courses) | Static/hardcoded |
| Progress % | Literals: 72, 25, 10, 30, 15, 40 | Static/hardcoded |
| Lesson count | Literal `completedLessonsCount` / `totalLessons` | Static/hardcoded |
| Milestone ribbon | First 5 `roadmapSteps` labels only — no status | Static/hardcoded |
| CTA | Card click + "Explore Roadmap" → `onSelectCourse` | Verified |

### 1.2 Find a Tutor (lines 255–394)

| Aspect | Finding | Status |
|---|---|---|
| Tutor list | `INITIAL_TUTORS` — 6 tutors, all approved | Static/hardcoded |
| Custom tutors | Read from `localStorage.sulti_custom_tutors_v2` via `getApprovedTutors()` | Static/local |
| Directory | `TutorDirectoryModal` opens with a language filter | Verified |
| Booking | `saveTutorBooking()` writes `localStorage.sulti_tutor_bookings_v2` only | Static/local |
| Apply as tutor | `ApplyTutorModal` rendered but `showApplyTutorModal` is never set to `true` | UI only / unreachable |
| Contact | Hardcoded `mailto:genesis.diaz@jmc.edu.ph` | Static/hardcoded |

### 1.3 Learning Toolkit — 13 modules (lines 396–475)

| Aspect | Finding | Status |
|---|---|---|
| Data | `TOOLKIT_MODULES` — 13 entries | Static/hardcoded |
| Default view | First 6, then "View All 13 Modules →" | Verified |
| Progress bar | Literal `mod.progressPercent` | Static/hardcoded |
| Badge label | Literal `mod.gamificationBadge` | Static/hardcoded |
| Action | `onOpenQuickPractice(mod.id)` | Verified |
| Locking | None — everything is open day one | Missing |

### 1.4 Practice with SULTI (lines 477–527)

| Aspect | Finding | Status |
|---|---|---|
| CTA | "Start Speaking →" → `onOpenSulti('Kumusta SULTI! …')` | Verified |
| Effect | `App.tsx` switches to the `sulti` tab and passes the prompt | Verified (`App.tsx` 571–574) |
| Module chips | Static labels | Static/hardcoded |

### 1.5 Your Progress (lines 529–614)

Profile values are computed at lines 41–44 (`streak`, `xp`, `speakingScore`, `vocabCount`) and **never rendered**. Rendered values are literals:

| Row | Shown | Line | Real field available |
|---|---|---|---|
| Course Progress | 72% | 553, 556 | No |
| Speaking | 86% | 563 | `profile.speechScoreAverage` (unused) |
| Vocabulary | 74% | 573 | `profile.vocabularyMastered` (unused) |
| Pronunciation | 82% | 583 | None |
| Daily Streak | 🔥 7 Days | 595 | `profile.streakDays` (unused) |
| Experience | ⭐ 1,240 XP | 602 | `profile.xp` (unused) |
| Achievements | 🏆 6 Badges | 609 | Static badges |

Status: **Static/hardcoded**. Misleading for fresh accounts (`createFreshProfile` → `xp: 0`, `streakDays: 0`).

### 1.6 Today's Learning Goal (lines 616–681)

| Aspect | Finding | Status |
|---|---|---|
| Checklist | Voice Practice, Review Flashcards, Pronunciation Lab, Learn Vocabulary | Verified |
| Marks | First 2 hardcoded "Done"; others hardcoded "1 drill left" / "2 words left" | Static/hardcoded |
| Counter / bar | `3 / 5 completed`, width `60%` | Static/hardcoded |
| Link to real activity | None (`todayMinutes`, `activitySummary` unused here) | Missing |

### 1.7 Learn Journey diagram (lines 683–722)

Static START → Learn → Practice → Speak with SULTI → Feedback → Track Progress → Assessment → CERTIFICATE. **Static/hardcoded**.

### 1.8 Dead wiring in the Hub

| Item | Evidence |
|---|---|
| `nextLesson`, `nextLessonModule`, `onStartLesson` unused → no Continue CTA | 19–22, 31–34 |
| `ROADMAP_STEPS` declared, never rendered | 87–95 |
| `xp`, `streak`, `speakingScore`, `vocabCount` computed, never rendered | 41–44 |
| `showApplyTutorModal` never `true` | 68, 735–738 |
| `onAddPracticeMinutes` accepted by `LearnScreen`, unused | `LearnScreen.tsx` 19, 29 |

---

## 2. Course inventory (6 courses, `src/data/coursesData.ts`)

| ID | Title | Language | Level | Lessons | Completed | Progress | Roadmap steps | Content source |
|---|---|---|---|---|---|---|---|---|
| `course_beginner` | Beginner Bisaya | cebuano | Beginner | 10 | 7 | 72% | 7 (3 with `moduleId`) | Static |
| `course_everyday` | Everyday Bisaya | cebuano | Elementary | 12 | 3 | 25% | 7 (0 with `moduleId`) | Static |
| `course_conversational` | Conversational Bisaya | cebuano | Intermediate | 14 | 1 | 10% | 3 (0 with `moduleId`) | Static |
| `course_filipino_foundations` | Beginner Filipino | filipino | Beginner | 10 | 3 | 30% | 5 (0 with `moduleId`) | Static |
| `course_filipino_everyday` | Everyday Filipino | filipino | Elementary | 12 | 1 | 15% | 2 (0 with `moduleId`) | Static |
| `course_english_fluency` | English Fluency & Communication | english | Intermediate | 10 | 4 | 40% | 2 (0 with `moduleId`) | Static |

> Verified array length is **6** entries (`coursesData.ts` 32–363). There are 3 Cebuano, 2 Filipino, and 1 English course. The earlier "7 courses" wording in the consolidated report's strengths section is a miscount; this document follows the code.

Per-course fields present: `id`, `languageCategory`, `title`, `titleBisaya`, `subtitle`, `description`, `level`, `tag`, `accentColor`, `progressPercent`, `totalLessons`, `completedLessonsCount`, `estimatedHours`, `roadmapSteps[]`.
Per-step fields: `id`, `stepNumber`, `title`, `titleBisaya`, `description`, `lessonsCount`, optional `moduleId`, `isAssessment`, `isCertificate`.

**No course is derived from the database or from `profile.completedLessons`.**

---

## 3. Course Roadmap (`course_view`)

**File:** `src/components/learn/CourseRoadmapView.tsx`

| Aspect | Finding | Status |
|---|---|---|
| Header | Title, level, description, `course.progressPercent` literal | Static display |
| Step status | index 0–1 completed, index 2 current, rest locked | Static/hardcoded |
| Assessment | Always locked; no assessment UI exists | Missing |
| Certificate | Status from `progressPercent >= 100`, but button renders and is clickable even when locked | Broken |
| Lesson list | `step.moduleId` → module lessons; otherwise synthesized 3-activity lesson (flashcard + MCQ + pronunciation, 40 XP, 6 min) | Partially implemented |
| Start | `onStartLesson(les)` → Lesson Player | Verified |
| SULTI roleplay | `onOpenSulti('Gusto kong magpraktis …')` | Verified |
| Progress | `completedLessons` prop received but not used for step status | Missing |

Only `step_beg_1..3` reference real modules (`mod_1..3`); every Filipino/English step and 4 of 7 Cebuano steps synthesize lessons.

---

## 4. Lesson Player

**File:** `src/components/LessonPlayer.tsx`

| Aspect | Finding | Status |
|---|---|---|
| Activity types | flashcard, multiple_choice, pronunciation_drill, sentence_assembly | Verified |
| Completion | `onComplete(lesson.id, lesson.xpReward, avgScore)` (271–275) | Verified |
| Score default | 100 when no scored activity exists | Partially implemented |
| Parent handler | Adds XP/gems/vocab + lesson ID, then `recordActivity({minutes:5, xp, lessons:1})` (`App.tsx` 287–319) | Verified |
| Persistence | Daily aggregates only — no lesson IDs, no total XP, no badges, no journey state | Partially implemented |
| Pronunciation | Web Speech transcript → `/api/sulti/whisper-transcribe` with **text only**; server does text-vs-text WER | Partially implemented |
| Fallback | Sends the target sentence as the "transcript" → near-100% score | Broken |
| Recognition locale | Hardcoded `fil-PH` | Broken for English/Cebuano targets |

---

## 5. Summary

- The Hub's **structure and copy** are usable and worth keeping.
- Every number a learner sees there is **fiction** today.
- The only real learning loop is Lesson Player → local XP → daily aggregate POST.
- Course Roadmap is **presentation only** until step status is derived from real completion.
