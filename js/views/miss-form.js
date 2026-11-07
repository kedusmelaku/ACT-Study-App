// Quick-add and edit form for a single miss.
import { html, setHTML } from '../safe-html.js';
import * as store from '../store.js';
import { icon, topbar, reportError, undoToast, toast, openSheet } from '../ui.js';
import { ALL_SECTIONS, SECTIONS, CAUSES, CAUSE_KEYS } from '../data/act.js';
import { topicsFor } from '../data/topics.js';
import { isISODate } from '../logic/dates.js';

export const live = false;

const CAUSE_HELP = {
  content: "Didn't know the rule or skill",
  careless: 'Knew it, slipped',
  time: 'Rushed, or never reached it',
  trap: 'Picked a plausible but unsupported answer',
};

export function topicPicker(section, selected, customTopics) {
  const topics = topicsFor(section, customTopics);
  const all = selected && !topics.includes(selected) ? [...topics, selected] : topics;
  return html`<div class="chips" role="group" aria-label="Topic">
    ${all.map((t) => html`<button type="button" class="chip" data-topic="${t}" aria-pressed="${t === selected}">${t}</button>`)}
    <button type="button" class="chip" data-topic-new>${icon('plus')}New topic</button>
  </div>`;
}

export function causePicker(selected) {
  return html`<div class="cause-grid" role="group" aria-label="Cause">
    ${CAUSE_KEYS.map(
      (c) => html`<button type="button" class="chip chip-lg" data-cause="${c}" aria-pressed="${c === selected}"><span>${CAUSES[c].label}</span><small>${CAUSE_HELP[c]}</small></button>`,
    )}
  </div>`;
}

/** Ask for a custom topic name and save it for the section. Returns the name or null. */
export async function promptNewTopic(section) {
  const name = await openSheet(
    html`<h2>New ${SECTIONS[section].label} topic</h2>
      <form class="stack" data-topic-form>
        <input class="input" name="topic" maxlength="60" placeholder="e.g. Logarithm rules" autocomplete="off" required>
        <div class="sheet-actions"><button type="button" class="btn btn-secondary" data-close="">Cancel</button><button class="btn" type="submit">Add topic</button></div>
      </form>`,
    (root, close) => {
      const form = root.querySelector('[data-topic-form]');
      setTimeout(() => form.elements.topic.focus(), 50);
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        close(form.elements.topic.value.trim().slice(0, 60));
      });
    },
  );
  if (!name) return null;
  const custom = { ...(store.state.settings.customTopics || {}) };
  const list = custom[section] || [];
  if (!list.some((t) => t.toLowerCase() === name.toLowerCase())) {
    custom[section] = [...list, name];
    await store.saveSettings({ customTopics: custom });
  }
  return name;
}

/**
 * Render the full miss form into `root` and wire it up.
 * opts: { miss (initial values), onSubmit(values), submitLabel, extraActions }
 */
export function mountMissForm(root, { miss, onSubmit, submitLabel = 'Save miss', showSource = true }) {
  const state = {
    section: miss.section || 'english',
    topic: miss.topic || '',
    cause: miss.cause || '',
    guessedRight: !!miss.guessedRight,
  };
  const mats = store.materials().filter((m) => m.available && m.kind !== 'book');
  // An existing miss with no source shows "Other"; a new one defaults to QuizMe.
  const initialSource = miss.id ? miss.sourceId || 'other' : miss.sourceId || 'act-hub';

  const draw = () => {
    const values = readText(root);
    setHTML(
      root,
      html`<form class="stack-lg" novalidate>
        <div class="field"><span class="label">Section</span>
          <div class="seg" role="group" aria-label="Section">
            ${ALL_SECTIONS.map((s) => html`<button type="button" data-section="${s}" aria-pressed="${state.section === s}">${SECTIONS[s].label}</button>`)}
          </div>
        </div>
        ${showSource
          ? html`<div class="grid-2">
              <div class="field"><label for="mf-source">Source</label>
                <select class="input" id="mf-source" name="sourceId">
                  ${mats.map((m) => html`<option value="${m.sourceId}" ${(values.sourceId ?? initialSource) === m.sourceId ? html`selected` : ''}>${m.short || m.title}</option>`)}
                  <option value="other" ${(values.sourceId ?? initialSource) === 'other' ? html`selected` : ''}>Other</option>
                </select>
              </div>
              <div class="field"><label for="mf-q">Question #</label>
                <input class="input" id="mf-q" name="questionNumber" inputmode="numeric" pattern="[0-9]*" value="${values.questionNumber ?? miss.questionNumber ?? ''}" placeholder="Optional">
              </div>
            </div>`
          : ''}
        <div class="field"><span class="label">Topic</span>${topicPicker(state.section, state.topic, store.state.settings.customTopics)}</div>
        <div class="field"><span class="label">Cause</span>${causePicker(state.cause)}</div>
        <label class="check-row"><span class="switch"><input type="checkbox" name="guessedRight" ${state.guessedRight ? html`checked` : ''}><span></span></span>
          <span class="grow"><span class="strong">Guessed right</span><br><span class="small muted">I got it right only by guessing. Counts at half weight.</span></span></label>
        <div class="grid-2">
          <div class="field"><label for="mf-my">My answer</label><input class="input" id="mf-my" name="myAnswer" maxlength="20" value="${values.myAnswer ?? miss.myAnswer ?? ''}" placeholder="e.g. B"></div>
          <div class="field"><label for="mf-key">Correct answer</label><input class="input" id="mf-key" name="correctAnswer" maxlength="20" value="${values.correctAnswer ?? miss.correctAnswer ?? ''}" placeholder="e.g. D"></div>
        </div>
        <div class="field"><label for="mf-note">Note</label><input class="input" id="mf-note" name="note" maxlength="300" value="${values.note ?? miss.note ?? ''}" placeholder="What happened, in one line"></div>
        <div class="field"><label for="mf-fix">Fix line</label><input class="input" id="mf-fix" name="fixLine" maxlength="200" value="${values.fixLine ?? miss.fixLine ?? ''}" placeholder="The rule you'll use next time"></div>
        <div class="field"><label for="mf-date">Date</label><input class="input" id="mf-date" name="date" type="date" value="${values.date ?? miss.date ?? store.today()}"></div>
        <p class="error-text" data-error hidden></p>
        <div class="sticky-actions"><button class="btn" type="submit">${submitLabel}</button></div>
      </form>`,
    );
  };

  root.addEventListener('click', async (e) => {
    const sec = e.target.closest('[data-section]');
    if (sec) {
      if (state.section !== sec.dataset.section) {
        state.section = sec.dataset.section;
        state.topic = '';
        draw();
      }
      return;
    }
    const t = e.target.closest('[data-topic]');
    if (t) {
      state.topic = t.dataset.topic;
      root.querySelectorAll('[data-topic]').forEach((b) => b.setAttribute('aria-pressed', String(b === t)));
      return;
    }
    if (e.target.closest('[data-topic-new]')) {
      try {
        const name = await promptNewTopic(state.section);
        if (name) {
          state.topic = name;
          draw();
        }
      } catch (err) {
        reportError(err, "Couldn't add that topic. Try again.");
      }
      return;
    }
    const c = e.target.closest('[data-cause]');
    if (c) {
      state.cause = c.dataset.cause;
      root.querySelectorAll('[data-cause]').forEach((b) => b.setAttribute('aria-pressed', String(b === c)));
    }
  });
  root.addEventListener('change', (e) => {
    if (e.target.name === 'guessedRight') state.guessedRight = e.target.checked;
  });
  root.addEventListener('submit', async (e) => {
    e.preventDefault();
    const v = readText(root);
    const err = root.querySelector('[data-error]');
    const problems = [];
    if (!state.topic) problems.push('Pick a topic.');
    if (!state.cause) problems.push('Pick a cause.');
    if (v.date && !isISODate(v.date)) problems.push('Check the date.');
    if (v.questionNumber && !/^\d{1,3}$/.test(v.questionNumber)) problems.push('Question number should be a number.');
    if (problems.length) {
      err.textContent = problems.join(' ');
      err.hidden = false;
      return;
    }
    err.hidden = true;
    const btn = root.querySelector('[type=submit]');
    btn.disabled = true;
    try {
      await onSubmit({
        section: state.section,
        topic: state.topic,
        cause: state.cause,
        guessedRight: state.guessedRight,
        sourceId: v.sourceId ?? miss.sourceId ?? null,
        questionNumber: v.questionNumber ? Number(v.questionNumber) : null,
        myAnswer: (v.myAnswer || '').trim(),
        correctAnswer: (v.correctAnswer || '').trim(),
        note: (v.note || '').trim(),
        fixLine: (v.fixLine || '').trim(),
        date: v.date || store.today(),
      });
    } catch (ex) {
      btn.disabled = false;
      reportError(ex, "Couldn't save the miss. Try again.");
    }
  });
  draw();
}

function readText(root) {
  const form = root.querySelector('form');
  if (!form) return {};
  const out = {};
  for (const name of ['sourceId', 'questionNumber', 'myAnswer', 'correctAnswer', 'note', 'fixLine', 'date']) {
    const f = form.elements.namedItem(name);
    if (f) out[name] = f.value;
  }
  return out;
}

export function render(el, ctx) {
  const id = ctx.params.id;
  const existing = id ? store.state.misses.find((m) => m.id === id) : null;
  if (id && !existing) {
    setHTML(el, html`${topbar('Miss', { back: '#/log' })}<div class="empty"><h3>That miss isn't here</h3><p>It may have been deleted.</p><a class="btn" href="#/log">Back to the log</a></div>`);
    return;
  }
  const prefill = existing || {
    section: SECTIONS[ctx.query.section] ? ctx.query.section : 'english',
    sourceId: ctx.query.source || 'act-hub',
  };
  setHTML(
    el,
    html`${topbar(existing ? 'Edit miss' : 'Add a miss', {
        back: '#/log',
        eyebrow: existing ? 'Error log' : 'Drills, QuizMe, anything',
        actions: existing ? html`<a class="btn btn-sm btn-secondary" href="#/explain?miss=${existing.id}">${icon('explain')}Explain</a>` : '',
      })}
      ${existing && existing.explanation ? html`<details class="card card-soft mt"><summary class="strong">Claude's explanation</summary><p class="small explain-out mt">${existing.explanation}</p></details>` : ''}
      <div data-form class="mt"></div>
      ${existing ? html`<button class="btn btn-danger btn-block mt" data-action="delete">${icon('trash')}Delete miss</button>` : ''}`,
  );
  mountMissForm(el.querySelector('[data-form]'), {
    miss: prefill,
    submitLabel: existing ? 'Save changes' : 'Add to log',
    onSubmit: async (values) => {
      if (existing) {
        await store.updateMiss({ ...existing, ...values, sourceId: values.sourceId === 'other' ? null : values.sourceId });
        toast('Saved.');
      } else {
        await store.addMiss({ ...values, sourceId: values.sourceId === 'other' ? null : values.sourceId });
        toast('Added. A redo is due in 3 days.');
      }
      ctx.navigate('#/log');
    },
  });
  el.addEventListener('click', async (e) => {
    if (!e.target.closest('[data-action=delete]')) return;
    try {
      const undo = await store.deleteMiss(existing.id);
      ctx.navigate('#/log');
      undoToast('Miss deleted.', undo);
    } catch (err) {
      reportError(err, "Couldn't delete that miss. Try again.");
    }
  });
}
