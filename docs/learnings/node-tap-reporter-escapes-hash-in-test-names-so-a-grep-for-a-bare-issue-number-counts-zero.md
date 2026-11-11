---
name: node-tap-reporter-escapes-hash-in-test-names-so-a-grep-for-a-bare-issue-number-counts-zero
description: "Node's TAP reporter prints a '#' in a test name as '\\#', so a check that greps '(#NNNN)$' counts zero"
metadata:
  node_type: memory
  type: project
  keywords:
    - tap reporter
    - hash escape
    - test-reporter=tap
    - grep -c
    - done when
    - end state check
    - plan-defect
    - issue number suffix
  provenance: code-verified
  slug: node-tap-reporter-escapes-hash-in-test-names-so-a-grep-for-a-bare-issue-number-counts-zero
  phase: 2026-11-08-model-routing-and-prompt-byte-budgets/phase-4 (task 4.1)
  tags:
    - plan-authoring
    - end-state-checks
    - node-test
    - tap
  created: 2026-11-10
  originSessionId: af72d7d8-ef0f-4543-bac4-2a766b4fb11f
  modified: 2026-11-11T01:05:09.792Z
---

# Node's TAP reporter escapes `#` in test names

`node --test --test-reporter=tap` escapes every `#` in a test name as `\#` (seen on Node v24.17.0).
A test named `validateRoster: admits one opus-over-sonnet lens pair (#2706)` prints as `ok 113 - validateRoster: admits one opus-over-sonnet lens pair (\#2706)`.
So a Done-when or End-state check that greps `\(#2706\)$` counts 0, even when the row exists and passes.
No test name can make TAP print a bare `#`, because TAP treats `#` as a directive marker.
The fix belongs in the plan check, never in the test name.

## How to apply

- When a check greps TAP output for a name with `#`, match `\(\\#NNNN\)$` or the tolerant `\(\\?#NNNN\)$`.
- Better, keep issue numbers out of grepped test-name suffixes, or end the grep before the suffix.
- When you author a plan check, run it once against a real TAP run before you ratify it. See [[a-semicolon-inside-a-quoted-end-state-check-literal-is-split-by-the-statement-runner]] for a sibling check-spelling trap.
- `/red-team` should execute every grep-count End-state check, not only read it.

## Evidence

Phase 4 task 4.1 escalated as PLAN-DEFECT on this clause, and task 4.2 failed as a dependent.
The worker ran a self-confound gate: the names were byte-exact, and the same grep without the `(#2706)` suffix found both `ok` lines.
Every other Done-when clause exited 0 at the worker's tip.

Locate-cue: verify still present before acting. The bad pattern `\(#2706\)$` appears twice in `docs/plans/2026-11-08-model-routing-and-prompt-byte-budgets.md` (the task 4.1 Done when and End state 22), found @ phase 4 in the main checkout.
The TAP escape behavior itself comes from the worker's run report, not a read by this servitor (no Bash). The landed tip was unrecorded, and no task landed, so grounding took the gate-audit fallback rung.
