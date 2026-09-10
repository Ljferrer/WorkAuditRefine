---
name: merge-dispatch-death-after-its-own-push-lands-commits-with-the-task-recorded-unmerged
description: "A merge dispatch that dies after pushing but before returning leaves the task's commits on the integration branch while the engine records it env-died/unmerged"
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
  slug: merge-dispatch-death-after-its-own-push-lands-commits-with-the-task-recorded-unmerged
  phase: "2026-09-06-engine-and-audit-verdict-integrity/phase-13 (Every dispatch classified, D21), task 13.1"
  keywords: 
    - mergeDied
    - env-died
    - merge dispatch death
    - push before return
    - unmerged but landed
    - gate-audit missing entry
    - derive-and-skip
    - Recovery relaunch
    - PIN-25
    - D21
  tags: 
    - audit-pipeline
    - engine
    - land-decision
  created: 2026-09-08
  originSessionId: e8da971f-dacd-4f27-a998-5f603270dabe
  modified: 2026-09-09T02:58:52.011Z
---

# A merge dispatch death between its own push and its return can leave a task's commits landed while the engine still records it unmerged

**Context (code-verified at landed tip `891bbc7a5da617332d404d6088f2bcf80c9fded5`,
`dev/2026-09-06-engine-and-audit-verdict-integrity`, `skills/war/assets/workflow-template.js`
line 4094, read via the `_refinery` worktree whose HEAD equals that tip):** the merge-task prompt
instructs the refiner to push the merge onto the integration branch as one of its steps, then
report back. If the refiner dispatch dies post-spawn (harness/API death) **after** that push but
**before** the dispatch returns, `deathOf(mr)` at line 4093-4094 is truthy and `mergeDied(mrDeath)`
runs — the task classifies `env-died` and stays "unmerged" from the engine's own bookkeeping, even
though its commits are already on the integration branch. The task gets no per-task gate-audit
entry, and `landed[]` omits it for that run.

**Why this is not a real defect (PIN-25, End state 19, Commander's Intent purpose bullet 3):** the
phase still lands at whatever tip it reaches — the extra commits ride along even though the task
that produced them isn't credited. On a **Recovery relaunch**, derive-and-skip's ancestor check
(`git merge-base --is-ancestor <task-branch> <tip>`) is genuinely non-vacuous here (the branch has
real commits, unlike the zero-commit case in
[[zero-commit-task-branch-is-vacuously-an-ancestor-so-derive-and-skip-records-it-merged]]), so the
relaunch correctly derives the task as already-merged and records it without re-dispatching.

**How to apply:** if a phase report shows a task `env-died` at the merge site but you can see its
commits already on the integration branch (`git log --oneline <base>..<tip> -- <task's files>`),
this is the expected shape, not data corruption — do not manually re-merge or cherry-pick. Let the
Recovery relaunch's derive-and-skip pick it up; it will not re-dispatch a worker for a branch whose
commits are already ancestors of the tip. If you must audit the task's own content immediately
(before a relaunch), read it directly off the integration branch — there is no per-task gate-audit
entry to rely on for that run.

Related: [[zero-commit-task-branch-is-vacuously-an-ancestor-so-derive-and-skip-records-it-merged]]
(the inverse failure mode — a branch with zero commits being falsely credited as merged; this
lesson is a branch with real commits being falsely recorded as unmerged, both resolved by the same
derive-and-skip ancestor check behaving correctly in each respective case).
