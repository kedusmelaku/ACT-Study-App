// Tiny Upstash Redis REST client (no SDK). Reads the env vars that Upstash, or Vercel's Upstash
// integration, sets: UPSTASH_REDIS_REST_URL / _TOKEN or KV_REST_API_URL / _TOKEN.

export function redisConfig(env = process.env) {
  const url = env.UPSTASH_REDIS_REST_URL || env.KV_REST_API_URL;
  const token = env.UPSTASH_REDIS_REST_TOKEN || env.KV_REST_API_TOKEN;
  return url && token ? { url: url.replace(/\/+$/, ''), token } : null;
}

/** Returns { cmd(args), pipeline(cmds) } or null when sync storage isn't configured. */
export function redisFromEnv(env = process.env, fetchImpl = globalThis.fetch) {
  const cfg = redisConfig(env);
  if (!cfg) return null;
  const call = async (path, body) => {
    const res = await fetchImpl(cfg.url + path, {
      method: 'POST',
      headers: { Authorization: `Bearer ${cfg.token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok || !data) {
      console.error('Redis error', res.status, data && data.error);
      throw Object.assign(new Error('Redis error'), { status: 502 });
    }
    return data;
  };
  return {
    async cmd(args) {
      const data = await call('', args);
      if (data.error) throw Object.assign(new Error(data.error), { status: 502 });
      return data.result;
    },
    async pipeline(cmds) {
      const data = await call('/pipeline', cmds);
      return data.map((d) => {
        if (d.error) throw Object.assign(new Error(d.error), { status: 502 });
        return d.result;
      });
    },
  };
}
