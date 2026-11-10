---
name: prompt-mirror-shape-inherits-donor-prompts-latent-omission
description: "Mirroring a sibling dispatch prompt's shape copies the donor's latent omissions too, so audit and patch the donor before you mirror it"
metadata:
  node_type: memory
  type: project
  provenance: code-verified
  slug: prompt-mirror-shape-inherits-donor-prompts-latent-omission
  phase: merge-land-resilience/phase-1 (task 1.1)
  keywords:
    - prompt mirroring
    - dispatch shape
    - submodMergeNote
    - environment-proceed
    - baseline-proceed
    - re-merge prompt
    - workflow-template.js
    - inherited omission
    - targetRepo scoping
    - submodule task
    - "Commander's Intent mirror method"
    - latent bug propagation
    - submodLandNote
    - recovery-re-merge-dispatch-coherence
    - floor-retry
  tags:
    - war
    - workflow-template
    - dispatch-prompt
    - submodule
    - plan-method
  created: 2026-07-22
  originSessionId: 8e99f0a3-aecc-4068-9cd8-79868840feb7
  modified: 2026-07-25T09:04:17.977Z
---

# Mirroring an existing dispatch prompt's shape can copy its donor's latent omission, not just its correct parts

**The rule:** "mirror sibling X's shape" is a correct, cheap method (reuse what is already in the
codebase). But a mirror copies the donor's actual behavior, bugs included. Before shipping a prompt
built by mirroring another, check the donor against its *own* full requirements, not just the new
feature's. A donor that silently drops a clause for an edge case hands that drop to every mirror.
Fixing the donor is one fix at one site; each mirror otherwise inherits the gap as its own
easy-to-miss follow-up finding.

**Instance:** in `skills/war/assets/workflow-template.js`, the new `environment-proceed` re-merge
prompt mirrored the `baseline-proceed` re-merge byte for byte, and so copied its missing
`submodMergeNote` (the `targetRepo`-scoping clause for submodule tasks). The gap had bounded blast
radius (the merge fails and soft-escalates), so it was scored Minor/`follow-up`. That is why it can
persist: nothing reds.

**How to apply:** when a plan's Method says "mirror sibling dispatch/prompt X," treat that as two
obligations: (1) match the new site's own requirements to X's shape, and (2) audit X itself for
known omissions before copying it. The right fix is usually to patch the donor once (here: thread
`submodMergeNote` into `baseline-proceed`'s re-merge at the same time as the new
`environment-proceed` one), so every current and future mirror inherits the fix instead of the bug.

Related: [[standing-instruction-vs-dispatched-prompt-coverage-split]] (a different both-surfaces
coupling — standing `.md` card vs dispatched prompt — same root idea that a copied/mirrored surface
needs its own completeness check, not just presence).

**RESOLVED (verified 2026-08-02 at the live tip):** the entire gap family is closed —
`submodMergeNote` is threaded at the initial merge and all three retry dispatches (`floor-retry`,
`environment-proceed`, `baseline-proceed`); the land-side sibling `submodLandNote` now rides all
three land dispatches (`land:phase-<id>` and both `-proceed` re-lands); and the phase-close polish
merge runs `assert-no-submodule-mutation.sh` unconditionally. The durable rule above — a mirror
copies the donor's latent omission, so audit and patch the donor first — is what survives.

> archived 2026-08-15: resolved — moved to archive
