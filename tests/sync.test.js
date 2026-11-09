import test from 'node:test';
import assert from 'node:assert/strict';
import { Readable } from 'node:stream';
import { outgoingChanges, incomingWrites, tombstone, isNewer, validChange, generateSyncCode, normalizeSyncCode, formatSyncCode } from '../js/logic/sync.js';
import syncHandler from '../api/sync.js';
import { redisAvailable, startRedis } from './redis-helper.js';

const CODE = 'K7QM2XRA9HTDW4PB';
const OTHER = 'ZZZZ0000ZZZZ0000';

const T1 = '2026-11-10T10:00:00.000Z';
const T2 = '2026-11-10T11:00:00.000Z';
const T3 = '2026-11-10T12:00:00.000Z';
const noRedis = !redisAvailable() && 'redis-server not installed';

test('only records this device wrote after the last push go up', () => {
  const all = {
    settings: [{ id: 'settings', passcode: 'secret', availability: { 1: 30 }, claudeMode: 'chat', _fieldTimes: { availability: T2, passcode: T2, claudeMode: T2 } }],
    misses: [
      { id: 'a', topic: 'Commas', updatedAt: T1, _localAt: T1 },
      { id: 'b', topic: 'Modifiers', updatedAt: T2, _localAt: T2 },
      { id: 'c', topic: 'From sync', updatedAt: T3, _localAt: '' },
    ],
  };
  const out = outgoingChanges(all, T1);
  assert.deepEqual(out.map((c) => `${c.store}:${c.key}`), ['misses:b', 'settings:availability']);
  assert.equal(out[0].value._localAt, undefined, 'device-only stamp is stripped');
  assert.ok(!JSON.stringify(out).includes('secret'), 'passcode never leaves the device');
});

test('incoming records win only when edited later; settings merge per field', () => {
  const all = {
    settings: [{ id: 'settings', _fieldTimes: { availability: T2, testDates: T1 } }],
    misses: [{ id: 'a', topic: 'Old', updatedAt: T2 }],
  };
  const w = incomingWrites(all, [
    { store: 'misses', key: 'a', updatedAt: T1, value: { id: 'a', topic: 'Older' } },
    { store: 'misses', key: 'b', updatedAt: T1, value: { id: 'b', topic: 'New' } },
    { store: 'settings', key: 'availability', updatedAt: T1, value: { key: 'availability', value: { 1: 0 } } },
    { store: 'settings', key: 'testDates', updatedAt: T3, value: { key: 'testDates', value: [{ date: '2027-04-14' }] } },
    { store: 'settings', key: 'passcode', updatedAt: T3, value: { key: 'passcode', value: 'evil' } },
  ]);
  assert.deepEqual(w.puts.map((p) => p.value.id), ['b']);
  assert.deepEqual(w.settingsPatch, { testDates: [{ date: '2027-04-14' }] });
  assert.equal(w.fieldTimes.testDates, T3);
});

test('a tombstone deletes on the other device when newer', () => {
  const all = { misses: [{ id: 'a', updatedAt: T1 }] };
  const w = incomingWrites(all, [{ store: 'misses', key: 'a', updatedAt: T2, value: tombstone('misses', 'a', T2) }]);
  assert.equal(w.puts[0].value.deleted, true);
  assert.equal(isNewer({ updatedAt: T1 }, { updatedAt: T1 }), false);
});

test('server rejects malformed or device-only changes', () => {
  assert.equal(validChange({ store: 'misses', key: 'a', updatedAt: T1, value: {} }), true);
  assert.equal(validChange({ store: 'evil', key: 'a', updatedAt: T1, value: {} }), false);
  assert.equal(validChange({ store: 'settings', key: 'passcode', updatedAt: T1, value: {} }), false);
});

function req(body, code = CODE) {
  const raw = JSON.stringify(body);
  const r = Readable.from([Buffer.from(raw)]);
  r.method = 'POST';
  r.headers = { 'content-type': 'application/json', 'content-length': String(Buffer.byteLength(raw)), ...(code ? { 'x-sync-code': code } : {}) };
  return r;
}
function res() {
  const r = { statusCode: 200, headers: {}, body: '' };
  r.setHeader = (k, v) => (r.headers[k] = v);
  r.end = (b) => (r.body = b);
  r.json = () => JSON.parse(r.body);
  return r;
}
async function call(redis, body, code) {
  const r = res();
  await syncHandler(req(body, code), r, { redis });
  return r;
}

test('sync rejects a missing or malformed code and reports missing storage', async () => {
  for (const bad of ['nope', '', 'K7QM-2XRA-9HTD-W4P']) {
    const r = await call({ cmd: () => assert.fail(), pipeline: () => assert.fail() }, { changes: [] }, bad);
    assert.equal(r.statusCode, 401);
  }
  delete process.env.UPSTASH_REDIS_REST_URL;
  delete process.env.KV_REST_API_URL;
  const r2 = res();
  await syncHandler(req({ changes: [] }), r2);
  assert.equal(r2.statusCode, 503);
  assert.deepEqual(r2.json(), { error: 'not_configured' });
});

test('two devices converge through real Redis, newest edit wins', { skip: noRedis }, async () => {
  const srv = await startRedis();
  try {
    // Phone pushes two misses.
    let r = await call(srv.redis, {
      since: 0,
      changes: [
        { store: 'misses', key: 'a', updatedAt: T1, value: { id: 'a', topic: 'Commas' } },
        { store: 'misses', key: 'b', updatedAt: T1, value: { id: 'b', topic: 'Vectors' } },
      ],
    });
    assert.equal(r.statusCode, 200);
    assert.equal(r.json().accepted, 2);
    const phoneSeq = r.json().seq;

    // Laptop edits "a" later and deletes "b"; an older stale edit of "a" is ignored.
    r = await call(srv.redis, {
      since: 0,
      changes: [
        { store: 'misses', key: 'a', updatedAt: T2, value: { id: 'a', topic: 'Commas', fixLine: 'No comma before that' } },
        { store: 'misses', key: 'b', updatedAt: T2, value: tombstone('misses', 'b', T2) },
      ],
    });
    assert.equal(r.json().accepted, 2);
    r = await call(srv.redis, { since: 0, changes: [{ store: 'misses', key: 'a', updatedAt: T1, value: { id: 'a', topic: 'Stale' } }] });
    assert.equal(r.json().accepted, 0);

    // Phone pulls what changed since its last sync.
    r = await call(srv.redis, { since: phoneSeq, changes: [] });
    const recs = r.json().records;
    const a = recs.find((x) => x.key === 'a');
    const b = recs.find((x) => x.key === 'b');
    assert.equal(a.value.fixLine, 'No comma before that');
    assert.equal(b.value.deleted, true);
    assert.equal(r.json().more, false);

    // Nothing new after that.
    r = await call(srv.redis, { since: r.json().seq, changes: [] });
    assert.deepEqual(r.json().records, []);
  } finally {
    srv.stop();
  }
});

test('pull pages in batches', { skip: noRedis }, async () => {
  const srv = await startRedis();
  try {
    for (let i = 0; i < 2; i++) {
      const changes = Array.from({ length: 300 }, (_, k) => ({ store: 'tasks', key: `t${i}-${k}`, updatedAt: T1, value: { id: `t${i}-${k}` } }));
      await call(srv.redis, { changes, pull: false });
    }
    let r = await call(srv.redis, { since: 0, changes: [] });
    assert.equal(r.json().records.length, 500);
    assert.equal(r.json().more, true);
    r = await call(srv.redis, { since: r.json().seq, changes: [] });
    assert.equal(r.json().records.length, 100);
    assert.equal(r.json().more, false);
  } finally {
    srv.stop();
  }
});

test('first sync: settings already on the server win over a fresh device', () => {
  const all = { settings: [{ id: 'settings', availability: { 1: 30 }, _fieldTimes: { availability: T3 } }] };
  const recs = [{ store: 'settings', key: 'availability', updatedAt: T1, value: { key: 'availability', value: { 1: 45 } } }];
  assert.deepEqual(incomingWrites(all, recs).settingsPatch, {});
  assert.deepEqual(incomingWrites(all, recs, { forceSettings: new Set(['availability']) }).settingsPatch, { availability: { 1: 45 } });
});

test('sync codes: generated, normalized from messy typing, formatted', () => {
  const code = generateSyncCode(Array.from({ length: 16 }, (_, i) => i * 7));
  assert.equal(normalizeSyncCode(code), code);
  assert.equal(normalizeSyncCode(' k7qm-2xra 9htd-w4pb '), 'K7QM2XRA9HTDW4PB');
  assert.equal(normalizeSyncCode('K7QM-2XRA-9HTD-W4PO'), 'K7QM2XRA9HTDW4P0', 'O is read as zero');
  assert.equal(normalizeSyncCode('K7QM-2XRA-9HTD-W4PU'), null, 'U is never used');
  assert.equal(formatSyncCode('K7QM2XRA9HTDW4PB'), 'K7QM-2XRA-9HTD-W4PB');
});

test('a device starting a new space uploads everything, including records that came from sync', () => {
  const all = {
    settings: [{ id: 'settings', availability: { 1: 30 }, testDates: [], passcode: 'x', _fieldTimes: {} }],
    misses: [{ id: 'a', updatedAt: T1, _localAt: '' }, { id: 'b', updatedAt: T2, _localAt: T2 }],
  };
  const out = outgoingChanges(all, '', { everything: true, stamp: T3 });
  assert.deepEqual(out.filter((c) => c.store === 'misses').map((c) => c.key), ['a', 'b']);
  const fields = out.filter((c) => c.store === 'settings').map((c) => c.key);
  assert.ok(fields.includes('availability') && fields.includes('testDates'));
  assert.ok(!fields.includes('passcode'));
});

test('different sync codes get separate spaces', { skip: noRedis }, async () => {
  const srv = await startRedis();
  try {
    await call(srv.redis, { changes: [{ store: 'misses', key: 'mine', updatedAt: T1, value: { id: 'mine' } }] }, CODE);
    await call(srv.redis, { changes: [{ store: 'misses', key: 'theirs', updatedAt: T1, value: { id: 'theirs' } }] }, OTHER);
    const a = await call(srv.redis, { since: 0, changes: [] }, CODE);
    const b = await call(srv.redis, { since: 0, changes: [] }, 'zzzz-0000-zzzz-0000');
    assert.deepEqual(a.json().records.map((r) => r.key), ['mine']);
    assert.deepEqual(b.json().records.map((r) => r.key), ['theirs']);
  } finally {
    srv.stop();
  }
});
