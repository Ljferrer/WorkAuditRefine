---
name: a-threshold-check-needs-a-fixture-at-the-boundary-and-per-arm-because-a-live-corpus-row-cannot-red-the-logic
description: A threshold check needs an at-boundary fixture and one fixture per arm
metadata:
  node_type: memory
  type: project
  keywords:
    - threshold boundary
    - off-by-one
    - gt vs ge
    - fixture per arm
    - live corpus row
    - mutation proof
    - card_tools_check
    - shell test
  provenance: agent-unverified
  slug: a-threshold-check-needs-a-fixture-at-the-boundary-and-per-arm-because-a-live-corpus-row-cannot-red-the-logic
  phase: 2026-11-08-doc-truth-drift-and-adr-hygiene/phase-3 (task 3.7)
  tags:
    - testing
    - hooks
    - shell
  created: 2026-11-12
  originSessionId: af72d7d8-ef0f-4543-bac4-2a766b4fb11f
  modified: 2026-11-12T12:16:53.914Z
---

**Pattern.** A check function has two arms and a numeric threshold ("more than 8").
A row that runs the check over live repo files proves the row can red when a live file breaks.
It does not prove the check logic can red: delete an arm, and live data that never trips it stays green.
A worker mutation proof that edits a live file has the same blind spot.

**Rule.**
- Give each arm its own fixture that only that arm can flag, plus a control that passes.
- Put one fixture exactly at the threshold. A fixture one step past it (9 for "more than 8") stays red under both `-gt 8` and `-ge 8`, so it never pins the boundary.
- If a row gates on the check's exit code, it also reds on the other arm. Gate the row on the arm's own output line instead.

**Provenance note.** Audit findings resolved in fix rounds before land — recorded as pattern, not live instance.
The seats traced the survivors by reading the code. They did not run the mutations.

Related: [[each-branch-and-per-call-override-of-a-git-bypass-guard-needs-its-own-red-row]] (archived, same class for git guards), [[weak-test-assertion-passes-without-feature-being-exercised]].
