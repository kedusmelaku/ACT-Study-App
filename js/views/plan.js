// Plan: the week view with tasks by day.
import { html, setHTML } from '../safe-html.js';
import * as store from '../store.js';
import { icon, topbar, notice, fmtMinutes } from '../ui.js';
import { taskCard, bindTaskActions } from './components.js';
import { weekDates, addDays, formatDate, formatRange, compareDates, weekdayName } from '../logic/dates.js';
import { dayPhase, dayCapacity, weekLabel } from '../logic/phase.js';
import { generateWeek } from '../logic/planner.js';

export const live = true;

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
  let preview = false;
  if (isFuture && !tasks.length) {
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
      existingTasks: [],
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
        ${preview ? notice('info', 'Preview. This week is planned for real when it starts, using your latest results.') : ''}
        ${notes.map((n) => notice('info', n))}
        ${dates.map((d) => dayBlock(d, tasks.filter((t) => t.date === d), d === today, s.settings, preview))}
      </div>`,
  );
  bindTaskActions(el);
}

function dayBlock(date, list, isToday, settings, preview) {
  const phase = dayPhase(date, settings);
  const cap = dayCapacity(date, settings);
  const busy = Object.prototype.hasOwnProperty.call(settings.busyDates || {}, date);
  const heavy = (settings.heavyNights || []).includes(date);
  const label = PHASE_NOTE[phase.kind] || (heavy ? 'Heavy night.' : busy ? 'Busy day.' : cap ? `${fmtMinutes(cap)} available` : 'Rest day');
  return html`<section class="day">
    <div class="day-head ${isToday ? 'is-today' : ''}"><h3>${isToday ? 'Today, ' : ''}${weekdayName(date)} ${formatDate(date, { weekday: false })}</h3><span class="small muted">${label}</span></div>
    ${list.length ? list.map((t) => taskCard(t, { collapsed: true, showActions: !preview })) : html`<div class="day-empty">${phase.kind === 'logistics' ? 'Admission ticket, photo ID, calculator, sleep.' : 'No tasks.'}</div>`}
  </section>`;
}
