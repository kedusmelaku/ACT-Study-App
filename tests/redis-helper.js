// Starts a throwaway local redis-server and exposes the same { cmd, pipeline } shape as api/_redis.js.
// Tests that use it are skipped when redis-server isn't installed.
import { spawn, spawnSync } from 'node:child_process';
import net from 'node:net';

export function redisAvailable() {
  try {
    return spawnSync('redis-server', ['--version']).status === 0;
  } catch {
    return false;
  }
}

function encode(args) {
  let s = `*${args.length}\r\n`;
  for (const a of args) {
    const b = Buffer.from(String(a));
    s += `$${b.length}\r\n${b}\r\n`;
  }
  return s;
}

function parse(buf, i = 0) {
  const t = String.fromCharCode(buf[i]);
  const end = buf.indexOf('\r\n', i);
  if (end === -1) throw new Error('incomplete');
  const line = buf.toString('utf8', i + 1, end);
  if (t === '+') return [line, end + 2];
  if (t === '-') return [new Error(line), end + 2];
  if (t === ':') return [Number(line), end + 2];
  if (t === '$') {
    const n = Number(line);
    if (n === -1) return [null, end + 2];
    if (buf.length < end + 4 + n) throw new Error('incomplete');
    return [buf.toString('utf8', end + 2, end + 2 + n), end + 4 + n];
  }
  if (t === '*') {
    const n = Number(line);
    if (n === -1) return [null, end + 2];
    let p = end + 2;
    const out = [];
    for (let k = 0; k < n; k++) {
      const [v, np] = parse(buf, p);
      out.push(v);
      p = np;
    }
    return [out, p];
  }
  throw new Error('bad reply');
}

export async function startRedis() {
  const port = 20000 + Math.floor(Math.random() * 20000);
  const proc = spawn('redis-server', ['--port', String(port), '--save', '', '--appendonly', 'no'], { stdio: 'ignore' });
  await new Promise((r) => setTimeout(r, 400));
  const send = (args) =>
    new Promise((resolve, reject) => {
      const sock = net.connect(port, '127.0.0.1', () => sock.write(encode(args)));
      let buf = Buffer.alloc(0);
      sock.on('data', (d) => {
        buf = Buffer.concat([buf, d]);
        let v;
        try {
          [v] = parse(buf);
        } catch {
          return; // wait for more data
        }
        sock.end();
        if (v instanceof Error) reject(v);
        else resolve(v);
      });
      sock.on('error', reject);
    });
  return {
    redis: {
      cmd: (args) => send(args),
      pipeline: async (cmds) => {
        const out = [];
        for (const c of cmds) out.push(await send(c));
        return out;
      },
    },
    stop: () => proc.kill(),
  };
}
