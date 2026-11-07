import test from 'node:test';
import assert from 'node:assert/strict';
import { computeFocus, pointsNeeded, recencyDecay, missWeight } from '../js/logic/focus.js';
import { attempt, miss } from './helpers.js';

const today = '2026-11-07';

test('E35 M35 R33: Reading needs 1 point and is the top priority', () => {
  const f = computeFocus({ attempts: [attempt('b', '2026-10-01', 'benchmark', { english: 35, math: 35, reading: 33 }, 35)], today });
  assert.equal(f.bySection.reading.pointsNeeded, 1);
  assert.equal(f.top, 'reading');
  assert.equal(f.ranked[0].section, 'reading');
  assert.match(f.sentence, /Reading is your focus: one more Reading point moves your composite from 34 to 35/);
});

test('E36 M36 R36: all leverage is 0', () => {
  const f = computeFocus({ attempts: [attempt('a', '2026-10-01', 'real', { english: 36, math: 36, reading: 36 })], today });
  for (const s of ['english', 'math', 'reading']) {
    assert.equal(f.bySection[s].leverage, 0);
    assert.equal(f.bySection[s].pointsNeeded, Infinity);
  }
});

test('pointsNeeded finds the smallest raise that moves the composite', () => {
  assert.equal(pointsNeeded({ english: 34, math: 34, reading: 34 }, 'english'), 2); // 104/3=34.67 -> 35
  assert.equal(pointsNeeded({ english: 36, math: 34, reading: 34 }, 'english'), Infinity);
});

test('recency decay halves after 10 days', () => {
  assert.equal(recencyDecay(0), 1);
  assert.ok(Math.abs(recencyDecay(10) - 0.5) < 1e-12);
  assert.ok(Math.abs(recencyDecay(20) - 0.25) < 1e-12);
  const m = miss('reading', 'Inference', 'content', '2026-10-28');
  assert.ok(Math.abs(missWeight(m, null, today) - 0.5) < 1e-12);
});

test('cause multipliers and guessed-right half weight', () => {
  assert.equal(missWeight(miss('english', 'Commas', 'careless', today), null, today), 0.8);
  assert.equal(missWeight(miss('english', 'Commas', 'trap', today), null, today), 1);
  assert.equal(missWeight(miss('english', 'Commas', 'content', today, { guessedRight: true }), null, today), 0.5);
});

test('redo effects: right halves, wrong adds 0.5, retired removes', () => {
  const m = miss('math', 'Matrices', 'content', today);
  assert.equal(missWeight(m, { status: 'active', history: [{ date: today, result: 'right' }] }, today), 0.5);
  assert.equal(missWeight(m, { status: 'active', history: [{ date: today, result: 'wrong' }] }, today), 1.5);
  assert.equal(missWeight(m, { status: 'retired', history: [] }, today), 0);
});

test('Science never enters leverage or the composite ranking', () => {
  const f = computeFocus({
    attempts: [attempt('a', '2026-10-01', 'real', { english: 35, math: 35, reading: 35, science: 20 })],
    misses: [miss('science', 'Graph reading', 'content', today), miss('science', 'Graph reading', 'content', today)],
    today,
  });
  assert.equal(f.bySection.science.leverage, 0);
  assert.equal(f.bySection.science.pointsNeeded, null);
  assert.ok(!f.ranked.some((r) => r.section === 'science'));
  assert.ok(f.science.weight > 0);
});

test('dominant cause uses the last 14 days and timing flags add to time', () => {
  const misses = [
    miss('reading', 'Inference', 'trap', '2026-11-05'),
    miss('reading', 'Detail', 'careless', '2026-11-06'),
    miss('reading', 'Detail', 'content', '2026-10-01'), // outside window
  ];
  let f = computeFocus({ misses, today });
  assert.equal(f.bySection.reading.dominantCause, 'trap');
  const attempts = [attempt('t1', '2026-11-05', 'official_enhanced', { english: 34, math: 34, reading: 33 })];
  f = computeFocus({ attempts, misses, pacing: [{ attemptId: 't1', section: 'reading', notReached: 2, guessedAtEnd: 0, minutesLeft: 0 }], today });
  assert.equal(f.bySection.reading.timingFlag, true);
  assert.equal(f.bySection.reading.dominantCause, 'time');
});

test('weakness is each section\'s share of core weight', () => {
  const f = computeFocus({ misses: [miss('english', 'Commas', 'content', today), miss('math', 'Functions', 'content', today)], today });
  assert.equal(f.bySection.english.weakness, 0.5);
  assert.equal(f.bySection.reading.weakness, 0);
});
