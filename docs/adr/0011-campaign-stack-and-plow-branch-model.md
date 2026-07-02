# Campaign stack-and-plow branch model — stacked PRs target the prior plan's branch, not master

**Status:** proposed (design ratified in the war-companion-skills grill; implementation pending — see the spec)

`/war-campaign` runs a **hopper**: one chat executing a [roadmap](../../CONTEXT.md) of plans back-to-back
(`/red-team <plan>` → `/war <plan> … --afk --ace`) overnight, unattended. The unattended part is the whole
point — so the campaign **cannot pause and wait for a human to merge** between plans. That forces a decision a
future reader will find surprising: **when plan N+1 needs plan N's code but nobody is awake to merge plan N's
PR, what does plan N+1 branch off, and where does its PR point?** The obvious answer (base every plan off
`origin/master`) silently breaks overnight, because master never advances while the human sleeps — so every
plan would build on the same stale tip and later plans wouldn't see earlier plans' work. This records why the
campaign instead **stacks**. Full mechanics: [the design spec](../specs/2026-07-01-war-companion-skills-design.md).

## Decision

**A campaign's default is stack-and-plow with stacked PR *targets*.** For a roadmap of plans 1..N in AFK mode:

1. **Base each plan on the prior plan's landed tip.** `dev/<plan-1>` is cut from a fresh `origin/master`;
   every later `dev/<plan-N>` is cut from `dev/<plan-(N-1)>`'s landed working tip. So plan N+1 sees plan N's
   code without any human merge — the campaign keeps *plowing*.
2. **Each PR targets the prior plan's branch, not master.** `PR_N: dev/<plan-N> → dev/<plan-(N-1)>`
   (`PR_1 → master`). Each PR's diff is therefore *only that plan's* changes, reviewed against its true base.
3. **The human merges bottom-up; deletion cascades.** Merging `PR_1` and **deleting** `dev/<plan-1>` makes
   GitHub auto-retarget `PR_2` to `master` (a merged branch's PRs retarget to its base). Repeat up the stack.
4. **`--wait-for-merge` selects the linear alternative (Mode A):** wait for `PR_(N-1)` to merge, then base
   plan N off fresh `origin/master`, PR → master. For operators babysitting merges who want linear history.
5. **A hard escalation halts the stack (halt-and-hold).** Because N+1 is based on N's tip, a plan that does
   not fully land holds the campaign — nothing above it may build on incomplete work (dead-phase-halts-the-DAG,
   one level up).

## Considered options

- **Base every plan off `origin/master` (rejected as the AFK default).** Simple and gives linear history —
  but only correct when master advances between plans, i.e. when a human merges each PR promptly. Overnight,
  master is frozen, so every plan bases off the same stale tip and dependent plans can't see their
  predecessors. Kept as the **opt-in `--wait-for-merge` mode** for the babysat case.
- **Stack the branches but point every PR at `master` (rejected).** This was the earlier "stack-and-plow"
  practice (memory `war-branch-base-off-latest-master-not-prior-tip`, mode B). It stacks the *bases*
  correctly but each PR's diff is *cumulative* (plan N's PR shows plans 1..N), and stacked branches off an
  old master tip that share churny docs conflict there — the 11-plan run needed a `merge --theirs` rescue on
  every PR (memory `stacked-pr-shared-doc-conflict-fix-merge-theirs`). Pointing each PR at the prior *branch*
  fixes both: clean per-plan diffs, and conflicts collapse because the base already contains the shared churn.
- **Keep going past a failed plan / continue independent lanes (deferred, YAGNI).** Could squeeze more out of
  the overnight window by rebasing a file-independent later plan onto the last-good tip. Rejected for now: it
  needs dependency-spine reasoning, and hard escalations are rare on red-teamed plans (the reference overnight
  run escalated zero Critical/Major). Revisit only if a real run is bottlenecked by halt-and-hold.

## Consequences

- **The stack is only as tall as its first failure.** Halt-and-hold means one un-landable plan freezes every
  plan above it. Acceptable given `/red-team` runs first and hard escalations are rare, but it makes plan
  ordering (the roadmap's dependency spine) load-bearing: put the riskiest / most-foundational plans early.
- **The morning merge is an ordered ritual, not free-for-all.** PRs must be merged **bottom-up**, each
  followed by deleting its branch to cascade the next onto master. Merging out of order breaks the retarget
  chain. The campaign's final report states the exact merge order.
- **Master advancing mid-run from *outside* the campaign is the one messy case.** If a second chat merges
  unrelated work to master under the stack base, shared-doc churn can reconflict; recovery reuses the
  `merge --theirs`-on-docs recipe rather than a force-push rebase of the whole stack.
- **`--afk` inherits WAR's submodule refusal.** A campaign is AFK by construction, so any plan touching an
  un-owned submodule is refused at launch (ADR-0010's AFK ownership gate) — the campaign cannot clear a
  `held:submodule-pr` any more than a single `/war --afk` run can.

## References

- Design spec: [`docs/specs/2026-07-01-war-companion-skills-design.md`](../specs/2026-07-01-war-companion-skills-design.md)
  — the `/war-help` · `/war-strategy` · `/war-campaign` family, and the campaign state/failure/append model.
- Memory `war-branch-base-off-latest-master-not-prior-tip` — the two operator-directed modes (A base-off-master,
  B stack-and-plow) this decision formalizes and refines.
- Memory `stacked-pr-shared-doc-conflict-fix-merge-theirs` — why stacked PRs pointed at master conflict, and
  the merge-theirs recovery kept as the exceptional-case path.
- [ADR-0005 — Dead-phase halts the DAG](0005-dead-phase-halts-the-dag.md) — the halt-on-failure principle this
  applies at the campaign (plan-to-plan) level.
- [ADR-0010 — Submodule landing authority](0010-submodule-landing-authority.md) — the AFK submodule-ownership
  gate a campaign inherits.
