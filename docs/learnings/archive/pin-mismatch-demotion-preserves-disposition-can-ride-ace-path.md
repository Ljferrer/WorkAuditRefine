---
name: pin-mismatch-demotion-preserves-disposition-can-ride-ace-path
description: "RESOLVED (#805): a pin-mismatch demotion must strip disposition too, or an absorb finding rides --ace; the two pinMismatch sites need different fixes, so check which findings set each feeds"
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

In `workflow-template.js`'s `auditRound`, a seat whose returned `audit_sha` mismatches its dispatched pin has its findings demoted via `{ ...f, pinMismatch: true, originalSeverity: f.severity, severity: 'Nit' }`. This rewrites `severity` to `'Nit'` and stamps `originalSeverity`/`pinMismatch`, but **does not touch `disposition`**. A pin-mismatched (stale-tree) finding that happened to carry `disposition: 'absorb'` therefore still routes to the `aceable` set, and a `--ace` worker can attempt a mechanical fix derived from an observation made against a tree the seat never actually reviewed at the pinned SHA.

The original risk was bounded: the `--ace` path is a single, re-audited, self-reverting commit that never escalates, so the worst case was one wasted ace attempt.

## RESOLVED — phase "Engine fidelity + evidence contract" (#805, 2026-07-12)

**Code-verified** in `skills/war/assets/workflow-template.js`:
the fix shipped. The per-task pin-mismatch demotion line now
reads
```
s.findings = (s.findings || []).map(({ disposition, autoFixable, ...f }) => ({ ...f, pinMismatch: true, originalSeverity: f.severity, severity: 'Nit' }))
```
— `disposition` and `autoFixable` are stripped via destructuring exclusion, so a pin-mismatched
finding can never carry `disposition: 'absorb'` into the `aceable` set again. `originalSeverity` is
still preserved (ADR 0013 — demotions never drop silently).

**A DIFFERENT pin-mismatch site (the integrated-tip gate-audit's own `pinMismatch()` check) is deliberately EXEMPT** from this same strip, per an explicit code comment: "`#805 EXEMPT
from the auditRound disposition-strip: this stamp is annotation-only... gate-audit findings route
ONLY into auditLog/escalated, never into aceable... a demoted finding here can NEVER ride --ace.
Not the same bug half-fixed." Two structurally-similar `pinMismatch` call sites, two different
fixes needed (one strips disposition, one needs no strip because that code path never feeds
`aceable` at all) — don't assume a fix at one `pinMismatch()` site generalizes to the other without
checking which findings-collection each one feeds.

> archived 2026-07-11: resolved — moved to archive
