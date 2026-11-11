---
name: a-fix-round-that-adds-a-registry-row-must-raise-the-no-slack-floor-in-the-same-commit
description: "A fix round adding a REGISTRY row must raise the floor and ceiling literals too"
metadata:
  promoted: dev/2026-11-08-engine-findings-ace-and-late-fix@phase-2
  node_type: memory
  type: project
  keywords:
    - REGISTRY.length
    - no-slack floor
    - row count ceiling
    - both-surfaces registry
    - fix round
    - drift guard
    - engine-1 test
  provenance: code-verified
  slug: a-fix-round-that-adds-a-registry-row-must-raise-the-no-slack-floor-in-the-same-commit
  phase: "2026-11-08-engine-findings-ace-and-late-fix/phase-2 (task 2.1), landed cebb1d4d0a7826952f241b91d1c76a3197b140bf"
  tags:
    - war
    - test-fidelity
    - drift-guard
    - fix-round
  created: 2026-11-09
  originSessionId: af72d7d8-ef0f-4543-bac4-2a766b4fb11f
  modified: 2026-11-09T23:57:05.895Z
---

# A new REGISTRY row needs its count literals raised in the same commit

The D3 both-surfaces `REGISTRY` test in `skills/war/assets/workflow-template.engine-1.test.mjs` pins its row count with a no-slack floor and a matching ceiling.
Plans make that floor a binding guardrail.

## What went wrong in task 2.1 (phase-2 instance)

Round 1 set the floor to the then-true count of 52.
Fix round 1 added row 53 (`confirmed tip scope (D28)`) and left the floor at 52.
One row of slack lets any later row deletion pass the gate.
All three seats caught it, and two raised it to Major as a guardrail breach.
The fixer skipped the floor because the floor reads the array; it is not part of the new row.
Fix round 2 set the floor to `>= 53` and added a ceiling `<= 53`, whose message tells the next author to raise both literals.
Those 52 and 53 values are the phase-2 instance, not the live count.

## How to apply

- If you add a REGISTRY row, raise the floor and the ceiling to the new count in the same commit.
- Update the floor message's row enumeration and count too.
- If a fix round adds a row, treat the count literals as consumers on the fix chain.
- The `MIRROR_REGISTRY` floor is a minimum by contract (`>= 20`), so it keeps slack on purpose.

Related: [[fix-the-finding-class-not-the-site-and-prove-every-new-guard-red-before-commit]].

**Locate-cue (verify still present before acting):** `assert.ok(REGISTRY.length <= N` and `REGISTRY.length >= N` in `skills/war/assets/workflow-template.engine-1.test.mjs` (N was 53 at phase 2, 58 at master tip 4b101693). The count rots as later tasks add rows.
