import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

// Every file the app loads must be in the service worker's precache list, or it breaks offline.
test('service worker precaches every app file', () => {
  const sw = readFileSync('sw.js', 'utf8');
  const listed = new Set([...sw.matchAll(/'(\/[^']*)'/g)].map((m) => m[1]));
  const files = [];
  (function walk(dir) {
    for (const name of readdirSync(dir)) {
      const p = join(dir, name);
      if (statSync(p).isDirectory()) walk(p);
      else files.push('/' + p.split('\\').join('/'));
    }
  })('js');
  files.push('/css/styles.css', '/index.html', '/manifest.webmanifest');
  for (const f of readdirSync('icons')) if (/\.(png|svg)$/.test(f) && !f.startsWith('maskable.svg')) files.push(`/icons/${f}`);
  const missing = files.filter((f) => !listed.has(f));
  assert.deepEqual(missing, [], `add these to ASSETS in sw.js: ${missing.join(', ')}`);
});
