# Backward-chain doctrine and corrective-round disclosure

**Status:** accepted (ratified by
[the plan](../plans/2026-09-11-backward-chain-doctrine.md), decisions D1–D16, pins PIN-1 through
PIN-11; originating evidence: issue #2097 (the ten-sequence retrospective), PR #2220, PR #2297;
study issue #2302)

A fix worker patched the one site a seat named. The next round blocked on a sibling site, a
residue of the fix, or the cause one link upstream. Across 17 recorded sequences the next blocker
was a sibling 19 times, fix residue 17, a test oracle 12, a consumer 9, an upstream cause 8, a
premise 4, a regression 3 (issue #2097, the Snipe audit records and an abstracted external alert
audit). One dedup lookup took eight rounds, and every intermediate step was a correct local fix to
the named site (#2097, thread B).
Unanimity came every time the fix was stated as one shared predicate, helper or proof with a
proven-red control. It never came from a seat's `fix:` line as written. `fixRounds` hid the
oscillation: it was 0 on 12 of 14 phases of the 2026-09-06 run, while the ace ladder spent all six
charges on 14 of 26 tasks. The fix-round doctrine
([fix-round-doctrine.md](../../skills/war/references/fix-round-doctrine.md)) is site-to-class
only. It has no chain from the End state, no bottleneck-first rule, no ignore-for-now rule, no
premise check on the finding, and no rule for a class that re-opens one hop per round. The 2026
OpenAI / Hugging Face incident is the mirror failure: agents ran a correct backward chain toward a
scoring rule that did not exist, re-locked their finish line on a peer's say-so, and had no
rewarded exit.

## Decision

**Every role chains backward from the cited End state and fixes the class at the earliest unmet
link. The doctrine discloses by corrective round, the auditor classifies each re-block, and the
whole chain rides existing fields.** Six parts follow.

### 1. Four roles, five reference files, one examples bank

The doctrine has four roles (D1): the **worker** on its first pass, the **plan author** (the
`/war-machine` drafter and the `/war-strategy` interview), the **auditor** on a roster seat at
corrective round 2 or later, and the **fixer** on every fix-applying build. Each role has one
reference file, its home under ADR 0042's hot/cold law:
[backward-chain-worker.md](../../skills/war/references/backward-chain-worker.md),
[backward-chain-plan.md](../../skills/war-strategy/references/backward-chain-plan.md),
[backward-chain-audit.md](../../skills/war/references/backward-chain-audit.md),
[backward-chain-fix.md](../../skills/war/references/backward-chain-fix.md). The fifth file,
[backward-chain-examples.md](../../skills/war/references/backward-chain-examples.md), is the
examples bank: tag H2s (the nine between `## Entry shape` and `## Growth rules`, the eight tags
plus `## convergence`), each entry abstracted (D12, PIN-9: an external private source lands as
`Source: external (private), abstracted`, with no repo name, number or infrastructure detail).
Only the worker, audit and fixer files carry a `## The rules`
block. Each block rides its dispatched prompt byte-equal, pinned by a fixture in
`workflow-template.test.mjs`. The plan-author file rides no prompt and is read by pointer at its
two sites. The examples bank and every other section are read by pointer. The five skeletons
(headings, rule lists, tables, seed entries) are the ones ratified at the interview (D14, PIN-1
‡): no rule dropped, none added. The fixer file composes with
`fix-round-doctrine.md` by pointer: the chain first, then that file's ten rules over the diff. The
ten rules are not restated.

The reach is fixed (D5, PIN-6, D6): all seven fix-applying builds carry the fixer block (FIX_NEEDED,
ace subset, ace re-entry, ace advisory polish, the floor family, the phase-close sweep, the
terminal pass), the WORK build carries the worker block only, and no build carries both. The
roster-seat audit prompt carries the audit block at corrective round 2 or later. The three
gate-audit-family seats (per-task, integrated-tip, end-state) judge executed gate evidence, never
a fix, and carry no backward-chain clause. No new dispatch site exists (PIN-7).

### 2. The corrective round keys the disclosure

A **corrective round** is any round that changes code after an audit: a FIX_NEEDED fix round or an
ace charge, counted 1-based per site (D4, PIN-5). FIX_NEEDED and the roster-seat audit read the
in-loop index plus the task's spent absorb meter (`round + 1 + r.task.absorbRounds`); the three
ace sites and their re-audits read the task's fix-round count plus the same meter
(`r.task.fixRounds + r.task.absorbRounds`), never the in-loop `r.round`, which is undefined on a
resume. The bare `absorbRounds` const is the run budget and is never an input. The phase-close
sweep, the terminal pass, the floor family (add-test, make-pass, cite-budget, package-it) and the
pin-content re-audit are round 1 by definition: they carry no threaded findings and no relation
tag. The arithmetic is a floor, because the round-5 exit below keys on it.

The fixer and audit files carry depth sections keyed on that round. The fixer file carries
`## Round 1`, `## Round 2`, `## Round 3 and later` and `## Round 5 and later`. The audit file
carries the same tiers from `## Round 2`, because a round-1 audit prompt carries no backward-chain
clause (PIN-10). The dispatched prompt names the section for the round it dispatches. Round 1
carries the seat findings and nothing older. From round 2 the engine
threads a **history digest** (D11, PIN-8): per prior round, each blocker's title, file, severity,
relation tag and `upstream link:` line; the fix worker's `Fix:` and `Ignore for now:` lines, read
from its result `notes`; one line for the task under fix with its relation-tag sequence by round;
the worker's round-1 `Critical path:` block; and full `rationale` plus `suggested_fix` for the
survival-registry blockers only. The audit log is in memory until phase return, so the digest is
the fixer's only view of history. Rounds 3 and 4 reframe (D7, PIN-11): a class that re-opens one
hop per round is a shape signal, never an escalation. The fixer finds the common ancestor,
re-locks on the cited End state and the Commander's Intent only, and asks the Focusing Question
over the whole history.

Round-1 audit prompts stay byte-identical to the pre-doctrine build (D13, PIN-10). A first audit
has no fix to relate to, and a fixture in `workflow-template.test.mjs` pins the equality.

### 3. The auditor is the classifier and the oracle

From corrective round 2 the roster seat writes exactly one line `relation: <tag>`, lowercase, as
the last line of every blocking finding's `rationale`, preceded by an `upstream link:` line naming
the link on its own chain the new blocker descends from. The tag is one of a closed set. That set
is canonical in the audit file's `## The rules` and equal, byte for byte, across four surfaces
(D15): the audit rules block, the fixer file's Round 2 first-move table, the examples bank's tag
H2s (the nine between `## Entry shape` and `## Growth rules`, the eight tags plus `## convergence`)
and the engine's `relation:` regex in `workflow-template.js`. Two
guards bind the four: the skeleton guard `backward-chain.test.mjs` binds the three file surfaces,
and a fixture in `workflow-template.test.mjs` binds the engine regex to them. This record does not
restate the list, so it owes no guard. The tag selects the fixer's first move and the examples
section it reads. No tag means the fixer reads the bank's
index and self-selects (D16). The seat is also the oracle (D10e): it runs its own chain from the
cited End state and diffs it against the fixer's commit-body chain. The markers are self-reports,
never evidence (the principle ADR 0049 states for the ace footprint). Peer count is not evidence
either (ADR 0041): a peer finding is a claim to verify at the pin. The seat stays read-only. The
git verb allowlist is not widened.

### 4. The round bound is a safety precaution (PIN-2 ‡)

`run.roundLimit` and `run.absorbRounds`, their defaults and their validation, are untouched. The
bound is a safety precaution, not only a cost budget: the 2026 incident ran hundreds of agents on
impossible tasks for days because nothing bounded them. No task raises, removes or routes around
the bound. No doctrine text, in the five files or the dispatched prompts, treats the bound as an
obstacle. A chain that has not closed by the last round is a completed measurement of the task.

### 5. The End-state exit discloses at round 5 (PIN-3 ‡)

The option to call an End state a plan defect discloses at corrective round 5 or later, never
earlier, as its own tier `## Round 5 and later` in the fixer and audit files (D9). The engine
pointer names that tier only when the corrective-round helper returns 5 or more. The test is
concrete: re-run the chain from the cited End state with the task's own tools and files. A
re-opening class is not a plan defect. A wrong or impossible End state is (D10c). The return is
`status: "blocked"` with `blocked_reason` starting `PLAN-DEFECT:` and naming the End state number,
the link that cannot be made true, and the evidence run. That return is a completed outcome, not a
failure (D10b): it routes the plan to a `/red-team` amendment, the only place an End state can
change. The seat's counterpart at the same tier is one finding tagged `relation: premise` whose
title names the End state number. Before round 5 no seat files that finding. The slice-level
`PLAN-DEFECT:` route on the worker card (a plan that contradicts the code) is unchanged and stays
available at every round. The two routes differ in subject: the slice-level route is about the
slice, the round-5 exit is about the outcome. The incident corrections (D10) bind every role:
re-lock only on the plan's End states and the Commander's Intent, never on a peer finding or an
own inference; the outcome line cites the End state number or the `Done when:` it chains from.

### 6. No schema change: the chain rides existing fields (D2, PIN-4)

The transport is a convention inside fields that already exist. The worker writes `Critical path:`
then `Ignore for now:` into `WorkerResult.notes`. The fixer writes one block, `Outcome:` `Chain:`
`Bottleneck:` `Fix:` `Ignore for now:`, into the fix commit body and echoes it byte for byte into
`WorkerResult.notes`: the Workflow sandbox has no git, so the engine reads only `notes`, and the
auditor reads the commit body with its own read-only git. The auditor writes `upstream link:` then
`relation: <tag>` as the last line of a finding's `rationale`. No field named `critical_path` or
`upstream_link` exists. The merged-plan extraction headings stay untouched (ADR 0044): the plan
author's `Critical path` block is Part 1 placement latitude, never a new required H2 and never a
phase under `## Build order`. `schemas.md` documents each convention by pointer to its reference
file.

## Consequences

- Cards and dispatched prompts change in the same task (G8, the plan's Task 2.1): the worker and
  auditor cards carry one `when <trigger>, read` pointer each, and the engine carries the three
  rules constants.
- New mirrors ship with their guards (ADR 0025): the skeleton guard `backward-chain.test.mjs`
  (Task 1.2) and, in `workflow-template.test.mjs` (Task 2.1), the three byte-equal rules
  fixtures, the four-surface tag guard, the round-1 byte-identity fixture, the corrective-round
  helper fixture and the history digest field-set fixture.
- The template's prompt-literal share grew past its hard line. The raise was the operator's
  pre-`/war` re-baseline pass on that one surface, sized by ADR 0042's D5 formula and carrying the
  `Budget-Raise` trailer (ADR 0048). No worker edits a budget constant (G13).
- `CONTEXT.md` defines the four terms under `### Backward-chain doctrine (ADR 0052)`: corrective
  round, relation tag, critical path block, history digest.
- `fix-round-doctrine.md` is untouched and composes by pointer. The Lead threads nothing new by
  hand: the engine builds the digest.
- The examples bank grows by reviewed PR, or by the Lead's Gate-2 commit when `commitLearnings`
  is on. The servitor never writes it. Every new entry gets a manual redaction check (D12, D16).
- Adherence is a self-report today. The auditor's own chain is the oracle in-run; the count over
  time is the study below.

## The #2302 study trigger

Issue #2302 owns the deferred validation that decides whether schema enforcement is ever needed.
After the next five `/war` runs that carry the doctrine, `/war-review` records three counts: marker
adherence (results and findings that carry `Critical path:`, `Ignore for now:` or `relation:`,
over all of them), the sibling re-block rate (corrective round N+1 blockers that name a sibling or
consequence of round N's fix, over all corrective rounds, read from the ace ladder rows and the
audit log, never `fixRounds` alone), and corrective rounds per task by the helper's definition.
In-run baseline: the 2026-09-06 run, where 14 of 26 tasks spent all six ace charges and 22 of 26
passed unanimously at round 0. Decision rule: adherence below the floor #2302 sets, or a marker
with an empty or unparseable body, promotes the convention to schema fields (`critical_path` on
`WorkerResult`, `upstream_link` on findings); high adherence with a flat re-block rate means the
schema is not the fix and the doctrine is revised. The same issue holds the examples-bank size
watch and the classifier-subagent decision. The reachability probe joining the `/red-team` spine
is a separate `war-followup` issue filed at the plan's land Checkpoint.

## Considered options

- **New schema fields `critical_path` and `upstream_link` (rejected, PIN-4).** A field the
  agents ignore is no better than a convention they ignore, and a field they fill badly is worse.
  #2302 holds the trigger that revisits this with data.
- **Disclose every tier at every round (rejected).** Round 1 has no history to read, and the
  End-state exit read at round 1 invites a plan-defect call before the chain has been run once.
  Disclosure by round keeps each prompt to what that round can act on.
- **A classifier subagent that picks the fixer's example batch (deferred to #2302).** It is a new
  dispatch site, and the bank still reads in one section. The auditor already classifies.
- **Route around the round bound when a class keeps re-opening (rejected, PIN-2 ‡).** A
  re-opening class is a shape signal for the fixer. The bound stays.
- **Thread the digest from the Lead's `skills/war/SKILL.md` prompts (rejected).** The audit log
  is in the engine's memory. The engine builds the digest.

## Relationship to prior ADRs

- [ADR 0013](0013-commanders-intent-and-disposition-routing.md) — the ace ladder whose charges
  count as corrective rounds; the escalate boundary this doctrine's round-5 exit sits beside (the
  slice-level `PLAN-DEFECT:` route itself lives on `agents/war-worker.md`).
- [ADR 0025](0025-drift-guard-discipline.md) — every byte-equal block and the four-surface tag
  set are mirrors in that discipline, guarded in the task that created them.
- [ADR 0041](0041-audit-evidence-precedence.md) — peer count is not evidence; the seat verifies
  at the pin, and thin evidence lowers certainty and severity together.
- [ADR 0042](0042-prompt-surface-budgets.md) — the hot/cold law this doctrine's placement
  follows: rules blocks ride the prompts, depth sections live in `references/` behind pointers.
- [ADR 0044](0044-authoring-contract-and-merged-artifact.md) — the merged-plan headings this
  doctrine leaves untouched; the `Critical path` block is Part 1 latitude.
- [ADR 0048](0048-budget-maintenance-authority.md) — the template literal-share raise was the
  operator's re-baseline act, never a worker's.
- [ADR 0049](0049-pin-transfer-and-proportional-re-audit.md) — the self-report-is-a-cross-check
  principle, applied here to the fixer's markers.

## Decision log

- 2026-09-12 · ADR authored in the living form; records the four roles, the five files,
  disclosure by corrective round, the auditor as classifier, PIN-2 and PIN-3, the no-schema
  transport and the #2302 study trigger · plan 2026-09-11-backward-chain-doctrine, issues #2097,
  #2302
