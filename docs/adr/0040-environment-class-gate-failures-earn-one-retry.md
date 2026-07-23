# Environment-class gate failures earn one in-workflow retry; merge-site exhaustion holds the phase

**Status:** accepted (design ratified 2026-07-22; implemented by the spec and plan below)

The refiner classifies every `gate_failed` into `introduced` | `baseline` | `environment`
(**gate-failure class**) by re-running the failing gate at the classification base and, for the
`environment` verdict, re-running the *tip* green in a fresh environment. That verdict is a positive
proof — the same diff passed moments ago on a clean shell — and until this ADR the Workflow threw it
away at both gate sites. Run `war-game-benchmark-harness-2026-07-21` hit one target-repo ENOTEMPTY
race across four consecutive phases and paid for it four times:

- **Land site.** The land arm escalated straight to `held:land-failed` — its own comment asserted that
  this class of failure would pass if retried, yet no retry was attempted. Only the `baseline` class
  got an in-workflow re-land (`land:phase-<id>:baseline-proceed`). Each event cost a full Lead
  escalation-completion land, and every manual re-run went green within two attempts.
- **Merge site (the worse shape).** The merge arm escalated softly as `env-blocked` with zero fix
  rounds while siblings proceeded, so an **approved** task was silently excluded from the merged set
  and the phase completed *minus its headline deliverable*. Only the last-resort End-state gate-audit
  seat caught it (condition provably UNMET, Critical). "Task approved, merge flaked, phase reports
  done anyway" surviving to the final backstop is a design gap, not bad luck.

Full mechanics: [the design spec](../specs/2026-07-22-merge-land-resilience-design.md) §3 decisions
1–5, §4.1–§4.2, §6, and [the plan](../plans/2026-07-22-merge-land-resilience.md) Task 1.1 (both gate
sites) and Task 1.4 (this ADR + the glossary term).

## Decision

**An `environment`-classified gate failure earns exactly ONE Workflow-dispatched fresh-env re-run per
gate site — never a second, never chained with another recovery dispatch — and that re-run must go
fully green. Exhaustion at the merge site HARD-escalates so the phase holds instead of completing
minus an approved task; exhaustion at the land site falls back to today's `held:land-failed` with the
retry provably spent. No `MergeResult` status, `HARD_ESCALATION_REASONS`, or `KNOWN_LAND_DECISIONS`
member is added.**

### (A) One bounded `environment-proceed` re-run at each gate site

Both sites mirror the shape `baseline-proceed` already uses — a single refiner re-dispatch in a fresh
TMPDIR/shell, labeled `merge:<taskId>:environment-proceed` at the merge site and
`land:phase-<id>:environment-proceed` at the land site (re-detach at `origin/<working>`, re-merge
`--no-ff`, fresh-env gate, `land-advance`, the `relandDiscrimination` clause). The class definition
itself predicts the pass: the classifier already re-ran the tip green in a fresh environment. In the
observed run the retry would have gone 4-for-4.

Retrying up to `run.roundLimit` was rejected: it buys little over one attempt against a failure the
classifier already proved transient, and it breaks the symmetry with `baseline-proceed`'s
single-dispatch bound. The bound is **structural — one per gate site — not a config field**; a
retry-count knob is deferred until evidence shows one bounded retry under-recovers.

### (B) No chaining between recovery dispatches

At most one recovery re-dispatch per gate site per task/land, whichever kind it is. A
`baseline-proceed` re-merge or re-land that then fails `environment` keeps today's routing (soft
`env-blocked` / `held:land-failed`) — it does **not** earn an environment-proceed. An
`environment-proceed` whose second failure classifies `baseline` is treated as `introduced` — the same
bounded rule `baseline-proceed` already applies to its own second failure. Unbounded cascades are how
retry loops eat runs.

### (C) `environment-proceed` re-runs; it never proceeds over

The two siblings have deliberately **opposite** gate discipline. `baseline-proceed` proceeds over
named pre-existing failures and records the **baseline gate debt** as a deduped `source:'auto'`
Backstop entry ([ADR 0017](0017-packaging-floor-docker-gate-ratified-backstops.md)).
`environment-proceed` is a *re-run*: nothing here is pre-existing, so the gate must pass outright —
no `gate_failing_ids` carve-out, no `source:'auto'` backstop, no debt recorded. The refiner card's
narrow baseline carve-out is **not** widened by this change.

### (D) Merge-site exhaustion holds the phase, on a reused reason

A second `environment` classification at the merge site is a HARD escalation reusing the existing
reason `'escalate'`, which `decideLand` mirrors to `held:escalation` — **including when merged
siblings are present**. Staying soft is the defect being fixed: the phase must not report `landed`
while an approved task is missing from it. Every piece of machinery here already exists: `'escalate'`
∈ `HARD_ESCALATION_REASONS` (the same reused-reason idiom as the submodule-surfaced-on-baseline-proceed
arm), `decideLand` routes `held:escalation`, the `handoff` block stays present (degraded), and the
Lead's recovery is the existing escalation-completion land — exactly what the operator did by hand in
the observed run. Under `--afk` the Lead self-adjudicates it. The trade is intended: a held phase with
a self-explaining detail beats a silent deliverable skip.

Land-site exhaustion needs no new route — it falls back to today's `held:land-failed` (reason
`env-blocked`), whose root-cause-branched auto-recover remains the backstop, now reached only after an
in-workflow retry was actually spent.

### (E) Workflow-emitted `held:phase-incomplete` is explicitly rejected

The obvious-looking alternative for (D) — have the Workflow emit `held:phase-incomplete` — is
rejected, and the rejection is the load-bearing half of this ADR:

- It reverses a **ratified intentional gap**: `held:phase-incomplete` is canonical-but-NOT-Workflow-emitted
  — it is Lead-classified on a non-`completed` notification, and that gap is pinned by a drift guard
  ([ADR 0025](0025-drift-guard-discipline.md)).
- It would force edits to both hand-mirrored enum comment blocks plus two drift-guard tests, for a
  case an existing member already covers ([ADR 0005](0005-dead-phase-halts-the-dag.md)).
- It contradicts the term's own gloss: phase-incomplete means the Workflow *did not run to
  completion*. Here it ran to completion and reached a decision.
- It poisons the member's recovery contract. `SKILL.md` routes `held:phase-incomplete` to
  `resumeFromRunId` auto-resume under `--afk`, and a journal replay re-runs already-merged tasks'
  gates **and** the push-first CAS live — the recorded
  `never-follow-resumefromrunid-hint-after-a-land-failure` hazard, aimed straight at a phase whose
  integration tip is already complete and green.

Consequence: no task in this change touches `land-decision.mjs`, `land-decision.test.mjs`, either
hand-mirrored enum copy, or `HARD_ESCALATION_REASONS`. Finding those files unmodified is confirming
the design, not catching an omission.

## Relationship to prior ADRs

- **Leaves [ADR 0005](0005-dead-phase-halts-the-dag.md) untouched** — every new escalation reuses an
  existing reason (`'escalate'`, `'env-blocked'`) and every `landDecision` literal is already in the
  emitted set. The `gate-failure class` label routes; the status stays `gate_failed` (the same
  orthogonal-label pattern as finding `disposition`).
- **Preserves [ADR 0025](0025-drift-guard-discipline.md)** — the `held:phase-incomplete` intentional
  gap and its drift guard stay ratified, per (E).
- **Complements [ADR 0017](0017-packaging-floor-docker-gate-ratified-backstops.md)** — a
  ratified-backstop record is `baseline-proceed`'s mechanism and stays exclusive to it;
  `environment-proceed` proves the gate instead of recording debt against it (C).
- **Complements [ADR 0023](0023-land-asserts-git-ground-truth.md)** — the land-site retry sits
  *upstream* of the land-truth guard: the re-land routes through the same single `land-advance`
  chokepoint, which is unchanged. A recovered land is still `landed` only because git proved the ref
  advanced.
- **Does not weaken [ADR 0024](0024-audit-gate-verdicts-integrated-tip-captured-evidence.md)** — the
  environment-proceed re-merge threads `gateCaptureClause`/`gate_log_path` and `integration_sha` the
  way the primary merge prompt does, so a retried merge keeps its evidence chain into the post-merge
  gate-audit; the re-land mirrors the primary land prompt, which threads no capture clause.

## Considered options

- **Zero retries (status quo) vs. one vs. `roundLimit` (chosen: one).** Zero is the defect. `roundLimit`
  buys little against a classifier-proven transient and breaks the `baseline-proceed` symmetry.
- **Stay soft on merge-site exhaustion (chosen: hard).** Soft is precisely the observed failure — an
  approved task silently dropped from a phase that reported success.
- **Workflow-emitted `held:phase-incomplete` vs. the reused `'escalate'` (chosen: reused).** See (E).
- **Proceed-over vs. full green for the retry (chosen: full green).** A re-run has no pre-existing
  debt to carve out; proceeding over would launder a real failure through the environment class.
- **Allow cascading recovery dispatches (chosen: no).** One recovery per gate site keeps the worst case
  bounded and legible.
- **A retry-count config knob (chosen: no).** Structural ONE first; a knob only if evidence shows it
  under-recovers.

**Residual, accepted:** the `REL_GUARD_PRECONDITION_FAILED` short-circuit classifies `environment`
*without* a fresh-env tip re-run, so a retry triggered by that marker has weaker pass-prediction than
a classifier-proven transient. It stays bounded at one, with identical exhaustion routes; the phase
report carries the marker line uncurated in `gate_output` for operator inspection.

## References

- Design spec: [`docs/specs/2026-07-22-merge-land-resilience-design.md`](../specs/2026-07-22-merge-land-resilience-design.md)
  — §3 decisions 1–5, §4.1 (merge site), §4.2 (land site), §6 (the **environment-proceed** term),
  §10 validation criteria 1–4.
- Implementation plan: [`docs/plans/2026-07-22-merge-land-resilience.md`](../plans/2026-07-22-merge-land-resilience.md)
  — Task 1.1 (both gate-site arms + the refiner card), Task 1.4 (this ADR, the `CONTEXT.md` term, the
  ADR 0023 amendment).
- Red-team report: [`docs/red-team/2026-07-22-merge-land-resilience.md`](../red-team/2026-07-22-merge-land-resilience.md)
  — CLEARED-WITH-NOTES over 3 rounds; adjudication 8 governs this ADR's number ("next free above the
  live set", resolved at implementation time).
- `CONTEXT.md` — **environment-proceed**, **gate-failure class**, **baseline gate debt**.
