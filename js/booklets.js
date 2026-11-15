// Official practice-test booklets the user attached: kept on the device (IndexedDB) for offline use
// and copied to the user's private sync space so their other devices download them.
// Never part of the repo, the deployment's static files, or the JSON export.
import * as db from './db.js';
import * as store from './store.js';
import { BOOKLETS } from './data/forms.js';

const PDFJS = new URL('../vendor/pdfjs/pdf.min.js', import.meta.url).href;
const PDFJS_WORKER = new URL('../vendor/pdfjs/pdf.worker.min.js', import.meta.url).href;
const CHUNK_BYTES = 512 * 1024;
const MAX_FILE_BYTES = 15 * 1024 * 1024;

// sourceId -> 'attached' | 'uploading' | 'downloading'
const status = {};
const listeners = new Set();
const docs = new Map();
let syncing = null;

export function onChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
function emit() {
  for (const fn of listeners) {
    try {
      fn();
    } catch (e) {
      console.error(e);
    }
  }
}

export function statusOf(sourceId) {
  return status[sourceId] || null;
}

export function hasBooklet(sourceId) {
  const s = status[sourceId];
  return s === 'attached' || s === 'uploading';
}

/** Read which booklets are on this device. Call once at startup. */
export async function loadStatus() {
  try {
    for (const b of await db.allBooklets()) status[b.sourceId] = b.uploaded || !syncOn() ? 'attached' : 'uploading';
  } catch (e) {
    console.error('Could not read booklets', e);
  }
  emit();
}

function syncOn() {
  const s = store.state.settings.sync;
  return !!(s && s.enabled && s.code);
}

async function loadPdfjs() {
  const pdfjs = await import(PDFJS);
  pdfjs.GlobalWorkerOptions.workerSrc = PDFJS_WORKER;
  return pdfjs;
}

async function sha256(buf) {
  const h = await crypto.subtle.digest('SHA-256', buf);
  return [...new Uint8Array(h)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Attach a booklet PDF for one test. Checks it's the right booklet (form code and page count) before
 * saving. Returns null on success, or a plain message saying what's wrong.
 */
export async function attach(sourceId, file) {
  const want = BOOKLETS[sourceId];
  if (!want) return "This test doesn't have a booklet to attach.";
  if (!file || !(file.type === 'application/pdf' || /\.pdf$/i.test(file.name || ''))) return 'Choose the booklet PDF.';
  if (file.size > MAX_FILE_BYTES) return "That file is too big to be a practice test booklet.";
  const buf = await file.arrayBuffer();
  const head = new TextDecoder().decode(new Uint8Array(buf, 0, Math.min(5, buf.byteLength)));
  if (head !== '%PDF-') return "That file isn't a PDF.";
  let pdf;
  try {
    const pdfjs = await loadPdfjs();
    pdf = await pdfjs.getDocument({ data: new Uint8Array(buf.slice(0)), isEvalSupported: false }).promise;
    const n = pdf.numPages;
    // The form code is printed in the footer of the test pages.
    const page = await pdf.getPage(Math.min(5, n));
    const text = (await page.getTextContent()).items.map((i) => i.str).join(' ');
    if (n !== want.pages || !text.includes(want.code)) {
      return `That isn't the booklet for this test. Look for ${want.code} at the bottom of its pages.`;
    }
  } catch (e) {
    console.error('Booklet check failed', e);
    return "Couldn't read that PDF. Try downloading it again.";
  } finally {
    if (pdf) pdf.destroy();
  }
  const rec = { sourceId, sha: await sha256(buf), size: buf.byteLength, blob: new Blob([buf], { type: 'application/pdf' }), uploaded: false, attachedAt: new Date().toISOString() };
  await db.putBooklet(rec);
  docs.delete(sourceId);
  status[sourceId] = syncOn() ? 'uploading' : 'attached';
  emit();
  syncBooklets().catch(() => {});
  return null;
}

async function post(body) {
  const res = await fetch('/api/booklet', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-sync-code': store.state.settings.sync.code },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`booklet ${body.op} failed: ${res.status}`);
  return res.json();
}

function toBase64(bytes) {
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  return btoa(s);
}
function fromBase64(b64) {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function upload(rec) {
  const bytes = new Uint8Array(await rec.blob.arrayBuffer());
  const count = Math.ceil(bytes.length / CHUNK_BYTES);
  for (let i = 0; i < count; i++) {
    await post({ op: 'put', sourceId: rec.sourceId, sha: rec.sha, size: rec.size, count, index: i, data: toBase64(bytes.subarray(i * CHUNK_BYTES, (i + 1) * CHUNK_BYTES)) });
  }
  await db.putBooklet({ ...rec, uploaded: true });
}

async function download(sourceId, meta) {
  const parts = [];
  for (let i = 0; i < meta.count; i++) {
    const r = await post({ op: 'get', sourceId, sha: meta.sha, index: i });
    parts.push(fromBase64(r.data));
  }
  const blob = new Blob(parts, { type: 'application/pdf' });
  const buf = await blob.arrayBuffer();
  if ((await sha256(buf)) !== meta.sha) throw new Error('Booklet download did not match');
  await db.putBooklet({ sourceId, sha: meta.sha, size: buf.byteLength, blob, uploaded: true, attachedAt: meta.at || new Date().toISOString() });
  docs.delete(sourceId);
}

/** Upload booklets attached here, and download ones attached on other devices. Safe to call often. */
export function syncBooklets() {
  if (!syncOn() || (typeof navigator !== 'undefined' && navigator.onLine === false)) return Promise.resolve();
  if (syncing) return syncing;
  syncing = (async () => {
    const local = new Map((await db.allBooklets()).map((b) => [b.sourceId, b]));
    for (const rec of local.values()) {
      if (rec.uploaded) continue;
      status[rec.sourceId] = 'uploading';
      emit();
      await upload(rec);
      status[rec.sourceId] = 'attached';
      emit();
    }
    const { booklets } = await post({ op: 'list' });
    for (const [sourceId, meta] of Object.entries(booklets || {})) {
      const mine = local.get(sourceId);
      if (mine && (mine.sha === meta.sha || !mine.uploaded)) continue;
      status[sourceId] = 'downloading';
      emit();
      try {
        await download(sourceId, meta);
        status[sourceId] = 'attached';
      } catch (e) {
        console.error('Booklet download failed', e);
        status[sourceId] = mine ? 'attached' : null;
      }
      emit();
    }
  })()
    .catch((e) => console.error('Booklet sync failed', e))
    .finally(() => {
      syncing = null;
    });
  return syncing;
}

async function docFor(sourceId) {
  if (docs.has(sourceId)) return docs.get(sourceId);
  const p = (async () => {
    const rec = await db.getBooklet(sourceId);
    if (!rec) return null;
    const pdfjs = await loadPdfjs();
    return pdfjs.getDocument({ data: new Uint8Array(await rec.blob.arrayBuffer()), isEvalSupported: false }).promise;
  })();
  docs.set(sourceId, p);
  p.catch(() => docs.delete(sourceId));
  return p;
}

/** Render one booklet page to a canvas `width` CSS pixels wide (sharp on high-density screens). */
export async function renderPage(sourceId, pageNumber, width) {
  const doc = await docFor(sourceId);
  if (!doc) return null;
  const page = await doc.getPage(pageNumber);
  const base = page.getViewport({ scale: 1 });
  const ratio = Math.min(3, (typeof devicePixelRatio === 'number' && devicePixelRatio) || 1);
  const scale = (width / base.width) * ratio;
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement('canvas');
  canvas.width = Math.floor(viewport.width);
  canvas.height = Math.floor(viewport.height);
  await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
  return canvas;
}
