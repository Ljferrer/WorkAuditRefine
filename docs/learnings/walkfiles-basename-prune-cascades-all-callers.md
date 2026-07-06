---
name: walkfiles-basename-prune-cascades-all-callers
metadata:
  node_type: memory
  type: project
  keywords: [directory walk skip, shared default arg, silent exclusion, tmp fixture test, entry.name match, path prefix mismatch, false RED]
  slug: walkfiles-basename-prune-cascades-all-callers
  phase: audit-fidelity/p1
  tags:
    - test-design
    - walkFiles
    - prune
    - blast-radius
    - fixture
  related:
    - "[[node-breadth-assertion-test-js-overclaims]]"
    - "[[prune-assertion-substring-token-drift]]"
  created: 2026-06-26
  originSessionId: e734fab0-d931-4547-a090-ed30c93e12f8
---

# walkFiles basename-prune cascades silently to every caller; fixture-based test proves non-vacuity

`walkFiles` in `war-config.test.mjs` has a `pruned` default array; the in-file callers (coverage
meta-tests and breadth-assertion tests) pass no explicit `pruned` arg, so any addition to the
default cascades to ALL of them. Adding a basename can silently hide files from every assertion
that uses `walkFiles` — trace all callers first and confirm none rely on finding a file whose
ancestor directory matches the new basename.

Landed in audit-fidelity/p1 T1.4: `'worktrees'` added to the default (safe — the canonical suites
live under `skills/` and `hooks/`), closing a latent sibling-worktree false-RED, with a fixture
test that goes RED if `'worktrees'` is ever removed from `pruned`.

## Correct prune key is basename, not relative-path prefix

`walkFiles` skips an entry via `pruned.includes(entry.name)` — it matches the directory's own
name, never a path prefix. A prefix like `'.claude/worktrees'` would never match; use the bare
basename `'worktrees'`.

## Fixture-based TDD for a prune default (non-vacuous test pattern)

Build a real `tmp` fixture with the pruned dir containing a matching file and a sibling dir
containing another; assert the pruned file is absent AND the sibling file is present. Goes RED
by construction if the prune entry is removed — no mock, no vacuous pass.

## Rule

When adding a basename to a shared walk helper's default prune list:
1. Grep all callers — confirm none rely on files under a directory with that basename.
2. Confirm the prune key is the bare `basename`, not a relative or absolute path prefix.
3. Write a fixture-based test that asserts the pruned dir's files are absent AND a sibling's
   files are present — this fails RED if the prune entry is later removed.
