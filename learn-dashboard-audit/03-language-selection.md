# 03 — Language Selection Audit

Back to [README](README.md) · Prev: [02-dashboard-and-courses.md](02-dashboard-and-courses.md) · Next: [04-thirteen-modules.md](04-thirteen-modules.md)

**Question answered here:** How does language selection actually work across the Learn tab, and is progress tracked per language?

---

## 1. The three concepts

| Concept | Values | Where stored | What it controls |
|---|---|---|---|
| **Target learning language** | `cebuano` \| `filipino` \| `english` | `localStorage.sultiai_selected_language` | Journey data, course filter, toolkit datasets |
| **Target dialect** | `davao_bisaya` \| `cebuano_standard` \| `boholano` | `profile.targetDialect` (in `sultiai_user_profile`) | SULTI vocabulary/prompts only |
| **Speech locale** | `fil-PH` (hardcoded) | — | Web Speech API recognition |

These are **not interchangeable** in the code, even though the UI sometimes presents them side by side.

Evidence: `src/types/index.ts` line 3 (`MajorLanguageId`), `src/components/DialectModal.tsx`, `src/utils/audio.ts` speech recognition.

---

## 2. Where each screen gets its language

| Screen | State | Seeded from localStorage | Languages honored | Evidence |
|---|---|---|---|---|
| Language Journey | `selectedLanguage` | yes | cebuano, filipino, english | `LanguageJourneyMap.tsx` 41–49, 159–163 |
| Curriculum Hub courses | `courseCategoryFilter` | yes | cebuano, filipino, english | `LearnDashboard.tsx` 47–60, 124–149 |
| QuickPractice modal | `selectedCategory` | yes + resync on open | cebuano, filipino, english | `QuickPracticeModal.tsx` 548–566 |
| Speaking City | `selectedLanguage` | yes, but **rejects `english`** | cebuano, filipino only | `SpeakingCityModal.tsx` 40–48 |
| Scenario Adventure | `selectedLanguage` | yes, **rejects `english`** | cebuano, filipino only | `ScenarioAdventureModal.tsx` 39–42 |
| Lesson Player speech | none | no | `fil-PH` always | `LessonPlayer.tsx` 162–176 |
| SULTI chat | `targetLanguage` | no (defaults `cebuano`) | cebuano, filipino, english | `SultiScreen.tsx` 51 |

### Practical result of choosing **English**

- Language Journey: English levels appear (2 levels).
- Curriculum Hub: one English course appears.
- Toolkit: English datasets are used — **except** Reading, which shows the Filipino story (bug, `QuickPracticeModal.tsx` 1645–1650).
- Voice Practice (Speaking City): falls back to **Cebuano** content because `english` is not accepted.
- Scenario Practice: falls back to **Cebuano** content for the same reason.
- Pronunciation recognition: still `fil-PH`.

Status: **Broken** for the English track; **Partially implemented** for Filipino.

---

## 3. Is progress preserved when switching languages?

Yes — but only because **there is no per-language progress at all**.

`UserProfile` has a single `xp`, `completedLessons[]`, `streakDays`, `vocabularyMastered`, `speechScoreAverage` (`src/types/index.ts` 119+). Switching language does not scope any of these fields.

Consequences:
- Completing a Cebuano lesson also counts toward the same XP/lesson count shown while English is selected.
- Journey challenge IDs include the language prefix (`ceb_…`, `fil_…`, `eng_…`), but the Journey reads only a frozen hardcoded array, so no language is affected anyway.
- Badges mix languages in one list (`MASTER_BADGES` includes Cebuano/Filipino/English starters).

Status: **Missing** (per-language progress).

---

## 4. Is the language preference persisted server-side?

**No.** `/api/learner/sync` sends `targetDialect` but **not** the learning language (`App.tsx` 254–269). No learner-facing code reads or writes a `target_language` column. Clearing site data resets the selection to `cebuano`.

Status: **Missing** (server persistence of language preference).

---

## 5. What happens when a language has no content?

| Language | Journey levels | Courses | Voice | Scenario | Toolkit |
|---|---|---|---|---|---|
| Cebuano | 9 | 3 | Yes | Yes | Yes |
| Filipino | 2 | 2 | Yes | Yes | Yes |
| English | 2 | 1 | **No** (falls back to Cebuano) | **No** (falls back to Cebuano) | Yes, except Reading text |

The UI does **not** warn the learner or disable the module; it silently serves Cebuano content under an English selection. That is the single most confusing language behavior in the Learn tab.

---

## 6. Language labels audit

| Label in UI | Meaning in code | Notes |
|---|---|---|
| "Cebuano / Bisaya" | `cebuano` | Target language; also used for Davao/Bohol dialects |
| "Sinugboanong Binisaya" | `cebuano` native name | Display only |
| "Filipino / Tagalog" | `filipino` | Target language |
| "Wikang Filipino" | `filipino` native name | Display only |
| "English" / "🌎 English" | `english` | Target language |
| "Davao Bisaya" | `davao_bisaya` dialect | Not a language |
| "Standard Cebuano" | `cebuano_standard` dialect | Not a language |
| "Boholano (Bol-anon)" | `boholano` dialect | Not a language |

Status: **Verified** identifiers; the dialect/language distinction is not explained in the UI.

---

## 7. Answers to the required questions

1. **Can a learner select a target learning language?** Yes — 3 options in both tabs.
2. **Does it control course content?** Yes — course filter.
3. **Does it control lessons and activities?** Partially — Journey data and toolkit datasets; not roadmap steps or synthesized lessons.
4. **Does it control Voice Practice?** Partially — inline datasets yes; full Speaking City no for English.
5. **Does it affect SULTI interactions?** Not from the Learn tab; SULTI keeps its own `targetLanguage` state.
6. **Is progress preserved when switching?** It never changes, because it is global.
7. **Is progress tracked independently per language?** No.
8. **Are selections consistent across screens?** Mostly yes via localStorage, with the English exceptions above.
9. **What happens with no content?** Silent fallback to Cebuano (voice/scenario) or Filipino (reading).

---

## 8. Recommended minimum fixes (for later authorization)

1. Add `target_language` to profile + DB and include it in `/api/learner/sync`.
2. Scope `completedLessons`, XP and challenge completion by language.
3. Add English to Speaking City / Scenario, or disable those modules with a clear message.
4. Fix Reading English fallback; make Review Center language-aware.
5. Set speech recognition locale from the selected language.
