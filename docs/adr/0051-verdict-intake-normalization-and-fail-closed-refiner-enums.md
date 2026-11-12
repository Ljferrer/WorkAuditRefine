# Verdict intake normalization and fail-closed refiner enums — the engine owns the invariant, the prompt is advisory

**Status:** accepted (ratified by
[the plan](../plans/2026-09-06-engine-and-audit-verdict-integrity.md), decisions D2/D4/D5/D6,
pins PIN-2/PIN-6/PIN-8/PIN-9/PIN-10; originating incidents: issues #1736, #1788, #1811, #1869, #1870,
#1973, #1797 and #1805)

A WAR run let a dispatched agent's own words decide a task's fate. Three shapes of that trust
composed. An auditor payload could carry `seats` and `merged` fields, and the follow-up collapse
read them as if the engine had written them, so one seat could forge corroboration by a second
(issue #1788 and the follow-up collapse). A refiner could report `already_upstream` for a task whose own
result fields said otherwise — `rebased_tip` equal to the dispatch base and a non-empty post-rebase
patch-id — and the consumer recorded the task `merged` with nothing on the integration branch
(issue #1973). A land dispatch could return with the `land_segment: 'incomplete'` marker on one of
three land sites and only the first site knew to re-dispatch it (issues #1797 and #1805). Each
defect has the same root: a prompt told the agent what to return, and the engine treated the
prompt as the guarantee.

## Decision

**The engine owns the invariant. The prompt is advisory.** A standing card or a dispatched
prompt may explain the rule to the agent, and the FINDING-PATH FORM sentence and the segmented-land
clause do exactly that. The rule itself is enforced at intake by engine code that reads the
result's own fields and never a field the agent asserts about the engine's state. An agent's
self-report is a cross-check, never the source (the principle ADR 0049 states for the ace footprint,
applied here to every verdict and every refiner status). Three forms follow.

### 1. Intake normalization — every seat finding passes through `normalizeFinding`

**Intake normalization** is the step that runs on every finding of every `AUDIT_VERDICT` before any
router, collapse or filing reads it: roster seats, the rebuttal round, every re-audit (ace,
pin-transfer, floor-fix, sweep, terminal), the three gate-audit-family seats (post-merge,
integrated-tip, end-state-only). `normalizeFinding` in `workflow-template.js` strips the
auditor-supplied `seats` and `merged` fields, so `seatsListOf` only ever reads a list the engine
wrote and a forged `seats` list never renders as corroboration (the corroboration LIST is
engine-written; the finding-level `seat`, `task` and `lens` keys stay auditor-supplied, a residual
out of PIN-6's slice recorded on `seatsListOf`); it normalizes `file` through `aceRelPath`, so a
leading `./` run never splits a record; the absolute form is refused by the prompt mandate, not by
the engine. Its caller `normalizeSeat` demotes a finding with no title and no routable content
(`contentTextOf`: `rationale`, `suggested_fix`, `ask.question`) to a logged note, because a finding
with nothing routable is not a verdict (#1869). The spare covers a `scopeBreach` or
`plan_ref`-carrying row, a non-blank `ask.question` at any severity (it is content through
`contentTextOf`), and a bare `disposition:'ask'` only on the Minor/Nit severities the ask channel
serves: a Critical or Major carrying only `disposition:'ask'` never reaches `parkAsk`, so it
demotes. `remintKey` folds a content hash in when file and title are both absent, so two
content-distinct empty-key findings both file (#1870). The card and the gate-audit-family prompts
carry the FINDING-PATH FORM sentence as belt and braces; they are not the guard (PIN-6).

### 2. The `already_upstream` refusal arm — a refiner status must agree with its own fields

The pin-transfer consumer refuses a refiner `already_upstream` that carries the contradiction
signature: `rebased_tip` equal to the dispatch base, or a non-empty post-rebase patch-id, or an
empty `already_upstream_commits`. The refusal logs and the task never reaches `landMerged` on that
status. Equal non-empty pre/post patch-ids route to `transferred`; anything else routes to the
mismatch re-audit, today's behavior. The run's own probe result from #1973 replays verbatim as the
fixture `pin-transfer: #1973 verbatim replay merges the task` (PIN-8). This arm extends ADR 0049's
`already_upstream` rule: that ADR fixed the empty-equals-empty hole, this one refuses a status whose
companion fields say the content is not upstream.

### 3. The segmented-land and segmented-merge helpers — one loop each, a status pair never a bare marker

The segmented-land clause and its bounded re-dispatch loop are one helper applied to the initial,
`environment-proceed` and `baseline-proceed` land dispatches. Continuation requires the pair
`status: 'error'` **and** `land_segment: 'incomplete'`; the marker rides the existing `error` status
and never a new status member. A `status: 'landed'` result carrying the marker is a landed land. A
marker-absent error land dispatches exactly once and holds `held:land-failed`. The loop is bounded
by `run.roundLimit` (PIN-9).

The merge-task twin, `segmentedMerge`, applies the same pair read to six merge-task dispatch
sites: the four per-task sites (the initial merge, the floor-retry re-merge, and the
`environment-proceed` and `baseline-proceed` re-merges) and the two sweep-family merges,
`merge:p<id>-polish` and `merge:p<id>-terminal` (#2189). Its marker is `gate_segment: 'incomplete'`,
an optional field on `MERGE_RESULT`, and it rides `status: 'error'` under the same `run.roundLimit`
bound. A merged result carrying a stray marker is a merge (#2156). Refiner card step 10 says the
Workflow re-dispatches every merge-task, and that is true at each site (#2183). A spent budget
returns the final `status: 'error'` result, and Git reconciliation then runs, as for every error
result (section 4). A `dirty task worktree` stop (#2617) is the one exception: it never reconciles
at the four per-task sites, and at a sweep-family site it skips reconciliation when Git confirms
it. Once Git proves the merge unmerged, each sweep-family site takes its own fail-open arm: the
phase-close sweep discards, and the terminal commit stays unmerged.

The ace gate check applies the same read to `GATE_CHECK`: the marker rides `gate_green: false`, and
`aceGateGreen` re-dispatches under the same bound (#2326). A green reply carrying a stray marker is
green. A `gate_green: false` reply with no usable `head_sha` and no `gate_failing_ids` is unjudged
and re-dispatches under the same bound too (D11). A judged red gets one fresh re-run before the
forward-revert (D35); a red with `head_sha` and no ids is re-asked once for its ids instead, except
a `provision_failed: true` red, which is never re-asked for ids. A spent bound takes the
dispatch-death route, because nothing judged the tip: the ace tip forward-reverts and the rows
reach the sweep. `skills/war/references/resume-and-recovery.md` holds the full arm list (#2797).

The shared background rule, which the merge and land clauses both carry, says a SEGMENTED
continuation resumes the same gate run, so it never counts as the one re-run that an
environment-proceed or baseline-proceed prompt allows (#2155). The pinned "exactly ONE re-run"
text in those prompts is unchanged. The ace gate check carries the same rule, and no ace gate prompt
allows such a re-run. The rule backgrounds a gate that can outrun one 600000 ms tool call and polls
it in the same turn; the segment pair returns only if the job dies, because the turn end kills the
job, and a partial log is rerun, never waited on (#2617).

### 4. Git confirms every mutation result

D21's operator ruling makes Git authoritative for normal replies as well as lost responses.
`reconciledMerge` snapshots Git before every task, polish, terminal and land mutation; after
segmented continuation completes, a separate read-only refiner confirms any normal reply.
The enum is insufficient: success requires independently resolved current local/origin/source
identities and the task patch/ancestry or exact land-parent proof; failure requires unchanged
local and origin targets. Missing or contradictory proof enters bounded in-phase refiner
maintenance on `agents.refiner.recovery`. Shared `mergeGitMatches` checks prevent a weaker
success arm in confirmation or recovery. Full mechanics and the no-op/recovery distinction
live in [refiner-recovery.md](../../skills/war/references/refiner-recovery.md#uncertain-merge-reconciliation).

Marker-absent errors, exhausted segments and sweep merges first establish Git certainty; none is
"one dispatch then route by status". A proved-unmerged result resumes its ordinary site
classification; uncertainty holds before land only after bounded agent maintenance. A recovered
push reuses existing content/phase commits. No enum, gate, floor, auditor permission or human Git
requirement is added.

Pin-transfer rebase results obey the same independent-evidence rule: a preflight refuses
unaccounted local-only target history, safe recovery can fast-forward a local follower, and a
separate read-only proof resolves pins, approved content, actual patch IDs and cherry matches.
Already-upstream completion needs published Git evidence; missing/error/unknown replies that
leave changed content trigger a full audit. Normal and recovered land can reuse the exact phase
commit already published before dispatch, with source-parent and local-base ancestry proof.
The operative procedure and wire shapes remain in the linked recovery reference and engine.

The Git context carries an explicit repository-local seed: the phase working branch for ordinary
work, or targetBase for submodule work. Pin verification and all task/sweep merges watch the
integration branch; submodule land still targets its base. Cherry-set confirmation covers every
distinct reported non-merge commit, so duplicated independent proof rows cannot stand in for an
absent one. The final complete Git tree must equal the approved tree for no-panel completion;
merge omissions or reverted upstream matches cannot substitute for current-content proof.
Different/unavailable final trees get the full original-content comparison and fresh approval,
followed by independent confirmation of the same published destination before completion.

### Fail-closed enum discipline

An in-band marker never softens a hard status, and a hard status never widens by prose. When a
floor's exit needs its own escalation reason — `budget-uncited`, the uncited budget raise — the
member joins `HARD_ESCALATION_REASONS` in `land-decision.mjs` and the hand-mirrored engine copy in
the same commit, with every drift guard that pins the members (the ADR 0005 shape). Both re-merge
sites route through `routedMr`, so the reason names the real cause instead of riding `no-test`.
`MERGE_RESULT.status` is never widened and `held:workflow-error` never enters the hard set (PIN-2).

### Guardrails that bound all three forms

- **The engine never trusts a field about its own state.** A seat-supplied `seats`/`merged`
  (PIN-6), a refiner `already_upstream` whose fields contradict it (PIN-8), and a segmented-land
  marker without its status pair (PIN-9) are refused when the engine reads the result — the
  `seats`/`merged` strip and the `already_upstream` refusal each log.
- **Refusal degrades to today.** A stripped field leaves the finding routable, a refused
  `already_upstream` falls to the mismatch re-audit, and an exhausted segment budget routes by its
  ridden status — the worst case is what the engine already did.
- **Prompt and card move together.** Every dispatched-prompt sentence that explains one of these
  rules owns its standing-card twin in the same commit with a registry row (PIN-1); the prompt is
  advisory, so its drift can mislead an agent but never the engine.
- **No check, gate, floor or backstop is waived** by any refusal (ADR 0017).

## Considered options

- **Tighten the `AUDIT_VERDICT` schema with `additionalProperties: false` (rejected).** The
  schema is validated where the Workflow can validate it, and a schema rejection turns a forged
  field into a dead dispatch instead of a stripped one. Stripping at intake keeps the finding and
  loses only the forgery.
- **Trust the refiner's `already_upstream` and add a card sentence (rejected).** The card already
  described the arm order at #1973 and the status still arrived contradicted. A sentence cannot bind
  an agent that misread its own legs; the consumer must read the legs itself.
- **Widen `MERGE_RESULT.status` with a `segmented` member (rejected).** A new status member moves
  every mirror and every drift guard for a marker that only ever rides `error`; the status pair is
  the smallest thing the engine can check and the pre-authorized shape.
- **Two ADRs, one per family (rejected, A10).** Verdict intake and refiner-status refusal are the
  same principle on two wires. One record keeps the principle findable by one grep.

## Relationship to prior ADRs

- [ADR 0005](0005-dead-phase-halts-the-dag.md) — the hard-escalation set and the rule that
  `held:workflow-error` never joins it; the `budget-uncited` widening follows its shape.
- [ADR 0017](0017-packaging-floor-docker-gate-ratified-backstops.md) — no refusal here waives a
  check, gate, floor or backstop.
- [ADR 0025](0025-drift-guard-discipline.md) — the enum mirrors and the prompt/card registry rows
  are drift guards in that discipline.
- [ADR 0049](0049-pin-transfer-and-proportional-re-audit.md) — pin transfer's `already_upstream`
  arm and the self-report-is-a-cross-check principle this ADR generalizes.

## Decision log

- 2026-09-07 · ADR authored in the living form (a `**Status:**` line, in-place body, this log); records intake normalization, the `already_upstream` refusal arm and the segmented-land helper · issues #1869, #1870, #1973, #1797, #1805
- 2026-09-07 · section 3 extended to the merge-task twin: `segmentedMerge`, the `gate_segment: 'incomplete'` marker on `status: 'error'` across the four per-task merge-task sites, same pair read and `roundLimit` bound · issue #2156
- 2026-10-30 · section 3 extended to the ace gate check: `GATE_CHECK` carries `gate_segment`, an unfinished gate re-dispatches, and a spent bound never reads as a red gate · issues #2326, #2329
- 2026-11-03 · section 3 extended to the two sweep-family merges, so `segmentedMerge` covers six merge-task sites, and the shared background rule says a continuation is never the one allowed re-run · issues #2189, #2183, #2155
- 2026-11-05 · the shared background rule backgrounds a gate that can outrun one 600000 ms tool call and polls it in the same turn; the segment pair returns only if the job dies, because the turn end kills the job, and a partial log is rerun, never waited on · issue #2617

- 2026-09-09 · section 4: Git confirms every mutation result (the finalization amendment) · D21, PR #2297 · failed because: "one dispatch then route by status" trusted a reply Git had not confirmed · retired: docs/adr/0051-verdict-intake-normalization-and-fail-closed-refiner-enums.md @ 81b16050
- 2026-11-03 · the sweep-family merges are segmented (the 2026-11-03 amendment folds into section 3) · #2189, #2183, #2155 · retired: docs/adr/0051-verdict-intake-normalization-and-fail-closed-refiner-enums.md @ 171be55b
- 2026-11-11 · section 3 states the ace gate's D11 unjudged-red re-dispatch (no usable `head_sha` and no ids re-dispatches under the bound) and the D35 one fresh re-run before a forward-revert · #2797
- 2026-11-11 · adopted under the living-ADR law · #1850 (ADR 0063)
