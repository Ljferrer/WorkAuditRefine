# F09 — Ownership ledger at teardown & resume — Design

**Status:** proposed — targets **v0.5.1** (correctness/hardening). **Severity: LOW.**
**Source:** agent-architecture-audit F9 · memory `provision-ownership-ledger-gates-create-not-teardown`.

## Problem — ownership is checked at create, not at destroy

`ensure-integration` fails loud on a foreign branch at **create** (foreign ref → exit 3,
[provision-worktrees.sh:189](../../skills/war/assets/provision-worktrees.sh)) — good. But **teardown** and
**resume** do not re-check the `--owned-file` ledger, so two footguns remain: concurrent same-plan runs can tear
down each other's refs/worktrees, and a **ledger-less resume** has no way to tell its own refs from foreign ones.

## Decisions

- **D1 — Teardown verifies ownership.** `teardown-task` / `teardown-phase` MUST confirm the ref/worktree is in the
  run ledger before removal; a non-owned ref → **refuse** (exit 3), never delete another run's branch/worktree
  (consistent with design D9 "strictly run-scoped").
- **D2 — Resume fails loud without a ledger.** If the ledger is missing/empty but branches matching this run's
  namespace exist, **fail loud** with a recovery hint (record-as-owned, or delete) rather than silently treating
  them as foreign or as owned.
- **D3 — Symmetric checks + tests.** Add ledger checks symmetric to create, with cases: teardown refuses a foreign
  ref; resume with an absent ledger fails loud; an owned teardown still works.

## Solution shape

Add `owned_has` / `load_owned_file` guards to the teardown + resume paths (the helpers already exist for create).

## Affected files

`skills/war/assets/provision-worktrees.sh` (`teardown-*`, resume) ·
`skills/war/assets/provision-worktrees.test.sh` (new cases).

## Alternatives considered

- **Trust run-id path scoping alone** — rejected: the `--owned-file` ledger is the ownership source of truth
  (paths can collide or be hand-edited).

## Validation criteria

- Teardown of a foreign ref → exit 3, **no deletion**.
- Resume without a ledger → fail loud with a recovery hint.
- Owned teardown still removes the worktree + deletes the merged branch.

## Open decisions

1. Whether resume should **auto-adopt** namespace-matching refs into the ledger (convenience) or always require an
   explicit `--owned`/record step (safer). Recommend explicit.
