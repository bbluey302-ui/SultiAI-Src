import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { ALL_LANGUAGE_PATHS } from '../src/data/languageJourneyData';
import { getLessonFromCatalog } from '../server/lessonCatalog';
import {
  evaluateBadgeProgress,
  getCertificateEligibility,
  getCebuanoChallengeIds,
} from '../server/badgeRules';
import { getToolkitProgress } from '../src/utils/toolkitProgress';

const badge = (rows: Parameters<typeof evaluateBadgeProgress>[0], id: string, streak = 0) =>
  evaluateBadgeProgress(rows, streak).find((entry) => entry.id === id);

test('catalog includes both curriculum lessons and journey challenges', () => {
  const curriculum = getLessonFromCatalog('les_1_1');
  assert.equal(curriculum?.source, 'curriculum');
  assert.equal(curriculum?.language, 'cebuano');

  const journey = getLessonFromCatalog('ceb_1_1');
  assert.equal(journey?.source, 'journey');
  assert.equal(journey?.language, 'cebuano');
  assert.equal(journey?.xpReward, 20);
  assert.equal(journey?.journeyLevelId, 'ceb_lvl_1');

  assert.equal(getLessonFromCatalog('not-a-real-lesson'), undefined);

  const roadmapPractice = getLessonFromCatalog('les_step_step_beg_1');
  assert.equal(roadmapPractice?.source, 'roadmap');
  assert.equal(roadmapPractice?.xpReward, 0);
});

test('every language-journey challenge has a server catalog entry', () => {
  for (const path of Object.values(ALL_LANGUAGE_PATHS)) {
    for (const level of path.levels) {
      for (const challenge of level.challenges) {
        const catalogLesson = getLessonFromCatalog(challenge.id);
        assert.ok(catalogLesson, `missing catalog entry for ${challenge.id}`);
        assert.equal(catalogLesson.source, 'journey');
      }
    }
  }
});

test('toolkit progress is derived from completed Journey challenges', () => {
  assert.equal(getToolkitProgress([]).phrasebook, 0);
  const progress = getToolkitProgress(['ceb_1_1']);
  assert.ok(progress.phrasebook > 0 && progress.phrasebook < 100);
  assert.equal(progress.voice, 0);
});

test('badge unlock state starts empty instead of inheriting demo progress', () => {
  assert.equal(badge([], 'first_steps')?.eligible, false);
  assert.equal(badge([], 'first_steps')?.progressPercent, 0);
  assert.equal(badge([], 'cebuano_master')?.progressPercent, 0);
  assert.equal(badge([], 'seven_day_speaker')?.progressPercent, 0);
});

test('first lesson and level completion are derived from persisted completions', () => {
  const levelOne = ALL_LANGUAGE_PATHS.cebuano.levels[0];
  const oneLesson = [{ lesson_id: levelOne.challenges[0].id, language: 'cebuano' }];

  assert.equal(badge(oneLesson, 'first_steps')?.eligible, true);
  assert.equal(badge(oneLesson, 'cebuano_starter')?.eligible, false);
  assert.ok((badge(oneLesson, 'cebuano_starter')?.progressPercent || 0) > 0);

  const allLevelOne = levelOne.challenges.map((challenge) => ({
    lesson_id: challenge.id,
    language: 'cebuano',
  }));
  assert.equal(badge(allLevelOne, 'cebuano_starter')?.eligible, true);
  assert.equal(badge(allLevelOne, 'cebuano_starter')?.progressPercent, 100);
});

test('streak badge uses server streak and caps progress at 100', () => {
  assert.equal(badge([], 'seven_day_speaker', 3)?.progressPercent, 43);
  assert.equal(badge([], 'seven_day_speaker', 7)?.eligible, true);
  assert.equal(badge([], 'seven_day_speaker', 12)?.progressPercent, 100);
});

test('cebuano master and certificate require every Cebuano challenge', () => {
  const ids = getCebuanoChallengeIds();
  const all = ids.map((lesson_id) => ({
    lesson_id,
    language: 'cebuano',
    score: 90,
  }));

  assert.equal(badge(all, 'cebuano_master')?.eligible, true);
  assert.equal(getCertificateEligibility(all).eligible, true);
  assert.equal(getCertificateEligibility(all).completedChallenges, ids.length);
  assert.equal(getCertificateEligibility(all).averageScore, 90);

  const almost = all.slice(0, -1);
  assert.equal(badge(almost, 'cebuano_master')?.eligible, false);
  assert.equal(getCertificateEligibility(almost).eligible, false);
});

test('progress, completion and certificate routes require verified identity', () => {
  const source = readFileSync(new URL('../server/lessonComplete.ts', import.meta.url), 'utf8');
  for (const handler of ['lessonCompleteHandler', 'progressHandler', 'claimCertificateHandler']) {
    assert.match(
      source,
      new RegExp(`export async function ${handler}\\([\\s\\S]*?resolveIdentity\\(req\\)[\\s\\S]*?!identity\\.verified[\\s\\S]*?401`),
    );
  }
  assert.match(source, /from\('completed_lessons'\)[\s\S]*?user_id: identity\.userId/);
});

test('lesson player cannot finish until the current answer is correct', () => {
  const source = readFileSync(
    new URL('../src/components/LessonPlayer.tsx', import.meta.url),
    'utf8',
  );
  assert.match(
    source,
    /if \(feedback && !feedback\.isCorrect\) \{[\s\S]*?handleRetry\(\);[\s\S]*?return;/,
  );
  assert.match(source, /onClick=\{feedback\.isCorrect \? handleNext : handleRetry\}/);
  assert.match(source, /This pronunciation drill must be completed before the lesson can finish\./);
  assert.doesNotMatch(source, /\bSkip\b/);
});

test('certificate average ignores unscored completions and other languages', () => {
  const cebuano = [
    { lesson_id: 'ceb_1_1', language: 'cebuano', score: 80 },
    { lesson_id: 'ceb_1_2', language: 'cebuano', score: null },
    { lesson_id: 'fil_1_1', language: 'filipino', score: 100 },
  ];
  const result = getCertificateEligibility(cebuano);
  assert.equal(result.averageScore, 80);
  assert.equal(result.eligible, false);
  assert.ok(result.completedChallenges > 0);
});
