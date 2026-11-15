// One lesson per topic in the taxonomy: a two-sentence summary, a short explanation, a worked example,
// self-check questions, and videos. Original content, no official ACT text.
import english from './lessons/english.js';
import math from './lessons/math.js';
import reading from './lessons/reading.js';
import science from './lessons/science.js';
import { LESSON_VIDEOS, videoUrl } from './lesson-videos.js';

export const LESSONS = { english, math, reading, science };

/** The lesson for a topic, or null for custom topics. */
export function lessonFor(section, topic) {
  const l = LESSONS[section] && LESSONS[section][topic];
  if (!l) return null;
  return { ...l, section, topic, videos: (LESSON_VIDEOS[topic] || []).map((v) => ({ ...v, url: videoUrl(v.id) })) };
}

/** URL-safe id for a topic, used in #/learn/<section>/<slug>. */
export function topicSlug(topic) {
  return String(topic)
    .toLowerCase()
    .replace(/'/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function topicFromSlug(section, slug) {
  const lessons = LESSONS[section] || {};
  return Object.keys(lessons).find((t) => topicSlug(t) === slug) || null;
}

/** Hash route for a topic's lesson. */
export function lessonHref(section, topic) {
  return `#/learn/${section}/${topicSlug(topic)}`;
}
