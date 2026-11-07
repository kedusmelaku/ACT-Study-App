// POST /api/explain: explain one missed ACT question. Images are passed through and never stored.
import { guard, send } from './_auth.js';
import { callClaude, parseJsonReply, clip } from './_claude.js';

const SECTIONS = ['english', 'math', 'reading', 'science'];
const CAUSES = ['content', 'careless', 'time', 'trap'];
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export const SYSTEM = `You are a concise ACT tutor for a student who already scores 34 or higher. His remaining misses come from careless errors, traps, and a few niche topics.
For the question he describes:
1. Identify the exact rule or skill being tested.
2. Explain why the correct answer is right and why his answer was tempting.
3. Name the trap if there was one.
4. Give a one-line fix he can reuse on future questions.
No padding, no praise, no restating the question. Do not use em dashes.
Respond with JSON only, no code fences, in exactly this shape:
{"explanation": string (at most 120 words), "rule": string (one sentence), "trap": string or null, "fixLine": string (one line, at most 20 words), "suggestedTopic": string (a short ACT topic name), "suggestedCause": one of "content", "careless", "time", "trap"}`;

export function buildContent(body) {
  const section = SECTIONS.includes(body.section) ? body.section : null;
  const lines = [
    `Section: ${section || 'unknown'}`,
    body.topic ? `Topic he tagged: ${clip(body.topic, 80)}` : null,
    body.description ? `Question (his description): ${clip(body.description, 3000)}` : null,
    body.myAnswer ? `His answer: ${clip(body.myAnswer, 200)}` : null,
    body.correctAnswer ? `Correct answer: ${clip(body.correctAnswer, 200)}` : null,
    body.myReasoning ? `His reasoning: ${clip(body.myReasoning, 1500)}` : null,
    body.image ? 'A photo of the question from his own practice test is attached.' : null,
  ].filter(Boolean);
  const content = [];
  if (body.image && typeof body.image === 'object') {
    content.push({ type: 'image', source: { type: 'base64', media_type: body.image.mediaType, data: body.image.data } });
  }
  content.push({ type: 'text', text: lines.join('\n') });
  return content;
}

export function validate(body) {
  if (!body || typeof body !== 'object') return false;
  if (!SECTIONS.includes(body.section)) return false;
  const hasText = typeof body.description === 'string' && body.description.trim().length > 0;
  const img = body.image;
  if (img !== undefined && img !== null) {
    if (typeof img !== 'object' || !IMAGE_TYPES.includes(img.mediaType) || typeof img.data !== 'string' || !/^[A-Za-z0-9+/=]+$/.test(img.data)) return false;
  }
  return hasText || !!img;
}

export function normalize(parsed, text) {
  if (!parsed) return { explanation: text, rule: '', trap: null, fixLine: '', suggestedTopic: '', suggestedCause: null, raw: true };
  return {
    explanation: clip(parsed.explanation, 2000) || text,
    rule: clip(parsed.rule, 400),
    trap: parsed.trap ? clip(parsed.trap, 400) : null,
    fixLine: clip(parsed.fixLine, 200),
    suggestedTopic: clip(parsed.suggestedTopic, 60),
    suggestedCause: CAUSES.includes(parsed.suggestedCause) ? parsed.suggestedCause : null,
    raw: false,
  };
}

export default async function handler(req, res, deps = {}) {
  const body = await guard(req, res);
  if (!body) return;
  if (!validate(body)) return send(res, 400, { error: 'bad_request' });
  try {
    const text = await callClaude({ system: SYSTEM, content: buildContent(body), maxTokens: 700, fetchImpl: deps.fetch });
    return send(res, 200, normalize(parseJsonReply(text), text));
  } catch (e) {
    console.error('explain failed', e.message);
    return send(res, e.status && e.status < 600 ? e.status : 502, { error: 'upstream' });
  }
}
