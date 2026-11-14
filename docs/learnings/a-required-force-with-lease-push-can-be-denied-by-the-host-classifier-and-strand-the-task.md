---
name: a-required-force-with-lease-push-can-be-denied-by-the-host-classifier-and-strand-the-task
description: "The host classifier can deny a worker's force-with-lease push and strand a task"
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
    - dispatch-side rebase
    - re-dispatched seed task
    - Lead no-ff merge recovery
    - escalation-completion land
  provenance: code-verified
  slug: a-required-force-with-lease-push-can-be-denied-by-the-host-classifier-and-strand-the-task
  phase: 2026-11-08-engine-recovery-relaunch-and-land/phase-3 (seed-9), recurrence 2026-11-08-shell-floors-tests-and-lint/phase-2 (seed-1)
  tags:
    - war-worker
    - push
    - escalation
  created: 2026-11-09
  originSessionId: af72d7d8-ef0f-4543-bac4-2a766b4fb11f
  modified: 2026-11-14T00:16:23.544Z
---

# A required force-with-lease push can be denied by the host classifier

**RESOLVED (#2671):** the stop rule and the recovery are now codified. The worker card's "Dep-wave rebase + force-with-lease carve-out" section (`LEASE_DENIED_RULE` in `workflow-template.js`) tells the worker to stop with `blocked_reason` starting `push_denied:`. The recovery is the `push_denied:` arm in `skills/war/references/resume-and-recovery.md`: an operator-approved lease push, then a single-task Recovery relaunch.

**What happened.** A merge-queue rebase moved a task branch the worker had already pushed. The host auto-mode classifier denied the required `git push --force-with-lease` as "[Git Destructive]". Nothing merged and the task escalated. It recurred the next phase (seed-1), so it is not a one-off.

**Third sighting (2026-11-08-shell-floors-tests-and-lint phase 2, seed-1).** A dispatch-side rebase moved the pushed seed-1 commit before the worker ran. The old and new commits had the same patch-id. The worker's plain push failed as non-fast-forward, and the classifier denied the lease push. The worker stopped with `push_denied:` and named the exact lease command, as the codified rule asks. The phase held `held:escalation` while the other three tasks landed. Expect this path for any re-dispatched seed task whose branch is already on origin. The codified rule prevents damage but not the hold.

**Rule.** The carve-out is permission from WAR, not from the host. Never retry with `--force` or work around the classifier. When you plan a task that edits an already-pushed branch, expect a merge-slot rebase to force this path.

**Second cause.** The same task was a docs-only lesson edit with `requiresTest: true`, so the `no-test` floor tripped first. Set `requiresTest: false` for a docs-only lesson task.

Locate-cue: verify still present before acting. `LEASE_DENIED_RULE` is in `skills/war/assets/workflow-template.js` and the `push_denied:` arm is in `skills/war/references/resume-and-recovery.md` (read at master 4bca2722, the plan's merge-base).

Related: [[held-escalation-lead-manual-completion]].
