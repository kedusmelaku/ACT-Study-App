import test from 'node:test';
import assert from 'node:assert/strict';
import { detectHabits } from '../js/logic/habits.js';
import { addDays } from '../js/logic/dates.js';
import { settings as mkSettings } from './helpers.js';

const today = '2026-11-28';
const task = (id, date, status, extra = {}) => ({ id, date, status, type: 'drill', minutes: 30, ...extra });

test('flags skipping a lot', () => {
  const tasks = [];
  for (let i = 1; i <= 10; i++) tasks.push(task(`t${i}`, addDays(today, -i), i <= 4 ? 'skipped' : 'done'));
  const h = detectHabits({ tasks, settings: mkSettings(), today });
  assert.ok(h.some((x) => x.id === 'skipping' && x.title === 'You skipped 4 of your last 10 tasks'));
});

test('no flags for a good fortnight', () => {
  const tasks = [];
  for (let i = 1; i <= 10; i++) tasks.push(task(`t${i}`, addDays(today, -i), 'done'));
  const misses = [{ id: 'm', section: 'math', topic: 'Vectors', date: addDays(today, -2) }];
  assert.deepEqual(detectHabits({ tasks, settings: mkSettings(), misses, today }), []);
});

test('flags a weekday that keeps falling through, with an Apply-able suggestion', () => {
  // Wednesdays: Nov 4, 11, 18, 25.
  const tasks = ['2026-11-04', '2026-11-11', '2026-11-18'].map((d, i) => task(`w${i}`, d, 'skipped'));
  const h = detectHabits({ tasks, settings: mkSettings(), today }).find((x) => x.id === 'weekday');
  assert.equal(h.title, 'Wednesdays keep falling through');
  assert.deepEqual(h.suggestion, { type: 'availability', day: 3, minutes: 15 });
});

test('flags overbooked days, frequent heavy nights, piled-up redos, and untagged misses', () => {
  const tasks = [task('a', '2026-11-30', 'todo', { minutes: 60 }), task('b', '2026-12-01', 'todo', { minutes: 75 })];
  const s = mkSettings({ heavyNights: ['2026-11-17', '2026-11-19', '2026-11-24'] });
  const redos = Array.from({ length: 10 }, (_, i) => ({ missId: `r${i}`, dueDate: '2026-11-20', interval: 3, status: 'active', history: [] }));
  const misses = [1, 2, 3].map((i) => ({ id: `u${i}`, section: 'reading', topic: '', date: today }));
  const ids = detectHabits({ tasks, settings: s, redos, misses, today }).map((x) => x.id);
  for (const id of ['overbooked', 'heavy', 'redos', 'untagged']) assert.ok(ids.includes(id), id);
});

test('flags drills done with no misses logged', () => {
  const tasks = [1, 2, 3, 4].map((i) => task(`d${i}`, addDays(today, -i), 'done'));
  const misses = [{ id: 'old', section: 'math', topic: 'Vectors', date: addDays(today, -20) }];
  assert.ok(detectHabits({ tasks, settings: mkSettings(), misses, today }).some((x) => x.id === 'no-misses'));
});
