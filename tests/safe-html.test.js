import test from 'node:test';
import assert from 'node:assert/strict';
import { html, raw, safeUrl } from '../js/safe-html.js';

test('html escapes interpolated values by default', () => {
  const evil = '<img src=x onerror="alert(1)">';
  assert.equal(String(html`<p title="${evil}">${evil}</p>`), '<p title="&lt;img src=x onerror=&quot;alert(1)&quot;&gt;">&lt;img src=x onerror=&quot;alert(1)&quot;&gt;</p>');
});

test('raw and nested templates pass through; arrays join; null renders empty', () => {
  assert.equal(String(html`<ul>${['a', '<b>'].map((x) => html`<li>${x}</li>`)}</ul>`), '<ul><li>a</li><li>&lt;b&gt;</li></ul>');
  assert.equal(String(html`${raw('<i>ok</i>')}${null}${undefined}${false}`), '<i>ok</i>');
});

test('safeUrl only allows http and https', () => {
  assert.equal(safeUrl('javascript:alert(1)'), '');
  assert.equal(safeUrl('https://act.org/x'), 'https://act.org/x');
  assert.equal(safeUrl('not a url'), '');
});
