---
name: doc-token-guard-over-mapped-surfaces-cannot-see-an-unmapped-surface-restating-the-literal
description: "A doc-token guard checks only its mapped surfaces, so an unmapped doc that restates the guarded literal drifts unseen"
metadata:
  node_type: memory
  type: project
  keywords:
    - doc-token guard
    - TARGET_ARTIFACTS_MARKER
    - MARKER_SURFACES
    - per-surface map
    - unmapped surface
    - literal restated
    - names the constant
    - positive-only guard
    - default-deny census
    - plan-faithfulness
    - drift guard
  provenance: code-verified
  slug: doc-token-guard-over-mapped-surfaces-cannot-see-an-unmapped-surface-restating-the-literal
  phase: 2026-10-20-rea-artifact-evidence/phase-2 task 2.4
  tags:
    - war
    - drift-guard
    - docs
    - test-gap
  created: 2026-10-21
  originSessionId: 18c261f6-f7c5-4bb3-8473-a40e81fb5346
  modified: 2026-10-21T16:42:38.714Z
---

# A doc-token guard cannot see an unmapped surface that restates the literal

**The rule in this plan.** Plan 2026-10-20-rea-artifact-evidence kept the Target artifacts marker value (`**Target artifacts**`) on a short list of surfaces. `skills/war/assets/target-artifacts.test.mjs` extracts the value from each one (`MARKER_SURFACES`) and deep-equals it to `TARGET_ARTIFACTS_MARKER`. Every other surface was to name the constant, never the value.

**What happened.** Task 2.4 wrote two new docs, `skills/war/references/artifact-evidence-lead.md` and `skills/war-room/references/rea-setup.md`. Both restated the bold marker value in prose. The guard stayed green, because it reads mapped surfaces only. The plan-faithfulness seat caught both, by reading the plan's Pivotal constraint, and rated them Minor. A fix round replaced each with a pointer to the constant.

**Why a test did not catch it.** The guard is positive-only. It proves each mapped surface carries the right value. It has no arm that proves an unmapped surface carries none. A reworded or restated literal on any new file is invisible to it.

**How to apply.**
- When a plan limits a guarded literal to named surfaces, add a default-deny scan for the literal over every other file in the scanned directories. Mutation-test it: add the literal to one unmapped file and watch the scan go red.
- Without that scan, expect a doc-writing task to restate the literal by habit. Name the constant in the task's Plan slice.
- This is the same blind-spot class as [[structural-test-blind-spot-narrowing-needs-negative-reference-and-default-deny-census]].

**Status.** Audit finding resolved in a fix round before land, recorded as pattern, not live instance. At the landed tip the two docs and `skills/war/SKILL.md` name `TARGET_ARTIFACTS_MARKER`. The guard still has no scan over unmapped surfaces.

**Locate-cue (verify still present before acting).** `skills/war/assets/target-artifacts.test.mjs`, the `MARKER_SURFACES` array and the test titled "doc-token guard". Found at landed tip 0d8a9fba, read through the run's `_refinery` worktree (HEAD equal to the tip).
