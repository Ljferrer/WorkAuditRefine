---
name: floor-script-header-can-claim-unbacked-downstream-capture
description: "A floor script's own header can assert a downstream integration behavior ('the refiner captures my stdout as an evidence artifact') that the wiring task never implements — verify the claimed consumer actually exists, don't trust the header prose"
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
  provenance: code-verified
  slug: floor-script-header-can-claim-unbacked-downstream-capture
  phase: 2026-08-05-precision-chain-and-loop-breaker/2
  tags: 
    - plan-code-mismatch
    - floor-scripts
    - contract-drift
  created: 2026-08-05
  originSessionId: 428f1fab-f385-493a-952d-9509fdac5e10
  modified: 2026-08-06T06:32:24.477Z
---

A floor script authored in one task can document a downstream integration contract that a
*later* task — the one actually responsible for wiring it — never implements, and nothing
catches the gap because the header prose reads as documentation, not an assertion any test
checks.

Concretely: `skills/war/assets/assert-done-when.sh`'s header states "STDOUT belongs to the
executed command — the refiner captures it as the done-when evidence artifact" and even
names the wiring task ("Task 2.3 wires this into the refiner merge-task dispatch") — verify
still present before acting: header comment at lines ~34-36. But at the landed tip neither
`doneWhenFloorClause` in `skills/war/assets/workflow-template.js` (~line 719-720) nor
`agents/war-refiner.md` step 7 instructs any capture of the done-when command's stdout —
both branch on the exit code only. Contrast the two *sibling* evidence channels the same
wiring task DOES implement correctly: `gate_log_path` (a tee of the gate output) and
`mappedTests` (the test-floor's own exit-0 stdout captured into `MergeResult.mappedTests`).
The done-when stdout claim is the one channel that was asserted but never built.

This was filed as a `follow-up` (Minor) at gate-audit — functionally harmless (nothing
currently consumes a done-when artifact, so the gap causes no live failure), but it is a
durable trap for a future reader: trusting a component's own header as ground truth for
what a *different*, later-landing component does is exactly backwards — the header can
describe an aspiration or a stale forward-reference, not a verified fact.

**Pattern:** when a plan splits "author the floor/mechanism" and "wire the
consumer/integration" across separate tasks (common in this repo's floor-script family),
treat any header claim about the *consumer's* behavior as unverified until you've read the
actual consumer code — grep the claimed call site, don't take the producer's word for it.
If the producer task lands first, its header is writing about code that doesn't exist yet;
if the claim survives to the wiring task's own gate-audit without being implemented or
corrected, it becomes exactly this kind of durable contract-drift residual.
