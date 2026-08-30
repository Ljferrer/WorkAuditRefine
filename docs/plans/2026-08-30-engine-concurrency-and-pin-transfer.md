# Engine concurrency and pin transfer — global semaphore + wave-side ace

## Context — the gap / problem

Two composed defects make WAR runs slow in wall-clock. First, the serial merge queue runs every
ace's full-panel re-audit inside the merge lock: in the measured phase, ~22 of ~33 minutes of
merge-queue wall-clock was panel re-audit serialised behind the lock (verified: issue #1913
(2026-08-28)). The operator ruled: pursue directions 1 and 2 combined (wave-side concurrent ace,
delta-scaled re-audit, mechanical pin-transfer at the merge slot), reject directions 3 and 4, and
any accepted design must beat the route-every-absorb-through-the-fix-path baseline (verified:
issue #1913 comment (2026-08-28)). Second, `run.maxParallel` throttles each fan-out site
independently, so nested wave × roster fan-outs compose to ~N² concurrent agents — 7 observed at
N=4 (verified: issue #1897 (2026-08-27)). The fix shapes compose: the global semaphore is the
concurrency primitive, and the wave-side ace path is its first consumer — moving re-audits into
the parallel region raises peak auditor concurrency at exactly the moment the per-site throttle
already fails.

The engine's four `batched()` call sites are the only fan-outs today, pinned by an exact-substring
census test (verified: `workflow-template.test.mjs` census block at current tip). The merge slot
verifies no pin today: pin enforcement is per-seat at the collection site in `auditRound`, and the
only mechanical pin check is post-merge (`gate-pin-status.sh`) (verified: `workflow-template.js`
at current tip). The ruled literal predicate `git diff <reauditedTip> <rebasedTip>` is non-empty
for every task after the first, because the rebased tree contains earlier tasks' merged changes
(verified: serial merge-queue mechanics, `workflow-template.js` at current tip) — the plan
replaces it with patch equality (D2).

**Evidence consumed:** issue #1913 body and operator comment — read (`gh issue view --comments`) ·
issue #1897 body — read · issues #1722–#1724 implementation — read in code at current tip · run
manifest `omniextract-qwen-routing-2026-08-27` — unread, reason: the issue bodies quote its
measurements · memory prefetch rows (scope, decomposition, guards, release) — read ·
`workflow-template.js`, `war-config.mjs`, `workflow-template.test.mjs`, `war-config.test.mjs`,
`CONTEXT.md`, `skills/war-room/SKILL.md`, `skills/red-team/SKILL.md`, `skills/war/references/schemas.md`
— read at current tip.

## Pivotal constraints

The Workflow sandbox has no imports, no fs, no `Date.now`. `parallel()` is the only concurrency
primitive the engine uses today; the sandbox also offers `pipeline()` (verified:
`skills/war/references/schemas.md` and the red-team workflow scaffold at current tip). The live `parallel()` NULLs a rejected thunk
(the #742 invariant) — `Promise.all` is forbidden by test. The census tests pin exact source
substrings and must be rewritten with the seam change. The `fixRounds` reserve (`roundLimit − 2`)
is shared between the ace ladder and the merge-floor retry loop and stays shared.

## Resolved design tree

| # | Decision | Resolution | Source | Pins · landing class |
|---|----------|------------|--------|----------------------|
| D1 | Throttle scope | one global counting semaphore at the agent dispatch seam; per-site `batched()` retires or sits under it, never beside it | (user) | PIN-4 · guardrail |
| D2 | Pin-transfer predicate | conflict-free rebase (stated precondition) AND `git patch-id --stable` equality of the task's own diff, computed dispatchBase→tip before the rebase and integration-tip→tip after; mismatch ⇒ in-lock full-panel re-audit for that task only | (user) | PIN-1 · guardrail ‡, PIN-7, PIN-14 · end-state |
| D3 | Re-audit delta scale | file-level: ace `changed_files[]` ⊆ findings' file set ⇒ originating seat(s) only, else full panel | (user) | slice |
| D4 | Floor-retry loop | unchanged, in-lock, full panel — floor trips are born at the merge slot and are not findings-driven | (user) | non-goal |
| D5 | Doc sweep | OLD per-site wording absent from four enumerated doc surfaces — `CONTEXT.md`, `skills/war-room/SKILL.md`, `skills/war/references/schemas.md`, `skills/war/references/design.md` — each with a per-path decisive OLD token; engine comments ride task 1.1's census; CHANGELOG and `skills/red-team/SKILL.md` untouched; the lesson is OLD-absent-exempt and gains a RESOLVED stamp on frontmatter `description` (terse) and body | (user) | end-state |
| D6 | Doctrine record | one ADR covering seat-approval transfer, rebase pin transfer, global semaphore semantics; ADR file has an owning task; transfer rule mirrored into both prompt layers in one commit | (user) | PIN-9 · slice, PIN-10 · end-state, PIN-11 · slice ‡ |
| D7 | Gate at ace tip | the task gate runs green at the ace tip before re-audit and transfer; a red gate blocks transfer and routes to the normal fix path | (user) | PIN-12 · guardrail ‡ |
| D8 | Direction authority | directions 1+2 combined, 3+4 rejected, fix-path baseline is the calibration floor | (verified: issue #1913 comment (2026-08-28)) | context |
| D9 | Run-behaviour invariants | fail-open ace, byte-identical unconfigured paths, shared `fixRounds` charge, no soft markers, journal-clean resume | (user) | PIN-2, PIN-3, PIN-5, PIN-6, PIN-8 · guardrail ‡ |

Ratified pins (operator, interview 2026-08-30):

- PIN-1 — degrade-to-today: a failed pin transfer falls back to in-lock full-panel re-audit for
  that task only; worst case equals current behaviour byte for byte.
- PIN-2 — fail-open ace: the ace never turns a mergeable task into a hold.
- PIN-3 — unconfigured path untouched: no `run.maxParallel` ⇒ today's unthrottled fan-out,
  byte-identical.
- PIN-4 — one counter for all seats: the semaphore covers workers, auditors, aces, fix workers
  and gate-audit seats; per-site `batched()` calls retire or sit under it, never beside it.
- PIN-5 — round-budget honesty: a wave-side ace round charges the shared `fixRounds` budget,
  same as today.
- PIN-6 — no soft markers: pin-transfer outcomes never ride an in-band field that downgrades a
  hard escalation; if `HARD_ESCALATION_REASONS` changes, both hand-mirrored copies change in the
  same commit.
- PIN-7 — transfer provenance with a positive test: the record stores both `reauditedTip` and
  `rebasedTip`, asserted by a positive test, not only a negative one.
- PIN-8 — resume safety: the concurrent ace path replays cleanly from the journal; the plan adds
  no new resume fragilities beyond the filed aceBisect residuals.
- PIN-9 — the ADR file has an owning task; its number resolves to the next free at land time.
- PIN-10 — per-seat transfer provenance: which approvals transferred, which re-ran, at which SHA.
- PIN-11 — the transfer rule lands in the standing auditor card and the dispatched prompts in one
  commit.
- PIN-12 — pin transfer requires a gate-green ace tip: no approval transfers to a SHA the gate
  never passed.
- PIN-13 — every path into the merge slot sees a defined, never-lowered `fixRounds`, covered by
  a resume-shaped test.
- PIN-14 — the transfer record stores both patch-ids beside `reauditedTip` and `rebasedTip`, so
  a later audit can re-verify the transfer without replaying the rebase.
- PIN-15 — no code path holds a permit while it awaits a nested dispatch; `batched()` survives
  only permit-free; checked by a completion test at wave width ≥ N (assert completion, never
  peak — a hung run passes any peak ≤ N assertion).
- PIN-16 — `already_upstream` requires at least one task commit
  (`git rev-list --count <dispatchBase>..<taskTip>` > 0) and every one cherry-matched upstream,
  with the matched upstream commits recorded; zero commits escalates, never `merged` (#1895).
- PIN-17 — ALL ceiling constants CAN be increased by +2,048 B IF evicting stale prose first
  does not provide enough budget; every raise is cited to this row via the `Budget-Raise`
  commit trailer (`assert-budget-raise-cited.sh` form). Pre-ratified: operator, 2026-08-30.
- PIN-18 — the delta-scale file set comes from git, never from the agent's self-report alone;
  mismatch routes to the full panel.

## Assumptions ledger

| ID | Assumption | Basis | Blast radius if wrong | Check |
|----|-----------|-------|----------------------|-------|
| A1 | `aceBisect` and `aceReentry` hoist wave-side with the ace (they close over merge-queue scope today) | [assumed: hoist plus the PIN-13 seed rule — if wrong: bisection stays in-lock and the wall-clock win shrinks] | silent accounting break if the merge-slot `fixRounds` seed is left unruled (red-team probe, 2026-08-30) | End state 3's tests, incl. the ace-plus-floor budget test |
| A2 | the ~22-minute measurement holds at the current tip | [assumed: dated snapshot at issue #1913's base — if wrong: priority drops, design stands] | none to correctness | backstop row 1 |
| A3 | the delta-scale file set is `git diff --name-only <preAceTip> <aceSha>`, computed by the dispatch that holds git; the agent's `files_changed` is a cross-check only — absent, empty, or mismatched ⇒ full panel (PIN-18) | (user) | wall-clock only on false mismatch | End state 4's test |
| A4 | the census-test rewrite keeps #742 null-invariant coverage | (verified: `workflow-template.test.mjs` census block at current tip) | a rejected thunk could reject a group | End state 1's tests |

## Non-goals / deferred

Floor-retry delta-scaling (D4) · line-level diff granularity · a second per-site pacing knob ·
red-team scaffold changes (its group slicing already caps its single fan-out correctly) · the
upstream harness concurrency limit (anthropics/claude-code#63938) · issue #1910's resume keying
(harness-side).

## New domain terms · Recommended ADRs

**Pin transfer** — an audit approval carried forward to a new SHA under a mechanical predicate
(patch-equal rebase, or footprint-subset ace diff) instead of a re-convened panel. One new ADR
(owning task: 2.2): "Pin transfer and proportional re-audit" — seat-approval transfer,
rebase pin transfer, global semaphore semantics.

## Commander's Intent

- **Purpose:** a WAR phase spends no re-audit time inside the integration lock unless content
  actually changed there, and `run.maxParallel` (the fan-out cap) is a true global ceiling, at
  most N agents in flight across the whole run.
- **Method:** gate every agent dispatch through one global counting semaphore (a shared counter
  that caps agents in flight) at the dispatch seam (PIN-4). Retire or subordinate the per-site
  `batched()` calls under it. Move the ace batch, its re-audit, and the bisection ladder to the
  wave side. They run per task at the panel-approved tip, concurrent across tasks. Before any
  re-audit or transfer, the task gate runs at the ace tip and must pass; a red gate at the ace
  tip blocks transfer and routes to the normal fix path (PIN-12). Scale each re-audit by the ace
  diff: when the changed-file list is a subset of the findings' file set, only the originating
  seats re-run, otherwise the full panel re-runs. Approvals from seats that did not re-run
  transfer to the new SHA under that same subset rule, with per-seat provenance (PIN-10). At the
  merge slot the refiner requires a conflict-free rebase, then compares `git patch-id --stable`
  of the task's own diff: dispatchBase→tip before the rebase, integration-tip→tip after. On a
  match the audit pin transfers. On a mismatch that one task falls back to the in-lock full-panel
  re-audit, today's behaviour (PIN-1). One arm precedes the fallback: if the post-rebase task
  diff is empty, the task had at least one commit, and `git cherry` matches every task commit
  upstream, record the task `merged` with an `already_upstream` provenance field naming the
  matched upstream commits, no panel, no content merge, `rebasedTip` = the integration tip
  (PIN-16); an empty diff with zero task commits or unmatched patches escalates instead. The
  merge-floor retry loop stays in-lock and full-panel, unchanged. One new ADR records seat-approval transfer, rebase pin transfer, and the global
  semaphore semantics, with an owning task (PIN-9). The transfer rule lands in the standing
  auditor card and the dispatched prompts in one commit (PIN-11). The old per-site wording is
  removed from the four live doc surfaces, and the published per-site lesson gains a dated
  RESOLVED note.
- **Mechanism latitude:** the semaphore's internal shape (counter plus waiter queue, whether
  `batched()` is retired or kept as a permit-free grouping shim — it never holds a permit,
  PIN-15 — and the census-test rewrite that follows), the exact wire shape carrying the
  git-derived file set on the ace result, script versus inline git steps for the patch-id
  check, the RESOLVED note's wording, and structure-test shapes. Substituting any of these mechanisms while the End states and binding guardrails hold
  is not a plan deviation and warrants no issue.
- **Binding guardrails:** PIN-1 to PIN-12 verbatim. Unanimity survives in transferred form:
  every seat approval is accounted for at the merged SHA, per seat. The ace stays fail-open
  (PIN-2). Unconfigured paths stay byte-identical (PIN-3). A wave-side ace round still charges
  the shared `fixRounds` budget (PIN-5). Pin-transfer outcomes never ride an in-band field that
  downgrades a hard escalation, and if `HARD_ESCALATION_REASONS` changes, both hand-mirrored
  copies change in the same commit (PIN-6). The concurrent ace path replays cleanly from the
  journal (PIN-8). No approval transfers to a SHA the gate never passed (PIN-12). The
  `run.maxParallel` shape in `war-config.mjs` is untouched. Prompt-surface ceilings hold:
  eviction first, then at most a +2,048 B cited raise per surface under PIN-17's pre-ratified
  row, and `prompt-surface-budgets.test.mjs` stays green. No check, gate, floor, or backstop
  is waived (ADR 0017).
- **End state:**
  1. With `run.maxParallel: N` set, at most N agent dispatches run at once across every leaf
     dispatch (permits taken only at the leaf dispatch seam, never by an enclosing slot), a
     run at wave width ≥ N completes (PIN-15), and after a run with a rejected dispatch the
     counter drains back to N · check:
     `node --test skills/war/assets/workflow-template.test.mjs` (concurrency-recording,
     completion, and drain tests, printed pass count).
  2. With the knob absent, the dispatch path is byte-identical to today · check:
     `node --test skills/war/assets/workflow-template.test.mjs` (absent-knob census row).
  3. The ace batch, re-audit, and bisection dispatch on the wave side, before the merge queue
     starts, and an ace round plus a floor trip exhausts the shared budget one round earlier
     than an ace-less run (PIN-5, PIN-13) · check:
     `node --test skills/war/assets/workflow-template.test.mjs` (structure test on dispatch
     order plus the budget behaviour test).
  4. Re-audit scale follows the file-level subset rule over the git-derived file set, full
     panel on any file outside the findings' set, and full panel when the git set is absent or
     empty or the `files_changed` cross-check mismatches (PIN-18) · check:
     `node --test skills/war/assets/workflow-template.test.mjs`.
  5. The merge slot transfers the pin on `git patch-id --stable` equality after a conflict-free
     rebase and falls back to the in-lock full-panel re-audit on mismatch, with a positive test
     of the recorded `reauditedTip`, `rebasedTip`, and both patch-ids (PIN-7, PIN-14) · check:
     `node --test skills/war/assets/workflow-template.test.mjs`.
  6. The record names each seat as transferred or re-ran, with its SHA (PIN-10) · check:
     `node --test skills/war/assets/workflow-template.test.mjs`.
  7. The new ADR file exists and names all three transfer forms · check:
     `f=$(grep -lim1 'seat-approval transfer' docs/adr/*.md) && grep -qi 'patch-id' "$f" && grep -qi 'semaphore' "$f" && grep -qF '**Pin transfer**' CONTEXT.md && echo ADR-OK GLOSSARY-OK "$f"`
     (case-insensitive per transfer form, the glossary leg matches the literal entry marker
     `**Pin transfer**` so prompt prose cannot satisfy it, prints the file path).
  8. The per-path OLD tokens are absent from the four enumerated doc surfaces (`CONTEXT.md`,
     `skills/war-room/SKILL.md`, `skills/war/references/schemas.md`,
     `skills/war/references/design.md`) and the new global wording plus the lesson's
     description stamp are present, proven by the committed both-ways guard (input non-empty,
     wrap-aware, lesson at hot path or `archive/`); engine-comment wording is pinned by task
     1.1's census tests · check: `node --test skills/war/assets/doc-semantics.test.mjs`.
  9. The transfer rule appears in both prompt layers · check:
     `grep -qiE 'pin[- ]transfer' agents/war-auditor.md && grep -qiE 'pin[- ]transfer' skills/war/assets/workflow-template.js && echo BOTH-LAYERS-OK`
     (one command, case-insensitive, variant-tolerant). The whole-file grep is the floor: task
     2.1's tests add a `scanTemplateLiterals`-based census row asserting the token inside a
     dispatched prompt literal, so a source-comment-only landing is red.
  10. Full gates green and release slots bumped in lock-step · gate:
     `node --test 'skills/**/*.test.mjs'` plus the shell floor suite via the self-discovery gate.

## Build order (for /war)

Phase 1 (global semaphore, #1897) → Phase 2 (wave-side ace and pin transfer, #1913) → Phase 3
(release). Phase 2 waits on phase 1 because both edit `workflow-template.js`.

## Phase 1 — Global semaphore

### Task 1.1: Semaphore at the dispatch seam
- Files: `skills/war/assets/workflow-template.js`, `skills/war/assets/workflow-template.test.mjs`
- Plan slice: add a counting semaphore (counter plus waiter queue, hand-rolled — the sandbox
  cannot import) acquired around each LEAF agent dispatch when `run.maxParallel` is set — never
  by an enclosing slot whose thunks reach nested dispatches (PIN-15). Retire the four
  `batched()` call sites or keep the helper as a permit-free grouping shim (PIN-4, PIN-15). Preserve the #742 invariant: a
  rejected dispatch resolves to null, never rejects a group, results stay in input order.
  Absent knob ⇒ byte-identical dispatch path (PIN-3). Release every permit in a `finally`: after
  a run with at least one rejected dispatch, the counter is back at N with an empty waiter
  queue, asserted in the concurrency tests (a leaked permit lowers peak, so peak ≤ N alone
  cannot catch it). Rewrite the census tests for the new seam (exact-substring census,
  absent-knob row, new concurrency-recording tests driving a fake `parallel`). Reword the in-file comment surfaces (args-contract header, the #1722 block, the
  site comments) from per-site to global wording.
- Done when: `node --test skills/war/assets/workflow-template.test.mjs`
- requiresTest: true
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 1.2: Doc sweep for the semantics flip
- Files: `CONTEXT.md`, `skills/war-room/SKILL.md`, `skills/war/references/schemas.md`, `skills/war/references/design.md`, `skills/war/assets/skill-doc-contracts.test.mjs`, `docs/learnings/per-site-fanout-throttle-composes-multiplicatively-across-nested-call-sites.md`, `skills/war/assets/doc-semantics.test.mjs`
- Plan slice: rewrite the four sweep surfaces to the global-ceiling semantics, each with its
  decisive OLD token: `CONTEXT.md` Batching helper entry ("slices each fan-out") becomes a
  Dispatch semaphore entry, `skills/war-room/SKILL.md` knob line ("per fan-out site"), the
  schemas.md `maxParallel` comment line ("batching helper" — the shape key list row carries no
  semantics and needs no edit), and `skills/war/references/design.md` §8 ("slices each
  fan-out"). The rewritten wording is construct-free: it states the contract (one global
  counting semaphore caps agent dispatches in flight) and never names `batched()` or any
  engine-internal helper — and the NEW-present tokens in `doc-semantics.test.mjs` are
  construct-free too, or the test re-imports the coupling this ruling removes. design.md literals
  are pinned by `skill-doc-contracts.test.mjs` — update any broken pin in this task. Stamp the
  per-site lesson: a short `RESOLVED (2026-08-30-engine-concurrency-and-pin-transfer, #1897):`
  prefix on the frontmatter `description` (description bytes drive the projection budget —
  keep it terse) plus a dated body note pointing at the global semaphore. Author
  `doc-semantics.test.mjs` as the standing both-ways guard: per-path OLD token absent, NEW
  global wording present, extracted input asserted non-empty, wrap-aware matching, the
  description stamp asserted in the NEW-present half, and the lesson accepted at either its
  hot path or `docs/learnings/archive/` (archiving is a move, the test must survive it). The
  test scopes to THIS task's surfaces only — never `workflow-template.js`, whose rewording
  rides task 1.1's census tests (frozen phase base: 1.1's edits are absent in 1.2's worktree).
  CHANGELOG history and `skills/red-team/SKILL.md` stay untouched (D5, non-goals). Budget
  clause (PIN-17): `CONTEXT.md` headroom is ~1,460 B at the plan's base — measure at the task
  base, evict stale prose first, net growth within headroom, else the pre-ratified ≤ +2,048 B
  cited raise.
- Done when: `node --test skills/war/assets/doc-semantics.test.mjs`
- requiresTest: true
- requiresPackaging: false
- deps: []
- target repo: superproject

## Phase 2 — Wave-side ace and pin transfer

### Task 2.1: Hoist the ace path wave-side, pin transfer at the merge slot
- Files: `skills/war/assets/workflow-template.js`, `skills/war/assets/workflow-template.test.mjs`, `agents/war-auditor.md`, `CONTEXT.md`
- Plan slice: move the ace batch dispatch, its re-audit, `aceBisect`, and `aceReentry` from the
  serial merge queue into the wave thunk, per task at the panel-approved tip (A1). Run the task
  gate at the ace tip before re-audit; red gate blocks transfer and routes to the normal fix
  path (PIN-12). The delta-scale file set comes from `git diff --name-only <preAceTip> <aceSha>`,
  emitted by the ace dispatch that holds git; the existing `files_changed` self-report is a
  cross-check only, and absent, empty, or mismatched routes to the full panel (A3, PIN-18) —
  no new schema field. Apply the file-level subset rule (D3), over `aceRelPath`-normalised
  paths, to choose originating-seat-only vs full-panel re-audit;
  record per seat: transferred or re-ran, at which SHA (PIN-10). At the merge slot, emit
  refiner steps for the patch-equality check (D2); store `reauditedTip` and `rebasedTip` with a
  positive test (PIN-7); mismatch ⇒ in-lock full-panel re-audit for that task only (PIN-1).
  Wave-side ace rounds charge `fixRounds` (PIN-5); no in-band soft markers (PIN-6); journal-safe
  dispatch labels (PIN-8). Seed `task.fixRounds` inside the wave thunk where the audit loop
  exits, before the hoisted ace; narrow the merge-slot seed (the `r.task.fixRounds` assignment
  at the top of the merge queue) to a never-lowering seed, never delete it — a resume can enter
  the merge queue without the wave running in-process (PIN-13, resume-shaped test). Stamp the
  captured pre-ace round value into audit-verdict provenance so filed-issue "audit round" stays
  ace-free, pinned by a new fixture with a successful wave-side ace. Budget clause (PIN-17):
  the `workflow-template.js` prompt-literal share has ~1,981 B and `agents/war-auditor.md`
  ~2,376 B of headroom at the plan's base — measure at the task base, evict stale prose first,
  net growth within headroom, else the pre-ratified ≤ +2,048 B cited raise. Add the
  `**Pin transfer**` glossary entry to `CONTEXT.md` (phase 2, no collision with task 1.2's
  phase-1 edit). Land the transfer rule's wording in BOTH prompt layers here — the
  dispatched prompts and `agents/war-auditor.md` — one commit (PIN-11). Structure tests for End
  states 3–6 and 9.
- Done when: `node --test skills/war/assets/workflow-template.test.mjs`
- requiresTest: true
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 2.2: The pin-transfer ADR
- Files: `docs/adr/00NN-pin-transfer-and-proportional-re-audit.md`
- Plan slice: author the ADR (number resolved to the next free at land time, PIN-9) recording
  the three transfer forms: seat-approval transfer across a footprint-subset ace diff, panel-pin
  transfer across a patch-equal rebase, and the global semaphore semantics — one principle,
  verification cost proportional to risk class (D8's ratified line). Cite the landed engine
  wording from task 2.1.
- Done when: None — record artifact; End state 7's grep is the validator
- requiresTest: false
- requiresPackaging: false
- deps: [2.1]
- target repo: superproject

## Phase 3 — Release

### Task 3.1: Version bump
- Files: `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, `README.md`, `CHANGELOG.md`
- Plan slice: bump all four version slots in lock-step to the next free patch above the live
  base; append the CHANGELOG entry naming the global semaphore semantics and the wave-side ace
  path.
- Done when: None — `version-slots.test.mjs` locks the slots via the self-discovery gate
- requiresTest: false
- requiresPackaging: true
- deps: []
- target repo: superproject

## Deferred validations (backstops)

- Wall-clock improvement on a real multi-task phase (the ~22-minute class re-measured, A2) ·
  why deferred: needs field data from a live run · runner: operator via `/war-review` after the
  next run on this plugin version.
- Semaphore behaviour under the harness's own concurrency cap (min(16, CPUs−2)) — the global
  ceiling composes with, never exceeds, the harness cap · why deferred: only observable in a
  live run's /workflows view · runner: operator via `/war-review`.

## Notes / conscious deviations

PIN-11 is read strictly: both prompt layers change in task 2.1's single commit, so
`agents/war-auditor.md` rides task 2.1, not the ADR task. The ruled literal pin-transfer
predicate (whole-tree diff) is replaced by patch equality with the operator's confirmation (D2) —
the literal form is only ever true for the first task in the queue.

## Open decisions

None.
