---
name: pin-mismatch-demotion-preserves-disposition-can-ride-ace-path
description: "auditRound's pin-mismatch demotion keeps disposition — an absorb-tagged finding can still reach --ace"
metadata: 
  node_type: memory
  type: project
  promoted: dev/2026-07-08-audit-gate-verdict-fidelity@phase-1
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

In `workflow-template.js`'s `auditRound`, a seat whose returned `audit_sha` mismatches its dispatched pin has its findings demoted via `{ ...f, pinMismatch: true, originalSeverity: f.severity, severity: 'Nit' }` (verify still present before acting — found at `skills/war/assets/workflow-template.js` line 529 @ phase audit-gate-verdict-fidelity/t1.3). This rewrites `severity` to `'Nit'` and stamps `originalSeverity`/`pinMismatch`, but **does not touch `disposition`**. A pin-mismatched (stale-tree) finding that happened to carry `disposition: 'absorb'` therefore still routes to the `aceable` set, and a `--ace` worker can attempt a mechanical fix derived from an observation made against a tree the seat never actually reviewed at the pinned SHA.

**Why this is bounded, not a defect:** the `--ace` path is neither the HARD path nor a merge block — it is a single, re-audited, forward-reverted-on-regression commit that never escalates (ADR 0005 invariant). D2 (this plan's pin-equality demotion) is explicitly scoped to "findings demotion only, cannot enter the HARD path" — disposition routing was out of scope. Worst case: one wasted, self-reverting ace attempt, on the rare intersection of (differing audit_sha) AND (absorb disposition) AND (`run.ace` on).

**If tightening this later:** also null out or downgrade `disposition` on the same demotion line so a pin-mismatched finding can never enter `aceable`, not just never enter `escalated`.

## RESOLVED — phase "Engine fidelity + evidence contract" (#805, 2026-07-12)

**Code-verified via the phase's own task worktree** (this servitor's own cwd was a stale,
unrelated checkout — see [[servitor-verify-on-write-worktree-can-lag-just-landed-phase]] —
confirmed instead at
`<repo-root>/.claude/war-worktrees/2026-07-12-audit-gate-evidence-fidelity/p1-1.1/skills/war/assets/workflow-template.js`):
the exact tightening this lesson suggested shipped. The per-task pin-mismatch demotion line now
reads
```
s.findings = (s.findings || []).map(({ disposition, autoFixable, ...f }) => ({ ...f, pinMismatch: true, originalSeverity: f.severity, severity: 'Nit' }))
```
— `disposition` and `autoFixable` are stripped via destructuring exclusion, so a pin-mismatched
finding can never carry `disposition: 'absorb'` into the `aceable` set again. `originalSeverity` is
still preserved (ADR 0013 — demotions never drop silently).

**A DIFFERENT pin-mismatch site (the integrated-tip gate-audit's own `pinMismatch()` check, ~line
1477) is deliberately EXEMPT** from this same strip, per an explicit code comment: "`#805 EXEMPT
from the auditRound disposition-strip: this stamp is annotation-only... gate-audit findings route
ONLY into auditLog/escalated, never into aceable... a demoted finding here can NEVER ride --ace.
Not the same bug half-fixed." Two structurally-similar `pinMismatch` call sites, two different
fixes needed (one strips disposition, one needs no strip because that code path never feeds
`aceable` at all) — don't assume a fix at one `pinMismatch()` site generalizes to the other without
checking which findings-collection each one feeds.

> archived 2026-07-11: resolved — moved to archive
