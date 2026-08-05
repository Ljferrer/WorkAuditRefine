# Precision chain & loop-breaker — the engine consumes the authoring contract

## Context — the gap / problem

The authoring contract landed (ADR 0044): the merged template now carries the done-when law,
the D5 End-state tag set, evidence tags, and a required Assumptions ledger (verified:
`skills/war-strategy/SKILL.md` §2 at `480cf30`). The execution side consumes none of it —
the token `doneWhen` appears nowhere in `workflow-template.js`, `schemas.md`, or
`skills/war/SKILL.md` (verified: grep at `480cf30`); the gate-audit dispatch passes
`task.planSlice` prose as the acceptance criteria (verified: the `mergedTasksForGateAudit`
push in `workflow-template.js` at `480cf30`); `acceptance_criteria_covered` is declared in the
`WORKER_RESULT` shape, `schemas.md`, and `agents/war-worker.md` and consumed by no engine
site (verified: grep at `480cf30`); the fix-family prompts (`FIX_NEEDED`, `ADD_TEST`, the
ace sweep) say "keep the gate green" without carrying the gate command the primary worker
dispatch carries (verified: prompt builders in `workflow-template.js` at `480cf30`);
`assert-test-in-diff.sh` prints nothing on exit 0, so "mapped test" has no mechanical
definition anywhere (verified: its Result section at `480cf30`); `phase.endState` is a bare `string[]`
and handoff End-state statuses are the closed set met/unmet/deferred/out-of-scope keyed on
verbatim condition text — executed evidence exists for none of them (verified: `schemas.md`
+ the endState assembly in `workflow-template.js` at `480cf30`). The operator-reported symptom this
chain exists to close: "getting to the end of a run and it's just a bit imprecise. Tests
too" (user).

On the loop side, ADR 0043 landed `ADJUDICATED` as a gate-emitted proceed verdict with the
stamp-never-remove mechanic, and Step 5 bounds re-verification at ≤ 2 rounds per blocker —
but nothing counts rounds cumulatively across `/red-team` invocations, no config key bounds
them, and no exit routes chronic under-specification back to the interview (verified:
`skills/red-team/SKILL.md` Step 5 + grep for round/routeUpstream tokens at `480cf30`).
`/war-campaign` step 3 is one sentence with an undefined "Unresolvable" halt predicate, and
step 2 commits the plan onto `dev/<slug>` *before* hardening — a red-team-patched plan
never reaches the workers (verified: SKILL.md steps 2–3 at `480cf30`); the campaign ledger's
own-key list carries no rounds field (verified: `campaign-ledger.mjs` `record()` at `480cf30`). Round census
across the 12 newest reports (2026-07-24 →): median ≈ 1.5 invocation-rounds, one 7-round outlier whose
rounds 2 and 4 were entirely patch-induced — pre-ADR-0043 behavior (verified: report + git
census run in this conversation, 2026-08-05). The landed plan's Non-goals defer exactly
this scope — "Engine/floor/schema slot consumption → the precision-chain spec · red-team
round budget / route-upstream → the loop-breaker spec · /war-review telemetry → with the
loop-breaker" — and its backstops assign this plan two `/war-review` telemetry rows
(verified: `docs/plans/2026-08-04-interview-and-authoring-contract.md` at `480cf30`).

## Pivotal constraints

- **ADR 0002 — auditors are read-only.** Every executed check runs refiner-side; audit
  seats read teed artifacts, never run commands. The auditor git allowlist is not widened.
- **ADR 0005 — enum discipline.** `done-unmet` is appended to the canonical
  `HARD_ESCALATION_REASONS` export in `land-decision.mjs` AND its hand-mirrored copy in
  `workflow-template.js` in the same task, with the mirror-registry row; the drift guard in
  `land-decision.test.mjs` is the arbiter. `held:workflow-error` never joins the set.
- **ADR 0043 — verdict precedence is untouched.** `routeUpstream` is a typed gate *output
  field*, never a sixth verdict and never a `KNOWN_LAND_DECISIONS` member.
- **ADR 0042 — budgeted surfaces.** Loop doctrine lives in a new
  `skills/red-team/references/loop-budget.md` behind a fixed-shape trigger pointer;
  `skills/red-team/SKILL.md` gains only the pointer and the mechanics lines.
- **Prompt-surface split.** Any worker/auditor/refiner behavior change lands in the standing
  card (`agents/*.md`) and the dispatched prompt (`workflow-template.js`) in the same task.
- **Floor family contract.** New floors exit 0/1/2; exit 1 is the named route, exit 2 is a
  git/env error and never collapses into the floor status (ADR 0040 grants env-class one
  retry).
- **Legacy byte-identity.** A plan with no `Done when:` and untagged End states dispatches
  byte-identical prompts (absent ⇒ `''` set-minus pattern) and bare `endState` strings
  normalize to the judgment path — no retro-editing of landed plans.
- **ADR 0011 — stack-and-plow.** A campaign never skips past a held plan; everything above
  it is stale by construction.
- **ADR 0013/0014 — intent provenance.** End-state parsing extracts verbatim from either
  intent heading; the Lead tags nothing the plan does not carry.

## Resolved design tree

| # | Decision | Resolution | Source |
|---|----------|------------|--------|
| D1 | `Done when:` enforcement posture | blocking `done-unmet` floor route, the `no-test`/`ADD_TEST` pattern (bounded fix sub-loop under `run.roundLimit`) | (user) Q1 |
| D2 | End-state `check:` consumption | refiner executes each claimed `check:` once at the land barrier, tees per-condition artifacts, gate-audit verifies from artifacts; a check identical to the phase gate cites the gate log instead of re-running | (user) Q2 |
| D3 | Loop budget typing | gate-computed: `run.redteamRoundLimit` (default 3, economy 2); gate takes/echoes rounds and emits `routeUpstream` by pure arithmetic — no NLP | (user) Q3 |
| D4 | Campaign consumption | three-arm step-3 triage; patched plan + report committed onto `dev/<slug>`; `--redteamRounds` recorded; `ADJUDICATED` proceeds unattended under `--afk` | (user) Q4 |
| D5 | Check-vacuity posture | named residual — red-green floor deferred to a backstop row pending `done-unmet` field data | (user) Q5 |
| D6 | Fix-family prompt truth | `FIX_NEEDED` / `ADD_TEST` / `PACKAGE_IT` / ace gain `Gate:` + `Done when:` clauses (absent ⇒ `''`) | (verified: prompt builders vs the primary dispatch in `workflow-template.js` at `480cf30`) |
| D7 | Mapped-test definition | `assert-test-in-diff.sh` emits matched paths on exit 0 → `MergeResult.mappedTests` → gate-audit greps them in the captured gate log; "provably unrun mapped test" becomes mechanical | (verified: the gate-audit HARD trigger + `assert-test-in-diff.sh` Result section at `480cf30`) |
| D8 | End-state silence semantics | handoff status set gains `unverified`; a claimed condition no seat attests maps to `unverified`, never `met`; whole-pass absence stays all-`deferred` | (user) Q2 — design consequence of D2 |
| D9 | `acceptance_criteria_covered` | repurposed: worker-declared claimed End-state ids, cross-checked by the gate-audit seat | [assumed: A1] |
| D10 | Rounds seeding | the report's `**Rounds:**` header carries the cumulative count, incremented per invocation; a report whose header is absent — or whose value does not parse as a bare integer — seeds 0 (fail-open) | [assumed: A2] |
| D11 | Executed-command hygiene | plan-authored `Done when:`/`check:` commands get the `overrides.testPattern` charset/embedding discipline plus a timeout; a hung command fails its dispatch, never stalls the merge queue | (user) Q2 |
| D12 | Telemetry home | `/war-review` ratifies the two deferred rows (rounds-per-plan trend; interview length) plus a per-plan rounds row, rendered `n/a` when unsourceable | (user) Q4 |

## Assumptions ledger

| ID | Assumption | Basis | Blast radius if wrong | Check |
|----|-----------|-------|----------------------|-------|
| A1 | `acceptance_criteria_covered` is repurposed (claimed End-state ids), not deleted | it gains its first consumer in the gate-audit cross-check | operator prefers deletion → two-line change in Task 3.2's files | echoed in the interview's Defaulted-decisions recap (ratified) |
| A2 | a report whose `**Rounds:**` header is absent — or whose value does not parse as a bare integer — seeds 0 prior rounds (fail-open) | back-compat: reports generally predate the header; two carry Rounds lines already at `480cf30` — `2026-08-05-interview-and-authoring-contract.md` (`**Rounds: 4**`, integer form, seeds correctly) and `2026-07-26-war-memory-cli-correctness.md` (`**Rounds:** round 0 (…) → round 1`, non-integer form, must seed 0) | old plans hit the limit later than deserved | `red-team-gate.test.mjs` seeding rows (Task 4.1) |
| A3 | timeout + charset validation suffice for refiner-executed plan commands | `overrides.testPattern` embedding discipline precedent | a slow-but-legit check false-fails → escalation, ADR 0040 retry | `assert-done-when.test.sh` timeout fixture (Task 2.1) |
| A4 | no in-flight campaign owns these files | 2026-08-04 campaign landed at `480cf30`; every plan in all nine ledgers at the main checkout reads `landed` (only 2026-07-14 carries a campaign-level `complete` status) — no in-flight owner | serial-merge rebase conflicts | ledger check at `/war` launch |
| A5 | `phase.endState` widening keeps consumers fail-open (bare strings normalize) | schemas.md is the contract layer; consumers update in the same phase | handoff readers break on shape | End state 9's registry rows + `/red-team` sandbox probe, pre-land |
| A6 | ADR 0045 is the next free number | `ls docs/adr/` 2026-08-05 (0044 highest) | rename at land | re-`ls` at Task 5.3 start |
| A7 | release is the next free **minor** above the live base (0.17.0 at authoring — non-authoritative snapshot) | operator-ratified 2026-08-05 (minor bump); live slots at 0.16.0 | monotonic-floor red at land | `version-slots.test.mjs` |

## Non-goals / deferred

Red-green / mutation floor (backstop row, D5) · gate-typing the fast-fail thresholds
(backstop row) · auditor slice-precision lens duty · worker assumptions in `WorkerResult` ·
a `/war` intake executor gate beyond the done-when law · handoff `planDefects` telemetry ·
`/survey-corps` changes · track playbooks · any auditor-capability widening.

## New domain terms · Recommended ADRs

CONTEXT.md: done-unmet route · land-barrier check · mappedTests · `unverified` (End-state
status) · Rounds header · route-upstream · loop budget. One ADR (0045) ratifies the loop
budget + route-upstream contract (Task 5.3).

## Commander's Intent

- **Purpose:** what the authoring contract writes, the run now proves — a task merges only
  when its own acceptance command passes, an End state is `met` only on executed evidence,
  and a plan that cannot stop churning in red-team is routed back to the interview instead
  of ground forever.
- **Method:** thread `Done when:` through the engine to a blocking refiner floor (the
  no-test pattern); execute `check:`-tagged End states at the land barrier and verify by
  artifact, never judgment; count red-team rounds in the gate and route chronic
  under-specification upstream; triage at the campaign seam. Auditors stay read-only
  (ADR 0002) — the refiner executes everything.
- **End state:**
  1. The Decompose step parses per-task `Done when:` and refuses a `requiresTest: true`
     task without one · HARD at audit_sha (the intake rule present in
     `skills/war/SKILL.md`'s Decompose step; judge: execution-evidence seat).
  2. Worker and all fix-family prompts carry the gate command and the task's `Done when:`
     (absent ⇒ `''` byte-identity, pinned by prompt-registry rows) ·
     check: `node --test skills/war/assets/workflow-template.test.mjs`.
  3. `assert-done-when.sh` honors the floor family contract — exit 1 on a red command
     (the `done-unmet` route), exit 2 on git/env error, charset-validated input, timeout ·
     check: `bash skills/war/assets/assert-done-when.test.sh`.
  4. A red `Done when:` at merge blocks via the `done-unmet` escalation route, appended to
     the canonical export and its hand-mirrored copy with the registry row ·
     check: `node --test skills/war/assets/land-decision.test.mjs`.
  5. `assert-test-in-diff.sh` emits matched test paths on exit 0 and the refiner threads
     them as `MergeResult.mappedTests` ·
     check: `bash skills/war/assets/assert-test-in-diff.test.sh`.
  6. The refiner executes each claimed `check:`-tagged End state once at the land barrier,
     tees per-condition artifacts beside the captured gate log, deduping gate-identical
     commands · check: `node --test skills/war/assets/workflow-template.test.mjs`.
  7. Gate-audit verifies from artifacts — mappedTests greps against the gate log, End-state
     attestation per claimed condition — and a condition no seat attests lands `unverified`
     in the handoff, never `met` ·
     check: `node --test skills/war/assets/workflow-template.test.mjs`.
  8. `red-team-gate.mjs` accepts rounds/round-limit, echoes them, and computes
     `routeUpstream` by pure arithmetic (limit reached with unstamped roots, or a
     `needsDecision` surviving its one adjudication attempt) ·
     check: `node --test skills/red-team/assets/red-team-gate.test.mjs`.
  9. Legacy plans run byte-identical: no `Done when:` ⇒ unchanged prompts; bare `endState`
     strings normalize to the judgment path ·
     check: `node --test skills/war/assets/workflow-template.test.mjs`.
  10. `run.redteamRoundLimit` validates (default 3, economy preset 2) ·
      check: `node --test skills/war/assets/war-config.test.mjs`.
  11. `/red-team` seeds cumulative rounds from the report's `**Rounds:**` header, re-pipes
      the gate with `--rounds`, and a route-upstream terminal emits the `## Route upstream`
      block as the regrill agenda; the old unbounded prose is gone · HARD at audit_sha
      (new lines present in SKILL.md/lenses.md/loop-budget.md, old "≤ 2 rounds per blocker"
      -only accounting absent; judge: execution-evidence seat).
  12. `/war-campaign` step 3 is the three-arm triage: proceed verdicts commit the patched
      plan + report onto `dev/<slug>`; route-upstream/BLOCKED-residual and persistent
      `INCOMPLETE` halt with `stopPoint: redteam-route-upstream` and the regrill agenda in
      CAMPAIGN-STATE.md; the ledger records `redteamRounds` ·
      check: `node --test skills/war-campaign/assets/campaign-ledger.test.mjs`.
  13. `/war-review` renders the two ratified telemetry rows plus per-plan rounds, `n/a`
      when unsourceable · HARD at audit_sha (rows present in `skills/war-review/SKILL.md`;
      judge: execution-evidence seat).
  14. Release: all four version slots move lock-step to the next free minor above the live
      base · check: `node --test skills/war/assets/version-slots.test.mjs` (lock-step +
      monotonic floor; the bump's presence is judged at audit_sha — the suite cannot fail
      on a wholly absent release).

## Build order (for /war)

Phase 1 (contract & threading) → Phase 2 (floors & done-unmet route) → Phase 3 (End-state
execution & gate-audit) → Phase 4 (loop-breaker) → Phase 5 (campaign & telemetry) →
Phase 6 (release).

## Phase 1 — Contract & threading

### Task 1.1: Done-when intake at Decompose
- Files: `skills/war/SKILL.md`
- Plan slice: the Decompose step parses each task's `Done when:` bullet into the task
  shape it stages (alongside `requiresTest`/`deps`); a `requiresTest: true` task without
  `Done when:` is an intake defect — surface it at the approval gate and refuse dispatch
  under `--afk` (the template law made mechanical). Note the legacy arm: a plan with no
  `Done when:` bullets anywhere stages unchanged.
- Done when: None — prose surface; End states 1–2 carry the checks (registry rows land in
  Task 1.3; the intake rule is judged at audit_sha).
- requiresTest: false
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 1.2: The contract layer, widened once
- Files: `skills/war/references/schemas.md`
- Plan slice: one coherent widening, later-phase producers annotated
  "defined-but-not-yet-emitted": per-task `doneWhen` (string|null) in the args task shape;
  `MergeResult.mappedTests` (produced in Task 2.2/2.3); `phase.endState` widened from
  `string[]` to `{ condition, tag, check|null }` rows with the bare-string normalization
  rule (consumed in Phase 3); handoff `endState` status set gains `unverified` with the
  seat-silence rule (old four-status enumeration rewritten in place — assert the old
  enumeration absent from this file); `acceptance_criteria_covered` redefined as claimed
  End-state ids (A1).
- Done when: None — reference doc; every consumer's drift pin lands with its producer task
  (2.3, 3.2), and `doc-cli-consistency.test.mjs` guards the CLI-facing rows it already
  covers.
- requiresTest: false
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 1.3: Engine threading & prompt truth
- Files: `skills/war/assets/workflow-template.js`, `skills/war/assets/workflow-template.test.mjs`, `agents/war-worker.md`
- Plan slice: task args carry `doneWhen`; the primary worker dispatch gains a
  `Done when:` line; `FIX_NEEDED`, `ADD_TEST`, `PACKAGE_IT`, and the ace sweep prompts gain
  `Gate: <plan.gate>` and the task's `Done when:` clause via the absent ⇒ `''` set-minus
  pattern (legacy byte-identity, End state 9); prompt-registry rows pin "any prompt that
  says keep-the-gate-green carries the gate command" and the `''` identity; the worker card
  documents the new input the same task (prompt-surface split). The primary worker dispatch
  and the worker card also carry the A1 redefinition — the worker reports
  `acceptance_criteria_covered` as the task's claimed End-state ids (empty when the task
  claims none), the field Task 3.2's gate-audit cross-checks; the old plan-slice-criteria
  framing absent from `agents/war-worker.md`.
- Done when: `node --test skills/war/assets/workflow-template.test.mjs`
- requiresTest: true
- requiresPackaging: false
- deps: []
- target repo: superproject

## Phase 2 — Floors & the done-unmet route

### Task 2.1: The done-when floor
- Files: `skills/war/assets/assert-done-when.sh`, `skills/war/assets/assert-done-when.test.sh`
- Plan slice: new floor, family contract — usage
  `assert-done-when.sh <worktree> --cmd-file <f>`: runs the task's `Done when:` command in
  the task worktree after the gate; exit 0 green, exit 1 red (the `done-unmet` route),
  exit 2 git/env error (never collapses into the floor status); command text is
  file-threaded and charset-validated per the `overrides.testPattern` embedding discipline,
  with a timeout — a hung command fails this dispatch only (A3). Test fixtures cover all
  three exits plus the timeout arm.
- Done when: `bash skills/war/assets/assert-done-when.test.sh`
- requiresTest: true
- requiresPackaging: true
- deps: []
- target repo: superproject

### Task 2.2: Matched-path emission
- Files: `skills/war/assets/assert-test-in-diff.sh`, `skills/war/assets/assert-test-in-diff.test.sh`
- Plan slice: on exit 0, print the matched test paths (one per line) on stdout — the
  `mappedTests` source; exit-1/2 stdout contracts unchanged (assert the old
  empty-on-success behavior retired in the test, and the header comment rewritten — the
  old "empty" wording absent from this file).
- Done when: `bash skills/war/assets/assert-test-in-diff.test.sh`
- requiresTest: true
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 2.3: The done-unmet route, wired
- Files: `skills/war/assets/land-decision.mjs`, `skills/war/assets/land-decision.test.mjs`, `skills/war/assets/workflow-template.js`, `skills/war/assets/workflow-template.test.mjs`, `agents/war-refiner.md`
- Plan slice: append `done-unmet` to the canonical `HARD_ESCALATION_REASONS` export and the
  hand-mirrored inline copy in the same task, mirror-registry row included (the drift guard
  in `land-decision.test.mjs` is the arbiter — never restate the array literal); the
  refiner merge-task dispatch runs `assert-done-when.sh` after the gate and captures
  `assert-test-in-diff.sh` stdout into `MergeResult.mappedTests`; a floor exit 1 routes a
  bounded "make this command pass" fix sub-loop sharing `run.roundLimit` (the `no-test`
  pattern); exhaustion escalates `done-unmet`; the refiner card documents the floor the
  same task.
- Done when: `node --test skills/war/assets/land-decision.test.mjs skills/war/assets/workflow-template.test.mjs`
- requiresTest: true
- requiresPackaging: false
- deps: [2.1, 2.2]
- target repo: superproject

## Phase 3 — End-state execution & gate-audit verification

### Task 3.1: Lead-side tag parsing
- Files: `skills/war/SKILL.md`
- Plan slice: the Lead parses each claimed End-state condition's D5 tag
  (`check:` | `gate:` | `HARD at audit_sha` | `backstop:`) into the widened
  `phase.endState` rows staged for the Workflow; an untagged/bare condition normalizes to
  `{ condition, tag: null, check: null }` — the judgment path (A5); verbatim-text
  extraction per ADR 0013/0014 is unchanged.
- Done when: None — prose surface; the engine-side registry rows (Task 3.2) and End state
  9's byte-identity check are the mechanical guards.
- requiresTest: false
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 3.2: Land-barrier execution & artifact-first gate-audit
- Files: `skills/war/assets/workflow-template.js`, `skills/war/assets/workflow-template.test.mjs`, `agents/war-auditor.md`, `skills/war/references/design.md`
- Plan slice: at the land barrier the refiner executes each claimed `check:` command once
  at the confirmed tip (charset + timeout per A3), teeing one artifact per condition beside
  the captured gate log; a command byte-equal to the phase gate cites the gate log instead
  of re-running (D2); `gate:`-tagged conditions cite the gate log; the gate-audit prompt
  goes artifact-first — seats grep `mappedTests` against the gate log (the HARD
  "provably unrun mapped test" trigger becomes mechanical), read the per-condition
  artifacts, attest every claimed condition, and cross-check the worker's claimed
  End-state ids (A1); handoff maps an unattested condition to `unverified`, never `met`
  (whole-pass absence stays all-`deferred`); registry rows pin the artifact naming, the
  `unverified` mapping, and the old four-status enumeration absent from the handoff
  assembly comment; the auditor card documents artifact-first duties the same task;
  `design.md`'s intent-threading + handoff bullet is updated for artifact-first
  verification and the `unverified` status (the old judgment-path description absent).
- Done when: `node --test skills/war/assets/workflow-template.test.mjs`
- requiresTest: true
- requiresPackaging: false
- deps: []
- target repo: superproject

## Phase 4 — Loop-breaker

### Task 4.1: Gate arithmetic
- Files: `skills/red-team/assets/red-team-gate.mjs`, `skills/red-team/assets/red-team-gate.test.mjs`
- Plan slice: `main()` accepts optional `rounds` / `roundLimit` (input keys or flags),
  echoes both in the output, and emits `routeUpstream: boolean` — true iff rounds ≥ limit
  with any unstamped blocker/`needsDecision` open, or any `needsDecision` still open after
  rounds ≥ 2 (its one adjudication attempt spent). Pure arithmetic over the existing typed
  buckets — no NLP, no text classification; verdict computation and ADR 0043 precedence
  untouched. Absent inputs ⇒ absent outputs (byte-compat). Test rows: seeding defaults
  (A2: absent header ⇒ 0; non-integer header value ⇒ 0), echo, both trigger arms,
  absent-input identity.
- Done when: `node --test skills/red-team/assets/red-team-gate.test.mjs`
- requiresTest: true
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 4.2: Loop doctrine
- Files: `skills/red-team/SKILL.md`, `skills/red-team/references/loop-budget.md`, `skills/red-team/references/lenses.md`
- Plan slice: new `references/loop-budget.md` — the finding-class routing rules
  (factual-error → patch in place · under-specification (`needsDecision`) → one
  adjudication attempt then upstream · scope-expanding patch → upstream immediately · two
  consecutive patch-cascade sweeps → upstream regardless of budget, prose-advisory),
  the patch-style rule (patches state the final rule; genealogy lives in
  `## Adjudications`), and the `## Route upstream` block template (residual questions as
  the `/war-strategy` regrill agenda + the exact re-entry command). SKILL.md: Step 1 seeds
  cumulative rounds from the prior same-slug report's `**Rounds:**` header (absent or
  non-integer ⇒ 0, A2); Step 3's fail-open config read also resolves
  `run.redteamRoundLimit` (defined-but-not-yet-emitted; produced in Task 4.3); Step 5
  defines a round as one full grill sweep and re-pipes the gate with `--rounds`; Step 6
  emits the `**Rounds:**` header and, on route-upstream, the block; the ADR 0042 trigger
  pointer ("when the first gate computation returns BLOCKED, read
  references/loop-budget.md") is the only doctrine inline. lenses.md report template gains
  the `**Rounds:**` line and the `## Route upstream` section; the Verdict line is
  unchanged (ADR 0043 set).
- Done when: None — doctrine prose across a budgeted surface; End state 11 is judged at
  audit_sha and Task 4.1 carries the executable contract.
- requiresTest: false
- requiresPackaging: true
- deps: [4.1]
- target repo: superproject

### Task 4.3: The config knob
- Files: `skills/war/assets/war-config.mjs`, `skills/war/assets/war-config.test.mjs`
- Plan slice: `run.redteamRoundLimit` — integer ≥ 1, default 3, economy preset 2 — added to
  DEFAULTS, the run-block validation (beside `run.roundLimit`), and PRESETS; never inside
  `agents.redteam` (that key is a validated `{model, effort}` tier). Test rows: default,
  preset, rejection of 0/non-integer.
- Done when: `node --test skills/war/assets/war-config.test.mjs`
- requiresTest: true
- requiresPackaging: false
- deps: []
- target repo: superproject

## Phase 5 — Campaign & telemetry

### Task 5.1: Step-3 triage & the ledger field
- Files: `skills/war-campaign/SKILL.md`, `skills/war-campaign/assets/campaign-ledger.mjs`, `skills/war-campaign/assets/campaign-ledger.test.mjs`
- Plan slice: step 3 becomes the three-arm triage — (a) `CLEARED` / `CLEARED-WITH-NOTES` /
  `ADJUDICATED` ⇒ `git add` + commit the patched plan and the red-team report onto
  `dev/<slug>` (the same load-bearing-handoff rationale as step 2), record
  `--redteamRounds`, proceed (`ADJUDICATED` proceeds unattended under `--afk`, D4);
  (b) `routeUpstream: true` or `BLOCKED` with residual open questions ⇒ halt-and-hold,
  `stopPoint: redteam-route-upstream`, CAMPAIGN-STATE.md carries the regrill command + the
  report's `## Route upstream` agenda, re-entry via `/war-campaign add` after regrilling —
  never skip-and-continue (ADR 0011); (c) persistent `INCOMPLETE` ⇒ the same halt arm. The
  old one-sentence step 3 ("Unresolvable → halt-and-hold") is retired — assert the old
  wording absent from this file. Failure section enumerates the `stopPoint` token; wrap-up
  gains the per-plan hardening row (rounds · blockers · adjudications · report path).
  Ledger: `redteamRounds` joins `record()`'s own-key list and the CLI case — nullable and
  omit-preserving (the `backstops` precedent).
- Done when: `node --test skills/war-campaign/assets/campaign-ledger.test.mjs`
- requiresTest: true
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 5.2: /war-review telemetry rows
- Files: `skills/war-review/SKILL.md`
- Plan slice: ratify the two rows the landed plan deferred here — red-team rounds per plan
  (trend across campaigns) and interview length (questions per merged plan) — plus the
  per-plan rounds row sourced from `**Rounds:**` headers and ledger `redteamRounds`;
  every row renders `n/a` when unsourceable, never fabricated (the standing war-review
  rule).
- Done when: None — telemetry prose; sources are the Task 4.2 header and Task 5.1 ledger
  field, and the n/a rule keeps absent sources honest.
- requiresTest: false
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 5.3: Glossary & the ADR
- Files: `CONTEXT.md`, `docs/adr/0045-red-team-loop-budget-and-route-upstream.md`
- Plan slice: CONTEXT.md gains the new terms (done-unmet route · land-barrier check ·
  mappedTests · `unverified` · Rounds header · route-upstream · loop budget); ADR 0045
  ratifies the loop-budget + route-upstream contract (rounds unit, seeding, the typed
  output field, the taxonomy's routing rules, why route-upstream is never a verdict —
  ADR 0043 precedence) citing this plan; re-`ls` `docs/adr/` for the free number at task
  start (A6).
- Done when: None — docs; ADR text is judged at audit_sha and the glossary has no
  mechanical guard.
- requiresTest: false
- requiresPackaging: false
- deps: []
- target repo: superproject

## Phase 6 — Release

### Task 6.1: Version slots, lock-step
- Files: `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, `README.md`
- Plan slice: bump all four slots together — `plugin.json` `version`, `marketplace.json`
  `metadata.version` and `plugins[0].version`, the `README.md` `## Status` blurb
  (replace-in-place, no badge) — to the next free **minor** above the live base
  (operator-ratified 2026-08-05, A7; 0.17.0 at authoring, non-authoritative). The Status
  blurb names the done-unmet floor, artifact-first gate-audit, and the red-team loop
  budget — quoting only identifiers that exist in the landed diff.
- Done when: `node --test skills/war/assets/version-slots.test.mjs`
- requiresTest: false
- requiresPackaging: false
- deps: []
- target repo: superproject

## Deferred validations (backstops)

- Red-green floor — the diff's mapped tests must fail with the feature hunks reverted at
  the base · why deferred: needs a campaign of `done-unmet` field data first (D5); the
  authoring-side delete-the-feature probe and the test-fidelity seat are the interim
  mitigations · runner: follow-up plan after the next campaign's `/war-review` rows.
- Fast-fail thresholds gate-typed (≥ 3 `needsDecision` in round 1 ⇒ route upstream) · why
  deferred: prose-advisory in `loop-budget.md` first; calibration needs field data (the
  census median is ≈ 1.5 rounds) · runner: promote in `red-team-gate.mjs` after one
  campaign.
- Adoption telemetry — red-team rounds per plan trend down · why deferred: inherited from
  the 2026-08-04 plan, now implemented as rows by Task 5.2; the *trend reading* still needs
  a campaign of field data · runner: `/war-review` at the next campaign wrap-up.

## Notes / conscious deviations

- This plan's own `Done when:` lines are authoring-contract compliance and red-team/audit
  targets; the engine executing this plan (live base at authoring) does not yet thread
  them — the bootstrap is expected and resolves when Phase 2 lands.
- `workflow-template.js` and `workflow-template.test.mjs` appear in Tasks 1.3, 2.3, and
  3.2 — three phases, one task each, per the phase-edge rule; `skills/war/SKILL.md`
  likewise in 1.1 and 3.1.
- Version literals here are non-authoritative; resolve the next free minor from the slots
  at land time.

## Open decisions

None.
