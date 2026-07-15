---
name: archive-subcommand-rerender-drops-repo-rows-and-verify-cannot-catch-it
description: archive without --repo re-renders local-only; safe-swap verify PASSes the repo-row-less projection
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
  keywords: 
    - war-memory
    - archive
    - render-index
    - repo rows
    - projection
    - safe-swap
    - verify
    - lessons-learned
    - housekeeping
  originSessionId: 5e8eacd1-0dcc-4bb3-9107-1b9355d31d22
---

`war-memory archive` re-renders the projection into the local root as its last step, walking only
the roots it was given — `cmdArchive` calls `resolveRoots(argv)`, so it **does accept `--repo`**,
but the `/lessons-learned` Phase 5 template invokes it `--local`-only. On a repo-adopted store that
intermediate render silently drops every `[repo]` row (observed 2026-07-13: 23,888 B / 144 lines →
3,849 B / 30 lines).

The sharp edge: **`safe-swap.sh verify` cannot catch this state.** Its hard checks — every index
row maps to a file, every file indexed, budget — all pass on the repo-row-less projection; dangling
links are warn-only. A housekeeping run that skips or loses the explicit
`render-index --local <staging> --repo <repo-root>` (e.g. resuming after an interruption between
archive and render) would swap a projection missing all repo lessons and verify would green-light it.

**Why:** the projection is derived state, so "verify" only checks internal consistency, not
completeness against a root it was never told about.

**How to apply:** pass `--repo` to `archive` itself on a repo-adopted store, and treat the Phase 5
explicit `render-index … --repo` as REQUIRED (not belt-and-suspenders); after any archive, confirm
`grep -c '\[repo\]' MEMORY.md` is nonzero before verify/commit. Related:
[[projection-budget-now-bound-by-repo-root-rows]], [[lessons-learned-tooling-traps]].

## RESOLVED — phase "lessons-learned-repo-projection-integrity" Task 1.1 (#891, 2026-07-15)

**Code-verified in this task's own worktree** (`skills/lessons-learned/SKILL.md` Phase 5/6/7,
`skills/lessons-learned/assets/safe-swap.sh` `do_verify`): both halves closed. (1) The Phase 5
`archive` bullet now invokes `archive --local "$STAGING" --repo "$REPO_ROOT"`, so `cmdArchive`'s
trailing re-render walks both roots and keeps the `[repo]` rows even when a pass dies before the
explicit `render-index` step. (2) `do_verify` gained a repo-completeness hard fail: when
`CLAUDE_MEMORY_REPO` (the same env `resolveRoots` honors) names a directory holding ≥ 1 top-level
hot lesson but `MEMORY.md` carries zero **row-scoped** `[repo]` rows, it prints a `FAIL` and returns
nonzero — so both `verify` (Phase 6) and `commit`'s pre-swap re-verify (Phase 7, now threaded with
the `CLAUDE_MEMORY_REPO="$REPO_ROOT"` prefix) refuse the wholesale-dropped projection this lesson
records. The check is a *different, additive* predicate over the `[repo]` marker than the row→file
Rule 2 (which excludes `[repo]` rows and stays byte-intact and load-bearing). Wholesale-drop only:
a projection that lost *some but not all* `[repo]` rows still passes — full row↔file reconciliation
against the repo root is a named deferred non-goal until a partial-drop failure mode is observed.

**Durable pattern unaffected:** the general rule survives — derived state that verifies internal
consistency cannot catch incompleteness against a root it was never told about; the fix is to tell
the gate about that root (here via the `CLAUDE_MEMORY_REPO` env), not to trust the projection.
