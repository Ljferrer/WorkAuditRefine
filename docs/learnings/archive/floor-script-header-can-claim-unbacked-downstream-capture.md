---
name: floor-script-header-can-claim-unbacked-downstream-capture
description: "A floor script's own header can assert a downstream integration behavior ('the refiner captures my stdout as an evidence artifact') that the wiring task never implements — verify the claimed consumer actually exists, don't trust the header prose. RESOLVED (2026-08-06-done-when-floor-wiring/1.1, #1370/#1340): the wiring now exists — see appended section."
metadata:
  node_type: memory
  type: project
  keywords:
    - header contract
    - unbacked claim
    - evidence artifact
    - doneWhen
    - MergeResult
    - stdout capture
    - cross-task contract
    - forward reference
    - done_when_log_path
    - doneWhenFloorClause
    - RESOLVED
    - WORKTREE_HYGIENE
    - provision-worktrees.sh
    - ensure-worktree stdout contract
    - hygiene_marker
    - test comment unbacked claim
    - worktreeHygieneClause
    - ensure-refinery-worktree
    - new emitter old capture prose
    - war-refiner.md provision bullet
    - schemas.md worktreeHygiene
  provenance: code-verified
  promoted: dev/2026-08-06-handoff-schemas-contract@phase-1
  slug: floor-script-header-can-claim-unbacked-downstream-capture
  phase: "2026-08-05-precision-chain-and-loop-breaker/2 + 2026-08-06-handoff-schemas-contract/p1-polish (recurrence 2, 2026-08-17)"
  tags:
    - plan-code-mismatch
    - floor-scripts
    - contract-drift
  created: 2026-08-05
  originSessionId: 428f1fab-f385-493a-952d-9509fdac5e10
  modified: 2026-08-27T02:41:24.725Z
---

A floor script authored in one task can document a downstream integration contract that a
*later* task — the one actually responsible for wiring it — never implements, and nothing
catches the gap because the header prose reads as documentation, not an assertion any test
checks.

Concretely: `skills/war/assets/assert-done-when.sh`'s header states "STDOUT belongs to the
executed command — the refiner captures it as the done-when evidence artifact" and even
names the wiring task ("Task 2.3 wires this into the refiner merge-task dispatch"). But at
the (then-)landed tip neither `doneWhenFloorClause` in
`skills/war/assets/workflow-template.js` (~line 719-720) nor `agents/war-refiner.md` step 7
instructed any capture of the done-when command's stdout — both branched on the exit code
only. Contrast the two *sibling* evidence channels the same wiring task DID implement
correctly: `gate_log_path` (a tee of the gate output) and `mappedTests` (the test-floor's own
exit-0 stdout captured into `MergeResult.mappedTests`). The done-when stdout claim was the
one channel that was asserted but never built — this was filed as a `follow-up` (Minor) at
gate-audit, functionally harmless at the time (nothing consumed the artifact yet).

**Pattern:** when a plan splits "author the floor/mechanism" and "wire the
consumer/integration" across separate tasks (common in this repo's floor-script family),
treat any header claim about the *consumer's* behavior as unverified until you've read the
actual consumer code — grep the claimed call site, don't take the producer's word for it.
If the producer task lands first, its header is writing about code that doesn't exist yet;
if the claim survives to the wiring task's own gate-audit without being implemented or
corrected, it becomes exactly this kind of durable contract-drift residual.

## RESOLVED (2026-08-06-done-when-floor-wiring/1.1, #1370 + #1340, landed dev/2026-08-06-done-when-floor-wiring @ c0665c15) — the wiring now exists

Code-verified at the landed tip (read via the `_refinery` worktree whose `gitdir` physical
path contains this plan's slug — HEAD equalled the confirmed tip exactly):
`skills/war/assets/workflow-template.js` now defines `doneWhenFloorClause` (dispatches
`assert-done-when.sh … > <_refinery>/.war/done-when-<taskId>.log 2>&1`, or the `2>&1 | tee`
variant with `${PIPESTATUS[0]}`), threads `done_when_log_path` through `MERGE_RESULT` (grep
hits at multiple call sites: D3/D4 comment block ~line 135-144, D5 `doneWhenLogOf` ~line
796-802, and every escalation/exhaustion push site), and `agents/war-refiner.md` step 7 plus
`skills/war/references/schemas.md` mirror the same contract. The floor script's own header
was updated in the same landing to describe the built contract precisely (the teed combined
stdout+stderr capture, own-exit-status-across-the-tee via `${PIPESTATUS[0]}` or
redirect-then-`$?`). The pattern this lesson describes (a floor's header can claim a
downstream behavior the wiring task hasn't landed yet) remains a generally reusable trap —
this specific instance is closed. Verify still present before acting on the pattern
elsewhere; do not assume this instance's fix generalizes to other floor scripts without
re-checking their own consumer code.

## RECURRENCE 2 (2026-08-06-handoff-schemas-contract/phase-1, task 1.2 → the p1-polish
phase-close task, #1381) — a *test-fixture comment* claims an unbacked downstream consumer

Same defect class, different surface: not a floor script's own header this time, but a new
test-fixture comment in `skills/war/assets/provision-worktrees.test.sh` (the HYG.j fixture
for the D19/D20 worktree-hygiene reuse repair). The comment justifies splitting stdout from
stderr in the fixture capture with: "the barrier parses stdout as the worktree PATH, so
markers MUST stay on stderr — dropping `>&2` from `hygiene_marker` would corrupt the path
capture." Code-verified: no consumer does that. The provision-barrier dispatch
(`skills/war/assets/workflow-template.js`) interpolates `${t.worktree}` directly INTO each
`ensure-worktree` command line it emits — it never reads the command's stdout as the path —
and instructs the refiner to key on the `STALE_REMOTE` / `WORKTREE_HYGIENE` marker *tokens*
in the command's output (either stream), returning only the `ENV_OUTCOME` JSON. The only
documented stdout-as-path capture anywhere in the run is a *different* subcommand entirely
(`resolve-working-branch`, consumed at Setup per `skills/war/SKILL.md` step 2). The assertion
itself is still worth keeping — `ensure-worktree`'s OWN stdout contract (its reuse-path
comment states "never changes this path's exit code or its stdout contract — markers go to
stderr") is real and worth pinning — but the *rationale sentence* names a downstream wiring
that does not exist, exactly this lesson's pattern one level down (a comment's claimed
*reason* for a test's own construction, not just a floor script's header, can assert an
unbacked cross-surface behavior). Confirmed present at the pin: read via a task worktree
whose `gitdir` physical path names this plan's slug (`p1-polish`, HEAD at the pre-land
integration tip `23680df427fb712feb9756ad951d8ee00972ac01` — one merge commit prior to the
plan's actual landed tip `e35dacc2cd0f4191cdc3ed86d0e04f357843f5aa` on
`dev/2026-08-06-handoff-schemas-contract`; no live worktree resolved to the exact landed
SHA, so this is the closest available grounded rung per the servitor's landed-tip ladder).
Disposition at gate-audit: `note` (informational only, not a hold — the underlying stream
split IS load-bearing and correctly implemented; only its justifying comment overclaims).

**Widened pattern:** the trap isn't limited to a *floor script's header*. Any comment that
justifies a test's construction by naming a specific downstream consumer and what it does
with the output ("X parses this as Y, so Z must hold") is an unverified claim exactly like a
floor-script header's forward reference — grep the claimed consumer's actual code before
trusting the comment's own rationale, even when the comment sits inside the test file itself
and even when the test's underlying assertion is correct for an unrelated, real reason (here:
the producer's own documented stdout contract).

## RECURRENCE 3 (2026-08-25-engine-reliability-and-filing-fidelity/phase-8, task 8.1, #1476
gap 4) — a *second emission site* for the same marker mechanism ships with zero widened
capture prose

Same underlying mechanism (D20/#1381 `WORKTREE_HYGIENE`), a third surface. Phase 8 Task 1
extended `reuse_hygiene` to run on `cmd_ensure_refinery_worktree`'s reuse arms (b) and (c) in
`skills/war/assets/provision-worktrees.sh` (gap 4), so the run-scoped `_refinery` worktree —
which has **no owning task id** — can now itself emit `WORKTREE_HYGIENE` marker lines. Every
downstream capture surface was left describing the original, single emitter only, confirmed
live at the landed tip (31ac70a72b09231cbfab3a106d28afdc29442a4f, read via the `_refinery`
worktree whose `gitdir` physical path names this plan's slug, HEAD == the confirmed tip):
- `skills/war/assets/workflow-template.js`'s `worktreeHygieneClause` (~line 1408): "an
  ensure-worktree REUSE may emit `WORKTREE_HYGIENE` marker lines ... Capture each as
  `{ task: "<that task's id>", ... }`" — no task id exists for the refinery worktree.
- `agents/war-refiner.md` provision flavor 1 (`## provision`, bullet 1): "capture
  `WORKTREE_HYGIENE` marker lines an `ensure-worktree` reuse emits into an optional
  `worktreeHygiene` array" — same ensure-worktree-only attribution.
- `skills/war/references/schemas.md`'s `worktreeHygiene` bullet: "captured from the
  `WORKTREE_HYGIENE` marker lines an `ensure-worktree` **reuse** emits" — same.

Net effect: a refinery-worktree hygiene repair/detection is either dropped by the capturing
refiner or captured with a fabricated `task` field — fail-open (markers ride exit 0, no
routing/halt impact), but the Lead-visible phase-report line this mechanism exists to deliver
is silently missing for this emitter. Filed as a `follow-up` (Minor) at gate-audit, not
absorbed this phase (the fix needs `workflow-template.js` + `agents/war-refiner.md` in ONE
commit per the standing/dispatched split, plus the `schemas.md` contract line, and the byte
surface for `workflow-template.js`'s prompt literals was already at a funded ceiling this
plan). **Widened pattern, again:** adding a new emitter to an existing marker/event mechanism
is not complete until EVERY documented capture surface (dispatched prompt clause + its
standing-card mirror + the schema contract) is re-grepped and widened in the same commit —
producer-side "same hygiene arm" work reliably outruns consumer-side capture prose, and this
is now the third distinct instance of exactly that gap on this same codebase.

> archived 2026-08-17: resolved — moved to archive (RECURRENCE 3 appended 2026-08-26; still
> archived — this is an edit-in-place of an already-archived, provenance-tagged lesson, not a
> hot/cold move)
