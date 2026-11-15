import test from 'node:test';
import assert from 'node:assert/strict';
import { parseResults, checkResults, missedNumbers, splitSections } from '../js/logic/results-import.js';

// A made-up results page: invented questions, same shape as the online results.
function fakePage({ header = 'ACT Practice 7 - Science', statuses, score, total = statuses.length, answers = true }) {
  const lines = [header, `SCORE ${score ?? statuses.filter((s) => s === 'Correct').length} of ${total}`, ''];
  statuses.forEach((st, i) => {
    lines.push(`Which made-up value fits trial ${i + 1} best?`);
    lines.push('Some more of the made-up question.');
    if (answers && st !== 'Unanswered') lines.push(`Your answer: ${i % 2 ? 'Blue' : 'Green'}`);
    lines.push(st);
    lines.push('');
  });
  return lines.join('\n');
}

const fiveStatuses = ['Correct', 'Incorrect', 'Correct', 'Unanswered', 'Correct'];

test('import: reads header, score, and results in order', () => {
  const p = parseResults(fakePage({ statuses: fiveStatuses }));
  assert.equal(p.section, 'science');
  assert.equal(p.testNumber, 7);
  assert.equal(p.score, 3);
  assert.equal(p.total, 5);
  assert.deepEqual(p.results, ['correct', 'incorrect', 'correct', 'incorrect', 'correct']);
  assert.deepEqual(missedNumbers(p), [2, 4]);
});

test('import: an unanswered question counts as a miss', () => {
  const p = parseResults(fakePage({ statuses: ['Correct', 'Not answered'] }));
  assert.deepEqual(p.results, ['correct', 'incorrect']);
});

test('import: keeps the first line and answer of each question as hints', () => {
  const p = parseResults(fakePage({ statuses: fiveStatuses }));
  assert.deepEqual(p.questions[1], { text: 'Which made-up value fits trial 2 best?', answer: 'Blue' });
  assert.equal(p.questions[3].answer, null);
});

test('import: other header styles and section names', () => {
  assert.equal(parseResults('ACT Practice Test 2: Mathematics\nScore: 1/1\nCorrect').section, 'math');
  assert.equal(parseResults('ACT Practice 4 – Reading\nSCORE 0 of 1\nIncorrect').testNumber, 4);
  assert.equal(parseResults('ACT Practice 1 - English').section, 'english');
});

test('import: a "Correct answer" line or the word inside a sentence is not a result', () => {
  const p = parseResults('ACT Practice 1 - English\nSCORE 1 of 1\nIs this correct as written?\nCorrect answer: B\nCorrect');
  assert.deepEqual(p.results, ['correct']);
});

test('import: a passing file has no message', () => {
  assert.equal(checkResults(parseResults(fakePage({ statuses: fiveStatuses })), 5), null);
});

test('import fails: wrong question count', () => {
  const p = parseResults(fakePage({ header: 'ACT Practice 3 - English', statuses: Array(49).fill('Correct') }));
  assert.equal(checkResults(p, 50), 'This file has 49 questions, but English has 50. Mark them by hand or try another file.');
});

test('import fails: score does not match the results', () => {
  const p = parseResults(fakePage({ statuses: fiveStatuses, score: 4 }));
  assert.match(checkResults(p, 5), /shows 3 correct, but its score says 4/);
});

test('import fails: unknown section', () => {
  const p = parseResults(fakePage({ header: 'ACT Practice 3 - Writing', statuses: fiveStatuses }));
  assert.equal(p.section, null);
  assert.match(checkResults(p, 5), /Couldn't tell which section/);
});

test('import fails: missing score line or no results', () => {
  assert.match(checkResults(parseResults('ACT Practice 3 - Math\nCorrect'), 1), /score line/);
  assert.match(checkResults(parseResults('ACT Practice 3 - Math\nSCORE 0 of 1'), 1), /Couldn't find any/);
});

test('import: splits several sections, ignoring a repeated page header', () => {
  const text = [fakePage({ header: 'ACT Practice 3 - English', statuses: ['Correct'] }), 'ACT Practice 3 - English', 'Correct', fakePage({ header: 'ACT Practice 3 - Math', statuses: ['Incorrect'] })].join('\n');
  const chunks = splitSections(text);
  assert.equal(chunks.length, 2);
  assert.deepEqual(parseResults(chunks[0]).results, ['correct', 'correct']);
  assert.equal(parseResults(chunks[1]).section, 'math');
});
