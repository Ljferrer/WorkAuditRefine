---
name: scaffold-comment-filter-vs-discard-precision
metadata:
  node_type: memory
  slug: scaffold-comment-filter-vs-discard-precision
  phase: red-team-verdict-integrity/t4.1
  type: project
  keywords: [misleading wording, header comment drift, blockers bucket, allFindings, dropped vs excluded, gate mechanics prose]
  tags:
    - red-team
    - skill-docs
    - precision
    - scaffold
    - doc-code-mismatch
    - auditor-nit
  files:
    - skills/red-team/assets/workflow-scaffold.js
  relates:
    - "[[pass-probe-demotion-gate-layer-without-probe-contract]]"
    - "[[source-comment-lags-emitted-prompt-after-rewrite]]"
  created: 2026-06-26
  originSessionId: e734fab0-d931-4547-a090-ed30c93e12f8
---

# Scaffold comment "discarded" is looser than the actual filter-from-blockers mechanism

## What the auditor flagged (Nit, not a false claim)

The header comment in `workflow-scaffold.js` (verify still present before acting) describes a
pass-probe Critical/Major as "discarded as a non-defect." The actual mechanism in `classify()`
(`red-team-gate.mjs`, verify still present before acting) is:

- The finding is **filtered out of the blockers bucket** (and the minors bucket, since it carries
  a Critical/Major severity), so the Red Team Lead never acts on it.
- The finding is **NOT removed from `allFindings()`** — it remains in the flat list.

"Discarded" implies the finding disappears entirely; "filtered from blockers" is the precise term.
The load-bearing claim ("does not block") is correct either way, so the auditor rated this Nit
(no possibility of misdirection from the Red Team Lead's perspective), but the wording is worth
tightening when the comment is next touched.

## The durable rule

When writing skill-doc prose or scaffold header comments that describe gate mechanics:
- "Discarded" or "dropped" → the object no longer exists in ANY downstream consumer.
- "Filtered" or "excluded from X" → the object still exists but is not routed to X.

Using the wrong word causes future workers to expect the finding to vanish from diagnostics or
logs. In this codebase, `allFindings()` threading means the finding survives; only the blocker
routing is removed.

## How to apply

1. Before writing "discarded" in a gate-side comment, verify: does the object still appear in
   `allFindings()` or any other output array? If yes, use "filtered from blockers" instead.
2. The correctness test is whether the Red Team Lead's visible output changes — the lead sees
   blockers, needsDecision, and minors. A pass-probe Critical appears in none of those, so
   "does not appear to the Lead" is accurate. "Discarded" conflates this with "removed from
   the data model."
3. When updating `classify()` logic (verify still present before acting before any edit), update
   the scaffold header comment in the same commit to keep prose and mechanism in sync.

Relates to [[pass-probe-demotion-gate-layer-without-probe-contract]] (the gate-layer demotion
contract this comment documents) and [[source-comment-lags-emitted-prompt-after-rewrite]] (the
general pattern of comments lagging code changes).

> archived 2026-07-15: resolved — moved to archive
