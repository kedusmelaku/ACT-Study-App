# ACT Prep

An ACT study app. Every practice-test miss becomes data in an error log; a focus engine turns that data into the next thing to study; a deterministic planner fits it into the week around homework; missed questions come back on a spaced schedule; and Claude explains misses and writes a short weekly coaching note.

It is not a question bank. Official ACT materials are the practice source. The app points to them and tracks which sections you've used, and never stores official question text.

- Plain HTML, CSS, and JS (ES modules). No framework, no build step.
- Installable PWA that works offline (except the Claude features).
- Data lives on your device in IndexedDB, so it works offline. Optional sync keeps your phone and laptop in step through a free Upstash Redis database. Export a backup from Settings any time.
- Explain and Coach work for free through your own Claude chat (claude.ai or the Claude app): the app copies a ready-made prompt, you paste Claude's reply back. No API key needed.
- An optional built-in mode calls Claude for you through a small proxy in `/api`, so the API key never reaches the browser. It uses paid API credits.

## Using Claude for free (default)

1. On a miss, tap **Explain**, fill in what you remember, and tap **Copy prompt for Claude**.
2. Tap **Open Claude**, start a new chat, paste, and send. Attach your photo of the question there if you have one.
3. Copy Claude's whole reply, paste it back into the app, and tap **Read reply**. Then save it to the miss.

The weekly coach on Progress works the same way. Its prompt holds only your numbers, never questions or notes. Switch modes in Settings, under Claude.

## Sharing the app with other people

Anyone can use the same deployment. Each person's data lives on their own device, and onboarding asks for their own test date and scores. Sync spaces are separated by personal sync codes, so nobody's data mixes. Explain and Coach run in each person's own Claude chat by default. Don't share `APP_PASSCODE`: it unlocks built-in Claude mode on your API key.

## Sync across devices

Each device keeps its own copy and works offline. When online, it pushes what it changed and pulls what your other devices changed. If the same item was edited on two devices, the later edit wins. Deletes sync too.

### One-time setup (whoever deploys the app)

1. **Create the database.** In your Vercel project, open the **Storage** tab, pick **Upstash for Redis** from the marketplace, choose the free plan, and connect it to this project. Vercel adds `KV_REST_API_URL` and `KV_REST_API_TOKEN`.
   (Or create a free Redis database at upstash.com and add its `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` to Vercel yourself.)
2. **Redeploy** so the functions see the new variables.

### Turning it on (each person)

1. On the device that has your data: **Settings, Sync across devices, Start syncing.** You get a sync code like `K7QM-2XRA-9HTD-W4PB`, and everything on that device uploads.
2. On your other devices: on the first setup screen tap **I already use ACT Prep on another device**, or use **Settings, Sync, Join with a code**, and enter the code.

Keep the code private: anyone with it can see your data. A few things stay on each device: the Claude mode and passcode, the theme, and the last-backup date.

## Run it locally

You need Node 20 or newer.

```bash
npx vercel dev
```

That serves the static app and the `/api` routes at http://localhost:3000. The first run asks you to log in to Vercel and link the project. Put your env vars (below) in a `.env.local` file in the project root, or pull them with `npx vercel env pull`. Never commit that file.

No Vercel account handy? This runs the same thing with plain Node:

```bash
UPSTASH_REDIS_REST_URL=... UPSTASH_REDIS_REST_TOKEN=... node scripts/dev-server.js 3000
```

Tests and checks:

```bash
npm test          # node --test on tests/*.test.js
npm run check     # node --check on every JS file
```

Tip: add `?today=2026-12-10` to the URL to see the app as it looks on another date (taper, logistics, test day).

## Deploy to Vercel

1. Push this repo to GitHub.
2. In Vercel, choose **Add New Project** and import the repo. No framework preset and no build command are needed; the output is the repo root.
3. Add the environment variables below under **Settings, Environment Variables** for Production and Preview.
4. Deploy. Open the deployment URL on your phone.

Every push to a branch gets a preview URL, which is a good place to try Explain and Coach before production.

When you change any file the app caches, bump `CACHE_VERSION` in `sw.js`. Installed copies download the new version in the background and show "A new version is ready" with a Reload button. Your data is untouched by updates.

## Environment variables

Set these in Vercel. Never commit them.

| Name | What it is |
|---|---|
| `APP_PASSCODE` | Built-in Claude mode only. Any long random value. Keep it to yourself: it uses your API key. |
| `KV_REST_API_URL`, `KV_REST_API_TOKEN` | Sync database. Added automatically when you connect Upstash Redis in Vercel's Storage tab. `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` also work. Sync itself needs no passcode; each person uses their own sync code. |
| `ANTHROPIC_API_KEY` | Built-in Claude mode only. Your Anthropic API key, from the Anthropic Console. |
| `CLAUDE_MODEL` | Built-in Claude mode only, optional. Defaults to `claude-sonnet-5-5`. |

**Set a monthly spend limit in the Anthropic Console** (Settings, Limits). The app caps each request (700 output tokens for Explain, 400 for Coach, 2 MB per request, photos resized to 1568px JPEG), but a spend limit is the real safety net.

## Install on Android

1. Open the deployed URL in Chrome.
2. Tap the three-dot menu, then **Add to Home screen** (or **Install app**).
3. Launch it from the home screen. It opens full screen and works offline.

## How it decides what to study

- **Estimate per section:** weighted average of your 3 most recent attempts (recency 1.0, 0.7, 0.5; real and official enhanced tests count fully, legacy 0.8, the benchmark 0.6, other 0.5).
- **Leverage:** how many points a section needs before your rounded composite goes up. One point away beats three points away. Science is never in the composite.
- **Weakness:** each miss counts by cause (content and trap 1.0, careless and time 0.8, guessed right 0.5), fading with a 10-day half-life. Redos you get right shrink it; redos you get wrong grow it.
- **Priority** = 0.6 x leverage + 0.4 x weakness. The top section gets at least half the week's drill slots.
- **Drill type** comes from the section's most common cause in the last 14 days: topic drill, checking habit, timed pacing, or evidence drill.

Full-test days, taper week (review only from Monday, no study Thursday and Friday), and the test-day screen come from the calendar in Settings. See `DECISIONS.md` for every judgment call.

## Privacy

- Your data stays on your device unless you export it. The passcode is never included in exports.
- Photos sent to Explain are resized on the phone, sent once, and never stored. Only Claude's text reply is saved, on the miss.
- Coach receives aggregated numbers only (estimates, topic weights, cause counts, redo and completion stats), never question text or photos.

## Project layout

```
index.html, manifest.webmanifest, sw.js, icons/, css/styles.css
js/app.js            router and startup
js/store.js          in-memory state, actions, plan regeneration
js/db.js             IndexedDB wrapper, migrations, export/import
js/safe-html.js      html`` template that escapes by default, setHTML
js/data/*            ACT constants, topics, materials, calendar defaults
js/logic/*           pure logic: scoring, focus, planner, redo, dates, phase, progress
js/views/*           one module per screen
api/_auth.js         passcode check and body limits
api/_claude.js       Anthropic Messages API call
api/_redis.js        Upstash Redis REST client
api/explain.js, api/coach.js, api/sync.js
js/sync.js           background sync on the device
tests/*.test.js
```
