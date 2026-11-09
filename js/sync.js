// Sync across devices: push what this device changed, pull what other devices changed.
// Runs on start, when the app comes back to the foreground or online, a few seconds after edits,
// and every few minutes while open. Everything still works offline; changes wait for the next sync.
import * as store from './store.js';
import * as db from './db.js';
import { outgoingChanges, generateSyncCode, normalizeSyncCode } from './logic/sync.js';

const PUSH_BATCH = 300;
const PUSH_MAX_BYTES = 1_500_000;
const DEBOUNCE_MS = 4000;
const PERIODIC_MS = 3 * 60 * 1000;

let running = null;
let again = false;
let debounce = null;

export function syncState() {
  return store.state.settings.sync || {};
}

export function isEnabled() {
  const s = store.state.settings;
  return !!(s.sync && s.sync.enabled && s.sync.code);
}

/** Sync was on before personal sync codes existed: it needs to be started again once. */
export function needsUpgrade() {
  const s = store.state.settings;
  return !!(s.sync && s.sync.enabled && !s.sync.code);
}

const MESSAGES = {
  401: "That sync code isn't valid. Check it in Settings.",
  503: "Sync isn't set up on the server yet. Add the Upstash database in Vercel.",
  offline: "You're offline. Changes will sync when you're back online.",
  network: "Couldn't reach the sync server. Changes will sync next time.",
};

async function post(body) {
  let res;
  try {
    res = await fetch('/api/sync', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-sync-code': syncState().code || '' },
      body: JSON.stringify(body),
    });
  } catch (e) {
    throw Object.assign(e, { code: 'network' });
  }
  if (!res.ok) throw Object.assign(new Error(`HTTP ${res.status}`), { code: res.status === 401 || res.status === 503 ? res.status : 'network' });
  return res.json();
}

/** Split changes into requests that stay well under the 2 MB body limit. */
function batches(changes) {
  const out = [];
  let cur = [];
  let size = 0;
  for (const c of changes) {
    const n = JSON.stringify(c).length;
    if (cur.length && (cur.length >= PUSH_BATCH || size + n > PUSH_MAX_BYTES)) {
      out.push(cur);
      cur = [];
      size = 0;
    }
    cur.push(c);
    size += n;
  }
  if (cur.length) out.push(cur);
  return out;
}

async function run() {
  if (!isEnabled()) return { skipped: true };
  if (navigator.onLine === false) {
    await store.saveSyncState({ lastError: MESSAGES.offline });
    return { skipped: true };
  }
  const startedAt = db.stampNow();
  const state = syncState();
  try {
    let since = Number(state.lastPullSeq) || 0;
    const records = [];
    const pullAll = async () => {
      for (let page = 0; page < 50; page++) {
        const r = await post({ since, changes: [] });
        records.push(...(r.records || []));
        since = r.seq;
        if (!r.more) break;
      }
    };
    // First sync on this device: look at the server first. Settings already there win, so a freshly
    // set-up device doesn't replace real test dates and study times with defaults.
    const first = !state.lastSyncAt;
    let serverSettings = null;
    if (first) {
      await pullAll();
      serverSettings = new Set(records.filter((r) => r.store === 'settings').map((r) => r.key));
    }
    // Push everything this device wrote since the last successful push.
    const raw = await db.loadAll();
    // A device that just started a new sync space uploads everything it has, not only its own recent edits.
    const changes = outgoingChanges(raw, state.lastPushAt || '', { everything: !!state.fillSpace, stamp: startedAt }).filter(
      (c) => !(serverSettings && c.store === 'settings' && serverSettings.has(c.key)),
    );
    let pushed = 0;
    for (const chunk of batches(changes)) {
      const r = await post({ changes: chunk, pull: false });
      pushed += r.accepted || 0;
    }
    // Pull everything other devices changed since the last pull, page by page.
    await pullAll();
    const result = await store.applySync(
      records,
      { lastPushAt: startedAt, lastPullSeq: since, lastSyncAt: new Date().toISOString(), lastError: null },
      { forceSettings: serverSettings },
    );
    return { pushed: changes.length, accepted: pushed, pulled: records.length, applied: result.applied };
  } catch (e) {
    console.error('Sync failed', e);
    await store.saveSyncState({ lastError: MESSAGES[e.code] || MESSAGES.network });
    throw e;
  }
}

/** Sync now. Concurrent calls share one run, plus one follow-up if edits happened meanwhile. */
export function syncNow() {
  if (running) {
    again = true;
    return running;
  }
  running = run().finally(() => {
    running = null;
    if (again) {
      again = false;
      schedule(500);
    }
  });
  return running;
}

function schedule(ms = DEBOUNCE_MS) {
  if (!isEnabled()) return;
  clearTimeout(debounce);
  debounce = setTimeout(() => syncNow().catch(() => {}), ms);
}

/** Start background syncing. Safe to call once at startup. */
export function startSync() {
  db.onLocalWrite(() => schedule());
  window.addEventListener('online', () => schedule(500));
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') schedule(300);
  });
  setInterval(() => {
    if (document.visibilityState === 'visible') syncNow().catch(() => {});
  }, PERIODIC_MS);
  if (isEnabled()) syncNow().catch(() => {});
}

function randomCode() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return generateSyncCode(bytes);
}

/**
 * Start a new sync space from this device: makes a sync code and uploads everything here.
 * Returns { code, problem } where problem is a plain-language error or null.
 */
export async function createSyncSpace() {
  const code = randomCode();
  await store.saveSyncState({ enabled: true, code, fillSpace: true, lastPushAt: '', lastPullSeq: 0, lastSyncAt: null, lastError: null });
  try {
    await syncNow();
    await store.saveSyncState({ fillSpace: false });
    return { code, problem: null };
  } catch (e) {
    return { code, problem: MESSAGES[e.code] || MESSAGES.network };
  }
}

/** Join an existing sync space with its code. Returns a plain-language error or null. */
export async function joinSync(raw) {
  const code = normalizeSyncCode(raw);
  if (!code) return "That doesn't look like a sync code. It has 16 letters and numbers.";
  await store.saveSyncState({ enabled: true, code, fillSpace: false, lastPushAt: '', lastPullSeq: 0, lastSyncAt: null, lastError: null });
  try {
    await syncNow();
    return null;
  } catch (e) {
    return MESSAGES[e.code] || MESSAGES.network;
  }
}

export async function disableSync() {
  await store.saveSyncState({ enabled: false, lastError: null });
}
