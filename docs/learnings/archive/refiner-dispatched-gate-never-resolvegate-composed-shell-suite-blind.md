---
name: refiner-dispatched-gate-never-resolvegate-composed-shell-suite-blind
description: "RESOLVED (#894): the engine now composes plan.gate through resolveGate before every gate dispatch; a captured gate artifact only reflects the dispatched command, so re-verify the composition point is upstream of every dispatch site"
metadata: 
  node_type: memory
  type: project
  keywords: 
    - resolveGate
    - plan.gate
    - gate_log_path
    - gate artifact
    - shell test suite
    - .test.sh discovery
    - mixed runner repo
    - cannot-confirm
    - SOFT finding
    - gate-audit evidence
    - war-config.mjs
  provenance: code-verified
  slug: refiner-dispatched-gate-never-resolvegate-composed-shell-suite-blind
  phase: "Hook narrowing + decision records/1.1+1.2+1.3+1.4+phase-1-integrated-tip (gate-audit findings, 2026-07-12/13)"
  tags: 
    - gate-audit
    - gate-evidence
    - resolveGate
    - refiner
    - evidence-standard
  relates: 
    - "[[gate-output-curated-excerpt-obscures-mapped-test-evidence]]"
  created: 2026-07-13
  originSessionId: 3e7df1e1-5759-4eb0-9cb3-db7f6b90a91d
---

# The captured `.war/gate-<taskId>.log` / `gate-phase-<id>.log` artifact structurally omits shell-test output in this repo — by design of what gets dispatched, not by curation

A captured gate artifact can only reflect what the *dispatched* command included. If a gate-bearing
dispatch site interpolates a gate string that was never composed, the artifact can never show the
missing suites, however complete the capture.

**History (before #894):** `resolveGate(declaredGate)` in `skills/war/assets/war-config.mjs` composes
`<declaredGate> && <find *.test.sh discovery-and-run clause>`, but it was called only from the CLI
(`--resolve-gate`). Every merge-task / land-phase / phase-close-polish gate-run prompt in
`workflow-template.js` interpolated the **raw** `${plan.gate}`, and `agents/war-refiner.md` teed that
run to `gate_log_path`. With a JS-only `plan.gate`, the full, uncurated artifact could never contain
shell-suite output. Unlike [[gate-output-curated-excerpt-obscures-mapped-test-evidence]] (a refiner
curating the output), the command itself lacked the clause. In one hooks-only phase, all 5 gate-audit
seats raised the same Minor "captured gate is node-only; mapped shell test's execution unconfirmable"
finding, each correctly graded SOFT.

## RESOLVED — phase "gate-evidence-and-prose-truth" Phase 1 (#894, 2026-07-15)

**Code-verified in this repo** (`skills/war/assets/workflow-template.js`,
`skills/war/assets/war-config.mjs`): the engine now composes the gate before dispatch. `workflow-template.js` now carries a GATE COMPOSITION POINT
(ADR 0036) immediately after entry validation and before any of the nine gate-bearing dispatch sites
interpolate `${plan.gate}`: `if (plan) plan.gate = resolveGate(plan.gate)`, using an inline mirror of
`war-config.mjs`'s `resolveGate` (the Workflow sandbox still can't import — mirrored, not called
directly, per the existing D2 mirror-registry discipline). `war-config.mjs`'s `resolveGate` is now
idempotent by construction (an already-composed input returns byte-unchanged), so the CLI's own
`--resolve-gate` pre-resolution and this engine-side composition never double up. Every merge-task,
land-phase, and phase-close-polish gate-run prompt now interpolates the COMPOSED string, so a
refiner's teed `gate_log_path` artifact for a JS-only declared `plan.gate` now includes the
`*.test.sh` discovery-and-run clause's output too.

**The lesson stays hot as the pattern record (no archive, no retitle):** the underlying structural
insight — a captured gate artifact can only ever reflect what the *dispatched* command included, so
any future dispatch site added outside the reach of the entry-point composition (or a regression that
removes or reorders the composition point relative to dispatch) reopens exactly this gap — remains
durable and applies beyond this one fix. Re-verify the composition point is still upstream of every
dispatch site before assuming this finding is impossible in a future phase. If the "node-only gate"
finding recurs in this repo, treat it as a fresh regression, not a known SOFT.

> archived 2026-07-27: resolved — moved to archive
