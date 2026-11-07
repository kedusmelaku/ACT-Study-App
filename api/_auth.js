// Passcode check and request helpers shared by the API routes.
// Files starting with "_" are not deployed as routes on Vercel.
import { createHash, timingSafeEqual } from 'node:crypto';

export const MAX_BODY_BYTES = 2 * 1024 * 1024;

function digest(value) {
  return createHash('sha256').update(String(value), 'utf8').digest();
}

/** Constant-time comparison of the x-app-passcode header with APP_PASSCODE. */
export function passcodeMatches(req, expected = process.env.APP_PASSCODE) {
  if (!expected) {
    console.error('APP_PASSCODE is not set');
    return false;
  }
  const got = req.headers ? req.headers['x-app-passcode'] : undefined;
  if (typeof got !== 'string' || !got) return false;
  // Hashing first gives equal-length buffers, so timingSafeEqual never throws and length doesn't leak.
  return timingSafeEqual(digest(got), digest(expected));
}

export function send(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
}

/** Read and parse the JSON body, rejecting anything over the size limit. Throws { status }. */
export async function readJson(req, maxBytes = MAX_BODY_BYTES) {
  const declared = Number(req.headers && req.headers['content-length']);
  if (declared && declared > maxBytes) throw Object.assign(new Error('Body too large'), { status: 413 });
  let raw;
  if (req.body !== undefined && req.body !== null) {
    if (typeof req.body === 'object' && !Buffer.isBuffer(req.body)) {
      if (Buffer.byteLength(JSON.stringify(req.body)) > maxBytes) throw Object.assign(new Error('Body too large'), { status: 413 });
      return req.body;
    }
    raw = Buffer.isBuffer(req.body) ? req.body.toString('utf8') : String(req.body);
  } else {
    const chunks = [];
    let size = 0;
    for await (const chunk of req) {
      size += chunk.length;
      if (size > maxBytes) throw Object.assign(new Error('Body too large'), { status: 413 });
      chunks.push(chunk);
    }
    raw = Buffer.concat(chunks).toString('utf8');
  }
  if (Buffer.byteLength(raw) > maxBytes) throw Object.assign(new Error('Body too large'), { status: 413 });
  try {
    return JSON.parse(raw || '{}');
  } catch {
    throw Object.assign(new Error('Bad JSON'), { status: 400 });
  }
}

/** Common guard: POST only, passcode, body. Returns the body or null after responding. */
export async function guard(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    send(res, 405, { error: 'method_not_allowed' });
    return null;
  }
  if (!passcodeMatches(req)) {
    send(res, 401, { error: 'unauthorized' });
    return null;
  }
  try {
    return await readJson(req);
  } catch (e) {
    send(res, e.status || 400, { error: e.status === 413 ? 'too_large' : 'bad_request' });
    return null;
  }
}
