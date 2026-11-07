// Focus engine: decides which section and topics matter most right now. Pure functions.
import { CORE_SECTIONS, CAUSES, CAUSE_KEYS, GUESSED_RIGHT_MULT, FOCUS, TIMING_FLAG, MAX_SCORE, SECTIONS } from '../data/act.js';
import { estimates, composite, estimatedComposite } from './scoring.js';
import { ageInDays, dateOf } from './dates.js';
import { rightCount } from './redo.js';

/** Exponential decay with a 10-day half-life. */
export function recencyDecay(ageDays) {
  return Math.pow(0.5, Math.max(0, ageDays) / FOCUS.halfLifeDays);
}

/** Date a miss happened: the attempt date if known, else when it was logged. */
export function missDate(miss) {
  return dateOf(miss.date || miss.createdAt);
}

export function causeMultiplier(miss) {
  if (miss.guessedRight) return GUESSED_RIGHT_MULT;
  return (CAUSES[miss.cause] || CAUSES.content).mult;
}

/** One miss's contribution to its topic weight, including redo effects. */
export function missWeight(miss, redo, today) {
  if (redo && redo.status === 'retired') return 0;
  let w = causeMultiplier(miss) * recencyDecay(ageInDays(missDate(miss), today));
  if (redo) {
    w *= Math.pow(1 - FOCUS.redoRightFactor, rightCount(redo));
    for (const h of redo.history || []) {
      if (h.result === 'wrong') w += FOCUS.redoWrongAdd * recencyDecay(ageInDays(h.date, today));
    }
    if (redo.status === 'persistent') w *= FOCUS.persistentBoost;
  }
  return w;
}

/**
 * Smallest k >= 1 such that raising section s by k (capped at 36) raises the rounded composite.
 * Infinity if none. Null when the composite can't be computed.
 */
export function pointsNeeded(scores, s) {
  const base = composite(scores.english, scores.math, scores.reading);
  if (base === null) return null;
  const cur = scores[s];
  if (cur >= MAX_SCORE) return Infinity;
  for (let k = 1; cur + k <= MAX_SCORE; k++) {
    const raised = { ...scores, [s]: Math.min(MAX_SCORE, cur + k) };
    if (composite(raised.english, raised.math, raised.reading) > base) return k;
  }
  return Infinity;
}

export function leverageFrom(pn) {
  if (pn === null || pn === undefined || !Number.isFinite(pn)) return 0;
  return 1 / pn;
}

/** Whether a pacing record should flag timing. */
export function isTimingFlag(p) {
  if (!p) return false;
  return (Number(p.notReached) || 0) >= TIMING_FLAG.notReached || (Number(p.guessedAtEnd) || 0) >= TIMING_FLAG.guessedAtEnd;
}

function emptyCauses() {
  return Object.fromEntries(CAUSE_KEYS.map((c) => [c, 0]));
}

/**
 * Main entry. Inputs are plain arrays from storage.
 * Returns {
 *   estimates, composite, ranked: [sectionInfo...], bySection: {s: sectionInfo}, top, science, sentence, persistent
 * }
 */
export function computeFocus({ attempts = [], misses = [], redos = [], pacing = [], today }) {
  const est = estimates(attempts);
  const estComposite = estimatedComposite(est);
  const redoByMiss = new Map(redos.map((r) => [r.missId, r]));
  const attemptDate = new Map(attempts.map((a) => [a.id, a.date]));

  const scoreMap = {};
  for (const s of CORE_SECTIONS) scoreMap[s] = est[s] ? est[s].score : null;

  const info = {};
  for (const s of [...CORE_SECTIONS, 'science']) {
    info[s] = {
      section: s,
      estimate: est[s],
      pointsNeeded: null,
      leverage: 0,
      weight: 0,
      weakness: 0,
      priority: 0,
      topics: [],
      causeWeights: emptyCauses(),
      dominantCause: null,
      timingFlag: false,
      recentMisses: 0,
      persistent: 0,
    };
  }

  // Leverage (core only).
  for (const s of CORE_SECTIONS) {
    const pn = pointsNeeded(scoreMap, s);
    info[s].pointsNeeded = pn;
    info[s].leverage = leverageFrom(pn);
  }

  // Topic weights and causes.
  const topicMaps = {};
  for (const m of misses) {
    if (!m || !info[m.section]) continue;
    const redo = redoByMiss.get(m.id);
    const w = missWeight(m, redo, today);
    const sec = info[m.section];
    sec.weight += w;
    topicMaps[m.section] = topicMaps[m.section] || {};
    const topic = m.topic || 'Untagged';
    topicMaps[m.section][topic] = (topicMaps[m.section][topic] || 0) + w;
    const age = ageInDays(missDate(m), today);
    if (age <= FOCUS.dominantCauseWindowDays) {
      const cause = CAUSES[m.cause] ? m.cause : 'content';
      sec.causeWeights[cause] += w;
    }
    if (age <= FOCUS.recentScienceWindowDays) sec.recentMisses++;
    if (redo && redo.status === 'persistent') sec.persistent++;
  }

  // Pacing timing flags push weight toward `time`.
  for (const p of pacing) {
    if (!p || !info[p.section] || !isTimingFlag(p)) continue;
    const d = attemptDate.get(p.attemptId) || dateOf(p.date || p.createdAt);
    if (!d) continue;
    if (ageInDays(d, today) <= FOCUS.dominantCauseWindowDays) {
      info[p.section].timingFlag = true;
      info[p.section].causeWeights.time += FOCUS.timingFlagTimeWeight;
    }
  }

  for (const s of Object.keys(info)) {
    const sec = info[s];
    sec.topics = Object.entries(topicMaps[s] || {})
      .map(([topic, weight]) => ({ topic, weight }))
      .filter((t) => t.weight > 1e-9)
      .sort((a, b) => b.weight - a.weight || a.topic.localeCompare(b.topic));
    let best = null;
    for (const c of CAUSE_KEYS) {
      const v = sec.causeWeights[c];
      if (v > 1e-9 && (best === null || v > sec.causeWeights[best])) best = c;
    }
    sec.dominantCause = best;
  }

  // Weakness: share of total weight across core sections.
  const total = CORE_SECTIONS.reduce((sum, s) => sum + info[s].weight, 0);
  for (const s of CORE_SECTIONS) {
    info[s].weakness = total > 0 ? info[s].weight / total : 0;
    info[s].priority = FOCUS.leverageWeight * info[s].leverage + FOCUS.weaknessWeight * info[s].weakness;
  }

  const ranked = CORE_SECTIONS.map((s) => info[s]).sort(compareSections);
  const top = ranked[0];
  const hasData = ranked.some((r) => r.priority > 0);

  const persistent = redos.filter((r) => r.status === 'persistent').map((r) => r.missId);

  const result = {
    estimates: est,
    composite: estComposite,
    ranked,
    bySection: info,
    top: hasData ? top.section : null,
    science: info.science,
    persistent,
    hasData,
  };
  result.sentence = focusSentence(result);
  return result;
}

/** Higher priority first; ties go to the lower estimate (more room to grow), then section order. */
function compareSections(a, b) {
  if (Math.abs(b.priority - a.priority) > 1e-9) return b.priority - a.priority;
  const ea = a.estimate ? a.estimate.score : Infinity;
  const eb = b.estimate ? b.estimate.score : Infinity;
  if (ea !== eb) return ea - eb;
  return CORE_SECTIONS.indexOf(a.section) - CORE_SECTIONS.indexOf(b.section);
}

const NUMBER_WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
function numberWord(n) {
  return NUMBER_WORDS[n] || String(n);
}

const CAUSE_PHRASE = {
  content: 'gaps in content',
  careless: 'careless slips',
  time: 'running short on time',
  trap: 'trap answers',
};

/** One plain sentence explaining the focus, built from the engine's numbers. */
export function focusSentence(focus) {
  if (!focus.hasData || !focus.top) {
    return 'Log a practice test or a few misses and the app will pick your focus.';
  }
  const sec = focus.bySection[focus.top];
  const label = SECTIONS[sec.section].label;
  const pn = sec.pointsNeeded;
  const comp = focus.composite;
  const topTopic = sec.topics[0] ? sec.topics[0].topic.toLowerCase() : null;
  if (comp !== null && Number.isFinite(pn) && pn !== null && sec.leverage >= sec.weakness) {
    const pts = pn === 1 ? `one more ${label} point moves` : `${numberWord(pn)} more ${label} points move`;
    return `${label} is your focus: ${pts} your composite from ${comp} to ${comp + 1}.`;
  }
  const parts = [];
  if (topTopic) parts.push(`most of your weighted misses are there, led by ${topTopic}`);
  else parts.push('it carries the most weight in your recent misses');
  if (sec.dominantCause) parts.push(`mostly from ${CAUSE_PHRASE[sec.dominantCause]}`);
  return `${label} is your focus: ${parts.join(', ')}.`;
}
