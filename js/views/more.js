// More: Redo, Explain, Progress, Settings.
import { html, setHTML } from '../safe-html.js';
import * as store from '../store.js';
import { icon, topbar } from '../ui.js';
import { dueRedos } from '../logic/redo.js';

export const live = true;

export function render(el) {
  const due = dueRedos(store.state.redos, store.today()).length;
  const items = [
    { href: '#/redo', icon: 'redo', title: 'Redo', sub: due ? `${due} due now` : 'Spaced review of old misses' },
    { href: '#/explain', icon: 'explain', title: 'Explain a miss', sub: 'Ask Claude why the right answer is right' },
    { href: '#/progress', icon: 'progress', title: 'Progress', sub: 'Trends, topics, causes, weekly coach' },
    { href: '#/settings', icon: 'settings', title: 'Settings', sub: 'Dates, study time, materials, backup' },
  ];
  setHTML(
    el,
    html`${topbar('More')}
      <div class="list">
        ${items.map(
          (i) => html`<a class="list-item" href="${i.href}"><span class="list-icon sec-none">${icon(i.icon)}</span>
            <div class="grow"><div class="strong">${i.title}</div><div class="small muted">${i.sub}</div></div>${icon('chev', 'chev')}</a>`,
        )}
      </div>`,
  );
}
