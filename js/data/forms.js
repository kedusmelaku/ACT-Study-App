// Scoring keys for Official Practice Tests 1 to 4, copied from each test's own scoring key PDF.
// Per section: total questions, unscored question numbers, the key letter for each question
// (index 0 is question 1), its reporting category ('' when not scored), and the raw to scale
// table, where table[raw] is the scale score. No question text is stored.

export const FORMS = {
  'enhanced-1': {
    english: {
      total: 50,
      unscored: [41, 42, 43, 44, 45, 46, 47, 48, 49, 50],
      answers: 'CBAAAADDBBBDCCDDDCADAACCDBDAABCAACABBCDDABDCDABADC',
      categories: 'CSE CSE POW POW CSE KLA KLA CSE CSE KLA CSE CSE KLA POW POW CSE KLA POW KLA POW CSE CSE POW POW POW POW CSE CSE CSE POW CSE POW CSE KLA POW POW POW CSE KLA CSE - - - - - - - - - -',
      table: [1, 2, 3, 5, 6, 7, 7, 8, 9, 10, 10, 10, 11, 11, 12, 13, 13, 14, 15, 15, 16, 17, 18, 19, 20, 20, 21, 22, 22, 23, 24, 25, 26, 27, 28, 29, 31, 33, 35, 35, 36],
    },
    math: {
      total: 45,
      unscored: [7, 16, 29, 40],
      answers: 'DDBACDBCDCBDADABADBCCBCBABBACDCDCBCDCDCDDACDA',
      categories: 'IES S IES IES A N - N A IES IES S G IES A - A N F G IES IES F F F A S G - G G IES IES IES IES S A IES S - IES IES IES F S',
      table: [1, 5, 7, 9, 11, 12, 13, 13, 14, 14, 15, 15, 15, 16, 16, 17, 17, 17, 18, 19, 19, 20, 21, 22, 23, 24, 25, 26, 27, 27, 28, 29, 29, 30, 31, 32, 33, 34, 34, 35, 36, 36],
    },
    reading: {
      total: 36,
      unscored: [1, 2, 3, 4, 5, 6, 7, 8, 9],
      answers: 'DCADCBAAADBCBDCDCABCDCACDABDDAABCDBC',
      categories: '- - - - - - - - - CS KID KID CS CS KID KID CS CS KID CS KID KID KID KID IKI IKI IKI IKI KID CS KID CS KID IKI KID CS',
      table: [1, 3, 5, 7, 9, 10, 11, 12, 12, 13, 14, 15, 16, 17, 18, 20, 21, 22, 23, 24, 25, 26, 28, 30, 32, 34, 35, 36],
    },
    science: {
      total: 40,
      unscored: [29, 30, 31, 32, 33, 34],
      answers: 'AADCDACDCACBCCBCBADACDCDBDDBDDCDDABABBCD',
      categories: 'IOD IOD IOD IOD EMI EMI EMI IOD EMI EMI EMI EMI EMI SIN SIN SIN SIN SIN SIN EMI SIN IOD SIN IOD IOD IOD IOD IOD - - - - - - IOD SIN IOD IOD IOD IOD',
      table: [1, 3, 6, 7, 9, 10, 11, 12, 12, 14, 15, 16, 17, 18, 18, 19, 20, 21, 22, 23, 23, 24, 25, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36],
    },
  },
  'enhanced-2': {
    english: {
      total: 50,
      unscored: [16, 17, 18, 19, 20, 21, 22, 23, 24, 25],
      answers: 'DCDDDCCCBAABCCBCBDDACBBBADBDCADCDACACDDDBAADBDCDAD',
      categories: 'KLA CSE CSE KLA POW CSE POW CSE POW POW CSE POW POW KLA CSE - - - - - - - - - - POW POW CSE CSE KLA CSE CSE KLA POW POW CSE CSE CSE POW POW POW KLA CSE POW POW CSE CSE KLA POW POW',
      table: [1, 2, 4, 5, 6, 7, 8, 9, 10, 10, 11, 11, 11, 12, 13, 14, 14, 15, 15, 16, 17, 18, 19, 20, 20, 21, 21, 22, 23, 23, 24, 25, 26, 27, 28, 30, 32, 34, 35, 35, 36],
    },
    math: {
      total: 45,
      unscored: [8, 18, 28, 38],
      answers: 'ADBBCDABBDACADBBCBABCBBDBCCAADBDBBABBCDAADAAC',
      categories: 'S F IES N IES N G - F A A S A G F G N - S IES S F IES F G G IES - G IES S A A A IES F A - N N F G IES G F',
      table: [1, 4, 7, 9, 10, 11, 12, 13, 14, 14, 14, 14, 15, 15, 16, 16, 16, 17, 17, 17, 18, 18, 19, 20, 21, 22, 23, 24, 25, 25, 26, 27, 27, 28, 29, 30, 31, 33, 34, 35, 36, 36],
    },
    reading: {
      total: 36,
      unscored: [19, 20, 21, 22, 23, 24, 25, 26, 27],
      answers: 'ABBACCDAABCCADACBDBDBBAABACDBCDADACB',
      categories: 'CS KID KID KID KID IKI IKI IKI IKI CS CS IKI KID KID KID CS IKI KID - - - - - - - - - KID KID KID CS KID CS CS KID CS',
      table: [1, 3, 5, 7, 9, 10, 11, 11, 12, 13, 14, 15, 16, 17, 18, 20, 21, 22, 23, 24, 25, 27, 28, 30, 32, 34, 35, 36],
    },
    science: {
      total: 40,
      unscored: [6, 7, 8, 9, 10, 11],
      answers: 'DABACBBCCACAACCDDCDBBBACDBDADBCCABDABADA',
      categories: 'IOD IOD IOD EMI EMI - - - - - - IOD SIN IOD EMI IOD SIN SIN SIN IOD SIN SIN IOD EMI EMI EMI EMI EMI IOD IOD SIN SIN SIN IOD SIN IOD EMI EMI EMI IOD',
      table: [1, 3, 5, 7, 9, 10, 11, 11, 12, 13, 14, 15, 16, 17, 18, 18, 19, 20, 21, 21, 22, 23, 23, 24, 24, 25, 26, 26, 27, 28, 30, 32, 34, 35, 36],
    },
  },
  'enhanced-3': {
    english: {
      total: 50,
      unscored: [11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
      answers: 'AABDBDDCBBBDACDCDAACCCABCDCBBACDABCABACDABDBDCCDAB',
      categories: 'POW POW POW POW CSE KLA CSE POW CSE KLA - - - - - - - - - - CSE CSE POW POW CSE CSE CSE POW KLA POW POW POW KLA CSE POW CSE CSE POW CSE CSE CSE POW CSE POW KLA KLA CSE POW KLA POW',
      table: [1, 2, 4, 5, 6, 7, 8, 9, 10, 10, 11, 11, 11, 12, 13, 14, 14, 15, 15, 16, 17, 18, 19, 20, 20, 21, 21, 22, 23, 23, 24, 25, 26, 27, 28, 30, 32, 34, 35, 35, 36],
    },
    math: {
      total: 45,
      unscored: [6, 18, 29, 40],
      answers: 'BDBCBCCDDBADBDBACBADAABCACBBBCBADACDCBCDADACD',
      categories: 'G IES IES IES IES - F N IES A S A S F S A F - S A G G G N IES S G A - G A G IES F N IES N F F - F A G S N',
      table: [1, 4, 7, 9, 10, 11, 12, 13, 14, 14, 14, 14, 15, 15, 16, 16, 16, 17, 17, 17, 18, 18, 19, 20, 21, 22, 23, 24, 25, 25, 26, 27, 27, 28, 29, 30, 31, 33, 34, 35, 36, 36],
    },
    reading: {
      total: 36,
      unscored: [10, 11, 12, 13, 14, 15, 16, 17, 18],
      answers: 'BCABDACBCBDADDACACAAABACBBADCACDDCAA',
      categories: 'KID CS KID CS KID IKI IKI IKI IKI - - - - - - - - - IKI KID KID KID KID CS KID KID KID KID CS KID KID KID KID KID KID CS',
      table: [1, 3, 5, 7, 9, 10, 11, 11, 12, 13, 14, 15, 16, 17, 18, 20, 21, 22, 23, 24, 25, 27, 28, 30, 32, 34, 35, 36],
    },
    science: {
      total: 40,
      unscored: [11, 12, 13, 14, 15, 16],
      answers: 'DCCABBBDADDBACBDABBCCCBBCDAADABABDDCCDBA',
      categories: 'IOD IOD IOD EMI IOD IOD IOD EMI IOD IOD - - - - - - SIN IOD IOD SIN IOD SIN SIN EMI SIN IOD SIN EMI IOD IOD SIN SIN SIN IOD SIN EMI EMI EMI EMI EMI',
      table: [1, 3, 5, 7, 9, 10, 11, 11, 12, 13, 14, 15, 16, 17, 18, 18, 19, 20, 21, 21, 22, 23, 23, 24, 24, 25, 26, 26, 27, 28, 30, 32, 34, 35, 36],
    },
  },
  'enhanced-4': {
    english: {
      total: 50,
      unscored: [31, 32, 33, 34, 35, 36, 37, 38, 39, 40],
      answers: 'BCADDCBDADCDBDACDBADADADCDCADBDADBCDACADBCDAACDACD',
      categories: 'POW CSE POW KLA CSE CSE CSE POW CSE POW CSE CSE POW KLA KLA POW CSE CSE CSE POW CSE KLA POW KLA POW POW POW KLA KLA CSE - - - - - - - - - - CSE POW POW CSE POW CSE CSE KLA POW POW',
      table: [1, 2, 4, 5, 6, 7, 8, 9, 10, 10, 11, 11, 11, 12, 13, 14, 14, 15, 15, 16, 17, 18, 19, 20, 20, 21, 21, 22, 23, 23, 24, 25, 26, 27, 28, 30, 32, 34, 35, 35, 36],
    },
    math: {
      total: 45,
      unscored: [8, 16, 28, 39],
      answers: 'BBCDADCBDDCCBAADBDDBBCDBBDBBBACBDCCDBCAADCCDD',
      categories: 'G IES IES F A IES N - G F IES G N A F - A A S A G IES F F S IES S - N A G N IES S F IES G G - G A F F N S',
      table: [1, 4, 7, 9, 10, 11, 12, 13, 14, 14, 14, 14, 15, 15, 16, 16, 16, 17, 17, 17, 18, 18, 19, 20, 21, 22, 23, 24, 25, 25, 26, 27, 27, 28, 29, 30, 31, 33, 34, 35, 36, 36],
    },
    reading: {
      total: 36,
      unscored: [19, 20, 21, 22, 23, 24, 25, 26, 27],
      answers: 'CDBBCBAADAABCDCCCBDCBDDBBBDABBDBCDBC',
      categories: 'CS KID KID CS KID IKI IKI IKI IKI KID CS KID KID CS CS KID KID CS - - - - - - - - - KID IKI KID KID CS IKI IKI IKI IKI',
      table: [1, 3, 5, 7, 9, 10, 11, 11, 12, 13, 14, 15, 16, 17, 18, 20, 21, 22, 23, 24, 25, 27, 28, 30, 32, 34, 35, 36],
    },
    science: {
      total: 40,
      unscored: [6, 7, 8, 9, 10, 11],
      answers: 'CBBCABBBDCACBDBAACAADDDACCDBBDBBBACAADCD',
      categories: 'EMI EMI IOD IOD EMI - - - - - - IOD EMI EMI IOD IOD SIN IOD IOD IOD EMI SIN SIN IOD IOD SIN SIN IOD EMI EMI IOD IOD IOD EMI SIN SIN SIN SIN EMI IOD',
      table: [1, 3, 5, 7, 9, 10, 11, 11, 12, 13, 14, 15, 16, 17, 18, 18, 19, 20, 21, 21, 22, 23, 23, 24, 24, 25, 26, 26, 27, 28, 30, 32, 34, 35, 36],
    },
  },
};

// What each reporting category means, for labels.
export const CATEGORY_NAMES = {
  POW: 'Production of Writing', KLA: 'Knowledge of Language', CSE: 'Conventions of Standard English',
  A: 'Algebra', F: 'Functions', G: 'Geometry', N: 'Number and Quantity', S: 'Statistics and Probability',
  IES: 'Integrating Essential Skills',
  KID: 'Key Ideas and Details', CS: 'Craft and Structure', IKI: 'Integration of Knowledge and Ideas',
  IOD: 'Interpretation of Data', SIN: 'Scientific Investigation', EMI: 'Evaluation of Models, Inferences, and Experimental Results',
};

// App topics most likely to sit under each reporting category. Used to list them first when tagging.
export const CATEGORY_TOPICS = {
  english: {
    CSE: ['Commas', 'Semicolons and colons', 'Dashes and parentheses', 'Apostrophes', 'Sentence boundaries', 'Subject-verb agreement', 'Pronoun agreement and case', 'Verb tense', 'Modifiers', 'Parallelism'],
    POW: ['Transitions', 'Add, delete, or revise', 'Organization and sentence order'],
    KLA: ['Word choice and idioms', 'Concision and redundancy'],
  },
  math: {
    A: ['Linear equations and systems', 'Quadratics and polynomials', 'Exponents and logarithms', 'Matrices'],
    F: ['Functions', 'Exponents and logarithms', 'Sequences'],
    G: ['Plane geometry', 'Coordinate geometry', 'Conic sections', 'Trigonometry and the unit circle'],
    N: ['Number and quantity', 'Complex numbers', 'Vectors', 'Matrices'],
    S: ['Statistics', 'Probability and counting'],
    IES: ['Word problems and modeling', 'Number and quantity', 'Plane geometry', 'Statistics'],
  },
  reading: {
    KID: ['Main idea', 'Detail', 'Inference'],
    CS: ['Vocabulary in context', 'Author purpose and tone', 'Function of a part'],
    IKI: ['Comparing paired passages', 'Data or graphs in reading'],
  },
  science: {
    IOD: ['Data representation', 'Graph reading', 'Trends and extrapolation'],
    SIN: ['Research summaries', 'Experimental design'],
    EMI: ['Conflicting viewpoints', 'Outside knowledge', 'Trends and extrapolation'],
  },
};

/** The key for one section of a keyed test, or null. */
export function formSection(sourceId, section) {
  const f = FORMS[sourceId];
  return (f && f[section]) || null;
}

/** Key letter, scored flag, and category for one question, or null when the test isn't keyed. */
export function keyFor(sourceId, section, q) {
  const f = formSection(sourceId, section);
  const n = Number(q);
  if (!f || !Number.isInteger(n) || n < 1 || n > f.total) return null;
  const cat = f.categories.split(' ')[n - 1];
  return { answer: f.answers[n - 1], unscored: f.unscored.includes(n), category: cat === '-' ? null : cat };
}

export function isKeyed(sourceId) {
  return Boolean(FORMS[sourceId]);
}
