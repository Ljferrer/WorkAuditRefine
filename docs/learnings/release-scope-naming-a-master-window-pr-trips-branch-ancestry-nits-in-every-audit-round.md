---
name: release-scope-naming-a-master-window-pr-trips-branch-ancestry-nits-in-every-audit-round
description: A Release scope that names a master-window PR draws a branch-ancestry Nit in every audit round
metadata:
  node_type: memory
  type: project
  keywords:
    - release scope
    - master window
    - PR in window
    - branch ancestry
    - git branch --contains
    - first-parent window
    - dev branch
    - bucketed whole
  provenance: code-verified
  slug: release-scope-naming-a-master-window-pr-trips-branch-ancestry-nits-in-every-audit-round
  phase: "2026-10-26-interview-fork-trials-and-pair-beats/phase-2 (Release, task 2.1)"
  tags:
    - war
    - release
    - audit
    - docs
    - git
  created: 2026-10-26
  originSessionId: a0630eb5-4cbe-4285-9e36-47dec6a15717
  modified: 2026-10-27T03:53:50.633Z
---

# A master-window PR in the Release scope is flagged against the dev branch every round

**The construct.** The 0.21.18 `Release scope:` paragraph says the window runs "from the 0.21.17 `master` head (`76a8b6fb`, PR #2411 merged) to this release, bucketed whole". It then lists "the fingerprint hook follow-up plan with its report (PR #2443, planning only, no code)". PR #2443 merged to `master` after the dev branch was cut. The sentence is master-relative.

**Verified at the landed tip.** The paragraph is present in `README.md` `## Status` and in `CHANGELOG.md` `## 0.21.18`. The plan file that PR added, `docs/plans/2026-10-26-fingerprint-hook-followups.md`, is absent from the tip. `docs/plans/` holds only this plan's own file for 2026-10-26. Grounded via the run-scoped `_refinery` worktree (rung 2, `<repo-root>/.claude/war-worktrees/<run-id>/_refinery`).

**What it cost.** Three audit seats filed the same Nit across three pins: two correctness passes and one plan-faithfulness pass. Each ran `git diff --stat` or `git branch -a --contains` and found the PR outside the branch ancestry. Each then reached the same verdict: true on `master`'s first-parent history once the release merges after the PR, so defensible, no fix, `disposition: note`. The audit-log entries for the audited pins report the ancestry results; I did not re-run git.

**Precedent.** The 0.21.17 entry used the same master-relative reading: "the red-team report landed on `master` before this window". Both entries bucket the window whole by design.

**How to apply.**
1. When a Release scope lists a PR that merged to `master` while the dev branch was in flight, say so in the sentence: "on `master`, merged before this release, not on the dev branch".
2. An auditor who sees such a PR missing from `git branch --contains` should check the `master` first-parent window before filing. A `note` Nit is the ceiling.
3. Do not add the PR's files to the dev branch to satisfy the check. The release merge brings them.

Related: [[stacked-per-branch-releases-make-main-lag-cumulative]] (the unbumped-predecessor gap behind master-window scoping) and [[bounded-window-measurement-comment-self-invalidates-when-its-own-release-commit-lands]].
