import test from 'node:test';
import assert from 'node:assert/strict';
import { createRedo, answerRedo, isDue, dueByDate } from '../js/logic/redo.js';

test('new miss is due in 3 days', () => {
  const r = createRedo('m1', '2026-11-07');
  assert.equal(r.dueDate, '2026-11-10');
  assert.equal(r.interval, 3);
  assert.equal(r.status, 'active');
});

test('interval sequence 3 -> 7 -> 14', () => {
  let r = createRedo('m1', '2026-11-07');
  r = answerRedo(r, 'right', '2026-11-10');
  assert.equal(r.interval, 7);
  assert.equal(r.dueDate, '2026-11-17');
  r = answerRedo(r, 'right', '2026-11-17');
  assert.equal(r.interval, 14);
  assert.equal(r.dueDate, '2026-12-01');
});

test('retires after 2 consecutive rights at the 14-day interval', () => {
  let r = createRedo('m1', '2026-11-07');
  r = answerRedo(r, 'right', '2026-11-10'); // -> 7
  r = answerRedo(r, 'right', '2026-11-17'); // -> 14
  r = answerRedo(r, 'right', '2026-12-01'); // first right at 14
  assert.equal(r.status, 'active');
  assert.equal(r.interval, 14);
  r = answerRedo(r, 'right', '2026-12-15'); // second right at 14
  assert.equal(r.status, 'retired');
  assert.equal(r.dueDate, null);
  assert.equal(isDue(r, '2027-01-01'), false);
});

test('a wrong between rights at 14 restarts the count', () => {
  let r = createRedo('m1', '2026-11-07');
  r = answerRedo(r, 'right', '2026-11-10');
  r = answerRedo(r, 'right', '2026-11-17');
  r = answerRedo(r, 'right', '2026-12-01');
  r = answerRedo(r, 'wrong', '2026-12-15');
  assert.equal(r.interval, 3);
  assert.equal(r.dueDate, '2026-12-18');
  r = answerRedo(r, 'right', '2026-12-18');
  assert.equal(r.interval, 7);
  assert.notEqual(r.status, 'retired');
});

test('wrong resets to 3 days; second wrong marks persistent', () => {
  let r = createRedo('m1', '2026-11-07');
  r = answerRedo(r, 'right', '2026-11-10');
  r = answerRedo(r, 'wrong', '2026-11-17');
  assert.equal(r.interval, 3);
  assert.equal(r.dueDate, '2026-11-20');
  assert.equal(r.status, 'active');
  r = answerRedo(r, 'wrong', '2026-11-20');
  assert.equal(r.status, 'persistent');
  assert.equal(r.dueDate, '2026-11-23');
  // Persistent misses can still be retired by getting them right.
  r = answerRedo(r, 'right', '2026-11-23');
  assert.equal(r.status, 'persistent');
  assert.equal(r.interval, 7);
});

test('due counts are cumulative per date and counted once', () => {
  const redos = [createRedo('a', '2026-11-01'), createRedo('b', '2026-11-08'), { ...createRedo('c', '2026-11-01'), status: 'retired' }];
  const c = dueByDate(redos, ['2026-11-07', '2026-11-11', '2026-11-12']);
  assert.deepEqual(c, { '2026-11-07': 1, '2026-11-11': 1, '2026-11-12': 0 });
});
