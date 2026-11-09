// Randomized season simulation of the planning logic, checking invariants every day.
// Usage: npm run fuzz   (or node scripts/fuzz.js)
import { generateWeek, heavyNight, rescheduleTask, rescheduleProblem } from '../js/logic/planner.js';
import { computeFocus } from '../js/logic/focus.js';
import { createRedo, answerRedo } from '../js/logic/redo.js';
import { defaultSettings, december2026Preset } from '../js/data/calendar.js';
import { buildMaterials } from '../js/data/materials.js';
import { addDays, weekDates, compareDates } from '../js/logic/dates.js';
import { weekStartFor, isNoStudyDay, dayCapacity } from '../js/logic/phase.js';
import { topicsFor } from '../js/data/topics.js';
import { estimates } from '../js/logic/scoring.js';
import { trendSeries, topicTrends, coachStats } from '../js/logic/progress.js';

let seed = Number(process.argv[2] || 1);
const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
const pick = (a) => a[Math.floor(rnd() * a.length)];
const SECS = ['english', 'math', 'reading', 'science'];
const CAUSES = ['content', 'careless', 'time', 'trap'];
const problems = [];
const counts = { heavy: 0, resched: 0, fullDone: 0, tasks: 0, sets: 0, drills: 0 };
const fail = (day, msg, extra) => problems.push(`${day}: ${msg}${extra ? ' ' + JSON.stringify(extra).slice(0, 300) : ''}`);

function runSeason(variant) {
  const settings = { ...defaultSettings(), ...december2026Preset(), onboarded: true };
  if (variant.legacy) settings.legacyTests = { 'legacy-1': { name: 'L1' }, 'legacy-2': { name: 'L2' }, 'legacy-3': { name: 'L3' } };
  if (variant.guide) settings.prepGuide = { owned: true, tests: 2 };
  if (variant.zeroWeek) settings.availability = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
  if (variant.bigWeek) settings.availability = { 0: 240, 1: 120, 2: 120, 3: 120, 4: 120, 5: 120, 6: 300 };
  if (variant.april) settings.testDates = [...settings.testDates, { date: '2027-04-13', label: 'April school-day ACT' }];
  if (variant.noTests) settings.testDates = [];
  const attempts = variant.bench ? [{ id: 'b', date: '2026-11-07', kind: 'benchmark', scores: { english: 35, math: 35, reading: 33, science: 35 }, scale: 35 }] : [];
  const misses = [];
  let redos = [];
  let tasks = [];
  const materialUse = [];
  const pacing = [];
  let n = 0;
  const end = variant.long ? '2027-04-20' : '2026-12-20';
  for (let day = '2026-11-07'; compareDates(day, end) <= 0; day = addDays(day, 1)) {
    const ws = weekStartFor(day);
    const focus = computeFocus({ attempts, misses, redos, pacing, today: day });
    for (const s of Object.values(focus.bySection)) {
      if (!Number.isFinite(s.priority) || !Number.isFinite(s.weight)) fail(day, 'NaN in focus', s);
    }
    if (typeof focus.sentence !== 'string' || !focus.sentence) fail(day, 'no focus sentence');
    if (/undefined|NaN|null/.test(focus.sentence)) fail(day, 'bad sentence', focus.sentence);
    const input = { weekStart: ws, today: day, settings, focus, redos, materials: buildMaterials(settings), materialUse, attempts, existingTasks: tasks };
    const { tasks: week, notes } = generateWeek(input);
    const again = generateWeek(input);
    if (JSON.stringify(week) !== JSON.stringify(again.tasks)) fail(day, 'nondeterministic');
    const dates = weekDates(ws);
    const ids = new Set();
    for (const t of week) {
      if (ids.has(t.id)) fail(day, 'duplicate id', t.id);
      ids.add(t.id);
      if (!dates.includes(t.date)) fail(day, 'task outside week', t);
      if (!(Number(t.minutes) > 0) || !Number.isFinite(t.minutes)) fail(day, 'bad minutes', t);
      if (t.status === 'todo' && compareDates(t.date, day) >= 0 && isNoStudyDay(t.date, settings) && !t.pinned) fail(day, 'todo on no-study day', t);
      if (/undefined|NaN|\[object/.test(t.title + t.detail)) fail(day, 'bad text', t.title + ' | ' + t.detail);
    }
    for (const t of tasks.filter((x) => x.weekStart === ws && x.status !== 'todo')) {
      const after = week.find((x) => x.id === t.id);
      if (!after || JSON.stringify(after) !== JSON.stringify(t)) fail(day, 'kept task rewritten', t);
    }
    const fulls = {};
    for (const t of week.filter((x) => x.type === 'full_test' && x.status !== 'moved')) {
      fulls[t.date] = (fulls[t.date] || 0) + 1;
      if (fulls[t.date] > 1) fail(day, 'two full tests one day');
    }
    for (const nt of notes) if (/undefined|NaN/.test(nt)) fail(day, 'bad note', nt);
    counts.tasks += week.length;
    // Capacity: generated (non-fixed, non-pinned) todo work on a future day fits that day's time.
    for (const d of dates.filter((x) => compareDates(x, day) >= 0)) {
      const gen = week.filter((t) => t.date === d && t.status === 'todo' && !t.fixed && !t.pinned && t.origin === 'plan');
      const all = week.filter((t) => t.date === d && !t.dropped).reduce((a, t) => a + t.minutes, 0);
      if (gen.length && all > dayCapacity(d, settings) + 10 && !week.some((t) => t.date === d && (t.fixed || t.pinned || t.status !== 'todo'))) fail(day, 'over capacity', { d, all, cap: dayCapacity(d, settings) });
    }
    // Official enhanced tests only in full tests.
    for (const t of week) if (t.type !== 'full_test' && t.materialRef && ['enhanced-1', 'enhanced-2'].includes(t.materialRef.sourceId)) fail(day, 'official test used in drill', t);
    // Science at most one drill slot per week.
    const sci = week.filter((t) => t.section === 'science' && (t.type === 'drill' || t.type === 'section_set') && t.origin === 'plan' && t.status !== 'moved');
    if (sci.length > 1) fail(day, 'science >1 slot', sci.map((t) => t.id));
    counts.sets += week.filter((t) => t.type === 'section_set').length;
    counts.drills += week.filter((t) => t.type === 'drill').length;
    tasks = [...tasks.filter((x) => x.weekStart !== ws), ...week];

    // Today's actions.
    const tonight = tasks.filter((t) => t.date === day && t.status === 'todo');
    const r = rnd();
    if (r < 0.1 && tonight.length) {
      const res = heavyNight({ tasks: tasks.filter((t) => t.weekStart === ws), today: day, settings: { ...settings, heavyNights: [...settings.heavyNights, day] }, weekStart: ws });
      settings.heavyNights = [...settings.heavyNights, day];
      counts.heavy++;
      for (const t of res.tasks) {
        if (!dates.includes(t.date)) fail(day, 'heavy night left week', t);
        if (t.status === 'todo' && t.date === day && !t.fixed) fail(day, 'heavy night left tonight todo', t);
        if (t.status === 'todo' && compareDates(t.date, day) > 0 && isNoStudyDay(t.date, settings)) fail(day, 'heavy night into no-study', t);
      }
      tasks = [...tasks.filter((x) => x.weekStart !== ws), ...res.tasks];
    } else {
      for (const t of tonight) {
        const x = rnd();
        if (x < 0.6) t.status = 'done';
        else if (x < 0.75) t.status = 'skipped';
        else if (x < 0.85) {
          const to = addDays(day, 1 + Math.floor(rnd() * 9));
          if (!rescheduleProblem(t, to, day, settings) && t.type !== 'redo') {
            const res = rescheduleTask(t, to, settings);
            Object.assign(t, res.original);
            if (res.copy) tasks.push(res.copy);
            if (res.settingsPatch) Object.assign(settings, res.settingsPatch);
            counts.resched++;
          }
        }
        if (t.status === 'done' && t.materialRef && t.materialRef.section) {
          for (const p of t.materialRef.parts || [null]) materialUse.push({ id: `${t.materialRef.sourceId}:${t.materialRef.section}:${p ?? 'all'}`, sourceId: t.materialRef.sourceId, section: t.materialRef.section, part: p });
        }
        if (t.type === 'full_test' && t.status === 'done') {
          counts.fullDone++;
          const scores = {};
          for (const s of SECS) scores[s] = 28 + Math.floor(rnd() * 9);
          attempts.push({ id: `a${++n}`, date: day, kind: 'official_enhanced', sourceId: t.materialRef.sourceId, scores, scale: 36 });
          for (const s of SECS) pacing.push({ attemptId: `a${n}`, section: s, notReached: Math.floor(rnd() * 3), guessedAtEnd: Math.floor(rnd() * 5), minutesLeft: 0 });
        }
      }
    }
    // Random misses and redo answers.
    const nm = Math.floor(rnd() * 3);
    for (let i = 0; i < nm; i++) {
      const section = pick(SECS);
      const m = { id: `m${++n}`, section, topic: pick(topicsFor(section)), cause: pick(CAUSES), guessedRight: rnd() < 0.1, date: day, createdAt: `${day}T12:00:00Z` };
      misses.push(m);
      redos.push(createRedo(m.id, day));
    }
    redos = redos.map((rd) => (rd.status !== 'retired' && rd.dueDate && compareDates(rd.dueDate, day) <= 0 && rnd() < 0.7 ? answerRedo(rd, rnd() < 0.7 ? 'right' : 'wrong', day) : rd));
    for (const rd of redos) {
      if (rd.status !== 'retired' && !rd.dueDate) fail(day, 'open redo without due date', rd);
      if (rd.interval && ![3, 7, 14].includes(rd.interval)) fail(day, 'bad interval', rd);
    }
    // Progress pieces must not throw.
    try {
      trendSeries(attempts);
      topicTrends({ attempts, misses, redos, pacing, today: day });
      const cs = coachStats({ settings, attempts, misses, redos, pacing, tasks, today: day });
      if (/NaN/.test(JSON.stringify(cs))) fail(day, 'NaN in coach stats');
    } catch (e) {
      fail(day, 'progress threw ' + e.message);
    }
    const est = estimates(attempts);
    for (const s of SECS) if (est[s] && !Number.isFinite(est[s].value)) fail(day, 'bad estimate', est[s]);
  }
  // A passage (source+section+part) is never assigned to two live tasks across the season.
  const seen = new Map();
  for (const t of tasks.slice().sort((a, b) => compareDates(a.date, b.date))) {
    if (!t.materialRef || !t.materialRef.section || t.status === 'moved' || t.status === 'skipped' || t.origin !== 'plan') continue;
    const m = buildMaterials(settings).find((x) => x.sourceId === t.materialRef.sourceId);
    if (!m || !m.fullLength) continue;
    for (const p of t.materialRef.parts || ['all']) {
      const k = `${t.materialRef.sourceId}|${t.materialRef.section}|${p}`;
      if (seen.has(k) && seen.get(k).id !== t.id && seen.get(k).status === 'done') fail('season', 'passage reused after done', [k, seen.get(k).id, t.id]);
      if (!seen.has(k) || t.status === 'done') seen.set(k, t);
    }
  }
  return { tasks: tasks.length, misses: misses.length };
}

const variants = [
  {}, { bench: true }, { bench: true, legacy: true }, { legacy: true, guide: true, bigWeek: true },
  { zeroWeek: true, bench: true }, { april: true, long: true, bench: true, legacy: true }, { noTests: true, bench: true },
  { april: true, long: true, guide: true },
];
for (let s = 1; s <= 6; s++) {
  for (const v of variants) {
    seed = s * 7919 + 13;
    try {
      runSeason(v);
    } catch (e) {
      problems.push(`seed ${s} ${JSON.stringify(v)}: threw ${e.stack.split('\n').slice(0, 3).join(' | ')}`);
    }
  }
}
const uniq = [...new Set(problems.map((p) => p.replace(/^\d{4}-\d{2}-\d{2}: /, '')))];
console.log(`problems: ${problems.length}, distinct: ${uniq.length}`, counts);
for (const p of uniq.slice(0, 25)) console.log(' -', p);
process.exit(problems.length ? 1 : 0);
