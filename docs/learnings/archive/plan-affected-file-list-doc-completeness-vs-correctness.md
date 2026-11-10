---
name: plan-affected-file-list-doc-completeness-vs-correctness
description: "A plan's Files list that names an untouched file or omits a file the diff had to touch is a Minor doc gap, not a defect, unless the text left standing asserts something false"
metadata:
  node_type: memory
  type: project
  provenance: code-verified
  slug: plan-affected-file-list-doc-completeness-vs-correctness
  phase: F01-D2D3/p2 + packaging-floor-enum-wiring/p1-T2 + partial-phase-recovery-and-branch-hygiene/t2
  updated: 2026-07-11
  keywords:
    - plan file list wrong location
    - named file not touched
    - drift guard lives elsewhere
    - land-decision.test.mjs vs war-config.test.mjs
    - HARD_ESCALATION_REASONS mirror coverage
    - doc-completeness not a coverage gap
    - Files list omits required file
    - prompt-surface-split
    - standing card twin
    - cross-task TODO exemption
    - red-team C7 resolution
    - Files list advisory not authoritative
    - ONLY N files
    - fixture-driven test
    - deepEqual drift guard cascade
    - scope creep false positive
  tags:
    - plan-faithfulness
    - doc-honesty
    - auditor-lens
  related:
    - scope-hook-blind-to-bash-write-path
    - defined-but-not-yet-emitted-plan-slice-pattern
    - standing-instruction-vs-dispatched-prompt-coverage-split
  originSessionId: fab06e87-b8c3-454f-a1d8-ecc9fa41faf6
  modified: 2026-08-18T16:32:35.570Z
---

# Plan affected-file list: completeness gap ≠ correctness defect

## The rule

When auditing plan-faithfulness, distinguish:
- **False claim present** → correctness defect, must block.
- **Honest prose absent that the plan asked for** → completeness/plan-faithfulness gap (Minor);
  only blocks if the absence leaves a misleading statement standing.
- **File touched but omitted from the plan's own `Files:` list**, or **file named but untouched**
  → also a Minor doc-completeness gap, not a defect, when the real edit is required and correct.

**Test to apply:** "Does the current text assert something demonstrably untrue?" If no, the gap
is Minor even if the plan step was skipped, or the plan's file list misstates what was touched.
Verify against the actual diff and the relevant cross-file doctrine before treating a
`Files:`-list mismatch as a defect.

## Variants (one line each)

- **Honest prose never added (F01 D2/D3, phase 2):** the plan listed `agents/war-worker.md` to
  state the sibling-write residual, but the file was untouched. Minor, not blocking: the existing
  worker text is an instruction, not a capability claim, and ADR 0002
  (`docs/adr/0002-scope-by-agent-type.md`, the "Accepted residual" bullet) already documents it.
- **Wrong file, right guard (packaging-floor-enum-wiring, T2):** the plan named
  `skills/war/assets/land-decision.test.mjs` for adding `'unpackaged'` to
  `HARD_ESCALATION_REASONS`, but the cross-mirror drift guard lives in `war-config.test.mjs` (the
  `'drift-guard: inline HARD_ESCALATION_REASONS ... matches canonical export ...'` test — anchor
  by that test title, not a line range; it has already migrated once within the file). Grep the
  precedent reason's coverage (here `'no-test'`) to find which file really owns the guard.
- **Drift guard forces a cascade:** when a constant joins a `deepEqual`-guarded array, the drift
  guard, not the plan's Files list, sets the touched set (canonical export in `land-decision.mjs`,
  the guard test, and any existing test case). Classify those touches as faithful, necessary
  deviation, not scope creep.
- **Omitted required file (partial-phase-recovery-and-branch-hygiene, T2):** the diff also edited
  `agents/war-refiner.md` (the `STALE_REMOTE` classify-and-continue carve-out) because
  prompt-surface-split doctrine requires the standing card to change with the dispatched prompt in
  `workflow-template.js`. Required, correct, only under-reported.
- **"ONLY N files" vs a fixture:** a fixture file required by a fixture-driven test plan is not
  scope creep even when the task summary says "ONLY N files". Check that it sits in the
  established fixtures dir, is disjoint from other tasks in the phase, and is required by the
  test-plan table. Workers should drop the "ONLY" claim.
- **Plan prose beats the Files list (references-pointer-integrity, tasks 1.1 → 1.4):** a red-team
  C7 resolution in the plan prose told Task 1.4 to retire a guard exemption
  (`TODO(Task 1.4): retire the exemption`), though its `Files:` line omitted the guard suite. Task
  1.4 did retire it. Treat a plan slice's prose as authoritative and the `Files:` list as
  advisory; don't score an exemption "unenforceable" from the `Files:` list alone.

> archived 2026-08-30: resolved — moved to archive
