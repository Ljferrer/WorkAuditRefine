# Gate self-discovery composition is engine-owned, not a Lead prose duty

**Status:** accepted (design ratified 2026-07-14; implemented by the spec and plan below)

`resolveGate()` in `skills/war/assets/war-config.mjs` composes a declared gate with a `find`-based
`*.test.sh` discovery-and-run loop, but its only call site was the `--resolve-gate` CLI flag.
`skills/war/assets/workflow-template.js` had **zero** `resolveGate` call sites and interpolated raw
`${plan.gate}` at all nine gate-bearing dispatch sites. The only thing making the dispatched string
self-discovering was `skills/war/SKILL.md` Setup step 3 telling the Lead to pre-resolve before every
run — a prose contract the lesson evidence proves fails silently (five identical gate-audit findings
across five seats in one hooks-diff phase, 2026-07-12/13). When it fails, the executed gate is JS-only:
a shell-suite regression cannot fail a merge, and every captured gate-evidence artifact is structurally
shell-blind. Full mechanics:
[the design spec](../specs/2026-07-14-gate-evidence-and-prose-truth-design.md) §3–§4.1 and
[the plan](../plans/2026-07-14-gate-evidence-and-prose-truth.md) Task 1.1.

## Decision

**The dispatched gate string is composed by the engine's own gate composition point — idempotent,
hand-mirrored inline per the sandbox-cannot-import rule, drift-guarded by the existing D2 mirror
registry — not by a Lead prose duty alone. The Lead's Setup pre-resolution is retained as an advisory
belt; it is no longer the enforcement.**

1. **Composition moves into the engine.** Immediately after entry validation, a single **gate
   composition point** in `workflow-template.js` normalizes `plan.gate` once, in place, to its
   self-discovering form via a hand-mirrored inline copy of `resolveGate` (the Workflow sandbox cannot
   `import`). Every gate-bearing dispatch site downstream renders the composed string without itself
   changing.

2. **Idempotence makes the belt-and-suspenders safe by construction.** `resolveGate(declaredGate)`
   detects the discovery-clause token already present in its input and returns it byte-unchanged;
   absent, it composes exactly as before. This is what lets the gate be composed **twice** — once at
   Lead Setup pre-resolution, once at the engine's composition point — without appending a second
   `*.test.sh` discovery loop; the second application is a no-op.

3. **The Lead's Setup pre-resolution is retained, demoted from sole enforcement to advisory belt.**
   `skills/war/SKILL.md` Setup step 3 still instructs `--resolve-gate` pre-resolution — it is where
   `overrides.gate` and docker-build strings get composed and operator-confirmed, and it stays valuable
   for that visibility. It is no longer the only thing standing between a declared gate and a
   shell-blind dispatch: a missed pre-resolution can no longer produce one, because the engine composes
   regardless.

4. **Rejected alternative: fail-closed entry validation on `plan.gate`.** Requiring `plan.gate` at
   entry validation (alongside the phase-identity fields) and halting `held:workflow-error` on its
   absence was considered and rejected. It converts a *silent evidence-loss* failure mode into a
   *run-blocking* one without removing it: the actual composition duty would still sit on the Lead's
   prose-followed Setup step, now merely enforced by a halt instead of degrading quietly. Engine-owned
   composition removes the failure mode outright — there is no missed step left to guard against.

5. **Drift-guarded by the existing mirror-registry doctrine, not a new mechanism.** The inline mirror
   is bound to the canonical `resolveGate` by a new behavioral row in the existing D2 mirror registry
   (`workflow-template.test.mjs`) — the established **Mirror registry** / **Canonical source vs mirror
   site** doctrine (CONTEXT.md), not a bespoke drift check invented for this decision.

6. **Amends the F12 self-discovering-gate decision's enforcement path, not its gate semantics.** [F12](../specs/2026-06-25-F12-multi-runner-gate-design.md)
   (implemented by the verification-layer-integrity plan) decided that the gate enumerates every
   discovered runner and that the refiner runs the full resolved gate verbatim — both hold unchanged
   here. What F12's implementation left open is *how the dispatched string becomes self-discovering in
   the first place*: it added `resolveGate()` and its CLI flag but never wired a call site into the
   engine's own dispatch path, leaving that step to Lead prose. This ADR closes that gap; it does not
   revisit F12's runner-enumeration or refiner-verbatim-run decisions.

## Considered options

- **Keep the status quo — prose-only enforcement via SKILL.md Setup step 3 (rejected).** The exact
  defect this ADR fixes: five identical gate-audit findings across five seats in one hooks-diff phase
  prove the prose contract fails silently in practice, not just in theory.
- **Fail-closed entry validation on `plan.gate` (rejected — see Decision 4).** Turns a silent gap into
  a loud one without closing it; the Lead's pre-resolution duty remains the only composition path.
- **Compose at each of the nine dispatch sites individually, instead of once near entry (rejected).**
  Nine call sites are nine places to keep in sync and nine chances for a partial fix to miss one; a
  single composition point immediately after entry validation lets all nine interpolations stay
  untouched in source while all render the composed string.
- **A non-idempotent composition (rejected).** Without idempotence, composing both at Lead Setup and at
  the engine's composition point would append the discovery loop twice, running every shell suite twice
  per gate invocation — correct but needlessly slow, and a trap for any third future caller.
- **A new automatic mirror-detector for the inline copy (rejected).** The repo's ratified mirror
  registry (an explicit, listed set of canonical-export → mirror-site pairs, each carrying its own
  drift-guard) already covers exactly this shape; inventing a second detection mechanism for one more
  mirror would duplicate existing doctrine for no gain.

## Consequences

- **A missed Lead Setup pre-resolution can no longer produce a shell-blind gate.** The engine's gate
  composition point is now the enforcement; Setup pre-resolution is a belt over it, not the sole
  safeguard.
- **`resolveGate`'s contract widens to admit repeated composition.** Any present or future caller may
  invoke it more than once on the same value safely — idempotence is now a documented part of its
  header contract, not an incidental property.
- **The Lead's `--resolve-gate` step keeps its operator-visibility value** (composing `overrides.gate`
  and docker-build strings, confirmed before a run) even though it is no longer load-bearing for
  correctness.
- **A prose-truth debt is opened, not closed, by this ADR.** Prose across `docs/specs/`, `SKILL.md`,
  and `agents/war-refiner.md` describing the old prose-only enforcement now needs re-verification
  against engine composition; that sweep is this ADR's own spec's Phase 2 (tracked by the new
  **Spec-truth guard** CONTEXT.md term) and is not this ADR's concern.
- **No enum, escalation-surface, or `land-decision.mjs` change.** This is a composition-site relocation
  inside `workflow-template.js` plus an idempotence property on an existing pure function — it adds no
  new task/phase status and touches none of `HARD_ESCALATION_REASONS`, `KNOWN_LAND_DECISIONS`, or
  `defectClass` (ADR 0005).

## References

- Design spec: [`docs/specs/2026-07-14-gate-evidence-and-prose-truth-design.md`](../specs/2026-07-14-gate-evidence-and-prose-truth-design.md)
  §2 (pivotal constraints), §3 (design tree), §4.1 (mechanics), §6 (domain terms), §7 (this ADR), §9
  (non-goals), §10 (criteria).
- Plan: [`docs/plans/2026-07-14-gate-evidence-and-prose-truth.md`](../plans/2026-07-14-gate-evidence-and-prose-truth.md)
  Task 1.1 (the engine slice this ADR records) and Task 1.2 (this ADR).
- [F12 — Multi-runner gate resolution design](../specs/2026-06-25-F12-multi-runner-gate-design.md) — the
  self-discovering-gate decision this ADR amends: F12's runner-enumeration and refiner-verbatim-run
  decisions (D1, D3) are unchanged; only the composition-enforcement path changes.
- [ADR-0006 — a deterministic test-floor guards every task that requires a test](0006-deterministic-test-floor.md) —
  the sibling **Floor⊆gate parity** test asserts against `resolveGate`'s canonical output string;
  unaffected here since idempotent composition leaves that contract intact for a plain gate.
- [ADR-0025 — every duplicated or asserted fact carries a mechanical drift-guard to its canonical source](0025-drift-guard-discipline.md) —
  the mirror-registry doctrine the new inline `resolveGate` copy follows rather than reinventing.
- [ADR-0005 — a dead phase halts the DAG](0005-dead-phase-halts-the-dag.md) — the enum sets this ADR
  leaves untouched (Decision 4, Consequences).
