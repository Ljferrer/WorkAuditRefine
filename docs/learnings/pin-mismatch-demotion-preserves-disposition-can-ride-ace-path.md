---
name: pin-mismatch-demotion-preserves-disposition-can-ride-ace-path
description: "auditRound pin-mismatch demotion keeps disposition; can ride --ace"
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
  keywords: 
    - pin-mismatch
    - demotion
    - disposition
    - absorb
    - ace
    - aceable
    - auditRound
    - workflow-template
    - D2
  slug: pin-mismatch-demotion-preserves-disposition-can-ride-ace-path
  phase: audit-gate-verdict-fidelity/t1.3
  tags: 
    - workflow-template
    - audit-pipeline
    - findings
    - ace
  created: 2026-07-09
  originSessionId: 68b2ca32-fa05-459c-9ddf-f23ca91a5f40
---

# pin-mismatch demotion downgrades severity but not disposition

In `workflow-template.js`'s `auditRound`, a seat whose returned `audit_sha` mismatches its dispatched pin has its findings demoted via `{ ...f, pinMismatch: true, originalSeverity: f.severity, severity: 'Nit' }` (verify still present before acting — locate the `pinMismatch: true` demotion spread in `skills/war/assets/workflow-template.js`; `dispositionOf()` still routes absorb). This rewrites `severity` to `'Nit'` and stamps `originalSeverity`/`pinMismatch`, but **does not touch `disposition`**. A pin-mismatched (stale-tree) finding that happened to carry `disposition: 'absorb'` therefore still routes to the `aceable` set, and a `--ace` worker can attempt a mechanical fix derived from an observation made against a tree the seat never actually reviewed at the pinned SHA.

**Why this is bounded, not a defect:** the `--ace` path is neither the HARD path nor a merge block — it is a single, re-audited, forward-reverted-on-regression commit that never escalates (ADR 0005 invariant). D2 (this plan's pin-equality demotion) is explicitly scoped to "findings demotion only, cannot enter the HARD path" — disposition routing was out of scope. Worst case: one wasted, self-reverting ace attempt, on the rare intersection of (differing audit_sha) AND (absorb disposition) AND (`run.ace` on).

**If tightening this later:** also null out or downgrade `disposition` on the same demotion line so a pin-mismatched finding can never enter `aceable`, not just never enter `escalated`.
