# Done-when floor wiring — group-kill the watchdog, back the evidence-capture claim, restore the residue guards, enumerate the floor in the gospel doc

Issues: #1365, #1338, #1370, #1340, #1360, #1339

## 1. Context — the gap / problem

The done-unmet route shipped in 0.17.0 (`assert-done-when.sh` + its wiring through
`skills/war/assets/workflow-template.js` and `agents/war-refiner.md`) landed with a cluster of
residuals, all on one floor family. Every claim below was re-verified against the live tree on
2026-08-06 (snapshot base `6fff2ee`, the master tip).

1. **Watchdog kills the direct PID only — a backgrounded grandchild survives TERM and KILL**
   (verified: issue #1365 (2026-08-06); verified: issue #1338 (2026-08-06), finding 1). Live:
   in `skills/war/assets/assert-done-when.sh` the watchdog subshell signals exactly one PID —
   `kill -TERM "$cmd_pid"` then `kill -KILL "$cmd_pid"` — with no `set -m`, no negative-PID group
   form, and no `setsid` (verified: live tree 2026-08-06, the watchdog subshell after the
   `( cd -- "$worktree" && exec bash "$cmd_file_abs" ) &` launch). A command that backgrounds or
   daemonizes a grandchild (`node --test` children, `sleep 60 & wait`) is never signaled: it can
   keep writing into the worktree, hold a port or lock, and stall a pipe-capturing caller via the
   inherited stdout/stderr fds. The exit code stays correct (marker precedence), so this is a
   resource-leak/stdout-capture residual — but the header's TIMEOUT residual note still understates
   it as "may briefly outlive the kill" (verified: live tree 2026-08-06, the TIMEOUT paragraph of
   the `assert-done-when.sh` header).
2. **Issue #1338's second finding is already fixed** (verified: issue #1338 (2026-08-06); verified:
   live tree 2026-08-06): `unset CDPATH` sits directly under `PROG=` with an explanatory comment,
   and the suite's case 20 pins it. Only finding 1 remains open in that issue.
3. **The floor's header claims a refiner stdout capture no consumer implements** (verified: issue
   #1370 (2026-08-06); verified: issue #1340 (2026-08-06), findings 1/2/5/7/9). Live: the header
   states "STDOUT belongs to the executed command — the refiner captures it as the done-when
   evidence artifact", yet `doneWhenFloorClause` in `workflow-template.js` and step 7 of
   `agents/war-refiner.md` both branch on the floor's exit code only, and the `MERGE_RESULT`
   contract (mirrored in `skills/war/references/schemas.md` and the refiner card's `## Return`
   line) enumerates no done-when evidence field — in contrast to the sibling `gate_log_path` and
   `mappedTests` channels the same wiring did implement (verified: live tree 2026-08-06,
   `doneWhenFloorClause`, war-refiner step 7, the `MERGE_RESULT` schema block). Concrete
   consequences at the tip: the `MAKE_DONE_PASS` fix prompt carries zero output from the red run
   (the no-test sibling threads `floor_diagnostic` verbatim for exactly this reason), and the
   exhaustion escalation's `exhaustedDiag = floorDiagOf(floorMr)` always resolves absent on the
   done-unmet route, so the Lead sees a hard hold with no recorded cause (verified: issue #1340
   (2026-08-06), finding 7; verified: live tree 2026-08-06, the floor-retry sub-loop's exhaustion
   tail).
4. **The legacy-residue guard was weakened under a false "strictly stronger" comment** (verified:
   issue #1340 (2026-08-06), findings 6/8/11/12). Live: the "Done when threading — absent ⇒ ''
   (set-minus)" test in `skills/war/assets/workflow-template.test.mjs` asserts occurrence-count
   parity (`count(wo) === count(wp) - 1`) under a comment claiming it is "strictly stronger than
   the retired line-anchored !includes" (verified: live tree 2026-08-06, the residue-guard block of
   that test). The parity form is entailed by the `replace(...) === wo` byte-identity assert
   directly above it, and it misses the one case the retired form caught: a line-anchored
   `Done when:` token hardcoded into fixed prose present in both arms (parity cancels). The
   restored line-anchored form is green at today's tip: the only fixed-prose `Done when:` mentions
   in a doneWhen-less arm are `MAKE_DONE_PASS`'s two mid-sentence ones (verified: live tree
   2026-08-06, census of `Done when:` literals in `workflow-template.js`).
5. **The done-when floor rides the baseline-proceed dispatch with no documented precedence**
   (verified: issue #1340 (2026-08-06), finding 10). Live: `doneWhenFloorClause` is appended to
   all 4 merge-task dispatch sites — initial, floor-retry, environment-proceed, baseline-proceed
   (count source-pinned by the 'done-when floor coverage (Task 2.3)' test; snapshot 2026-08-06 at
   `6fff2ee`) — while the `FLOOR_STATUSES` fix sub-loop is entered only from the initial merge
   result, so a baseline-proceed returning `done-unmet` falls to the terminal else and escalates a
   `HARD_ESCALATION_REASONS` member with zero fix rounds. Neither surface states which instruction
   wins between "if the ONLY failures are the pre-existing baseline set, MERGE" and "exit 1 → do
   NOT merge".
6. **A vacuously-passable gate-ordering assert** (verified: issue #1340 (2026-08-06), finding 13).
   Live: the 'done-when floor threading (Task 2.3)' test asserts
   `indexOf('After the gate') > indexOf('Run the gate')` with no presence assert for the
   `Run the gate` anchor — a reword makes the right side `-1` and the comparison passes for the
   wrong reason (verified: live tree 2026-08-06, that test's per-site loop).
7. **Two findings of issue #1340 are already fixed at the tip** (verified: live tree 2026-08-06):
   `CONTEXT.md` carries the **done-unmet route** glossary entry (finding 3), and the D3
   both-surfaces registry in `workflow-template.test.mjs` carries the done-when floor row
   (finding 4). The remaining eleven findings stand.
8. **CLAUDE.md's floor enumerations omit the shipped floor** (verified: issue #1360 (2026-08-06);
   verified: live tree 2026-08-06): `done-unmet` has zero hits in `CLAUDE.md`; the Enum-discipline
   named-route parenthetical still reads the two-member list (`no-test`, `unpackaged`); the
   Guard-architecture merge-path floor list still names only `assert-test-in-diff.sh`,
   `assert-packaging-in-diff.sh`, `assert-no-submodule-mutation.sh`. The third surface named by the
   issue — the per-phase pipeline sentence — says "floors, gate, merge" without enumerating
   individual floors, so it is conditionally out of scope by the issue's own "if it enumerates
   floors" qualifier (verified: live tree 2026-08-06, the Execution-architecture per-phase
   sentence).
9. **Two Nit-grade header-prose asymmetries in the test floor's suite** (verified: issue #1339
   (2026-08-06)). Live: in `skills/war/assets/assert-test-in-diff.test.sh` the case-12 header entry
   still reads the unscoped "Exit codes and stdout are untouched" although its body twin was scoped
   to the exit-1/2 contracts, and the case-13 banner claims "12d the die path" for the stdout
   contract although case 12d captures only stderr — no case asserts the exit-2 stdout channel
   (verified: live tree 2026-08-06, the file-header Cases list, entries 12 and 13).

## 2. Pivotal constraints

- **bash 3.2.57 / macOS**: no coreutils `timeout`, no `setsid`. `set -m` is the available
  process-group-containment primitive; a true new-session daemon remains unreachable and must be
  named as the residual, not papered over.
- **Frozen exit-code contract**: 0/1/2 with marker precedence; exit 2 never collapses into the
  floor status. No change to any exit path (verified: live tree 2026-08-06, the
  `assert-done-when.sh` header contract + `die` default).
- **Stdout purity**: suite case 13 asserts the floor's stdout equals the executed command's bytes
  exactly, green and red path. The group-kill change and the capture wiring must add nothing to the
  floor's stdout (job-control notices are a named risk, §8).
- **Both-surfaces law**: standing instructions in `agents/war-refiner.md` and the string-built
  dispatched prompts in `workflow-template.js` must change in the same commit; the D3 registry's
  done-when floor row anchors (`assert-done-when.sh`, `--cmd-file`, `done-unmet`,
  never-'done-unmet') must stay green on both surfaces.
- **Clause-delimiter coupling**: two tests own the extraction regex
  `After the gate, run the done-when floor:` … `make-this-command-pass loop.` — the threading test
  and the merge-prompt legacy byte-identity test. New clause prose must land **inside** the
  delimited span, or both delimiters update in the same commit.
- **Return-contract enumeration duty**: a new optional `MergeResult` field must land in the
  refiner card's `## Return` enumeration, the `MERGE_RESULT` schema comment block, and
  `skills/war/references/schemas.md` in the same commit (the recorded
  doc-return-contract-enumeration failure shape).
- **`floor_diagnostic` stays test-floor-scoped**: its contract prose on all three doc surfaces
  names the exit-1 `assert-test-in-diff.sh` stderr specifically; the done-when evidence gets its
  own field rather than silently widening that contract.
- **CLAUDE.md coupling**: the merge-path floor sentence binds the listed floors' discovery patterns
  to `resolveGate` (referenced by name, never by suite enumeration). `assert-done-when.sh` performs
  no diff discovery — the fail-closed floor-classification case in the test floor's suite already
  records it as exempt ("executes the file-threaded done-when command, no file discovery") — so its
  addition must scope that mirror clause to the discovery floors, not extend a false claim.
- **The ratified pointer line at the top of `CLAUDE.md` is byte-identical across surfaces** — the
  edits touch only the two enumeration sentences.
- **Release discipline**: any version bump is its own trailing phase at conversion time; version
  literals in this spec are non-authoritative.

## 3. Resolved design tree

| Decision | Resolution |
|---|---|
| Grandchild containment mechanism | `set -m` immediately before the background launch, `set +m` immediately after `cmd_pid=$!`; watchdog signals the group: `kill -TERM -"$cmd_pid"` with the existing single-PID form retained as a `\|\|` fallback, same for KILL. [assumed: the lesson-recommended remedy from issues #1365/#1338 — if wrong (e.g. `set -m` proves noisy or unreliable on bash 3.2): fall back to a `ps`-walk descendant kill, at the cost of a race window] |
| Residual-note wording | Rewrite the TIMEOUT paragraph's residual sentence to state what actually survives after the group kill: a grandchild that escaped into a **new session/process group** (true daemonization); drop "may briefly outlive". |
| Evidence capture: wire it or retract the header claim | **Wire it.** The refiner tees the floor run's full stdout+stderr to a run-scoped artifact `_refinery/.war/done-when-<taskId>.log` (the `gate_log_path` precedent, same one-time `.war/` git-exclude step) and, on exit 1, returns its absolute path in a new optional merge-task field `done_when_log_path`. The header is then reworded to describe the **built** contract (stdout belongs to the executed command; the refiner tees the run to the done-when evidence artifact and returns its path on exit 1). [assumed: wiring over retraction, because retraction alone leaves finding 7's Lead-facing blind hard hold and the MAKE_DONE_PASS worker without a diagnostic — if wrong: the retract-only alternative is a two-line header edit plus no workflow change, and the drafter should downshift to it on operator veto] |
| Channel shape | New optional field `done_when_log_path` (merge-task only), **not** a widening of `floor_diagnostic` — mirrors `gate_log_path`'s artifact-first shape and leaves the test floor's documented contract untouched. |
| MAKE_DONE_PASS diagnostic | Thread the artifact **path** (not the content) into the `MAKE_DONE_PASS` fix prompt — "the red run's full output is captured at `<path>`; read it before re-running" — bounded prompt size; the fix-worker reads the file. |
| Exhaustion escalation detail | On done-unmet exhaustion, the escalation entry and `auditLog` entry carry `done_when_log_path` when present (the `floorDiagOf` pattern's sibling; `floorDiagOf` itself stays test-floor-only). |
| Baseline-proceed precedence | **The floor overrides the carve-out**: the done-when floor runs on every merge-task dispatch including baseline-proceed, and its exit 1 blocks — the carve-out proceeds only over the gate's pre-existing failures, never over the task's own acceptance command. Documented on both surfaces (one sentence inside `doneWhenFloorClause`'s delimited span + one sentence in war-refiner step 7) and pinned by a fixture driving a baseline-classified first result whose baseline-proceed returns `done-unmet` → HARD escalation, zero fix rounds. [assumed: fail-closed documented override, matching the route's purpose ("a task merges only when its own acceptance command passes") and requiring no routing change — if wrong: the alternative (routing baseline-proceed floor statuses into the bounded fix sub-loop) is a behavioral change needing its own plan decision] |
| Residue guard | Restore the line-anchored absolute-absence assert (`no '\nDone when:' in the doneWhen-less arm`) **beside** the occurrence-parity assert; reword the comment to "complementary" (parity catches an asymmetric/vanished clause; line-anchoring catches a hardcoded line-form token present in both arms), deleting the "strictly stronger" claim. |
| Gate-ordering assert | Add an anchor-presence assert for `Run the gate` immediately before the ordering comparison. |
| CLAUDE.md surfaces | Add `done-unmet` to the Enum-discipline named-route parenthetical; add `assert-done-when.sh` to the Guard-architecture merge-path floor list with a discovery-exempt parenthetical scoping the `resolveGate` mirror clause to the diff-discovery floors. The per-phase pipeline sentence does not enumerate floors and stays untouched. |
| Test-floor header prose (#1339) | Apply the two auditor-suggested rewordings: scope the case-12 sentence to the exit-1/2 stdout contracts; reword the case-13 banner to "12d pins the die path's exit code and stderr (the exit-2 stdout channel carries no printf and is not separately asserted)". |

## 4. Mechanics

### 4.1 `skills/war/assets/assert-done-when.sh` (the floor)

- Wrap the background launch in job control: `set -m` on the line before
  `( cd -- "$worktree" && exec bash "$cmd_file_abs" ) &`, `set +m` right after `cmd_pid=$!` — the
  command tree gets its own process group with pgid `$cmd_pid`; the watchdog subshell launches
  after `set +m` and stays in the script's own group.
- Watchdog kill lines become group-first with single-PID fallback:
  `kill -TERM -"$cmd_pid" 2>/dev/null || kill -TERM "$cmd_pid" 2>/dev/null || true`, and the same
  for `-KILL`. The 1s liveness poll (`kill -0 "$cmd_pid"`) is unchanged.
- Header edits: (a) the TIMEOUT residual note names the true survivor class (a new-session
  daemon), (b) the STDOUT paragraph is reworded to the built capture contract (tee to the
  done-when evidence artifact, path returned on exit 1 in `done_when_log_path`). Sweep step:
  grep `briefly outlive` and `evidence artifact` across `skills/war/assets/assert-done-when.sh`,
  `skills/war/assets/assert-done-when.test.sh` and update every hit — **grep is a floor, not a
  ceiling: after the grep, hand-scan both files' same-scope headers, case-list titles, and
  comments for stragglers restating the old residual/capture claims, and list each straggler as a
  survey-derived correction** (the suite's case-13 comment "would pollute the refiner's evidence
  artifact" is one known candidate).

### 4.2 `skills/war/assets/assert-done-when.test.sh` (the floor's suite)

- New case 21 (grandchild survival, delete-the-feature shape): a command file that runs
  `sleep 60 & wait` under `--timeout 1`; assert (a) floor exit 1 with the timed-out stderr
  diagnostic, and (b) the invocation — with stdout captured through a command substitution — 
  returns within a wall-clock bound (the suite's existing 15s idiom). Without the group kill the
  orphaned `sleep 60` holds the inherited stdout fd and the capture blocks: assert (b) goes red,
  proving the fixture is load-bearing.
- Update the header case list (add case 21; correct any case-13 comment prose per the §4.1 sweep).

### 4.3 `skills/war/assets/workflow-template.js` (the wiring)

- `doneWhenFloorClause` grows, **inside** the existing delimited span: (a) a tee instruction —
  run the floor with its combined stdout+stderr teed to `<refinery>/.war/done-when-<taskId>.log`
  (the `.war/` git-exclude step is already instructed for the cmd file); (b) on the exit-1 branch,
  return the artifact's absolute path in `done_when_log_path` alongside `status: 'done-unmet'`;
  (c) one precedence sentence: the floor is fail-closed on **every** merge-task dispatch,
  including a baseline-proceed — a red done-when is never proceeded over as baseline debt.
- `MERGE_RESULT` schema: add optional `done_when_log_path` (string) with a comment block mirroring
  `gate_log_path`'s shape (merge-task only; fail-open advisory, never routed on).
- `MAKE_DONE_PASS` fix prompt: append a conditional evidence clause naming the captured artifact
  path (set-minus-clean: absent field ⇒ '' ⇒ byte-identical prompt).
- Done-unmet exhaustion tail: the escalation entry and `auditLog` entry carry the last floor
  result's `done_when_log_path` when present (shape-identical when absent, the `exhaustedDiag`
  pattern).

### 4.4 `agents/war-refiner.md` (the standing card)

- Step 7: add the tee + `done_when_log_path` return duty to the exit-1 bullet, and the
  baseline-proceed precedence sentence (both mirroring §4.3's dispatched prose — same commit).
- `## Return`: add `done_when_log_path?` to the `MergeResult` field enumeration with its
  merge-task-only parenthetical.

### 4.5 `skills/war/references/schemas.md` (contract mirror — a footprint addition)

- Add `done_when_log_path?` to the `MergeResult` field list and a short field entry mirroring the
  `floor_diagnostic` entry's advisory framing. This file is **not** in the survey manifest's
  footprint hint for this group — flag it at plan conversion for cross-plan contention (§8).

### 4.6 `skills/war/assets/workflow-template.test.mjs` (the engine suite)

- Residue guard ("Done when threading — absent ⇒ '' (set-minus)"): restore
  `assert.ok(!wo.prompt.includes('\nDone when:'), …)` beside the parity assert; reword the block
  comment to the complementary framing, deleting "strictly stronger".
- 'done-when floor threading (Task 2.3)': add
  `assert.ok(c.prompt.includes('Run the gate'), …)` immediately before the ordering comparison;
  extend the clause asserts to pin the tee target (`.war/done-when-t1.log`) and the exit-1
  `done_when_log_path` instruction (clause-scoped, the existing idiom).
- Legacy byte-identity tests: re-verify green (clause growth stays inside the delimiter regex; if
  the terminal sentence moves, update the regex in both owning tests in the same commit).
- New fixture (finding 10 pin): baseline-classified first merge result → baseline-proceed returns
  `status: 'done-unmet'` → assert the escalation carries `reason: 'done-unmet'` with zero fix
  rounds and the run holds (`held:escalation`), pinning the documented precedence.
- New/extended assert: MAKE_DONE_PASS prompt names the evidence artifact path when the floor
  result carries `done_when_log_path`, and is byte-identical to today's prompt when absent.

### 4.7 `CLAUDE.md` (the gospel doc — issue #1360)

- Enum-discipline sentence: the named-route parenthetical becomes the three-member list
  (`no-test`, `unpackaged`, `done-unmet`).
- Guard-architecture sentence: add `assert-done-when.sh` to the merge-path floor list and scope
  the trailing clause so the `resolveGate` discovery-pattern mirror binds the diff-discovery
  floors only (`assert-done-when.sh` executes the task's acceptance command — no diff discovery).
- Sweep step: grep `no-test`, `unpackaged`, and `floor` across `CLAUDE.md` and confirm no other
  sentence enumerates the floor family — **grep is a floor, not a ceiling: after the grep,
  hand-scan the Execution-architecture and Guard-architecture sections' full prose for any
  unenumerated floor-family restatement, and list each straggler as a survey-derived correction**
  (the per-phase pipeline sentence was hand-checked 2026-08-06 and does not enumerate).
- The correcting change cites issue #1360 (its stated close condition).

### 4.8 `skills/war/assets/assert-test-in-diff.test.sh` (issue #1339, prose only)

- Case-12 header entry: replace "Exit codes and stdout are untouched." with the scoped form
  ("Exit codes are untouched and the exit-1/2 stdout contracts are byte-preserved (12b's exit-0
  stdout is the Case 13 matched-path listing).").
- Case-13 banner: reword "12d the die path" to "12d pins the die path's exit code and stderr (the
  exit-2 stdout channel carries no printf and is not separately asserted)".
- No behavioral change; both edits cite issue #1339.

## 5. Surface changes

| File | Change |
|---|---|
| `skills/war/assets/assert-done-when.sh` | `set -m` gate + group kill with fallback; header residual-note + capture-contract rewording |
| `skills/war/assets/assert-done-when.test.sh` | case 21 grandchild fixture; header case-list update; comment sweep |
| `skills/war/assets/workflow-template.js` | `doneWhenFloorClause` tee/capture/precedence prose; `MERGE_RESULT.done_when_log_path`; `MAKE_DONE_PASS` evidence clause; exhaustion detail |
| `skills/war/assets/workflow-template.test.mjs` | residue-guard restore + comment fix; `Run the gate` anchor assert; capture-threading asserts; baseline-proceed done-unmet fixture |
| `agents/war-refiner.md` | step 7 capture + precedence; `## Return` enumeration |
| `skills/war/references/schemas.md` | `done_when_log_path` field entry (**footprint addition** beyond the manifest hint) |
| `CLAUDE.md` | two floor-family enumeration sentences |
| `skills/war/assets/assert-test-in-diff.test.sh` | two header prose fixes (#1339) |

## 6. New domain terms (CONTEXT.md)

None. The **done-unmet route** glossary entry already exists at the tip (verified: live tree
2026-08-06), and `done_when_log_path` is a schema field documented in
`skills/war/references/schemas.md`, not a glossary-grade term. [assumed: no term needed — if
wrong: a one-line "done-when evidence artifact" entry under the done-unmet route heading is the
fallback, and it would add `CONTEXT.md` to the footprint]

## 7. Recommended ADRs

None required — every decision here is either a defect fix or prose truth-restoration. The one
ratifiable judgment call (the done-when floor overrides the baseline-proceed carve-out) is
documented on both prompt surfaces and pinned by a fixture; if the conversion grill wants durable
doctrine, a short amendment to the baseline-proceed sibling-discipline record
(`docs/adr/0040-environment-class-gate-failures-earn-one-retry.md` is the nearest live home —
verify at drafting; the merge-queue comments also cite ADR 0019) is the vehicle, observing the
amendment rule that pre-existing body text stays byte-unchanged apart from the Status currency
line. [assumed: no ADR by default — if wrong: the amendment is one paragraph, no new number]

## 8. Open risks / implementation notes

- **Ordering**: this group depends on no sibling group landing first (the survey manifest's
  machine hint carries the empty dependency list). The one contention watch-item is the
  `skills/war/references/schemas.md` footprint addition (§4.5) — at `/war-machine` conversion,
  check the roadmap's shared-file-contention table before waving.
- **`set -m` noise**: under job control, bash may emit job-status lines on stderr when the
  background command is killed. The suite's stderr asserts are substring greps (tolerant), and
  case 13's byte-equality is stdout-only — but the implementer must run the full floor suite and,
  if a notice leaks somewhere byte-asserted, suppress at the kill site rather than loosening a
  test.
- **Clause-delimiter regex**: two tests own the `doneWhenFloorClause` extraction regex; growth
  outside the `make-this-command-pass loop.` terminal breaks the merge-prompt set-minus test.
  Keep new prose inside the span or update both regexes in the same commit.
- **Set-minus purity of the MAKE_DONE_PASS evidence clause**: the DONE_WHEN_SITES set-minus test
  drives both arms through the same loop — the evidence clause must condition only on the floor
  result's field (absent ⇒ '' ⇒ byte-identical), and the mock harness must exercise both arms.
- **Restored residue assert is green today, prove it stays green**: the line-anchored
  `!includes('\nDone when:')` form was re-verified green against the 2026-08-06 tip's fixed prose
  (both `MAKE_DONE_PASS` mentions are mid-sentence); the restoring commit must run the suite
  before and after, not assume.
- **D3 registry row**: the done-when floor row's anchors must stay satisfied on both surfaces
  after the prose edits — re-run the engine suite; do not touch the row's `>= 20` floor unless a
  row is actually added.
- **Issue closure discipline**: each correcting change cites the issue(s) it closes (#1365 and
  #1338 close together on the watchdog fix; #1370 and #1340 close on the capture + residuals
  set; #1360 and #1339 close on their single-file edits).

## 9. Non-goals / deferred

- **No fix-sub-loop entry from proceed-dispatch results**: a baseline-/environment-proceed
  returning a floor status keeps today's zero-round hard escalation; this spec documents and pins
  that precedence, it does not re-route it.
- **No `setsid`/double-fork containment**: a grandchild that escapes into a new session survives
  the group kill; that is the rewritten residual note's content, accepted on bash 3.2.
- **No exit-2 stdout assertion for case 12d** (#1339's optional stronger fix): reword only; the
  die path is structurally silent on stdout.
- **`skills/war/references/schemas.md` "defined-but-not-yet-emitted" staleness** on the
  `done-unmet`/`mappedTests`/`doneWhen` entries predates this group and was ruled out of scope by
  the originating run's adjudication — this spec touches that file only to add the new field;
  the staleness sweep is separate follow-up work.
- **No `floor_diagnostic` widening**: the test floor's channel keeps its documented scope.
- **Lesson stamps**: prefixing the two memory-mined lessons
  (`bash-watchdog-kills-direct-pid-only-grandchild-survives`,
  `floor-script-header-can-claim-unbacked-downstream-capture`) with the RESOLVED convention is
  post-land housekeeping for the servitor / `/lessons-learned`, not plan scope.

## 10. Validation criteria

1. WHEN the watchdog fires at the budget THE floor SHALL signal the command's process group with a
   single-PID fallback · check: `grep -c -- '-TERM -"$cmd_pid"' skills/war/assets/assert-done-when.sh`
   and `grep -c -- '-KILL -"$cmd_pid"' skills/war/assets/assert-done-when.sh` each return 1.
2. WHEN a done-when command backgrounds a long-lived grandchild and times out THE floor SHALL exit
   1 within the suite's wall-clock bound with its stdout capture unblocked · check:
   `bash skills/war/assets/assert-done-when.test.sh` (all cases green, the new grandchild case
   included).
3. WHEN the header residual note is read THE note SHALL no longer claim the survivor is brief ·
   check: `grep -c 'briefly outlive' skills/war/assets/assert-done-when.sh` returns 0 · manual
   same-scope survey: hand-scan `skills/war/assets/assert-done-when.sh`'s same-scope
   tests/comments for same-meaning reworded siblings the grep misses; list each straggler as a
   survey-derived correction.
4. WHEN the done-when floor run exits 1 THE wiring SHALL carry the evidence contract on all three
   doc surfaces and the dispatched clause · check:
   `grep -l 'done_when_log_path' skills/war/assets/workflow-template.js agents/war-refiner.md skills/war/references/schemas.md`
   lists all three files.
5. WHEN the engine suite runs THE done-when threading, byte-identity, capture, and
   baseline-proceed-precedence pins SHALL be green · check:
   `node --test skills/war/assets/workflow-template.test.mjs`.
6. WHEN a baseline-proceed re-merge returns done-unmet THE documented precedence SHALL appear on
   the standing card · check: `grep -c 'baseline-proceed' agents/war-refiner.md` ≥ 1 within step
   7's done-when bullet (manual read of the step confirms placement).
7. WHEN the set-minus residue guard runs THE suite SHALL assert line-anchored absence and no
   longer claim strict strength · check:
   `grep -c 'strictly stronger' skills/war/assets/workflow-template.test.mjs` returns 0 · manual
   same-scope survey: hand-scan `skills/war/assets/workflow-template.test.mjs`'s same-scope
   tests/comments for same-meaning reworded siblings the grep misses; list each straggler as a
   survey-derived correction.
8. WHEN the gate-ordering assert runs THE `Run the gate` anchor SHALL be presence-asserted before
   the comparison · check:
   `grep -n "the gate instruction anchor is present" skills/war/assets/workflow-template.test.mjs`
   returns a hit (or the equivalent presence assert by construct).
9. WHEN CLAUDE.md's floor surfaces are read THE done-unmet route and its floor SHALL be enumerated
   · check: `grep -c 'done-unmet' CLAUDE.md` ≥ 1 and `grep -c 'assert-done-when.sh' CLAUDE.md` ≥ 1.
10. WHEN the test floor suite's header is read THE case-12 line SHALL be scoped and the case-13
    banner SHALL match 12d's real capture · check:
    `grep -c 'Exit codes and stdout are untouched' skills/war/assets/assert-test-in-diff.test.sh`
    returns 0 · manual same-scope survey: hand-scan
    `skills/war/assets/assert-test-in-diff.test.sh`'s same-scope tests/comments for same-meaning
    reworded siblings the grep misses; list each straggler as a survey-derived correction.
11. WHEN the full gate runs at the integrated tip THE JS and shell suites SHALL be green · check:
    `node --test 'skills/**/*.test.mjs'` and the documented hooks/skills shell-test loop both exit 0.
