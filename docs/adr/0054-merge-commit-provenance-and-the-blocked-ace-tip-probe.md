# Merge-commit provenance and the blocked-ace tip probe

**Status:** accepted (ratified by
[the plan](../plans/2026-10-28-blocked-ace-and-merge-provenance.md), decisions D2 to D5, D8 to D12,
D15 and D22; research record: issue #2485 and its RCA study,
`docs/studies/2026-10-28-issue-2485-rca/README.md` on the research branch)

A WAR run held five approved tasks across three field runs. In each, an ace worker committed after
approval, then returned `status: blocked`. The engine read a blocked ace as "no commit". The new commit
was neither reverted nor audited. At the merge slot `verifyPinTransfer` found the approved tree
different from the content tree, retried `roundLimit` times on that fixed fact, and escalated. The
sanctioned recovery relaunch then proved none of nine merged tasks, because `task-integrated.sh` read a
git-parsed `WAR-Task` trailer on worker commits, and those trailers sat in a non-final paragraph, were
absent from ace commits, or the tip was an engine revert with none. A third fault ran a gate on a tree
its provision steps had not seen: after a pin-transfer rebase, after a dep-wave worker's first-act rebase
and at the `_refinery` base re-run.

The decision passes the ADR triad. It is hard to reverse, because every later run's history carries a
merge commit per task. It is surprising without context, because the doctrine stated fast-forward task
merges as truth at seven surfaces. It is a genuine trade-off, recorded below.

## Decision

**The engine reads the branch tip from git after every ace dispatch and judges or reverts what it finds.
A task merge is a `--no-ff` merge commit that carries the trailer, and every proof of a merged task reads
that commit. Provision re-runs before any gate when the tree changed. A recovery relaunch runs from the
launch's own plugin root and version.** Five parts follow.

### 1. The tip probe (D2, D3, D4, D5)

- **One read-only refiner dispatch after every ace result, dead or not**, at all four sites: polish,
  subset, re-entry and terminal. The probe returns the tip sha, the tip tree, the commit count from the
  pre-dispatch tip, ancestry, and the name-only file list. The engine never reads the worker's `head_sha`
  or `ace_diff_files` as the source (PIN-2).
- **Classification is by tree, not by the worker's status word.** A tip tree equal to the approved tree,
  or an unchanged tip, takes the failed-absorb arm: no charge, no aced record. A descendant tip with a net
  change is an implemented ace: charge, `chainRecordFix`, re-audit at the probed tip. The full panel runs
  only when the commit count exceeds one.
- **A red gate or a regression on a multi-commit move forward-reverts the whole range** and routes the
  rows to the sweep. No bisection runs on it (D4).
- **A dead or unusable probe forward-reverts `approved..HEAD` to the last approved tree and lands. It
  never holds.** The ace path never turns a mergeable task into a hold (ADR 0012, ADR 0013). Two
  residuals are the only exceptions (D5). A tip that does not descend from the pre-dispatch tip has an
  undefined range, so it ends in the one merge-slot hold with the note "branch tip carries content
  committed after approval" and the `detail` payload. A revert-bearing pin-transfer probe that itself dies
  ends in the existing soft `env-died` merge death, as today. No branch is reset or force-moved to escape
  either residual.
- The `verifyPinTransfer` tree clause is never relaxed or bypassed (PIN-25). It is the only guard against
  merging a commit no panel judged. A well-formed proof that fails only that clause makes one attempt and
  escalates with reason `escalate` and a distinct `auditLog` verdict. `HARD_ESCALATION_REASONS` and
  `KNOWN_LAND_DECISIONS` do not change.

### 2. Merge-commit provenance (D8, D9, D10, D11, D12)

- **Each rebased task merges with `git merge --no-ff --no-commit`, then `git commit --trailer "WAR-Task:
  <task branch>"`.** Polish and terminal merges stay fast-forward. `task-integrated.sh` proves ownership
  from the first-parent merge commit whose trailer names the task and whose second parent equals the task
  tip. Worker commits need no trailer, so untrailered floor-fix, ace and revert commits prove through it.
- **The confirmation predicate is one rule at three sites.** `mergeGitMatches`, `confirmMerge` and
  `reconcileMerge` require parents equal to [snapshot base, source tip], the base an ancestor of the
  source, the merge tree equal to the source tree, and the exact trailer. Detecting an existing merge
  commit is latitude. Acceptance goes only through the predicate. An evil merge, an unrebased merge and an
  inexact trailer are refused.
- **No target-repo hook runs on, or alters, an engine-made commit.** The merge, commit and revert steps run
  under `-c core.hooksPath=/dev/null`. `--no-verify` alone is not enough, because it still runs
  `prepare-commit-msg` and `post-commit`.
- **A task branch whose tip is an ancestor of the integration tip is never rebased, moved or re-merged.**
  The refiner reports it merged. A repeated reconcile on an existing merge commit whose second parent
  equals the task tip reports merged and makes no second merge (PIN-11).
- **`MergeResult` gains `gate_sha`, the gated rebased tip.** `landMerged` reads `gateHeadSha` from it.
  `integration_sha` is the merge commit. The handoff `tipSha` fallback reads `lastLandedTip`. The two
  `already_upstream` derive-and-skip sites keep `pinProof.head_sha`.

### 3. The provision floor (D15)

Before any gate the refiner runs, and before the dep-wave worker's gate, `run.provision` re-runs when
`HEAD^{tree}` differs from the tree the steps last ran on. The sites are each merge step (a) copy, the
ace-gate check, the `_refinery` base re-run, the polish-sweep and terminal-pass merge gates, the
integrated-tip full-gate re-run, the end-state check dispatch and the three land gates. Every provision
run writes one `provision_tree: <sha>` line into the worktree's `.war/` directory, and the gate-log
preamble repeats it. `_refinery` is provisioned once per phase after the topology barrier. The tree
comparison is the only trigger. Steps run verbatim, in order, stop at the first failure and keep the
worktree. A failure rides `MergeResult.provision` and routes through `provisionStep`'s evidence gate to
the soft env-blocked escalation (ADR 0021). `MergeResult.status` is not widened.

### 4. The launch rule (D22)

A run executes from the plugin root and version it was launched with. A recovery relaunch executes from
the same plugin root and version as the launch it recovers. The run manifest stamps `pluginRoot`,
`pluginVersion` and `pluginSha` at run start. This plan's own run executes from the installed 0.21.19
plugin on the old engine, so the Lead posts the root and version in each phase report until the manifest
fields exist.

### 5. The retired fast-forward premise

The old doctrine held that every task merge fast-forwards the integration branch. Three things followed
from it, and this ADR retires all three. Ownership was proved from a worker-written `WAR-Task` trailer on
a task commit. The `ff-topology` red-team lens treated a fast-forward-only anchor as valid. Prompt
sentences accepted the source branch's fast-forward as the merge proof. A fast-forward leaves no commit
the engine owns, so nothing the engine controls could carry the trailer. The merge commit is that commit.

## Considered options

- **Keep fast-forward merges and repair the trailer on the worker side (rejected).** The only repair after
  a push is a force push, which the worker card forbids. Seven workers with the same layout returned
  `implemented` and merged, so the layout is not under the engine's control.
- **A refiner-side stamp with `rebase --exec` and a message-only amend (rejected).** A trial showed it
  works, but it changes every commit sha on the task branch. A pushed branch and its recorded `head_sha`
  then disagree with the stamped history.
- **Relax the tree clause so a moved tip merges (rejected).** It would merge a commit no panel judged.
- **Bisect a multi-commit blocked move (rejected).** The range has no per-commit approval to bisect
  against. One forward-revert of the range returns to the last approved tree.
- **Hold when the probe is dead (rejected).** It repeats the original fault, a hold on a mergeable task.
  The forward-revert is safe because the tree it restores is the last approved tree.

## Consequences

- **The trade-off: one merge commit per task, against worker-side trailer repair that cannot survive a
  push.** History gains a merge commit per task and `--first-parent` becomes the per-task view. In return,
  ownership is engine-written, parent-checked and independent of what a worker commits.
- A task whose commits net to zero still proves, because the merge commit is the proof.
- Every later run's history carries per-task merge commits. Reverting this ADR means a second migration of
  every proof surface.
- The `ff-topology` lens, the glossary `topology-void` entry and the recovery references follow the
  merge-commit topology (plan Tasks 5.1 and 5.3). One grep guard holds the old text absent and the new
  text present, surface by surface (plan Task 5.4).
- Deferred backstop: the engine cannot revert an undefined range. The non-descendant tip and the dead
  revert-bearing probe are proven by fixture, not by field frequency. The Lead records both counts in the
  phase report.

## Relationship to other ADRs

- **Amends [ADR 0035](0035-partial-phase-recovery-adoption-not-deletion.md)** item 2 in place: the merged
  set is derived from the first-parent merge commit.
- **Amends [ADR 0008](0008-git-is-the-resume-source-of-truth.md)** recovery auto-skip proof to the same
  merge-commit rule.
- **Extends [ADR 0021](0021-run-lifecycle-provision-contract.md)**: a merge-time provision re-run is a
  fourth place the refiner runs provision steps.
- **Names two residuals** in [ADR 0013](0013-commanders-intent-and-disposition-routing.md) and
  [ADR 0049](0049-pin-transfer-and-proportional-re-audit.md) as the only exceptions to never-hold.
- **Leaves [ADR 0005](0005-dead-phase-halts-the-dag.md) untouched**: no enum or status change.
- [ADR 0042](0042-prompt-surface-budgets.md): the new card doctrine lands in
  `skills/war/references/merge-provenance.md` behind a trigger pointer.
