import test from 'node:test';
import assert from 'node:assert/strict';
import { validateImport, SCHEMA_VERSION } from '../js/db.js';

const good = () => ({
  app: 'act-prep',
  schemaVersion: SCHEMA_VERSION,
  exportedAt: '2026-11-07T00:00:00.000Z',
  data: { settings: [{ id: 'settings' }], attempts: [{ id: 'a1', date: '2026-11-07' }], misses: [], redos: [], tasks: [], pacing: [], materialUse: [], coachNotes: [] },
});

test('a valid backup passes with counts', () => {
  const r = validateImport(good());
  assert.equal(r.ok, true);
  assert.equal(r.counts.attempts, 1);
});

test('wrong app, newer schema, bad rows, and unknown stores fail', () => {
  assert.equal(validateImport(null).ok, false);
  assert.equal(validateImport({ ...good(), app: 'other' }).ok, false);
  assert.equal(validateImport({ ...good(), schemaVersion: SCHEMA_VERSION + 1 }).ok, false);
  const bad = good();
  bad.data.attempts.push({ date: 'x' });
  assert.equal(validateImport(bad).ok, false);
  const extra = good();
  extra.data.evil = [];
  assert.equal(validateImport(extra).ok, false);
  const notList = good();
  notList.data.misses = {};
  assert.equal(validateImport(notList).ok, false);
});
