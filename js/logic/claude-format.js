// Prompts and reply parsing for Explain and Coach. Pure, and shared by the browser
// (copy-to-chat mode) and the /api routes (built-in mode), so both ask Claude the same thing.

export const SECTION_KEYS = ['english', 'math', 'reading', 'science'];
export const CAUSE_KEYS = ['content', 'careless', 'time', 'trap'];

const EXPLAIN_SHAPE =
  '{"explanation": string (at most 120 words), "rule": string (one sentence), "trap": string or null, "fixLine": string (one line, at most 20 words), "suggestedTopic": string (a short ACT topic name), "suggestedCause": one of "content", "careless", "time", "trap"}';

/** Who the student is, from their own estimated composite (no fixed level baked in). */
export function studentLine(level) {
  const n = Number(level);
  if (Number.isInteger(n) && n >= 1 && n <= 36) {
    if (n >= 33) return `a student whose estimated ACT composite is ${n}. Their remaining misses are mostly careless errors, traps, and a few niche topics`;
    return `a student whose estimated ACT composite is ${n}`;
  }
  return 'an ACT student';
}

function explainInstructions(level) {
  return `You are a concise ACT tutor for ${studentLine(level)}.
For the question they describe:
1. Identify the exact rule or skill being tested.
2. Explain why the correct answer is right and why their answer was tempting.
3. Name the trap if there was one.
4. Give a one-line fix they can reuse on future questions.
Pitch the explanation at their level. No padding, no praise, no restating the question. Do not use em dashes.`;
}

export function explainSystem(level) {
  return `${explainInstructions(level)}
Respond with JSON only, no code fences, in exactly this shape:
${EXPLAIN_SHAPE}`;
}
export const EXPLAIN_SYSTEM = explainSystem(null);

const COACH_SHAPE =
  '{"note": string, "suggestion": null or {"text": string, "setting": null or {"type": "availability", "day": integer 0-6 where 0 is Sunday, "minutes": integer 0-240}}}';

const COACH_INSTRUCTIONS = `You are a calm, direct ACT coach for a high school student fitting test prep around a busy school schedule. You get an aggregated stats summary for their week; estimatedComposite is their current level.
Write a coaching note of at most 5 sentences: what the numbers say, what to keep doing, what to watch. Be specific to the numbers. No padding, no em dashes.
You may add at most one concrete suggestion, phrased as an option they can take or leave. The app's planner stays in charge; your note is advisory.
If habitsToWatch lists anything, name the most important one plainly and say how to fix it.
If the suggestion is to change study time on a weekday, include a setting so the app can offer an Apply button.`;

export const COACH_SYSTEM = `${COACH_INSTRUCTIONS}
Respond with JSON only, no code fences, in exactly this shape:
${COACH_SHAPE}`;

export function clip(v, n) {
  return typeof v === 'string' ? v.slice(0, n) : '';
}

/** The question details as plain lines, used in both modes. */
export function explainDetails(body, { photo = !!body.image } = {}) {
  const section = SECTION_KEYS.includes(body.section) ? body.section : null;
  return [
    `Section: ${section || 'unknown'}`,
    body.topic ? `Topic they tagged: ${clip(body.topic, 80)}` : null,
    body.description ? `Question (their description): ${clip(body.description, 3000)}` : null,
    body.myAnswer ? `Their answer: ${clip(body.myAnswer, 200)}` : null,
    body.correctAnswer ? `Correct answer: ${clip(body.correctAnswer, 200)}` : null,
    body.myReasoning ? `Their reasoning: ${clip(body.myReasoning, 1500)}` : null,
    photo ? 'A photo of the question from their own practice test is attached.' : null,
  ]
    .filter(Boolean)
    .join('\n');
}

/** One message to paste into a Claude chat (claude.ai), asking for the same JSON the app parses. */
export function explainChatPrompt(body, { photo = false, level = null } = {}) {
  return `${explainInstructions(level)}

${explainDetails(body, { photo })}

Reply with only a JSON code block in exactly this shape, so my study app can read it:
${EXPLAIN_SHAPE}`;
}

export function coachChatPrompt(stats) {
  return `${COACH_INSTRUCTIONS}

This week's stats (JSON):
${statsJson(stats)}

Reply with only a JSON code block in exactly this shape, so my study app can read it:
${COACH_SHAPE}`;
}

/** Aggregated numbers and short labels only, capped in size. */
export function statsJson(stats) {
  const json = JSON.stringify(stats || {});
  return json.length > 20000 ? json.slice(0, 20000) : json;
}

/** Strip ``` fences and parse a JSON object, also when it sits inside prose. Null if there is none. */
export function parseJsonReply(text) {
  let t = String(text || '').trim();
  const fenced = t.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fenced) t = fenced[1].trim();
  if (!t.startsWith('{')) {
    const start = t.indexOf('{');
    const end = t.lastIndexOf('}');
    if (start === -1 || end <= start) return null;
    t = t.slice(start, end + 1);
  }
  try {
    const v = JSON.parse(t);
    return v && typeof v === 'object' && !Array.isArray(v) ? v : null;
  } catch {
    return null;
  }
}

/** Explain result in a fixed shape. Falls back to the raw text as the explanation. */
export function normalizeExplain(parsed, text) {
  if (!parsed) return { explanation: clip(String(text || '').trim(), 4000), rule: '', trap: null, fixLine: '', suggestedTopic: '', suggestedCause: null, raw: true };
  return {
    explanation: clip(parsed.explanation, 2000) || clip(String(text || ''), 2000),
    rule: clip(parsed.rule, 400),
    trap: parsed.trap ? clip(parsed.trap, 400) : null,
    fixLine: clip(parsed.fixLine, 200),
    suggestedTopic: clip(parsed.suggestedTopic, 60),
    suggestedCause: CAUSE_KEYS.includes(parsed.suggestedCause) ? parsed.suggestedCause : null,
    raw: false,
  };
}

/** Coach result in a fixed shape. Only a valid weekday availability change becomes an Apply-able setting. */
export function normalizeCoach(parsed, text) {
  if (!parsed) return { note: clip(String(text || '').trim(), 1500), suggestion: null };
  let suggestion = null;
  const s = parsed.suggestion;
  if (s && typeof s === 'object' && typeof s.text === 'string' && s.text.trim()) {
    let setting = null;
    const st = s.setting;
    if (st && st.type === 'availability' && Number.isInteger(st.day) && st.day >= 0 && st.day <= 6 && Number.isInteger(st.minutes) && st.minutes >= 0 && st.minutes <= 240) {
      setting = { type: 'availability', day: st.day, minutes: st.minutes };
    }
    suggestion = { text: clip(s.text, 400), setting };
  }
  return { note: clip(parsed.note, 1500) || clip(String(text || ''), 1500), suggestion };
}
