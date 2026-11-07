// Hand-written inline SVG trend chart. Works offline, no library.
import { html, raw } from '../safe-html.js';
import { ALL_SECTIONS, SECTIONS, MAX_SCORE } from '../data/act.js';
import { formatDate } from '../logic/dates.js';

const H = 220;
const PAD = { l: 30, r: 46, t: 14, b: 30 };

function fmt(n) {
  return Math.round(n * 10) / 10;
}

/** Returns { svg, legend, table } markup for the series from trendSeries(). */
export function trendChart(series, { wide = false } = {}) {
  // A wider drawing on large screens keeps the text at a readable size instead of scaling it up.
  const W = wide ? 680 : 360;
  const n = series.length;
  const values = [];
  for (const p of series) {
    for (const s of ALL_SECTIONS) if (p.scores[s]) values.push(p.scores[s]);
    if (p.estComposite) values.push(p.estComposite);
  }
  let lo = Math.min(...values) - 1;
  lo = Math.max(1, Math.floor(lo / 2) * 2);
  const hi = MAX_SCORE;
  const plotW = W - PAD.l - PAD.r;
  const plotH = H - PAD.t - PAD.b;
  const x = (i) => PAD.l + (n === 1 ? plotW / 2 : (i * plotW) / (n - 1));
  const y = (v) => PAD.t + ((hi - v) * plotH) / (hi - lo);

  const step = hi - lo > 12 ? 4 : 2;
  const ticks = [];
  for (let v = hi; v >= lo; v -= step) ticks.push(v);

  let out = '';
  out += '<g class="grid">';
  for (const v of ticks) out += `<line x1="${PAD.l}" x2="${W - PAD.r}" y1="${fmt(y(v))}" y2="${fmt(y(v))}"/>`;
  out += '</g>';
  for (const v of ticks) out += `<text x="${PAD.l - 6}" y="${fmt(y(v) + 4)}" text-anchor="end">${v}</text>`;

  // x labels: first, last, and the middle when there's room.
  const labelIdx = new Set([0, n - 1]);
  if (n >= 5) labelIdx.add(Math.floor((n - 1) / 2));
  for (const i of labelIdx) {
    const anchor = n === 1 ? 'middle' : i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle';
    out += `<text x="${fmt(x(i))}" y="${H - 8}" text-anchor="${anchor}">${formatDate(series[i].date, { weekday: false })}</text>`;
  }

  // Estimated composite: dashed, in text ink.
  const est = series.map((p, i) => (p.estComposite ? [x(i), y(p.estComposite)] : null));
  out += `<g class="est"><path d="${pathFor(est)}"/></g>`;

  const ends = [];
  for (const s of ALL_SECTIONS) {
    const pts = series.map((p, i) => (p.scores[s] ? [x(i), y(p.scores[s])] : null));
    if (!pts.some(Boolean)) continue;
    out += `<g class="series" style="--c:var(--chart-${s})"><path d="${pathFor(pts)}" style="stroke:var(--c)"/>`;
    series.forEach((p, i) => {
      if (!pts[i]) return;
      const [cx, cy] = pts[i];
      if (p.real) {
        out += `<rect x="${fmt(cx - 5.5)}" y="${fmt(cy - 5.5)}" width="11" height="11" transform="rotate(45 ${fmt(cx)} ${fmt(cy)})" style="fill:var(--c);stroke:var(--surface);stroke-width:2"/>`;
      } else {
        out += `<circle cx="${fmt(cx)}" cy="${fmt(cy)}" r="4.5" style="fill:var(--c);stroke:var(--surface);stroke-width:2"/>`;
      }
    });
    out += '</g>';
    const last = [...series.keys()].reverse().find((i) => pts[i]);
    ends.push({ s, y: pts[last][1], v: series[last].scores[s] });
  }
  // Direct labels at the right edge, nudged apart so they never overlap.
  ends.sort((a, b) => a.y - b.y);
  for (let i = 1; i < ends.length; i++) if (ends[i].y - ends[i - 1].y < 12) ends[i].y = ends[i - 1].y + 12;
  for (const e of ends) {
    out += `<text x="${W - PAD.r + 8}" y="${fmt(e.y + 4)}" class="direct">${SECTIONS[e.s].short} ${e.v}</text>`;
  }

  // Hit targets for hover and tap, wider than the marks.
  const colW = n === 1 ? plotW : plotW / (n - 1);
  series.forEach((p, i) => {
    out += `<rect class="hit" data-i="${i}" x="${fmt(x(i) - colW / 2)}" y="${PAD.t}" width="${fmt(colW)}" height="${plotH}" fill="transparent"/>`;
  });
  out += `<line class="crosshair" x1="0" x2="0" y1="${PAD.t}" y2="${H - PAD.b}" visibility="hidden"/>`;

  const svg = html`<svg class="chart" width="100%" viewBox="0 0 ${W} ${H}" role="img" aria-label="Section scores across ${n} attempts">${raw(out)}</svg>`;

  const legend = html`<div class="chart-legend">
    ${ALL_SECTIONS.filter((s) => series.some((p) => p.scores[s])).map((s) => html`<span><i class="cause-key" style="background:var(--chart-${s})"></i>${SECTIONS[s].label}</span>`)}
    <span><svg width="18" height="8" aria-hidden="true"><line x1="0" x2="18" y1="4" y2="4" stroke="currentColor" stroke-width="2" stroke-dasharray="4 3"/></svg>Est. composite</span>
    <span><svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><rect x="2.5" y="2.5" width="7" height="7" transform="rotate(45 6 6)" fill="currentColor"/></svg>Real ACT</span>
    <span><svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><circle cx="6" cy="6" r="4" fill="currentColor"/></svg>Practice</span>
  </div>`;

  const table = html`<details><summary class="small strong">Show as a table</summary>
    <div style="overflow-x:auto"><table class="data-table">
      <thead><tr><th>Date</th><th>Kind</th>${ALL_SECTIONS.map((s) => html`<th>${SECTIONS[s].short}</th>`)}<th>Comp.</th><th>Est.</th></tr></thead>
      <tbody>${series.map(
        (p) => html`<tr><td>${formatDate(p.date, { weekday: false })}</td><td>${p.real ? 'Real' : 'Practice'}</td>${ALL_SECTIONS.map((s) => html`<td>${p.scores[s] || ''}</td>`)}<td>${p.composite ?? ''}</td><td>${p.estComposite ?? ''}</td></tr>`,
      )}</tbody>
    </table></div></details>`;

  return { svg, legend, table, width: W };
}

function pathFor(pts) {
  let d = '';
  let pen = false;
  for (const p of pts) {
    if (!p) {
      pen = false;
      continue;
    }
    d += `${pen ? 'L' : 'M'}${fmt(p[0])} ${fmt(p[1])}`;
    pen = true;
  }
  return d || 'M0 0';
}
