// Default topic taxonomy per section. The user can add custom topics in Settings.

export const DEFAULT_TOPICS = Object.freeze({
  english: Object.freeze([
    'Commas',
    'Semicolons and colons',
    'Dashes and parentheses',
    'Apostrophes',
    'Sentence boundaries',
    'Subject-verb agreement',
    'Pronoun agreement and case',
    'Verb tense',
    'Modifiers',
    'Parallelism',
    'Word choice and idioms',
    'Concision and redundancy',
    'Transitions',
    'Add, delete, or revise',
    'Organization and sentence order',
    "Writer's purpose",
  ]),
  math: Object.freeze([
    'Number and quantity',
    'Linear equations and systems',
    'Quadratics and polynomials',
    'Functions',
    'Exponents and logarithms',
    'Plane geometry',
    'Coordinate geometry',
    'Conic sections',
    'Trigonometry and the unit circle',
    'Statistics',
    'Probability and counting',
    'Matrices',
    'Complex numbers',
    'Vectors',
    'Sequences',
    'Word problems and modeling',
  ]),
  reading: Object.freeze([
    'Main idea',
    'Detail',
    'Inference',
    'Vocabulary in context',
    'Author purpose and tone',
    'Function of a part',
    'Comparing paired passages',
    'Data or graphs in reading',
  ]),
  science: Object.freeze([
    'Data representation',
    'Research summaries',
    'Conflicting viewpoints',
    'Graph reading',
    'Trends and extrapolation',
    'Experimental design',
    'Outside knowledge',
  ]),
});

/** Default topics plus any custom ones, without duplicates. */
export function topicsFor(section, customTopics = {}) {
  const base = DEFAULT_TOPICS[section] || [];
  const extra = (customTopics && customTopics[section]) || [];
  const seen = new Set(base.map((t) => t.toLowerCase()));
  const out = [...base];
  for (const t of extra) {
    const k = String(t).trim();
    if (k && !seen.has(k.toLowerCase())) {
      seen.add(k.toLowerCase());
      out.push(k);
    }
  }
  return out;
}

/** A miss can be labeled with up to this many topics. The first is its main topic. */
export const MAX_TOPICS = 3;

/** A miss's topics, main one first. Older misses only have `topic`. */
export function topicsOf(m) {
  if (!m) return [];
  const list = Array.isArray(m.topics) && m.topics.length ? m.topics : m.topic ? [m.topic] : [];
  return [...new Set(list.map((t) => String(t || '').trim()).filter(Boolean))].slice(0, MAX_TOPICS);
}

/** "Commas, Transitions" for display, or '' when untagged. */
export function topicLabel(m) {
  return topicsOf(m).join(', ');
}

/** Add or remove a topic from a list. Returns null when the list is already full. */
export function toggleTopic(list, topic) {
  if (list.includes(topic)) return list.filter((t) => t !== topic);
  if (list.length >= MAX_TOPICS) return null;
  return [...list, topic];
}
