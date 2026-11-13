# 04 — The 13 Toolkit Modules

Back to [README](README.md) · Prev: [03-language-selection.md](03-language-selection.md) · Next: [05-voice-practice.md](05-voice-practice.md)

**File:** `src/components/learn/QuickPracticeModal.tsx` (1,900+ lines).
**Entry points:** Learning Toolkit cards (`LearnDashboard.tsx` 396–475), "13 Tools" drawer in Language Journey, and module chips.

All 13 modules are **tabs inside one modal**. Content is inline static data in this file (or delegated to a full modal). Each has a 3-language switcher (lines 748–801) seeded from `localStorage.sultiai_selected_language`.

---

## 1. Module-by-module audit

| # | Module | Content source | Language handling | Progress / tracking | Backend | Status |
|---|---|---|---|---|---|---|
| 1 | **Voice Practice** | `SPEAKING_CITY_LOCATIONS` (cebuano/filipino/english) + full `SpeakingCityModal` | Per-language datasets in the inline preview | Local `xpEarned`; full modal has its own progress | Inline preview: **simulated** `setTimeout` with hardcoded 96%/95% (879–893). Full modal: `/api/sulti/speaking-mission/evaluate` | Partially implemented |
| 2 | **Scenario Practice** | `ScenarioAdventureModal` → `getScenariosForLanguage` | cebuano/filipino only | Own stored progress | `/api/sulti/scenario-adventure/evaluate` | Partially implemented |
| 3 | **Phrasebook** | `PHRASES_BY_CATEGORY` | 3 languages | Local pins only | None | UI only |
| 4 | **Flashcards** | `FLASHCARDS_BY_CATEGORY` | 3 languages | Local mastery boxes | None | UI only |
| 5 | **Pronunciation Lab** | `PRONUNCIATION_DRILLS` | 3 languages | Local concordance | **No API call** — `setTimeout` generates a random score (1260–1268) | Simulated |
| 6 | **Grammar** | `GRAMMAR_PUZZLES` | 3 languages | Local puzzle state | None | UI only |
| 7 | **Vocabulary Notebook** | `THEMATIC_WORD_VAULTS` | 3 languages | Local mastered words | None | UI only |
| 8 | **Listening** | `LISTENING_CHALLENGES` | 3 languages | Local reveal state | None | UI only |
| 9 | **Writing** | Inline prompt + client-side check | 3 languages | Local feedback | None | UI only |
| 10 | **Reading** | Inline story + 1 MCQ | **Bug:** `selectedCategory === 'cebuano' ? Cebuano : Filipino` — English shows the Filipino story (1645–1650) | Local answer | None | Partially implemented |
| 11 | **Sulti Switch** | `SULTI_SWITCH_ITEMS` | 3 languages | Local combo | None | UI only |
| 12 | **Culture Notes** | `CULTURE_LORE` | 3 languages | Local stamp | None | UI only |
| 13 | **Review Center** | **Hardcoded 3 Cebuano mistakes** (1851–1855), not derived from user errors | Not language-aware; same list for every language | Local cleared list | None | Static/hardcoded |

---

## 2. Shared mechanics

| Mechanic | Behavior | Evidence |
|---|---|---|
| XP award | `awardXp()` updates only the modal header counter and fires confetti | 667–675 |
| XP persistence | None — closing the modal discards it; profile is not informed | `QuickPracticeModal.tsx` 667–675 |
| Gamification strip | `MODULE_GAMIFICATION_MATRIX` renders a description only | 739–748 |
| Progress bars | Per-module local state; reset on unmount | module-local `useState` |
| Backend calls | Only modules 1 (full map) and 2 | see table |
| Error handling | Local try/catch with fallback content; no retry | module-local |

---

## 3. What this means for a learner

- Opening any module **feels** like a lesson, but 11 of 13 never leave the browser.
- Scores in Pronunciation Lab and the inline Voice preview are **random or fixed**, not measured.
- XP shown inside the modal is **discarded** when the modal closes, so the header XP never reflects toolkit work.
- English learners get Filipino reading content and Cebuano voice/scenario content.

---

## 4. Minimum truthful behavior (future work, not authorized)

1. Either hide modules that lack real evaluation, or label them "Practice (not scored)".
2. Route Pronunciation Lab and Voice preview through the real evaluation endpoints that already exist for Speaking City / Scenario.
3. Fix the Reading selector to include English.
4. Make Review Center read actual mistakes from the profile instead of a fixed list.
5. Propagate module XP through `onComplete` so it reaches the profile and daily activity.
