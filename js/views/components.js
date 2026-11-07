// Reusable view pieces: task cards and their actions.
import { html } from '../safe-html.js';
import { safeUrl } from '../safe-html.js';
import * as store from '../store.js';
import { icon, sectionBadge, secClass, fmtMinutes, reportError, toast } from '../ui.js';
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
        : t.origin === 'moved'
          ? html`<span class="badge badge-accent">Moved here</span>`
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
          </div>`
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
      } else if (action === 'toggle-done') {
        const t = store.state.tasks.find((x) => x.id === id);
        if (t) await store.setTaskStatus(id, t.status === 'done' ? 'todo' : 'done');
      } else if (action === 'expand') {
        const card = b.closest('.task');
        const d = card.querySelector('.task-more');
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
