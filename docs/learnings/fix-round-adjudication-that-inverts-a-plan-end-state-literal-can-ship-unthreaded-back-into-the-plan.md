---
name: fix-round-adjudication-that-inverts-a-plan-end-state-literal-can-ship-unthreaded-back-into-the-plan
description: "A within-task fix round can correct a plan's End-state literal (here: the provision-barrier dispatch death classifies HARD held:workflow-error, not the plan-enumerated env-died-soft) for sound, evidence-grounded reasons — but if the adjudication is never threaded back into the plan body / End-state wording, later tasks' fixtures faithfully pin the LANDED (correct) behavior while the plan text and its own check: grep-token pin still assert the SUPERSEDED wording, so a token-presence check reads 'met' while the substantive clause it names is false"
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

**Code-verified** at landed tip `513161f8083c18f4b582f139ec4162c0e95d1116` on
`dev/2026-08-25-engine-reliability-and-filing-fidelity` (landed-tip grounding rung 2 — the
`_refinery28` worktree's `HEAD` equals the threaded tip; physical gitdir path
`<repo-root>/.claude/war-worktrees/2026-08-25-engine-reliability-and-filing-fidelity-2026-08-26/_refinery/`).

Phase 6's End state 9 (and the matching D11 row, and Task 6.1's own plan slice) says four
dispatch sites — "the provision-barrier, `provisionStep`, polish-worktree, and sweep
dispatches" — each classify a dispatch death `env-died` soft via `dispatchAgent`. Task 6.1's
FIRST implementation routed the barrier soft too, by inventing a new `held:nothing-merged`
land-decision member with no Checkpoint outcome arm and no Recovery-relaunch entry point — a
prior audit round blocked this (a genuine soft barrier route needs a land-decision the plan's
own CONTINGENCY did not pre-authorize). The **fix round** (commit `eb91ca0`, tracked as `#1794`)
correctly reversed course: it deleted the barrier's local `env-died` catch, so a barrier death
now rethrows to the top-level catch and stays `held:workflow-error` — the barrier is the ONE
dispatch site among the four that does NOT classify soft. Confirmed live at the pin:
`skills/war/assets/workflow-template.js` line 1438 reads `// dispatchAgent, tagging ONLY (Phase
6 Task 1 (c) enumerates the routed sites; the barrier is not one):` with no local try/catch
around the barrier dispatch.

**The gap:** this adjudication (`#1794`) was never threaded back into the plan body. End state 9's
wording, the D11 row, and Task 6.1/6.2's plan slice text all still read as if the barrier
classifies soft. Task 6.2's own fixture faithfully pins the CORRECT (landed) behavior —
`drain-cause (End state 9, adjudicated #1794): a provision-BARRIER dispatch death rethrows
held:workflow-error …` — and documents the supersession in its own title/comment. But End state
9's `check:` is a bare `grep -F 'drain-cause' skills/war/assets/workflow-template.test.mjs`
presence pin, which is satisfied by the token appearing ANYWHERE in the file — it cannot see that
one of the four enumerated sites now asserts the opposite of what the condition's own sentence
says. A gate-audit seat reading only the grep result would attest "met"; multiple independent
audit seats across tasks 6.1, 6.2, and the post-merge gate-audit all had to catch this by hand
(re-deriving it from `git log -S`/`git blame` against the live code) and record it as a `note`,
never a hold — the code is right, the plan prose is stale.

**Why this generalizes:** any time a fix round reverses an earlier implementation's approach for
sound reasons discovered mid-task (a blocked audit round, a contingency that turns out infeasible),
the adjudication lives only in the commit message and the fixture's own inline comment unless
someone explicitly patches the plan body. A `check:` that is a bare token-presence grep (rather
than one that can verify the SUBSTANCE of a multi-clause condition) is structurally blind to this
class of drift — it passes on the token's mere existence, not on whether the sentence naming that
token is still true.

**How to catch it:** when a task's fixture comment cites an issue number as the reason its
assertion diverges from the plan-literal expected shape (e.g. "adjudicated #NNNN"), that is the
signal to check whether the plan's End state / D-row / task slice text was ever patched to match —
if not, the End-state attestation for that condition should read partially-met/scoped, and the plan
should get a Lead-side wording patch in the same session that closes the phase, not left for a
future reader to rediscover from the commit graph.

**Locate-cue (verify still present before acting):** `skills/war/assets/workflow-template.js`
line ~1438 (barrier dispatch, no local catch); `skills/war/assets/workflow-template.test.mjs`,
the `drain-cause (End state 9, adjudicated #1794)` fixture; the plan file
`docs/plans/2026-08-25-engine-reliability-and-filing-fidelity.md`'s End state 9 / D11 row, still
unpatched as of this writing.
