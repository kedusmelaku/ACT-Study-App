import test from 'node:test';
import assert from 'node:assert/strict';
import { composite, stem, superscore, estimates, estimatedComposite } from '../js/logic/scoring.js';
import { roundScore } from '../js/data/act.js';
import { attempt } from './helpers.js';

test('rounding: 34.33 -> 34, 34.5 -> 35, 34.67 -> 35', () => {
  assert.equal(roundScore(34.33), 34);
  assert.equal(roundScore(34.5), 35);
  assert.equal(roundScore(34.67), 35);
  assert.equal(composite(35, 35, 33), 34); // 34.33
  assert.equal(composite(35, 35, 34), 35); // 34.67
  assert.equal(composite(36, 33, 34), 34); // 34.33
});

test('composite ignores science and needs all three core sections', () => {
  assert.equal(composite(30, 30, null), null);
  assert.equal(composite(30, 31, 32), 31);
});

test('STEM averages math and science with the same rounding', () => {
  assert.equal(stem(35, 34), 35); // 34.5 rounds up
  assert.equal(stem(33, 34), 34);
  assert.equal(stem(33, undefined), null);
});

test('superscore uses real attempts only', () => {
  const attempts = [
    attempt('a', '2026-12-12', 'real', { english: 34, math: 33, reading: 32, science: 30 }),
    attempt('b', '2027-04-14', 'real', { english: 32, math: 35, reading: 34, science: 33 }),
    attempt('c', '2026-11-20', 'official_enhanced', { english: 36, math: 36, reading: 36 }),
    attempt('d', '2026-10-01', 'benchmark', { english: 36, math: 36, reading: 36 }, 35),
  ];
  const s = superscore(attempts);
  assert.equal(s.sections.english.score, 34);
  assert.equal(s.sections.english.date, '2026-12-12');
  assert.equal(s.sections.math.score, 35);
  assert.equal(s.sections.math.date, '2027-04-14');
  assert.equal(s.sections.reading.score, 34);
  assert.equal(s.composite, 34); // (34+35+34)/3 = 34.33
  assert.equal(superscore([attempts[2], attempts[3]]), null);
});

test('estimate weights recency (1, 0.7, 0.5) and kind', () => {
  const attempts = [
    attempt('old', '2026-10-01', 'official_enhanced', { english: 30, math: 30, reading: 30 }),
    attempt('mid', '2026-10-15', 'official_enhanced', { english: 32, math: 30, reading: 30 }),
    attempt('new', '2026-11-01', 'official_enhanced', { english: 34, math: 30, reading: 30 }),
    attempt('ancient', '2026-09-01', 'official_enhanced', { english: 10, math: 10, reading: 10 }),
  ];
  const e = estimates(attempts);
  const expected = (34 * 1 + 32 * 0.7 + 30 * 0.5) / (1 + 0.7 + 0.5);
  assert.ok(Math.abs(e.english.value - expected) < 1e-9);
  assert.equal(e.english.count, 3);
  assert.deepEqual(e.english.attemptIds, ['new', 'mid', 'old']);

  const mixed = [
    attempt('bench', '2026-11-01', 'benchmark', { english: 35, math: 35, reading: 33 }, 35),
    attempt('other', '2026-10-01', 'other', { english: 30, math: 30, reading: 30 }),
  ];
  const m = estimates(mixed);
  const exp2 = (35 * 1 * 0.6 + 30 * 0.7 * 0.5) / (0.6 + 0.35);
  assert.ok(Math.abs(m.english.value - exp2) < 1e-9);
  assert.equal(m.english.capped, true, '35-scale scores are flagged as capped');
  assert.equal(m.science, null);
});

test('estimated composite uses the rounding rule', () => {
  const e = estimates([attempt('b', '2026-11-01', 'benchmark', { english: 35, math: 35, reading: 33 }, 35)]);
  assert.equal(estimatedComposite(e), 34);
});

test('a duplicated benchmark (one per device) counts once', () => {
  const b1 = { ...attempt('b1', '2026-11-07', 'benchmark', { english: 35, math: 35, reading: 33 }, 35), createdAt: '2026-11-07T10:00:00Z' };
  const b2 = { ...attempt('b2', '2026-11-14', 'benchmark', { english: 35, math: 35, reading: 33 }, 35), createdAt: '2026-11-14T10:00:00Z' };
  const p = attempt('p', '2026-11-10', 'official_enhanced', { english: 30, math: 30, reading: 30 });
  const e = estimates([b1, b2, p]);
  assert.equal(e.english.count, 2);
  assert.deepEqual(e.english.attemptIds, ['p', 'b1']);
});

test('a score out of 35 maps to a range on the 36 scale', async () => {
  const { rangeOn36 } = await import('../js/logic/scoring.js');
  assert.deepEqual(rangeOn36(34), { low: 34, high: 35 });
  assert.deepEqual(rangeOn36(35), { low: 35, high: 36 });
  assert.deepEqual(rangeOn36(33), { low: 33, high: 34 });
  assert.deepEqual(rangeOn36(1), { low: 1, high: 2 });
  assert.equal(rangeOn36(36), null);
  assert.equal(rangeOn36(0), null);
  for (let k = 1; k <= 35; k++) {
    const r = rangeOn36(k);
    assert.ok(r.low >= k && r.high <= 36 && r.high - r.low <= 1, `k=${k}`);
  }
});
