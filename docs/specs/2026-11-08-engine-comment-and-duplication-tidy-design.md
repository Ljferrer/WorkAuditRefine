# Engine comment and duplication tidy — fix false comments and fold small copies in workflow-template.js after the engine groups land

dependsOn: `docs/specs/2026-11-08-model-routing-and-prompt-byte-budgets-design.md` landed on `master` (this group is the tail of the `workflow-template.js` chain; see §5 for the full order).

Issues addressed (all 19): #2140, #2145, #2146, #2180, #2198, #2199, #2200, #2202, #2203, #2223, #2227, #2240, #2246, #2271, #2313, #2316, #2317, #2552, #2553.

## 1. Context — the gap / problem

Nineteen open follow-ups name one file: the per-phase Workflow engine `skills/war/assets/workflow-template.js`. Most are comments that state something the code does not do. A few are small copies of one rule with nothing binding the copies. Three touch a dispatched prompt. All 19 are still open and still live at 35aa4144 (verified: `gh issue list --state open` at 35aa4144; each construct below re-read at 35aa4144). The issues' line numbers are stale; every item below is anchored by construct name.

**Region A — parked asks and the phase-close registries.**
- The comment above `const parkAsk` says one seat on a second file survives the merge as a corroborator, then says the own-raiser skip means "the handoff row counts distinct seats". The dedup predicate `same` reads seat, file and title, so one seat on two files lands two entries. The count claim is false (verified: issue #2140 (2026-09-07); `const same = c => c.seat === e.seat && c.file === e.file && c.title === e.title` at 35aa4144). The same false clause is repeated in a test comment in the `parkAsk` own-raiser fixture (verified: `workflow-template.engine-1.test.mjs` comment "the handoff row counts distinct seats" at 35aa4144).
- `parkAsk`'s collision `log()` puts a ternary with two full prose clauses inside one long concatenation; sibling log lines concatenate values only (verified: issue #2145 (2026-09-07); `(recorded ? 'the re-raise recorded on its corroborators list' : 'already a corroborator, not recorded again')` at 35aa4144). Tests match on `merged as corroboration`, so the log text must stay byte-stable (verified: issue #2145 (2026-09-07)).
- The `queuedKeys` comment still lists its producers by hand ("routeToSweep, the round-1 approve arm's direct push, the gate-audit floor pass's routeToSweep calls, and the ruledAsks push loop below (#1875)"). Its siblings `filedKeys` and `aceRelPath` were rewritten to "no list here — a new caller joins by calling X" (verified: issue #2146 (2026-09-07); comments above `const filedKeys`, `const queuedKeys` and the `aceRelPath` "no list here" line at 35aa4144).

**Region B — the evidence dispatch.** The post-merge `EVIDENCE DISPATCH` prompt renders a `gateLogPath` column in its header ("taskId · gateHeadSha · preMergeTip · gateLogPath") and in every row. None of steps 1–3 and not the return shape `{ perTask, phase_diff_files, integratedTipGate? }` reads it (verified: issue #2180 (2026-09-08); `evItems` and the row builder at 35aa4144). The refiner card's `## Post-merge evidence dispatch` section never names the column (verified: `grep -c gateLogPath agents/war-refiner.md` prints 0 at 35aa4144). Two tests pin the column: the gate-log fallback test asserts `evP.includes('gateLogPath=' + absent)`, and the #2182 baseline test asserts `!/gateLogPath=[^\n]*gate-t1\.log/.test(ev)` (verified: `workflow-template.engine-1.test.mjs` at 35aa4144).

**Region C — the provenance (own-token) floor.**
- `adjRow` renders `<value> (supersedes plan literal: <x>)`. `isValueRow`'s string arm restates that suffix as the regex `/^\S{1,64} \(supersedes plan literal: [^\n]+\)\s*$/`. Nothing binds the two. If the `adjRow` wording changes, canonical rows stop matching and the floor refuses a valid launch (the #1480/#1751 false refusal) (verified: issue #2198 (2026-09-08); `adjRow` and `isValueRow` at 35aa4144). An earlier equality assert was reverted whole by the ace ladder (verified: issue #2198 (2026-09-08)).
- `ownPlanStem` and `ownPlanBase` repeat the same `plan && typeof plan.file === 'string' && plan.file` guard and `.replace(/^.*\//, '')` step; they differ only in `.md` strip versus lowercase. Both consumers of `ownPlanStem` lowercase it. `slugAnchorOf` is a third stem idiom (verified: issue #2199 (2026-09-08); `grep -c 'plan\.file\.replace'` prints 2 at 35aa4144).
- The comment above `ruledAskRowText` says the #1751 strip is "deliberately adjudications-only". `rowText` carries the strip and `provenanceSurfaces` maps `rowText` over both `backstops` and `adjudications` (verified: issue #2200 (2026-09-08); `provenanceSurfaces` at 35aa4144).
- `scanText` is built by filter, map and join, but its only read is the truthiness guard in `ownTokenMiss`; the token search reads `tokenText` (verified: issue #2202 (2026-09-08); `const scanText` and `const ownTokenMiss` at 35aa4144).
- `PLAN_ID_RE` hoists the plan-id pattern, but `stripSupersedes` on the next line writes the same character class out again (verified: issue #2203 (2026-09-08); at 35aa4144). A third copy sits in `isValueRow`'s second string arm, `/^\S{1,64} supersedes:? docs\/plans\/[A-Za-z0-9._/-]+\.md\s*$/` (verified: `grep -nF 'docs\/plans\/[A-Za-z0-9._/-]+\.md'` prints three lines at 35aa4144; survey-derived, not named in #2203).

**Region D — ace, terminal pass and chain-digest comments.**
- In the terminal-pass merged arm, the comment "#1873-class: the terminal path keeps the citation stamp too" does not say the arm has no touched-file gate, so it inherits the ruled residual that today is written only at the ace batch site ("RESIDUAL, ruled: the no-intersection arm records aced on the full panel's re-approval alone") (verified: issue #2223 (2026-09-08); both comments at 35aa4144).
- The comment above `const queuedFindingRow` cites a commit as `#3f55b04`. In this file `#N` means an issue. It also names 3f55b04 as the drift event, but 3f55b04 is the fix ("terminal prompt row carries the citation stamp") and c0f88d06 added the stamp to the sweep row only (verified: issue #2227 (2026-09-08); `git log --oneline -1 3f55b04` and `c0f88d0` at 35aa4144). It is the only `#<hex sha>` cite in the file (verified: `grep -noE '#[0-9a-f]{7,40}'` filtered for a hex letter prints only that line at 35aa4144).
- The `aceReaudit` comment says the re-audit "reads one more than the fixer it judges" with no zero-sum caveat. The canonical `correctiveRoundOf` comment carries "except at a zero sum, where the 1-based floor makes both read 1" (verified: issue #2313 (2026-09-12); both comments at 35aa4144).
- The `throughRound` comment above `chainDigest` says the ace fixer's row is one round lower "because chainRecordFix runs before the absorbRounds charge". At all three ace sites `r.task.absorbRounds++` runs before `chainRecordFix(...)`. The real reason is that `chainRound` is captured by `correctiveRoundOf('ace', r.task)` before the charge (verified: issue #2316 (2026-09-13); `grep -n 'r.task.absorbRounds++\|chainRecordFix('` at 35aa4144).

**Region E — sweep carry, filing and gate-audit comments.**
- The `carryPhaseClose` header says a discarded sweep's absorbs carry "except the approve trail". That holds only for queued `phaseCloseQueue` rows. The discard arm's `sweepMinors` loop carries sweep-raised absorbs on a non-final phase whatever `sweepApproved` says, and the discard-arm comment already says so. The `carriedPhaseClose` declaration comment repeats the unscoped clause (verified: issue #2271 (2026-09-08); `if (!finalPhase && !sweepApproved) carryPhaseClose(...)` and the "The approve trail (D15, #2087) does not apply here" comment at 35aa4144).
- The `drainCauseOf` header says both readers "sit outside any local try". The filing-prompt row builder is inside the file-followups `try` (the one that sets `filingOut = null` on failure); only the handoff `followUps` projection is outside (verified: issue #2246 (2026-09-08); `drainCauseOf(` call sites at 35aa4144).
- The comment above `let phaseDiffFiles = null` says the note arm "then skips with a log" when the diff is absent. #2058 retired that skip: `routeGateAuditRows` reads an absent diff as an empty Set and keeps every note, logged (verified: issue #2553 (2026-10-31); `const phaseDiff = phaseDiffFiles === null ? new Set() : phaseDiffFiles` at 35aa4144).
- Four comment lines rewritten by task 9.1 run past the ~100-column wrap of their blocks: the `routeGateAuditRows` header, the `carriedPhaseClose` header, the demote-reason header and the `carryPhaseClose` header (verified: issue #2240 (2026-09-08)). The `carriedPhaseClose` block at 35aa4144 has lines of 107–206 columns and the `routeGateAuditRows` block ends in short orphan lines (verified: `awk length` over those blocks at 35aa4144).

**Region F — two-surface and duplicated wrappers.**
- Worker rule 1 in `BACKWARD_CHAIN_WORKER_RULES` (byte-equal to `skills/war/references/backward-chain-worker.md` by test) says "the prepended `DEPS ALREADY MERGED:` dispatch clause". That literal also matches the rule's own text, which rides every work prompt. `agents/war-worker.md` keys the same trigger on the longer `DEPS ALREADY MERGED: this task declares deps` plus a parenthetical. One trigger has two discriminators (verified: issue #2317 (2026-09-13); both texts at 35aa4144). `depClause(task)` is the first text of the work prompt (verified: the `dispatchAgent(depClause(task) + ...` call at 35aa4144). Tests key negatives on the longer literal, so it must never appear in the rules block (verified: `!w1.prompt.includes('DEPS ALREADY MERGED: this task declares deps')` in `workflow-template.engine-1.test.mjs` and `workflow-template.submodule-1.test.mjs` at 35aa4144). A mutation row in `skills/war/assets/backward-chain.test.mjs` replaces rule 1's exact sentence (verified: the "rule 1 loses the DEPS ALREADY MERGED sub-clause" row at 35aa4144).
- `segmentLoop` owns the bounded loop, but `segmentedMerge` and `segmentedLand` each still repeat the re-dispatch log, the continuation wrapper and the exhaustion log around it, and no test binds the two (verified: issue #2552 (2026-10-31); both helpers at 35aa4144). Tests pin the exhaustion strings `segmented-gate budget exhausted` and `segmented-land budget exhausted` (verified: `workflow-template.engine-1.test.mjs` at 35aa4144).

## 2. Pivotal constraints

1. Every item lands after the engine behavior groups, so each comment describes final code. Each construct is re-read by name at the tip before it is edited (verified: group rationale, issue #2560 section H, as recorded by the 2026-11-08 survey).
2. Comment-only items change no behavior and no dispatched prompt byte. Code items (#2145, #2199, #2202, #2203, #2552) must keep every log string and prompt byte that a test pins.
3. Both-surfaces rule: a change to a dispatched worker or refiner prompt lands with its `agents/*.md` card in the same commit (#2317 worker; #2180 refiner, where the card needs no edit because it never names the column).
4. `workflow-template.js` has one owner per phase. Same file means same task.
5. Test edits go in `workflow-template.engine-1.test.mjs` (no new test file), so the harness export lists and the `runForm` census do not move (verified: header of `skills/war/assets/workflow-template.test-harness.mjs` at 35aa4144).
6. A code edit to the template must also pass the staged form: the repo gate never sets `WAR_TEMPLATE_STRIPPED=1` (verified: `stage-workflow.test.mjs` sets the flag only inside its own runs at 35aa4144).
7. A negative assertion re-aimed by a removal must still be able to fail. The #2182 test's `gateLogPath=` regex becomes vacuous once the column is gone, so it is re-aimed, not left.

## 3. Resolved design tree

| # | Decision | Resolution |
|---|----------|------------|
| D1 | Phase split | Two engine phases plus a release phase: Phase 1 the code and prompt items, Phase 2 the comment-only items, so the comments land on code that has stopped moving [assumed: two serial tasks on one file are worth the extra audit pass — if wrong: merge both into one task in one phase]. |
| D2 | `gateLogPath` column (#2180) | Drop it from `evItems`, the header and the row builder. The per-task seat's `gateArtifactLine` keeps its own read of `mergedTasksForGateAudit` [assumed: no refiner reads the column — if wrong: keep it, add a consumer sentence to step 1 and a `deliberately-unwired:` marker]. The fallback test asserts the column is absent; the #2182 test asserts `!ev.includes('gateLogPath=')` plus its seat-side check. |
| D3 | `adjRow` ↔ `isValueRow` (#2198) | One module-level literal (`SUPERSEDES_LITERAL = 'supersedes plan literal: '`) feeds both `adjRow` and the `isValueRow` string regex, plus a behavior fixture: a launch whose only adjudication is `adjRow`'s render of a token-free value launches [assumed: a shared literal beats a source-extraction assert, which the ace ladder already reverted once — if wrong: add the extraction-and-equality test row only]. |
| D4 | Plan-file basename (#2199) | Hoist `baseOf` above `ownPlanStem`; `ownPlanBase = planFile ? baseOf(planFile) : null`; `ownPlanStem = ownPlanBase && ownPlanBase.replace(/\.md$/i, '')`. `slugAnchorOf` is left as it is (it takes any input) [assumed: a lowercased stem is safe because both consumers lowercase it — if wrong: the #1767 fallback log prints a different case, and a test pinning it reds]. |
| D5 | `scanText` (#2202) | Replace it with a boolean `hasScanRows = rows.some(r => !r.exempt && !r.value && r.text)` and keep the comment's surface definition [assumed: name `hasScanRows` — if wrong: rename at plan time; no behavior rides the name]. |
| D6 | Plan-id pattern (#2203) | Build the `stripSupersedes` regex and `isValueRow`'s second string arm from `PLAN_ID_RE.source`, each with its own flags [assumed: `new RegExp(... + PLAN_ID_RE.source ...)` survives the staged form — if wrong: keep the literals and add a test that compares the three sources]. |
| D7 | Strip-scope comment (#2200) | Reword: the strip rides `rowText` (string rows of `backstops` and `adjudications`) and never applies to `ruledAsks`, `seededPhaseClose` or `seededTasks`. |
| D8 | Worker rule 1 discriminator (#2317) | Both surfaces key on position: the clause is the one the prompt opens with. Rule 1 keeps the short `DEPS ALREADY MERGED:` literal (the longer one must stay out of the rules block). The card line keeps its `If your spawn prompt carries a \`DEPS ALREADY MERGED` prefix, so its locator test still finds it [assumed: position is a stable discriminator because `depClause` is always first — if wrong: both surfaces quote the longer literal and the two negative tests key on a new clause-only token]. |
| D9 | Segmented wrapper (#2552) | One helper beside `segmentLoop` takes `{ isSegment, noun, continuation, exhaustedTail }` and owns the log, continuation dispatch and exhaustion log. `segmentedMerge` and `segmentedLand` call it with their current literals, byte for byte [assumed: a helper beats a parity test because the two copies differ in pinned words — if wrong: add a source test that slices both wrappers and compares them after the per-site words are masked]. `aceSegments` is out of scope (§9). |
| D10 | `parkAsk` log (#2145) | Hoist `const outcome = recorded ? ... : ...`; the log line concatenates values only. Text byte-stable. |
| D11 | `queuedKeys` list (#2146) | Replace the producer list with "no list here — a new caller joins by stamping queuedKeys", and keep the `seededPhaseClose` construct-time sentence as its own line [assumed: the `seededPhaseClose` note is the only part of the list worth keeping — if wrong: the auditor names what else to keep]. |
| D12 | Rewrap (#2240) | Rewrap the four named blocks to ~100 columns while Phase 2 edits them, rather than closing as won't-fix [assumed: rewrap is cheap because #2271 already rewrites two of the four blocks — if wrong: close #2240 as won't-fix at the Checkpoint]. |
| D13 | Remaining comments | #2140 drops the "counts distinct seats" clause in the engine and the test. #2223 names the inherited ruled residual. #2227 cites `3f55b04` with no `#` as the fix and `c0f88d06` as the drift. #2246 names only the handoff projection as outside the try. #2271 scopes the exception to queued rows at both copies. #2313 adds the zero-sum caveat. #2316 names the `chainRound` capture. #2553 states the empty-Set behavior. |

## 4. Mechanics

The phases are serial: each has one `workflow-template.js` owner. Test edits ride the same task as the code they pin, because a split task would red the gate between commits.

### Phase 1 — Code dedup and prompt-surface items

- **T1.1 engine, tests, worker surfaces.** Files: `skills/war/assets/workflow-template.js`, `skills/war/assets/workflow-template.engine-1.test.mjs`, `skills/war/references/backward-chain-worker.md`, `agents/war-worker.md`, `skills/war/assets/backward-chain.test.mjs`. `requiresTest: true`. Work:
  - #2180 per D2: drop the column; re-aim the two pinned tests. Check `agents/war-refiner.md` in the same commit and record in the commit body that it names no column (both-surfaces rule).
  - #2198 per D3, #2199 per D4, #2202 per D5, #2203 per D6, and the #2200 comment per D7. One region, one pass. Grep `docs\/plans\/` and `supersedes plan literal` in the template and handle every match. Manual same-scope survey required: after the grep, hand-scan the target file's same-scope tests and comments for same-meaning siblings worded differently, and list each straggler as a survey-derived correction.
  - #2317 per D8: rule 1 in `BACKWARD_CHAIN_WORKER_RULES` and `backward-chain-worker.md` change together (the byte-equal test binds them); the card line in `agents/war-worker.md` changes in the same commit; the `backward-chain.test.mjs` mutation row's search text follows the new sentence. Grep `DEPS ALREADY MERGED` across `skills/` and `agents/` and handle every match. Manual same-scope survey required: after the grep, hand-scan the target file's same-scope tests and comments for same-meaning siblings worded differently, and list each straggler as a survey-derived correction.
  - #2552 per D9. Keep every pinned log string.
  - #2145 per D10.
  - Run the template tests twice: plain, and with `WAR_TEMPLATE_STRIPPED=1`.

### Phase 2 — Comment truth (no code change)

- **T2.1 engine comments.** Files: `skills/war/assets/workflow-template.js`, `skills/war/assets/workflow-template.engine-1.test.mjs` (the one `parkAsk` own-raiser test comment). `requiresTest: false` (comment-only; the gate still runs). Work: #2140, #2146 (D11), #2223, #2227, #2240 (D12), #2246, #2271, #2313, #2316, #2553 per D13. For #2553, grep `skips with a log` and `note arm` in the template and handle every match. Manual same-scope survey required: after the grep, hand-scan the target file's same-scope tests and comments for same-meaning siblings worded differently, and list each straggler as a survey-derived correction. For #2140 and #2313, grep `distinct seats` and `one more than the fixer` in the template and its tests and handle every match. Manual same-scope survey required: after the grep, hand-scan the target file's same-scope tests and comments for same-meaning siblings worded differently, and list each straggler as a survey-derived correction. A diff check proves the phase is comment-only: every changed line in `workflow-template.js` is a `//` line.

### Phase 3 — Release

- **T3.1 version bump.** Files: `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, `README.md` (`## Status` line), `CHANGELOG.md` if present. Next free patch from the slots at land time [assumed: this plan carries its own release — if wrong: `/war-machine` folds it into the campaign's release phase].

## 5. Surface changes

- Phase 1: `skills/war/assets/workflow-template.js`, `skills/war/assets/workflow-template.engine-1.test.mjs`, `skills/war/references/backward-chain-worker.md`, `agents/war-worker.md`, `skills/war/assets/backward-chain.test.mjs`. `agents/war-refiner.md` is read, not edited.
- Phase 2: `skills/war/assets/workflow-template.js`, `skills/war/assets/workflow-template.engine-1.test.mjs` (one comment).
- Phase 3: the four release slots.

Contention [assumed: the survey's chain order holds — if wrong: re-read each construct after whichever group actually lands last]:

| File | This spec's phase | Sibling spec that also edits it | Lands first |
|------|-------------------|---------------------------------|-------------|
| `skills/war/assets/workflow-template.js` | 1, 2 | args-floor-and-launch-preflight (provenance floor), engine-recovery-relaunch-and-land, engine-findings-ace-and-late-fix (parkAsk, drainCause), model-routing-and-prompt-byte-budgets | the siblings |
| `skills/war/assets/workflow-template.js` (#2660 comments, #2346, #2658) | 1, 2 | doc-truth-drift-and-adr-hygiene, shell-floors-tests-and-lint | this spec |
| `skills/war/assets/workflow-template.engine-1.test.mjs` | 1, 2 | engine-findings-ace-and-late-fix | the sibling |
| `skills/war/assets/workflow-template.engine-1.test.mjs` | 1, 2 | shell-floors-tests-and-lint | this spec |
| `agents/war-worker.md` | 1 | model-routing-and-prompt-byte-budgets (fix rules copy), engine-recovery-relaunch-and-land | the siblings |
| `agents/war-refiner.md` (note-arm line) | — (read only) | doc-truth-drift-and-adr-hygiene | this spec |

## 6. New domain terms (GLOSSARY.md)

None. No item adds a concept; D9's helper is an internal name.

## 7. Recommended ADRs

None [assumed: comment truth and copy folding need no binding decision — if wrong: D8's positional trigger rule becomes a one-paragraph ADR].

## 8. Open risks / implementation notes

- The provenance floor (Region C) is edited first by args-floor-and-launch-preflight, and `parkAsk`/`drainCauseOf` by engine-findings-ace-and-late-fix. If a sibling already fixed an item, the worker records it as already-fixed in `notes` and moves on.
- The ace ladder reverted earlier fixes for #2198, #2202 and #2203 (verified: issues #2198, #2202, #2203 (2026-09-08)). Route them as deliberate task work, not as absorbs, so a regressed round cannot drop them again.
- D6 builds regexes at runtime. The staged form strips comments and rewrites the script; the `WAR_TEMPLATE_STRIPPED=1` run is the proof it still works.
- D9 moves code that runs inside `reconciledMerge`'s callback. `segmentedLand` reads phase-local values (`submodLandTask`, `refineryLandPath`); the helper takes the dispatch body and options only, never those values.
- The refiner card's step 3 says "absent ⇒ that arm skips" — the same retired behavior as #2553 (verified: `agents/war-refiner.md` `## Post-merge evidence dispatch` step 3 at 35aa4144). doc-truth owns that card line; this spec leaves it and names it in the Phase 2 commit body so doc-truth picks it up.

## 9. Non-goals / deferred

- `aceSegments` (the third `segmentLoop` caller) has a different log shape and no exhaustion log; folding it into D9's helper is out of scope.
- The refiner card's note-arm line (§8) stays with doc-truth-drift-and-adr-hygiene.
- Shell-floor script comment nits (#1836) stay with shell-floors-tests-and-lint.
- No issue in the group is declined.

## 10. Validation criteria

- WHEN Phase 1 lands THE evidence dispatch SHALL carry no `gateLogPath` column · check: `grep -c 'gateLogPath=' skills/war/assets/workflow-template.js` prints `0` and `grep -c '· gateLogPath)' skills/war/assets/workflow-template.js` prints `0`.
- WHEN the evidence dispatch is built with an unthreaded gate log THE test SHALL assert the column absent, not a vacuous negative · check: `grep -c "ev.includes('gateLogPath=')\|evP.includes('gateLogPath=')" skills/war/assets/workflow-template.engine-1.test.mjs` prints a number ≥ 1 and `node --test skills/war/assets/workflow-template.engine-1.test.mjs` prints `# fail 0`.
- WHEN a launch's only adjudication row is `adjRow`'s render of a token-free value THE own-token floor SHALL launch it · check: `node --test --test-name-pattern='#2198' skills/war/assets/workflow-template.engine-1.test.mjs` prints `# pass 1` or more and `# fail 0`.
- WHEN Phase 1 lands THE `supersedes plan literal: ` wording SHALL be spelled once in code · check: `grep -c 'SUPERSEDES_LITERAL' skills/war/assets/workflow-template.js` prints a number ≥ 3 (definition, `adjRow`, `isValueRow`).
- WHEN Phase 1 lands THE plan-id character class SHALL be written once · check: `grep -cF 'docs\/plans\/[A-Za-z0-9._/-]+\.md' skills/war/assets/workflow-template.js` prints `1`.
- WHEN Phase 1 lands THE plan-file basename SHALL be derived once · check: `grep -c 'plan\.file\.replace' skills/war/assets/workflow-template.js` prints `0` or `1`.
- WHEN Phase 1 lands THE dead join SHALL be gone · check: `grep -c 'scanText' skills/war/assets/workflow-template.js` prints `0`.
- WHEN Phase 1 lands THE strip-scope comment SHALL name `rowText`'s two surfaces · check: `grep -c 'deliberately adjudications-only' skills/war/assets/workflow-template.js` prints `0`.
- WHEN a work prompt is built THE rules block SHALL never carry the clause-only literal and both surfaces SHALL key rule 1 on the prompt's opening clause · check: `node --test skills/war/assets/workflow-template.engine-1.test.mjs skills/war/assets/workflow-template.submodule-1.test.mjs skills/war/assets/backward-chain.test.mjs` prints `# fail 0`, and `grep -c 'opens with' agents/war-worker.md skills/war/references/backward-chain-worker.md` prints ≥ 1 for each file.
- WHEN Phase 1 lands THE segmented wrapper SHALL live in one helper · check: `grep -c 'segmentLoop(admitGateResult(await dispatchSite' skills/war/assets/workflow-template.js` prints `2` (the helper and `aceSegments`; it is `3` at 35aa4144), and the tests pinning `segmented-gate budget exhausted` and `segmented-land budget exhausted` still pass (`# fail 0`).
- WHEN `parkAsk` logs a collision THE log text SHALL be byte-stable and the line SHALL hold no prose ternary · check: `grep -c "(recorded ? 'the re-raise" skills/war/assets/workflow-template.js` prints `0`, and the `merged as corroboration` fixtures print `# fail 0`.
- WHEN the template runs in staged form THE suite SHALL stay green · check: `WAR_TEMPLATE_STRIPPED=1 node --test 'skills/war/assets/workflow-template.*.test.mjs'` prints `# fail 0`.
- WHEN Phase 2 lands THE false or stale comments SHALL be gone · check: each of `grep -c 'counts distinct seats'`, `grep -c '#3f55b04'`, `grep -c 'chainRecordFix runs before the absorbRounds'`, `grep -c 'that note arm then skips'`, `grep -c 'both sit outside any local try'`, `grep -c 'routeToSweep, the round-1 approve arm'` over `skills/war/assets/workflow-template.js skills/war/assets/workflow-template.engine-1.test.mjs` prints `0`.
- WHEN Phase 2 lands THE corrected comments SHALL say the new thing · check: `grep -c 'zero sum' skills/war/assets/workflow-template.js` prints ≥ 2, `grep -c 'c0f88d0' skills/war/assets/workflow-template.js` prints ≥ 1, and `grep -c 'a new caller joins by' skills/war/assets/workflow-template.js` prints ≥ 3.
- WHEN Phase 2 lands THE engine diff SHALL be comment-only · check: `git diff <phase-base>..HEAD -U0 -- skills/war/assets/workflow-template.js | grep -E '^[+-][^+-]' | grep -vcE '^[+-]\s*//'` prints `0`.
- WHEN Phase 2 lands THE four rewrapped blocks SHALL hold no line past 110 columns · check: `awk 'length > 110 { n++ } END { print "over:" n+0 }'` run over the line range of each of the `routeGateAuditRows`, `carriedPhaseClose`, `carryPhaseClose` and demote-reason header blocks prints `over:0`.
- WHEN any phase lands THE repository gate SHALL pass · check: `node skills/war/assets/repo-gate.mjs` exits 0 and prints its pass summary with `fail 0`.
- WHEN Phase 3 lands THE four version slots SHALL agree · check: `node --test skills/war/assets/version-slots.test.mjs` prints `# fail 0`.
