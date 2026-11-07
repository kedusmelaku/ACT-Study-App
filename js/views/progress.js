// Progress: miss-type tracker per section, plus the Reading speed-or-accuracy bar.
import { html, setHTML } from '../safe-html.js';
import * as store from '../store.js';
import { topbar, emptyState, plural } from '../ui.js';
import { ALL_SECTIONS, SECTIONS, CAUSES, CAUSE_KEYS, FOCUS } from '../data/act.js';
import { ageInDays } from '../logic/dates.js';
import { missDate } from '../logic/focus.js';

export const live = true;

export function causeSplit(misses, today, days = FOCUS.dominantCauseWindowDays) {
  const out = {};
  for (const s of ALL_SECTIONS) out[s] = { total: 0, content: 0, careless: 0, time: 0, trap: 0 };
  for (const m of misses) {
    if (!out[m.section] || ageInDays(missDate(m), today) > days) continue;
    const c = CAUSES[m.cause] ? m.cause : 'content';
    out[m.section][c]++;
    out[m.section].total++;
  }
  return out;
}

export function causeTracker(split, focus) {
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
            <span class="small muted">${d.total ? plural(d.total, 'miss', 'misses') : 'No misses'}${flag ? ', timing flag' : ''}</span></div>
          <div class="bar" role="img" aria-label="${SECTIONS[s].label}: ${CAUSE_KEYS.map((c) => `${d[c]} ${CAUSES[c].short}`).join(', ')}">
            ${d.total ? CAUSE_KEYS.filter((c) => d[c]).map((c) => html`<span class="cause-${c}" style="width:${(100 * d[c]) / d.total}%"></span>`) : ''}
          </div>
        </div>`;
      })}
    </div>
    <div class="card stack-sm">
      <div class="spread"><h3>Reading: speed or accuracy?</h3></div>
      ${rTotal
        ? html`<div class="bar" style="height:14px" role="img" aria-label="Time ${speed}, trap and content ${accuracy}">
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

export function render(el) {
  const s = store.state;
  const today = store.today();
  const focus = store.focus();
  const split = causeSplit(s.misses, today);
  const hasAny = s.attempts.length || s.misses.length;
  setHTML(
    el,
    html`${topbar('Progress', { back: '#/more' })}
      <div class="stack-lg">
        ${hasAny
          ? causeTracker(split, focus)
          : emptyState({ iconName: 'progress', title: 'Nothing to chart yet', body: 'Log a test or a few misses and your trends show up here.', actionHref: '#/tests/new', actionLabel: 'Log a test' })}
      </div>`,
  );
}
