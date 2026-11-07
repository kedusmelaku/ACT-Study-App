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
 * Current estimate per section: weighted average of the 3 most recent attempts with that section.
 * Weights: recency (1.0, 0.7, 0.5) times kind weight. 35-scale scores stay as-is but are flagged capped.
 * Returns { english: { value, score, capped, count, attemptIds } | null, ... }
 */
export function estimates(attempts = []) {
  const sorted = attempts.filter((a) => a && a.scores).slice().sort(byDateDesc);
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
      num += a.scores[s] * w;
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
