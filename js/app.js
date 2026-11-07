// Router and bootstrapping.
import { html, setHTML } from './safe-html.js';
import * as store from './store.js';
import { icon, toast } from './ui.js';
import { dueRedos } from './logic/redo.js';
import { startSync } from './sync.js';

import * as today from './views/today.js';
import * as plan from './views/plan.js';
import * as log from './views/log.js';
import * as missForm from './views/miss-form.js';
import * as tests from './views/tests.js';
import * as testEntry from './views/test-entry.js';
import * as testDetail from './views/test-detail.js';
import * as more from './views/more.js';
import * as settings from './views/settings.js';
import * as onboarding from './views/onboarding.js';
import * as redo from './views/redo.js';
import * as progress from './views/progress.js';
import * as explain from './views/explain.js';

const ROUTES = [
  { pattern: /^\/?$/, view: today, tab: 'today' },
  { pattern: /^\/today$/, view: today, tab: 'today' },
  { pattern: /^\/plan$/, view: plan, tab: 'plan' },
  { pattern: /^\/log$/, view: log, tab: 'log' },
  { pattern: /^\/log\/new$/, view: missForm, tab: 'log' },
  { pattern: /^\/log\/([^/]+)$/, view: missForm, tab: 'log', keys: ['id'] },
  { pattern: /^\/tests$/, view: tests, tab: 'tests' },
  { pattern: /^\/tests\/new$/, view: testEntry, tab: 'tests' },
  { pattern: /^\/tests\/([^/]+)\/edit$/, view: testEntry, tab: 'tests', keys: ['id'] },
  { pattern: /^\/tests\/([^/]+)$/, view: testDetail, tab: 'tests', keys: ['id'] },
  { pattern: /^\/more$/, view: more, tab: 'more' },
  { pattern: /^\/redo$/, view: redo, tab: 'more', sub: 'redo' },
  { pattern: /^\/explain$/, view: explain, tab: 'more', sub: 'explain' },
  { pattern: /^\/progress$/, view: progress, tab: 'more', sub: 'progress' },
  { pattern: /^\/settings$/, view: settings, tab: 'more', sub: 'settings' },
  { pattern: /^\/onboarding$/, view: onboarding, tab: null },
];

const TABS = [
  { id: 'today', label: 'Today', href: '#/today', icon: 'today' },
  { id: 'plan', label: 'Plan', href: '#/plan', icon: 'plan' },
  { id: 'log', label: 'Log', href: '#/log', icon: 'log' },
  { id: 'tests', label: 'Tests', href: '#/tests', icon: 'tests' },
  { id: 'more', label: 'More', href: '#/more', icon: 'more' },
];
const MORE = [
  { id: 'redo', label: 'Redo', href: '#/redo', icon: 'redo' },
  { id: 'explain', label: 'Explain', href: '#/explain', icon: 'explain' },
  { id: 'progress', label: 'Progress', href: '#/progress', icon: 'progress' },
  { id: 'settings', label: 'Settings', href: '#/settings', icon: 'settings' },
];

let current = null; // { route, params, query, el, cleanup }

function parseHash() {
  const h = location.hash.replace(/^#/, '') || '/today';
  const [path, qs] = h.split('?');
  const query = Object.fromEntries(new URLSearchParams(qs || ''));
  for (const r of ROUTES) {
    const m = path.match(r.pattern);
    if (m) {
      const params = {};
      (r.keys || []).forEach((k, i) => (params[k] = decodeURIComponent(m[i + 1])));
      return { route: r, params, query, path };
    }
  }
  return { route: ROUTES[0], params: {}, query: {}, path: '/today' };
}

export function navigate(hash, { replace = false } = {}) {
  if (replace) {
    history.replaceState(null, '', hash);
    route();
  } else if (location.hash === hash) {
    route();
  } else {
    location.hash = hash;
  }
}

function renderNav(active) {
  const nav = document.getElementById('tabbar');
  const due = store.state.ready ? dueRedos(store.state.redos, store.today()).length : 0;
  const tabLink = (t, isActive, badge) => html`<a class="tab" data-tab="${t.id}" href="${t.href}" ${isActive ? html`aria-current="page"` : ''}>
      <span class="tab-icon">${icon(t.icon)}</span><span>${t.label}</span>${badge ? html`<span class="tab-badge">${badge}</span>` : ''}</a>`;
  setHTML(
    nav,
    html`<div class="brand"><span class="brand-mark">ACT</span><span>ACT Prep</span></div>
      ${TABS.map((t) => tabLink(t, active.tab === t.id && (t.id !== 'more' || !active.sub), t.id === 'more' && due ? due : 0))}
      <div class="tab-more-items"><div class="tab-sep"></div>
        ${MORE.map((t) => tabLink(t, active.sub === t.id, t.id === 'redo' && due ? due : 0))}
      </div>`,
  );
}

function route() {
  if (!store.state.ready) return;
  let parsed = parseHash();
  if (!store.state.settings.onboarded && parsed.route.view !== onboarding) {
    history.replaceState(null, '', '#/onboarding');
    parsed = parseHash();
  }
  const main = document.getElementById('main');
  if (current && current.cleanup) {
    try {
      current.cleanup();
    } catch (e) {
      console.error(e);
    }
  }
  const el = document.createElement('div');
  el.className = 'view view-enter';
  main.replaceChildren(el);
  document.body.classList.toggle('no-nav', parsed.route.view === onboarding);
  renderNav(parsed.route);
  current = { ...parsed, el, cleanup: null };
  const ctx = { params: parsed.params, query: parsed.query, navigate, rerender };
  try {
    current.cleanup = parsed.route.view.render(el, ctx) || null;
  } catch (e) {
    console.error(e);
    setHTML(el, html`<div class="empty mt"><h3>This screen didn't load</h3><p>Something went wrong. Go back to Today and try again.</p><a class="btn" href="#/today">Go to Today</a></div>`);
  }
  window.scrollTo(0, 0);
}

/** Re-render the current view in place (live views only, on data changes). */
function rerender() {
  if (!current) return;
  const view = current.route.view;
  renderNav(current.route);
  if (!view.live) return;
  const y = window.scrollY;
  if (current.cleanup) {
    try {
      current.cleanup();
    } catch (e) {
      console.error(e);
    }
  }
  const el = document.createElement('div');
  el.className = 'view';
  document.getElementById('main').replaceChildren(el);
  current.el = el;
  try {
    current.cleanup = view.render(el, { params: current.params, query: current.query, navigate, rerender }) || null;
  } catch (e) {
    console.error(e);
  }
  window.scrollTo(0, y);
}

async function boot() {
  const q = new URLSearchParams(location.search);
  if (q.get('today')) store.setTodayOverride(q.get('today'));
  try {
    await store.init();
  } catch (e) {
    console.error(e);
    setHTML(
      document.getElementById('main'),
      html`<div class="view"><div class="empty mt"><h3>Storage isn't available</h3><p>This app saves your data on this device. Turn off private browsing or allow site storage, then reload.</p></div></div>`,
    );
    return;
  }
  store.subscribe(rerender);
  startSync();
  let reloadTimer = null;
  store.db.onOtherTabWrite(() => {
    clearTimeout(reloadTimer);
    reloadTimer = setTimeout(() => store.refreshFromDisk().catch((e) => console.error(e)), 150);
  });
  window.addEventListener('hashchange', route);
  window.addEventListener('online', rerender);
  window.addEventListener('offline', rerender);
  document.addEventListener('visibilitychange', async () => {
    if (document.visibilityState !== 'visible') return;
    try {
      const changed = await store.ensureWeek();
      if (!changed) rerender();
    } catch (e) {
      console.error(e);
    }
  });
  route();

  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    // A page that was already controlled by a worker gets a new one only when an update is deployed.
    const hadController = !!navigator.serviceWorker.controller;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (hadController) showUpdateBanner();
    });
    try {
      const reg = await navigator.serviceWorker.register('/sw.js');
      // Check for a new version whenever the app comes back to the foreground, not only on launch.
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') reg.update().catch(() => {});
      });
    } catch (e) {
      console.error('Service worker registration failed', e);
    }
  }
  try {
    if (navigator.storage && navigator.storage.persist) await navigator.storage.persist();
  } catch (e) {
    console.warn(e);
  }
}

/** A small bar at the top: a new version is installed and takes effect on reload. */
function showUpdateBanner() {
  if (document.getElementById('update-bar')) return;
  const bar = document.createElement('div');
  bar.id = 'update-bar';
  bar.className = 'update-bar';
  bar.setAttribute('role', 'status');
  setHTML(
    bar,
    html`<span class="grow">A new version is ready.</span>
      <button type="button" class="btn btn-sm" data-update="reload">Reload</button>
      <button type="button" class="icon-btn" data-update="later" aria-label="Later">${icon('x')}</button>`,
  );
  bar.addEventListener('click', (e) => {
    const b = e.target.closest('[data-update]');
    if (!b) return;
    if (b.dataset.update === 'reload') location.reload();
    else bar.remove();
  });
  document.body.appendChild(bar);
}

window.addEventListener('error', (e) => console.error(e.error || e.message));
window.addEventListener('unhandledrejection', (e) => {
  console.error(e.reason);
  toast('Something went wrong. Try again.');
});

boot();
