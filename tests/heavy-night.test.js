import test from 'node:test';
import assert from 'node:assert/strict';
import { heavyNight } from '../js/logic/planner.js';
import { weekDates } from '../js/logic/dates.js';
import { settings as mkSettings } from './helpers.js';

function task(id, date, minutes, priority, status = 'todo', extra = {}) {
  return { id, weekStart: '2026-11-14', date, slot: 1, section: 'reading', type: 'drill', title: id, detail: '', minutes, priority, status, origin: 'plan', ...extra };
}

test('moves tonight into open slots later in the same week', () => {
  const s = mkSettings({ availability: { 0: 0, 1: 30, 2: 60, 3: 30, 4: 30, 5: 0, 6: 150 } });
  const tasks = [
    task('mon', '2026-11-16', 30, 0.9),
    task('tue', '2026-11-17', 30, 0.5),
    task('wed', '2026-11-18', 30, 0.4),
    task('done-sat', '2026-11-14', 60, 0.3, 'done'),
  ];
  const r = heavyNight({ tasks, today: '2026-11-16', settings: s, weekStart: '2026-11-14' });
  const orig = r.tasks.find((t) => t.id === 'mon');
  assert.equal(orig.status, 'moved');
  assert.equal(r.placed.length, 1);
  assert.equal(r.placed[0].date, '2026-11-17', 'Tuesday has 30 open minutes');
  assert.equal(r.dropped.length, 0);
  const week = weekDates('2026-11-14');
  for (const t of r.tasks) assert.ok(week.includes(t.date));
  // Completed tasks are untouched.
  assert.deepEqual(r.tasks.find((t) => t.id === 'done-sat'), tasks[3]);
});

test('overflow drops the lowest-priority task', () => {
  const s = mkSettings();
  const tasks = [
    task('mon', '2026-11-16', 30, 0.9),
    task('tue', '2026-11-17', 30, 0.5),
    task('wed', '2026-11-18', 30, 0.2),
    task('thu', '2026-11-19', 30, 0.6),
  ];
  const r = heavyNight({ tasks, today: '2026-11-16', settings: s, weekStart: '2026-11-14' });
  assert.equal(r.dropped.length, 1);
  assert.equal(r.dropped[0].id, 'wed');
  assert.equal(r.tasks.find((t) => t.id === 'wed').status, 'skipped');
  assert.equal(r.placed[0].date, '2026-11-18');
  assert.match(r.message, /dropped/);
});

test('a moved task that is itself lowest priority gets dropped', () => {
  const tasks = [task('mon', '2026-11-16', 30, 0.1), task('tue', '2026-11-17', 30, 0.5), task('wed', '2026-11-18', 30, 0.5), task('thu', '2026-11-19', 30, 0.5)];
  const r = heavyNight({ tasks, today: '2026-11-16', settings: mkSettings(), weekStart: '2026-11-14' });
  assert.equal(r.placed.length, 0);
  assert.equal(r.dropped[0].id, 'mon');
  assert.equal(r.tasks.filter((t) => t.status === 'todo').length, 3);
});

test('never moves into taper Thu or Fri', () => {
  const tasks = [task('mon', '2026-12-07', 20, 0.9, 'todo', { weekStart: '2026-12-05' })];
  const s = mkSettings();
  const r = heavyNight({ tasks, today: '2026-12-09', settings: s, weekStart: '2026-12-05' });
  assert.equal(r.moved.length, 0);
  const tasks2 = [task('wed', '2026-12-09', 20, 0.9, 'todo', { weekStart: '2026-12-05' })];
  const r2 = heavyNight({ tasks: tasks2, today: '2026-12-09', settings: s, weekStart: '2026-12-05' });
  assert.equal(r2.placed.length, 0);
  assert.equal(r2.dropped.length, 1);
  assert.ok(!r2.tasks.some((t) => t.date === '2026-12-10' || t.date === '2026-12-11'));
});
