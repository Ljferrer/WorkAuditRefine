# Late defects — the objective, the carry thread and the behavior follow-up floor

The Lead's doctrine for late defects (plan 2026-11-04-late-defects-fixed-in-run, Task 6.2, D1/D9/D20, PIN-1, [ADR 0058](../../../docs/adr/0058-late-defects-are-fixed-in-the-run.md)). Every section but the last is born cold here, so it has no pre-eviction text. The `## Moved from CONTEXT.md` section is a verbatim eviction from the repo-root `CONTEXT.md` (same task, ADR 0042): each moved passage was byte-identical to its pre-eviction `CONTEXT.md` text **at eviction time**, and the glossary (`GLOSSARY.md` since #2636) keeps a trigger pointer to this file in its place. The `late-defect: doctrine` rows in `skills/war/assets/skill-doc-contracts.test.mjs` and `skills/war/assets/reference-link-integrity.test.mjs` pin this file. The engine homes are the `LATE-FIX PASS` block and the seeded-task intake in [`../assets/workflow-template.js`](../assets/workflow-template.js). The pass itself is in [late-fix-pass.md](late-fix-pass.md), and the row shapes are in [schemas.md](schemas.md).

## The objective

A real behavior defect that the run finds is fixed in the run, before land. If its fix rounds run out, it carries to the next phase as a seeded task, or it holds the final phase for your ruling. Filing it as an issue is the last resort, and it needs a stated reason. A late defect is never dropped: it is fixed, carried, held or filed with a stated reason (PIN-1).

A cosmetic row, and a row with no `findingClass`, keep today's routes. The class values are the `FINDING_CLASSES` export in [`../assets/land-decision.mjs`](../assets/land-decision.mjs). The fix budget is the origin task's `fixRounds` under `run.roundLimit`, and no late defect raises it.

## The carry thread

Every phase return carries a top-level `carriedTasks` array, landed or held. It is `[]` when nothing was carried. Thread it verbatim as the next launch's `args.seededTasks`: the next phase's launch after a landed phase, or the relaunch of a held one. Do this at every launch, beside the `carriedPhaseClose` → `args.seededPhaseClose` thread. Add one row for each behavior follow-up you ruled fix-now (see the floor below). Thread `[]` when there is nothing to seed.

On the relaunch of a held phase, keep the held launch's own `args.seededTasks` rows first, in their order, then append the held return's `carriedTasks`. The engine names each seed `seed-<1-based row index>`, so each seed derives the same branch.

A task that ends `env-died` or `env-blocked` returns no `carriedTasks` row for its seeds (#2641). Its `escalated[]` record carries them instead: `seed` (the row a seeded task was built from, stamped with its `seedId`) and `foldedSeeds` (the rows folded into its slice). When you relaunch that task, thread only those rows, verbatim, as the relaunch's `args.seededTasks`. The intake reuses `seedId`, so the seed keeps its id and branch. Never thread the launch's other rows: a merged seed or a seed the cap rule carried would run again. A seeded task needs no `args.tasks` entry, because its row mints it again. For a plan task, list it in `args.tasks` as usual, and its folded rows fold into it again. Never append a record's rows to `carriedTasks`, because the relaunch would run them twice. On the relaunch of a held phase, the rule above already threads the held launch's own rows, so add no record rows. A `held:workflow-error` return carries no stamp, and that rule covers it too.

Never edit a carried row. Its `planSlug` is the provenance coordinate the args floor checks, and its `task` is the origin task. The engine turns each row into one task, or folds it into the slice of the task that owns its file (PIN-9). A seeded task that runs out of fix rounds carries again, or holds as `late-defect` on the final phase or on a phase another hard escalation holds.

## The behavior follow-up floor

The follow-up filing floor in SKILL.md § Checkpoint has a second leg. Each `handoff.followUps[]` entry projects the top-level `minorsFiled[]` row at the same index, because the projection maps the rows one for one. If that row carries `findingClass: 'behavior'`, a non-null `issue` alone no longer passes the floor. The DAG advance halts until you rule the row one of two ways:

- **fix-now:** the row becomes a seeded task. Copy the `minorsFiled[]` row into the next launch's `args.seededTasks` and stamp the run's `planSlug` on it. On the final phase there is no next phase, so launch one seed-only phase before Finish: `tasks: []`, the ruled rows as `args.seededTasks`, and `args.finalPhase: true`. Comment on the filed issue that the run fixes it, and close the issue when the seeded task merges.
- **accept-with-a-written-reason:** write why the defect can wait for a later run. Post the reason as a comment on the filed issue, and stamp it into the ledger's phase `handoff` record beside the row's `issue`.

A cosmetic or classless row passes on a non-null `issue`, as before. Under `--afk` you rule each row yourself: fix-now when the row has a non-blank `suggested_fix` on a named file, else accept-with-a-written-reason. Each issue comment is a gh-write of its own, so run `gh-preflight.sh` first, as the floor's own filing does.

## A `late-defect` hold

On the final phase, or on a phase another hard escalation already holds, a late defect whose fix rounds ran out holds the land as `held:escalation`. Its `escalated[]` entry is `{ task, reason: 'late-defect', fixRounds, detail }`, and `late-defect` is a member of `HARD_ESCALATION_REASONS` in [`../assets/land-decision.mjs`](../assets/land-decision.mjs). The late-fix branch stays unmerged, and no branch is force-moved. The hold waits for your ruling:

- **fix-now:** relaunch the held phase as a sanctioned recovery relaunch ([resume-and-recovery.md](resume-and-recovery.md) § Recovery relaunch), with one `args.seededTasks` row per held defect. Build each row from the entry's `detail` and the seat's finding row in the run transcripts: `severity`, `title`, `file`, `suggested_fix`, `task`, `findingClass: 'behavior'` and `planSlug`.
- **accept-with-a-written-reason:** file the defect as a `war-followup` issue whose body carries your reason, then land the phase by the escalation-completion land in [resume-and-recovery.md](resume-and-recovery.md) § Checkpoint outcome handling, with the resolved gate green.

Under `--afk` you rule it yourself: fix-now when the defect has a fix text, else accept-with-a-written-reason.

## Glossary

- **Late defect**: a `behavior`-class finding that the engine would otherwise demote, revert, hold or file after a task's own audit approved.
- **Late-fix pass**: the post-merge, pre-sweep pass that fixes late defects in a worktree at the integrated tip, on the origin task's fix budget. See [late-fix-pass.md](late-fix-pass.md).
- **Finding class**: the auditor-owned `findingClass` field, `behavior` or `cosmetic`, orthogonal to severity and disposition. The values are the `FINDING_CLASSES` export. See [finding-class.md](finding-class.md).
- **Pre-ace probe**: the read-only seat that reports whether an ace re-audit blocker exists at the pre-ace tip. See [finding-class.md](finding-class.md) § Pre-ace probe.
- **Seeded task** / **Carried task**: a late defect that ran out of rounds, returned in `carriedTasks[]` and launched in the next phase from `args.seededTasks`.

## Moved from CONTEXT.md

### Exclusion set — the behavior-row sort

Moved from the `**Exclusion set**` entry, after "A `behavior` row never reaches this set:".

before the late-fix pass it is sorted (PIN-21). A file that only a
`mode: 'stacked'` entry owns, or that nobody owns, sends it to the late-fix pass, and it is never filed or
taught as a note. A `parallel` entry's file (an absent `mode` reads `parallel`), a not-`merged` task's file
or a release-slot file demotes it `demote:exclusion-set` naming the owner and why no late fix runs.

### Terminal pass — a seat-raised behavior row

Moved from the `**Terminal pass**` entry, after "it convenes with `run.ace` off and never budget-blocks."

A seat-raised `behavior` absorb or note was raised
after the late-fix pass: it carries as a `carriedTasks[]` row (non-final) or files `demote:terminal-pass`
"raised after the late-fix pass" (final), never a hold (ADR 0012). With no fix on a named file it parks
as an ask instead (#2624).
