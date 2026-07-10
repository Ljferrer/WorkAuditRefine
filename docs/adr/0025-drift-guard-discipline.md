# Every duplicated or asserted fact carries a mechanical drift-guard to its canonical source

**Status:** accepted (design ratified 2026-07-08; implemented by the spec and plan below)

WAR is riddled with facts stated in one surface that live canonically in another and rot silently
against ground truth because **nothing binds the copy to its source**. The failure is uniform: a green
gate, a green audit, and a green `node --test` run all pass identically whether the two surfaces agree
or have drifted, because every existing check is either *presence-only* ("this surface contains the
anchor phrase") or *well-formedness-only* ("this JSON parses"). Drift stays invisible until a manual doc
sweep re-diffs the referents by hand — the exact labor this repo keeps paying. Twelve recorded frictions
are one class through twelve lenses: inlined constants the Workflow sandbox cannot `import` and that land
without their guard (`HARD_ESCALATION_REASONS`, `KNOWN_LAND_DECISIONS`, and the `war-config.mjs` roster
helpers mirrored into `workflow-template.js`); the two behavior surfaces per agent (standing `agents/*.md`
vs the dispatched prompts string-built in `workflow-template.js`, with the gate-audit seats building
prompts inline outside `auditPrompt()`); presence-not-identity doc contracts (the CLAUDE.md pointer line
asserted merely *present* per surface, never *equal* across them); default-flip and preset doc rot; four
version slots bumped by convention with no cross-slot check; and prose asserting code facts with no guard
(ADR policy-table under-attribution, comments lagging a rewrite, a `held:*` classifier example
contradicting its own routing predicate, a "shell out to X" idiom mislabeling an in-process export, a
tour step freezing a false structural count). Full mechanics:
[the design spec](../specs/2026-07-08-drift-guards-for-mirrored-and-asserted-facts-design.md) and
[the plan](../plans/2026-07-08-drift-guards-for-mirrored-and-asserted-facts.md).

## Decision

**Every fact WAR duplicates across surfaces, or asserts in prose about a canonical code construct,
carries a mechanical test that binds it to its canonical source — extraction + equality (`deepEqual` /
byte-`===`), never presence.** A presence check (asserting an anchor phrase exists) or a well-formedness
check (asserting JSON parses) is explicitly *not* a drift-guard and does not discharge the obligation.
The guard reads the canonical source — a code export, a JSON field, a routing predicate — and the mirror
site, and asserts they are equal; it anchors both targets by regex/name extraction, never line number
(repo law — line numbers rot across the serial merge queue).

Where a fact resists a cheap mechanical bind, there are exactly two ratified escapes, and prose-hope is
not one of them:

1. **Rewrite the fact so it cannot rot.** Narrative/tour prose asserts the *invariant* and names the
   guard that holds it ("these arrays are kept identical by the mirror-registry drift-guard"), never the
   snapshot count/divergence that rots ("differ by exactly one entry"). This extends the existing "cite
   the section that DEFINES a mechanism" discipline to narrative prose.
2. **Make the obligation an explicit, checkable auditor-lens duty.** Where grep structurally cannot see
   the drift (ADR policy-table *under*-attribution; a comment lagging a rewrite), the check becomes a
   standing duty on the auditor's cascading-impact lens, mirrored onto both its standing card and its
   dispatched prompt — not a hope, and not a blocking script that would fire on every incidental rename.

**The registries are the deliberate ceiling.** The set of guarded (canonical → mirror) pairs is an
**explicit mirror registry**, and the set of correctness-critical both-surface directives is an
**explicit both-surfaces directive registry** — each a listed set; adding a mirror or a directive means
adding a row. This is the ratified alternative to a generic AST/import-graph scanner that would
auto-discover every inline copy of every export: that scanner is a research project whose failure mode is
a false sense of coverage (`// ponytail:` the registry as the ceiling; upgrade only on recurrence). The
residual gap — a NEW mirror landing without a registry row — is closed by doctrine, not code: a
`/war-strategy` plan-authoring rule (a mirror and its registry row land as one task) and a `/red-team`
spine probe, exercised at every conversion and every red-team.

This supersedes the byte-identity-by-convention posture of the pointer-line and version-slot conventions
recorded in `CLAUDE.md` / `## Commands`: those conventions are now mechanically enforced (a cross-surface
byte-identity test; a four-slot lock-step test), not honored by hand.

## Relationship to prior ADRs

- **Operates within [ADR 0017](0017-packaging-floor-docker-gate-ratified-backstops.md) — a drift-guard
  is a *gate member*.** ADR 0017 requires every validation to live in the gate, a floor, or the ratified
  backstops section, or the Lead escalates. A drift-guard is mechanical gate enforcement, which ADR 0017
  prefers over prose; the residual per-change checks (default-flip OLD-absent, comment-lag) are declared
  **backstops** with named runners (the `/war-strategy` rule, the red-team probe, the auditor lens),
  never waived in prose.
- **Leaves [ADR 0005](0005-dead-phase-halts-the-dag.md) untouched** — the mirror registry *reads*
  `HARD_ESCALATION_REASONS` and `KNOWN_LAND_DECISIONS` as canonical; it adds **no** new status,
  `HARD_ESCALATION_REASONS`, or `KNOWN_LAND_DECISIONS` member, so the hand-mirrored enum and its
  discipline are byte-unchanged.
- **Leaves [ADR 0006](0006-deterministic-test-floor.md) and
  [ADR 0013](0013-commanders-intent-and-disposition-routing.md) untouched** — new drift-guards ride the
  existing deterministic gate (0006); the auditor-lens duties route by the existing `disposition`
  mechanism (0013), adding no new routing axis.
- Historical ADRs are superseded, never edited.

## Considered options

- **One ADR versus twelve per-friction records (chosen: one).** The twelve recorded frictions are one
  policy seen through twelve lenses; recording the discipline once — with the two-registry ceiling and
  the two escape rules — keeps the "why extraction, why a registry, why prose is not enough" rationale in
  one place.
- **A generic AST / import-graph scanner (rejected — the registry is the ceiling).** Auto-discovering
  every inline copy of every canonical export is a research project whose failure mode is a false sense
  of coverage. Explicit registries plus a `/war-strategy` rule plus a red-team probe are the ratified
  ceiling; the scanner is revisited only if unguarded-mirror recurrences continue after this lands.
- **A blocking comment-lag script (rejected — advisory / auditor-lens).** "Old term" is per-change; a
  blocking `.test.sh` would fire on every incidental rename (a poor gate citizen — the gate is
  pass/fail). Comment-lag is a worker-prompt directive plus the auditor's cascading-impact lens, not a
  script.

## Consequences

- A mirror and its registry row land as **one task** — an unguarded new mirror is a plan defect the
  `/war-strategy` rule and the red-team spine probe reject.
- The four release slots (`plugin.json#version`, `marketplace.json#metadata.version`,
  `marketplace.json#plugins[0].version`, `README.md ## Status`) gain a fail-closed lock-step test; a
  partial bump now turns the gate red instead of shipping a silently inconsistent release.
- `CONTEXT.md` gains a `### Drift-guard discipline` subsection defining five terms — **Drift-guard**,
  **Canonical source vs mirror site**, **Mirror registry**, **Both-surfaces directive registry**,
  **Mechanism-style narrative**.
- The doctrine ships to marketplace-pinned users via a version bump of the four release slots.
- Named residual: mechanical detection of a *missing* registry row is out of scope (the rejected AST
  scanner) — the doctrine's forcing functions are the plan-authoring rule and the red-team probe,
  exercised from this plan onward.

## References

- Design spec:
  [`docs/specs/2026-07-08-drift-guards-for-mirrored-and-asserted-facts-design.md`](../specs/2026-07-08-drift-guards-for-mirrored-and-asserted-facts-design.md)
  — the twelve frictions, the resolved design tree (#1–#12), the mechanics, and the validation criteria.
- Implementation plan:
  [`docs/plans/2026-07-08-drift-guards-for-mirrored-and-asserted-facts.md`](../plans/2026-07-08-drift-guards-for-mirrored-and-asserted-facts.md).
- [ADR 0017](0017-packaging-floor-docker-gate-ratified-backstops.md) — validation must live in
  gate/floor/backstops or escalate; a drift-guard is the mechanical gate member this ADR prefers.
- [ADR 0005](0005-dead-phase-halts-the-dag.md) — the enum discipline (`HARD_ESCALATION_REASONS` /
  `KNOWN_LAND_DECISIONS`) the mirror registry reads as canonical and leaves unchanged.
- [ADR 0013](0013-commanders-intent-and-disposition-routing.md) — the `disposition` routing the
  auditor-lens duties reuse.
- Memory lessons (the originating friction cluster): [[version-slots-no-cross-slot-consistency-test]],
  [[run-provision-config-not-yet-mirrored-into-template]], [[standing-instruction-vs-dispatched-prompt-coverage-split]],
  [[gate-can-assert-mirrored-clause-presence-without-asserting-byte-identity]], [[default-flip-must-audit-all-doc-surfaces]],
  [[doc-truth-sweep-must-check-presets-not-just-defaults]], [[release-bump-slots-canonical-no-badge]],
  [[adr-policy-table-entry-vs-mechanism-attribution]], [[source-comment-lags-emitted-prompt-after-rewrite]],
  [[held-workflow-error-infra-death-prose-mismatch]], [[uniform-shell-out-idiom-mislabels-export-only-function-as-cli-subcommand]],
  [[tour-narrative-can-assert-a-false-code-fact-that-survives-until-a-doc-sweep-catches-it]].
