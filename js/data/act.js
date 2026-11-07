// ACT facts and scoring constants (enhanced ACT, 2025 onward).
// Every other module reads these values from here. Nothing else hardcodes them.

export const SECTIONS = Object.freeze({
  english: Object.freeze({ key: 'english', label: 'English', short: 'E', questions: 50, minutes: 35, pace: 42, choices: 4 }),
  math: Object.freeze({ key: 'math', label: 'Math', short: 'M', questions: 45, minutes: 50, pace: 67, choices: 4 }),
  reading: Object.freeze({ key: 'reading', label: 'Reading', short: 'R', questions: 36, minutes: 40, pace: 67, choices: 4 }),
  science: Object.freeze({ key: 'science', label: 'Science', short: 'S', questions: 40, minutes: 40, pace: 60, choices: 4, optional: true }),
});

/** Sections that make up the composite. */
export const CORE_SECTIONS = Object.freeze(['english', 'math', 'reading']);
/** Every section, in display order. */
export const ALL_SECTIONS = Object.freeze(['english', 'math', 'reading', 'science']);

export const MIN_SCORE = 1;
export const MAX_SCORE = 36;
/** Scale of the in-school benchmark. */
export const BENCHMARK_SCALE = 35;
export const SCALES = Object.freeze([36, 35]);

/** Round a score average: nearest whole number, .5 rounds up. */
export function roundScore(x) {
  return Math.floor(x + 0.5);
}

/** Legacy (pre-2025) official tests: questions per section, with passages/parts for drills. */
export const LEGACY_SECTIONS = Object.freeze({
  english: Object.freeze({ questions: 75, parts: 5 }),
  math: Object.freeze({ questions: 60, parts: 4 }),
  reading: Object.freeze({ questions: 40, parts: 4 }),
  science: Object.freeze({ questions: 40, parts: 6 }),
});

/** Enhanced tests split into parts (passages or question blocks) for drills. */
export const ENHANCED_PARTS = Object.freeze({ english: 5, math: 3, reading: 4, science: 6 });

/** Minutes of break on a full test (after Math, as on test day). */
export const FULL_TEST_BREAK_MINUTES = 10;

export const ATTEMPT_KINDS = Object.freeze({
  real: Object.freeze({ label: 'Real ACT', weight: 1.0 }),
  official_enhanced: Object.freeze({ label: 'Official practice (enhanced)', weight: 1.0 }),
  official_legacy: Object.freeze({ label: 'Official practice (legacy)', weight: 0.8 }),
  benchmark: Object.freeze({ label: 'School benchmark', weight: 0.6 }),
  other: Object.freeze({ label: 'Other', weight: 0.5 }),
});

/** Recency weights for the 3 most recent attempts in a section, most recent first. */
export const RECENCY_WEIGHTS = Object.freeze([1.0, 0.7, 0.5]);

export const CAUSES = Object.freeze({
  content: Object.freeze({ label: "Didn't know", short: 'Content', mult: 1.0 }),
  careless: Object.freeze({ label: 'Careless', short: 'Careless', mult: 0.8 }),
  time: Object.freeze({ label: 'Ran out of time', short: 'Time', mult: 0.8 }),
  trap: Object.freeze({ label: 'Fell for a trap', short: 'Trap', mult: 1.0 }),
});
export const CAUSE_KEYS = Object.freeze(['content', 'careless', 'time', 'trap']);
/** Questions answered right only by guessing count at this weight. */
export const GUESSED_RIGHT_MULT = 0.5;

/** Focus engine tuning. */
export const FOCUS = Object.freeze({
  halfLifeDays: 10,
  dominantCauseWindowDays: 14,
  recentScienceWindowDays: 14,
  leverageWeight: 0.6,
  weaknessWeight: 0.4,
  redoRightFactor: 0.5,
  redoWrongAdd: 0.5,
  persistentBoost: 1.5,
  timingFlagTimeWeight: 1.5,
  minWeaknessForSlot: 0.25,
});

/** Pacing thresholds that set a timing flag on a section. */
export const TIMING_FLAG = Object.freeze({ notReached: 1, guessedAtEnd: 3 });

/** Spaced redo schedule. */
export const REDO = Object.freeze({
  intervals: Object.freeze([3, 7, 14]),
  retireAfterRightsAtMax: 2,
  persistentAfterWrongs: 2,
  minutesPerRedo: 3,
});

/** Seconds to minutes for a question count at enhanced pace, rounded up. */
export function minutesAtPace(section, questions) {
  return Math.ceil((questions * SECTIONS[section].pace) / 60);
}

export function sectionLabel(section) {
  return SECTIONS[section] ? SECTIONS[section].label : section;
}
