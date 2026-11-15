// Learn: a lesson for every topic, what to study next, and the misses tied to each topic.
import { html, setHTML } from '../safe-html.js';
import * as store from '../store.js';
import { icon, topbar, causeBadge, toast, reportError, plural } from '../ui.js';
import { ALL_SECTIONS, SECTIONS } from '../data/act.js';
import { topicsFor, topicsOf } from '../data/topics.js';
import { lessonFor, lessonHref, topicFromSlug } from '../data/lessons.js';
import { lessonKey, LESSON_REFRESH_DAYS } from '../logic/planner.js';
import { formatDate, daysBetween } from '../logic/dates.js';

export const live = true;

let activeSection = 'english';
// Revealed examples and check answers, by "section|topic|part". Memory only.
const shown = new Set();

/** Text with [[...]] shown underlined (the part an English question asks about). */
function rich(text) {
  const parts = String(text).split(/\[\[(.+?)\]\]/);
  return html`${parts.map((p, i) => (i % 2 ? html`<u>${p}</u>` : p))}`;
}

function missesFor(section, topic) {
  return store.state.misses
    .filter((m) => m.section === section && topicsOf(m).includes(topic))
    .sort((a, b) => String(b.date || b.createdAt).localeCompare(String(a.date || a.createdAt)));
}

function studiedOn(section, topic) {
  return (store.state.settings.lessonsStudied || {})[lessonKey(section, topic)] || null;
}

function sourceShort(sourceId) {
  const m = store.materials().find((x) => x.sourceId === sourceId);
  return m ? m.short || m.title : 'Your own source';
}

export function render(el, ctx) {
  const { section, slug } = ctx.params;
  if (section && slug) return renderTopic(el, ctx, section, slug);
  return renderList(el, ctx);
}

// ---------------------------------------------------------------- list

/** Topics to study first: the focus engine's top weak topics that have a lesson not studied lately. */
function upNext() {
  const f = store.focus();
  const out = [];
  const today = store.today();
  for (const r of f.ranked || []) {
    const sec = f.bySection[r.section];
    for (const t of (sec && sec.topics) || []) {
      if (!lessonFor(r.section, t.topic)) continue;
      const st = studiedOn(r.section, t.topic);
      if (st && daysBetween(st, today) <= LESSON_REFRESH_DAYS) continue;
      out.push({ section: r.section, topic: t.topic });
      if (out.length >= 3) return out;
    }
  }
  return out;
}

function renderList(el) {
  const s = activeSection;
  const topics = topicsFor(s, store.state.settings.customTopics).filter((t) => lessonFor(s, t));
  const next = upNext();
  setHTML(
    el,
    html`${topbar('Learn', { eyebrow: 'A lesson for every topic' })}
      <div class="stack-lg">
        ${next.length
          ? html`<section class="stack">
              <div class="section-title"><h2>Study next</h2><span class="small muted">From your misses</span></div>
              <div class="list">
                ${next.map((n) => {
                  const count = missesFor(n.section, n.topic).length;
                  return html`<a class="list-item" href="${lessonHref(n.section, n.topic)}">
                    <span class="sec-dot sec-${n.section}"></span>
                    <div class="grow"><div class="strong">${n.topic}</div><div class="small muted">${SECTIONS[n.section].label}${count ? `, ${plural(count, 'miss', 'misses')}` : ''}</div></div>
                    ${icon('chev')}
                  </a>`;
                })}
              </div>
            </section>`
          : ''}
        <div class="seg" role="tablist">
          ${ALL_SECTIONS.map((x) => html`<button type="button" data-learn-sec="${x}" aria-pressed="${x === s}">${SECTIONS[x].label}</button>`)}
        </div>
        <div class="list">
          ${topics.map((t) => {
            const count = missesFor(s, t).length;
            const st = studiedOn(s, t);
            return html`<a class="list-item" href="${lessonHref(s, t)}">
              <span class="list-icon ${st ? 'learn-done' : ''}">${icon(st ? 'check' : 'book')}</span>
              <div class="grow"><div class="strong">${t}</div>
                <div class="small muted">${[count ? plural(count, 'miss', 'misses') : '', st ? `Studied ${formatDate(st, { weekday: false })}` : ''].filter(Boolean).join('. ') || 'Not studied yet'}</div></div>
              ${count ? html`<span class="badge badge-${s}">${count}</span>` : ''}
            </a>`;
          })}
        </div>
      </div>`,
  );
  el.addEventListener('click', (e) => {
    const b = e.target.closest('[data-learn-sec]');
    if (!b) return;
    activeSection = b.dataset.learnSec;
    renderList(replace(el));
  });
}

// ---------------------------------------------------------------- topic

function renderTopic(el, ctx, section, slug) {
  const topic = topicFromSlug(section, slug);
  const l = topic ? lessonFor(section, topic) : null;
  if (!l) {
    setHTML(el, html`${topbar('Lesson', { back: '#/learn' })}<div class="empty"><h3>No lesson for this topic</h3><p>Custom topics don't have lessons.</p><a class="btn" href="#/learn">Back to Learn</a></div>`);
    return;
  }
  activeSection = section;
  const key = (part) => `${section}|${topic}|${part}`;
  const misses = missesFor(section, topic);
  const st = studiedOn(section, topic);
  const exShown = shown.has(key('example'));

  setHTML(
    el,
    html`${topbar(topic, { back: '#/learn', eyebrow: SECTIONS[section].label })}
      <div class="stack-lg lesson sec-${section}">
        <section class="card lesson-summary">
          <p>${l.summary}</p>
        </section>

        ${l.sections.map(
          (s) => html`<section class="stack-sm">
            <h2>${s.h}</h2>
            ${(s.p || []).map((p) => html`<p>${p}</p>`)}
            ${s.list ? html`<ul class="lesson-list">${s.list.map((li) => html`<li>${li}</li>`)}</ul>` : ''}
          </section>`,
        )}

        <section class="card stack">
          <div class="spread"><h2>Worked example</h2><span class="small muted">Try it first</span></div>
          <p class="lesson-prompt">${rich(l.example.prompt)}</p>
          <ul class="lesson-choices">${l.example.choices.map((c) => html`<li class="${exShown && c.startsWith(`${l.example.answer}.`) ? 'is-answer' : ''}">${c}</li>`)}</ul>
          ${exShown
            ? html`<div class="stack-sm"><div class="strong">Answer: ${l.example.answer}</div><ol class="lesson-steps">${l.example.steps.map((x) => html`<li>${x}</li>`)}</ol></div>`
            : html`<button type="button" class="btn btn-secondary btn-block" data-show="example">${icon('eye')}Show the answer and steps</button>`}
        </section>

        <section class="stack">
          <div class="section-title"><h2>Check yourself</h2><span class="small muted">Answer before you look</span></div>
          ${l.check.map((c, i) => {
            const open = shown.has(key(`check${i}`));
            return html`<button type="button" class="card card-tight check-q" data-show="check${i}" aria-expanded="${open}">
              <div class="strong">${c.q}</div>
              ${open ? html`<div class="small mt">${c.a}</div>` : html`<div class="small muted mt">Tap to see the answer</div>`}
            </button>`;
          })}
        </section>

        ${l.videos.length
          ? html`<section class="stack">
              <h2>Videos</h2>
              <div class="list">
                ${l.videos.map(
                  (v) => html`<a class="list-item" href="${v.url}" target="_blank" rel="noopener noreferrer">
                    <span class="list-icon">${icon('link')}</span><div class="grow"><div class="strong">${v.title}</div><div class="small muted">YouTube</div></div>
                  </a>`,
                )}
              </div>
            </section>`
          : ''}

        <section class="stack">
          <div class="section-title"><h2>Your misses</h2><span class="small muted">${misses.length ? plural(misses.length, 'question') : ''}</span></div>
          ${misses.length
            ? html`<div class="list">
                ${misses.map(
                  (m) => html`<a class="list-item" href="#/log/${m.id}">
                    <span class="qnum-sm">${m.questionNumber || '?'}</span>
                    <div class="grow"><div class="strong">${sourceShort(m.sourceId)}${m.questionNumber ? `, question ${m.questionNumber}` : ''}</div>
                      <div class="row-wrap" style="margin-top:4px">${causeBadge(m.cause, m.guessedRight)}${m.unscored ? html`<span class="badge">Not scored</span>` : ''}<span class="small muted">${formatDate(m.date || String(m.createdAt).slice(0, 10), { weekday: false })}</span></div>
                      ${m.fixLine ? html`<div class="small muted" style="margin-top:4px">Fix: ${m.fixLine}</div>` : ''}</div>
                    ${icon('chev')}
                  </a>`,
                )}
              </div>`
            : html`<p class="small muted">No misses on this topic yet.</p>`}
        </section>

        <div class="sticky-actions">
          ${st && daysBetween(st, store.today()) === 0
            ? html`<button class="btn btn-secondary" disabled>${icon('check')}Studied today</button>`
            : html`<button class="btn" data-action="studied">${icon('check')}${st ? 'Studied it again' : 'I studied this'}</button>`}
        </div>
        ${st ? html`<p class="small muted center">Last studied ${formatDate(st, { weekday: false })}.</p>` : ''}
      </div>`,
  );

  el.addEventListener('click', async (e) => {
    const sh = e.target.closest('[data-show]');
    if (sh) {
      const k = key(sh.dataset.show);
      if (shown.has(k) && sh.dataset.show !== 'example') shown.delete(k);
      else shown.add(k);
      const y = window.scrollY;
      renderTopic(replace(el), ctx, section, slug);
      window.scrollTo(0, y);
      return;
    }
    const b = e.target.closest('[data-action="studied"]');
    if (b) {
      b.disabled = true;
      try {
        await store.markLessonStudied(section, topic);
        toast('Marked as studied. Your plan updated.');
      } catch (err) {
        b.disabled = false;
        reportError(err, "Couldn't save that. Try again.");
      }
    }
  });
}

function replace(el) {
  const fresh = el.cloneNode(false);
  el.replaceWith(fresh);
  return fresh;
}

/** Lesson links for a miss's topics (only topics that have lessons). */
export function lessonLinks(m) {
  const topics = topicsOf(m).filter((t) => lessonFor(m.section, t));
  if (!topics.length) return '';
  return html`<div class="row-wrap lesson-links">${topics.map((t) => html`<a class="btn btn-secondary btn-sm" href="${lessonHref(m.section, t)}">${icon('book')}${t} lesson</a>`)}</div>`;
}

