import test from 'node:test';
import assert from 'node:assert/strict';
import { generateWeek, allocateSlots } from '../js/logic/planner.js';
import { computeFocus } from '../js/logic/focus.js';
import { weekDates, addDays } from '../js/logic/dates.js';
import { settings as mkSettings, materials as mkMaterials, attempt, miss } from './helpers.js';

const bench = attempt('bench', '2026-10-01', 'benchmark', { english: 35, math: 35, reading: 33, science: 35 }, 35);

function plan({ weekStart, today, misses = [], existingTasks = [], s = mkSettings(), redos = [], attempts = [bench] }) {
  const focus = computeFocus({ attempts, misses, redos, today });
  return generateWeek({ weekStart, today, settings: s, focus, redos, materials: mkMaterials(s), materialUse: [], attempts, existingTasks });
}

test('deterministic: same inputs give the same plan', () => {
  const misses = [miss('reading', 'Inference', 'trap', '2026-11-12'), miss('math', 'Matrices', 'content', '2026-11-12')];
  const a = plan({ weekStart: '2026-11-14', today: '2026-11-14', misses });
  const b = plan({ weekStart: '2026-11-14', today: '2026-11-14', misses });
  assert.deepEqual(a, b);
  assert.ok(a.tasks.length > 0);
});

test('full-test weekends are fixed (Week 1 and Week 3)', () => {
  const w1 = plan({ weekStart: '2026-11-07', today: '2026-11-07' });
  const ft1 = w1.tasks.filter((t) => t.type === 'full_test');
  assert.equal(ft1.length, 1);
  assert.equal(ft1[0].date, '2026-11-07');
  assert.equal(ft1[0].materialRef.sourceId, 'enhanced-1');
  assert.equal(w1.tasks.filter((t) => t.date === '2026-11-07').length, 1, 'nothing else on the full-test day');

  const w3 = plan({ weekStart: '2026-11-21', today: '2026-11-21', misses: [miss('english', 'Commas', 'careless', '2026-11-20')] });
  const ft3 = w3.tasks.filter((t) => t.type === 'full_test');
  assert.equal(ft3.length, 1);
  assert.equal(ft3[0].date, '2026-11-25');
  assert.equal(ft3[0].materialRef.sourceId, 'enhanced-2');
  // Official full tests are never used for drills.
  for (const t of w3.tasks) {
    if (t.type !== 'full_test' && t.materialRef) assert.ok(!['enhanced-1', 'enhanced-2'].includes(t.materialRef.sourceId));
  }
});

test('done and skipped tasks are never rewritten', () => {
  const first = plan({ weekStart: '2026-11-14', today: '2026-11-14' });
  const tasks = first.tasks.map((t) => ({ ...t }));
  const done = tasks.find((t) => t.date === '2026-11-16');
  done.status = 'done';
  const skipped = tasks.find((t) => t.date === '2026-11-17');
  skipped.status = 'skipped';
  const snapshot = JSON.parse(JSON.stringify([done, skipped]));
  const again = plan({
    weekStart: '2026-11-14',
    today: '2026-11-15',
    existingTasks: tasks,
    misses: [miss('english', 'Commas', 'careless', '2026-11-15'), miss('english', 'Modifiers', 'trap', '2026-11-15')],
  });
  const d2 = again.tasks.find((t) => t.id === done.id);
  const s2 = again.tasks.find((t) => t.id === skipped.id);
  assert.deepEqual(d2, snapshot[0]);
  assert.deepEqual(s2, snapshot[1]);
  // No new task is added on a day whose slot is already used by the done task.
  assert.equal(again.tasks.filter((t) => t.date === '2026-11-16').length, 1);
  // Past todo tasks are kept as they were.
  const sat = tasks.filter((t) => t.date === '2026-11-14');
  for (const t of sat) assert.ok(again.tasks.some((x) => x.id === t.id));
});

test('nothing is scheduled on taper logistics days or test day', () => {
  const misses = [miss('reading', 'Inference', 'trap', '2026-12-01')];
  const redos = [{ missId: misses[0].id, dueDate: '2026-12-10', interval: 3, streak: 0, history: [], status: 'active' }];
  const w5 = plan({ weekStart: '2026-12-05', today: '2026-12-05', misses, redos });
  assert.ok(!w5.tasks.some((t) => t.date === '2026-12-10' || t.date === '2026-12-11'));
  // Mon to Wed are review only: no drills or sets.
  for (const t of w5.tasks.filter((x) => ['2026-12-07', '2026-12-08', '2026-12-09'].includes(x.date))) {
    assert.ok(['review', 'redo'].includes(t.type), t.type);
  }
  // Exactly one final timed set over the taper weekend.
  assert.equal(w5.tasks.filter((t) => t.type === 'section_set').length, 1);
  const w6 = plan({ weekStart: '2026-12-12', today: '2026-12-12', misses });
  assert.ok(!w6.tasks.some((t) => t.date === '2026-12-12'));
});

test('busy dates get no tasks and heavy nights get no tasks', () => {
  const s = mkSettings({ busyDates: { '2026-11-17': 0 }, heavyNights: ['2026-11-18'] });
  const w = plan({ weekStart: '2026-11-14', today: '2026-11-14', s });
  assert.ok(!w.tasks.some((t) => t.date === '2026-11-17' || t.date === '2026-11-18'));
});

test('slot allocation: top section gets at least half, weak sections get one', () => {
  const focus = computeFocus({
    attempts: [bench],
    misses: [miss('english', 'Commas', 'careless', '2026-11-13'), miss('english', 'Commas', 'careless', '2026-11-13'), miss('math', 'Matrices', 'content', '2026-11-13')],
    today: '2026-11-14',
  });
  const c = allocateSlots(6, focus, false);
  const top = focus.ranked[0].section;
  assert.ok(c[top] >= 3);
  for (const r of focus.ranked) if (r.weakness > 0.25) assert.ok(c[r.section] >= 1);
  assert.equal(c.english + c.math + c.reading, 6);
  assert.equal(c.science, 0);
});

test('science gets at most one slot, only with recent misses', () => {
  const misses = [miss('science', 'Graph reading', 'careless', '2026-11-13'), miss('science', 'Graph reading', 'careless', '2026-11-13')];
  const w = plan({ weekStart: '2026-11-14', today: '2026-11-14', misses });
  assert.equal(w.tasks.filter((t) => t.section === 'science').length, 1);
  const w2 = plan({ weekStart: '2026-11-14', today: '2026-11-14' });
  assert.equal(w2.tasks.filter((t) => t.section === 'science').length, 0);
});

test('tasks stay inside the week', () => {
  const w = plan({ weekStart: '2026-11-28', today: '2026-11-28', misses: [miss('math', 'Vectors', 'content', '2026-11-27')] });
  const days = weekDates('2026-11-28');
  for (const t of w.tasks) assert.ok(days.includes(t.date));
});

test('a skipped full test adds no "log the test" task and stays available for a later full-test day', () => {
  const first = plan({ weekStart: '2026-11-07', today: '2026-11-07' });
  const tasks = first.tasks.map((t) => ({ ...t }));
  const full = tasks.find((t) => t.type === 'full_test');
  full.status = 'skipped';
  const again = plan({ weekStart: '2026-11-07', today: '2026-11-07', existingTasks: tasks });
  assert.ok(!again.tasks.some((t) => t.type === 'log_test'));
  assert.equal(again.tasks.find((t) => t.id === full.id).status, 'skipped');
  // Adding a new full-test day picks the unused Practice Test 1 again.
  const s = mkSettings({ fullTests: [...mkSettings().fullTests, { date: '2026-11-08', sourceId: 'enhanced-1' }], availability: { ...mkSettings().availability, 0: 180 } });
  const moved = plan({ weekStart: '2026-11-07', today: '2026-11-07', existingTasks: tasks, s });
  const sunday = moved.tasks.find((t) => t.date === '2026-11-08' && t.type === 'full_test');
  assert.equal(sunday.materialRef.sourceId, 'enhanced-1');
});

test('rescheduling a drill pins a copy on the new day that regeneration keeps', async () => {
  const { rescheduleTask, rescheduleProblem } = await import('../js/logic/planner.js');
  const s = mkSettings();
  const first = plan({ weekStart: '2026-11-14', today: '2026-11-16', misses: [miss('reading', 'Inference', 'trap', '2026-11-13')] });
  const mon = first.tasks.find((t) => t.date === '2026-11-16' && t.type === 'drill');
  assert.equal(rescheduleProblem(mon, '2026-11-15', '2026-11-16', s), 'Pick today or a later day.');
  const { original, copy } = rescheduleTask(mon, '2026-11-19', s);
  assert.equal(original.status, 'moved');
  assert.equal(copy.date, '2026-11-19');
  assert.equal(copy.pinned, true);
  const tasks = first.tasks.map((t) => (t.id === mon.id ? original : t)).concat(copy);
  const again = plan({ weekStart: '2026-11-14', today: '2026-11-16', existingTasks: tasks, misses: [miss('reading', 'Inference', 'trap', '2026-11-13')] });
  assert.ok(again.tasks.some((t) => t.id === copy.id && t.date === '2026-11-19'), 'pinned copy survives regeneration');
  assert.ok(!again.tasks.some((t) => t.date === '2026-11-16' && t.status === 'todo'), 'the day it moved off is not refilled');
});

test('rescheduling a full test moves its full-test day and the planner builds it there', async () => {
  const { rescheduleTask, rescheduleProblem } = await import('../js/logic/planner.js');
  const s = mkSettings({ availability: { ...mkSettings().availability, 0: 180 } });
  const first = plan({ weekStart: '2026-11-07', today: '2026-11-07', s });
  const full = first.tasks.find((t) => t.type === 'full_test');
  const { original, settingsPatch } = rescheduleTask(full, '2026-11-08', s);
  assert.deepEqual(settingsPatch.fullTests.map((f) => f.date), ['2026-11-08', '2026-11-25']);
  const s2 = { ...s, ...settingsPatch };
  const tasks = first.tasks.map((t) => (t.id === full.id ? original : t));
  const again = plan({ weekStart: '2026-11-07', today: '2026-11-07', existingTasks: tasks, s: s2 });
  const sunday = again.tasks.find((t) => t.date === '2026-11-08' && t.type === 'full_test');
  assert.equal(sunday.materialRef.sourceId, 'enhanced-1');
  assert.ok(!again.tasks.some((t) => t.type === 'log_test' && t.date === '2026-11-08'));
  assert.equal(rescheduleProblem(full, '2026-11-25', '2026-11-07', s), 'Another full test is already on that day.');
  assert.equal(rescheduleProblem(full, '2026-12-10', '2026-11-07', s), 'No studying is planned that day. Pick another day.');
});

test('a weekend block is sized for a longer legacy section, so the day is not overbooked', () => {
  const s = mkSettings({ legacyTests: { 'legacy-1': { name: 'L1' } } });
  const misses = [miss('math', 'Matrices', 'content', '2026-11-13'), miss('math', 'Vectors', 'content', '2026-11-13')];
  const w = plan({ weekStart: '2026-11-14', today: '2026-11-14', misses, s, attempts: [attempt('b', '2026-10-01', 'benchmark', { english: 35, math: 33, reading: 35 }, 35)] });
  const sat = w.tasks.filter((t) => t.date === '2026-11-14');
  const set = sat.find((t) => t.type === 'section_set');
  assert.equal(set.section, 'math');
  assert.match(set.detail, /60 questions/);
  assert.ok(sat.reduce((a, t) => a + t.minutes, 0) <= 150, 'Saturday fits its 150 minutes');
});

test('science stays at one slot a week even after an earlier science task is done', () => {
  const misses = [miss('science', 'Graph reading', 'careless', '2026-11-13'), miss('science', 'Graph reading', 'careless', '2026-11-13')];
  const first = plan({ weekStart: '2026-11-14', today: '2026-11-14', misses });
  const tasks = first.tasks.map((t) => ({ ...t }));
  const sci = tasks.find((t) => t.section === 'science');
  assert.ok(sci);
  sci.status = 'done';
  const later = plan({ weekStart: '2026-11-14', today: addDays(sci.date, 1), existingTasks: tasks, misses: [...misses, miss('science', 'Graph reading', 'careless', addDays(sci.date, 1))] });
  assert.equal(later.tasks.filter((t) => t.section === 'science' && t.status !== 'moved').length, 1);
});

test('rescheduling a redo task postpones its due redos instead of duplicating the task', async () => {
  const { rescheduleTask } = await import('../js/logic/planner.js');
  const { createRedo } = await import('../js/logic/redo.js');
  const misses = [miss('reading', 'Inference', 'trap', '2026-11-12'), miss('math', 'Vectors', 'content', '2026-11-12')];
  const redos = misses.map((m) => createRedo(m.id, '2026-11-12')); // due Nov 15
  redos.push({ ...createRedo('later', '2026-11-20') }); // due Nov 23, not covered
  const first = plan({ weekStart: '2026-11-14', today: '2026-11-16', misses, redos });
  const redoTask = first.tasks.find((t) => t.type === 'redo' && t.date === '2026-11-16');
  assert.ok(redoTask);
  const { original, copy, redoUpdates } = rescheduleTask(redoTask, '2026-11-19', mkSettings(), { redos });
  assert.equal(original.status, 'moved');
  assert.equal(copy.date, '2026-11-19');
  assert.equal(copy.pinned, true);
  assert.equal(copy.count, 2);
  assert.deepEqual(redoUpdates.map((r) => r.dueDate), ['2026-11-19', '2026-11-19']);
  const newRedos = redos.map((r) => redoUpdates.find((u) => u.missId === r.missId) || r);
  const tasks = first.tasks.map((t) => (t.id === redoTask.id ? original : t)).concat(copy);
  const again = plan({ weekStart: '2026-11-14', today: '2026-11-16', existingTasks: tasks, misses, redos: newRedos });
  const redoTasks = again.tasks.filter((t) => t.type === 'redo' && t.status === 'todo');
  assert.deepEqual(redoTasks.map((t) => t.id), [copy.id], 'exactly one redo session, the rescheduled one');
});

test('a skipped redo session is not replaced by a second one the same night', () => {
  const misses = [miss('reading', 'Inference', 'trap', '2026-11-12')];
  const redos = [{ missId: misses[0].id, dueDate: '2026-11-16', interval: 3, streak: 0, history: [], status: 'active' }];
  const first = plan({ weekStart: '2026-11-14', today: '2026-11-16', misses, redos });
  const tasks = first.tasks.map((t) => (t.type === 'redo' && t.date === '2026-11-16' ? { ...t, status: 'skipped' } : t));
  const again = plan({ weekStart: '2026-11-14', today: '2026-11-16', existingTasks: tasks, misses, redos });
  assert.equal(again.tasks.filter((t) => t.type === 'redo' && t.date === '2026-11-16').length, 1);
  assert.ok(again.tasks.some((t) => t.type === 'redo' && t.date === '2026-11-17' && t.status === 'todo'), 'the still-due redo comes back the next study day');
});

test('other tasks cannot be moved onto a full-test day', async () => {
  const { rescheduleProblem } = await import('../js/logic/planner.js');
  const drill = { id: 'd', type: 'drill', status: 'todo', date: '2026-11-16', minutes: 30 };
  assert.equal(rescheduleProblem(drill, '2026-11-25', '2026-11-16', mkSettings()), 'That day is saved for a full test. Pick another day.');
  assert.equal(rescheduleProblem(drill, '2026-11-24', '2026-11-16', mkSettings()), null);
});
