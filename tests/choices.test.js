import test from 'node:test';
import assert from 'node:assert/strict';
import { parseChoices, matchChoice } from '../js/logic/choices.js';

// Made-up booklet text in the booklet's layout (no real questions).
const page = ' 7. Which made-up word fits best? A. No Change B. pretend, C. invented; D. imaginary 8. Which pretend transition is most logical? F. No Change G. Meanwhile, H. Instead, J. So far, 9. Another made-up question? A. 1 B. 2 C. 3 D. 4 ';

test('choices: reads A to D, and F to J on even questions as A to D', () => {
  assert.deepEqual(parseChoices(page, 7).map((c) => c.text), ['No Change', 'pretend,', 'invented;', 'imaginary']);
  const eight = parseChoices(page, 8);
  assert.deepEqual(eight.map((c) => c.letter), ['A', 'B', 'C', 'D']);
  assert.equal(eight[3].text, 'So far,');
  assert.equal(parseChoices(page, 12), null);
});

test('choices: a number inside question text is not mistaken for the question', () => {
  const t = ' 3. The value is 4. here. A. one B. two C. three D. four 4. Next? F. a G. b H. c J. d ';
  assert.equal(parseChoices(t, 4)[0].text, 'a');
});

test('choices: match a results-page answer to its choice', () => {
  const c = parseChoices(page, 8);
  assert.equal(matchChoice(c, 'So far,').letter, 'D');
  assert.equal(matchChoice(c, 'instead').letter, 'C');
  assert.equal(matchChoice(c, 'H').letter, 'C');
  assert.equal(matchChoice(c, 'Meanwh...').letter, 'B');
  assert.equal(matchChoice(c, 'something else'), null);
  assert.equal(matchChoice(null, 'x'), null);
});

test('choices: a choice ends where the text jumps to another column', () => {
  const t = ' 6. Pretend? F. No Change G. one H. two J. three, ¶ 7 Made-up passage text continues here. 7. Next? A. a B. b C. c D. d ';
  assert.equal(parseChoices(t, 6)[3].text, 'three,');
});

test('choices: math italic letters and moved subscripts still match, numbers alone do not', () => {
  const math = [{ letter: 'A', text: 'a = b' }, { letter: 'B', text: 'a > b' }, { letter: 'C', text: 'x' }, { letter: 'D', text: 'y' }];
  assert.equal(matchChoice(math, '𝑎 = 𝑏').letter, 'A');
  const sub = [{ letter: 'A', text: 'at the made-up BP for H O at 1 atm. 2' }, { letter: 'B', text: 'above the made-up BP for H O at 2 1 atm.' }, { letter: 'C', text: 'c' }, { letter: 'D', text: 'd' }];
  assert.equal(matchChoice(sub, 'above the made-up BP for H O at 1 atm.').letter, 'B');
  const trials = [{ letter: 'A', text: 'Trial 2' }, { letter: 'B', text: 'Trial 4' }, { letter: 'C', text: 'Trial 6' }, { letter: 'D', text: 'Trial 8' }];
  assert.equal(matchChoice(trials, 'Trial 6').letter, 'C');
  assert.equal(matchChoice(trials, 'Trial 5'), null);
});
