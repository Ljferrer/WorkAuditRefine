# Red-team grades plan-vs-state by artifact-kind; deliverable-absence is a non-defect

**Status:** accepted (design ratified 2026-07-08; implemented by the spec and plan below)

`/red-team` proves a plan *can be applied*, not that it already was — but its `claims-vs-reality`
lens kept grading a plan's *not-yet-built* deliverables as defects. A plan promising to add a symbol,
a test, or a file was probed against the current repo, the symbol was legitimately absent (the plan
had not run yet), and the probe scored a Critical. The recorded misfire is 16 false findings from one
impl-plan run flipping the verdict to BLOCKED ([[redteam-claims-vs-reality-misfires-on-impl-plans]]).
The only defence was an **analyzed-only** `preconditionRule` preamble (#311) — prose a probe's ambient
context could talk itself out of, and never present on executed probes at all. Full mechanics:
[the design spec](../specs/2026-07-08-red-team-plan-vs-state-grading-and-probe-sandboxing-design.md) §3–§4
and [the plan](../plans/2026-07-08-red-team-plan-vs-state-grading-and-probe-sandboxing.md).

## Decision

**`/red-team` grades plan-vs-state by artifact-kind, and deliverable-absence is a non-defect enforced
mechanically — not by preamble prose.**

1. **Artifact-kind is computed once and threaded into every probe.** The Lead pre-flight classifies the
   artifact into an `artifactKind` (`impl-plan` / `tdd-plan` / `design-doc` / `prd`) alongside the
   fingerprint, and threads it into every probe prompt (spine and bespoke) as `args.artifactKind` — the
   `fingerprint.titleLine` fail-loud precedent. The default when the arg is absent is `impl-plan`, the
   **suppression-safe** choice: a real impl-plan mis-defaulted still suppresses only future-work
   absence, while the reverse (an impl-plan tagged `design-doc`) is the direction that re-opens the
   false-Critical misfire, so the default leans toward the plan that has deliverables to suppress.

2. **The future-work rule is artifact-kind-aware and covers executed probes too.** The analyzed-only
   `preconditionRule` generalizes into a `futureWorkRule` prepended to **all** probes at the composition
   site — analyzed *and* executed. For an `impl-plan`/`tdd-plan`, a claimed-but-unbuilt symbol/test/file
   is the expected deliverable baseline, never a finding; for a `tdd-plan` specifically, a shipped test
   running **red pre-implementation is `status:"pass"`**, not a defect.

3. **Deliverable-absence is a typed flag the gate never blocks on — the gate stays pure.** A probe that
   determines an "absent" symbol is mapped by `coverage-vs-source` to a plan task sets the optional
   `deliverableAbsence: true` finding flag. `classify()` excludes any `deliverableAbsence === true`
   finding from `blockers` regardless of severity or probe status (it may still surface as a minor/note),
   so `verdict()` never returns `BLOCKED` purely on deliverable-absence counts. The gate keys on the
   **typed flag only** — no NLP on `reality` strings (spec constraint 2). This is the mechanical layer the
   prose preamble never was.

4. **The retained-findings carve-out is preserved.** A false claim about **EXISTING** code — a missing
   anchor, a wrong signature, a drifted line number, a contradiction — is not absence-shaped and still
   blocks. Deliverable-absence suppresses the *baseline future-work* class, nothing else.

## Relationship to prior ADRs

- **Refines, does not replace, [ADR 0013](0013-commanders-intent-and-disposition-routing.md).** 0013's
  finding-severity and disposition-routing model is untouched; this ADR narrows *what counts as a
  finding at all* for a plan graded against a not-yet-mutated repo. The coupling is noted in 0013's
  Decision rows (the ADR-policy-table under-attribution duty, [[adr-policy-table-entry-vs-mechanism-attribution]]).
- **Sibling of [ADR 0033](0033-executed-probes-behind-escape-guard.md)** — the same spec ratifies both;
  0032 makes the *grading* trustworthy (future-work is not a defect), 0033 makes the *execution*
  trustworthy (a probe cannot escape its sandbox).

## Considered options

- **Keep the analyzed-only prose preamble (rejected).** Prose a probe's ambient context can defeat, and
  absent from executed probes entirely — exactly the surface that produced the 16-false-findings BLOCKED.
- **Parse `reality` strings in the gate to detect "absent because not built yet" (rejected).** NLP in
  the gate is impure and fragile; the typed `deliverableAbsence` flag moves the judgment to the probe
  (which has the coverage map) and keeps `classify()` a pure function of typed inputs.
- **A gate-side version/artifact-kind comparator (out of scope).** The gate blocks on the typed flag; it
  does not itself classify artifacts or mine prose.

## Consequences

- **Deliverable self-tagging trust is a declared backstop.** A probe wrongly tagging a *genuine*
  precondition-missing anchor as a deliverable would hide a real defect. The flag is honored only for
  `impl-plan`/`tdd-plan`, and the retained-findings carve-out is not absence-shaped; full adjudication of
  tag honesty is a judgment act run by the confirm loop, not mechanically proven.
- **`artifactKind` misclassification is operator-eyeballed.** The Lead reports the computed kind in the
  run header; the suppression-safe default plus the benign forward direction bound the blast radius.
- **A D7 drift-guard pins the demotion set.** The pass-only demotion set (`{'pass'}`) and the
  two-contract sentence are pinned on both `workflow-scaffold.js` and `references/lenses.md` — a
  guarded-invariant addition, not a separate ADR.

## References

- Design spec:
  [`docs/specs/2026-07-08-red-team-plan-vs-state-grading-and-probe-sandboxing-design.md`](../specs/2026-07-08-red-team-plan-vs-state-grading-and-probe-sandboxing-design.md)
  §3 (design tree), §4 (mechanics), §6 (terms), §10 (validation criteria).
- Implementation plan:
  [`docs/plans/2026-07-08-red-team-plan-vs-state-grading-and-probe-sandboxing.md`](../plans/2026-07-08-red-team-plan-vs-state-grading-and-probe-sandboxing.md).
- [ADR 0013](0013-commanders-intent-and-disposition-routing.md) — the finding-severity / disposition
  model this ADR refines.
- [ADR 0033](0033-executed-probes-behind-escape-guard.md) — the sibling execution-trust decision from
  the same spec.
- Memory lesson (the originating misfire): [[redteam-claims-vs-reality-misfires-on-impl-plans]].
