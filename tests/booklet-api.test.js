import test from 'node:test';
import assert from 'node:assert/strict';
import { Readable } from 'node:stream';
import { createHash, randomBytes } from 'node:crypto';
import bookletHandler from '../api/booklet.js';
import { redisAvailable, startRedis } from './redis-helper.js';

const CODE = 'K7QM2XRA9HTDW4PB';
const OTHER = 'ZZZZ0000ZZZZ0000';
const noRedis = !redisAvailable() && 'redis-server not installed';

function req(body, code) {
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
async function call(redis, body, code = CODE) {
  const r = res();
  await bookletHandler(req(body, code), r, { redis });
  return r;
}

// A made-up file standing in for a booklet (random bytes, no real content).
const file = randomBytes(1_300_000);
const sha = createHash('sha256').update(file).digest('hex');
const CHUNK = 512 * 1024;
const chunks = [];
for (let i = 0; i < file.length; i += CHUNK) chunks.push(file.subarray(i, i + CHUNK).toString('base64'));

test('booklet: no sync code, no access', async () => {
  const never = { cmd: () => assert.fail('touched storage'), pipeline: () => assert.fail('touched storage') };
  for (const bad of [null, '', 'nope']) {
    for (const body of [{ op: 'list' }, { op: 'get', sourceId: 'enhanced-3', sha, index: 0 }, { op: 'put', sourceId: 'enhanced-3', sha, size: 1, count: 1, index: 0, data: 'AA==' }]) {
      const r = await call(never, body, bad);
      assert.equal(r.statusCode, 401);
      assert.deepEqual(r.json(), { error: 'bad_code' });
    }
  }
});

test('booklet: rejects bad requests', async () => {
  const never = { cmd: () => assert.fail('touched storage'), pipeline: () => assert.fail('touched storage') };
  for (const body of [
    { op: 'put', sourceId: 'legacy-1', sha, size: 1, count: 1, index: 0, data: 'AA==' },
    { op: 'put', sourceId: 'enhanced-3', sha: 'abc', size: 1, count: 1, index: 0, data: 'AA==' },
    { op: 'put', sourceId: 'enhanced-3', sha, size: 1, count: 1, index: 1, data: 'AA==' },
    { op: 'put', sourceId: 'enhanced-3', sha, size: 1, count: 1, index: 0, data: '<script>' },
    { op: 'get', sourceId: 'enhanced-3', sha, index: -1 },
    { op: 'nope' },
  ]) {
    assert.equal((await call(never, body)).statusCode, 400, JSON.stringify(body).slice(0, 80));
  }
});

test('booklet: a second device with the same sync code gets it; another code gets nothing', { skip: noRedis }, async () => {
  const srv = await startRedis();
  try {
    // Phone uploads chunk by chunk. Until the last chunk, other devices don't see it.
    for (let i = 0; i < chunks.length; i++) {
      const r = await call(srv.redis, { op: 'put', sourceId: 'enhanced-3', sha, size: file.length, count: chunks.length, index: i, data: chunks[i] });
      assert.equal(r.statusCode, 200);
      assert.equal(r.json().complete, i === chunks.length - 1);
      if (i === 0) assert.deepEqual((await call(srv.redis, { op: 'list' })).json().booklets, {});
    }
    // Laptop, same code: lists it, downloads every chunk, and gets the identical file.
    const list = (await call(srv.redis, { op: 'list' })).json().booklets;
    assert.equal(list['enhanced-3'].sha, sha);
    assert.equal(list['enhanced-3'].count, chunks.length);
    const parts = [];
    for (let i = 0; i < list['enhanced-3'].count; i++) {
      const r = await call(srv.redis, { op: 'get', sourceId: 'enhanced-3', sha, index: i });
      assert.equal(r.statusCode, 200);
      parts.push(Buffer.from(r.json().data, 'base64'));
    }
    const got = Buffer.concat(parts);
    assert.equal(createHash('sha256').update(got).digest('hex'), sha);
    // A different sync code sees nothing and can't fetch the chunks.
    assert.deepEqual((await call(srv.redis, { op: 'list' }, OTHER)).json().booklets, {});
    assert.equal((await call(srv.redis, { op: 'get', sourceId: 'enhanced-3', sha, index: 0 }, OTHER)).statusCode, 404);
    // Nothing is stored under a key a request could reach without the code's hashed prefix.
    const keys = await srv.redis.cmd(['KEYS', '*']);
    assert.ok(keys.length > 0 && keys.every((k) => k.startsWith('actprep:s:')));
  } finally {
    srv.stop();
  }
});
