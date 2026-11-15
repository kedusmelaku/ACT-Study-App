// Composite, STEM, superscore, and current estimates. Pure functions.
import { CORE_SECTIONS, ALL_SECTIONS, ATTEMPT_KINDS, RECENCY_WEIGHTS, MAX_SCORE, MIN_SCORE, roundScore } from '../data/act.js';

function isScore(v) {
  return typeof v === 'number' && Number.isFinite(v) && v >= MIN_SCORE && v <= MAX_SCORE;
}

/** Composite of English, Math, Reading. Null if any is missing. Science is never included. */
export function composite(english, math, reading) {
  if (!isScore(english) || !isScore(math) || !isScore(reading)) return null;
  return roundScore((english + math + reading) / 3);
}

export function compositeOf(scores = {}) {
  return composite(scores.english, scores.math, scores.reading);
}

/** STEM score: average of Math and Science. Null unless both exist. */
export function stem(math, science) {
  if (!isScore(math) || !isScore(science)) return null;
  return roundScore((math + science) / 2);
}

export function stemOf(scores = {}) {
  return stem(scores.math, scores.science);
}

function byDateDesc(a, b) {
  if (a.date !== b.date) return a.date < b.date ? 1 : -1;
  const ca = a.createdAt || '';
  const cb = b.createdAt || '';
  if (ca !== cb) return ca < cb ? 1 : -1;
  return String(a.id) < String(b.id) ? 1 : -1;
}

/**
 * Superscore from real ACT attempts only.
 * Returns { composite, sections: { english: { score, date, attemptId } ... } } or null.
 */
export function superscore(attempts = []) {
  const real = attempts.filter((a) => a && a.kind === 'real');
  if (!real.length) return null;
  const sections = {};
  for (const s of ALL_SECTIONS) {
    let best = null;
    for (const a of real) {
      const v = a.scores ? a.scores[s] : undefined;
      if (!isScore(v)) continue;
      // Ties go to the earlier date so the source of the best score stays stable.
      if (!best || v > best.score || (v === best.score && a.date < best.date)) {
        best = { score: v, date: a.date, attemptId: a.id };
      }
    }
    if (best) sections[s] = best;
  }
  const c = composite(sections.english?.score, sections.math?.score, sections.reading?.score);
  return { composite: c, stem: stem(sections.math?.score, sections.science?.score), sections, count: real.length };
}

/**
 * Drop repeated benchmark entries with identical scores (for example, saved once on each device
 * before sync was turned on). The earliest one is kept.
 */
export function dedupeAttempts(attempts = []) {
  const seen = new Set();
  return attempts
    .slice()
    .sort((a, b) => String(a.date).localeCompare(String(b.date)) || String(a.createdAt || '').localeCompare(String(b.createdAt || '')))
    .filter((a) => {
      if (!a || a.kind !== 'benchmark') return true;
      const key = JSON.stringify(a.scores || {});
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

/** A score on the 36-point scale: scores out of 35 are stretched (x 36/35). */
export function on36Value(score, scale) {
  const v = Number(score);
  return Number(scale) === 35 ? Math.min(MAX_SCORE, (v * MAX_SCORE) / 35) : v;
}

/**
 * Current estimate per section: weighted average of the 3 most recent attempts with that section.
 * Weights: recency (1.0, 0.7, 0.5) times kind weight. Scores out of 35 are converted to the 36 scale
 * first (on36Value), so a test on a bigger scale doesn't look like a gain. `capped` marks an estimate
 * that includes a converted score.
 * Returns { english: { value, score, capped, count, attemptIds } | null, ... }
 */
export function estimates(attempts = []) {
  const sorted = dedupeAttempts(attempts).filter((a) => a && a.scores).sort(byDateDesc);
  const out = {};
  for (const s of ALL_SECTIONS) {
    const used = [];
    for (const a of sorted) {
      if (isScore(a.scores[s])) used.push(a);
      if (used.length === RECENCY_WEIGHTS.length) break;
    }
    if (!used.length) {
      out[s] = null;
      continue;
    }
    let num = 0;
    let den = 0;
    let capped = false;
    used.forEach((a, i) => {
      const kw = (ATTEMPT_KINDS[a.kind] || ATTEMPT_KINDS.other).weight;
      const w = RECENCY_WEIGHTS[i] * kw;
      num += on36Value(a.scores[s], a.scale) * w;
      den += w;
      if (Number(a.scale) === 35) capped = true;
    });
    const value = num / den;
    out[s] = {
      value,
      score: Math.min(MAX_SCORE, roundScore(value)),
      capped,
      count: used.length,
      attemptIds: used.map((a) => a.id),
    };
  }
  return out;
}

/** Estimated composite from rounded section estimates. */
export function estimatedComposite(est) {
  if (!est) return null;
  return composite(est.english?.score, est.math?.score, est.reading?.score);
}

export function estimatedStem(est) {
  if (!est) return null;
  return stem(est.math?.score, est.science?.score);
}

/** Section scores in the order they appear on a score report. */
export function hasAllCore(scores = {}) {
  return CORE_SECTIONS.every((s) => isScore(scores[s]));
}

export { isScore };

// ---------------------------------------------------------------- keyed tests

/** Scale score for a raw score from a key's conversion table (table[raw]), clamped to the table. */
export function scaleFromRaw(table, raw) {
  if (!Array.isArray(table) || !table.length) return null;
  const r = Math.max(0, Math.min(table.length - 1, Math.floor(Number(raw) || 0)));
  return table[r];
}

/**
 * Raw and scale score for one keyed section from the marked questions.
 * `marks` maps question number to 'miss' or 'guess'. Guessed-right questions were answered right,
 * so they aren't misses. Misses on unscored questions don't lower the raw score.
 */
export function keyedSection(formSection, marks = {}) {
  if (!formSection) return null;
  const unscored = new Set(formSection.unscored);
  const scored = formSection.total - unscored.size;
  let missed = 0;
  for (const [q, v] of Object.entries(marks)) {
    const n = Number(q);
    if (v === 'miss' && n >= 1 && n <= formSection.total && !unscored.has(n)) missed++;
  }
  const raw = Math.max(0, scored - missed);
  return { raw, scored, scale: scaleFromRaw(formSection.table, raw) };
}

/**
 * Scores for a keyed test. `form` is a FORMS entry, `marks` is { section: { q: state } },
 * `taken` lists the sections taken. Returns { scores, detail } where detail has raw and scored per section.
 */
export function keyedScores(form, marks = {}, taken = []) {
  const scores = {};
  const detail = {};
  if (!form) return { scores, detail };
  for (const s of ALL_SECTIONS) {
    if (!taken.includes(s) || !form[s]) continue;
    const d = keyedSection(form[s], marks[s] || {});
    detail[s] = d;
    scores[s] = d.scale;
  }
  return { scores, detail };
}

/**
 * The likely range on the 36-point scale for a score out of 35. A whole score k stands for anything
 * from k - 0.5 to k + 0.5 on its own scale; stretched to 36 points and rounded, that gives the range.
 * Approximate: the two scales aren't strictly proportional.
 */
export function rangeOn36(score) {
  const k = Number(score);
  if (!Number.isFinite(k) || k < MIN_SCORE || k > 35) return null;
  const f = MAX_SCORE / 35;
  const low = Math.max(MIN_SCORE, Math.min(MAX_SCORE, roundScore((k - 0.5) * f)));
  const high = Math.max(MIN_SCORE, Math.min(MAX_SCORE, Math.ceil((k + 0.5) * f - 0.5 - 1e-9)));
  return { low, high: Math.max(low, high) };
}
