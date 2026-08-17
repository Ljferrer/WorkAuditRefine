---
name: schemas-escalate-reason-never-dropped-contradicts-severity-dropped-seat-lane
description: "Absolute external-harness doc claim can contradict its sibling bullet; phrase as 'adds no NEW hold path'"
metadata: 
  node_type: memory
  type: project
  keywords: 
    - schemas.md
    - escalate_reason
    - dropped-seat
    - audit-blocked
    - rung-3
    - execution evidence
    - ADR 0041
    - absolute claim
    - adjacent bullet contradiction
    - AUDIT_VERDICT
    - A8
  provenance: code-verified
  slug: schemas-escalate-reason-never-dropped-contradicts-severity-dropped-seat-lane
  phase: 2026-08-06-gate-audit-finding-routing/2.1
  tags: 
    - docs
    - evidence-precedence
    - gate-audit
    - plan-authoring
  created: 2026-08-15
  originSessionId: 8bae67aa-acfa-461e-acc9-278fc79ba6c1
  modified: 2026-08-16T02:53:41.390Z
---

# An absolute external-harness claim in one doc bullet can contradict its own sibling bullet

## What happened

`skills/war/references/schemas.md` (verify still present before acting — found at :61-62, landed
tip `06020944b884d2e2860ccf2fe698ef3d5ba4868e` / branch `dev/2026-08-06-gate-audit-finding-routing`)
carries two adjacent bullets about the SAME schema-layer conform-or-retry loop:

- :61 (pre-existing, `severity` requirement): "Schema-layer retry corrects a sloppy seat;
  persistent failure falls into the existing dropped-seat → audit-blocked lane."
- :62 (new, `escalate_reason` conditional): "...a reason-less `escalate` is re-prompted, never a
  dropped seat, never a land hold."

Both bullets describe the identical bounded conform-or-retry mechanism, but :62 asserts an
absolute ("never a dropped seat") that :61 directly contradicts for the exhaustion case. The same
absolute is mirrored verbatim onto two more surfaces (`workflow-template.js`'s `AUDIT_VERDICT`
comment ~line 102, `workflow-template.test.mjs`'s test header comment ~line 3594), with no drift
guard over the external harness the claim rests on.

The claim's basis is a worker's code-read of an out-of-repo running-agent harness at a pinned
version — ADR 0041 `execution`-shape evidence at rung 3: SOFT, never a hold, and unverifiable
from inside this repo. The correct framing (confirmed by red-team adjudication row A8) is "adds no
NEW hold path" (a reason-less escalate already lands as `held:escalation` regardless of which
enforcement arm is true), not an unqualified "never".

## Durable rule

- When mirroring an external-harness enforcement claim onto doc prose, phrase it relative to the
  existing behavior it doesn't change ("adds no NEW hold path beyond the existing X lane"), never
  as an unqualified absolute that a sibling bullet in the same file can falsify.
- Before stamping such a claim as fact across three-plus surfaces, grep the immediately
  surrounding prose (not just the target file) for a bullet describing the same underlying
  mechanism from a different angle — an absolute is disprovable by its own neighbor.
- rung-3 execution evidence (a worker probe / code-read of an out-of-repo harness) is SOFT at
  audit time by construction (see
  [[deliberately-uncommitted-worker-probe-evidence-is-soft-never-hold]]) — record it, but don't
  let its phrasing overreach into a claim the repo itself cannot back.

## Locate cue

`skills/war/references/schemas.md` :61 (pre-existing dropped-seat → audit-blocked lane) vs :62
(new "never a dropped seat" bullet) — same file, adjacent bullets, same retry mechanism. Mirrored
absolutes: `skills/war/assets/workflow-template.js` `AUDIT_VERDICT` comment (~line 102),
`skills/war/assets/workflow-template.test.mjs` test header comment (~line 3594). The live
dropped-seat lane itself: `workflow-template.js` sets `verdict = 'audit-blocked'` on
`seats.length < expected` after `auditRound`'s two retry passes (~lines 1222, 1228).
