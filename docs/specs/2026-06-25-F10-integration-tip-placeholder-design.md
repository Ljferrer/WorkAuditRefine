# F10 — Resolve `<integration-tip>` before emitting it — Design

**Status:** proposed — targets **v0.5.1** (clarity/correctness). **Severity: NIT.**
**Source:** agent-architecture-audit F10 · memory `template-defers-runtime-values-to-agent-via-literal-placeholder`.

## Problem — a bare placeholder sits next to resolved paths

The Provision prompt emits a literal `<integration-tip>` token
([workflow-template.js:195](../../skills/war/assets/workflow-template.js),
[:202](../../skills/war/assets/workflow-template.js)) beside fully-resolved absolute paths. The template has no
shell/fs, so it can't resolve git values itself and relies on the spawned agent to do so — but a bare `<...>`
adjacent to real path arguments is easy to pass to `git` verbatim.

## Decisions

- **D1 — Prefer a Lead-resolved value.** The Lead passes the integration tip SHA (or the refiner captures it in
  step 2 and the template references that captured value by an unambiguous variable name) so step 3 doesn't emit a
  bare placeholder next to real paths.
- **D2 — If it must stay agent-resolved, make it unmistakable.** Emit an explicit command, e.g.
  `$(git rev-parse <integration-branch>)`, or a clearly delimited, self-describing token with a resolve
  instruction — never a bare `<integration-tip>` that reads like a path.
- **D3 — Guard it.** A template test asserts no bare `<...>` placeholder is emitted adjacent to resolved paths
  without an accompanying resolve instruction.

## Solution shape

Resolve Lead-side (preferred) or emit an explicit resolve-command; add a template test.

## Affected files

`skills/war/assets/workflow-template.js` (Provision prompt) · `skills/war/assets/workflow-template.test.mjs`
(placeholder guard) · `skills/war/references/schemas.md` if a new resolved arg is threaded.

## Alternatives considered

- **Leave the bare placeholder** — rejected: ambiguous; flagged.

## Validation criteria

- The Provision prompt contains either a resolved SHA/variable or an explicit `git rev-parse …` command — never a
  bare `<integration-tip>` adjacent to absolute paths.
- A template test fails if a bare `<...>` placeholder reappears next to resolved paths.

## Open decisions

1. Lead-resolved SHA vs refiner-captured-then-referenced (recommend Lead-resolved if the tip is known at
   dispatch; else refiner-captured with an explicit instruction).
