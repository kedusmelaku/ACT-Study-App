// POST /api/coach: a short weekly coaching note from aggregated stats only (no question text or images).
import { guard, send } from './_auth.js';
import { callClaude, parseJsonReply, clip } from './_claude.js';

export const SYSTEM = `You are a calm, direct ACT coach for a high school junior who scores around 34 and is balancing a heavy AP course load. You get an aggregated stats summary for his week.
Write a coaching note of at most 5 sentences: what the numbers say, what to keep doing, what to watch. Be specific to the numbers. No padding, no em dashes.
You may add at most one concrete suggestion, phrased as an option he can take or leave. The app's planner stays in charge; your note is advisory.
If the suggestion is to change study time on a weekday, include a setting so the app can offer an Apply button.
Respond with JSON only, no code fences, in exactly this shape:
{"note": string, "suggestion": null or {"text": string, "setting": null or {"type": "availability", "day": integer 0-6 where 0 is Sunday, "minutes": integer 0-240}}}`;

export function normalize(parsed, text) {
  if (!parsed) return { note: clip(text, 1500), suggestion: null };
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
  return { note: clip(parsed.note, 1500) || clip(text, 1500), suggestion };
}

/** Only aggregated numbers and short labels go to Claude. */
export function sanitizeStats(stats) {
  const json = JSON.stringify(stats || {});
  return json.length > 20000 ? json.slice(0, 20000) : json;
}

export default async function handler(req, res, deps = {}) {
  const body = await guard(req, res);
  if (!body) return;
  if (!body.stats || typeof body.stats !== 'object') return send(res, 400, { error: 'bad_request' });
  try {
    const text = await callClaude({
      system: SYSTEM,
      content: [{ type: 'text', text: `This week's stats (JSON):\n${sanitizeStats(body.stats)}` }],
      maxTokens: 400,
      fetchImpl: deps.fetch,
    });
    return send(res, 200, normalize(parseJsonReply(text), text));
  } catch (e) {
    console.error('coach failed', e.message);
    return send(res, e.status && e.status < 600 ? e.status : 502, { error: 'upstream' });
  }
}
