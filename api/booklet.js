// POST /api/booklet: store and fetch the official practice-test booklets a user attached, in that
// user's private sync space. Requires the x-sync-code header; without a valid code nothing is read
// or written. Booklets are split into chunks so every request stays under the 2 MB body limit.
// Storage (Redis), with the sync space prefix P (see api/sync.js):
//   P:booklet:<sourceId>:meta               JSON { sha, size, count, at } once every chunk is stored
//   P:booklet:<sourceId>:<sha>:<index>      base64 chunk
// Ops (JSON body):
//   { op: 'list' }                                               -> { booklets: { sourceId: meta } }
//   { op: 'put', sourceId, sha, size, count, index, data }       -> { stored, complete }
//   { op: 'get', sourceId, sha, index }                          -> { data }
import { readJson, send } from './_auth.js';
import { redisFromEnv } from './_redis.js';
import { normalizeSyncCode } from '../js/logic/sync.js';
import { spaceFor } from './sync.js';

export const BOOKLET_IDS = Object.freeze(['enhanced-1', 'enhanced-2', 'enhanced-3', 'enhanced-4']);
export const MAX_CHUNKS = 64;
// The app sends 256 KB of PDF per chunk (about 350 KB of base64). This allows up to about 1 MB.
export const MAX_CHUNK_B64 = 1_000_000;
export const MAX_BOOKLET_BYTES = 15 * 1024 * 1024;

const SHA = /^[0-9a-f]{64}$/;
const B64 = /^[A-Za-z0-9+/]*={0,2}$/;

function validRef(b) {
  return BOOKLET_IDS.includes(b.sourceId) && typeof b.sha === 'string' && SHA.test(b.sha);
}

function chunkKey(prefix, sourceId, sha, i) {
  return `${prefix}booklet:${sourceId}:${sha}:${i}`;
}

export default async function handler(req, res, deps = {}) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return send(res, 405, { error: 'method_not_allowed' });
  }
  const code = normalizeSyncCode(req.headers && req.headers['x-sync-code']);
  if (!code) return send(res, 401, { error: 'bad_code' });
  let body;
  try {
    body = await readJson(req);
  } catch (e) {
    return send(res, e.status || 400, { error: e.status === 413 ? 'too_large' : 'bad_request' });
  }
  const redis = deps.redis || redisFromEnv();
  if (!redis) return send(res, 503, { error: 'not_configured' });
  const prefix = spaceFor(code);
  try {
    if (body.op === 'list') {
      const raw = await redis.pipeline(BOOKLET_IDS.map((id) => ['GET', `${prefix}booklet:${id}:meta`]));
      const booklets = {};
      BOOKLET_IDS.forEach((id, i) => {
        if (!raw[i]) return;
        try {
          booklets[id] = JSON.parse(raw[i]);
        } catch {
          console.error('Bad booklet meta', id);
        }
      });
      return send(res, 200, { booklets });
    }
    if (body.op === 'get') {
      const index = Number(body.index);
      if (!validRef(body) || !Number.isInteger(index) || index < 0 || index >= MAX_CHUNKS) return send(res, 400, { error: 'bad_request' });
      const data = await redis.cmd(['GET', chunkKey(prefix, body.sourceId, body.sha, index)]);
      if (data === null || data === undefined) return send(res, 404, { error: 'not_found' });
      return send(res, 200, { data });
    }
    if (body.op === 'put') {
      const index = Number(body.index);
      const count = Number(body.count);
      const size = Number(body.size);
      const ok =
        validRef(body) &&
        Number.isInteger(count) && count >= 1 && count <= MAX_CHUNKS &&
        Number.isInteger(index) && index >= 0 && index < count &&
        Number.isInteger(size) && size > 0 && size <= MAX_BOOKLET_BYTES &&
        typeof body.data === 'string' && body.data.length > 0 && body.data.length <= MAX_CHUNK_B64 && B64.test(body.data);
      if (!ok) return send(res, 400, { error: 'bad_request' });
      await redis.cmd(['SET', chunkKey(prefix, body.sourceId, body.sha, index), body.data]);
      // The booklet becomes visible to other devices only once every chunk is stored.
      const keys = Array.from({ length: count }, (_, i) => chunkKey(prefix, body.sourceId, body.sha, i));
      const have = Number(await redis.cmd(['EXISTS', ...keys])) || 0;
      if (have < count) return send(res, 200, { stored: true, complete: false });
      const metaKey = `${prefix}booklet:${body.sourceId}:meta`;
      const old = await redis.cmd(['GET', metaKey]);
      await redis.cmd(['SET', metaKey, JSON.stringify({ sha: body.sha, size, count, at: new Date().toISOString() })]);
      // A replaced booklet's old chunks are removed.
      try {
        const prev = old ? JSON.parse(old) : null;
        if (prev && prev.sha !== body.sha && Number.isInteger(prev.count) && prev.count <= MAX_CHUNKS) {
          await redis.cmd(['DEL', ...Array.from({ length: prev.count }, (_, i) => chunkKey(prefix, body.sourceId, prev.sha, i))]);
        }
      } catch (e) {
        console.error('Old booklet cleanup failed', e.message);
      }
      return send(res, 200, { stored: true, complete: true });
    }
    return send(res, 400, { error: 'bad_request' });
  } catch (e) {
    console.error('booklet failed', e.message);
    return send(res, 502, { error: 'storage' });
  }
}
