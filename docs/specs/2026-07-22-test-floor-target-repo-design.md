# Target-repo-aware test floor — per-phase re-evaluation of the `--afk` testPattern proposal + near-miss diagnostics on `no-test`

**Source issues:** #983 (test-floor null-pattern default is plugin-repo-scoped; `--afk` sanity floor
decides once at Setup and never re-proposes — cost: 2 full phase relaunches).

**Sequencing:** this spec lands **after** the `merge-land-resilience` group — both edit the
refine/merge section of `skills/war/assets/workflow-template.js` (the floor-retry sub-loop region)
and overlapping `skills/war/SKILL.md` prose. The survey manifest carries this edge authoritatively;
this line is the human-readable record.

## 1. Context — the gap / problem

Run `war-game-benchmark-harness-2026-07-21` (manifest `phases.3.attempt3`, CONFIRMED root cause):
a diff approved by all 3 audit seats in every round, gate green, was blocked solely by the test
floor — 3 consecutive `no-test` verdicts, add-test budget exhausted (`no-test:exhausted`), each
add-test worker a no-op because the tests were already present. One phase hold, two full
relaunches, ~5.6M tokens / ~3h burned on a floor false-negative. Two compounding defects:

1. **The null-testPattern default in `assert-test-in-diff.sh` is plugin-repo-scoped.** The default
   match set (`match_default`) is `skills/**/*.test.mjs` ∪ `**/*.test.sh` — deliberately the WAR
   plugin repo's own gate-discovery set (operator decision 2026-06-29, recorded in the script
   header). On a target repo whose node tests live at `runner/ lib/ grader/ packs/ *.test.mjs`, an
   mjs-only diff can **never** satisfy the floor. The default is a grammar for this repo, silently
   applied to every target repo.
2. **The `--afk` sanity floor is one-shot at Setup.** Setup correctly proposed `'*.test.mjs'`, but
   the target repo was docs-only pre-scaffold, so the each-token-matches-≥1-file check
   (`skills/war/SKILL.md`, the "`--afk` sanity floor" bullet under "Test-floor pattern") rejected
   it and fell back to `null` — defect 1. By phase 3 the repo had 7 matching files, but nothing
   re-evaluates the proposal; the run stayed on the plugin-scoped default until the operator
   intervened with `plan.testPattern`.

A third aggravator: the floor is **silent about why** it failed. On exit 1 the script prints an
empty summary to stdout and nothing else; attempt 3 burned three add-test rounds before the
pattern mismatch was visible to anyone.

Issue #983 carries three hypothesis-labeled proposals. This spec **adopts** per-phase
re-evaluation of the rejected proposal (proposal 1, Lead-side) and the near-miss diagnostic
(proposal 2), and **rejects** floor-time derivation of the null default (proposal 3) — see D7.

## 2. Pivotal constraints

- **ADR 0006 — deterministic test floor.** The floor is a tested shell guard with a load-bearing
  exit contract (0 = test found, 1 = the `no-test` route, 2 = git error, never conflated). Exit
  semantics, the coarse floor-vs-semantic-ceiling split, and bash-3.2 compatibility are untouched.
  The floor's `*.test.sh` union arm (`match_sh_suite`, mirroring `resolveGate`'s unconditional
  discovery) preserves floor ⊆ gate under any pattern — untouched.
- **ADR 0019 — target-derived execution values, fallback byte-identical.** `overrides.testPattern`
  rides config → `args.plan.testPattern` → the `--pattern` arg, exactly like `plan.gate`; it is
  never parsed out of the gate command. `null` ⇒ today's hardcoded defaults, byte-identical. Any
  change here must keep the null path byte-identical — re-evaluation may only *adopt the Setup
  proposal earlier-recorded*, never mint new behavior on the null path.
- **ADR 0005 / enum discipline.** `MERGE_RESULT.status`, `HARD_ESCALATION_REASONS`, and
  `KNOWN_LAND_DECISIONS` are untouched. The diagnostic rides a new **orthogonal optional field**
  (the `gate_failure_class` precedent), never a status value.
- **Both-prompt-surface split rule.** The refiner's floor invocation is instructed on two surfaces:
  `agents/war-refiner.md` step 4 (standing) and the string-built merge-task prompts in
  `workflow-template.js` (dispatched — three `assert-test-in-diff.sh` sites: initial merge,
  floor-retry re-merge, baseline-proceed). A refiner behavior change edits **both in the same
  commit**. The D3 both-surfaces directive registry in `workflow-template.test.mjs` has an exact
  no-slack row-count floor (#693) whose edits are serialized through a separate dependsOn chain —
  this spec deliberately stays **out** of that registry (D8).
- **The Workflow sandbox has no shell/fs.** The engine cannot Glob a tree; any re-evaluation that
  reads the target repo must run Lead-side (prose) or in a dispatched agent.
- **The floor's stdout is a read contract.** The refiner reads the script's stdout (empty = no
  matched test files). Diagnostics must ride **stderr**; stdout stays byte-identical.
- **The false-positive side is already guarded downstream.** The post-merge gate-audit
  `execution-evidence` pass makes a mapped-test-provably-unrun a HARD finding — loosening the
  false-negative side (this spec) does not open the false-positive side (stated in #983; verified
  against the SKILL.md sanity-floor bullet's residual note).
- **`war-config.mjs` glob-safe charset validator** on `overrides.testPattern` is unchanged; the
  adopted value is Setup's own already-validated proposal.

## 3. Resolved design tree

| # | Decision | Options considered | Resolution + why |
|---|----------|--------------------|------------------|
| D1 | Where re-evaluation runs | (a) Lead-side at each phase launch; (b) engine-side at first floor failure; (c) a dispatched re-check agent | **(a) Lead-side, per phase launch**, as prose in `skills/war/SKILL.md`. The sandbox has no fs (cannot Glob); an extra agent spawn per phase buys nothing prose can't. A mid-phase pattern flip (b) would also break within-phase determinism of the pinned `plan.testPattern`. Phase-start re-check is exactly the manual recovery that fixed the incident run. |
| D2 | What gets re-evaluated | Re-derive a fresh proposal each phase; re-check only the rejected Setup proposal | **Re-check only the original Setup proposal's token set** with the same each-token-matches-≥1-file Glob rule against the *current* tree. Adoption is monotonic (`null` → proposal, once); never invent a new pattern mid-run, never revoke an adopted one. Scoped to the `--afk` sanity-floor fallback path — interactive Setup has no mechanical rejection (the operator confirms). |
| D3 | Where the pending proposal lives | New ledger field; extend the existing ledger note | **Extend the existing sanity-floor ledger note** to record the rejected proposal verbatim (proposal string + which tokens matched 0 files). The per-phase re-check reads it; adoption appends an adoption note. No new resume authority — git > labels > ledger stands (ADR 0008); the note is a lagging record like the rest of the ledger. |
| D4 | Diagnostic location + channel | Refiner-prose heuristic; Workflow-side check of worker `files_changed`; script-side stderr | **Script-side, in `assert-test-in-diff.sh`, stderr only, exit-1 path only.** The script already holds the changed-file list and the active pattern set; prose heuristics drift, and the worker's self-report is the untrusted field (ADR 0006 sub-decision 2). Exit codes and stdout are byte-untouched. |
| D5 | Near-miss heuristic | Exactly `*.test.*` (the incident shape); a fixed conventional set; derive from the repo | **Fixed documented set:** `*.test.*`, `*.spec.*`, basename `test_*`, `*_test.*`. Covers node/pytest/go conventions at equal cost; diagnostic-only, so a false positive costs one stderr line and can never block. Deriving from the repo is D7's rejected floor-time derivation. |
| D6 | How the diagnostic reaches the add-test worker | Refiner free-prose in `gate_output`; a new optional `MERGE_RESULT` field | **New optional `floor_diagnostic` (string) on `MERGE_RESULT`** (orthogonal-field precedent: `gate_failure_class`). All three dispatched `assert-test-in-diff.sh` prompt sites + `agents/war-refiner.md` step 4 instruct: on exit 1, capture the script's stderr verbatim into `floor_diagnostic` alongside `status: 'no-test'`. The add-test `fixPrompt` interpolates it (pt-tagged) when present; the `no-test` exhaustion escalation and its `auditLog` entry carry it as detail. Absent ⇒ every prompt byte-identical to today. Fail-open end to end. |
| D7 | Derive the null default from the target repo at floor time (issue proposal 3) | Adopt; reject | **Rejected.** A floor-time Glob makes the floor's verdict depend on tree state outside the diff — non-deterministic across the serial merge queue (ADR 0006) — and breaks ADR 0019's byte-identical null fallback. The plugin-scoped default stays; D1/D2 make the Setup proposal actually stick, and D4 makes any residual mismatch visible on the first failure instead of the third relaunch. |
| D8 | Drift-guard home for the new refiner directive | New D3 both-surfaces registry row (+ row-count bump); extend the standalone testPattern drift-guard test | **Extend the existing standalone testPattern both-surfaces drift-guard** in `workflow-template.test.mjs` (the "testPattern drift-guard (validation 6, --pattern half)" test and its threading sibling) with the `floor_diagnostic` capture tokens on both surfaces. The diagnostic is fail-open advisory, not a correctness-critical directive, so the D3 registry (whose no-slack row count is contended by a serialized chain) is not its home. If review later rules it correctness-critical, the row addition must serialize behind that chain — recorded in §8. |

## 4. Mechanics

**`assert-test-in-diff.sh` (near-miss diagnostic).** After the match loop, when `found` is 0 and
the changed-file list is non-empty: scan the same list against the D5 near-miss set. If any path
matches, print a short stderr block naming (a) the **active pattern set** — the custom `--pattern`
tokens when supplied, else the two default patterns, plus a note that the `*.test.sh` union arm is
always in force — and (b) each near-miss path. Then exit 1 exactly as today. No scan on exit 0; no
scan on the exit-2 path (a diff that could not be computed has no file list). stdout keeps its
empty-summary contract. Header comment documents the near-miss set and its diagnostic-only nature.
bash-3.2 `case` matching, same idiom as `match_sh_suite`.

**Refiner (both surfaces, one commit).** `agents/war-refiner.md` step 4's exit-1 bullet and all
three dispatched merge-task prompt sites in `workflow-template.js` (the initial merge-task prompt,
the floor-retry re-merge prompt, and the baseline-proceed merge prompt — every site that renders
`testPatternArg`) gain: on exit 1, include the script's stderr diagnostic verbatim as
`floor_diagnostic` in the returned `MergeResult`; absent stderr ⇒ omit the field.

**Workflow engine (`workflow-template.js`).** `MERGE_RESULT` gains optional
`floor_diagnostic: { type: 'string' }` with a comment marking it fail-open advisory (never routed
on; ADR 0005 enums untouched). In the floor-retry sub-loop, the ADD_TEST `fixPrompt` appends —
only when `floorMr.floor_diagnostic` is a non-empty string — a paragraph quoting the diagnostic
and instructing the fix-worker to reconcile the diff's test files against the **active pattern**
(the mapped test may already exist under a path the pattern misses; in that case the correct fix
is often nothing the worker can do — report blocked naming the mismatch rather than adding a
duplicate test). The `no-test` exhaustion `escalated` entry and its `auditLog` entry carry the
last diagnostic as `detail` when present. All interpolation is `pt`-tagged (an undefined value
must never render — the pt-tagged-prompt-value-identity lesson).

**Lead (`skills/war/SKILL.md`).** Two prose edits:
1. The "`--afk` sanity floor" bullet: on fallback to `null`, the ledger note records the rejected
   proposal **verbatim** plus the zero-match tokens (D3).
2. The per-phase Workflow-launch step (the "Run one Workflow per phase" paragraph, where
   `overrides.testPattern` is threaded into `args.plan.testPattern`): when the ledger carries a
   pending rejected proposal and the threaded value is still `null`, re-run the same
   each-token-matches-≥1-file Glob check against the current tree; every token now matching ⇒
   adopt the proposal as this and subsequent phases' `plan.testPattern` and append an adoption
   ledger note; otherwise keep `null`, proposal stays pending. Monotonic, `--afk`-fallback-scoped,
   never a new interactive ask.

**`skills/war/references/schemas.md`.** The `overrides.testPattern` paragraph gains the per-phase
re-evaluation sentence (the value is per-phase-resolved: pinned at Setup, with the `--afk`
rejected-proposal re-check able to adopt the Setup proposal at a later phase launch) and the
`floor_diagnostic` field is documented beside the other optional `MergeResult` fields.

**One-shot-prose sweep (token sweep + mandatory manual survey).** Grep `sanity floor` and
`testPattern` across `skills/` and `docs/` (excluding `docs/specs/` history and `.claude/`);
handle every match that states or implies the one-shot/per-run semantics. **Grep is a floor, not a
ceiling — after the grep, hand-scan the same-scope prose, comments, and tests of each target file
for same-meaning siblings that encode one-shot-ness in different words.** Survey-derived
corrections already identified (verified against the live tree):
- `skills/war/SKILL.md` "Test-floor pattern" bullet: "floor ⊆ gate is **one Setup decision**, so
  the operator confirms both at once" — stays true for the *confirmation*, but must no longer read
  as the final word on the value; qualify with the re-evaluation.
- `skills/war/references/schemas.md`: "the Lead threads the **pinned** value into the per-phase
  Workflow" — "pinned" now means per-phase-resolved; reword.
- `skills/war/assets/assert-test-in-diff.sh` header: "`--pattern` … threaded **per-run** from the
  run's overrides.testPattern" — becomes per-phase-resolved.
- `skills/war/assets/workflow-template.js` top-of-file args comment block ("testPattern = the
  run's pinned overrides.testPattern") — same reword.
Any further stragglers the implementing worker finds in the same scopes are listed in its done
report as survey-derived corrections.

## 5. Surface changes

- `skills/war/assets/assert-test-in-diff.sh` — near-miss stderr diagnostic + header docs.
- `skills/war/assets/assert-test-in-diff.test.sh` — diagnostic cases (§10, criteria 1–4).
- `skills/war/assets/workflow-template.js` — `MERGE_RESULT.floor_diagnostic`; three merge-task
  prompt sites; ADD_TEST `fixPrompt` interpolation; exhaustion escalation detail; comment rewords.
- `skills/war/assets/workflow-template.test.mjs` — extended testPattern threading + standalone
  both-surfaces drift-guard tests; fixPrompt presence/absence pair; escalation-detail assertion.
- `agents/war-refiner.md` — step 4 exit-1 capture instruction (both-surface rule; not in the
  survey's expected family, but the binding both-prompt-surface constraint forces it into the same
  commit as the dispatched-prompt edits).
- `skills/war/SKILL.md` — sanity-floor ledger record; per-phase re-evaluation step; sweep rewords.
- `skills/war/references/schemas.md` — testPattern re-evaluation prose; `floor_diagnostic` doc.

## 6. New domain terms (CONTEXT.md)

- **Near-miss diagnostic** — the advisory stderr block `assert-test-in-diff.sh` emits on exit 1
  when the diff contains test-shaped files the active pattern set does not match; never affects
  the exit code.
- **Pending testPattern proposal** — a Setup-proposed test-floor glob set the `--afk` sanity floor
  rejected (zero-match tokens), recorded in the ledger and re-checked at each phase launch until
  adopted.

## 7. Recommended ADRs

None. This refines ADR 0019 instance 1 *within* its recorded decision ("read the target repo
first, fall back to today") — re-evaluation re-reads the target at phase granularity; the null
fallback stays byte-identical. ADR 0006's floor contract is untouched. The originating specs stay
uncorrected per convention.

## 8. Open risks / implementation notes

- **Residual: the scaffolding phase itself.** A phase whose own diff introduces the repo's *first*
  files matching the proposal still trips the floor (the phase-start re-check ran against a tree
  without them). Mitigation: the near-miss diagnostic names the mismatch in round 1's add-test
  prompt and in the exhaustion escalation, and the post-hold relaunch's phase-start re-check then
  adopts. Accepted — closing it fully would require diff-aware re-evaluation (rejected with D7 for
  the same determinism reasons).
- **stderr must survive to the refiner.** The floor is invoked bare today; any future
  `2>/dev/null` on the invocation would silently eat the diagnostic. The dispatched prompts and
  war-refiner.md step 4 state the capture explicitly, which is the guard.
- **pt-tag the interpolation.** `floor_diagnostic` is optional; the fixPrompt append must be
  conditional and `pt`-tagged so an absent value renders nothing (never the string `undefined`).
- **D3 registry contention (from D8).** If the diagnostic-capture directive is later ruled
  correctness-critical and moved into the D3 both-surfaces registry, that edit bumps the exact
  no-slack row-count floor and must serialize behind the auditor-guard-ergonomics →
  audit-adjudication-threading → servitor-wrapup-landed-tip chain.
- **Ordering.** Lands after `merge-land-resilience` (shared floor-retry region of
  `workflow-template.js`, overlapping `skills/war/SKILL.md` prose). The implementing plan's base
  is the landed merge-land-resilience tip; anchors in this spec are named constructs, not line
  numbers, for exactly this reason.

## 9. Non-goals / deferred

- **Floor-time derivation of the null default** — rejected (D7), not deferred; the decision is
  recorded so it is not re-litigated per run.
- **Engine-side re-evaluation at first floor failure** — rejected (D1); the phase-start re-check
  plus the relaunch path covers the incident class.
- **Re-proposing fresh patterns mid-run, or re-asking interactively** — out of scope (D2).
- **Any change to the exit-code contract, `MERGE_RESULT.status`, `HARD_ESCALATION_REASONS`,
  `KNOWN_LAND_DECISIONS`, or the `*.test.sh` union arm** — enum discipline and floor ⊆ gate stand.
- **Precise per-task mapped-test floor** — stays rejected per ADR 0006.

## 10. Validation criteria

1. `assert-test-in-diff.test.sh`: a fixture diff adding `runner/x.test.mjs` with no `--pattern` →
   exit 1, stderr names the active default patterns and lists `runner/x.test.mjs`; **stdout is
   still empty** (the refiner's read contract).
2. Same fixture with `--pattern '*.test.mjs'` → exit 0, empty stderr (no diagnostic on success).
3. An exit-1 diff with no near-miss files (docs-only) → stderr byte-identical to today (empty).
4. The exit-2 path (bad ref) emits no near-miss diagnostic.
5. `workflow-template.test.mjs`: with a stubbed `no-test` MergeResult carrying
   `floor_diagnostic`, the dispatched ADD_TEST fixPrompt contains the diagnostic text and the
   reconcile-against-active-pattern instruction; with the field absent, the fixPrompt is
   **byte-identical** to today's (the existing set-minus-arg byte-identity idiom).
6. All three merge-task prompt sites that render `testPatternArg` instruct `floor_diagnostic`
   capture on exit 1, and `agents/war-refiner.md` step 4 carries the same tokens — asserted by the
   extended standalone testPattern both-surfaces drift-guard (validation-6 lineage), token-anchored.
7. `MERGE_RESULT` in `workflow-template.js` lists `floor_diagnostic` as an optional property;
   the `status` enum is byte-unchanged and the existing status-enum drift-guard against the
   canonical `war-config.mjs`/`land-decision.mjs` exports stays green.
8. The `no-test` exhaustion path: the `escalated` entry (reason `no-test`) carries the last
   diagnostic as `detail` when present — asserted in `workflow-template.test.mjs`.
9. `skills/war/SKILL.md` greps: the sanity-floor bullet contains the rejected-proposal-verbatim
   ledger instruction; the per-phase launch step contains the re-check tokens ("each token
   matches ≥ 1", adoption note). `skills/war/references/schemas.md` documents `floor_diagnostic`
   and the per-phase-resolved testPattern.
10. The §4 sweep's survey-derived corrections are applied: no surface under `skills/war/`
    (SKILL.md, schemas.md, assert-test-in-diff.sh header, workflow-template.js args comment)
    still describes `overrides.testPattern` as decided once per run with no re-evaluation.
