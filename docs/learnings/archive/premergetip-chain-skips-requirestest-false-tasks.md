---
name: premergetip-chain-skips-requirestest-false-tasks
description: "A topology pointer built from a filtered list skips the filtered-out items; preMergeTip now chains on lastLandedTip, the full serial merge order (#806)"
metadata: 
  node_type: memory
  type: project
  keywords: 
    - preMergeTip
    - mergedTasksForGateAudit
    - requiresTest false
    - gate-pin-status
    - serial merge order
    - ff-topology
    - evidence dispatch
    - over-populated mapped set
    - benign-advance
    - stale-mismatch
  provenance: code-verified
  slug: premergetip-chain-skips-requirestest-false-tasks
  phase: audit-gate-verdict-fidelity/t2.1
  tags: 
    - war
    - workflow-template
    - gate-audit
    - evidence-dispatch
    - fail-open
  files: 
    - skills/war/assets/workflow-template.js
  relates: 
    - "[[gate-evidence-severity-not-verdict-gates-hard-path]]"
    - "[[defined-but-not-yet-emitted-plan-slice-pattern]]"
  created: 2026-07-09
  originSessionId: 68b2ca32-fa05-459c-9ddf-f23ca91a5f40
---

# preMergeTip must chain on the full serial merge order, not the requiresTest:true-filtered list

## Fixed — phase "Engine fidelity + evidence contract" (#806, 2026-07-12)

**Code-verified via the phase's own task worktree** (the servitor's own cwd was a stale, unrelated
checkout — see [[servitor-verify-on-write-worktree-can-lag-just-landed-phase]]): a `lastLandedTip`
tracker in `skills/war/assets/workflow-template.js` (module-level, alongside
`mergedTasksForGateAudit`) now stamps each gate-audit entry's `preMergeTip` from the tracker's value
**before** that task's own update — its true immediate predecessor tip in real serial merge order,
including `requiresTest:false` interleaves. A `requiresTest:false` task's `MergeResult` lacking
`integration_sha` leaves the tracker at the last REAL sha rather than poisoning the chain with a
sentinel. The gap is closed for this specific chain; the generic durable pattern below still stands
for any *other* filtered-list pointer built the same way.

**Durable pattern:** when a pipeline stage's serial-order chain is built from a **filtered** list
(here: `requiresTest:true` only) rather than the full landed-task order, any per-item "previous
entry" pointer silently skips the filtered-out items even though they still participated in the
real git history/topology the chain is trying to model. Reader beware: `landed` (or an equivalent
unfiltered order array) is the ground truth for topology; a filtered accumulator like
`mergedTasksForGateAudit` is the right list to iterate for gate-audit prompts but the **wrong**
list to derive a topology pointer (like a pre-merge base) from.

**How to apply:** before trusting a "previous entry in list X" pointer as a topological base,
check whether list X is a filtered subset of the true merge/land order; if so, the pointer needs
the full order (e.g. thread each landed task's integration_sha from the unfiltered `landed` array),
not the filtered list's own predecessor.

## History — the defect (phase audit-gate-verdict-fidelity/t2.1)

The post-merge evidence dispatch computed each task's own changed-file set as
`git diff --name-only <preMergeTip> <gateHeadSha>`, where `preMergeTip` was the **previous entry's**
`gateHeadSha` in `mergedTasksForGateAudit` (or the phase integration base for the first entry).
But `mergedTasksForGateAudit` is populated only inside `landMerged`'s `else` branch — a task with
`requiresTest === false` is pushed to `landed`/`succeeded` (so it still advances the integration
tip) but is **never** pushed to `mergedTasksForGateAudit` (the gate-audit HARD path is vacuous for
it, logged and skipped). When such a task merged between two gate-audited tasks in serial order,
the next gate-audited task's `<preMergeTip>..<gateHeadSha>` diff range was over-populated with the
skipped task's files too.

**Why it was benign (fail-open by construction, not luck):** the over-populated `--mapped` set can
only ever *lean* `gate-pin-status.sh` toward a spurious `STALE-MISMATCH`, which the gate-audit seat
treats as a SOFT cannot-confirm (the stale-tip defusing rule) — never a HARD hold, never a false
land-block. Phase-wide file-disjointness keeps the practical intersection empty in most real
phases.

**Disposition at find time:** filed as a Minor follow-up (task 2.1 audit), not fixed in the same
task — the spawn directive specified exactly this prev-`gateHeadSha`/phase-base idiom, so this was a
latent gap in the directed design, not a deviation from it.

> archived 2026-07-11: resolved — moved to archive
