// First-run setup: test date, study time, recent scores, backup note. Works for anyone.
import { html, setHTML } from '../safe-html.js';
import * as store from '../store.js';
import { icon, reportError, fmtMinutes, toast } from '../ui.js';
import { joinSheet } from './settings.js';
import { DAY_NAMES } from '../data/calendar.js';
import { ALL_SECTIONS, SECTIONS } from '../data/act.js';
import { isISODate, formatDate, daysBetween } from '../logic/dates.js';
import { defaultFullTests } from '../logic/phase.js';

export const live = false;

const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];
const SCORE_KINDS = [
  { kind: 'benchmark', label: 'School benchmark' },
  { kind: 'real', label: 'Real ACT' },
  { kind: 'official_enhanced', label: 'Practice test' },
  { kind: 'other', label: 'Other' },
];

export function render(el, ctx) {
  const s = store.state.settings;
  const first = (s.testDates || [])[0] || { date: '', label: 'ACT' };
  const st = {
    step: 0,
    date: first.date,
    label: first.label || 'ACT',
    availability: { ...s.availability },
    scores: { english: '', math: '', reading: '', science: '' },
    kind: 'benchmark',
    scale: 36,
  };

  const draw = () => {
    const steps = [stepDate, stepTime, stepScores, stepBackup];
    setHTML(
      el,
      html`<div class="onboard stack-lg">
        <div class="onboard-hero">
          <span class="brand-mark">ACT</span>
          <h1>${['Let’s set up your prep', 'When can you study?', 'Your starting point', 'One last thing'][st.step]}</h1>
          <div class="steps">${[0, 1, 2, 3].map((i) => html`<span class="${i <= st.step ? 'on' : ''}"></span>`)}</div>
        </div>
        ${steps[st.step]()}
      </div>`,
    );
  };

  const stepDate = () => {
    const days = isISODate(st.date) ? daysBetween(store.today(), st.date) : null;
    return html`<div class="stack-lg">
      <p class="muted">Log what you miss on practice tests, and the app plans what to study each night.</p>
      <div class="field"><label for="ob-date">Test date</label><input class="input" id="ob-date" type="date" name="date" min="${store.today()}" value="${st.date}"></div>
      <div class="field"><label for="ob-label">Name</label><input class="input" id="ob-label" name="label" maxlength="40" value="${st.label}"></div>
      ${days !== null && days >= 0 ? html`<div class="notice notice-info">${icon('flag')}<div class="grow">${formatDate(st.date, { year: true })}, ${days} days away.</div></div>` : ''}
      <p class="error-text" data-error hidden></p>
      <div class="sticky-actions"><button class="btn" data-action="next">Next</button></div>
      <button class="btn btn-ghost btn-block" data-action="no-date">I don't have a date yet</button>
      <button class="btn btn-ghost btn-block" data-action="connect">I already use ACT Prep on another device</button>
    </div>`;
  };

  const stepTime = () => {
    const total = DAY_ORDER.reduce((a, d) => a + (Number(st.availability[d]) || 0), 0);
    return html`<div class="stack-lg">
      <p class="muted">Short weeknight slots plus one weekend block work well. You can clear any night with one tap.</p>
      <div class="card card-tight">
        ${DAY_ORDER.map(
          (d) => html`<div class="day-row"><span class="strong">${DAY_NAMES[d]}</span>
            <div class="stepper"><button type="button" data-avail="${d}:-1" aria-label="Less">-</button>
            <output>${Number(st.availability[d]) ? fmtMinutes(Number(st.availability[d])) : 'Off'}</output>
            <button type="button" data-avail="${d}:1" aria-label="More">+</button></div></div>`,
        )}
      </div>
      <p class="small muted center">${fmtMinutes(total)} a week</p>
      <div class="sticky-actions"><button class="btn btn-secondary" data-action="back">Back</button><button class="btn" data-action="next">Next</button></div>
    </div>`;
  };

  const stepScores = () => html`<div class="stack-lg">
    <p class="muted">Have recent scores? Add them so the plan knows where to start. You can skip this.</p>
    <div class="chips">
      ${SCORE_KINDS.map((k) => html`<button type="button" class="chip" data-kind="${k.kind}" aria-pressed="${st.kind === k.kind}">${k.label}</button>`)}
    </div>
    <div class="grid-2">
      ${ALL_SECTIONS.map(
        (x) => html`<div class="field"><label for="ob-${x}">${SECTIONS[x].label}${x === 'science' ? ' (optional)' : ''}</label>
          <input class="input input-score" id="ob-${x}" data-score="${x}" inputmode="numeric" pattern="[0-9]*" maxlength="2" value="${st.scores[x]}" placeholder="--" autocomplete="off"></div>`,
      )}
    </div>
    <label class="check-row"><span class="grow">Scored out of 35</span><span class="switch"><input type="checkbox" data-scale ${st.scale === 35 ? html`checked` : ''}><span></span></span></label>
    <p class="error-text" data-error hidden></p>
    <div class="sticky-actions"><button class="btn btn-secondary" data-action="back">Back</button><button class="btn" data-action="next">${hasScores() ? 'Next' : 'Skip'}</button></div>
  </div>`;

  const stepBackup = () => html`<div class="stack-lg">
    <div class="card stack-sm">
      <div class="row">${icon('download')}<h3>Backups</h3></div>
      <p class="muted">Your data stays on this device. Export a backup from Settings every week or so, or turn on sync.</p>
    </div>
    <div class="sticky-actions"><button class="btn btn-secondary" data-action="back">Back</button><button class="btn" data-action="finish">Build my plan</button></div>
  </div>`;

  function hasScores() {
    return ALL_SECTIONS.some((x) => st.scores[x] !== '');
  }

  function scoresProblem() {
    const max = st.scale === 35 ? 35 : 36;
    const bad = ALL_SECTIONS.filter((x) => st.scores[x] !== '' && !(Number(st.scores[x]) >= 1 && Number(st.scores[x]) <= max));
    return bad.length ? `Scores run from 1 to ${max}. Check ${bad.map((x) => SECTIONS[x].label).join(', ')}.` : null;
  }

  el.addEventListener('input', (e) => {
    if (e.target.name === 'date') st.date = e.target.value;
    if (e.target.name === 'label') st.label = e.target.value;
    if (e.target.dataset.score) {
      st.scores[e.target.dataset.score] = e.target.value.replace(/[^0-9]/g, '').slice(0, 2);
      const nextBtn = el.querySelector('[data-action=next]');
      if (nextBtn) nextBtn.textContent = hasScores() ? 'Next' : 'Skip';
    }
  });
  el.addEventListener('change', (e) => {
    if (e.target.hasAttribute('data-scale')) st.scale = e.target.checked ? 35 : 36;
    if (e.target.name === 'date') draw();
  });
  el.addEventListener('click', async (e) => {
    const av = e.target.closest('[data-avail]');
    if (av) {
      const [d, dir] = av.dataset.avail.split(':').map(Number);
      st.availability[d] = Math.max(0, Math.min(300, (Number(st.availability[d]) || 0) + dir * 15));
      draw();
      return;
    }
    const k = e.target.closest('[data-kind]');
    if (k) {
      st.kind = k.dataset.kind;
      el.querySelectorAll('[data-kind]').forEach((x) => x.setAttribute('aria-pressed', String(x === k)));
      return;
    }
    const b = e.target.closest('[data-action]');
    if (!b) return;
    const err = el.querySelector('[data-error]');
    if (b.dataset.action === 'next') {
      if (st.step === 0 && !isISODate(st.date)) {
        err.textContent = "Pick your test date, or tap I don't have a date yet.";
        err.hidden = false;
        return;
      }
      if (st.step === 2 && scoresProblem()) {
        err.textContent = scoresProblem();
        err.hidden = false;
        return;
      }
      st.step++;
      draw();
    } else if (b.dataset.action === 'no-date') {
      st.date = '';
      st.step = 1;
      draw();
    } else if (b.dataset.action === 'back') {
      st.step--;
      draw();
    } else if (b.dataset.action === 'connect') {
      const result = await joinSheet();
      if (result !== null) return;
      if (store.state.settings.onboarded) {
        toast('Connected. Your data is here.');
        ctx.navigate('#/today', { replace: true });
      } else {
        toast('Connected, but no data was found yet. Finish setup here, or sync your other device first.');
      }
    } else if (b.dataset.action === 'finish') {
      b.disabled = true;
      try {
        if (hasScores()) {
          const scores = {};
          for (const x of ALL_SECTIONS) if (st.scores[x] !== '') scores[x] = Number(st.scores[x]);
          await store.saveAttempt({
            attempt: {
              id: store.newId('att'),
              date: store.today(),
              kind: st.kind,
              sourceId: null,
              scores,
              scale: st.scale,
              notes: SCORE_KINDS.find((x) => x.kind === st.kind).label,
              createdAt: store.nowISO(),
            },
          });
        }
        const testDates = isISODate(st.date) ? [{ date: st.date, label: st.label.trim() || 'ACT', science: true }] : [];
        const patch = { onboarded: true, testDates, availability: st.availability };
        // Full-test days come from this person's own test date (unless some were already set up).
        if (!(s.fullTests || []).length && testDates.length) patch.fullTests = defaultFullTests(st.date, store.today());
        await store.saveSettings(patch, { regen: true });
        ctx.navigate('#/today', { replace: true });
      } catch (ex) {
        b.disabled = false;
        reportError(ex, "Couldn't finish setup. Try again.");
      }
    }
  });

  draw();
}
