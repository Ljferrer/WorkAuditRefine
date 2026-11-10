---
name: submodule-scoping-gap-survives-in-land-and-polish-dispatch-families
description: "Closing a gap at the call sites a plan names (A/B/C) can leave sibling sites (D/E) in the same dispatch family open; grep every call site of the const or script before calling coverage complete"
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
  slug: submodule-scoping-gap-survives-in-land-and-polish-dispatch-families
  phase: "recovery-re-merge-dispatch-coherence/phase-1 (tasks 1.1, 1.2)"
  keywords: 
    - submodLandNote
    - submodMergeNote
    - assert-no-submodule-mutation.sh
    - floor-retry
    - polish merge
    - merge:p-polish
    - land re-dispatch
    - environment-proceed
    - baseline-proceed
    - submodule scoping
    - targetRepo
    - war-followup
    - workflow-template.js
  tags: 
    - war
    - workflow-template
    - dispatch-prompt
    - submodule
    - recovery-dispatch
  created: 2026-07-25
  originSessionId: 4eee3466-8bcc-44f9-a6c2-754d46624537
  modified: 2026-07-27T20:38:28.571Z
---

# Closing a gap at sites A/B/C can leave sibling sites D/E in the same dispatch family open

**The pattern:** a phase whose Method is "close gap X at sites A/B/C" can legitimately leave
sibling sites D/E in the same code family open. Check whether each deferral is a stated plan
non-goal (durable, expected, nothing to fix) or an unstated comment/behavior mismatch found while
tracing the same area (a real bug that needs its own follow-up). Both shapes can surface in the
same phase.

**How to apply:** when auditing or extending any of the `submodMergeNote`/`submodLandNote`-style
scoping notes or floor-script re-instruction comments in `skills/war/assets/workflow-template.js`,
grep all call sites of the specific const or script name, not just the ones a plan's slice names,
before concluding coverage is complete. A comment claiming "ALL floor invocations" or "the same
scoping" is a promise to verify per site, not to trust.

**The instance (phase 1 of `2026-07-24-recovery-re-merge-dispatch-coherence`):** the phase added
`submodMergeNote` to the three MERGE-side retry dispatches. Three siblings stayed open:
1. `submodLandNote` rode only the initial `land:phase-<id>` prompt, not the `environment-proceed`
   and `baseline-proceed` re-land dispatches (a stated non-goal).
2. The phase-close polish merge (`merge:p<phaseId>-polish`) had no submodule floor (a stated
   non-goal).
3. The floor-retry re-merge's comments claimed it re-instructs all three floor scripts, but its
   prompt never invoked `assert-no-submodule-mutation.sh` (a real pre-existing bug).

**RESOLVED (`2026-07-26-dispatch-args-and-floor-coverage/1.1`):** all three are closed. The
re-land dispatches carry `submodLandNote`, the polish merge runs `assert-no-submodule-mutation.sh`
bare (never `--declared`), and the floor-retry re-merge invokes the script for real.

The argument-order gotcha for that floor script is its own lesson:
[[assert-no-submodule-mutation-parses-positionals-before-flags-so-declared-must-trail]].

Related: [[prompt-mirror-shape-inherits-donor-prompts-latent-omission]] (the resolved half of this
same submodule-scoping family — MERGE-side `submodMergeNote`).

> archived 2026-07-27: resolved — moved to archive
