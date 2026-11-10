# Polish claims and the net-zero clash range

**Status:** accepted (2026-11-10; plan 2026-11-08-engine-findings-ace-and-late-fix, D19 and D22,
PIN-19, PIN-20 and PIN-23; issue #2578)

## Context

ADVISORY POLISH runs per task, beside the task's wave peers. The operator ruling on PR #2577 kept a
polish worker's sibling fixes to its task's own files and the listed rows' files, and it parked every
other sibling under `Ignore for now:` for a ruling. Field runs showed real sibling sites in files that
no wave task owned, and the operator ruled the claim rule on #2578: a task may claim a file outside its
set if no other task in its wave claims it; first commit wins; later clashing rows go to the
phase-close sweep queue; not for zero-in.

The replay hazard sits at the merge slot. A clashing polish commit is forward-reverted by the engine
range revert of ADR 0054, so the task branch ends with the clash commit and its revert. The pin-transfer
probe then rebases the whole branch onto an integration tip that already holds the claimant's fix. When
the two commits edit one line differently, the replayed clash commit conflicts and the approved task
holds. When they make the identical edit, git drops the clash commit as already upstream, the revert
applies cleanly, and the rebase exits 0 with the claimant's line removed.

## Decision

**The polish claim rule.** The engine reads each polish return's git-derived tip-probe file list, in
return order. The first same-wave polish commit to touch a file that no task of the wave lists, and
that no fence names, claims that file for the wave: first commit wins. A later polish commit that
touches a claimed file or a file a wave peer lists is forward-reverted as before. It is not re-audited,
and its rows go to the phase-close sweep queue. Later peers see each claimed file in their
`FIX-ROUND FENCE` line. A claim ends when the claimant's own commit is reverted: a range revert that
undoes a claiming commit no panel approved. An approved claiming commit keeps its claim for the wave,
even after a later ace commit moves the approved sha. `POLISH_FILES_CLAUSE` states the widened file limit.

**The net-zero clash range.** A clash records a claim-clash on the task, beside its registered range
revert. At the merge slot, only that task's pin-transfer prompt gains one step after its own
`FORWARD-REVERT` step. The step checks that the range after the approved sha is exactly the clash
commit and its revert, with `<tip>^{tree}` equal to `<approved>^{tree}`. When it is, the task branch
moves back to the approved sha (no content changes), so the rebase runs only through the approved sha
and the net-zero pair never replays. Any other range runs every step as written. The revert commit
exists only after the `FORWARD-REVERT` step, so the refiner checks the tree equality, never the engine.
A reverted claimant whose file a later peer claims takes the same step, because its own pair now
replays onto that peer's line. Every other task's dispatch is byte-unchanged.

**This qualifies ADR 0054's whole-range revert at the merge slot.** The whole range above the approved
sha is still reverted, and the revert is still the backstop. For a net-zero clash range, the merge
slot then rebases only through the approved sha instead of replaying the reverted range.

## Consequences

- A sibling fix in an unowned file lands in the run when its task wins the claim, instead of waiting
  for a ruling.
- A clashing row is never dropped: it reaches the phase-close sweep queue, which runs after every task
  merged.
- The claimant's line survives a clash, an identical edit and an integration tip that moved after the
  claimant merged. `workflow-template.git-4.test.mjs` replays all three in real git.
- No force-push and no `git reset --hard`: the branch move is a `checkout -B` on the task's own branch,
  guarded by the tree equality.
- `/zero-in` is excluded: its surfaces carry no polish prose and do not change (PIN-20).
- `refiner-recovery.md` § Pin-transfer arms is the standing home of the merge-slot step. The refiner
  card names it inside its step-4 pointer, funded by an ADR 0042 eviction of the card's
  `## File-followups dispatch` descriptive clause into `refiner-recovery.md` § File-followups filing.

## Decision log

- 2026-11-03 · operator ruling on #2578: the claim rule, first commit wins, clashing rows to the
  sweep, not for zero-in
- 2026-11-10 · Phase 5 red-team: the clash, the identical edit and the moved tip replayed in a sandbox;
  the ADR takes number 0061, the next free across the stack and origin/master
- 2026-11-10 · ADR authored with the engine change (T5.1) · plan 2026-11-08-engine-findings-ace-and-late-fix
