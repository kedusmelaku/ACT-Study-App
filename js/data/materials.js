// Official materials inventory. The app points to these and tracks use. It never stores question text.
import { ALL_SECTIONS } from './act.js';

const ALL = Object.freeze([...ALL_SECTIONS]);

/**
 * Seed inventory. Fields:
 *  sourceId, title, kind, sections, url, notes
 *  format: 'enhanced' | 'legacy' | null  (question format for full-length tests)
 *  fullLength: true when the source is a complete practice test
 *  holdForFullTest: never used for drills, saved for full-test slots
 *  needsSetup: the user must add a name or URL in Settings first
 */
export const SEED_MATERIALS = Object.freeze([
  {
    sourceId: 'enhanced-1',
    title: 'Official Enhanced Practice Test 1',
    short: 'Practice Test 1',
    kind: 'practice_test',
    sections: ALL,
    url: 'https://www.act.org/content/dam/act/secured/documents/Preparing-for-the-ACT.pdf',
    notes: 'Free PDF. A digital version is also available through MyACT.',
    format: 'enhanced',
    fullLength: true,
    holdForFullTest: true,
  },
  {
    sourceId: 'enhanced-2',
    title: 'Official Enhanced Practice Test 2',
    short: 'Practice Test 2',
    kind: 'practice_test',
    sections: ALL,
    url: 'https://www.act.org/content/dam/act/unsecured/documents/ACT-Test-Prep-ACT-Practice-Test-2-Form.pdf',
    notes: 'Free PDF.',
    format: 'enhanced',
    fullLength: true,
    holdForFullTest: true,
  },
  {
    sourceId: 'act-hub',
    title: 'ACT free test prep hub',
    short: 'ACT QuizMe',
    kind: 'quiz',
    sections: ALL,
    url: 'https://act.org/content/act/en/products-and-services/the-act/test-preparation/free-act-test-prep.html',
    notes: 'Digital practice tests, QuizMe subject quizzes, and Question of the Day.',
    format: null,
    fullLength: false,
  },
  ...[1, 2, 3].map((n) => ({
    sourceId: `legacy-${n}`,
    title: `Official Legacy Practice Test ${n}`,
    short: `Legacy Test ${n}`,
    kind: 'practice_test',
    sections: ALL,
    url: '',
    notes: 'Free, pre-2025 format. Used for section practice at enhanced pacing. Add its name or link in Settings.',
    format: 'legacy',
    fullLength: true,
    needsSetup: true,
  })),
  {
    sourceId: 'piqosity',
    title: 'Piqosity answer explanations',
    short: 'Piqosity',
    kind: 'explanations',
    sections: ALL,
    url: 'https://www.piqosity.com/',
    notes: "Explanations for the enhanced practice tests. Use when the official key doesn't explain why an answer is right.",
    format: null,
    fullLength: false,
  },
  {
    sourceId: 'khan',
    title: 'Khan Academy',
    short: 'Khan Academy',
    kind: 'lesson',
    sections: Object.freeze(['math']),
    url: 'https://www.khanacademy.org/math',
    notes: 'For patching specific math topics.',
    format: null,
    fullLength: false,
  },
  {
    sourceId: 'prep-guide',
    title: 'Official ACT Prep Guide (enhanced edition)',
    short: 'Prep Guide',
    kind: 'book',
    sections: ALL,
    url: '',
    notes: 'Optional purchase. Turn on "I own it" in Settings and set how many practice tests your copy has.',
    format: 'enhanced',
    fullLength: false,
    optionalPurchase: true,
  },
]);

/**
 * Resolve the inventory against the user's settings: fill in legacy test names and links,
 * expand the Prep Guide into one source per practice test when owned, and add custom sources.
 * Returns a new array; each item has `available` (whether the planner may assign it).
 */
export function buildMaterials(settings = {}) {
  const legacy = settings.legacyTests || {};
  const guide = settings.prepGuide || { owned: false, tests: 0 };
  const out = [];
  for (const m of SEED_MATERIALS) {
    if (m.sourceId === 'prep-guide') {
      out.push({ ...m, available: !!guide.owned });
      if (guide.owned) {
        const count = Math.max(0, Math.min(10, Number(guide.tests) || 0));
        for (let i = 1; i <= count; i++) {
          out.push({
            sourceId: `guide-${i}`,
            title: `Prep Guide Practice Test ${i}`,
            short: `Guide Test ${i}`,
            kind: 'practice_test',
            sections: ALL,
            url: '',
            notes: 'From your Official ACT Prep Guide.',
            format: 'enhanced',
            fullLength: true,
            available: true,
          });
        }
      }
      continue;
    }
    if (m.needsSetup) {
      const entry = legacy[m.sourceId] || {};
      const name = String(entry.name || '').trim();
      const url = String(entry.url || '').trim();
      out.push({
        ...m,
        title: name || m.title,
        url,
        available: !!(name || url),
      });
      continue;
    }
    out.push({ ...m, available: true });
  }
  for (const c of settings.customMaterials || []) {
    if (!c || !c.sourceId) continue;
    out.push({
      sourceId: c.sourceId,
      title: c.title || 'Custom source',
      short: c.title || 'Custom source',
      kind: c.fullLength ? 'practice_test' : 'other',
      sections: ALL,
      url: c.url || '',
      notes: 'Added by you.',
      format: c.format || null,
      fullLength: !!c.fullLength,
      available: true,
      custom: true,
    });
  }
  return out;
}

export function findMaterial(materials, sourceId) {
  return materials.find((m) => m.sourceId === sourceId) || null;
}

/** Sources that make sense to pick when logging a test attempt. */
export function attemptSources(materials) {
  return materials.filter((m) => m.fullLength && m.available);
}
