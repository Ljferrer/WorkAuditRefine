---
name: premergetip-chain-skips-requirestest-false-tasks
description: "preMergeTip chains on requiresTest-filtered list not full merge order; over-populates --mapped"
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

# preMergeTip's serial-merge chain skips requiresTest:false tasks, over-populating the per-task --mapped set

**What (verified at `skills/war/assets/workflow-template.js`, phase audit-gate-verdict-fidelity/t2.1
— found in the p2-t2.1 worktree, ~line 731-739 `landMerged` and ~line 1085-1087 `evItems`):**
the post-merge evidence dispatch computes each task's own changed-file set as
`git diff --name-only <preMergeTip> <gateHeadSha>`, where `preMergeTip` is the **previous entry's**
`gateHeadSha` in `mergedTasksForGateAudit` (or the phase integration base for the first entry).
But `mergedTasksForGateAudit` is populated only inside `landMerged`'s `else` branch — a task with
`requiresTest === false` is pushed to `landed`/`succeeded` (so it still advances the integration
tip) but is **never** pushed to `mergedTasksForGateAudit` (the gate-audit HARD path is vacuous for
it, logged and skipped). When such a task merges between two gate-audited tasks in serial order,
the surviving chain entry's `preMergeTip` reaches **past** the skipped task, and the
`<preMergeTip>..<gateHeadSha>` diff range for the *next* gate-audited task is over-populated with
the skipped task's files too.

**Why this is benign (fail-open by construction, not luck):** the over-populated `--mapped` set can
only ever *lean* `gate-pin-status.sh` toward a spurious `STALE-MISMATCH`, which the gate-audit seat
treats as a SOFT cannot-confirm (the stale-tip defusing rule) — never a HARD hold, never a false
land-block. Phase-wide file-disjointness (parallel AND dep-chained tasks alike, per the code-boundary
decomposition doctrine) keeps the practical intersection empty in most real phases, so the correct
classification is usually produced anyway despite the gap.

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

**Disposition at find time:** filed as a Minor follow-up (task 2.1 audit), not fixed in the same
task — the spawn directive specified exactly this prev-`gateHeadSha`/phase-base idiom, so this is a
latent gap in the directed design, not a deviation from it.
