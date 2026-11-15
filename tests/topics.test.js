import test from 'node:test';
import assert from 'node:assert/strict';
import { topicsOf, topicLabel, toggleTopic, MAX_TOPICS } from '../js/data/topics.js';

test('topics: older misses with one topic still work', () => {
  assert.deepEqual(topicsOf({ topic: 'Commas' }), ['Commas']);
  assert.deepEqual(topicsOf({ topic: '' }), []);
  assert.deepEqual(topicsOf({ topic: 'Commas', topics: ['Transitions', 'Commas'] }), ['Transitions', 'Commas']);
  assert.equal(topicLabel({ topics: ['Commas', 'Transitions'] }), 'Commas, Transitions');
});

test('topics: at most 3, no duplicates', () => {
  assert.equal(MAX_TOPICS, 3);
  assert.deepEqual(topicsOf({ topics: ['a', 'b', 'a', 'c', 'd'] }), ['a', 'b', 'c']);
  let list = [];
  for (const t of ['a', 'b', 'c']) list = toggleTopic(list, t);
  assert.deepEqual(list, ['a', 'b', 'c']);
  assert.equal(toggleTopic(list, 'd'), null);
  assert.deepEqual(toggleTopic(list, 'b'), ['a', 'c']);
});
