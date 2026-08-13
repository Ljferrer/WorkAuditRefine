# Handoff/followUp mechanization and schemas.md return-contract truth

Issues: #1331, #1333, #1289, #1380, #1381

The run-contract layer stops lying and stops leaning on Lead vigilance: the Workflow itself files
`disposition: follow-up` findings as `war-followup` issues and stamps the numbers into
`handoff.followUps[]` (with a Checkpoint floor and a `/war-review` signal class as backstops), run-manifest
timestamps become mandated real clock reads, and `skills/war/references/schemas.md` gets a truth sweep —
the `landResult` held-path row, the `acceptance_criteria_covered` id form and join key, the D4/D5 tag-family
conflation, the gate-audit trio naming fork, the undefined "two-contract rule" label, and every stale
"defined-but-not-yet-emitted" parenthetical describing landed precision-chain work as future.

Folded in 2026-08-12 by operator direction: #1380 — the same genus of `/war-review`-filed run friction as
this group's anchor #1331 — hardens the working/task branch topology `resolve-working-branch` owns
against leaf-ref collisions (`refs/heads/dev` blocking `dev/<date>-<slug>`; a leaf `war/<planSlug>`
blocking every task branch).

Also folded in 2026-08-12 by operator direction: #1381 — worktree-environment integrity on the same
provisioning surface: a worker killed mid-flight can leave its task worktree's submodule index corrupted
(every file staged for deletion, gitlink SHA unchanged), and `ensure-worktree`'s deliberate
NEVER-RESET-ON-REUSE policy hands that tree to the next worker generation with no hygiene assertion — the
next worker burns its bounded fix rounds on a phantom code failure while `ENV_OUTCOME` reads `{ok:true}`.
(AI-declared)

## 1. Context — the gap / problem

**F1 — follow-up dispositions return unfiled.** In the 0.16.0 run, every `handoff.followUps[]` entry
carried `issue: null` across both follow-up-bearing phases (7 + 1 findings) and the Workflow filed none;
all 8 `war-followup` issues exist only because the Lead noticed at the Checkpoint and filed by hand
(verified: issue #1331 (2026-08-06)). The live tree matches: the `followUps` row of the Workflow per-phase
return block in `skills/war/references/schemas.md` still reads "issue# (null until the Lead files it)"
(verified: live tree read 2026-08-06). The engine can never do better today — the handoff assembly in
`skills/war/assets/workflow-template.js` maps `issue: m.issue ?? null` over `minorsFiled`, and no
assignment site anywhere sets `.issue` on a `minorsFiled` entry, so the field is null by construction
(verified: live read of the handoff-assembly block, anchored by the `followUps:` mapping). The pinned
handoff test in `skills/war/assets/workflow-template.test.mjs` asserts exactly this null shape ("followUps
carry { issue, reason } — issue is null until the Lead files it") (verified: live read). The disposition
ladder's own guarantee — only `follow-up`-routed findings file as `war-followup`, nothing drops silently
(ADR 0013 prose in `skills/war/SKILL.md` and `skills/war/references/schemas.md` GitHub conventions) — is
therefore held up by Lead vigilance alone.

**F3 — degenerate manifest timestamps.** All 8 `startedAt`/`endedAt` fields across that run's manifest
were one identical placeholder literal, rendering wall-clock unusable while looking plausible (verified:
issue #1331 (2026-08-06)). Neither the Run-manifest block in `skills/war/references/schemas.md` nor the
"When — at phase boundaries" bullets in `skills/war/SKILL.md` § Run manifest states that these fields must
be real clock reads (verified: live tree read 2026-08-06 — no clock-read note exists on either surface).

**F2 / F4 — already addressed, verification only.** F2 (the unapplied absorb) was fixed post-run in PR
#1320 (verified: issue #1331 (2026-08-06)); F4's ask is live on the auditor card — `agents/war-auditor.md`
carries "No pipes, chaining, redirects…" and "`git grep` stays denied — the Grep tool is the sweep
channel" (verified: live tree read 2026-08-06). This spec claims them for closure bookkeeping only.

**#1333 — six budget-demoted contract-layer findings, all still live at the tip** (each verified by live
read of `skills/war/references/schemas.md`, 2026-08-06, anchored by construct):

1. The `acceptance_criteria_covered` row of the WorkerResult block never fixes the id's lexical form —
   "`<end-state id>`" with no token shape and no join to the verbatim-condition keying its neighbours use
   (`plan_ref`, `endStateAttestations.condition`, handoff `endState.condition`) (verified: issue #1333
   (2026-08-06) + live read). The since-landed cross-check merely interpolates the ids into the per-task
   gate-audit seat prompt and leaves the join to seat judgment (verified: live read of
   `skills/war/assets/workflow-template.js` — the `ACCEPTANCE_IDS_RULE` const and the claimed-ids clause
   in the gate-audit prompt builder). The engine's own test fixture already uses 1-based ordinal strings
   (`['6', '7']`) (verified: live read of the A1 cross-check test in
   `skills/war/assets/workflow-template.test.mjs`).
2. The `phase.endState` widening's missing marker is moot in effect — Tasks 3.1/3.2 landed with 0.17.0
   (verified: `.claude-plugin/plugin.json` version 0.17.0 + the land-barrier endstate-check dispatch
   present in `skills/war/assets/workflow-template.js`, live read 2026-08-06) — but the clause was never
   corrected citing #1333, and the parentheticals now lag the other way: the Optional `intent` paragraph
   still says "consumed in Phase 3: parsed by Task 3.1, executed … by Task 3.2", and the WorkerResult row
   still says "(cross-check lands with Task 3.2)", describing landed work as future (verified: live read).
   Five sibling rows still carry the literal "defined-but-not-yet-emitted" marker for landed
   precision-chain producers — `endStateAttestations`, `mappedTests`, `done-unmet`, `doneWhen`, and the
   handoff `endState` row — a dated snapshot of 5 marker instances + 2 future-tense parentheticals at
   base 6fff2ee (2026-08-06).
3. No join key between End-state ids and the verbatim-condition keying (verified: issue #1333
   (2026-08-06) + live read — the `phase.endState` row shape `{ condition, tag, check }` carries no id).
4. The Optional `intent` paragraph calls `tag` "the condition's parsed D5 evidence tag", conflating ADR
   0044's D4 evidence-tag family with its D5 End-state tag set; the same wording is mirrored in
   `skills/war/SKILL.md` step 1 (verified: live read of both surfaces, 2026-08-06).
5. The gate-audit-family trio is enumerated "per-task, integrated-tip, end-state-only" in the
   `endStateAttestations` bullet but "post-merge, integrated-tip, end-state-only" in the `adjudications`
   paragraph — one contract file, two names for member 1 (verified: live read). The same fork exists in
   `skills/war/assets/workflow-template.js` comments (the AuditVerdict schema comment uses "per-task",
   the adjudicationClause comment uses "post-merge") — a survey-derived straggler beyond the issue's own
   file list (verified: live read).
6. "(the two-contract rule intact)" cites a label defined nowhere for schemas.md's readers; since the
   pin, the token has additionally come to name a *different* construct — `/red-team`'s drift-guarded
   "Two-contract summary" (probe side / gate side) in `skills/red-team/references/lenses.md` — so the
   bare label now collides across skill families (verified: live grep of `two-contract` across `skills/`,
   2026-08-06).

**#1289 — the `landResult` row states the opposite of load-bearing behavior.** The row reads
"`landResult, // MergeResult of the in-flow land, or null if held`" (verified: live read 2026-08-06,
anchored by the `landResult` row of the Workflow per-phase return block). The live engine: the initial
land dispatch's result *is* `landResult` (non-null on `held:submodule-pr` and `held:land-failed`), both
re-land arms reassign it on their `submodule-pr` and `landed` branches (the #1245 arm-symmetry
reassignments), and it is null only when no land was dispatched (pre-land holds) **or** the land dispatch
died returning nothing (the terminal-else arm — `held:land-failed` with `detail: null`) (verified: live
read of the land-routing region of `skills/war/assets/workflow-template.js`). The issue's suggested
wording ("null only when no land was dispatched") misses the dead-dispatch null — a survey-derived
refinement (verified: issue #1289 (2026-08-06) + live read of the terminal-else comment).

**#1380 — `resolve-working-branch` cannot cut its dedicated branch when the landing branch is named
`dev`.** In the 0.17.0 run `extraction-suite-gateway-laguna`, Setup step 2 failed hard and
deterministically: the launch-worktree collision path engaged and the dedicated-branch cut died with
`fatal: cannot lock ref 'refs/heads/dev/2026-08-11-extraction-suite-gateway-laguna': 'refs/heads/dev'
exists; cannot create 'refs/heads/dev/2026-08-11-extraction-suite-gateway-laguna'` — the Lead could not
proceed without cutting the working branch by hand (verified: issue #1380 (2026-08-11)). The live
construct: the collision arm of `cmd_resolve_working_branch` in
`skills/war/assets/provision-worktrees.sh` composes `resolved="dev/$date-$slug"` and probes nothing
about `refs/heads/dev` first — the naming convention assumes `dev` is a namespace, but a repo whose
landing branch is literally `dev` (the single most likely name to be occupied) makes it a leaf ref
(verified: live read 2026-08-12, anchored by the `resolved="dev/$date-$slug"` assignment). Git
mechanism, reproduced in a throwaway temp repo on git 2.50.1 (Apple Git-155) — the issue's own git
version: with a leaf branch `dev` present, `git branch dev/2026-08-11-<slug>` dies with exactly that
fatal (exit 128); `git show-ref --verify refs/heads/dev` exits 0 precisely when the leaf exists and
fails (`not a valid ref`) when `dev/` is a ref directory, so the probe discriminates leaf from
namespace with no false positive; deleting the leaf makes the identical cut succeed (verified: temp-repo
probe 2026-08-12). **Second surface, one keystroke away:** `workflow-template.js` derives every task
branch as `war/${planSlug}/p<N>-<id>` (the `taskBranch` arrow) and the phase-close polish branch as
`war/${planSlug}/p<N>-polish` (the `polishBranch` const), so a `planSlug` for which
`refs/heads/war/<planSlug>` already exists as a leaf ref — e.g. a Lead who reasonably sets `planSlug` so
that `war/<planSlug>` matches a `war/<date>-<slug>`-shaped working branch — makes every one of those
cuts die identically (verified: issue #1380 (2026-08-11) + temp-repo probe 2026-08-12 — a leaf
`war/2026-08-11-<slug>` blocks `war/2026-08-11-<slug>/p1-t1`, while the date-less slug cuts fine and a
flat sibling `war-<date>-<slug>` coexists with the `war/` ref directory). Nothing validates `planSlug`
cuttability today: the Workflow's entry validation (the missing-trio block) is sandboxed pure JS with no
shell (§2), so the first failure is the first `git branch` at a mid-phase Provision barrier (verified:
live read of the entry-validation block, 2026-08-12).

**#1381 — a killed worker's worktree passes to the next generation corrupted and unexamined.** In the
0.17.0 run `2026-08-12-handwritten-date-flagging` (target `Sequoia-Port/AutoIndex`, a superproject with
two submodules), an operator cancel at launch 1 plus a session usage-limit kill at launch 2 left exactly
the two worktrees whose second-generation worker was killed with the entire `auto_index/stacks/assets`
submodule staged for deletion (13 `D ` paths; ` M <submodule>` in the superproject; submodule HEAD
unchanged at the recorded SHA), while the completed-worker and never-dispatched worktrees stayed clean.
The resolved gate — whose first command is `git submodule update --init --recursive` — could not have
passed in either corrupted worktree (eight of the deleted paths are Python modules the target's CDK
stacks import), so the phase burned its bounded fix rounds on a phantom and escalated as a code problem
(`gate_failed` → `audit-blocked` → `held:escalation`) with the provision `ENV_OUTCOME` `{ok:true}` and no
environmental signal anywhere in the run; the manual repair that worked, run from the worktree root, was
`git submodule update --init --force <path>` (verified: issue #1381 (2026-08-12); AI-declared).

**Mechanism (reading A) REPRODUCED (verified: probe 2026-08-12; AI-declared).** In a throwaway
superproject+submodule fixture (12,000-file submodule; git 2.50.1 (Apple Git-155), macOS), SIGKILLing the
process group of `git submodule update --init --force <path>` ~500 ms into a (re)populate checkout
reproduced the incident's exact shape on the FIRST attempt on both populate paths tried (fresh-clone
populate, and deinit-cached repopulate): every tracked file staged for deletion (12,000 `D ` rows), a
handful of partially-written `??` files, ` M <path>` in the superproject, submodule HEAD unchanged — plus
one refinement the issue did not state: the kill also leaves a stale submodule `index.lock`, which makes
the `--force`-bearing repair command die `fatal: Unable to create ... index.lock: File exists`
(exit 128) until it is removed; the gate's own first command — plain
`git submodule update --init --recursive`, without `--force` — exits 0 silently over the corruption
(the submodule HEAD already equals the gitlink, so the checkout short-circuits and the lock is never
touched; every staged deletion remains), so no gate step ever surfaces the lock and the gate fails only
later, on the deleted-module imports (re-verified twice at re-grill, 2026-08-12; AI-declared). The
corrupting window is the (re)populate checkout, whose
pre-state index is empty: a clean fully-populated submodule survived nine process-group kills at
100–550 ms unscathed (the terminal index rewrite is lockfile-atomic), and a kill mid `--force`-restore of
a dirty populated tree leaves unstaged ` M` rows, never staged deletions. Which generation's kill landed
in a populate window in the incident itself remains inferred — the issue's own hypothesis-with-falsifier
framing for the causal step stands — but the mechanism is now established, and the fix design below is
correct under both readings (A interrupted-checkout, B overlapping-generations). (AI-declared)

**Repair safety VERIFIED (verified: probe 2026-08-12; AI-declared).** In the corrupted fixture, with the
gitlink SHA unchanged and superproject WIP present (a tracked modification + two untracked files),
removing the stale `index.lock` and running `git submodule update --init --force <path>` exited 0,
restored the submodule to fully clean, left the superproject index empty (nothing staged), and preserved
every WIP byte. Detection nuance from the same probe: `git submodule status <path>` shows NO marker in
the corrupted state (the SHA matches), so detection must ride `git status --porcelain -- <path>` in the
superproject (the ` M <path>` row) or a non-empty `git -C <path> status --porcelain`. (AI-declared)

**The live constructs (verified: live read 2026-08-12; AI-declared).** `cmd_ensure_worktree`'s REUSE
branch in `skills/war/assets/provision-worktrees.sh` (policy comment: "Already a registered worktree, dir
present -> REUSE untouched (only make sure the `.war-task` marker is there)") verifies the checkout is on
`<branch>`, writes the marker, and returns — no assertion that the reused tree is in a usable state
exists today (anchored by the reuse branch's `write_marker`-then-return sequence). The `ENV_OUTCOME`
block in `skills/war/references/schemas.md` enumerates
`ok/taskId/failedCommand/exitCode/stderrTail/provisionSource/preMerged/staleRemote` — no hygiene member;
the engine's `ENV_OUTCOME` schema literal in `skills/war/assets/workflow-template.js` requires only `ok`
and carries no `additionalProperties: false`, so an additive field passes StructuredOutput validation
mechanically. `skills/war/references/resume-and-recovery.md` has no worktree-hygiene step: greps for
`hygien|dirty|zombie|concurrent|submodule` hit only submodule-router pointers, concurrent-push prose (the
class-C row), and the "Manual-land hygiene" follower-sync bullet — none is a pre-re-dispatch worktree
check. (AI-declared)

**Triage note — not a gitlink bump.** The corrupted state's superproject diff reads `-Subproject commit
<sha> / +Subproject commit <sha>-dirty`: an unchanged SHA cannot be staged as a gitlink bump, so the
single-repo-refiner gitlink guard (`skills/war/assets/assert-no-submodule-mutation.sh`, mode-160000
detection on the staged diff) is not the protection here and never fires (verified: issue #1381
(2026-08-12) + probe 2026-08-12 — nothing was staged in the superproject at any point; AI-declared).

## 2. Pivotal constraints

- **The Workflow sandbox has no shell and cannot import** — issue filing must ride a dispatched agent.
  The refiner is the Bash-capable seat that already performs gh writes (it opens submodule PRs on the 2B
  path), and the endstate-check dispatch is the ratified precedent for a refiner-typed, own-schema,
  fail-open evidence dispatch.
- **Prompt-surface split**: a new refiner `dispatchKind` requires the standing card
  (`agents/war-refiner.md`) and the string-built prompt in `workflow-template.js` to change in the same
  commit — they drift silently otherwise.
- **Fail-open, never a hold**: filing is detection/routing machinery (ADR 0017-consistent); a dead or
  partial filing dispatch must never block a land or add a `held:*`. No new task status, no
  `HARD_ESCALATION_REASONS` or `KNOWN_LAND_DECISIONS` member (ADR 0005; `land-decision.mjs` untouched).
- **Every gh write batch is preflighted** (ADR 0026): the filing dispatch must run
  `gh-preflight.sh "<expected-account>"` first; the expected account reaches the Workflow as a new
  optional arg threaded from `overrides.ghUser`, and an empty string is the script's documented no-op —
  no account handle is ever baked into committed prose.
- **Pinned tests bind the wording**: the handoff followUps null-pin test must flip in the same task as
  the engine change; the A1 redefinition anchors (`claimed End-state ids`, `empty when the task claims
  none`, `gate-audit pass cross-checks`) must stay green across the WorkerResult comment rewrite on all
  three mirrored surfaces (`schemas.md`, `ACCEPTANCE_IDS_RULE`, `agents/war-worker.md`).
- **schemas.md is a standing contract read by agents with no access to run artifacts** — every label used
  there must resolve in-file (the finding-6 rule).
- **Ordering**: this group lands after the `gate-audit-finding-routing` sibling group — both edit
  `skills/war/assets/workflow-template.js` (the survey manifest carries the machine hint). The
  `skills/war/SKILL.md` contention with `gate2-publication-guard` is region-disjoint (step-1 mirror +
  Checkpoint vs Gate-2), so no edge.
- Committed prose must stay redaction-lint clean (no home paths, emails, handles).

## 3. Resolved design tree

| # | Decision | Resolution |
|---|---|---|
| D1 | Who files follow-up findings? | The Workflow, via one refiner **`file-followups:phase-<id>`** dispatch (new `dispatchKind: file-followups`) after the land decision resolves and before handoff assembly, on both handoff-emitting paths (`landed`, `held:escalation`), gated on a non-empty `minorsFiled`. Defense in depth: Checkpoint floor (D4) + `/war-review` signal (D8) backstop it. (issue #1331's first suggested arm; the endstate-check dispatch precedent) |
| D2 | Filing result shape | `FOLLOWUP_FILING_RESULT` — `{ filed: [{ n, issue }] }`, `n` the 1-based ordinal of the dispatched entry list (the `ENDSTATE_CHECK_RESULT` ordinal idiom), `issue` a number or null. The Workflow stamps matched entries' `.issue`; unmatched/absent rows stay null. Fail-open: a dead dispatch logs one line and the phase proceeds. |
| D3 | Double-filing on resume/relaunch | The dispatch prompt mandates dedup-first: `gh issue list --label war-followup --state open` + exact-title match reuses the existing number instead of filing a duplicate (the retired-token sweep's dedup discipline). |
| D4 | Checkpoint floor form | A Lead-prose floor bullet in `skills/war/SKILL.md` § Checkpoint (beside the Issue-lifecycle floor): before advancing the DAG past a handoff-emitting phase, every `handoff.followUps[]` entry must carry a non-null `issue`; any null ⇒ the Lead files it now inside the preflighted per-phase gh-write batch and stamps the number into the ledger's `handoff` record — never advance over a null. Extending `assert-issues-filed.sh` into a mechanical check is deferred (§9). |
| D5 | End-state id lexical form + join (findings 1+3) | Ratify the engine's de-facto form: **the condition's 1-based ordinal in the intent's numbered End-state list, rendered as a string** (`"7"`), resolving to that condition's verbatim text — the `plan_ref` / `endStateAttestations.condition` / handoff `endState.condition` key. Stated in the WorkerResult row comment and mirrored into `ACCEPTANCE_IDS_RULE` + `agents/war-worker.md` in the same task. No `id` member is added to the `phase.endState` row shape (§9). |
| D6 | Trio naming fork (finding 5) | One canonical enumeration — **"per-task (post-merge), integrated-tip, end-state-only"** — at both `schemas.md` sites; the two forked `workflow-template.js` comments are aligned in the same diff (survey-derived stragglers). |
| D7 | "two-contract rule" label (finding 6) | Expand in place: "(findings carry defects; attestation rides `endStateAttestations` — two separate contracts)". No new glossary term; avoids colliding with `/red-team`'s pinned Two-contract summary. The engine's mirroring schema comment is aligned in the same diff. |
| D8 | Retroactive detection (issue #1331's third arm) | `/war-review` § 4 gains an **"unfiled follow-ups"** signal class: any `handoff.followUps[]` entry with `issue: null` on a handoff-emitting phase, sourced from the mined workflow-return record in the transcripts, else the run ledger's phase `handoff` field when discoverable; unsourceable ⇒ no row, never fabricated. |
| D9 | `landResult` row (issue #1289) | Rewrite to the three-case truth: the dispatched land/re-land MergeResult — initial land and both re-land arms assign it, so `pr_number`/`pr_remote` are readable on `held:submodule-pr`, and `held:land-failed` carries the failing MergeResult; null only when no land was dispatched (pre-land holds) or the land dispatch died returning nothing. |
| D10 | Manifest timestamps (F3) | A real-clock-read mandate on both surfaces: `schemas.md`'s Run-manifest section and `skills/war/SKILL.md` § Run manifest — every `startedAt`/`endedAt` is a clock read captured at the stamped boundary (e.g. `date -u +%Y-%m-%dT%H:%M:%SZ` at stamp time), never a placeholder or copied literal. [assumed: additionally, `/war-review` treats an all-identical timestamp set as degenerate and renders wall-clock `n/a` with a note — an inference beyond F3's "schema-side note" ask; if wrong: drop the `/war-review` render guard, keep the two doc mandates] |
| D11 | Stale precision-chain parentheticals (finding 2 + sweep) | Retire every future-tense marker/parenthetical for landed precision-chain work in `schemas.md`: rewrite the 5 "defined-but-not-yet-emitted" instances and the 2 future-tense parentheticals to landed past-tense provenance (keep the plan/task citation, e.g. "produced by Task 3.2, landed 0.17.0"), citing #1333. Grep is the floor; the manual survey duty (§4) is the ceiling. |
| D12 | #1380 working-branch collision name | Sanitize the derived name before cutting: the collision arm probes each ancestor segment of `dev/<date>-<slug>` (exactly one — `git show-ref --verify --quiet refs/heads/dev`) and on a leaf-ref hit falls back to the flat name **`war-<date>-<slug>`** — slashless, so no segment of it can be blocked, and a sibling of (never inside) the `war/` task-branch ref directory (temp-repo-verified coexistence, §1). The existing absent/owned/foreign ladder then applies to the fallback unchanged (ADR 0003). [assumed: the owned-reuse check consults both candidate names before any fresh cut, so a blocking leaf deleted mid-run cannot make a resume re-derive a different name — if wrong: probe-order determinism alone decides and the RWB.d-style reuse stays single-candidate] (issue #1380 fix 1) |
| D13 | #1380 actionable cut failure | When the `git branch` cut still dies and the captured stderr matches `cannot lock ref`, the die keeps git's own stderr (the existing `_tmp_err` idiom) and APPENDS the diagnosis and remedy: the blocking leaf ref by name, and "pass an explicit `--working <branch>`". One fallback (D12), then fail loud — never a silent retry loop. (issue #1380 fix 3) |
| D14 | #1380 planSlug cuttability at Setup | Validated inside `cmd_resolve_working_branch` itself — it already receives `<slug>` at Setup step 2, before any Workflow launch: probe leaf refs at `refs/heads/war` (impossible-by-convention, but one cheap show-ref) and `refs/heads/war/<slug>`; either present ⇒ die naming the leaf and the remedy (pick a different plan slug, or delete/rename the leaf) — the second surface fails at Setup, not at the first mid-phase `git branch`. Covers `taskBranch` and `polishBranch` (same `war/<planSlug>/` namespace). NOT in `workflow-template.js`: the sandbox has no shell (§2), so the probe rides the tested git-topology owner the Lead already invokes at Setup. (issue #1380 fix 4) |
| D15 | #1380 rejected alternative | A collision-proofed sub-namespace (e.g. `refs/heads/war/run/<date>-<slug>`) is REJECTED: a naming-convention migration touching the teardown/reclaim regexes (the `refs/heads/war/$slug/p$num-` prefix in teardown-phase, the `war/*/p*-t*` reclaim glob) and every doc surface naming the convention — disproportionate to a defect three local probes close, and still collidable in principle. (issue #1380 fix 2, rejected) |
| D16 | #1381 reuse-path hygiene assertion (fix 1) | In `cmd_ensure_worktree`'s REUSE branch, after ensuring the `.war-task` marker: for each declared submodule whose status is dirty AND whose checked-out HEAD matches the superproject's recorded gitlink SHA — detection rides `git status --porcelain -- <path>` in the superproject, because `git submodule status` shows no marker in the corrupted state (probe, §1) — remove a stale submodule `index.lock` (the probe-verified repair blocker) and run `git submodule update --init --force <path>`: a safe restore, since the SHA is unchanged no gitlink bump can result, and by the plan-scope contract no submodule work should exist in a superproject-only run. It never touches superproject tracked files or untracked deliverables (the WIP-preservation invariant — NEVER-RESET-ON-REUSE keeps its meaning); a dirty submodule whose SHA does NOT match the recorded value is detected and reported, never auto-repaired. Every repair/detection is reported via a `WORKTREE_HYGIENE` marker line the provision barrier captures (the existing `STALE_REMOTE` marker-capture idiom), never silent; a repair that itself fails is likewise reported (`detected` + the failure detail) and the reuse still returns 0 — visibility via D17 is the backstop, per the issue's fix-2 framing. (issue #1381 fix 1, probe-refined) (AI-declared) |
| D17 | #1381 `ENV_OUTCOME.worktreeHygiene` (fix 2) | New OPTIONAL array on the env-outcome — `[{ task, path, action: "repaired"\|"detected", detail }]` — carried on an `ok: true` barrier return beside `staleRemote` (same marker-capture idiom), documented in `schemas.md`'s ENV_OUTCOME block, added to the engine's `ENV_OUTCOME` schema literal, and surfaced by the Lead in the phase report. Fail-open and additive: no routing change, never a hold, absent means nothing found (the engine literal already lacks `additionalProperties: false`, so the field passes validation mechanically — §1). (issue #1381 fix 2) (AI-declared) |
| D18 | #1381 runbook step (fix 3) | `resume-and-recovery.md`'s `### Recovery relaunch` **Shared mechanics (both entry points)** list gains a **Worktree hygiene** bullet: before re-dispatch, for each reused task worktree whose prior generation errored or was cancelled, check submodule status and unexpected staged deletions; with the gitlink SHA matching the recorded value, remove a stale submodule `index.lock` and run `git submodule update --init --force <path>`; record what was repaired. The held-partial-phase runbook composes it unchanged via its existing "composes the tools above" sentence. (issue #1381 fix 3 — the incident's manual repair, mechanized as doctrine) (AI-declared) |
| D19 | #1381 generation fence (fix 4) | REJECTED for this group — a per-worktree lease/generation stamp in `.war-task` needs process containment to be meaningful and belongs with #1365 (the same survives-a-kill family); split to its own issue per the report's own sequencing. No `.war-task` schema change in this group. (issue #1381 fix 4, deferred) (AI-declared) |

D12–D15 selection: [assumed: the minimal-diff composite (issue #1380's fixes 1+3+4) closes the report —
if wrong: the namespace migration (fix 2) is the follow-up, not a widening of this group].

D16–D19 selection: [assumed: issue #1381's fixes 1–3, sequenced 1→2→3, close the report — if wrong:
fix 4 (the generation fence) is the follow-up, split out with #1365, never a widening of this group]
(AI-declared).

## 4. Mechanics

**`skills/war/assets/workflow-template.js`** (after the `gate-audit-finding-routing` group lands; rebase
onto its result):
- New `FOLLOWUP_FILING_RESULT` schema const beside `ENDSTATE_CHECK_RESULT`.
- New dispatch site between the land-decision routing and the handoff assembly: when
  (`landDecision === 'landed' || landDecision === 'held:escalation'`) and `minorsFiled.length > 0`,
  dispatch one refiner (`dispatchKind: 'file-followups'`, label `file-followups:phase-<id>`). The prompt:
  run the preflight first (`gh-preflight.sh` under the plugin's `skills/_shared/`, invoked via the
  template's agent-resolved `$VAR` placeholder idiom with the threaded `ghUser` as its quoted arg;
  exit 2/3 ⇒ return what you have, file nothing); dedup per D3; then
  file one `war-followup` issue per enumerated entry — title from the finding title, body carrying the
  why-not-absorbable reason, task id, and the phase-epic linkage (`ph.epicIssue` when present); return
  `{ filed: [{ n, issue }] }` only. Stamp `minorsFiled[n-1].issue` for each returned row with a numeric
  `issue`; everything else stays null. Fail-open on a dead/partial return: one `log()` line, no hold.
- Thread new optional `args.ghUser` (string, default `""` — the preflight's documented no-op).
- Handoff assembly is unchanged (`issue: m.issue ?? null` now sees stamped values).
- Comment alignments (same diff, survey-derived): the AuditVerdict schema comment's trio enumeration and
  the adjudicationClause comment's trio enumeration both adopt D6's canonical form; the schema comment's
  "(the two-contract rule)" adopts D7's expansion; `ACCEPTANCE_IDS_RULE` gains D5's id-form + join
  sentence (anchors preserved).
- #1381 (D17): the `ENV_OUTCOME` schema literal gains the optional `worktreeHygiene: { type: 'array' }`
  property, and the provision-barrier dispatch prompt names the `WORKTREE_HYGIENE` marker-capture beside
  the existing `STALE_REMOTE` carve-out — same commit as the `agents/war-refiner.md` mirror (the
  prompt-surface split rule, §2). (AI-declared)

**`agents/war-refiner.md`** — the dispatch-kind enumeration and the Return section gain the
`file-followups` flavor (same commit as the prompt): never out-of-mode, fail-open evidence return, never
a `MergeResult`; dedup-first; preflight-first. #1381 (D17): the provision-barrier step's
classify-and-continue carve-out and the "Return shape (all three)" line gain the `worktreeHygiene` array
(`WORKTREE_HYGIENE` marker capture, mirroring `staleRemote`'s form) — same commit as the dispatched
prompt. (AI-declared)

**`agents/war-worker.md`** — the `acceptance_criteria_covered` reporting line gains D5's id-form + join
sentence (mirror of `ACCEPTANCE_IDS_RULE`; the doc-contract anchors keep matching).

**`skills/war/references/schemas.md`** — one coherent truth pass:
- WorkerResult `acceptance_criteria_covered` row: D5's form + join; "(cross-check lands with Task 3.2)"
  → landed provenance (D11).
- `endStateAttestations` bullet: D6 trio naming; D7 two-contract expansion; D11 marker retirement.
- Optional `intent` paragraph: "D5 evidence tag" → "D5 End-state tag" (finding 4); D11 on the
  "consumed in Phase 3…" parenthetical.
- `adjudications` paragraph: D6 trio naming.
- `mappedTests`, `done-unmet`, ledger `doneWhen`, handoff `endState` rows: D11 marker retirement.
- Workflow per-phase return block: `landResult` row per D9; `followUps` row comment → "issue# stamped by
  the Workflow's file-followups dispatch; null only when filing failed or was skipped — the Checkpoint
  floor then has the Lead file before the DAG advances"; `minorsFiled` row comment notes the stamping.
- Run-manifest section: D10's real-clock-read mandate sentence.
- Workflow per-phase args contract: the new optional `ghUser` arg documented beside `agentPrefix`.
- ENV_OUTCOME block (#1381, D17): a `worktreeHygiene?` row in the jsonc shape plus one defining bullet —
  optional, barrier `ok: true` only, `[{ task, path, action: "repaired"|"detected", detail }]` captured
  from `WORKTREE_HYGIENE` marker lines on the reuse path; fail-open, no routing change, absent means
  nothing found. (AI-declared)

**`skills/war/SKILL.md`**:
- Step 1 (Decompose): the mirrored "D5 evidence tag" → "D5 End-state tag" (same commit as the
  schemas.md fix — the two surfaces are stated mirrors).
- § Run manifest, "When — at phase boundaries": D10's clock-read mandate.
- § Per phase: thread `overrides.ghUser` into the Workflow args as `args.ghUser`.
- § Checkpoint: the D4 follow-up floor bullet; the phase-report handoff rendering already lists
  "follow-ups filed (issue + why-not-absorbable)" and needs no change.
- § Setup step 2 (#1380): the resolve-working-branch sentence gains the delta — the resolved branch may
  be the flat `war-<date>-<slug>` fallback (leaf-`dev` collision, D12), and the subcommand now validates
  `war/<planSlug>` cuttability, dying actionably (different slug, or `--working`) before any phase
  launches (D14). Same file, different region from the bullets above — see §8 contention.

**`skills/war-review/SKILL.md`** — § 4 gains the D8 "unfiled follow-ups" signal class; § 3's wall-clock
rendering gains the D10 degenerate-timestamp `n/a` guard.

**`skills/war/assets/workflow-template.test.mjs`**:
- Flip the followUps null-pin test: with a follow-up finding and a filing dispatch returning
  `{ filed: [{ n: 1, issue: 1234 }] }`, `handoff.followUps` carries `issue: 1234`.
- New coverage: fail-open (dead filing dispatch ⇒ `issue: null`, `landDecision` unchanged); no dispatch
  when `minorsFiled` is empty; dispatch fires on `held:escalation` too; ordinal mismatch rows ignored.
- The A1 anchors and the endStateBlock-sites pin stay green (message text may adopt D6's naming).

**`skills/war/assets/provision-worktrees.sh`** (issue #1380 — file-disjoint from every other strand in
this group):
- `cmd_resolve_working_branch`, D14 first: after arg validation, on BOTH paths (collision and
  no-collision — task branches are cut regardless of which path echoes), probe
  `git show-ref --verify --quiet refs/heads/war` and `refs/heads/war/$slug`; a leaf hit dies naming the
  leaf and the remedy.
- D12: on the collision arm, the same probe form against `refs/heads/dev` before composing `resolved`; a
  hit swaps the derived name to `war-<date>-<slug>`, and the existing exists/owned/foreign ladder runs
  unchanged on the fallback.
- D13: the cut-failure die keeps the `_tmp_err` capture and, when the captured stderr matches
  `cannot lock ref`, appends the blocking-leaf diagnosis and the `--working` remedy.
- New dies exit via the plain `die` path (exit 1); `EX_FOREIGN` (3) keeps its ADR 0003 meaning,
  unwidened. Placement decided from the code: fix 4 does NOT land in `workflow-template.js` — its entry
  validation is sandboxed pure JS with no shell, and `cmd_resolve_working_branch` already receives
  `<slug>` at Setup step 2, before any task dispatch (D14).
- #1381 (D16 — `cmd_ensure_worktree`, a different function from the D12–D14 arms above): in the REUSE
  branch, after `write_marker`, enumerate the worktree's declared submodules (`.gitmodules` paths); for
  each, when `git -C "$path" status --porcelain -- <sub>` is non-empty AND the submodule's checked-out
  HEAD equals the SHA in `git -C "$path" ls-tree HEAD <sub>`: remove a stale submodule `index.lock` if
  present, run `git -C "$path" submodule update --init --force <sub>`, and emit one `WORKTREE_HYGIENE`
  marker line per action (`repaired`, or `detected` for a SHA-mismatch / failed repair) for the barrier
  to capture. Exit discipline unchanged: hygiene is fail-open — the reuse path never gains a new die, and
  a failed repair reports and returns 0 (D16). Superproject tracked files and untracked entries are never
  touched. (AI-declared)

**`skills/war/assets/provision-worktrees.test.sh`** — new cases beside the existing RWB block:
leaf-`dev` collision ⇒ the flat fallback is echoed, created at the desired tip, checked out nowhere,
ownership recorded (the RWB.a assertion set against the fallback name); planSlug validation ⇒ a fixture
repo with leaf `war/<slug>` makes resolve-working-branch die non-zero with the leaf named in stderr;
fallback resume-reuse ⇒ a second call returns the same flat branch and never re-cuts (the RWB.d shape);
control ⇒ leaf `dev` present but `<desired>` checked out nowhere still echoes `<desired>` unchanged (the
`dev` probe fires only where a cut would happen). #1381 (D16) hygiene cases beside the ensure-worktree
block: (a) hygiene-repair — a superproject+submodule fixture whose submodule index is emptied
deterministically (`git -C <sub> read-tree --empty` + a dropped `index.lock`, state-equivalent to §1's
reproduced killed-populate state on every surface the hygiene arm reads — the killed state's submodule
worktree is nearly empty while this fixture keeps files on disk, a dimension nothing the arm or its
tests consults) is reused via `ensure-worktree` ⇒ the submodule ends clean and a
`WORKTREE_HYGIENE repaired` marker is emitted; (b) WIP-preservation — a superproject tracked
modification plus two untracked files ride the same fixture and survive the reuse byte-for-byte with
nothing staged; (c) SHA-mismatch control — a submodule checked out at a different HEAD is `detected`
only, its tree untouched; (d) clean control — a clean reuse emits no marker. (AI-declared)

**`skills/war/references/resume-and-recovery.md`** (#1381, D18) — the `### Recovery relaunch`
**Shared mechanics (both entry points)** list gains the **Worktree hygiene** bullet: before re-dispatch,
for each reused task worktree whose prior generation errored or was cancelled, check submodule status and
unexpected staged deletions; with the gitlink SHA matching the recorded value, remove a stale submodule
`index.lock` and run `git submodule update --init --force <path>`; record what was repaired. No other
section of the file changes. (AI-declared)

**Mandatory manual same-scope survey (grep is a floor, not a ceiling).** For every retirement/harmonization
sweep above — `defined-but-not-yet-emitted`, `null until the Lead files it`, `D5 evidence tag`, the trio
enumerations, `two-contract` — after the file-scoped grep, hand-scan the target files' same-scope tests
and comments (`workflow-template.js` comments, `workflow-template.test.mjs` test titles/assert messages,
`skill-doc-contracts.test.mjs` extraction anchors) and list each straggler as a survey-derived correction.
Stragglers already found this way and folded in above: the two forked trio comments and the
"(the two-contract rule)" schema comment in `workflow-template.js`; the followUps null-pin assert message;
the `ACCEPTANCE_IDS_RULE`/`agents/war-worker.md` mirror pair. Adjudicated exempt (narration, not
recipe): test assert messages that merely narrate "(two-contract rule)" may stay if untouched by the
flipped assertions.

## 5. Surface changes

| File | Change |
|---|---|
| `skills/war/assets/workflow-template.js` | file-followups dispatch + schema + stamping; `args.ghUser`; comment alignments (D6/D7/D5); #1381: `ENV_OUTCOME` literal + provision prompt gain `worktreeHygiene` (D17) (AI-declared) |
| `skills/war/references/schemas.md` | followUps/landResult/minorsFiled row rewrites; D5 id form + join; D6/D7; "D5 End-state tag"; D11 marker retirement; manifest clock mandate; `ghUser` arg row; #1381: ENV_OUTCOME `worktreeHygiene` row (D17) (AI-declared) |
| `skills/war/SKILL.md` | step-1 tag-family mirror fix; manifest clock mandate; `ghUser` threading; Checkpoint follow-up floor; Setup step-2 resolve-working-branch delta (#1380) |
| `skills/war-review/SKILL.md` | "unfiled follow-ups" signal class; degenerate-timestamp `n/a` guard |
| `agents/war-refiner.md` | `file-followups` dispatch flavor + return contract (footprint delta — required by the prompt-surface split); #1381: `worktreeHygiene` in the provision carve-out + return shape (D17 mirror) (AI-declared) |
| `agents/war-worker.md` | `acceptance_criteria_covered` id-form mirror (footprint delta, one sentence) |
| `skills/war/assets/workflow-template.test.mjs` | null-pin flip + new filing coverage (footprint delta — the engine change's guard) |
| `skills/war/assets/provision-worktrees.sh` | #1380: D12 flat-fallback sanitize + D13 actionable cut-failure die + D14 planSlug cuttability probes in `cmd_resolve_working_branch` (footprint delta); #1381: D16 reuse-path hygiene assertion in `cmd_ensure_worktree` (AI-declared) |
| `skills/war/assets/provision-worktrees.test.sh` | #1380: leaf-`dev` fallback, planSlug-validation die, fallback resume-reuse, no-collision control cases (footprint delta — the script change's guard); #1381: hygiene-repair, WIP-preservation, SHA-mismatch and clean controls (AI-declared) |
| `skills/war/references/resume-and-recovery.md` | #1381: D18 Worktree-hygiene bullet in `### Recovery relaunch` Shared mechanics (AI-declared) |

## 6. New domain terms (CONTEXT.md)

None. The new `file-followups` dispatch kind is absorbed by CONTEXT.md's existing **Dispatch kind** entry,
whose discriminator list is explicitly open ("…"); D7 deliberately avoids minting "two-contract rule" as a
term.

## 7. Recommended ADRs

None. The filing dispatch implements ADR 0013's existing nothing-drops-silently guarantee (mechanism, not
policy); ADR 0005/0017/0026 are conformed to, not amended.

## 8. Open risks / implementation notes

- **Ordering (machine hint honored):** land after the `gate-audit-finding-routing` group — both edit
  `skills/war/assets/workflow-template.js`; the first implementation act is a rebase onto its landed
  result. The `skills/war/SKILL.md` overlap with `gate2-publication-guard` is region-disjoint; no edge.
- **Footprint delta:** `agents/war-refiner.md`, `agents/war-worker.md`, and
  `skills/war/assets/workflow-template.test.mjs` are touched beyond the group's declared footprint;
  contention-check them at plan time (the refiner-card + template edit must be one task — the
  prompt-surface split rule).
- **Decomposition:** `schemas.md` is touched by nearly every strand — carve it as one task (or serial
  waves), never parallel same-file tasks. The engine change + its test flip are one task; the
  agent-card mirrors ride the tasks whose prompts they mirror.
- **gh failure modes:** preflight exit 2/3, rate limits, and network failures all resolve to unfiled
  entries (`issue: null`) — the Checkpoint floor is the guaranteed catch; the signal class is the audit
  trail. Filing is never retried in-loop.
- **Replay safety:** `resumeFromRunId` replays the journal's cached filing result (no re-execution); a
  recovery relaunch re-dispatches — D3's dedup makes that safe.
- **Retirement-grep false-red caution:** D6's canonical form contains the substring "per-task" — §10's
  checks assert the canonical enumeration's presence at named sites rather than blanket absence of the
  old member names; all greps are file-scoped (this spec file itself carries the retired tokens).
- **#1380 teardown compatibility:** the fix arms rename only the WORKING-branch fallback; task branches
  stay `war/<planSlug>/p<N>-<id>`, so teardown-phase's `refs/heads/war/$slug/p$num-` prefix match and
  ensure-worktree's `war/*/p*-t*` reclaim glob keep matching whatever names are cut. The flat fallback
  carries no `/` and never enters the `war/` ref directory (temp-repo-verified coexistence, §1) — no
  teardown or reclaim regex changes.
- **#1380 contention:** `provision-worktrees.sh` + its test are file-disjoint from every other strand in
  this group; the only shared file is `skills/war/SKILL.md`, where the Setup step-2 sentence is
  region-disjoint from the step-1/manifest/per-phase/Checkpoint edits above but same-file — one task or
  serial waves, never parallel (the code-boundary rule).
- **#1381 contention (same files as existing strands, different regions):** D16 lives in
  `cmd_ensure_worktree` while the #1380 arms live in `cmd_resolve_working_branch` — same
  `provision-worktrees.sh` and same test file, so the two strands are one task or serial waves, never
  parallel (the existing #1380 tension note extends to this pair). D17's engine touch (the `ENV_OUTCOME`
  literal + provision-barrier prompt) lands in `workflow-template.js` — region-disjoint from the
  file-followups dispatch strand but same-file, same discipline; its `agents/war-refiner.md` mirror rides
  the same commit as the prompt (the prompt-surface split), and that card is also touched by the
  file-followups strand — contention-check at plan time. `schemas.md`'s ENV_OUTCOME row joins the
  carve-it-as-one-task rule above. (AI-declared)
- **#1381 residuals:** clearing a stale submodule `index.lock` assumes no live holder — sound at the
  provision barrier and at a recovery relaunch (workers are dispatched only after both), while a zombie
  writer surviving its kill is exactly reading (B) / #1365 territory, deferred with fix 4 (D19). A repair
  that itself fails stays fail-open (reported via D17, reuse returns 0) — routing it to `env-blocked` via
  a `STALE_REMOTE`-style classify-and-continue carve-out was considered and deferred with D19 rather than
  widening the barrier's routing in this group. (AI-declared)

## 9. Non-goals / deferred

- **F2 and F4 of #1331** — already addressed (PR #1320; the live auditor card). No work; cite on close.
- **A mechanical Checkpoint floor script** (extending `skills/war/assets/assert-issues-filed.sh` with a
  followUps-nonnull check) — deferred; the prose floor + mechanized filing + signal class close the
  observed gap first. Revisit if a null `issue` ever survives a Checkpoint again.
- **No `id` member on `phase.endState` rows** (finding 3's alternative arm): D5 fixes the join by
  defining the ordinal→condition mapping in prose; widening the row shape would touch the Lead staging
  path, the bare-string normalization, and the endstate-check dispatch for no added mechanical check.
- **No engine change to the disposition/demotion ladder** — routing semantics are untouched; only the
  filing of already-routed `follow-up` findings is mechanized.
- **No CONTEXT.md edit, no new ADR** (§6, §7).
- **No `/war-review --scavenge` changes** — the new signal class applies to manifest-era runs.
- **No collision-proofed sub-namespace migration** (issue #1380's fix 2) — rejected at D15; the branch
  naming conventions (`dev/<date>-<slug>` first choice, `war/<planSlug>/p<N>-<id>` tasks) are unchanged.
- **No generation fence / worktree lease** (issue #1381's fix 4) — rejected at D19 for this group; split
  to its own issue cross-linking #1365 (the same survives-a-kill family). `.war-task`'s content and the
  barrier's `ok`/`env-blocked` routing are unchanged; `worktreeHygiene` is visibility, never a hold.
  (AI-declared)

## 10. Validation criteria

1. WHEN a phase with ≥1 `follow-up`-routed finding reaches a handoff-emitting outcome THE Workflow SHALL
   dispatch one `file-followups:phase-<id>` refiner step and stamp returned issue numbers so
   `handoff.followUps[]` entries carry non-null `issue` ·
   check: `node --test skills/war/assets/workflow-template.test.mjs` (the flipped null-pin test + the new
   stamping test)
2. WHEN the filing dispatch dies, returns partial rows, or the preflight fails THE Workflow SHALL leave
   unmatched entries `issue: null` and keep `landDecision` unchanged (fail-open, never a hold) ·
   check: `node --test skills/war/assets/workflow-template.test.mjs` (the new fail-open test)
3. WHEN `minorsFiled` is empty THE Workflow SHALL dispatch no filing step ·
   check: `node --test skills/war/assets/workflow-template.test.mjs` (the new no-dispatch test)
4. WHEN the refiner card is read THE `file-followups` flavor SHALL be enumerated with its return shape ·
   check: `grep -n 'file-followups' agents/war-refiner.md`
5. WHEN schemas.md's return contract is read THE followUps row SHALL no longer claim the Lead-files-it
   null and SHALL name the filing dispatch + Checkpoint floor ·
   check: `! grep -n 'null until the Lead files it' skills/war/references/schemas.md && grep -n 'file-followups' skills/war/references/schemas.md`
6. WHEN the Checkpoint section is read THE DAG-advance floor SHALL require non-null `issue` on every
   `handoff.followUps[]` entry ·
   check: `grep -n 'followUps' skills/war/SKILL.md` (the Checkpoint floor bullet)
7. WHEN `/war-review` § 4 is read THE signal catalogue SHALL carry the "unfiled follow-ups" class ·
   check: `grep -n 'unfiled follow-ups' skills/war-review/SKILL.md`
8. WHEN the Run-manifest contract is read on either surface THE `startedAt`/`endedAt` fields SHALL be
   mandated real clock reads captured at the stamped boundary ·
   check: `grep -n 'clock read' skills/war/references/schemas.md skills/war/SKILL.md`
9. WHEN schemas.md's `landResult` row is read THE comment SHALL state the three-case truth (non-null on
   `held:submodule-pr`/`held:land-failed`; null only on no-land-dispatched or a dead land dispatch) ·
   check: `! grep -n 'or null if held' skills/war/references/schemas.md`
10. WHEN the WorkerResult `acceptance_criteria_covered` row, `ACCEPTANCE_IDS_RULE`, and the worker card
    are read THE id form SHALL be the 1-based ordinal string with its stated join to the
    verbatim-condition key, on all three surfaces ·
    check: `grep -rn '1-based ordinal' skills/war/references/schemas.md skills/war/assets/workflow-template.js agents/war-worker.md` (3 files hit) — then the §4 manual survey over the A1 anchors
11. WHEN ADR 0044's tag families are cited in the contract layer THE phrase "D5 evidence tag" SHALL be
    absent from both mirrored surfaces, replaced by the End-state tag naming ·
    check: `! grep -n 'D5 evidence tag' skills/war/references/schemas.md skills/war/SKILL.md && grep -n 'D5 End-state tag' skills/war/references/schemas.md skills/war/SKILL.md`
12. WHEN the gate-audit-family trio is enumerated in schemas.md THE canonical form
    "per-task (post-merge), integrated-tip, end-state-only" SHALL appear at both sites ·
    check: `grep -c 'per-task (post-merge), integrated-tip, end-state-only' skills/war/references/schemas.md` returns `2` — then the §4 manual survey of `workflow-template.js` comments
13. WHEN the defect-only invariant is stated in schemas.md THE bare "two-contract rule" label SHALL be
    expanded in place ·
    check: `! grep -n 'the two-contract rule intact' skills/war/references/schemas.md && grep -n 'two separate contracts' skills/war/references/schemas.md`
14. WHEN schemas.md is read at the tip THE stale future-tense precision-chain parentheticals SHALL be
    retired to landed provenance ·
    check: `! grep -in 'defined-but-not-yet-emitted' skills/war/references/schemas.md && ! grep -n 'cross-check lands with Task 3.2' skills/war/references/schemas.md` — then the §4 manual survey for un-tokened future-tense stragglers
15. WHEN the full suite runs THE gate SHALL stay green ·
    check: `node --test 'skills/**/*.test.mjs'`
16. WHEN the desired working branch is checked out in some worktree AND a leaf branch `dev` exists THE
    `resolve-working-branch` SHALL echo the flat fallback `war-<date>-<slug>`, created at the desired
    tip, checked out nowhere, with ownership recorded ·
    check: `bash skills/war/assets/provision-worktrees.test.sh` (the new leaf-`dev` collision fixture —
    a temp repo cutting branch `dev` before the call, per §1's reproduced mechanism)
17. WHEN `refs/heads/war/<planSlug>` (or `refs/heads/war`) exists as a leaf ref THE
    `resolve-working-branch` SHALL exit non-zero before any task dispatch, naming the blocking leaf and
    the remedy ·
    check: `bash skills/war/assets/provision-worktrees.test.sh` (the new planSlug-validation fixture — a
    temp repo with leaf `war/<slug>`)
18. WHEN a dedicated-branch cut still dies with `cannot lock ref` THE die SHALL retain git's own stderr
    and name the blocking leaf ref plus the `--working` remedy ·
    check: `bash skills/war/assets/provision-worktrees.test.sh` (the new actionable-die assertion) and
    `grep -n -e '--working' skills/war/assets/provision-worktrees.sh` — then the §4 manual same-scope
    survey of the script's comment header and die sites
19. WHEN a run that fell back to `war-<date>-<slug>` resumes THE second call SHALL return the same flat
    branch and never re-cut it ·
    check: `bash skills/war/assets/provision-worktrees.test.sh` (the new fallback resume-reuse case)
20. WHEN the flat fallback is in use THE teardown surfaces SHALL keep matching task branches — the
    teardown-phase prefix and reclaim-glob literals are byte-unchanged ·
    check: `grep -Fn 'refs/heads/war/$slug/p$num-' skills/war/assets/provision-worktrees.sh` and
    `grep -Fn 'war/*/p*-t*' skills/war/assets/provision-worktrees.sh` (grep -F mandatory — the patterns
    carry `$` and glob metacharacters) — then the §4 manual same-scope survey of the teardown case
    comments in `provision-worktrees.test.sh`
21. WHEN `ensure-worktree` reuses a registered, present worktree whose declared submodule is dirty while
    its checked-out HEAD matches the recorded gitlink SHA THE reuse SHALL repair it via
    `git submodule update --init --force <path>` (removing a stale submodule `index.lock` first — the
    probe-verified repair blocker, §1) and emit a `WORKTREE_HYGIENE` marker line, never silently ·
    check: `bash skills/war/assets/provision-worktrees.test.sh` (the new hygiene-repair fixture — the
    submodule index emptied deterministically via `git read-tree --empty` + a dropped `index.lock`,
    state-equivalent to §1's reproduced killed-populate state on every surface the hygiene arm reads
    (the killed state's worktree is nearly empty; this fixture keeps files on disk — a dimension
    nothing consulted reads); asserts post-reuse submodule clean + the
    marker present) and `grep -c 'WORKTREE_HYGIENE' skills/war/assets/provision-worktrees.sh` (base
    count today: 0; post-land: ≥ 1) (AI-declared)
22. WHEN the reuse-path hygiene repair runs THE superproject WIP SHALL survive byte-for-byte — tracked
    modifications and untracked files untouched, nothing staged in the superproject (the probe-verified
    repair-safety property, §1) ·
    check: `bash skills/war/assets/provision-worktrees.test.sh` (the WIP-preservation assertions inside
    the same hygiene fixture: a tracked modification + two untracked files persist unchanged and
    `git diff --cached --name-only` stays empty; plus the SHA-mismatch control — a submodule at a
    different HEAD is `detected` only, its tree untouched) (AI-declared)
23. WHEN the ENV_OUTCOME contract is read on any of its three surfaces THE `worktreeHygiene` field SHALL
    be enumerated as an optional fail-open array of repaired/detected findings ·
    check: `grep -c 'worktreeHygiene' skills/war/references/schemas.md skills/war/assets/workflow-template.js agents/war-refiner.md`
    (base counts today: 0, 0, 0; post-land: ≥ 1 in each of the three files — file-scoped: this spec and
    its plan also carry the token) (AI-declared)
24. WHEN the Recovery-relaunch shared mechanics are read THE Worktree-hygiene step SHALL appear (check
    submodule status and staged deletions before re-dispatch; gitlink-SHA-matched force-update repair;
    record what was repaired) ·
    check: `grep -c 'Worktree hygiene' skills/war/references/resume-and-recovery.md` (base count today:
    0 — the file's only current "hygiene" hit is the "Manual-land hygiene" follower-sync bullet;
    post-land: ≥ 1) — then the mandatory §4 manual same-scope survey of the file's other recovery entry
    points (the held-partial-phase runbook steps and the `env-blocked` bullet) for missing
    cross-references the grep cannot see (AI-declared)
