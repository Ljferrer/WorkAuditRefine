---
name: an-early-exit-guard-added-under-existing-tests-hollows-their-negative-assertions
description: "A new early-exit guard makes old 'nothing written' assertions pass because the guard refuses first, so re-aim each fixture at the guarded branch"
metadata:
  node_type: memory
  type: project
  keywords:
    - vacuous assertion
    - early exit guard
    - negative assertion
    - never mkdir
    - fixture move
    - existsSync
    - sibling sweep
    - anchor refusal
    - ES3
    - ES4
    - test erosion
  provenance: code-verified
  slug: an-early-exit-guard-added-under-existing-tests-hollows-their-negative-assertions
  phase: 2026-10-27-memory-query-mcp-tool/phase-2 task 2.1
  tags:
    - war
    - testing
    - guard
    - fix-round
  created: 2026-10-28
  originSessionId: c3af584e-8b97-41a9-9abc-594c7cf1d33c
  modified: 2026-10-29T04:46:38.839Z
---

# A new early-exit guard hollows the old "nothing was written" tests

**Pattern.** You add a guard that returns early on an input shape. Old tests that assert a negative ("no log written", "no directory created") may now pass because the guard refused first. They no longer reach the branch they were written to watch.

**What happened.** Phase 2 task 2.1 added `localPassesAnchor` to `skills/_shared/war-memory-mcp.mjs`. The ES3 and ES4 fixtures moved under `*/.claude/projects/*/memory`.
- Round 1: ES3 case (c) built `missing` as `join(local, 'no-such-dir')`. That path no longer ended in `/memory`, so the anchor refused it before `fs.statSync`. The assertion `!existsSync(missing)` passed with or without a `mkdirSync` mutation. Both audit seats raised it, one as Major. It was the only oracle for the never-mkdir guardrail (PIN-4).
- Round 2: the fix round repaired ES3. It missed the sibling. The ES4 test still used a bare `tmpDir()` as `local`, so its `!existsSync(join(local, QUERY_LOG))` held because the anchor refused the append, not because the memory-disabled branch writes nothing. A seat raised it as a Minor. Round 3 came back clean.

**Why the first sweep missed it.** The fixer listed the absent-log assertions but did not ask whether the new guard now refused each one.

**How to apply.**
- After you add an input-shape guard, list every test that asserts an absence. For each one, check that its input passes the new guard, so the code under test still runs.
- Build the negative fixture so it passes the guard and stays absent for the right reason. For a missing directory, use a path that matches the anchor and does not exist.
- Delete the feature in your head. For a never-create rule, insert a `mkdirSync` after the guard. The test must go red.
- Keep one positive case beside the negative. The `RA1` row does this: it asserts a refused append still returns hits, and an anchored one writes a line.

Related: [[weak-test-assertion-passes-without-feature-being-exercised]], [[negative-assert-on-a-fixture-that-cannot-carry-the-offender-is-vacuous-and-a-label-count-a-fix-round-also-satisfies]], [[memory-query-local-fence-is-hook-only-and-binds-four-seats-not-everyone]].

**Locate-cue (verify still present before acting).** `skills/_shared/war-memory-mcp.test.mjs`: the `ES3:` row, where `missing` now sits under `.claude/projects/y/memory`, and the `ES4:` row, where `local` sits under the anchor. Found at landed tip 24c4d0c3 (phase 2), read through the run's `_refinery` worktree (HEAD equal to the tip). Both defects were fixed before land, so this records the pattern, not a live instance.
