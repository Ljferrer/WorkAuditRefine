---
name: gate2-commit-from-stale-verify-worktree-can-revert-a-release-bump
description: "A Gate-2 docs(learnings) commit staged from a verify worktree carrying stale version-slot files silently reverts a landed release bump; version-slots.test.mjs passes it because the test checks lock-step, not monotonic increase"
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
  promoted: dev/2026-07-22-cli-main-guard-normalization@phase-2
  slug: gate2-commit-from-stale-verify-worktree-can-revert-a-release-bump
  phase: "war-campaign-resilience-roadmap plan 8 (cli-main-guard-normalization) — Lead-caught during plan-8 phase-2 setup, 2026-07-23"
  keywords: 
    - Gate-2 promotion commit
    - stale verify worktree
    - version slot regression
    - release bump reverted
    - version-slots lock-step not monotonic
    - git add picks up stale tracked files
    - stacked PR version conflict
    - plugin.json marketplace.json README Status
    - lock-step invariant blind to downgrade
    - restore release on predecessor tip then merge into successor
  tags: 
    - release
    - version
    - gate-2
    - campaign
  originSessionId: 8e99f0a3-aecc-4068-9cd8-79868840feb7
  modified: 2026-07-23T21:28:54.243Z
---

# A Gate-2 `docs(learnings)` commit from a stale verify worktree can silently revert a release bump

## What happened (code-verified — directly confirmed by `git show`/`git diff` against the campaign branches)

During the `run-resilience-and-hardening` campaign (stack-and-plow, ADR 0011), plan 7's phase-2
Release merge `1edd92d` correctly bumped all four version slots to `0.14.55`. The very next commit
on that branch — the phase-2 **Gate-2** promotion `cae15d3` (`docs(learnings): phase 2 …`) —
reverted `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json` (both `metadata.version`
and `plugins[0].version`), and the `README.md` `## Status` blurb back to plan 6's `0.14.54`
release. The Gate-2 commit was staged in a **verify worktree** whose tracked version-slot files
still held `0.14.54` (a prior `git checkout <older-sha>` had left them stale); a broad `git add`
during the learnings commit picked up those stale files alongside the intended
`docs/learnings/*.md` edits.

Because plan 8 was cut from plan 7's tip, the whole plan-8 stack inherited the reverted version,
and plan 7's open PR head showed `0.14.54` + plan 6's blurb — its `0.14.55` release effectively
erased.

## Why the guard missed it

`skills/war/assets/version-slots.test.mjs` locks the four release slots **in lock-step** — it
asserts they all carry the *same* version, fail-closed. It does **not** assert the version
**increased** over any base. A wholesale revert that moves all four slots down together (here
`0.14.55` → `0.14.54`) keeps them consistent, so the lock-step invariant still holds and the test
stays green. Lock-step ≠ monotonic.

## Detection (the check that would have caught it at land)

At each phase-close / stacked-PR boundary, read the four version slots at the **branch tip** and
compare against the expected next-free-patch above the landed predecessor. A tip reading a version
**≤ a landed predecessor's** is a regression, even when all four slots agree. `git show
<tip>:.claude-plugin/plugin.json` is the one-line probe; do it as part of verifying a Release
phase's End state, not only the lock-step test.

## Fix pattern (when a successor stack was already cut from the bad tip)

1. Restore the correct version on the **affected branch** — extract the good slot files from the
   release merge (`git show <release-merge>:<file> > <file>`) and commit on that branch. This
   corrects its own PR.
2. If a successor branch was cut from the bad tip, make the successor **contain** the fix: merge
   the corrected predecessor tip into the successor (a stack-sync merge of the immediate
   predecessor — not a merge of master, so ADR 0011 is intact). Because the successor never touched
   the version slots, the merge is conflict-free and its own later Release bump then descends from
   the restored version and merges cleanly when the stacked PR lands.

## Prevention

Never stage a Gate-2 learnings commit with a blanket `git add -A` / `git add .` in a worktree that
has been `git checkout`-ed across versions — stage the explicit `docs/learnings/<slug>.md` paths
only. Relatedly, a verify/publication worktree reused across phases is exactly the
[[servitor-verify-on-write-worktree-can-lag-just-landed-phase]] hazard applied to the version
files: its tracked tree can lag the branch you think you are on.

Related: [[stacked-per-branch-releases-make-main-lag-cumulative]],
[[stacked-release-plan-version-literal-lags-operator-target]],
[[version-slots-no-cross-slot-consistency-test]].
