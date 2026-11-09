---
name: a-required-force-with-lease-push-can-be-denied-by-the-host-classifier-and-strand-the-task
description: "The worker carve-out for git push --force-with-lease can be denied by the host auto-mode classifier, so the task never merges"
metadata:
  promoted: dev/2026-11-08-engine-recovery-relaunch-and-land@phase-3
  node_type: memory
  type: project
  keywords:
    - force-with-lease
    - Git Destructive
    - auto-mode classifier
    - rebase diverged pushed branch
    - worker push denied
    - seed-9 escalated
    - no-test floor docs-only
    - requiresTest true lesson task
    - seed-1 escalated again
    - Lead no-ff merge recovery
    - escalation-completion land
  provenance: code-verified
  slug: a-required-force-with-lease-push-can-be-denied-by-the-host-classifier-and-strand-the-task
  phase: 2026-11-08-engine-recovery-relaunch-and-land/phase-3 (seed-9)
  tags:
    - war-worker
    - push
    - escalation
  created: 2026-11-09
  originSessionId: af72d7d8-ef0f-4543-bac4-2a766b4fb11f
  modified: 2026-11-09T18:56:04.467Z
---

# A required force-with-lease push can be denied by the host classifier

**What happened.** The merge-queue rebase moved a task branch that the worker had already pushed.
The worker card requires `git push --force-with-lease` after such a divergence.
The host auto-mode classifier denied that push with "[Git Destructive]".
Nothing merged and the task escalated.
The Lead did not merge the unaudited local commits.
It carried the fix to the next phase.

**Second cause.** The same task was a docs-only lesson edit with `requiresTest: true`.
The `no-test` floor tripped before the push problem mattered.
Set `requiresTest: false` for a docs-only lesson task.

**Rule.** Treat the carve-out as permission from WAR, not from the host.
If the push is denied, escalate with the evidence.
Do not retry with `--force` and do not work around the classifier.
When you plan a task that edits an already-pushed branch, expect that a dispatch rebase may force this path.

**Recurrence (phase 4, seed-1).**
The same task, seed-1, escalated again in the next phase for the same reason.
The merge-slot rebase moved its pushed branch.
The host classifier denied the worker's `--force-with-lease` push as "[Git Destructive]".
This is the second phase in a row, so plan for it. It is not a one-off.

**Lead recovery that worked.**
1. Dispatch one Lead test-fidelity seat on the unaudited test commit.
2. Lead runs a `--no-ff` merge of the task branch into the integration branch. This is a fast-forward push, so no force is needed.
3. Run the escalation-completion land: gate 36/36, one land-advance, then sync-follower.

Locate-cue: verify still present before acting. At landed tip 43eb7d25 the carve-out is the section "Dep-wave rebase + force-with-lease carve-out" in `agents/war-worker.md`.
Related: [[held-escalation-lead-manual-completion]].
