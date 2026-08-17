# Handoff/followUp mechanization, schemas.md contract truth, and the provisioning leaf-ref + worktree-hygiene fixes

Converted by `/war-machine --afk` from [docs/specs/2026-08-06-handoff-schemas-contract-design.md](../specs/2026-08-06-handoff-schemas-contract-design.md)
(Part 1 is its decision digest; every spec assumption is carried into the ledger or retired with a stated
reason; spec citations are provenance-only — Part 1 alone carries every decision, constraint, and
mechanic). Issues addressed: #1331, #1333, #1289, #1380, #1381 (#1380 folded into the source spec by
operator direction, 2026-08-12; #1381 folded 2026-08-12 with spec-side AI-declared markers, mirrored
here), and — folded 2026-08-15 by operator direction as the Phase-2 amendment (campaign-era
engine-truth findings, all in this plan's `workflow-template.js`/`schemas.md`/`SKILL.md` family) —
#1395, #1408, #1411, #1413, plus #1430 (folded 2026-08-15 in the same family: it lands on the
**same two constructs** as #1413 and #1411 — the Workflow entry-validation block and the wave-thunk
catch's failure classification). Issue → task mapping: #1331 F1 → Task 1.1 (the file-followups dispatch, D1–D3) +
Task 1.3 (the D4 Checkpoint floor) + Task 1.4 (the D8 signal class); #1331 F3 → Task 1.3 (the D10
clock-read mandate, both surfaces) + Task 1.4 (the degenerate-timestamp `n/a` guard); #1331 F2/F4 →
no task — already addressed (PR #1320; the live auditor card), cite on close; #1333 findings 1+3 →
Task 1.1 (`ACCEPTANCE_IDS_RULE` + worker card) + Task 1.3 (the schemas.md row) per D5; finding 2 →
Task 1.3 (D11); finding 4 → Task 1.3 (both mirrored surfaces, one task); finding 5 → Task 1.1 (the
template trio comments) + Task 1.3 (both schemas.md sites) per D6; finding 6 → Task 1.1 (the schema
comment) + Task 1.3 (the in-place expansion) per D7; #1289 → Task 1.3 (D9); #1380 → Task 1.2 (D12–D14)
+ Task 1.3 (the Setup step-2 sentence); #1381 → Task 1.2 (D19 hygiene assertion + D21 runbook bullet)
+ Task 1.1 (D20 ENV_OUTCOME/prompt/card widening) + Task 1.3 (the schemas.md `worktreeHygiene` row)
(AI-declared); #1395 fixes 1+2 → Task 2.1 items (a)/(b) (fix 3 deferred — Non-goals); #1411 →
Task 2.1 item (c); #1413 → Task 2.1 item (d); #1408 → Task 2.1 item (e) (the SKILL.md JSONL doc) +
Task 2.2 (the CLI's friendly parse failure); #1430 fixes 1–3 → Task 2.1 item (f) (fix 4 deferred —
Non-goals). `/war` files its own epic + task issues regardless
(war-execution-must-file-issues); closing the ten source issues is Lead checkpoint work at phase close
(war-checkpoint-must-close-task-issues) — #1333's per-finding close conditions require each correcting
commit to cite the issue (End state 25).

## Context — the gap / problem

The run-contract layer leans on Lead vigilance and states several untruths; the working/task branch
topology dies on a leaf ref named `dev`. Snapshot base for every measured claim: the repo tip at
`6fff2ee` (2026-08-06) — the session worktree's spec-batch, checkpoint, and spec-patch commits are
docs-only and touch none of these surfaces; every live-byte claim below was re-verified at conversion
(2026-08-12). **This plan stacks on two committed predecessors that rewrite regions of
`skills/war/assets/workflow-template.js` + `skills/war/assets/workflow-template.test.mjs`:**
`docs/plans/2026-08-06-done-when-floor-wiring.md` (plan 3) and
`docs/plans/2026-08-06-gate-audit-finding-routing.md` (plan 6, itself stacked on plan 3) (verified: the
spec's § Open risks ordering declaration + both committed plans' Task 1.1 slices, read at conversion).
Every measured claim in those two files is tagged measured-at-base + expected-post-predecessor; the
construct-level collision census is Note 1.

1. **F1 — follow-up dispositions return unfiled** (verified: issue #1331 (2026-08-06) + its 2026-08-12
   recurrence comment). In the 0.16.0 run every `handoff.followUps[]` entry carried `issue: null`
   across both follow-up-bearing phases (7 + 1 findings) and the Workflow filed none; all 8
   `war-followup` issues exist only because the Lead noticed at the Checkpoint and filed by hand. The
   0.17.0 run reproduced it one minor version later: 9 entries, `issue: null` on every one, zero filed,
   Lead-caught again. The engine can never do better today: the handoff assembly in
   `skills/war/assets/workflow-template.js` maps `issue: m.issue ?? null` over `minorsFiled` (the
   `followUps:` mapping in the handoff block), and no assignment site anywhere sets `.issue` on a
   `minorsFiled` entry — null by construction (verified: live read at conversion, anchored by the
   `followUps:` mapping; the handoff emits on `landed` AND `held:escalation`). The pinned handoff test
   in `skills/war/assets/workflow-template.test.mjs` ('handoff block (criterion 6)') asserts exactly
   this null shape — assert message "followUps carry { issue, reason } — issue is null until the Lead
   files it" (verified: live read). The `followUps` row of the Workflow per-phase return block in
   `skills/war/references/schemas.md` still reads "issue# (null until the Lead files it)" (verified:
   live read). ADR 0013's nothing-drops-silently guarantee is held up by Lead vigilance alone.
2. **F3 — degenerate manifest timestamps** (verified: issue #1331 (2026-08-06) + recurrence comment).
   All 8 `startedAt`/`endedAt` fields across the 0.16.0 run's manifest were one identical placeholder
   literal; the 0.17.0 run reproduced it (`2026-08-11T00:00:00Z` on both fields) — wall-clock unusable
   while looking plausible. Neither the Run-manifest block in `skills/war/references/schemas.md`
   (`startedAt: "<ISO 8601>"` rows) nor the "When — at phase boundaries" bullets in
   `skills/war/SKILL.md` § Run manifest states these fields must be real clock reads (verified: live
   read — `grep -c 'clock read'` = 0 on both surfaces).
3. **F2 / F4 of #1331 — already addressed, closure bookkeeping only.** F2 (the unapplied absorb) was
   fixed post-run in PR #1320; F4's ask is live on `agents/war-auditor.md` ("No pipes, chaining,
   redirects…"; "`git grep` stays denied — the Grep tool is the sweep channel") (verified: issue #1331
   (2026-08-06); live tree read). No work; cite on close.
4. **#1333 — six budget-demoted contract-layer findings, all still live** (each verified by live read
   of `skills/war/references/schemas.md` at conversion, anchored by construct):
   (1) the WorkerResult `acceptance_criteria_covered` row fixes no id lexical form — `"<end-state id>"`
   with no token shape and no join to the verbatim-condition keying its neighbours use (`plan_ref`,
   `endStateAttestations.condition`, handoff `endState.condition`); the landed cross-check merely
   interpolates the ids into the per-task gate-audit seat prompt (`ACCEPTANCE_IDS_RULE` and the
   claimed-ids clause in `workflow-template.js` — verified: live read) and the engine's own A1
   cross-check test fixture already uses 1-based ordinal strings (`['6', '7']`) (verified: live read of
   `workflow-template.test.mjs`); (2) five rows carry the literal "defined-but-not-yet-emitted" marker
   for landed precision-chain producers — measured at conversion: `endStateAttestations` (one),
   `mappedTests` (one, capitalized), `done-unmet` (one), ledger `doneWhen` (one, capitalized), handoff
   `endState` (one) — plus two future-tense parentheticals: the Optional `intent` paragraph's
   "consumed in Phase 3: parsed by Task 3.1, executed … by Task 3.2" and the WorkerResult row's
   "(cross-check lands with Task 3.2)", all describing landed 0.17.0 work as future (a dated snapshot:
   5 marker instances + 2 parentheticals at `6fff2ee`); (3) no join key between End-state ids and the
   verbatim-condition keying (the `phase.endState` row shape `{ condition, tag, check }` carries no
   id); (4) the Optional `intent` paragraph calls `tag` "the condition's parsed D5 evidence tag",
   conflating ADR 0044's D4 evidence-tag family with its D5 End-state tag set — mirrored verbatim in
   `skills/war/SKILL.md` step 1 (verified: live read of both surfaces); (5) the gate-audit-family trio
   is enumerated "per-task, integrated-tip, end-state-only" in the `endStateAttestations` bullet but
   "post-merge, integrated-tip, end-state-only" in the `adjudications` paragraph — one contract file,
   two names for member 1; (6) "(the two-contract rule intact)" cites a label defined nowhere in-file,
   and the bare token now collides with `/red-team`'s pinned "Two-contract summary"
   (`skills/red-team/references/lenses.md`, drift-guarded by `red-team-gate.test.mjs` D7(b) — verified:
   live grep of `two-contract` across `skills/`).
5. **Trio-comment census — conversion correction to the spec** (survey-derived). The spec counts two
   forked trio comments in `workflow-template.js`; the live census finds **three** enumeration sites
   (`grep -n 'integrated-tip, end-state-only'` at conversion): the AuditVerdict schema comment
   ("per-task, …"), the adjudicationClause threading comment ("post-merge, …"), and the endStateBlock
   shared-const comment ("per-task, …" wrapped across two comment lines). All three adopt D6's
   canonical form in the same diff; the §4-style manual survey is the ceiling over this count.
6. **#1289 — the `landResult` row states the opposite of load-bearing behavior.** The row reads
   "`landResult, // MergeResult of the in-flow land, or null if held`" (verified: live read, anchored
   by the `landResult` row of the Workflow per-phase return block). The live engine: the initial land
   dispatch's result *is* `landResult` (non-null on `held:submodule-pr` and `held:land-failed`), both
   re-land arms reassign it on their `submodule-pr` and `landed` branches (the #1245 arm-symmetry
   reassignments — the companion lesson
   `reland-submodule-pr-arm-leaves-stale-landresult-unlike-initial-land` is already RESOLVED-stamped
   for #1245; no stamp belongs to this plan, Context 10), and it is null only when no land was
   dispatched (pre-land holds) **or** the land dispatch died returning nothing (the terminal-else arm —
   `held:land-failed` with `detail: landResult` null) (verified: live read of the land-routing region,
   anchored by the TERMINAL ELSE comment). The issue's suggested wording misses the dead-dispatch null —
   a survey-derived refinement (verified: issue #1289 (2026-08-06) + live read).
7. **#1380 — `resolve-working-branch` cannot cut its dedicated branch when the landing branch is named
   `dev`** (verified: issue #1380 (2026-08-11)). In the 0.17.0 run, Setup step 2 failed hard: the
   collision path engaged and the dedicated-branch cut died with `fatal: cannot lock ref
   'refs/heads/dev/2026-08-11-…': 'refs/heads/dev' exists`. The live construct: the collision arm of
   `cmd_resolve_working_branch` in `skills/war/assets/provision-worktrees.sh` composes
   `resolved="dev/$date-$slug"` and probes nothing about `refs/heads/dev` first (verified: live read at
   conversion, anchored by the `resolved="dev/$date-$slug"` assignment; the script's own
   `branch_exists()` helper is already the exact probe form — `git show-ref --verify --quiet
   refs/heads/$1`). Git mechanism, reproduced in a throwaway temp repo on git 2.50.1 (the issue's own
   version): with a leaf branch `dev` present, `git branch dev/<date>-<slug>` dies with exactly that
   fatal (exit 128); `git show-ref --verify refs/heads/dev` exits 0 precisely when the leaf exists and
   fails when `dev/` is a ref directory — the probe discriminates leaf from namespace with no false
   positive; deleting the leaf makes the identical cut succeed (verified: spec §1 temp-repo probe,
   2026-08-12). **Second surface, one keystroke away:** `workflow-template.js` derives every task
   branch as `war/${planSlug}/p<N>-<id>` (the `taskBranch` arrow) and the polish branch as
   `war/${planSlug}/p<N>-polish` (the `polishBranch` const), so a leaf `refs/heads/war/<planSlug>`
   makes every one of those cuts die identically — and a flat sibling `war-<date>-<slug>` coexists with
   the `war/` ref directory (verified: issue #1380 + spec §1 temp-repo probe). Nothing validates
   `planSlug` cuttability today: the Workflow's entry validation is sandboxed pure JS with no shell, so
   the first failure is the first `git branch` at a mid-phase Provision barrier (verified: live read of
   the entry-validation block).
8. **Predecessor construct census** (the stacking honesty; verified: plans 3 and 6's committed Task 1.1
   slices, read at conversion). Plan 3 edits, in `workflow-template.js`: the `doneWhenFloorClause`
   delimited span, the `MERGE_RESULT` schema block, the `MAKE_DONE_PASS` fix prompt, the done-unmet
   exhaustion tail; in `workflow-template.test.mjs`: the set-minus residue guard, the done-when floor
   threading test, the D3 registry done-when row anchors, new baseline-proceed fixtures; in
   `agents/war-refiner.md`: step 7 + `## Return` (adds `done_when_log_path?`); in
   `skills/war/references/schemas.md`: the `MergeResult` field list + one new `done_when_log_path`
   field entry (and **explicitly leaves the sibling entries' defined-but-not-yet-emitted staleness out
   of scope** — this plan's D11 is that deferred cleanup). Plan 6 edits, in `workflow-template.js`: the
   sweep-close terminal arms (routing sweep-raised findings into `minorsFiled` via `dispositionOf`/
   `demote`), the per-task gate-audit `agent()` prompt (`mappedTestsLine` + the conjunctive clause),
   `authMappedLine`; in `workflow-template.test.mjs`: the mapped-tests/premise/twin tests, the D3
   registry mapped-tests row anchors, plus a new sweep-routing test that asserts the handoff
   `followUps` observable. **This plan's edit regions against that set:** the `FOLLOWUP_FILING_RESULT`
   insertion beside `ENDSTATE_CHECK_RESULT`, the dispatch site immediately before the handoff assembly
   (`let handoff = null`), the args threading beside `const NS = A.agentPrefix ?? …`, the three trio
   comments, and `ACCEPTANCE_IDS_RULE` are all **base-resident** (untouched by plans 3/6); the
   `followUps` handoff mapping this plan makes see stamped values is base-resident but its *feeding
   population* grows under plan 6 (sweep-raised follow-ups join `minorsFiled` — this plan's dispatch
   deliberately files those too); the schemas.md `done-unmet` entry this plan rewrites sits in the
   MergeResult-entries neighborhood plan 3 adds a sibling row to (**expected-post-predecessor**;
   different constructs); `agents/war-refiner.md`'s `## Return` section is expected-post-predecessor
   (plan 3 adds a field enumeration item; this plan adds a separate dispatch-flavor sentence); the
   'handoff block (criterion 6)' null-pin test is base-resident, but the post-plan-6 suite carries the
   new sweep-routing test whose fixtures this plan's dispatch fires under (fail-open keeps them green —
   Task 1.1 slice). Every pair is construct-disjoint; order is enforced by the D16 witnesses.
9. **Zero-hit / witness token census** (conversion measurement; the docs-only session commits cannot
   move them): `file-followups` — 0 hits across `skills/`, `agents/`, `CONTEXT.md`, `docs/learnings/`;
   `war-<date>-<slug>` — 0 hits in `provision-worktrees.sh`, its test, and `skills/war/SKILL.md`;
   `--working` and `cannot lock` — 0 hits in both provision files; `followUps` — 0 hits in
   `skills/war/SKILL.md`; `clock read` — 0 hits on both D10 surfaces; `unfiled follow-ups` and
   `degenerate` — 0 hits in `skills/war-review/SKILL.md`; `1-based ordinal` — 0 hits on all three D5
   surfaces; `WORKTREE_HYGIENE` — 0 hits in `provision-worktrees.sh`; `worktreeHygiene` — 0 hits in
   each of `schemas.md`, `workflow-template.js`, `agents/war-refiner.md`; `Worktree hygiene` — 0 hits
   in `skills/war/references/resume-and-recovery.md` (its only current "hygiene" hit is the
   "Manual-land hygiene" follower-sync bullet) (AI-declared). All new-token pins are non-vacuous by
   construction. Predecessor witnesses:
   `done_when_log_path` = 0 hits in `workflow-template.js` AND `schemas.md` at the base, ≥ 1 after
   plan 3 (its End states); `ABORTED` = 0 hits in `workflow-template.js` at the base, ≥ 1 after plan 6
   (its End state 4) — non-vacuous witnesses.
10. **Lesson-stamp check — none belong to this group** (verified at conversion): the
    `reland-submodule-pr-arm-leaves-stale-landresult…` lesson is already RESOLVED-stamped (#1245,
    2026-08-03); `land-advance-push-first-cas-rejected-token` records the still-true CAS exit contract
    (this plan changes no land-path code — its recipe stays live);
    `workflow-error-at-args-parse-means-lead-side-args…` lives in the local root and its subject is
    untouched here. No lesson files in any task's footprint.
11. **Downstream spine + sibling contention** (verified: sibling spec texts + committed plan `- Files:`
    lists, read at conversion). `docs/specs/2026-08-06-gate2-publication-guard-design.md` § Open risks
    declares it lands **after** `structural-pin-extractors` AND **this group** — a real declared edge
    with this plan as upstream; its stated rationale ("all three touch `skills/war/SKILL.md`,
    `skills/war/assets/skill-doc-contracts.test.mjs`") **overstates this group's footprint** — this
    plan never edits `skill-doc-contracts.test.mjs` (it is hand-scanned only, §4 survey duty). The
    shared `skills/war/SKILL.md` is region-disjoint: gate2's region is the Gate-2 publication flow;
    this plan's regions are Setup step 2, Decompose step 1, § Run manifest, § Per phase args threading,
    and § Checkpoint. gate2's spec also carries an `ensure-origin` four-token census over
    `skills/war/SKILL.md` (one token in Setup step 2) — this plan's step-2 delta introduces **no**
    `ensure-origin` token (stated in the Task 1.3 slice; gate2 re-measures at its own conversion
    regardless). `docs/specs/2026-08-06-structural-pin-extractors-design.md` § Open risks declares a
    binding lands-after on plans 3 and 6 only — **no declared edge onto this group** — but shares
    `workflow-template.test.mjs` (its unit A) and `skills/war/SKILL.md` (its unit B — the Done-when
    intake sub-bullet, Decompose step 3: region-disjoint from this plan's step-1/manifest/per-phase/
    Checkpoint/Setup-2 regions): contention rows for the roadmap, no edge. Committed sibling plan 7
    (`redteam-rounds-config-telemetry`) Task 1.3 edits `skills/war-review/SKILL.md` §3's
    **plan-scoped telemetry table** (the red-team-rounds rows) — construct-disjoint from this plan's
    Task 1.4 edits (§3's *metric table* wall-clock row + the §4 signal catalogue); same-file
    cross-plan contention, no dependency either way. `skills/_shared/doc-cli-consistency.test.mjs`
    (plan 8) polices CLI verbs for four named modules (`campaign-ledger.mjs`, `war-memory.mjs`,
    `war-config.mjs`, `safe-swap.sh`) — `provision-worktrees.sh` is not a member and no edit here
    phrases a new verb for those four (verified: the test's `MODULES` map, live read). The trailing
    release-slot overlap with every sibling is the sanctioned stacked-release pattern.
12. **`ghUser` plumbing already exists Lead-side** (verified: live reads): `overrides.ghUser` ships
    `null` in `war-config.mjs` DEFAULTS (locked by `war-config.test.mjs` C1 — no real handle in any
    committed file); `skills/_shared/gh-preflight.sh` documents the empty-string no-op; the dispatched
    prompts' plugin-script path idiom is the agent-resolved literal
    `'${CLAUDE_PLUGIN_ROOT}/skills/…'` (the provision-barrier `SCRIPT` const is the precedent). What is
    missing is only the Workflow-side threading (`args.ghUser` — 0 hits in `workflow-template.js`).
13. **#1381 — a killed worker's worktree passes to the next generation corrupted and unexamined**
    (verified: issue #1381 (2026-08-12); AI-declared, mirroring the spec's fold markers). In the
    0.17.0 run `2026-08-12-handwritten-date-flagging` (a superproject with two submodules), an
    operator cancel at launch 1 plus a session usage-limit kill at launch 2 left exactly the two
    worktrees whose second-generation worker was killed with the entire submodule staged for deletion
    (13 `D ` paths; ` M <submodule>` in the superproject; submodule HEAD unchanged at the recorded
    SHA), while the completed-worker and never-dispatched worktrees stayed clean. The resolved gate —
    whose first command is `git submodule update --init --recursive` — could not have passed in
    either corrupted worktree, so the phase burned its bounded fix rounds on a phantom and escalated
    as a code problem (`gate_failed` → `audit-blocked` → `held:escalation`) with the provision
    `ENV_OUTCOME` `{ok:true}` and no environmental signal anywhere. **Mechanism (reading A)
    REPRODUCED** (verified: spec §1 probe, 2026-08-12; AI-declared): in a throwaway
    superproject+submodule fixture (12,000-file submodule, git 2.50.1), SIGKILLing the process group
    of `git submodule update --init --force <path>` ~500 ms into a (re)populate checkout reproduced
    the incident's exact shape on the first attempt on both populate paths tried — every tracked file
    staged for deletion, ` M <path>` in the superproject, submodule HEAD unchanged — **plus one
    refinement the issue did not state: the kill also leaves a stale submodule `index.lock`**, which
    makes the `--force`-bearing repair command die `fatal: Unable to create … index.lock: File
    exists` (exit 128) until removed; the gate's own first command — plain
    `git submodule update --init --recursive`, **without** `--force` — exits 0 SILENTLY over the
    corruption (the submodule HEAD already equals the gitlink, so the checkout short-circuits; the
    lock is never touched; every staged deletion remains), so no gate step ever surfaces the lock —
    which strengthens D19's necessity — and the gate fails only later, on the deleted-module imports
    (re-verified in a throwaway fixture at patch time, 2026-08-12; AI-declared). A clean
    fully-populated submodule survived
    nine kills unscathed (the terminal index rewrite is lockfile-atomic) — the corrupting window is
    the (re)populate checkout. Which generation's kill landed in that window in the incident remains
    inferred (the issue's own hypothesis-with-falsifier framing stands), but the mechanism is
    established and the fix design is correct under both readings (A interrupted-checkout,
    B overlapping-generations). **Repair safety VERIFIED** (same probe; AI-declared): with the
    gitlink SHA unchanged and superproject WIP present, removing the stale `index.lock` and running
    `git submodule update --init --force <path>` exited 0, restored the submodule to fully clean,
    left the superproject index empty, and preserved every WIP byte. **Detection nuance:**
    `git submodule status <path>` shows NO marker in the corrupted state (the SHA matches) —
    detection must ride `git status --porcelain -- <path>` in the superproject (the ` M <path>` row)
    or a non-empty `git -C <path> status --porcelain`. **Live constructs** (verified: live read at
    conversion; AI-declared): `cmd_ensure_worktree`'s REUSE branch ("REUSE untouched (only make sure
    the `.war-task` marker is there)") verifies the checkout is on `<branch>`, writes the marker, and
    returns — no usable-state assertion exists (anchored by the reuse branch's
    `write_marker`-then-return sequence); the engine's `ENV_OUTCOME` schema literal requires only
    `ok` and carries no `additionalProperties: false`, so an additive field passes StructuredOutput
    validation mechanically (`staleRemote` is the array-field precedent); `schemas.md`'s ENV_OUTCOME
    block enumerates `ok/taskId/failedCommand/exitCode/stderrTail/provisionSource/preMerged/
    staleRemote` — no hygiene member; `resume-and-recovery.md` has no pre-re-dispatch worktree check
    (its only "hygiene" hit is the Manual-land follower-sync bullet). **Triage note — not a gitlink
    bump:** the corrupted diff reads `-Subproject commit <sha> / +Subproject commit <sha>-dirty` — an
    unchanged SHA cannot be staged as a bump, so `assert-no-submodule-mutation.sh` (mode-160000
    detection) is not the protection here and never fires (verified: issue #1381 + spec §1 probe;
    AI-declared).

## Pivotal constraints

- **The Workflow sandbox has no shell and cannot import** — issue filing must ride a dispatched agent.
  The refiner is the Bash-capable seat that already performs gh writes (submodule PRs on the 2B path),
  and the endstate-check dispatch is the ratified precedent for a refiner-typed, own-schema, fail-open
  evidence dispatch. Likewise #1380's fix 4 cannot live in `workflow-template.js` — the planSlug probe
  rides `provision-worktrees.sh`, the tested git-topology owner the Lead already invokes at Setup.
- **Stacking (binding)**: predecessor plans 3 and 6 land first — both rewrite
  `workflow-template.js`/`workflow-template.test.mjs` regions (construct-disjoint from this plan's,
  Context 8, but the same files). Task 1.1 is authored against the **post-predecessor** shapes and runs
  D16 witnesses as its first post-rebase act; a missed witness ⇒ **halt and report the missing
  predecessor, never improvise**.
- **Prompt-surface split**: the new refiner `dispatchKind` requires the standing card
  (`agents/war-refiner.md`) and the string-built prompt in `workflow-template.js` to change in the same
  commit; the D5 id-form sentence lands on `ACCEPTANCE_IDS_RULE` and `agents/war-worker.md` in the same
  commit (the existing A1 doc-contract registry row binds them). They drift silently otherwise.
- **Fail-open, never a hold**: filing is detection/routing machinery (ADR 0017-consistent); a dead or
  partial filing dispatch must never block a land or add a `held:*`. No new task status, no
  `HARD_ESCALATION_REASONS` or `KNOWN_LAND_DECISIONS` member (ADR 0005; `land-decision.mjs` untouched;
  both hand-mirrored enum blocks byte-untouched).
- **Every gh write batch is preflighted** (ADR 0026): the filing dispatch runs `gh-preflight.sh
  "<expected-account>"` first; the expected account reaches the Workflow as a new optional arg threaded
  from `overrides.ghUser`; empty string is the script's documented no-op — no account handle is ever
  baked into committed prose (redaction-lint clean: no home paths, emails, handles).
- **Pinned tests bind the wording**: the followUps null-pin test flips in the same task as the engine
  change; the A1 registry-row anchors (`/acceptance_criteria_covered/`, `/claimed End-state ids/i`,
  `/empty when the task claims none/i`, `/gate-audit pass cross-checks/i`) must stay green across the
  D5 sentence additions on all three mirrored surfaces.
- **schemas.md is a standing contract read by agents with no access to run artifacts** — every label
  used there must resolve in-file (the finding-6 rule; D7 expands rather than cites).
- **#1380 exit-code discipline**: new dies exit via the plain `die` path (exit 1); `EX_FOREIGN` (3)
  keeps its ADR 0003 foreign-ref meaning, unwidened; the floor-script 0/1/2 law is not in play here.
- **#1380 teardown byte-compatibility**: the fix arms rename only the WORKING-branch fallback; task
  branches stay `war/<planSlug>/p<N>-<id>`, so teardown-phase's `refs/heads/war/$slug/p$num-` prefix
  and ensure-worktree's `war/*/p*-t*` reclaim glob are byte-unchanged (the flat fallback carries no `/`
  and never enters the `war/` ref directory — temp-repo-verified coexistence, Context 7).
- **One fallback, then fail loud** (D13): never a silent retry loop; the die keeps git's own stderr
  (the existing `_tmp_err` idiom).
- **#1381 hygiene is fail-open and invariant-preserving** (AI-declared): the reuse path never gains a
  new die — a failed repair reports (`detected` + detail) and the reuse still returns 0; superproject
  tracked files and untracked deliverables are never touched (NEVER-RESET-ON-REUSE keeps its meaning —
  "untouched" stops meaning "unexamined", nothing more); a dirty submodule whose HEAD does NOT match
  the recorded gitlink SHA is detected and reported, never auto-repaired; detection rides
  `git status --porcelain` (the probe proved `git submodule status` shows no marker in the corrupted
  state); every action is a `WORKTREE_HYGIENE` marker line the barrier captures (the `STALE_REMOTE`
  marker-capture idiom) — never silent, never a hold, no `env-blocked` routing change.
- **Prompt-surface budgets** (AI-declared): `agents/war-refiner.md` measures 32,368 B at conversion —
  **already above its 30,720 B advisory**, with the 34,816 B hard ceiling ≈ 2.4 KB away (less after
  predecessor plan 3's card additions land) — every card addition here stays tight and Task 1.1
  re-measures at the rebased base; `skills/war/SKILL.md` measures 63,197 B against its 64,512 B
  advisory (warning-only; hard 73,728 B not approachable). `prompt-surface-budgets.test.mjs` is the
  arbiter: over-hard is red, over-advisory a logged warning.
- **Platform law**: every committed check whose pattern carries `$`, `"`, backslashes, glob
  metacharacters, or a leading `-` runs `grep -F` (and `-e` for leading-dash patterns) — BSD grep
  treats a mid-pattern `$` as an anchor. Execute-your-literals discipline: run each check as written
  before committing it.
- **Retirement-grep false-red caution**: D6's canonical form contains the substring "per-task" — every
  check asserts the canonical enumeration's **presence at named sites**, never blanket absence of the
  old member names; all greps are file-scoped (this plan, the source spec, the issues, and the landed
  precision-chain artifacts legitimately carry the retired tokens — posterity survivors, Note 6).
- **Anchor by named construct, never line number** — the issues' line refs are dated snapshots; every
  edit anchors by construct (the `followUps:` mapping, `ENDSTATE_CHECK_RESULT`, `let handoff = null`,
  `cmd_resolve_working_branch`, the `resolved="dev/$date-$slug"` assignment, the 'handoff block
  (criterion 6)' test title).
- **Release discipline**: the version bump is its own trailing phase; version literals in this plan and
  the source spec are non-authoritative.

## Resolved design tree

| # | Decision | Resolution | Source |
|---|----------|------------|--------|
| D1 | Who files follow-up findings? | The Workflow, via one refiner **`file-followups:phase-<id>`** dispatch (new `dispatchKind: 'file-followups'`) after the land decision resolves and before handoff assembly, on both handoff-emitting paths (`landed`, `held:escalation`), gated on a non-empty `minorsFiled`. Defense in depth: the Checkpoint floor (D4) + the `/war-review` signal class (D8) backstop it. | spec §3 D1; (verified: issue #1331 (2026-08-06)) |
| D2 | Filing result shape | New `FOLLOWUP_FILING_RESULT` schema const beside `ENDSTATE_CHECK_RESULT` — `{ filed: [{ n, issue }] }`, `n` the 1-based ordinal of the dispatched entry list (the `ENDSTATE_CHECK_RESULT` ordinal idiom), `issue` a number or null. The Workflow stamps matched entries' `.issue` (`minorsFiled[n-1].issue`); unmatched/absent/non-numeric rows stay null. Fail-open: a dead dispatch or non-conforming return logs one line and the phase proceeds — `landDecision` untouched. | spec §3 D2 |
| D3 | Double-filing on resume/relaunch | The dispatch prompt mandates dedup-first: `gh issue list --label war-followup --state open` + exact-title match reuses the existing number instead of filing a duplicate (the retired-token sweep's dedup discipline; `resumeFromRunId` replays the cached journal result, a recovery relaunch re-dispatches — dedup makes both safe). | spec §3 D3 |
| D4 | Checkpoint floor form | A Lead-prose floor bullet in `skills/war/SKILL.md` § Checkpoint (beside the Issue-lifecycle floor): before advancing the DAG past a handoff-emitting phase, every `handoff.followUps[]` entry must carry a non-null `issue`; any null ⇒ the Lead files it now inside the preflighted per-phase gh-write batch and stamps the number into the ledger's `handoff` record — never advance over a null. Extending `assert-issues-filed.sh` into a mechanical check is deferred (Non-goals). | spec §3 D4 |
| D5 | End-state id lexical form + join (#1333 findings 1+3) | Ratify the engine's de-facto form: **the condition's 1-based ordinal in the intent's numbered End-state list, rendered as a string** (`"7"`), resolving to that condition's verbatim text — the `plan_ref` / `endStateAttestations.condition` / handoff `endState.condition` key. Stated in the WorkerResult row comment and mirrored into `ACCEPTANCE_IDS_RULE` + `agents/war-worker.md` in the same commit (Task 1.1 owns the two engine-side mirrors; Task 1.3 the schemas.md row — the deps edge keeps the three coherent at 1.3's rebased base). No `id` member on the `phase.endState` row shape (Non-goals). | spec §3 D5; (verified: issue #1333 (2026-08-06)) |
| D6 | Trio naming fork (finding 5) | One canonical enumeration — **"per-task (post-merge), integrated-tip, end-state-only"** — at both `schemas.md` sites; **all three** forked/unqualified `workflow-template.js` comment sites (Context 5's census correction: AuditVerdict schema, adjudicationClause, endStateBlock shared-const) aligned in the same diff. | spec §3 D6 + conversion census |
| D7 | "two-contract rule" label (finding 6) | Expand in place: "(findings carry defects; attestation rides `endStateAttestations` — two separate contracts)". No new glossary term; avoids colliding with `/red-team`'s pinned Two-contract summary. The engine's mirroring schema comment is aligned in the same diff; test assert messages that merely narrate "(two-contract rule)" are adjudicated exempt (narration, not recipe) iff untouched by the flipped assertions. | spec §3 D7 |
| D8 | Retroactive detection | `/war-review` § 4 gains an **"unfiled follow-ups"** signal class: any `handoff.followUps[]` entry with `issue: null` on a handoff-emitting phase, sourced from the mined workflow-return record in the transcripts, else the run ledger's phase `handoff` field when discoverable; unsourceable ⇒ no row, never fabricated. | spec §3 D8 |
| D9 | `landResult` row (#1289) | Rewrite to the three-case truth: the dispatched land/re-land MergeResult — the initial land and both re-land arms assign it, so `pr_number`/`pr_remote` are readable on `held:submodule-pr`, and `held:land-failed` carries the failing MergeResult; null only when no land was dispatched (pre-land holds) or the land dispatch died returning nothing (the dead-dispatch refinement over the issue's own wording). | spec §3 D9; (verified: issue #1289 (2026-08-06)) |
| D10 | Manifest timestamps (F3) | A real-clock-read mandate on both surfaces — `schemas.md`'s Run-manifest section and `skills/war/SKILL.md` § Run manifest: every `startedAt`/`endedAt` is a clock read captured at the stamped boundary (e.g. `date -u +%Y-%m-%dT%H:%M:%SZ` at stamp time), never a placeholder or copied literal. [assumed: additionally, `/war-review` §3 treats an all-identical timestamp set as degenerate and renders wall-clock `n/a` with a note — an inference beyond F3's schema-side ask; if wrong: drop the render guard (Task 1.4's second item), keep the two doc mandates] | spec §3 D10 (carried [assumed] row → A2) |
| D11 | Stale precision-chain parentheticals (finding 2 + sweep) | Retire every future-tense marker/parenthetical for landed precision-chain work in `schemas.md`: rewrite the 5 marker instances + 2 future-tense parentheticals (Context 4's dated snapshot) to landed past-tense provenance (keep the plan/task citation, e.g. "produced by Task 3.2 of the 2026-08-05 precision-chain plan, landed 0.17.0"), citing #1333. Grep (case-insensitive — two instances capitalize the marker) is the floor; the manual survey duty is the ceiling. Plan 3's own just-added `done_when_log_path` entry is written in landed voice and needs no rewrite — do not touch it. | spec §3 D11 |
| D12 | #1380 working-branch collision name | Sanitize before cutting: the collision arm probes the derived name's single ancestor segment (`git show-ref --verify --quiet refs/heads/dev` — the script's existing `branch_exists` helper form) and on a leaf-ref hit swaps the derived name to the flat **`war-<date>-<slug>`** — slashless, so no segment can be blocked, and a sibling of (never inside) the `war/` task-branch ref directory (temp-repo-verified coexistence). The existing absent/owned/foreign ladder then runs unchanged on the fallback (ADR 0003; foreign still dies `EX_FOREIGN`). [assumed: the owned-reuse check consults both candidate names before any fresh cut, so a blocking leaf deleted mid-run cannot make a resume re-derive a different name — if wrong: probe-order determinism alone decides and the RWB.d-style reuse stays single-candidate] | spec §3 D12 (carried [assumed] row → A3); issue #1380 fix 1 |
| D13 | #1380 actionable cut failure | When the `git branch` cut still dies and the captured stderr matches `cannot lock ref`, the die keeps git's own stderr (the existing `_tmp_err` idiom) and APPENDS the diagnosis and remedy: the blocking leaf ref by name, and "pass an explicit `--working <branch>`" (a real `/war` flag). One fallback (D12), then fail loud — never a silent retry loop. | spec §3 D13; issue #1380 fix 3 |
| D14 | #1380 planSlug cuttability at Setup | Validated inside `cmd_resolve_working_branch` itself — it already receives `<slug>` at Setup step 2, before any Workflow launch: after arg validation, on BOTH paths (collision and no-collision — task branches are cut regardless of which path echoes), probe leaf refs at `refs/heads/war` (impossible-by-convention, one cheap show-ref) and `refs/heads/war/<slug>`; either present ⇒ die naming the leaf and the remedy (pick a different plan slug, or delete/rename the leaf). Covers `taskBranch` AND `polishBranch` (same `war/<planSlug>/` namespace). NOT in `workflow-template.js`: the sandbox has no shell. | spec §3 D14; issue #1380 fix 4 |
| D15 | #1380 rejected alternative | A collision-proofed sub-namespace (`refs/heads/war/run/<date>-<slug>`) is REJECTED: a naming-convention migration touching the teardown/reclaim regexes and every doc surface naming the convention — disproportionate to a defect three local probes close, and still collidable in principle. [assumed: the minimal-diff composite (fixes 1+3+4) closes the report — if wrong: the namespace migration is the follow-up, not a widening of this group] | spec §3 D15 (carried [assumed] row → A4); issue #1380 fix 2, rejected |
| D16 | Predecessor witness protocol | Task 1.1's worker, first act after the standard rebase: `grep -c 'done_when_log_path' skills/war/assets/workflow-template.js` ≥ 1 (plan 3's End state 4) AND `grep -Fc 'ABORTED' skills/war/assets/workflow-template.js` ≥ 1 (plan 6's End state 4; both 0 at the conversion base, so neither passes vacuously). Task 1.3's witnesses: `grep -c 'file-followups' skills/war/assets/workflow-template.js` ≥ 1 (Task 1.1 merged — the deps edge's content), `grep -Fc 'war-$date-$slug' skills/war/assets/provision-worktrees.sh` ≥ 1 (Task 1.2 merged), and `grep -c 'done_when_log_path' skills/war/references/schemas.md` ≥ 1 (plan 3's schemas row — the MergeResult-entries neighborhood is post-predecessor). Any miss ⇒ halt and report, never improvise. | conversion judgment (plan 6's D10 witness shape), logged for /red-team |
| D17 | Task decomposition | Four tasks in Phase 1 — Task 1.1 the engine cluster (`workflow-template.js` + its suite + both agent-card mirrors; forced by the same-file rule, the prompt-surface split, and the A1 mirror law); Task 1.2 the #1380 provision pair (file-disjoint from every other strand; unedged, schedulable early); Task 1.3 the contract-doc truth pass (`schemas.md` + `skills/war/SKILL.md` — one task: the finding-4 fix is a stated mirror across both files, same commit, and each file is touched by multiple strands — same-file rule), `deps: [1.1, 1.2]` (content edges: the rewritten rows name the file-followups dispatch/`ghUser` arg 1.1 authors and the flat fallback/planSlug probe 1.2 authors — dangling forward references at the frozen base); Task 1.4 `skills/war-review/SKILL.md` — plus the standard trailing release phase. No drift guard is split from its fact (rule 7 not in play: each task carries its own tests/pins). | conversion judgment, logged for /red-team; war-strategy §3 |
| D18 | Mock/fixture compatibility | The dispatch options mirror the endstate-check idiom (`agentType: NS + 'war-refiner'`, `label: 'file-followups:phase-<id>'`, `dispatchKind: 'file-followups'`, `schema: FOLLOWUP_FILING_RESULT`, `spawn('refiner')`); test mocks key on `dispatchKind`, and any fixture whose generic refiner mock answers with a non-conforming shape resolves through D2's fail-open (issues stay null, nothing else changes) — the post-predecessor suite (incl. plan 6's sweep-routing test asserting the `followUps` observable) stays green without weakening any predecessor assertion. | conversion judgment, logged for /red-team |
| D19 | #1381 reuse-path hygiene assertion (fix 1) | In `cmd_ensure_worktree`'s REUSE branch, after ensuring the `.war-task` marker: enumerate the worktree's declared submodules (`.gitmodules` paths); for each whose status is dirty AND whose checked-out HEAD matches the superproject's recorded gitlink SHA (`git -C "$path" ls-tree HEAD <sub>`) — detection rides `git status --porcelain -- <path>` in the superproject, because `git submodule status` shows no marker in the corrupted state (Context 13's probe) — remove a stale submodule `index.lock` (the probe-verified repair blocker) and run `git submodule update --init --force <path>`: a safe restore — the SHA is unchanged so no gitlink bump can result, and by the plan-scope contract no submodule work should exist in a superproject-only run. Never touches superproject tracked files or untracked deliverables (the WIP-preservation invariant); a dirty submodule at a non-matching SHA is `detected` and reported, never auto-repaired. Every repair/detection emits a `WORKTREE_HYGIENE` marker line the provision barrier captures (the `STALE_REMOTE` idiom), never silent; a failed repair is likewise reported (`detected` + the failure detail) and the reuse still returns 0 — D20's visibility is the backstop. (AI-declared) | spec §3 D16; issue #1381 fix 1, probe-refined |
| D20 | #1381 `ENV_OUTCOME.worktreeHygiene` (fix 2) | New OPTIONAL array on the env-outcome — `[{ task, path, action: "repaired"\|"detected", detail }]` — carried on an `ok: true` barrier return beside `staleRemote` (same marker-capture idiom), documented in `schemas.md`'s ENV_OUTCOME block, added to the engine's `ENV_OUTCOME` schema literal, mirrored on the refiner card's provision carve-out + return-shape line, and surfaced via ONE census-safe Workflow `log()` line when non-empty (the mechanical run-log carrier — nothing else consumes the array on `ok: true`) plus the schemas.md bullet's Lead phase-report duty. Fail-open and additive: no routing change, no `auditLog` entry, never a hold, absent means nothing found — the engine literal already lacks `additionalProperties: false`, so the field passes validation mechanically (Context 13). (AI-declared) | spec §3 D17; issue #1381 fix 2 |
| D21 | #1381 runbook step (fix 3) | `resume-and-recovery.md`'s `### Recovery relaunch` **Shared mechanics (both entry points)** list gains a **Worktree hygiene** bullet: before re-dispatch, for each reused task worktree whose prior generation errored or was cancelled, check submodule status and unexpected staged deletions; with the gitlink SHA matching the recorded value, remove a stale submodule `index.lock` and run `git submodule update --init --force <path>`; record what was repaired. The held-partial-phase runbook composes it unchanged via its existing "composes the tools above" sentence; no other section of the file changes. (AI-declared) | spec §3 D18; issue #1381 fix 3 — the incident's manual repair, mechanized as doctrine |
| D22 | #1381 generation fence (fix 4) | REJECTED for this group — a per-worktree lease/generation stamp in `.war-task` needs process containment to be meaningful and belongs with the #1365 survives-a-kill family; split per the report's own sequencing. No `.war-task` schema change in this group. (AI-declared) | spec §3 D19; issue #1381 fix 4, deferred |

## Assumptions ledger

| ID | Assumption | Basis | Blast radius if wrong | Check |
|----|-----------|-------|----------------------|-------|
| A1 | Predecessor plans 3 and 6 have LANDED before any Task 1.1 dispatch | the spec's § Open risks ordering declaration; plan 6's committed Note 7 names this group downstream; the roadmap sequences them ahead (ADR 0011) | Task 1.1 edits collide with predecessor rewrites or land against stale shapes | D16 witnesses at the rebased base; miss ⇒ halt-and-report (backstop row) |
| A2 | The `/war-review` degenerate-timestamp `n/a` guard is wanted (D10's second half) | spec §3 D10 (carried [assumed] row); the recurrence comment shows the degenerate case rendering as plausible-looking data | drop Task 1.4's second item; the two doc mandates stand alone | operator veto at /red-team; End state 8 |
| A3 | The owned-reuse check consults BOTH candidate names before any fresh cut (D12) | spec §3 D12 (carried [assumed] row); a mid-run leaf deletion otherwise re-derives a different name on resume | fall back to probe-order determinism + single-candidate RWB.d reuse; the resume-reuse test then pins only the flat candidate | End state 19's test; ratify in /red-team |
| A4 | The D12+D13+D14 composite closes #1380; the sub-namespace migration stays rejected | spec §3 D15 (carried [assumed] row); the issue's own "any one closes the report" | the namespace migration becomes a follow-up plan, never a widening of this one | End states 16–20; ratify in /red-team |
| A5 | No lesson stamps belong to this group | Context 10's conversion check: the one adjacent repo lesson is already RESOLVED-stamped (#1245); the CAS-contract lesson stays true; the args-parse lesson is local-root and unresolved here | a missed stamp is a one-line follow-up edit, never a plan defect | ratify in /red-team |
| A6 | The war-review edits are construct-disjoint from committed plan 7's Task 1.3 | Context 11: plan 7 edits §3's plan-scoped telemetry rows; this plan edits §3's metric-table wall-clock row + §4's catalogue (verified: plan 7's committed slice + live file read) | rebase-conflict at the serial merge across plans — the roadmap's contention row + ADR 0011 serialization absorb it | the roadmap contention table; Task 1.4's re-read at its rebased base |
| A7 | The `skills/war/SKILL.md` regions are disjoint from the unconverted `gate2-publication-guard` (Gate-2 flow) and `structural-pin-extractors` (Done-when intake sub-bullet) specs | Context 11 (verified: both spec texts + the live file's region map); both siblings re-measure at their own conversion, and gate2 declares itself downstream of this group | their conversions re-anchor against this plan's landed step-2/Checkpoint text — exactly what their re-measure duty covers | the roadmap spine (this plan before gate2) + contention rows |
| A8 | D18's fail-open keeps every post-predecessor fixture green without weakening predecessor assertions | the harness mocks key on `dispatchKind` (live read of the fixture idiom); a non-conforming return is indistinguishable from a dead dispatch | adjust the specific fixture's mock (keyed on `dispatchKind`, never by loosening its asserts) at the rebased base | End states 1–3's suite run; Task 1.1's done report names any fixture touched |
| A9 | #1381's fixes 1–3 (D19→D20→D21), sequenced, close the report; the generation fence stays deferred (AI-declared) | spec §3's carried [assumed] selection row; the probe established the mechanism under both readings and verified repair safety | the fence/lease work is revisited with #1365 as its own group — never a widening of this one | End states 21–24; ratify in /red-team |
| A10 | The `read-tree --empty` + dropped-`index.lock` test fixture is **state-equivalent on every surface the hygiene arm reads** to the killed-populate corrupted state (AI-declared) | spec §1 probe: the reproduced state is every tracked file staged for deletion + a stale `index.lock` + unchanged HEAD — the fixture composes exactly those; the one difference — the killed state's submodule worktree is nearly empty while the read-tree fixture keeps files on disk — is a dimension nothing the hygiene arm or its tests consults (detection reads porcelain status + `ls-tree` SHA, never the worktree population) | the hygiene tests pass against a shape the field never produces; the repair path is still probe-verified against the real kill | End states 21–22's fixtures; ratify in /red-team |

## Non-goals / deferred

- **F2 and F4 of #1331** — already addressed (PR #1320; the live auditor card). No work; cite on close.
- **A mechanical Checkpoint floor script** (extending `skills/war/assets/assert-issues-filed.sh` with a
  followUps-nonnull check) — deferred; the prose floor + mechanized filing + signal class close the
  observed gap first. Revisit if a null `issue` ever survives a Checkpoint again.
- **No `id` member on `phase.endState` rows** (finding 3's alternative arm): D5 fixes the join by
  defining the ordinal→condition mapping in prose; widening the row shape would touch the Lead staging
  path, the bare-string normalization, and the endstate-check dispatch for no added mechanical check.
- *(amendment 2026-08-15)* **#1395 fix 3 (the endstate-vs-gate-log corroboration pass) deferred** —
  fixes 1+2 are #1395's independently-landable correctness half (its own text: "1 alone converts a
  false negative into an honest 'unverified'"); the corroboration pass is defense in depth over a
  contradiction the fixed attestation no longer produces. Revisit on recurrence.
- *(amendment 2026-08-15)* **#1430 fix 4 (skipping the land-barrier endstate-check when nothing
  merged) NOT taken** — deliberately rejected, not deferred. The unconditional arm is load-bearing
  by design: a `requiresTest:false`-only phase legitimately merges nothing yet must still execute
  its claimed `check:` conditions, and this plan's own Task 2.1(a) **depends** on that arm running
  (it prepends `run.provision` to it). Item (f)(i) removes the *cause* instead — a phase that never
  started is refused at entry, so the wasted-check state stops being reachable by this route. A
  future "zero tasks even succeeded" guard would need its own adjudication against the
  `requiresTest:false` case and is not claimed here.
- **No engine change to the disposition/demotion ladder** — routing semantics are untouched; only the
  filing of already-routed `follow-up` findings is mechanized. Filing is never retried in-loop; gh
  failure modes (preflight exit 2/3, rate limits, network) all resolve to unfiled entries the
  Checkpoint floor catches.
- **No manifest `dispatchCounts` accuracy work** — the recurrence comment also reports Lead-estimated
  dispatch counts drifting from harness truth; out of this group's scope, no issue claim made.
- **No CONTEXT.md edit, no new ADR** — the new `file-followups` dispatch kind is absorbed by
  CONTEXT.md's existing **Dispatch kind** entry (its discriminator list is explicitly open); D7
  deliberately avoids minting "two-contract rule" as a term; the filing dispatch implements ADR 0013's
  existing guarantee (mechanism, not policy); ADR 0005/0017/0026 are conformed to, not amended.
- **No `/war-review --scavenge` changes** — the new signal class applies to manifest-era runs.
- **No collision-proofed sub-namespace migration** (D15): the branch naming conventions
  (`dev/<date>-<slug>` first choice, `war/<planSlug>/p<N>-<id>` tasks) are unchanged.
- **No generation fence / worktree lease** (#1381 fix 4, D22 — AI-declared): split to the #1365
  survives-a-kill family; no `.war-task` schema change. The `.war-task` marker, the barrier's
  `ok`/`env-blocked` routing, and the evidence gate are unchanged — `worktreeHygiene` is visibility,
  never a hold; routing a failed repair to `env-blocked` via a `STALE_REMOTE`-style carve-out was
  considered and deferred with D22 rather than half-built.

## New domain terms · Recommended ADRs

None (see Non-goals — the open Dispatch-kind list absorbs `file-followups`; no ADR).

## AI-Commander's Intent

- **Purpose:** the run-contract layer stops lying and stops leaning on Lead vigilance — the Workflow
  itself files `follow-up`-routed findings and stamps the issue numbers into `handoff.followUps[]`
  (Checkpoint floor and `/war-review` signal class as backstops), run-manifest timestamps are mandated
  real clock reads, `skills/war/references/schemas.md` tells the truth on every audited row (the
  `landResult` held-path row, the End-state id form and join, the tag-family naming, the trio naming,
  the two-contract label, every stale future-tense parenthetical), `resolve-working-branch` can no
  longer be killed by a landing branch named `dev` nor a `planSlug` shadowed by a leaf ref — one flat
  fallback, actionable dies, Setup-time validation, teardown byte-compatibility preserved — and a
  killed worker's corrupted worktree is repaired-or-reported at reuse instead of being handed silently
  to the next generation: hygiene on `ensure-worktree`'s reuse path, visible in
  `ENV_OUTCOME.worktreeHygiene`, mirrored as recovery doctrine, with WIP preserved byte-for-byte.
- **Method:** one refiner `file-followups` dispatch (preflight-first, dedup-first, fail-open, ordinal
  result shape) between the land decision and the handoff assembly, its card flavor and prompt landing
  in the same commit; thread `args.ghUser` from `overrides.ghUser`; flip the null-pin test and add
  filing coverage; ratify the 1-based-ordinal id form on all three mirrored surfaces; harmonize the
  trio and expand the two-contract label at every named site (three template comment sites — the
  conversion census correction); rewrite the `landResult` row to the three-case truth; mandate clock
  reads on both manifest surfaces and guard `/war-review`'s render; retire the seven stale
  precision-chain markers/parentheticals; in `cmd_resolve_working_branch`, probe leaf `dev` on the
  collision arm (flat `war-<date>-<slug>` fallback through the widened-reuse ownership ladder), append
  the cannot-lock diagnosis + `--working` remedy to the cut-failure die, and validate `war/<planSlug>`
  cuttability on both paths at Setup — four new test cases beside the RWB block; in
  `cmd_ensure_worktree`'s reuse branch, porcelain-detect a dirty gitlink-SHA-matched submodule, drop
  the stale `index.lock`, force-update it, and emit `WORKTREE_HYGIENE` markers the barrier captures
  into the new `ENV_OUTCOME.worktreeHygiene` array (engine literal + prompt + card + schemas.md row +
  recovery-runbook bullet, four hygiene test cases). Author engine work against the post-predecessor
  shapes with halt-on-miss witnesses. Fail-open throughout: no new hold path anywhere.
- **End state:**
  1. When a phase with ≥ 1 `follow-up`-routed finding reaches a handoff-emitting outcome, the Workflow
     dispatches one `file-followups:phase-<id>` refiner step and stamps returned issue numbers so
     `handoff.followUps[]` entries carry non-null `issue` ·
     check: `node --test skills/war/assets/workflow-template.test.mjs` (the flipped null-pin test +
     the new stamping test).
  2. When the filing dispatch dies, returns partial/non-conforming rows, or the preflight fails, the
     Workflow leaves unmatched entries `issue: null` and keeps `landDecision` unchanged — fail-open,
     never a hold ·
     check: `node --test skills/war/assets/workflow-template.test.mjs` (the new fail-open test).
  3. When `minorsFiled` is empty, the Workflow dispatches no filing step ·
     check: `node --test skills/war/assets/workflow-template.test.mjs` (the new no-dispatch test; a
     companion assertion drives the `held:escalation` arm — the dispatch fires there too).
  4. The refiner card enumerates the `file-followups` flavor with its return shape ·
     check: `grep -n 'file-followups' agents/war-refiner.md`.
  5. schemas.md's followUps row no longer claims the Lead-files-it null and names the filing dispatch +
     Checkpoint floor ·
     check: `! grep -n 'null until the Lead files it' skills/war/references/schemas.md && grep -n
     'file-followups' skills/war/references/schemas.md`.
  6. The Checkpoint section carries the DAG-advance floor requiring non-null `issue` on every
     `handoff.followUps[]` entry ·
     check: `grep -n 'followUps' skills/war/SKILL.md` hits inside § Checkpoint (0 hits file-wide at the
     base — a non-vacuous pin).
  7. `/war-review` § 4 carries the "unfiled follow-ups" signal class ·
     check: `grep -n 'unfiled follow-ups' skills/war-review/SKILL.md`.
  8. The Run-manifest contract mandates real clock reads on both surfaces ·
     check: `grep -n 'clock read' skills/war/references/schemas.md skills/war/SKILL.md` (both files
     hit; 0 at the base).
  9. schemas.md's `landResult` row states the three-case truth (non-null on
     `held:submodule-pr`/`held:land-failed`; null only on no-land-dispatched or a dead land dispatch) ·
     check: `! grep -n 'or null if held' skills/war/references/schemas.md`.
  10. The WorkerResult `acceptance_criteria_covered` row, `ACCEPTANCE_IDS_RULE`, and the worker card
      all state the 1-based-ordinal string form with its join to the verbatim-condition key ·
      check: `grep -rn '1-based ordinal' skills/war/references/schemas.md
      skills/war/assets/workflow-template.js agents/war-worker.md` (3 files hit) — then the mandatory
      manual survey over the A1 registry-row anchors (grep is a floor).
  11. "D5 evidence tag" is absent from both mirrored surfaces, replaced by the End-state tag naming ·
      check: `! grep -n 'D5 evidence tag' skills/war/references/schemas.md skills/war/SKILL.md &&
      grep -n 'D5 End-state tag' skills/war/references/schemas.md skills/war/SKILL.md`.
  12. The canonical trio "per-task (post-merge), integrated-tip, end-state-only" appears at both
      schemas.md sites ·
      check: `grep -Fc 'per-task (post-merge), integrated-tip, end-state-only'
      skills/war/references/schemas.md` returns `2` — then the mandatory manual survey of the **three**
      `workflow-template.js` comment sites (Context 5) and the test titles/messages.
  13. The bare "two-contract rule" label is expanded in place ·
      check: `! grep -n 'the two-contract rule intact' skills/war/references/schemas.md && grep -n
      'two separate contracts' skills/war/references/schemas.md`.
  14. Every stale future-tense precision-chain marker/parenthetical is retired to landed provenance ·
      check: `! grep -in 'defined-but-not-yet-emitted' skills/war/references/schemas.md && ! grep -n
      'cross-check lands with Task 3.2' skills/war/references/schemas.md` — then the mandatory manual
      survey for un-tokened future-tense stragglers.
  15. The full gates are green at the integrated tip ·
      gate: the self-discovery gate (`resolveGate` in `war-config.mjs`) — `node --test
      'skills/**/*.test.mjs'` and the documented hooks/skills shell-test loop both exit 0.
  16. When the desired working branch is checked out in some worktree AND a leaf branch `dev` exists,
      `resolve-working-branch` echoes the flat fallback `war-<date>-<slug>`, created at the desired
      tip, checked out nowhere, with ownership recorded ·
      check: `bash skills/war/assets/provision-worktrees.test.sh` (the new leaf-`dev` collision
      fixture — a temp repo cutting branch `dev` before the call, per Context 7's reproduced
      mechanism; the RWB.a assertion set against the fallback name).
  17. When `refs/heads/war/<planSlug>` (or `refs/heads/war`) exists as a leaf ref,
      `resolve-working-branch` exits non-zero before any task dispatch, naming the blocking leaf and
      the remedy ·
      check: `bash skills/war/assets/provision-worktrees.test.sh` (the new planSlug-validation
      fixture — a temp repo with leaf `war/<slug>`).
  18. When a dedicated-branch cut still dies with `cannot lock ref`, the die retains git's own stderr
      and names the blocking leaf ref plus the `--working` remedy ·
      check: `bash skills/war/assets/provision-worktrees.test.sh` (the new actionable-die assertion)
      and `grep -n -e '--working' skills/war/assets/provision-worktrees.sh` (0 at the base) — then the
      mandatory manual same-scope survey of the script's comment header and die sites.
  19. When a run that fell back to `war-<date>-<slug>` resumes, the second call returns the same flat
      branch and never re-cuts it ·
      check: `bash skills/war/assets/provision-worktrees.test.sh` (the new fallback resume-reuse
      case, RWB.d shape).
  20. With the flat fallback in use, the teardown surfaces keep matching task branches — the
      teardown-phase prefix and reclaim-glob literals are byte-unchanged ·
      check: `grep -Fn 'refs/heads/war/$slug/p$num-' skills/war/assets/provision-worktrees.sh` and
      `grep -Fn 'war/*/p*-t*' skills/war/assets/provision-worktrees.sh` (grep -F mandatory — the
      patterns carry `$` and glob metacharacters) — then the mandatory manual same-scope survey of the
      teardown case comments in `provision-worktrees.test.sh`.
  21. When `ensure-worktree` reuses a registered, present worktree whose declared submodule is dirty
      while its checked-out HEAD matches the recorded gitlink SHA, the reuse repairs it via
      `git submodule update --init --force <path>` (removing a stale submodule `index.lock` first —
      the probe-verified repair blocker, Context 13) and emits a `WORKTREE_HYGIENE` marker line, never
      silently ·
      check: `bash skills/war/assets/provision-worktrees.test.sh` (the new hygiene-repair fixture —
      the submodule index emptied deterministically via `git read-tree --empty` + a dropped
      `index.lock`, state-equivalent to the reproduced killed-populate state on every surface the
      hygiene arm reads (A10 — the fixture keeps files on disk where the killed state's tree is
      nearly empty; nothing consulted reads that dimension); asserts post-reuse submodule clean + the
      marker present) and `grep -c 'WORKTREE_HYGIENE'
      skills/war/assets/provision-worktrees.sh` (base count 0; post-land ≥ 1). (AI-declared)
  22. When the reuse-path hygiene repair runs, the superproject WIP survives byte-for-byte — tracked
      modifications and untracked files untouched, nothing staged in the superproject (the
      probe-verified repair-safety property, Context 13) ·
      check: `bash skills/war/assets/provision-worktrees.test.sh` (the WIP-preservation assertions
      inside the same hygiene fixture: a tracked modification + two untracked files persist unchanged
      and `git diff --cached --name-only` stays empty; plus the SHA-mismatch control — a submodule at
      a different HEAD is `detected` only, its tree untouched). (AI-declared)
  23. The ENV_OUTCOME contract enumerates `worktreeHygiene` as an optional fail-open array of
      repaired/detected findings on all three surfaces ·
      check: `grep -c 'worktreeHygiene' skills/war/references/schemas.md
      skills/war/assets/workflow-template.js agents/war-refiner.md` (base counts 0, 0, 0; post-land
      ≥ 1 in each — file-scoped: the spec and this plan also carry the token). (AI-declared)
  24. The Recovery-relaunch shared mechanics carry the Worktree-hygiene step (check submodule status
      and staged deletions before re-dispatch; gitlink-SHA-matched force-update repair; record what
      was repaired) ·
      check: `grep -c 'Worktree hygiene' skills/war/references/resume-and-recovery.md` (base count 0 —
      the file's only current "hygiene" hit is the "Manual-land hygiene" follower-sync bullet;
      post-land ≥ 1) — then the mandatory manual same-scope survey of the file's other recovery entry
      points (the held-partial-phase runbook steps and the `env-blocked` bullet) for missing
      cross-references the grep cannot see. (AI-declared)
  25. Every plan-tracked issue is cited by at least one commit in the phase range `<phase-base>..<tip>` — #1331 for the filing/floor/signal/clock work, #1333 for
      the contract-truth rows and comment alignments, #1289 for the landResult row, #1380 for the
      resolve-working-branch arms and the Setup step-2 sentence, #1381 for the hygiene
      assertion/ENV_OUTCOME widening/runbook bullet, #1395/#1411/#1413/#1408 for Task 2.1's items
      (a–b)/(c)/(d)/(e) and #1408 for Task 2.2 (the per-finding close conditions require the
      citation) ·
      HARD at audit_sha (git log between the phase base and the tip; execution-evidence seat). **Range-level, not per commit** — judged by the execution-evidence seat via `git log --grep=<issue> <phase-base>..<tip>`; the engine-authored **phase-merge** commit and the **phase-close polish** commit cite no issue *by construction* and are compliant. The range does not exist at any task's pre-merge gate, so this can never be a `gate:` member. Ratified lesson: `each-commit-cites-its-issue-endstates-are-judged-over-the-full-phase-range-not-gated-per-commit`. *(Normalized 2026-08-16 by the campaign-wide sweep — the original per-commit phrasing caused a false escalation in plan 6 and was corrected again in plan 7.)*
  26. Release: all four version slots move lock-step to the next free patch above the live integration
      base at land time ·
      check: `node --test skills/war/assets/version-slots.test.mjs` (lock-step + monotonic floor; the
      bump's presence is judged at audit_sha).
  27. *(amendment 2026-08-15, #1395)* The land-barrier endstate checks run with the phase's
      `run.provision` steps applied in `_refinery` before any `check:` command, fail-open ·
      check: `node --test skills/war/assets/workflow-template.test.mjs` (the provision-before-checks
      ordering row).
  28. *(amendment 2026-08-15, #1395)* An endstate artifact that is present, readable, and correctly
      tip-stamped but red for environmental reasons attests `unverified`, never `unmet`, on both the
      engine contract and the `schemas.md` row ·
      check: the suite's environment-red fixture row, and
      `grep -ci 'environment' skills/war/references/schemas.md` ≥ 1 within the
      `endStateAttestations` row (hand-verified placement — grep is a floor).
  29. *(amendment 2026-08-15, #1411)* A post-spawn API/quota/transport death carries its cause in
      `blocked`, classifies as `env-died` (canonical in `land-decision.mjs`, hand-mirrored in
      `workflow-template.js`, drift-guard extended in the same diff), and is absent from
      `HARD_ESCALATION_REASONS` — a phase whose only unmerged tasks are infra deaths is surfaced
      retryable under `--afk`, never a hard escalation ·
      check: `node --test skills/war/assets/workflow-template.test.mjs` (the drift-guard + dead-seat
      + env-died-only-phase rows) and
      `grep -c 'env-died' skills/war/assets/land-decision.mjs skills/war/assets/workflow-template.js`
      ≥ 1 in each, with `env-died` absent from the `HARD_ESCALATION_REASONS` literal in both copies.
  30. *(amendment 2026-08-15, #1413)* Entry validation refuses, before any agent spawns, an assembled
      `intent`/`backstops`/`adjudications` that names a foreign `docs/plans/<slug>.md` or contains
      none of the run's own plan-slug tokens — the plan-3 leak shape (13 × `escape`, 0 ×
      `done-when`) is a reproduced refusal fixture ·
      check: `node --test skills/war/assets/workflow-template.test.mjs` (the leak-refused and
      own-token-accepted rows).
  31. *(amendment 2026-08-15, #1408)* The `--queries` JSONL contract is stated at the flag's first
      mention in `skills/war/SKILL.md`, and a non-JSONL queries file dies with the single-line format
      message (line number named, no raw stack trace), valid-input behavior byte-unchanged ·
      check: `grep -c 'JSONL' skills/war/SKILL.md` ≥ 1 and
      `node --test skills/_shared/war-memory.test.mjs` (the malformed-file and valid-file rows).
  32. *(amendment 2026-08-15, #1430)* A launch whose args omit `plan.file` is refused **at entry,
      with zero agent spawns**, by a problem class distinct from the derivation-trio class — and the
      trio class's message is byte-unchanged (its exact-equality fixture and prose census row stay
      green) ·
      check: `grep -Fc 'requires plan.file' skills/war/assets/workflow-template.js` ≥ 1 (0 at the
      amendment base, Note 14) AND `grep -Fc 'Plan file: ${plan.file}'
      skills/war/assets/workflow-template.js` = 0 (the OLD un-defaulted form is retired — 2 at the
      amendment base) AND `node --test skills/war/assets/workflow-template.test.mjs` (the
      missing-`plan.file`-refused-with-zero-spawns row).
  33. *(amendment 2026-08-15, #1430)* A `pt` prompt-build throw classifies as `held:workflow-error`
      naming the missing input, while every other engine error still yields today's per-task
      `escalate` — the wave-loop invariant (one collected result per dispatched task, never a
      re-entry) is preserved ·
      check: `node --test skills/war/assets/workflow-template.test.mjs` (the `pt`-throw row AND the
      non-`pt` engine-error row — the both-ways proof that exactly one class was narrowed).

## Build order (for /war)

Phase 1 (wave 1 = Tasks 1.1, 1.2, 1.4; wave 2 = Task 1.3 `deps: [1.1, 1.2]`) → Phase 2 (amendment
2026-08-15 — engine truth hardening; wave 1 = Tasks 2.1, 2.2, file-disjoint) → Phase 3 (release).
Phase 2 is a phase, not more Phase-1 tasks, because Task 2.1 edits four files Tasks 1.1/1.3 own — a
phase edge, never a same-file deps dodge.

The 1.3 → {1.1, 1.2} wave edges are content edges, never collision dodges (the file sets are
disjoint): Task 1.3's rewritten rows name the `file-followups` dispatch, `args.ghUser`, and the
`worktreeHygiene` array (authored by 1.1) and the flat `war-<date>-<slug>` fallback, planSlug
validation, and `WORKTREE_HYGIENE` marker (authored by 1.2) — at the frozen phase base every one of
those references would dangle (plan 6's Note-3 precedent: edge over a defined-but-not-yet-emitted
annotation, D17). Witnessed by D16's greps at 1.3's rebased base. Tasks 1.2 and 1.4 are file-disjoint
from everything and dependency-free (the constructs they edit exist at the frozen base and are
untouched by the predecessors).

## Phase 1 — Filing mechanization, contract truth, provisioning hardening

### Task 1.1: Engine cluster — file-followups dispatch, ghUser threading, comment alignments, card mirrors, suite coverage

- Files: `skills/war/assets/workflow-template.js`, `skills/war/assets/workflow-template.test.mjs`, `agents/war-refiner.md`, `agents/war-worker.md`
- Plan slice: **Witness first (D16/A1)** — after the standard rebase onto the integration tip, verify
  `grep -c 'done_when_log_path' skills/war/assets/workflow-template.js` ≥ 1 (plan 3's End state 4) AND
  `grep -Fc 'ABORTED' skills/war/assets/workflow-template.js` ≥ 1 (plan 6's End state 4; both are 0 at
  the conversion base, so neither passes vacuously). A miss means a predecessor has not landed:
  **halt and report, never improvise.**
  **Engine (`workflow-template.js`)** — (a) new `FOLLOWUP_FILING_RESULT` schema const beside
  `ENDSTATE_CHECK_RESULT`: `{ type: 'object', properties: { filed: { type: 'array', items: { type:
  'object', properties: { n: { type: 'number' }, issue: {} } } } } }` with a comment block mirroring
  the sibling's fail-open framing (ADVISORY; a dead/absent dispatch leaves every `issue` null — the
  Checkpoint floor is the catch; D2). (b) dispatch site (D1) immediately **before** the handoff
  assembly (`let handoff = null` — a base-resident anchor): when
  `(landDecision === 'landed' || landDecision === 'held:escalation') && minorsFiled.length > 0`,
  dispatch one refiner mirroring the endstate-check options shape — `agentType: NS + 'war-refiner'`,
  `label: 'file-followups:phase-' + ph.id`, `dispatchKind: 'file-followups'`,
  `schema: FOLLOWUP_FILING_RESULT`, `...spawn('refiner')` (D18). The prompt (pt-tagged per the #931
  census; every interpolation guarded/defaulted): FIRST run the preflight —
  `'${CLAUDE_PLUGIN_ROOT}/skills/_shared/gh-preflight.sh' "<threaded ghUser>"` via the agent-resolved
  `$VAR` literal idiom (the provision-barrier `SCRIPT` const precedent); on preflight exit 2/3 return
  what you have, file nothing. THEN dedup (D3): `gh issue list --label war-followup --state open` —
  an exact-title match reuses the existing number. THEN file one `war-followup` issue per enumerated
  entry — the entries are `minorsFiled` in order, each rendered with its 1-based ordinal `n`, title,
  why-not-absorbable reason (`rationale`), task id, and the phase-epic linkage (`ph.epicIssue` when
  present); return ONLY `{ filed: [{ n, issue }] }`. (c) stamping (D2): for each returned row with a
  numeric `issue`, set `minorsFiled[n-1].issue = issue`; out-of-range/non-numeric/absent rows are
  ignored; a dead dispatch or non-conforming return ⇒ one `log()` line, no hold, `landDecision`
  untouched — the handoff assembly itself is **byte-unchanged** (`issue: m.issue ?? null` now sees
  stamped values). Census safety (the #931 LITERAL_REGISTRY whole-file backtick scan): the fail-open
  log line and every other new string this task adds use census-safe forms — string concatenation
  (the `'file-followups:phase-' + ph.id` label precedent above) or `pt`-tagged literals; no new
  untagged backtick template literal anywhere in the diff (AI-declared). (d) thread new optional
  `args.ghUser` (string, default `''` — the preflight's documented no-op): destructure beside the
  existing `A.agentPrefix` read and document it in the top-of-file args comment block beside
  `agentPrefix`. **#1381 ENV_OUTCOME widening (D20; AI-declared)** — add optional
  `worktreeHygiene: { type: 'array' }` to the `ENV_OUTCOME` schema literal beside `staleRemote`
  (`required` stays `['ok']`; no `additionalProperties` added — the additive field passes validation
  mechanically, Context 13); extend the provision-barrier prompt's classify-and-continue clause and
  its env-outcome return-shape sentence: `WORKTREE_HYGIENE` marker lines emitted by ensure-worktree
  reuse are captured into the optional `worktreeHygiene` array
  (`[{ task, path, action: "repaired"|"detected", detail }]`), carried on the `ok: true` return
  beside `staleRemote` (the `STALE_REMOTE` marker-capture idiom) — visibility only, no routing
  change, the barrier never halts on it. Lead-visibility carrier (the re-grill's P3): when the
  returned array is non-empty, the Workflow emits ONE census-safe `log()` summary line (the
  staleRemote mapping's log idiom, concatenation-built per the census-safety sentence above) so the
  signal reaches the run log — no `auditLog` entry and no routing change, fail-open by design; the
  run-log line plus the schemas.md bullet's Lead phase-report duty are the D20 visibility. The
  `WORKTREE_HYGIENE` literal here and in Task 1.2's emitter are a **deliberate cross-task literal
  coupling**: both slices pin the token verbatim, order-independent at runtime (the capture reads
  whatever markers exist; neither task imports the other). (e) comment alignments (same diff,
  survey-derived): all **three** trio comment sites (Context 5 — the AuditVerdict schema comment, the
  adjudicationClause threading comment, the endStateBlock shared-const comment) adopt D6's canonical
  "per-task (post-merge), integrated-tip, end-state-only"; the schema comment's "(the two-contract
  rule)" adopts D7's expansion; `ACCEPTANCE_IDS_RULE` gains D5's id-form + join sentence — the
  condition's 1-based ordinal in the intent's numbered End-state list rendered as a string (`"7"`),
  resolving to that condition's verbatim text (the `plan_ref` / `endStateAttestations.condition` key) —
  with the existing anchor phrases (`claimed End-state ids`, `empty when the task claims none`,
  `gate-audit pass cross-checks`) preserved verbatim. **Standing cards** — (f)
  `agents/war-refiner.md`: the dispatch-flavor enumeration (the `mode`/`dispatchKind` line) gains
  `file-followups`; a short section beside the endstate-check section states the contract
  (never out-of-mode; preflight-first; dedup-first; fail-open evidence return; never a `MergeResult`);
  `## Return` gains the `FOLLOWUP_FILING_RESULT` sentence beside the evidence/endstate-check sentence
  (same commit as (b) — the prompt-surface split; the `## Return` section is post-plan-3, expected to
  carry `done_when_log_path?` — leave that item byte-untouched); the card is **double-touched** by
  this task (single-task per the same-file rule): the D20 mirror also lands here — the
  provision-barrier flavor's carve-out sentence and the "Return shape (all three)" line gain the
  optional `worktreeHygiene` array (same commit as the prompt change). Budget awareness
  (AI-declared): the card measures 32,368 B at conversion — **already above its 30,720 B advisory**,
  hard ceiling 34,816 B (≈ 2.4 KB of headroom, less after plan 3's card additions land) — keep both
  new spans tight, re-measure `wc -c agents/war-refiner.md` at the rebased base, and run
  `node --test skills/war/assets/prompt-surface-budgets.test.mjs` (over-hard is red; record the
  measured size in the done report). (g) `agents/war-worker.md`: the
  `acceptance_criteria_covered` reporting line gains the same D5 id-form + join sentence (mirror of
  `ACCEPTANCE_IDS_RULE`, same commit; the A1 doc-contract anchors keep matching). **Engine suite
  (`workflow-template.test.mjs`)** — (h) flip the 'handoff block (criterion 6)' null-pin: with a
  follow-up finding and a filing mock (keyed on `dispatchKind: 'file-followups'`) returning
  `{ filed: [{ n: 1, issue: 1234 }] }`, assert `handoff.followUps[0].issue === 1234`; reword the
  assert message off the retired Lead-files-it framing. (i) new coverage: fail-open (dead/absent
  filing mock ⇒ every `issue: null`, `landDecision` unchanged — End state 2); no dispatch when
  `minorsFiled` is empty (assert no `file-followups`-labelled call — End state 3); the dispatch fires
  on `held:escalation` too; an ordinal-mismatch row (out-of-range `n`) is ignored. Delete-the-feature
  check: with the stamping removed the flipped assertion must fail (record the trace in the test
  banner). (j) fixture sweep (A8/D18): run the full suite; any post-predecessor fixture whose generic
  refiner mock now answers the filing dispatch resolves through fail-open — where a fixture must
  change, key its mock on `dispatchKind`, never weaken a predecessor assertion; name every touched
  fixture in the done report. The A1 registry-row anchors and the endStateBlock-sites pins stay green
  (message text may adopt D6's naming). **Straggler sweep** — grep `two-contract`,
  `integrated-tip, end-state-only`, and `null until the Lead files it` across both engine files and
  handle every live match — then the mandatory manual same-scope survey (test titles, assert
  messages, comments; grep is a floor). The sweep grep is known to miss **slash-separated trio
  variants**: the D3-registry ADR-0041 row's comment reads "post-merge / integrated-tip / end-state"
  (measured at conversion) — the survey must cover slash-separated and abbreviated forms; harmonize
  member 1 per D6 or record each as exempt narration with a stated reason (AI-declared). Adjudicated
  exempt: assert messages that merely narrate "(two-contract rule)" and are untouched by the flipped
  assertions (D7). Commits cite #1331 (filing, ghUser), #1333 (D5/D6/D7 alignments), and #1381 (the
  D20 widening) — End state 25.
- Done when: `node --test skills/war/assets/workflow-template.test.mjs`
- requiresTest: true
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 1.2: Provisioning hardening — leaf-ref arms (#1380) + reuse-path hygiene (#1381)

- Files: `skills/war/assets/provision-worktrees.sh`, `skills/war/assets/provision-worktrees.test.sh`, `skills/war/references/resume-and-recovery.md`
- Plan slice: base-resident constructs — no committed 2026-08-06 plan touches any of the three files
  (Context 11); no witness needed. Two-function/one-file shape (AI-declared): the #1380 arms live in
  `cmd_resolve_working_branch`, the #1381 hygiene assertion in `cmd_ensure_worktree` — different
  functions, the same file, so one task by the same-file rule (never parallel).
  **Script (`cmd_resolve_working_branch`)** — (a) D14 first: after arg validation,
  on BOTH paths (collision and no-collision — task branches are cut regardless of which path echoes),
  probe `git show-ref --verify --quiet refs/heads/war` and `refs/heads/war/$slug` (reuse the existing
  `branch_exists` helper form); a leaf hit dies (plain `die`, exit 1 — never `EX_FOREIGN`) naming the
  blocking leaf and the remedy (pick a different plan slug, or delete/rename the leaf) — the second
  surface fails at Setup, not at the first mid-phase `git branch`. The probe validates the `<slug>`
  argument the Lead passes — the same slug that seeds `planSlug`/`runId` by convention; state that
  coupling in the subcommand's comment header. (b) D12: on the collision arm, before composing
  `resolved`, probe `refs/heads/dev` (the derived name's single ancestor segment); a leaf hit swaps
  the derived name to the flat `war-$date-$slug` — the assignment MUST use that unbraced variable
  spelling (`resolved="war-$date-$slug"`, matching the existing `resolved="dev/$date-$slug"` shape),
  and carries a coupling comment stating that a downstream plan-witness grep pins the assignment's
  spelling — the comment must NOT restate the token itself (the coupling-comment-self-match lesson: a
  comment carrying the literal would satisfy the witness without the code) (AI-declared). The
  exists/owned/foreign ladder's arms keep their per-arm semantics but the **reuse arm is consciously
  widened** (A3 — this IS a ladder change, not a pass-through): the owned-reuse check consults BOTH
  candidate names before any fresh cut — an owned `dev/…` OR `war-…` from a prior attempt is reused
  as-is, so a mid-run leaf deletion cannot re-derive a different name on resume; foreign still dies
  `EX_FOREIGN` unchanged; fallback per A3 if red-team vetoes. (c) D13: the cut-failure die keeps the `_tmp_err` stderr
  capture and, when the captured stderr matches `cannot lock ref`, appends the blocking-leaf diagnosis
  (the leaf ref by name) and the remedy "pass an explicit `--working <branch>`". One fallback (D12),
  then fail loud — never a retry loop. (d) invariants: the teardown-phase `refs/heads/war/$slug/p$num-`
  prefix literal and the ensure-worktree `war/*/p*-t*` reclaim glob are **byte-unchanged** (End state
  20); update the subcommand's comment-header contract (the absent/owned/foreign ladder now runs on
  the sanitized candidate, reuse arm widened per (b)) without restating any swept census pattern
  verbatim (the coupling-comment-self-match lesson). **Script (`cmd_ensure_worktree`, D19 —
  #1381; AI-declared)** — in the REUSE branch, after `write_marker`: enumerate the worktree's
  declared submodules (`.gitmodules` paths); for each, when `git -C "$path" status --porcelain --
  <sub>` is non-empty AND the submodule's checked-out HEAD equals the SHA in
  `git -C "$path" ls-tree HEAD <sub>`: remove a stale submodule `index.lock` if present, run
  `git -C "$path" submodule update --init --force <sub>`, and emit one `WORKTREE_HYGIENE` marker
  line per action (`repaired`, or `detected` for a SHA-mismatch or failed repair) for the barrier to
  capture. Marker contract (the `STALE_REMOTE` precedent in the same file): emitted on **stderr**
  with a key=value payload — the `printf 'WORKTREE_HYGIENE path=%s action=%s detail=%s\n' … >&2`
  shape mirroring `STALE_REMOTE branch=… remoteSha=… frozenTip=…` — the fields Task 1.1's barrier
  capture derives `path`/`action`/`detail` from (`task` comes from the dispatch context).
  Exit discipline unchanged: hygiene
  is fail-open — the reuse path never gains a new die, a failed repair reports and returns 0;
  superproject tracked files and untracked entries are never touched (the WIP-preservation
  invariant); update the NEVER-RESET-ON-REUSE policy comment to say examined-but-untouched, without
  quoting any swept pattern. **Doctrine (`resume-and-recovery.md`, D21 — #1381; AI-declared)** —
  the `### Recovery relaunch` **Shared mechanics (both entry points)** list gains the **Worktree
  hygiene** bullet: before re-dispatch, for each reused task worktree whose prior generation errored
  or was cancelled, check submodule status and unexpected staged deletions; with the gitlink SHA
  matching the recorded value, remove a stale submodule `index.lock` and run
  `git submodule update --init --force <path>`; record what was repaired. No other section of the
  file changes (the held-partial-phase runbook composes it via its existing "composes the tools
  above" sentence) — placement call: the bullet rides THIS task, not the doc task, because it is the
  Lead-facing mirror of the D19 mechanics this task authors (same-commit mirror discipline; the file
  is untouched by every sibling). **Suite (`provision-worktrees.test.sh`)** — new cases beside
  the existing RWB block, each in a throwaway temp repo (never the shared fixture — the
  redteam-sandbox-residue lesson): (e) leaf-`dev` collision (End state 16): cut branch `dev`, engage
  the collision path ⇒ the flat fallback is echoed, created at the desired tip, checked out nowhere,
  ownership recorded (the RWB.a assertion set against the fallback name). (f) planSlug validation
  (End state 17): a fixture repo with leaf `war/<slug>` ⇒ resolve-working-branch exits non-zero with
  the leaf named in stderr (the T2.3/T2.6 inline die-capture idiom — `run_in` echoes only the exit
  code). (g) actionable die (End state 18): assert the die output retains a known git-stderr fragment
  AND names `--working` (fragment-disjunction style per the RWB.e precedent — extend fragments on a
  future miss, never weaken). (h) fallback resume-reuse (End state 19): a second call with the same
  owned-file returns the same flat branch and never re-cuts (the RWB.d shape against the fallback
  name). (i) control: leaf `dev` present but `<desired>` checked out nowhere still echoes `<desired>`
  unchanged — the `dev` probe fires only where a cut would happen. **#1381 hygiene cases (D19,
  beside the ensure-worktree block; AI-declared):** (j) hygiene-repair (End state 21) — a
  superproject+submodule fixture whose submodule index is emptied deterministically
  (`git -C <sub> read-tree --empty` + a dropped `index.lock`, state-equivalent to the reproduced
  killed-populate state on every surface the hygiene arm reads, A10) is reused via `ensure-worktree`
  ⇒ the submodule ends clean and a
  `WORKTREE_HYGIENE repaired` marker is emitted; (k) WIP-preservation (End state 22) — a
  superproject tracked modification plus two untracked files ride the same fixture and survive the
  reuse byte-for-byte with nothing staged (`git diff --cached --name-only` empty); (l) SHA-mismatch
  control — a submodule checked out at a different HEAD is `detected` only, its tree untouched;
  (m) clean control — a clean reuse emits no marker. Update the file-header case list;
  hand-scan banners for any count/enumeration prose the additions stale (the banner-count trap) —
  then the mandatory manual same-scope survey of the teardown case comments (End state 20's ceiling).
  Commits cite #1380 (a–i) and #1381 (the D19 arm, the D21 bullet, cases j–m) — End state 25.
- Done when: `bash skills/war/assets/provision-worktrees.test.sh`
- requiresTest: true
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 1.3: Contract-doc truth pass — schemas.md + skills/war/SKILL.md

- Files: `skills/war/references/schemas.md`, `skills/war/SKILL.md`
- Plan slice: **Witness first (D16)** — after the standard rebase, verify
  `grep -c 'file-followups' skills/war/assets/workflow-template.js` ≥ 1 (Task 1.1 merged),
  `grep -Fc 'war-$date-$slug' skills/war/assets/provision-worktrees.sh` ≥ 1 (Task 1.2 merged), and
  `grep -c 'done_when_log_path' skills/war/references/schemas.md` ≥ 1 (predecessor plan 3's schemas
  row). Any miss ⇒ halt and report. **`schemas.md` — one coherent truth pass** (all anchors by
  construct; every row cited to its issue in the commit): (a) WorkerResult
  `acceptance_criteria_covered` row: D5's ordinal form + verbatim-condition join; "(cross-check lands
  with Task 3.2)" → landed provenance (D11). (b) `endStateAttestations` bullet: D6 trio naming; D7
  two-contract expansion ("findings carry defects; attestation rides `endStateAttestations` — two
  separate contracts"); D11 marker retirement. (c) Optional `intent` paragraph: "D5 evidence tag" →
  "D5 End-state tag" (finding 4); D11 on the "consumed in Phase 3…" parenthetical. (d)
  `adjudications` paragraph: D6 trio naming. (e) `mappedTests`, `done-unmet`, ledger `doneWhen`, and
  handoff `endState` rows: D11 marker retirement (case-insensitive sweep — two instances capitalize
  the marker; plan 3's just-added `done_when_log_path` entry is landed-voice already — byte-untouched).
  (f) Workflow per-phase return block: `landResult` row per D9 (the three-case truth, incl. the
  dead-dispatch null); `followUps` row comment → issue# stamped by the Workflow's `file-followups`
  dispatch; null only when filing failed or was skipped — the Checkpoint floor then has the Lead file
  before the DAG advances; `minorsFiled` row comment notes the stamping. (g) Run-manifest section:
  D10's clock-read mandate sentence on the `startedAt`/`endedAt` rows (the literal `clock read` — End
  state 8's pin). (h) Workflow per-phase args contract: the new optional `ghUser` arg documented
  beside `agentPrefix`. (h2) ENV_OUTCOME block (D20 — #1381; AI-declared): a `worktreeHygiene?` row
  in the jsonc shape plus one defining bullet — optional, barrier `ok: true` only,
  `[{ task, path, action: "repaired"|"detected", detail }]` captured from `WORKTREE_HYGIENE` marker
  lines on the ensure-worktree reuse path; fail-open, no routing change, absent means nothing found;
  the Lead surfaces entries in the phase report. **`skills/war/SKILL.md`** (regions verified disjoint
  from the unconverted siblings' — A7; budget note (AI-declared): the file measures 63,197 B at
  conversion against its 64,512 B advisory — warning-only, hard 73,728 B not approachable — keep the
  added sentences tight and re-measure `wc -c` at the rebased base): (i) Decompose step 1: the
  mirrored "D5 evidence tag" → "D5 End-state tag" (the
  stated mirror of (c) — same commit, the reason this file rides this task). (j) § Run manifest,
  "When — at phase boundaries": D10's clock-read mandate (both stamp bullets + the run-end stamp; the
  literal `clock read`). (k) § Per phase: thread `overrides.ghUser` into the Workflow args as
  `args.ghUser` (default `''`), named in the same parenthetical that threads the resolved gate/config.
  (l) § Checkpoint: the D4 follow-up floor bullet beside the Issue-lifecycle floor — never advance
  over a null `issue`; file inside the preflighted per-phase gh-write batch; stamp the ledger's
  `handoff` record. The phase-report rendering already lists "follow-ups filed (issue +
  why-not-absorbable)" — byte-untouched. (m) § Setup step 2 (#1380): the resolve-working-branch
  sentence gains the delta — the resolved branch may be the flat `war-<date>-<slug>` fallback (leaf
  `dev` blocks the namespace, D12), and the subcommand validates `war/<planSlug>` cuttability, dying
  actionably (different slug, or `--working`) before any phase launches (D14). Pin safety: introduce
  **no** `ensure-origin` token in the step-2 delta (the gate2 sibling's census, Context 11) and no
  verb phrasing for the four doc-cli-consistency modules. **Straggler sweep** — file-scoped greps of
  every retired token (`null until the Lead files it`, `or null if held`, `D5 evidence tag`,
  `defined-but-not-yet-emitted` (-i), `cross-check lands with Task 3.2`, `the two-contract rule
  intact`) across BOTH files, handle every match — then the mandatory manual same-scope survey
  (sibling rows, section lead-ins, the schemas.md GitHub-conventions paragraph) for un-tokened
  future-tense or Lead-files-it stragglers; list each as a survey-derived correction and record the
  outcome even when zero. Commits cite #1333 (a–e), #1289 (f), #1331 (f–l), #1380 (m), #1381 (h2) —
  End state 25.
- Done when: None — prose-only contract-doc edit; the mechanical pins are End states 5–6, 8–14's and
  23's greps (file-scoped, grep -F where the pattern carries metacharacters), plus the suite anchors
  that read these files (`workflow-template.test.mjs` doc-claim tests; a discovered gate member).
- requiresTest: false
- requiresPackaging: false
- deps: [1.1, 1.2]
- target repo: superproject

### Task 1.4: war-review — unfiled-follow-ups signal class + degenerate-timestamp guard

- Files: `skills/war-review/SKILL.md`
- Plan slice: (a) § 4 (Friction — the signal catalogue): add the **"unfiled follow-ups"** class (D8) —
  any `handoff.followUps[]` entry with `issue: null` on a handoff-emitting phase (`landed` /
  `held:escalation`), sourced from the mined workflow-return record in the transcripts, else the run
  ledger's phase `handoff` field when discoverable; unsourceable ⇒ no row, never fabricated (the
  section's standing honesty rule). (b) § 3: on the wall-clock metric row, the D10/A2 degenerate
  guard — an all-identical `startedAt`/`endedAt` set is degenerate: render wall-clock `n/a` with a
  note, never a plausible-looking duration (drop this item if red-team vetoes A2). Pin safety: the
  plan-scoped telemetry table (committed sibling plan 7's Task 1.3 region) is **byte-untouched** (A6);
  re-read the file at the rebased base before editing. Run End state 7's grep + a hand-scan of the §4
  class list ordering/lead-in for any count or enumeration prose the addition stales; record the
  outcome even when zero stragglers. Commit cites #1331.
- Done when: None — prose-only skill-doc edit; the mechanical pins are End state 7's grep (no suite
  reads these sections — verified at conversion).
- requiresTest: false
- requiresPackaging: false
- deps: []
- target repo: superproject

## Phase 2 — Engine truth hardening (amendment 2026-08-15: #1395, #1408, #1411, #1413, #1430)

A separate phase, not new Phase-1 tasks, because the engine cluster below edits four files Phase 1
owns (`workflow-template.js` + suite via Task 1.1; `schemas.md` + `skills/war/SKILL.md` via Task
1.3) — same-file work lands in a later phase, never as a deps-edge dodge (code-boundary rule 1).
Phase base: the tip after Phase 1 lands. All five issues are observed-live findings from runs
`2026-08-12-handwritten-date-flagging` (#1395/#1408/#1411, plugin 0.17.0, submodule-bearing target)
and campaign `2026-08-06-survey-batch` — plan 3 (#1413, plugin 0.17.x) and plan 5 phase 1 (#1430,
plugin 0.17.4) — each issue body carries the artifact-level evidence; treat those bodies as this
phase's extended Context. #1413 and #1430 are deliberately **one task**: both harden the same entry
validation block, and #1430's (iii) reuses #1411's cause-propagation in the same wave-thunk catch.

### Task 2.1: Engine cluster — endstate environment truth (#1395), infra-death classification (#1411), args provenance floor (#1413), prefetch JSONL doc (#1408), required-input entry validation (#1430)

- Files: `skills/war/assets/workflow-template.js`, `skills/war/assets/workflow-template.test.mjs`,
  `skills/war/assets/land-decision.mjs`, `skills/war/references/schemas.md`, `skills/war/SKILL.md`
- Plan slice: **Witness first** — after the standard rebase, verify
  `grep -c 'file-followups' skills/war/assets/workflow-template.js` ≥ 1 (Phase 1 landed); a miss ⇒
  halt and report. **(a) endstate environment prep** (#1395 fix 2): at land-barrier entry in
  `workflow-template.js` — locate by construct: the endstate-check dispatch region (the
  `ENDSTATE_CHECK_RESULT` consumer sequenced "ONCE at the integrated tip, before any gate-audit seat
  spawns") — run the phase's `run.provision` steps in `_refinery` (or instruct the dispatched agent
  to, matching how provision steps execute elsewhere) BEFORE any `check:` command executes; fail-open
  (a provision red logs into the endstate artifact preamble and the checks still run — no new hold
  path). **(b) environment-failure attestation** (#1395 fix 1): extend the attestation contract —
  locate by construct: the contract comment defining `unverified` for a missing/unreadable/stale
  artifact — so `unverified` also covers an artifact that is present, readable, and correctly
  tip-stamped but whose red is environmental (setup/collection/import failure: `ModuleNotFoundError`,
  pytest setup `ERROR`, usage/collection exit codes) rather than an evaluated-false condition; the
  dispatched endstate prompt instructs the classification; a met condition must never be attested
  `unmet` for want of environment prep. Mirror into the `schemas.md` `endStateAttestations` row.
  **(c) infra-death classification** (#1411 fixes 1–3): where a dead seat currently yields
  `reason: 'escalate'` with `blocked: "worker returned no result"`, (i) propagate the harness
  failure cause into `blocked` (e.g. `worker died: session limit (resets …)`) when the thunk-catch
  can see it; (ii) introduce the terminal classification `env-died` for a post-spawn
  API/quota/transport death, canonical beside the existing enums in `land-decision.mjs` with the
  hand-mirrored copy in `workflow-template.js` and the drift-guard test updated **in the same diff**
  (the CLAUDE.md enum discipline; the shared-enum-widening lesson — verify #236's guard census and
  extend it, never bypass); (iii) `env-died` is **never** added to `HARD_ESCALATION_REASONS` — a
  phase whose only unmerged tasks are infra deaths surfaces under `--afk` as a retryable
  interruption (resume after reset), not a hard escalation (ADR 0005's `held:workflow-error`
  precedent: infra classes stay soft). **(d) args provenance floor** (#1413): a fail-closed
  coherence assert at Workflow entry validation (beside the existing shape checks, before any agent
  spawns): derive distinctive tokens from `planSlug`/`plan.file` (the slug's non-date words) and
  refuse when the assembled `intent` contains none of them; refuse when `intent`, `backstops`, or
  `adjudications` names a `docs/plans/<slug>.md`-shaped identifier differing from `plan.file`; apply
  the own-token floor to `backstops` and `adjudications` only when they are non-null (they have no
  seat-side recovery path — #1413's worse half). Refusal is at-entry (`held:workflow-error` family —
  the run never starts; per #1413, refuse not warn, since a leaked run starts clean and stays
  green). Document the floor in `schemas.md`'s args-contract section and `skills/war/SKILL.md`'s
  launch paragraph (one sentence each). **(e) prefetch JSONL doc** (#1408): in `skills/war/SKILL.md`'s
  "Prefetch prior lessons" paragraph, state the `--queries <file>` format inline at the flag's first
  mention: JSONL, one `{"label":…,"text":…,"seat"?:…,"topK"?:…,"budget"?:…}` object per line (a
  plain-text line-per-query file dies at `JSON.parse` — Task 2.2 makes that death friendly).
  **(f) required-input entry validation + prompt-build error discrimination** (#1430 fixes 1–3;
  Note 14 carries the base census and the byte-exact coupling): (i) add `plan.file` to the entry
  validation as its **own ungated problem class** — beside `missingPhaseFields`, never inside the
  `missingTrio` class (that one is gated behind `tasks.some(t => !t.branch || !t.worktree)`, and
  `plan.file` is required regardless), pushing a distinct message carrying the zero-at-base literal
  `requires plan.file`; the trio message stays **byte-unchanged** and every existing entry-validation
  fixture that omits `plan.file` gains it (or its expected literal is updated) **in this same diff**,
  so the exact-equality aggregate-message assert and the prose census row stay green. (ii) give the
  two undefended worker-prompt sites the same `?? '<unset>'` default the gate-audit site already
  carries (defense in depth — (i) should make it unreachable; retires the OLD token
  `Plan file: ${plan.file}`, 2 at base → 0). (iii) in the wave-thunk catch, **discriminate a
  prompt-build throw from a task-level engine error**: a `pt` undefined-interpolation throw is an
  args defect, not a task escalation — surface it as `held:workflow-error` naming the missing input
  (reusing (c)'s cause-propagation), so the phase halts loudly instead of draining every task to
  `escalate` and falling through to an empty wave. Scope discipline: (iii) narrows **only** the
  `pt`-throw class; every other engine error keeps today's per-task `escalate` (the #742 wave-loop
  invariant — a task must still terminate in exactly one collected result, never re-enter the wave).
  **(g) `escalate_reason` enforcement-claim truth fix** (*amendment 2026-08-15, plan-5 phase-2 field
  finding; #1410 follow-through*): plan 5's Task 2.1 landed an `escalate_reason` bullet whose
  absolute is false as stated — it says the schema layer re-prompts a non-conforming seat
  "…never a dropped seat, never a land hold", while the bullet **immediately above it** (the
  `severity`-required bullet, the *same* conform-or-retry loop) correctly says "persistent failure
  falls into the existing dropped-seat → audit-blocked lane" — and that lane is live
  (`verdict = 'audit-blocked'` on `seats.length < expected`, two sites in `workflow-template.js`).
  Reword to the accurate claim, which is A8's: the retry loop is the enforcement point, a persistent
  failure falls into the **existing** dropped-seat → audit-blocked lane, so there is **no NEW hold
  path** (a reason-less `escalate` already held as `held:escalation` — the outcome class is
  unchanged). The same absolute is mirrored in `workflow-template.js`'s coupling comment beside the
  `AUDIT_VERDICT` literal (locate by construct, never by line), so both surfaces move in **this one
  diff** — which is why (g) rides Task 2.1 (it owns `schemas.md` *and* `workflow-template.js`) and
  not Task 1.3's schemas.md truth pass, whose footprint would have collided with Task 1.1 on
  `workflow-template.js`. Retire the phrase `never a dropped seat` (measured **3** hits at plan 5's
  phase-2 landed tip `0602094`; re-measure at the rebased base and record). Verified firsthand at
  that tip, and consistent with the seat's own note (auditor disposition `note`; the servitor
  captured the lesson).
  **Tests:** suite rows for (a) provision-before-checks ordering, (b) an environment-red fixture
  attesting `unverified` never `unmet`, (c) the enum drift-guard extension + a dead-seat fixture
  whose `blocked` carries the cause + an env-died-only phase not classifying as a hard escalation,
  (d) a leak fixture (plan-A slug with plan-B intent/backstops — #1413's observed shape) refused at
  entry, and an own-token pass fixture accepted, (g) an OLD-absent assert that `never a dropped seat` is gone from both surfaces plus a
  NEW-present assert on the accurate no-NEW-hold-path wording, and (f) a launch fixture omitting `plan.file` refused at
  entry naming it **with zero agent spawns** (the observed failure spawned Provision first) + a
  `pt`-throw fixture classifying `held:workflow-error` rather than per-task `escalate` + a
  non-`pt` engine-error fixture still yielding per-task `escalate` (the both-ways proof that (iii)
  narrowed exactly one class). Commits cite #1395 (a/b), #1411 (c), #1413 (d),
  #1408 (e), #1430 (f), #1410 (g).
- Done when: `node --test skills/war/assets/workflow-template.test.mjs`
- requiresTest: true
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 2.2: war-memory `--queries` dies friendly on non-JSONL input (#1408)

- Files: `skills/_shared/war-memory.mjs`, `skills/_shared/war-memory.test.mjs`
- Plan slice: in `cmdQueriesBatch` (locate by construct — the per-line `JSON.parse(line)` in the
  `--queries` reader), wrap the parse so a malformed line dies with a **single-line** message naming
  the required shape and the offending line number — e.g.
  `war-memory: --queries requires JSONL ({"label":…,"text":…} per line); line N is not JSON` —
  exit 1, no raw stack trace (today the natural plain-text file dies on a bare `SyntaxError`
  traceback, #1408's reproduced failure). Query semantics for valid JSONL byte-unchanged. Test: a
  plain-text queries file exits 1 with the format message and no `at JSON.parse` frame; a valid
  JSONL file still returns labeled blocks. Commit cites #1408.
- Done when: `node --test skills/_shared/war-memory.test.mjs`
- requiresTest: true
- requiresPackaging: false
- deps: []
- target repo: superproject

## Phase 3 — Release

### Task 3.1: Version slots, lock-step

- Files: `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, `README.md`
- Plan slice: bump all four slots together — `plugin.json` `version`, `marketplace.json`
  `metadata.version` and `plugins[0].version`, the `README.md` `## Status` blurb (replace-in-place,
  never an empty field, no badge) — to the **next free patch above the live integration base at land
  time**; never a resolved version literal (any version literal in this plan or the campaign roadmap
  is non-authoritative). Expected integration base: the tip after predecessors
  `2026-08-06-done-when-floor-wiring` and `2026-08-06-gate-audit-finding-routing` (this plan's
  declared upstream chain) and whichever other 2026-08-06 campaign predecessors the roadmap sequences
  ahead (ADR 0011 stack-and-plow). Standalone fallback: this plan does not run before plans 3 and 6 —
  the D16 witnesses halt-and-report a missing predecessor (never a downshift); on a witnessed
  plain-`/war` run, resolve the next free patch from the four slots themselves. The Status blurb
  names: the Workflow now files `follow-up` findings itself and stamps `handoff.followUps[]` (with a
  Checkpoint floor + `/war-review` signal class), manifest timestamps mandated as real clock reads,
  the schemas.md return-contract truth sweep (landResult, id form + join, tag family, trio naming,
  two-contract expansion, marker retirement), `resolve-working-branch`'s leaf-ref hardening (flat
  `war-<date>-<slug>` fallback, actionable cannot-lock die, Setup-time `war/<planSlug>` validation),
  the `ensure-worktree` reuse-path hygiene (porcelain-detected, SHA-guarded submodule repair
  surfaced in `ENV_OUTCOME.worktreeHygiene`), and the Phase-2 engine-truth set (endstate checks run
  environment-prepared with an environment-red attesting `unverified` never `unmet`; post-spawn
  infra death classified `env-died`, retryable under `--afk`; the fail-closed args provenance floor;
  the `--queries` JSONL contract documented + friendly parse failure) — quoting only identifiers that exist in the landed
  diff (release-blurb lessons: count words match the enumeration; quoted literals byte-match landed
  identifiers; guard semantics stated no wider than the implementation — filing and hygiene are
  fail-open detection/repair, never a hold or a gate).
- Done when: `node --test skills/war/assets/version-slots.test.mjs`
- requiresTest: false
- requiresPackaging: false
- deps: []
- target repo: superproject

## Deferred validations (backstops — AI-declared)

- The manual same-scope survey halves of End states 10, 12, 14, 18, 20, and 24 and the Task 1.3/1.4
  straggler sweeps · why deferred: a hand-scan cannot be a mechanical gate member; done-report-only
  evidence, which gate-audit reads as SOFT and never a hold · runner: the owning task's worker records
  each outcome — mandatory statement even when "zero stragglers"; the Lead re-runs the paired greps at
  phase close.
- The predecessor/dep witnesses (D16/A1) on a standalone run · why deferred: a campaign run discharges
  them by spine order; only a plain-`/war` run can encounter the missing-predecessor state · runner:
  Task 1.1 (two greps) and Task 1.3 (three greps) run them as their first post-rebase act and
  halt-and-report on a miss — the standalone fallback is halt, never improvisation.
- The filing test's pre-fix demonstrated red (delete the stamping → the flipped assertion fails) ·
  why deferred: a delete-and-trace mutation run is uncommittable by design — the committed flipped
  test with its stamping observable is the standing non-vacuity guard · runner: Task 1.1's worker runs
  it locally and records the red in the done report; gate-audit reads it SOFT.
- The live end-to-end filing path (a real `gh` write from a real run's filing dispatch, incl.
  preflight and dedup against live GitHub) · why deferred: uncommittable as a unit test — the engine
  tests mock the dispatch; the Checkpoint floor (D4) is the guaranteed in-run catch and the D8 signal
  class the retroactive audit trail · runner: the first post-release `/war` run's Checkpoint + the
  next `/war-review`; a null that survives both files an issue citing #1331.
- The A3 mid-run-leaf-deletion resume scenario end-to-end (leaf `dev` deleted between the fallback cut
  and a resume) · why deferred: the committed resume-reuse case (End state 19) pins the owned-reuse
  behavior; the live two-candidate race needs a mid-run mutation no fixture replays honestly · runner:
  Task 1.2's worker states the owned-reuse consult order in the done report; a recurrence files an
  issue citing #1380.
- The stale-`index.lock` removal's no-live-holder assumption (D19; AI-declared) · why deferred: sound
  at the observed Setup/Provision moments — no prior generation is legitimately mid-write when
  `ensure-worktree` reuses at the barrier — but a zombie writer surviving its kill is exactly the
  #1365 survives-a-kill family, deferred with D22; no fixture can honestly replay a live concurrent
  holder · runner: a recurrence (a hygiene repair racing a live writer) files an issue citing #1381
  and #1365; the `detected`-on-failed-repair arm plus D20's visibility are the standing detection.
- The live kill-reproduction of the corrupted state (SIGKILL mid-populate) as a committed fixture ·
  why deferred: timing-dependent and non-deterministic in CI — the committed fixture composes the
  byte-equivalent state deterministically (A10, `read-tree --empty` + dropped lock); the probe run at
  spec time established the real mechanism (AI-declared) · runner: none mechanical — a field
  recurrence that the deterministic fixture's shape does not match files an issue citing #1381.
- *(amendment 2026-08-15)* End state 28's placement half (the environment clause sits inside the
  `endStateAttestations` row, not merely somewhere in `schemas.md`) and End state 30's live
  refusal-message quality (the entry refusal names which arg failed and why) · why deferred:
  hand-reads over prose placement and message ergonomics — the greps and suite rows are the
  mechanical floors · runner: Task 2.1's worker states both in the done report; gate-audit reads
  them SOFT.
- *(amendment 2026-08-15)* #1395's field shape end-to-end (a real submodule-bearing target whose
  gate carries setup, run to the land barrier) · why deferred: requires a live foreign-repo run —
  uncommittable as a unit fixture; the ordering row and environment-red fixture are the standing
  guards · runner: none mechanical — a recurrence files an issue citing #1395.

## Notes / conscious deviations

1. **Construct-level collision census vs the predecessors** is Context 8 (the stacking honesty):
   every workflow-template.js/test.mjs edit region here is base-resident or expected-post-predecessor
   with a named witness; merge order (plans 3 → 6 → this plan) is enforced by D16's halt-on-miss
   witnesses, not by luck. Measured claims in moved regions are tagged measured-at-base +
   expected-post-predecessor throughout Part 1 (the batch protocol).
2. **Part 1 corrects one spec undercount** (survey-derived, Context 5): the spec's "two forked
   `workflow-template.js` comments" is three enumeration sites at the live tip — the endStateBlock
   shared-const comment also enumerates the trio (wrapped across two comment lines). D6 aligns all
   three; End state 12's schemas.md count stays 2 and the template sites ride the manual survey.
3. **Task 1.3's two-file footprint is forced, not preferred**: the finding-4 fix is a stated mirror
   pair ("D5 evidence tag" in schemas.md's intent paragraph and SKILL.md step 1 — same commit), and
   each file is touched by four strands of this group (same-file rule ⇒ one task each; the mirror duty
   ⇒ one task total). The 1.3 → {1.1, 1.2} edges are content edges over dangling forward references,
   never rule-7 guard-splits (no mechanical guard is split from its fact — each task carries its own
   pins) and never a same-file dodge (the file sets are disjoint).
4. **Task 1.2 is deliberately unedged** (the spec's tension note, confirmed at conversion):
   `provision-worktrees.sh` + its suite + `resume-and-recovery.md` are file-disjoint from every other
   strand and from every committed plan's footprint — Task 1.2 is schedulable in wave 1 with no
   witnesses. Only the *documentation* riding shared files (the Setup step-2 sentence; the schemas.md
   `worktreeHygiene` row) rides the edged Task 1.3. Placement call (AI-declared): the D21
   `resume-and-recovery.md` bullet joins Task 1.2, not Task 1.3 — it is the Lead-facing mirror of the
   D19 mechanics 1.2 authors (same-commit mirror discipline), and the file is untouched by every
   sibling, so the join adds no contention.
5. **Contention honesty — same-file overlaps with siblings** (Context 11): `skills/war-review/SKILL.md`
   with committed plan 7 (construct-disjoint: plan-scoped table vs metric row + §4 catalogue — A6);
   `skills/war/SKILL.md` and `workflow-template.test.mjs` with the unconverted
   `structural-pin-extractors` (regions verified disjoint; no declared edge onto this group);
   `skills/war/SKILL.md` with the unconverted `gate2-publication-guard`, which declares itself
   downstream of this group — the roadmap must carry this plan → gate2 as a dependency-spine edge,
   and this plan's record corrects gate2's footprint overstatement (this group never edits
   `skill-doc-contracts.test.mjs`). The roadmap also carries plans 3 and 6 → this plan as spine edges
   (Context 8) and contention rows for all four shared files. The trailing release-slot overlap with
   every sibling is the sanctioned stacked-release pattern, not contention.
6. **Posterity survivors.** Historical artifacts keep the retired wordings and are never retro-edited
   (ADR 0046 posture): the five source issues' verbatim quotes, the landed 2026-08-05 precision-chain
   plan and its red-team report, the source spec itself, and this plan's own Part 1 all carry
   `null until the Lead files it`, `or null if held`, the marker literal, and the forked trio forms.
   Every OLD-absent check here is scoped to the single live surface its End state names.
7. **Check sharpenings vs the spec** — knowing deviations, all tightenings: (a) End state 12's
   schemas.md count uses `grep -F` (the canonical literal carries parentheses; platform law applied
   prophylactically); (b) End state 14's marker grep is case-insensitive (`-i`) because two of the
   five live instances capitalize the marker (Context 4) — the spec's lowercase grep would pass with
   those two still live; (c) End state 6 gains the explicit 0-at-base non-vacuity note; (d) D6's
   template alignment covers three sites, not two (Note 2).
8. **The filing dispatch deliberately files sweep-raised follow-ups too**: after predecessor plan 6,
   `minorsFiled` also carries the phase-close sweep's routed findings — D1's gate reads the list, not
   its provenance, so ADR 0013's promise is mechanized uniformly (no carve-out; stated here so the
   auditor does not read the wider population as scope creep).
9. **Intent provenance + AFK conversion record (AI-declared).** The operator directed the pipeline
   `--afk` from this plan onward (2026-08-12): no operator volley ratifies this plan, so it carries
   `## AI-Commander's Intent` and the AI-declared backstops heading (ADR 0014; the afk-conversion
   doctrine), and every row this conversion authored without operator ratification carries an inline
   AI-declared marker. Part 1 and the intent block are distilled from the source spec — itself
   synthesized from `/war-review`-filed run friction (#1331, #1380) and audit follow-ups (#1333,
   #1289), with #1380 operator-folded and #1381 folded with spec-side AI-declared markers (both
   2026-08-12); the spec's flagged [assumed] rows are carried as A2–A4 and A9 with fallbacks intact;
   conversion-time judgments (D16–D18, A5–A8, A10, Notes 1–8, 10–12) are logged for /red-team
   re-verification. **Predecessor-consistency check** (afk-conversion doctrine): all eight committed
   2026-08-06 plans carry the operator-form `## Commander's Intent`; this plan is the batch's first
   AI-form block — the divergence is the heading's provenance marker itself (operator-directed mode
   shift), while tone, scope discipline, and the standing constraints (fail-open never-hold,
   both-surfaces-same-commit, halt-on-miss witnesses, release-trailing) continue the predecessors'
   shape unchanged. Recorded here, never silently shipped.
10. **D-number remapping (AI-declared).** The patched spec's #1381 rows arrive as spec-§3 D16–D19;
    this plan's D16–D18 were already assigned to conversion-time judgments (witness protocol,
    decomposition, mock compatibility), so the #1381 rows land here as **D19–D22** (spec D16 → plan
    D19, D17 → D20, D18 → D21, D19 → D22), each row's Source column carrying the spec number — an
    auditor cross-reading the spec must map by Source, not by ordinal.
11. **Grill folds, self-adjudicated (--afk; AI-declared).** Three grill defects and three nits were
    folded without an operator volley, per the afk self-adjudication rule: (a) F13 — the filing
    dispatch's fail-open log line and label are mandated census-safe (concatenation or pt-tagged; the
    #931 LITERAL_REGISTRY whole-file backtick scan reds an untagged template literal — plan 6's
    explicit-mention precedent); (b) F14 — `agents/war-refiner.md` is already above its advisory
    budget (32,368 B vs 30,720 B; hard 34,816 B), so Task 1.1 carries a keep-it-tight + re-measure +
    budget-suite duty, and Task 1.3 carries the `skills/war/SKILL.md` advisory note (63,197 B vs
    64,512 B, warning-only); (c) Task 1.2(b)'s "ladder runs unchanged" reworded — the A3
    both-candidate consult IS a conscious widening of the reuse arm; (d) the `war-$date-$slug`
    witness literal is bound to 1.2's mandated unbraced assignment spelling via a coupling comment
    that deliberately does not restate the token (a token-bearing comment would satisfy the witness
    grep without the code); (e) the D6 sweep's known miss — the slash-separated trio variant in the
    D3-registry ADR-0041 row comment — is named in Task 1.1's manual-survey duty; (f) the #1381 fold
    judgments (D21 placement in Task 1.2; D19–D22 numbering; A10's fixture-equivalence) are logged in
    Notes 4/10 and the ledger. /red-team re-verifies every one.
12. **#1381 fold discipline (AI-declared).** Every #1381-derived Context item, design-tree row,
    assumption, End state (21–24), task item, and backstop row carries an inline AI-declared marker,
    mirroring the spec's own fold markers — the strand entered the spec after the operator's last
    attended checkpoint and is ratified only by /red-team.
13. **Amendment (2026-08-15, operator-directed): #1395, #1408, #1411, #1413 folded as Phase 2.**
    All four are observed-live engine-truth findings landing in this plan's exact family
    (`workflow-template.js` contracts, `schemas.md`, `skills/war/SKILL.md`, the args/attestation
    surfaces); their issue bodies carry artifact-level evidence and serve as extended Context. A new
    phase because Task 2.1's file set intersects Tasks 1.1 and 1.3 — a phase edge, never a same-file
    deps dodge. Design calls made here and logged for /red-team: (i) #1395 lands fixes 1+2 (fix 3
    deferred, Non-goals); (ii) #1411's `env-died` follows the two-copy enum discipline and stays out
    of `HARD_ESCALATION_REASONS` (the ADR 0005 infra-stays-soft precedent); (iii) #1413's floor is
    refuse-at-entry, never warn (its observed failure mode starts clean and stays green); (iv) #1408
    splits doc (Task 2.1e, this plan's SKILL.md) from CLI (`war-memory.mjs`, Task 2.2 — unowned by
    any other 2026-08-06 plan, zero contention). Amendment surfaces: header issue map, Phase 2, End
    states 25/27–31, build order, release blurb list, Non-goals, roadmap row + contention table
    (same amendment commit).
14. **Amendment (2026-08-15, operator-directed): #1430 folded into Phase 2 Task 2.1 as item (f).**
    Observed live in campaign `2026-08-06-survey-batch` plan 5 phase 1 (plugin 0.17.4): a launch
    whose args omitted `plan.file` dispatched **zero workers** — `pt` threw on the un-defaulted
    `${plan.file}` inside the wave thunk's whole-body catch, which rendered the args defect as a
    per-task `escalate`; every wave-1 task went `done`-not-`succeeded`, the dep-blocked task went
    `dep-failed`, `nextWave()` emptied, and the phase fell through to the land barrier and spent the
    full endstate-check budget against an unchanged base. It folds here rather than standing alone
    because it lands on the **same two constructs Task 2.1 already opens**: #1413's entry-validation
    block (d) and #1411's failure-classification work in the wave-thunk catch (c) — a separate plan
    would be same-file contention for no added coverage.
    **Base census (measured at `6fff2ee`+`6e17335`, plan 5's phase base — re-measure at the rebased
    base and record):** the entry-validation block carries **two** problem classes, one *gated*
    behind `tasks.some(t => !t.branch || !t.worktree)` (the `missingTrio` derivation class) and one
    *ungated* (`missingPhaseFields`) — `plan.file` belongs to the **ungated** family, since every
    worker prompt needs it whether or not tasks carry explicit branch/worktree. `plan.file` is
    interpolated **un-defaulted at two worker-prompt sites** and defended at the gate-audit site with
    `${(plan && plan.file) ?? '<unset>'}`, whose adjacent comment already records that a bare
    `${plan.file}` "would throw phase-wide (held:workflow-error)" — the hazard is known and
    half-fixed in the live tree. Zero-at-base pin tokens: `requires plan.file` (0 in both
    `workflow-template.js` and its suite). OLD-absent token: `Plan file: ${plan.file}` (**2** at
    base — the two undefended sites). **Coupling the fix must respect:** the suite pins the trio
    message *byte-exactly* in two places (an exact-equality aggregate-message fixture and a prose
    census row), so item (f) adds `plan.file` as its **own** problem class and leaves the trio
    message byte-unchanged; any fixture whose args omit `plan.file` must gain it (or its expected
    literal must be updated) **in the same diff**, or the new class silently perturbs that
    exact-equality assert. Amendment surfaces: header issue map, this note, Phase 2 preamble, Task
    2.1 (item (f) + Tests + commit citations), End states 32–33, Non-goals (#1430 fix 4), roadmap
    issue chain (same amendment commit).

## Open decisions

None. The spec's design tree is fully resolved; the spec-flagged veto points (A2 render guard, A3
owned-reuse breadth, A4 composite sufficiency, A9 #1381 fixes-1–3 sufficiency, A10 fixture
equivalence) and every conversion-time and self-adjudicated judgment (Notes 9–12) are logged above
for /red-team — the sole downstream ratifier under `--afk`.
