---
name: gate2-commit-from-stale-verify-worktree-can-revert-a-release-bump
description: "MITIGATED (#1083): a Gate-2 commit from a stale verify worktree can silently revert a release…"
metadata:
  node_type: memory
  type: project
  provenance: code-verified
  promoted: dev/2026-07-22-cli-main-guard-normalization@phase-2
  slug: gate2-commit-from-stale-verify-worktree-can-revert-a-release-bump
  phase: "war-campaign-resilience-roadmap plan 8 (cli-main-guard-normalization) — Lead-caught during plan-8 phase-2 setup, 2026-07-23; MITIGATED gate-evidence-and-release-integrity/phase-1 task 1.4 (#1083, landed dev/2026-07-24-gate-evidence-and-release-integrity, 2026-07-26)"
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
    - monotonic floor
    - pre-push staged-file check
    - publication-worktree dirty-reuse refusal
    - EX_WRONG_BRANCH
  tags:
    - release
    - version
    - gate-2
    - campaign
  originSessionId: 8e99f0a3-aecc-4068-9cd8-79868840feb7
  modified: 2026-07-26T22:55:35.620Z
---

# A Gate-2 `docs(learnings)` commit from a stale verify worktree can silently revert a release bump

## What happened (code-verified by `git show`/`git diff` on the campaign branches)

In the `run-resilience-and-hardening` campaign (stack-and-plow, ADR 0011), plan 7's phase-2 Release
merge `1edd92d` bumped all four version slots to `0.14.55`. The next commit, the Gate-2 promotion
`cae15d3` (`docs(learnings): phase 2 …`), reverted all four slots and the `README.md` `## Status`
blurb to plan 6's `0.14.54`. It was staged in a reused verify worktree whose tracked slot files still
held `0.14.54`. Plan 8 was cut from plan 7's tip, so the whole plan-8 stack inherited the revert.

## Why the guard missed it

`skills/war/assets/version-slots.test.mjs` then checked only lock-step (all slots equal), not that
the version increased. An all-four-slots downgrade stays consistent, so the test stayed green.
Lock-step ≠ monotonic.

## Detection

At each phase-close or stacked-PR boundary, read the slots at the branch tip
(`git show <tip>:.claude-plugin/plugin.json`). A tip version ≤ a landed predecessor's is a
regression, even when all four slots agree.

## Fix pattern (a successor stack was already cut from the bad tip)

1. On the affected branch, restore the slot files from the release merge
   (`git show <release-merge>:<file> > <file>`) and commit.
2. Merge the corrected predecessor tip into the successor (a stack-sync merge of the immediate
   predecessor, not of master, so ADR 0011 holds). The successor never touched the slots, so the
   merge is conflict-free.

## Prevention

Staging only explicit `docs/learnings/<slug>.md` paths is not enough. A worktree reused across
phases keeps old tracked files after a land moves the ref underneath it, and the Gate-2 commit then
records them as a downgrade with no blanket `git add`. Run Gate-2 from a freshly checked-out
worktree at the true landed tip. This is the
[[servitor-verify-on-write-worktree-can-lag-just-landed-phase]] hazard applied to version files.

## Mitigation (#1083 and `gate2-publication-guard`) — three layers

1. **Monotonic floor.** The `version slots: the tip never moves backwards (lock-step ≠ monotonic)`
   test in `version-slots.test.mjs` reds a coherent downgrade against a bounded first-parent window.
2. **Pre-push staged-file check.** The `Pre-push staged-file check` bullet in
   `skills/war/references/learnings-publication.md` condemns any unpushed commit whose file set
   escapes the promotion destination or `CLAUDE.md`. Locked by `D22_ORDERED_SPAN` in
   `skills/war/assets/skill-doc-contracts.test.mjs`.
3. **Dirty-reuse refusal.** `cmd_ensure_publication_worktree` in
   `skills/war/assets/provision-worktrees.sh` refuses a dirty reuse with `$EX_WRONG_BRANCH`.

Related: [[stacked-per-branch-releases-make-main-lag-cumulative]],
[[stacked-release-plan-version-literal-lags-operator-target]],
[[version-slots-no-cross-slot-consistency-test]],
[[gate-audit-end-state-owned-by-downstream-dep-task-is-non-holding-upstream]],
[[gate-artifact-never-includes-war-memory-lint]] — sibling #1082/#1081 closures landed in the same
gate-evidence-and-release-integrity phase 1.

> archived 2026-11-10: resolved — moved to archive
