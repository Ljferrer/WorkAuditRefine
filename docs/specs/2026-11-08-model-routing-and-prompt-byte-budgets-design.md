# Model routing and prompt byte budgets — per-dispatch model tiers, and one canonical copy per rule

dependsOn: docs/specs/2026-11-08-engine-findings-ace-and-late-fix-design.md (it edits the ace, late-fix and polish builds in `skills/war/assets/workflow-template.js` first; this spec is fifth in the engine chain, before engine-comment-and-duplication-tidy).

Issues addressed (all 9): #1735, #2083, #2119, #2273, #2534, #2549, #2550, #2633, #2634.

## 1. Context — the gap / problem

**Budget suite truth.** Preflight step 1 of `skills/war/references/budget-rebaseline.md` says to "read its logged measurement" of the `workflow-template.js` literal share. `checkBudget` in `skills/war/assets/prompt-surface-budgets.test.mjs` prints only when `size > advisory`, so a surface under advisory prints no number (verified: issue #1735 (2026-08-26); `checkBudget` at 35aa4144).

The derivation guard only matches a comment shape, so a wrong sha or wrong arithmetic passes (verified: issue #2083 (2026-09-06); per-row derivation guard at 35aa4144). Of the 18 `FILE_BUDGETS` rows, 16 cite a byte count equal to `git cat-file -s <sha>:<path>`. Two do not: the `CONTEXT.md` row cites 1,429 B @ 31c216b, where the blob is 129,722 B (a working copy was measured); the `GLOSSARY.md` row cites `c6a05fb`, where that path does not exist (the row moved from `CONTEXT.md`) (verified: `git cat-file --batch-check` per row at 35aa4144). The raised rows and the hand-pinned tiny-file advisories do not follow ×1.25/×1.10 ceil-KB (verified: same measurement at 35aa4144).

**Byte headroom.** `GLOSSARY.md` is 130,617 B of a 131,072 B hard line; `agents/war-refiner.md` 38,889 of 38,912 B; `agents/war-worker.md` 13,215 of 13,312 B; the literal share 161,877 of 172,032 B (verified: budget suite WARN lines at 35aa4144). #2273 named `CONTEXT.md`; #2636 moved the glossary to `GLOSSARY.md`, and the problem moved with it (verified: issue #2273 (2026-09-08); `wc -c` at 35aa4144). Thirteen test files read `GLOSSARY.md` (verified: `grep -rl` over test files at 35aa4144).

**Duplicate eviction block.** `skills/war/references/budget-raise-floor.md` § "Evicted: § Gate contract" holds the full paragraph and, under it, a blockquote of the card's condensed sentences (verified: issue #2119 (2026-09-07)). Every rule in the blockquote is in the paragraph; its one extra is a pointer phrase to the card's `## Never` (verified: both texts at 35aa4144). It is the fourth SHA-256-pinned row of `EVICTED_2115` in `skills/war/assets/reference-link-integrity.test.mjs` (verified: at 35aa4144).

**Rules paid for twice.** `FIX_GATE_RULE` is one const in `workflow-template.js` and also sits verbatim in `agents/war-worker.md` Do step 4; test `prompt truth (D6, #2617)` in `workflow-template.engine-1.test.mjs` pins the copies equal (verified: issue #2633 (2026-11-06); at 35aa4144). The card still needs a fix-dispatch trigger, because step 4 says "Run the gate command until green" (verified: at 35aa4144). `FIX_ROUND_RULES` mirrors `## The rules` of `skills/war/references/fix-round-doctrine.md` under an operator ruling (verified: that file's header at 35aa4144). `FIX_ROUND_DOCTRINE_CLAUSE` opens with a sentence that restates rules 9 and 10 of the same block, so each fix prompt carries them twice; two `engine-1` assertions pin that sentence (verified: `const FIX_ROUND_DOCTRINE_CLAUSE` and the `fix-round doctrine` fixture at 35aa4144).

**Clause stack.** The `FIX_NEEDED` build appends seven shared clauses, and no test records each fix-prompt class's size (verified: issue #2634 (2026-11-06)). Four of them (`provisionClause`, `reaClauseWith`, `MEMORY_QUERY_BASE_LINE`, `doneWhenClause`) already render `''` when their condition is off (verified: definitions at 35aa4144).

**Refiner tiers.** `provision-run`, `provision-barrier`, `polish-worktree` and `evidence` all spawn with `...spawn('refiner')`; only `spawnRefinerRecovery` exists as a second tier (verified: issues #2549, #2550 (2026-10-31); builds at 35aa4144). The evidence dispatch is fail-open, and on an `intraDep` phase it reruns the full gate as land-authoritative evidence (verified: evidence dispatch comment at 35aa4144). The `war-helper` card has `tools: Bash`, fenced to read-only git verbs (verified: `agents/war-helper.md` at 35aa4144; ADR 0057).

**Routing part 2.** #2534 asks for task-class routing, an ace edit class, sampled Opus review and per-model telemetry; items 23a and 23b shipped in PR #2585 and PR #2587 (verified: issue #2534 (2026-10-30)). None of the four exists (verified: `grep taskClass|sampledOpus|editClass` empty at 35aa4144). `/war-review` has no per-model rows (verified: `skills/war-review/SKILL.md` at 35aa4144). `boundaryWarnings` in `assert-args-complete.mjs` defines a task's boundary signal (verified: at 35aa4144).

## 2. Pivotal constraints

- Ruling 2026-11-03 (#2534): the Lead picks each seat's model like lens and depth; the boundary rule is the floor (never below opus); widened seats run on opus; the four items stay open (verified: issue #2534 (2026-10-30)).
- #2534: absent routing config keeps every dispatch byte-identical; one variable per trial; a clean Sonnet approval is never the sole reason to skip review (verified: issue #2534 (2026-10-30)).
- Absent `agents.refiner.provision` / `.evidence` keeps `spawn('refiner')` byte for byte; no preset value at first (verified: issues #2549, #2550 (2026-10-31)).
- Ruling 2026-09-07 (#2097): `fix-round-doctrine.md` is the canonical home, and the fix prompts carry `## The rules` byte-equal (verified: its header at 35aa4144).
- No prompt-surface budget may rise (verified: issues #2633, #2634 (2026-11-06)). ADR 0042: evict, never reword.
- Both-surfaces rule: a worker or refiner prompt change lands with its card in one commit. `workflow-template.js` has one owner per phase.

## 3. Resolved design tree

| id | decision | resolution |
|----|----------|------------|
| D1 | Measurement below advisory (#1735) | `checkBudget` prints `MEASURE prompt-surface-budgets: <label> <size> B (advisory <a>, hard <h>)` on stderr every run; step 1 names it. [assumed: stderr, the WARN channel — if wrong: `node --test` hides it] |
| D2 | Derivation truth (#2083) | Guard asserts `git cat-file -s <sha>:<path>` equals the cited count, and recomputes ×1.25 / ×1.10 ceil-KB. Fails open only when git itself errors. [assumed: version-slots precedent fits — if wrong: shallow CI clones red] |
| D3 | Rows the guard cannot check as written | Comment markers `measured as <path>` (moved row) and `working copy on <sha>` (no blob). Arithmetic skips rows marked `RAISED`, `placeholder retained` or `advisory pinned`. The literal-share sentinel keeps the shape check. [assumed: markers, not an allowlist — if wrong: a list drifts from the comments] |
| D4 | Duplicate blockquote (#2119) | Delete it and its lead-in; drop the fourth `EVICTED_2115` row with a dated note; fix the header sentence. [assumed: delete — if wrong: the condensed text was wanted as provenance] |
| D5 | GLOSSARY headroom (#2273) | Cut to at or under advisory 111,616 B. First swap bodies that restate a `references/` rule for a pointer, then move cold blocks byte-identical. Never move a test-pinned phrase. Leave the budget row. [assumed: advisory target — if wrong: doc-truth's new terms land near the hard line] |
| D6 | FIX_GATE_RULE home (#2633) | Prompt is canonical. Card step 4 keeps only: "On a fix-applying dispatch (a `BACKWARD-CHAIN FIX` block), skip the full gate and follow the gate rule your prompt states." The equality test becomes a pointer test. [assumed: prompt canonical — if wrong: a seat with no prompt copy loses the rule] |
| D7 | FIX_ROUND_RULES home (#2633) | Keep the mirror per #2097. Cut only the restating opener of `FIX_ROUND_DOCTRINE_CLAUSE`. [assumed: #2097 stands — if wrong: a re-ruling moves the block behind a pointer] |
| D8 | Clause classes (#2634) | A size test drives each fix-prompt class, records bytes and clause list, classifies each clause always / conditional / pointer, and pins each class at or below its measured size. [assumed: census plus D7 is enough — if wrong: prompts shrink less than hoped] |
| D9 | Evidence: tier or script (#2550) | Tier. A script needs the helper fence to admit a non-git command (widens ADR 0057). `intraDep` phases stay on `spawn('refiner')`. [assumed: tier — if wrong: the operator widens the fence instead] |
| D10 | Telemetry first (#2534 item 4) | Lands a phase before routing, as the trial baseline. `dispatchAgent` records `{ label, dispatchKind, agentType, model, effort, taskClass? }` into handoff `dispatchModels`; the Lead stamps it; `/war-review` renders per-model and per-class rows. [assumed: handoff carrier — if wrong: Lead-side counting needed] |
| D11 | Task class (#2534 item 1) | Lead stamps `class: routine \| boundary` at Decompose. `routing.classes.<class>.<role>` maps worker, fix, ace and auditor to a tier. A boundary task's seats never resolve below opus; a boundary-signal task stamped `routine` warns. [assumed: Lead-stamped — if wrong: the engine classifies silently] |
| D12 | Ace edit class (#2534 item 2) | An absorb row with `file`, `line` and `suggested_fix` is `exact` and runs on `routing.aceEdit.exact` when set; else `broad`, today's tier. Charges 5 and 6 stay on the fix tier (`aceSpawn`). [assumed: those fields define exact — if wrong: thin-context edits go to the weak tier] |
| D13 | Sampled review (#2534 item 3) | `routing.sampleOpusReview` share 0..1, absent = 0. A clean approval with every seat below opus is sampled by a stable hash of plan slug and task id, and gains one opus seat at the same `audit_sha`; its Critical/Major blocks. Sampling only adds. [assumed: stable hash — if wrong: trials cannot be replayed] |

## 4. Mechanics

**Phase 1 — budget-suite truth and doc headroom (no engine file).**
- T1.1 (#1735, #2083). Files: `skills/war/assets/prompt-surface-budgets.test.mjs`, `skills/war/references/budget-rebaseline.md`. D1; D2 and D3 as a pure function with an injected blob-size reader, so fixtures feed a wrong count, a wrong multiplier and each marker. Add the markers to the two outlier rows. requiresTest: true.
- T1.2 (#2119, #2273). Files: `skills/war/references/budget-raise-floor.md`, `skills/war/assets/reference-link-integrity.test.mjs`, `GLOSSARY.md`, receiving `references/` files. Never edits T1.1's files. For D5, grep each candidate block's phrases across `skills` and `hooks` tests before moving it. Manual same-scope survey required: after the grep, hand-scan the target file's same-scope tests and comments for same-meaning siblings worded differently, and list each straggler as a survey-derived correction. requiresTest: true.

**Phase 2 — fix-prompt bytes (#2633, #2634).** T2.1, sole engine owner. Files: `skills/war/assets/workflow-template.js`, `agents/war-worker.md`, `skills/war/references/fix-round-doctrine.md`, `skills/war/assets/workflow-template.engine-1.test.mjs`, new `skills/war/assets/workflow-template.prompt-size-1.test.mjs`.
- D6 card trim and test re-aim in one commit; record it as a single-layer choice (lesson `standing-instruction-vs-dispatched-prompt-coverage-split`).
- D7: grep `cause-then-class-then-fix rule` and `the note-absorb rule` across the repo and handle every match; re-aim the two assertions to rules 9 and 10. Manual same-scope survey required: after the grep, hand-scan the target file's same-scope tests and comments for same-meaning siblings worded differently, and list each straggler as a survey-derived correction.
- D8 classes: FIX_NEEDED, floor retries, ace subset, ace re-entry, advisory polish, phase-close sweep, terminal pass, late-fix. Read the `workflow-template.test-harness.mjs` header first and wrap each compile site in `runForm`.
- requiresTest: true.

**Phase 3 — refiner tiers and telemetry (#2549, #2550, #2534 item 4).**
- T3.1. Files: `skills/war/assets/workflow-template.js`, `skills/war/assets/war-config.mjs`, `skills/war/assets/war-config.test.mjs`, `skills/war/assets/workflow-template.recovery.test.mjs`, `skills/war/references/schemas.md`, `skills/war-room/SKILL.md`, `docs/adr/0050-preset-tiers-order-by-model-capability.md`, `README.md`, `skills/war/references/design.md`. Add `spawnRefinerTier(key)` beside `spawnRefinerRecovery` (absent ⇒ exactly `spawn('refiner')`); route the three provisioning kinds to `provision` and `evidence` to `evidence` unless `intraDep`. Validate both keys like `agents.refiner.recovery`; no DEFAULTS entry. Add D10 recording. No prompt text changes, so no card edit. Grep `agents.refiner.recovery` in docs and update every refiner-tier list. Manual same-scope survey required: after the grep, hand-scan the target file's same-scope tests and comments for same-meaning siblings worded differently, and list each straggler as a survey-derived correction. requiresTest: true.
- T3.2, deps T3.1. Files: `skills/war/references/run-manifest.md`, `skills/war-review/SKILL.md`. Stamp and render `dispatchModels`, `n/a` when absent. requiresTest: false [assumed: prose-only surfaces — if wrong: a doc-contract row is needed].

**Phase 4 — routing (#2534 items 1-3).**
- T4.1. Files: `skills/war/assets/workflow-template.js`, `skills/war/assets/war-config.mjs`, `skills/war/assets/war-config.test.mjs`, `skills/war/assets/assert-args-complete.mjs`, `skills/war/assets/assert-args-complete.test.mjs`, new `skills/war/assets/workflow-template.routing-1.test.mjs`. D11-D13; no prompt text change. requiresTest: true.
- T4.2, deps T4.1. Files: new `skills/war/references/model-routing.md`, `skills/war/SKILL.md` (one Decompose trigger pointer only; the file is over advisory), `skills/war-room/SKILL.md`, `skills/war/references/schemas.md`, new ADR 0059, ADR 0056 amendment, `GLOSSARY.md`. requiresTest: false.

**Phase 5 — release bump.** All four version slots.

## 5. Surface changes

Phases 1-4: the `Files:` lists in §4. Phase 5: `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, `README.md`.

| file | phase | sibling spec | lands first |
|------|-------|--------------|-------------|
| `skills/war/assets/workflow-template.js` | 2, 3, 4 | engine-findings-ace-and-late-fix; engine-comment-and-duplication-tidy | engine-findings, then this, then engine-comment-tidy |
| `agents/war-worker.md` | 2 | guard-habits; recovery-relaunch-and-land; engine-comment-tidy | guard and recovery, then this, then engine-comment-tidy |
| `GLOSSARY.md` | 1, 4 | doc-truth-drift-and-adr-hygiene | this |
| `skills/war/references/schemas.md` | 3, 4 (tier and routing rows) | doc-truth-drift-and-adr-hygiene | this |
| `skills/war/assets/reference-link-integrity.test.mjs` | 1 | shell-floors-tests-and-lint | this |
| `workflow-template.engine-1.test.mjs` | 2 | engine-findings; engine-comment-tidy | engine-findings, then this |
| `workflow-template.recovery.test.mjs` | 3 | recovery-relaunch-and-land | recovery |
| `assert-args-complete.mjs`, `skills/war/SKILL.md` | 4 | args-floor-and-launch-preflight | args-floor |
| `skills/war-review/SKILL.md` | 3 | pipeline-skills-and-memory-tooling | this [assumed: pipeline-skills waits on doc-truth, which follows this — if wrong: T3.2 rebases onto it] |
| `run-manifest.md`, `skills/war-room/SKILL.md` | 3, 4 | doc-truth-drift-and-adr-hygiene | this |

## 6. New domain terms (GLOSSARY.md)

- **Task class** — `routine` or `boundary`, Lead-stamped per task; picks the routing tier per role.
- **Ace edit class** — `exact` or `broad`, engine-derived from an absorb row; picks the ace tier.
- **Sampled Opus review** — one extra opus seat on a stably sampled share of clean below-opus approvals.
- **Provision tier / evidence tier** — the optional `agents.refiner.provision` / `.evidence` spawn tiers.

They land in T4.2 and must fit the headroom Phase 1 makes.

## 7. Recommended ADRs

- New ADR 0059: task-class routing, ace edit class, sampled review (D11-D13), with the #2534 constraints binding. [assumed: 0059 is free at land time — if wrong: renumber from `ls docs/adr/`]
- Amend ADR 0056: the boundary floor binds a `boundary` class. Amend ADR 0050's tier list.

## 8. Open risks / implementation notes

- No task may add bytes to `agents/war-refiner.md` (23 B left); D9 needs no card edit. Phase 2's cut runs before Phases 3 and 4 add engine literals.
- D5 moves only unpinned blocks. If that cannot reach advisory, T1.2 reports the shortfall instead of re-aiming tests that later specs own.
- A weak evidence tier makes verification quieter. T3.1 must prove a wrong or empty evidence result lands on SOFT cannot-confirm, never HARD (verified: issue #2550 (2026-10-31)).

## 9. Non-goals / deferred

- No preset sets the new keys; values wait for D10 field data.
- The #2550 script alternative is not built (D9).
- `FIX_ROUND_RULES` stays mirrored (D7) until a re-ruling over #2097.
- Lowering the `GLOSSARY.md` row is a later ratchet-down. #2534 items 23a and 23b shipped; not redone.

## 10. Validation criteria

| # | criterion |
|---|-----------|
| 1 | WHEN the budget suite runs THE suite SHALL print one `MEASURE` line per budgeted surface · check: `node --test skills/war/assets/prompt-surface-budgets.test.mjs 2>&1 \| grep -c '^MEASURE prompt-surface-budgets:'` prints `19` |
| 2 | WHEN preflight step 1 is read THE step SHALL name the line · check: `grep -c 'MEASURE prompt-surface-budgets' skills/war/references/budget-rebaseline.md` prints `1` or more |
| 3 | WHEN a cited byte count differs from its blob THE derivation guard SHALL fail · check: the budget suite prints `# fail 0` and lists `derivation guard — wrong cited bytes reds` as `ok` |
| 4 | WHEN an unmarked row's hard is not ×1.25 ceil-KB THE guard SHALL fail · check: same run lists `derivation guard — wrong multiplier reds` as `ok` |
| 5 | WHEN `budget-raise-floor.md` is read THE Gate-contract section SHALL hold no blockquote · check: `grep -c '^> Run it \*\*verbatim\*\*' skills/war/references/budget-raise-floor.md` prints `0` |
| 6 | WHEN the eviction lands THE glossary SHALL be at or under advisory · check: `wc -c < GLOSSARY.md` prints a number `<= 111616` |
| 7 | WHEN the worker card is read THE card SHALL carry the trigger, not the rule body · check: `grep -c 'The engine runs the full gate at your new tip' agents/war-worker.md` prints `0`; `grep -c 'follow the gate rule your prompt states' agents/war-worker.md` prints `1` |
| 8 | WHEN a fix prompt renders THE doctrine clause SHALL state rules 9 and 10 once · check: `grep -c 'the cause-then-class-then-fix rule' skills/war/assets/workflow-template.js` prints `0` |
| 9 | WHEN the size test runs THE suite SHALL hold each fix-prompt class at or below its pin · check: `node --test skills/war/assets/workflow-template.prompt-size-1.test.mjs` prints `# fail 0` |
| 10 | WHEN `agents.refiner.provision` is absent THE three provisioning dispatches SHALL spawn as `spawn('refiner')` · check: `grep -c "spawnRefinerTier('provision')" skills/war/assets/workflow-template.js` prints `3`; the recovery suite prints `# fail 0` |
| 11 | WHEN the phase is `intraDep` THE evidence dispatch SHALL stay on the refiner tier · check: recovery suite lists `evidence tier — intraDep keeps refiner` as `ok` |
| 12 | WHEN `agents.refiner.evidence` has an unknown sub-key THE validator SHALL reject it · check: `node --test skills/war/assets/war-config.test.mjs` prints `# fail 0` with a row naming `agents.refiner.evidence` |
| 13 | WHEN a phase returns THE handoff SHALL carry one `dispatchModels` row per dispatch · check: `grep -c 'dispatchModels' skills/war/references/schemas.md` prints `1` or more; recovery suite prints `# fail 0` |
| 14 | WHEN no `routing` key is set THE engine SHALL keep prompts and spawn opts byte-identical · check: `node --test skills/war/assets/workflow-template.routing-1.test.mjs` prints `# fail 0` and lists `routing absent — byte-identical` as `ok` |
| 15 | WHEN a boundary-signal task is stamped `routine` THE launch check SHALL warn · check: `node --test skills/war/assets/assert-args-complete.test.mjs` prints `# fail 0` |
| 16 | WHEN a sampled clean approval runs THE engine SHALL add one opus seat and remove none · check: routing suite lists `sampled review — adds one opus seat` as `ok` |
| 17 | WHEN any phase lands THE range SHALL raise no budget ceiling · check: `bash skills/war/assets/assert-budget-raise-cited.sh <integrationBranch> <workingBranch>` exits 0, and `git log --format=%B <integrationBranch>..<workingBranch> \| grep -c '^Budget-Raise:'` prints `0` |
| 18 | WHEN the repository gate runs THE gate SHALL pass · check: `node skills/war/assets/repo-gate.mjs` exits 0 with `# fail 0` in each Node suite log |
