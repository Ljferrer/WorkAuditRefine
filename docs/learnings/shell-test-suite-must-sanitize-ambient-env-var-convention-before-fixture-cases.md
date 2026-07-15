---
name: shell-test-suite-must-sanitize-ambient-env-var-convention-before-fixture-cases
description: "When a script treats an env var as an implicit config channel (fires only when set), its shell test suite must explicitly unset that var before pre-existing cases — a developer/CI export of the same convention from another playbook otherwise silently activates the new code path in unrelated fixtures"
metadata: 
  node_type: memory
  type: project
  provenance: agent-unverified
  slug: shell-test-suite-must-sanitize-ambient-env-var-convention-before-fixture-cases
  phase: lessons-learned-repo-projection-integrity/1.1
  keywords: 
    - ambient env var
    - CLAUDE_MEMORY_REPO
    - test hermeticity
    - env var convention
    - shell test sanitation
    - fail-toward-completeness
    - fixture leakage
    - unset before cases
    - test isolation
  tags: 
    - shell
    - testing
    - hermeticity
    - pattern
  created: 2026-07-15
  originSessionId: e11422bd-1b49-4d13-9840-37a67306b3f5
---

**Pattern (from `docs/plans/2026-07-14-lessons-learned-repo-projection-integrity.md` Task 1.1 —
agent-authored plan rationale; not independently code-verified at the landed tip since this
servitor's session worktree — `<session-worktree>` — lagged the landed branch. The referenced
env-var *export* and the shell-test file's own structural anchors were directly confirmed present:
`skills/lessons-learned/references/migration.md` exports
`CLAUDE_MEMORY_REPO="$(git rev-parse --show-toplevel)/docs/learnings"` in its migration-playbook
preamble, and `skills/lessons-learned/assets/safe-swap.test.sh` has the `SCRIPT=`/`mkmem()`/`CASE
1` structure the new sanitation line is placed relative to).**

A script that reads an env var as an *implicit* config channel — no CLI flag, "if set, behavior
changes" — creates a hazard for its own test suite: any other doc/playbook in the same repo that
teaches an operator to `export` that same var (here, a memory-migration playbook's preamble) means
a developer's ambient shell, or a CI job that sources such a playbook, silently arms the new code
path inside test cases that were never designed to exercise it — and those cases read as false
failures (or worse, false passes) with no code change.

**Fix:** the test file must `unset <VAR>` immediately after any environment guard (e.g. right
after confirming the script-under-test exists) and *before* the first fixture case runs — never
rely on the ambient shell being clean. Load-bearing detail: if any pre-existing cases build
fixtures that assert success/failure *contingent on the var being absent or empty*, name that
dependency explicitly in the test file (a comment), since deleting the `unset` line is otherwise
invisible in CI (which never carries the ambient export) and only reproduces in a developer shell
that followed the export-teaching playbook.

**When to apply:** any shell test suite in this repo whose script-under-test reads an env var by
convention rather than an explicit flag, where a *different* skill's doc teaches operators to
export that same var name for a legitimate real-pass workflow.
