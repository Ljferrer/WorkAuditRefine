# Submodule landing authority — PR-and-hold by default, WAR-owned by opt-in

**Status:** accepted (design ratified; implementation deferred until the M1→L3 stack lands — see the spec)

Given that WAR can now produce and audit a change inside a submodule ([ADR-0009](0009-first-class-submodule-support.md)),
one question decides whether a phase runs straight through or has to pause: **when a submodule task is approved, who
creates the commit that ends up on the submodule's mainline — WAR, or someone outside the run?** A submodule like
`PyUtils` is a shared library with its own remote, its own review, its own CI, and consumers beyond the superproject
that triggered the run. Unilaterally pushing to its mainline from inside an `AutoIndex` run bypasses all of that.
And there is a sharp technical wrinkle: if the submodule repo **squash- or rebase-merges**, the branch-tip SHA a
worker created is *not* the SHA that lands on its mainline — so a pin bumped to the pre-merge tip dangles on squash.
A future reader will ask why WAR sometimes *pauses* a run waiting for a merge it did not perform, and why `--afk`
forces a choice at launch. This records why. Full mechanics:
[the design spec](../specs/2026-06-29-submodule-support-design.md).

## Decision

**PR-and-hold is the default landing authority for a submodule; direct WAR-owned landing is opt-in per submodule.**
Four sub-decisions:

1. **Default 2B — PR-and-hold.** WAR pushes the submodule task's *branch*, opens a **PR in the submodule repo**, and
   **holds** the phase (`held:submodule-pr`). It does **not** author the merge. The default because it respects the
   submodule repo's own review/CI and is squash/rebase-correct — only the actor that creates the merge commit knows
   the SHA the pin may safely reference.
2. **Opt-in 2A — WAR-owned submodule.** A submodule the operator **declares** in run config as WAR-owned is landed
   directly: WAR runs the submodule's own integration→working push-first CAS (the existing `land-advance` loop, cwd =
   submodule), authors the merge, knows the landed SHA immediately, and the dependent gitlink-bump task runs in the
   same DAG with no hold. For submodules this superproject solely controls; never the default.
3. **`held:submodule-pr` lifecycle + `gh` resume detection.** The hold halts like any other `held:*` (and always
   under `--afk`). It is cleared by a **human-triggered** resume that auto-detects the merge via
   `gh pr view <n> --json state,mergeCommit` against the submodule remote, taking **`mergeCommit.oid`** (squash-
   correct) as the phase's landed SHA, with an operator-supplied SHA as fallback. There is **no** background poller.
4. **AFK forces the choice at launch.** Because `--afk` removes the human who would merge a `held:submodule-pr`, an
   AFK run cannot clear that hold. So at launch WAR must confirm every touched submodule is WAR-owned (2A); an
   un-owned submodule under `--afk` is **refused up front**, never started and left to stall. (A submodule the run's
   `gh` cannot reach is likewise out of scope and flagged at `/red-team` — the reachability precondition.)

The **pin-validity** bar is deliberately looser than this landing policy: a gitlink may point at any SHA **reachable
on the submodule remote** (not necessarily a mainline merge), because a repo legitimately pins a submodule to a
feature branch. 2B's wait-for-merge is the default *production* policy; reachable-on-remote is the *audit* invariant.

## Considered options

- **2A by default — WAR owns every submodule's mainline (rejected).** Fully automated, no hold, and WAR controls the
  merge SHA so squash is a non-issue. Rejected because it unilaterally pushes to a shared library's mainline from
  inside an unrelated superproject run, bypassing that repo's review and CI — reckless for any widely-shared
  submodule. Kept only as the **declared opt-in** for submodules the superproject solely controls.
- **2B with the pin bumped to the pre-merge branch tip, no wait (rejected).** Avoids the hold entirely by pinning the
  pushed feature-branch tip. Rejected because a squash/rebase merge orphans that tip — reintroducing the dangling-pin
  failure ADR-0009 exists to prevent. The pin must reference the *merged* SHA, which only the merge author knows.
- **A background poller that resumes automatically when the PR merges (rejected, YAGNI).** Tempting for "fire and
  forget", but the resume trigger is naturally the human re-running `/war` *because* they just merged, and AFK never
  reaches the hold (it forced 2A). A watcher is speculative machinery for a state that, in practice, a human is
  already standing in front of.
- **Always require an operator-supplied merge SHA at resume (rejected as the default).** Simplest, no `gh` dependency
  — but it makes every resume manual even when `gh` can answer precisely (and squash-correctly via `mergeCommit.oid`).
  Kept as the **fallback** for a non-GitHub-reachable submodule.

## Consequences

- **A new hold outcome with cross-stack reach.** `held:submodule-pr` is a new `landDecision`; it must be admitted to
  M1's `KNOWN_LAND_DECISIONS` or M1's fail-closed classifier rewrites it to `held:workflow-error`. It is an
  *interactive* hold (it only arises in non-AFK 2B), halting for the human like `held:escalation`.
- **The submodule remote becomes a co-source-of-truth — extending ADR-0008.** L2's resume precedence reasons that
  git can only lag (never be wrong) because the superproject's CAS is monotonic; the same now holds for the submodule
  remote, and the reconciliation pre-flight extends to verify the gitlink SHA is reachable there. The ledger gains
  submodule PR/SHA fields (advisory, authoritative-when-reachable — the same rule as `merge_sha`).
- **A safety/automation trade-off made explicit.** The default keeps a human in the loop for a shared submodule's
  merge — slower, but it never lands on a shared mainline unreviewed and never pins a squash-orphaned SHA. The opt-in
  buys full automation only where the operator has accepted that authority.
- **Launch-time gating concentrates the questions.** Base-branch resolution, reachability, and AFK ownership are all
  resolved at war-room / launch (the last interactive moment), not discovered mid-run — consistent with WAR
  escalating ambiguity rather than guessing.

## References

- Design spec: [`docs/specs/2026-06-29-submodule-support-design.md`](../specs/2026-06-29-submodule-support-design.md)
  — Q2/Q5 forks, the `held:submodule-pr` lifecycle, the four M1→L3 integration points, validation criteria.
- [ADR-0009 — First-class submodule support via repo-per-phase](0009-first-class-submodule-support.md) — the paired
  structural decision this landing policy operates within.
- [ADR-0008 — Git is the resume source of truth](0008-git-is-the-resume-source-of-truth.md) — the resume-precedence
  model extended to make the submodule remote a co-source-of-truth.
- [ADR-0005 — Dead-phase halts the DAG](0005-dead-phase-halts-the-dag.md) — the `landDecision` / `KNOWN_LAND_DECISIONS`
  machinery `held:submodule-pr` must join.
