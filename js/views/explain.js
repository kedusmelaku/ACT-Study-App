// Explain my miss: ask Claude why the right answer is right.
// Chat mode (default, free): copy a prompt into your own Claude chat and paste the reply back.
// API mode: the app calls /api/explain. Photos are resized on the device and never stored.
import { html, setHTML } from '../safe-html.js';
import * as store from '../store.js';
import { icon, topbar, notice, toast, reportError, openSheet, confirmSheet, copyText, chatPanel } from '../ui.js';
import { explainChatPrompt, parseJsonReply, normalizeExplain } from '../logic/claude-format.js';
import { ALL_SECTIONS, SECTIONS, CAUSES } from '../data/act.js';
import { topicsFor } from '../data/topics.js';
import { mountMissForm } from './miss-form.js';

export const live = true;

const MAX_EDGE = 1568;

// Survives live re-renders (online/offline changes) while the screen is open.
let form = null;
let result = null;
let loading = false;
let formKey = null;
// Chat mode: the copied prompt and the reply being pasted, or null when no prompt is out.
let chat = null;

function chatMode() {
  return store.state.settings.claudeMode !== 'api';
}

function initForm(query) {
  const key = query.miss || 'new';
  if (form && formKey === key) return;
  formKey = key;
  result = null;
  chat = null;
  const m = query.miss ? store.state.misses.find((x) => x.id === query.miss) : null;
  form = {
    missId: m ? m.id : null,
    section: m ? m.section : 'english',
    topic: m ? m.topic : '',
    description: m ? [m.questionNumber ? `Question ${m.questionNumber}` : '', m.note].filter(Boolean).join('. ') : '',
    myAnswer: m ? m.myAnswer : '',
    correctAnswer: m ? m.correctAnswer : '',
    myReasoning: '',
    image: null, // { mediaType, data, preview }, API mode only
    photoInChat: false, // chat mode: the photo gets attached in the Claude chat itself
  };
}

export function render(el, ctx) {
  initForm(ctx.query);
  const online = navigator.onLine !== false;
  const useChat = chatMode();
  const passcode = store.state.settings.passcode;
  const canSubmit = useChat || (online && passcode && !loading);
  const miss = form.missId ? store.state.misses.find((x) => x.id === form.missId) : null;
  const topics = topicsFor(form.section, store.state.settings.customTopics);

  setHTML(
    el,
    html`${topbar('Explain a miss', { back: miss ? `#/log/${miss.id}` : '#/more', eyebrow: miss ? `${SECTIONS[miss.section].label}, ${miss.topic || 'untagged'}` : 'Powered by Claude' })}
    <div class="stack-lg">
      ${!useChat && !online ? notice('warn', "Explain needs internet. Your miss is saved, try again when you're online.") : ''}
      ${!useChat && online && !passcode ? notice('info', html`Add your app passcode in <a href="#/settings">Settings</a> to use Explain.`) : ''}
      ${useChat && !chat && !result ? notice('info', html`Fill this in, copy the prompt into Claude, then paste the reply back. <a href="#/settings">Change mode</a>`) : ''}
      ${chat
        ? chatPanel({
            prompt: chat.prompt,
            title: 'Ask Claude',
            steps: [
              'The prompt is copied. Tap Open Claude and start a new chat.',
              form.photoInChat ? 'Paste the prompt and attach your photo of the question, then send.' : 'Paste the prompt and send it.',
              "Copy Claude's whole reply, paste it below, and tap Read reply.",
            ],
            replyLabel: "Claude's reply",
            submitLabel: 'Read reply',
            reply: chat.reply,
          })
        : ''}
      ${result ? resultCard(miss) : ''}
      <form class="stack-lg" data-explain-form novalidate>
        <div class="field"><span class="label">Section</span>
          <div class="seg">${ALL_SECTIONS.map((s) => html`<button type="button" data-section="${s}" aria-pressed="${form.section === s}">${SECTIONS[s].label}</button>`)}</div>
        </div>
        <div class="field"><label for="ex-topic">Topic (optional)</label>
          <select class="input" id="ex-topic" name="topic"><option value="">Not sure</option>
            ${[...new Set([...topics, ...(form.topic ? [form.topic] : [])])].map((t) => html`<option value="${t}" ${form.topic === t ? html`selected` : ''}>${t}</option>`)}
          </select>
        </div>
        <div class="field"><label for="ex-desc">Describe the question</label>
          <textarea class="input" id="ex-desc" name="description" maxlength="3000" placeholder="Paste or summarize the question and the answer choices. Or attach a photo below.">${form.description}</textarea>
        </div>
        ${useChat
          ? html`<label class="check-row"><span class="grow"><span class="strong">I'll attach a photo in Claude</span><br><span class="small muted">Photos from your own practice test go straight into the Claude chat, not through the app.</span></span>
              <span class="switch"><input type="checkbox" name="photoInChat" ${form.photoInChat ? html`checked` : ''}><span></span></span></label>`
          : html`<div class="field"><span class="label">Photo of the question (optional)</span>
          ${form.image
            ? html`<div class="stack-sm"><img class="preview-img" src="${form.image.preview}" alt="Question photo preview"><button type="button" class="btn btn-secondary btn-sm" data-action="remove-photo">${icon('trash')}Remove photo</button></div>`
            : html`<label class="btn btn-secondary">${icon('camera')}Add a photo<input type="file" accept="image/*" capture="environment" data-photo hidden></label>`}
          <span class="hint">From your own practice test. Never stored.</span>
        </div>`}
        <div class="grid-2">
          <div class="field"><label for="ex-my">My answer</label><input class="input" id="ex-my" name="myAnswer" maxlength="200" value="${form.myAnswer}"></div>
          <div class="field"><label for="ex-key">Correct answer</label><input class="input" id="ex-key" name="correctAnswer" maxlength="200" value="${form.correctAnswer}"></div>
        </div>
        <div class="field"><label for="ex-why">Why I picked my answer (optional)</label>
          <textarea class="input" id="ex-why" name="myReasoning" maxlength="1500" placeholder="Helps Claude name what tempted you.">${form.myReasoning}</textarea></div>
        <p class="error-text" data-error hidden></p>
        <div class="sticky-actions">
          <button class="btn" type="submit" ${canSubmit ? '' : html`disabled`}>
            ${loading ? html`<span class="spinner" aria-hidden="true"></span>Explaining` : useChat ? html`${icon('tests')}${chat ? 'Copy a new prompt' : 'Copy prompt for Claude'}` : html`${icon('explain')}Explain it`}
          </button>
        </div>
      </form>
    </div>`,
  );

  const root = el;
  root.addEventListener('input', (e) => {
    if (e.target.name === 'chatReply' && chat) chat.reply = e.target.value;
    const n = e.target.name;
    if (n && n in form) form[n] = e.target.value;
  });
  root.addEventListener('change', async (e) => {
    if (e.target.name === 'topic') form.topic = e.target.value;
    if (e.target.name === 'photoInChat') form.photoInChat = e.target.checked;
    if (e.target.hasAttribute('data-photo')) {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      try {
        form.image = await resizeImage(file);
        rerender(el, ctx);
      } catch (err) {
        reportError(err, "Couldn't read that photo. Try another one.");
      }
    }
  });
  root.addEventListener('click', async (e) => {
    const sec = e.target.closest('[data-section]');
    if (sec) {
      form.section = sec.dataset.section;
      form.topic = '';
      rerender(el, ctx);
      return;
    }
    const a = e.target.closest('[data-action]');
    if (!a) return;
    if (a.dataset.action === 'remove-photo') {
      form.image = null;
      rerender(el, ctx);
    } else if (a.dataset.action === 'copy-prompt') {
      const ok = await copyText(chat.prompt);
      toast(ok ? 'Prompt copied.' : "Couldn't copy. Open See the prompt and copy it by hand.");
    } else if (a.dataset.action === 'cancel-chat') {
      chat = null;
      rerender(el, ctx);
    } else if (a.dataset.action === 'read-reply') {
      const text = (root.querySelector('[name=chatReply]') || {}).value || '';
      if (!text.trim()) {
        toast("Paste Claude's reply first.");
        return;
      }
      const parsed = parseJsonReply(text);
      result = normalizeExplain(parsed, text);
      chat = null;
      if (!parsed) toast("Couldn't find the structured part, so the reply is saved as plain text.");
      rerender(el, ctx);
      window.scrollTo(0, 0);
    } else if (a.dataset.action === 'update-miss') {
      await updateMiss(miss, ctx);
    } else if (a.dataset.action === 'save-new') {
      await saveNew(ctx);
    }
  });
  root.addEventListener('submit', async (e) => {
    e.preventDefault();
    const err = root.querySelector('[data-error]');
    const hasPhoto = chatMode() ? form.photoInChat : !!form.image;
    if (!form.description.trim() && !hasPhoto) {
      err.textContent = 'Describe the question or attach a photo.';
      err.hidden = false;
      return;
    }
    if (chatMode()) {
      const prompt = explainChatPrompt(
        {
          section: form.section,
          topic: form.topic,
          description: form.description.trim(),
          myAnswer: form.myAnswer.trim(),
          correctAnswer: form.correctAnswer.trim(),
          myReasoning: form.myReasoning.trim(),
        },
        { photo: form.photoInChat, level: store.focus().composite },
      );
      const ok = await copyText(prompt);
      chat = { prompt, reply: '' };
      result = null;
      toast(ok ? 'Prompt copied. Paste it into Claude.' : "Couldn't copy. Open See the prompt and copy it by hand.");
      rerender(el, ctx);
      window.scrollTo(0, 0);
      return;
    }
    loading = true;
    result = null;
    rerender(el, ctx);
    try {
      result = await requestExplain();
    } catch (ex) {
      console.error(ex);
      toast(ex.userMessage || "Couldn't reach Claude. Check your connection and try again.");
    } finally {
      loading = false;
      rerender(el, ctx);
    }
  });
}

function rerender(el, ctx) {
  // The app may have re-rendered this screen while a request was in flight, so target what's mounted now.
  const mounted = document.querySelector('#main > .view') || el;
  if (!location.hash.startsWith('#/explain')) return;
  const fresh = mounted.cloneNode(false);
  mounted.replaceWith(fresh);
  render(fresh, ctx);
}

function resultCard(miss) {
  const r = result;
  return html`<section class="card stack">
    <div class="row">${icon('sparkle')}<h2 class="grow">Explanation</h2></div>
    <p class="explain-out">${r.explanation}</p>
    ${r.rule ? html`<div><div class="tiny strong muted">RULE</div><p>${r.rule}</p></div>` : ''}
    ${r.trap ? html`<div><div class="tiny strong muted">THE TRAP</div><p>${r.trap}</p></div>` : ''}
    ${r.fixLine ? html`<div class="fix-line"><b>Fix</b>${r.fixLine}</div>` : ''}
    ${r.suggestedTopic || r.suggestedCause
      ? html`<div class="row-wrap">${r.suggestedTopic ? html`<span class="badge">${r.suggestedTopic}</span>` : ''}${r.suggestedCause && CAUSES[r.suggestedCause] ? html`<span class="badge">${CAUSES[r.suggestedCause].short}</span>` : ''}</div>`
      : ''}
    <div class="fab-row">
      ${miss ? html`<button class="btn" data-action="update-miss">Update this miss</button>` : html`<button class="btn" data-action="save-new">Save to error log</button>`}
    </div>
  </section>`;
}

async function requestExplain() {
  const body = {
    section: form.section,
    topic: form.topic || undefined,
    description: form.description.trim() || undefined,
    myAnswer: form.myAnswer.trim() || undefined,
    correctAnswer: form.correctAnswer.trim() || undefined,
    myReasoning: form.myReasoning.trim() || undefined,
    image: form.image ? { mediaType: form.image.mediaType, data: form.image.data } : undefined,
    level: store.focus().composite || undefined,
  };
  return postClaude('/api/explain', body);
}

/** POST to a Claude route with the passcode. Throws errors carrying a plain-language userMessage. */
export async function postClaude(url, body, { offlineMessage = "Explain needs internet. Your miss is saved, try again when you're online." } = {}) {
  if (navigator.onLine === false) throw Object.assign(new Error('offline'), { userMessage: offlineMessage });
  let res;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-app-passcode': store.state.settings.passcode || '' },
      body: JSON.stringify(body),
    });
  } catch (e) {
    throw Object.assign(e, { userMessage: "Couldn't reach Claude. Check your connection and try again." });
  }
  if (res.status === 401) throw Object.assign(new Error('401'), { userMessage: "Passcode didn't match. Check it in Settings." });
  if (res.status === 413) throw Object.assign(new Error('413'), { userMessage: 'That photo is too large. Try a smaller one.' });
  if (!res.ok) throw Object.assign(new Error(`HTTP ${res.status}`), { userMessage: "Couldn't reach Claude. Check your connection and try again." });
  try {
    return await res.json();
  } catch (e) {
    throw Object.assign(e, { userMessage: "Couldn't reach Claude. Check your connection and try again." });
  }
}

function explanationText() {
  const r = result;
  return [r.explanation, r.rule && `Rule: ${r.rule}`, r.trap && `Trap: ${r.trap}`].filter(Boolean).join('\n\n');
}

async function updateMiss(miss, ctx) {
  if (!miss) return;
  try {
    const patch = { ...miss, explanation: explanationText() };
    if (result.fixLine && miss.fixLine !== result.fixLine) {
      const replace =
        !miss.fixLine ||
        (await confirmSheet({ title: 'Replace your fix line?', body: `Yours: ${miss.fixLine}\nClaude's: ${result.fixLine}`, confirmLabel: "Use Claude's", cancelLabel: 'Keep mine' }));
      if (replace) patch.fixLine = result.fixLine;
    }
    await store.updateMiss(patch);
    toast('Miss updated with the explanation.');
    ctx.navigate(`#/log/${miss.id}`);
  } catch (err) {
    reportError(err, "Couldn't update the miss. Try again.");
  }
}

async function saveNew(ctx) {
  const topics = topicsFor(form.section, store.state.settings.customTopics);
  const suggested = topics.find((t) => t.toLowerCase() === String(result.suggestedTopic || '').toLowerCase()) || form.topic || result.suggestedTopic || '';
  const prefill = {
    section: form.section,
    topic: suggested,
    cause: result.suggestedCause || '',
    myAnswer: form.myAnswer,
    correctAnswer: form.correctAnswer,
    note: form.description.slice(0, 300),
    fixLine: result.fixLine || '',
    sourceId: 'act-hub',
  };
  const explanation = explanationText();
  const saved = await openSheet(html`<h2>Save to error log</h2><p class="small muted">Pre-filled from Claude. Edit anything first.</p><div data-sheet-form></div>`, (root, close) => {
    mountMissForm(root.querySelector('[data-sheet-form]'), {
      miss: prefill,
      submitLabel: 'Save miss',
      onSubmit: async (values) => {
        const m = await store.addMiss({ ...values, sourceId: values.sourceId === 'other' ? null : values.sourceId, explanation });
        close(m.id);
      },
    });
  });
  if (saved) {
    toast('Saved to your error log. A redo is due in 3 days.');
    form = null;
    formKey = null;
    result = null;
    chat = null;
    ctx.navigate(`#/log/${saved}`);
  }
}

/** Resize to a longest edge of 1568px and encode as JPEG. */
async function resizeImage(file) {
  const bitmap = await loadBitmap(file);
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const g = canvas.getContext('2d');
  g.fillStyle = '#fff';
  g.fillRect(0, 0, w, h);
  g.drawImage(bitmap, 0, 0, w, h);
  if (bitmap.close) bitmap.close();
  let quality = 0.85;
  let url = canvas.toDataURL('image/jpeg', quality);
  // Keep the upload comfortably under the 2 MB request limit.
  while (url.length > 1.6 * 1024 * 1024 && quality > 0.4) {
    quality -= 0.15;
    url = canvas.toDataURL('image/jpeg', quality);
  }
  return { mediaType: 'image/jpeg', data: url.slice(url.indexOf(',') + 1), preview: url };
}

async function loadBitmap(file) {
  if (window.createImageBitmap) {
    try {
      return await createImageBitmap(file, { imageOrientation: 'from-image' });
    } catch {
      /* fall back to an <img> below */
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.decoding = 'async';
    img.src = url;
    await img.decode();
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}
