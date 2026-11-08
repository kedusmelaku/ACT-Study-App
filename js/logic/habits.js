// Habit checks: patterns in how the plan is going, found from the data (not AI). Pure.
import { addDays, compareDates, dayOfWeek, daysBetween } from './dates.js';
import { dayCapacity } from './phase.js';
import { dueRedos } from './redo.js';
import { DAY_NAMES } from '../data/calendar.js';

const WINDOW = 14;

/**
 * Returns habits worth flagging, most important first:
 * [{ id, title, detail, suggestion?: { type: 'availability', day, minutes } }]
 */
export function detectHabits({ tasks = [], settings = {}, misses = [], redos = [], today }) {
  const out = [];
  const from = addDays(today, -WINDOW);
  const past = tasks.filter((t) => compareDates(t.date, from) >= 0 && compareDates(t.date, today) < 0);

  // Skipping a lot (dropped by Heavy night counts too).
  const done = past.filter((t) => t.status === 'done').length;
  const skipped = past.filter((t) => t.status === 'skipped').length;
  if (done + skipped >= 5 && skipped / (done + skipped) >= 0.3) {
    out.push({
      id: 'skipping',
      weight: 5,
      title: `You skipped ${skipped} of your last ${done + skipped} tasks`,
      detail: 'If nights are too full, lower your study time in Settings so the plan fits.',
    });
  }

  // Tasks that were never marked done or skipped.
  const unmarked = past.filter((t) => t.status === 'todo').length;
  if (unmarked >= 4) {
    out.push({
      id: 'unmarked',
      weight: 3,
      title: `${unmarked} past tasks were never checked off`,
      detail: 'Mark them done or skipped so the plan knows what you actually did.',
    });
  }

  // One weekday that keeps getting skipped, moved, or cleared.
  const since28 = addDays(today, -28);
  const byDay = [0, 0, 0, 0, 0, 0, 0];
  const seenDates = new Set();
  for (const t of tasks) {
    if (compareDates(t.date, since28) < 0 || compareDates(t.date, today) >= 0) continue;
    if ((t.status === 'skipped' || t.status === 'moved') && !seenDates.has(t.date)) {
      seenDates.add(t.date);
      byDay[dayOfWeek(t.date)]++;
    }
  }
  for (const d of settings.heavyNights || []) {
    if (compareDates(d, since28) >= 0 && compareDates(d, today) < 0 && !seenDates.has(d)) {
      seenDates.add(d);
      byDay[dayOfWeek(d)]++;
    }
  }
  const worst = byDay.indexOf(Math.max(...byDay));
  const avail = Number((settings.availability || {})[worst]) || 0;
  if (byDay[worst] >= 3 && avail > 0) {
    out.push({
      id: 'weekday',
      weight: 4,
      title: `${DAY_NAMES[worst]}s keep falling through`,
      detail: `${byDay[worst]} of the last 4 ${DAY_NAMES[worst]}s were skipped or moved. You could give that night less time.`,
      suggestion: { type: 'availability', day: worst, minutes: avail > 15 ? 15 : 0 },
    });
  }

  // Frequent heavy nights.
  const heavy = (settings.heavyNights || []).filter((d) => compareDates(d, from) >= 0 && compareDates(d, today) <= 0).length;
  if (heavy >= 3) {
    out.push({
      id: 'heavy',
      weight: 4,
      title: `${heavy} heavy nights in two weeks`,
      detail: 'Marking known busy days ahead of time in Settings keeps the week from piling up.',
    });
  }

  // Upcoming study days with more work than time (usually from rescheduling into a full day).
  // Days set to no study are left out: putting a task there is a deliberate choice.
  const over = [];
  for (let i = 0; i <= 6; i++) {
    const d = addDays(today, i);
    const cap = dayCapacity(d, settings);
    const list = tasks.filter((t) => t.date === d && t.status === 'todo' && !t.dropped);
    if (!cap || !list.length || list.some((t) => t.fixed)) continue;
    const mins = list.reduce((a, t) => a + (Number(t.minutes) || 0), 0);
    if (mins > cap + 15) over.push(d);
  }
  if (over.length >= 2) {
    out.push({
      id: 'overbooked',
      weight: 3,
      title: `${over.length} days have more work than time`,
      detail: 'Usually from rescheduling into full days. Spread moved tasks out, or give those days more time.',
    });
  }

  // Redos piling up.
  const due = dueRedos(redos, today).length;
  if (due >= 10) {
    out.push({
      id: 'redos',
      weight: 4,
      title: `${due} redos are waiting`,
      detail: 'A few each night keeps them from piling up.',
    });
  }

  // Untagged misses.
  const untagged = misses.filter((m) => !m.topic).length;
  if (untagged >= 3) {
    out.push({
      id: 'untagged',
      weight: 2,
      title: `${untagged} misses have no topic`,
      detail: 'Tag them so the plan can target them.',
    });
  }

  // Doing tasks but logging no misses.
  const recentMisses = misses.filter((m) => daysBetween(String(m.date || m.createdAt || '').slice(0, 10) || today, today) <= 10).length;
  const recentDone = tasks.filter((t) => t.status === 'done' && compareDates(t.date, addDays(today, -10)) >= 0 && compareDates(t.date, today) <= 0 && (t.type === 'drill' || t.type === 'section_set')).length;
  if (recentDone >= 4 && recentMisses === 0) {
    out.push({
      id: 'no-misses',
      weight: 2,
      title: 'No misses logged in 10 days',
      detail: "You've been doing drills. Log what you miss so the plan keeps up.",
    });
  }

  return out.sort((a, b) => b.weight - a.weight).map(({ weight, ...h }) => h);
}
