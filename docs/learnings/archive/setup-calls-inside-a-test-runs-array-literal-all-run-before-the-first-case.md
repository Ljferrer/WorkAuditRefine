---
name: setup-calls-inside-a-test-runs-array-literal-all-run-before-the-first-case
description: "Setup calls inside a test's runs array all run at build time, so two writes to one path leave only the last"
metadata:
  node_type: memory
  type: project
  keywords:
    - vacuous assertion
    - eager evaluation
    - array literal
    - test fixture
    - shared path
    - overwrite
    - table-driven test
  provenance: agent-unverified
  slug: setup-calls-inside-a-test-runs-array-literal-all-run-before-the-first-case
  phase: 2026-11-08-args-floor-and-launch-preflight/1
  tags:
    - war
    - testing
    - pattern
    - test-fidelity
  created: 2026-11-08
  originSessionId: af72d7d8-ef0f-4543-bac4-2a766b4fb11f
  modified: 2026-11-09T00:12:51.144Z
---

# Table-driven runs evaluate their setup calls before any run

Audit finding resolved in a fix round before land, recorded as pattern, not live instance.

The pattern: a test builds `const runs = [[..., writeArgs(dir, { a: 1 })], [..., writeArgs(dir, { a: 2 })]]` and then loops over it.
Both `writeArgs` calls run while the array is built, before the first run.
If both write the same path, every run reads the last payload.
A later assertion that "the re-run took the new value" then passes even if the feature never re-ran.

How to avoid it:
- Give each payload its own file (a fresh scratch dir per call).
- Or assert the first value after the first run, before the second run.
- Apply the delete-the-feature test: if the assertion still passes with the feature removed, it is vacuous.

Related: [[weak-test-assertion-passes-without-feature-being-exercised]].

> archived 2026-11-10: merged into [[weak-test-assertion-passes-without-feature-being-exercised]] — moved to archive
