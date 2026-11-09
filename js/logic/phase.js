// Calendar phases: what kind of day a date is, and how many minutes it has. Pure functions.
import { TAPER, WEEK_START_DAY } from '../data/calendar.js';
import { dayOfWeek, daysBetween, weekStartOf, compareDates, isISODate, addDays } from './dates.js';

export function sortedTestDates(settings) {
  return (settings.testDates || [])
    .filter((t) => t && isISODate(t.date))
    .slice()
    .sort((a, b) => compareDates(a.date, b.date));
}

/** Earliest configured test on or after `date`. */
export function nextTest(settings, date) {
  return sortedTestDates(settings).find((t) => compareDates(t.date, date) >= 0) || null;
}

/** Most recent configured test strictly before `date`. */
export function lastTestBefore(settings, date) {
  const past = sortedTestDates(settings).filter((t) => compareDates(t.date, date) < 0);
  return past.length ? past[past.length - 1] : null;
}

export function fullTestOn(settings, date) {
  return (settings.fullTests || []).find((f) => f && f.date === date) || null;
}

/**
 * Phase of a single day.
 * kind: 'build' | 'fulltest' | 'taper-weekend' | 'review' | 'logistics' | 'testday' | 'open'
 */
export function dayPhase(date, settings) {
  const target = nextTest(settings, date);
  if (!target) {
    const ft = fullTestOn(settings, date);
    return { kind: ft ? 'fulltest' : 'open', target: null, daysToTest: null, fullTest: ft };
  }
  const d = daysBetween(date, target.date);
  if (d === 0) return { kind: 'testday', target, daysToTest: 0, fullTest: null };
  if (TAPER.logisticsDays.includes(d)) return { kind: 'logistics', target, daysToTest: d, fullTest: null };
  if (TAPER.reviewDays.includes(d)) return { kind: 'review', target, daysToTest: d, fullTest: null };
  if (TAPER.weekendDays.includes(d)) return { kind: 'taper-weekend', target, daysToTest: d, fullTest: null };
  const ft = fullTestOn(settings, date);
  return { kind: ft ? 'fulltest' : 'build', target, daysToTest: d, fullTest: ft };
}

/** Days where study tasks may never be placed. */
export function isNoStudyDay(date, settings) {
  const k = dayPhase(date, settings).kind;
  return k === 'logistics' || k === 'testday';
}

/** Minutes available for study on a date, before phase rules. */
export function baseCapacity(date, settings) {
  if ((settings.heavyNights || []).includes(date)) return 0;
  const busy = settings.busyDates || {};
  if (Object.prototype.hasOwnProperty.call(busy, date)) return Math.max(0, Number(busy[date]) || 0);
  const avail = Number((settings.availability || {})[dayOfWeek(date)]) || 0;
  const high = settings.highAvailability || {};
  if (Object.prototype.hasOwnProperty.call(high, date)) return Math.max(avail, Number(high[date]) || 0);
  return Math.max(0, avail);
}

/** Minutes available after phase rules (no study on logistics days or test day). */
export function dayCapacity(date, settings) {
  if (isNoStudyDay(date, settings)) return 0;
  return baseCapacity(date, settings);
}

export function weekStartFor(date) {
  return weekStartOf(date, WEEK_START_DAY);
}

export function weekLabel(weekStart, settings) {
  const labels = settings.weekLabels || {};
  if (labels[weekStart]) return labels[weekStart];
  const target = nextTest(settings, weekStart);
  if (!target) return 'Open training';
  const d = daysBetween(weekStart, target.date);
  if (d <= 7) return d <= 0 ? 'Test week' : 'Taper week';
  const weeks = Math.ceil(d / 7);
  return `${weeks} weeks to ${target.label || 'your test'}`;
}

/** True when the date is inside the taper (7 days before a test through the test). */
export function inTaper(date, settings) {
  const k = dayPhase(date, settings).kind;
  return k === 'taper-weekend' || k === 'review' || k === 'logistics' || k === 'testday';
}

/** The most recent past test that still has no real scores logged, if any. */
export function pendingRealScores(settings, attempts, today) {
  const prev = lastTestBefore(settings, today);
  if (!prev) return null;
  return hasRealOnOrAfter(attempts, prev.date) ? null : prev;
}

function hasRealOnOrAfter(attempts, date) {
  return attempts.some((a) => a.kind === 'real' && compareDates(a.date, date) >= 0);
}

/**
 * Full-test days for a new test date: the first Saturday from today (a diagnostic), and the Saturday
 * two weeks before the taper. Only days at least 10 days apart and before the taper are kept.
 * sourceIds are suggestions; the planner swaps in the next unused full test if one is used up.
 */
export function defaultFullTests(testDate, today, sourceIds = ['enhanced-1', 'enhanced-2']) {
  if (!isISODate(testDate) || compareDates(testDate, today) <= 0) return [];
  const taperStart = addDays(testDate, -7);
  const firstSat = addDays(today, (6 - dayOfWeek(today) + 7) % 7);
  const out = [];
  if (compareDates(firstSat, taperStart) < 0) out.push({ date: firstSat, sourceId: sourceIds[0] || null });
  const second = weekStartOf(addDays(taperStart, -7), WEEK_START_DAY);
  if (compareDates(second, today) >= 0 && compareDates(second, taperStart) < 0 && (!out.length || daysBetween(out[0].date, second) >= 10)) {
    out.push({ date: second, sourceId: sourceIds[out.length] || null });
  }
  return out;
}
