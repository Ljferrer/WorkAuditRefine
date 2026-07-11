---
name: ""
metadata: 
  node_type: memory
  type: project
  keywords: [cartesian product, boundary combination, combinatorial coverage, test enumeration, silent gap, contract edges]
  slug: drift-matrix-stated-vs-covered-cells
  phase: f07/p2-t3
  tags: 
    - drift-guard
    - testing
    - matrix-coverage
    - plan-mismatch
  related: 
    []
  originSessionId: fab06e87-b8c3-454f-a1d8-ecc9fa41faf6
---

# Drift matrix stated vs covered cells

## Rule

When a plan cites a matrix ("cover A × B"), workers fill the cells matching the
most natural examples and miss boundary combinations — exactly the cells that
distinguish the contract's edges. After writing matrix-style drift tests,
enumerate ALL cells explicitly in a comment or table: test-row count should equal
rows × columns, and a meta-comment naming each cell prevents silent gaps that
review misses because each present cell individually looks correct.

## Instance (resolved)

The decideLand drift-guard (D1/F07) originally covered 4 of the reachable cells,
missing **empty-landed × hard-reason** (→ `held:escalation`) and
**non-empty-landed × soft-reason** (→ `landed`) — the two cells that distinguish
its "soft escalation ignored, hard escalation wins" contract. Both are now
present as named tests in `war-config.test.mjs` ("empty landed × HARD escalation
→ held:escalation" and "non-empty landed × SOFT escalation → landed").

> archived 2026-07-11: resolved — moved to archive
