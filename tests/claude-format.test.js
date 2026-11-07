import test from 'node:test';
import assert from 'node:assert/strict';
import { explainChatPrompt, coachChatPrompt, parseJsonReply, normalizeExplain, normalizeCoach, EXPLAIN_SYSTEM } from '../js/logic/claude-format.js';

test('explain chat prompt carries the details and asks for the JSON shape', () => {
  const p = explainChatPrompt({ section: 'reading', topic: 'Inference', description: 'Q14 about the narrator', myAnswer: 'B', correctAnswer: 'D' }, { photo: true });
  for (const s of ['Section: reading', 'Topic he tagged: Inference', 'Q14 about the narrator', 'His answer: B', 'Correct answer: D', 'photo of the question', '"fixLine"', 'JSON code block']) {
    assert.ok(p.includes(s), s);
  }
  assert.ok(!/[–—]/.test(p), 'no dashes in copy');
  assert.ok(!explainChatPrompt({ section: 'math', description: 'x' }).includes('photo'));
});

test('built-in and chat modes share the same tutor instructions', () => {
  const p = explainChatPrompt({ section: 'math', description: 'x' });
  assert.ok(p.startsWith(EXPLAIN_SYSTEM.split('\nRespond with JSON')[0]));
});

test('coach chat prompt holds the stats JSON', () => {
  const p = coachChatPrompt({ daysLeft: 20, estimatedComposite: 34 });
  assert.ok(p.includes('{"daysLeft":20,"estimatedComposite":34}'));
  assert.ok(p.includes('"suggestion"'));
});

test('a pasted chat reply with prose around a fenced block parses', () => {
  const reply = 'Here you go:\n\n```json\n{"explanation":"E","rule":"R","trap":null,"fixLine":"F","suggestedTopic":"Inference","suggestedCause":"trap"}\n```\nGood luck!';
  const r = normalizeExplain(parseJsonReply(reply), reply);
  assert.equal(r.raw, false);
  assert.equal(r.fixLine, 'F');
  assert.equal(r.suggestedCause, 'trap');
});

test('an unstructured reply is kept as plain text', () => {
  const r = normalizeExplain(parseJsonReply('Just words.'), 'Just words.');
  assert.equal(r.raw, true);
  assert.equal(r.explanation, 'Just words.');
  const c = normalizeCoach(null, 'A note.');
  assert.deepEqual(c, { note: 'A note.', suggestion: null });
});
