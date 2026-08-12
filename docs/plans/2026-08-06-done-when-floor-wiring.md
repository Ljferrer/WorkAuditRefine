# Done-when floor wiring — group-kill the watchdog, wire the evidence capture, pin the baseline-proceed precedence, restore the residue guards, enumerate the floor in the gospel doc

Converted by `/war-machine` from [docs/specs/2026-08-06-done-when-floor-wiring-design.md](../specs/2026-08-06-done-when-floor-wiring-design.md)
(Part 1 is its decision digest; every spec assumption is carried into the ledger or retired with a stated reason).
Issues addressed: #1365, #1338, #1370, #1340, #1360, #1339. Issue → task mapping: #1365 → Task 1.4 (group
kill + grandchild case + residual note); #1338 finding 1 → Task 1.4, finding 2 (CDPATH) already fixed at the
tip — citation-only closure; #1370 → Task 1.1 (the capture wiring) + Task 1.4 (the header's built-contract
rewording); #1340 findings 1/2/5/7/9 → Tasks 1.1 + 1.4 (the capture set), finding 10 → Task 1.1 (precedence +
fixture), findings 6/8/11/12 → Task 1.1 (residue guard), finding 13 → Task 1.1 (gate-anchor assert),
findings 3/4 already fixed at the tip — citation-only closure; #1360 → Task 1.2; #1339 → Task 1.3. `/war`
files its own epic + task issues regardless (war-execution-must-file-issues); closing the six source issues is
Lead checkpoint work at phase close (war-checkpoint-must-close-task-issues), never assumed from the epic close.

## Context — the gap / problem

One floor family, one cluster of residuals. The done-unmet route shipped in 0.17.0 —
`skills/war/assets/assert-done-when.sh` plus its wiring through `skills/war/assets/workflow-template.js`
(`doneWhenFloorClause`) and `agents/war-refiner.md` step 7 (verified: issue #1360 (2026-08-06); all three
constructs re-read in the live tree at `6fff2ee`) — and every defect below sits on it. Source spec:
`docs/specs/2026-08-06-done-when-floor-wiring-design.md`. Snapshot base for every measured claim: the repo
tip at `6fff2ee` (2026-08-06); conversion-time re-measurements below are at the same base (the session
worktree's spec-batch and checkpoint commits are docs-only and touch none of these surfaces).

1. **The watchdog kills the direct PID only — a backgrounded grandchild survives TERM and KILL** (verified:
   issue #1365 (2026-08-06); verified: issue #1338 (2026-08-06), finding 1; re-confirmed at `6fff2ee`). The
   watchdog subshell after the `( cd -- "$worktree" && exec bash "$cmd_file_abs" ) &` launch signals exactly
   one PID — `kill -TERM "$cmd_pid"` then `kill -KILL "$cmd_pid"` — with no `set -m`, no negative-PID group
   form, no `setsid` (bash 3.2 has none). A command that backgrounds or daemonizes a grandchild (`node
   --test` children, `sleep 60 & wait`) is never signaled: it can keep writing into the worktree, hold a
   port or lock, and stall a pipe-capturing caller via the inherited stdout/stderr fds. The exit code stays
   correct (marker precedence) — a resource-leak/stdout-capture residual — but the header's TIMEOUT note
   understates it as "may briefly outlive the kill" (re-confirmed at `6fff2ee`, the TIMEOUT paragraph).
2. **Issue #1338's second finding is already fixed** (verified: issue #1338 (2026-08-06); re-confirmed at
   `6fff2ee`): `unset CDPATH` sits directly under `PROG=` with an explanatory comment, and suite case 20
   pins it. Only finding 1 remains open in that issue — its closure is citation-only.
3. **The floor's header claims a refiner stdout capture no consumer implements** (verified: issue #1370
   (2026-08-06); verified: issue #1340 (2026-08-06), findings 1/2/5/7/9; each re-confirmed at `6fff2ee`).
   The header states "STDOUT belongs to the executed command — the refiner captures it as the done-when
   evidence artifact", yet `doneWhenFloorClause` and war-refiner step 7 both branch on the exit code only,
   and the `MERGE_RESULT` contract (mirrored in `skills/war/references/schemas.md` and the refiner card's
   `## Return` line) enumerates no done-when evidence field — in contrast to the sibling `gate_log_path`
   and `mappedTests` channels the same wiring did implement. Concrete consequences at the tip: the
   `MAKE_DONE_PASS` fix prompt carries zero output from the red run (the no-test sibling threads
   `floor_diagnostic` verbatim for exactly this reason), and the floor-retry sub-loop's exhaustion tail's
   `exhaustedDiag = floorDiagOf(floorMr)` always resolves absent on the done-unmet route, so the Lead sees
   a hard hold with no recorded cause (verified: issue #1340 (2026-08-06), finding 7; re-confirmed at
   `6fff2ee`).
4. **The legacy-residue guard was weakened under a false "strictly stronger" comment** (verified: issue
   #1340 (2026-08-06), findings 6/8/11/12; re-confirmed at `6fff2ee`). The "Done when threading — absent ⇒
   '' (set-minus)" test in `skills/war/assets/workflow-template.test.mjs` asserts occurrence-count parity
   (`count(wo) === count(wp) - 1`) under a comment claiming it is "strictly stronger than the retired
   line-anchored !includes". The parity form is entailed by the `replace(...) === wo` byte-identity assert
   directly above it, and it misses the one case the retired form caught: a line-anchored `Done when:`
   token hardcoded into fixed prose present in both arms (parity cancels). The restored line-anchored form
   is green at the base: the only fixed-prose `Done when:` mentions in a doneWhen-less arm are
   `MAKE_DONE_PASS`'s two mid-sentence ones (re-confirmed at `6fff2ee`, census of `Done when:` literals in
   `workflow-template.js`).
5. **The done-when floor rides the baseline-proceed dispatch with no documented precedence** (verified:
   issue #1340 (2026-08-06), finding 10; re-confirmed at `6fff2ee`). `doneWhenFloorClause` is appended to
   all 4 merge-task dispatch sites — initial, floor-retry, environment-proceed, baseline-proceed (count
   source-pinned by the 'done-when floor coverage (Task 2.3)' test; dated snapshot 2026-08-06 at
   `6fff2ee`) — while the `FLOOR_STATUSES` fix sub-loop is entered only from the initial merge result, so a
   baseline-proceed returning `done-unmet` falls to the terminal else and escalates a
   `HARD_ESCALATION_REASONS` member with zero fix rounds. Neither surface states which instruction wins
   between "if the ONLY failures are the pre-existing baseline set, MERGE" and "exit 1 → do NOT merge".
6. **A vacuously-passable gate-ordering assert** (verified: issue #1340 (2026-08-06), finding 13;
   re-confirmed at `6fff2ee`): the 'done-when floor threading (Task 2.3)' test's per-site loop asserts
   `indexOf('After the gate') > indexOf('Run the gate')` with no presence assert for the `Run the gate`
   anchor — a reword makes the right side `-1` and the comparison passes for the wrong reason.
7. **Two findings of issue #1340 are already fixed at the tip** (re-confirmed at `6fff2ee`): `CONTEXT.md`
   carries the **done-unmet route** glossary entry (finding 3), and the D3 both-surfaces registry in
   `workflow-template.test.mjs` carries the done-when floor row (finding 4). Their closure is
   citation-only; the remaining eleven findings stand.
8. **CLAUDE.md's floor enumerations omit the shipped floor** (verified: issue #1360 (2026-08-06);
   re-confirmed at `6fff2ee`): `done-unmet` has zero hits in `CLAUDE.md`; the Enum-discipline named-route
   parenthetical still reads the two-member list (`no-test`, `unpackaged`); the Guard-architecture
   merge-path floor list still names only `assert-test-in-diff.sh`, `assert-packaging-in-diff.sh`,
   `assert-no-submodule-mutation.sh`. The third surface the issue names — the per-phase pipeline
   sentence — says "floors, gate, merge" without enumerating individual floors, so it is out of scope by
   the issue's own "if it enumerates floors" qualifier (hand-checked at `6fff2ee`; re-checked at
   conversion).
9. **Two Nit-grade header-prose asymmetries in the test floor's suite** (verified: issue #1339
   (2026-08-06); re-confirmed at `6fff2ee`): in `skills/war/assets/assert-test-in-diff.test.sh` the
   case-12 header entry still reads the unscoped "Exit codes and stdout are untouched." although its body
   twin was scoped to the exit-1/2 contracts, and the case-13 banner claims "12d the die path" for the
   stdout contract although case 12d captures only stderr — no case asserts the exit-2 stdout channel.
10. **Survey-derived (conversion-time pin census):** no structural test pins the two CLAUDE.md floor
    sentences' bytes. The binding pins on that file are the `prompt-surface-budgets.test.mjs` byte budget
    (hard 16,384 B / advisory 14,336 B; `CLAUDE.md` measured 13,523 B — dated snapshot at the conversion
    base), the ratified pointer line (byte-identity across three surfaces, `war-config.test.mjs`), and the
    `## Doctrine placement` mirror (`skill-doc-contracts.test.mjs`) — none of which the Task 1.2 edits
    touch (verified: conversion census of every `CLAUDE.md`-reading test, 2026-08-06 base).

## Pivotal constraints

- **bash 3.2.57 / macOS**: no coreutils `timeout`, no `setsid`. `set -m` is the available
  process-group-containment primitive; a true new-session daemon remains unreachable and must be named as
  the residual, not papered over.
- **Frozen exit-code contract**: 0/1/2 with marker precedence; exit 2 never collapses into the floor
  status. No change to any exit path (verified: the `assert-done-when.sh` header contract + `die` default
  at `6fff2ee`).
- **Stdout purity**: suite case 13 asserts the floor's stdout equals the executed command's bytes exactly,
  green and red path; case 20 extends it under CDPATH (verified: both case bodies re-read in the live
  suite at `6fff2ee`). The group-kill change and the capture wiring must
  add nothing to the floor's stdout. Under `set -m` bash may emit job-status notices on stderr when the
  background command is killed — the suite's stderr asserts are tolerant substring greps and case 13's
  byte-equality is stdout-only, but if a notice leaks somewhere byte-asserted, suppress at the kill site,
  never loosen a test.
- **Both-surfaces law**: standing instructions in `agents/war-refiner.md` and the string-built dispatched
  prompts in `workflow-template.js` change in the same commit. The D3 registry's done-when floor row
  anchors (`assert-done-when.sh`, `--cmd-file`, `done-unmet`, never-'done-unmet') must stay green on both
  surfaces, and the 'both surfaces (Task 2.3)' test's extraction regexes key on the card's numbered-step
  terminator and the `**exit 1**` / `**exit 2**` bullet order — new step-7 prose keeps that structure.
- **Clause-delimiter coupling**: two tests own the extraction regex `After the gate, run the done-when
  floor:` … `make-this-command-pass loop.` — the threading test and the merge-prompt legacy byte-identity
  test (verified at `6fff2ee`, both call sites). New clause prose lands **inside** the delimited span, or
  both delimiters update in the same commit.
- **Return-contract enumeration duty**: a new optional `MergeResult` field lands in the refiner card's
  `## Return` enumeration, the `MERGE_RESULT` schema comment block, and `skills/war/references/schemas.md`
  in the same commit (the recorded doc-return-contract-enumeration failure shape).
- **`floor_diagnostic` stays test-floor-scoped**: its contract prose on all three doc surfaces names the
  exit-1 `assert-test-in-diff.sh` stderr specifically (verified: the `MERGE_RESULT` comment block, the
  refiner card's `## Return` line, and the `schemas.md` field entry, each re-read at `6fff2ee`); the
  done-when evidence gets its own field, never a silent widening of that contract.
- **CLAUDE.md coupling**: the merge-path floor sentence binds the listed floors' discovery patterns to
  `resolveGate` (referenced by name, never by suite enumeration). `assert-done-when.sh` performs no diff
  discovery — the fail-closed floor-classification census in the test floor's suite already records it as
  exempt ("executes the file-threaded done-when command, no file discovery"; re-confirmed at `6fff2ee`) —
  so its addition must scope that mirror clause to the discovery floors, not extend a false claim.
- **The ratified pointer line at the top of `CLAUDE.md` is byte-identical across surfaces** — the edits
  touch only the two enumeration sentences, and stay under the budget suite's advisory line (Context 10).
- **Suite conventions**: macOS bash 3.2.57, cwd-independent, fresh mktemp fixtures; new cases extend the
  suite's numbered header enumeration in the same commit (the plan-mandated-banner-count trap: hand-scan
  banners for any count/enumeration prose the additions stale).
- **Release discipline**: the version bump is its own trailing phase; version literals in this plan and the
  source spec are non-authoritative.

## Resolved design tree

| # | Decision | Resolution | Source |
|---|----------|------------|--------|
| D1 | Grandchild containment mechanism | `set -m` immediately before the background launch, `set +m` immediately after `cmd_pid=$!` — the command tree gets its own process group with pgid `$cmd_pid`; the watchdog (launched after `set +m`, staying in the script's own group) signals the group first with the existing single-PID form as a `\|\|` fallback: `kill -TERM -"$cmd_pid" 2>/dev/null \|\| kill -TERM "$cmd_pid" 2>/dev/null \|\| true`, same for `-KILL`. The 1s liveness poll (`kill -0 "$cmd_pid"`) is unchanged. [assumed: the lesson-recommended remedy from #1365/#1338 — if wrong (`set -m` proves noisy or unreliable on bash 3.2): fall back to a `ps`-walk descendant kill, at the cost of a race window] | spec §3 row 1; (verified: issue #1365 (2026-08-06)) |
| D2 | Residual-note wording | Rewrite the TIMEOUT paragraph's residual sentence to state what actually survives after the group kill: a grandchild that escaped into a **new session/process group** (true daemonization); drop "may briefly outlive" | spec §3 row 2 |
| D3 | Evidence capture: wire it or retract the header claim | **Wire it.** The refiner tees the floor run's full stdout+stderr to a run-scoped artifact `<_refinery>/.war/done-when-<taskId>.log` (the `gate_log_path` precedent, same one-time `.war/` git-exclude step) and, on exit 1, returns its absolute path in a new optional merge-task field `done_when_log_path`. The header is then reworded to describe the **built** contract. [assumed: wiring over retraction, because retraction alone leaves finding 7's Lead-facing blind hard hold and the MAKE_DONE_PASS worker without a diagnostic — if wrong: the retract-only alternative is a two-line header edit plus no workflow change; the drafter downshifts to it on operator veto] | spec §3 row 3 |
| D4 | Channel shape | New optional field `done_when_log_path` (merge-task only), **not** a widening of `floor_diagnostic` — mirrors `gate_log_path`'s artifact-first shape (fail-open advisory, never routed on) and leaves the test floor's documented contract untouched | spec §3 row 4 |
| D5 | MAKE_DONE_PASS diagnostic | Thread the artifact **path** (not the content) into the `MAKE_DONE_PASS` fix prompt — "the red run's full output is captured at `<path>`; read it before re-running" — bounded prompt size; the fix-worker reads the file. Conditioned ONLY on the floor result's field via a `floorDiagOf`-sibling normalizer (absent ⇒ '' ⇒ byte-identical prompt; `floorDiagOf` itself stays test-floor-only) | spec §3 row 5 |
| D6 | Exhaustion escalation detail | On done-unmet exhaustion, the escalation entry and `auditLog` entry carry `done_when_log_path` when present (the `exhaustedDiag` pattern — shape-identical when absent) | spec §3 row 6 |
| D7 | Baseline-proceed precedence | **The floor overrides the carve-out**: the done-when floor runs on every merge-task dispatch including baseline-proceed, and its exit 1 blocks — the carve-out proceeds only over the gate's pre-existing failures, never over the task's own acceptance command. Documented on both surfaces (one sentence inside `doneWhenFloorClause`'s delimited span + one sentence in war-refiner step 7) and pinned by a fixture driving a baseline-classified first result whose baseline-proceed returns `done-unmet` → HARD escalation, zero fix rounds, `held:escalation`. [assumed: fail-closed documented override, matching the route's purpose ("a task merges only when its own acceptance command passes") and requiring no routing change — if wrong: the alternative (routing proceed-dispatch floor statuses into the bounded fix sub-loop) is a behavioral change needing its own plan decision] | spec §3 row 7; (verified: issue #1340 (2026-08-06), finding 10) |
| D8 | Residue guard | Restore the line-anchored absolute-absence assert (`!wo.prompt.includes('\nDone when:')`) **beside** the occurrence-parity assert; reword the comment to "complementary" (parity catches an asymmetric/vanished clause; line-anchoring catches a hardcoded line-form token present in both arms), deleting the "strictly stronger" claim | spec §3 row 8 |
| D9 | Gate-ordering assert | Add an anchor-presence assert for `Run the gate` immediately before the ordering comparison, in the same per-site loop | spec §3 row 9 |
| D10 | CLAUDE.md surfaces | Add `done-unmet` to the Enum-discipline named-route parenthetical; add `assert-done-when.sh` to the Guard-architecture merge-path floor list with a discovery-exempt parenthetical scoping the `resolveGate` mirror clause to the diff-discovery floors. The per-phase pipeline sentence does not enumerate floors and stays untouched | spec §3 row 10; (verified: issue #1360 (2026-08-06)) |
| D11 | Test-floor header prose (#1339) | Apply the two auditor-suggested rewordings verbatim-in-substance: scope the case-12 sentence to the exit-1/2 stdout contracts; reword the case-13 banner to "12d pins the die path's exit code and stderr (the exit-2 stdout channel carries no printf and is not separately asserted)" | spec §3 row 11; (verified: issue #1339 (2026-08-06)) |
| D12 | Task decomposition | Four file-disjoint tasks in Phase 1 — Task 1.1 the engine cluster (`workflow-template.js` + its suite + `war-refiner.md` + `schemas.md`, forced together by the both-surfaces law, the return-contract enumeration duty, and the same-file rule); Task 1.2 `CLAUDE.md`; Task 1.3 the test floor's suite header; Task 1.4 the floor + its suite with `deps: [1.1]` (a content edge — the rewritten header describes the capture contract 1.1 authors; Note 2) — plus the standard trailing release phase | conversion judgment, logged for /red-team; war-strategy §3 |
| D13 | D3 registry row growth | The capture + precedence prose extends the **existing** done-when floor directive — no new registry row, row-count floor untouched; the existing row's anchor array gains two tokens, `/done_when_log_path/i` and `/never proceeded over as baseline debt/i` (both present on both surfaces after 1.1; the precedence token has zero hits on either surface at `6fff2ee`, so the row mechanically pins the D7 sentence and cannot pass on pre-existing `baseline-proceed` prose) — the grown directive stays censused (the finding-4 canonicality concern, applied forward) | conversion judgment, logged for /red-team |

## Assumptions ledger

| ID | Assumption | Basis | Blast radius if wrong | Check |
|----|-----------|-------|----------------------|-------|
| A1 | `set -m` + group-first kill with single-PID fallback works on macOS bash 3.2.57 without polluting byte-asserted channels | spec §3 row 1 (carried [assumed] row); the lesson-recommended remedy | fall back to a `ps`-walk descendant kill (race window accepted); or suppress the notice at the kill site | End states 1–2's suite run; ratify in /red-team |
| A2 | Wiring the capture (not retracting the header claim) is the wanted resolution | spec §3 row 3 (carried [assumed] row); finding 7's blind hard hold and the promptless MAKE_DONE_PASS worker are real costs of retraction | downshift to the retract-only alternative: a two-line header edit in Task 1.4, Task 1.1 loses items (a)–(e) of its slice | ratify in /red-team (spec-flagged veto point) |
| A3 | The done-when floor overrides the baseline-proceed carve-out (documented + pinned, no routing change) | spec §3 row 7 (carried [assumed] row); fail-closed, intent-consistent, zero behavior change | the alternative routing change (proceed-dispatch floor statuses entering the fix sub-loop) becomes its own plan decision | End state 8's fixture; ratify in /red-team (spec-flagged veto point) |
| A4 | No new CONTEXT.md glossary term | spec §6 (carried [assumed] row): the done-unmet route entry already exists at the tip; `done_when_log_path` is a schema field, not a glossary-grade term | a one-line "done-when evidence artifact" entry under the done-unmet route heading; adds `CONTEXT.md` to the footprint | ratify in /red-team |
| A5 | No ADR — every decision is a defect fix or prose truth-restoration; the D7 judgment call is documented on both prompt surfaces and pinned by fixture | spec §7 (carried [assumed] row) | a one-paragraph amendment to the nearest live baseline-proceed record (`docs/adr/0040-environment-class-gate-failures-earn-one-retry.md`; the merge-queue comments also cite ADR 0019), observing the amendment rule (pre-existing body text byte-unchanged apart from the Status currency line) | ratify in /red-team |
| A6 | No sibling plan must LAND first — but this group is the declared UPSTREAM of three sibling groups | spec §8 (carried claim: the survey manifest's machine hint carries the empty dependency list; the 2026-08-06 manifest is not present in this worktree — the spec's statement is the source). Conversion-time verification of the sibling spec texts at `6fff2ee`: `verdict-adjudication-integrity` declares `dependsOn: … done-when-floor-wiring` (shares `CLAUDE.md`); `gate-audit-finding-routing` declares "this group lands after the done-when-floor-wiring sibling group" (shares `workflow-template.js` + its suite); `structural-pin-extractors` declares a **binding** lands-after ordering onto this group and disclaims the file family; `handoff-schemas-contract` lands after `gate-audit-finding-routing` (transitively downstream; shares `schemas.md`/`war-refiner.md`/`workflow-template.js`) | landed out of order, the downstream groups rebase-conflict against constructs this plan moved, or re-anchor against stale shapes | roadmap: dependency-spine edges this plan → `verdict-adjudication-integrity`, → `gate-audit-finding-routing`, → `structural-pin-extractors` (transitive covers `handoff-schemas-contract`), plus `## Shared-file contention` rows; /war-campaign's sweep contention check re-verifies |
| A7 | The CLAUDE.md additions fit under the budget suite's advisory line | conversion measurement (Context 10): 13,523 B measured, advisory 14,336 B — ≈800 B headroom against a ≲200 B edit | `prompt-surface-budgets.test.mjs` reds; tighten the added wording (the hard 16,384 B ceiling is not approachable at this diff size) | End state 11's budget-suite run |

## Non-goals / deferred

- **No fix-sub-loop entry from proceed-dispatch results**: a baseline-/environment-proceed returning a
  floor status keeps today's zero-round hard escalation; this plan documents and pins that precedence, it
  does not re-route it (D7/A3).
- **No `setsid`/double-fork containment**: a grandchild that escapes into a new session survives the group
  kill; that is the rewritten residual note's content, accepted on bash 3.2 (D2).
- **No exit-2 stdout assertion for case 12d** (#1339's optional stronger fix): reword only; the die path is
  structurally silent on stdout.
- **`skills/war/references/schemas.md` "defined-but-not-yet-emitted" staleness** on the
  `done-unmet`/`mappedTests`/`doneWhen` entries predates this group and was ruled out of scope by the
  originating run's adjudication — this plan touches that file only to add the new field; the staleness
  sweep is separate follow-up work.
- **No `floor_diagnostic` widening**: the test floor's channel keeps its documented scope (D4).
- **Lesson stamps**: prefixing the two memory-mined lessons
  (`bash-watchdog-kills-direct-pid-only-grandchild-survives`,
  `floor-script-header-can-claim-unbacked-downstream-capture`) with the RESOLVED convention is post-land
  housekeeping for the servitor / `/lessons-learned`, not plan scope.

## New domain terms · Recommended ADRs

None. The **done-unmet route** glossary entry already exists at the tip; `done_when_log_path` is a schema
field documented in `skills/war/references/schemas.md` (A4). No ADR by default (A5 carries the fallback).

## Commander's Intent

- **Purpose:** a timed-out done-when command cannot leave a working grandchild behind — the watchdog kills
  the command's whole process group, and what can still survive is stated truthfully; the floor's header
  claims only contracts the wiring implements, because the wiring now implements the evidence capture
  end-to-end (tee → `done_when_log_path` → MAKE_DONE_PASS prompt → exhaustion detail) so a red done-when
  is never a blind hold; the floor's precedence over the baseline-proceed carve-out is documented on both
  prompt surfaces and pinned by a fixture; the weakened residue guard and the vacuously-passable ordering
  assert are restored; the gospel doc enumerates the shipped floor; and the test floor suite's header
  matches what its cases actually capture.
- **Method:** `set -m` around the background launch with group-first kills and a single-PID fallback (bash
  3.2, no `setsid` — the new-session daemon stays the named residual); wire the capture as
  `gate_log_path`'s sibling — a `_refinery`-scoped `.war/done-when-<taskId>.log` tee plus an optional
  merge-task `MergeResult.done_when_log_path`, never a `floor_diagnostic` widening — threading the path,
  not the content, into MAKE_DONE_PASS and the exhaustion tail, with all three return-contract doc
  surfaces moving in the same commit; one precedence sentence per surface plus the baseline-proceed
  done-unmet fixture; restore the line-anchored residue assert beside parity under a complementary-framing
  comment; presence-assert the gate anchor; the three-member named-route parenthetical and four-member
  floor list in CLAUDE.md with the `resolveGate` mirror scoped to the diff-discovery floors; the two
  #1339 rewordings. Clause growth stays inside the delimited span or both owning regexes move in the same
  commit; exit contract and floor stdout untouched by a byte.
- **End state:**
  1. The watchdog signals the command's process group with a single-PID fallback, and the launch is
     bracketed by `set -m` / `set +m` ·
     check: `grep -Fc -- '-TERM -"$cmd_pid"' skills/war/assets/assert-done-when.sh` returns 1 and
     `grep -Fc -- '-KILL -"$cmd_pid"' skills/war/assets/assert-done-when.sh` returns 1 (bracketing
     hand-verified at the launch construct). `-F` is load-bearing: spec §10.1's inherited `grep -c`
     form false-reds on the repo's platform — BSD grep treats the mid-pattern `$` as an anchor and
     returns 0 against the very group-kill lines D1 mandates (red-team-executed at conversion; the spec
     is posterity and keeps its wording).
  2. A done-when command that backgrounds a long-lived grandchild (`sleep 60 & wait`) under `--timeout 1`
     exits 1 with the timed-out diagnostic AND the invocation's command-substitution stdout capture
     returns within the suite's existing 15s wall-clock idiom — without the group kill the orphan holds
     the inherited stdout fd and the capture blocks ·
     check: `bash skills/war/assets/assert-done-when.test.sh` (all cases green, the grandchild case
     included).
  3. The header residual note no longer claims the survivor is brief and names the true survivor class (a
     grandchild escaped into a new session/process group) ·
     check: `grep -c 'briefly outlive' skills/war/assets/assert-done-when.sh` returns 0. **Mandatory
     manual same-scope survey (grep is a floor):** hand-scan the floor's and suite's same-scope headers,
     case-list titles, and comments for reworded restatements of the old residual/capture claims; list
     each straggler as a survey-derived correction. Survey at `6fff2ee` (dated snapshot): three
     same-scope `evidence artifact` restatements in the suite — the stdout-contract header note, the
     case-13 comment ("would pollute the refiner's captured done-when evidence artifact"), and the
     case-20 comment ("polluting the evidence artifact case 13 pins") — all reworded to the built
     contract in Task 1.4; re-measure at the task's rebased base.
  4. The evidence contract lives on all four live carriers — the dispatched clause's home, the standing
     card, the schema mirror, and the floor's reworded header ·
     check: `grep -rln 'done_when_log_path' skills/war/assets/workflow-template.js agents/war-refiner.md
     skills/war/references/schemas.md skills/war/assets/assert-done-when.sh` lists all four files.
  5. The dispatched clause instructs the tee (combined stdout+stderr to
     `<_refinery>/.war/done-when-<taskId>.log`) and the exit-1 `done_when_log_path` return, pinned
     clause-scoped (the existing extraction idiom), and the legacy byte-identity and set-minus tests stay
     green — clause growth stayed inside the delimited span (or both owning regexes moved in the same
     commit) ·
     check: `node --test skills/war/assets/workflow-template.test.mjs`.
  6. The MAKE_DONE_PASS fix prompt names the captured artifact path when the floor result carries
     `done_when_log_path`, and is byte-identical to today's prompt when the field is absent ·
     check: `node --test skills/war/assets/workflow-template.test.mjs`.
  7. On done-unmet exhaustion, the escalation entry and `auditLog` entry carry `done_when_log_path` when
     the last floor result has it, and are shape-identical to today's entries when absent (the
     `exhaustedDiag` pattern) ·
     check: `node --test skills/war/assets/workflow-template.test.mjs`.
  8. The baseline-proceed precedence is documented on both surfaces and pinned: a baseline-classified
     first merge result whose baseline-proceed returns `done-unmet` escalates `reason: 'done-unmet'` with
     no MAKE_DONE_PASS fix-worker dispatched (zero fix rounds) and the run holds (`held:escalation`);
     the precedence SENTENCE is mechanically pinned on both surfaces by the D3 registry row's
     shared-token anchor (D13 — `never proceeded over as baseline debt`, zero hits on either surface at
     `6fff2ee`, so the pre-existing `baseline-proceed` prose cannot satisfy it vacuously) ·
     check: `node --test skills/war/assets/workflow-template.test.mjs`, and
     `grep -c 'never proceeded over as baseline debt' agents/war-refiner.md` returns 1 with the hit
     inside step 7's done-when bullet (hand-verified placement — registered as a backstop row).
  9. The residue guard asserts line-anchored absence beside occurrence parity and no longer claims strict
     strength ·
     check: `grep -c 'strictly stronger' skills/war/assets/workflow-template.test.mjs` returns 0.
     **Mandatory manual same-scope survey:** hand-scan the suite's same-scope tests/comments for
     same-meaning reworded siblings the grep misses; list each straggler as a survey-derived correction.
  10. The `Run the gate` anchor is presence-asserted immediately before the ordering comparison ·
      check: `grep -n 'the gate instruction anchor is present' skills/war/assets/workflow-template.test.mjs`
      returns a hit (or the equivalent presence assert located by construct in the threading test's
      per-site loop).
  11. CLAUDE.md enumerates the route and the floor: the named-route parenthetical is the three-member
      list and the merge-path floor list carries `assert-done-when.sh` with the `resolveGate` mirror
      scoped to the diff-discovery floors; the ratified pointer line is byte-unchanged and the budget
      suite stays green ·
      check: `grep -c 'done-unmet' CLAUDE.md` ≥ 1, `grep -c 'assert-done-when.sh' CLAUDE.md` ≥ 1, and
      `node --test skills/war/assets/prompt-surface-budgets.test.mjs`. **Mandatory manual same-scope
      survey:** after the `no-test`/`unpackaged`/`floor` greps, hand-scan the Execution-architecture and
      Guard-architecture sections' full prose for any unenumerated floor-family restatement; list each
      straggler as a survey-derived correction (the per-phase pipeline sentence was hand-checked at
      `6fff2ee` and does not enumerate — it stays untouched).
  12. The test floor suite's case-12 header entry is scoped and the case-13 banner matches 12d's real
      capture ·
      check: `grep -c 'Exit codes and stdout are untouched' skills/war/assets/assert-test-in-diff.test.sh`
      returns 0. **Mandatory manual same-scope survey:** hand-scan the suite's header Cases list and
      banners for same-meaning reworded siblings; list each straggler as a survey-derived correction.
  13. The full gates are green at the integrated tip ·
      gate: the self-discovery gate (`resolveGate` in `war-config.mjs`) — `node --test
      'skills/**/*.test.mjs'` and the documented hooks/skills shell-test loop both exit 0.
  14. Each landing commit cites its issue(s) — #1365 + #1338 for Task 1.4's watchdog fix, #1370 + #1340
      for the capture set (Tasks 1.1 and 1.4), #1360 for Task 1.2, #1339 for Task 1.3; the two
      already-fixed-at-tip closures (#1338 finding 2, #1340 findings 3/4) are cited in the phase-close
      checkpoint notes, no code change ·
      HARD at audit_sha (git log between the phase base and the tip; execution-evidence seat).
  15. The redaction lint stays green ·
      gate: the self-discovery gate (`resolveGate` in `war-config.mjs`; the war-memory lint wrapper is a
      discovered member).
  16. Release: all four version slots move lock-step to the next free patch above the live integration
      base at land time ·
      check: `node --test skills/war/assets/version-slots.test.mjs` (lock-step + monotonic floor; the
      bump's presence is judged at audit_sha — the suite cannot fail on a wholly absent release).

## Build order (for /war)

Phase 1 (wave 1 = Tasks 1.1, 1.2, 1.3; wave 2 = Task 1.4 `deps: [1.1]`) → Phase 2 (release).

The wave edge is a content dependency, never a collision dodge: Task 1.1/1.4 file sets are disjoint, and
Task 1.4's rewritten header states the capture contract (tee + `done_when_log_path` return) that Task 1.1
authors — at the frozen phase base that header would be exactly the #1370 defect class (a floor header
claiming an unbuilt downstream capture) through no fault of its own diff; Task 1.4's worker rebases onto
the integration tip as its first act (Note 2). Tasks 1.2 and 1.3 are file-disjoint from everything and
dependency-free (the constructs they name — `assert-done-when.sh`, the shipped 0.17.0 route, case 12d's
capture shape — all exist at the frozen base).

## Phase 1 — Group kill, evidence capture, precedence pin, guard restoration, doc enumeration

### Task 1.1: Evidence capture wired + precedence pinned (engine, card, schema mirror, engine suite)

- Files: `skills/war/assets/workflow-template.js`, `skills/war/assets/workflow-template.test.mjs`, `agents/war-refiner.md`, `skills/war/references/schemas.md`
- Plan slice: **Engine (`workflow-template.js`)** — (a) `doneWhenFloorClause` grows, **inside** the
  existing delimited span (`After the gate, run the done-when floor:` … `make-this-command-pass loop.`;
  if any addition must move the terminal sentence, update the extraction regex in BOTH owning tests in
  the same commit): a tee instruction — run the floor with its combined stdout+stderr teed to
  `<refinery>/.war/done-when-<taskId>.log` (the `.war/` git-exclude step is already instructed for the
  cmd file); on the exit-1 branch, return the artifact's ABSOLUTE path in `done_when_log_path` alongside
  `status: 'done-unmet'`; and one precedence sentence — the floor is fail-closed on **every** merge-task
  dispatch, including a baseline-proceed: a red done-when is **never proceeded over as baseline debt**
  (D7; the bolded phrase is the D13 shared-token anchor — carry it byte-identically on both surfaces).
  (b) `MERGE_RESULT` schema: add optional `done_when_log_path: { type: 'string' }` with a comment block
  mirroring `gate_log_path`'s shape (merge-task only; fail-open advisory, never routed on; no status
  enum value, `HARD_ESCALATION_REASONS` member, or `KNOWN_LAND_DECISIONS` member added or changed —
  `land-decision.mjs` and both hand-mirrored enum blocks byte-untouched, ADR 0005). (c) `MAKE_DONE_PASS`
  fix prompt: append a conditional evidence clause naming the captured artifact path ("the red run's
  full output is captured at `<path>`; read it before re-running"), via a `floorDiagOf`-sibling
  normalizer conditioned ONLY on the floor result's field — absent ⇒ '' ⇒ byte-identical prompt
  (set-minus purity; the DONE_WHEN_SITES loop drives both arms through the same mock). (d) done-unmet
  exhaustion tail: the escalation entry and `auditLog` entry carry the last floor result's
  `done_when_log_path` when present, shape-identical when absent (the `exhaustedDiag` pattern; D6).
  **Standing card (`agents/war-refiner.md`)** — (e) step 7: add the tee + `done_when_log_path` return
  duty to the **exit 1** bullet and the baseline-proceed precedence sentence (both mirroring the
  dispatched prose — same commit; the card's precedence sentence carries the D13 shared-token phrase
  `never proceeded over as baseline debt` verbatim), keeping the numbered-step terminator and the
  `**exit 1**` / `**exit 2**` bullet order intact (the 'both surfaces (Task 2.3)' extraction regexes key
  on them);
  `## Return`: add `done_when_log_path?` to the `MergeResult` field enumeration with its merge-task-only
  parenthetical. **Schema mirror (`skills/war/references/schemas.md`)** — (f) add `done_when_log_path?`
  to the `MergeResult` field list and a short field entry mirroring the `floor_diagnostic` entry's
  advisory framing (only the addition; the pre-existing defined-but-not-yet-emitted staleness on sibling
  entries stays out of scope). **Engine suite (`workflow-template.test.mjs`)** — (g) residue guard
  ("Done when threading — absent ⇒ '' (set-minus)"): restore
  `assert.ok(!wo.prompt.includes('\nDone when:'), …)` beside the parity assert; reword the block comment
  to the complementary framing, deleting "strictly stronger" (D8; run the suite before and after — the
  restored form is green at the base, both MAKE_DONE_PASS fixed-prose mentions being mid-sentence —
  never assume). (h) 'done-when floor threading (Task 2.3)': add
  `assert.ok(c.prompt.includes('Run the gate'), …the gate instruction anchor is present…)` immediately
  before the ordering comparison (D9); extend the clause-scoped asserts to pin the tee target
  (`.war/done-when-t1.log`) and the exit-1 `done_when_log_path` instruction. (i) new fixture (finding-10
  pin): baseline-classified first merge result → baseline-proceed returns `status: 'done-unmet'` →
  assert the escalation carries `reason: 'done-unmet'`, no `make-pass:` worker was dispatched (zero fix
  rounds), and `landDecision === 'held:escalation'`. (j) new/extended asserts: the MAKE_DONE_PASS prompt
  names the evidence path when the floor result carries `done_when_log_path` and is byte-identical when
  absent; the exhaustion entries carry/omit the field per D6. (k) D3 registry: the existing done-when
  floor row's anchor array gains `/done_when_log_path/i` and `/never proceeded over as baseline debt/i`
  (both present on both surfaces after this task; the second mechanically pins the D7 precedence
  sentence — End state 8) — no new row, row-count floor untouched (D13). Re-verify the legacy
  byte-identity tests green. Commits cite #1370 and #1340.
- Done when: `node --test skills/war/assets/workflow-template.test.mjs`
- requiresTest: true
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 1.2: CLAUDE.md floor-family enumerations (#1360)

- Files: `CLAUDE.md`
- Plan slice: Enum-discipline sentence — the named-route parenthetical becomes the three-member list
  (`no-test`, `unpackaged`, `done-unmet`). Guard-architecture sentence — add `assert-done-when.sh` to
  the merge-path floor list and scope the trailing clause so the `resolveGate` discovery-pattern mirror
  binds the diff-discovery floors only (`assert-done-when.sh` executes the task's acceptance command —
  no diff discovery; the test floor suite's fail-closed classification census already records the
  exemption). The ratified pointer line and the `## Doctrine placement` section are byte-untouched; the
  additions stay under the budget suite's advisory line (A7 — ≈800 B headroom measured at conversion).
  Sweep step: grep `no-test`, `unpackaged`, and `floor` across `CLAUDE.md` and confirm no other sentence
  enumerates the floor family — **grep is a floor, not a ceiling**: run End state 11's mandatory manual
  survey and record the outcome in the done report even when zero stragglers (the per-phase pipeline
  sentence was hand-checked at `6fff2ee`, does not enumerate, and stays untouched). Commit cites #1360
  (its stated close condition).
- Done when: None — prose-only gospel-doc edit; the mechanical pins are End state 11's greps plus the
  budget suite (`prompt-surface-budgets.test.mjs`, a discovered gate member).
- requiresTest: false
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 1.3: Test-floor suite header prose (#1339)

- Files: `skills/war/assets/assert-test-in-diff.test.sh`
- Plan slice: in the file-header `# Cases:` list — (a) case-12 entry: replace "Exit codes and stdout are
  untouched." with the scoped form ("Exit codes are untouched and the exit-1/2 stdout contracts are
  byte-preserved (12b's exit-0 stdout is the Case 13 matched-path listing)."); (b) case-13 banner:
  reword "12d the die path" to "12d pins the die path's exit code and stderr (the exit-2 stdout channel
  carries no printf and is not separately asserted)". No behavioral change, no case body edits; run End
  state 12's grep + mandatory manual survey and record the outcome in the done report. Commit cites
  #1339.
- Done when: `bash skills/war/assets/assert-test-in-diff.test.sh`
- requiresTest: false
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 1.4: Floor group kill + header truth + grandchild case

- Files: `skills/war/assets/assert-done-when.sh`, `skills/war/assets/assert-done-when.test.sh`
- Plan slice: **Floor** — wrap the background launch in job control: `set -m` on the line before
  `( cd -- "$worktree" && exec bash "$cmd_file_abs" ) &`, `set +m` right after `cmd_pid=$!` (the command
  tree gets its own process group with pgid `$cmd_pid`; the watchdog subshell launches after `set +m`
  and stays in the script's own group). Watchdog kill lines become group-first with single-PID fallback:
  `kill -TERM -"$cmd_pid" 2>/dev/null || kill -TERM "$cmd_pid" 2>/dev/null || true`, and the same for
  `-KILL`; the 1s liveness poll (`kill -0 "$cmd_pid"`) is unchanged; every exit path byte-untouched
  (0/1/2, marker precedence). Header edits: (a) the TIMEOUT residual note names the true survivor class
  (a grandchild escaped into a new session/process group — true daemonization), dropping "may briefly
  outlive"; (b) the STDOUT paragraph is reworded to the **built** capture contract (stdout belongs to
  the executed command; the refiner tees the run to the done-when evidence artifact
  `<_refinery>/.war/done-when-<taskId>.log` and returns its path on exit 1 in `done_when_log_path` —
  true at this task's rebased base because Task 1.1 landed first, the deps edge). Sweep step: grep
  `briefly outlive` and `evidence artifact` across both files and update every hit — **grep is a floor,
  not a ceiling**: run End state 3's mandatory manual survey (measured candidates at `6fff2ee`, dated
  snapshot: the suite's stdout-contract header note, the case-13 comment, and the case-20 comment — all
  three restate the old capture claim); list each straggler as a survey-derived correction. **Suite** — new numbered case (grandchild survival, delete-the-feature shape): a command
  file that runs `sleep 60 & wait` under `--timeout 1`; assert (a) floor exit 1 with the timed-out
  stderr diagnostic, and (b) the invocation — with stdout captured through a command substitution —
  returns within the suite's existing 15s wall-clock idiom. Without the group kill the orphaned
  `sleep 60` holds the inherited stdout fd and the capture blocks: assert (b) goes red, proving the
  fixture is load-bearing; the banner records the delete-and-trace. Update the file-header case list
  with the new case and the §-sweep rewordings; hand-scan banners for any count/enumeration prose the
  addition stales (the banner-count trap). If a `set -m` job-status notice leaks into any byte-asserted
  channel, suppress at the kill site — never loosen a test (A1 carries the fallback). Commits cite
  #1365, #1338 (finding 1; finding 2's CDPATH fix is already live — citation-only), #1370, and #1340.
- Done when: `bash skills/war/assets/assert-done-when.test.sh`
- requiresTest: true
- requiresPackaging: false
- deps: [1.1]
- target repo: superproject

## Phase 2 — Release

### Task 2.1: Version slots, lock-step

- Files: `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, `README.md`
- Plan slice: bump all four slots together — `plugin.json` `version`, `marketplace.json`
  `metadata.version` and `plugins[0].version`, the `README.md` `## Status` blurb (replace-in-place,
  never an empty field, no badge) — to the **next free patch above the live integration base at land
  time**; never a resolved version literal (any version literal in this plan or the campaign roadmap is
  non-authoritative). Expected integration base: the tip after whichever 2026-08-06 campaign
  predecessors the roadmap sequences ahead of this plan (ADR 0011 stack-and-plow) — no predecessor
  **must** land first for this plan's correctness (A6: no upstream dependency; this group is itself the
  declared upstream of three siblings, which land after), so if this plan launches first the base is the
  master tip at campaign launch. Standalone fallback: run through plain `/war`, resolve the next free
  patch from the four slots themselves. The Status blurb names the watchdog group kill, the done-when
  evidence capture (`done_when_log_path`), the pinned baseline-proceed precedence, and the CLAUDE.md
  floor enumeration — quoting only identifiers that exist in the landed diff (release-blurb lessons:
  count words match the enumeration; quoted literals byte-match landed identifiers; guard semantics
  stated no wider than the implementation — the group kill contains a process group, it does not reach a
  new-session daemon).
- Done when: `node --test skills/war/assets/version-slots.test.mjs`
- requiresTest: false
- requiresPackaging: false
- deps: []
- target repo: superproject

## Deferred validations (backstops)

- The manual same-scope survey halves of End states 3, 9, 11, and 12 · why deferred: a hand-scan cannot
  be a mechanical gate member; done-report-only evidence, which gate-audit reads as SOFT and never a hold
  (deliberately-uncommitted-probe lesson class) · runner: the owning task's worker (1.4 for End state 3,
  1.1 for End state 9, 1.2 for End state 11, 1.3 for End state 12) records each outcome — mandatory
  statement even when "zero stragglers"; the Lead re-runs all four greps at phase close.
- The grandchild case's pre-fix demonstrated red (drop the group kill → the orphaned `sleep 60` holds the
  inherited stdout fd, the command-substitution capture blocks, and the wall-clock assert reds) · why
  deferred: a delete-and-trace mutation run is uncommittable by design — the committed case with its
  capture-through-substitution shape is the standing non-vacuity guard · runner: Task 1.4's worker runs
  it locally and records the red in the done report; gate-audit reads it SOFT.
- The residue guard's before/after green proof (the restored line-anchored assert is green at the base —
  re-verified, not assumed) · why deferred: the "before" half is a pre-change suite run, uncommittable ·
  runner: Task 1.1's worker runs the suite before and after the restore and records both in the done
  report; the committed suite run is the standing guard.
- End state 8's hand-verified placement check (the card's precedence sentence sits inside step 7's
  done-when **exit 1** bullet, not merely somewhere in the file) · why deferred: the token grep and the
  D3 anchor pin the sentence's PRESENCE on both surfaces mechanically, but placement-within-the-bullet
  is a hand-read no committed assert makes · runner: Task 1.1's worker records the placement in the done
  report (mandatory statement); the Lead re-reads step 7 at phase close.
- The new-session-daemon containment ceiling itself · why deferred: unreachable on bash 3.2 (no
  `setsid`) — a ratified deferral, not a validation this plan can run; the rewritten residual note and
  the grandchild case's banner document it · runner: none mechanical — a field leak recurrence files an
  issue.

## Notes / conscious deviations

1. **The 1.4 → 1.1 deps edge is a content edge, not rule 7's guard-split case** — no mechanical drift
   guard is split across tasks (the grandchild case travels with the group kill in Task 1.4; Task 1.1's
   new asserts guard facts Task 1.1 itself authors). The edge exists because Task 1.4's rewritten STDOUT
   header states the capture contract Task 1.1 builds: at the frozen phase base that header would be
   the exact #1370 defect class (an unbacked downstream-capture claim) to its auditor. The
   "defined-but-not-yet-emitted; produced in Task 1.1" annotation was the considered alternative; the
   edge is available with no cycle, makes the header true at Task 1.4's audit base, and matches the
   escape-guard-exit-contract plan's Note-5 precedent. Logged for /red-team ratification.
2. **Task 1.1's four-file footprint is forced, not preferred.** The both-surfaces law binds
   `workflow-template.js` + `agents/war-refiner.md` into one commit; the return-contract enumeration
   duty (doc-return-contract lesson) binds `skills/war/references/schemas.md` into the same commit as
   the card's `## Return` line; and the same-file rule folds every `workflow-template.test.mjs` edit —
   the capture/precedence pins AND the independent residue-guard/anchor fixes (findings 6/8/11/12/13) —
   into the one task that owns that file. Splitting the test hygiene out would violate file-disjointness
   for zero parallelism gain.
3. **D3 registry anchor extension is invention beyond the spec** (D13): the spec is silent on the
   registry; conversion adds two anchor tokens (`/done_when_log_path/i`,
   `/never proceeded over as baseline debt/i`) to the existing done-when floor row so the grown
   directive — capture AND precedence — stays censused on both surfaces; the precedence token doubles as
   End state 8's mechanical sentence pin (zero hits on either surface at the base, so it cannot pass on
   pre-existing `baseline-proceed` prose). The finding-4 canonicality concern applied forward. No new
   row, no floor-count change. Logged for /red-team ratification.
4. **Already-fixed findings are scoped to citation-only closure** (re-verified at `6fff2ee` at
   conversion): #1338 finding 2 (`unset CDPATH` under `PROG=`, suite case 20), #1340 finding 3 (the
   CONTEXT.md done-unmet route entry), #1340 finding 4 (the D3 done-when floor registry row). No code
   change; the phase-close checkpoint cites them when closing the issues.
5. **CLAUDE.md pin census** (Context 10). No structural test pins the two floor sentences' bytes, so no
   pin update rides Task 1.2; the binding constraints are the `prompt-surface-budgets.test.mjs` byte
   budget (13,523 B measured at the conversion base; advisory 14,336 B; hard 16,384 B), the ratified
   pointer line (byte-identity across three surfaces, `war-config.test.mjs`), and the
   `## Doctrine placement` mirror (`skill-doc-contracts.test.mjs`) — the first is re-proven by End
   state 11's suite run, the latter two are untouched by construction.
6. **Contention honesty / downstream spine** (A6). This plan has no upstream predecessor in the
   2026-08-06 batch; three sibling groups declare it their upstream — `verdict-adjudication-integrity`
   (`dependsOn`, shares `CLAUDE.md`), `gate-audit-finding-routing` (lands-after, shares
   `workflow-template.js` + `workflow-template.test.mjs`), `structural-pin-extractors` (binding
   lands-after, disclaims this file family) — and `handoff-schemas-contract` is transitively downstream
   (after `gate-audit-finding-routing`; shares `schemas.md`, `war-refiner.md`, `workflow-template.js`).
   The roadmap must carry this plan → those three as dependency-spine edges (not merely contention
   rows) plus `## Shared-file contention` rows for the shared files; the trailing release-slot overlap
   with every sibling plan is the sanctioned stacked-release pattern, not contention. Cross-plan
   serialization is ADR 0011's job; /war-campaign's sweep contention check re-verifies.
7. **Posterity survivors.** Historical artifacts keep the retired wordings and are never retro-edited
   (ADR 0046 posture): the landed 2026-08-05 precision-chain plan, its red-team report, issues
   #1338/#1340's verbatim finding quotes, and the two lesson bodies all carry "briefly outlive",
   "strictly stronger", "Exit codes and stdout are untouched", and the old capture claim. Every
   OLD-absent check here is scoped to the single live surface its End state names — the floor script
   (End state 3), the engine suite (End state 9), the test floor's suite (End state 12).
8. **Intent provenance.** Part 1 and the intent block are distilled from the ratified source spec —
   itself synthesized from the code-verified lesson issues #1365/#1370, the war-followup issues
   #1338/#1339/#1340, and #1360; the spec's two flagged [assumed] design calls are carried as A2/A3
   with their veto fallbacks intact; conversion-time judgments (D12, D13, A6, A7, Notes 1–5) are logged
   for /red-team ratification.

## Open decisions

None. The spec's design tree is fully resolved; the two spec-flagged veto points (A2 wire-over-retract,
A3 floor-overrides-carve-out) and every conversion-time judgment are logged above for /red-team.
