---
name: refiner-dispatched-gate-never-resolvegate-composed-shell-suite-blind
description: "Refiner's captured gate artifact is always JS-only here — plan.gate is dispatched raw, never routed through resolveGate()'s shell-suite discovery"
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

**The gap:** `resolveGate(declaredGate)` in `skills/war/assets/war-config.mjs` composes
`<declaredGate> && <find *.test.sh discovery-and-run clause>` — this is the function that would
make a gate run include BOTH the `node --test` suite and every `hooks/*.test.sh` / `skills/**/*.test.sh`
shell suite. But `resolveGate()` is invoked **only** from the CLI (`--resolve-gate`, a human/CI-facing
flag) — grep confirms zero call sites inside `skills/war/assets/workflow-template.js`, and
`fillDefaults()` (the config-resolution path threaded into the Workflow) never calls it either. Every
merge-task / land-phase / phase-close-polish gate-run prompt in `workflow-template.js` interpolates
the **raw** `${plan.gate}` string (e.g. `node --test 'skills/**/*.test.mjs'`), and `agents/war-refiner.md`
step 7 tees **that** run's stdout+stderr to the captured artifact. So for a repo whose `plan.gate`
config value is JS-only (this repo's default), the refiner's captured gate artifact — even though it
is the FULL, non-curated stdout+stderr of the command that was actually run — can **never** contain
shell-suite output, regardless of how thorough the refiner is about capture-completeness.
**[Stale as of 2026-07-15 in this repo — see the RESOLVED section below: the engine now composes
`plan.gate` before any dispatch site interpolates it, so this specific consequence no longer holds
here.]**

**Why this differs from [[gate-output-curated-excerpt-obscures-mapped-test-evidence]]:** that lesson's
gap was about a refiner *curating/collapsing* a full run's output before pasting/logging it — fixed by
the `.war/gate-<taskId>.log` tee-the-full-stdout mechanism. This gap survives that fix entirely: the
artifact IS the full, uncurated output of the executed command — the executed command itself just
never included the shell-suite clause in the first place, because `resolveGate()`'s composition is a
manual utility, not something the automated merge/land/gate-audit pipeline calls.

**Observed effect (2026-07-12/13, phase "Hook narrowing + decision records"):** every one of 5
gate-audit seats (tasks 1.1, 1.2, 1.3, 1.4, and the phase-integrated-tip re-run) — a phase whose
entire diff was `hooks/*.sh` + same-file `hooks/*.test.sh` shell suites — independently raised the
identical Minor "captured gate is node-only; mapped shell test's execution unconfirmable" finding,
each correctly graded SOFT/never-a-hold because the pin was CONFIRMED/BENIGN-ADVANCE and the mapped
shell tests were present+substantive at the pinned tip. That is 5 recurrences of the exact same
structural cause inside a single phase — a strong signal this will recur on **every** future phase
in this repo whose task diff lives in `hooks/*.sh`, until either (a) the run config's `gate` value is
authored as `resolveGate(...)`'s output directly, or (b) `workflow-template.js`/`war-refiner.md` are
changed to route the dispatched gate through `resolveGate()` before executing/teeing it. Option (b)
shipped 2026-07-15 — see the RESOLVED section below; this specific recurrence class is now closed in
this repo.

**Anchors (verify still present before acting):** `resolveGate` exported at
`skills/war/assets/war-config.mjs` (the discovery-clause composition + the `--resolve-gate` CLI-only
call site); `${plan.gate}` interpolated raw at the merge-task/land-phase/polish gate-run prompts in
`skills/war/assets/workflow-template.js`; the tee-to-artifact step in `agents/war-refiner.md`
merge-task step 7 (`gate_log_path`) and the intra-phase-dep `integratedTipGate` re-run in the
post-merge evidence-dispatch section.

**How to apply:** if closing this gap is ever wanted, either author the run's `overrides.gate` /
plan-declared gate as the already-`resolveGate()`-composed string at plan-authoring time (`node
skills/war/assets/war-config.mjs --resolve-gate '<declaredGate>'`), or change the merge-task/land-phase
gate-run steps in `workflow-template.js`/`war-refiner.md` to call `resolveGate(plan.gate)` before
executing — either fix is outside this phase's slice (hooks-only). Until then, a gate-audit seat on
any hooks-diff task in this repo should expect and correctly SOFT-grade this finding rather than
treat each recurrence as a fresh discovery. **This "until then" no longer holds as of 2026-07-15 (see
RESOLVED below) — a gate-audit seat should NOT expect this finding in this repo anymore; if it
recurs, treat it as a fresh regression, not a known SOFT.**

## RESOLVED — phase "gate-evidence-and-prose-truth" Phase 1 (#894, 2026-07-15)

**Code-verified in this repo** (`skills/war/assets/workflow-template.js`,
`skills/war/assets/war-config.mjs` — already landed on this task's base before this task started):
gap-closing option (b) above shipped. `workflow-template.js` now carries a GATE COMPOSITION POINT
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
dispatch site before assuming this finding is impossible in a future phase.
