// Test entry wizard: source, scores, missed-question grid with pacing, then the tagging queue.
import { html, setHTML } from '../safe-html.js';
import * as store from '../store.js';
import { icon, topbar, reportError, toast, confirmSheet, plural } from '../ui.js';
import { ALL_SECTIONS, SECTIONS, ATTEMPT_KINDS, LEGACY_SECTIONS, MIN_SCORE, MAX_SCORE } from '../data/act.js';
import { attemptSources } from '../data/materials.js';
import { composite, stem } from '../logic/scoring.js';
import { isTimingFlag } from '../logic/focus.js';
import { isISODate } from '../logic/dates.js';
import { topicPicker, causePicker, promptNewTopic } from './miss-form.js';

export const live = false;

const DRAFT_KEY = 'act-prep-test-draft';
const STEPS = ['Source', 'Scores', 'Misses', 'Tag'];

let draft = null;

function blankDraft(query) {
  const mats = attemptSources(store.materials());
  let sourceId = query.source && mats.some((m) => m.sourceId === query.source) ? query.source : '';
  let kind = ATTEMPT_KINDS[query.kind] ? query.kind : '';
  if (!sourceId && !kind) {
    // Default to the first full-length test not logged yet.
    const used = new Set(store.state.attempts.map((a) => a.sourceId));
    const next = mats.find((m) => !used.has(m.sourceId));
    sourceId = next ? next.sourceId : '';
  }
  if (!kind) kind = kindForSource(sourceId);
  return {
    id: null,
    step: 0,
    sourceId: kind === 'real' ? '' : sourceId,
    kind,
    date: isISODate(query.date) ? query.date : store.today(),
    scale: kind === 'benchmark' ? 35 : 36,
    notes: '',
    scores: { english: '', math: '', reading: '', science: '' },
    marks: { english: {}, math: {}, reading: {}, science: {} },
    pacing: {},
    tags: {},
    activeSection: 'english',
    tagIndex: 0,
    extraMisses: [],
  };
}

function kindForSource(sourceId) {
  const m = store.materials().find((x) => x.sourceId === sourceId);
  if (!m) return 'other';
  if (m.format === 'legacy') return 'official_legacy';
  if (m.format === 'enhanced') return 'official_enhanced';
  return 'other';
}

function draftFromAttempt(a) {
  const d = blankDraft({});
  d.id = a.id;
  d.sourceId = a.sourceId || '';
  d.kind = a.kind;
  d.date = a.date;
  d.scale = a.scale || 36;
  d.notes = a.notes || '';
  for (const s of ALL_SECTIONS) d.scores[s] = a.scores && a.scores[s] ? String(a.scores[s]) : '';
  for (const p of store.state.pacing.filter((x) => x.attemptId === a.id)) {
    d.pacing[p.section] = { notReached: p.notReached || 0, guessedAtEnd: p.guessedAtEnd || 0, minutesLeft: p.minutesLeft || 0 };
  }
  for (const m of store.state.misses.filter((x) => x.attemptId === a.id)) {
    if (m.questionNumber) {
      d.marks[m.section][m.questionNumber] = m.guessedRight ? 'guess' : 'miss';
      d.tags[`${m.section}:${m.questionNumber}`] = { missId: m.id, topic: m.topic, cause: m.cause, note: m.note, myAnswer: m.myAnswer, correctAnswer: m.correctAnswer, fixLine: m.fixLine, createdAt: m.createdAt, explanation: m.explanation };
    } else {
      d.extraMisses.push(m);
    }
  }
  return d;
}

function saveDraft() {
  try {
    if (draft && !draft.id) localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  } catch {
    /* storage may be unavailable; the draft just won't survive a reload */
  }
}
function loadDraft() {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
function clearDraft() {
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch {
    /* ignore */
  }
}

function questionCount(section) {
  const m = store.materials().find((x) => x.sourceId === draft.sourceId);
  if (m && m.format === 'legacy') return LEGACY_SECTIONS[section].questions;
  return SECTIONS[section].questions;
}

/** A shorter test (enhanced vs legacy) can't keep marks past its last question. */
function pruneMarks() {
  for (const s of ALL_SECTIONS) {
    const n = questionCount(s);
    for (const q of Object.keys(draft.marks[s])) if (Number(q) > n) delete draft.marks[s][q];
  }
}

function scoreValue(s) {
  const v = Number(draft.scores[s]);
  return Number.isInteger(v) && v >= MIN_SCORE && v <= (draft.scale === 35 ? 35 : MAX_SCORE) ? v : null;
}

function enteredSections() {
  return ALL_SECTIONS.filter((s) => scoreValue(s) !== null);
}

/** Every marked question in order, as tag keys. */
function markedKeys() {
  const keys = [];
  for (const s of ALL_SECTIONS) {
    if (scoreValue(s) === null) continue;
    const nums = Object.keys(draft.marks[s]).map(Number).sort((a, b) => a - b);
    for (const n of nums) keys.push(`${s}:${n}`);
  }
  return keys;
}

// ---------------------------------------------------------------- render

export function render(el, ctx) {
  const editId = ctx.params.id;
  if (editId) {
    const a = store.state.attempts.find((x) => x.id === editId);
    if (!a) {
      setHTML(el, html`${topbar('Edit test', { back: '#/tests' })}<div class="empty"><h3>That test isn't here</h3><p>It may have been deleted.</p><a class="btn" href="#/tests">Back to tests</a></div>`);
      return;
    }
    if (!draft || draft.id !== editId) draft = draftFromAttempt(a);
  } else if (!draft || draft.id) {
    const saved = loadDraft();
    draft = saved && !ctx.query.source && !ctx.query.kind ? saved : blankDraft(ctx.query);
  }

  const draw = () => {
    const step = draft.step;
    setHTML(
      el,
      html`${topbar(editId ? 'Edit test' : 'Log a test', { back: editId ? `#/tests/${editId}` : '#/tests', eyebrow: `Step ${step + 1} of ${STEPS.length}: ${STEPS[step]}` })}
        <div class="stack-lg">
          <div class="steps">${STEPS.map((_, i) => html`<span class="${i <= step ? 'on' : ''}"></span>`)}</div>
          ${[stepSource, stepScores, stepMisses, stepTag][step]()}
        </div>`,
    );
    saveDraft();
  };

  el.addEventListener('click', async (e) => {
    const b = e.target.closest('[data-action], [data-kind], [data-sec-tab], [data-topic], [data-topic-new], [data-cause], [data-step-pacing]');
    if (!b) return;
    if (b.dataset.kind) {
      draft.kind = b.dataset.kind;
      if (draft.kind === 'benchmark') draft.scale = 35;
      else if (draft.scale === 35) draft.scale = 36;
      if (draft.kind === 'real') draft.sourceId = '';
      pruneMarks();
      draw();
      return;
    }
    if (b.dataset.secTab) {
      readPacing(el);
      draft.activeSection = b.dataset.secTab;
      draw();
      return;
    }
    if (b.dataset.stepPacing) {
      const [sec, field, delta] = b.dataset.stepPacing.split(':');
      const p = (draft.pacing[sec] = draft.pacing[sec] || { notReached: 0, guessedAtEnd: 0, minutesLeft: 0 });
      p[field] = Math.max(0, Math.min(99, (Number(p[field]) || 0) + Number(delta)));
      const out = el.querySelector(`[data-pacing-out="${sec}:${field}"]`);
      if (out) out.textContent = String(p[field]);
      const flag = el.querySelector('[data-timing-flag]');
      if (flag) flag.hidden = !isTimingFlag(p);
      saveDraft();
      return;
    }
    if (b.dataset.topic !== undefined && b.closest('[data-tag-card]')) {
      currentTag().topic = b.dataset.topic;
      el.querySelectorAll('[data-topic]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      saveDraft();
      return;
    }
    if (b.hasAttribute('data-topic-new')) {
      try {
        const key = markedKeys()[draft.tagIndex];
        const name = await promptNewTopic(key.split(':')[0]);
        if (name) {
          readTagText(el);
          currentTag().topic = name;
          draw();
        }
      } catch (err) {
        reportError(err, "Couldn't add that topic. Try again.");
      }
      return;
    }
    if (b.dataset.cause) {
      currentTag().cause = b.dataset.cause;
      el.querySelectorAll('[data-cause]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      saveDraft();
      return;
    }
    const action = b.dataset.action;
    if (action === 'next') return next();
    if (action === 'back') return back();
    if (action === 'tag-next') return tagMove(1);
    if (action === 'tag-prev') return tagMove(-1);
    if (action === 'save') return save();
    if (action === 'discard') {
      const ok = await confirmSheet({ title: 'Discard this test?', body: 'The scores and marks you entered here will be cleared.', confirmLabel: 'Discard', danger: true });
      if (!ok) return;
      clearDraft();
      draft = null;
      ctx.navigate('#/tests');
    }
  });

  el.addEventListener('input', (e) => {
    const t = e.target;
    if (t.dataset.score) {
      draft.scores[t.dataset.score] = t.value.replace(/[^0-9]/g, '').slice(0, 2);
      updateComposite(el);
      saveDraft();
    } else if (t.name === 'date' || t.name === 'notes') {
      draft[t.name] = t.value;
      saveDraft();
    }
  });
  el.addEventListener('change', (e) => {
    const t = e.target;
    if (t.name === 'sourceId') {
      draft.sourceId = t.value;
      if (draft.kind !== 'real' && draft.kind !== 'benchmark') draft.kind = kindForSource(t.value);
      pruneMarks();
      draw();
    } else if (t.name === 'scale') {
      draft.scale = Number(t.value);
      saveDraft();
    }
  });

  bindGrid(el);

  function next() {
    const err = validateStep(el);
    if (err) {
      const box = el.querySelector('[data-error]');
      if (box) {
        box.textContent = err;
        box.hidden = false;
      }
      return;
    }
    if (draft.step === 2) readPacing(el);
    if (draft.step === 2 && !markedKeys().length) {
      // No misses to tag: save right away.
      return save();
    }
    draft.step = Math.min(STEPS.length - 1, draft.step + 1);
    if (draft.step === 2 && scoreValue(draft.activeSection) === null) draft.activeSection = enteredSections()[0];
    if (draft.step === 3) draft.tagIndex = Math.min(draft.tagIndex, markedKeys().length - 1);
    draw();
    window.scrollTo(0, 0);
  }
  function back() {
    if (draft.step === 2) readPacing(el);
    if (draft.step === 3) readTagText(el);
    draft.step = Math.max(0, draft.step - 1);
    draw();
  }
  function tagMove(delta) {
    readTagText(el);
    const keys = markedKeys();
    const i = draft.tagIndex + delta;
    if (i < 0) return back();
    if (i >= keys.length) return save();
    draft.tagIndex = i;
    draw();
    window.scrollTo(0, 0);
  }
  async function save() {
    if (draft.step === 3) readTagText(el);
    if (draft.step === 2) readPacing(el);
    const btns = el.querySelectorAll('[data-action=save], [data-action=tag-next], [data-action=next]');
    btns.forEach((x) => (x.disabled = true));
    try {
      const id = await persist();
      clearDraft();
      draft = null;
      toast('Test saved. Your plan just updated.');
      ctx.navigate(`#/tests/${id}`);
    } catch (err) {
      btns.forEach((x) => (x.disabled = false));
      reportError(err, "Couldn't save the test. Try again.");
    }
  }

  draw();
}

function currentTag() {
  const key = markedKeys()[draft.tagIndex];
  draft.tags[key] = draft.tags[key] || { topic: '', cause: '' };
  return draft.tags[key];
}

function validateStep() {
  if (draft.step === 0) {
    if (!isISODate(draft.date)) return 'Pick the date you took it.';
    if (draft.kind !== 'real' && draft.kind !== 'benchmark' && draft.kind !== 'other' && !draft.sourceId) return 'Pick which test you took.';
  }
  if (draft.step === 1) {
    const bad = ALL_SECTIONS.filter((s) => draft.scores[s] !== '' && scoreValue(s) === null);
    if (bad.length) return `Scores run from 1 to ${draft.scale === 35 ? 35 : 36}. Check ${bad.map((s) => SECTIONS[s].label).join(', ')}.`;
    if (!enteredSections().length) return 'Enter at least one section score.';
  }
  return null;
}

function readPacing(el) {
  el.querySelectorAll('[data-pacing-out]').forEach((o) => {
    const [sec, field] = o.dataset.pacingOut.split(':');
    const p = (draft.pacing[sec] = draft.pacing[sec] || { notReached: 0, guessedAtEnd: 0, minutesLeft: 0 });
    p[field] = Number(o.textContent) || 0;
  });
}

function readTagText(el) {
  const card = el.querySelector('[data-tag-card]');
  if (!card) return;
  const t = currentTag();
  for (const name of ['note', 'myAnswer', 'correctAnswer']) {
    const f = card.querySelector(`[name=${name}]`);
    if (f) t[name] = f.value.trim();
  }
}

function updateComposite(el) {
  const c = composite(scoreValue('english'), scoreValue('math'), scoreValue('reading'));
  const st = stem(scoreValue('math'), scoreValue('science'));
  const out = el.querySelector('[data-composite]');
  if (out) out.textContent = c === null ? '--' : String(c);
  const so = el.querySelector('[data-stem]');
  if (so) {
    so.textContent = st === null ? '' : `STEM ${st}`;
    so.hidden = st === null;
  }
}

// ---------------------------------------------------------------- steps

function stepSource() {
  const mats = attemptSources(store.materials());
  const used = new Set(store.state.attempts.filter((a) => a.id !== draft.id).map((a) => a.sourceId));
  const needsSource = draft.kind !== 'real' && draft.kind !== 'benchmark';
  return html`<div class="stack-lg">
    <div class="field"><span class="label">What kind of test?</span>
      <div class="chips">
        ${Object.entries(ATTEMPT_KINDS).map(([k, v]) => html`<button type="button" class="chip" data-kind="${k}" aria-pressed="${draft.kind === k}">${v.label}</button>`)}
      </div>
    </div>
    ${needsSource
      ? html`<div class="field"><label for="te-source">Which test</label>
          <select class="input" id="te-source" name="sourceId">
            <option value="">Choose a test</option>
            ${mats.map((m) => html`<option value="${m.sourceId}" ${draft.sourceId === m.sourceId ? html`selected` : ''}>${m.title}${used.has(m.sourceId) ? ' (logged before)' : ''}</option>`)}
            <option value="other" ${draft.sourceId === 'other' ? html`selected` : ''}>Something else</option>
          </select>
          ${!mats.some((m) => m.format === 'legacy') ? html`<span class="hint">Legacy tests show up here once you add them in Settings.</span>` : ''}
        </div>`
      : ''}
    <div class="grid-2">
      <div class="field"><label for="te-date">Date taken</label><input class="input" id="te-date" type="date" name="date" value="${draft.date}"></div>
      <div class="field"><label for="te-scale">Score scale</label>
        <select class="input" id="te-scale" name="scale">
          <option value="36" ${draft.scale === 36 ? html`selected` : ''}>1 to 36</option>
          <option value="35" ${draft.scale === 35 ? html`selected` : ''}>1 to 35</option>
        </select>
      </div>
    </div>
    <div class="field"><label for="te-notes">Notes</label><input class="input" id="te-notes" name="notes" maxlength="200" value="${draft.notes}" placeholder="Optional, e.g. tired, took it in two sittings"></div>
    <p class="error-text" data-error hidden></p>
    <div class="sticky-actions">
      ${draft.id ? '' : html`<button class="btn btn-secondary" data-action="discard">Discard</button>`}
      <button class="btn" data-action="next">Next</button>
    </div>
  </div>`;
}

function stepScores() {
  const c = composite(scoreValue('english'), scoreValue('math'), scoreValue('reading'));
  const st = stem(scoreValue('math'), scoreValue('science'));
  return html`<div class="stack-lg">
    <div class="card center stack-sm">
      <span class="small muted strong">Composite</span>
      <div class="score-big" data-composite>${c === null ? '--' : c}</div>
      <span class="badge badge-science" data-stem ${st === null ? html`hidden` : ''}>${st === null ? '' : `STEM ${st}`}</span>
      <span class="tiny muted">English, Math, and Reading. Science is not part of the composite.</span>
    </div>
    <div class="grid-2">
      ${ALL_SECTIONS.map(
        (s) => html`<div class="field sec-${s}"><label for="sc-${s}"><span class="sec-dot sec-${s}" style="display:inline-block"></span> ${SECTIONS[s].label}${s === 'science' ? ' (optional)' : ''}</label>
          <input class="input input-score" id="sc-${s}" data-score="${s}" inputmode="numeric" pattern="[0-9]*" maxlength="2" value="${draft.scores[s]}" placeholder="--" autocomplete="off"></div>`,
      )}
    </div>
    ${draft.scale === 35 ? html`<p class="hint">35-point scores are kept as entered and flagged as capped at 35.</p>` : ''}
    <p class="error-text" data-error hidden></p>
    <div class="sticky-actions"><button class="btn btn-secondary" data-action="back">Back</button><button class="btn" data-action="next">Next</button></div>
  </div>`;
}

function stepMisses() {
  const secs = enteredSections();
  const s = secs.includes(draft.activeSection) ? draft.activeSection : secs[0];
  draft.activeSection = s;
  const n = questionCount(s);
  const marks = draft.marks[s];
  const missCount = Object.values(marks).filter((v) => v === 'miss').length;
  const guessCount = Object.values(marks).filter((v) => v === 'guess').length;
  const p = draft.pacing[s] || { notReached: 0, guessedAtEnd: 0, minutesLeft: 0 };
  const total = markedKeys().length;
  const stepper = (field, label, hint) => html`<div class="day-row"><div class="grow"><div class="strong small">${label}</div><div class="hint">${hint}</div></div>
    <div class="stepper"><button type="button" data-step-pacing="${s}:${field}:-1" aria-label="Less">-</button><output data-pacing-out="${s}:${field}">${p[field] || 0}</output><button type="button" data-step-pacing="${s}:${field}:1" aria-label="More">+</button></div></div>`;
  return html`<div class="stack-lg">
    <div class="seg" role="tablist">
      ${secs.map((x) => {
        const c = Object.keys(draft.marks[x]).length;
        return html`<button type="button" data-sec-tab="${x}" aria-pressed="${x === s}">${SECTIONS[x].label}${c ? ` (${c})` : ''}</button>`;
      })}
    </div>
    <div class="card stack">
      <div class="spread"><h2>${SECTIONS[s].label} misses</h2><span class="small muted" data-grid-count>${countText(missCount, guessCount)}</span></div>
      <p class="small muted">Tap a question you missed. Long-press one you got right only by guessing.</p>
      <div class="qgrid sec-${s}" data-grid="${s}">
        ${Array.from({ length: n }, (_, i) => i + 1).map((q) => html`<button type="button" class="q" data-q="${q}" data-state="${marks[q] || ''}" aria-label="Question ${q}${marks[q] === 'miss' ? ', missed' : marks[q] === 'guess' ? ', guessed right' : ''}">${q}</button>`)}
      </div>
      <div class="legend"><span><i style="background:var(--danger)"></i>Missed</span><span><i style="background:var(--warn-soft);border:1.5px solid var(--warn)"></i>Guessed right</span></div>
    </div>
    <details class="card" ${draft.pacing[s] ? html`open` : ''}>
      <summary class="strong">Pacing for ${SECTIONS[s].label} <span class="small muted">(optional)</span></summary>
      <div class="mt">
        ${stepper('notReached', 'Questions not reached', 'Left blank or never read')}
        ${stepper('guessedAtEnd', 'Guessed at the end', 'Filled in to beat the clock')}
        ${stepper('minutesLeft', 'Minutes left over', 'Time remaining when you finished')}
      </div>
      <p class="notice notice-warn mt" data-timing-flag ${isTimingFlag(p) ? '' : html`hidden`}>Timing flag: this section will lean toward pacing drills.</p>
    </details>
    <div class="sticky-actions"><button class="btn btn-secondary" data-action="back">Back</button>
      <button class="btn" data-action="next">${total ? `Tag ${plural(total, 'question')}` : 'Save test'}</button></div>
  </div>`;
}

function countText(missCount, guessCount) {
  return `${missCount} missed${guessCount ? `, ${guessCount} guessed` : ''}`;
}

function stepTag() {
  const keys = markedKeys();
  if (!keys.length) return html`<div class="empty"><h3>No questions marked</h3><p>Go back to mark misses, or save the test now.</p><button class="btn" data-action="save">Save test</button></div>`;
  const i = Math.max(0, Math.min(draft.tagIndex, keys.length - 1));
  draft.tagIndex = i;
  const key = keys[i];
  const [s, q] = key.split(':');
  const t = draft.tags[key] || { topic: '', cause: '' };
  const guessed = draft.marks[s][q] === 'guess';
  const isLast = i === keys.length - 1;
  return html`<div class="stack-lg" data-tag-card>
    <div class="tag-head sec-${s}">
      <div class="qnum">${q}</div>
      <div class="grow"><div class="strong">${SECTIONS[s].label}, question ${q}</div><div class="small muted">${i + 1} of ${keys.length}${guessed ? '. Guessed right, counts at half weight' : ''}</div></div>
    </div>
    <div class="field"><span class="label">Topic</span>${topicPicker(s, t.topic, store.state.settings.customTopics)}</div>
    <div class="field"><span class="label">${guessed ? 'Why were you unsure?' : 'Why did you miss it?'}</span>${causePicker(t.cause)}</div>
    <details ${t.note || t.myAnswer || t.correctAnswer ? html`open` : ''}>
      <summary class="strong small">Add a note or answer choices</summary>
      <div class="stack mt">
        <div class="grid-2">
          <div class="field"><label>My answer</label><input class="input" name="myAnswer" maxlength="20" value="${t.myAnswer || ''}" placeholder="e.g. B"></div>
          <div class="field"><label>Correct answer</label><input class="input" name="correctAnswer" maxlength="20" value="${t.correctAnswer || ''}" placeholder="e.g. D"></div>
        </div>
        <div class="field"><label>Note</label><input class="input" name="note" maxlength="300" value="${t.note || ''}" placeholder="One line on what happened"></div>
      </div>
    </details>
    <div class="sticky-actions">
      <button class="btn btn-secondary" data-action="tag-prev">${i === 0 ? 'Back' : 'Previous'}</button>
      <button class="btn" data-action="tag-next">${isLast ? 'Save test' : 'Next'}</button>
    </div>
    ${!isLast ? html`<button class="btn btn-ghost btn-block" data-action="save">Save now, tag the rest later</button>` : ''}
  </div>`;
}

// ---------------------------------------------------------------- grid input

function bindGrid(el) {
  let timer = null;
  let longFired = false;
  let pressed = null;
  const set = (btn, state) => {
    const s = btn.closest('[data-grid]').dataset.grid;
    const q = Number(btn.dataset.q);
    if (state) draft.marks[s][q] = state;
    else delete draft.marks[s][q];
    btn.dataset.state = state || '';
    btn.setAttribute('aria-label', `Question ${q}${state === 'miss' ? ', missed' : state === 'guess' ? ', guessed right' : ''}`);
    const counter = el.querySelector('[data-grid-count]');
    if (counter) {
      const vals = Object.values(draft.marks[s]);
      counter.textContent = countText(vals.filter((v) => v === 'miss').length, vals.filter((v) => v === 'guess').length);
    }
    const tabBtn = el.querySelector(`[data-sec-tab="${s}"]`);
    const c = Object.keys(draft.marks[s]).length;
    if (tabBtn) tabBtn.textContent = `${SECTIONS[s].label}${c ? ` (${c})` : ''}`;
    const nextBtn = el.querySelector('[data-action=next]');
    const total = markedKeys().length;
    if (nextBtn && draft.step === 2) nextBtn.textContent = total ? `Tag ${plural(total, 'question')}` : 'Save test';
    saveDraft();
  };
  el.addEventListener('pointerdown', (e) => {
    const btn = e.target.closest('.q');
    if (!btn) return;
    pressed = btn;
    longFired = false;
    clearTimeout(timer);
    timer = setTimeout(() => {
      longFired = true;
      set(btn, btn.dataset.state === 'guess' ? '' : 'guess');
      if (navigator.vibrate) navigator.vibrate(15);
    }, 450);
  });
  const cancel = () => clearTimeout(timer);
  el.addEventListener('pointerup', cancel);
  el.addEventListener('pointercancel', cancel);
  el.addEventListener('pointerleave', cancel, true);
  el.addEventListener('contextmenu', (e) => {
    if (e.target.closest('.q')) e.preventDefault();
  });
  el.addEventListener('click', (e) => {
    const btn = e.target.closest('.q');
    if (!btn) return;
    if (longFired && pressed === btn) {
      longFired = false;
      return;
    }
    set(btn, btn.dataset.state ? '' : 'miss');
  });
}

// ---------------------------------------------------------------- persist

async function persist() {
  const id = draft.id || store.newId('att');
  const scores = {};
  for (const s of ALL_SECTIONS) {
    const v = scoreValue(s);
    if (v !== null) scores[s] = v;
  }
  const attempt = {
    id,
    date: draft.date,
    kind: draft.kind,
    sourceId: draft.sourceId && draft.sourceId !== 'other' ? draft.sourceId : null,
    scores,
    scale: draft.scale,
    notes: (draft.notes || '').trim(),
    createdAt: (store.state.attempts.find((a) => a.id === id) || {}).createdAt || store.nowISO(),
  };
  const pacing = Object.entries(draft.pacing)
    .filter(([s, p]) => scores[s] && p && (p.notReached || p.guessedAtEnd || p.minutesLeft))
    .map(([section, p]) => ({ section, notReached: p.notReached || 0, guessedAtEnd: p.guessedAtEnd || 0, minutesLeft: p.minutesLeft || 0 }));
  const misses = markedKeys().map((key) => {
    const [section, q] = key.split(':');
    const t = draft.tags[key] || {};
    return {
      id: t.missId || store.newId('miss'),
      section,
      questionNumber: Number(q),
      topic: t.topic || '',
      cause: t.cause || 'content',
      guessedRight: draft.marks[section][q] === 'guess',
      note: t.note || '',
      myAnswer: t.myAnswer || '',
      correctAnswer: t.correctAnswer || '',
      fixLine: t.fixLine || '',
      createdAt: t.createdAt || store.nowISO(),
      explanation: t.explanation || null,
    };
  });
  for (const m of draft.extraMisses || []) misses.push(m);
  await store.saveAttempt({ attempt, pacing, misses });
  return id;
}

