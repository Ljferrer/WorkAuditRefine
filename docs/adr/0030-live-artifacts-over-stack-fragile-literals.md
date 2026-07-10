# Plans reference live artifacts, never stack-fragile literals; auditors calibrate the inert-slice patterns

**Status:** accepted (design ratified 2026-07-08; implemented by the spec and plan below)

A WAR plan is drafted against a base that keeps moving as earlier stacked tasks land into the integration
tip (the stack-and-plow branch model, [ADR 0011](0011-campaign-stack-and-plow-branch-model.md)). Any
*literal* the plan or a task prompt pins to that base rots the instant the base advances, and the
resulting plan↔candidate divergence looks like scope creep to an auditor who re-adjudicates it from
scratch every pass. Two coupled classes recur across the servitor's memory:

- **Class A — stack-fragile literals.** Line-range refs (`:N-M`) that point at the wrong lines after an
  intervening land; `*.test.sh` gate enumerations and hardcoded suite counts ("run ALL FIVE") that stale
  when a stacked task adds a runner; mirrored-constant final arrays restated in prose after the canonical
  export was appended to; flat-key abbreviations (`provenance:`) of nested YAML paths that never match a
  real file; hardcoded release version literals that lag the operator's next-free-patch target (recurred
  seven times, v0.8.6 → v0.14.11). A prompt is worse than a plan doc here — it is executed literally, so a
  wrong count makes the worker stop short of the real set.
- **Class B — auditors misgrade correct-but-stale-looking patterns.** A foundation task's constant/field
  added before its emitter lands (`defined-but-not-yet-emitted`); a plan file-list entry the diff never
  touches because the guard's real home is elsewhere, or a drift-guard-forced cascade touch; a
  grep-sweep that misses same-meaning siblings encoded in different words. Each is re-litigated per seat,
  per pass, often blocking a candidate that is in fact correct.

The self-discovery mechanism the fix wants already exists — `resolveGate(declaredGate)` in
`skills/war/assets/war-config.mjs` runs *every* discovered `*.test.sh` regardless of any plan literal.
The gap was authoring discipline: nothing routed authors to reference the live artifact, and nothing
standing named the Class B patterns so auditors stopped re-deriving them. Full mechanics:
[the design spec](../specs/2026-07-08-plan-and-prompt-literal-brittleness-and-auditor-calibration-design.md)
and [the plan](../plans/2026-07-08-plan-and-prompt-literal-brittleness-and-auditor-calibration.md).

## Decision

**A plan or prompt references the live artifact, never a value pinned to the drafting base.** The ratified
authoring forms, threaded into the `/war-strategy` plan template (§2) and locked verbatim by
`war-strategy-structure.test.sh`:

- **Construct locators** over line ranges — name the enclosing symbol or comment header plus a change
  description; reserve `:N-M` for a flat config file with no named construct, qualified "approx., measured
  at base `<sha>`".
- **The self-discovery gate by name** — reference `resolveGate` in `war-config.mjs` (or "run ALL
  discovered `*.test.sh`"); never enumerate suites or state a suite count.
- **Append to the canonical export** — "add `<value>` to the canonical export; the drift guard is the
  arbiter"; never restate the final array literal.
- **Dotted paths** for nested keys (`metadata.provenance`), never a flat abbreviation.
- **Next free patch above the live base** for release tasks, resolved at land time; never a hardcoded
  `v<semver>`.
- The standing **"defined-but-not-yet-emitted; produced in Task N"** annotation on any cross-slice
  mirrored constant/schema/prose-ref whose emitter is a later task.
- The **grep-as-floor** note — "grep X, handle every match" requires a manual same-scope title/comment
  survey; stragglers are survey-derived corrections.

These conventions are backed by an **advisory `plan-literal-lint.mjs`** (regex, modeled on
`war-memory.mjs`'s `LINT_PATTERNS`/`lint()` shape) that flags the four cheap literals — line ranges,
`*.test.sh` gate lists, suite counts, and `v<semver>` in a release task. It is **fail-open by decision**:
report-and-exit-0, `--strict` opt-in, run by `/war-strategy` on the plan it authors and by `/red-team`'s
spine — **never a CI gate** (the only CI job stays the memory redaction lint). Advisory precisely because a
legitimately-cited baseline version can false-positive; a false hit costs a glance, not a block.

**Auditors carry four `stale-looking-but-correct` calibration rules**, written once into the standing
`agents/war-auditor.md` surface (the primary carrier — the inline gate-audit seats never call
`auditPrompt()` and receive base clauses only via the standing file) and mirrored into `auditPrompt()`,
with a both-surfaces drift test in `workflow-template.test.mjs`:

1. **Line/gate/version literal drift** — a plan↔candidate divergence on a line range, suite count, or
   version bump is a Nit at most when the construct / self-discovery gate / worktree baseline confirms the
   candidate correct; never a hold.
2. **Defined-but-not-yet-emitted** — a dangling ref at a task tip is a defect **only if** the plan lacks
   the "produced in Task N" cross-link; with it, grade Nit/`note` and confirm at the post-merge
   integration tip.
3. **File-list location gap / cascade** — when a plan file-list entry is untouched, confirm the guard's
   real home (grep the sibling/precedent) before flagging; a location gap or a drift-guard-forced cascade
   touch is a faithful deviation (Nit), not scope creep — block only on a demonstrably-untrue claim.
4. **Grep-sweep floor** — a grep sweep is a floor; confirm the plan carried a same-scope manual survey
   before treating a surviving sibling as the worker's omission rather than a plan-authoring gap.

**Each rule demotes only when the live artifact confirms benignity — never a blanket amnesty.** A
demonstrably-untrue claim still blocks. The drift test locks the *presence* of the "only when the live
artifact confirms" qualifier on both surfaces so a future edit cannot silently widen a rule into an
unconditional downgrade.

**The cross-slot version test is the enforced form of the manual release-audit protocol.** It asserts
`plugin.json.version === marketplace.json.metadata.version === marketplace.json.plugins[0].version` and
that `README.md`'s `## Status` line contains that string, converting a silent partial-bump no-op into a
red test. This ADR records the doctrine only; the test itself ships as `version-slots.test.mjs` in the
drift-guards plan ([ADR 0025](0025-drift-guard-discipline.md)), which owns the four-slot lock-step guard —
this spec dropped its duplicate `version-consistency.test.mjs` to avoid two tests for one lesson.

## Relationship to prior ADRs

- **Operates within [ADR 0008](0008-git-is-the-resume-source-of-truth.md) — git is the ground truth, plan
  literals are advisory.** Every convention here resolves the *live* artifact and treats the plan/prompt
  literal as approximate; nothing inverts that ordering (repair records toward git, never the reverse).
- **Reuses [ADR 0013](0013-commanders-intent-and-disposition-routing.md)'s disposition routing** — the
  four calibration rules grade via the existing severity/`disposition` mechanism (Nit/`note`), adding no
  new routing axis; they are floors with a locked confirmation qualifier, the floor-not-ceiling shape
  already in CONTEXT.md.
- **Rides [ADR 0006](0006-deterministic-test-floor.md)'s self-discovery gate** — the "reference
  `resolveGate` by name, never a suite literal" convention routes authors *to* the existing deterministic
  gate; it changes neither `resolveGate` nor the gate mechanism.
- Historical ADRs are superseded, never edited; this ADR extends their surfaces without contradicting them.

## Considered options

- **Advisory lint versus a CI-blocking plan lint (chosen: advisory).** Plans live in `docs/plans/` and are
  not part of the `/war` gate; the version-literal pattern can false-positive on a legitimately-cited
  baseline. A hard gate is deferred pending a false-positive burn-in; the only CI job stays the redaction
  lint. (`// ponytail:` a single regex module, no AST.)
- **A prose "please don't" versus a mechanical lint for the cheap literals (chosen: lint).** Where a
  literal is cheaply detectable (line ranges, `*.test.sh` lists, suite counts, version skew) a lint beats
  a convention. Where detection needs semantic judgment (matrix-cell completeness, grep-sweep sibling
  survival) enforcement stays an authoring convention — a matrix row-count lint is a deferred non-goal.
- **Re-deriving the inert-slice patterns per seat versus standing calibration (chosen: standing).**
  Writing the four rules once into the auditor surface stops the per-pass re-litigation that filed the
  same Nit 5× across serial worker + gate-audit passes.

## Consequences

- `skills/war-strategy/SKILL.md` §2 gains the "reference the live artifact" convention block (six rules +
  the defined-but-not-yet-emitted annotation), verbatim-locked by `war-strategy-structure.test.sh`.
- A new `skills/war-strategy/assets/plan-literal-lint.mjs` (+ test) flags the four cheap literals,
  advisory and fail-open, run at conversion and in the red-team spine.
- `agents/war-auditor.md` and `auditPrompt()` gain the four calibration rules under a both-surfaces drift
  test anchored on casing/position-stable mid-sentence phrases (never a quote-bearing byte literal).
- `/war-machine` emits a next-free-patch release directive; `/survey-corps` and `/war-strategy` carry the
  grep-as-floor note so the discipline exists from the first authoring surface.
- `CONTEXT.md` gains a `### Live artifacts over stack-fragile literals` subsection defining five terms —
  **Construct locator**, **Stack-fragile literal**, **Defined-but-not-yet-emitted slice**,
  **Grep as floor**, **Stale-looking-but-correct calibration**.
- Named residuals (deferred backstops): live calibration obedience, lint false-positive precision,
  matrix row-count completeness, and grep-sweep sibling survival — each with a named runner (a `/war` run,
  `/war-strategy` conversion reports, `/red-team`, the auditor's `test-fidelity` lens), never waived in
  prose ([ADR 0017](0017-packaging-floor-docker-gate-ratified-backstops.md)).

## References

- Design spec:
  [`docs/specs/2026-07-08-plan-and-prompt-literal-brittleness-and-auditor-calibration-design.md`](../specs/2026-07-08-plan-and-prompt-literal-brittleness-and-auditor-calibration-design.md)
  — the two friction classes, the resolved design tree, the mechanics (§4), and the validation criteria.
- Implementation plan:
  [`docs/plans/2026-07-08-plan-and-prompt-literal-brittleness-and-auditor-calibration.md`](../plans/2026-07-08-plan-and-prompt-literal-brittleness-and-auditor-calibration.md).
- [ADR 0008](0008-git-is-the-resume-source-of-truth.md) — git is resume ground truth; plan literals are advisory,
  the live artifact is authoritative.
- [ADR 0013](0013-commanders-intent-and-disposition-routing.md) — the intent/disposition routing the
  calibration rules reuse; the floor-not-ceiling shape.
- [ADR 0006](0006-deterministic-test-floor.md) — the deterministic test floor and the `resolveGate`
  self-discovery gate the convention routes authors to reference by name.
- [ADR 0025](0025-drift-guard-discipline.md) — owns `version-slots.test.mjs`, the enforced cross-slot
  version guard this ADR records as doctrine.
