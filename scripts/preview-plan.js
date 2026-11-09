// Prints a generated week for eyeballing. Usage: node scripts/preview-plan.js 2026-11-14 2026-11-14
import { generateWeek } from '../js/logic/planner.js';
import { computeFocus } from '../js/logic/focus.js';
import { defaultSettings, december2026Preset } from '../js/data/calendar.js';
import { buildMaterials } from '../js/data/materials.js';
import { weekStartOf } from '../js/logic/dates.js';

const today = process.argv[2] || '2026-11-07';
const ws = weekStartOf(process.argv[3] || today, 6);
const settings = { ...defaultSettings(), ...december2026Preset(), legacyTests: { 'legacy-1': { name: 'Legacy Test 1' }, 'legacy-2': { name: 'Legacy Test 2' } } };
const attempts = [{ id: 'b', date: '2026-10-01', kind: 'benchmark', scores: { english: 35, math: 35, reading: 33, science: 35 }, scale: 35 }];
const misses = [
  { id: 'm1', section: 'reading', topic: 'Inference', cause: 'trap', date: today },
  { id: 'm2', section: 'reading', topic: 'Function of a part', cause: 'trap', date: today },
  { id: 'm3', section: 'math', topic: 'Conic sections', cause: 'content', date: today },
  { id: 'm4', section: 'science', topic: 'Conflicting viewpoints', cause: 'careless', date: today },
];
const redos = [{ missId: 'm1', dueDate: '2026-11-10', interval: 3, streak: 0, history: [], status: 'active' }];
const focus = computeFocus({ attempts, misses, redos, today });
console.log(focus.sentence);
const { tasks, notes } = generateWeek({ weekStart: ws, today, settings, focus, redos, materials: buildMaterials(settings), materialUse: [], attempts, existingTasks: [] });
for (const t of tasks) console.log(t.date, t.slot, t.minutes + 'm', t.type, '|', t.title, '|', t.detail);
console.log(notes);
