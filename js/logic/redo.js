// Spaced redo scheduling. Pure functions over redo records.
// Sequence: new miss due in 3 days; each right moves the interval 3 -> 7 -> 14.
// Two consecutive rights at 14 days retire it. A wrong resets to 3 days;
// a second wrong (total) marks it persistent.
import { REDO } from '../data/act.js';
import { addDays, compareDates } from './dates.js';

const [FIRST] = REDO.intervals;
const MAX = REDO.intervals[REDO.intervals.length - 1];

export function createRedo(missId, createdDate) {
  return {
    missId,
    dueDate: addDays(createdDate, FIRST),
    interval: FIRST,
    streak: 0,
    rightsAtMax: 0,
    history: [],
    status: 'active',
  };
}

function nextInterval(current) {
  const i = REDO.intervals.indexOf(current);
  if (i === -1) return FIRST;
  return REDO.intervals[Math.min(i + 1, REDO.intervals.length - 1)];
}

export function wrongCount(redo) {
  return (redo.history || []).filter((h) => h.result === 'wrong').length;
}

export function rightCount(redo) {
  return (redo.history || []).filter((h) => h.result === 'right').length;
}

/** Record an answer and return the updated redo (input is not mutated). */
export function answerRedo(redo, result, date) {
  if (result !== 'right' && result !== 'wrong') throw new Error('result must be right or wrong');
  const r = {
    ...redo,
    history: [...(redo.history || []), { date, result }],
  };
  if (r.status === 'retired') return r;
  if (result === 'right') {
    const atMax = redo.interval === MAX;
    r.streak = (redo.streak || 0) + 1;
    r.rightsAtMax = atMax ? (redo.rightsAtMax || 0) + 1 : 0;
    if (r.rightsAtMax >= REDO.retireAfterRightsAtMax) {
      r.status = 'retired';
      r.dueDate = null;
      r.retiredOn = date;
      return r;
    }
    r.interval = atMax ? MAX : nextInterval(redo.interval);
    r.dueDate = addDays(date, r.interval);
    return r;
  }
  r.streak = 0;
  r.rightsAtMax = 0;
  r.interval = FIRST;
  r.dueDate = addDays(date, FIRST);
  if (wrongCount(r) >= REDO.persistentAfterWrongs) r.status = 'persistent';
  return r;
}

export function isOpen(redo) {
  return !!redo && redo.status !== 'retired';
}

export function isDue(redo, today) {
  return isOpen(redo) && !!redo.dueDate && compareDates(redo.dueDate, today) <= 0;
}

export function dueRedos(redos, today) {
  return redos
    .filter((r) => isDue(r, today))
    .sort((a, b) => compareDates(a.dueDate, b.dueDate) || String(a.missId).localeCompare(String(b.missId)));
}

/** Count of open redos due on or before each date in `dates`, cumulative, each counted once. */
export function dueByDate(redos, dates) {
  const sorted = [...dates].sort();
  const counts = {};
  const seen = new Set();
  for (const d of sorted) {
    let n = 0;
    for (const r of redos) {
      if (!isOpen(r) || !r.dueDate || seen.has(r.missId)) continue;
      if (compareDates(r.dueDate, d) <= 0) {
        seen.add(r.missId);
        n++;
      }
    }
    counts[d] = n;
  }
  return counts;
}

export function redoStats(redos) {
  const out = { active: 0, persistent: 0, retired: 0, answered: 0, right: 0 };
  for (const r of redos) {
    if (r.status === 'retired') out.retired++;
    else if (r.status === 'persistent') out.persistent++;
    else out.active++;
    for (const h of r.history || []) {
      out.answered++;
      if (h.result === 'right') out.right++;
    }
  }
  out.rightRate = out.answered ? out.right / out.answered : null;
  return out;
}
