import test from 'node:test';
import assert from 'node:assert/strict';
import { trendSeries, topicTrends, coachStats } from '../js/logic/progress.js';
import { settings, attempt, miss } from './helpers.js';

const attempts = [
  attempt('b', '2026-11-01', 'benchmark', { english: 35, math: 35, reading: 33, science: 35 }, 35),
  attempt('p1', '2026-11-07', 'official_enhanced', { english: 34, math: 33, reading: 31, science: 32 }),
  attempt('r1', '2026-12-12', 'real', { english: 35, math: 34, reading: 34 }),
];

test('trend series is in date order with a running estimated composite', () => {
  const s = trendSeries([attempts[2], attempts[0], attempts[1]]);
  assert.deepEqual(s.map((p) => p.id), ['b', 'p1', 'r1']);
  assert.equal(s[0].estComposite, 34);
  assert.equal(s[2].real, true);
  assert.equal(s[1].composite, 33);
});

test('topic trends mark new and worsening topics', () => {
  const misses = [miss('reading', 'Inference', 'trap', '2026-11-20'), miss('math', 'Vectors', 'content', '2026-11-01'), miss('math', 'Vectors', 'content', '2026-11-19')];
  const t = topicTrends({ attempts, misses, redos: [], pacing: [], today: '2026-11-21' });
  const inf = t.find((x) => x.topic === 'Inference');
  assert.equal(inf.trend, 'new');
  const vec = t.find((x) => x.topic === 'Vectors');
  assert.equal(vec.trend, 'worse');
});

test('coach stats carry numbers and labels only, never notes or question text', () => {
  const misses = [miss('reading', 'Inference', 'trap', '2026-11-20', { note: 'SECRET QUESTION TEXT', myAnswer: 'B', fixLine: 'private' })];
  const stats = coachStats({ settings: settings(), attempts, misses, redos: [], pacing: [], tasks: [], today: '2026-11-21' });
  const json = JSON.stringify(stats);
  assert.ok(!json.includes('SECRET'));
  assert.ok(!json.includes('private'));
  assert.equal(stats.daysLeft, 21);
  assert.ok(stats.sections.reading.estimate);
  assert.equal(stats.topTopics[0].topic, 'Inference');
});
