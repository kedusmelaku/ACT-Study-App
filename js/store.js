// App state: loads everything from IndexedDB into memory, runs actions, and keeps the plan current.
import * as db from './db.js';
import { defaultSettings } from './data/calendar.js';
import { buildMaterials } from './data/materials.js';
import { ALL_SECTIONS } from './data/act.js';
import { computeFocus } from './logic/focus.js';
import { generateWeek, heavyNight as planHeavyNight } from './logic/planner.js';
import { createRedo, answerRedo as logicAnswerRedo } from './logic/redo.js';
import { todayISO, isISODate, dateOf } from './logic/dates.js';
import { weekStartFor } from './logic/phase.js';

export const state = {
  ready: false,
  settings: null,
  attempts: [],
  pacing: [],
  misses: [],
  redos: [],
  tasks: [],
  materialUse: [],
  coachNotes: [],
};

const listeners = new Set();
export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
function emit() {
  cache.focus = null;
  for (const fn of listeners) {
    try {
      fn();
    } catch (e) {
      console.error(e);
    }
  }
}

// ---------------------------------------------------------------- dates

let todayOverride = null;
/** Lets the app be checked on a specific date with ?today=YYYY-MM-DD. */
export function setTodayOverride(d) {
  todayOverride = isISODate(d) ? d : null;
}
export function today() {
  return todayOverride || todayISO();
}
export function nowISO() {
  if (!todayOverride) return new Date().toISOString();
  return `${todayOverride}T${new Date().toISOString().slice(11)}`;
}
export function currentWeekStart() {
  return weekStartFor(today());
}

export function newId(prefix) {
  const rand = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  return `${prefix}-${rand}`;
}

// ---------------------------------------------------------------- derived data

const cache = { focus: null };

export function materials() {
  return buildMaterials(state.settings || {});
}

export function focus() {
  if (!cache.focus) {
    cache.focus = computeFocus({
      attempts: state.attempts,
      misses: state.misses,
      redos: state.redos,
      pacing: state.pacing,
      today: today(),
    });
  }
  return cache.focus;
}

export function redoFor(missId) {
  return state.redos.find((r) => r.missId === missId) || null;
}

export function weekTasks(weekStart = currentWeekStart()) {
  return state.tasks.filter((t) => t.weekStart === weekStart);
}

// ---------------------------------------------------------------- init

function withDefaults(s) {
  const d = defaultSettings();
  const out = { ...d, ...(s || {}) };
  // Fill nested defaults that older records may lack.
  out.availability = { ...d.availability, ...(s && s.availability) };
  out.prepGuide = { ...d.prepGuide, ...(s && s.prepGuide) };
  return out;
}

export async function init() {
  const all = await db.loadAll();
  for (const k of Object.keys(all)) if (k !== 'settings') state[k] = all[k];
  const stored = all.settings.find((s) => s.id === 'settings');
  state.settings = withDefaults(stored);
  if (!stored) await db.put('settings', state.settings);
  state.ready = true;
  await ensureWeek();
  emit();
}

async function reloadFromDB() {
  const all = await db.loadAll();
  for (const k of Object.keys(all)) if (k !== 'settings') state[k] = all[k];
  state.settings = withDefaults(all.settings.find((s) => s.id === 'settings'));
  await db.put('settings', state.settings);
}

// ---------------------------------------------------------------- plan

/** Regenerate the current week. Done and skipped tasks are never rewritten. */
export async function regenerate() {
  const weekStart = currentWeekStart();
  const { tasks, notes } = generateWeek({
    weekStart,
    today: today(),
    settings: state.settings,
    focus: focus(),
    redos: state.redos,
    materials: materials(),
    materialUse: state.materialUse,
    attempts: state.attempts,
    existingTasks: state.tasks,
  });
  const before = state.tasks.filter((t) => t.weekStart === weekStart);
  const keep = new Set(tasks.map((t) => t.id));
  const ops = [];
  for (const t of before) if (!keep.has(t.id)) ops.push({ store: 'tasks', type: 'delete', key: t.id });
  for (const t of tasks) ops.push({ store: 'tasks', type: 'put', value: t });
  state.settings = { ...state.settings, planWeek: weekStart, planNotes: notes };
  ops.push({ store: 'settings', type: 'put', value: state.settings });
  await db.batch(ops);
  state.tasks = [...state.tasks.filter((t) => t.weekStart !== weekStart), ...tasks];
}

/** Called on start and on focus: a new week regenerates the plan. */
export async function ensureWeek() {
  if (!state.settings || !state.settings.onboarded) return false;
  const ws = currentWeekStart();
  const hasWeek = state.tasks.some((t) => t.weekStart === ws);
  if (state.settings.planWeek !== ws || !hasWeek) {
    await regenerate();
    emit();
    return true;
  }
  return false;
}

async function regenerateAndEmit() {
  if (state.settings.onboarded) await regenerate();
  emit();
}

// ---------------------------------------------------------------- settings

export async function saveSettings(patch, { regen = false } = {}) {
  state.settings = { ...state.settings, ...patch };
  await db.put('settings', state.settings);
  if (regen) await regenerateAndEmit();
  else emit();
}

// ---------------------------------------------------------------- attempts

function materialUseForAttempt(attempt) {
  if (!attempt.sourceId) return [];
  return ALL_SECTIONS.filter((s) => attempt.scores && attempt.scores[s]).map((s) => ({
    id: `${attempt.sourceId}:${s}:all`,
    sourceId: attempt.sourceId,
    section: s,
    usedOn: attempt.date,
    attemptId: attempt.id,
  }));
}

function cleanMiss(m) {
  return {
    id: m.id,
    attemptId: m.attemptId || null,
    sourceId: m.sourceId || null,
    section: m.section,
    questionNumber: m.questionNumber ? Number(m.questionNumber) : null,
    topic: m.topic || '',
    cause: m.cause || 'content',
    myAnswer: m.myAnswer || '',
    correctAnswer: m.correctAnswer || '',
    note: m.note || '',
    fixLine: m.fixLine || '',
    guessedRight: !!m.guessedRight,
    date: m.date || dateOf(m.createdAt) || today(),
    createdAt: m.createdAt || nowISO(),
    explanation: m.explanation || null,
  };
}

/**
 * Save a test: the attempt, pacing per section, and tagged misses (each gets a redo).
 * Replaces misses and pacing previously saved for the same attempt id.
 */
export async function saveAttempt({ attempt, pacing = [], misses = [] }) {
  const ops = [{ store: 'attempts', type: 'put', value: attempt }];
  const oldPacing = state.pacing.filter((p) => p.attemptId === attempt.id);
  for (const p of oldPacing) ops.push({ store: 'pacing', type: 'delete', key: p.id });
  const newPacing = pacing.map((p) => ({ ...p, id: `${attempt.id}:${p.section}`, attemptId: attempt.id }));
  for (const p of newPacing) ops.push({ store: 'pacing', type: 'put', value: p });

  const existingMisses = state.misses.filter((m) => m.attemptId === attempt.id);
  const incomingIds = new Set(misses.map((m) => m.id));
  const removed = existingMisses.filter((m) => !incomingIds.has(m.id));
  for (const m of removed) {
    ops.push({ store: 'misses', type: 'delete', key: m.id });
    ops.push({ store: 'redos', type: 'delete', key: m.id });
  }
  const savedMisses = misses.map((m) => cleanMiss({ ...m, attemptId: attempt.id, sourceId: attempt.sourceId, date: attempt.date }));
  const newRedos = [];
  for (const m of savedMisses) {
    ops.push({ store: 'misses', type: 'put', value: m });
    if (!redoFor(m.id)) {
      const r = createRedo(m.id, m.date > today() ? m.date : today());
      newRedos.push(r);
      ops.push({ store: 'redos', type: 'put', value: r });
    }
  }
  const use = materialUseForAttempt(attempt);
  for (const u of state.materialUse.filter((u) => u.attemptId === attempt.id)) ops.push({ store: 'materialUse', type: 'delete', key: u.id });
  for (const u of use) ops.push({ store: 'materialUse', type: 'put', value: u });

  // A logged full test marks its plan task done.
  const doneTasks = [];
  if (attempt.sourceId) {
    for (const t of state.tasks) {
      if (t.type === 'full_test' && t.status === 'todo' && t.materialRef && t.materialRef.sourceId === attempt.sourceId) {
        doneTasks.push({ ...t, status: 'done' });
      }
      if (t.type === 'log_test' && t.status === 'todo' && t.logSourceId === attempt.sourceId) doneTasks.push({ ...t, status: 'done' });
    }
  }
  for (const t of doneTasks) ops.push({ store: 'tasks', type: 'put', value: t });

  await db.batch(ops);
  state.attempts = [...state.attempts.filter((a) => a.id !== attempt.id), attempt];
  state.pacing = [...state.pacing.filter((p) => p.attemptId !== attempt.id), ...newPacing];
  const removedIds = new Set(removed.map((m) => m.id));
  state.misses = [...state.misses.filter((m) => m.attemptId !== attempt.id && !incomingIds.has(m.id)), ...savedMisses];
  state.redos = [...state.redos.filter((r) => !removedIds.has(r.missId)), ...newRedos];
  state.materialUse = [...state.materialUse.filter((u) => u.attemptId !== attempt.id), ...use];
  const doneIds = new Map(doneTasks.map((t) => [t.id, t]));
  state.tasks = state.tasks.map((t) => doneIds.get(t.id) || t);
  await regenerateAndEmit();
}

/** Delete an attempt with its pacing and misses. Returns an undo function. */
export async function deleteAttempt(id) {
  const attempt = state.attempts.find((a) => a.id === id);
  if (!attempt) return null;
  const pacing = state.pacing.filter((p) => p.attemptId === id);
  const misses = state.misses.filter((m) => m.attemptId === id);
  const missIds = new Set(misses.map((m) => m.id));
  const redos = state.redos.filter((r) => missIds.has(r.missId));
  const use = state.materialUse.filter((u) => u.attemptId === id);
  const ops = [{ store: 'attempts', type: 'delete', key: id }];
  for (const p of pacing) ops.push({ store: 'pacing', type: 'delete', key: p.id });
  for (const m of misses) ops.push({ store: 'misses', type: 'delete', key: m.id });
  for (const r of redos) ops.push({ store: 'redos', type: 'delete', key: r.missId });
  for (const u of use) ops.push({ store: 'materialUse', type: 'delete', key: u.id });
  await db.batch(ops);
  state.attempts = state.attempts.filter((a) => a.id !== id);
  state.pacing = state.pacing.filter((p) => p.attemptId !== id);
  state.misses = state.misses.filter((m) => !missIds.has(m.id));
  state.redos = state.redos.filter((r) => !missIds.has(r.missId));
  state.materialUse = state.materialUse.filter((u) => u.attemptId !== id);
  await regenerateAndEmit();
  return async () => {
    const restore = [{ store: 'attempts', type: 'put', value: attempt }];
    for (const p of pacing) restore.push({ store: 'pacing', type: 'put', value: p });
    for (const m of misses) restore.push({ store: 'misses', type: 'put', value: m });
    for (const r of redos) restore.push({ store: 'redos', type: 'put', value: r });
    for (const u of use) restore.push({ store: 'materialUse', type: 'put', value: u });
    await db.batch(restore);
    state.attempts.push(attempt);
    state.pacing.push(...pacing);
    state.misses.push(...misses);
    state.redos.push(...redos);
    state.materialUse.push(...use);
    await regenerateAndEmit();
  };
}

// ---------------------------------------------------------------- misses

export async function addMiss(input) {
  const miss = cleanMiss({ ...input, id: input.id || newId('miss') });
  const redo = createRedo(miss.id, miss.date > today() ? miss.date : today());
  await db.batch([
    { store: 'misses', type: 'put', value: miss },
    { store: 'redos', type: 'put', value: redo },
  ]);
  state.misses.push(miss);
  state.redos.push(redo);
  await regenerateAndEmit();
  return miss;
}

export async function updateMiss(miss) {
  const clean = cleanMiss(miss);
  await db.put('misses', clean);
  state.misses = state.misses.map((m) => (m.id === clean.id ? clean : m));
  emit();
  return clean;
}

/** Delete a miss and its redo. Returns an undo function. */
export async function deleteMiss(id) {
  const miss = state.misses.find((m) => m.id === id);
  if (!miss) return null;
  const redo = redoFor(id);
  await db.batch([
    { store: 'misses', type: 'delete', key: id },
    { store: 'redos', type: 'delete', key: id },
  ]);
  state.misses = state.misses.filter((m) => m.id !== id);
  state.redos = state.redos.filter((r) => r.missId !== id);
  emit();
  return async () => {
    const ops = [{ store: 'misses', type: 'put', value: miss }];
    if (redo) ops.push({ store: 'redos', type: 'put', value: redo });
    await db.batch(ops);
    state.misses.push(miss);
    if (redo) state.redos.push(redo);
    emit();
  };
}

// ---------------------------------------------------------------- redos

export async function answerRedo(missId, result) {
  const r = redoFor(missId);
  if (!r) return null;
  const next = logicAnswerRedo(r, result, today());
  await db.put('redos', next);
  state.redos = state.redos.map((x) => (x.missId === missId ? next : x));
  emit();
  return next;
}

// ---------------------------------------------------------------- tasks

function useRecordsForTask(t) {
  const ref = t.materialRef;
  if (!ref || !ref.sourceId || !ref.section) return [];
  const m = materials().find((x) => x.sourceId === ref.sourceId);
  if (!m || !m.fullLength) return [];
  const parts = Array.isArray(ref.parts) ? ref.parts : [null];
  return parts.map((p) => ({
    id: `${ref.sourceId}:${ref.section}:${p === null ? 'all' : p}`,
    sourceId: ref.sourceId,
    section: ref.section,
    part: p,
    usedOn: today(),
    taskId: t.id,
  }));
}

export async function setTaskStatus(id, status) {
  const t = state.tasks.find((x) => x.id === id);
  if (!t) return;
  const next = { ...t, status };
  const ops = [{ store: 'tasks', type: 'put', value: next }];
  let addUse = [];
  let removeUse = [];
  if (status === 'done') {
    addUse = useRecordsForTask(next);
    for (const u of addUse) ops.push({ store: 'materialUse', type: 'put', value: u });
  } else {
    removeUse = state.materialUse.filter((u) => u.taskId === id);
    for (const u of removeUse) ops.push({ store: 'materialUse', type: 'delete', key: u.id });
  }
  await db.batch(ops);
  state.tasks = state.tasks.map((x) => (x.id === id ? next : x));
  const removeIds = new Set(removeUse.map((u) => u.id));
  state.materialUse = [...state.materialUse.filter((u) => !removeIds.has(u.id) && !addUse.some((a) => a.id === u.id)), ...addUse];
  emit();
}

/** Heavy night: move tonight's tasks later this week. Returns the one-line message. */
export async function heavyNight() {
  const t = today();
  const weekStart = currentWeekStart();
  const heavy = [...new Set([...(state.settings.heavyNights || []), t])];
  const settings = { ...state.settings, heavyNights: heavy };
  const result = planHeavyNight({ tasks: weekTasks(weekStart), today: t, settings, weekStart });
  const ops = result.tasks.map((x) => ({ store: 'tasks', type: 'put', value: x }));
  ops.push({ store: 'settings', type: 'put', value: settings });
  await db.batch(ops);
  state.settings = settings;
  state.tasks = [...state.tasks.filter((x) => x.weekStart !== weekStart), ...result.tasks];
  emit();
  return result.message;
}

export async function undoHeavyNight() {
  const t = today();
  const heavy = (state.settings.heavyNights || []).filter((d) => d !== t);
  // Put tonight's moved tasks back and remove their copies, then let the planner refill the week.
  const weekStart = currentWeekStart();
  const ops = [];
  const next = [];
  for (const x of state.tasks) {
    if (x.weekStart !== weekStart) {
      next.push(x);
      continue;
    }
    if (x.origin === 'moved' && x.movedFrom === t && x.status === 'todo') {
      ops.push({ store: 'tasks', type: 'delete', key: x.id });
      continue;
    }
    if (x.date === t && x.status === 'moved') {
      const y = { ...x, status: 'todo' };
      delete y.movedTo;
      delete y.dropped;
      ops.push({ store: 'tasks', type: 'put', value: y });
      next.push(y);
      continue;
    }
    if (x.dropped && x.status === 'skipped') {
      const y = { ...x, status: 'todo' };
      delete y.dropped;
      ops.push({ store: 'tasks', type: 'put', value: y });
      next.push(y);
      continue;
    }
    next.push(x);
  }
  state.settings = { ...state.settings, heavyNights: heavy };
  ops.push({ store: 'settings', type: 'put', value: state.settings });
  await db.batch(ops);
  state.tasks = next;
  await regenerateAndEmit();
}

// ---------------------------------------------------------------- coach notes

export async function saveCoachNote(note) {
  await db.put('coachNotes', note);
  state.coachNotes = [...state.coachNotes.filter((n) => n.weekStart !== note.weekStart), note];
  emit();
}

// ---------------------------------------------------------------- backup

export async function exportBackup() {
  const data = await db.exportAll();
  await saveSettings({ lastBackup: nowISO() });
  return data;
}

export async function importBackup(obj, mode) {
  await db.importData(obj, mode);
  await reloadFromDB();
  if (state.settings.onboarded) await regenerate();
  emit();
}

export { db };
