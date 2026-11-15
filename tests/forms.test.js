import test from 'node:test';
import assert from 'node:assert/strict';
import { FORMS, keyFor, CATEGORY_TOPICS } from '../js/data/forms.js';
import { SECTIONS, ALL_SECTIONS, UNSCORED_MULT, GUESSED_RIGHT_MULT } from '../js/data/act.js';
import { buildMaterials } from '../js/data/materials.js';
import { DEFAULT_TOPICS } from '../js/data/topics.js';
import { scaleFromRaw, keyedSection, keyedScores, composite, stem } from '../js/logic/scoring.js';
import { missWeight, causeMultiplier } from '../js/logic/focus.js';

// Max raw scores printed on every one of the four keys.
const KEY_MAX = { english: 40, math: 41, reading: 27, science: 34 };

test('forms: Official Practice Tests 1 to 4 are keyed, and each is in the materials list', () => {
  const ids = Object.keys(FORMS).sort();
  assert.deepEqual(ids, ['enhanced-1', 'enhanced-2', 'enhanced-3', 'enhanced-4']);
  const mats = buildMaterials({});
  for (const id of ids) {
    const m = mats.find((x) => x.sourceId === id);
    assert.ok(m, id);
    assert.equal(m.format, 'enhanced');
    assert.ok(m.holdForFullTest);
  }
});

for (const [id, form] of Object.entries(FORMS)) {
  for (const s of ALL_SECTIONS) {
    test(`forms: ${id} ${s} key is consistent`, () => {
      const f = form[s];
      assert.ok(f, 'section present');
      assert.equal(f.total, SECTIONS[s].questions, 'total matches the enhanced test length');
      const uns = new Set(f.unscored);
      assert.equal(uns.size, f.unscored.length, 'no duplicate unscored numbers');
      for (const q of f.unscored) assert.ok(Number.isInteger(q) && q >= 1 && q <= f.total);
      const scored = f.total - uns.size;
      assert.equal(scored + uns.size, f.total);
      assert.equal(scored, KEY_MAX[s], 'scored count equals the key max raw');
      assert.equal(f.answers.length, f.total, 'one key letter per question');
      assert.match(f.answers, /^[A-D]+$/);
      const cats = f.categories.split(' ');
      assert.equal(cats.length, f.total);
      for (let q = 1; q <= f.total; q++) {
        if (uns.has(q)) assert.equal(cats[q - 1], '-', `Q${q} unscored has no category`);
        else assert.ok(CATEGORY_TOPICS[s][cats[q - 1]], `Q${q} has a known category`);
      }
      assert.equal(f.table.length, KEY_MAX[s] + 1, 'table has max+1 rows');
      for (let r = 1; r < f.table.length; r++) assert.ok(f.table[r] >= f.table[r - 1], `non-decreasing at raw ${r}`);
      assert.equal(f.table[0], 1);
      assert.equal(f.table[KEY_MAX[s]], 36);
    });
  }
}

test('forms: likely topics are real default topics', () => {
  for (const [s, map] of Object.entries(CATEGORY_TOPICS)) {
    for (const list of Object.values(map)) for (const t of list) assert.ok(DEFAULT_TOPICS[s].includes(t), `${s}: ${t}`);
  }
});

test('forms: spot checks against the printed keys', () => {
  assert.deepEqual(keyFor('enhanced-3', 'reading', 10), { answer: 'B', unscored: true, category: null });
  assert.deepEqual(keyFor('enhanced-3', 'math', 1), { answer: 'B', unscored: false, category: 'G' });
  assert.deepEqual(keyFor('enhanced-1', 'english', 41), { answer: 'A', unscored: true, category: null });
  assert.deepEqual(keyFor('enhanced-2', 'science', 13), { answer: 'A', unscored: false, category: 'SIN' });
  assert.equal(FORMS['enhanced-3'].math.table[36], 31);
  assert.equal(FORMS['enhanced-1'].english.table[35], 29);
  assert.equal(keyFor('enhanced-1', 'english', 51), null);
  assert.equal(keyFor('legacy-1', 'english', 1), null);
});

test('scoring: scaleFromRaw reads the table and clamps', () => {
  const t = FORMS['enhanced-3'].english.table;
  assert.equal(scaleFromRaw(t, 40), 36);
  assert.equal(scaleFromRaw(t, 99), 36);
  assert.equal(scaleFromRaw(t, -3), 1);
  assert.equal(scaleFromRaw([], 3), null);
});

test('scoring: guessed-right questions and unscored misses do not lower the raw score', () => {
  const f = FORMS['enhanced-3'].english; // unscored 11 to 20
  assert.deepEqual(keyedSection(f, {}), { raw: 40, scored: 40, scale: 36 });
  assert.equal(keyedSection(f, { 1: 'guess', 15: 'miss' }).raw, 40);
  assert.equal(keyedSection(f, { 1: 'miss' }).raw, 39);
});

test('acceptance: real Practice Test 3 scores from misses', () => {
  const marks = {
    english: { 8: 'miss', 20: 'miss', 26: 'miss', 28: 'miss', 36: 'miss', 41: 'miss' },
    math: { 36: 'miss' },
    reading: {},
    science: { 26: 'miss', 34: 'miss', 39: 'miss', 40: 'miss' },
  };
  const { scores, detail } = keyedScores(FORMS['enhanced-3'], marks, ALL_SECTIONS);
  assert.deepEqual(detail.english, { raw: 35, scored: 40, scale: 30 });
  assert.deepEqual(detail.math, { raw: 40, scored: 41, scale: 36 });
  assert.deepEqual(detail.reading, { raw: 27, scored: 27, scale: 36 });
  assert.deepEqual(detail.science, { raw: 30, scored: 34, scale: 30 });
  assert.equal(composite(scores.english, scores.math, scores.reading), 34);
  assert.equal(stem(scores.math, scores.science), 33);

  // English Q20 is unscored, so it counts at half weight in the focus engine.
  assert.equal(keyFor('enhanced-3', 'english', 20).unscored, true);
  const q20 = { id: 'm20', section: 'english', cause: 'content', unscored: true, date: '2026-11-14', createdAt: '2026-11-14T12:00:00Z' };
  const q26 = { ...q20, id: 'm26', unscored: false };
  assert.equal(causeMultiplier(q20), UNSCORED_MULT);
  assert.equal(missWeight(q20, null, '2026-11-14'), 0.5 * missWeight(q26, null, '2026-11-14'));
});

test('acceptance: sections not taken get no score', () => {
  const { scores } = keyedScores(FORMS['enhanced-3'], {}, ['english', 'math', 'reading']);
  assert.equal(scores.science, undefined);
  assert.equal(stem(scores.math, scores.science), null);
});

test('focus: unscored and guessed right takes the smaller multiplier, not the product', () => {
  const both = { section: 'math', cause: 'careless', unscored: true, guessedRight: true };
  assert.equal(causeMultiplier(both), Math.min(UNSCORED_MULT, GUESSED_RIGHT_MULT));
  assert.equal(causeMultiplier({ section: 'math', cause: 'careless', unscored: true }), Math.min(0.8, UNSCORED_MULT));
  assert.equal(causeMultiplier({ section: 'math', cause: 'careless' }), 0.8);
});
