# F08 — Wire or remove the dead `branch_ahead_of` helper — Design

**Status:** proposed — targets **v0.5.1** (hygiene). **Severity: LOW.**
**Source:** agent-architecture-audit F8 · memory `provision-conservative-heal-not-gated-on-ahead-check`.

## Problem — dead code that implies a guard that doesn't exist

`branch_ahead_of` is defined at [provision-worktrees.sh:101](../../skills/war/assets/provision-worktrees.sh) but
has **zero call sites** (verified). Comments around conservative heal can read as if heal safety is gated on an
"is this branch ahead?" check, when it is actually gated by **never-reset-on-reuse** (design D7). The helper has
been flagged repeatedly as documentary.

## Decisions

- **D1 — Delete the dead helper and correct the comments.** Remove `branch_ahead_of`; state plainly that
  conservative-heal safety = *never destroy a worktree whose branch carries un-merged commits; prune+recreate only
  empty/unregistered no-commit dirs; an unregistered dir that has changes → fail loud* (the actual D7 guard).
  **Recommended** — simplest and matches reality.
- **D2 — (Alternative) Wire it** into the heal path only if a real heal decision needs "does this dir's branch
  have commits not on the integration tip?". D7's reuse rule already covers the safety case, so D1 is preferred.

## Solution shape

Remove the function + tidy the comment; adjust any test that references it.

## Affected files

`skills/war/assets/provision-worktrees.sh` · `skills/war/assets/provision-worktrees.test.sh` (if referenced) ·
the heal comment in `docs/specs/2026-06-25-worktree-provisioning-design.md` (D7) if it implies an ahead-check.

## Alternatives considered

- **Leave as-is** — rejected: misleading dead code that has caused repeated confusion.

## Validation criteria

- `grep -rn branch_ahead_of skills/` returns nothing after the delete.
- The provisioning heal tests stay green.
- The heal comment matches the actual guard (never-reset-on-reuse).

## Open decisions

1. **Delete vs wire** — recommend delete; confirm no planned heal logic needs an ahead-check.
