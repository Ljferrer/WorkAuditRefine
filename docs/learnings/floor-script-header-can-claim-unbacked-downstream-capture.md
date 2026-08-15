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
  provenance: code-verified
  slug: floor-script-header-can-claim-unbacked-downstream-capture
  phase: 2026-08-05-precision-chain-and-loop-breaker/2
  tags:
    - plan-code-mismatch
    - floor-scripts
    - contract-drift
  created: 2026-08-05
  originSessionId: 428f1fab-f385-493a-952d-9509fdac5e10
  modified: 2026-08-15T11:29:40.096Z
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
