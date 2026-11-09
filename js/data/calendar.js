// Default date configuration. Everything here is editable in Settings.

/** Day of week numbers follow JavaScript: 0 = Sunday ... 6 = Saturday. */
export const DAY_NAMES = Object.freeze(['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']);
export const DAY_SHORT = Object.freeze(['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']);

/** Plan weeks run Saturday to Friday, so each weekend block opens a week. */
export const WEEK_START_DAY = 6;

/** Minutes available on each day of the week. */
export const DEFAULT_AVAILABILITY = Object.freeze({
  0: 0,
  1: 30,
  2: 30,
  3: 30,
  4: 30,
  5: 0,
  6: 150,
});

export const DEFAULT_TEST_DATES = Object.freeze([
  Object.freeze({ date: '2026-12-12', label: 'December ACT', science: true }),
]);

/** Fixed full-test days. Week 1 weekend and Thanksgiving break in Week 3. */
export const DEFAULT_FULL_TESTS = Object.freeze([
  Object.freeze({ date: '2026-11-07', sourceId: 'enhanced-1' }),
  Object.freeze({ date: '2026-11-25', sourceId: 'enhanced-2' }),
]);

/** High-availability days (Thanksgiving break) with the minutes available. */
export const DEFAULT_HIGH_AVAILABILITY = Object.freeze({
  '2026-11-25': 180,
  '2026-11-26': 90,
  '2026-11-27': 90,
});

/** Named weeks for the December plan, keyed by the week's Saturday. */
export const DEFAULT_WEEK_LABELS = Object.freeze({
  '2026-11-07': 'Week 1: Diagnostic',
  '2026-11-14': 'Week 2: Targeted work',
  '2026-11-21': 'Week 3: Practice Test 2',
  '2026-11-28': 'Week 4: Close gaps',
  '2026-12-05': 'Week 5: Taper',
});

/** Days before the test that make up the taper, matching Week 5 for a Saturday test. */
export const TAPER = Object.freeze({
  weekendDays: Object.freeze([7, 6]), // Sat and Sun: one final timed section set
  reviewDays: Object.freeze([5, 4, 3]), // Mon to Wed: error log and redo review only
  logisticsDays: Object.freeze([2, 1]), // Thu and Fri: no study, logistics checklist
});

export const LOGISTICS_CHECKLIST = Object.freeze([
  Object.freeze({ id: 'ticket', label: 'Print your admission ticket' }),
  Object.freeze({ id: 'id', label: 'Pack an acceptable photo ID' }),
  Object.freeze({ id: 'calc', label: 'Pack an approved calculator (no CAS models) with fresh batteries' }),
  Object.freeze({ id: 'pencils', label: 'Pack No. 2 pencils, an eraser, and a watch without an alarm' }),
  Object.freeze({ id: 'route', label: 'Know your route and arrival time' }),
  Object.freeze({ id: 'sleep', label: 'Get a full night of sleep both nights' }),
]);

export function defaultSettings() {
  return {
    id: 'settings',
    onboarded: false,
    // Dates come from onboarding (each person's own test date); full-test days are worked out from it.
    testDates: [],
    availability: { ...DEFAULT_AVAILABILITY },
    fullTests: [],
    highAvailability: {},
    busyDates: {},
    heavyNights: [],
    weekLabels: {},
    timezone: (() => {
      try {
        return Intl.DateTimeFormat().resolvedOptions().timeZone || '';
      } catch {
        return '';
      }
    })(),
    // 'chat': copy prompts into your own Claude chat (free with a Claude plan). 'api': built-in, needs an API key.
    claudeMode: 'chat',
    passcode: '',
    lastBackup: null,
    legacyTests: {},
    prepGuide: { owned: false, tests: 3 },
    customMaterials: [],
    customTopics: {},
    checklist: {},
  };
}

/** The original December 2026 calendar from the spec, used by tests and the season simulation. */
export function december2026Preset() {
  return {
    testDates: DEFAULT_TEST_DATES.map((t) => ({ ...t })),
    fullTests: DEFAULT_FULL_TESTS.map((t) => ({ ...t })),
    highAvailability: { ...DEFAULT_HIGH_AVAILABILITY },
    weekLabels: { ...DEFAULT_WEEK_LABELS },
  };
}
