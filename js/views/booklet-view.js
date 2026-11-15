// Show a question's page from an attached booklet, with a switch to its passage or figure page and
// a full-screen view with pinch-zoom. Without a booklet, show the page number instead.
import { html, setHTML } from '../safe-html.js';
import { icon } from '../ui.js';
import { hasBooklet, renderPage, statusOf } from '../booklets.js';

/**
 * Markup for one question. `k` is keyFor(...) (needs page, passagePage), `q` the question number.
 * Call mountBooklet(root) after it's in the DOM.
 */
export function bookletPanel(sourceId, section, q, k) {
  if (!k || !k.page) return '';
  const even = Number(q) % 2 === 0;
  if (!hasBooklet(sourceId)) {
    const st = statusOf(sourceId);
    return html`<p class="small muted bk-pages">${st === 'downloading' ? 'Downloading booklet. ' : ''}Booklet page ${k.page}${k.passagePage ? `, passage starts on page ${k.passagePage}` : ''}.</p>`;
  }
  return html`<div class="bk" data-bk="${sourceId}" data-bk-page="${k.page}" data-bk-pp="${k.passagePage || ''}" data-bk-show="${k.page}">
    ${k.passagePage
      ? html`<div class="seg seg-sm" role="tablist">
          <button type="button" data-bk-go="${k.page}" aria-pressed="true">Question</button>
          <button type="button" data-bk-go="${k.passagePage}" aria-pressed="false">Passage</button>
        </div>`
      : ''}
    <button type="button" class="bk-frame" data-bk-zoom aria-label="Open page ${k.page} full screen"><span class="bk-loading small muted">Loading page ${k.page}</span></button>
    <div class="spread small muted"><span>Page <span data-bk-num>${k.page}</span>${even ? '. F=A, G=B, H=C, J=D on this page.' : ''}</span>${icon('zoom')}</div>
  </div>`;
}

/** Render every booklet panel inside root. Safe to call after each redraw. */
export function mountBooklet(root) {
  for (const box of root.querySelectorAll('[data-bk]')) {
    if (box.dataset.bkBound) continue;
    box.dataset.bkBound = '1';
    show(box, Number(box.dataset.bkShow));
    box.addEventListener('click', (e) => {
      const go = e.target.closest('[data-bk-go]');
      if (go) {
        box.querySelectorAll('[data-bk-go]').forEach((b) => b.setAttribute('aria-pressed', String(b === go)));
        show(box, Number(go.dataset.bkGo));
        return;
      }
      if (e.target.closest('[data-bk-zoom]')) openZoom(box.dataset.bk, Number(box.dataset.bkShow));
    });
  }
}

async function show(box, page) {
  box.dataset.bkShow = String(page);
  const frame = box.querySelector('.bk-frame');
  const num = box.querySelector('[data-bk-num]');
  if (num) num.textContent = String(page);
  frame.setAttribute('aria-label', `Open page ${page} full screen`);
  const token = (box._token = (box._token || 0) + 1);
  try {
    const width = Math.max(280, frame.clientWidth || 340);
    const canvas = await renderPage(box.dataset.bk, page, width);
    if (box._token !== token || !canvas) return;
    canvas.className = 'bk-canvas';
    frame.replaceChildren(canvas);
  } catch (e) {
    console.error('Booklet page failed', e);
    setHTML(frame, html`<span class="small muted">Couldn't show this page. It's page ${page} in the booklet.</span>`);
  }
}

/** Full-screen page with pinch-zoom (and + / - buttons for a mouse). */
async function openZoom(sourceId, page) {
  const dlg = document.createElement('dialog');
  dlg.className = 'bk-zoom';
  setHTML(
    dlg,
    html`<div class="bk-zoom-bar"><span class="strong">Page ${page}</span><span class="grow"></span>
      <button type="button" class="icon-btn" data-z="-1" aria-label="Zoom out">-</button>
      <button type="button" class="icon-btn" data-z="1" aria-label="Zoom in">+</button>
      <button type="button" class="icon-btn" data-close aria-label="Close">${icon('x')}</button></div>
      <div class="bk-zoom-body"><span class="small muted">Loading page ${page}</span></div>`,
  );
  document.body.appendChild(dlg);
  dlg.addEventListener('close', () => dlg.remove());
  dlg.querySelector('[data-close]').addEventListener('click', () => dlg.close());
  dlg.showModal();
  const body = dlg.querySelector('.bk-zoom-body');
  const base = body.clientWidth || window.innerWidth;
  let zoom = 1;
  let canvas;
  try {
    // Render once at a resolution that stays sharp up to about 2.5x zoom.
    canvas = await renderPage(sourceId, page, base * 2.5);
  } catch (e) {
    console.error('Booklet page failed', e);
  }
  if (!canvas) {
    setHTML(body, html`<p class="small muted">Couldn't show this page. It's page ${page} in the booklet.</p>`);
    return;
  }
  canvas.className = 'bk-zoom-canvas';
  canvas.style.width = `${base}px`;
  body.replaceChildren(canvas);
  const setZoom = (z, cx = body.clientWidth / 2, cy = body.clientHeight / 2) => {
    const next = Math.max(1, Math.min(4, z));
    const ratio = next / zoom;
    const x = body.scrollLeft + cx;
    const y = body.scrollTop + cy;
    zoom = next;
    canvas.style.width = `${base * zoom}px`;
    body.scrollLeft = x * ratio - cx;
    body.scrollTop = y * ratio - cy;
  };
  dlg.querySelectorAll('[data-z]').forEach((b) => b.addEventListener('click', () => setZoom(zoom * (b.dataset.z === '1' ? 1.4 : 1 / 1.4))));
  // Two-finger pinch scales around the midpoint between the fingers; one finger drags the page.
  // The body has touch-action: none so the browser doesn't take the gesture for its own zoom.
  const pts = new Map();
  let start = null;
  body.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse') return;
    body.setPointerCapture(e.pointerId);
    pts.set(e.pointerId, e);
    if (pts.size === 2) {
      const [a, b] = [...pts.values()];
      start = { d: Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY), zoom };
    }
  });
  body.addEventListener('pointermove', (e) => {
    if (!pts.has(e.pointerId)) return;
    const prev = pts.get(e.pointerId);
    pts.set(e.pointerId, e);
    if (pts.size === 1) {
      body.scrollLeft -= e.clientX - prev.clientX;
      body.scrollTop -= e.clientY - prev.clientY;
      return;
    }
    if (pts.size !== 2 || !start) return;
    e.preventDefault();
    const [a, b] = [...pts.values()];
    const d = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
    const r = body.getBoundingClientRect();
    setZoom(start.zoom * (d / start.d), (a.clientX + b.clientX) / 2 - r.left, (a.clientY + b.clientY) / 2 - r.top);
  });
  const end = (e) => {
    pts.delete(e.pointerId);
    if (pts.size < 2) start = null;
  };
  body.addEventListener('pointerup', end);
  body.addEventListener('pointercancel', end);
  body.addEventListener('dblclick', (e) => {
    const r = body.getBoundingClientRect();
    setZoom(zoom > 1.5 ? 1 : 2.5, e.clientX - r.left, e.clientY - r.top);
  });
}
