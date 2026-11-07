// Progress: trend chart, superscore, top topics, why you miss, and the weekly coach.
import { html, setHTML } from '../safe-html.js';
import * as store from '../store.js';
import { icon, topbar, emptyState, plural, toast, notice } from '../ui.js';
import { ALL_SECTIONS, SECTIONS, CAUSES, CAUSE_KEYS } from '../data/act.js';
import { DAY_NAMES } from '../data/calendar.js';
import { superscore } from '../logic/scoring.js';
import { trendSeries, topicTrends, causeSplit, coachStats } from '../logic/progress.js';
import { formatDate, dateOf } from '../logic/dates.js';
import { trendChart } from './chart.js';
import { postClaude } from './explain.js';

export const live = true;

let coachLoading = false;

function causeTracker(split, focus) {
  const reading = split.reading;
  const speed = reading.time;
  const accuracy = reading.trap + reading.content;
  const rTotal = speed + accuracy;
  return html`<section class="stack">
    <div class="section-title"><h2>Why you miss</h2><span class="small muted">Last 14 days</span></div>
    <div class="card stack">
      <div class="row-wrap small muted">${CAUSE_KEYS.map((c) => html`<span><i class="cause-key cause-${c}"></i>${CAUSES[c].short}</span>`)}</div>
      ${ALL_SECTIONS.map((s) => {
        const d = split[s];
        const flag = focus.bySection[s] && focus.bySection[s].timingFlag;
        return html`<div class="stack-sm">
          <div class="spread"><span class="strong small">${SECTIONS[s].label}</span>
            <span class="small muted">${d.total ? CAUSE_KEYS.filter((c) => d[c]).map((c) => `${d[c]} ${CAUSES[c].short.toLowerCase()}`).join(', ') : 'No misses'}${flag ? '. Timing flag' : ''}</span></div>
          <div class="bar" role="img" aria-label="${SECTIONS[s].label}: ${CAUSE_KEYS.map((c) => `${d[c]} ${CAUSES[c].short}`).join(', ')}">
            ${d.total ? CAUSE_KEYS.filter((c) => d[c]).map((c) => html`<span class="cause-${c}" style="width:${(100 * d[c]) / d.total}%"></span>`) : ''}
          </div>
        </div>`;
      })}
    </div>
    <div class="card stack-sm">
      <h3>Reading: speed or accuracy?</h3>
      ${rTotal
        ? html`<div class="bar" style="height:14px" role="img" aria-label="Speed ${speed}, accuracy ${accuracy}">
            <span class="bar-time" style="width:${(100 * speed) / rTotal}%"></span><span class="bar-acc" style="width:${(100 * accuracy) / rTotal}%"></span></div>
          <div class="spread small"><span><i class="cause-key bar-time"></i>Speed (time) ${speed}</span><span><i class="cause-key bar-acc"></i>Accuracy (trap + content) ${accuracy}</span></div>
          <p class="small muted">${speed > accuracy
            ? 'Mostly a speed problem. Expect timed passages with checkpoints.'
            : accuracy > speed
              ? 'Mostly an accuracy problem. Expect evidence drills: prove every answer with a line number.'
              : 'An even split. Work on both pacing and proving answers.'}</p>`
        : html`<p class="small muted">No Reading misses tagged time, trap, or content in the last 14 days.</p>`}
    </div>
  </section>`;
}

const TREND = {
  worse: { icon: 'arrowUp', cls: 'trend-up', label: 'Getting worse' },
  better: { icon: 'arrowDown', cls: 'trend-down', label: 'Improving' },
  flat: { icon: 'dash', cls: 'trend-flat', label: 'Steady' },
  new: { icon: 'plus', cls: 'trend-up', label: 'New this week' },
};

function topicsCard(topics) {
  if (!topics.length) return '';
  const max = topics[0].weight || 1;
  return html`<section class="stack">
    <div class="section-title"><h2>Top topics</h2><span class="small muted">vs. a week ago</span></div>
    <div class="list">${topics.map((t) => {
      const tr = TREND[t.trend];
      return html`<div class="list-item">
        <span class="sec-dot sec-${t.section}"></span>
        <div class="grow stack-sm"><div class="spread"><span class="strong">${t.topic}</span><span class="tiny muted">${SECTIONS[t.section].label}</span></div>
          <div class="bar" style="height:6px"><span class="sec-${t.section}" style="width:${Math.max(4, (100 * t.weight) / max)}%;background:var(--sec)"></span></div></div>
        <span class="badge ${tr.cls}" title="${tr.label}">${icon(tr.icon)}${tr.label}</span>
      </div>`;
    })}</div>
  </section>`;
}

function superscoreCard(sup) {
  if (!sup) return html`<section class="card card-soft stack-sm"><h3>Superscore</h3><p class="small muted">Built from real ACT attempts only. Log your December scores when they're released.</p></section>`;
  return html`<section class="card stack">
    <div class="spread"><div><div class="tiny strong muted">SUPERSCORE</div><div class="small muted">Best section from ${plural(sup.count, 'real ACT')}</div></div><div class="score-big">${sup.composite ?? '--'}</div></div>
    <div class="score-row">${ALL_SECTIONS.map((s) => {
      const b = sup.sections[s];
      return html`<div class="score-cell sec-${s}"><b>${b ? b.score : '--'}</b><span>${b ? formatDate(b.date, { weekday: false }) : SECTIONS[s].label}</span></div>`;
    })}</div>
  </section>`;
}

function coachCard() {
  const s = store.state;
  const ws = store.currentWeekStart();
  const note = s.coachNotes.find((n) => n.weekStart === ws);
  const online = navigator.onLine !== false;
  const older = s.coachNotes.filter((n) => n.weekStart !== ws).sort((a, b) => b.weekStart.localeCompare(a.weekStart))[0];
  let body;
  if (note) {
    const sug = note.suggestion;
    const setting = sug && sug.setting;
    const applied = setting && Number(s.settings.availability[setting.day]) === setting.minutes;
    body = html`<p>${note.text}</p>
      ${sug ? html`<div class="card card-accent card-tight stack-sm"><div class="tiny strong muted">AN OPTION</div><p class="small">${sug.text}</p>
        ${setting ? html`<button class="btn btn-sm ${applied ? 'btn-secondary' : ''}" data-action="apply" ${applied ? html`disabled` : ''}>${applied ? 'Applied' : `Apply: ${DAY_NAMES[setting.day]} ${setting.minutes ? `${setting.minutes} min` : 'off'}`}</button>` : ''}</div>` : ''}
      <p class="hint">Saved ${formatDate(dateOf(note.createdAt))}. The plan stays in charge; this note is advice. Next note available next week.</p>`;
  } else if (coachLoading) {
    body = html`<div class="stack-sm" aria-busy="true"><div class="row"><span class="spinner"></span><span class="muted small">Reading your week</span></div>
      <div class="skeleton"></div><div class="skeleton" style="width:80%"></div><div class="skeleton" style="width:60%"></div></div>`;
  } else {
    body = html`<p class="small muted">A short note on your week from Claude, built only from your numbers. One per week.</p>
      ${!online ? notice('warn', 'Coach needs internet. Try again when you are online.') : ''}
      ${online && !s.settings.passcode ? notice('info', html`Add your app passcode in <a href="#/settings">Settings</a> first.`) : ''}
      <button class="btn" data-action="coach" ${!online || !s.settings.passcode ? html`disabled` : ''}>${icon('sparkle')}Get this week's note</button>
      ${older ? html`<details><summary class="small strong">Last note (${formatDate(older.weekStart, { weekday: false })})</summary><p class="small mt">${older.text}</p></details>` : ''}`;
  }
  return html`<section class="card stack"><div class="row">${icon('sparkle')}<h2 class="grow">Weekly coach</h2></div>${body}</section>`;
}

export function render(el) {
  const s = store.state;
  const today = store.today();
  const focus = store.focus();
  const series = trendSeries(s.attempts);
  const sup = superscore(s.attempts);
  const topics = topicTrends({ attempts: s.attempts, misses: s.misses, redos: s.redos, pacing: s.pacing, today });
  const split = causeSplit(s.misses, today);
  const hasAny = s.attempts.length || s.misses.length;
  const chart = series.length ? trendChart(series, { wide: window.matchMedia('(min-width: 900px)').matches }) : null;

  setHTML(
    el,
    html`${topbar('Progress', { back: '#/more', eyebrow: focus.composite ? `Estimated composite ${focus.composite}` : '' })}
      <div class="stack-lg">
        ${!hasAny
          ? emptyState({ iconName: 'progress', title: 'Nothing to chart yet', body: 'Log a test or a few misses and your trends show up here.', actionHref: '#/tests/new', actionLabel: 'Log a test' })
          : html`
            ${chart
              ? html`<section class="card stack">
                  <div class="spread"><h2>Section scores</h2><span class="small muted">${plural(series.length, 'attempt')}</span></div>
                  <div class="chart-wrap" data-chart>${chart.svg}<div class="chart-tip" data-tip hidden></div></div>
                  ${chart.legend}
                  ${chart.table}
                </section>`
              : ''}
            <div class="grid-2-lg stack-lg">
              ${superscoreCard(sup)}
              ${coachCard()}
            </div>
            ${topicsCard(topics)}
            ${causeTracker(split, focus)}
          `}
      </div>`,
  );

  if (chart) bindChart(el, series, chart.width);

  el.addEventListener('click', async (e) => {
    const b = e.target.closest('[data-action]');
    if (!b) return;
    if (b.dataset.action === 'coach') await requestCoach();
    if (b.dataset.action === 'apply') await applySuggestion();
  });
}

function bindChart(el, series, width) {
  const wrap = el.querySelector('[data-chart]');
  const tip = el.querySelector('[data-tip]');
  const svg = wrap.querySelector('svg');
  const cross = svg.querySelector('.crosshair');
  const show = (rect) => {
    const i = Number(rect.dataset.i);
    const p = series[i];
    const cx = Number(rect.getAttribute('x')) + Number(rect.getAttribute('width')) / 2;
    cross.setAttribute('x1', cx);
    cross.setAttribute('x2', cx);
    cross.setAttribute('visibility', 'visible');
    setHTML(
      tip,
      html`<div class="strong small">${formatDate(p.date, { year: true })} <span class="muted">${p.real ? 'Real ACT' : 'Practice'}</span></div>
        <div class="row-wrap tiny">${ALL_SECTIONS.filter((s) => p.scores[s]).map((s) => html`<span><i class="cause-key" style="background:var(--chart-${s})"></i>${SECTIONS[s].short} ${p.scores[s]}</span>`)}</div>
        <div class="tiny muted">Composite ${p.composite ?? 'n/a'}, estimate ${p.estComposite ?? 'n/a'}</div>`,
    );
    tip.hidden = false;
    const box = svg.getBoundingClientRect();
    const scale = box.width / width;
    const left = Math.min(Math.max(cx * scale - tip.offsetWidth / 2, 0), box.width - tip.offsetWidth);
    tip.style.left = `${left}px`;
  };
  const hide = () => {
    tip.hidden = true;
    cross.setAttribute('visibility', 'hidden');
  };
  svg.addEventListener('pointerover', (e) => {
    const r = e.target.closest('.hit');
    if (r) show(r);
  });
  svg.addEventListener('click', (e) => {
    const r = e.target.closest('.hit');
    if (r) show(r);
  });
  svg.addEventListener('pointerleave', (e) => {
    if (e.pointerType === 'mouse') hide();
  });
}

async function requestCoach() {
  const s = store.state;
  const ws = store.currentWeekStart();
  if (s.coachNotes.some((n) => n.weekStart === ws)) return;
  coachLoading = true;
  rerenderNow();
  try {
    const stats = coachStats({ settings: s.settings, attempts: s.attempts, misses: s.misses, redos: s.redos, pacing: s.pacing, tasks: s.tasks, today: store.today() });
    const r = await postClaude('/api/coach', { stats }, { offlineMessage: 'Coach needs internet. Try again when you are online.' });
    coachLoading = false;
    await store.saveCoachNote({ weekStart: ws, text: String(r.note || '').trim(), suggestion: r.suggestion || null, createdAt: store.nowISO() });
  } catch (err) {
    coachLoading = false;
    console.error(err);
    toast(err.userMessage || "Couldn't reach Claude. Check your connection and try again.");
    rerenderNow();
  }
}

async function applySuggestion() {
  const s = store.state;
  const note = s.coachNotes.find((n) => n.weekStart === store.currentWeekStart());
  const setting = note && note.suggestion && note.suggestion.setting;
  if (!setting || setting.type !== 'availability') return;
  try {
    await store.saveSettings({ availability: { ...s.settings.availability, [setting.day]: setting.minutes } }, { regen: true });
    toast(`${DAY_NAMES[setting.day]} is now ${setting.minutes ? `${setting.minutes} minutes` : 'off'}. The plan updated.`);
  } catch (err) {
    console.error(err);
    toast("Couldn't apply that. Try again.");
  }
}

function rerenderNow() {
  const mounted = document.querySelector('#main > .view');
  if (!mounted || !location.hash.startsWith('#/progress')) return;
  const fresh = mounted.cloneNode(false);
  mounted.replaceWith(fresh);
  render(fresh);
}
