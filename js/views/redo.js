// Redo: bring missed questions back on a spaced schedule until they stick.
import { html, setHTML, safeUrl } from '../safe-html.js';
import * as store from '../store.js';
import { icon, topbar, sectionBadge, secClass, plural, reportError, toast } from '../ui.js';
import { SECTIONS } from '../data/act.js';
import { dueRedos, isOpen, wrongCount } from '../logic/redo.js';
import { formatDate, daysBetween, compareDates } from '../logic/dates.js';

export const live = true;

const revealed = new Set();

export function render(el) {
  const s = store.state;
  const today = store.today();
  const mats = store.materials();
  const missById = new Map(s.misses.map((m) => [m.id, m]));
  const due = dueRedos(s.redos, today).filter((r) => missById.has(r.missId));
  const upcoming = s.redos
    .filter((r) => isOpen(r) && r.dueDate && compareDates(r.dueDate, today) > 0 && missById.has(r.missId))
    .sort((a, b) => compareDates(a.dueDate, b.dueDate));
  const retired = s.redos.filter((r) => r.status === 'retired').length;
  const persistent = s.redos.filter((r) => r.status === 'persistent' && missById.has(r.missId));
  const current = due[0];

  const sourceOf = (m) => mats.find((x) => x.sourceId === m.sourceId);

  let main;
  if (current) {
    const m = missById.get(current.missId);
    const src = sourceOf(m);
    const url = src ? safeUrl(src.url) : '';
    const isRevealed = revealed.has(m.id);
    main = html`<article class="card stack ${secClass(m.section)}" style="border-left:4px solid var(--sec)">
      <div class="spread"><div class="row-wrap">${sectionBadge(m.section)}
        ${current.status === 'persistent' ? html`<span class="badge badge-danger">Persistent</span>` : ''}
        <span class="badge">Every ${current.interval} days</span></div>
        <span class="small muted">1 of ${due.length}</span></div>
      <div class="tag-head">
        <div class="qnum">${m.questionNumber || '?'}</div>
        <div class="grow"><div class="strong">${m.topic || 'Untagged'}</div>
          <div class="small muted">${src ? src.title : 'Your own source'}${m.questionNumber ? `, ${SECTIONS[m.section].label} question ${m.questionNumber}` : ''}</div></div>
      </div>
      ${!m.questionNumber && m.note ? html`<p class="small">${m.note}</p>` : ''}
      <p class="small muted">Find the question in the official test and answer it fresh before you reveal.</p>
      ${url ? html`<a class="btn btn-secondary btn-sm" href="${url}" target="_blank" rel="noopener">${icon('link')}Open ${src.short || src.title}</a>` : ''}
      ${isRevealed
        ? html`<div class="stack-sm">
            <div class="grid-2">
              <div class="card card-soft card-tight"><div class="tiny muted strong">YOUR OLD ANSWER</div><div class="strong">${m.myAnswer || 'Not recorded'}</div></div>
              <div class="card card-soft card-tight"><div class="tiny muted strong">CORRECT</div><div class="strong">${m.correctAnswer || 'Not recorded'}</div></div>
            </div>
            ${m.fixLine ? html`<div class="fix-line"><b>Fix</b>${m.fixLine}</div>` : html`<div class="fix-line muted">No fix line saved. <a href="#/log/${m.id}">Add one</a>.</div>`}
            ${m.note && m.questionNumber ? html`<p class="small muted">${m.note}</p>` : ''}
          </div>
          <div class="fab-row">
            <button class="btn btn-danger" data-answer="wrong" data-id="${m.id}">${icon('x')}Wrong</button>
            <button class="btn" data-answer="right" data-id="${m.id}">${icon('check')}Right</button>
          </div>`
        : html`<button class="btn btn-block" data-reveal="${m.id}">${icon('eye')}Reveal</button>`}
    </article>`;
  } else {
    const next = upcoming[0];
    main = html`<div class="empty">${icon('check')}
      <h3>${s.redos.length ? 'All caught up' : 'No redos yet'}</h3>
      <p>${s.redos.length
        ? next
          ? `Next redo ${formatDate(next.dueDate)}, in ${plural(daysBetween(today, next.dueDate), 'day')}.`
          : 'Every redo is retired. Nice.'
        : 'Each miss you log comes back here 3 days later, then 7, then 14, until you get it right twice in a row at 14 days.'}</p>
      ${s.redos.length ? '' : html`<a class="btn" href="#/log/new">Add a miss</a>`}
    </div>`;
  }

  setHTML(
    el,
    html`${topbar('Redo', { back: '#/more', eyebrow: due.length ? `${plural(due.length, 'redo')} due` : 'Spaced review' })}
      <div class="stack-lg">
        ${main}
        <div class="grid-2">
          <div class="card card-tight center"><div class="score-big" style="font-size:1.6rem">${upcoming.length + due.length}</div><div class="tiny muted">Active</div></div>
          <div class="card card-tight center"><div class="score-big" style="font-size:1.6rem">${retired}</div><div class="tiny muted">Retired</div></div>
        </div>
        ${persistent.length
          ? html`<section class="stack"><div class="section-title"><h2>Persistent</h2><span class="small muted">Wrong twice or more</span></div>
              <div class="list">${persistent.map((r) => redoRow(missById.get(r.missId), r, sourceOf))}</div></section>`
          : ''}
        ${upcoming.length
          ? html`<section class="stack"><div class="section-title"><h2>Coming up</h2></div>
              <div class="list">${upcoming.slice(0, 12).map((r) => redoRow(missById.get(r.missId), r, sourceOf))}</div>
              ${upcoming.length > 12 ? html`<p class="hint center">and ${upcoming.length - 12} more</p>` : ''}</section>`
          : ''}
      </div>`,
  );

  el.addEventListener('click', async (e) => {
    const rv = e.target.closest('[data-reveal]');
    if (rv) {
      revealed.add(rv.dataset.reveal);
      render(replace(el));
      return;
    }
    const ans = e.target.closest('[data-answer]');
    if (!ans) return;
    ans.disabled = true;
    try {
      const r = await store.answerRedo(ans.dataset.id, ans.dataset.answer);
      revealed.delete(ans.dataset.id);
      if (r.status === 'retired') toast('Retired. That one stuck.');
      else if (ans.dataset.answer === 'right') toast(`Next time in ${plural(r.interval, 'day')}.`);
      else toast(wrongCount(r) >= 2 ? 'Marked persistent. It will come back in 3 days and gets extra weight in your plan.' : 'Back in 3 days. Read the fix line once more.');
    } catch (err) {
      ans.disabled = false;
      reportError(err, "Couldn't save that answer. Try again.");
    }
  });
}

function replace(el) {
  const fresh = el.cloneNode(false);
  el.replaceWith(fresh);
  return fresh;
}

function redoRow(m, r, sourceOf) {
  const src = sourceOf(m);
  return html`<a class="list-item" href="#/log/${m.id}">
    <span class="sec-dot sec-${m.section}"></span>
    <div class="grow"><div class="strong">${m.topic || 'Untagged'}${m.questionNumber ? html` <span class="muted">· Q${m.questionNumber}</span>` : ''}</div>
      <div class="small muted">${src ? src.short || src.title : 'Own source'}, ${r.dueDate ? `due ${formatDate(r.dueDate)}` : 'retired'}</div></div>
    ${r.status === 'persistent' ? html`<span class="badge badge-danger">${wrongCount(r)} wrong</span>` : html`<span class="badge">${r.interval}d</span>`}
  </a>`;
}
