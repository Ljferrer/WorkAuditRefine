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
across the 12 newest reports (2026-07-26 →): median 2 invocation-rounds; the 7-round outlier
(`2026-07-24-runbook-and-standing-record-coherence`, just outside that window) had rounds 2
and 4 entirely patch-induced — pre-ADR-0043 behavior (verified: red-team `baseline-repro`
probe census at `3e48529`, adversarially confirmed, 2026-08-05). The landed plan's Non-goals defer exactly
this scope — "Engine/floor/schema slot consumption → the precision-chain spec · red-team
round budget / route-upstream → the loop-breaker spec · /war-review telemetry → with the
loop-breaker" — and its backstops assign this plan two `/war-review` telemetry rows
(verified: `docs/plans/2026-08-04-interview-and-authoring-contract.md` at `480cf30`).

## Pivotal constraints

- **ADR 0002 — auditors are read-only.** Every executed check runs refiner-side; audit
  seats read teed artifacts, never run commands. The auditor git allowlist is not widened.
- **ADR 0005 — enum discipline.** `done-unmet` is appended to the canonical
  `HARD_ESCALATION_REASONS` export in `land-decision.mjs` AND its hand-mirrored copy in
  `workflow-template.js` in the same task — and, per F2, to the `MergeResult.status` union
  (schemas.md + the engine result schema) and `FLOOR_STATUSES` (the two-slot
  `no-test`/`unpackaged` precedent). The mirror↔export equality arbiters are the existing
  deepEqual guards — `war-config.test.mjs`'s inline-mirror drift guard and
  `workflow-template.test.mjs`'s `MIRROR_REGISTRY` row — which cover a new member
  automatically; `land-decision.test.mjs`'s `MERGE_TASK_FLOOR_ONLY` partition pin gains
  the member in the same task. `held:workflow-error` never joins the set.
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
| D2 | End-state `check:` consumption | the endstate-check dispatch runs once per phase at the INTEGRATED TIP (the serial queue's final merged HEAD — the same tip the gate-audit pass audits), after the last merge and before the gate-audit seats spawn; every claimed `check:` runs there — no gate-dedupe, one execution per condition per phase (`integratedTipGate` is the dispatch precedent); the dispatch is UNCONDITIONAL per phase — it runs in the `mergedTasksForGateAudit`-empty arm too, so a `requiresTest: false`-only phase still executes its claimed checks; artifacts tee to `${refinery}/.war/endstate-<phaseId>-<n>.log`, each stamped with the tip SHA; gate-audit verifies from artifacts | (user) Q2 + red-team F5 (operator-ratified 2026-08-05; unconditional-arm precision per ff-topology r2) |
| D3 | Loop budget typing | gate-computed: `run.redteamRoundLimit` (default 3, economy 2); gate takes/echoes rounds and emits `routeUpstream` by pure arithmetic — no NLP | (user) Q3 |
| D4 | Campaign consumption | three-arm step-3 triage; patched plan + report committed onto `dev/<slug>`; `--redteamRounds` recorded; `ADJUDICATED` proceeds unattended under `--afk` | (user) Q4 |
| D5 | Check-vacuity posture | named residual — red-green floor deferred to a backstop row pending `done-unmet` field data | (user) Q5 |
| D6 | Fix-family prompt truth | `FIX_NEEDED` / `ADD_TEST` / `PACKAGE_IT` / ace gain `Gate:` + `Done when:` clauses (absent ⇒ `''`) | (verified: prompt builders vs the primary dispatch in `workflow-template.js` at `480cf30`) |
| D7 | Mapped-test definition | `assert-test-in-diff.sh` emits matched paths on exit 0 → `MergeResult.mappedTests` → gate-audit greps them in the captured gate log; "provably unrun mapped test" becomes mechanical | (verified: the gate-audit HARD trigger + `assert-test-in-diff.sh` Result section at `480cf30`) |
| D8 | End-state silence semantics | handoff status set gains `unverified`; attestation is a POSITIVE channel — the gate-audit seat result gains `endStateAttestations: [{ condition (verbatim), status: met \| unmet \| unverified, evidence }]`, one row required per claimed condition; a condition with no attestation row from any seat maps to `unverified`, never `met`; whole-pass absence stays all-`deferred`; findings stay defect-only (two-contract rule intact) | (user) Q2 + red-team F1 (operator-ratified 2026-08-05) |
| D9 | `acceptance_criteria_covered` | repurposed: worker-declared claimed End-state ids, cross-checked by the gate-audit seat | [assumed: A1] |
| D10 | Rounds seeding | the header is a dedicated line in the report template — `**Rounds:** <integer>` directly under the Verdict line; the LEAD seeds in Step 1 (the gate stays integers-only): glob `docs/red-team/*-<plan-slug>.md`, newest by filename date, first line matching `^\s*[-*]?\s*\*\*Rounds:\*\*\s*(\d+)`; anything else — absent, non-matching, non-integer, every legacy variant — seeds 0 (fail-open, clean slate) | (user) red-team F4 (operator-ratified 2026-08-05) |
| D11 | Executed-command hygiene | no charset validation (F6) — a `Done when:`/`check:` command is operator-ratified, red-teamed plan content, the same trust class as `plan.gate`, which the refiner has always executed unvalidated; hygiene is file-threading (`--cmd-file`, executed from the file, never interpolated into another script), a timeout, and execution confined to the task worktree / integrated-tip checkout; a hung command fails its dispatch, never stalls the merge queue | (user) Q2 + red-team F6 (operator-ratified 2026-08-05) |
| D12 | Telemetry home | `/war-review` ratifies the two deferred rows (rounds-per-plan trend; interview length) plus a per-plan rounds row, rendered `n/a` when unsourceable | (user) Q4 |

## Assumptions ledger

| ID | Assumption | Basis | Blast radius if wrong | Check |
|----|-----------|-------|----------------------|-------|
| A1 | `acceptance_criteria_covered` is repurposed (claimed End-state ids), not deleted | it gains its first consumer in the gate-audit cross-check | operator prefers deletion → two-line change in Task 3.2's files | echoed in the interview's Defaulted-decisions recap (ratified) |
| A2 | no legacy report seeds — cumulative counting starts fresh with new-template reports | the strict line form matches nothing at `480cf30`: the 08-05 report's `**Rounds: 4**` carries the colon inside the bold (seeds 0), the 07-26 report's `**Rounds:**` value is non-integer, and two older unbolded `Rounds:` lines match nothing (red-team F4 census, 2026-08-05) | a re-red-teamed legacy plan starts its cumulative count at that run | Step 1's strict-form rule (Task 4.2) · End state 11 |
| A3 | file-threading + timeout suffice for refiner-executed plan commands — no charset (F6) | same trust class as `plan.gate`, which the floor family has always executed unvalidated | a slow-but-legit check false-fails → escalation, ADR 0040 retry | `assert-done-when.test.sh` timeout + metacharacter fixtures (Task 2.1) |
| A4 | no in-flight campaign owns these files | 2026-08-04 campaign landed at `480cf30`; every plan in all nine ledgers at the main checkout reads `landed` (only 2026-07-14 carries a campaign-level `complete` status) — no in-flight owner | serial-merge rebase conflicts | ledger check at `/war` launch |
| A5 | `phase.endState` widening keeps consumers fail-open (bare strings normalize) | schemas.md is the contract layer; consumers update in the same phase | handoff readers break on shape | End state 9's registry rows + `/red-team` sandbox probe, pre-land |
| A6 | ADR 0045 and 0046 are the next free numbers | `ls docs/adr/` 2026-08-05 (0044 highest) | rename at land | re-`ls` at Task 5.3/5.4 start |
| A7 | release is the next free **minor** above the live base (0.17.0 at authoring — non-authoritative snapshot) | operator-ratified 2026-08-05 (minor bump); live slots at 0.16.0 | monotonic-floor red at land | `version-slots.test.mjs` |

## Non-goals / deferred

Red-green / mutation floor (backstop row, D5) · gate-typing the fast-fail thresholds
(backstop row) · auditor slice-precision lens duty · worker assumptions in `WorkerResult` ·
a `/war` intake executor gate beyond the done-when law · handoff `planDefects` telemetry ·
`/survey-corps` changes · track playbooks · any auditor-capability widening.

## New domain terms · Recommended ADRs

CONTEXT.md: done-unmet route · land-barrier check (defined per F5: executed once per
phase at the integrated tip, between serial-merge completion and the gate-audit pass) ·
mappedTests · `unverified` (End-state status) · Rounds header · route-upstream · loop
budget. One ADR (0045) ratifies the loop budget + route-upstream contract (Task 5.3).

## Commander's Intent

- **Purpose:** what the authoring contract writes, the run now proves — a task merges only
  when its own acceptance command passes; an End state lands `met` only on evidence a seat
  can cite (executed artifacts for `check:`-tagged conditions, named observables for
  judged ones), never by silence; and a plan that cannot stop churning in red-team is
  routed back to the interview instead of ground forever.
- **Method:** thread `Done when:` through the engine to a blocking refiner floor (the
  no-test pattern); execute `check:`-tagged End states at the land barrier and verify by
  artifact, never judgment; count red-team rounds in the gate and route chronic
  under-specification upstream; triage at the campaign seam. Auditors stay read-only
  (ADR 0002) — the refiner executes everything.
- **End state:**
  1. The Decompose step parses per-task `Done when:` (full-bullet soft-wrap join) and
     refuses a `requiresTest: true` task without one — the intake rule pinned by a
     `skill-doc-contracts.test.mjs` D-row (F8) ·
     check: `node --test skills/war/assets/skill-doc-contracts.test.mjs`.
  2. Worker and all fix-family prompts carry the gate command and the task's `Done when:`
     (absent ⇒ `''` byte-identity, pinned by prompt-registry rows) ·
     check: `node --test skills/war/assets/workflow-template.test.mjs`.
  3. `assert-done-when.sh` honors the floor family contract — exit 1 on a red command
     (the `done-unmet` route), exit 2 on git/env error, charset-validated input, timeout ·
     check: `bash skills/war/assets/assert-done-when.test.sh`.
  4. A red `Done when:` at merge blocks via the `done-unmet` route in both slots —
     escalation reason (canonical export + mirrored copy) and `MergeResult.status`
     (`FLOOR_STATUSES` + result schema) ·
     check: `node --test skills/war/assets/land-decision.test.mjs skills/war/assets/war-config.test.mjs skills/war/assets/workflow-template.test.mjs`.
  5. `assert-test-in-diff.sh` emits ALL matched test paths on exit 0 (accumulating scan) ·
     check: `bash skills/war/assets/assert-test-in-diff.test.sh` (the refiner-threading
     half is End states 6–7's `workflow-template.test.mjs` coverage).
  6. The endstate-check dispatch runs every claimed `check:`-tagged End state once per
     phase at the integrated tip — after the last merge, before gate-audit spawns —
     teeing per-condition artifacts stamped with the tip SHA ·
     check: `node --test skills/war/assets/workflow-template.test.mjs`.
  7. Gate-audit verifies from artifacts — mappedTests greps against the per-task gate
     logs, End-state
     attestation per claimed condition — and a condition no seat attests lands `unverified`
     in the handoff, never `met` ·
     check: `node --test skills/war/assets/workflow-template.test.mjs`.
  8. `red-team-gate.mjs` accepts rounds/round-limit, echoes them, and computes
     `routeUpstream` by pure arithmetic over the unstamped subset (limit reached with an
     unstamped root open, or an unstamped `needsDecision` at rounds ≥ 2), with the
     routeUpstream ⇒ BLOCKED invariant pinned ·
     check: `node --test skills/red-team/assets/red-team-gate.test.mjs`.
  9. Legacy plans run byte-identical: no `Done when:` ⇒ unchanged prompts; bare `endState`
     strings normalize to the judgment path ·
     check: `node --test skills/war/assets/workflow-template.test.mjs`.
  10. `run.redteamRoundLimit` validates (default 3, economy preset 2) ·
      check: `node --test skills/war/assets/war-config.test.mjs`.
  11. `/red-team` seeds cumulative rounds per the F4 strict-form rule, re-pipes the gate
      with `--rounds=<n> --round-limit=<resolved>`, and a route-upstream terminal emits
      the `## Route upstream` block as the regrill agenda; the doc-guard rows (Task 5.5)
      pin the new surfaces present and the retired per-blocker-only accounting wording
      absent · check: `node --test skills/red-team/assets/red-team-gate.test.mjs`.
  12. `/war-campaign` step 3 is the three-arm triage: proceed verdicts commit the patched
      plan + report onto `dev/<slug>`; route-upstream/BLOCKED-residual and persistent
      `INCOMPLETE` halt with `stopPoint: redteam-route-upstream` and the regrill agenda in
      CAMPAIGN-STATE.md; the ledger records `redteamRounds` ·
      check: `node --test skills/war-campaign/assets/campaign-ledger.test.mjs`.
  13. `/war-review` renders the two ratified telemetry rows plus per-plan rounds, `n/a`
      when unsourceable · HARD at audit_sha (rows present in `skills/war-review/SKILL.md`;
      judge: execution-evidence seat — justified-judged, F8: no test suite exists for
      `skills/war-review/` and minting one for two prose rows is out of proportion;
      recorded residual).
  14. Release: all four version slots move lock-step to the next free minor above the live
      base · check: `node --test skills/war/assets/version-slots.test.mjs` (lock-step +
      monotonic floor; the bump's presence is judged at audit_sha — the suite cannot fail
      on a wholly absent release).
  15. No skill doctrine surface — and not `README.md` — cites a `docs/specs/` path
      (spec-posterity rule, ADR 0046; input-shape mechanics carved out; guard corpus
      widened to both) · check: `node --test skills/_shared/doc-cli-consistency.test.mjs`.

## Build order (for /war)

Phase 1 (contract & threading) → Phase 2 (floors & done-unmet route) → Phase 3 (End-state
execution & gate-audit) → Phase 4 (loop-breaker) → Phase 5 (campaign & telemetry) →
Phase 6 (release).

## Phase 1 — Contract & threading

### Task 1.1: Done-when intake at Decompose
- Files: `skills/war/SKILL.md`, `skills/war/assets/skill-doc-contracts.test.mjs`
- Plan slice: the Decompose step parses each task's `Done when:` bullet into the task
  shape it stages (alongside `requiresTest`/`deps`) — a bullet parses as its FULL bullet
  content, soft-wrapped physical lines joined with single spaces until the next `- `
  bullet or blank line (the authoring template wraps; a first-line-only parse truncates
  the command into a spurious `done-unmet`); a `requiresTest: true` task without
  `Done when:` is an intake defect — surface it at the approval gate and refuse dispatch
  under `--afk` (the template law made mechanical); the legacy arm: a plan with no
  `Done when:` bullets anywhere stages unchanged. A `skill-doc-contracts.test.mjs` D-row
  pins the intake rule and the full-bullet parse clause (F8 — the guard rides its fact's
  task).
- Done when: `node --test skills/war/assets/skill-doc-contracts.test.mjs`
- requiresTest: true
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 1.2: The contract layer, widened once
- Files: `skills/war/references/schemas.md`
- Plan slice: one coherent widening, later-phase producers annotated
  "defined-but-not-yet-emitted": per-task `doneWhen` (string|null) in the args task shape;
  `MergeResult.mappedTests` (produced in Task 2.2/2.3); the `MergeResult.status` union
  gains `"done-unmet"` (F2's two-slot precedent; produced in Task 2.3); `phase.endState` widened from
  `string[]` to `{ condition, tag, check|null }` rows with the bare-string normalization
  rule (consumed in Phase 3); the gate-audit seat result gains the positive
  `endStateAttestations` channel (D8: `{ condition (verbatim), status: met | unmet |
  unverified, evidence }`, one row per claimed condition, gate-audit seats only — ordinary
  audit-seat results unchanged); handoff `endState` status set gains `unverified` with the
  no-attestation-row rule (old four-status enumeration rewritten in place — assert the old
  enumeration absent from this file, case-insensitively); `acceptance_criteria_covered`
  redefined as claimed End-state ids (A1).
- Done when: None — reference doc; every consumer's drift pin lands with its producer task
  (2.3, 3.2), and the OLD-enumeration-absent guard for this file is Task 3.2's doc-claim
  row (the `war-config.test.mjs` schemas-guard pattern).
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
  framing absent from `agents/war-worker.md`, case-insensitively.
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
  file-threaded (`--cmd-file` — executed from the file, never interpolated into another
  script; no charset validation, F6: a `Done when:` is operator-ratified plan content in
  the same trust class as `plan.gate`), with a timeout — a hung command fails this
  dispatch only (A3). Test fixtures cover all three exits, the timeout arm, and a
  metacharacter-bearing command (`&&`, quotes, `=`) running verbatim.
- Done when: `bash skills/war/assets/assert-done-when.test.sh`
- requiresTest: true
- requiresPackaging: true
- deps: []
- target repo: superproject

### Task 2.2: Matched-path emission
- Files: `skills/war/assets/assert-test-in-diff.sh`, `skills/war/assets/assert-test-in-diff.test.sh`
- Plan slice: on exit 0, print ALL matched test paths (one per line) on stdout — the scan
  accumulates every match (the current first-hit `break`s are dropped) — the
  `mappedTests` source; exit-1/2 stdout contracts unchanged, including their
  "empty summary" prose (the refiner read-contract depends on it); the OLD-absent assert
  is scoped to the exit-0 contract only — the header's exit-0 line documents matched-path
  stdout, and the file no longer claims a silent stdout on success (asserted
  case-insensitively).
- Done when: `bash skills/war/assets/assert-test-in-diff.test.sh`
- requiresTest: true
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 2.3: The done-unmet route, wired
- Files: `skills/war/assets/land-decision.mjs`, `skills/war/assets/land-decision.test.mjs`, `skills/war/assets/workflow-template.js`, `skills/war/assets/workflow-template.test.mjs`, `agents/war-refiner.md`
- Plan slice: append `done-unmet` to the canonical `HARD_ESCALATION_REASONS` export and the
  hand-mirrored inline copy in the same task (never restate the array literal; the
  existing deepEqual arbiters — `war-config.test.mjs`'s inline-mirror drift guard and
  `workflow-template.test.mjs`'s `MIRROR_REGISTRY` row — cover the append automatically;
  `land-decision.test.mjs`'s `MERGE_TASK_FLOOR_ONLY` partition pin gains `done-unmet` in
  this same task); widen the floor-status channel per F2's two-slot precedent —
  `FLOOR_STATUSES` and the engine's MergeResult status enum gain `done-unmet`, and the
  refiner returns `status: "done-unmet"` on a floor exit 1; the refiner merge-task
  dispatch runs `assert-done-when.sh` after the gate and captures `assert-test-in-diff.sh`
  stdout into `MergeResult.mappedTests`; a floor exit 1 routes a bounded "make this
  command pass" fix sub-loop sharing `run.roundLimit` (the `no-test` pattern); exhaustion
  escalates `done-unmet`; the refiner card documents the floor the same task.
- Done when: `node --test skills/war/assets/land-decision.test.mjs skills/war/assets/war-config.test.mjs skills/war/assets/workflow-template.test.mjs`
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
- Plan slice: the endstate-check dispatch (D2/F5) runs once per phase at the integrated
  tip — after the serial merge queue's last merge, before the gate-audit seats spawn —
  UNCONDITIONALLY: it runs in the `mergedTasksForGateAudit.length === 0` arm too, where
  the end-state-only seat consumes its artifacts (a `requiresTest: false`-only phase
  still executes its claimed checks); it executes every claimed `check:` command (command
  hygiene per A3), teeing one artifact per condition to
  `${refinery}/.war/endstate-<phaseId>-<n>.log`, each stamped with the tip SHA it ran at;
  the `endStateAttestations` requirement lands in the shared `endStateBlock` const so all
  three gate-audit-family seats (per-task, integrated-tip, end-state-only) return rows; `gate:`-tagged conditions attest from the gate evidence as actually
  captured (the per-task gate logs, plus the integrated-tip gate log when the
  intra-phase-dep arm produced one); the gate-audit prompt
  goes artifact-first — seats grep `mappedTests` against the gate log (the HARD
  "provably unrun mapped test" trigger becomes mechanical), read the per-condition
  artifacts, and return one `endStateAttestations` row per claimed condition (D8's
  positive channel — status + evidence, never a bare verdict), cross-checking the worker's
  claimed End-state ids (A1); handoff maps a condition with no attestation row from any
  seat to `unverified`, never `met` (whole-pass absence stays all-`deferred`); registry
  rows pin the attestation-row requirement, the artifact naming, the `unverified`
  mapping, the endState status ternaries + assembly comment updated to the five-status
  set, and a doc-claim row reading `../references/schemas.md` asserting the old
  four-status-only enumeration absent, case-insensitively (the `war-config.test.mjs`
  schemas-guard pattern — Task 1.2's OLD-absent owner); the auditor card documents
  artifact-first duties the same task;
  `design.md`'s intent-threading + handoff bullet is updated for artifact-first
  verification and the `unverified` status (the old judgment-path description absent,
  case-insensitively), and its "Design notes: `docs/specs/…`" citation is retired
  (spec-posterity rule, F7 / ADR 0046).
- Done when: `node --test skills/war/assets/workflow-template.test.mjs`
- requiresTest: true
- requiresPackaging: false
- deps: []
- target repo: superproject

## Phase 4 — Loop-breaker

### Task 4.1: Gate arithmetic
- Files: `skills/red-team/assets/red-team-gate.mjs`, `skills/red-team/assets/red-team-gate.test.mjs`
- Plan slice: `main()` accepts optional `rounds` / `roundLimit` (input keys, or
  `=`-attached flags `--rounds=<n>` / `--round-limit=<n>` — the file-mode positional
  scan picks the first non-`--` token, so space-separated flag values are refused),
  echoes both in the output, and emits `routeUpstream: boolean` —
  `(rounds ≥ roundLimit && open.some(f => f.adjudicated !== true)) ||
  (rounds ≥ 2 && needsDecision.some(f => f.adjudicated !== true))`, where `open` is the
  gate's existing blockers+needsDecision union: both arms key on the UNSTAMPED subset
  (F3), so `routeUpstream: true` only ever accompanies a `BLOCKED` verdict — a stamped-out
  `ADJUDICATED` run never routes upstream. Pure arithmetic over the existing typed
  buckets — no NLP, no text classification; verdict computation and ADR 0043 precedence
  untouched. Absent inputs ⇒ absent outputs (byte-compat). Test rows: echo, both trigger arms
  on unstamped findings, the routeUpstream ⇒ BLOCKED invariant, a stamped-out
  ADJUDICATED run at rounds ≥ limit emitting `routeUpstream: false`, `=`-attached
  flag parsing in file mode, absent-input identity.
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
  cumulative rounds by the F4 rule — glob `docs/red-team/*-<plan-slug>.md`, newest by
  filename date, first line matching `^\s*[-*]?\s*\*\*Rounds:\*\*\s*(\d+)`; absent,
  non-matching, or non-integer (every legacy variant) ⇒ 0, fail-open (A2); Step 3's
  fail-open config read also resolves `run.redteamRoundLimit`
  (defined-but-not-yet-emitted; produced in Task 4.3), falling back to the DEFAULT limit
  of 3 when the config is absent or invalid — the limit is never unset, config only
  overrides it; Step 5
  defines a round as one full grill sweep and re-pipes the gate with `--rounds=<n>
  --round-limit=<resolved>` — and rewrites its two existing per-blocker bounds to the
  distinct term "re-verify attempts (≤ 2 per blocker)" so "round" carries exactly one
  unit in the step; Step 6 emits the dedicated `**Rounds:** <integer>` line directly
  under the Verdict line and, on route-upstream, the block; the ADR 0042 trigger pointer
  ("when the first gate computation returns BLOCKED, read references/loop-budget.md") is
  the only doctrine inline. lenses.md report template gains the dedicated
  `**Rounds:** <integer>` line under the Verdict line and the `## Route upstream`
  section; the Verdict line is unchanged (ADR 0043 set).
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
  `--redteamRounds`, proceed (`ADJUDICATED` proceeds unattended under `--afk`, D4; a
  proceed verdict commits-and-continues regardless of any routing metadata — F3's
  invariant makes `routeUpstream: true` imply `BLOCKED`, so the arms never collide);
  (b) `routeUpstream: true` or `BLOCKED` with residual open questions ⇒ halt-and-hold,
  `stopPoint: redteam-route-upstream`, CAMPAIGN-STATE.md carries the regrill command + the
  report's `## Route upstream` agenda, re-entry via `/war-campaign add` after regrilling —
  never skip-and-continue (ADR 0011); (c) persistent `INCOMPLETE` ⇒ the same halt arm. The
  old one-sentence step 3 ("Unresolvable → halt-and-hold") is retired — assert the old
  wording absent from this file, case-insensitively. Failure section enumerates the `stopPoint` token; wrap-up
  gains the per-plan hardening row (rounds · blockers · adjudications · report path).
  Ledger: `redteamRounds` joins `record()`'s own-key list and the CLI case — nullable and
  omit-preserving (the `backstops` precedent). Per the spec-posterity rule (F7 / ADR 0046,
  authored in Task 5.4): retire this SKILL.md's "Full design: `docs/specs/…` §7" citation
  — the spec is never updated (posterity); the ADR 0011 citation on the same line stays,
  and the ledger shape's maintained home is the helper + its test.
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
- Files: `CONTEXT.md`, `docs/adr/0045-red-team-loop-budget-and-route-upstream.md`, `docs/adr/0013-commanders-intent-and-disposition-routing.md`
- Plan slice: CONTEXT.md gains the new terms (done-unmet route · land-barrier check ·
  mappedTests · `unverified` · Rounds header · route-upstream · loop budget); ADR 0045
  ratifies the loop-budget + route-upstream contract (rounds unit, seeding, the typed
  output field, the taxonomy's routing rules, why route-upstream is never a verdict —
  ADR 0043 precedence) citing this plan; ADR 0013 gains a dated amendment section (F7):
  artifact-first verification and the `unverified` status supersede §6's judgment-path
  description for gate-audit End-state checks — pre-existing body text byte-unchanged
  per the amendment convention, Status line updated; re-`ls` `docs/adr/` for the free
  numbers at task start (A6).
- Done when: None — docs; ADR text is judged at audit_sha and the glossary has no
  mechanical guard.
- requiresTest: false
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 5.4: Spec-posterity doctrine — ADR 0046, citation retirement, guard
- Files: `docs/adr/0046-specs-are-posterity-skills-cite-maintained-surfaces.md`, `skills/aftermath/SKILL.md`, `skills/lessons-learned/references/seeding.md`, `skills/_shared/doc-cli-consistency.test.mjs`, `README.md`
- Plan slice: ADR 0046 ratifies the operator rule (F7 + README extension, 2026-08-05):
  `docs/specs/` files are posterity — never updated, never cited by skill doctrine
  surfaces OR the README; live surfaces cite only maintained-truthful homes (ADRs,
  `references/` files, agent cards, code, memories). Retire README's five
  "Design notes: `docs/specs/…`" citations (repoint each at its maintained home or
  delete the pointer).
  Retire the two remaining doctrine citations this task owns (`skills/aftermath/SKILL.md`
  "Design: … §4.3"; `skills/lessons-learned/references/seeding.md` "§4" citation),
  repointing each at its maintained home or deleting the pointer where the doctrine
  already lives inline; `skills/war/references/design.md`'s "Design notes:" citation is
  retired by Task 3.2 (which owns that file) and `skills/war-campaign/SKILL.md`'s by
  Task 5.1 — this task adds the guard: a `doc-cli-consistency.test.mjs` rule asserting no
  file in its scanned corpus cites a `docs/specs/` path, with the input-shape mechanics
  carve-outs (path-shape examples, glob patterns, the survey-corps output directory)
  excluded by pattern, case-insensitively — and widens that corpus:
  `EVICTION_DESTINATIONS` gains `skills/lessons-learned/references/seeding.md` and
  `skills/war/references/design.md`, the two retired-citation homes the hand-enumerated
  list cannot currently see, and the rule's corpus additionally reads `README.md`
  (the README extension).
- Done when: `node --test skills/_shared/doc-cli-consistency.test.mjs`
- requiresTest: true
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 5.5: Loop-doctrine doc-guard rows
- Files: `skills/red-team/assets/red-team-gate.test.mjs`
- Plan slice: doc-guard rows (the D7(b) lenses.md-pinning precedent, F8) asserting: the
  dedicated `**Rounds:** <integer>` line present in lenses.md's report template directly
  under the Verdict line; the `## Route upstream` section present; SKILL.md's ADR 0042
  trigger pointer present; and the retired per-blocker-only accounting wording absent
  from Step 5, all case-insensitively. Lands in Phase 5 so the Phase-4 prose it guards
  is already on the base (drift-guard rule 7 — a Phase-4 home would be red by
  construction at its frozen base or collide with Task 4.1's file).
- Done when: `node --test skills/red-team/assets/red-team-gate.test.mjs`
- requiresTest: true
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
  census median is 2 rounds) · runner: promote in `red-team-gate.mjs` after one
  campaign.
- Adoption telemetry — red-team rounds per plan trend down · why deferred: inherited from
  the 2026-08-04 plan, now implemented as rows by Task 5.2; the *trend reading* still needs
  a campaign of field data · runner: `/war-review` at the next campaign wrap-up.

## Notes / conscious deviations

- This plan's own `Done when:` lines are authoring-contract compliance and red-team/audit
  targets; the engine executing this plan (live base at authoring) does not yet thread
  them — the bootstrap is expected and resolves when Phase 2 lands.
- Legacy landed-campaign specs (`docs/specs/2026-07-02-war-clean-handoff-design.md`,
  `docs/specs/2026-07-24-gate-evidence-and-release-integrity-design.md`,
  `docs/specs/2026-07-01-war-companion-skills-design.md`) carry retired wordings
  (four-status enum, judgment-path description, one-sentence step 3) as sanctioned
  historical survivors — posterity documents are never updated (F7 / ADR 0046); every
  OLD-absent assert in this plan is scoped to live surfaces only.
- `workflow-template.js` and `workflow-template.test.mjs` appear in Tasks 1.3, 2.3, and
  3.2 — three phases, one task each, per the phase-edge rule; `skills/war/SKILL.md`
  likewise in 1.1 and 3.1.
- Version literals here are non-authoritative; resolve the next free minor from the slots
  at land time.

## Open decisions

None.
