---
name: fail-closed-gate-silently-redirects-existing-failure-tests
description: "New gate flips loose failure tests into gate tests"
metadata: 
  node_type: memory
  type: project
  keywords: [coverage masking, early exit, precondition guard, generic assertion, lost test coverage, suite stays green]
  slug: fail-closed-gate-silently-redirects-existing-failure-tests
  phase: clandiso/p1b
  date: 2026-06-26
  tags: 
    - testing
    - gates
    - coverage
    - teardown
  related: "[[teardown-phase-reap-order-and-delete-fail-loud]], [[weak-test-assertion-passes-without-feature-being-exercised]]"
  originSessionId: fab06e87-b8c3-454f-a1d8-ecc9fa41faf6
---

# Fail-closed gate silently redirects existing failure-path tests

**Rule:** adding an early-exit gate to a function silently converts any existing test that (a) calls it without satisfying the gate's precondition and (b) asserts only a generic outcome (non-zero, path-present) into a gate test — the suite stays green while the originally-targeted path loses coverage. Coverage-masking, not a behavioral defect.

Instance fixed: the fail-closed `--owned-file` gate in `provision-worktrees.sh` `teardown-phase` tripped failure-path tests T3c/T3d in `provision-worktrees.test.sh`; both got `--owned-file` plus mechanism-specific assertions (shipped).

**Why:** there is no visible signal when a code path loses its test to a new gate.
**How to apply:** when adding a gate, audit every existing test that calls the function in a gate-failing configuration; add the prerequisite or split out an explicit gate test, and prefer mechanism-specific tokens (exit code + unique stderr substring) over "non-zero".

Related: [[teardown-phase-reap-order-and-delete-fail-loud]], [[weak-test-assertion-passes-without-feature-being-exercised]]
