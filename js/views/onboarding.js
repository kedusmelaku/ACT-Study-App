// First-run setup: test date, study time, benchmark, backup note.
import { html, setHTML } from '../safe-html.js';
import * as store from '../store.js';
import { icon, reportError, fmtMinutes, openSheet, toast } from '../ui.js';
import { enableSync } from '../sync.js';
import { DAY_NAMES } from '../data/calendar.js';
import { isISODate, formatDate, daysBetween } from '../logic/dates.js';

export const live = false;

const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];
const BENCHMARK = { english: 35, math: 35, reading: 33, science: 35 };

export function render(el, ctx) {
  const s = store.state.settings;
  const first = (s.testDates || [])[0] || { date: '2026-12-12', label: 'December ACT', science: true };
  const st = { step: 0, date: first.date, label: first.label || 'December ACT', availability: { ...s.availability }, benchmark: true };

  const draw = () => {
    const steps = [stepDate, stepTime, stepBenchmark, stepBackup];
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
      <p class="muted">Every practice miss becomes data, and the app turns it into tonight's plan around your homework.</p>
      <div class="field"><label for="ob-date">Test date</label><input class="input" id="ob-date" type="date" name="date" value="${st.date}"></div>
      <div class="field"><label for="ob-label">Name</label><input class="input" id="ob-label" name="label" maxlength="40" value="${st.label}"></div>
      ${days !== null && days >= 0 ? html`<div class="notice notice-info">${icon('flag')}<div class="grow">${formatDate(st.date, { year: true })}, ${days} days away. You can add more test dates later, like the April school-day ACT.</div></div>` : ''}
      <p class="error-text" data-error hidden></p>
      <div class="sticky-actions"><button class="btn" data-action="next">Next</button></div>
      <button class="btn btn-ghost btn-block" data-action="connect">I already use ACT Prep on another device</button>
    </div>`;
  };

  const stepTime = () => {
    const total = DAY_ORDER.reduce((a, d) => a + (Number(st.availability[d]) || 0), 0);
    return html`<div class="stack-lg">
      <p class="muted">Short weeknight slots plus one weekend block. Homework comes first: you can clear any night with one tap.</p>
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

  const stepBenchmark = () => html`<div class="stack-lg">
    <p class="muted">Your in-school benchmark is real data. Save it as your first entry so the plan has somewhere to start.</p>
    <div class="card stack">
      <div class="spread"><div class="strong">School benchmark</div><span class="badge">Scale 1 to 35</span></div>
      <div class="score-row">
        ${['english', 'math', 'reading', 'science'].map((x) => html`<div class="score-cell sec-${x}"><b>${BENCHMARK[x]}</b><span>${x[0].toUpperCase() + x.slice(1)}</span></div>`)}
      </div>
      <p class="small muted">Not a full ACT, so it counts at lower weight and is flagged as capped at 35.</p>
    </div>
    <label class="check-row"><span class="grow strong">Save it as my first entry</span><span class="switch"><input type="checkbox" data-bench ${st.benchmark ? html`checked` : ''}><span></span></span></label>
    <div class="sticky-actions"><button class="btn btn-secondary" data-action="back">Back</button><button class="btn" data-action="next">Next</button></div>
  </div>`;

  const stepBackup = () => html`<div class="stack-lg">
    <div class="card stack-sm">
      <div class="row">${icon('download')}<h3>Backups</h3></div>
      <p class="muted">Your data stays on this phone, so export a backup file from Settings every week or so.</p>
    </div>
    <div class="card card-soft stack-sm">
      <div class="row">${icon('shield')}<h3>Claude features</h3></div>
      <p class="small muted">Explain and Coach work through your own Claude chat for free: the app copies a ready-made prompt, you paste Claude's reply back.</p>
    </div>
    <div class="sticky-actions"><button class="btn btn-secondary" data-action="back">Back</button><button class="btn" data-action="finish">Build my plan</button></div>
  </div>`;

  el.addEventListener('input', (e) => {
    if (e.target.name === 'date') st.date = e.target.value;
    if (e.target.name === 'label') st.label = e.target.value;
  });
  el.addEventListener('change', (e) => {
    if (e.target.hasAttribute('data-bench')) st.benchmark = e.target.checked;
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
    const b = e.target.closest('[data-action]');
    if (!b) return;
    if (b.dataset.action === 'next') {
      if (st.step === 0 && !isISODate(st.date)) {
        const err = el.querySelector('[data-error]');
        err.textContent = 'Pick your test date.';
        err.hidden = false;
        return;
      }
      st.step++;
      draw();
    } else if (b.dataset.action === 'back') {
      st.step--;
      draw();
    } else if (b.dataset.action === 'connect') {
      await connectExisting(ctx);
    } else if (b.dataset.action === 'finish') {
      b.disabled = true;
      try {
        const others = (s.testDates || []).slice(1).filter((t) => t.date !== st.date);
        if (st.benchmark && !store.state.attempts.some((a) => a.kind === 'benchmark')) {
          await store.saveAttempt({
            attempt: {
              id: store.newId('att'),
              date: store.today(),
              kind: 'benchmark',
              sourceId: null,
              scores: { ...BENCHMARK },
              scale: 35,
              notes: 'School benchmark',
              createdAt: store.nowISO(),
            },
          });
        }
        await store.saveSettings(
          { onboarded: true, testDates: [{ date: st.date, label: st.label.trim() || 'ACT', science: true }, ...others], availability: st.availability },
          { regen: true },
        );
        ctx.navigate('#/today', { replace: true });
      } catch (err) {
        b.disabled = false;
        reportError(err, "Couldn't finish setup. Try again.");
      }
    }
  });

  draw();
}

/** Second device: enter the passcode, pull everything, and skip setup. */
async function connectExisting(ctx) {
  const done = await openSheet(
    html`<h2>Connect this device</h2>
      <p class="small muted">Enter the app passcode from your other device (Settings, Sync). Your tests, log, and plan will download here.</p>
      <form class="stack" data-connect>
        <input class="input" name="passcode" type="password" autocomplete="current-password" placeholder="App passcode" required>
        <p class="error-text" data-error hidden></p>
        <div class="sheet-actions"><button type="button" class="btn btn-secondary" data-close="">Cancel</button><button class="btn" type="submit">Connect</button></div>
      </form>`,
    (root, close) => {
      const form = root.querySelector('[data-connect]');
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = form.querySelector('[type=submit]');
        const err = form.querySelector('[data-error]');
        btn.disabled = true;
        btn.textContent = 'Connecting';
        const problem = await enableSync(form.elements.passcode.value);
        btn.disabled = false;
        btn.textContent = 'Connect';
        if (problem) {
          err.textContent = problem;
          err.hidden = false;
          return;
        }
        close('ok');
      });
    },
  );
  if (done !== 'ok') return;
  if (store.state.settings.onboarded) {
    toast('Connected. Your data is here.');
    ctx.navigate('#/today', { replace: true });
  } else {
    toast('Connected, but no data was found yet. Finish setup here, or sync your other device first.');
  }
}
