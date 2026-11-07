// POST /api/coach: a short weekly coaching note from aggregated stats only (no question text or images).
import { guard, send } from './_auth.js';
import { callClaude } from './_claude.js';
import { COACH_SYSTEM, normalizeCoach, statsJson, parseJsonReply } from '../js/logic/claude-format.js';

export const SYSTEM = COACH_SYSTEM;
export const normalize = normalizeCoach;
export const sanitizeStats = statsJson;

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
