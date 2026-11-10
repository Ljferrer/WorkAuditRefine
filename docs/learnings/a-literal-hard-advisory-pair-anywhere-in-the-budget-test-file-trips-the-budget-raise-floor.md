---
name: a-literal-hard-advisory-pair-anywhere-in-the-budget-test-file-trips-the-budget-raise-floor
description: "A new test fixture with a literal hard: N pair in the budget test file trips the Budget-Raise floor"
metadata:
  promoted: dev/2026-11-08-model-routing-and-prompt-byte-budgets@phase-1
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

**What happened.** Task 1.1 absorbed an audit fix that added a test calling `checkBudget('fixture', 10, { hard: 2048, advisory: 1024 })`. That line is a new UNKEYED value line, so the merge floor refused the task with "unkeyed ceiling value line(s) changed". No ceiling was raised. The retry landed after the fixture limits moved into named variables.

**Misdiagnosis to avoid.** The `ROW_SHAPE` regex line reads `hard:\s*\d+`. The floor's grep needs a digit or space right after `hard:`, so the backslash cannot match. Look for a new literal `{ hard: <digits>` in a test body instead.

**Author rule.** In this file, never write a digit right after `hard:` or `advisory:` outside a real ceiling row. Bind fixture numbers to named variables first. A trailing `//` comment does not help because the floor strips it before it classifies the line, and a full-line `//` comment is skipped.

**Locate-cue (verify still present before acting).**
- `skills/war/assets/assert-budget-raise-cited.sh`, the `classify_lines` function and the `old_unkeyed`/`new_unkeyed` comparison.
- `skills/war/assets/prompt-surface-budgets.test.mjs`, the `FILE_BUDGETS` rows (keyed by quoted path) are the legitimate ceiling lines.
- The MEASURE-line test from this incident (landed tip 7c80621f) lives only on the unmerged `dev/2026-11-08-model-routing-and-prompt-byte-budgets` branch, not on master.

**Related.** [[normalizing-in-band-floor-route-marker-can-flip-hard-escalation-to-soft]] covers the `budget-uncited` route marker.
