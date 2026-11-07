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
