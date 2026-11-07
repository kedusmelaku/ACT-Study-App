// Weekly plan generation and rescheduling. Pure and deterministic:
// the same inputs always produce the same plan.
import { SECTIONS, CORE_SECTIONS, ALL_SECTIONS, LEGACY_SECTIONS, ENHANCED_PARTS, FULL_TEST_BREAK_MINUTES, FOCUS, REDO, minutesAtPace } from '../data/act.js';
import { weekDates, compareDates } from './dates.js';
import { dayPhase, dayCapacity, isNoStudyDay } from './phase.js';
import { dueByDate } from './redo.js';

const MIN_SLOT = 15;
const BLOCK_MIN = 90;
const BLOCK_SLOT_TARGET = 40;
const SET_REVIEW_MINUTES = 10;
const LOG_TEST_MINUTES = 20;

const PRIORITY = {
  full_test: 10,
  log_test: 3,
  redo: 2,
  review: 1,
  science: 0.05,
};

const CHECK_HABIT = {
  english: 'Reread the full sentence with your chosen answer before moving on.',
  math: 'Plug your answer back into the question before moving on.',
  reading: 'Point to the line that proves the answer before you choose it.',
  science: 'Point to the figure or table value that proves the answer before you choose it.',
};

// ---------------------------------------------------------------- materials

function partsFor(material, section) {
  if (material.format === 'legacy') return LEGACY_SECTIONS[section].parts;
  return ENHANCED_PARTS[section];
}

function questionsFor(material, section) {
  if (material.format === 'legacy') return LEGACY_SECTIONS[section].questions;
  return SECTIONS[section].questions;
}

function partQuestions(material, section) {
  return Math.round(questionsFor(material, section) / partsFor(material, section));
}

function partLabel(material, section, parts) {
  if (section === 'math') {
    const per = partQuestions(material, section);
    const total = questionsFor(material, section);
    const a = (parts[0] - 1) * per + 1;
    const b = Math.min(total, parts[parts.length - 1] * per);
    return `questions ${a} to ${b}`;
  }
  if (parts.length === 1) return `passage ${parts[0]}`;
  if (parts.length === 2) return `passages ${parts[0]} and ${parts[1]}`;
  return `passages ${parts.slice(0, -1).join(', ')}, and ${parts[parts.length - 1]}`;
}

/** Tracks which sections and parts of test sources are used or reserved. */
class MaterialLedger {
  constructor(materials, materialUse, reservedRefs) {
    this.pool = materials
      .filter((m) => m.available && m.fullLength && !m.holdForFullTest)
      .slice()
      .sort((a, b) => formatRank(a) - formatRank(b) || a.sourceId.localeCompare(b.sourceId));
    this.whole = new Set();
    this.parts = new Set();
    for (const u of [...materialUse, ...reservedRefs]) this.mark(u);
  }
  mark(u) {
    if (!u || !u.sourceId || !u.section) return;
    const parts = Array.isArray(u.parts) ? u.parts : u.part ? [u.part] : null;
    if (parts) for (const p of parts) this.parts.add(`${u.sourceId}|${u.section}|${p}`);
    else this.whole.add(`${u.sourceId}|${u.section}`);
  }
  touched(m, section) {
    if (this.whole.has(`${m.sourceId}|${section}`)) return true;
    const n = partsFor(m, section);
    for (let p = 1; p <= n; p++) if (this.parts.has(`${m.sourceId}|${section}|${p}`)) return true;
    return false;
  }
  takeSection(section) {
    for (const m of this.pool) {
      if (!m.sections.includes(section) || this.touched(m, section)) continue;
      this.whole.add(`${m.sourceId}|${section}`);
      return m;
    }
    return null;
  }
  /** Up to `want` free parts of one section from the first source that has any. */
  takeParts(section, want) {
    for (const m of this.pool) {
      if (!m.sections.includes(section) || this.whole.has(`${m.sourceId}|${section}`)) continue;
      const n = partsFor(m, section);
      const got = [];
      for (let p = 1; p <= n && got.length < want; p++) {
        const k = `${m.sourceId}|${section}|${p}`;
        if (!this.parts.has(k)) {
          this.parts.add(k);
          got.push(p);
        }
      }
      if (got.length) return { material: m, parts: got };
    }
    return null;
  }
}

function formatRank(m) {
  if (m.format === 'enhanced') return 0;
  if (m.format === 'legacy') return 1;
  return 2;
}

/** Full-length sources in the order they should be used for full tests. */
function fullTestSource(preferredId, materials, usedSources) {
  const pref = materials.find((m) => m.sourceId === preferredId);
  if (pref && pref.available && !usedSources.has(pref.sourceId)) return pref;
  const pool = materials
    .filter((m) => m.available && m.fullLength && !usedSources.has(m.sourceId))
    .sort((a, b) => Number(!a.holdForFullTest) - Number(!b.holdForFullTest) || formatRank(a) - formatRank(b) || a.sourceId.localeCompare(b.sourceId));
  return pool[0] || null;
}

// ---------------------------------------------------------------- formatting helpers

function clock(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = Math.round(totalSeconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

/** Checkpoint times at one third, two thirds, and the end. */
export function checkpoints(section, questions) {
  const pace = SECTIONS[section].pace;
  const marks = [Math.round(questions / 3), Math.round((2 * questions) / 3), questions];
  return marks.map((q) => `Q${q} by ${clock(q * pace)}`).join(', ');
}

function sourceName(m) {
  return m.short || m.title;
}

function minutesFor(section, questions) {
  return minutesAtPace(section, questions);
}

// ---------------------------------------------------------------- allocation

/**
 * Split N drill slots among sections.
 * Top section gets at least half; any core section with weakness above 0.25 gets at least one;
 * the rest follows priority. Science gets at most one, only with recent misses.
 */
export function allocateSlots(n, focus, scienceEligible) {
  const counts = { english: 0, math: 0, reading: 0, science: 0 };
  if (n <= 0) return counts;
  const ranked = focus.ranked.map((r) => r.section);
  const sci = scienceEligible && n >= 3 ? 1 : 0;
  let left = n - sci;
  counts.science = sci;
  if (!focus.hasData) {
    for (let i = 0; left > 0; i++, left--) counts[ranked[i % ranked.length]]++;
    return counts;
  }
  const top = ranked[0];
  counts[top] = Math.ceil(left / 2);
  left -= counts[top];
  for (const s of ranked.slice(1)) {
    if (left > 0 && focus.bySection[s].weakness > FOCUS.minWeaknessForSlot) {
      counts[s]++;
      left--;
    }
  }
  if (left > 0) {
    // The top section already has its half, so leftovers go to the others by priority first.
    const others = ranked.slice(1);
    const pool = others.some((s) => focus.bySection[s].priority > 0) ? others : ranked;
    const pr = pool.map((s) => focus.bySection[s].priority);
    const sum = pr.reduce((a, b) => a + b, 0);
    if (sum <= 0) {
      for (let i = 0; left > 0; i++, left--) counts[pool[i % pool.length]]++;
    } else {
      const quotas = pool.map((s, i) => ({ s, i, q: (left * pr[i]) / sum }));
      let given = 0;
      for (const q of quotas) {
        const f = Math.floor(q.q);
        counts[q.s] += f;
        given += f;
      }
      const rest = quotas
        .map((q) => ({ ...q, r: q.q - Math.floor(q.q) }))
        .sort((a, b) => b.r - a.r || a.i - b.i);
      for (let k = 0; k < left - given; k++) counts[rest[k % rest.length].s]++;
    }
  }
  return counts;
}

/** Spread section labels so the same section rarely lands on back-to-back slots. */
export function spreadSequence(counts, order) {
  const rem = { ...counts };
  const seq = [];
  let last = null;
  let total = Object.values(rem).reduce((a, b) => a + b, 0);
  while (total > 0) {
    let pick = null;
    for (const s of order) {
      if (!rem[s]) continue;
      if (s === last && order.some((o) => o !== s && rem[o] > 0)) continue;
      if (pick === null || rem[s] > rem[pick]) pick = s;
    }
    seq.push(pick);
    rem[pick]--;
    last = pick;
    total--;
  }
  return seq;
}

// ---------------------------------------------------------------- task builders

function makeTask(base) {
  return {
    status: 'todo',
    origin: 'plan',
    materialRef: null,
    ...base,
  };
}

function setTaskFor(section, ledger, ctx, origin) {
  const m = ledger.takeSection(section);
  const label = SECTIONS[section].label;
  if (m) {
    const q = questionsFor(m, section);
    const mins = minutesFor(section, q);
    const legacyNote = m.format === 'legacy' ? ' This is a legacy section, so use the enhanced-pace time budget, not the printed limit.' : '';
    return {
      section,
      type: 'section_set',
      title: `${label} timed section: ${sourceName(m)}`,
      detail: `${q} questions in ${mins} minutes (enhanced pace, ${SECTIONS[section].pace} seconds each). Checkpoints: ${checkpoints(section, q)}.${legacyNote} Then check it and log every miss in the error log.`,
      materialRef: { sourceId: m.sourceId, section },
      minutes: mins + SET_REVIEW_MINUTES,
      origin,
    };
  }
  // No full section left: a QuizMe set as close to a real section as the time allows.
  const fit = Math.floor(((ctx.minutes - SET_REVIEW_MINUTES) * 60) / SECTIONS[section].pace);
  const q = Math.max(10, Math.min(SECTIONS[section].questions, fit));
  const mins = minutesFor(section, q);
  return {
    section,
    type: 'section_set',
    title: `${label} timed set on QuizMe`,
    detail: `No unused official ${label} section is left, so take ${q} QuizMe questions in ${mins} minutes at enhanced pace (${SECTIONS[section].pace} seconds each). Checkpoints: ${checkpoints(section, q)}. Add a legacy test in Settings to get full sections. Log every miss.`,
    materialRef: { sourceId: 'act-hub', section },
    minutes: mins + SET_REVIEW_MINUTES,
    origin,
  };
}

function drillTask(section, cause, topic, ledger, minutes) {
  const label = SECTIONS[section].label;
  const topicText = topic ? topic.toLowerCase() : null;
  const habit = CHECK_HABIT[section];

  // Content gaps in math go to Khan Academy; everything else prefers a real ACT passage.
  if (cause === 'content' && section === 'math') {
    return {
      section,
      type: 'drill',
      cause,
      topic,
      title: `Math topic drill: ${topicText || 'your weakest topic'}`,
      detail: `Work 10 to 15 Khan Academy practice questions on ${topicText || 'the topic you missed most'}. Then write a one-line rule card and save it as the fix line on the miss.`,
      materialRef: { sourceId: 'khan', section },
      minutes,
    };
  }

  const firstPool = ledger.pool.find((m) => m.sections.includes(section));
  const perPartMins = firstPool ? minutesFor(section, partQuestions(firstPool, section)) : 12;
  const want = Math.max(1, Math.min(3, Math.floor(minutes / (perPartMins + 8))));
  const got = ledger.takeParts(section, want);
  let where;
  let q;
  let mins;
  let ref;
  if (got) {
    q = partQuestions(got.material, section) * got.parts.length;
    if (section === 'math') q = Math.min(q, questionsFor(got.material, section) - (got.parts[0] - 1) * partQuestions(got.material, section));
    mins = minutesFor(section, q);
    where = `${partLabel(got.material, section, got.parts)} of ${sourceName(got.material)}`;
    ref = { sourceId: got.material.sourceId, section, parts: got.parts };
  } else {
    q = Math.max(5, Math.round(((minutes * 0.6) * 60) / SECTIONS[section].pace));
    mins = minutesFor(section, q);
    where = `a ${label} QuizMe quiz`;
    ref = { sourceId: 'act-hub', section };
  }
  const span = `${q} questions in ${mins} minutes`;
  // A real passage set takes its own time plus a short check; QuizMe sets fill the slot.
  if (got) minutes = Math.min(minutes, mins + 10);
  const topicBit = topicText ? ` Watch for ${topicText}.` : '';

  switch (cause) {
    case 'content':
      return {
        section,
        type: 'drill',
        cause,
        topic,
        title: `${label} topic drill: ${topicText || 'your weakest topic'}`,
        detail: `Do ${where}, ${span}.${topicBit} Then write a one-line rule card for ${topicText || 'what you missed'} and save it as the fix line on the miss.`,
        materialRef: ref,
        minutes,
      };
    case 'careless':
      return {
        section,
        type: 'drill',
        cause,
        topic,
        title: `${label} checking-habit set`,
        detail: `Do ${where}, ${span}. Habit: ${habit}${topicBit} Finish by redoing any ${label} misses due in Redo.`,
        materialRef: ref,
        minutes,
      };
    case 'time':
      return {
        section,
        type: 'drill',
        cause,
        topic,
        title: `${label} timed pacing drill`,
        detail: `Do ${where}, ${span} at enhanced pace. Write these checkpoints at the top first: ${checkpoints(section, q)}. If you fall behind, guess and move on.`,
        materialRef: ref,
        minutes,
      };
    case 'trap':
      return {
        section,
        type: 'drill',
        cause,
        topic,
        title: `${label} evidence drill`,
        detail: `Do ${where}, ${span}. For every answer, write the line number that proves it. Cross out choices that are extreme, or true but don't answer the question.${topicBit}`,
        materialRef: ref,
        minutes,
      };
    default:
      return {
        section,
        type: 'drill',
        cause: null,
        topic,
        title: `${label} mixed timed practice`,
        detail: `Do ${where}, ${span} at enhanced pace. Habit: ${habit} Log every miss with a topic and cause.`,
        materialRef: ref,
        minutes,
      };
  }
}

function redoTask(count) {
  return {
    section: null,
    type: 'redo',
    title: `Redo ${count} missed question${count === 1 ? '' : 's'}`,
    detail: 'Open Redo, find each question in the official test, answer it fresh, then reveal and mark it right or wrong.',
    minutes: count * REDO.minutesPerRedo,
    priority: PRIORITY.redo,
  };
}

function reviewTask(section, minutes) {
  const label = SECTIONS[section].label;
  return {
    section,
    type: 'review',
    title: `Error log review: ${label}`,
    detail: `Read every ${label} fix line and rule card. Pick 3 misses and explain the right answer out loud without looking. No new practice today.`,
    minutes,
    priority: PRIORITY.review,
  };
}

// ---------------------------------------------------------------- generation

function taskId(date, slot, type, section, taken) {
  let id = `t-${date}-${slot}-${type}${section ? '-' + section : ''}`;
  let n = 2;
  while (taken.has(id)) id = `t-${date}-${slot}-${type}${section ? '-' + section : ''}-${n++}`;
  taken.add(id);
  return id;
}

function keptMinutes(t) {
  if (t.status === 'moved' || t.dropped) return 0;
  return Number(t.minutes) || 0;
}

/**
 * Generate the plan for one week.
 * Inputs:
 *   weekStart, today, settings, focus (computeFocus result), redos, materials (buildMaterials),
 *   materialUse, attempts, existingTasks (all tasks, any week)
 * Returns { tasks, notes } where tasks is the full list for the week:
 *   kept tasks (done, skipped, moved, or dated before today) plus newly generated todo tasks.
 */
export function generateWeek({ weekStart, today, settings, focus, redos = [], materials = [], materialUse = [], attempts = [], existingTasks = [] }) {
  const dates = weekDates(weekStart);
  const inWeek = existingTasks.filter((t) => t.weekStart === weekStart);
  const kept = inWeek.filter((t) => t.status !== 'todo' || compareDates(t.date, today) < 0);
  const taken = new Set(kept.map((t) => t.id));
  const notes = [];

  const usedSources = new Set();
  for (const a of attempts) if (a.sourceId) usedSources.add(a.sourceId);
  const reserved = kept.filter((t) => t.materialRef && t.status !== 'skipped').map((t) => t.materialRef);
  const ledger = new MaterialLedger(materials, materialUse, reserved);
  // Sections used in logged attempts count as used.
  for (const a of attempts) {
    if (!a.sourceId) continue;
    for (const s of ALL_SECTIONS) if (a.scores && a.scores[s]) ledger.mark({ sourceId: a.sourceId, section: s });
  }

  const futureDates = dates.filter((d) => compareDates(d, today) >= 0);
  const remaining = {};
  for (const d of dates) {
    const used = kept.filter((t) => t.date === d).reduce((sum, t) => sum + keptMinutes(t), 0);
    remaining[d] = compareDates(d, today) < 0 ? 0 : Math.max(0, dayCapacity(d, settings) - used);
  }

  const out = [];
  const add = (date, slot, base, priority) => {
    const t = makeTask({ ...base, priority: base.priority ?? priority });
    t.id = taskId(date, slot, t.type, t.section, taken);
    t.weekStart = weekStart;
    t.date = date;
    t.slot = slot;
    out.push(t);
    return t;
  };

  const topSection = focus.top || focus.ranked[0].section;
  const sectionPriority = (s) => (s === 'science' ? PRIORITY.science : Math.round(focus.bySection[s].priority * 1000) / 1000);

  // 1. Fixed full tests.
  const fullTestDays = new Set();
  const logTaskFor = [];
  for (const d of dates) {
    const phase = dayPhase(d, settings);
    if (phase.kind !== 'fulltest') continue;
    const keptFull = kept.find((t) => t.date === d && t.type === 'full_test');
    if (keptFull) {
      fullTestDays.add(d);
      // A skipped full test has nothing to log, and its test stays unused for a later full-test day.
      if (keptFull.status !== 'skipped' && keptFull.materialRef && !usedSources.has(keptFull.materialRef.sourceId)) {
        logTaskFor.push({ date: d, sourceId: keptFull.materialRef.sourceId, title: keptFull.title });
      }
      continue;
    }
    if (compareDates(d, today) < 0) continue;
    const src = fullTestSource(phase.fullTest.sourceId, materials, usedSources);
    if (!src) {
      notes.push('No unused full-length test is left for the full-test day, so it became a regular study block.');
      continue;
    }
    usedSources.add(src.sourceId);
    fullTestDays.add(d);
    const mins = ALL_SECTIONS.reduce((sum, s) => sum + SECTIONS[s].minutes, 0) + FULL_TEST_BREAK_MINUTES;
    add(d, 0, {
      section: null,
      type: 'full_test',
      title: `Full timed test: ${src.title}`,
      detail: `All four sections, timed: ${ALL_SECTIONS.map((s) => `${SECTIONS[s].label} ${SECTIONS[s].minutes} min`).join(', ')}, with a ${FULL_TEST_BREAK_MINUTES} minute break after Math like test day. Use the PDF or the digital version. Then log it in Tests.`,
      materialRef: { sourceId: src.sourceId, section: null },
      minutes: mins,
      fixed: true,
    }, PRIORITY.full_test);
    remaining[d] = 0;
    logTaskFor.push({ date: d, sourceId: src.sourceId, title: src.title });
  }

  // 2. Day structures for the remaining future days.
  const redoCounts = dueByDate(redos, futureDates);
  let redoCarry = 0;
  const drillSlots = []; // { date, slot, minutes, kind: 'set' | 'drill' }
  const dayNext = {}; // next slot index per date
  let taperSetPlaced = kept.some((t) => t.type === 'section_set' && t.origin === 'taper');
  let reviewIndex = 0;

  for (const d of futureDates) {
    dayNext[d] = 1;
    const phase = dayPhase(d, settings);
    redoCarry += redoCounts[d] || 0;
    let cap = remaining[d];
    if (fullTestDays.has(d) || isNoStudyDay(d, settings) || cap < MIN_SLOT) continue;

    // Log the most recent full test first if it hasn't been logged.
    const pendingLog = logTaskFor.find((l) => compareDates(l.date, d) < 0 && !l.placed);
    if (pendingLog) {
      pendingLog.placed = true;
      add(d, dayNext[d]++, {
        section: null,
        type: 'log_test',
        title: `Log ${pendingLog.title}`,
        detail: 'Enter the section scores, tap every missed question, then tag each one with a topic and cause. Add pacing for each section.',
        minutes: LOG_TEST_MINUTES,
        materialRef: null,
        logSourceId: pendingLog.sourceId,
      }, PRIORITY.log_test);
      cap -= LOG_TEST_MINUTES;
    }

    if (phase.kind === 'taper-weekend') {
      if (!taperSetPlaced && cap >= MIN_SLOT) {
        taperSetPlaced = true;
        const base = setTaskFor(topSection, ledger, { minutes: cap }, 'taper');
        base.title = `Final timed set: ${base.title}`;
        add(d, dayNext[d]++, base, sectionPriority(topSection) + 0.2);
      }
      continue;
    }

    if (phase.kind === 'review') {
      if (redoCarry > 0 && cap >= MIN_SLOT) {
        const n = Math.min(redoCarry, Math.max(1, Math.floor((cap - 10) / REDO.minutesPerRedo)));
        add(d, dayNext[d]++, redoTask(n));
        redoCarry -= n;
        cap -= n * REDO.minutesPerRedo;
      }
      if (cap >= 10) {
        const reviewSections = [...focus.ranked.map((r) => r.section)];
        if (focus.science && focus.science.weight > 0) reviewSections.push('science');
        const s = reviewSections[reviewIndex % reviewSections.length];
        reviewIndex++;
        add(d, dayNext[d]++, reviewTask(s, cap));
      }
      continue;
    }

    // Build / open days.
    if (redoCarry > 0) {
      const maxRedo = cap < BLOCK_MIN ? Math.floor(cap / 2) : 30;
      const n = Math.min(redoCarry, Math.max(1, Math.floor(maxRedo / REDO.minutesPerRedo)));
      add(d, dayNext[d]++, redoTask(n));
      redoCarry -= n;
      cap -= n * REDO.minutesPerRedo;
    }
    if (cap < MIN_SLOT) continue;
    if (cap >= BLOCK_MIN) {
      const setLen = Math.min(cap, minutesFor(topSection, SECTIONS[topSection].questions) + SET_REVIEW_MINUTES);
      drillSlots.push({ date: d, minutes: setLen, kind: 'set' });
      let rest = cap - setLen;
      if (rest >= MIN_SLOT) {
        const n = Math.max(1, Math.round(rest / BLOCK_SLOT_TARGET));
        const each = Math.floor(rest / n / 5) * 5;
        for (let i = 0; i < n; i++) drillSlots.push({ date: d, minutes: each, kind: 'drill' });
      }
    } else {
      drillSlots.push({ date: d, minutes: cap, kind: 'drill' });
    }
  }

  // 3. Allocate drill slots to sections.
  const sci = focus.science;
  const scienceEligible = !!sci && sci.recentMisses > 0;
  const counts = allocateSlots(drillSlots.length, focus, scienceEligible);
  const order = [...focus.ranked.map((r) => r.section), 'science'];
  const assigned = new Array(drillSlots.length).fill(null);
  // Set slots go to the top section first, then the next sections with slots left.
  drillSlots.forEach((slot, i) => {
    if (slot.kind !== 'set') return;
    const s = order.find((x) => x !== 'science' && counts[x] > 0);
    if (!s) return;
    assigned[i] = s;
    counts[s]--;
  });
  const seq = spreadSequence(counts, order);
  let k = 0;
  drillSlots.forEach((slot, i) => {
    if (assigned[i] === null) assigned[i] = seq[k++] || null;
  });

  // 4. Build tasks for each slot.
  const topicIndex = { english: 0, math: 0, reading: 0, science: 0 };
  drillSlots.forEach((slot, i) => {
    const s = assigned[i];
    if (!s) return;
    const info = focus.bySection[s];
    if (slot.kind === 'set') {
      const base = setTaskFor(s, ledger, { minutes: slot.minutes }, 'plan');
      add(slot.date, dayNext[slot.date]++, base, sectionPriority(s) + 0.1);
      return;
    }
    const topics = info.topics.slice(0, 3);
    const topic = topics.length ? topics[topicIndex[s]++ % topics.length].topic : null;
    const base = drillTask(s, info.dominantCause, topic, ledger, slot.minutes);
    add(slot.date, dayNext[slot.date]++, base, sectionPriority(s));
  });

  if (!focus.hasData) notes.push('Log a test or a few misses so the plan can target your weak spots.');
  if (!materials.some((m) => m.available && m.fullLength && !m.holdForFullTest)) {
    notes.push('Add your legacy practice tests in Settings so drills can use real ACT passages.');
  }

  const tasks = [...kept, ...out].sort(compareTasks);
  return { tasks, notes };
}

export function compareTasks(a, b) {
  return compareDates(a.date, b.date) || (a.slot ?? 0) - (b.slot ?? 0) || String(a.id).localeCompare(String(b.id));
}

// ---------------------------------------------------------------- heavy night

/**
 * Heavy night: tonight's todo tasks become `moved`. The highest-priority ones are reinserted
 * into open time later this week. If the week overflows, the lowest-priority tasks are dropped.
 * Never moves into a no-study day (taper Thu/Fri, test day) or outside the week.
 * Returns { tasks, moved, placed, dropped, message }.
 */
export function heavyNight({ tasks, today, settings, weekStart }) {
  const dates = weekDates(weekStart);
  const later = dates.filter((d) => compareDates(d, today) > 0 && !isNoStudyDay(d, settings));
  const result = tasks.map((t) => ({ ...t }));
  const tonight = result.filter((t) => t.date === today && t.status === 'todo' && !t.fixed);
  if (!tonight.length) return { tasks: result, moved: [], placed: [], dropped: [], message: 'Nothing left to move tonight.' };

  for (const t of tonight) t.status = 'moved';

  const remaining = {};
  for (const d of later) {
    const used = result
      .filter((t) => t.date === d && (t.status === 'todo' || t.status === 'done') && !t.dropped)
      .reduce((s, t) => s + (Number(t.minutes) || 0), 0);
    remaining[d] = Math.max(0, dayCapacity(d, settings) - used);
  }

  const byPriority = (a, b) => (b.priority || 0) - (a.priority || 0) || compareDates(a.date, b.date) || String(a.id).localeCompare(String(b.id));
  const queue = tonight.slice().sort(byPriority);
  const placed = [];
  const dropped = [];

  for (const t of queue) {
    const mins = Number(t.minutes) || 0;
    let target = later.find((d) => remaining[d] >= mins);
    if (!target) {
      // Bump the lowest-priority future todo task that frees enough room.
      const candidates = result
        .filter((c) => later.includes(c.date) && c.status === 'todo' && !c.fixed && (c.priority || 0) < (t.priority || 0))
        .sort((a, b) => (a.priority || 0) - (b.priority || 0) || compareDates(b.date, a.date) || String(b.id).localeCompare(String(a.id)));
      const victim = candidates.find((c) => remaining[c.date] + (Number(c.minutes) || 0) >= mins);
      if (victim) {
        victim.status = 'skipped';
        victim.dropped = true;
        remaining[victim.date] += Number(victim.minutes) || 0;
        dropped.push(victim);
        target = victim.date;
      }
    }
    if (!target) {
      t.dropped = true;
      dropped.push(t);
      continue;
    }
    const nextSlot = Math.max(0, ...result.filter((x) => x.date === target).map((x) => x.slot ?? 0)) + 1;
    const copy = {
      ...t,
      id: `${t.id}-moved-${target}`,
      date: target,
      slot: nextSlot,
      status: 'todo',
      origin: 'moved',
      movedFrom: today,
    };
    delete copy.dropped;
    t.movedTo = target;
    remaining[target] -= mins;
    result.push(copy);
    placed.push(copy);
  }

  let message;
  if (!dropped.length) {
    message = placed.length ? `Moved ${placed.length} task${placed.length === 1 ? '' : 's'} to later this week.` : 'Tonight is cleared.';
  } else {
    const names = dropped.map((d) => d.title).join('; ');
    message = `The week is full, so ${dropped.length} lower-priority task${dropped.length === 1 ? ' was' : 's were'} dropped: ${names}.`;
  }
  return { tasks: result.sort(compareTasks), moved: tonight, placed, dropped, message };
}

/** Completion rate of tasks with a final status in a list. */
export function completionRate(tasks) {
  const closed = tasks.filter((t) => t.status === 'done' || t.status === 'skipped');
  if (!closed.length) return null;
  return closed.filter((t) => t.status === 'done').length / closed.length;
}

