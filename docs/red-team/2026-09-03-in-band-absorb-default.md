# Red Team — 2026-09-03-in-band-absorb-default (2026-09-03)
**Verdict:** ADJUDICATED — every blocker and needsDecision row patched and Lead-stamped after one grill sweep; the End-state check forms were re-proven red at base by the round-1 `command-diff` re-run, every other patch is adjudicated, not re-verified
**Rounds:** 1
<!-- Cumulative grill sweeps: the Step-1 seed + this run's sweeps. Strict form — the next run's seeding re-reads exactly this line; an integer, nothing else. -->

Artifact kind: `impl-plan`. Source of truth: the plan's own Part 1 (merged arm). Repo under test: a `git clone --no-hardlinks` of the plan branch at `5362295` (clean; the real worktree carried an uncommitted run-config edit). Model: opus / high from the run config. Round limit 3. Prior report: none, seed 0.

## Attack surface
Spine: claims-vs-reality, executable-proof, coverage-vs-source, consistency-placeholders, dependency-feasibility, intent-vs-plan. Bespoke: `default-flip-old-absent` (executed, mandatory drift-guard probe), `baseline-repro` (executed), `command-diff` (executed), `ledger-files-field` (analyzed), `anchor-check` (analyzed), `enum-mirror-guard` (analyzed). Lead-run: `unguarded-new-mirror` pass, `guard-split-deps-edge` pass, `touched-doc-fact-coverage` two gaps patched pre-run, backstop-legitimacy pass, `judge:` grading vacuous, `ff-topology` not triggered (no merge-topology anchor in the plan). Executed in sandbox: four probes. 12 of 12 probes on target, none dropped.
Fallback: none. Escape guard: exit 0 before and after the run, and again after the re-verify.

## Executed proof
- `default-flip-old-absent` → the nine enumerated surfaces carry four distinct wordings of the old rule; ADR 0013 documents its own exemption from OLD-absent guards; two test files hold presence pins on the old sentence.
- `baseline-repro` → two `fixRounds >= roundLimit - 2` gates, not three; the batch ace reads `fixRounds < roundLimit`; `sweep-raised absorb` occurs three times (two arms plus a census comment); `skills/war/SKILL.md` is 72,712 B at the plan branch tip (1,016 B free); ledger `files` holds the first `- Files:` block only.
- `command-diff` (round 0) → End states 1 to 7 red at base as expected; End state 8 green at base; the End-state 6 chain was unsatisfiable when met (`grep -c` exits 1 on zero matches); End-state 4's multi-file `grep -c` printed no total.
- `command-diff` (re-verify, round 1, attempt 1) → invalid, self-confound: the Lead restored the sandbox plan to its committed text while the probe was reading it, so it graded the pre-patch draft. Recorded, discarded.
- `command-diff` (re-verify, round 1, attempt 2) → rows 1 to 7 and 9 to 11 red at base, row 8 green (19 tests), row 6's `! grep -qi` clause exits 1 at base and 0 after the merged-arm line is removed, all referenced non-deliverable files exist, four Done-when suites green at base. One Major: rows 2 and 3 still used the bare `grep -c … prints at least N` form, so row 3's floor of 4 was not enforced. Patched to the `test "$(grep -c …)" -ge N` form and stamped adjudicated (re-verify attempts exhausted).

## Findings
The gate returned 40 blockers and 29 `needsDecision` rows across 12 probes. They collapse to twelve roots.

### Critical
- [Critical, needsDecision] D3b: the handoff block emits only on `landed` and `held:escalation` → five hold classes have no vehicle for `carriedPhaseClose`. Evidence: `workflow-template.js` handoff gate vs the held-phase drain. Resolution: ruled (root 3).
- [Critical, needsDecision] D5/PIN-7: the two reserve gates are the reserve's only enforcement and ace-side commits still charge `fixRounds` → swapping the gates deletes the reserve the guardrail calls untouched. Evidence: `fixRounds++` at the subset, re-entry, and batch-ace sites. Resolution: ruled (root 1).

### Major
- Gate count: two `fixRounds >= roundLimit - 2` gates exist, the plan said three; the batch-ace gate's disposition was unstated. Patched (root 1).
- `D43` in `skill-doc-contracts.test.mjs` binds three living docs to the retired `roundLimit − 2` arithmetic. Patched into Task 1.3 (root 3 of the factual set).
- Two sweep-raised demote arms sit on exclusive branches; the discard path had no successor. Ruled (root 2).
- D3a said read-only, Task 2.1 said an ace-shaped commit. Ruled (root 2).
- A third `sweep-raised absorb` occurrence lives in a census comment. Patched.
- End state 6's `grep -c … prints 0` broke the `&&` chain and was case-sensitive. Patched to `! grep -qi`.
- ADR 0013 sat in the OLD-absent row against the append-only law and its own exemption idiom. Patched: eight surfaces, ADR NEW-present.
- The old sentence has four live variants and two `ask`-only sentences must survive. Patched: case-insensitive normalized assert scoped to the absorb half.
- Task 1.2's slice named only two of the six occurrences in its own files. Patched.
- The barrier list's trade-off item routes `ask`, so it is not a follow-up barrier, and no token vocabulary existed. Ruled (root 4).
- No canonical source or drift guard for the barrier list across card, prompt, and eligibility doc. Ruled (root 4).
- Purpose said only a barrier may file; End states 3 and 6 file on engine demotions. Ruled (root 4).
- Phase 3 had no End state. Patched: End states 9 and 10.
- Ledger `files` is first-block-only, so D6's exclusion set would fence one task per plan. Ruled (root 5).
- #1547's `## Evidence artifacts` rows were missing from the Evidence-consumed block. Patched.
- `skills/war/SKILL.md` headroom is 1,016 B, not 1,216 B. Patched.

### Minor (18, auto-noted)
`campaign-ledger.mjs` exports nine symbols, not two (patched); only the `economy` preset carries a `run` block (patched); End state 4's multi-file `grep -c` (patched); End state 8 in no Done-when (patched into Task 1.2); ADR 0012 line placed a phase before the construct exists (moved to Task 2.2); `aceRelPath` is block-scoped inside the wave loop (patched: hoist); the `schemas.md` occurrence is uppercase (covered by the case-insensitive assert); test files hold presence pins on the old sentence (covered by Task 1.2's re-key).

## Resolutions applied (grill decisions)
- Root 1, absorb budget vs `fixRounds` → ace-side commits charge `absorbRounds` only; all three ace gates read it; labels and the `Ace-Subset` trailer carry it; relaunch re-derives it from the branch → D5, PIN-7, End state 4, Task 1.2.
- Root 2, terminal pass → one ace-shaped commit then one seat; merged-sweep path only; discard arm stays reworded and carries on a non-final phase; regression forward-reverts then carries or demotes → D3a, PIN-4, End state 6, Task 2.1.
- Root 3, held carry → `carriedPhaseClose` is a top-level phase-return key on every hold, empty array on `landed`; the Lead reads the return; transcript re-derivation is the recorded residual → D3b, End state 7, Task 2.1, Task 3.1.
- Root 4, barrier tokens → `BARRIER_TOKENS` canonical in `land-decision.mjs`, mirrored with a registry row; structured `barrier` field on AUDIT_VERDICT; floor reads the field; `barrier:trade-off` routes `ask`; Purpose names the lawful engine filers → D1, D4, guardrails, End states 1 and 5, Task 1.2.
- Root 5, ledger footprint → new Task 1.4 makes `extractFiles` union every `- Files:` block; the Lead re-extracts at launch → D6, D11, End state 11, Task 1.4, Task 3.1.
- Factual roots (gate count, `D43`, census comment, check forms, ADR exemption, variants, occurrences, Phase 3 End states, evidence rows, byte headroom, minors) → patched in place.

## Adjudications
- Task 1.1's `/war-room` row states the shape only and points at `war-config.mjs` for the value (de-mirror) supersedes the row restating the default — touched-doc probe, pre-run — operator-ratified (2026-09-03)
- Task 2.1's two `schemas.md` rows carry pins in the `done_when_log_path` schema-slot shape supersedes rows without pins — touched-doc probe, pre-run — operator-ratified (2026-09-03)
- "Two `fixRounds >= roundLimit - 2` gates plus the batch ace's `fixRounds < roundLimit`" supersedes "three `fixRounds >= roundLimit - 2` gates" — Context, D5, Task 1.2 — operator-ratified (2026-09-03)
- "Ace-side commits charge `absorbRounds` only" supersedes the implicit continued `fixRounds` charge — D5, PIN-7 — operator-ratified (2026-09-03)
- "One ace-shaped commit then one seat; merged-sweep path only; discard arm stays" supersedes "read-only re-audit; both arms retired" — D3a, PIN-4, Task 2.1 — operator-ratified (2026-09-03)
- "`carriedPhaseClose` on the phase return for every hold" supersedes "handoff key" — D3b, End state 7 — operator-ratified (2026-09-03)
- "`BARRIER_TOKENS` enum in `land-decision.mjs`, structured `barrier` field, three follow-up barriers plus one ask route" supersedes "four prose barriers matched by substring" — D1, D4, End states 1 and 5 — operator-ratified (2026-09-03)
- "Only a seat-cited barrier tag or a logged engine demotion may file an issue" supersedes "only a barrier from the closed list may file" — Purpose — operator-ratified (2026-09-03)
- "The Lead re-extracts footprints with the exported `extractFiles` at launch; Task 1.4 unions every `- Files:` block" supersedes "no plan-file re-extraction, no new export" — D6, D11, Task 1.4, Task 3.1 — operator-ratified (2026-09-03)
- Eight living surfaces in the `old-default-absent` row, ADR 0013 NEW-present by amendment, supersedes nine surfaces with ADR 0013 OLD-absent — Task 1.3, End state 2 — operator-ratified (2026-09-03)
- `skills/war/SKILL.md` 72,712 B / 1,016 B free at `5362295` supersedes 72,512 B / 1,216 B — Context, A8 — AI-declared

## Residual risk
- `agents/war-auditor.md` has 757 B of hard headroom. The D1 sentence rewrite plus the `barrier` field clause must be net-neutral or evict a paragraph to `disposition-eligibility.md` (A8).
- The `filing-floor` in-diff arm depends on `MERGE_RESULT.diff_files` from the refiner's merge dispatch (A7). Absent list ⇒ the arm skips with a log.
- A Workflow that throws before returning loses `carriedPhaseClose`. The Lead re-derives from transcripts (recorded residual, Task 3.1).
- The study rerun backstop needs two live runs after the release.
- The patched End-state checks were re-verified red at base by the round-1 `command-diff` re-run; rows 2 and 3's final form and every other patched blocker are adjudicated, not re-proven.
- Gate summary at terminal: 12 of 12 probes on target, 40 blockers and 29 needsDecision rows all stamped, 17 minors auto-noted, `routeUpstream: false`.
