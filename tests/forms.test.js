import test from 'node:test';
import assert from 'node:assert/strict';
import { FORMS, keyFor, CATEGORY_TOPICS, TOPIC_CODES, BOOKLETS, bookletLetter } from '../js/data/forms.js';
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

// What a reporting category allows, so a topic can't contradict the official key.
const ALLOWED = {
  english: {
    CSE: ['CM', 'SC', 'DP', 'AP', 'SB', 'SV', 'PR', 'VT', 'MO', 'PA'],
    POW: ['TR', 'AD', 'OR'],
    KLA: ['WC', 'CO', 'TR', 'PA'],
  },
  math: { G: ['PG', 'CG', 'CS', 'TG', 'VC'], S: ['ST', 'PB'], N: ['NQ', 'CX', 'MX', 'VC', 'EL', 'WP'] },
  reading: { KID: ['MI', 'DT', 'IN'], CS: ['VC', 'AP', 'FP', 'IN'], IKI: ['CP', 'DG', 'IN', 'FP'] },
};

for (const [id, form] of Object.entries(FORMS)) {
  test(`forms: ${id} every question has a topic and a booklet page`, () => {
    const book = BOOKLETS[id];
    assert.ok(book && /^QU\d/.test(book.code));
    for (const s of ALL_SECTIONS) {
      const f = form[s];
      const codes = f.topics.split(' ');
      assert.equal(codes.length, f.total, `${s} topic count`);
      assert.equal(f.pages.length, f.total, `${s} page count`);
      assert.equal(f.passagePages.length, f.total);
      const cats = f.categories.split(' ');
      for (let q = 1; q <= f.total; q++) {
        const name = TOPIC_CODES[s][codes[q - 1]];
        assert.ok(name && DEFAULT_TOPICS[s].includes(name), `${s} Q${q} topic ${codes[q - 1]}`);
        const page = f.pages[q - 1];
        assert.ok(Number.isInteger(page) && page >= 1 && page <= book.pages, `${s} Q${q} page`);
        if (q > 1) assert.ok(page >= f.pages[q - 2], `${s} pages run in order at Q${q}`);
        const pp = f.passagePages[q - 1];
        if (pp) assert.ok(pp < page, `${s} Q${q} passage page comes before the question page`);
        const allowed = (ALLOWED[s] || {})[cats[q - 1]];
        if (allowed) assert.ok(allowed.includes(codes[q - 1]), `${s} Q${q}: ${cats[q - 1]} question tagged ${name}`);
      }
    }
  });
}

test('acceptance: Practice Test 3 topics land on the hand-tagged ones', () => {
  const topic = (s, q) => keyFor('enhanced-3', s, q).topic;
  assert.equal(topic('english', 8), 'Transitions');
  assert.equal(topic('english', 26), 'Subject-verb agreement');
  assert.equal(topic('english', 36), 'Subject-verb agreement');
  assert.equal(topic('english', 28), 'Add, delete, or revise');
  assert.equal(topic('english', 41), 'Commas');
  assert.equal(topic('math', 36), 'Number and quantity');
  assert.equal(topic('science', 34), 'Data representation');
  assert.equal(topic('science', 39), 'Conflicting viewpoints');
});

test('forms: likely topics are real default topics', () => {
  for (const [s, map] of Object.entries(CATEGORY_TOPICS)) {
    for (const list of Object.values(map)) for (const t of list) assert.ok(DEFAULT_TOPICS[s].includes(t), `${s}: ${t}`);
  }
});

test('forms: spot checks against the printed keys', () => {
  const pick = (k) => ({ answer: k.answer, unscored: k.unscored, category: k.category });
  assert.deepEqual(pick(keyFor('enhanced-3', 'reading', 10)), { answer: 'B', unscored: true, category: null });
  assert.deepEqual(pick(keyFor('enhanced-3', 'math', 1)), { answer: 'B', unscored: false, category: 'G' });
  assert.deepEqual(pick(keyFor('enhanced-1', 'english', 41)), { answer: 'A', unscored: true, category: null });
  assert.deepEqual(pick(keyFor('enhanced-2', 'science', 13)), { answer: 'A', unscored: false, category: 'SIN' });
  // Booklet pages checked against the rendered booklet.
  assert.equal(keyFor('enhanced-3', 'math', 36).page, 25);
  assert.equal(keyFor('enhanced-3', 'english', 20).passagePage, 6);
  assert.equal(keyFor('enhanced-1', 'math', 4).page, 27);
  assert.equal(bookletLetter('C', 20), 'H');
  assert.equal(bookletLetter('C', 21), 'C');
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
