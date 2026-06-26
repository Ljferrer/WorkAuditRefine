# F07 — Guard mirrored *logic*, not just constants — Design

**Status:** proposed — targets **v0.5.1** (test/hardening). **Severity: MEDIUM.**
**Source:** agent-architecture-audit F7 · relates to `run-provision-config-not-yet-mirrored-into-template`.

## Problem — the data is drift-guarded; the logic is not

Because the Workflow sandbox can't `import`, `workflow-template.js` re-implements canonical logic inline. The
**constants** are well guarded — [war-config.test.mjs:221-262](../../skills/war/assets/war-config.test.mjs)
regex-extracts `ROLE_MODEL`, the fallback lenses, and `HARD_ESCALATION_REASONS` and pins them to source. But the
**decision logic** is duplicated and **not** behaviorally asserted:

- `decideLand` branch logic ([workflow-template.js:292-295](../../skills/war/assets/workflow-template.js) vs
  [land-decision.mjs:11-16](../../skills/war/assets/land-decision.mjs)),
- `spawn()` vs `spawnOpts` ([war-config.mjs:112-116](../../skills/war/assets/war-config.mjs)),
- the coven lens rotation vs `covenSeats` ([war-config.mjs:142-146](../../skills/war/assets/war-config.mjs)).

A logic change in a canonical module won't be caught by the data-only guards.

## Decisions

- **D1 — Behavioral drift tests.** Add tests that import the canonical module and assert the template's inline
  implementation matches across an input table, for `decideLand`, `spawnOpts`/`spawn`, and `covenSeats`. The test
  harness already loads `templateText` and compiles the body as an async function — extract the inline functions
  the same way and compare outputs, not just literals.
- **D2 — Prefer eliminating the mirror where cheap.** Compute `decideLand` / `spawnOpts` / `covenSeats` results
  **Lead-side** and pass them as Workflow args, so the template consumes precomputed values (single source of
  truth). Recommended for spawn opts + the land decision inputs; keep the per-round lens selection in-template
  (it mutates `task.coven` mid-loop) but cover it by D1.
- **D3 — Meta-guard.** A test that greps the template for `"Keep in sync"` / `"MIRROR"` markers and asserts each
  has a corresponding agreement test — so a new mirror cannot be added without a guard.

## Solution shape

New behavioral drift tests (+ the meta-guard); optional arg-passing refactor to delete mirrors.

## Affected files

`skills/war/assets/war-config.test.mjs` (or a new `drift.test.mjs`) · `skills/war/assets/land-decision.test.mjs` ·
`skills/war/assets/workflow-template.js` (if D2 refactor) · `skills/war/assets/workflow-template.test.mjs`.

## Alternatives considered

- **Status quo (constants-only guard)** — rejected: logic is unguarded.
- **Full de-duplication via a build/inline step** — heavier; deferred (the sandbox-can't-import constraint stands).

## Validation criteria

- Mutating `decideLand` logic in `land-decision.mjs` → a behavioral drift test fails.
- Adding a new `"Keep in sync"` block without a matching test → the meta-guard fails.
- All existing tests stay green after the (optional) arg-passing refactor.

## Open decisions

1. **D2 scope** — how much to move Lead-side now vs. cover-in-place with D1 (recommend: move spawn + land inputs;
   cover lens selection in place).
