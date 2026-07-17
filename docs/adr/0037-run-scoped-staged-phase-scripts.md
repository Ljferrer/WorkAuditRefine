# Run-scoped staged phase scripts — per-phase dispatch identity via a write-if-absent, fail-loud stager

**Status:** accepted (design ratified 2026-07-16; implementation tracked by the spec and plan below)

Every `/war` phase dispatches the same file, `assets/workflow-template.js`, whose `export const meta`
block carries the static literal `name: 'war-phase'` and a fixed `description`. Operator evidence (a
`/workflows` UI screenshot) shows a completed per-phase run renders title `workflow-template` with
description `WAR per-phase execution: Work, Audit, Refine, Land, …` — every phase of every plan, in
every campaign, despite carrying different `args` per dispatch (a different `phase.id`, a different task
list), renders identically. That rules out `args` as the title's source and points at the dispatched
script's own static content — its basename and `meta.description` — as what the harness's title renderer
actually reads. Neither the renderer nor the `meta` shape is editable from this repo, so the fix has to
feed the renderer a better input: a run-scoped copy whose basename and `meta` literals are stamped with
the plan slug and phase number before dispatch. A future reader will ask why WAR dispatches a copy
instead of the shipped file, and why that copy is reused rather than regenerated on every relaunch; this
records why. Full mechanics: [the design spec](../specs/2026-07-16-land-failure-recovery-design.md) §3
(decisions 6–10), §7, and [the plan](../plans/2026-07-16-land-failure-recovery.md) Task 1.1 (the stager),
Task 1.2 (launch/resume prose), Task 1.5 (this ADR).

This ADR's scope is deliberately narrow: the companion fix in the same plan — a terminal `else` arm
routing a dead or unrouted `land:phase-<N>` dispatch to `held:land-failed` — needs **no** ADR of its own.
It reuses an existing `KNOWN_LAND_DECISIONS` member and operates entirely inside
[ADR 0005](0005-dead-phase-halts-the-dag.md)'s enum-reuse discipline; nothing about that fix is a design
decision this repository has not already ratified.

## Decision

**A per-phase dispatch runs a run-scoped, identity-stamped *copy* of the shipped template — never the
shipped file itself — produced by a fail-loud, write-if-absent staging helper whose output is the sole
sanctioned surface for both display identity and approved stage injection.**

1. **Dispatch identity is a file, not an argument.** The evidence above rules out threading identity
   through `args`; the only lever that reaches the harness's title renderer is *which file* gets
   dispatched. The staged basename is `war-[c<K>-]<planSlug>-p<N>.js` (`K` = the plan's 1-based
   campaign-queue position, omitted outside a campaign); `meta.name` is that basename minus `.js`;
   `meta.description` is `WAR phase <N> of <planSlug>[ (campaign plan <K>)]: Work, Audit, Refine, Land,
   then Wrap-up learnings.` `planSlug` passes through verbatim — long dated slugs produce long
   basenames, and UI truncation beats a lossy shortening that could collide two different plans' titles.

2. **A dedicated stager, not inline Lead logic.** `skills/war/assets/stage-workflow.mjs`
   (**defined-but-not-yet-emitted as of this ADR; produced in Task 1.1, same phase**) reads the shipped
   template and replaces **exactly once** each of the two `export const meta` anchor literals
   (`name: 'war-phase'` and the shipped `description:` string) with the derived identity. It exits
   **non-zero with a named error** when an anchor is missing or matches more than once — fail-loud,
   never a silent fork onto the wrong text. The derivation lives in two pure, independently-tested
   exports (`deriveName`, `deriveDescription`) so the title format has exactly one authoritative
   implementation; the stager also exports the two anchor literals as constants so the anchor-guard test
   that polices `workflow-template.js` imports them rather than hardcoding a second copy
   ([ADR 0025](0025-drift-guard-discipline.md) mirror-registry discipline;
   [ADR 0030](0030-live-artifacts-over-stack-fragile-literals.md) — the derived identity is read from
   the live export, never restated as a literal at each call site).

3. **Write-if-absent, with an explicit `--force` restage.** If the derived staged path already exists,
   the stager leaves it **byte-untouched**, prints its absolute path, and exits 0 — the existing file
   *is* the run's script. This is deliberate, not an oversight: an operator may have hand-edited the
   staged copy to inject an **approved** extra stage (decision 5, below), and
   `Workflow({ scriptPath, resumeFromRunId })` needs the *same bytes* across a journal replay for
   identity to hold — silently regenerating on every relaunch would either clobber the injection or risk
   the replayed script drifting from the one the journal was recorded against. Because the Lead's
   `runId` is `<plan-slug>-<YYYY-MM-DD>` and can legitimately recur same-day (a same-run resume, or a
   same-day recovery relaunch per [ADR 0021](0021-run-lifecycle-provision-contract.md) decision (G)), a
   same-basename restage is **benign reuse by construction**: same phase ⇒ same basename ⇒ the correct
   script is the one already there. A deliberate propagation of a *shipped-template* edit mid-campaign
   passes **`--force`**, the only path that overwrites — a fresh substitution from the current shipped
   template.

4. **The staged-copy home is the main-checkout, run-scoped directory, retained like the run
   manifest.** Staged copies live at `$MAIN/.claude/war/runs/<runId>/`, a directory sibling of the run
   manifest (`$MAIN/.claude/war/runs/<runId>.json`), resolved via the **same** main-checkout anchor
   idiom the manifest already uses (`git rev-parse --path-format=absolute --git-common-dir`) — no new
   anchor code, and untracked-ness rides the existing `.claude/` `ensure-exclude`. Retention is
   **manifest-equivalent**: kept, never reaped by this ADR, doubling as dispatch provenance for
   `/war-review`. A recovery relaunch mints a fresh `runId` and therefore a fresh directory, so it never
   collides with the run it is recovering from.

5. **The staged copy is the sole sanctioned home for approved stage injection.** The template's header
   comment ("the Lead may inject APPROVED extra stages by editing a copy of this file") names the staged
   per-phase copy as *the* copy meant (Task 1.2, same commit as the launch-prose change — the
   standing/dispatched split). This unifies what were two separate "edit a copy" reasons — display
   identity, stage injection — into one file.

6. **Resume passes the same staged `scriptPath` the launch used.** `Workflow({ scriptPath,
   resumeFromRunId })` must dispatch the identical script across Lead restarts; write-if-absent
   (decision 3) is what makes this safe — a resume that restages first reuses the existing file rather
   than regenerating it.

7. **The staging CLI stays filesystem-only — no git probe.** `stage-workflow.mjs` takes the template
   path, the staged directory, `planSlug`, `phaseId`, and an optional campaign ordinal as plain
   arguments; it never resolves the main-checkout anchor itself. That anchoring is the Lead's
   launch-prose duty (decision 4) — an unconditional git probe inside the stager would create a
   test-hermeticity coupling (every stager test fixture would need to live outside any git working
   tree) for no benefit the Lead-side anchor doesn't already provide.

## Considered options

- **Thread identity through `args` instead of the dispatched file (rejected).** The observed evidence —
  identical titles across dispatches carrying different `args` — rules this out directly; there is no
  args-shaped lever that reaches the title renderer.
- **Rename or overwrite the shipped template file per dispatch (rejected).** Concurrent phases (a
  campaign, or two plans run side by side) would race on one shared file; mutating the shipped artifact
  also breaks every other caller that expects `assets/workflow-template.js` to be the stable, canonical
  template.
- **Always regenerate the staged copy on every dispatch, including relaunch/resume (rejected — see
  decision 3).** Breaks approved stage-injection survival and risks the replayed script drifting from
  what a journal was recorded against. Idempotent regeneration (same inputs ⇒ same bytes) was considered
  as a middle ground but still overwrites a hand-edited injection; write-if-absent is strictly safer, and
  `--force` covers the one case idempotence was meant to serve — a deliberate propagation.
- **One shared staged script per run, not per phase (rejected).** The harness titles by dispatched
  basename; a single shared script across a multi-phase plan would still render identically per phase,
  reproducing the exact defect this ADR fixes.
- **A stager-internal git probe for the staged-copy home (rejected — see decision 7).** Would couple
  every stager test fixture to living outside a git repository, for an anchor the Lead's launch prose
  already resolves identically to the run-manifest path.
- **A new `held:*` / `MergeResult` enum member for dispatch identity (not applicable).** Dispatch
  identity is a file-selection concern at launch, before any task runs; it has no interaction with the
  land-decision vocabulary, and this ADR adds no enum member anywhere.

## Consequences

- **The live-title rendering is a deferred, operator-run backstop, not an automated criterion.** Nothing
  in this repo can execute the harness's own renderer; the automated proxy is the stager's
  basename/meta-literal assertions, and the actual `/workflows` UI rendering is checked once by an
  operator at the next real phase launch on the released plugin.
- **`stage-workflow.mjs` becomes a required launch-time step, not an optional convenience.** The
  per-phase launch prose (Task 1.2) must run it and dispatch its **printed** path — a Lead that
  dispatches `assets/workflow-template.js` directly regresses to the pre-fix generic title, silently (no
  test catches a *launch-prose* skip; only the stager's own unit tests are automated).
- **`.claude/war/runs/<runId>/` joins `.claude/war/runs/<runId>.json` as a second per-run artifact class
  under the same untracked, unreaped home.** A future `/aftermath` reaping decision, if one is ever made
  for the manifest, must account for the staged-script directory too — out of scope here; no reaping
  exists for either today.
- **No enum, escalation-surface, or `land-decision.mjs` change.** This ADR is a dispatch-input relocation
  (which file, what its two literals say) plus a new small helper module; it adds no task or phase status
  and touches none of `HARD_ESCALATION_REASONS`, `KNOWN_LAND_DECISIONS`, or `defectClass`
  ([ADR 0005](0005-dead-phase-halts-the-dag.md)).
- **A second anchor-literal mirror joins the repo's existing mirror registry.** The stager's exported
  anchor constants and `workflow-template.js`'s `export const meta` literals are now a canonical-source
  ↔ mirror-site pair like any other ([ADR 0025](0025-drift-guard-discipline.md)); the anchor-guard test
  (`stage-workflow.test.mjs`) is that pair's arbiter, not a new detection mechanism.

## References

- Design spec: [`docs/specs/2026-07-16-land-failure-recovery-design.md`](../specs/2026-07-16-land-failure-recovery-design.md)
  §1 (the operator-added per-phase-identity requirement), §2 (pivotal constraints — the sandbox has no
  shell/fs, harness-owned surfaces are immutable from this repo), §3 decisions 6–10, §6 (domain terms),
  §7 (this ADR), §8 (idempotent-restaging / long-title notes), §9 (non-goals), §10 criteria 7–9 and 11.
- Plan: [`docs/plans/2026-07-16-land-failure-recovery.md`](../plans/2026-07-16-land-failure-recovery.md)
  Task 1.1 (`stage-workflow.mjs` + tests — the contract this ADR records), Task 1.2 (launch/resume prose,
  the header-comment update, `--campaign-ordinal`), Task 1.4 (`/war-campaign` threads the ordinal), Task
  1.5 (this ADR + the `CONTEXT.md` glossary terms).
- [ADR-0005 — a dead phase halts the DAG](0005-dead-phase-halts-the-dag.md) — the enum-reuse discipline
  the companion land-routing fix (same plan) stays inside without a new ADR of its own (see the scope
  note above).
- [ADR-0008 — git is the resume source of truth](0008-git-is-the-resume-source-of-truth.md) — resume's
  git-first posture; the staged-copy write-if-absent contract exists so `resumeFromRunId` always has a
  stable file to point at, never a second, competing source of truth.
- [ADR-0021 — run-lifecycle contract (recovery relaunches are fresh runs over reused git state)](0021-run-lifecycle-provision-contract.md)
  decision (G) — the same-`planSlug`/`phase.id` reuse pattern this ADR's same-day `runId` recurrence
  composes with.
- [ADR-0025 — every duplicated or asserted fact carries a mechanical drift-guard to its canonical source](0025-drift-guard-discipline.md)
  — the mirror-registry doctrine the stager anchor-constants ↔ template-meta-literals pair follows.
- [ADR-0030 — plans reference live artifacts, never stack-fragile literals](0030-live-artifacts-over-stack-fragile-literals.md)
  — why the derived name/description live in one exported pure function rather than being restated at
  each call site.
