// One attempt: scores, pacing, and its misses.
import { html, setHTML } from '../safe-html.js';
import * as store from '../store.js';
import { icon, topbar, sectionBadge, causeBadge, undoToast, reportError, confirmSheet, plural } from '../ui.js';
import { ALL_SECTIONS, SECTIONS, ATTEMPT_KINDS } from '../data/act.js';
import { compositeOf, stemOf } from '../logic/scoring.js';
import { isTimingFlag } from '../logic/focus.js';
import { formatDate } from '../logic/dates.js';
import { scoreRow, attemptTitle } from './tests.js';

export const live = true;

export function render(el, ctx) {
  const s = store.state;
  const a = s.attempts.find((x) => x.id === ctx.params.id);
  if (!a) {
    setHTML(el, html`${topbar('Test', { back: '#/tests' })}<div class="empty"><h3>That test isn't here</h3><p>It may have been deleted.</p><a class="btn" href="#/tests">Back to tests</a></div>`);
    return;
  }
  const c = compositeOf(a.scores);
  const st = stemOf(a.scores);
  const pacing = s.pacing.filter((p) => p.attemptId === a.id);
  const misses = s.misses.filter((m) => m.attemptId === a.id).sort((x, y) => ALL_SECTIONS.indexOf(x.section) - ALL_SECTIONS.indexOf(y.section) || (x.questionNumber || 0) - (y.questionNumber || 0));
  const untagged = misses.filter((m) => !m.topic).length;

  setHTML(
    el,
    html`${topbar(attemptTitle(a), { back: '#/tests', eyebrow: formatDate(a.date, { year: true }), actions: html`<a class="btn btn-sm btn-secondary" href="#/tests/${a.id}/edit">${icon('edit')}Edit</a>` })}
      <div class="stack-lg">
        <section class="card stack">
          <div class="spread">
            <div><div class="tiny strong muted">COMPOSITE</div><span class="badge ${a.kind === 'real' ? 'badge-accent' : ''}">${ATTEMPT_KINDS[a.kind]?.label || 'Test'}</span></div>
            <div class="row"><div class="score-big">${c ?? '--'}</div>${st ? html`<span class="badge badge-science">STEM ${st}</span>` : ''}</div>
          </div>
          ${scoreRow(a.scores, a.scale)}
          ${a.notes ? html`<p class="small muted">${a.notes}</p>` : ''}
        </section>
        ${untagged ? html`<a class="notice notice-warn" href="#/tests/${a.id}/edit">${icon('alert')}<span class="grow">${plural(untagged, 'miss', 'misses')} still need a topic. Tap to finish tagging.</span></a>` : ''}
        ${pacing.length
          ? html`<section class="stack"><div class="section-title"><h2>Pacing</h2></div>
              <div class="list">${pacing.map(
                (p) => html`<div class="list-item"><span class="sec-dot sec-${p.section}"></span><div class="grow"><div class="strong">${SECTIONS[p.section].label}</div>
                  <div class="small muted">${p.notReached} not reached, ${p.guessedAtEnd} guessed at end, ${p.minutesLeft} min left</div></div>
                  ${isTimingFlag(p) ? html`<span class="badge badge-warn">Timing flag</span>` : ''}</div>`,
              )}</div></section>`
          : ''}
        <section class="stack">
          <div class="section-title"><h2>Misses</h2><span class="small muted">${misses.length}</span></div>
          ${misses.length
            ? html`<div class="list">${misses.map(
                (m) => html`<a class="list-item" href="#/log/${m.id}">
                  <div class="qnum sec-${m.section}" style="width:40px;height:40px;font-size:0.95rem;border-radius:11px">${m.questionNumber || '?'}</div>
                  <div class="grow"><div class="strong">${m.topic || 'Untagged'}</div><div class="row-wrap" style="margin-top:4px">${sectionBadge(m.section)}${causeBadge(m.cause, m.guessedRight)}</div></div>
                  ${icon('chev', 'chev')}</a>`,
              )}</div>`
            : html`<div class="day-empty">No misses logged for this test.</div>`}
        </section>
        <button class="btn btn-danger btn-block" data-action="delete">${icon('trash')}Delete test</button>
      </div>`,
  );

  el.addEventListener('click', async (e) => {
    if (!e.target.closest('[data-action=delete]')) return;
    const ok = await confirmSheet({ title: 'Delete this test?', body: 'Its scores, pacing, and tagged misses will be removed. You can undo right after.', confirmLabel: 'Delete', danger: true });
    if (!ok) return;
    try {
      const undo = await store.deleteAttempt(a.id);
      ctx.navigate('#/tests');
      undoToast('Test deleted.', undo);
    } catch (err) {
      reportError(err, "Couldn't delete the test. Try again.");
    }
  });
}
