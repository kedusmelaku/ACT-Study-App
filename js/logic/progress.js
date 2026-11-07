// Progress data: trend series, topic trends, and the aggregated stats sent to the weekly coach. Pure.
import { ALL_SECTIONS, CORE_SECTIONS, CAUSE_KEYS, CAUSES, FOCUS } from '../data/act.js';
import { estimates, estimatedComposite, compositeOf } from './scoring.js';
import { computeFocus, missDate } from './focus.js';
import { addDays, compareDates, daysBetween, ageInDays, dateOf } from './dates.js';
import { redoStats } from './redo.js';
import { completionRate } from './planner.js';
import { nextTest, dayPhase } from './phase.js';

/** Attempts in date order with the estimated composite as of each one. */
export function trendSeries(attempts) {
  const sorted = attempts
    .filter((a) => a && a.scores)
    .slice()
    .sort((a, b) => compareDates(a.date, b.date) || String(a.createdAt || '').localeCompare(String(b.createdAt || '')) || String(a.id).localeCompare(String(b.id)));
  return sorted.map((a, i) => {
    const upTo = sorted.slice(0, i + 1);
    return {
      id: a.id,
      date: a.date,
      kind: a.kind,
      real: a.kind === 'real',
      scores: { ...a.scores },
      composite: compositeOf(a.scores),
      estComposite: estimatedComposite(estimates(upTo)),
    };
  });
}

/**
 * Top topics by weight now, with direction versus 7 days ago.
 * trend: 'worse' (weight up), 'better' (weight down), 'new', or 'flat'.
 */
export function topicTrends({ attempts, misses, redos, pacing, today }, limit = 5) {
  const now = computeFocus({ attempts, misses, redos, pacing, today });
  const past = addDays(today, -7);
  const pastMisses = misses.filter((m) => compareDates(missDate(m), past) <= 0);
  const pastRedos = redos.map((r) => ({ ...r, history: (r.history || []).filter((h) => compareDates(h.date, past) <= 0), status: r.retiredOn && compareDates(r.retiredOn, past) > 0 ? 'active' : r.status }));
  const before = computeFocus({ attempts: attempts.filter((a) => compareDates(a.date, past) <= 0), misses: pastMisses, redos: pastRedos, pacing, today: past });
  const prev = new Map();
  for (const s of ALL_SECTIONS) for (const t of before.bySection[s].topics) prev.set(`${s}|${t.topic}`, t.weight);
  const all = [];
  for (const s of ALL_SECTIONS) for (const t of now.bySection[s].topics) all.push({ section: s, topic: t.topic, weight: t.weight });
  all.sort((a, b) => b.weight - a.weight || a.topic.localeCompare(b.topic));
  return all.slice(0, limit).map((t) => {
    const p = prev.get(`${t.section}|${t.topic}`);
    let trend = 'flat';
    if (p === undefined || p < 1e-6) trend = 'new';
    else if (t.weight > p * 1.1) trend = 'worse';
    else if (t.weight < p * 0.9) trend = 'better';
    return { ...t, previous: p ?? 0, trend };
  });
}

export function causeSplit(misses, today, days = FOCUS.dominantCauseWindowDays) {
  const out = {};
  for (const s of ALL_SECTIONS) out[s] = { total: 0, content: 0, careless: 0, time: 0, trap: 0 };
  for (const m of misses) {
    if (!out[m.section] || ageInDays(missDate(m), today) > days) continue;
    const c = CAUSES[m.cause] ? m.cause : 'content';
    out[m.section][c]++;
    out[m.section].total++;
  }
  return out;
}

const round2 = (x) => Math.round(x * 100) / 100;

/** Aggregated numbers only: no question text, notes, or images. */
export function coachStats({ settings, attempts, misses, redos, pacing, tasks, today }) {
  const focus = computeFocus({ attempts, misses, redos, pacing, today });
  const target = nextTest(settings, today);
  const recentTasks = tasks.filter((t) => ageInDays(t.date, today) <= 14 && compareDates(t.date, today) <= 0);
  const sections = {};
  for (const s of ALL_SECTIONS) {
    const info = focus.bySection[s];
    sections[s] = {
      estimate: info.estimate ? info.estimate.score : null,
      cappedAt35: info.estimate ? info.estimate.capped : false,
      pointsToRaiseComposite: CORE_SECTIONS.includes(s) && Number.isFinite(info.pointsNeeded) ? info.pointsNeeded : null,
      leverage: round2(info.leverage),
      weakness: round2(info.weakness),
      priority: round2(info.priority),
      dominantCause: info.dominantCause,
      timingFlag: info.timingFlag,
    };
  }
  const split = causeSplit(misses, today);
  const causeTotals = Object.fromEntries(CAUSE_KEYS.map((c) => [c, ALL_SECTIONS.reduce((n, s) => n + split[s][c], 0)]));
  const rs = redoStats(redos);
  const rate = completionRate(recentTasks);
  return {
    today,
    daysLeft: target ? daysBetween(today, target.date) : null,
    nextTest: target ? target.label || 'ACT' : null,
    phase: dayPhase(today, settings).kind,
    estimatedComposite: focus.composite,
    focusSection: focus.top,
    sections,
    topTopics: topicTrends({ attempts, misses, redos, pacing, today }).map((t) => ({ section: t.section, topic: t.topic, weight: round2(t.weight), trend: t.trend })),
    causeSplitLast14Days: { bySection: split, total: causeTotals },
    redos: { active: rs.active, persistent: rs.persistent, retired: rs.retired, answered: rs.answered, rightRate: rs.rightRate === null ? null : round2(rs.rightRate) },
    planCompletionLast14Days: rate === null ? null : round2(rate),
    tasksLast14Days: { done: recentTasks.filter((t) => t.status === 'done').length, skipped: recentTasks.filter((t) => t.status === 'skipped').length, moved: recentTasks.filter((t) => t.status === 'moved').length },
    studyMinutesByWeekday: { ...settings.availability },
    attemptsLogged: attempts.length,
    lastAttemptDate: attempts.length ? attempts.map((a) => a.date).sort().slice(-1)[0] : null,
    missesLast14Days: misses.filter((m) => ageInDays(missDate(m), today) <= 14).length,
    lastBackupDaysAgo: settings.lastBackup ? ageInDays(dateOf(settings.lastBackup), today) : null,
  };
}
