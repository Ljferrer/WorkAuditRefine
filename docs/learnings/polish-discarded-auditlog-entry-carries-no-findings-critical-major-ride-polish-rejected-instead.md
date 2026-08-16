---
name: polish-discarded-auditlog-entry-carries-no-findings-critical-major-ride-polish-rejected-instead
description: "The phase-close sweep's discard-arm `auditLog.push({ verdict: 'polish-discarded', ... })` entry always carries `findings: []` — sweep-raised Critical/Major on a re-audited-but-not-reapproved discard ride the earlier `polish-rejected` entry's `findings` array instead, never the `polish-discarded` entry itself."
metadata: 
  node_type: memory
  type: project
  keywords: 
    - polish-discarded
    - polish-rejected
    - auditLog
    - phase-close sweep
    - discard arm
    - sweepWhy
    - sweepApproved
    - Critical Major visibility
    - workflow-template.js
    - sweep-raised findings
    - audit log entry findings empty
  provenance: code-verified
  slug: polish-discarded-auditlog-entry-carries-no-findings-critical-major-ride-polish-rejected-instead
  phase: 2026-08-06-gate-audit-finding-routing/3.1
  tags: 
    - war
    - engine
    - workflow-template
    - phase-close
    - audit-log
  created: 2026-08-15
  originSessionId: 8bae67aa-acfa-461e-acc9-278fc79ba6c1
  modified: 2026-08-16T03:36:38.697Z
---

# The `polish-discarded` auditLog entry never carries findings — check `polish-rejected` instead

## What happened

Task 3.1's `## Status` blurb (`README.md`) says sweep-raised Critical/Major findings "ride the
`polish-rejected`/`polish-discarded` `auditLog` entries on the terminal arms" — verbatim from the
plan's own Commander's Intent Purpose sentence, so the blurb is plan-faithful. But read literally as
"go look in the `polish-discarded` entry for Critical/Major," it is misleading: at the landed tip
(`skills/war/assets/workflow-template.js`, verify still present before acting — the DISCARD branch
around the `polishStatus = 'discarded'` assignment), the push is

```js
auditLog.push({ task: polishTask.id, verdict: 'polish-discarded', branch: polishBranch, findings: [], blocked: sweepWhy || null })
```

`findings` is a **hardcoded empty array** — always. The re-audit panel's actual findings (including
any Critical/Major) are captured earlier, in the `polish-rejected` push, gated by `if (!sweepWhy)`:

```js
auditLog.push({ task: polishTask.id, verdict: sweepApproved ? 'approve' : 'polish-rejected', findings: pSeats.flatMap(s => s.findings || []), requested: pExpected, returned: pSeats.length })
```

## Durable rule

A discard can be reached three ways, and only one of them leaves Critical/Major evidence anywhere
in `auditLog`:

1. **`sweepWhy` set (blocked)** — no panel convened at all; the `if (!sweepWhy)` block never runs,
   so there is no `polish-rejected` entry either. Nothing to ride — there were no findings to carry.
2. **Panel convened, not re-approved** — the `polish-rejected` entry (pushed inside the
   `if (!sweepWhy)` block) carries the real `findings` array via `pSeats.flatMap(...)`. This is
   where Critical/Major sweep findings actually live.
3. **Panel convened and approved, but the polish merge itself fails** — Critical/Major would have
   been empty (approval requires `blockingOf(pSeats).length === 0`), so this path is moot for
   Critical/Major visibility; the `approve` entry (same push, `verdict: 'approve'`) is what exists.

When debugging "where did a sweep-raised Critical/Major finding go on a discarded polish," grep
`auditLog` for `polish-rejected` (or `approve`, task = the polish task id) — never `polish-discarded`,
which is a routing/visibility marker only, with `findings: []` by construction.

## Locate cue

`skills/war/assets/workflow-template.js` — the phase-close sweep's discard arm, near the
`polishStatus = 'discarded'` assignment and its `auditLog.push({ verdict: 'polish-discarded', ... })`
call; the panel's real findings push is `auditLog.push({ ..., verdict: sweepApproved ? 'approve' :
'polish-rejected', findings: pSeats.flatMap(...) })` inside the preceding `if (!sweepWhy)` block —
verify still present before acting.
