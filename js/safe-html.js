// Safe markup. `html` escapes every interpolated value unless it is wrapped with raw().
// setHTML is the only place markup reaches the DOM.

class SafeHTML {
  constructor(value) {
    this.value = value;
  }
  toString() {
    return this.value;
  }
}

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;', '`': '&#96;' };

export function escapeHTML(value) {
  return String(value).replace(/[&<>"'`]/g, (c) => ESC[c]);
}

/** Trusted strings only (markup the app itself wrote, never user or network data). */
export function raw(value) {
  return new SafeHTML(String(value));
}

function render(value) {
  if (value === null || value === undefined || value === false) return '';
  if (value instanceof SafeHTML) return value.value;
  if (Array.isArray(value)) return value.map(render).join('');
  return escapeHTML(value);
}

export function html(strings, ...values) {
  let out = strings[0];
  for (let i = 0; i < values.length; i++) out += render(values[i]) + strings[i + 1];
  return new SafeHTML(out);
}

export function setHTML(el, content) {
  if (!(content instanceof SafeHTML)) throw new TypeError('setHTML needs html`` or raw() content');
  el.innerHTML = content.value;
}

export function isSafe(v) {
  return v instanceof SafeHTML;
}

/** Only http(s) links pass. Anything else becomes an empty string. */
export function safeUrl(url) {
  try {
    const u = new URL(String(url));
    return u.protocol === 'https:' || u.protocol === 'http:' ? u.href : '';
  } catch {
    return '';
  }
}
