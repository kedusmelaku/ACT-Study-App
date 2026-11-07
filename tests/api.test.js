import test from 'node:test';
import assert from 'node:assert/strict';
import { Readable } from 'node:stream';
import explain from '../api/explain.js';
import coach from '../api/coach.js';
import { parseJsonReply } from '../api/_claude.js';
import { passcodeMatches } from '../api/_auth.js';

process.env.APP_PASSCODE = 'correct horse';
process.env.ANTHROPIC_API_KEY = 'test-key';

function req({ method = 'POST', passcode = 'correct horse', body = {}, headers = {} } = {}) {
  const raw = typeof body === 'string' ? body : JSON.stringify(body);
  const r = Readable.from([Buffer.from(raw)]);
  r.method = method;
  r.headers = { 'content-type': 'application/json', 'content-length': String(Buffer.byteLength(raw)), ...(passcode ? { 'x-app-passcode': passcode } : {}), ...headers };
  return r;
}
function res() {
  const r = { statusCode: 200, headers: {}, body: '' };
  r.setHeader = (k, v) => (r.headers[k.toLowerCase()] = v);
  r.end = (b) => (r.body = b || '');
  r.json = () => JSON.parse(r.body);
  return r;
}
function fakeFetch(text, capture = {}) {
  return async (url, init) => {
    capture.url = url;
    capture.init = init;
    capture.body = JSON.parse(init.body);
    return { ok: true, status: 200, json: async () => ({ stop_reason: 'end_turn', content: [{ type: 'text', text }] }), text: async () => '' };
  };
}

test('wrong or missing passcode returns 401 with no detail', async () => {
  for (const passcode of ['nope', '', null]) {
    const r = res();
    await explain(req({ passcode, body: { section: 'math', description: 'x' } }), r, { fetch: () => assert.fail('must not call Claude') });
    assert.equal(r.statusCode, 401);
    assert.deepEqual(r.json(), { error: 'unauthorized' });
  }
  const r2 = res();
  await coach(req({ passcode: 'wrong', body: { stats: {} } }), r2);
  assert.equal(r2.statusCode, 401);
});

test('passcode check fails closed when APP_PASSCODE is unset', () => {
  assert.equal(passcodeMatches({ headers: { 'x-app-passcode': 'anything' } }, ''), false);
});

test('only POST is allowed', async () => {
  const r = res();
  await explain(req({ method: 'GET' }), r);
  assert.equal(r.statusCode, 405);
});

test('bodies over 2 MB are rejected', async () => {
  const r = res();
  await explain(req({ body: { section: 'math', description: 'x'.repeat(2 * 1024 * 1024 + 10) } }), r, { fetch: () => assert.fail() });
  assert.equal(r.statusCode, 413);
});

test('explain sends the image and caps max_tokens at 700', async () => {
  const cap = {};
  const reply = '```json\n{"explanation":"E","rule":"R","trap":"T","fixLine":"F","suggestedTopic":"Commas","suggestedCause":"trap"}\n```';
  const r = res();
  await explain(req({ body: { section: 'english', description: 'comma q', image: { mediaType: 'image/jpeg', data: 'QUJD' } } }), r, { fetch: fakeFetch(reply, cap) });
  assert.equal(r.statusCode, 200);
  assert.equal(r.json().fixLine, 'F');
  assert.equal(r.json().suggestedCause, 'trap');
  assert.equal(cap.body.max_tokens, 700);
  assert.equal(cap.body.messages[0].content[0].type, 'image');
  assert.equal(cap.init.headers['x-api-key'], 'test-key');
  assert.ok(cap.init.headers['anthropic-version']);
});

test('explain falls back to raw text when the reply is not JSON', async () => {
  const r = res();
  await explain(req({ body: { section: 'math', description: 'q' } }), r, { fetch: fakeFetch('Plain words here.') });
  assert.equal(r.statusCode, 200);
  assert.equal(r.json().raw, true);
  assert.equal(r.json().explanation, 'Plain words here.');
});

test('explain rejects bad images and empty requests', async () => {
  const r = res();
  await explain(req({ body: { section: 'math', image: { mediaType: 'image/gif', data: 'QUJD' } } }), r, { fetch: () => assert.fail() });
  assert.equal(r.statusCode, 400);
  const r2 = res();
  await explain(req({ body: { section: 'math' } }), r2, { fetch: () => assert.fail() });
  assert.equal(r2.statusCode, 400);
});

test('coach caps max_tokens at 400 and validates the setting', async () => {
  const cap = {};
  const reply = '{"note":"Good week.","suggestion":{"text":"You could add a Sunday slot.","setting":{"type":"availability","day":0,"minutes":30}}}';
  const r = res();
  await coach(req({ body: { stats: { daysLeft: 20 } } }), r, { fetch: fakeFetch(reply, cap) });
  assert.equal(cap.body.max_tokens, 400);
  assert.deepEqual(r.json().suggestion.setting, { type: 'availability', day: 0, minutes: 30 });
  const r2 = res();
  await coach(req({ body: { stats: {} } }), r2, { fetch: fakeFetch('{"note":"n","suggestion":{"text":"t","setting":{"type":"availability","day":9,"minutes":30}}}') });
  assert.equal(r2.json().suggestion.setting, null);
});

test('upstream errors become a plain error code', async () => {
  const r = res();
  await coach(req({ body: { stats: {} } }), r, { fetch: async () => ({ ok: false, status: 529, text: async () => 'overloaded' }) });
  assert.equal(r.statusCode, 502);
  assert.deepEqual(r.json(), { error: 'upstream' });
});

test('parseJsonReply strips fences and rejects junk', () => {
  assert.deepEqual(parseJsonReply('```\n{"a":1}\n```'), { a: 1 });
  assert.deepEqual(parseJsonReply('Here: {"a":2} done'), { a: 2 });
  assert.equal(parseJsonReply('nothing'), null);
});
