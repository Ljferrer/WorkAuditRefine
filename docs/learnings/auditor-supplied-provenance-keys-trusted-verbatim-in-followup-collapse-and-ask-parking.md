---
name: auditor-supplied-provenance-keys-trusted-verbatim-in-followup-collapse-and-ask-parking
description: "workflow-template.js's D8 follow-up collapse and the gate-audit-family ask-parking arms read attribution-shaped keys (seats, merged, sha, task) straight off an auditor-supplied AUDIT_VERDICT finding object without an intake-normalization step, because the findings item schema has no additionalProperties:false — an auditor payload can spoof same-seat corroboration, fabricate merged-away rows, and override the engine's own audit_sha/task/seat stamps on a parked ask"
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

## What the finding says (recorded from the audit log — not independently code-verified this session)

**Grounding caveat:** this servitor's cwd was a worktree for an unrelated concurrent plan
(`claude/work-audit-refine-survey-beadd3`), not `dev/2026-08-25-engine-reliability-and-filing-fidelity`
(the threaded landed tip `a2d44e45df033a8dd17d285945bdebfd4e8ac8c3`). No live worktree for that plan's
slug existed under `<repo-root>/.git/worktrees/*`, and Task 5.1's audit-log entries carry no
`gateEvidence: true` to fall back on. A direct check of the reachable checkout confirms the *base*
mechanism (`FOLLOWUP_LINE_WINDOW`) is present in `skills/war/assets/workflow-template.js`, but the
Phase-5-added `seatsOf`/`mergedRowsOf` are absent — i.e. the checkout genuinely lags Phase 5 rather
than the plan/code mismatching. Recorded here as the **generic pattern** the audit findings describe,
not a confirmed live instance — verify presence at `skills/war/assets/workflow-template.js` (the D8
FOLLOW-UP CONSOLIDATION block, `seatsOf`/`mergedRowsOf` helpers, and the three new gate-audit
`parkAsk({...})` call sites) before acting on it.

Phase 5 Task 1 widened the follow-up collapse with seat discrimination (D8: "two rows from the same
seat never collapse as corroboration") and added a `merged[]` sub-list preserving merged-away rows'
`title`/`rationale`. Three related audit findings (same root cause) on that same task, all
`disposition: note` (informational, not held/fixed):

1. **`seatsOf` trusts an auditor-supplied `seats` array verbatim.** `seatsOf = c => Array.isArray(c.seats)
   ? c.seats : [seatRef(c)]`. Because `AUDIT_VERDICT`'s findings-item schema has no
   `additionalProperties: false` (the harness's strict-schema deriver falls back to non-strict on this
   schema), an auditor can emit a finding carrying its own `seats: [...]` key, which rides `minorsOf`'s
   `...f` spread onto the row unchanged. If that array omits the row's own `seatRef`, a **second row
   from the same seat** passes the new cross-seat collapse check and collapses anyway — defeating the
   exact invariant D8 was added to establish. Same root cause makes the representative's own seat
   sometimes absent from the rendered corroboration list.
2. **`hit.merged = mergedRowsOf(hit)` keeps a pre-existing auditor-supplied `merged` array on the
   representative row**, then appends the real merged-away entry. An auditor can fabricate
   `merged: [{ seat: 'audit:other-seat', title: '…', rationale: '…' }]` on a row that never collapsed
   with anything, and it renders into the filing prompt's "merged corroborations:" span, the issue-body
   instruction, `handoff.followUps[].merged`, and the consolidation log line — as if the engine itself
   preserved it. A test pins this as deliberate behavior for the *representative-row* case
   (`{ title: 'pre-existing' }` survives with defaults), but the read sites do not distinguish
   engine-derived elements from auditor-supplied ones.
3. **Three new `parkAsk({ task: <engine id>, seat: '<engine label>', sha: auditShaOrSentinel(...), ...f })`
   calls spread the auditor finding LAST.** A finding-level `sha`/`task`/`seat` key on the payload
   overrides the engine's own stamp, including the `audit_sha` sentinel guard a prior fix (#1693) added
   specifically to protect `asks[].sha`. The arm-local dedup also keys on the *engine* taskId while the
   parked record stores the *overridden* `f.task`, so a repeat wouldn't dedup either. Noted as
   consistent with an existing house convention elsewhere in the same file (`minorsOf`'s documented
   "explicit finding-level seat/sha, spread last, win") rather than a novel divergence — flagged so the
   residual is a recorded property of the ask channel, not an assumed-closed one.

## Why this is a durable pattern, not a one-off

The root cause is structural, not a typo: **`AUDIT_VERDICT`'s findings schema is deliberately
non-strict** (no `additionalProperties: false`), so any extra key an auditor's JSON output carries
survives every `...f`/`...m` spread in the consolidation and ask-parking code. Every downstream site
that later reads what LOOKS like an engine-derived provenance key (`seats`, `merged`, `sha`, `task`,
`seat`) off that same object is implicitly trusting auditor-controlled input as if it were
engine-authored state, unless there is an explicit intake-normalization step stripping/validating
those keys before the object is used for anything provenance-bearing (corroboration lists, dedup
keys, operator-facing attribution, gate stamps).

## How to apply

When adding a new engine-computed field to an object that started life as (or is spread from) an
auditor/agent-supplied JSON payload governed by a non-strict schema:
1. Check whether the schema has `additionalProperties: false`. If not, assume a hostile or merely
   sloppy payload can pre-seed **any** key name your new field will also use.
2. Normalize at intake — strip or validate the specific key(s) your engine logic is about to compute,
   before the compute step, rather than trusting `Array.isArray(...)`/truthiness checks alone (those
   guard against crashes, not against spoofed *content*).
3. If a "spread last wins" convention is intentional elsewhere in the same file (e.g. minorsOf's
   documented explicit-seat-wins rule), decide per-field whether that convention should extend to the
   new field or whether the new field is exactly the kind of engine-authoritative stamp (an audit_sha
   sentinel, a same-seat discrimination key) that should NOT be overridable — and say so explicitly in
   the code comment either way, so the choice is recorded rather than inherited by accident.

## Related

[[own-token-provenance-floor-vacuous-or-false-refusal-both-directions]] — a sibling class where a
provenance-floor guard (own-token check) errs in both directions on schema-shaped input; both trace to
the same general hazard of trusting agent-authored payload shape for a security/integrity property.
