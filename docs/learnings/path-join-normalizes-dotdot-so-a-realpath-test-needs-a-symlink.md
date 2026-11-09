---
name: path-join-normalizes-dotdot-so-a-realpath-test-needs-a-symlink
description: "path.join folds '..' segments before the code under test sees them, so a realpath pin needs a symlinked input"
metadata:
  node_type: memory
  type: project
  keywords:
    - realpath
    - path.join
    - symlinkSync
    - normalize
    - vacuous assertion
    - test fidelity
    - canonical path compare
  provenance: agent-unverified
  slug: path-join-normalizes-dotdot-so-a-realpath-test-needs-a-symlink
  phase: 2026-11-08-engine-recovery-relaunch-and-land/phase-1 (task 1.2)
  tags:
    - testing
    - test-fidelity
    - paths
  created: 2026-11-09
  originSessionId: af72d7d8-ef0f-4543-bac4-2a766b4fb11f
  modified: 2026-11-09T13:22:27.496Z
---

# path.join folds '..' so a realpath test needs a symlink

Audit finding resolved in a fix round before land, recorded as pattern, not live instance.

**The trap.** A test fed the code a root built as `join(ROOT, 'skills', '..')` to prove the code realpaths it.
`path.join` normalizes that string back to `ROOT` before the code under test runs.
So the assertion stays green if the realpath call is deleted.

**The fix.** Create a symlink to the real root in a temp dir with `symlinkSync`, and pass the link path.
Only a realpath step turns the link into the real root, so deleting the step turns the row red.

**How to apply.** If a test claims to pin a path canonicalization step, check that its input survives `path.join` or `path.resolve` unchanged.
A `..` segment or a doubled slash does not survive them. A symlink does.

Related: [[weak-test-assertion-passes-without-feature-being-exercised]], [[negative-assert-on-a-fixture-that-cannot-carry-the-offender-is-vacuous-and-a-label-count-a-fix-round-also-satisfies]].
