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
