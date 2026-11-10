---
name: stacked-release-plan-version-literal-lags-operator-target
metadata:
  node_type: memory
  type: project
  keywords: [hardcoded bump, stale semver, re-baseline, fallback clause, master moved, next free patch, version mismatch, gh-preflight, release bump]
  provenance: code-verified
  slug: stacked-release-plan-version-literal-lags-operator-target
  phase: provisioning-lifecycle/p3; recurred 16 times through floor-script-correctness/phase-2-t5 (v0.14.32, 2026-07-12)
  tags:
    - release
    - stacking
    - plan-drift
    - operator-override
    - conditional-baseline
  related: "[[release-status-is-replace-slot-not-empty-field]], [[release-bump-slots-canonical-no-badge]], [[version-slots-no-cross-slot-consistency-test]]"
  originSessionId: fab06e87-b8c3-454f-a1d8-ecc9fa41faf6
  created: 2026-06-28
description: "A stacked release's plan version literal is stale once an earlier stacked plan lands; resolve the bump against the live baseline and the task directive, never the plan string."
---

# Stacked releases: plan version literal lags operator-directed target

**Durable rule:** a release task's hardcoded version literal in the plan doc is stale the moment an earlier stacked plan lands. Authoritative source = the operator/task directive + the baseline version in the worktree — never the plan's hardcoded string.

**Auditor note:** seeing "plan says vX, candidate ships vY" on a stacked release — verify the worktree baseline and the operator task prompt; if both confirm vY, the worker was correct (Nit at most, never a defect). And check whether the plan already wrote a fallback clause ("re-baseline if master moves") BEFORE flagging the mismatch: a re-baselined bump under such a clause is compliance, not drift.

**Plan-authorship pattern:** when a release task sits at the end of a serial stack, state both (a) the expected baseline as of drafting and (b) an explicit standalone-fallback rule ("if run off another tip, re-baseline to the next free patch off the live tip"). Live example: `docs/plans/2026-06-30-workflow-template-test-fidelity-sweep.md` (Coordination section).

**History:** recurred 16 times, always clean, and is now guarded by `skills/war/assets/version-slots.test.mjs` ([[version-slots-no-cross-slot-consistency-test]]). Escalate only if a slot actually mismatches or that guard is found removed or weakened.

> archived 2026-07-11: resolved — moved to archive
