// Reusable view pieces: task cards and their actions.
import { html } from '../safe-html.js';
import { safeUrl } from '../safe-html.js';
import * as store from '../store.js';
import { icon, sectionBadge, secClass, fmtMinutes, reportError, toast, openSheet, undoToast } from '../ui.js';
import { freeMinutes, rescheduleProblem } from '../logic/planner.js';
import { addDays, formatDate, isISODate } from '../logic/dates.js';
import { dayCapacity } from '../logic/phase.js';
import { CAUSES } from '../data/act.js';

const TYPE_LABEL = {
  full_test: 'Full test',
  section_set: 'Timed section',
  drill: 'Drill',
  redo: 'Redo',
  review: 'Review',
  log_test: 'Log test',
};

function taskLink(t) {
  if (t.type === 'redo') return html`<a class="task-link" href="#/redo">Open Redo</a>`;
  if (t.type === 'log_test') return html`<a class="task-link" href="#/tests/new${t.logSourceId ? `?source=${encodeURIComponent(t.logSourceId)}` : ''}">Log the test</a>`;
  if (t.type === 'review') return html`<a class="task-link" href="#/log${t.section ? `?section=${t.section}` : ''}">Open error log</a>`;
  const ref = t.materialRef;
  if (!ref) return '';
  const m = store.materials().find((x) => x.sourceId === ref.sourceId);
  const url = m ? safeUrl(m.url) : '';
  if (!url) return '';
  return html`<a class="task-link" href="${url}" target="_blank" rel="noopener">Open ${m.short || m.title}</a>`;
}

export function taskCard(t, { showActions = true, collapsed = false } = {}) {
  const done = t.status === 'done';
  const statusBadge =
    t.status === 'skipped'
      ? html`<span class="badge">${t.dropped ? 'Dropped' : 'Skipped'}</span>`
      : t.status === 'moved'
        ? html`<span class="badge badge-warn">Moved${t.movedTo ? ' to ' + t.movedTo.slice(5).replace('-', '/') : ''}</span>`
        : t.origin === 'moved' || t.origin === 'rescheduled'
          ? html`<span class="badge badge-accent">${t.origin === 'rescheduled' ? 'Rescheduled' : 'Moved here'}</span>`
          : '';
  const cause = t.cause && CAUSES[t.cause] ? html`<span class="badge">${CAUSES[t.cause].short}</span>` : '';
  // Plan shows a quick checkbox; Today shows Done and Skip buttons and a checkbox once done.
  const canAct = showActions && (collapsed ? t.status === 'todo' || t.status === 'done' : done);
  return html`<article class="task ${secClass(t.section)} is-${t.status}" data-task="${t.id}">
    ${canAct
      ? html`<button class="check" data-action="toggle-done" data-id="${t.id}" aria-pressed="${done ? 'true' : 'false'}" aria-label="${done ? 'Mark not done' : 'Mark done'}">${icon('check')}</button>`
      : ''}
    <div class="task-body">
      <div class="task-title">${t.title}</div>
      <div class="task-meta">
        ${t.section ? sectionBadge(t.section) : html`<span class="badge badge-accent">${TYPE_LABEL[t.type] || 'Task'}</span>`}
        <span class="badge">${icon('clock')}${fmtMinutes(t.minutes)}</span>
        ${t.section ? html`<span class="badge">${TYPE_LABEL[t.type] || 'Task'}</span>` : ''}
        ${cause}${statusBadge}
      </div>
      <div class="task-more" ${collapsed ? html`hidden` : ''}>
        <p class="task-detail">${t.detail}</p>
        <div class="row mt">${taskLink(t)}</div>
      </div>
      ${showActions && !collapsed && t.status === 'todo'
        ? html`<div class="task-actions">
            <button class="btn btn-sm" data-action="done" data-id="${t.id}">${icon('check')}Done</button>
            <button class="btn btn-sm btn-secondary" data-action="skip" data-id="${t.id}">Skip</button>
          </div>
          <button class="btn btn-ghost btn-sm reschedule-btn" data-action="reschedule" data-id="${t.id}">${icon('plan')}Reschedule</button>`
        : ''}
      ${showActions && t.status === 'skipped' && !t.dropped
        ? html`<button class="btn btn-sm btn-secondary reschedule-cta" data-action="reschedule" data-id="${t.id}">${icon('plan')}Reschedule to another day</button>`
        : ''}
      ${showActions && collapsed && t.status === 'todo'
        ? html`<div class="task-more-actions" hidden><button class="btn btn-ghost btn-sm reschedule-btn" data-action="reschedule" data-id="${t.id}">${icon('plan')}Reschedule</button></div>`
        : ''}
      ${collapsed ? html`<button class="btn btn-ghost btn-sm expand-btn" data-action="expand" data-id="${t.id}" aria-expanded="false">Details</button>` : ''}
    </div>
  </article>`;
}

/** Delegated handlers for task buttons inside `root`. */
export function bindTaskActions(root) {
  root.addEventListener('click', async (e) => {
    const b = e.target.closest('[data-action]');
    if (!b || !root.contains(b)) return;
    const id = b.dataset.id;
    const action = b.dataset.action;
    try {
      if (action === 'done') {
        await store.setTaskStatus(id, 'done');
        toast('Nice work. Marked done.', { actionLabel: 'Undo', onAction: () => store.setTaskStatus(id, 'todo') });
      } else if (action === 'skip') {
        await store.setTaskStatus(id, 'skipped');
        toast('Skipped.', { actionLabel: 'Undo', onAction: () => store.setTaskStatus(id, 'todo') });
      } else if (action === 'reschedule') {
        await openReschedule([id]);
      } else if (action === 'toggle-done') {
        const t = store.state.tasks.find((x) => x.id === id);
        if (t) await store.setTaskStatus(id, t.status === 'done' ? 'todo' : 'done');
      } else if (action === 'expand') {
        const card = b.closest('.task');
        const d = card.querySelector('.task-more');
        const extra = card.querySelector('.task-more-actions');
        if (extra) extra.hidden = !extra.hidden;
        if (d) {
          d.hidden = !d.hidden;
          b.textContent = d.hidden ? 'Details' : 'Hide details';
          b.setAttribute('aria-expanded', String(!d.hidden));
        }
      }
    } catch (err) {
      reportError(err, "Couldn't update that task. Try again.");
    }
  });
}

/**
 * Pick a new day for one or more tasks: quick picks for the next study days, or any date.
 * Days that fit everything come first, then days that nearly fit, then the rest.
 */
export async function openReschedule(ids, { title = 'Reschedule' } = {}) {
  const tasks = ids.map((id) => store.state.tasks.find((t) => t.id === id)).filter(Boolean);
  if (!tasks.length) return;
  const s = store.state.settings;
  const today = store.today();
  const minutes = tasks.reduce((a, t) => a + (Number(t.minutes) || 0), 0);
  const problemFor = (d) => tasks.map((t) => rescheduleProblem(t, d, today, s)).find(Boolean) || null;
  const candidates = [];
  for (let i = 0; i <= 21; i++) {
    const d = addDays(today, i);
    if (problemFor(d)) continue;
    const free = freeMinutes(d, store.state.tasks, s);
    const ratio = minutes ? free / minutes : 1;
    candidates.push({ date: d, free, cap: dayCapacity(d, s), group: ratio >= 1 ? 0 : ratio >= 0.75 ? 1 : 2, i });
  }
  const picks = candidates.sort((a, b) => a.group - b.group || a.i - b.i).slice(0, 5);
  const one = tasks.length === 1 ? tasks[0] : null;
  const summary = one
    ? `${one.title}, ${fmtMinutes(one.minutes)}.${one.type === 'full_test' ? ' The full test moves to the new day with everything set up.' : one.type === 'redo' ? ' Your due redos move to that day.' : ''}`
    : `${tasks.length} tasks, ${fmtMinutes(minutes)} in all. They all move to the day you pick.`;
  const chosen = await openSheet(
    html`<h2>${title}</h2>
      <p class="small muted">${summary}</p>
      ${picks.length
        ? html`<div class="list">${picks.map(
            (p) => html`<button class="list-item" data-close="${p.date}">
              <div class="grow"><div class="strong">${p.date === today ? 'Today' : formatDate(p.date)}</div>
                <div class="small muted">${p.free >= minutes ? `${fmtMinutes(p.free)} free` : p.free ? `Only ${fmtMinutes(p.free)} free, it will run long` : p.cap ? 'Already full, it will run long' : 'Normally a day off'}</div></div>
              ${icon('chev', 'chev')}</button>`,
          )}</div>`
        : html`<p class="small muted">No open days in the next three weeks. Pick a date below.</p>`}
      <form class="stack" data-pick>
        <div class="field"><label for="rs-date">Or pick any day</label><input class="input" id="rs-date" type="date" name="date" min="${today}"></div>
        <p class="error-text" data-error hidden></p>
        <div class="sheet-actions"><button type="button" class="btn btn-secondary" data-close="">Cancel</button><button class="btn" type="submit">Move here</button></div>
      </form>`,
    (root, close) => {
      const form = root.querySelector('[data-pick]');
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const d = form.elements.date.value;
        const problem = !isISODate(d) ? 'Pick a date.' : problemFor(d);
        if (problem) {
          const err = form.querySelector('[data-error]');
          err.textContent = problem;
          err.hidden = false;
          return;
        }
        close(d);
      });
    },
  );
  if (!chosen) return;
  try {
    const { moved, skipped, undo } = await store.rescheduleTasks(tasks.map((t) => t.id), chosen);
    const where = chosen === today ? 'today' : formatDate(chosen);
    undoToast(tasks.length === 1 ? `Moved to ${where}.` : `Moved ${moved} task${moved === 1 ? '' : 's'} to ${where}.${skipped ? ` ${skipped} couldn't move.` : ''}`, undo);
  } catch (err) {
    reportError(err, err.userMessage || "Couldn't move that. Try again.");
  }
}
