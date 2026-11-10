---
name: a-literal-hard-advisory-pair-anywhere-in-the-budget-test-file-trips-the-budget-raise-floor
description: "A new test fixture with a literal hard: N pair in the budget test file trips the Budget-Raise floor"
metadata:
  node_type: memory
  type: project
  keywords:
    - Budget-Raise floor
    - budget-uncited
    - unkeyed ceiling value line
    - default-deny
    - assert-budget-raise-cited
    - prompt-surface-budgets fixture
    - hard advisory literal
    - floor retry
  provenance: code-verified
  slug: a-literal-hard-advisory-pair-anywhere-in-the-budget-test-file-trips-the-budget-raise-floor
  phase: 2026-11-08-model-routing-and-prompt-byte-budgets/phase-1 (task 1.1)
  tags:
    - war
    - floors
    - budget
    - test-authoring
  created: 2026-11-10
  originSessionId: af72d7d8-ef0f-4543-bac4-2a766b4fb11f
  modified: 2026-11-10T21:05:19.526Z
---

# A literal `hard:`/`advisory:` number pair in the budget test file trips the Budget-Raise floor

**Rule.** `skills/war/assets/assert-budget-raise-cited.sh` treats every non-comment line in `skills/war/assets/prompt-surface-budgets.test.mjs` that matches `(hard|advisory):[[:space:]]*[0-9]` as a ceiling line. A line with no quoted-path key and no `const NAME` key is UNKEYED. Any change to the UNKEYED set is a raise-suspect, and the floor exits 1 (`budget-uncited`) with no trailer.

**What happened.** Task 1.1 absorbed an audit fix that added a MEASURE-line test. The auditor's suggested fix spelled the call as `checkBudget('fixture', 10, { hard: 2048, advisory: 1024 })`. A test line of that shape is a new UNKEYED value line. The merge floor refused the task with "unkeyed ceiling value line(s) changed". No ceiling was raised. The floor retry landed after the fixture limits moved into named variables (`fixtureHard`, `fixtureAdvisory`), so no line pairs a budget key with a digit.

**Misdiagnosis to avoid.** The refiner guessed the trigger was the moved `ROW_SHAPE` regex line. That line reads `hard:\s*\d+`, and the floor's grep needs a digit or space right after `hard:`, so the backslash cannot match. Look for a new literal `{ hard: <digits>` in a test body instead. The exact pre-fix line is inferred from the suggested fix and the landed comment, not read from the rejected commit.

**Author rule.** In this file, never write a digit right after `hard:` or `advisory:` outside a real ceiling row. Bind fixture numbers to named variables first. A trailing `//` comment does not help because the floor strips it before it classifies the line, and a full-line `//` comment is skipped.

**Locate-cue (verify still present before acting).**
- `skills/war/assets/assert-budget-raise-cited.sh`, the `classify_lines` function and the `old_unkeyed`/`new_unkeyed` comparison.
- `skills/war/assets/prompt-surface-budgets.test.mjs`, the test titled `measure line — checkBudget prints one MEASURE line per call` (its comment names this floor).

Found at landed tip 7c80621f, read in the run-scoped refinery worktree whose HEAD equals the tip.

**Related.** [[normalizing-in-band-floor-route-marker-can-flip-hard-escalation-to-soft]] covers the `budget-uncited` route marker.
