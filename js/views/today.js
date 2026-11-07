// Today: countdown, tonight's tasks, focus, redos, reminders. Switches to taper, logistics, and test-day modes.
import { html, setHTML } from '../safe-html.js';
import * as store from '../store.js';
import { icon, topbar, notice, plural, fmtMinutes, toast, reportError, confirmSheet, sectionBadge } from '../ui.js';
import { taskCard, bindTaskActions } from './components.js';
import { dayPhase, weekLabel, pendingRealScores, nextTest } from '../logic/phase.js';
import { daysBetween, formatDate, addDays, ageInDays, dateOf } from '../logic/dates.js';
import { dueRedos } from '../logic/redo.js';
import { LOGISTICS_CHECKLIST } from '../data/calendar.js';
import { SECTIONS } from '../data/act.js';

export const live = true;

function checklistCard(target) {
  const checks = (store.state.settings.checklist || {})[target.date] || {};
  return html`<section class="stack">
    <div class="section-title"><h2>Logistics checklist</h2></div>
    <ul class="checklist">
      ${LOGISTICS_CHECKLIST.map(
        (c) => html`<li><label><input type="checkbox" data-check="${c.id}" ${checks[c.id] ? html`checked` : ''}><span>${c.label}</span></label></li>`,
      )}
    </ul>
  </section>`;
}

function bindChecklist(el, target) {
  el.addEventListener('change', async (e) => {
    const box = e.target.closest('[data-check]');
    if (!box) return;
    const all = { ...(store.state.settings.checklist || {}) };
    all[target.date] = { ...(all[target.date] || {}), [box.dataset.check]: box.checked };
    try {
      await store.saveSettings({ checklist: all });
    } catch (err) {
      reportError(err, "Couldn't save that. Try again.");
    }
  });
}

/** 'never' when data is over a week old and was never backed up, 'stale' when the last backup is over 7 days old. */
function backupStatus() {
  const s = store.state;
  const today = store.today();
  if (s.settings.lastBackup) return ageInDays(dateOf(s.settings.lastBackup), today) > 7 ? 'stale' : null;
  const stamps = [...s.attempts, ...s.misses].map((x) => dateOf(x.createdAt || x.date)).filter(Boolean).sort();
  if (!stamps.length) return null;
  return ageInDays(stamps[0], today) > 7 ? 'never' : null;
}

export function render(el) {
  const s = store.state;
  const today = store.today();
  const phase = dayPhase(today, s.settings);
  const target = nextTest(s.settings, today);

  // Test day: a calm screen with the checklist and nothing else.
  if (phase.kind === 'testday') {
    setHTML(
      el,
      html`<div class="calm">
        <div class="stack-sm">
          <span class="badge badge-accent">${formatDate(today)}</span>
          <div class="big">Test day. You're ready.</div>
          <p class="muted">Eat breakfast, bring your checklist, and trust your habits. Read the full sentence, plug answers back in, point to the proof.</p>
        </div>
        ${checklistCard(phase.target)}
      </div>`,
    );
    bindChecklist(el, phase.target);
    return;
  }

  const days = target ? daysBetween(today, target.date) : null;
  const focus = store.focus();
  const tonight = s.tasks.filter((t) => t.date === today).sort((a, b) => (a.slot ?? 0) - (b.slot ?? 0));
  const todo = tonight.filter((t) => t.status === 'todo');
  const due = dueRedos(s.redos, today);
  const pending = pendingRealScores(s.settings, s.attempts, today);
  const persistent = s.redos.filter((r) => r.status === 'persistent').map((r) => s.misses.find((m) => m.id === r.missId)).filter(Boolean);
  const heavy = (s.settings.heavyNights || []).includes(today);
  const hasFixed = todo.some((t) => t.fixed);
  const ws = store.currentWeekStart();
  const est = focus.composite;

  const upcoming = [];
  if (!todo.length) {
    for (let i = 1; i <= 6 && !upcoming.length; i++) {
      const d = addDays(today, i);
      const list = s.tasks.filter((t) => t.date === d && t.status === 'todo');
      if (list.length) upcoming.push({ date: d, list });
    }
  }

  const hero = html`<section class="card card-hero">
    ${target
      ? html`<div class="countdown">
          <div class="countdown-num">${days}</div>
          <div class="countdown-label"><div class="strong">${days === 1 ? 'day' : 'days'} to the ${target.label || 'ACT'}</div><div class="small muted">${formatDate(target.date, { year: true })}</div></div>
        </div>`
      : html`<div class="stack-sm"><div class="strong">No test date ahead</div><p class="small muted">Add your next ACT date in Settings to aim the plan at it.</p><a class="btn btn-sm btn-on-hero" href="#/settings">Add test date</a></div>`}
    <div class="hero-stats">
      <div class="hero-stat"><b>${est ?? 'n/a'}</b><span>Est. composite</span></div>
      <div class="hero-stat"><b>${due.length}</b><span>Redos due</span></div>
      <div class="hero-stat"><b>${weekLabel(ws, s.settings).replace(/^Week (\d+):.*/, 'Week $1')}</b><span>${phaseName(phase.kind)}</span></div>
    </div>
  </section>`;

  const reminders = [];
  if (pending) {
    reminders.push(html`<a class="card card-accent card-link" href="#/tests/new?kind=real&date=${pending.date}">
      <div class="row">${icon('flag')}<div class="grow"><div class="strong">Enter your ${pending.label || 'ACT'} scores</div><p class="small muted">When your scores are released, log them here. Then add your next test date so the plan can aim at it.</p></div>${icon('chev', 'chev')}</div>
    </a>`);
  }
  if (!target && !pending) {
    reminders.push(notice('info', html`The plan is in open-ended mode. <a href="#/settings">Add your next test date</a> (for example, the April school-day ACT).`));
  }
  const backup = backupStatus();
  if (backup) {
    const msg = backup === 'never' ? "You haven't backed up yet." : "It's been over a week since your last backup.";
    reminders.push(html`<div class="notice notice-warn">${icon('download')}<div class="grow">${msg} <a href="#/settings">Export a backup</a> to keep your log safe.</div></div>`);
  }

  let body;
  if (phase.kind === 'logistics') {
    body = html`<section class="card card-soft stack-sm">
        <h2>No study today</h2>
        <p class="muted">The work is done. Today is for logistics, a light walk, and sleep. Glance at your fix lines if you want, nothing more.</p>
      </section>
      ${checklistCard(phase.target)}`;
  } else {
    body = html`
      <section class="card focus-line">
        <span class="list-icon sec-${focus.top || 'none'}">${icon('target')}</span>
        <div class="grow stack-sm">
          <div class="tiny strong muted">THIS WEEK'S FOCUS</div>
          <p class="strong">${focus.sentence}</p>
          ${focus.top && focus.bySection[focus.top].topics.length
            ? html`<div class="row-wrap">${focus.bySection[focus.top].topics.slice(0, 3).map((t) => html`<span class="badge">${t.topic}</span>`)}</div>`
            : ''}
        </div>
      </section>

      <section class="stack">
        <div class="section-title">
          <h2>${heavy ? 'Tonight is cleared' : 'Tonight'}</h2>
          ${todo.length ? html`<span class="small muted">${fmtMinutes(todo.reduce((a, t) => a + (t.minutes || 0), 0))}</span>` : ''}
        </div>
        ${phase.kind === 'review' ? notice('info', 'Taper week: error log and redo review only. No new practice.') : ''}
        ${phase.kind === 'taper-weekend' ? notice('info', 'Taper starts now. One final timed set this weekend, then review only.') : ''}
        ${tonight.length ? tonight.map((t) => taskCard(t)) : emptyTonight(heavy, upcoming)}
        ${todo.length && !hasFixed
          ? html`<button class="btn btn-secondary btn-block" data-action="heavy">${icon('moon')}Heavy night, move tonight's work</button>`
          : ''}
        ${heavy ? html`<button class="btn btn-ghost btn-block" data-action="unheavy">Undo heavy night</button>` : ''}
      </section>

      ${due.length
        ? html`<a class="card card-link" href="#/redo"><div class="row">
            <span class="list-icon sec-none">${icon('redo')}</span>
            <div class="grow"><div class="strong">${plural(due.length, 'redo')} due</div><p class="small muted">Bring old misses back until they stick.</p></div>
            ${icon('chev', 'chev')}</div></a>`
        : ''}

      ${persistent.length
        ? html`<section class="stack">
            <div class="section-title"><h2>Persistent misses</h2><a class="link" href="#/redo">Redo</a></div>
            <div class="list">${persistent.slice(0, 5).map(
              (m) => html`<a class="list-item" href="#/log/${m.id}">
                <span class="sec-dot sec-${m.section}"></span>
                <div class="grow"><div class="strong">${m.topic || 'Untagged'}</div><div class="small muted">${SECTIONS[m.section].label}${m.questionNumber ? `, Q${m.questionNumber}` : ''}${m.fixLine ? `. Fix: ${m.fixLine}` : ''}</div></div>
                ${icon('chev', 'chev')}</a>`,
            )}</div>
          </section>`
        : ''}
    `;
  }

  setHTML(
    el,
    html`${topbar('Today', { eyebrow: formatDate(today) })}
      <div class="stack-lg">
        ${hero}
        ${reminders.length ? html`<div class="stack">${reminders}</div>` : ''}
        ${body}
      </div>`,
  );

  bindTaskActions(el);
  if (phase.kind === 'logistics') bindChecklist(el, phase.target);
  el.addEventListener('click', async (e) => {
    const b = e.target.closest('[data-action]');
    if (!b) return;
    if (b.dataset.action === 'heavy') {
      const ok = await confirmSheet({
        title: 'Heavy night?',
        body: "Tonight's tasks move to open time later this week. If the week is full, the lowest-priority work is dropped.",
        confirmLabel: 'Move tonight',
      });
      if (!ok) return;
      try {
        const msg = await store.heavyNight();
        toast(msg, { duration: 8000 });
      } catch (err) {
        reportError(err, "Couldn't move tonight's tasks. Try again.");
      }
    } else if (b.dataset.action === 'unheavy') {
      try {
        await store.undoHeavyNight();
        toast('Tonight is back on.');
      } catch (err) {
        reportError(err, "Couldn't undo that. Try again.");
      }
    }
  });
}

function emptyTonight(heavy, upcoming) {
  if (heavy) return html`<div class="day-empty">Rest up. Tonight's work moved to later this week.</div>`;
  const next = upcoming[0];
  return html`<div class="card card-soft stack-sm">
    <div class="strong">Nothing scheduled tonight</div>
    ${next
      ? html`<p class="small muted">Next up ${formatDate(next.date)}: ${next.list.map((t) => t.title).join(', ')}.</p>`
      : html`<p class="small muted">Enjoy the night off. Your plan picks up on your next study day.</p>`}
    <div class="row-wrap"><a class="btn btn-sm btn-secondary" href="#/plan">See the week</a>${next && next.list[0].section ? sectionBadge(next.list[0].section) : ''}</div>
  </div>`;
}

function phaseName(kind) {
  switch (kind) {
    case 'taper-weekend':
    case 'review':
      return 'Taper';
    case 'logistics':
      return 'Rest';
    case 'fulltest':
      return 'Full test day';
    case 'open':
      return 'Open mode';
    default:
      return 'Build';
  }
}
