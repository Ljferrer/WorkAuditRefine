---
name: a-worker-that-ends-its-turn-to-wait-on-a-backgrounded-command-dies-and-its-uncommitted-edits-stay-in-the-shared-stash
description: A worker that ends its turn to wait on a backgrounded command dies with its edits left in the shared stash
metadata:
  node_type: memory
  type: project
  keywords:
    - worker death
    - end turn to wait
    - background command
    - bash timeout
    - git stash
    - shared stash stack
    - uncommitted edits lost
    - polish worker
    - ace advisory polish
    - issue 2617
    - PR 2618
  provenance: agent-unverified
  slug: a-worker-that-ends-its-turn-to-wait-on-a-backgrounded-command-dies-and-its-uncommitted-edits-stay-in-the-shared-stash
  phase: 2026-11-04-late-defects-fixed-in-run/phase-2 (task 2.1 ace advisory polish)
  tags:
    - war
    - worker
    - stash
    - process
  created: 2026-11-05
  originSessionId: f18978de-02f5-4ccd-9681-eb7dbaa3087b
  modified: 2026-11-05T09:23:54.547Z
---

# A worker that ends its turn to wait on a background job dies

**What happened.** The ace advisory polish worker for task 2.1 ran 32 minutes and never committed.
It saw a gate red and wanted to prove the red was not its own.
So it stashed its edits in the shared git stash and reran the gate command on the clean tree.
That command outran the Bash timeout, and the harness moved it to the background.
The worker then ended its turn to wait for the result.
An ended turn is the end of a worker: no later message wakes it.
The edits stayed in `stash@{0}` and no commit carried them.

**Why it is a trap.** Two bad moves compound.
First, `git stash` on a shared stack hides work from the audit pin and from every other worktree's stash list.
Second, a worker has no way to be resumed, so "wait for the background job" means "stop".
The worker should have proved the red on a separate detached worktree at the base, and kept its own edits in place.

**Cost.** The polish produced nothing in 32 minutes, and its edits were left in the stash, not in any commit.

**How to apply.**
If a worker report says it stashed, ended its turn, or left a background command, list `git stash list` before you re-derive the work.
Never pop. Capture the entry SHA, read it with `git stash show -p <sha>`, and apply it with `git stash apply <sha>`.
When you write a worker prompt that runs a long gate, say: run it in the foreground inside the timeout, or prove the red on a separate base worktree, and never end the turn to wait.

**Status.** Issue #2617 tracks this, and PR #2618 adds a one-turn rule to the worker card.
Absence note: referent not found @ phase 2 landed tip fc9cb08c. `agents/war-worker.md` has no stash or end-turn rule there, because PR #2618 was not merged.
Verify the rule is present before you rely on it.

Related: [[fix-round-uncommitted-leftover-is-stashed-by-pin-transfer-and-never-lands]] (the refiner-side path to the same shared stash), [[audit-tree-fingerprint-d8-row-can-red-under-gate-load-and-discard-a-docs-only-polish]] (the load that made the gate slow).
