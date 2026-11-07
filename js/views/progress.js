// Placeholder until this screen is built in a later phase.
import { html, setHTML } from '../safe-html.js';
import { topbar } from '../ui.js';

export const live = true;

export function render(el) {
  setHTML(el, html`${topbar('progress', { back: '#/more' })}<div class="empty"><h3>Not built yet</h3><p>This screen arrives in the next phase.</p></div>`);
}
