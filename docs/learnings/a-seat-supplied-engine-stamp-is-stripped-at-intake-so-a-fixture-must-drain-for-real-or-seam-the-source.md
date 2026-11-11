---
name: a-seat-supplied-engine-stamp-is-stripped-at-intake-so-a-fixture-must-drain-for-real-or-seam-the-source
description: "Intake strips drainCause from seat replies. Drain for real or seam the source"
metadata:
  node_type: memory
  type: project
  keywords:
    - drainCause
    - normalizeFinding
    - test fixture
    - seat payload
    - engine stamp
    - source seam
    - demoteReason
    - intake strip
  provenance: code-verified
  slug: a-seat-supplied-engine-stamp-is-stripped-at-intake-so-a-fixture-must-drain-for-real-or-seam-the-source
  phase: 2026-11-08-engine-findings-ace-and-late-fix/phase-6 (task seed-1)
  tags:
    - testing
    - workflow-template
    - findings-pipeline
  created: 2026-11-09
  originSessionId: af72d7d8-ef0f-4543-bac4-2a766b4fb11f
  modified: 2026-11-10T07:58:58.943Z
---

`normalizeFinding` in `skills/war/assets/workflow-template.js` drops `seats`, `merged`, `drainCause` and `demoteReason` from every seat-supplied finding.
This stops a seat from spoofing engine provenance (see [[auditor-supplied-provenance-keys-trusted-verbatim-in-followup-collapse-and-ask-parking]]).
The side effect hits test authors: a fixture cannot plant a `drainCause` by putting it in a mocked seat reply.
The stamp vanishes at intake, and an assert on it then fails or, worse, a negative assert passes vacuously.

Two ways reach a row with a real `drainCause`:
1. Drive a real drain. Make the dispatch impl throw for the sweep label (for example `polish:phase-3` throws `529 Overloaded`). The engine then stamps `drainCause` itself. This is the faithful form, and most drain-cause tests in `skills/war/assets/workflow-template.engine-1.test.mjs` use it.
2. Seam the source. Rewrite a live engine loop in the template text so that it sets `m.drainCause` (the seed-1 D25 unfold test does this on the `for (const m of minorsFiled) {` unfold loop). Pin the seam with an `includes()` presence assert, so a later edit to the loop reds the test instead of silently skipping the rewrite.

Prefer form 1. Use form 2 only when no cheap fixture reaches the drain path at the code under test. A test-fidelity seat flagged form 2 as a Nit note (less faithful, but not vacuous).

Locate-cue: verify still present before acting — found at `skills/war/assets/workflow-template.js` (`const normalizeFinding = f =>`) and the `DRAINED` seam in `skills/war/assets/workflow-template.engine-1.test.mjs` @ phase 6, read in the seed-1 task worktree whose tree equals the integrated tip.
