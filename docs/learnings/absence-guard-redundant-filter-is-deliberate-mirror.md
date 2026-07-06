---
name: absence-guard-redundant-filter-is-deliberate-mirror
description: "Redundant grep filter = deliberate sibling mirror"
metadata:
  node_type: memory
  slug: absence-guard-redundant-filter-is-deliberate-mirror
  phase: guard-fidelity/tB
  type: project
  keywords: [grep -v chain, subsumed pattern, byte-identical sibling checks, drift resistance, refinery-surface test, load-bearing duplication]
  tags:
    - war
    - absence-guard
    - grep-guard
    - drift-resistance
    - refinery
    - audit-finding
  files:
    - skills/war/assets/refinery-surface.test.sh
  relates:
    - "[[absence-guard-verb-specific-coverage-gap]]"
    - "[[retire-token-needs-clean-surface-gate-test]]"
  created: 2026-06-26
  originSessionId: e734fab0-d931-4547-a090-ed30c93e12f8
---

# Redundant grep filter in an absence guard can be deliberate drift-resistant mirroring

**Rule:** before flagging a logically redundant filter as a defect, check whether the plan or a
sibling check mandates a byte-identical mirror. In `refinery-surface.test.sh`, ABSENCE CHECK 2
(`checkout origin/`) and ABSENCE CHECK 3 (`switch origin/`) share the identical
`grep -v '\-\-detach' | grep -v 'detach'` chain; the second filter is subsumed by the first, but
uniform structure makes future divergence between the sibling checks diff-visible — load-bearing.

Landed in guard-fidelity/tB (#102); mirror still live on master.

**Why:** a "cleaner" filter that breaks the pair makes drift between sibling guards invisible.
**How to apply:** comment the mirroring intent when authoring; confirm the rationale before
suggesting cleanup; if tightening, change both checks together so the mirror stays exact.

Related: [[absence-guard-verb-specific-coverage-gap]] (why the switch-verb guard exists);
[[retire-token-needs-clean-surface-gate-test]] (broader clean-surface gate pattern).
