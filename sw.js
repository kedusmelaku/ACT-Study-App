// Service worker: offline app shell. Bump CACHE_VERSION whenever a static file changes.
const CACHE_VERSION = 'v10';
const CACHE_NAME = `act-prep-${CACHE_VERSION}`;

const ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/css/styles.css',
  '/icons/icon.svg',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/maskable-512.png',
  '/js/app.js',
  '/js/db.js',
  '/js/safe-html.js',
  '/js/store.js',
  '/js/sync.js',
  '/js/ui.js',
  '/js/data/act.js',
  '/js/data/calendar.js',
  '/js/data/materials.js',
  '/js/data/topics.js',
  '/js/logic/claude-format.js',
  '/js/logic/dates.js',
  '/js/logic/focus.js',
  '/js/logic/phase.js',
  '/js/logic/planner.js',
  '/js/logic/progress.js',
  '/js/logic/redo.js',
  '/js/logic/scoring.js',
  '/js/logic/sync.js',
  '/js/views/chart.js',
  '/js/views/components.js',
  '/js/views/explain.js',
  '/js/views/log.js',
  '/js/views/miss-form.js',
  '/js/views/more.js',
  '/js/views/onboarding.js',
  '/js/views/plan.js',
  '/js/views/progress.js',
  '/js/views/redo.js',
  '/js/views/settings.js',
  '/js/views/test-detail.js',
  '/js/views/test-entry.js',
  '/js/views/tests.js',
  '/js/views/today.js',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS.map((u) => new Request(u, { cache: 'reload' }))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('act-prep-') && k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  // Never cache the Claude proxy.
  if (url.pathname.startsWith('/api/')) return;

  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE_NAME).then((c) => c.put('/index.html', copy));
          }
          return res;
        })
        .catch(() => caches.match('/index.html').then((r) => r || caches.match('/'))),
    );
    return;
  }

  event.respondWith(
    caches.match(req, { ignoreSearch: true }).then(
      (cached) =>
        cached ||
        fetch(req).then((res) => {
          if (res.ok && res.type === 'basic') {
            const copy = res.clone();
            caches.open(CACHE_NAME).then((c) => c.put(req, copy));
          }
          return res;
        }),
    ),
  );
});
