---
name: fix-round-adjudication-that-inverts-a-plan-end-state-literal-can-ship-unthreaded-back-into-the-plan
description: "A fix-round adjudication that reverses a plan End-state literal must be patched into the plan; a token-presence grep cannot see the drift."
metadata: 
  node_type: memory
  type: project
  keywords: 
    - End state literal
    - fix round adjudication
    - unthreaded adjudication
    - provision-barrier
    - env-died soft
    - held:workflow-error
    - grep-token check passes vacuously
    - plan text lag
    - drain-cause
    - gate-audit D3
    - cross-rung contradiction
    - stale-looking-but-correct
  provenance: code-verified
  slug: fix-round-adjudication-that-inverts-a-plan-end-state-literal-can-ship-unthreaded-back-into-the-plan
  phase: "2026-08-25-engine-reliability-and-filing-fidelity/phase-6 (tasks 6.1, 6.2)"
  tags: 
    - war
    - plan-faithfulness
    - end-state
    - audit-pipeline
    - gotcha
  created: 2026-08-26
  originSessionId: 46a4dbcd-fa2b-416c-87f8-931f5c3c90b5
  modified: 2026-08-26T20:32:53.098Z
---

# A fix round's correct adjudication can leave the plan's End-state literal false at land, with the grep pin blind to it

**Rule:** when a fix round reverses an earlier implementation for sound reasons found
mid-task, patch the plan body (End state, D-row, task slice) in the same session that
closes the phase. Otherwise the adjudication lives only in the commit message and a
fixture comment, and the plan text keeps asserting the superseded behavior.

**What happened:** Phase 6 End state 9 of
`docs/plans/2026-08-25-engine-reliability-and-filing-fidelity.md` says four dispatch
sites (provision-barrier, `provisionStep`, polish-worktree, sweep) classify a dispatch death
`env-died` soft via `dispatchAgent`. The fix round tracked as #1794 correctly made the
barrier the one site that does NOT: it deleted the barrier's local `env-died` catch, so a
barrier death rethrows and stays `held:workflow-error`. In
`skills/war/assets/workflow-template.js` the barrier dispatch carries the comment
`the barrier is not one` and no local try/catch. Task 6.2's fixture
`drain-cause (End state 9, adjudicated #1794)` in `workflow-template.test.mjs` pins the
landed behavior. The plan's End state 9, its D11 row, and the task slices still read as if the
barrier routes soft.

**Why the pin is blind:** End state 9's `check:` is a bare
`grep -F 'drain-cause' skills/war/assets/workflow-template.test.mjs`. A token-presence grep
passes on the token existing anywhere in the file. It cannot see that one of four enumerated
sites now asserts the opposite of the sentence naming the token. Every audit seat that caught
this had to re-derive it by hand from `git log -S` / `git blame` and recorded it as a `note`,
never a hold: the code is right, the prose is stale.

**How to catch it:** a fixture title or comment that says "adjudicated #NNNN" as the reason
its assertion diverges from the plan literal is the signal. Check whether the plan text was
patched to match. If not, attest that End state partially-met/scoped and give the plan a
Lead-side wording patch before the phase closes.

**Status:** #1794 is closed; the plan's End state 9 / D11 wording was still unpatched at the
last check.

**Locate-cue:** `skills/war/assets/workflow-template.js`, the barrier dispatch comment
`the barrier is not one`; `skills/war/assets/workflow-template.test.mjs`, the
`drain-cause (End state 9, adjudicated #1794)` fixture; the plan's End state 9 and D11 row.

> archived 2026-09-04: resolved — moved to archive
