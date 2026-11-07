// Shared UI pieces: icons, toast, bottom sheets, and small renderers.
import { html, raw, setHTML } from './safe-html.js';
import { SECTIONS, CAUSES } from './data/act.js';

// Icons are trusted, app-authored SVG.
const PATHS = {
  today: '<path d="M12 3v2M12 19v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M3 12h2M19 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"/><circle cx="12" cy="12" r="4"/>',
  plan: '<rect x="3" y="4.5" width="18" height="16" rx="3"/><path d="M3 9.5h18M8 2.5v4M16 2.5v4"/><path d="M7.5 13.5h3M7.5 17h6"/>',
  log: '<path d="M8 6h12M8 12h12M8 18h12"/><circle cx="4" cy="6" r="1"/><circle cx="4" cy="12" r="1"/><circle cx="4" cy="18" r="1"/>',
  tests: '<path d="M9 3h6a1 1 0 0 1 1 1v1H8V4a1 1 0 0 1 1-1z"/><path d="M8 5H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><path d="M8.5 13l2.5 2.5 4.5-5"/>',
  more: '<circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/>',
  redo: '<path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 4v7h-7"/>',
  explain: '<path d="M12 3l1.9 4.6L18.5 9.5l-4.6 1.9L12 16l-1.9-4.6L5.5 9.5l4.6-1.9z"/><path d="M19 15l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z"/>',
  progress: '<path d="M3 20h18"/><path d="M5 16l4.5-5 3.5 3 6-7"/><path d="M15 7h4v4"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3h0a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8v0a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  trash: '<path d="M4 7h16M9 7V4.5h6V7M6.5 7l1 13h9l1-13"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>',
  back: '<path d="M15 5l-7 7 7 7"/>',
  chev: '<path d="M9 5l7 7-7 7"/>',
  chevLeft: '<path d="M15 5l-7 7 7 7"/>',
  download: '<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>',
  upload: '<path d="M12 16V5M7 10l5-5 5 5M5 20h14"/>',
  moon: '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
  alert: '<path d="M12 4l9 16H3z"/><path d="M12 10v4M12 17.5v.1"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 7.8v.1"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.2"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  book: '<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 21V5M19 19v2H6"/>',
  link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
  eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  camera: '<path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/><circle cx="12" cy="13.5" r="3.5"/>',
  skip: '<path d="M5 5l9 7-9 7z"/><path d="M18 5v14"/>',
  shield: '<path d="M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6z"/>',
  sparkle: '<path d="M12 3l1.9 4.6L18.5 9.5l-4.6 1.9L12 16l-1.9-4.6L5.5 9.5l4.6-1.9z"/>',
  flag: '<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>',
  arrowUp: '<path d="M12 19V5M6 11l6-6 6 6"/>',
  arrowDown: '<path d="M12 5v14M6 13l6 6 6-6"/>',
  dash: '<path d="M6 12h12"/>',
};

export function icon(name, cls = '') {
  const p = PATHS[name] || '';
  return raw(`<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`);
}

export function sectionBadge(section) {
  if (!SECTIONS[section]) return '';
  return html`<span class="badge badge-${section}">${SECTIONS[section].label}</span>`;
}

export function causeBadge(cause, guessedRight) {
  if (guessedRight) return html`<span class="badge badge-warn">Guessed right</span>`;
  if (!CAUSES[cause]) return '';
  return html`<span class="badge">${CAUSES[cause].short}</span>`;
}

export function secClass(section) {
  return SECTIONS[section] ? `sec-${section}` : 'sec-none';
}

export function emptyState({ iconName = 'info', title, body, actionHref, actionLabel, actionData }) {
  return html`<div class="empty">
    ${icon(iconName)}
    <h3>${title}</h3>
    <p>${body}</p>
    ${actionHref ? html`<a class="btn" href="${actionHref}">${actionLabel}</a>` : ''}
    ${actionData ? html`<button class="btn" data-action="${actionData}">${actionLabel}</button>` : ''}
  </div>`;
}

export function topbar(title, { eyebrow = '', back = '', actions = '' } = {}) {
  return html`<header class="topbar"><div class="topbar-inner">
    ${back ? html`<a class="back-btn" href="${back}" aria-label="Back">${icon('back')}</a>` : ''}
    <h1>${eyebrow ? html`<span class="eyebrow">${eyebrow}</span>` : ''}${title}</h1>
    ${actions}
  </div></header>`;
}

export function notice(kind, body, iconName = kind === 'warn' ? 'alert' : 'info') {
  return html`<div class="notice notice-${kind}">${icon(iconName)}<div class="grow">${body}</div></div>`;
}

// ---------------------------------------------------------------- toast

let toastTimer = null;
export function toast(message, { actionLabel, onAction, duration = 5000 } = {}) {
  const wrap = document.getElementById('toasts');
  if (!wrap) return;
  clearTimeout(toastTimer);
  setHTML(
    wrap,
    html`<div class="toast" role="status"><div class="grow">${message}</div>${actionLabel ? html`<button type="button" data-toast-action>${actionLabel}</button>` : ''}</div>`,
  );
  const btn = wrap.querySelector('[data-toast-action]');
  if (btn) {
    btn.addEventListener('click', async () => {
      clearTimeout(toastTimer);
      setHTML(wrap, html``);
      try {
        await onAction();
      } catch (e) {
        console.error(e);
        toast("Couldn't undo that. Try again.");
      }
    });
  }
  toastTimer = setTimeout(() => setHTML(wrap, html``), duration);
}

/** Toast with an Undo button. */
export function undoToast(message, undo) {
  if (!undo) return toast(message);
  toast(message, { actionLabel: 'Undo', onAction: async () => { await undo(); toast('Restored.'); }, duration: 7000 });
}

// ---------------------------------------------------------------- sheet

/**
 * Open a bottom sheet. `content` is html``. `bind(root, close)` attaches listeners.
 * Returns a promise that resolves with the value passed to close().
 */
export function openSheet(content, bind) {
  return new Promise((resolve) => {
    const dlg = document.createElement('dialog');
    dlg.className = 'sheet';
    const inner = document.createElement('div');
    inner.className = 'sheet-inner';
    setHTML(inner, html`<div class="sheet-grab"></div>${content}`);
    dlg.appendChild(inner);
    document.body.appendChild(dlg);
    let result;
    const close = (value) => {
      result = value;
      dlg.close();
    };
    dlg.addEventListener('close', () => {
      dlg.remove();
      resolve(result);
    });
    dlg.addEventListener('click', (e) => {
      if (e.target === dlg) close(undefined);
    });
    inner.addEventListener('click', (e) => {
      const c = e.target.closest('[data-close]');
      if (c) close(c.dataset.close || undefined);
    });
    if (bind) bind(inner, close);
    dlg.showModal();
  });
}

export function confirmSheet({ title, body, confirmLabel = 'Confirm', danger = false, cancelLabel = 'Cancel' }) {
  return openSheet(html`
    <h2>${title}</h2>
    ${body ? html`<p class="muted">${body}</p>` : ''}
    <div class="sheet-actions">
      <button class="btn btn-secondary" data-close="">${cancelLabel}</button>
      <button class="btn ${danger ? 'btn-danger' : ''}" data-close="yes">${confirmLabel}</button>
    </div>`).then((v) => v === 'yes');
}

/** Plain-language error message and console details. */
export function reportError(e, message = 'Something went wrong. Try again.') {
  console.error(e);
  toast(message);
}

export function plural(n, word, pluralWord = `${word}s`) {
  return `${n} ${n === 1 ? word : pluralWord}`;
}

export function fmtMinutes(m) {
  if (m >= 60) {
    const h = Math.floor(m / 60);
    const r = m % 60;
    return r ? `${h} hr ${r} min` : `${h} hr`;
  }
  return `${m} min`;
}
