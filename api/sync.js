// POST /api/sync: push this device's changes, then pull everything changed since `since`.
// Each sync code gets its own space: P = actprep:s:<hash of the code>:. The code itself is never stored.
// Storage (Redis), with prefix P:
//   P:data:<store>  hash  key -> record JSON
//   P:ts:<store>    hash  key -> updatedAt (newest edit wins)
//   P:log           sorted set of "<store>\n<key>", scored by the change sequence number
//   P:seq           counter
import { createHash } from 'node:crypto';
import { readJson, send } from './_auth.js';
import { redisFromEnv } from './_redis.js';
import { validChange, normalizeSyncCode } from '../js/logic/sync.js';

export const PREFIX = 'actprep:';

/** The Redis key prefix for one sync code's space. */
export function spaceFor(code) {
  return `actprep:s:${createHash('sha256').update(code).digest('hex').slice(0, 32)}:`;
}
export const PULL_LIMIT = 500;
export const MAX_PUSH = 400;

const ALL_STORES = ['settings', 'attempts', 'pacing', 'misses', 'redos', 'tasks', 'materialUse', 'coachNotes'];

// Atomic per-record "newest edit wins" write. ISO time strings compare in time order.
// Every key the script touches is declared in KEYS: [seq, log, ts:<store>, data:<store>, ...] in ALL_STORES order.
export const PUSH_SCRIPT = `
local idx = {}
for i = 1, tonumber(ARGV[1]) do idx[ARGV[1 + i]] = i end
local base = 2 + tonumber(ARGV[1])
local n = tonumber(ARGV[base])
local accepted = 0
for r = 0, n - 1 do
  local store = ARGV[base + 1 + r * 4]
  local key = ARGV[base + 2 + r * 4]
  local ts = ARGV[base + 3 + r * 4]
  local val = ARGV[base + 4 + r * 4]
  local s = idx[store]
  if s then
    local tsKey = KEYS[1 + s * 2]
    local dataKey = KEYS[2 + s * 2]
    local cur = redis.call('HGET', tsKey, key)
    if (not cur) or cur < ts then
      redis.call('HSET', tsKey, key, ts)
      redis.call('HSET', dataKey, key, val)
      local seq = redis.call('INCR', KEYS[1])
      redis.call('ZADD', KEYS[2], seq, store .. '\\n' .. key)
      accepted = accepted + 1
    end
  end
end
return accepted
`;

export async function push(redis, changes, prefix = PREFIX) {
  if (!changes.length) return 0;
  const keys = [prefix + 'seq', prefix + 'log'];
  for (const st of ALL_STORES) keys.push(prefix + 'ts:' + st, prefix + 'data:' + st);
  const args = ['EVAL', PUSH_SCRIPT, String(keys.length), ...keys, String(ALL_STORES.length), ...ALL_STORES, String(changes.length)];
  for (const c of changes) args.push(c.store, c.key, c.updatedAt, JSON.stringify({ ...c.value, updatedAt: c.updatedAt }));
  return Number(await redis.cmd(args)) || 0;
}

/** Records changed after sequence `since`, oldest first, up to PULL_LIMIT. */
export async function pull(redis, since, prefix = PREFIX) {
  const flat = await redis.cmd(['ZRANGEBYSCORE', prefix + 'log', `(${since}`, '+inf', 'WITHSCORES', 'LIMIT', '0', String(PULL_LIMIT)]);
  const entries = [];
  for (let i = 0; i < (flat || []).length; i += 2) {
    const member = String(flat[i]);
    const nl = member.indexOf('\n');
    entries.push({ store: member.slice(0, nl), key: member.slice(nl + 1), seq: Number(flat[i + 1]) });
  }
  if (!entries.length) return { records: [], seq: since, more: false };
  const byStore = new Map();
  for (const e of entries) {
    if (!byStore.has(e.store)) byStore.set(e.store, []);
    byStore.get(e.store).push(e);
  }
  const stores = [...byStore.keys()];
  const results = await redis.pipeline(stores.map((s) => ['HMGET', prefix + 'data:' + s, ...byStore.get(s).map((e) => e.key)]));
  const records = [];
  stores.forEach((s, i) => {
    byStore.get(s).forEach((e, j) => {
      const raw = results[i] && results[i][j];
      if (!raw) return;
      try {
        const value = JSON.parse(raw);
        records.push({ store: s, key: e.key, updatedAt: value.updatedAt, value });
      } catch {
        console.error('Bad record in sync storage', s, e.key);
      }
    });
  });
  return { records, seq: entries[entries.length - 1].seq, more: entries.length === PULL_LIMIT };
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
  const changes = Array.isArray(body.changes) ? body.changes : [];
  const since = Number.isFinite(Number(body.since)) && Number(body.since) >= 0 ? Math.floor(Number(body.since)) : 0;
  if (changes.length > MAX_PUSH || !changes.every(validChange)) return send(res, 400, { error: 'bad_request' });
  const prefix = spaceFor(code);
  try {
    const accepted = await push(redis, changes, prefix);
    const out = body.pull === false ? { records: [], seq: since, more: false } : await pull(redis, since, prefix);
    return send(res, 200, { accepted, ...out });
  } catch (e) {
    console.error('sync failed', e.message);
    return send(res, 502, { error: 'storage' });
  }
}
