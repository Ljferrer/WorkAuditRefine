# Late defects are fixed in the run

**Status:** accepted (operator ruling of 2026-10-31 on issue #2548; plan 2026-11-04-late-defects-fixed-in-run, D1 and PIN-1)

A WAR run's objective was to land the plan. A real defect that the run found could leave as a
`war-followup` issue while the phase landed green. Issue #2548 and its field cases show five exits: an
exclusion-set demote, a slice-pinned note, an ace re-audit that blamed its own batch, an ace gate that
blamed its own batch for a standing red, and a gate-audit Major that held the phase with zero fix rounds.
Each exit filed or held a defect that the run could have fixed.

## Decision

**A real behavior defect that a run finds is fixed in that run, before land.** Filing it is the last
resort, and it needs a stated reason. A late defect is never dropped: it is fixed, carried, held or filed
with a stated reason.

- **The auditor classes each Minor and Nit.** `findingClass` is `behavior` or `cosmetic`, orthogonal to
  severity and disposition. The values are the `FINDING_CLASSES` export in
  `skills/war/assets/land-decision.mjs`. A row with no class keeps today's route, so ace rounds never grow
  for wording.
- **A late-fix pass runs before the land decision.** It fixes each late defect in a worktree at the
  integrated tip, on the origin task's `fixRounds` under `run.roundLimit`. No new budget or knob exists
  (ADR 0005). Each late-fix commit carries `Late-Fix: <task id>:<n>`, so a relaunch rebuilds the charge.
- **A spent defect carries or holds.** On a non-final phase it rides `carriedTasks[]`, and the Lead threads
  it as the next launch's `args.seededTasks`. On the final phase it holds the land as `held:escalation`
  with the hard reason `late-defect`, a member of `HARD_ESCALATION_REASONS` in `land-decision.mjs`.
- **The Lead rules a behavior follow-up.** A `behavior` row in `handoff.followUps[]` halts the DAG advance
  until the Lead rules fix-now (a seeded task) or accept-with-a-written-reason. A non-null `issue` alone no
  longer passes it.

The detail lives in `skills/war/references/late-defects.md` (the Lead's doctrine),
`skills/war/references/late-fix-pass.md` (the pass) and `skills/war/references/finding-class.md` (the
class and the pre-ace probe).

## Amends by reference

This ADR amends four ADRs by reference. Their text stays as written, and each reads with the change below.

- [ADR 0012](0012-intra-phase-visibility-and-phase-close-sweep.md): the phase-close sweep receives cosmetic
  and classless rows only. Before the late-fix pass, every `behavior` row is sorted: a row on a
  stacked-owned or unowned file joins the pass, and a row on a parallel-owned, task-owned or release-slot
  file demotes with a stated reason. A `behavior` row first raised by the sweep or the terminal seat carries
  on a non-final phase, or files "raised after the late-fix pass" on the final phase. The never-hold rule
  for the sweep stands.
- [ADR 0013](0013-commanders-intent-and-disposition-routing.md): Decision 4's `note` ("never an issue")
  now holds for cosmetic and classless rows only. A `behavior` note never stays a note: with a fix on a
  named file it becomes `absorb`, else it parks as an `ask`. A behavior defect that the task adds stays a
  finding even when the slice pins its mechanism. A post-merge gate-audit Critical or Major with a non-blank
  `suggested_fix` takes the late-fix pass, and a fix-less one keeps the `gate-evidence` hold.
- [ADR 0026](0026-github-side-effects-mechanically-gated.md): the follow-up filing floor gains a behavior
  leg. A `behavior` row needs a Lead ruling, fix-now or accept-with-a-written-reason, beside its non-null
  `issue`. The null-issue rule stays for every row.
- [ADR 0054](0054-merge-commit-provenance-and-the-blocked-ace-tip-probe.md): a red ace gate runs the gate
  once at the pre-ace tip, and a red whose failing ids are all red there counts as green for the revert
  decision. On a regressed ace re-audit, the pre-ace probe answers per blocker, and the whole-range revert
  applies only to blockers the probe did not clear. `verifyPinTransfer`'s tree clause is unchanged, and no
  branch is force-moved.

## Consequences

- A phase with a late defect takes longer, because it spends fix rounds before land. The operator accepted
  this trade for fewer filed defects.
- A defect that runs out of rounds on the final phase holds the land for a Lead ruling. The engine never
  files it silently.
- The Lead carries more state between phases: `carriedTasks` beside `carriedPhaseClose`, threaded at every
  launch.
- Field proof is deferred to backstops: a live late-fix pass, a live pre-ace probe, and the first
  indent-stripped staged script, each named in the plan's backstops section.
