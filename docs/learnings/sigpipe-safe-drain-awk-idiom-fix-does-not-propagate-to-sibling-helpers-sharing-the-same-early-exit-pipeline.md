---
name: sigpipe-safe-drain-awk-idiom-fix-does-not-propagate-to-sibling-helpers-sharing-the-same-early-exit-pipeline
description: "Fixing one SIGPIPE-fragile `cmd | grep -Fxq` pipeline under `set -o pipefail` (converting it to a draining awk idiom — a flag var + END-block exit, no early return) does not fix a sibling helper built on the identical `git ... | grep -Fxq` shape reading the same corpus; under pipefail a large-enough output makes grep's early exit SIGPIPE the upstream git, the pipeline returns 141, and an `if helper; then` caller reads that as a false negative rather than a git error — multiple auditor seats independently re-flagged the same untouched sibling across a phase without it being fixed, since it sits outside the plan's swept scope."
metadata: 
  node_type: memory
  type: project
  keywords: 
    - SIGPIPE
    - pipefail
    - grep -Fxq early exit
    - draining awk idiom
    - branch_checked_out_anywhere
    - branch_holder_path
    - false negative
    - git worktree list --porcelain
  provenance: code-verified
  slug: sigpipe-safe-drain-awk-idiom-fix-does-not-propagate-to-sibling-helpers-sharing-the-same-early-exit-pipeline
  phase: "2026-08-25-engine-reliability-and-filing-fidelity/phase-8 task 8.1 (#1476 gap 3)"
  tags: 
    - shell-scripts
    - plan-code-mismatch
    - test-coverage
  created: 2026-08-26
  originSessionId: c878d5da-ed5a-4614-8006-47e692e60042
  modified: 2026-08-27T02:42:47.912Z
---

Phase 8 Task 1 fixed a real SIGPIPE misclassification (#1476 gap 3) in
`skills/war/assets/provision-worktrees.sh`'s `reuse_hygiene_one` classification reads by
replacing an early-exit `printf | grep -Fxq` loop with a single draining awk pass, and the
sibling helper `branch_holder_path` (added the same task, #1712 fix 1) is written with the
same safe idiom from the start — its own header comment explicitly says the awk "drains its
whole input (flag + END print, no early exit) so git never takes a SIGPIPE under pipefail."

Confirmed live at the landed tip `31ac70a72b09231cbfab3a106d28afdc29442a4f` (read via the
`_refinery` worktree whose `gitdir` physical path names this plan's slug, HEAD == the
confirmed tip): the immediate sibling `branch_checked_out_anywhere` (`skills/war/assets/
provision-worktrees.sh` line 157-159) still reads
`git worktree list --porcelain 2>/dev/null | grep -Fxq -- "branch refs/heads/$1"` — the exact
early-exit shape the file's own new comment warns against, over the same corpus
(`git worktree list --porcelain`) the safe sibling reads. Under the file's `set -euo
pipefail`, once the porcelain output exceeds the pipe buffer (~64KB — several hundred
registered worktrees at this repo's path lengths) `grep`'s first-match exit can SIGPIPE `git`,
the pipeline returns 141, and `if branch_checked_out_anywhere "$branch"; then` reads that as
"not checked out anywhere" — a false negative on exactly the guard this helper exists to
serve (skip a follower fast-forward / stale-branch reuse when the branch is live elsewhere).

Practically unreachable at today's typical worktree counts, and outside the task's slice (the
gap-3 fix is scoped to the `reuse_hygiene_one` classification reads only) — so correctly left
unfixed and recorded rather than force-fixed. Flagged as a `note`-disposition finding by at
least three separate auditor passes across this one phase (task 8.1's initial audit, its
gate-audit "correctness (deep)" seat, and again post-polish) without ever being absorbed,
which is itself the signal worth recording:

**Pattern:** landing a SIGPIPE-safe drain idiom fix at one call site does not retrofit any
sibling helper built on the identical fragile `cmd | grep -Fxq` (or similar early-exit
pipeline) shape reading the same corpus, even when the fix's own comment calls out the
hazard by name right next to the untouched sibling. Grep for other `| grep -Fxq` /
`| head -1` / similarly early-exiting pipeline consumers of the SAME upstream command before
considering a SIGPIPE-classification fix complete — a fix's justifying comment describing the
general hazard does not mean every instance of it in the file was swept.
