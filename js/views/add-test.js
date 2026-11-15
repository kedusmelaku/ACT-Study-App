// Add or edit a test the app doesn't list, like a newer official practice test.
import { html, safeUrl } from '../safe-html.js';
import * as store from '../store.js';
import { openSheet, reportError } from '../ui.js';

const TYPES = [
  { format: 'enhanced', label: 'Full practice test', note: "Today's format" },
  { format: 'legacy', label: 'Older practice test', note: 'Before 2025' },
  { format: 'other', label: 'Something else', note: 'Quiz, book, other' },
];

/**
 * Open the sheet. With `existing` (a customMaterials entry) it edits; otherwise it adds.
 * Resolves to the saved entry, or null if cancelled.
 */
export async function addTestSheet(existing = null) {
  const st = { format: existing ? existing.format || 'other' : 'enhanced' };
  const values = await openSheet(
    html`<h2>${existing ? 'Edit test' : 'Add a test'}</h2>
      <form class="stack" data-add-test>
        <div class="field"><label for="at-name">Name</label>
          <input class="input" id="at-name" name="title" maxlength="80" required value="${existing ? existing.title : ''}" placeholder="e.g. Official Practice Test 3"></div>
        <div class="field"><span class="label">Type</span>
          <div class="chips">${TYPES.map(
            (t) => html`<button type="button" class="chip chip-lg" data-format="${t.format}" aria-pressed="${st.format === t.format}"><span>${t.label}</span><small>${t.note}</small></button>`,
          )}</div>
        </div>
        <div class="field"><label for="at-url">Link (optional)</label>
          <input class="input" id="at-url" name="url" type="url" maxlength="500" value="${existing ? existing.url || '' : ''}" placeholder="https://"></div>
        <p class="error-text" data-error hidden></p>
        <div class="sheet-actions"><button type="button" class="btn btn-secondary" data-close="">Cancel</button><button class="btn" type="submit">${existing ? 'Save' : 'Add test'}</button></div>
      </form>`,
    (root, close) => {
      const form = root.querySelector('[data-add-test]');
      setTimeout(() => form.elements.title.focus(), 50);
      root.addEventListener('click', (e) => {
        const f = e.target.closest('[data-format]');
        if (!f) return;
        st.format = f.dataset.format;
        root.querySelectorAll('[data-format]').forEach((b) => b.setAttribute('aria-pressed', String(b === f)));
      });
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const title = form.elements.title.value.trim();
        const rawUrl = form.elements.url.value.trim();
        const err = form.querySelector('[data-error]');
        if (!title) {
          err.textContent = 'Give it a name.';
          err.hidden = false;
          return;
        }
        if (rawUrl && !safeUrl(rawUrl)) {
          err.textContent = 'That link should start with https://';
          err.hidden = false;
          return;
        }
        close({ title, url: rawUrl ? safeUrl(rawUrl) : '', format: st.format === 'other' ? null : st.format });
      });
    },
  );
  if (!values) return null;
  const entry = existing ? { ...existing, ...values } : { sourceId: store.newId('custom'), ...values };
  delete entry.fullLength;
  delete entry.hold;
  const list = (store.state.settings.customMaterials || []).filter((c) => c.sourceId !== entry.sourceId);
  try {
    await store.saveSettings({ customMaterials: [...list, entry] }, { regen: true });
    return entry;
  } catch (e) {
    reportError(e, "Couldn't save that test. Try again.");
    return null;
  }
}

/** Remove an added test (Settings only offers this for tests with no logged attempts). */
export async function removeTest(sourceId) {
  const list = (store.state.settings.customMaterials || []).filter((c) => c.sourceId !== sourceId);
  await store.saveSettings({ customMaterials: list }, { regen: true });
}
