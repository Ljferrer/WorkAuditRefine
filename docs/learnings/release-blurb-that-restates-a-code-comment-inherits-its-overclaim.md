---
name: release-blurb-that-restates-a-code-comment-inherits-its-overclaim
description: "A release blurb that restates a code header comment copies its imprecision, and fixing both can stale an earlier task's gate pin"
metadata:
  node_type: memory
  type: project
  keywords:
    - release blurb
    - CHANGELOG head entry
    - README Status twin
    - universal quantifier
    - header comment lag
    - gate pin STALE-MISMATCH
    - release task ace
    - absorb eligibility
  provenance: agent-unverified
  slug: release-blurb-that-restates-a-code-comment-inherits-its-overclaim
  phase: 2026-10-20-rea-artifact-evidence/phase-8 task 8.2
  tags:
    - war
    - release
    - docs
    - audit
    - prose-precision
  created: 2026-10-26
  originSessionId: 18c261f6-f7c5-4bb3-8473-a40e81fb5346
  modified: 2026-10-26T21:26:35.260Z
---

# Check the code, not the comment, before a release blurb states what a mechanism does

**Status of this note.** The audit findings below were resolved in two ace rounds before land. This is the generic pattern, not a live instance. The facts come from the phase-8 audit log. I read the landed CHANGELOG and hook at tip c01f2b9022b2 only to confirm the corrected wording is present.

**What the log shows (task 8.2, a release-refresh task).**
- Round 1: the head blurb said a directory operand "is walked ... only under `git diff --no-index`, or when git itself implies it". The code also walks a directory that lies outside the base's work tree, even with no `--no-index` token. The word "only" was stricter than the code. The code touched more worktrees, which is the safe direction, so the harm was a false claim, not a hole.
- Round 2: the blurb said a SIGTERM before the deadline "reads as a git error". One caller maps it to a git error, but the other maps it to an `unreadable` blob, which surfaces as a content mismatch. The hook's own header comment said the same thing as the blurb. The blurb copied the comment's imprecision.
- Both findings were `Nit` with `disposition: absorb`. Two ace commits fixed the CHANGELOG head blurb, its README Status twin and the hook comment, and the task approved. See [[release-slot-files-exempt-from-in-run-ace-and-sweep-machinery]] for why prose in these files is absorb-eligible.

**Side effect on an earlier task.** The second ace commit edited a comment in a hook file that the slice did not name for 8.2. The file belonged to task 8.1. The gate-audit for 8.1 had stamped its pin at the commit before 8.2 merged. It then saw an integration tip that already held 8.2's commits and reported STALE-MISMATCH, which downgrades execution evidence to SOFT. The auditor closed it by diffing that one file across the two SHAs (three comment lines), by reading `tip_sha` and `exit_code: 0` in the captured gate log, and by matching the required row labels in that log. The phase-level gate-audit at the integrated tip approved as authoritative. That commit's `Ace-Subset` trailer named only `CHANGELOG.md`, though the commit also changed `README.md` and the hook.

**Rules.**
1. When a blurb restates a code comment, read the code. If the comment is wrong, fix the comment and the blurb in one commit.
2. A universal word (`only`, `always`, `never`, `no`) on a branchy mechanism needs each branch listed first. Compare [[release-blurb-overstates-guard-semantics]] and [[release-blurb-headline-count-word-can-mismatch-its-own-enumeration]].
3. A release task's ace edit to a file another task owns is safe when it is comment-only, but it stales that task's gate pin. Expect a SOFT downgrade and a diff-across-pins check, not a hold.
