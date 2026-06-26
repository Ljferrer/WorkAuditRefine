# F12 — Multi-runner gate resolution + re-detect after merge — Design

**Status:** proposed — targets **v0.5.1** (correctness). **Severity: HIGH.**
**Source:** memory `gate-under-covers-after-cross-branch-merge-new-runner` (surfaced post-audit, B5).

## Problem — a single-command gate silently under-covers

The gate is **one string** (e.g. `node --test …`). A cross-branch merge added **three `*.test.sh`** suites that
the configured `node --test` gate does **not** run — confirmed this session: those suites exist and pass
(`hooks/clean-surface-war-worktree.test.sh`, `hooks/validate-worktree-scope.test.sh`,
`skills/war/assets/provision-worktrees.test.sh`) but are invisible to `node --test`. A merge can introduce a whole
new **runner**, and the single-string gate silently skips it — the gate reports green while a test class is
unrun.

## Decisions

- **D1 — The gate enumerates ALL runners present.** Resolution discovers every runner in the repo —
  `node --test` for `*.test.{mjs,js}`, **each** executable `*.test.sh`, plus the declared gate — and runs them
  all. A non-zero from **any** runner = `gate_failed`.
- **D2 — Re-detect after any cross-branch integration.** A merge can add a runner, so the Lead re-resolves the
  gate at: **phase land, release, and after merging a foreign/main branch in** (not just once at run start).
- **D3 — The refiner runs the FULL resolved gate** for `merge-task`, `land-phase`, and release — not just the
  configured single command.
- **D4 — Make "the gate" unambiguous.** Allow the gate to be a list / a resolver / a wrapper script so it can
  express multiple runners (and, with Part B, remain per-phase). Document in `war-config` + `schemas.md`.
- **D5 — Coverage meta-test.** Assert every `*.test.sh` in the repo is reachable by the resolved gate — so a new
  bash suite can't be silently orphaned (analogous to the `WAR_WORKTREE` clean-surface gate).

## Solution shape

A gate-resolution helper (discover runners) + a Lead re-detect step post-merge + the refiner running all runners +
a coverage meta-test.

## Schema & contract changes

- `overrides.gate` / the resolved gate may become `string | string[]` (or a resolver). Document semantics in
  `war-config.mjs` + `references/schemas.md`. Compose with the per-phase gate fidelity from the provisioning Part-B
  work.

## Affected files

`skills/war/assets/war-config.mjs` (gate shape/resolver) + `war-config.test.mjs` · `skills/war/SKILL.md` (Lead
re-detect post-merge) · `agents/war-refiner.md` (run all runners) · `skills/war/references/schemas.md` · a new
gate-coverage meta-test.

## Alternatives considered

- **Keep the single-string gate** — the current under-covering bug; rejected.
- **Hand-maintain a combined gate string** — fragile; a new suite is silently dropped. Rejected in favor of a
  resolver + meta-test.

## Validation criteria

- A repo with node + bash suites → the resolved gate runs **both**.
- Adding a new `*.test.sh` not wired into the gate → the coverage meta-test fails.
- A cross-branch merge that adds a runner → re-detect picks it up; the refiner returns `gate_failed` if any runner
  fails.

## Open decisions

1. Gate as `string[]` vs a discovered-resolver vs a committed wrapper script (recommend a resolver with an
   `overrides.gate` escape hatch).
2. How this composes with Part B's **per-phase** gate (one resolver per phase).
