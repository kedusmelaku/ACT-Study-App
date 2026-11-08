// Plan: the week, as a list of days or a board of day columns, with a week-at-a-glance strip on top.
import { html, setHTML } from '../safe-html.js';
import * as store from '../store.js';
import { icon, topbar, notice, fmtMinutes, openSheet } from '../ui.js';
import { taskCard, bindTaskActions } from './components.js';
import { weekDates, addDays, formatDate, formatRange, compareDates, weekdayName } from '../logic/dates.js';
import { SECTIONS } from '../data/act.js';
import { dayPhase, dayCapacity, weekLabel } from '../logic/phase.js';
import { generateWeek } from '../logic/planner.js';

export const live = true;

const VIEW_KEY = 'act-prep-plan-view';
function savedView() {
  try {
    return localStorage.getItem(VIEW_KEY) === 'board' ? 'board' : 'list';
  } catch {
    return 'list';
  }
}
function saveView(v) {
  try {
    localStorage.setItem(VIEW_KEY, v);
  } catch {
    /* the choice just won't be remembered */
  }
}

const TYPE_SHORT = { full_test: 'Full test', section_set: 'Timed section', drill: 'Drill', redo: 'Redo', review: 'Review', log_test: 'Log test' };

const PHASE_NOTE = {
  logistics: 'No study. Logistics checklist.',
  testday: 'Test day.',
  review: 'Review only.',
  'taper-weekend': 'Taper weekend.',
};

export function render(el, ctx) {
  const s = store.state;
  const current = store.currentWeekStart();
  const ws = ctx.query.w && /^\d{4}-\d{2}-\d{2}$/.test(ctx.query.w) ? ctx.query.w : current;
  const today = store.today();
  const isFuture = compareDates(ws, current) > 0;
  let tasks = s.tasks.filter((t) => t.weekStart === ws);
  const view = savedView();
  let preview = false;
  // A future week with only rescheduled (pinned) tasks still gets a preview of the rest, around them.
  if (isFuture && !tasks.some((t) => !t.pinned)) {
    preview = true;
    tasks = generateWeek({
      weekStart: ws,
      today: ws,
      settings: s.settings,
      focus: store.focus(),
      redos: s.redos,
      materials: store.materials(),
      materialUse: s.materialUse,
      attempts: s.attempts,
      existingTasks: tasks,
    }).tasks;
  }
  const dates = weekDates(ws);
  const total = tasks.filter((t) => t.status !== 'moved' && !t.dropped).reduce((a, t) => a + (t.minutes || 0), 0);
  const done = tasks.filter((t) => t.status === 'done').length;
  const countable = tasks.filter((t) => t.status !== 'moved' && !t.dropped).length;
  const notes = ws === current ? s.settings.planNotes || [] : [];

  setHTML(
    el,
    html`${topbar('Plan', { eyebrow: weekLabel(ws, s.settings) })}
      <div class="stack-lg">
        <div class="week-nav">
          <a class="icon-btn" href="#/plan?w=${addDays(ws, -7)}" aria-label="Previous week">${icon('chevLeft')}</a>
          <div class="grow"><div class="strong">${formatRange(dates[0], dates[6])}</div><div class="small muted">${countable ? `${done} of ${countable} done, ${fmtMinutes(total)} planned` : 'Nothing planned'}</div></div>
          <a class="icon-btn" href="#/plan?w=${addDays(ws, 7)}" aria-label="Next week">${icon('chev')}</a>
        </div>
        ${ws !== current ? html`<a class="btn btn-secondary btn-sm" href="#/plan">Back to this week</a>` : ''}
        ${preview ? notice('info', 'Preview. The real plan is made when this week starts.') : ''}
        ${notes.map((n) => notice('info', n))}
        ${weekStrip(dates, tasks, today, s.settings)}
        <div class="seg view-toggle" role="group" aria-label="Plan view">
          <button type="button" data-view="list" aria-pressed="${view === 'list'}">${icon('log')}List</button>
          <button type="button" data-view="board" aria-pressed="${view === 'board'}">${icon('plan')}Board</button>
        </div>
        ${view === 'board'
          ? html`<div class="board" data-board>${dates.map((d) => boardColumn(d, tasks.filter((t) => t.date === d), d === today, s.settings, preview))}</div>`
          : dates.map((d) => dayBlock(d, tasks.filter((t) => t.date === d), d === today, s.settings, preview))}
      </div>`,
  );
  el.classList.toggle('view-wide', view === 'board');
  bindTaskActions(el);

  el.addEventListener('click', (e) => {
    const v = e.target.closest('[data-view]');
    if (v) {
      saveView(v.dataset.view);
      rerenderPlan(el, ctx);
      return;
    }
    const day = e.target.closest('[data-jump]');
    if (day) {
      const target = el.querySelector(`[data-day="${day.dataset.jump}"]`);
      const behavior = matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
      const board = el.querySelector('[data-board]');
      if (target && board && board.scrollWidth > board.clientWidth) {
        // Board on a phone: slide sideways to that day, without moving the page.
        board.scrollTo({ left: target.offsetLeft - board.offsetLeft - 16, behavior });
      } else if (target) {
        target.scrollIntoView({ behavior, block: 'start' });
        if (board) target.animate?.([{ boxShadow: '0 0 0 2px var(--accent)' }, { boxShadow: '0 0 0 0 transparent' }], { duration: 900 });
      }
      return;
    }
    const card = e.target.closest('[data-open-task]');
    if (card && !e.target.closest('[data-action]')) openTask(card.dataset.openTask, preview);
  });

  el.addEventListener('keydown', (e) => {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('[data-open-task]')) {
      e.preventDefault();
      openTask(e.target.dataset.openTask, preview);
    }
  });

  // On a phone, the board opens scrolled to today.
  if (view === 'board') {
    const col = el.querySelector(`[data-day="${today}"]`);
    const board = el.querySelector('[data-board]');
    if (col && board && board.scrollWidth > board.clientWidth) board.scrollLeft = col.offsetLeft - board.offsetLeft - 16;
  }
}

function rerenderPlan(el, ctx) {
  const fresh = el.cloneNode(false);
  el.replaceWith(fresh);
  render(fresh, ctx);
}

/** Seven small tiles: each task is a bar in its section's color; done tasks are solid. */
function weekStrip(dates, tasks, today, settings) {
  return html`<div class="week-strip" role="list" aria-label="Week at a glance">
    ${dates.map((d) => {
      const list = tasks.filter((t) => t.date === d && t.status !== 'moved' && !t.dropped);
      const mins = list.reduce((a, t) => a + (t.minutes || 0), 0);
      const phase = dayPhase(d, settings);
      const off = phase.kind === 'logistics' || phase.kind === 'testday';
      const allDone = list.length && list.every((t) => t.status === 'done' || t.status === 'skipped');
      const label = `${weekdayName(d)}: ${list.length ? `${list.length} task${list.length === 1 ? '' : 's'}, ${fmtMinutes(mins)}` : off ? 'no study' : 'free'}`;
      return html`<button type="button" class="ws-day ${d === today ? 'is-today' : ''} ${off ? 'is-off' : ''}" data-jump="${d}" role="listitem" aria-label="${label}">
        <span class="ws-name">${weekdayName(d, false).slice(0, 1)}</span>
        <span class="ws-date">${Number(d.slice(8))}</span>
        <span class="ws-bars">
          ${list.slice(0, 4).map((t) => html`<i class="sec-${t.section || 'none'} ${t.status === 'done' ? 'done' : t.status === 'skipped' ? 'skip' : ''}"></i>`)}
          ${list.length > 4 ? html`<em>+${list.length - 4}</em>` : ''}
        </span>
        <span class="ws-min">${phase.kind === 'testday' ? 'Test' : phase.fullTest ? 'Full' : off ? 'Off' : list.length ? (allDone ? icon('check') : `${mins}m`) : ''}</span>
      </button>`;
    })}
  </div>`;
}

function boardColumn(date, list, isToday, settings, preview) {
  const phase = dayPhase(date, settings);
  const cap = dayCapacity(date, settings);
  const live = list.filter((t) => t.status !== 'moved' && !t.dropped);
  const mins = live.reduce((a, t) => a + (t.minutes || 0), 0);
  return html`<section class="board-col ${isToday ? 'is-today' : ''}" data-day="${date}">
    <header class="board-head">
      <div class="strong">${isToday ? 'Today' : weekdayName(date, false)} <span class="muted">${formatDate(date, { weekday: false })}</span></div>
      <div class="tiny muted">${PHASE_NOTE[phase.kind] || (live.length ? `${fmtMinutes(mins)} of ${fmtMinutes(cap)}` : cap ? `${fmtMinutes(cap)} free` : 'Rest day')}</div>
    </header>
    ${list.length
      ? list.map((t) => boardCard(t, preview))
      : html`<div class="board-empty">${phase.kind === 'logistics' ? 'Logistics only' : 'Nothing'}</div>`}
  </section>`;
}

function boardCard(t, preview) {
  const canCheck = (!preview || t.pinned) && (t.status === 'todo' || t.status === 'done');
  return html`<article class="bcard sec-${t.section || 'none'} is-${t.status}" data-open-task="${t.id}" tabindex="0" role="button" aria-label="${t.title}, details">
    ${canCheck
      ? html`<button class="check check-sm" data-action="toggle-done" data-id="${t.id}" aria-pressed="${t.status === 'done'}" aria-label="${t.status === 'done' ? 'Mark not done' : 'Mark done'}">${icon('check')}</button>`
      : ''}
    <div class="bcard-body">
      <div class="bcard-title">${t.title}</div>
      <div class="tiny muted">${t.section ? SECTIONS[t.section].label : TYPE_SHORT[t.type] || 'Task'}, ${fmtMinutes(t.minutes)}${t.status === 'skipped' ? ', skipped' : t.status === 'moved' ? ', moved' : ''}</div>
    </div>
  </article>`;
}

/** Full task card in a sheet, with Done, Skip, and Reschedule. Closes when an action is taken. */
function openTask(id, preview) {
  const t = store.state.tasks.find((x) => x.id === id);
  if (!t) return;
  openSheet(html`<div data-task-sheet>${taskCard(t, { showActions: !preview || !!t.pinned })}</div>
    <button class="btn btn-secondary" data-close="">Close</button>`, (root, close) => {
    bindTaskActions(root);
    root.addEventListener('click', (e) => {
      if (e.target.closest('[data-action=done], [data-action=skip], [data-action=reschedule], [data-action=toggle-done]')) close();
    });
  });
}

function dayBlock(date, list, isToday, settings, preview) {
  const phase = dayPhase(date, settings);
  const cap = dayCapacity(date, settings);
  const busy = Object.prototype.hasOwnProperty.call(settings.busyDates || {}, date);
  const heavy = (settings.heavyNights || []).includes(date);
  const label = PHASE_NOTE[phase.kind] || (heavy ? 'Heavy night.' : busy ? 'Busy day.' : cap ? `${fmtMinutes(cap)} available` : 'Rest day');
  return html`<section class="day" data-day="${date}">
    <div class="day-head ${isToday ? 'is-today' : ''}"><h3>${isToday ? 'Today, ' : ''}${weekdayName(date)} ${formatDate(date, { weekday: false })}</h3><span class="small muted">${label}</span></div>
    ${list.length ? list.map((t) => taskCard(t, { collapsed: true, showActions: !preview || !!t.pinned })) : html`<div class="day-empty">${phase.kind === 'logistics' ? 'Admission ticket, photo ID, calculator, sleep.' : 'No tasks.'}</div>`}
  </section>`;
}
