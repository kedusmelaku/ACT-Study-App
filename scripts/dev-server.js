// Local server without the Vercel CLI: serves the static app and the two API routes.
// Usage: APP_PASSCODE=... [UPSTASH_REDIS_REST_URL=... UPSTASH_REDIS_REST_TOKEN=...] [ANTHROPIC_API_KEY=...] node scripts/dev-server.js [port]
import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve } from 'node:path';
import explain from '../api/explain.js';
import coach from '../api/coach.js';
import sync from '../api/sync.js';

const root = resolve(new URL('..', import.meta.url).pathname);
const port = Number(process.argv[2]) || 3000;
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.webmanifest': 'application/manifest+json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
};
const ROUTES = { '/api/explain': explain, '/api/coach': coach, '/api/sync': sync };

http
  .createServer(async (req, res) => {
    const url = new URL(req.url, `http://localhost:${port}`);
    if (ROUTES[url.pathname]) return ROUTES[url.pathname](req, res);
    let path = normalize(decodeURIComponent(url.pathname));
    if (path.endsWith('/')) path += 'index.html';
    const file = join(root, path);
    if (!file.startsWith(root) || /\/(\.|api\/|node_modules|tests\/|scripts\/)/.test(path)) {
      res.writeHead(404).end('Not found');
      return;
    }
    try {
      if (!(await stat(file)).isFile()) throw new Error('not a file');
      res.writeHead(200, { 'Content-Type': TYPES[extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
      res.end(await readFile(file));
    } catch {
      res.writeHead(404).end('Not found');
    }
  })
  .listen(port, () => console.log(`ACT Prep running at http://localhost:${port}`));
