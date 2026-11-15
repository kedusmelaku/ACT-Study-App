// Test entry wizard: source, scores, missed-question grid with pacing, then the tagging queue.
// Tests with a built-in key (Official Practice Tests 1 to 4) skip the scores step: scores come from the misses.
import { html, setHTML } from '../safe-html.js';
import * as store from '../store.js';
import { icon, topbar, reportError, toast, confirmSheet, plural } from '../ui.js';
import { ALL_SECTIONS, SECTIONS, ATTEMPT_KINDS, LEGACY_SECTIONS, MIN_SCORE, MAX_SCORE } from '../data/act.js';
import { attemptSources } from '../data/materials.js';
import { composite, stem, keyedScores } from '../logic/scoring.js';
import { FORMS, isKeyed, keyFor, CATEGORY_NAMES, CATEGORY_TOPICS } from '../data/forms.js';
import { isTimingFlag } from '../logic/focus.js';
import { isISODate } from '../logic/dates.js';
import { topicPicker, causePicker, promptNewTopic, pickTopic } from './miss-form.js';
import { topicsOf, toggleTopic, MAX_TOPICS } from '../data/topics.js';
import { addTestSheet } from './add-test.js';
import { importResultsSheet } from './import-results.js';
import { bookletPanel, mountBooklet } from './booklet-view.js';
import { onChange as onBookletChange, hasBooklet, choicesFor, matchChoice } from '../booklets.js';
import { parseResults, splitSections, checkResults } from '../logic/results-import.js';

export const live = false;

const DRAFT_KEY = 'act-prep-test-draft';
const STEP_LABELS = { source: 'Source', scores: 'Scores', misses: 'Misses', tag: 'Tag' };

let draft = null;

// First line and answer of each imported question, for the tag card. Official question text, so it
// lives in memory only: never in the draft, the saved miss, exports, or sync.
let hints = { sourceId: null, bySection: {} };
let importNotice = '';
// Tag cards where the correct answer was tapped open. Memory only.
const shownAnswers = new Set();
// Answer choices read from the attached booklet, by "sourceId:section:q". Memory only.
const choiceCache = new Map();

function hintFor(section, q) {
  if (hints.sourceId !== draft.sourceId) return null;
  const list = hints.bySection[section];
  return (list && list[Number(q) - 1]) || null;
}

function forgetImport() {
  hints = { sourceId: null, bySection: {} };
  importNotice = '';
  shownAnswers.clear();
  choiceCache.clear();
}

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
    taken: { english: true, math: true, reading: true, science: true },
    useKey: true,
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
  for (const s of ALL_SECTIONS) d.taken[s] = Boolean(a.scores && a.scores[s]);
  // Only attempts scored from the key follow it. Older ones keep the scores typed in.
  d.useKey = a.scoredBy === 'key';
  for (const p of store.state.pacing.filter((x) => x.attemptId === a.id)) {
    d.pacing[p.section] = { notReached: p.notReached || 0, guessedAtEnd: p.guessedAtEnd || 0, minutesLeft: p.minutesLeft || 0 };
  }
  for (const m of store.state.misses.filter((x) => x.attemptId === a.id)) {
    if (m.questionNumber) {
      d.marks[m.section][m.questionNumber] = m.guessedRight ? 'guess' : 'miss';
      d.tags[`${m.section}:${m.questionNumber}`] = { missId: m.id, topics: topicsOf(m), cause: m.cause, note: m.note, myAnswer: m.myAnswer, saidText: m.myAnswerText || '', correctAnswer: m.correctAnswer, fixLine: m.fixLine, createdAt: m.createdAt, explanation: m.explanation };
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

/** The practice-test number of the test picked in step 1, when it has one. */
function chosenTestNumber() {
  const m = /^enhanced-(\d+)$/.exec(draft.sourceId || '');
  if (m) return Number(m[1]);
  const mat = store.materials().find((x) => x.sourceId === draft.sourceId);
  const t = mat && /practice test\s*#?(\d+)/i.exec(mat.title || '');
  return t ? Number(t[1]) : null;
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

/** True when the chosen test has a built-in key, so scores come from the marked misses. */
function keyed() {
  return draft.kind === 'official_enhanced' && isKeyed(draft.sourceId);
}

function stepIds() {
  return keyed() ? ['source', 'misses', 'tag'] : ['source', 'scores', 'misses', 'tag'];
}

function stepId() {
  const ids = stepIds();
  return ids[Math.min(draft.step, ids.length - 1)];
}

function takenSections() {
  return ALL_SECTIONS.filter((s) => !draft.taken || draft.taken[s] !== false);
}

function keyResult() {
  return keyedScores(FORMS[draft.sourceId], draft.marks, takenSections());
}

function manualValue(s) {
  const v = Number(draft.scores[s]);
  const max = draft.scale === 35 && !keyed() ? 35 : MAX_SCORE;
  return Number.isInteger(v) && v >= MIN_SCORE && v <= max ? v : null;
}

function scoreValue(s) {
  if (!keyed()) return manualValue(s);
  if (!takenSections().includes(s)) return null;
  if (draft.useKey === false) return manualValue(s);
  const v = keyResult().scores[s];
  return v === undefined ? null : v;
}

function enteredSections() {
  return keyed() ? takenSections() : ALL_SECTIONS.filter((s) => manualValue(s) !== null);
}

/** Every marked question in order, as tag keys. */
function markedKeys() {
  const keys = [];
  const secs = enteredSections();
  for (const s of ALL_SECTIONS) {
    if (!secs.includes(s)) continue;
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
    const ids = stepIds();
    draft.step = Math.min(draft.step, ids.length - 1);
    const step = draft.step;
    const views = { source: stepSource, scores: stepScores, misses: stepMisses, tag: stepTag };
    setHTML(
      el,
      html`${topbar(editId ? 'Edit test' : 'Log a test', { back: editId ? `#/tests/${editId}` : '#/tests', eyebrow: `Step ${step + 1} of ${ids.length}: ${STEP_LABELS[ids[step]]}` })}
        <div class="stack-lg">
          <div class="steps">${ids.map((_, i) => html`<span class="${i <= step ? 'on' : ''}"></span>`)}</div>
          ${views[ids[step]]()}
        </div>`,
    );
    mountBooklet(el);
    fillReview(el);
    centerTagStrip(el);
    saveDraft();
  };

  el.addEventListener('click', async (e) => {
    const rv = e.target.closest('[data-reveal-answer]');
    if (rv) {
      const id = `${draft.sourceId}:${rv.dataset.revealAnswer}`;
      const [sec, num] = rv.dataset.revealAnswer.split(':');
      const k = keyFor(draft.sourceId, sec, num);
      if (shownAnswers.has(id)) shownAnswers.delete(id);
      else shownAnswers.add(id);
      const box = rv.closest('[data-review]');
      if (box && k) setHTML(box, reviewInner(rv.dataset.revealAnswer, hintFor(sec, num), draft.tags[rv.dataset.revealAnswer] || {}, k));
      return;
    }
    const b = e.target.closest('[data-action], [data-kind], [data-sec-tab], [data-topic], [data-topic-new], [data-cause], [data-step-pacing], [data-tag-go]');
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
      const tag = currentTag();
      tag.topics = pickTopic(el, tagTopics(markedKeys()[draft.tagIndex]), b.dataset.topic);
      delete tag.topic;
      refreshChip(el);
      saveDraft();
      return;
    }
    if (b.hasAttribute('data-topic-new')) {
      try {
        const key = markedKeys()[draft.tagIndex];
        const name = await promptNewTopic(key.split(':')[0]);
        if (name) {
          readTagText(el);
          const tag = currentTag();
          tag.topics = toggleTopic(tagTopics(key), name) || tagTopics(key);
          delete tag.topic;
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
      refreshChip(el);
      saveDraft();
      return;
    }
    if (b.dataset.tagGo !== undefined) {
      readTagText(el);
      draft.tagIndex = Number(b.dataset.tagGo);
      draw();
      return;
    }
    const action = b.dataset.action;
    if (action === 'next') return next();
    if (action === 'back') return back();
    if (action === 'tag-next') return tagMove(1);
    if (action === 'tag-prev') return tagMove(-1);
    if (action === 'save') return save();
    if (action === 'import') return importResults();
    if (action === 'edit-scores') {
      // Start from the key's scores; the edited ones stick until "Use key scores".
      const r = keyResult();
      for (const sec of ALL_SECTIONS) draft.scores[sec] = r.scores[sec] ? String(r.scores[sec]) : '';
      draft.useKey = false;
      draw();
      return;
    }
    if (action === 'use-key') {
      draft.useKey = true;
      draw();
      return;
    }
    if (action === 'discard') {
      const ok = await confirmSheet({ title: 'Discard this test?', body: 'The scores and marks you entered here will be cleared.', confirmLabel: 'Discard', danger: true });
      if (!ok) return;
      clearDraft();
      draft = null;
      forgetImport();
      ctx.navigate('#/tests');
    }
  });

  el.addEventListener('input', (e) => {
    const t = e.target;
    if (t.dataset.score) {
      draft.scores[t.dataset.score] = t.value.replace(/[^0-9]/g, '').slice(0, 2);
      updateComposite(el);
      refreshKeySummary(el);
      saveDraft();
    } else if (t.name === 'date' || t.name === 'notes') {
      draft[t.name] = t.value;
      saveDraft();
    }
  });
  el.addEventListener('change', (e) => {
    const t = e.target;
    if (t.dataset.taken) {
      readPacing(el);
      draft.taken = { ...draft.taken, [t.dataset.taken]: t.checked };
      draw();
      return;
    }
    if (t.name === 'sourceId' && t.value === '__add') {
      // Add the test right here, then pick it.
      t.value = draft.sourceId || '';
      addTestSheet().then((entry) => {
        if (!entry) return;
        draft.sourceId = entry.sourceId;
        if (draft.kind !== 'real' && draft.kind !== 'benchmark') draft.kind = kindForSource(entry.sourceId);
        pruneMarks();
        draw();
      });
      return;
    }
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
    importNotice = '';
    const err = validateStep(el);
    if (err) {
      const box = el.querySelector('[data-error]');
      if (box) {
        box.textContent = err;
        box.hidden = false;
      }
      return;
    }
    if (stepId() === 'misses') readPacing(el);
    if (stepId() === 'misses' && !markedKeys().length) {
      // No misses to tag: save right away.
      return save();
    }
    draft.step = Math.min(stepIds().length - 1, draft.step + 1);
    if (stepId() === 'misses' && !keyed() && scoreValue(draft.activeSection) === null) draft.activeSection = enteredSections()[0];
    if (stepId() === 'tag') draft.tagIndex = Math.min(draft.tagIndex, markedKeys().length - 1);
    draw();
    window.scrollTo(0, 0);
  }
  async function importResults() {
    readPacing(el);
    let text;
    try {
      text = await importResultsSheet();
    } catch (err) {
      reportError(err, "Couldn't read that file. Try another one, or paste the results page.");
      return;
    }
    if (!text) return;
    importNotice = '';
    const done = [];
    for (const chunk of splitSections(text)) {
      const p = parseResults(chunk);
      const msg = await applyImport(p);
      if (msg) {
        importNotice = msg;
        break;
      }
      done.push(p);
    }
    draw();
    if (done.length) {
      const n = done.reduce((t, p) => t + p.results.filter((r) => r === 'incorrect').length, 0);
      toast(`Marked ${plural(n, 'miss', 'misses')} in ${done.map((p) => SECTIONS[p.section].label).join(' and ')}.`);
    }
  }

  /** Mark one parsed section's misses. Returns a message instead when it can't be imported. */
  async function applyImport(p) {
    if (!p.section) return checkResults(p, 0);
    const sec = p.section;
    const label = SECTIONS[sec].label;
    if (!keyed() && !enteredSections().includes(sec)) return `Add a ${label} score first, then import.`;
    const msg = checkResults(p, questionCount(sec));
    if (msg) return msg;
    const picked = chosenTestNumber();
    if (p.testNumber && picked && p.testNumber !== picked) {
      const ok = await confirmSheet({
        title: 'Different test?',
        body: `This file is from Practice Test ${p.testNumber}, but you picked Practice Test ${picked}. Import it anyway?`,
        confirmLabel: 'Import anyway',
      });
      if (!ok) return '';
    }
    const marks = draft.marks[sec];
    p.results.forEach((r, i) => {
      const q = i + 1;
      if (r === 'incorrect') {
        marks[q] = 'miss';
        // Keep what you answered with the draft, so a reload doesn't lose it.
        const said = p.questions[i] && p.questions[i].answer;
        const tk = `${sec}:${q}`;
        if (said) draft.tags[tk] = { ...(draft.tags[tk] || {}), saidText: said };
      } else if (marks[q] === 'miss') delete marks[q];
    });
    if (draft.taken) draft.taken = { ...draft.taken, [sec]: true };
    draft.activeSection = sec;
    if (hints.sourceId !== draft.sourceId) hints = { sourceId: draft.sourceId, bySection: {} };
    hints.bySection[sec] = p.questions;
    return null;
  }

  function back() {
    importNotice = '';
    if (stepId() === 'misses') readPacing(el);
    if (stepId() === 'tag') readTagText(el);
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
    if (stepId() === 'tag') readTagText(el);
    if (stepId() === 'misses') readPacing(el);
    const btns = el.querySelectorAll('[data-action=save], [data-action=tag-next], [data-action=next]');
    btns.forEach((x) => (x.disabled = true));
    try {
      const id = await persist();
      clearDraft();
      draft = null;
      forgetImport();
      toast('Test saved. Your plan just updated.');
      ctx.navigate(`#/tests/${id}`);
    } catch (err) {
      btns.forEach((x) => (x.disabled = false));
      reportError(err, "Couldn't save the test. Try again.");
    }
  }

  draw();
  // A booklet that finishes downloading shows up on the tag card right away.
  return onBookletChange(() => {
    if (!draft || stepId() !== 'tag' || !el.isConnected) return;
    readTagText(el);
    draw();
  });
}

function currentTag() {
  const key = markedKeys()[draft.tagIndex];
  draft.tags[key] = draft.tags[key] || { topic: '', cause: '' };
  return draft.tags[key];
}

function validateStep() {
  if (stepId() === 'source') {
    if (!isISODate(draft.date)) return 'Pick the date you took it.';
    if (draft.kind !== 'real' && draft.kind !== 'benchmark' && draft.kind !== 'other' && !draft.sourceId) return 'Pick which test you took.';
  }
  if (stepId() === 'misses' && keyed()) {
    if (!takenSections().length) return 'Turn on at least one section you took.';
    if (draft.useKey === false) {
      const bad = takenSections().filter((s) => manualValue(s) === null);
      if (bad.length) return `Scores run from 1 to 36. Check ${bad.map((s) => SECTIONS[s].label).join(', ')}.`;
    }
  }
  if (stepId() === 'scores') {
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
            <option value="other" ${draft.sourceId === 'other' ? html`selected` : ''}>Something else (not tracked)</option>
            <option value="__add">+ Add a test that isn't listed</option>
          </select>
          ${!mats.some((m) => m.format === 'legacy') ? html`<span class="hint">Add legacy tests in Settings to see them here.</span>` : ''}
        </div>`
      : ''}
    ${keyed()
      ? html`<div class="field"><label for="te-date">Date taken</label><input class="input" id="te-date" type="date" name="date" value="${draft.date}"></div>
          <p class="hint">This test's answer key is built in. Mark your misses and the app works out your scores.</p>`
      : html`<div class="grid-2">
          <div class="field"><label for="te-date">Date taken</label><input class="input" id="te-date" type="date" name="date" value="${draft.date}"></div>
          <div class="field"><label for="te-scale">Score scale</label>
            <select class="input" id="te-scale" name="scale">
              <option value="36" ${draft.scale === 36 ? html`selected` : ''}>1 to 36</option>
              <option value="35" ${draft.scale === 35 ? html`selected` : ''}>1 to 35</option>
            </select>
          </div>
        </div>`}
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
    ${draft.scale === 35 ? html`<p class="hint">Scored out of 35.</p>` : ''}
    <p class="error-text" data-error hidden></p>
    <div class="sticky-actions"><button class="btn btn-secondary" data-action="back">Back</button><button class="btn" data-action="next">Next</button></div>
  </div>`;
}

function stepMisses() {
  const isKeyed = keyed();
  const secs = isKeyed ? [...ALL_SECTIONS] : enteredSections();
  const s = secs.includes(draft.activeSection) ? draft.activeSection : secs[0];
  draft.activeSection = s;
  const took = !isKeyed || takenSections().includes(s);
  const unscored = new Set(isKeyed && FORMS[draft.sourceId][s] ? FORMS[draft.sourceId][s].unscored : []);
  const n = questionCount(s);
  const marks = draft.marks[s];
  const missCount = Object.values(marks).filter((v) => v === 'miss').length;
  const guessCount = Object.values(marks).filter((v) => v === 'guess').length;
  const p = draft.pacing[s] || { notReached: 0, guessedAtEnd: 0, minutesLeft: 0 };
  const total = markedKeys().length;
  const stepper = (field, label, hint) => html`<div class="day-row"><div class="grow"><div class="strong small">${label}</div><div class="hint">${hint}</div></div>
    <div class="stepper"><button type="button" data-step-pacing="${s}:${field}:-1" aria-label="Less">-</button><output data-pacing-out="${s}:${field}">${p[field] || 0}</output><button type="button" data-step-pacing="${s}:${field}:1" aria-label="More">+</button></div></div>`;
  return html`<div class="stack-lg">
    ${isKeyed ? html`<div class="card stack-sm" data-key-summary>${keySummary()}</div>` : ''}
    <button type="button" class="btn btn-secondary btn-block" data-action="import">${icon('upload')}Import results</button>
    ${importNotice ? html`<p class="notice notice-warn">${importNotice}</p>` : ''}
    <div class="seg" role="tablist">
      ${secs.map((x) => {
        const c = Object.keys(draft.marks[x]).length;
        return html`<button type="button" data-sec-tab="${x}" aria-pressed="${x === s}">${SECTIONS[x].label}${c ? ` (${c})` : ''}</button>`;
      })}
    </div>
    ${isKeyed
      ? html`<label class="check-row card"><span class="grow strong">I took ${SECTIONS[s].label}</span><span class="switch"><input type="checkbox" data-taken="${s}" ${took ? html`checked` : ''}><span></span></span></label>`
      : ''}
    ${took ? missGrid() : ''}
    <p class="error-text" data-error hidden></p>
    <div class="sticky-actions"><button class="btn btn-secondary" data-action="back">Back</button>
      <button class="btn" data-action="next">${total ? `Tag ${plural(total, 'question')}` : 'Save test'}</button></div>
  </div>`;

  function missGrid() {
    return html`<div class="card stack">
      <div class="spread"><h2>${SECTIONS[s].label} misses</h2><span class="small muted" data-grid-count>${countText(missCount, guessCount)}</span></div>
      <p class="small muted">Tap a question you missed. Long-press one you got right only by guessing.</p>
      <div class="qgrid sec-${s}" data-grid="${s}">
        ${Array.from({ length: n }, (_, i) => i + 1).map((q) => html`<button type="button" class="q${unscored.has(q) ? ' q-unscored' : ''}" data-q="${q}" data-state="${marks[q] || ''}" aria-label="${qLabel(q, marks[q], unscored.has(q))}">${q}</button>`)}
      </div>
      <div class="legend"><span><i style="background:var(--danger)"></i>Missed</span><span><i style="background:var(--warn-soft);border:1.5px solid var(--warn)"></i>Guessed right</span>${unscored.size ? html`<span><i class="legend-unscored"></i>Not scored</span>` : ''}</div>
    </div>
    <details class="card" ${p.notReached || p.guessedAtEnd || p.minutesLeft ? html`open` : ''}>
      <summary class="strong">Pacing for ${SECTIONS[s].label} <span class="small muted">(optional)</span></summary>
      <div class="mt">
        ${stepper('notReached', 'Questions not reached', 'Never got to them')}
        ${stepper('guessedAtEnd', 'Guessed at the end', 'Bubbled in to beat the clock')}
        ${stepper('minutesLeft', 'Minutes left over', 'When you finished')}
      </div>
      <p class="notice notice-warn mt" data-timing-flag ${isTimingFlag(p) ? '' : html`hidden`}>Timing flag: this section will lean toward pacing drills.</p>
    </details>`;
  }
}

function qLabel(q, state, unscored) {
  return `Question ${q}${unscored ? ', not scored' : ''}${state === 'miss' ? ', missed' : state === 'guess' ? ', guessed right' : ''}`;
}

/** Live scores for a keyed test: raw out of scored questions, the scale score, composite, and STEM. */
function keySummary() {
  const taken = takenSections();
  const r = keyResult();
  const c = composite(scoreValue('english'), scoreValue('math'), scoreValue('reading'));
  const st = stem(scoreValue('math'), scoreValue('science'));
  const editing = draft.useKey === false;
  return html`<div class="spread"><span class="small muted strong">Composite</span>${st === null ? '' : html`<span class="badge badge-science">STEM ${st}</span>`}</div>
    <div class="score-big">${c === null ? '--' : c}</div>
    ${editing
      ? html`<div class="grid-2">
          ${taken.map(
            (s) => html`<div class="field sec-${s}"><label for="sc-${s}">${SECTIONS[s].label}</label>
              <input class="input input-score" id="sc-${s}" data-score="${s}" inputmode="numeric" pattern="[0-9]*" maxlength="2" value="${draft.scores[s]}" placeholder="--" autocomplete="off"></div>`,
          )}
        </div>
        <button type="button" class="btn btn-ghost btn-sm" data-action="use-key">Use key scores</button>`
      : html`<ul class="key-lines">
          ${taken.map((s) => html`<li><span class="sec-dot sec-${s}"></span>${SECTIONS[s].label}: ${r.detail[s].raw} of ${r.detail[s].scored} scored <span aria-label="gives">→</span> <strong>${r.detail[s].scale}</strong></li>`)}
        </ul>
        ${taken.length ? html`<button type="button" class="btn btn-ghost btn-sm" data-action="edit-scores">Edit scores</button>` : html`<p class="small muted">No sections on.</p>`}`}`;
}

/** Update the keyed summary in place (keeps focus in a score box while typing). */
function refreshKeySummary(el) {
  const box = el.querySelector('[data-key-summary]');
  if (!box || !keyed()) return;
  if (draft.useKey === false) {
    // Only the totals change while typing; redrawing would drop the cursor.
    const c = composite(scoreValue('english'), scoreValue('math'), scoreValue('reading'));
    const st = stem(scoreValue('math'), scoreValue('science'));
    const big = box.querySelector('.score-big');
    if (big) big.textContent = c === null ? '--' : String(c);
    const badge = box.querySelector('.badge-science');
    if (badge) badge.textContent = st === null ? '' : `STEM ${st}`;
    return;
  }
  setHTML(box, keySummary());
}

function countText(missCount, guessCount) {
  return `${missCount} missed${guessCount ? `, ${guessCount} guessed` : ''}`;
}

/** What you answered, and the correct answer covered until tapped: a quick review while tagging. */
function reviewBox(key, hint, t, k) {
  if (!k || !k.answer) return '';
  return html`<div class="grid-2 review-box" data-review="${key}">${reviewInner(key, hint, t, k)}</div>`;
}

function reviewInner(key, hint, t, k) {
  const choices = choiceCache.get(`${draft.sourceId}:${key}`) || null;
  const said = (t.myAnswer || '').trim() || t.saidText || (hint && hint.answer) || '';
  const mine = matchChoice(choices, said);
  const right = choices ? choices.find((c) => c.letter === k.answer) : null;
  const shown = shownAnswers.has(`${draft.sourceId}:${key}`);
  return html`<div class="card card-soft card-tight"><div class="tiny muted strong">YOU ANSWERED</div>
      <div class="strong">${mine ? `${mine.letter}. ${mine.text}` : said || 'Not recorded'}</div></div>
    <button type="button" class="card card-soft card-tight review-reveal" data-reveal-answer="${key}" aria-expanded="${shown}">
      <div class="tiny muted strong">CORRECT</div>
      <div class="strong" data-answer-text>${shown ? (right ? `${right.letter}. ${right.text}` : k.answer) : 'Tap to show'}</div>
    </button>`;
}

/** Fill in the review box with the choice text from the attached booklet, once it's read. */
async function fillReview(el) {
  const box = el.querySelector('[data-review]');
  if (!box || !draft || !hasBooklet(draft.sourceId)) return;
  const key = box.dataset.review;
  const id = `${draft.sourceId}:${key}`;
  const [s, q] = key.split(':');
  const k = keyFor(draft.sourceId, s, q);
  if (!k) return;
  if (!choiceCache.has(id)) {
    try {
      choiceCache.set(id, await choicesFor(draft.sourceId, k.page, Number(q)));
    } catch (e) {
      console.error('Could not read choices', e);
      choiceCache.set(id, null);
    }
  }
  if (!box.isConnected || !draft) return;
  setHTML(box, reviewInner(key, hintFor(s, q), draft.tags[key] || {}, k));
}

/**
 * How much of a question's tagging is done, 0 to 1. The cause is what's left to pick when the topic
 * comes from the key; otherwise topic and cause are each half.
 */
function tagProgress(key) {
  const [s, q] = key.split(':');
  const t = draft.tags[key] || {};
  const k = keyed() ? keyFor(draft.sourceId, s, q) : null;
  const hasTopic = tagTopics(key).length > 0;
  if (k && k.topic && hasTopic) return t.cause ? 1 : 0;
  return ((hasTopic ? 1 : 0) + (t.cause ? 1 : 0)) / 2;
}

/** A tag's topics: the ones picked, or the key's topic until something is picked. */
function tagTopics(key) {
  const t = draft.tags[key] || {};
  if (Array.isArray(t.topics)) return t.topics;
  if (t.topic) return [t.topic]; // drafts saved before topics were a list
  const [s, q] = key.split(':');
  const k = keyed() ? keyFor(draft.sourceId, s, q) : null;
  return k && k.topic ? [k.topic] : [];
}

/** Every marked question in a scrollable row. Each chip fills with its section's color as it's tagged. */
function tagStrip(keys, current) {
  if (keys.length < 2) return '';
  return html`<div class="tag-strip" role="list" aria-label="Missed questions">
    ${keys.map((key, j) => {
      const [s, q] = key.split(':');
      const k = keyed() ? keyFor(draft.sourceId, s, q) : null;
      const uns = Boolean(k && k.unscored);
      const fill = tagProgress(key);
      const newSection = j > 0 && keys[j - 1].split(':')[0] !== s;
      const label = `${SECTIONS[s].label} question ${q}${uns ? ', not scored' : ''}${fill === 1 ? ', tagged' : ''}`;
      return html`<button type="button" role="listitem" class="ts sec-${s}${uns ? ' uns' : ''}${fill === 1 ? ' full' : ''}${newSection ? ' gap' : ''}" style="--fill:${Math.round(fill * 100)}%" data-tag-go="${j}" aria-current="${j === current}" aria-label="${label}">${q}</button>`;
    })}
  </div>`;
}

/** Update the current question's chip after a topic or cause is picked. */
function refreshChip(el) {
  const chip = el.querySelector(`[data-tag-go="${draft.tagIndex}"]`);
  if (!chip) return;
  const fill = tagProgress(markedKeys()[draft.tagIndex]);
  chip.style.setProperty('--fill', `${Math.round(fill * 100)}%`);
  chip.classList.toggle('full', fill === 1);
}

/** Scroll the strip so the current question is in view, without moving the page. */
function centerTagStrip(el) {
  const strip = el.querySelector('.tag-strip');
  const cur = strip && strip.querySelector('[aria-current="true"]');
  if (!cur) return;
  strip.scrollLeft = cur.offsetLeft - strip.clientWidth / 2 + cur.offsetWidth / 2;
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
  const k = keyed() ? keyFor(draft.sourceId, s, q) : null;
  const hint = hintFor(s, q);
  const likely = k && k.category ? (CATEGORY_TOPICS[s] || {})[k.category] || [] : [];
  const sub = [`${i + 1} of ${keys.length}`];
  if (guessed) sub.push('Guessed right, counts at half weight');
  else if (k && k.unscored) sub.push('Counts at half weight');
  return html`<div class="stack-lg" data-tag-card>
    ${tagStrip(keys, i)}
    <div class="tag-head sec-${s}">
      <div class="qnum">${q}</div>
      <div class="grow"><div class="strong">${SECTIONS[s].label}, question ${q}</div><div class="small muted">${sub.join('. ')}</div></div>
      ${k && k.unscored ? html`<div class="key-tags"><span class="badge badge-muted">Not scored</span></div>` : ''}
    </div>
    ${k ? bookletPanel(draft.sourceId, s, q, k) : ''}
    ${hint && hint.text ? html`<div class="q-hint"><p class="q-hint-text">${hint.text}</p></div>` : ''}
    ${reviewBox(key, hint, t, k)}
    <div class="field"><span class="label">Topics <span class="hint">up to ${MAX_TOPICS}${k && k.category ? `. Key category: ${CATEGORY_NAMES[k.category] || k.category}` : ''}</span></span>${topicPicker(s, tagTopics(key), store.state.settings.customTopics, likely)}</div>
    <div class="field"><span class="label">${guessed ? 'Why were you unsure?' : 'Why did you miss it?'}</span>${causePicker(t.cause)}</div>
    <details ${t.note || t.myAnswer || (t.correctAnswer && (!k || t.correctAnswer !== k.answer)) ? html`open` : ''}>
      <summary class="strong small">Add a note or answer choices</summary>
      <div class="stack mt">
        <div class="grid-2">
          <div class="field"><label>My answer</label><input class="input" name="myAnswer" maxlength="20" value="${t.myAnswer || ''}" placeholder="e.g. B"></div>
          <div class="field"><label>Correct answer</label><input class="input" name="correctAnswer" maxlength="20" value="${t.correctAnswer ?? (k ? k.answer : '')}" placeholder="e.g. D"></div>
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
    btn.setAttribute('aria-label', qLabel(q, state, btn.classList.contains('q-unscored')));
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
    if (keyed()) refreshKeySummary(el);
    if (nextBtn && stepId() === 'misses') nextBtn.textContent = total ? `Tag ${plural(total, 'question')}` : 'Save test';
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

const TO_AD = { A: 'A', B: 'B', C: 'C', D: 'D', F: 'A', G: 'B', H: 'C', J: 'D' };

/**
 * The answers saved on a miss: your letter and that choice's text, and the correct letter and its
 * text. Choice text comes from the attached booklet when there is one, otherwise your answer's text
 * is what the results page showed.
 */
async function answersFor(key, t, k) {
  const [section, q] = key.split(':');
  const typed = (t.myAnswer || '').trim();
  const said = t.saidText || (hintFor(section, q) || {}).answer || '';
  let choices = null;
  if (k && hasBooklet(draft.sourceId)) {
    const id = `${draft.sourceId}:${key}`;
    if (!choiceCache.has(id)) {
      try {
        choiceCache.set(id, await choicesFor(draft.sourceId, k.page, Number(q)));
      } catch (e) {
        console.error('Could not read choices', e);
        choiceCache.set(id, null);
      }
    }
    choices = choiceCache.get(id);
  }
  const letter = (v) => TO_AD[String(v).trim().toUpperCase()] || '';
  // Something typed in "My answer" wins over the imported answer.
  const picked = typed ? matchChoice(choices, typed) : matchChoice(choices, said);
  const myAnswer = picked ? picked.letter : typed || letter(said);
  const myAnswerText = picked ? picked.text : !typed && said && !letter(said) ? said : '';
  const correctAnswer = t.correctAnswer ?? (k ? k.answer : '');
  const right = choices ? choices.find((c) => c.letter === letter(correctAnswer)) : null;
  return { myAnswer, myAnswerText, correctAnswer, correctAnswerText: right ? right.text : '' };
}

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
    scale: keyed() ? 36 : draft.scale,
    notes: (draft.notes || '').trim(),
    // 'key' means the scores follow the built-in answer key; edited or typed scores are 'manual'.
    scoredBy: keyed() ? (draft.useKey === false ? 'manual' : 'key') : 'manual',
    createdAt: (store.state.attempts.find((a) => a.id === id) || {}).createdAt || store.nowISO(),
  };
  const pacing = Object.entries(draft.pacing)
    .filter(([s, p]) => scores[s] && p && (p.notReached || p.guessedAtEnd || p.minutesLeft))
    .map(([section, p]) => ({ section, notReached: p.notReached || 0, guessedAtEnd: p.guessedAtEnd || 0, minutesLeft: p.minutesLeft || 0 }));
  const misses = await Promise.all(markedKeys().map(async (key) => {
    const [section, q] = key.split(':');
    const t = draft.tags[key] || {};
    const k = keyed() ? keyFor(draft.sourceId, section, q) : null;
    const answers = await answersFor(key, t, k);
    return {
      id: t.missId || store.newId('miss'),
      section,
      questionNumber: Number(q),
      topics: tagTopics(key),
      topic: tagTopics(key)[0] || '',
      cause: t.cause || 'content',
      guessedRight: draft.marks[section][q] === 'guess',
      unscored: Boolean(k && k.unscored),
      note: t.note || '',
      ...answers,
      fixLine: t.fixLine || '',
      createdAt: t.createdAt || store.nowISO(),
      explanation: t.explanation || null,
    };
  }));
  for (const m of draft.extraMisses || []) misses.push(m);
  await store.saveAttempt({ attempt, pacing, misses });
  return id;
}

