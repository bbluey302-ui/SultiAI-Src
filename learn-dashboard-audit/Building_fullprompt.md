# SULTIAI LEARN DASHBOARD — MASTER AUDIT & STAGED IMPLEMENTATION PROMPT

## ROLE

You are a senior full-stack engineer, security auditor, and test engineer working on **SultiAI**, a React 19 + Vite + TypeScript + Tailwind CSS v4 application with an Express backend (`server.ts`) and Supabase (Auth + PostgreSQL).

Your task is to audit, secure, and progressively improve the existing **Learn Dashboard, Language Journey, Curriculum Hub, course roadmaps, lesson completion, language-specific progress, and related learning modules**.

The goal is to make the Learn experience accurate, functional, server-verified, and suitable for real users and capstone evaluation.

**This is not a rebuild.** Preserve the existing application, working features, design system, and existing SULTI functionality. Prefer the smallest safe changes that solve confirmed problems.

---

# PART 1 — NON-NEGOTIABLE RULES

## 1. Work in explicit stages

Work through the stages in order:

- Stage 0 — Repository safety and complete read-only audit
- Stage 1 — Conditional database security fix
- Stage 2 — Authoritative lesson completion and persistence
- Stage 3 — Real progress data and truthful Learn Dashboard UI
- Stage 4 — Language correctness
- Stage 5 — Voice integrity
- Stage 6 — Assessments, badges, and certificates
- Stage 7 — UI/UX polish and remaining integration issues

**Begin with Stage 0 only.**

After completing each stage:

1. Stop all work.
2. Produce the required stage report.
3. Identify all unresolved questions and risks.
4. Wait for my explicit instruction, such as `GO STAGE 1`.

Never automatically proceed to another stage. A successful build does not authorize you to start the next stage.

## 2. Inspect the actual repository before making claims

- Read the actual source code, configuration, tests, migrations, and Git history.
- Verify every finding against the current repository.
- Treat previous audits and line numbers as clues, not unquestionable facts.
- Never invent file paths, database tables, columns, SQL functions, API endpoints, lesson IDs, language mappings, or test results.
- Label findings `CONFIRMED`, `NOT FOUND`, `PARTIALLY VERIFIED`, or `UNVERIFIED`.
- If the available repository or environment cannot establish a fact, explicitly state what is missing.
- Never claim that a database policy is deployed merely because it appears in a local migration file.

## 3. Git and project safety

The working tree may contain important work unrelated to this task.

- Report the current branch, HEAD commit, staged changes, unstaged changes, untracked files, and deleted files.
- Summarize changes by directory and identify potentially unrelated changes.
- Inspect `.gitignore`, Git line-ending settings, and whitespace-only differences.
- Use `git diff --stat -w` and other read-only checks where appropriate.
- Determine whether apparent large diffs are caused by line endings, formatting, generated files, or actual source changes.
- Never run:
  - `git reset --hard`
  - `git clean`
  - `git stash`
  - `git checkout` on existing files
  - bulk restore commands
  - `git add .`
- Do not delete, overwrite, rename, or reformat unrelated work.
- Do not create a commit unless explicitly authorized.
- If a later stage requires a branch, use `learn-fixes`. Create it only if it does not exist, and first report any implications of switching branches given the current dirty tree.
- If commits are authorized later, stage only explicitly approved file paths.

**Do not assume the working tree is safe just because the application builds.**

## 4. Database safety

- Never apply migrations to production or a remote Supabase database without explicit authorization.
- Do not change existing migration files.
- Propose new migrations under the existing `supabase/migrations/` directory only after confirming that directory and migration conventions.
- Every proposed migration must include rollback guidance and a test plan.
- Do not drop tables, merge activity tables, reset learner progress, or backfill client-trusted XP without an approved data migration plan.
- Never print API keys, passwords, access tokens, service-role keys, database URLs containing credentials, or `.env` values.
- Use only authorized, non-destructive inspection methods.
- Do not perform production writes during an audit.

## 5. Cost and feature preservation

- No paid AI calls.
- No unnecessary dependency installations or upgrades.
- No mock data presented as real learner data.
- No fake scores, fabricated transcripts, random XP, or simulated completion presented as successful real functionality.
- Preserve working SULTI endpoints, including:
  - `/api/sulti/chat`
  - Whisper transcription
  - `/api/speaking-mission/evaluate`
  - `/api/scenario-adventure/evaluate`
- Verify actual endpoint paths and implementation before modifying any integration.
- Do not break authentication, chat, speech evaluation, scenario practice, profile pages, tutor features, or other working modules while improving Learn.

## 6. Quality gates

For every implementation stage, run all applicable checks using the repository's actual scripts and installed tooling:

- TypeScript typecheck, such as `tsc --noEmit`, or the verified equivalent.
- Lint.
- Automated tests.
- Production build.

Report the exact commands, exit codes, and relevant output.

**Vite build success alone does not prove TypeScript correctness.**

If an existing check fails because of pre-existing issues, document the baseline failure separately. Do not silently change unrelated files to make the check pass.

---

# PART 2 — LOCKED PRODUCT DECISIONS

These decisions are requirements unless the repository reveals a genuine technical blocker. If a blocker exists, report it instead of silently changing the requirement.

## A. Learn experience

Use a combined Curriculum Hub and Language Journey experience.

- The Hub shows the learner's next recommended lesson through a functional **Continue Learning** card.
- Course cards open the appropriate course roadmap.
- The Language Journey map reflects the same verified learning progress.
- Lesson completion, course progress, roadmap state, Journey nodes, XP, and dashboard statistics must not contradict each other.
- All progress indicators must be calculated from a consistent source of verified data.

## B. Language-specific progress

Track progress separately for:

- `cebuano`
- `filipino`
- `english`

Verify existing language identifiers and normalization before implementation. Do not silently mix `ceb`, `bisaya`, `cebuano`, `fil-PH`, `filipino`, or `en-US` as if they were interchangeable database values.

Switching languages must not mix lesson completion, XP, course progress, Review Center mistakes, or assessment results across languages.

## C. Source of truth

- Supabase/server is the source of truth for persistent learner progress.
- `localStorage` is a cache, not an authority.
- The client must not determine authoritative XP rewards or pronunciation success.
- Lesson XP must come from a verified server-side catalog or equivalent trusted server-side rules.
- A client-submitted XP value must never be trusted.
- Existing local-only XP must not be automatically imported because it was client-trusted.
- New accounts must receive honest empty states, not fabricated historical progress.

## D. Journey challenge mapping

Journey challenge completion must be based on verified lesson completions through an explicit, auditable mapping or a documented separate completion rule.

Do not assume a Journey challenge ID such as `ceb_1_1` automatically corresponds to a curriculum lesson ID.

Unmapped Journey nodes must not be falsely marked complete.

## E. English content availability

English Speaking City and English Scenario Adventure must remain disabled with a clear, user-friendly explanation until the necessary English content and evaluation support exist.

Do not show an apparently functional English activity that silently uses Cebuano or Filipino content.

## F. Certificates

- Certificates must be issued by SultiAI.
- Do not use Jose Maria College branding, logos, accreditation claims, or institutional endorsement without explicit authorization.
- Certificates remain locked until a real server-graded assessment and required completion rules exist.
- A visible button must not imply that a learner is eligible when they are not.

---

# PART 3 — EXISTING AUDIT FINDINGS TO VERIFY

The following findings were identified in earlier audits. Reinspect the current repository and report which findings are correct, incorrect, partially correct, or no longer applicable.

## A. Learn Dashboard

1. The Hub's “Your Progress” reportedly displays hardcoded percentages such as `72%`, `86%`, `74%`, and `82%`, along with fixed values such as seven days, 1,240 XP, and six badges.
2. Course percentages and module progress bars may be literals.
3. Today's Goals may use fixed values such as `3/5` and `60%`.
4. `LearnDashboard` reportedly receives `nextLesson`, `nextLessonModule`, and `onStartLesson` but does not render a Continue Learning card.
5. `ApplyTutorModal` may exist but be unreachable.
6. The Learn Journey diagram may be static rather than derived from real progress.
7. Toolkit module progress bars may not reflect actual module usage.

Verify each finding against the current components and data flow.

## B. Language Journey

1. `LanguageJourneyMap` reportedly initializes `completedChallengeIds` with a fixed five-ID array.
2. `setCompletedChallengeIds` may never be called.
3. The `completedLessons` prop may be unused.
4. The UNLOCK action may only play a sound without unlocking anything.
5. A certificate button may be visible regardless of eligibility.
6. The Journey map may calculate XP using a fallback such as `profile?.xp || 420`.
7. Journey completion may not be connected to the actual curriculum completion records.

Do not remove a feature until its current behavior and dependencies are understood. A nonfunctional action must either be properly connected to real functionality or explicitly disabled/removed with an appropriate reason.

## C. Course roadmaps and lessons

1. `CourseRoadmapView` may assign statuses by array index rather than verified completion.
2. The first one or two steps may appear completed even for new learners.
3. A later step may be marked current while other steps remain locked regardless of actual progress.
4. Assessment steps may always be locked.
5. A certificate button may remain clickable even when locked.
6. Lessons may be synthesized at runtime for roadmap steps without a direct module mapping.
7. Synthesized lesson IDs and XP rewards must be inspected for stability and trustworthiness.

## D. Progress persistence

1. XP, completed lessons, and badges may be stored only in `localStorage`.
2. These values may disappear on logout.
3. Only `learner_daily_activity` may currently be restored from the server.
4. `award_xp()` may update `daily_activity`, while `learner_add_activity()` updates `learner_daily_activity`.
5. The app may use different sources for XP, streak, activity history, and dashboard progress.
6. Lesson completion may update local React state without creating a durable server-side lesson completion record.
7. Repeated lesson-completion requests may award XP more than once.

Verify actual database and code paths. Do not assume these tables are duplicates or safe to merge.

## E. Language correctness

1. English Reading may fall back to a Filipino story.
2. Review Center may display hardcoded Cebuano mistakes for every language.
3. Speech recognition may use a hardcoded `fil-PH` locale.
4. The shared selected language may be represented by multiple independent localStorage values.
5. Language preference may not be persisted to the server.
6. A course or module may show progress belonging to a different language.

## F. Voice integrity

1. M1 reportedly removed a fake transcript fallback that submitted the expected phrase as the learner's transcript.
2. Speech failures reportedly no longer generate a score.
3. Unscored lessons reportedly pass `null` rather than defaulting to 100.
4. Quick Practice and Pronunciation Lab reportedly use “Practice (not scored)” labels and no longer generate random scores or pronunciation XP.
5. A lesson may still award full lesson XP when the learner skips all pronunciation activities.
6. The server reportedly has a temporary 250-XP-per-call cap.

These are claims to verify against the actual diff and server code. Do not redo M1 blindly or claim runtime verification without evidence.

---

# STAGE 0 — REPOSITORY SAFETY AND GROUND-TRUTH AUDIT

**READ-ONLY. DO NOT MODIFY FILES.**

This is the only stage authorized at the beginning.

## 0.1 Git safety and baseline

Report:

- Current branch and HEAD commit.
- Whether the working tree is clean.
- Staged, modified, deleted, and untracked files, summarized by directory.
- A summary of the largest changes.
- Whether large diffs are caused by whitespace, line endings, generated artifacts, or genuine code changes.
- Relevant `.gitignore` coverage and `core.autocrlf` configuration.
- Whether a large untracked-file count suggests unrelated work or generated files.
- Which changes appear related to M1 and which cannot yet be attributed.

Use read-only Git commands. Do not clean, reset, restore, stash, or overwrite anything.

If the working tree is heavily modified, explicitly state that future implementation is unsafe until the changes are understood and backed up.

## 0.2 Verify the actual M1 diff

Inspect the real diff for at least:

- `LessonPlayer.tsx`
- `QuickPracticeModal.tsx`
- `LanguageJourneyMap.tsx`
- `App.tsx`
- `server.ts`
- `learnerActivity.ts`

Locate the current paths if files have moved. Do not assume the names or locations remain unchanged.

Verify:

1. Microphone denial does not generate a fake transcript or score.
2. Unsupported speech recognition does not generate a fake transcript or score.
3. Recognition errors, empty recordings, server errors, and network failures do not generate a fake score.
4. Skipping pronunciation does not create a pronunciation score.
5. An unscored lesson does not default to 100 or inflate a score average.
6. Quick Practice and Pronunciation Lab no longer produce fabricated scores or pronunciation XP.
7. A fresh account displays zero XP unless a verified server response establishes otherwise.
8. The 250-XP cap is enforced in every relevant server path, not just in one handler.
9. Client-supplied XP, reward values, or score values cannot bypass trusted server rules.
10. Determine whether skipping every pronunciation task still awards full lesson XP. Report the current behavior; do not change the policy in Stage 0.
11. Identify any unrelated M1 changes or regressions.

Separate static code evidence from runtime behavior that still requires browser or device testing.

## 0.3 Run baseline checks

Discover the actual scripts in `package.json` and the server package configuration.

Run the available:

- Typecheck.
- Lint.
- Tests.
- Production build.

Report exact commands and results.

Identify test files and determine which learning flows are covered. Do not invent test coverage.

If the typecheck or lint fails, capture the actual errors and distinguish pre-existing failures from new failures where possible.

## 0.4 Trace XP, activity, streak, and persistence

Search the entire repository for all readers, writers, imports, callers, and database queries involving:

- `award_xp()`
- `daily_activity`
- `learner_daily_activity`
- `learner_profiles`
- `learner_accounts`
- `xp_logs`
- `learning_progress`
- `completed_challenges`
- `learning_sessions`
- `learner_add_activity()`
- `recordActivity()`
- Profile XP and streak updates.
- Lesson completion and localStorage persistence.

Document the complete actual flow from the lesson UI through the server and database.

Determine:

1. Which table or endpoint supplies profile XP.
2. Which source supplies the streak displayed in the UI.
3. Which source powers the calendar.
4. Which source powers daily goals and activity summaries.
5. Which source powers admin monitoring, if applicable.
6. Whether client and server values are independently incremented.
7. Whether the same completion can update multiple tables and accidentally double-count activity or XP.
8. Whether streaks and daily goals use a single timezone/date rule.
9. Whether logout/login restores progress correctly.
10. Whether deleting or changing one source would affect existing functionality.

Do not assume `daily_activity` and `learner_daily_activity` are interchangeable.

**Deliver a proposed single source of truth for XP, streak, and calendar data.** Explain the dependencies and data risks before proposing any table consolidation or migration.

## 0.5 Inspect database schema, RLS, and grants

Inspect available migration files and any authorized read-only database schema evidence.

Document the confirmed schema, primary keys, foreign keys, constraints, RLS policies, and grants for:

- `learner_accounts`
- `learner_profiles`
- `xp_logs`
- `daily_activity`
- `learner_daily_activity`
- `learning_progress`
- `completed_challenges`
- `learning_sessions`

Include the definitions and privileges of `award_xp()` and `learner_add_activity()` if present.

For each table, distinguish:

- Defined in local migration files.
- Confirmed present in the target database.
- Confirmed RLS policy currently deployed.
- Not verifiable with available access.

### Critical security check: `learner_accounts`

An earlier audit reported potentially permissive policies allowing `anon` and `authenticated` users to select or modify all rows through true predicates.

Verify:

1. The actual policies and grants.
2. Whether anonymous users can read learner information.
3. Whether one authenticated user can read another user's row.
4. Whether one authenticated user can modify another user's XP, role, status, or profile.
5. Every reader and writer of `learner_accounts`.
6. Whether browser code accesses the table using the Supabase anon/publishable key.
7. Whether server code uses the service-role key or another authorized server credential.
8. Whether tightening the policies would break a legitimate existing flow.

Do not expose secrets or log environment values.

If the deployed policy cannot be verified, label the finding `UNVERIFIED — POTENTIAL SECURITY RISK`. Do not claim that production is vulnerable or secure without evidence.

Do not apply a migration in Stage 0.

## 0.6 Inspect the lesson catalog and mappings

Inspect:

- `src/data/curriculumData.ts`
- `src/data/coursesData.ts`
- `src/data/languageJourneyData.ts`
- `CourseRoadmapView.tsx`
- Relevant lesson player and course components.
- Any server-side lesson catalog, if one exists.

Verify:

1. Where lesson IDs originate.
2. Where lesson XP rewards originate.
3. Where the language of each lesson is defined.
4. Whether XP is controlled by client code.
5. Which roadmap steps map to real modules and lessons.
6. Which lessons are synthesized at runtime.
7. Whether synthesized IDs are deterministic and stable across sessions and releases.
8. Whether content changes could accidentally change a lesson ID and permit repeated XP awards.
9. Whether Journey IDs such as `ceb_1_1`, `fil_1_1`, and `eng_1_1` have explicit mappings to canonical lessons.
10. Which Journey nodes have no mapping and need a separate completion rule.

Do not invent a mapping simply because two IDs appear similar.

## 0.7 Verify streak and speech behavior

### Streak

Trace whether `profile.streakDays` is ever overwritten by a server-derived streak or whether the local and server values can diverge.

Identify all components that display streak information and the underlying source each one uses.

### Speech recognition

Inspect code and documentation to determine the configured locales for:

- Cebuano (`ceb` or the verified application identifier).
- Filipino (`fil-PH` or the verified application identifier).
- English (`en-US` or the verified application identifier).

Do not claim that a browser supports a locale just because the locale string can be assigned.

Separate code configuration from actual browser/device support. Do not make paid external API calls.

## 0.8 Stage 0 output

Deliver a complete read-only report containing:

1. Repository safety and Git baseline.
2. M1 verification, including exact changed files.
3. Typecheck, lint, test, and build results.
4. Database schema, RLS, grants, and data-flow findings.
5. Confirmed lesson catalog and mapping findings.
6. XP, streak, calendar, and activity source-of-truth proposal.
7. Security risks and dependencies.
8. All earlier audit findings that turned out wrong or partly wrong.
9. Remaining UNVERIFIED items.
10. Recommended order of implementation.
11. Questions that block Stage 1.

**STOP after Stage 0. Do not modify files, create migrations, commit changes, or start Stage 1.**

---

# STAGE 1 — CONDITIONAL LEARNER-ACCOUNT SECURITY FIX

Only begin after I review Stage 0 and explicitly authorize Stage 1.

Proceed only if the security issue is confirmed or there is sufficient authorized evidence to justify a narrowly scoped fix.

Requirements:

1. Confirm the deployed and local policy definitions.
2. Trace every client and server access path to `learner_accounts`.
3. Determine whether legitimate browser code relies on the current permissions.
4. Propose the minimum safe policy changes.
5. Create a new migration file only after authorization.
6. Restrict learner reads to their own row where appropriate, using the verified identity and schema.
7. Route sensitive writes through the trusted server/service-role path where appropriate.
8. Ensure the client cannot change privileged fields such as role or authoritative XP.
9. Include rollback SQL and a test checklist.
10. Do not apply the migration to production or a remote database without explicit authorization.

Required tests, adapted to the actual schema:

- Anonymous users cannot access protected learner records.
- User A cannot read User B's records.
- User A cannot modify User B's records.
- Users cannot modify privileged fields.
- Legitimate profile loading and synchronization still work.

If browser code relies on permissions that would be removed, report and resolve the dependency before applying the policy change.

Stop and report after Stage 1.

---

# STAGE 2 — AUTHORITATIVE LESSON COMPLETION AND PERSISTENCE

Design first. Present the architecture and wait for explicit authorization before implementation.

## 2.1 Server-side lesson catalog

Create or extend a trusted server-side catalog containing, where supported by the verified source:

- Stable lesson ID.
- Language.
- Trusted XP reward.
- Module/course association.
- Relevant lesson type.
- Explicit Journey challenge mapping.
- Assessment requirements where applicable.

For synthesized roadmap lessons, derive deterministic IDs from stable identifiers that already exist. Do not generate a new random ID every render.

Do not trust a client-supplied XP amount.

## 2.2 Completion persistence

Propose a new `completed_lessons` table only after checking naming conventions, existing schemas, and compatibility.

The proposed record may include:

- `user_id`
- `lesson_id`
- `language`
- `xp_awarded`
- Nullable verified score
- `completed_at`

Consider a uniqueness constraint on `(user_id, lesson_id)` if the product rule is one reward per lesson per learner. Confirm whether repeated attempts should be tracked separately before finalizing the schema.

Requirements:

- Server-only writes for authoritative completion.
- Learners can read only their own completion records.
- A repeated completion request cannot award XP twice.
- Score fields remain null when no trusted score exists.
- Any new migration is additive and includes rollback guidance.
- Do not backfill XP from untrusted localStorage values.

## 2.3 Completion endpoint

Propose and then implement, only after approval, an authenticated endpoint equivalent to:

`POST /api/learner/lesson-complete`

The actual route and middleware must follow existing server conventions.

The endpoint must:

1. Authenticate the user.
2. Validate the lesson against the trusted catalog.
3. Validate language and lesson eligibility.
4. Ignore client-submitted XP and use the trusted server-side reward.
5. Award XP exactly once.
6. Use the single source of truth selected after Stage 0.
7. Avoid double-counting across `xp_logs`, `daily_activity`, and `learner_daily_activity`.
8. Persist verified completion.
9. Accept a score only if it is issued or validated through a trusted server evaluation path.
10. Return canonical totals and the existing completion result for duplicate requests.
11. Reject unknown lessons and unauthenticated requests.
12. Handle concurrent duplicate requests safely.

Use a transaction or other verified atomic mechanism where required to avoid duplicate awards and inconsistent records.

## 2.4 Progress endpoint

Design and implement, after approval, an authenticated endpoint equivalent to:

`GET /api/learner/progress`

Return the canonical information required by the application, based on verified existing schema and approved changes:

- Completed lessons.
- XP by language.
- Streak.
- Daily activity and goals.
- Language preference.
- Relevant course and Journey progress inputs.

Do not return invented totals or fields unsupported by the implementation.

## 2.5 Synchronization and client hydration

Extend the existing `/api/learner/sync` endpoint with the selected language preference only after verifying its current contract.

On login:

- Hydrate the profile and learning progress from the server.
- Use localStorage only as a cache.
- Do not import old local XP into authoritative server totals.
- Replace client-side XP increments with server-returned totals.
- Restore the same verified progress after logout and subsequent login.
- Prevent duplicate rewards when a request is retried.

Remove the temporary 250-XP cap only after trusted reward validation, server-side catalog enforcement, and relevant tests are working.

## 2.6 Required tests

Include tests for:

- Successful lesson completion.
- Duplicate completion and idempotency.
- Forged client XP ignored.
- Unknown lesson rejected.
- Unauthenticated request rejected.
- Cross-user data isolation.
- Per-language progress isolation.
- Concurrent duplicate requests.
- No double-counting across activity tables.
- Failed or unscored pronunciation does not fabricate a score.
- Login/logout/login persistence.
- Existing SULTI chat and voice endpoints remain functional.

Acceptance criterion: completing a lesson, logging out, and logging in again preserves the verified lesson record and canonical XP. Completing the same lesson twice does not award XP twice.

Stop after Stage 2.

---

# STAGE 3 — REAL PROGRESS AND TRUTHFUL LEARN DASHBOARD

The goal is a coherent, functional Learn experience using a single verified progress model.

## 3.1 Shared progress layer

Design and implement a single progress hook or equivalent, such as:

`useLearnerProgress(language)`

Use actual repository conventions.

It should derive, from canonical progress data:

- Completed lessons.
- Course completion percentage.
- Roadmap step status.
- Journey challenge state.
- Module completion percentage.
- Next recommended lesson.
- Today's goals and activity summary.
- Language-specific XP.
- Server-derived streak.
- Relevant badge eligibility, where implemented.

Keep derivation logic testable and separate from presentation where practical.

Do not create several independent implementations of the same progress calculations.

## 3.2 Language Journey

- Remove frozen completion arrays as the source of truth.
- Derive completed nodes from verified lesson records and explicit mappings.
- Respect locked prerequisites and actual completion rules.
- Make UNLOCK functional if a legitimate unlock operation exists; otherwise disable or remove it with a clear explanation.
- Gate certificates using verified eligibility.
- Do not display a Journey node as completed just because it was previously hardcoded.
- Do not derive progress from arbitrary array indices.

## 3.3 Course roadmap

- Replace index-based completion with verified progress.
- Correctly identify completed, current, available, and locked steps.
- Ensure a new learner does not see lessons marked complete without evidence.
- Keep assessment steps clearly marked as unavailable or “Coming soon” until a real assessment exists.
- Disable certificate actions when the learner is not eligible.
- Ensure synthesized steps use stable IDs and are handled by the trusted catalog.
- Preserve the existing roadmap visual design unless a change is necessary for correctness.

## 3.4 Curriculum Hub

Replace hardcoded values in “Your Progress” with real data.

Examples of values that must not be presented as live learner data unless they come from a verified source:

- Course percentages.
- Module percentages.
- XP totals.
- Streak.
- Badge count.
- Weekly activity.
- Today's Goals.
- Lesson completion totals.

For new learners, show honest empty states:

- 0 XP.
- 0 completed lessons.
- 0 streak when the server confirms no active streak.
- 0 unlocked badges when none have been earned.
- Clear guidance on how to start learning.

Implement a functional Continue Learning card using the verified next lesson and course/module information.

Clicking the card must navigate to the correct lesson or roadmap and respect the current selected language.

Today's Goals must use real activity-summary data. Do not count a lesson as completed merely because the lesson screen was opened.

Replace or clearly label any static Learn Journey diagram that cannot yet be driven by real data.

## 3.5 Streak, calendar, and toolkit

- Use one canonical server-derived streak source for the header, Journey, and calendar.
- Ensure date boundaries use a consistent documented timezone rule.
- Connect the calendar to actual persisted activity.
- Derive toolkit progress from verified activity if such data exists.
- Otherwise hide the progress bar or label the feature as unavailable rather than displaying invented usage.

## 3.6 Stage 3 acceptance criteria

For a new learner, all progress statistics must show truthful zero/empty states.

After completing one verified lesson:

- The lesson is persisted.
- The correct language's XP changes.
- Course progress updates.
- Roadmap status updates.
- The corresponding mapped Journey node updates.
- Hub statistics update.
- Continue Learning advances appropriately.
- Other languages remain unaffected.
- The same result remains after logout/login.

Add unit tests for the shared progress derivation and component/integration tests where the existing test framework supports them.

Stop after Stage 3.

---

# STAGE 4 — LANGUAGE CORRECTNESS

## 4.1 Shared language state

Use a single language preference source in the existing architecture, such as context, a profile field, or an established state-management solution.

Do not add a new state-management library without a demonstrated need.

- Remove conflicting scattered language reads where safe.
- Persist the selected language through the authorized sync path.
- Hydrate the selection on login.
- Ensure course cards, roadmaps, lessons, Journey nodes, Reading, Review Center, and Voice Practice respect the same language.

## 4.2 English content availability

Keep English Speaking City and Scenario Adventure disabled until verified English content and evaluation support exist.

Display a concise and understandable message explaining that the activity is not yet available for English.

Do not silently substitute Filipino or Cebuano scenarios.

## 4.3 Reading and Review Center

- Fix the English Reading fallback only after confirming the correct content model.
- Do not invent a new English story and present it as an existing approved curriculum item without authorization.
- Make Review Center language-aware.
- Remove hardcoded Cebuano mistakes from other language views.
- If no verified mistakes exist for the selected language, show an honest empty state with a useful next step.

## 4.4 Speech locale

Use the selected language's recognition locale only when its support has been verified for the target browser/device.

If reliable recognition is not available, explain the limitation and use an approved fallback. Do not fabricate transcripts or scores.

Do not claim that all browsers support Cebuano speech recognition.

Stop after Stage 4.

---

# STAGE 5 — VOICE INTEGRITY

Design the integration before implementation and wait for explicit approval.

## 5.1 Real audio evaluation

Where compatible with existing endpoints and privacy requirements:

- Capture actual user audio using the existing supported recording approach or MediaRecorder.
- Send actual recorded audio to the authorized server evaluation path.
- Validate file type, size, request format, and authentication.
- Reuse the existing Speaking City evaluation path for lesson drills, inline Voice preview, and Pronunciation Lab where technically appropriate.
- Preserve working Whisper transcription and speech-evaluation functionality.

Do not submit the expected target phrase as if it were the learner's transcript.

## 5.2 Trusted scores

- The server computes or validates pronunciation scores.
- The client cannot directly submit an arbitrary successful score.
- Lesson completion accepts only a score linked to a trusted server evaluation.
- Recognition failures and network errors must not produce fabricated scores.
- A score is nullable when no valid evaluation exists.

## 5.3 Skipped pronunciation policy

Before implementation, report the existing behavior and ask me to choose whether a learner who skips all pronunciation tasks receives full lesson XP or reduced lesson XP.

Do not make this product decision independently.

Microphone denial must not fabricate a score. Any XP policy must be explicit, fair, server-enforced, and documented.

## 5.4 Required tests

Test:

- Microphone permission denied.
- Unsupported recognition.
- Empty recording.
- Network failure.
- Server evaluation failure.
- Invalid audio input.
- Valid evaluation.
- Retry behavior.
- No fabricated score on failure.
- No duplicate XP on retry.
- Existing SULTI voice features remain operational.

Separate automated test results from manual browser/device tests.

Stop after Stage 5.

---

# STAGE 6 — ASSESSMENTS, BADGES, AND CERTIFICATES

## 6.1 Assessments

Create a real assessment flow for applicable assessment steps.

- Questions and passing criteria must come from an approved, trusted source.
- The server validates the submitted answers and determines pass/fail.
- Do not trust client-supplied pass status.
- Do not mark assessments complete merely because a user clicks a button.
- Store assessment results with proper authentication, ownership, and idempotency where applicable.

If assessment content or grading rules are not available, keep the feature locked or clearly marked “Coming soon.”

## 6.2 Badges

- Derive badge eligibility from real, verified counters or explicit achievement rules.
- Award badges through a trusted server-side mechanism.
- Persist earned badges.
- Remove static unlocked flags and fabricated unlock dates where they are presented as real user achievements.
- Ensure retries do not create duplicate badge awards.

## 6.3 Certificates

A certificate must require the approved assessment and all required lessons.

- Issue certificates from the server.
- Generate a unique verification code.
- Persist the issued certificate and eligibility evidence.
- Provide a verification lookup that does not expose private learner information.
- Do not include Jose Maria College branding or accreditation claims without authorization.
- Keep the certificate locked until all real requirements are satisfied.

Stop after Stage 6.

---

# STAGE 7 — UI/UX POLISH AND REMAINING INTEGRATION

Only begin after the previous stages have been reviewed and authorized.

The priority is mobile usability, visual consistency, and removing misleading interactions without redesigning unrelated parts of the application.

## 7.1 Continue Learning and navigation

- Ensure Continue Learning appears in the Hub.
- Show the correct next lesson and course/module.
- Make course cards open the correct roadmap.
- Ensure navigation respects the selected language.
- Prevent broken or dead buttons.

## 7.2 Tutor modal

Trace why `ApplyTutorModal` cannot currently open.

- Identify the intended trigger and state flow.
- Make it reachable through the intended UI if the existing booking workflow is supported.
- Do not invent a working booking integration.
- If booking requires an unavailable service, show a clear explanation rather than pretending a booking was submitted.

## 7.3 Responsive UI

Review the Learn experience on mobile-sized screens and tablet/desktop layouts.

Check:

- Text wrapping and overflow.
- Touch target size.
- Roadmap scrolling and node selection.
- Progress labels and visual hierarchy.
- Loading, empty, error, and retry states.
- Accessible button labels and keyboard interaction where applicable.
- Dark and light theme consistency, if both are supported.
- Performance on lower-powered devices.

Preserve the existing SultiAI design system. Avoid introducing a new visual framework or unnecessary dependencies.

## 7.4 Remove dead code carefully

Audit the known unused props, constants, setters, and components.

Do not remove code merely because a search shows one reference. Trace imports, dynamic usage, route behavior, tests, and intended product flows first.

Make only the smallest safe cleanup changes and document each one.

Stop after Stage 7.

---

# REQUIRED REPORT FORMAT — EVERY STAGE

Use this exact report structure.

## 1. Files changed

List each file with its path and one-line reason.

For read-only stages, explicitly state:

`Files changed: NONE — read-only audit.`

List new migrations separately.

## 2. Acceptance criteria

For every relevant criterion, report:

- `PASS`
- `FAIL`
- `PARTIAL`
- `UNVERIFIED`

Provide evidence using file paths, line references where available, SQL policy output, test output, or reproducible observations.

Do not use a successful build as evidence that a database integration or browser interaction works.

## 3. Commands and results

List the exact commands and their outcomes for:

- Typecheck.
- Lint.
- Tests.
- Build.
- Any relevant Git inspection.
- Any authorized schema/security checks.

Clearly separate baseline failures from regressions.

## 4. UNVERIFIED items and manual tests

Identify every important fact that could not be confirmed.

Provide a concise manual test checklist for the browser or device when necessary.

## 5. Risks and rollback

Explain:

- Potential impact on existing SULTI endpoints.
- Authentication and authorization risks.
- Database/data-loss risks.
- Local cache compatibility.
- Migration rollback steps.
- Any known limitations.

## 6. Incorrect or outdated audit claims

List findings from previous audits that were wrong, partly correct, stale, or unsupported by current evidence.

Explain the corrected behavior and evidence.

## 7. Questions blocking the next stage

Ask only questions that genuinely block the next stage.

Do not proceed until I answer or explicitly authorize the next stage.

---

# FINAL INSTRUCTIONS

Begin with **STAGE 0 ONLY — REPOSITORY SAFETY AND GROUND-TRUTH AUDIT**.

Do not implement fixes during Stage 0.

Do not apply database migrations, alter production data, commit code, clean the Git tree, or begin later stages.

Inspect the actual repository and provide evidence-based findings. Preserve all existing work, working features, and SULTI endpoints.

At the end, give me a clear recommendation for the next stage, but wait for my explicit `GO STAGE 1` before doing any implementation.

**The objective is a reliable, secure, fully functional Learn Dashboard—not merely a visually impressive dashboard with fabricated progress.**


