// POST /api/explain: explain one missed ACT question. Images are passed through and never stored.
import { guard, send } from './_auth.js';
import { callClaude } from './_claude.js';
import { EXPLAIN_SYSTEM, explainSystem, SECTION_KEYS, explainDetails, parseJsonReply, normalizeExplain } from '../js/logic/claude-format.js';

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export const SYSTEM = EXPLAIN_SYSTEM;

export function buildContent(body) {
  const content = [];
  if (body.image && typeof body.image === 'object') {
    content.push({ type: 'image', source: { type: 'base64', media_type: body.image.mediaType, data: body.image.data } });
  }
  content.push({ type: 'text', text: explainDetails(body) });
  return content;
}

export function validate(body) {
  if (!body || typeof body !== 'object') return false;
  if (!SECTION_KEYS.includes(body.section)) return false;
  const hasText = typeof body.description === 'string' && body.description.trim().length > 0;
  const img = body.image;
  if (img !== undefined && img !== null) {
    if (typeof img !== 'object' || !IMAGE_TYPES.includes(img.mediaType) || typeof img.data !== 'string' || !/^[A-Za-z0-9+/=]+$/.test(img.data)) return false;
  }
  return hasText || !!img;
}

export const normalize = normalizeExplain;

export default async function handler(req, res, deps = {}) {
  const body = await guard(req, res);
  if (!body) return;
  if (!validate(body)) return send(res, 400, { error: 'bad_request' });
  try {
    const text = await callClaude({ system: explainSystem(body.level), content: buildContent(body), maxTokens: 700, fetchImpl: deps.fetch });
    return send(res, 200, normalize(parseJsonReply(text), text));
  } catch (e) {
    console.error('explain failed', e.message);
    return send(res, e.status && e.status < 600 ? e.status : 502, { error: 'upstream' });
  }
}
