import test from 'node:test';
import assert from 'node:assert/strict';
import { LESSONS, lessonFor, topicSlug, topicFromSlug, lessonHref } from '../js/data/lessons.js';
import { LESSON_VIDEOS } from '../js/data/lesson-videos.js';
import { DEFAULT_TOPICS } from '../js/data/topics.js';

const sentences = (s) => s.trim().split(/(?<=[.!?])\s+(?=[A-Z])/).filter(Boolean);

function allText(l) {
  return [
    l.summary,
    ...l.sections.flatMap((x) => [x.h, ...(x.p || []), ...(x.list || [])]),
    l.example.prompt,
    ...l.example.choices,
    ...l.example.steps,
    ...l.check.flatMap((c) => [c.q, c.a]),
  ];
}

for (const [section, topics] of Object.entries(DEFAULT_TOPICS)) {
  for (const topic of topics) {
    test(`lesson: ${section} / ${topic}`, () => {
      const l = lessonFor(section, topic);
      assert.ok(l, 'every taxonomy topic has a lesson');
      assert.equal(sentences(l.summary).length, 2, `two-sentence summary: ${l.summary}`);
      assert.ok(l.sections.length >= 2, 'has an explanation in sections');
      for (const s of l.sections) assert.ok(s.h && ((s.p && s.p.length) || (s.list && s.list.length)), 'each section has content');
      assert.ok(l.example.prompt && l.example.steps.length >= 2, 'worked example with steps');
      assert.equal(l.example.choices.length, 4);
      assert.ok(l.example.choices.some((c) => c.startsWith(`${l.example.answer}.`)), 'answer letter matches a choice');
      assert.ok(l.check.length >= 2 && l.check.length <= 4, '2 to 4 self-check questions');
      assert.ok(l.videos.length >= 1 && l.videos.length <= 3, '1 to 3 videos');
      for (const v of l.videos) {
        assert.match(v.id, /^[A-Za-z0-9_-]{11}$/);
        assert.equal(v.url, `https://www.youtube.com/watch?v=${v.id}`);
        assert.ok(v.title && !/[—]/.test(v.title));
      }
      const text = allText(l).join(' ');
      assert.ok(!text.includes('—'), 'no em dashes in lesson copy');
      const words = text.split(/\s+/).length;
      assert.ok(words <= 650, `fits on about a page (${words} words)`);
      // [[...]] marks an underline and only belongs in example prompts.
      for (const s of allText({ ...l, example: { ...l.example, prompt: '' } })) assert.ok(!s.includes('[['), `stray underline marker: ${s.slice(0, 40)}`);
      assert.equal(topicFromSlug(section, topicSlug(topic)), topic, 'slug round-trips');
    });
  }
}

test('lessons: no lessons or videos for topics outside the taxonomy', () => {
  for (const [section, lessons] of Object.entries(LESSONS)) {
    for (const t of Object.keys(lessons)) assert.ok(DEFAULT_TOPICS[section].includes(t), `${section}: ${t}`);
  }
  const all = Object.values(DEFAULT_TOPICS).flat();
  for (const t of Object.keys(LESSON_VIDEOS)) assert.ok(all.includes(t), t);
});

test('lessons: custom topics have no lesson, and links are hash routes', () => {
  assert.equal(lessonFor('english', 'My own topic'), null);
  assert.equal(lessonHref('english', "Writer's purpose"), '#/learn/english/writers-purpose');
  assert.equal(lessonHref('math', 'Trigonometry and the unit circle'), '#/learn/math/trigonometry-and-the-unit-circle');
});
