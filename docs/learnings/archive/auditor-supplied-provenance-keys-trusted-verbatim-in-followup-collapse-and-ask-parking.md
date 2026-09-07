---
name: auditor-supplied-provenance-keys-trusted-verbatim-in-followup-collapse-and-ask-parking
description: "Normalize auditor-supplied finding keys (seats, merged, sha, task) at intake; a non-strict schema lets a payload spoof engine stamps."
metadata: 
  node_type: memory
  type: project
  provenance: agent-unverified
  slug: auditor-supplied-provenance-keys-trusted-verbatim-in-followup-collapse-and-ask-parking
  phase: "2026-08-25-engine-reliability-and-filing-fidelity/phase-5 (Task 5.1 audit findings, disposition note)"
  keywords: 
    - seatsOf
    - mergedRowsOf
    - AUDIT_VERDICT findings schema
    - additionalProperties false
    - parkAsk spread order
    - auditShaOrSentinel
    - D8 collapse
    - trust boundary
    - provenance spoofing
    - non-strict schema
  tags: 
    - security
    - engine-design
    - audit-payload-trust
    - pattern
  created: 2026-08-26
  originSessionId: 46a4dbcd-fa2b-416c-87f8-931f5c3c90b5
  modified: 2026-08-26T17:34:46.803Z
---

# Engine-internal provenance keys read straight off an auditor's JSON payload, unnormalized

**Rule:** `AUDIT_VERDICT`'s findings-item schema has no `additionalProperties: false`. Any extra key an auditor emits on a finding survives every `...f` spread in `skills/war/assets/workflow-template.js`. If engine code later reads a key that looks engine-authored (`seats`, `merged`, `sha`, `task`, `seat`) off that same object, it is trusting auditor-controlled input unless an intake step strips or validates that key first.

**Still open.** Three live sites, all `disposition: note` at land:

1. The `seatsOf` helper in the D8 FOLLOW-UP CONSOLIDATION block returns `c.seats` verbatim when it is an array. An auditor-supplied `seats` array that omits the row's own `seatRef` lets a second row from the same seat pass the cross-seat collapse check. That defeats the invariant D8 exists to establish.
2. The `mergedRowsOf` helper keeps a pre-existing auditor-supplied `merged` array on the representative row and appends the real merged-away entry. A fabricated `merged: [...]` renders into the filing prompt, the issue body, `handoff.followUps[].merged`, and the log as if the engine preserved it.
3. The three gate-audit `parkAsk({ task, seat, sha: auditShaOrSentinel(...), ...f })` calls (execution-evidence, integrated-tip, end-state arms) spread the finding last. A finding-level `sha`, `task`, or `seat` overrides the engine stamp, including the `audit_sha` sentinel guard from #1693. The arm-local dedup keys on the engine taskId while the parked record stores the overridden `f.task`, so a repeat does not dedup either. This matches `minorsOf`'s documented "explicit finding-level seat/sha, spread last, win" convention, so it is a recorded property of the ask channel, not a novel divergence.

**Why:** the root cause is structural. A non-strict schema means any key name the engine will compute can be pre-seeded by a sloppy or hostile payload. `Array.isArray(...)` and truthiness checks guard against crashes, not against spoofed content.

**How to apply:** when adding an engine-computed field to an object spread from an agent-supplied payload:
1. Check whether the schema has `additionalProperties: false`. If not, assume the key can arrive pre-seeded.
2. Normalize at intake. Strip or validate the specific key before the compute step.
3. If "spread last wins" is intentional elsewhere in the file, decide per field whether the new field is an engine-authoritative stamp (an `audit_sha` sentinel, a same-seat discrimination key) that must not be overridable. Record the choice in a code comment either way.

## Related

[[own-token-provenance-floor-vacuous-or-false-refusal-both-directions]]: a sibling class where a provenance-floor guard errs in both directions on schema-shaped input. Both trace to trusting agent-authored payload shape for an integrity property.

> archived 2026-09-04: resolved — moved to archive
