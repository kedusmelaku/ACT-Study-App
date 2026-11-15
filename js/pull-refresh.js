// Pull down from the top of the page to reload, like a browser tab. Chrome turns its own pull-to-refresh
// off for an installed app, so the app does it. Changes are synced first when sync is on.
import { isEnabled, syncNow } from './sync.js';
import { raw, setHTML } from './safe-html.js';

const THRESHOLD = 80; // px of pull (after resistance) that triggers a reload
const MAX_PULL = 120;
const SYNC_WAIT_MS = 3000;

export function initPullRefresh() {
  if (typeof window === 'undefined' || !('ontouchstart' in window)) return;
  const el = document.createElement('div');
  el.className = 'ptr';
  el.setAttribute('aria-hidden', 'true');
  setHTML(el, raw('<svg viewBox="0 0 24 24"><path d="M20 12a8 8 0 1 1-2.3-5.6M20 4v5h-5"/></svg>'));
  document.body.appendChild(el);

  let startY = null;
  let pull = 0;
  let busy = false;

  const blocked = (target) =>
    document.querySelector('dialog[open]') ||
    (target && target.closest && target.closest('input, textarea, select, .qgrid, .bk-zoom, [data-no-ptr]'));

  const show = (d) => {
    el.style.transform = `translate(-50%, ${Math.min(d, MAX_PULL) - 48}px) rotate(${d * 3}deg)`;
    el.style.opacity = String(Math.min(1, d / THRESHOLD));
    el.classList.toggle('ready', d >= THRESHOLD);
  };
  const reset = () => {
    el.classList.add('back');
    el.style.transform = 'translate(-50%, -48px)';
    el.style.opacity = '0';
    setTimeout(() => el.classList.remove('back', 'ready'), 250);
  };

  window.addEventListener(
    'touchstart',
    (e) => {
      if (busy || e.touches.length !== 1 || window.scrollY > 0 || blocked(e.target)) {
        startY = null;
        return;
      }
      startY = e.touches[0].clientY;
      pull = 0;
    },
    { passive: true },
  );

  window.addEventListener(
    'touchmove',
    (e) => {
      if (startY === null) return;
      const dy = e.touches[0].clientY - startY;
      if (dy <= 0 || window.scrollY > 0) {
        if (pull) reset();
        pull = 0;
        if (dy < 0) startY = null;
        return;
      }
      // Resistance: the indicator moves about half as far as the finger.
      pull = dy * 0.5;
      show(pull);
    },
    { passive: true },
  );

  const end = async () => {
    if (startY === null) return;
    startY = null;
    if (pull < THRESHOLD) {
      if (pull) reset();
      pull = 0;
      return;
    }
    busy = true;
    el.classList.add('spin');
    try {
      if (isEnabled()) await Promise.race([syncNow().catch(() => {}), new Promise((r) => setTimeout(r, SYNC_WAIT_MS))]);
    } finally {
      location.reload();
    }
  };
  window.addEventListener('touchend', end, { passive: true });
  window.addEventListener('touchcancel', () => {
    startY = null;
    if (pull) reset();
    pull = 0;
  });
}
