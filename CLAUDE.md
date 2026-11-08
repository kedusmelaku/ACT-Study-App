# ACT Prep App: Build Spec

You are building a personal ACT study app for one user, Kedus, a high school junior taking the ACT on **Sat Dec 12, 2026**. The spec was written Sat Nov 7, 2026.

**Build all three phases in one run.** Work phase by phase in order, but do not stop between phases to ask questions. When something is ambiguous, make a reasonable call, keep going, and record it in `DECISIONS.md` (one line per decision: what, why). Commit at the end of each phase.

---

## 1. Intention

Kedus already scores around 34. His gains come from 1 to 3 questions per section, mostly careless errors, traps, and a few niche topics, not from learning new content. The app's job:

1. Turn every practice-test miss into data (an error log).
2. Use that data to decide **what to study next**, adapting after every test and every logged miss.
3. Fit that study into a schedule that respects a heavy AP course load (homework comes first on busy nights).
4. Bring missed questions back on a spaced schedule until they stick.
5. Use Claude to explain misses and give a short weekly coaching note.

**It is not a question bank.** Official ACT materials are the practice source. The app points to them, tracks which ones were used, and never stores official question text.

The app must still be useful after Dec 12: he has a school-day ACT in April 2027, so test dates are configurable and the app supports multiple real attempts.

---

## 2. User context

- Uses an Android phone (Chrome) as the main device. Takes full practice tests on paper or a laptop, then logs results on the phone.
- Comfortable with code. He prefers plain HTML/CSS/JS.
- Known starting point (a real in-school benchmark, scaled 1 to 35, not a full ACT): Reading 33, English 35, Math 35, Science 35. During onboarding, offer to save this as his first entry, labeled "School benchmark". This is real data, not sample data.
- He is taking the optional Science section in December.

---

## 3. ACT facts the logic depends on (enhanced ACT, 2025 onward)

| Section | Questions | Minutes | Pace (sec/question) |
|---|---|---|---|
| English | 50 | 35 | 42 |
| Math | 45 | 50 | 67 |
| Reading | 36 | 40 | 67 |
| Science (optional) | 40 | 40 | 60 |

- Every section is scored 1 to 36.
- **Composite** = average of English, Math, and Reading, rounded to the nearest whole number, with .5 rounding up: `Math.floor((E + M + R) / 3 + 0.5)`. **Science is not part of the composite.**
- **STEM score** = average of Math and Science, rounded the same way. Show it only when Science is entered.
- **Superscore** = composite of the best English, best Math, and best Reading across **real** ACT attempts only, never practice tests.
- Math has 4 answer choices.
- Some questions in every section are unscored field-test items, and the test-taker can't tell which. No logic should depend on this.
- Legacy (pre-2025) official tests have more questions per section. When the app assigns a legacy section, it gives the question count to do and the time budget at enhanced pace, not the legacy time limit.

Put all of these values in `js/data/act.js` as constants. Nothing else should hardcode them.

---

## 4. Tech stack and constraints

- **Frontend:** plain HTML, CSS, and JS (ES modules), with no framework and no build step. Mobile first, designed for a viewport about 380px wide, and it should still look fine on a laptop.
- **Hosting:** Vercel. The static files are served from the repo root, and the serverless functions in `/api` handle the Claude connection.
- **PWA:** include `manifest.webmanifest`, icons, and a service worker (`sw.js`) so the app can be installed with "Add to Home screen" and works offline.
  - Cache static assets with a versioned cache name, and clear old caches when the version changes.
  - Never cache `/api/*`.
- **Storage:** IndexedDB on the device, through a small wrapper (`js/db.js`).
  - Keep a schema version number and run migrations when it changes.
  - Optional cross-device sync goes through `/api/sync` and an Upstash Redis store; the device copy stays the source that works offline.
- **Safe rendering:** build all markup with an `html` tagged template plus `setHTML(el, ...)` in `js/safe-html.js`. The template escapes every interpolated value by default and has an explicit `raw()` escape hatch for trusted strings only.
  - Never assign interpolated data to `innerHTML`.
  - Attach event handlers with `data-*` attributes plus `addEventListener`, never inline handlers.
- **Errors:** show the user plain-language messages only ("Couldn't reach Claude. Check your connection and try again."). Never show stack traces, status codes, or raw error text. Log the details to the console.
- **No mock data.** Empty states show helpful prompts, not fake rows.
- **UI copy:** no em dashes. Use commas or periods instead.
- **Hints:** don't add helper text for things that are common sense (for example, explaining what a Light/Dark/Match system switch does). Only add a hint when it tells the user something they couldn't guess. Keep any copy short and plain, the way a person would say it, not over-explained.
- **Theme:** light and dark mode, following the system setting through `prefers-color-scheme`. All colors come from CSS variables.
- **Validation:** run `node --check` on every JS file after each phase. Keep the logic modules (`js/logic/*`) pure, with no DOM and no IndexedDB, so they can be tested with `node --test`.

### File structure

```
index.html
manifest.webmanifest
sw.js
icons/
css/styles.css
js/app.js                 router + bootstrapping
js/safe-html.js
js/db.js                  IndexedDB wrapper + migrations + export/import
js/data/act.js            section constants, scoring rules
js/data/topics.js         topic taxonomy per section
js/data/materials.js      official materials inventory + links
js/data/calendar.js       default date config
js/logic/scoring.js       composite, STEM, superscore, estimates
js/logic/focus.js         focus engine (leverage + topic weights)
js/logic/planner.js       weekly plan generation + rescheduling
js/logic/redo.js          spaced redo scheduling
js/logic/dates.js         date helpers (local time, week boundaries)
js/views/*.js             one module per screen
api/_auth.js              passcode check helper
api/explain.js
api/coach.js
tests/*.test.js
DECISIONS.md
README.md
```

---

## 5. Data model (IndexedDB stores)

- **settings** (single record): test date(s), study days and slot lengths, busy dates, timezone, passcode for the Claude features, last backup date.
- **attempts:** one record per test taken.
  - `{ id, date, kind: "real" | "official_enhanced" | "official_legacy" | "benchmark" | "other", sourceId, scores: { english, math, reading, science? }, scale: 36 | 35, notes }`
- **pacing:** one record per section of an attempt.
  - `{ attemptId, section, notReached, guessedAtEnd, minutesLeft }`
- **misses:** the error log.
  - `{ id, attemptId?, sourceId, section, questionNumber?, topic, cause, myAnswer?, correctAnswer?, note, fixLine, guessedRight: bool, createdAt }`
  - `cause` is one of: `content` (didn't know), `careless`, `time` (ran out), `trap` (picked a plausible but unsupported answer).
  - Set `guessedRight: true` for questions he got right only by guessing. They count as weak spots at half weight.
- **redos:** `{ missId, dueDate, interval, streak, history: [{ date, result: "right" | "wrong" }], status: "active" | "retired" | "persistent" }`
- **tasks:** generated plan items.
  - `{ id, weekStart, date, slot, section, type, title, detail, materialRef?, minutes, priority, status: "todo" | "done" | "skipped" | "moved", origin }`
- **materialUse:** which sections of which official tests have been used.
  - `{ sourceId, section, usedOn, attemptId? }`
- **coachNotes:** `{ weekStart, text, createdAt }`

**Export/import:**
- Settings has a one-tap export that downloads all stores as a single JSON file with a schema version.
- Import validates the file first, then asks whether to **merge** or **replace**.
- If the last backup is older than 7 days, show a gentle backup reminder on the Today screen.

---

## 6. Topic taxonomy (`js/data/topics.js`)

The user can add custom topics per section. Defaults:

- **English:** commas; semicolons and colons; dashes and parentheses; apostrophes; sentence boundaries (fragments, run-ons); subject-verb agreement; pronoun agreement and case; verb tense; modifiers; parallelism; word choice and idioms; concision and redundancy; transitions; add, delete, or revise (rhetorical purpose); organization and sentence order.
- **Math:** number and quantity; linear equations and systems; quadratics and polynomials; functions; exponents and logarithms; plane geometry; coordinate geometry; conic sections; trigonometry and the unit circle; statistics; probability and counting; matrices; complex numbers; vectors; sequences; word problems and modeling.
- **Reading:** main idea; detail; inference; vocabulary in context; author purpose and tone; function of a part; comparing paired passages; data or graphs in reading.
- **Science:** data representation; research summaries; conflicting viewpoints; graph reading; trends and extrapolation; experimental design; outside knowledge.

---

## 7. Materials inventory (`js/data/materials.js`)

Each entry has `{ sourceId, title, kind, sections, url, notes }`. Seed it with:

- **Official Enhanced Practice Test 1 (free).**
  - PDF: https://www.act.org/content/dam/act/secured/documents/Preparing-for-the-ACT.pdf
  - A digital version is also available through MyACT.
- **Official Enhanced Practice Test 2 (free).**
  - PDF: https://www.act.org/content/dam/act/unsecured/documents/ACT-Test-Prep-ACT-Practice-Test-2-Form.pdf
- **ACT free test prep hub**, which has the digital tests, QuizMe subject quizzes, and Question of the Day:
  - https://act.org/content/act/en/products-and-services/the-act/test-preparation/free-act-test-prep.html
- **Official legacy practice tests** (3 free, pre-2025 format). Use them for section practice at enhanced pacing. The user enters their URLs or names in Settings, so the planner can assign them once they're added.
- **Piqosity answer explanations** for the enhanced practice tests. Note: use when the official key doesn't explain why an answer is right.
- **Khan Academy**, for patching specific math topics.
- **Official ACT Prep Guide** (optional purchase; enhanced edition only). The user can toggle it on as "owned".

The planner should prefer resources whose sections haven't been used yet. Hold the official full-length tests back for the full-test slots and don't use them for drills.

---

## 8. Calendar (`js/data/calendar.js`, editable in Settings)

- **Test day:** Sat 2026-12-12.
- **Week 1** (Nov 7 to 13): Diagnostic. The weekend block is Official Practice Test 1, all four sections, timed.
- **Week 2** (Nov 14 to 20): Targeted work on the top-priority section.
- **Week 3** (Nov 21 to 27): Official Practice Test 2, all four sections, timed, during Thanksgiving break (Thanksgiving is Thu Nov 26). Mark Nov 25 to 27 as high-availability days.
- **Week 4** (Nov 28 to Dec 4): Close gaps. Section sets plus redos.
- **Week 5** (Dec 5 to 11): Taper.
  - Sat or Sun: one final timed section set.
  - Mon to Wed: error log and redo review only.
  - Thu and Fri: no study. Show a logistics checklist instead: admission ticket, photo ID, an approved calculator (no CAS models), and sleep.
- **Test day:** a calm screen with the checklist and nothing else.
- **After the test:** prompt him to enter real scores when they're released. Then switch the plan into an open-ended mode aimed at the next configured test date (the April 2027 school-day ACT; he will add the date).

**Default availability:**
- 4 weeknight slots of 30 minutes (Mon, Tue, Wed, Thu, editable).
- One weekend block of 150 minutes (Sat, editable).
- All of this is configurable in Settings.

---

## 9. Phase 1: Core (usable first)

### 9.1 Onboarding
1. Confirm the test date.
2. Set study days and slot lengths.
3. Optionally save the benchmark scores as a first entry.
4. Explain export and backup in one sentence.

### 9.2 Test entry (fast, under 5 minutes)
1. Pick a source from the materials list and the attempt kind.
2. Enter scaled scores per section. Science is optional. Show the composite (and STEM, if Science was entered) immediately.
3. **Missed-question grid:** tap question numbers per section to mark misses. Long-press marks a question as "guessed right".
4. **Tagging queue:** for each marked question, choose a topic and a cause (big tap targets), and optionally add a one-line note and the answer choices.
5. Pacing (Phase 2) slots in here as one optional step per section.

### 9.3 Error log
- A quick-add form for misses that didn't come from a full test, such as drills or QuizMe.
- A filterable list by section, topic, cause, and date.
- Each entry shows its fix line. Entries can be edited and deleted.

### 9.4 Scoring (`logic/scoring.js`)
- Composite, STEM, and superscore, following Section 3.
- **Current estimate** per section: a weighted average of the 3 most recent attempts that include that section.
  - Weight by recency: 1.0, 0.7, 0.5 (most recent first).
  - Weight by kind: `real` 1.0, `official_enhanced` 1.0, `official_legacy` 0.8, `benchmark` 0.6, `other` 0.5.
  - Convert scores on a 35-point scale to 36 by keeping the number as-is but flagging it as capped at 35.
  - The estimated composite uses the rounding rule on the estimates.

### 9.5 Focus engine (`logic/focus.js`)

Its output is a ranked list of sections with a priority score, plus the ranked topics within each section.

**Section leverage (core sections only):**
- For each section `s`, compute `pointsNeeded(s)`: the smallest k ≥ 1 such that raising `s` by k (capped at 36) raises the rounded estimated composite.
- If no such k exists, `pointsNeeded = Infinity`.
- `leverage(s) = 1 / pointsNeeded(s)`. A section already at 36 gets 0.

**Topic weight:**
- Each miss contributes `causeMult × recencyDecay`.
  - `causeMult`: content 1.0, trap 1.0, careless 0.8, time 0.8, guessed-right 0.5.
  - `recencyDecay`: half-life of 10 days.
- A redo answered right reduces that miss's contribution by 50%. Retiring it removes the contribution entirely.
- A redo answered wrong adds +0.5.

**Section weakness:** the sum of its topic weights, normalized across the core sections to the range 0 to 1.

**Priority:** `priority(s) = 0.6 × leverage(s) + 0.4 × weakness(s)`.

**Dominant cause:** for each section, the cause with the largest weight over the last 14 days. This decides the drill type:

| Cause | Drill |
|---|---|
| content | A topic drill using a matching resource, plus writing a one-line rule card |
| careless | A redo set plus a checking-habit task. English: reread the full sentence with the chosen answer. Math: plug the answer back in. Reading: point to the proving line before answering. |
| time | A timed passage or section at enhanced pace, with checkpoint times written out |
| trap | An evidence drill: for each answer, write the line number that proves it, and cross out answer choices that are extreme or that are true but don't answer the question |

**Science:**
- Excluded from leverage.
- Gets at most 1 slot per week, and only if it has recent misses.
- Always included in the full-test blocks.

**Explainability:** the Today screen shows one sentence on *why* this is the focus. For example: "Reading is your focus: one more Reading point moves your composite from 34 to 35." Generate it from the engine's numbers, not from AI.

### 9.6 Planner (`logic/planner.js`)
- Generates the tasks for the current week from the calendar phase, the focus engine output, the available slots, and unused materials.
- **Full-test weekends** (Weeks 1 and 3) are fixed. The engine fills the weeknight slots.
- **Slot allocation:**
  - The top-priority section gets at least 50% of the drill slots.
  - Any core section whose weakness is above 0.25 gets at least 1 slot.
  - Redos that are due take priority within a slot (Phase 2).
- Each task has a concrete title and detail. For example: "Reading, 1 passage from Legacy Test 3, 9 questions in 10 minutes, then prove every answer with a line number."
- **Regeneration:**
  - The plan regenerates when a test is logged, misses are added, or a new week starts.
  - Tasks already marked done or skipped are never rewritten. Only future `todo` tasks are replaced.
- The planner must be deterministic: the same inputs always produce the same plan.

### 9.7 Screens
- **Today:**
  - Countdown to the next test.
  - Tonight's tasks with done and skip buttons.
  - The focus sentence.
  - Number of redos due.
  - Backup reminder, if one is due.
- **Plan:** the week view, with tasks by day.
- **Log:** the error log.
- **Tests:** a list of attempts, plus "Add test".
- **Settings:** dates, slots, materials, export/import, and (in Phase 3) the passcode.
- Navigation is a bottom tab bar: Today, Plan, Log, Tests, More (the More tab holds Redo, Explain, Progress, and Settings as they're added).

**Phase 1 done when:** he can enter a test with tagged misses, see the composite and focus, get a generated week plan, check off tasks, and export his data. Install works on Android. All JS passes `node --check`. The scoring, focus, and planner tests pass.

---

## 10. Phase 2: Adaptation and habits

### 10.1 Spaced redos (`logic/redo.js`)
- **Scheduling:**
  - Each new miss gets a redo due in 3 days.
  - Each right answer moves the next redo out along the sequence 3 → 7 → 14 days.
  - After 2 consecutive rights at the 14-day interval, the redo is retired.
  - A wrong answer resets the interval to 3 days and sets `status: "persistent"` if it has been wrong twice.
- **Redo screen:**
  - Shows the source, section, question number, and topic, so he can open the official test to that question.
  - His old answer and fix line stay hidden until he taps "Reveal".
  - He then marks the redo right or wrong.
- **Persistent misses** get boosted in the focus engine and listed on Today.

### 10.2 Heavy-night button and busy days
- **"Heavy night" on Today:**
  - Marks tonight's tasks as `moved`.
  - The planner reinserts the highest-priority ones into the next open slots this week.
  - If the week overflows, it drops the lowest-priority tasks and says so in one line.
  - Never move a task into a taper day (Thu or Fri of Week 5).
- **Busy dates:** in Settings, he can mark dates ahead of time (for example, an APUSH test day). The planner gives those dates zero or reduced slots.

### 10.3 Pacing log
- One optional step per section during test entry: questions not reached, how many were guessed at the end, and minutes left.
- **Timing flag:** if `notReached > 0` or `guessedAtEnd ≥ 3` in a section, that section gets a timing flag. This adds weight to `time` as its dominant cause.

### 10.4 Miss-type tracker
- Progress shows, per section, the split of causes over the last 14 days.
- For Reading, also show `time` vs. `trap` + `content` as a simple bar. This is the "speed problem or accuracy problem" question.

### 10.5 Date awareness
- The calendar phases drive the planner automatically.
- Taper mode starts Dec 5.
- The logistics checklist appears on Thu and Fri of Week 5.
- The test-day screen appears on Dec 12.
- After the test, prompt him to enter the real scores and switch to the next target date.

**Phase 2 done when:** redos schedule and resolve correctly, the heavy-night button reschedules within the week without touching completed tasks, pacing affects the dominant cause, and the taper appears on the right dates. Add tests for redo intervals and heavy-night rescheduling.

---

## 11. Phase 3: Progress, superscore, Claude connection

### 11.1 Progress
- A trend chart of section scores across attempts, drawn as hand-written inline SVG with no chart library, so it works offline.
- Use different markers for real and practice attempts.
- Show the estimated composite line.
- Show the top 5 topics by weight, with arrows indicating whether each one is improving or getting worse.

### 11.2 Superscore
- Calculated from real attempts only.
- Shows which test date each best section came from.

### 11.3 Claude connection

**Architecture:**
- The browser calls `/api/explain` and `/api/coach` on the same Vercel deployment.
- The serverless functions call the Anthropic Messages API.
- **The API key never reaches the browser.**

**Environment variables (set in Vercel, never committed):**
- `ANTHROPIC_API_KEY`
- `APP_PASSCODE`
- `CLAUDE_MODEL` (default `claude-sonnet-5-5`)

Check the current Anthropic API docs (https://docs.claude.com/en/api/overview) for the request format, required headers, and how to send images, rather than relying on memory.

**Auth:**
- Every request includes an `x-app-passcode` header.
- `api/_auth.js` compares it to `APP_PASSCODE` using a constant-time comparison.
- If it doesn't match, return 401 with no detail. The UI shows "Passcode didn't match. Check it in Settings."
- The passcode is entered once in Settings and stored on the device.

**Cost guards:**
- Cap `max_tokens` (explain: 700, coach: 400).
- Reject request bodies over 2 MB.
- Resize images on the client before upload (longest edge 1568px, JPEG).
- In the README, tell him to set a monthly spend limit in the Anthropic Console.

**Privacy:**
- Images are sent for the explanation and **never stored**.
- Store only Claude's text response.

**Offline:** disable the Claude features and show "Explain needs internet. Your miss is saved, try again when you're online."

**Explain my miss (`POST /api/explain`):**
- **Input:**
  - `{ section, topic?, description, image?, myAnswer?, correctAnswer?, myReasoning? }`
  - He can type a description of the question, attach a photo of it from his own practice test, or both.
- **System prompt intent:**
  - Act as a concise ACT tutor for a student scoring 34+.
  - Identify the exact rule or skill being tested.
  - Explain why the correct answer is right and why his answer was tempting.
  - Name the trap if there was one.
  - Give a one-line fix he can reuse.
  - No padding.
- **Output:**
  - Ask Claude to respond with JSON only: `{ explanation, rule, trap, fixLine, suggestedTopic, suggestedCause }`.
  - Strip code fences if present and parse safely.
  - If parsing fails, show the raw explanation text.
- **UI:**
  - Show the explanation.
  - Offer "Save to error log" (pre-filled from the response, editable) or "Update existing miss" when the request was launched from a log entry.
  - Every miss in the log has an "Explain" button.

**Weekly coach (`POST /api/coach`):**
- **Input:** an aggregated stats summary only:
  - section estimates and leverage
  - top topics with weights and trends
  - cause split
  - redo stats
  - completion rate
  - days left
  - Send no question text or images.
- **Output:** a coaching note of 5 sentences at most. It also includes at most one concrete suggestion phrased as an option.
- **Advisory only:** the deterministic planner stays in charge. If the suggestion maps to a setting (for example, "add a Sunday slot"), show an "Apply" button that changes that setting. Otherwise it's just text.
- **Availability:** the note can be requested once per week from Progress. Save it in `coachNotes`.

### 11.4 Polish
- Empty states for every screen.
- Loading states for the Claude calls.
- Undo for deletes, shown as a toast.
- Large tap targets.
- Respect reduced motion.

**Phase 3 done when:** the trend chart and superscore render from real attempts, Explain and Coach work end to end on a Vercel preview, unauthorized requests are rejected, and the app works offline apart from the Claude features.

---

## 12. Tests (node --test, in `tests/`)

- **scoring:**
  - rounding (34.33 → 34, 34.5 → 35, 34.67 → 35)
  - STEM
  - superscore uses real attempts only
  - estimate weighting
- **focus:**
  - With E35 M35 R33, Reading has `pointsNeeded = 1` and is the top priority.
  - With E36 M36 R36, all leverage is 0.
  - Recency decay halves after 10 days.
  - Science never enters leverage.
- **planner:**
  - deterministic output
  - full-test weekends are fixed
  - done and skipped tasks are never rewritten
  - nothing is scheduled on taper days
- **redo:**
  - interval sequence
  - retirement after 2 consecutive rights at 14 days
  - persistent flag
- **heavy night:**
  - rescheduling stays within the week
  - overflow drops the lowest priority

---

## 13. Deliverables at the end

1. Working app on Vercel (static files plus `/api`).
2. `README.md` with:
   - local run instructions (`npx vercel dev`)
   - deploy steps
   - the env vars to set
   - how to install on Android (Chrome menu → Add to Home screen)
   - a note to set an Anthropic spend limit
3. `DECISIONS.md` listing every judgment call made without asking.
4. All JS passing `node --check`, and all tests passing.
