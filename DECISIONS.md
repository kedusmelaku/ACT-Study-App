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
