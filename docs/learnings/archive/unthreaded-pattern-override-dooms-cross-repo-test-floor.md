---
name: unthreaded-pattern-override-dooms-cross-repo-test-floor
description: "A guard's override flag that no run config threads is dead config, so the first foreign repo fails totally (test floor --pattern false-flagged every no-test)"
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
(the merge-task prompt and the retry prompt in `workflow-template.js`, and the standing
instruction in `agents/war-refiner.md`). Result on the first non-meta run (Otto, vitest `*.test.ts`,
2026-07-07 war-engine-port): **every** `requiresTest` merge-task false-no-tested → pointless
ADD_TEST fix-worker + full re-audit → red again on the equally-bare retry → escalation. Verified
red/green: same base/branch, default → exit 1, `--pattern '*.test.ts'` → exit 0.

Fix (ratified spec): `docs/specs/2026-07-07-test-floor-pattern-threading-design.md` —
`overrides.testPattern` config field threaded to all three prompt sites + the standing
instruction, war-room scout+confirm, decisive zero-match preflight (warn interactive / stop afk).

## Diagnosis cue

After a task branch merges, `git diff <integrationTip>...<taskBranch>` is empty, so repro against the refine-time base (the integration branch's first-parent commit before the task's merge).

## Status: RESOLVED (test-floor-pattern-threading phase, p2t1 + p2t2)

Per the phase's audit log (both tasks approved, gate-audit `approve` on p2t1): Task 1.1 landed the
`--pattern` threading into all three prompt sites (`workflow-template.js` + `agents/war-refiner.md`,
same commit), and Task 1.2 landed the operator-facing `overrides.testPattern` prose in
`skills/war/SKILL.md`. See [[floor-subset-gate-claim-overstates-arbitrary-custom-pattern]] for a
doc-precision residual the same phase surfaced in the SKILL.md prose it landed.

## Related

[[floor-script-discovery-set-must-mirror-gate-exclusions]] — same floor, the intra-repo
mirror-the-gate rule; this lesson is its cross-repo dual: the mirror must be *declarable*, not
only hardcoded.
[[floor-subset-gate-claim-overstates-arbitrary-custom-pattern]] — the doc-precision nit surfaced
while landing this fix's prose.

> archived 2026-07-15: resolved — moved to archive
