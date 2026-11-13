---
name: a-red-at-base-run-proves-only-the-first-failing-assert-of-a-multi-clause-test
description: A test red at base proves only its first failing assert. Delete each clause to prove the rest
metadata:
  node_type: memory
  type: project
  keywords:
    - red at base
    - red proof
    - per-clause deletion
    - mutation proof
    - unpinned clause
    - multi-assert test
    - End state pin
    - test fidelity
  provenance: agent-unverified
  slug: a-red-at-base-run-proves-only-the-first-failing-assert-of-a-multi-clause-test
  phase: 2026-11-08-pipeline-skills-and-memory-tooling/phase-1
  tags:
    - testing
    - audit
    - doc-contracts
  created: 2026-11-12
  originSessionId: af72d7d8-ef0f-4543-bac4-2a766b4fb11f
  modified: 2026-11-13T04:26:34.873Z
---

**Pattern.** A doc-contract test with several asserts fails at base on its first missing clause.
That base failure says nothing about the later asserts.
A later assert can be missing, or pin the wrong clause, and the test still reads as "proven red".

**Observed.** In phase 1, task 1.5 replaced the plan's "delete each clause" proof with one red-at-base run of 13 tests.
The test-fidelity seat then found unpinned End-state clauses in three rounds in a row.
Each round closed some clauses and missed sibling clauses of the same class.

**How to apply.**
- When a slice asks for a per-clause red proof, delete each clause on its own and watch its assert go red.
- Before commit, list every clause each End state claims and map it to one assert.
- When an audit finds one unpinned clause, sweep every sibling test for the same gap in the same round.

Audit finding resolved in fix rounds before land. Recorded as pattern, not live instance.

Related: [[weak-test-assertion-passes-without-feature-being-exercised]], [[fix-the-finding-class-not-the-site-and-prove-every-new-guard-red-before-commit]].
