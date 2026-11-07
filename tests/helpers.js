import { defaultSettings } from '../js/data/calendar.js';
import { buildMaterials } from '../js/data/materials.js';

export function settings(overrides = {}) {
  return { ...defaultSettings(), timezone: 'America/Chicago', ...overrides };
}

export function materials(s = settings()) {
  return buildMaterials(s);
}

let n = 0;
export function miss(section, topic, cause, date, extra = {}) {
  n++;
  return { id: `m${n}`, section, topic, cause, date, createdAt: `${date}T12:00:00.000Z`, guessedRight: false, sourceId: 'act-hub', ...extra };
}

export function attempt(id, date, kind, scores, scale = 36) {
  return { id, date, kind, sourceId: null, scores, scale, notes: '' };
}
