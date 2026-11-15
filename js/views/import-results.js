// "Import results" sheet: take the online results PDF or pasted results text and hand back its text.
// The text holds official question wording, so it is only kept in memory and never saved.
import { html } from '../safe-html.js';
import { openSheet } from '../ui.js';

const PDFJS = new URL('../../vendor/pdfjs/pdf.min.js', import.meta.url).href;
const PDFJS_WORKER = new URL('../../vendor/pdfjs/pdf.worker.min.js', import.meta.url).href;
const STATUS_ONLY = /^[^A-Za-z0-9]*(correct|incorrect|unanswered|not answered|no answer|omitted|skipped|blank)[^A-Za-z0-9]*$/i;

/** Text of a PDF, one line per row of text, read on the device with the bundled pdf.js. */
export async function pdfToText(file) {
  const pdfjs = await import(PDFJS);
  pdfjs.GlobalWorkerOptions.workerSrc = PDFJS_WORKER;
  const doc = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()), isEvalSupported: false }).promise;
  const out = [];
  try {
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();
      const rows = [];
      for (const it of content.items) {
        if (typeof it.str !== 'string' || !it.str.trim()) continue;
        const x = it.transform[4];
        const y = it.transform[5];
        let row = rows.find((r) => Math.abs(r.y - y) < 3);
        if (!row) rows.push((row = { y, items: [] }));
        row.items.push({ x, s: it.str });
      }
      rows.sort((a, b) => b.y - a.y);
      for (const r of rows) {
        r.items.sort((a, b) => a.x - b.x);
        // A status that shares a row with other text still goes on its own line.
        const status = r.items.filter((it) => STATUS_ONLY.test(it.s));
        const rest = r.items.filter((it) => !STATUS_ONLY.test(it.s));
        if (rest.length) out.push(rest.map((it) => it.s).join(' '));
        for (const it of status) out.push(it.s);
      }
      page.cleanup();
    }
  } finally {
    await doc.destroy();
  }
  return out.join('\n');
}

/** Open the sheet. Resolves to the results text, or null if cancelled. */
export function importResultsSheet() {
  return openSheet(
    html`<h2>Import results</h2>
      <form class="stack" data-import-form>
        <label class="btn btn-secondary btn-block file-btn">Choose results PDF<input type="file" name="file" accept="application/pdf,.pdf,text/plain,.txt"></label>
        <div class="field"><label for="ir-text">Or paste the results page</label>
          <textarea class="input" id="ir-text" name="text" rows="5" autocomplete="off"></textarea></div>
        <p class="small muted" data-status hidden>Reading the file</p>
        <p class="error-text" data-error hidden></p>
        <div class="sheet-actions"><button type="button" class="btn btn-secondary" data-close="">Cancel</button><button class="btn" type="submit">Import</button></div>
      </form>`,
    (root, close) => {
      const form = root.querySelector('[data-import-form]');
      const err = root.querySelector('[data-error]');
      const status = root.querySelector('[data-status]');
      const fail = (msg) => {
        status.hidden = true;
        err.textContent = msg;
        err.hidden = false;
      };
      form.elements.file.addEventListener('change', async () => {
        const file = form.elements.file.files[0];
        if (!file) return;
        err.hidden = true;
        status.hidden = false;
        try {
          const isPdf = file.type === 'application/pdf' || /\.pdf$/i.test(file.name);
          const text = isPdf ? await pdfToText(file) : await file.text();
          if (!text.trim()) return fail("That file has no text to read. Try pasting the results page instead.");
          close(text);
        } catch (e) {
          console.error(e);
          fail("Couldn't read that file. Try another one, or paste the results page.");
        } finally {
          form.elements.file.value = '';
        }
      });
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const text = form.elements.text.value;
        if (!text.trim()) return fail('Choose the PDF or paste the results first.');
        close(text);
      });
    },
  );
}
