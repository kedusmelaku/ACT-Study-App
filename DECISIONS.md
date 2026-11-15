# Decisions

Judgment calls made without asking. One line each: what, then why.

## Phase 1
- Plan weeks run Saturday to Friday; the spec's weeks (Nov 7 to 13, and so on) start on Saturdays, so each weekend block opens a week.
- Full Practice Test 2 is fixed on Wed Nov 25 (first day of Thanksgiving break, high availability); the spec puts it "during Thanksgiving break" in Week 3, and Sat Nov 21 is before the break.
- Nov 25 to 27 get 180, 90, and 90 minutes as high-availability days; the spec marks them but gives no number.
- A full test task is 175 minutes (165 of sections plus a 10 minute break), even when the day's block is 150; full tests are fixed and need the real length.
- After a full test, the next study day gets a 20 minute "Log the test" task, which completes itself when that test is logged; logging is the step that turns the test into data.
- Ties in focus priority go to the section with the lower estimate, then section order; with E35 M35 R33 all three sections need 1 point, and the spec expects Reading on top.
- Section weakness is each core section's share of the total core weight (sums to 1); the "weakness above 0.25 gets a slot" rule reads naturally as a share.
- Leverage uses rounded section estimates, so "moves your composite from 34 to 35" matches the numbers shown on screen.
- A redo answered right halves that miss's weight once per right answer; a wrong redo adds 0.5 decayed from the redo date; persistent misses get a 1.5x boost; retired misses count 0.
- Pacing timing flags add 1.5 to the section's `time` cause weight for 14 days, enough to usually make `time` dominant.
- With no misses in the last 14 days a section has no dominant cause and gets "mixed timed practice" drills.
- Days with 90 or more minutes become blocks: one timed section for the top section first, then 30 to 50 minute drill slots. Shorter days are one slot.
- Due redos go first in a day's first slot and take at most half of a weeknight slot (3 minutes each); the rest carries to the next day.
- Drills prefer real ACT passages from legacy tests, the Prep Guide, or custom sources, tracked per passage (`materialUse.part`); math content gaps go to Khan Academy; with nothing left, QuizMe sets fill in.
- `materialUse` records gain optional `part` and `taskId` fields so passage-level drills and undoing a "done" tap stay accurate.
- The Prep Guide's practice-test count is a setting (default 3) because editions differ; "check your copy" is shown next to it.
- Science gets a drill slot only when the week has at least 3 drill slots and Science had a miss in the last 14 days.
- Taper weekend gets exactly one final timed set (top section) on the first weekend day with time; Mon to Wed get redos plus an error-log review that rotates through sections.
- Only future `todo` tasks are regenerated; past `todo` tasks stay as a record, and done or skipped minutes on a future day count against that day's time.
- Misses with no question number from a test edit are kept as-is when the test is edited.
- The benchmark saved during onboarding is dated on the day of onboarding, since its real date isn't known.
- Test-entry drafts are kept in localStorage so a reload doesn't lose a half-entered test; the draft clears on save or discard.
- `?today=YYYY-MM-DD` in the URL overrides today's date for checking taper and test-day screens; it changes nothing that is stored except the dates of new records.
- Merge import keeps this device's settings and overwrites rows with matching keys; replace import uses the backup's settings. The passcode never leaves the device in an export.
- Plan pages for future weeks show a preview generated without saving; the real plan is generated when the week starts.
- `package.json` sets `"type": "module"` so the Vercel functions and `node --test` use ES modules like the front end.

## Phase 2
- Retirement counts rights answered while the interval is already 14 days: right at 3 goes to 7, right at 7 goes to 14, then two more rights at 14 retire it.
- "Wrong twice" for persistent means two wrong answers in the redo's whole history, not two in a row; a persistent redo can still retire.
- A redo starts from the later of the miss date and today, so back-dated misses don't arrive already overdue.
- Heavy night keeps future tasks where they are, fits tonight's tasks into open time later in the week by priority, and only bumps a later task when tonight's task outranks it; the dropped task is marked skipped with `dropped: true` so it stays visible.
- Heavy night also records the date in `settings.heavyNights` so later plan regenerations keep tonight empty; "Undo heavy night" restores it.
- Fixed full tests can't be moved by Heavy night; the button is hidden on full-test days.
- The taper is defined by days before the test (7 and 6: final set, 5 to 3: review, 2 and 1: logistics), so it also works for a test on a weekday such as the April school-day ACT.
- The redo screen shows misses one at a time with Reveal, then Right or Wrong, because that mirrors flipping a flashcard and keeps the old answer hidden.
- The cause tracker counts misses by cause over 14 days (not weighted) so the numbers match what he logged; the timing flag is noted next to the section.
- The logistics checklist adds pencils and route to the spec's ticket, ID, calculator, and sleep, with checks saved per test date.
- After a test date passes with no real scores logged, Today shows a card linking to a prefilled "Real ACT" entry; with no future test date, the plan runs in open mode and Today asks for the next date.

## Phase 3
- Demo mode was removed from the spec and not built, at the user's request.
- The Claude proxy uses `fetch` against the Messages API directly instead of the Anthropic SDK, to keep the project dependency-free with no install step; it sends `anthropic-version: 2026-10-21` and `output_config.effort: "low"` so the small token caps go to the answer, not to thinking.
- Server-side refusal fallbacks are not enabled because `CLAUDE_MODEL` is configurable and the fallback beta only applies to some models; a refusal shows the normal "Couldn't reach Claude" message.
- The passcode check hashes both values with SHA-256 before `timingSafeEqual`, so lengths never leak and unequal lengths never throw; a missing `APP_PASSCODE` rejects every request.
- Explain asks for JSON only, strips fences, and also accepts JSON embedded in prose; if parsing still fails the raw text is shown as the explanation.
- Explain's photo is resized to a 1568px longest edge as JPEG at quality 0.85, stepping down until the encoded image is under about 1.6 MB so the request stays under 2 MB.
- "Update existing miss" saves Claude's explanation on the miss and asks before replacing a fix line he already wrote.
- Coach suggestions only map to a setting when Claude returns a weekday availability change (0 to 240 minutes); the server validates it and the Apply button changes that one setting and regenerates the plan.
- The coach note is limited to one per plan week (Saturday to Friday), keyed by `weekStart` in `coachNotes`.
- Topic trend arrows compare each topic's weight now with its weight computed as of 7 days ago: up 10 percent or more is "getting worse", down 10 percent is "improving", otherwise "steady"; topics with no weight a week ago are "new".
- The trend chart spaces attempts evenly by order (not by date) so tests a few days apart stay readable; dates label the first, middle, and last points, and a table view lists every value.
- Chart colors are separate `--chart-*` variables, checked with a colorblind-safety validator in light and dark mode; real ACTs are diamonds and practice tests are circles, so identity never relies on color alone.
- `scripts/dev-server.js` runs the app and API with plain Node as a fallback to `npx vercel dev`.
- `.vercelignore` keeps CLAUDE.md, DECISIONS.md, tests, and scripts out of the deployment, since the spec contains personal details.
- A strict Content-Security-Policy is set in `vercel.json`; inline styles are allowed for computed widths and colors, scripts are not.

## Second pass
- When the focus comes from misses rather than leverage, the sentence still says how many points move the composite, so both numbers behind the choice are visible.
- Full-test details are built from the section constants in `js/data/act.js` instead of written-out minutes.
- Editing a miss with no source keeps it as "Other" instead of quietly switching it to QuizMe.
- The API body reader tolerates Vercel's lazy JSON parser throwing on invalid JSON and answers 400.
- Added tests for import validation and for the escaping in `safe-html.js`.

## Free Claude chat mode
- Explain and Coach default to a copy-to-chat mode so they work with a Claude Pro plan and no API credits; the built-in API mode stays as a Settings switch.
- Both modes build their prompts from one module, `js/logic/claude-format.js`, which the `/api` routes also import, so the tutor instructions and the reply parsing never drift apart.
- The chat prompt asks for a JSON code block; the app reads the first fenced block, or any JSON object in the reply, and falls back to saving the reply as plain text.
- In chat mode the photo goes straight into the Claude chat, so the app never handles it; a switch adds "a photo is attached" to the prompt.
- "Open Claude" links to claude.ai/new; on Android, Chrome may hand it to the Claude app if installed.
- The coach is still one note per week in chat mode, and the Apply button only appears when the pasted reply has a valid weekday setting.

## Cross-device sync
- Sync is local-first: IndexedDB stays the working copy, and `/api/sync` pushes this device's changes and pulls everyone else's, so the app still works fully offline.
- Storage is Upstash Redis through its REST API with plain `fetch`, because it has a free tier, connects to Vercel in a few clicks, and needs no SDK; both Upstash's and Vercel's env var names are accepted.
- Conflicts resolve per record, newest edit wins, decided atomically in a Redis Lua script; for one person on two devices, clashing edits to the same item are rare.
- Settings sync field by field, so changing study time on the phone and test dates on the laptop both survive.
- The passcode, Claude mode, last-backup date, plan bookkeeping, and sync state stay on each device.
- Deletes become tombstones that sync, and undo simply rewrites the record with a newer time.
- Pulls are delta-based (a change log with sequence numbers, 500 records per page), so requests stay small as the log grows.
- Plan regeneration only rewrites tasks whose content changed, so two devices regenerating the same plan don't keep re-uploading it.
- A one-time upgrade stamps data saved before sync existed, so a device's existing log uploads on its first sync, and its settings outrank a brand-new device's defaults.
- One `APP_PASSCODE` guards sync and the built-in Claude mode; no device-side encryption, at the user's request.
- Sync runs on open, on returning to the app, when the connection comes back, 4 seconds after an edit, and every 3 minutes while the app is visible.
- A skipped full test creates no "log the test" task, and its practice test stays unused so a full-test day added later picks it up automatically.

## Reschedule
- Any todo or skipped task can be rescheduled to today or a later day, never to the Thursday and Friday before a test or to test day.
- Rescheduling a full test moves its full-test day in Settings, so the planner rebuilds it on the new date with the same practice test, even in a later week.
- Any other task gets a pinned copy on the new day; pinned tasks survive plan regeneration like finished ones.
- The day a task moved off keeps that time blocked, so the planner doesn't refill a night you just cleared.
- Quick picks list the next study days that fit the task first, then ones that nearly fit, and say plainly when a day will run long; any date can still be picked.
- Rescheduling has Undo, which restores the original task and the old full-test day.

## Bug sweep
- A full test moved off a day and later moved back is rebuilt there; a "moved" record no longer blocks the day.
- Heavy-night copies are pinned like rescheduled tasks, so a later plan rebuild (logging a miss, for example) no longer quietly replaces them.
- A pending or done "log the test" task stops the planner from adding a second one.
- A full-test day that passed with no task at all (for example, the app was set up after that day) shows a reminder on Plan to add a new full-test day.
- Reschedule suggestions include days with no study time set (useful for a Sunday full test), labeled "Normally a day off".
- A future week that only holds rescheduled tasks still shows the full preview around them.
- Taper wording says "in the next two days" instead of "this weekend", because the April school-day ACT may be on a weekday.
- Switching a test's source to one with fewer questions drops marks past the last question.
- Identical benchmark entries (one saved per device before sync) count once in estimates and the trend chart.
- A device's first sync takes settings already on the server, so a freshly set-up device can't replace real test dates and study times with defaults.
- Import Merge now keeps the more recently edited version of each item instead of always taking the backup's; Import Replace warns that with sync on it also removes items from other devices.
- Edit stamps only move forward on each device, even if its clock is set back, so edits can't be stamped older than the last sync and skipped.
- Open tabs tell each other when data changes and reload, so a stale tab can't overwrite newer data.
- A test checks that every app file is in the service worker's offline list.

## Second bug sweep (randomized seasons, browser seasons, two-device sync)
- The plan rebuild recomputes the focus first; before, it reused a cached focus, so the plan built right after logging a test or misses used the old priorities.
- A device rebuilds its plan after every sync, not only when that sync changed something, so two devices with the same data always show the same week.
- Weekend blocks are sized for the section they'll actually hold; legacy sections are longer and used to overbook the day by 5 to 17 minutes.
- The one-Science-slot-a-week limit counts Science work already done or kept that week.
- An undone passage can be assigned again later; a passage marked done never is.
- `npm run fuzz` runs the season simulation: 48 seasons across settings variants, checking determinism, week bounds, no-study days, capacity, material reuse, Science limits, redo intervals, and text output.
- A skipped or moved task's Reschedule button stays at full strength (only the task content fades), and skipping or un-skipping a full test rebuilds the week so the "log the test" task appears or disappears right away.
- When a new version finishes downloading, a bar says "A new version is ready" with Reload and Later; the app also checks for updates each time it returns to the foreground. It never reloads on its own, so nothing being typed is lost.
- Every task can be rescheduled, redo sessions included: moving a redo session postpones the redos it covered to the new day and pins one redo session there.
- A day never gets a second redo session: one that's kept, skipped, moved, or rescheduled there stops the plan from adding another.
- Today has "Move all of tonight to another day", which moves every task still open tonight (including skipped ones) to one chosen day, with Undo; Heavy night still spreads tonight across the week automatically.
- Only full tests can go on a full-test day; other tasks are refused there.
- Plan has a week strip on top (one tile per day: a colored bar per task, solid when done, minutes left) so the whole week is visible on a phone, and tapping a tile jumps to that day.
- Plan offers List or Board, remembered on the device. Board shows day columns: all seven across on a laptop, about one and a half at a time on a phone with swipe and snap, opening on today. Tapping a board card opens the full task with Done, Skip, and Reschedule.

## History and theme
- A History screen (More, History) lists skipped, moved, and Heavy-night-dropped tasks from the last 8 weeks, deleted misses and tests, and every plan update that replaced unfinished tasks, with the reason.
- Deletes keep a copy of what was removed inside the sync tombstone for 30 days, so History can explain and restore it on any synced device; after that only the bare tombstone stays.
- Items deleted together (a test with its misses, redos, and pacing) share a group and restore as one.
- Plan rebuilds record why they ran ("You logged or edited a test", "A new week started", "Synced with your other device"), and replaced tasks are listed but not restorable, since the new plan already covers that time.
- Skipped tasks in History have a Reschedule button.
- Appearance in Settings offers Match system, Light, or Dark, saved on the device; a tiny script in the page head applies it before anything draws so there is no flash of the wrong theme.

## Weekly coach reminder and habits
- Today shows a "Weekly coach" reminder each plan week until that week's note is saved; the × dismisses it for the week (synced), and dismissed reminders appear in History under Reminders with "Get the note" and "Show on Today".
- Habits are found from the data, not by Claude: skipping 30% or more of the last two weeks' tasks, 4+ tasks never checked off, one weekday skipped or moved 3 of the last 4 weeks (with a one-tap "Set that day to 15 min or off"), 3+ heavy nights in two weeks, upcoming study days with more work than time, 10+ redos due, 3+ untagged misses, and drills done with no misses logged in 10 days.
- Habits show on Progress, the reminder mentions the top one, and the coach prompt includes them and asks Claude to address the most important.

## Multi-user
- Anyone can use one deployment. Data already lived per device; sync now uses a private 16-character sync code per person (Crockford base32, about 80 random bits) instead of the shared APP_PASSCODE, and each code maps to its own Redis space keyed by a hash of the code.
- Starting sync makes a code on the device and uploads everything there, including records that originally came from another device, so a new space starts complete. Joining takes the code, forgiving spaces, dashes, lowercase, and O/I/L look-alikes.
- APP_PASSCODE now only guards built-in Claude mode, which spends the deployer's API credits.
- Devices that had passcode-based sync see a note to start sync again; the old shared space is no longer read.
- Onboarding asks for each person's own test date (or "I don't have a date yet") and optional recent scores with their kind and scale; nothing is prefilled.
- New installs start with no dates; full-test days come from the chosen test date (first Saturday, and the Saturday two weeks before the taper). Adding a test date later with no full tests coming up adds them the same way. The original December 2026 calendar is kept as a preset for tests.
- Claude prompts describe the student by their own estimated composite instead of a fixed "34+ junior with AP classes", and use "they".

## Adding your own tests
- Any test the app doesn't list can be added (Settings, Materials, Add a test, or "+ Add a test that isn't listed" while logging a test) with a name, a type (full practice test in today's format, older practice test, or something else), and an optional link.
- Added full practice tests in today's format are saved for full timed tests like Practice Tests 1 and 2, and the planner uses them once those are taken; older-format ones feed section practice like legacy tests.
- Logging a full practice test within 3 days of a planned full-test day counts as that day, even if it was a different test; the planned test stays unused for a later full-test day. Editing which test an attempt was moves this along with it.
- "Something else" in test entry is now labeled "(not tracked)", since it doesn't record which test it was.
- Added tests can be renamed or relinked any time, and removed only while no attempt uses them.
- Official Practice Tests 1 to 4 have built-in scoring keys (js/data/forms.js), read from the four official scoring-key PDFs and spot-checked against rendered key pages. Logging one goes Source, Misses, Tag: scores come from scored questions minus scored misses, through each test's own conversion table.
- The uploaded keys are treated as the real ones. All four tests are titled "Official Practice Test 1" to "4" and link to the ACT test prep hub; the old PDF links were dropped since they may be different forms.
- A hand-added copy of Practice Test 1 to 4 (matched by name) is merged into the built-in test on load: attempts, misses, plan tasks, material use, and full-test days move over to it, then the copy is removed.
- Misses on unscored questions still get redos and stay in the log, but count at half weight in the focus engine. When a miss is both unscored and guessed right, the smaller multiplier is used, not the product.
- Whether a miss is unscored comes from the key whenever its test and question number are known, so edits and quick-add misses stay correct.
- Each section of a keyed test has an "I took this section" toggle, all on by default (Science too, since full tests include it).
- "Edit scores" on a keyed test starts from the key's scores and sticks even if misses change later, until "Use key scores". Attempts record scoredBy 'key' or 'manual'; older attempts count as manual, so editing them never changes their scores.
- The tag card shows the key letter as "Key: C" (A is the first choice listed) instead of filling in the answer fields, since the online review shows answer values, not letters.
- Each key's reporting category maps to likely app topics, which the tag card lists first. All other topics stay available.
- Import results on the Misses step takes the online results PDF or pasted results text. pdf.js 5.4.296 (about 1.5 MB with its worker) is kept in vendor/pdfjs, unmodified but renamed to .js so every server sends a JavaScript MIME type. It's precached by the service worker so import works offline, and it's only loaded when a PDF is picked.
- A result is a line that's just "Correct", "Incorrect", or an unanswered word (Unanswered, Not answered, No answer, Omitted, Skipped, Blank), so "Correct answer: B" and the word inside a question don't count. For PDFs, text is rebuilt row by row, and a status sharing a row with other text gets its own line.
- The import checks the question count and that the Correct count equals the SCORE x line. If either fails, nothing is marked. Only x is checked, since it isn't known whether y counts unscored questions.
- Importing a section replaces that section's misses with the file's. A question marked guessed right stays that way if the file says it was correct. The section's "I took this section" switch turns on.
- One paste or PDF can hold several sections. It's split wherever the header names a new section, and a header repeated on each page of the same section is ignored. Import stops at the first section that fails its checks.
- The test number in the file is compared with Official Practice Test N, or with a "Practice Test N" in the title of an added test. If they differ, the app asks before importing.
- Question first lines and answers from an import are kept in a module variable in the test-entry view, never in the draft (which goes to localStorage), misses, exports, or sync. They're dropped when the test is saved or discarded, or when a different test is picked.
- Checked against the real Practice Test 3 results PDFs. Those pages have labels ("Result", "Answer Feedback", "Your Answer", "The ACT", "Result Details"), the answer on the line after "Your Answer" behind a bullet dot, and a NUMBER OF QUESTIONS line. The parser skips the labels, reads the answer from the next line, and refuses a file when the results it finds don't match NUMBER OF QUESTIONS. Hint lines without a 3-letter word (like a stray "2+") are skipped.
- Checked each paper booklet's scoring key (Tests 1 to 4) against the online key: answers (paper F/G/H/J = A/B/C/D), Not Scored questions, reporting categories, and conversion tables all match. Answers stay stored as A to D.
- forms.js now has a topic for every question, read from the booklet question and checked against the key's reporting category (a test enforces it: an English CSE question gets a grammar or punctuation topic, POW gets Transitions, Add/delete/revise, or Organization, and so on). The tag card pre-selects that topic and pre-fills the correct answer as A to D. "Key category" stays as a hint and the likely topics are still listed first.
- forms.js has each question's booklet page and the page its passage or figure starts on (0 when it's the same page). Pages come from where each question number sits in the booklet PDFs, spot-checked on rendered pages. BOOKLETS lists each booklet's form code and page count.
- Booklets: attached once per test in Settings. The app checks the PDF is that test's booklet (form code in the page footer, page count) before saving. It's stored in a separate device-only IndexedDB store (schema version 2), so it never enters state, sync records, or the JSON export.
- Booklet sync uses Redis chunks in the user's own sync space, through /api/booklet, which needs the sync code (same hashed-code prefix as /api/sync). Chunks are 512 KB of PDF (about 700 KB base64), so each request stays under the app's 2 MB body cap and Vercel's 4.5 MB request limit no matter Upstash's per-value limit. A booklet shows up for other devices only once every chunk is stored. Chose this over Vercel Blob: no second store or token, and access is gated by the code that already guards the data. Upstash's docs couldn't be reached from this session, so its exact current limits weren't checked.
- Pages that print F, G, H, J show "F=A, G=B, H=C, J=D on this page" under the page, since answers in the app are A to D.
- The full-screen page view handles pinch itself (two fingers zoom, one finger drags) with touch-action: none, so the browser doesn't zoom the whole app. + and - buttons and double-click cover a mouse.
- On the redo screen, when the booklet is attached, the page replaces the link to the test. Without it, the page number shows. The correct answer on Reveal falls back to the key when the miss didn't record one.
- Booklets can't be removed in the app, since each is attached once and checked. Attaching again on another device isn't needed: it downloads automatically.
- Booklet sync now compares against what the sync space actually has. Each sync lists the space's booklets and uploads any booklet this device has that the space is missing, so a booklet attached before sync was on, or while the device used a different sync code, still reaches the other devices. A device records which code it uploaded to (uploadedTo) instead of a yes/no flag.
- Booklet chunks are 256 KB of PDF (about 350 KB per request) to stay well under any request size limit. A failed upload shows "Booklet attached here, but it didn't upload" with Try again, and also retries on the next sync.
- Each tag card has a review box: what you answered, and the correct answer covered until you tap it. The "Key: C" badge is gone from the card header so it doesn't give the answer away.
- With the booklet attached, the review box reads the question's four choices from the booklet page (on the device) and shows both sides as "letter. choice text", matching your results-page answer to its choice. F/G/H/J choices show as A to D. Without the booklet it shows your answer as the results page gave it and the key letter.
- Misses now save your answer and the correct answer as both letter and choice text: myAnswer and correctAnswer hold the letter (A to D), and myAnswerText and correctAnswerText hold the choice text. The text comes from the attached booklet when there is one; without it, your answer's text is what the results page showed. Like other miss fields it syncs only to the user's private sync space and is in their own export file, which fits the rule for official content.
- An answer typed in "My answer" wins over the imported one. Editing a miss's letter later clears the saved text for it so the two can't disagree.
- Imported answers for missed questions are kept in the logger's draft, so a reload mid-tagging doesn't lose them. The question's first line is still kept in memory only.
- Matching a results-page answer to a booklet choice normalizes characters (math italic letters), then falls back to comparing letters only (subscripts land in different places in the two files), accepting that only when exactly one choice fits.
- The redo screen's Reveal and the Explain form show answers as "D. So far," when the text is known.
- Added "Writer's purpose" as a built-in English topic for "Suppose the writer's purpose had been... Would this essay accomplish that purpose?" questions, which judge the whole essay or paragraph instead of adding, deleting, or revising a part. Tests 2 to 4 have nine of them (Test 1 has none), now tagged with it in forms.js. It's a Production of Writing topic.
- Misses already saved on those questions with "Add, delete, or revise" move to "Writer's purpose" once (topicFixes in settings records it), so a topic chosen by hand later is left alone.
- Added a fifth cause, "Misread the question" (misread): didn't read what the question asked carefully, like missing NOT, EXCEPT, a line range, or units. It counts at 0.8 like careless. When it's a section's dominant cause, the planner assigns a read-the-question set: underline exactly what each question asks before looking at the choices, and reread it before bubbling. Claude's explain can suggest it too.
- Pull down from the top of any screen to reload, like a browser tab. Chrome turns its own pull-to-refresh off for installed apps, so the app does it (js/pull-refresh.js), and the browser's is turned off with overscroll-behavior so there aren't two. When sync is on, it syncs first (up to 3 seconds) so nothing waits for the next sync. It doesn't start while a sheet or the page zoom is open, or from a text box or the question grid, so typing and long-presses are never interrupted.
- The tag step has a scrollable strip of every marked question (shown when there are 2 or more). Each chip is just the question number in its section's color, with a small gap between sections. It fills from the bottom as it's tagged: empty, half full once a topic is picked (only on tests where you pick the topic; on keyed tests the topic is pre-filled, so only the cause is left), and solid in the section color when it's done. Not-scored questions have a dashed edge and fill to a lighter shade, so they stay distinct when done. The current question has an outline. Tapping a chip jumps to it, and the strip keeps the current one centered.
