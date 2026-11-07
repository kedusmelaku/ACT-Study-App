// Sync across devices: push what this device changed, pull what other devices changed.
// Runs on start, when the app comes back to the foreground or online, a few seconds after edits,
// and every few minutes while open. Everything still works offline; changes wait for the next sync.
import * as store from './store.js';
import * as db from './db.js';
import { outgoingChanges } from './logic/sync.js';

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
  return !!(s.sync && s.sync.enabled && s.passcode);
}

const MESSAGES = {
  401: "Passcode didn't match. Check it in Settings.",
  503: "Sync isn't set up on the server yet. Add the Upstash database in Vercel.",
  offline: "You're offline. Changes will sync when you're back online.",
  network: "Couldn't reach the sync server. Changes will sync next time.",
};

async function post(body) {
  let res;
  try {
    res = await fetch('/api/sync', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-app-passcode': store.state.settings.passcode || '' },
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
    const changes = outgoingChanges(raw, state.lastPushAt || '').filter((c) => !(serverSettings && c.store === 'settings' && serverSettings.has(c.key)));
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

/**
 * Turn sync on with a passcode and run a first sync. Returns a plain-language error or null.
 * Used by Settings and by onboarding on a second device.
 */
export async function enableSync(passcode) {
  await store.saveSettings({ passcode: passcode.trim() });
  await store.saveSyncState({ enabled: true, lastError: null });
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
