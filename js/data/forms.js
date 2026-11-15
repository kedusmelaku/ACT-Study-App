// Scoring keys for Official Practice Tests 1 to 4, copied from each test's own scoring key PDF.
// Per section: total questions, unscored question numbers, the key letter for each question
// (index 0 is question 1, normalized to A to D; the paper booklet prints F, G, H, J on even
// questions), its reporting category ('-' when not scored), the raw to scale table (table[raw] is
// the scale score), a topic code per question (TOPIC_CODES), and the booklet page of each question
// plus the page its passage or figure starts on (0 when it's the same page). Pages match the
// official paper booklet PDFs listed in BOOKLETS. Facts only: no question text is stored here.

// The official booklet PDF each test's pages refer to: its form code (printed in every page footer)
// and page count, used to check an attached booklet is the right one.
export const BOOKLETS = {
  'enhanced-1': { code: 'QU00002.CJ23137', pages: 82 },
  'enhanced-2': { code: 'QU00002-2.CJ22902', pages: 70 },
  'enhanced-3': { code: 'QU00002-3.CJ25259', pages: 70 },
  'enhanced-4': { code: 'QU00002-4.CJ24048', pages: 70 },
};

// Short codes for the topics in js/data/topics.js, per section.
export const TOPIC_CODES = {
  english: {
    CM: 'Commas', SC: 'Semicolons and colons', DP: 'Dashes and parentheses', AP: 'Apostrophes',
    SB: 'Sentence boundaries', SV: 'Subject-verb agreement', PR: 'Pronoun agreement and case', VT: 'Verb tense',
    MO: 'Modifiers', PA: 'Parallelism', WC: 'Word choice and idioms', CO: 'Concision and redundancy',
    TR: 'Transitions', AD: 'Add, delete, or revise', OR: 'Organization and sentence order',
  },
  math: {
    NQ: 'Number and quantity', LI: 'Linear equations and systems', QP: 'Quadratics and polynomials', FN: 'Functions',
    EL: 'Exponents and logarithms', PG: 'Plane geometry', CG: 'Coordinate geometry', CS: 'Conic sections',
    TG: 'Trigonometry and the unit circle', ST: 'Statistics', PB: 'Probability and counting', MX: 'Matrices',
    CX: 'Complex numbers', VC: 'Vectors', SQ: 'Sequences', WP: 'Word problems and modeling',
  },
  reading: {
    MI: 'Main idea', DT: 'Detail', IN: 'Inference', VC: 'Vocabulary in context', AP: 'Author purpose and tone',
    FP: 'Function of a part', CP: 'Comparing paired passages', DG: 'Data or graphs in reading',
  },
  science: {
    DR: 'Data representation', RS: 'Research summaries', CV: 'Conflicting viewpoints', GR: 'Graph reading',
    TE: 'Trends and extrapolation', ED: 'Experimental design', OK: 'Outside knowledge',
  },
};

export const FORMS = {
  'enhanced-1': {
    english: {
      total: 50,
      unscored: [41, 42, 43, 44, 45, 46, 47, 48, 49, 50],
      answers: 'CBAAAADDBBBDCCDDDCADAACCDBDAABCAACABBCDDABDCDABADC',
      categories: 'CSE CSE POW POW CSE KLA KLA CSE CSE KLA CSE CSE KLA POW POW CSE KLA POW KLA POW CSE CSE POW POW POW POW CSE CSE CSE POW CSE POW CSE KLA POW POW POW CSE KLA CSE - - - - - - - - - -',
      table: [1, 2, 3, 5, 6, 7, 7, 8, 9, 10, 10, 10, 11, 11, 12, 13, 13, 14, 15, 15, 16, 17, 18, 19, 20, 20, 21, 22, 22, 23, 24, 25, 26, 27, 28, 29, 31, 33, 35, 35, 36],
      topics: 'SB DP AD TR PR WC CO SB SV WC CM SB WC TR AD CM CO AD CO AD VT PR TR AD OR AD SB SB PR TR PR AD DP TR OR AD AD PA CO AP AD AP AD MO AD CM PR AD TR AD',
      pages: [14, 14, 14, 14, 15, 15, 15, 15, 15, 15, 16, 16, 16, 16, 16, 17, 17, 17, 17, 18, 18, 18, 18, 18, 19, 19, 19, 19, 20, 20, 20, 20, 20, 21, 21, 21, 22, 22, 22, 22, 23, 23, 23, 23, 24, 24, 24, 24, 25, 25],
      passagePages: [0, 0, 0, 0, 14, 14, 14, 14, 14, 14, 0, 0, 0, 0, 0, 0, 0, 0, 0, 17, 17, 17, 17, 17, 17, 0, 0, 0, 19, 19, 19, 19, 19, 19, 19, 0, 21, 21, 21, 21, 0, 0, 0, 0, 23, 23, 23, 23, 23, 23],
    },
    math: {
      total: 45,
      unscored: [7, 16, 29, 40],
      answers: 'DDBACDBCDCBDADABADBCCBCBABBACDCDCBCDCDCDDACDA',
      categories: 'IES S IES IES A N - N A IES IES S G IES A - A N F G IES IES F F F A S G - G G IES IES IES IES S A IES S - IES IES IES F S',
      table: [1, 5, 7, 9, 11, 12, 13, 13, 14, 14, 15, 15, 15, 16, 16, 17, 17, 17, 18, 19, 19, 20, 21, 22, 23, 24, 25, 26, 27, 27, 28, 29, 29, 30, 31, 32, 33, 34, 34, 35, 36, 36],
      topics: 'ST PB PB PG QP MX WP NQ LI NQ QP PB TG LI QP WP QP CX SQ PG PG WP EL TG FN LI PB PG SQ CG PG WP PG SQ NQ PB QP ST ST NQ NQ ST PG FN PB',
      pages: [26, 26, 27, 27, 27, 27, 28, 28, 28, 28, 29, 29, 29, 29, 30, 30, 30, 30, 30, 30, 31, 31, 31, 31, 32, 32, 32, 33, 33, 33, 33, 34, 34, 34, 34, 35, 35, 35, 35, 36, 36, 36, 36, 37, 37],
      passagePages: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    },
    reading: {
      total: 36,
      unscored: [1, 2, 3, 4, 5, 6, 7, 8, 9],
      answers: 'DCADCBAAADBCBDCDCABCDCACDABDDAABCDBC',
      categories: '- - - - - - - - - CS KID KID CS CS KID KID CS CS KID CS KID KID KID KID IKI IKI IKI IKI KID CS KID CS KID IKI KID CS',
      table: [1, 3, 5, 7, 9, 10, 11, 12, 12, 13, 14, 15, 16, 17, 18, 20, 21, 22, 23, 24, 25, 26, 28, 30, 32, 34, 35, 36],
      topics: 'AP MI IN DT IN DT MI DT IN AP MI IN FP FP DT DT FP VC DT VC IN DT MI IN CP CP CP IN MI FP DT FP DT IN DT VC',
      pages: [39, 39, 39, 39, 39, 39, 39, 39, 39, 40, 41, 41, 41, 41, 41, 41, 41, 41, 42, 43, 43, 43, 43, 43, 43, 43, 43, 44, 44, 45, 45, 45, 45, 45, 45, 45],
      passagePages: [38, 38, 38, 38, 38, 38, 38, 38, 38, 0, 40, 40, 40, 40, 40, 40, 40, 40, 0, 42, 42, 42, 42, 42, 42, 42, 42, 0, 0, 44, 44, 44, 44, 44, 44, 44],
    },
    science: {
      total: 40,
      unscored: [29, 30, 31, 32, 33, 34],
      answers: 'AADCDACDCACBCCBCBADACDCDBDDBDDCDDABABBCD',
      categories: 'IOD IOD IOD IOD EMI EMI EMI IOD EMI EMI EMI EMI EMI SIN SIN SIN SIN SIN SIN EMI SIN IOD SIN IOD IOD IOD IOD IOD - - - - - - IOD SIN IOD IOD IOD IOD',
      table: [1, 3, 6, 7, 9, 10, 11, 12, 12, 14, 15, 16, 17, 18, 18, 19, 20, 21, 22, 23, 23, 24, 25, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36],
      topics: 'DR DR DR GR OK CV CV CV CV CV CV RS TE TE ED ED ED ED TE RS OK DR ED GR GR GR DR DR DR DR RS DR OK OK DR ED DR DR TE TE',
      pages: [47, 47, 47, 47, 47, 48, 49, 49, 49, 49, 49, 50, 51, 51, 51, 51, 51, 53, 53, 53, 53, 53, 53, 55, 55, 55, 55, 55, 57, 57, 57, 57, 57, 57, 58, 59, 59, 59, 59, 59],
      passagePages: [46, 46, 46, 46, 46, 0, 48, 48, 48, 48, 48, 0, 50, 50, 50, 50, 50, 52, 52, 52, 52, 52, 52, 54, 54, 54, 54, 54, 56, 56, 56, 56, 56, 56, 0, 58, 58, 58, 58, 58],
    },
  },
  'enhanced-2': {
    english: {
      total: 50,
      unscored: [16, 17, 18, 19, 20, 21, 22, 23, 24, 25],
      answers: 'DCDDDCCCBAABCCBCBDDACBBBADBDCADCDACACDDDBAADBDCDAD',
      categories: 'KLA CSE CSE KLA POW CSE POW CSE POW POW CSE POW POW KLA CSE - - - - - - - - - - POW POW CSE CSE KLA CSE CSE KLA POW POW CSE CSE CSE POW POW POW KLA CSE POW POW CSE CSE KLA POW POW',
      table: [1, 2, 4, 5, 6, 7, 8, 9, 10, 10, 11, 11, 11, 12, 13, 14, 14, 15, 15, 16, 17, 18, 19, 20, 20, 21, 21, 22, 23, 23, 24, 25, 26, 27, 28, 30, 32, 34, 35, 35, 36],
      topics: 'CO DP SB CO AD SV AD SB OR AD CM AD OR WC SC AD OR AP CO AD AD SC WC WC AD TR TR PR PR CO SB SV CO AD AD CM SB SB OR TR AD WC AP AD AD CM SV WC OR AD',
      pages: [4, 4, 4, 5, 5, 5, 5, 5, 6, 6, 6, 6, 6, 7, 7, 7, 8, 8, 8, 8, 8, 9, 9, 9, 9, 10, 10, 10, 10, 11, 11, 11, 11, 11, 11, 12, 12, 12, 12, 13, 13, 13, 13, 13, 14, 14, 14, 15, 15, 15],
      passagePages: [0, 0, 0, 4, 4, 4, 4, 4, 4, 4, 0, 0, 0, 6, 6, 0, 7, 7, 7, 7, 7, 7, 7, 7, 7, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 0, 0, 0, 0, 12, 12, 12, 12, 12, 12, 0, 0, 14, 14, 14],
    },
    math: {
      total: 45,
      unscored: [8, 18, 28, 38],
      answers: 'ADBBCDABBDACADBBCBABCBBDBCCAADBDBBABBCDAADAAC',
      categories: 'S F IES N IES N G - F A A S A G F G N - S IES S F IES F G G IES - G IES S A A A IES F A - N N F G IES G F',
      table: [1, 4, 7, 9, 10, 11, 12, 13, 14, 14, 14, 14, 15, 15, 16, 16, 16, 17, 17, 17, 18, 18, 19, 20, 21, 22, 23, 24, 25, 25, 26, 27, 27, 28, 29, 30, 31, 33, 34, 35, 36, 36],
      topics: 'PB FN NQ NQ PG MX PG QP QP LI WP PB QP PG TG CS NQ WP PB NQ ST SQ LI FN PG PG CG FN TG NQ PB QP QP LI CG FN QP ST CX CX EL PG WP CS FN',
      pages: [16, 16, 16, 17, 17, 17, 17, 18, 18, 18, 18, 19, 19, 19, 20, 20, 20, 20, 21, 21, 21, 21, 22, 22, 22, 22, 23, 23, 23, 23, 24, 24, 24, 24, 25, 25, 25, 25, 26, 26, 26, 26, 26, 27, 27],
      passagePages: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    },
    reading: {
      total: 36,
      unscored: [19, 20, 21, 22, 23, 24, 25, 26, 27],
      answers: 'ABBACCDAABCCADACBDBDBBAABACDBCDADACB',
      categories: 'CS KID KID KID KID IKI IKI IKI IKI CS CS IKI KID KID KID CS IKI KID - - - - - - - - - KID KID KID CS KID CS CS KID CS',
      table: [1, 3, 5, 7, 9, 10, 11, 11, 12, 13, 14, 15, 16, 17, 18, 20, 21, 22, 23, 24, 25, 27, 28, 30, 32, 34, 35, 36],
      topics: 'FP IN DT DT IN CP CP CP CP FP IN IN IN IN MI FP IN DT FP DT FP DT VC DG DG DG DG IN DT MI AP DT AP VC IN FP',
      pages: [29, 29, 29, 29, 29, 29, 29, 29, 29, 30, 30, 31, 31, 31, 31, 31, 31, 31, 33, 33, 33, 33, 33, 33, 33, 33, 33, 34, 35, 35, 35, 35, 35, 35, 35, 35],
      passagePages: [28, 28, 28, 28, 28, 28, 28, 28, 28, 0, 0, 30, 30, 30, 30, 30, 30, 30, 32, 32, 32, 32, 32, 32, 32, 32, 32, 0, 34, 34, 34, 34, 34, 34, 34, 34],
    },
    science: {
      total: 40,
      unscored: [6, 7, 8, 9, 10, 11],
      answers: 'DABACBBCCACAACCDDCDBBBACDBDADBCCABDABADA',
      categories: 'IOD IOD IOD EMI EMI - - - - - - IOD SIN IOD EMI IOD SIN SIN SIN IOD SIN SIN IOD EMI EMI EMI EMI EMI IOD IOD SIN SIN SIN IOD SIN IOD EMI EMI EMI IOD',
      table: [1, 3, 5, 7, 9, 10, 11, 11, 12, 13, 14, 15, 16, 17, 18, 18, 19, 20, 21, 21, 22, 23, 23, 24, 24, 25, 26, 26, 27, 28, 30, 32, 34, 35, 36],
      topics: 'DR DR DR DR TE CV CV CV CV CV CV GR ED GR TE ED DR ED TE DR TE ED RS CV CV CV CV CV CV TE TE ED TE DR ED OK TE GR RS GR',
      pages: [36, 36, 37, 37, 37, 38, 39, 39, 39, 39, 39, 41, 41, 41, 41, 41, 41, 43, 43, 43, 43, 43, 43, 44, 44, 45, 45, 45, 45, 47, 47, 47, 47, 47, 47, 48, 49, 49, 49, 49],
      passagePages: [0, 0, 36, 36, 36, 0, 38, 38, 38, 38, 38, 40, 40, 40, 40, 40, 40, 42, 42, 42, 42, 42, 42, 0, 0, 44, 44, 44, 44, 46, 46, 46, 46, 46, 46, 0, 48, 48, 48, 48],
    },
  },
  'enhanced-3': {
    english: {
      total: 50,
      unscored: [11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
      answers: 'AABDBDDCBBBDACDCDAACCCABCDCBBACDABCABACDABDBDCCDAB',
      categories: 'POW POW POW POW CSE KLA CSE POW CSE KLA - - - - - - - - - - CSE CSE POW POW CSE CSE CSE POW KLA POW POW POW KLA CSE POW CSE CSE POW CSE CSE CSE POW CSE POW KLA KLA CSE POW KLA POW',
      table: [1, 2, 4, 5, 6, 7, 8, 9, 10, 10, 11, 11, 11, 12, 13, 14, 14, 15, 15, 16, 17, 18, 19, 20, 20, 21, 21, 22, 23, 23, 24, 25, 26, 27, 28, 30, 32, 34, 35, 35, 36],
      topics: 'AD TR AD TR SB CO SB TR CM WC CM CO SC AD TR PR PA TR WC AD SB VT AD OR SC SV PR AD TR AD AD AD TR DP AD SV AP AD MO SC CM TR CM AD WC TR SB AD CO AD',
      pages: [4, 4, 4, 5, 5, 5, 5, 5, 6, 6, 6, 6, 6, 7, 7, 7, 7, 8, 8, 8, 8, 8, 9, 9, 9, 9, 9, 10, 10, 10, 11, 11, 11, 11, 11, 12, 12, 12, 12, 12, 13, 13, 13, 13, 14, 14, 14, 14, 15, 15],
      passagePages: [0, 0, 0, 4, 4, 0, 0, 0, 5, 5, 0, 0, 0, 6, 6, 6, 6, 6, 6, 6, 0, 0, 8, 8, 8, 8, 8, 8, 8, 8, 0, 0, 0, 0, 0, 11, 11, 11, 11, 11, 0, 0, 0, 0, 13, 13, 13, 13, 13, 13],
    },
    math: {
      total: 45,
      unscored: [6, 18, 29, 40],
      answers: 'BDBCBCCDDBADBDBACBADAABCACBBBCBADACDCBCDADACD',
      categories: 'G IES IES IES IES - F N IES A S A S F S A F - S A G G G N IES S G A - G A G IES F N IES N F F - F A G S N',
      table: [1, 4, 7, 9, 10, 11, 12, 13, 14, 14, 14, 14, 15, 15, 16, 16, 16, 17, 17, 17, 18, 18, 19, 20, 21, 22, 23, 24, 25, 25, 26, 27, 27, 28, 29, 30, 31, 33, 34, 35, 36, 36],
      topics: 'CG ST NQ CG WP PG FN CX LI LI PB QP PB SQ ST QP FN PB ST LI PG TG CS NQ CG PB CG QP WP PG LI PG PG FN MX NQ NQ TG QP FN EL QP PG PB WP',
      pages: [16, 16, 16, 17, 17, 17, 17, 17, 18, 18, 18, 18, 19, 19, 19, 19, 20, 20, 20, 20, 20, 21, 21, 21, 21, 22, 22, 22, 23, 23, 23, 24, 24, 24, 25, 25, 25, 25, 25, 26, 26, 26, 26, 27, 27],
      passagePages: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    },
    reading: {
      total: 36,
      unscored: [10, 11, 12, 13, 14, 15, 16, 17, 18],
      answers: 'BCABDACBCBDADDACACAAABACBBADCACDDCAA',
      categories: 'KID CS KID CS KID IKI IKI IKI IKI - - - - - - - - - IKI KID KID KID KID CS KID KID KID KID CS KID KID KID KID KID KID CS',
      table: [1, 3, 5, 7, 9, 10, 11, 11, 12, 13, 14, 15, 16, 17, 18, 20, 21, 22, 23, 24, 25, 27, 28, 30, 32, 34, 35, 36],
      topics: 'MI FP DT VC DT CP CP CP CP MI FP IN FP VC IN DG DG DG FP DT DT IN IN VC DT DT DT MI FP DT DT DT DT DT DT AP',
      pages: [29, 29, 29, 29, 29, 29, 29, 29, 29, 31, 31, 31, 31, 31, 31, 31, 31, 31, 32, 32, 33, 33, 33, 33, 33, 33, 33, 34, 34, 35, 35, 35, 35, 35, 35, 35],
      passagePages: [28, 28, 28, 28, 28, 28, 28, 28, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 0, 0, 32, 32, 32, 32, 32, 32, 32, 0, 0, 34, 34, 34, 34, 34, 34, 34],
    },
    science: {
      total: 40,
      unscored: [11, 12, 13, 14, 15, 16],
      answers: 'DCCABBBDADDBACBDABBCCCBBCDAADABABDDCCDBA',
      categories: 'IOD IOD IOD EMI IOD IOD IOD EMI IOD IOD - - - - - - SIN IOD IOD SIN IOD SIN SIN EMI SIN IOD SIN EMI IOD IOD SIN SIN SIN IOD SIN EMI EMI EMI EMI EMI',
      table: [1, 3, 5, 7, 9, 10, 11, 11, 12, 13, 14, 15, 16, 17, 18, 18, 19, 20, 21, 21, 22, 23, 23, 24, 24, 25, 26, 26, 27, 28, 30, 32, 34, 35, 36],
      topics: 'DR DR TE RS OK DR DR TE DR ED ED ED ED GR RS DR ED GR GR ED GR ED ED RS TE DR OK TE DR DR RS RS TE DR CV CV CV CV CV CV',
      pages: [37, 37, 37, 37, 37, 39, 39, 39, 39, 39, 41, 41, 41, 41, 41, 41, 43, 43, 43, 43, 43, 43, 45, 45, 45, 45, 45, 45, 46, 46, 47, 47, 47, 47, 49, 49, 49, 49, 49, 49],
      passagePages: [36, 36, 36, 36, 36, 38, 38, 38, 38, 38, 40, 40, 40, 40, 40, 40, 42, 42, 42, 42, 42, 42, 44, 44, 44, 44, 44, 44, 0, 0, 46, 46, 46, 46, 48, 48, 48, 48, 48, 48],
    },
  },
  'enhanced-4': {
    english: {
      total: 50,
      unscored: [31, 32, 33, 34, 35, 36, 37, 38, 39, 40],
      answers: 'BCADDCBDADCDBDACDBADADADCDCADBDADBCDACADBCDAACDACD',
      categories: 'POW CSE POW KLA CSE CSE CSE POW CSE POW CSE CSE POW KLA KLA POW CSE CSE CSE POW CSE KLA POW KLA POW POW POW KLA KLA CSE - - - - - - - - - - CSE POW POW CSE POW CSE CSE KLA POW POW',
      table: [1, 2, 4, 5, 6, 7, 8, 9, 10, 10, 11, 11, 11, 12, 13, 14, 14, 15, 15, 16, 17, 18, 19, 20, 20, 21, 21, 22, 23, 23, 24, 25, 26, 27, 28, 30, 32, 34, 35, 35, 36],
      topics: 'AD DP AD CO SB SB PR TR AP AD SC VT TR PA CO AD PR PR CM TR SB CO AD WC AD TR AD WC CO SB SV AD CO WC SB SC SB TR OR AD CM AD AD PA AD SB PR WC AD AD',
      pages: [4, 4, 4, 5, 5, 5, 5, 5, 6, 6, 6, 6, 7, 7, 7, 7, 7, 8, 8, 8, 8, 9, 9, 9, 9, 10, 10, 10, 10, 10, 11, 11, 11, 12, 12, 12, 12, 12, 13, 13, 13, 13, 14, 14, 14, 14, 15, 15, 15, 15],
      passagePages: [0, 0, 0, 4, 4, 4, 4, 4, 4, 4, 0, 0, 6, 6, 6, 0, 0, 7, 7, 7, 7, 7, 7, 7, 7, 0, 0, 0, 0, 0, 0, 0, 0, 11, 11, 11, 11, 11, 11, 11, 0, 0, 13, 13, 13, 13, 13, 13, 13, 13],
    },
    math: {
      total: 45,
      unscored: [8, 16, 28, 39],
      answers: 'BBCDADCBDDCCBAADBDDBBCDBBDBBBACBDCCDBCAADCCDD',
      categories: 'G IES IES F A IES N - G F IES G N A F - A A S A G IES F F S IES S - N A G N IES S F IES G G - G A F F N S',
      table: [1, 4, 7, 9, 10, 11, 12, 13, 14, 14, 14, 14, 15, 15, 16, 16, 16, 17, 17, 17, 18, 18, 19, 20, 21, 22, 23, 24, 25, 25, 26, 27, 27, 28, 29, 30, 31, 33, 34, 35, 36, 36],
      topics: 'PG ST WP FN QP WP MX NQ PG FN LI PG WP QP FN CG NQ QP ST EL PG WP SQ TG PB WP ST LI NQ FN CG CX NQ PB EL PG PG CG CS TG WP QP SQ NQ PB',
      pages: [16, 16, 16, 17, 17, 17, 17, 18, 18, 18, 18, 19, 19, 19, 19, 19, 20, 20, 20, 20, 21, 21, 21, 21, 22, 22, 22, 23, 23, 23, 23, 23, 24, 24, 24, 24, 25, 25, 25, 26, 26, 26, 26, 27, 27],
      passagePages: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    },
    reading: {
      total: 36,
      unscored: [19, 20, 21, 22, 23, 24, 25, 26, 27],
      answers: 'CDBBCBAADAABCDCCCBDCBDDBBBDABBDBCDBC',
      categories: 'CS KID KID CS KID IKI IKI IKI IKI KID CS KID KID CS CS KID KID CS - - - - - - - - - KID IKI KID KID CS IKI IKI IKI IKI',
      table: [1, 3, 5, 7, 9, 10, 11, 11, 12, 13, 14, 15, 16, 17, 18, 20, 21, 22, 23, 24, 25, 27, 28, 30, 32, 34, 35, 36],
      topics: 'FP MI MI FP DT CP CP CP CP IN FP DT IN VC IN IN DT FP IN DT FP IN DT DT IN AP VC DT FP DT DT AP DG DG DG DG',
      pages: [29, 29, 29, 29, 29, 29, 29, 30, 30, 31, 31, 31, 31, 31, 31, 31, 31, 31, 32, 32, 33, 33, 33, 33, 33, 33, 33, 34, 35, 35, 35, 35, 35, 35, 35, 35],
      passagePages: [28, 28, 28, 28, 28, 28, 28, 28, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 0, 0, 32, 32, 32, 32, 32, 32, 32, 0, 34, 34, 34, 34, 34, 34, 34, 34],
    },
    science: {
      total: 40,
      unscored: [6, 7, 8, 9, 10, 11],
      answers: 'CBBCABBBDCACBDBAACAADDDACCDBBDBBBACAADCD',
      categories: 'EMI EMI IOD IOD EMI - - - - - - IOD EMI EMI IOD IOD SIN IOD IOD IOD EMI SIN SIN IOD IOD SIN SIN IOD EMI EMI IOD IOD IOD EMI SIN SIN SIN SIN EMI IOD',
      table: [1, 3, 5, 7, 9, 10, 11, 11, 12, 13, 14, 15, 16, 17, 18, 18, 19, 20, 21, 21, 22, 23, 23, 24, 24, 25, 26, 26, 27, 28, 30, 32, 34, 35, 36],
      topics: 'DR DR DR DR TE GR GR GR ED GR TE DR DR RS DR OK ED DR DR DR RS ED ED TE DR TE ED DR CV CV CV CV CV CV ED ED ED TE RS DR',
      pages: [37, 37, 37, 37, 37, 38, 39, 39, 39, 39, 39, 41, 41, 41, 41, 41, 43, 43, 43, 43, 43, 43, 45, 45, 45, 45, 45, 45, 47, 47, 47, 47, 47, 47, 48, 49, 49, 49, 49, 49],
      passagePages: [36, 36, 36, 36, 36, 0, 38, 38, 38, 38, 38, 40, 40, 40, 40, 40, 42, 42, 42, 42, 42, 42, 44, 44, 44, 44, 44, 44, 46, 46, 46, 46, 46, 46, 0, 48, 48, 48, 48, 48],
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
    KLA: ['Word choice and idioms', 'Concision and redundancy', 'Transitions'],
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

/**
 * Everything known about one question of a keyed test, or null when the test isn't keyed:
 * key letter (A to D), scored flag, reporting category, topic name, booklet page, and the page its
 * passage or figure starts on (null when it's the same page).
 */
export function keyFor(sourceId, section, q) {
  const f = formSection(sourceId, section);
  const n = Number(q);
  if (!f || !Number.isInteger(n) || n < 1 || n > f.total) return null;
  const cat = f.categories.split(' ')[n - 1];
  const code = f.topics ? f.topics.split(' ')[n - 1] : null;
  return {
    answer: f.answers[n - 1],
    unscored: f.unscored.includes(n),
    category: cat === '-' ? null : cat,
    topic: (code && TOPIC_CODES[section][code]) || null,
    page: f.pages ? f.pages[n - 1] : null,
    passagePage: f.passagePages && f.passagePages[n - 1] ? f.passagePages[n - 1] : null,
  };
}

/** The letter the paper booklet prints for an A to D key letter: F, G, H, J on even questions. */
export function bookletLetter(letter, q) {
  return Number(q) % 2 === 0 ? { A: 'F', B: 'G', C: 'H', D: 'J' }[letter] || letter : letter;
}

export function isKeyed(sourceId) {
  return Boolean(FORMS[sourceId]);
}
