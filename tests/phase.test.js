import test from 'node:test';
import assert from 'node:assert/strict';
import { defaultFullTests } from '../js/logic/phase.js';

test('a new test date gets a diagnostic first Saturday and one two weeks before the taper', () => {
  assert.deepEqual(defaultFullTests('2026-12-12', '2026-11-07'), [
    { date: '2026-11-07', sourceId: 'enhanced-1' },
    { date: '2026-11-28', sourceId: 'enhanced-2' },
  ]);
  // A weekday test (April school-day ACT) set up mid-week.
  assert.deepEqual(defaultFullTests('2027-04-13', '2026-12-16'), [
    { date: '2026-12-19', sourceId: 'enhanced-1' },
    { date: '2027-03-27', sourceId: 'enhanced-2' },
  ]);
});

test('close or past test dates get fewer or no full-test days', () => {
  assert.deepEqual(defaultFullTests('2026-12-12', '2026-11-23'), [{ date: '2026-11-28', sourceId: 'enhanced-1' }]);
  assert.deepEqual(defaultFullTests('2026-12-12', '2026-11-30'), [], 'next Saturday is already taper week');
  assert.deepEqual(defaultFullTests('2026-12-12', '2026-12-08'), []);
  assert.deepEqual(defaultFullTests('2026-11-01', '2026-11-07'), []);
  assert.deepEqual(defaultFullTests('', '2026-11-07'), []);
});
