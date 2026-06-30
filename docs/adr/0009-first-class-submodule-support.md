# First-class submodule support via repo-per-phase

**Status:** accepted (design ratified; implementation deferred until the M1→L3 stack lands — see the spec)

WAR is built single-repo: a task gets one worktree, one branch, one integration branch; the refiner owns shared git
state in *the* repo (singular); the auditor reviews `git diff <integration>...<branch>` in that one repo. A git
submodule is a nested, independent repo — the superproject records only a commit SHA (the gitlink), never the
submodule's contents. So a plan that needs a change *inside* a submodule (the originating case: a new file in the
`PyUtils` submodule of `AutoIndex`, then a pin bump every later task depends on) cannot be produced, audited, or
landed by WAR as built: the worker can report success having committed nothing auditable, the auditor reviews an
empty/gitlink-only diff and approves code it never saw, and the refiner can push a pin to a commit nobody else can
resolve. The only submodule awareness anywhere is provision-time `git submodule update --init --recursive` — a
**read-side** convenience. A future reader will ask why WAR — emphatically single-repo everywhere else — grows a
notion of a *second* repo a phase can land into. This records why, and the shape chosen. Full mechanics:
[the design spec](../specs/2026-06-29-submodule-support-design.md).

## Decision

**A submodule change is first-class, modeled as work in a separate repo that a phase targets — not as an edit to a
sub-area of the superproject worktree.** Five sub-decisions:

1. **Tasks and phases are repo-scoped.** A task carries a `target repo` (default: the superproject); it targets
   **exactly one** repo. A phase likewise targets one repo (**repo-per-phase**). Cross-repo work is a **phase→phase**
   edge in the existing DAG, never a mix inside one phase.
2. **A submodule edit and its pin bump are two tasks.** A **submodule task** lands in the submodule repo; a
   **gitlink-bump task** (a trivial superproject worker) advances the pin and **depends on** the submodule task's
   landed SHA, read from the ledger. The cross-repo SHA dependency is thereby an explicit graph edge, not hidden in
   a task body.
3. **Submodule-as-repo topology.** For the duration of its phase a submodule is driven as a standalone repo by the
   existing cwd-scoped toolchain (`provision-worktrees.sh` resolves the target repo from cwd; `ensure-integration`
   already takes a base) run from the initialized submodule checkout: its own integration branch, task worktrees,
   provision list, and gate, all in the nested repo. The auditor diffs **inside** it — so the auditor-blindness
   failure structurally cannot occur on a submodule task (there is no gitlink in that diff).
4. **A `pin-validity` auditor lens.** A gitlink-only diff is valid **only** on a declared gitlink-bump task, and only
   if the new SHA is reachable on the submodule remote and equals the dep's landed SHA. The remote ref need not be
   the default branch (a submodule pinned to a feature branch is legitimate). A gitlink move anywhere else is a hard
   refuse.
5. **The guard has two modes → two increments.** Increment 1 ships the guard in **refuse-all** mode (any submodule
   touch is refused: auditor rejects gitlink-only diffs, worker blocks a submodule-path target, refiner refuses an
   unresolvable pin) — a fail-closed correctness fix with value today, a no-op on submodule-free repos. Increment 2
   **relaxes** it to **refuse-undeclared, route-declared** and adds the machinery. The fail-closed net survives the
   relax: anything off the explicit first-class path is still refused.

## Considered options

- **Guard only — refuse submodule changes forever (rejected as insufficient for the stated need).** The cheapest
  honest option: detect a `.gitmodules`-path target and refuse with a clear error. It fixes the silent rubber-stamp
  and keeps WAR single-repo. Rejected as the *endpoint* because the operator is repeatedly hitting plans that must
  edit a submodule in one run — but **kept as increment 1**, because the relaxed feature is safest built on top of an
  already-proven refuse-by-default floor.
- **Mixed-repo phases with a mid-phase cross-repo barrier (rejected).** Let one phase edit the submodule, bump the
  pin, and consume the result, landing into two working branches with an internal ordering and a mid-phase freeze. It
  is more flexible but invents a brand-new land/resume path. The serialization (submodule SHA → pin bump → consume)
  is **intrinsic**, so repo-per-phase pays for it at a boundary the dependency already required, while reusing the
  entire phase machinery (ordering, land, hold, ledger, resume) unchanged.
- **One task owning both the edit and the bump (rejected).** Atomic-feeling, but a single task spanning two repos
  breaks every "one worktree / branch / integration branch per task" invariant at once, and forces one auditor to
  review two incommensurable diffs (real code + a one-line gitlink move) against two baselines.
- **Editing the in-place gitlink working tree, 6-B (rejected).** Work inside `<superproject-worktree>/<submodule>`.
  It sits on a detached HEAD at the pin, confuses the `.war-task` scope hook with a repo nested in a worktree, and
  entangles the gate context — more work *and* messier than treating the submodule as its own repo.

## Consequences

- **`Git-topology owner` now spans the phase's target repo.** The CONTEXT.md term is evolved: the refiner owns shared
  git state in *whatever repo the phase targets*, including a submodule repo's integration branch and its land. The
  Container/Contents boundary is preserved — the bump is a *worker* commit (contents), not a refiner-authored one.
- **The feature stacks on the in-flight audit-remediation stack.** It extends M1's `KNOWN_LAND_DECISIONS` (the new
  `held:submodule-pr` must be admitted or M1's fail-closed classifier rewrites it to `held:workflow-error`), M2's
  `HARD_ESCALATION_REASONS` cascade + `MERGE_RESULT.status` + refiner merge-task step + Task shape + decompose, L2's
  resume-precedence model (the submodule remote becomes a co-source-of-truth — see ADR-0010), and L3's
  `blockedReason` dispatch predicate. M3 is independent. Build on L3's landed tip.
- **Determination is explicit, never inferred.** The decompose/`war-room` overlap check *proposes* the `target repo`
  classification; the human approves; the tag is durable on the sub-issue + ledger; every guard validates against it.
  This matches WAR's "stop and escalate instead of guessing" posture (applied again to base-branch resolution).
- **One new helper, otherwise prose + reuse.** A `submodulePaths(repoDir)` parser of `.gitmodules` (~10 lines + a
  self-check) feeds the overlap check; everything else reuses the cwd-scoped provision/worktree/land toolchain and
  the existing auditor/worker/refiner contracts pointed at a different repo.

## References

- Design spec: [`docs/specs/2026-06-29-submodule-support-design.md`](../specs/2026-06-29-submodule-support-design.md)
  — the seven-fork design tree, the two increments, mechanics, the four M1→L3 integration points, validation criteria.
- [ADR-0010 — Submodule landing authority](0010-submodule-landing-authority.md) — the paired decision: who creates
  the submodule's merge commit, and the `held:submodule-pr` lifecycle.
- [ADR-0001](0001-explicitly-managed-worktrees.md) / [ADR-0004](0004-refinery-merges-in-a-worktree.md) — the
  worktree/refinery model the submodule-as-repo topology reuses.
- [ADR-0005](0005-dead-phase-halts-the-dag.md) / [ADR-0008](0008-git-is-the-resume-source-of-truth.md) — the
  landDecision and resume-precedence machinery this feature extends.
