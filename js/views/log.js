// Error log: filterable list of misses.
import { html, setHTML } from '../safe-html.js';
import * as store from '../store.js';
import { icon, topbar, emptyState, sectionBadge, causeBadge, secClass, undoToast, reportError, plural } from '../ui.js';
import { ALL_SECTIONS, SECTIONS, CAUSES, CAUSE_KEYS } from '../data/act.js';
import { formatDate, ageInDays } from '../logic/dates.js';
import { missDate } from '../logic/focus.js';

export const live = true;

const filters = { section: 'all', topic: 'all', cause: 'all', range: 'all' };
let appliedHash = null;
const RANGES = { all: 'All time', 7: '7 days', 30: '30 days' };

export function render(el, ctx) {
  // A ?section= link applies once per navigation, so later filter taps stick.
  if (ctx.query.section && SECTIONS[ctx.query.section] && appliedHash !== location.hash) {
    filters.section = ctx.query.section;
    filters.topic = 'all';
  }
  appliedHash = location.hash;
  const s = store.state;
  const today = store.today();
  const mats = store.materials();
  const all = s.misses.slice().sort((a, b) => (missDate(b) + (b.createdAt || '')).localeCompare(missDate(a) + (a.createdAt || '')));
  const list = all.filter((m) => {
    if (filters.section !== 'all' && m.section !== filters.section) return false;
    if (filters.topic !== 'all' && m.topic !== filters.topic) return false;
    if (filters.cause !== 'all') {
      if (filters.cause === 'guessed' ? !m.guessedRight : m.cause !== filters.cause || m.guessedRight) return false;
    }
    if (filters.range !== 'all' && ageInDays(missDate(m), today) > Number(filters.range)) return false;
    return true;
  });
  const topics = [...new Set(all.filter((m) => filters.section === 'all' || m.section === filters.section).map((m) => m.topic).filter(Boolean))].sort();
  const sourceName = (id) => {
    const m = mats.find((x) => x.sourceId === id);
    return m ? m.short || m.title : '';
  };

  setHTML(
    el,
    html`${topbar('Error log', { eyebrow: plural(all.length, 'miss', 'misses'), actions: html`<a class="btn btn-sm" href="#/log/new">${icon('plus')}Add</a>` })}
      <div class="stack-lg">
        ${all.length
          ? html`<div class="stack">
              <div class="seg" role="group" aria-label="Section">
                <button data-f="section" data-v="all" aria-pressed="${filters.section === 'all'}">All</button>
                ${ALL_SECTIONS.map((x) => html`<button data-f="section" data-v="${x}" aria-pressed="${filters.section === x}">${SECTIONS[x].label}</button>`)}
              </div>
              <div class="grid-2">
                <select class="input" data-select="cause" aria-label="Cause">
                  <option value="all">Any cause</option>
                  ${CAUSE_KEYS.map((c) => html`<option value="${c}" ${filters.cause === c ? html`selected` : ''}>${CAUSES[c].label}</option>`)}
                  <option value="guessed" ${filters.cause === 'guessed' ? html`selected` : ''}>Guessed right</option>
                </select>
                <select class="input" data-select="range" aria-label="Date range">
                  ${Object.entries(RANGES).map(([k, v]) => html`<option value="${k}" ${String(filters.range) === k ? html`selected` : ''}>${v}</option>`)}
                </select>
              </div>
              ${topics.length
                ? html`<select class="input" data-select="topic" aria-label="Topic">
                    <option value="all">Every topic</option>
                    ${topics.map((t) => html`<option value="${t}" ${filters.topic === t ? html`selected` : ''}>${t}</option>`)}
                  </select>`
                : ''}
            </div>`
          : ''}
        ${!all.length
          ? emptyState({
              iconName: 'log',
              title: 'Your error log is empty',
              body: 'Every miss becomes data. Log a practice test to tag its misses, or quick-add one from a drill or QuizMe.',
              actionHref: '#/log/new',
              actionLabel: 'Add a miss',
            })
          : !list.length
            ? html`<div class="empty"><h3>No misses match</h3><p>Try a different filter.</p><button class="btn btn-secondary" data-action="clear">Clear filters</button></div>`
            : html`<div class="stack">${list.map((m) => missCard(m, sourceName(m.sourceId)))}</div>`}
      </div>`,
  );

  el.addEventListener('click', async (e) => {
    const f = e.target.closest('[data-f]');
    if (f) {
      filters[f.dataset.f] = f.dataset.v;
      if (f.dataset.f === 'section') filters.topic = 'all';
      rerenderLocal(el, ctx);
      return;
    }
    const b = e.target.closest('[data-action]');
    if (!b) return;
    if (b.dataset.action === 'clear') {
      Object.assign(filters, { section: 'all', topic: 'all', cause: 'all', range: 'all' });
      rerenderLocal(el, ctx);
    } else if (b.dataset.action === 'delete') {
      try {
        const undo = await store.deleteMiss(b.dataset.id);
        undoToast('Miss deleted.', undo);
      } catch (err) {
        reportError(err, "Couldn't delete that miss. Try again.");
      }
    }
  });
  el.addEventListener('change', (e) => {
    const sel = e.target.closest('[data-select]');
    if (!sel) return;
    filters[sel.dataset.select] = sel.value;
    rerenderLocal(el, ctx);
  });
}

function rerenderLocal(el, ctx) {
  const fresh = el.cloneNode(false);
  el.replaceWith(fresh);
  render(fresh, ctx);
}

function missCard(m, source) {
  const redo = store.redoFor(m.id);
  return html`<article class="miss ${secClass(m.section)}">
    <div class="miss-head">
      <div class="stack-sm grow">
        <div class="row-wrap">${sectionBadge(m.section)}${causeBadge(m.cause, m.guessedRight)}${m.guessedRight ? causeBadge(m.cause) : ''}
          ${redo && redo.status === 'persistent' ? html`<span class="badge badge-danger">Persistent</span>` : ''}
          ${redo && redo.status === 'retired' ? html`<span class="badge badge-success">Retired</span>` : ''}
        </div>
        <div class="miss-topic">${m.topic || 'Untagged'}${m.questionNumber ? html` <span class="muted">· Q${m.questionNumber}</span>` : ''}</div>
        <div class="small muted">${[source, formatDate(missDate(m))].filter(Boolean).join(', ')}${m.myAnswer || m.correctAnswer ? `. You: ${m.myAnswer || '?'}, key: ${m.correctAnswer || '?'}` : ''}</div>
      </div>
    </div>
    ${m.note ? html`<p class="small mt">${m.note}</p>` : ''}
    ${m.fixLine ? html`<div class="fix-line"><b>Fix</b>${m.fixLine}</div>` : html`<div class="fix-line muted">No fix line yet. Add one so the lesson sticks.</div>`}
    <div class="miss-actions">
      <a class="btn btn-ghost btn-sm" href="#/explain?miss=${m.id}">${icon('explain')}Explain</a>
      <a class="btn btn-ghost btn-sm" href="#/log/${m.id}">${icon('edit')}Edit</a>
      <button class="btn btn-ghost btn-sm" data-action="delete" data-id="${m.id}" aria-label="Delete miss">${icon('trash')}</button>
    </div>
  </article>`;
}
