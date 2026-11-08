// History: skipped, moved, dropped, deleted, and plan-replaced items, so nothing disappears without a reason.
import { html, setHTML } from '../safe-html.js';
import * as store from '../store.js';
import { icon, topbar, emptyState, sectionBadge, toast, reportError, plural } from '../ui.js';
import { openReschedule } from './components.js';
import { SECTIONS, ATTEMPT_KINDS } from '../data/act.js';
import { formatDate, dateOf, compareDates, addDays } from '../logic/dates.js';

export const live = true;

const DAYS_BACK = 56;
let filter = 'all';

const FILTERS = { all: 'All', skipped: 'Skipped', moved: 'Moved', deleted: 'Deleted', plan: 'Plan changes' };

function when(iso) {
  const d = dateOf(iso);
  return d ? formatDate(d) : '';
}

function taskEvents(today) {
  const since = addDays(today, -DAYS_BACK);
  const out = [];
  for (const t of store.state.tasks) {
    if (compareDates(t.date, since) < 0) continue;
    if (t.status === 'skipped' && t.dropped) out.push({ kind: 'moved', at: t.updatedAt, task: t, label: 'Dropped by Heavy night (the week was full)' });
    else if (t.status === 'skipped') out.push({ kind: 'skipped', at: t.updatedAt, task: t, label: `Skipped, was planned for ${formatDate(t.date)}` });
    else if (t.status === 'moved') out.push({ kind: 'moved', at: t.updatedAt, task: t, label: t.movedTo ? `Moved from ${formatDate(t.date)} to ${formatDate(t.movedTo)}` : `Moved off ${formatDate(t.date)}` });
  }
  return out;
}

function trashEvents(groups) {
  return groups.map((g) => {
    if (g.reason === 'plan') return { kind: 'plan', at: g.at, group: g };
    return { kind: 'deleted', at: g.at, group: g };
  });
}

function sourceTitle(sourceId) {
  const m = store.materials().find((x) => x.sourceId === sourceId);
  return m ? m.short || m.title : '';
}

function deletedCard(g) {
  const attempt = g.items.find((i) => i.store === 'attempts');
  const misses = g.items.filter((i) => i.store === 'misses').map((i) => i.record);
  let title;
  let sub;
  if (attempt) {
    const a = attempt.record;
    title = `Test: ${a.kind === 'real' ? 'Real ACT' : sourceTitle(a.sourceId) || ATTEMPT_KINDS[a.kind]?.label || 'Practice test'}`;
    sub = `Taken ${formatDate(a.date)}${misses.length ? `, with ${plural(misses.length, 'miss', 'misses')}` : ''}`;
  } else if (misses.length === 1) {
    const m = misses[0];
    title = `Miss: ${m.topic || 'Untagged'}${m.questionNumber ? ` (Q${m.questionNumber})` : ''}`;
    sub = `${SECTIONS[m.section] ? SECTIONS[m.section].label : ''}${m.fixLine ? `. Fix: ${m.fixLine}` : ''}`;
  } else {
    title = plural(misses.length || g.items.length, 'item');
    sub = '';
  }
  const why = g.reason === 'test-edit' ? 'Removed when you edited its test' : 'You deleted this';
  const canRestore = attempt || misses.length;
  return html`<article class="hist">
    <span class="hist-icon">${icon('trash')}</span>
    <div class="grow stack-sm">
      <div class="strong">${title}</div>
      ${sub ? html`<div class="small muted">${sub}</div>` : ''}
      <div class="tiny muted">${why}, ${when(g.at)}</div>
    </div>
    ${canRestore ? html`<button class="btn btn-sm btn-secondary" data-restore="${g.group}">Restore</button>` : ''}
  </article>`;
}

function planCard(g) {
  const tasks = g.items.filter((i) => i.store === 'tasks').map((i) => i.record);
  return html`<article class="hist">
    <span class="hist-icon">${icon('plan')}</span>
    <div class="grow stack-sm">
      <div class="strong">Plan updated: ${plural(tasks.length, 'task')} replaced</div>
      <div class="small muted">${g.note || 'The plan updated'}, ${when(g.at)}.</div>
      <details><summary class="small strong">What was replaced</summary>
        <ul class="small hist-list">${tasks
          .sort((a, b) => compareDates(a.date, b.date))
          .map((t) => html`<li>${formatDate(t.date)}: ${t.title}</li>`)}</ul>
      </details>
    </div>
  </article>`;
}

function taskCardRow(e, today) {
  const t = e.task;
  const canMove = e.kind === 'skipped';
  return html`<article class="hist">
    <span class="hist-icon">${icon(e.kind === 'skipped' ? 'skip' : 'redo')}</span>
    <div class="grow stack-sm">
      <div class="strong">${t.title}</div>
      <div class="row-wrap">${t.section ? sectionBadge(t.section) : ''}<span class="tiny muted">${e.label}</span></div>
    </div>
    ${canMove ? html`<button class="btn btn-sm btn-secondary" data-resched="${t.id}">Reschedule</button>` : ''}
  </article>`;
}

export function render(el) {
  const today = store.today();
  setHTML(el, html`${topbar('History', { back: '#/more', eyebrow: '' })}<div class="stack"><div class="skeleton"></div><div class="skeleton" style="width:70%"></div></div>`);
  store
    .loadTrash()
    .then((groups) => draw(el, today, groups))
    .catch((e) => {
      console.error(e);
      draw(el, today, []);
    });
}

function draw(el, today, groups) {
  if (!el.isConnected) return;
  const events = [...taskEvents(today), ...trashEvents(groups)].sort((a, b) => String(b.at || '').localeCompare(String(a.at || '')));
  const counts = Object.fromEntries(Object.keys(FILTERS).map((k) => [k, k === 'all' ? events.length : events.filter((e) => e.kind === k).length]));
  const shown = filter === 'all' ? events : events.filter((e) => e.kind === filter);
  setHTML(
    el,
    html`${topbar('History', { back: '#/more', eyebrow: '' })}
      <div class="stack-lg">
        <p class="small muted">The last 8 weeks. Deleted items can be restored for ${store.TRASH_DAYS} days.</p>
        <div class="seg" role="group" aria-label="Filter">
          ${Object.entries(FILTERS).map(([k, v]) => html`<button type="button" data-filter="${k}" aria-pressed="${filter === k}">${v}${counts[k] ? ` (${counts[k]})` : ''}</button>`)}
        </div>
        ${shown.length
          ? html`<div class="stack">${shown.map((e) => (e.kind === 'deleted' ? deletedCard(e.group) : e.kind === 'plan' ? planCard(e.group) : taskCardRow(e, today)))}</div>`
          : emptyState({ iconName: 'check', title: 'Nothing here', body: filter === 'all' ? 'Skipped, moved, and deleted things will show up here.' : 'Nothing of this kind recently.' })}
      </div>`,
  );
  el.onclick = async (e) => {
    const f = e.target.closest('[data-filter]');
    if (f) {
      filter = f.dataset.filter;
      draw(el, today, groups);
      return;
    }
    const r = e.target.closest('[data-restore]');
    if (r) {
      r.disabled = true;
      try {
        const n = await store.restoreDeleted(r.dataset.restore);
        toast(n ? 'Restored.' : 'Nothing left to restore.');
      } catch (err) {
        r.disabled = false;
        reportError(err, "Couldn't restore that. Try again.");
      }
      return;
    }
    const m = e.target.closest('[data-resched]');
    if (m) await openReschedule([m.dataset.resched]);
  };
}
