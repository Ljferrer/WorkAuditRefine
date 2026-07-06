---
name: pass-probe-demotion-gate-layer-without-probe-contract
description: "Gate pass-demotion + probe pass contract move together"
metadata: 
  node_type: memory
  slug: pass-probe-demotion-gate-layer-without-probe-contract
  phase: red-team-verdict-integrity/t2.1
  type: project
  keywords: [probeStatus, classify filter, silent downgrade, coupled files, findings empty, cross-file invariant, verdict blocking]
  tags: 
    - red-team
    - gate
    - probe-status
    - defense-in-depth
    - design-boundary
    - cross-task-dependency
  files: 
    - skills/red-team/assets/red-team-gate.mjs
    - skills/red-team/assets/red-team-gate.test.mjs
  relates: 
    - "[[red-team-env-gap-warn-is-agent-directive-not-code-enforced]]"
    - "[[gate-evidence-severity-not-verdict-gates-hard-path]]"
  created: 2026-06-26
  originSessionId: e734fab0-d931-4547-a090-ed30c93e12f8
---

# Gate-side pass-probe demotion and probe-side pass contract must change together

Rule: only literal `probeStatus === 'pass'` demotes a Critical/Major at the gate
(`classify()` in `red-team-gate.mjs`); warn/fail/absent still block. The guarantee that
`'pass'` carries no real defect lives probe-side: a clean probe must emit `status:"pass"`
with `findings:[]`. The two layers are coupled across files — rename the field, relax the
probe contract, or add a new status (e.g. `'skip'`) and you must update BOTH the gate
filter and the probe contract in the same change, or the gate becomes a silent demotion
path for real defects.

Landed: both halves shipped (T2.1 gate, T3.1 probe contract); the two-contract summary is
documented in `skills/red-team/references/lenses.md`.

**Why:** a misbehaving probe emitting `pass` with a genuine Critical would be silently
demoted to non-blocking if only one layer is edited.
**How to apply:** touching probe statuses or `allFindings()`/`classify()` → verify field
name and compared value match the lenses.md two-contract summary, and update the pinning test.

Relates to [[red-team-env-gap-warn-is-agent-directive-not-code-enforced]] (guarantee split
across an agent-directive layer and a separate code enforcement point).
