// Parse an online practice-test results page (pasted text or text pulled from its PDF).
// The page lists every question in order with "Correct" or "Incorrect" under it, without numbers.
// Pure: no DOM, no storage. Question text is only read to build in-memory hints; callers must not save it.
import { SECTIONS } from '../data/act.js';

const SECTION_WORDS = [
  ['english', /english/i],
  ['math', /math(ematics)?/i],
  ['reading', /reading/i],
  ['science', /science/i],
];

// "ACT Practice 3 - English", "ACT Practice Test 3: Mathematics", and similar.
const HEADER = /\bACT\b[^\n]*?\bPractice(?:\s+Test)?\s*#?\s*(\d+)\s*[-–—:|]\s*([A-Za-z]+)/i;
const SCORE = /\bSCORE\b\s*:?\s*(\d+)\s*(?:of|out of|\/)\s*(\d+)/i;
// A status on a line of its own, allowing icons or punctuation around it.
const STATUS = /^[^A-Za-z0-9]*(correct|incorrect|unanswered|not answered|no answer|omitted|skipped|blank)[^A-Za-z0-9]*$/i;
const ANSWER = /^(?:your answer|your response|you answered|your choice|selected(?: answer)?)\s*[:\-]?\s*(.*)$/i;
const NOISE = [HEADER, SCORE, /^page\s+\d+/i, /^\d+\s*(?:of|\/)\s*\d+$/, /^https?:\/\//i, /^\d{1,2}\/\d{1,2}\/\d{2,4}/, /^(question|item)\s*\d*$/i, /^\d+[.)]?$/];

function sectionFromWord(word) {
  for (const [key, re] of SECTION_WORDS) if (re.test(word)) return key;
  return null;
}

function cleanLines(text) {
  return String(text || '')
    .replace(/\r\n?/g, '\n')
    .replace(/ /g, ' ')
    .split('\n')
    .map((l) => l.replace(/\s+/g, ' ').trim())
    .filter(Boolean);
}

function isNoise(line) {
  return NOISE.some((re) => re.test(line));
}

/**
 * Parse one section's results.
 * Returns { section, testNumber, score, total, results, questions } where results is
 * ['correct' | 'incorrect', ...] in question order (an unanswered question is 'incorrect'),
 * and questions[i] = { text, answer } holds the question's first line and the student's answer
 * when the file shows them. section, testNumber, score, and total are null when not found.
 */
export function parseResults(text) {
  const lines = cleanLines(text);
  let section = null;
  let testNumber = null;
  let score = null;
  let total = null;
  for (const line of lines) {
    const h = HEADER.exec(line);
    if (h && section === null) {
      section = sectionFromWord(h[2]);
      testNumber = Number(h[1]);
    }
    const s = SCORE.exec(line);
    if (s && score === null) {
      score = Number(s[1]);
      total = Number(s[2]);
    }
  }
  const results = [];
  const questions = [];
  let block = [];
  for (const line of lines) {
    const st = STATUS.exec(line);
    if (st) {
      results.push(st[1].toLowerCase() === 'correct' ? 'correct' : 'incorrect');
      questions.push(hintFrom(block));
      block = [];
    } else {
      block.push(line);
    }
  }
  return { section, testNumber, score, total, results, questions };
}

function hintFrom(block) {
  let answer = null;
  let first = null;
  for (const line of block) {
    const a = ANSWER.exec(line);
    if (a) {
      answer = a[1].trim() || null;
      continue;
    }
    if (first === null && !isNoise(line) && !/^(correct answer|answer)\b/i.test(line)) first = line;
  }
  return { text: first ? first.slice(0, 140) : null, answer: answer ? answer.slice(0, 60) : null };
}

/**
 * Split text that may hold several sections (one results page per section) into one chunk per
 * section. A header repeated on every page of the same section doesn't start a new chunk.
 */
export function splitSections(text) {
  const lines = String(text || '').replace(/\r\n?/g, '\n').split('\n');
  const chunks = [];
  let cur = [];
  let curSection;
  for (const line of lines) {
    const h = HEADER.exec(line);
    const sec = h ? sectionFromWord(h[2]) : undefined;
    if (h && curSection !== undefined && sec !== curSection) {
      chunks.push(cur.join('\n'));
      cur = [];
    }
    if (h) curSection = sec;
    cur.push(line);
  }
  if (cur.length) chunks.push(cur.join('\n'));
  return chunks.filter((c) => c.trim());
}

/**
 * Check a parsed section before anything gets marked. `questionCount` is how many questions the
 * section has in the chosen test. Returns a plain message, or null when it's safe to import.
 */
export function checkResults(parsed, questionCount) {
  if (!parsed || !parsed.section) return "Couldn't tell which section this is. Make sure the header, like \"ACT Practice 3 - English\", is included.";
  const label = SECTIONS[parsed.section].label;
  const n = parsed.results.length;
  if (!n) return `Couldn't find any Correct or Incorrect results for ${label}. Mark them by hand or try another file.`;
  if (n !== questionCount) return `This file has ${n} ${n === 1 ? 'question' : 'questions'}, but ${label} has ${questionCount}. Mark them by hand or try another file.`;
  const right = parsed.results.filter((r) => r === 'correct').length;
  if (parsed.score === null) return `Couldn't find the score line for ${label}, so the results can't be checked. Mark them by hand or try another file.`;
  if (right !== parsed.score) return `This file shows ${right} correct, but its score says ${parsed.score}. Mark them by hand or try another file.`;
  return null;
}

/** Question numbers (1-based) marked incorrect. */
export function missedNumbers(parsed) {
  const out = [];
  parsed.results.forEach((r, i) => {
    if (r === 'incorrect') out.push(i + 1);
  });
  return out;
}
