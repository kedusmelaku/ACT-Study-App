// Settings: test dates, study time, full-test days, busy days, materials, topics, Claude passcode, backup.
import { html, setHTML, safeUrl } from '../safe-html.js';
import * as store from '../store.js';
import { icon, topbar, toast, reportError, openSheet, fmtMinutes, notice, plural } from '../ui.js';
import { DAY_NAMES } from '../data/calendar.js';
import { SECTIONS, ALL_SECTIONS } from '../data/act.js';
import { SEED_MATERIALS } from '../data/materials.js';
import { formatDate, isISODate, compareDates, dateOf } from '../logic/dates.js';
import { validateImport } from '../db.js';
import { syncNow, enableSync, disableSync } from '../sync.js';

export const live = true;

const STEP = 15;
const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

export function render(el) {
  const s = store.state.settings;
  const mats = store.materials();
  const fullLength = mats.filter((m) => m.fullLength && m.available);
  const testDates = (s.testDates || []).slice().sort((a, b) => compareDates(a.date, b.date));
  const fullTests = (s.fullTests || []).slice().sort((a, b) => compareDates(a.date, b.date));
  const busy = Object.entries(s.busyDates || {}).sort(([a], [b]) => compareDates(a, b));
  const high = Object.entries(s.highAvailability || {}).sort(([a], [b]) => compareDates(a, b));
  const usedBySource = {};
  for (const u of store.state.materialUse) {
    usedBySource[u.sourceId] = usedBySource[u.sourceId] || new Set();
    usedBySource[u.sourceId].add(u.section);
  }
  for (const a of store.state.attempts) {
    if (!a.sourceId) continue;
    usedBySource[a.sourceId] = usedBySource[a.sourceId] || new Set();
    for (const x of ALL_SECTIONS) if (a.scores[x]) usedBySource[a.sourceId].add(x);
  }
  const weekly = DAY_ORDER.reduce((sum, d) => sum + (Number(s.availability[d]) || 0), 0);
  const customCount = ALL_SECTIONS.reduce((n, x) => n + ((s.customTopics || {})[x] || []).length, 0);

  setHTML(
    el,
    html`${topbar('Settings', { back: '#/more' })}
    <div class="stack-lg">

      <section class="stack" id="dates">
        <div class="section-title"><h2>Test dates</h2></div>
        <div class="list">
          ${testDates.map(
            (t) => html`<div class="list-item"><span class="list-icon sec-none">${icon('flag')}</span>
              <div class="grow"><div class="strong">${t.label || 'ACT'}</div><div class="small muted">${formatDate(t.date, { year: true })}</div></div>
              <button class="icon-btn" data-action="remove-test" data-date="${t.date}" aria-label="Remove test date">${icon('trash')}</button></div>`,
          )}
          <button class="list-item" data-action="add-test"><span class="list-icon">${icon('plus')}</span><div class="grow strong">Add a test date</div></button>
        </div>
        <p class="hint">The plan aims at the next date. After a test, it switches to the next one automatically.</p>
      </section>

      <section class="stack" id="time">
        <div class="section-title"><h2>Study time</h2><span class="small muted">${fmtMinutes(weekly)} a week</span></div>
        <div class="card card-tight">
          ${DAY_ORDER.map(
            (d) => html`<div class="day-row"><span class="strong">${DAY_NAMES[d]}</span>
              <div class="stepper"><button type="button" data-avail="${d}:-1" aria-label="Less time on ${DAY_NAMES[d]}">-</button>
              <output>${Number(s.availability[d]) ? fmtMinutes(Number(s.availability[d])) : 'Off'}</output>
              <button type="button" data-avail="${d}:1" aria-label="More time on ${DAY_NAMES[d]}">+</button></div></div>`,
          )}
        </div>
        <p class="hint">A day with 90 minutes or more becomes a block with a timed section. Homework comes first: use Heavy night on Today, or mark busy days below.</p>
      </section>

      <section class="stack">
        <div class="section-title"><h2>Busy days</h2></div>
        <div class="list">
          ${busy.map(
            ([d, m]) => html`<div class="list-item"><span class="list-icon">${icon('alert')}</span>
              <div class="grow"><div class="strong">${formatDate(d, { year: true })}</div><div class="small muted">${Number(m) ? `${fmtMinutes(Number(m))} only` : 'No study'}</div></div>
              <button class="icon-btn" data-action="remove-busy" data-date="${d}" aria-label="Remove busy day">${icon('trash')}</button></div>`,
          )}
          <button class="list-item" data-action="add-busy"><span class="list-icon">${icon('plus')}</span><div class="grow"><div class="strong">Mark a busy day</div><div class="small muted">For example, an APUSH test day</div></div></button>
        </div>
      </section>

      <section class="stack">
        <div class="section-title"><h2>Extra-time days</h2></div>
        <div class="list">
          ${high.map(
            ([d, m]) => html`<div class="list-item"><span class="list-icon">${icon('clock')}</span>
              <div class="grow"><div class="strong">${formatDate(d, { year: true })}</div><div class="small muted">Up to ${fmtMinutes(Number(m))}</div></div>
              <button class="icon-btn" data-action="remove-high" data-date="${d}" aria-label="Remove extra-time day">${icon('trash')}</button></div>`,
          )}
          <button class="list-item" data-action="add-high"><span class="list-icon">${icon('plus')}</span><div class="grow"><div class="strong">Add an extra-time day</div><div class="small muted">Breaks and days off school</div></div></button>
        </div>
      </section>

      <section class="stack">
        <div class="section-title"><h2>Full-test days</h2></div>
        <div class="list">
          ${fullTests.map((f) => {
            const m = mats.find((x) => x.sourceId === f.sourceId);
            return html`<div class="list-item"><span class="list-icon">${icon('tests')}</span>
              <div class="grow"><div class="strong">${formatDate(f.date, { year: true })}</div><div class="small muted">${m ? m.title : 'Next unused full test'}</div></div>
              <button class="icon-btn" data-action="remove-full" data-date="${f.date}" aria-label="Remove full-test day">${icon('trash')}</button></div>`;
          })}
          <button class="list-item" data-action="add-full"><span class="list-icon">${icon('plus')}</span><div class="grow strong">Add a full-test day</div></button>
        </div>
        <p class="hint">Full tests are fixed. The official enhanced tests are saved for these days and never used for drills.</p>
      </section>

      <section class="stack" id="materials">
        <div class="section-title"><h2>Materials</h2></div>
        <div class="card stack">
          <h3>Legacy practice tests</h3>
          <p class="small muted">Free pre-2025 tests. Add a name or link and the planner will assign their sections at enhanced pacing.</p>
          ${['legacy-1', 'legacy-2', 'legacy-3'].map((id, i) => {
            const e = (s.legacyTests || {})[id] || {};
            return html`<div class="stack-sm">
              <span class="label">Legacy test ${i + 1}${usedBySource[id] ? html` <span class="badge">${plural(usedBySource[id].size, 'section')} used</span>` : ''}</span>
              <div class="stack-sm">
                <input class="input" data-legacy="${id}" data-field="name" maxlength="60" value="${e.name || ''}" placeholder="Name, e.g. 2021-22 form">
                <input class="input" data-legacy="${id}" data-field="url" type="url" maxlength="500" value="${e.url || ''}" placeholder="Link (optional)">
              </div></div>`;
          })}
        </div>
        <div class="card stack">
          <label class="check-row"><span class="grow"><span class="strong">I own the Official ACT Prep Guide</span><br><span class="small muted">Enhanced edition only</span></span>
            <span class="switch"><input type="checkbox" data-guide-owned ${s.prepGuide.owned ? html`checked` : ''}><span></span></span></label>
          ${s.prepGuide.owned
            ? html`<div class="day-row"><span class="small strong">Practice tests in your copy</span>
                <div class="stepper"><button type="button" data-guide-count="-1" aria-label="Fewer">-</button><output>${s.prepGuide.tests}</output><button type="button" data-guide-count="1" aria-label="More">+</button></div></div>`
            : ''}
        </div>
        <div class="list">
          ${SEED_MATERIALS.filter((m) => !m.needsSetup && m.sourceId !== 'prep-guide').map((m) => {
            const url = safeUrl(m.url);
            const used = usedBySource[m.sourceId];
            return html`<div class="list-item"><span class="list-icon">${icon('book')}</span>
              <div class="grow"><div class="strong">${m.title}</div><div class="small muted">${m.notes}</div>
              ${used ? html`<span class="badge mt" style="margin-top:6px">${plural(used.size, 'section')} used</span>` : ''}</div>
              ${url ? html`<a class="icon-btn" href="${url}" target="_blank" rel="noopener" aria-label="Open ${m.title}">${icon('link')}</a>` : ''}</div>`;
          })}
        </div>
        ${fullLength.length ? '' : notice('info', 'Add a legacy test so drills can use real ACT passages.')}
      </section>

      <section class="stack">
        <div class="section-title"><h2>Custom topics</h2><span class="small muted">${customCount}</span></div>
        ${customCount
          ? html`<div class="card stack">${ALL_SECTIONS.filter((x) => ((s.customTopics || {})[x] || []).length).map(
              (x) => html`<div class="stack-sm"><span class="label">${SECTIONS[x].label}</span><div class="row-wrap">
                ${(s.customTopics[x] || []).map((t) => html`<button class="chip" data-remove-topic="${x}" data-topic-name="${t}" aria-label="Remove ${t}">${t} ${icon('x')}</button>`)}
              </div></div>`,
            )}</div>`
          : html`<p class="small muted">Add your own topics from the topic picker when you log a miss.</p>`}
      </section>

      <section class="stack" id="sync">
        <div class="section-title"><h2>Sync across devices</h2>${s.sync && s.sync.enabled ? html`<span class="badge badge-success">On</span>` : ''}</div>
        ${syncCard(s)}
      </section>

      <section class="stack" id="claude">
        <div class="section-title"><h2>Claude</h2></div>
        <div class="card stack">
          <div class="field"><span class="label">How Explain and Coach reach Claude</span>
            <div class="seg" role="group" aria-label="Claude mode">
              <button type="button" data-claude-mode="chat" aria-pressed="${s.claudeMode !== 'api'}">My Claude chat</button>
              <button type="button" data-claude-mode="api" aria-pressed="${s.claudeMode === 'api'}">Built-in (API)</button>
            </div>
          </div>
          ${s.claudeMode === 'api'
            ? html`<p class="small muted">The app calls Claude for you through your Vercel deployment. Uses paid API credits from the Anthropic Console.</p>`
            : html`<p class="small muted">Free with your Claude plan. The app copies a ready-made prompt, you paste it into Claude, then paste the reply back. Nothing is sent from the app.</p>`}
        </div>
        ${s.claudeMode === 'api'
          ? html`<form class="card stack" data-passcode-form>
              <div class="field"><label for="passcode">App passcode</label>
                <input class="input" id="passcode" name="passcode" type="password" autocomplete="current-password" maxlength="200" value="${s.passcode || ''}" placeholder="The APP_PASSCODE you set in Vercel"></div>
              <p class="hint">Stored only on this device and sent with Explain and Coach requests.</p>
              <button class="btn btn-secondary" type="submit">Save passcode</button>
            </form>`
          : ''}
      </section>

      <section class="stack" id="backup">
        <div class="section-title"><h2>Backup</h2><span class="small muted">${s.lastBackup ? `Last: ${formatDate(dateOf(s.lastBackup))}` : 'Never backed up'}</span></div>
        <div class="card stack">
          <p class="small muted">Your data lives only on this device. Export a backup file now and then, and import it to restore or move to a new phone.</p>
          <div class="fab-row">
            <button class="btn" data-action="export">${icon('download')}Export</button>
            <label class="btn btn-secondary">${icon('upload')}Import<input type="file" accept="application/json,.json" data-import hidden></label>
          </div>
        </div>
      </section>

      <section class="card card-soft stack-sm">
        <h3>Install on Android</h3>
        <p class="small muted">In Chrome, open the menu and tap Add to Home screen. The app then opens full screen and works offline, except for Claude features.</p>
      </section>
    </div>`,
  );

  bind(el);
}

function ago(iso) {
  if (!iso) return 'never';
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  return formatDate(dateOf(iso));
}

function syncCard(s) {
  const sync = s.sync || {};
  if (!sync.enabled) {
    return html`<form class="card stack" data-sync-form>
      <p class="small muted">Keep your phone and laptop in step: tests, the error log, redos, the plan, and settings. Needs the sync database set up in Vercel (see the README).</p>
      <div class="field"><label for="sync-pass">App passcode</label>
        <input class="input" id="sync-pass" name="passcode" type="password" autocomplete="current-password" maxlength="200" value="${s.passcode || ''}" placeholder="The APP_PASSCODE you set in Vercel"></div>
      <p class="hint">Use the same passcode on every device.</p>
      <button class="btn" type="submit">Turn on sync</button>
    </form>`;
  }
  return html`<div class="card stack">
    <div class="spread"><div><div class="strong">${sync.lastError ? 'Not synced' : 'Synced'}</div><div class="small muted">Last sync ${ago(sync.lastSyncAt)}</div></div>
      <button class="btn btn-sm btn-secondary" data-action="sync-now">Sync now</button></div>
    ${sync.lastError ? notice('warn', sync.lastError) : ''}
    <p class="hint">Syncs when the app opens, a few seconds after changes, and every few minutes while open. Works offline and catches up later.</p>
    <button class="btn btn-ghost btn-sm" data-action="sync-off">Turn off sync on this device</button>
  </div>`;
}

async function save(patch, regen = true, message = '') {
  try {
    await store.saveSettings(patch, { regen });
    if (message) toast(message);
  } catch (err) {
    reportError(err, "Couldn't save that setting. Try again.");
  }
}

function dateSheet({ title, withMinutes = false, minutesLabel = 'Minutes', defaultMinutes = 0, withLabel = false, withSource = false }) {
  const mats = store.materials().filter((m) => m.fullLength && m.available);
  return openSheet(
    html`<h2>${title}</h2>
      <form class="stack" data-sheet-form>
        <div class="field"><label>Date</label><input class="input" type="date" name="date" required></div>
        ${withLabel ? html`<div class="field"><label>Label</label><input class="input" name="label" maxlength="40" placeholder="e.g. April school-day ACT"></div>` : ''}
        ${withMinutes ? html`<div class="field"><label>${minutesLabel}</label><input class="input" type="number" name="minutes" min="0" max="480" step="15" value="${defaultMinutes}"></div>` : ''}
        ${withSource
          ? html`<div class="field"><label>Test</label><select class="input" name="sourceId">${mats.map((m) => html`<option value="${m.sourceId}">${m.title}</option>`)}</select></div>`
          : ''}
        <p class="error-text" data-error hidden></p>
        <div class="sheet-actions"><button type="button" class="btn btn-secondary" data-close="">Cancel</button><button class="btn" type="submit">Save</button></div>
      </form>`,
    (root, close) => {
      const form = root.querySelector('[data-sheet-form]');
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const date = form.elements.date.value;
        if (!isISODate(date)) {
          const err = form.querySelector('[data-error]');
          err.textContent = 'Pick a date.';
          err.hidden = false;
          return;
        }
        close({
          date,
          label: withLabel ? form.elements.label.value.trim() : undefined,
          minutes: withMinutes ? Math.max(0, Math.min(480, Number(form.elements.minutes.value) || 0)) : undefined,
          sourceId: withSource ? form.elements.sourceId.value : undefined,
        });
      });
    },
  );
}

function bind(el) {
  el.addEventListener('click', async (e) => {
    const s = store.state.settings;
    const avail = e.target.closest('[data-avail]');
    if (avail) {
      const [d, dir] = avail.dataset.avail.split(':').map(Number);
      const cur = Number(s.availability[d]) || 0;
      const next = Math.max(0, Math.min(300, cur + dir * STEP));
      return save({ availability: { ...s.availability, [d]: next } });
    }
    const cm = e.target.closest('[data-claude-mode]');
    if (cm) {
      if (cm.dataset.claudeMode === s.claudeMode || (cm.dataset.claudeMode === 'chat' && s.claudeMode !== 'api')) return;
      return save({ claudeMode: cm.dataset.claudeMode }, false, cm.dataset.claudeMode === 'api' ? 'Built-in mode on. Add your passcode below.' : 'Using your Claude chat. No API key needed.');
    }
    const gc = e.target.closest('[data-guide-count]');
    if (gc) {
      const n = Math.max(1, Math.min(10, (Number(s.prepGuide.tests) || 0) + Number(gc.dataset.guideCount)));
      return save({ prepGuide: { ...s.prepGuide, tests: n } });
    }
    const rt = e.target.closest('[data-remove-topic]');
    if (rt) {
      const sec = rt.dataset.removeTopic;
      const custom = { ...(s.customTopics || {}) };
      custom[sec] = (custom[sec] || []).filter((t) => t !== rt.dataset.topicName);
      return save({ customTopics: custom }, false, 'Topic removed. Misses keep their topic.');
    }
    const b = e.target.closest('[data-action]');
    if (!b) return;
    const a = b.dataset.action;
    if (a === 'add-test') {
      const r = await dateSheet({ title: 'Add a test date', withLabel: true });
      if (!r) return;
      const list = (s.testDates || []).filter((t) => t.date !== r.date);
      list.push({ date: r.date, label: r.label || 'ACT', science: true });
      return save({ testDates: list }, true, 'Test date added. The plan now aims at your next test.');
    }
    if (a === 'remove-test') return save({ testDates: (s.testDates || []).filter((t) => t.date !== b.dataset.date) });
    if (a === 'add-busy') {
      const r = await dateSheet({ title: 'Mark a busy day', withMinutes: true, minutesLabel: 'Minutes you can still study (0 for none)' });
      if (!r) return;
      return save({ busyDates: { ...(s.busyDates || {}), [r.date]: r.minutes } }, true, 'Busy day saved.');
    }
    if (a === 'remove-busy') {
      const next = { ...(s.busyDates || {}) };
      delete next[b.dataset.date];
      return save({ busyDates: next });
    }
    if (a === 'add-high') {
      const r = await dateSheet({ title: 'Add an extra-time day', withMinutes: true, minutesLabel: 'Minutes available', defaultMinutes: 90 });
      if (!r) return;
      return save({ highAvailability: { ...(s.highAvailability || {}), [r.date]: r.minutes } }, true, 'Saved.');
    }
    if (a === 'remove-high') {
      const next = { ...(s.highAvailability || {}) };
      delete next[b.dataset.date];
      return save({ highAvailability: next });
    }
    if (a === 'add-full') {
      const r = await dateSheet({ title: 'Add a full-test day', withSource: true });
      if (!r) return;
      const list = (s.fullTests || []).filter((f) => f.date !== r.date);
      list.push({ date: r.date, sourceId: r.sourceId });
      return save({ fullTests: list }, true, 'Full-test day added.');
    }
    if (a === 'remove-full') return save({ fullTests: (s.fullTests || []).filter((f) => f.date !== b.dataset.date) });
    if (a === 'export') return doExport();
    if (a === 'sync-now') {
      b.disabled = true;
      b.textContent = 'Syncing';
      try {
        await syncNow();
        toast('Synced.');
      } catch {
        // The card shows the reason.
      }
      return;
    }
    if (a === 'sync-off') {
      await disableSync();
      toast('Sync is off on this device. Your data stays here.');
    }
  });

  el.addEventListener('change', async (e) => {
    const s = store.state.settings;
    const t = e.target;
    if (t.dataset.legacy) {
      const all = { ...(s.legacyTests || {}) };
      const entry = { ...(all[t.dataset.legacy] || {}) };
      let value = t.value.trim();
      if (t.dataset.field === 'url' && value && !safeUrl(value)) {
        toast('That link should start with https://');
        return;
      }
      if (t.dataset.field === 'url') value = value ? safeUrl(value) : '';
      entry[t.dataset.field] = value;
      all[t.dataset.legacy] = entry;
      return save({ legacyTests: all }, true, 'Saved. The planner can use this test now.');
    }
    if (t.hasAttribute('data-guide-owned')) return save({ prepGuide: { ...s.prepGuide, owned: t.checked } });
    if (t.hasAttribute('data-import')) {
      const file = t.files && t.files[0];
      t.value = '';
      if (file) await doImport(file);
    }
  });

  el.addEventListener('submit', async (e) => {
    const sf = e.target.closest('[data-sync-form]');
    if (sf) {
      e.preventDefault();
      const pass = sf.elements.passcode.value.trim();
      if (!pass) {
        toast('Enter the app passcode first.');
        return;
      }
      const btn = sf.querySelector('[type=submit]');
      btn.disabled = true;
      btn.textContent = 'Connecting';
      const problem = await enableSync(pass);
      toast(problem || 'Sync is on.');
      return;
    }
    const f = e.target.closest('[data-passcode-form]');
    if (!f) return;
    e.preventDefault();
    save({ passcode: f.elements.passcode.value.trim() }, false, 'Passcode saved on this device.');
  });
}

async function doExport() {
  try {
    const data = await store.exportBackup();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `act-prep-backup-${store.today()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    toast('Backup downloaded.');
  } catch (err) {
    reportError(err, "Couldn't create the backup. Try again.");
  }
}

async function doImport(file) {
  let obj;
  try {
    if (file.size > 20 * 1024 * 1024) throw new Error('Backup file too large');
    obj = JSON.parse(await file.text());
  } catch (err) {
    reportError(err, "That file couldn't be read. Pick an ACT Prep backup (.json).");
    return;
  }
  const check = validateImport(obj);
  if (!check.ok) {
    console.warn(check.errors);
    await openSheet(html`<h2>Can't import this file</h2><ul class="small">${check.errors.slice(0, 5).map((x) => html`<li>${x}</li>`)}</ul>
      <div class="sheet-actions"><button class="btn" data-close="">OK</button></div>`);
    return;
  }
  const c = check.counts;
  const mode = await openSheet(html`<h2>Import backup</h2>
    <p class="muted">Found ${plural(c.attempts || 0, 'test')}, ${plural(c.misses || 0, 'miss', 'misses')}, and ${plural(c.tasks || 0, 'plan task')}.</p>
    <div class="stack">
      <button class="btn" data-close="merge">Merge with what's here</button>
      <button class="btn btn-danger" data-close="replace">Replace everything on this device</button>
      <button class="btn btn-secondary" data-close="">Cancel</button>
    </div>
    <p class="hint">Merge keeps your current data and adds what's missing. If an item is in both, the more recently edited version wins.</p>
    ${store.state.settings.sync && store.state.settings.sync.enabled ? html`<p class="hint strong">Sync is on, so Replace also removes these items from your other devices.</p>` : ''}`);
  if (mode !== 'merge' && mode !== 'replace') return;
  try {
    await store.importBackup(obj, mode);
    toast(mode === 'merge' ? 'Backup merged.' : 'Backup restored.');
  } catch (err) {
    reportError(err, "Couldn't import that backup. Nothing was changed.");
  }
}
