// IndexedDB wrapper with schema migrations and JSON export/import.
//
// Sync support: every put is stamped with `updatedAt` (edit time) and `_localAt` (written on this device),
// and a delete leaves a tombstone `{ key, deleted: true }` so the delete can reach other devices.
// Writes that come from sync pass `fromSync: true` and keep the incoming `updatedAt`.
import { tombstone } from './logic/sync.js';

export const DB_NAME = 'act-prep';
/** Bump when stores or indexes change, and add a migration below. */
export const SCHEMA_VERSION = 1;

export const STORES = Object.freeze({
  settings: { keyPath: 'id' },
  attempts: { keyPath: 'id', indexes: [['date', 'date']] },
  pacing: { keyPath: 'id', indexes: [['attemptId', 'attemptId']] },
  misses: { keyPath: 'id', indexes: [['section', 'section'], ['attemptId', 'attemptId']] },
  redos: { keyPath: 'missId', indexes: [['dueDate', 'dueDate']] },
  tasks: { keyPath: 'id', indexes: [['weekStart', 'weekStart'], ['date', 'date']] },
  materialUse: { keyPath: 'id', indexes: [['sourceId', 'sourceId']] },
  coachNotes: { keyPath: 'weekStart' },
});
export const STORE_NAMES = Object.freeze(Object.keys(STORES));

/** Migrations by target version. Each runs inside the upgrade transaction. */
const MIGRATIONS = {
  1(db) {
    for (const [name, def] of Object.entries(STORES)) {
      if (db.objectStoreNames.contains(name)) continue;
      const store = db.createObjectStore(name, { keyPath: def.keyPath });
      for (const [idx, path] of def.indexes || []) store.createIndex(idx, path, { unique: false });
    }
  },
};

let dbPromise = null;

export function openDB() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB is not available'));
      return;
    }
    const req = indexedDB.open(DB_NAME, SCHEMA_VERSION);
    req.onupgradeneeded = (event) => {
      const db = req.result;
      const tx = req.transaction;
      for (let v = event.oldVersion + 1; v <= SCHEMA_VERSION; v++) {
        if (MIGRATIONS[v]) MIGRATIONS[v](db, tx);
      }
    };
    req.onsuccess = () => {
      const db = req.result;
      db.onversionchange = () => {
        db.close();
        dbPromise = null;
      };
      resolve(db);
    };
    req.onerror = () => reject(req.error);
    req.onblocked = () => console.warn('IndexedDB upgrade blocked by another open tab');
  });
  return dbPromise;
}

function promisify(req) {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function done(tx) {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error || new Error('Transaction aborted'));
  });
}

export async function getAll(store) {
  const db = await openDB();
  return promisify(db.transaction(store, 'readonly').objectStore(store).getAll());
}

export async function get(store, key) {
  const db = await openDB();
  return promisify(db.transaction(store, 'readonly').objectStore(store).get(key));
}

export async function put(store, value) {
  await batch([{ store, type: 'put', value }]);
  return value;
}

export async function del(store, key) {
  await batch([{ store, type: 'delete', key }]);
}

// Edit stamps only move forward on this device, even if the clock is set back,
// so nothing written after a sync can look older than that sync and get skipped.
const STAMP_KEY = 'act-prep-last-stamp';
let lastStamp = '';
export function stampNow() {
  try {
    const saved = localStorage.getItem(STAMP_KEY) || '';
    if (saved > lastStamp) lastStamp = saved;
  } catch {
    /* storage may be unavailable; the in-memory stamp still works for this session */
  }
  let now = new Date().toISOString();
  if (now <= lastStamp) now = new Date(Date.parse(lastStamp) + 1).toISOString();
  lastStamp = now;
  try {
    localStorage.setItem(STAMP_KEY, now);
  } catch {
    /* see above */
  }
  return now;
}

// Other open tabs of the app reload when this one writes, so a stale tab can't overwrite newer data.
let channel = null;
try {
  // Only in the browser: Node (tests) has BroadcastChannel too, and an open one keeps the process alive.
  channel = typeof window !== 'undefined' && typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('act-prep-db') : null;
} catch {
  channel = null;
}
export function onOtherTabWrite(fn) {
  if (channel) channel.addEventListener('message', () => fn());
}

const localWriteListeners = new Set();
/** Called after any write made on this device (not writes that came from sync). */
export function onLocalWrite(fn) {
  localWriteListeners.add(fn);
  return () => localWriteListeners.delete(fn);
}

/**
 * Several writes in one transaction.
 * ops: [{ store, type: 'put' | 'delete', value?, key?, fromSync?, raw?, trash?, reason?, group?, note? }]
 * raw: write the value exactly as given (used by the one-time upgrade).
 * 'delete' writes a tombstone so the delete syncs.
 */
export async function batch(ops) {
  if (!ops.length) return;
  const db = await openDB();
  const now = stampNow();
  const names = [...new Set(ops.map((o) => o.store))];
  const tx = db.transaction(names, 'readwrite');
  let local = false;
  for (const op of ops) {
    const os = tx.objectStore(op.store);
    if (op.raw) {
      os.put(op.value);
      continue;
    }
    if (op.fromSync) {
      os.put({ ...op.value, _localAt: '' });
      continue;
    }
    local = true;
    if (op.type === 'put') os.put({ ...op.value, updatedAt: now, _localAt: now });
    else if (op.type === 'delete') {
      // A tombstone can keep what was deleted (`trash`), so History can explain it and offer Restore.
      const extra = {};
      if (op.trash) {
        const { _localAt: _a, trash: _t, trashReason: _r, trashGroup: _g, trashNote: _n, deleted: _d, ...kept } = op.trash;
        Object.assign(extra, { trash: kept, trashReason: op.reason || '', trashGroup: op.group || '', trashNote: op.note || '' });
      }
      os.put({ ...tombstone(op.store, op.key, now), ...extra, _localAt: now });
    }
  }
  await done(tx);
  if (channel) channel.postMessage('changed');
  if (local) for (const fn of localWriteListeners) fn();
}

/** True for a live record (not a tombstone). */
export function isLive(r) {
  return !!r && !r.deleted;
}

function clean(r) {
  const { _localAt, ...rest } = r;
  return rest;
}

export async function loadAll() {
  const out = {};
  for (const name of STORE_NAMES) out[name] = await getAll(name);
  return out;
}

// ---------------------------------------------------------------- export / import

export const EXPORT_APP = 'act-prep';

export async function exportAll(now = new Date()) {
  const all = await loadAll();
  const data = {};
  for (const name of STORE_NAMES) data[name] = all[name].filter(isLive).map(clean);
  // The passcode and sync state stay on this device.
  data.settings = data.settings.map((s) => ({ ...s, passcode: '', sync: undefined }));
  return { app: EXPORT_APP, schemaVersion: SCHEMA_VERSION, exportedAt: now.toISOString(), data };
}

/**
 * Check an import file before touching the database.
 * Returns { ok, errors: [...], counts: { store: n } }.
 */
export function validateImport(obj) {
  const errors = [];
  const counts = {};
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
    return { ok: false, errors: ['This file is not an ACT Prep backup.'], counts };
  }
  if (obj.app !== EXPORT_APP) errors.push('This file is not an ACT Prep backup.');
  if (typeof obj.schemaVersion !== 'number') errors.push('The backup has no schema version.');
  else if (obj.schemaVersion > SCHEMA_VERSION) errors.push('This backup is from a newer version of the app. Update the app first.');
  if (!obj.data || typeof obj.data !== 'object') {
    errors.push('The backup has no data.');
    return { ok: false, errors, counts };
  }
  for (const name of Object.keys(obj.data)) {
    if (!STORES[name]) errors.push(`Unknown section "${name}" in the backup.`);
  }
  for (const name of STORE_NAMES) {
    const rows = obj.data[name];
    if (rows === undefined) {
      counts[name] = 0;
      continue;
    }
    if (!Array.isArray(rows)) {
      errors.push(`"${name}" should be a list.`);
      continue;
    }
    const key = STORES[name].keyPath;
    const bad = rows.filter((r) => !r || typeof r !== 'object' || r[key] === undefined || r[key] === null || r[key] === '');
    if (bad.length) errors.push(`${bad.length} item(s) in "${name}" are missing their ${key}.`);
    counts[name] = rows.length;
  }
  return { ok: errors.length === 0, errors, counts };
}

/**
 * Apply a validated backup.
 * mode 'merge': keeps existing rows, adds new ones, and overwrites rows with the same key.
 * mode 'replace': clears every store first.
 */
export async function importData(obj, mode) {
  const check = validateImport(obj);
  if (!check.ok) throw new Error('Invalid backup');
  const ops = [];
  const currentSettings = await get('settings', 'settings');
  const existing = await loadAll();
  const stamp = stampNow();
  for (const name of STORE_NAMES) {
    if (mode === 'replace' && name !== 'settings') {
      // Replacing deletes what isn't in the backup (as tombstones, so other devices follow).
      const kp = STORES[name].keyPath;
      const incoming = new Set((obj.data[name] || []).map((r) => String(r[kp])));
      for (const r of existing[name]) if (isLive(r) && !incoming.has(String(r[kp]))) ops.push({ store: name, type: 'delete', key: r[kp] });
    }
    // Merging keeps this device's settings; replacing takes the backup's.
    if (name === 'settings' && mode === 'merge' && currentSettings) continue;
    for (const row of obj.data[name] || []) {
      let value = row;
      if (name === 'settings') {
        // Keep this device's passcode and sync state; mark every synced field as just edited so it spreads.
        const times = {};
        for (const f of Object.keys(row)) times[f] = stamp;
        value = {
          ...row,
          passcode: (currentSettings && currentSettings.passcode) || row.passcode || '',
          claudeMode: (currentSettings && currentSettings.claudeMode) || row.claudeMode,
          sync: currentSettings && currentSettings.sync,
          _fieldTimes: { ...((currentSettings && currentSettings._fieldTimes) || {}), ...times },
        };
      }
      if (mode === 'merge' && name !== 'settings') {
        // Merge: the newer version of each item wins, so an old backup can't overwrite newer edits.
        const kp = STORES[name].keyPath;
        const local = existing[name].find((r) => String(r[kp]) === String(row[kp]));
        if (local && String(local.updatedAt || '') >= String(row.updatedAt || '')) continue;
        ops.push({ store: name, type: 'put', raw: true, value: { ...row, updatedAt: row.updatedAt || stamp, _localAt: stamp } });
        continue;
      }
      ops.push({ store: name, type: 'put', value });
    }
  }
  await batch(ops);
  // Raw writes skip the usual change signal, so send it here for sync.
  if (ops.length) for (const fn of localWriteListeners) fn();
}
