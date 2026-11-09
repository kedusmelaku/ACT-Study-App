// Sync rules: which records go up, which incoming records win. Pure, shared by the browser and /api/sync.
//
// Every saved record carries `updatedAt` (when it was last edited, used to pick a winner) and,
// on the device only, `_localAt` (when this device wrote it, used to find what still needs pushing).
// Deletes are kept as tombstones `{ <key>, deleted: true, updatedAt }` so they reach other devices.
// Settings sync field by field, so changing study time on one device and test dates on another both stick.

export const SYNC_STORES = Object.freeze(['attempts', 'pacing', 'misses', 'redos', 'tasks', 'materialUse', 'coachNotes']);

export const KEY_PATHS = Object.freeze({
  settings: 'id',
  attempts: 'id',
  pacing: 'id',
  misses: 'id',
  redos: 'missId',
  tasks: 'id',
  materialUse: 'id',
  coachNotes: 'weekStart',
});

/** Settings that stay on each device. Everything else in settings syncs. */
export const LOCAL_SETTINGS = Object.freeze(
  new Set(['id', 'passcode', 'claudeMode', 'lastBackup', 'planWeek', 'planNotes', 'sync', '_fieldTimes', 'updatedAt', '_localAt']),
);

export function isSyncedSetting(field) {
  return !LOCAL_SETTINGS.has(field);
}

export function tombstone(store, key, now) {
  return { [KEY_PATHS[store]]: key, deleted: true, updatedAt: now };
}

/** Incoming wins only when it was edited later. Equal times keep what's here. */
export function isNewer(incoming, local) {
  if (!incoming) return false;
  if (!local) return true;
  return String(incoming.updatedAt || '') > String(local.updatedAt || '');
}

function stripLocal(record) {
  const { _localAt, ...rest } = record;
  return rest;
}

/**
 * Records this device wrote after `since` (an ISO time), ready to push.
 * all: { settings: [record], attempts: [...], ... } straight from IndexedDB, tombstones included.
 * Returns [{ store, key, updatedAt, value }].
 */
export function outgoingChanges(all, since = '', { everything = false, stamp = '' } = {}) {
  // everything: upload all records, including ones that came from another device (used when a
  // device starts a brand-new sync space and must fill it).
  const out = [];
  for (const store of SYNC_STORES) {
    const kp = KEY_PATHS[store];
    for (const r of all[store] || []) {
      if (!r) continue;
      if (!everything && (!r._localAt || r._localAt <= since)) continue;
      const key = r[kp];
      if (key === undefined || key === null || key === '') continue;
      out.push({ store, key: String(key), updatedAt: String(r.updatedAt || r._localAt || stamp), value: stripLocal(r) });
    }
  }
  const settings = (all.settings || []).find((s) => s && s.id === 'settings');
  if (settings) {
    const times = settings._fieldTimes || {};
    const fields = everything ? Object.keys(settings).filter(isSyncedSetting) : Object.keys(times);
    for (const field of fields) {
      const t = times[field] || (everything ? stamp : '');
      if (!isSyncedSetting(field) || !t || (!everything && t <= since)) continue;
      out.push({ store: 'settings', key: field, updatedAt: t, value: { key: field, value: settings[field] === undefined ? null : settings[field], updatedAt: t } });
    }
  }
  return out;
}

/**
 * Decide what to write locally from pulled records.
 * forceSettings: a Set of settings fields to take from the server whatever their edit time
 * (used on a device's first sync, so a freshly set-up device doesn't overwrite real settings).
 * Returns { puts: [{ store, value }], settingsPatch: { field: value }, fieldTimes: { field: time } }.
 */
export function incomingWrites(all, records, { forceSettings = null } = {}) {
  const index = {};
  for (const store of SYNC_STORES) {
    const kp = KEY_PATHS[store];
    index[store] = new Map((all[store] || []).map((r) => [String(r[kp]), r]));
  }
  const settings = (all.settings || []).find((s) => s && s.id === 'settings') || {};
  const times = settings._fieldTimes || {};
  const puts = [];
  const settingsPatch = {};
  const fieldTimes = {};
  // If the same record arrives twice, the newest copy wins.
  const best = new Map();
  for (const rec of records || []) {
    if (!rec || !rec.store || rec.key === undefined) continue;
    const id = `${rec.store}\n${rec.key}`;
    const prev = best.get(id);
    if (!prev || String(rec.updatedAt) > String(prev.updatedAt)) best.set(id, rec);
  }
  for (const rec of best.values()) {
    if (rec.store === 'settings') {
      if (!isSyncedSetting(rec.key) || !rec.value) continue;
      const forced = forceSettings && forceSettings.has(rec.key);
      if (forced || String(rec.updatedAt) > String(times[rec.key] || '')) {
        settingsPatch[rec.key] = rec.value.value;
        fieldTimes[rec.key] = String(rec.updatedAt);
      }
      continue;
    }
    if (!SYNC_STORES.includes(rec.store) || !rec.value || typeof rec.value !== 'object') continue;
    const local = index[rec.store].get(String(rec.key));
    const incoming = { ...rec.value, updatedAt: String(rec.updatedAt) };
    if (isNewer(incoming, local)) puts.push({ store: rec.store, value: incoming });
  }
  return { puts, settingsPatch, fieldTimes };
}

/** Basic shape check for a pushed change, used by the server. */
export function validChange(c) {
  if (!c || typeof c !== 'object') return false;
  if (c.store !== 'settings' && !SYNC_STORES.includes(c.store)) return false;
  if (typeof c.key !== 'string' || !c.key || c.key.length > 200) return false;
  if (typeof c.updatedAt !== 'string' || !c.updatedAt || c.updatedAt.length > 40) return false;
  if (!c.value || typeof c.value !== 'object' || Array.isArray(c.value)) return false;
  if (c.store === 'settings' && !isSyncedSetting(c.key)) return false;
  return true;
}

// ---------------------------------------------------------------- sync codes
// Each person (or each set of devices) syncs into its own space, picked by a private sync code.
// 16 characters from Crockford's base32 (no I, L, O, U) is 80 random bits: not guessable.

const CODE_ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

/** A new random sync code. `bytes` is 16 random bytes (crypto.getRandomValues in the browser). */
export function generateSyncCode(bytes) {
  let out = '';
  for (let i = 0; i < 16; i++) out += CODE_ALPHABET[bytes[i] % 32];
  return out;
}

/** Uppercase, drop spaces and dashes, read look-alikes (O as 0, I and L as 1). Null if not a valid code. */
export function normalizeSyncCode(raw) {
  const s = String(raw || '')
    .toUpperCase()
    .replace(/[\s-]/g, '')
    .replace(/O/g, '0')
    .replace(/[IL]/g, '1');
  return /^[0-9A-HJKMNP-TV-Z]{16}$/.test(s) ? s : null;
}

/** "K7QM2XRA9HTDW4PB" -> "K7QM-2XRA-9HTD-W4PB" */
export function formatSyncCode(code) {
  const c = normalizeSyncCode(code);
  return c ? c.match(/.{4}/g).join('-') : '';
}
