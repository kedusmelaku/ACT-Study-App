// Minimal Anthropic Messages API client for the serverless routes. The API key stays on the server.
export const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
export const ANTHROPIC_VERSION = '2026-10-21';
export const DEFAULT_MODEL = 'claude-sonnet-5-5';

/**
 * Send one user turn and return the text of the reply.
 * content: array of Messages API content blocks (text and image).
 */
export async function callClaude({ system, content, maxTokens, fetchImpl = globalThis.fetch }) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw Object.assign(new Error('ANTHROPIC_API_KEY is not set'), { status: 500 });
  const res = await fetchImpl(ANTHROPIC_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': key,
      'anthropic-version': ANTHROPIC_VERSION,
    },
    body: JSON.stringify({
      model: process.env.CLAUDE_MODEL || DEFAULT_MODEL,
      max_tokens: maxTokens,
      system,
      // Short, direct answers: keep thinking light so the token cap goes to the reply.
      output_config: { effort: 'low' },
      messages: [{ role: 'user', content }],
    }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    console.error('Anthropic API error', res.status, detail.slice(0, 500));
    throw Object.assign(new Error('Upstream error'), { status: 502 });
  }
  const data = await res.json();
  if (data.stop_reason === 'refusal') {
    console.error('Claude declined the request', data.stop_details || '');
    throw Object.assign(new Error('Refused'), { status: 422 });
  }
  const text = (data.content || [])
    .filter((b) => b && b.type === 'text')
    .map((b) => b.text)
    .join('')
    .trim();
  if (!text) throw Object.assign(new Error('Empty reply'), { status: 502 });
  return text;
}

// Reply parsing is shared with the browser's copy-to-chat mode.
export { parseJsonReply, clip } from '../js/logic/claude-format.js';
