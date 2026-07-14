---
name: push-to-deleted-pr-branch-silently-recreates-it
description: "Push after PR merge recreates dead branch, misses PR"
metadata: 
  node_type: memory
  type: project
  provenance: user-confirmed
  keywords: 
    - git push
    - new branch token
    - merged PR
    - deleted branch
    - cherry-pick
    - stale local ref
    - PR comment succeeds
  originSessionId: f19df621-be27-409f-8a11-40e9202a1c58
---

Observed 2026-07-12 (PR #795): a `git push` issued moments after the PR merged and its remote branch was deleted **recreates the dead branch** with exit 0 — the commit never enters the PR, and even `gh pr comment` on the merged PR still succeeds, so nothing errors. The one tell: the push output says `* [new branch]` for a branch you believe already exists remotely.

**Why:** operator had to point out the miss; both tool outputs read as success.

**How to apply:** when pushing a follow-up to a PR branch, check the PR state **before** the push, as its own command — `gh pr view <n> --json state` chained *after* the push in one compound command detects the miss but doesn't prevent it (that is exactly how the recurrence happened). Treat `[new branch]` in the push output as the tell. If it merged: cherry-pick the commit onto fresh `origin/<base>`, open a new PR, and delete the resurrected branch (verify its only unique commits are the cherry-picked ones via `git rev-list <branch> ^origin/<base>`). Related: [[land-local-follower-ref-can-lag-sync-before-next-phase]].

**Recurrence (same day, ~1h later, #797):** the trap re-fired on the very PR that carried this lesson's repo promotion — push and state-check were chained in one command, so the check reported MERGED only after the dead branch was already recreated. Recovery recipe above applied verbatim (`0ee1b42` → cherry-picked onto master, resurrected branch deleted).
