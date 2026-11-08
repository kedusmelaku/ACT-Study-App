// Tests: list of attempts, the superscore, and "Add test".
import { html, setHTML } from '../safe-html.js';
import * as store from '../store.js';
import { icon, topbar, emptyState, plural } from '../ui.js';
import { ALL_SECTIONS, SECTIONS, ATTEMPT_KINDS } from '../data/act.js';
import { compositeOf, stemOf, superscore } from '../logic/scoring.js';
import { formatDate } from '../logic/dates.js';

export const live = true;

export function scoreRow(scores, scale) {
  return html`<div class="score-row">
    ${ALL_SECTIONS.map(
      (s) => html`<div class="score-cell sec-${s}"><b>${scores && scores[s] ? scores[s] : '--'}</b><span>${SECTIONS[s].label}</span></div>`,
    )}
  </div>${scale === 35 ? html`<p class="hint mt">Scored out of 35.</p>` : ''}`;
}

export function attemptTitle(a) {
  const m = store.materials().find((x) => x.sourceId === a.sourceId);
  if (a.kind === 'real') return 'Real ACT';
  if (a.kind === 'benchmark') return 'School benchmark';
  return m ? m.title : ATTEMPT_KINDS[a.kind]?.label || 'Practice test';
}

export function render(el) {
  const s = store.state;
  const list = s.attempts.slice().sort((a, b) => (b.date + (b.createdAt || '')).localeCompare(a.date + (a.createdAt || '')));
  const sup = superscore(s.attempts);
  const missCount = (id) => s.misses.filter((m) => m.attemptId === id).length;

  setHTML(
    el,
    html`${topbar('Tests', { eyebrow: plural(list.length, 'attempt'), actions: html`<a class="btn btn-sm" href="#/tests/new">${icon('plus')}Add test</a>` })}
      <div class="stack-lg">
        ${sup
          ? html`<section class="card stack">
              <div class="spread"><div><div class="tiny strong muted">SUPERSCORE</div><div class="small muted">Best of ${plural(sup.count, 'real ACT')}</div></div><div class="score-big">${sup.composite ?? '--'}</div></div>
              <div class="score-row">
                ${ALL_SECTIONS.map((x) => {
                  const b = sup.sections[x];
                  return html`<div class="score-cell sec-${x}"><b>${b ? b.score : '--'}</b><span>${b ? formatDate(b.date, { weekday: false }) : SECTIONS[x].label}</span></div>`;
                })}
              </div>
              ${sup.stem ? html`<span class="badge badge-science">STEM ${sup.stem}</span>` : ''}
            </section>`
          : ''}
        ${list.length
          ? html`<div class="list">
              ${list.map((a) => {
                const c = compositeOf(a.scores);
                const st = stemOf(a.scores);
                const n = missCount(a.id);
                return html`<a class="list-item" href="#/tests/${a.id}">
                  <div class="list-icon ${a.kind === 'real' ? 'sec-none' : ''}" style="${a.kind === 'real' ? '' : 'background:var(--surface-2);color:var(--muted)'}">${icon(a.kind === 'real' ? 'flag' : 'tests')}</div>
                  <div class="grow">
                    <div class="strong">${attemptTitle(a)}</div>
                    <div class="small muted">${formatDate(a.date, { year: true })}${n ? `, ${plural(n, 'miss', 'misses')} logged` : ''}</div>
                    <div class="row-wrap mt" style="margin-top:6px">
                      ${ALL_SECTIONS.filter((x) => a.scores[x]).map((x) => html`<span class="badge badge-${x}">${SECTIONS[x].short} ${a.scores[x]}</span>`)}
                      ${st ? html`<span class="badge">STEM ${st}</span>` : ''}
                    </div>
                  </div>
                  <div class="center"><div class="score-big" style="font-size:1.7rem">${c ?? '--'}</div><div class="tiny muted">${a.kind === 'real' ? 'Real' : 'Practice'}</div></div>
                </a>`;
              })}
            </div>`
          : emptyState({
              iconName: 'tests',
              title: 'No tests yet',
              body: 'Log a practice test to see your composite, tag your misses, and let the plan adapt. It takes under five minutes.',
              actionHref: '#/tests/new',
              actionLabel: 'Log a test',
            })}
      </div>`,
  );
}
