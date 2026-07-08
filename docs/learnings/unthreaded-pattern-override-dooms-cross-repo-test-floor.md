---
name: unthreaded-pattern-override-dooms-cross-repo-test-floor
description: "floor's --pattern hatch unthreaded; every non-meta repo task false-no-tests"
metadata:
  node_type: memory
  slug: unthreaded-pattern-override-dooms-cross-repo-test-floor
  type: project
  provenance: code-verified
  keywords: [escape hatch, unthreaded override, cross-repo, false no-test, vitest, test floor, dead config, meta-repo default, refine-time base, three-dot diff empty after merge]
  tags:
    - war
    - test-floor
    - refinery
    - cross-repo
    - diagnosis
  files:
    - skills/war/assets/assert-test-in-diff.sh
    - skills/war/assets/workflow-template.js
    - agents/war-refiner.md
  relates:
    - "[[floor-script-discovery-set-must-mirror-gate-exclusions]]"
  created: 2026-07-07
  originSessionId: df914fb5-8f6f-44fc-9483-f5bea6b5df3e
---

# A documented override flag that no orchestration surface threads is dead config — and a total cross-repo failure

## The durable rule

When a guard ships a repo-specific default *plus* an override flag, the override must be reachable
from run configuration, or the first foreign repo fails **totally, not partially**.
`assert-test-in-diff.sh`'s default pattern set deliberately mirrors THIS repo's gate
(`skills/**/*.test.mjs`, `**/*.test.sh`) and its header advertises `--pattern` for other repos —
but no config field existed and all three invocation surfaces composed the call bare
(merge-task prompt `workflow-template.js:648`, retry prompt `:731`, standing instruction
`agents/war-refiner.md:39`). Result on the first non-meta run (Otto, vitest `*.test.ts`,
2026-07-07 war-engine-port): **every** `requiresTest` merge-task false-no-tested → pointless
ADD_TEST fix-worker + full re-audit → red again on the equally-bare retry → escalation. Verified
red/green: same base/branch, default → exit 1, `--pattern '*.test.ts'` → exit 0.

Fix (ratified spec): `docs/specs/2026-07-07-test-floor-pattern-threading-design.md` —
`overrides.testPattern` config field threaded to all three prompt sites + the standing
instruction, war-room scout+confirm, decisive zero-match preflight (warn interactive / stop afk).

## Diagnosis cue

Once a task branch has merged, `git diff <integrationTip>...<taskBranch>` is **empty** (merge-base
== branch tip) — a repro run post-land shows exit 1 for *both* the bug and the control and proves
nothing. Reconstruct the refine-time base from the integration branch's first-parent history (the
commit before the task's merge) and repro against that.

## Related

[[floor-script-discovery-set-must-mirror-gate-exclusions]] — same floor, the intra-repo
mirror-the-gate rule; this lesson is its cross-repo dual: the mirror must be *declarable*, not
only hardcoded.
