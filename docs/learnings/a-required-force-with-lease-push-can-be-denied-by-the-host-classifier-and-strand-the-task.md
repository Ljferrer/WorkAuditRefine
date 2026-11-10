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

**RESOLVED (#2671):** the stop rule and the recovery are now codified. The worker card's "Dep-wave rebase + force-with-lease carve-out" section (`LEASE_DENIED_RULE` in `workflow-template.js`) tells the worker to stop with `blocked_reason` starting `push_denied:`. The recovery is the `push_denied:` arm in `skills/war/references/resume-and-recovery.md`: an operator-approved lease push, then a single-task Recovery relaunch.

**What happened.** A merge-queue rebase moved a task branch the worker had already pushed. The host auto-mode classifier denied the required `git push --force-with-lease` as "[Git Destructive]". Nothing merged and the task escalated. It recurred the next phase (seed-1), so it is not a one-off.

**Rule.** The carve-out is permission from WAR, not from the host. Never retry with `--force` or work around the classifier. When you plan a task that edits an already-pushed branch, expect a merge-slot rebase to force this path.

**Second cause.** The same task was a docs-only lesson edit with `requiresTest: true`, so the `no-test` floor tripped first. Set `requiresTest: false` for a docs-only lesson task.

Related: [[held-escalation-lead-manual-completion]].
