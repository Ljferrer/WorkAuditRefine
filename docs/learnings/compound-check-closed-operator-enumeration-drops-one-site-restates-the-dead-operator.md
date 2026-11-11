---
name: compound-check-closed-operator-enumeration-drops-one-site-restates-the-dead-operator
description: "Dropping a member from a closed list can leave a sibling clause still naming it"
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
  keywords: 
    - closed enumeration
    - compound check
    - short-circuit
    - max exit code
    - shell OR
    - dead mention
    - sibling clause
    - endstate check
    - COMPOUND CHECKS
    - D16
    - PIN-20
    - workflow-template
  slug: compound-check-closed-operator-enumeration-drops-one-site-restates-the-dead-operator
  phase: "2026-09-06-engine-and-audit-verdict-integrity/phase-10 (task 10.1), landed b5f5a69b5dad11861341b1c9ef82f0cebda4a09b on dev/2026-09-06-engine-and-audit-verdict-integrity"
  tags: 
    - war
    - audit-findings
    - workflow-template
    - endstate-check
    - closed-enumeration
  created: 2026-09-08
  originSessionId: e8da971f-dacd-4f27-a998-5f603270dabe
  modified: 2026-09-08T17:13:39.241Z
---

# A closed operator enumeration fixed at its main site can leave a sibling clause still naming the dropped operator

**Rule.** One membership fact stated in prose at more than one site decays independently at each site. When a closed set gains or loses a member, grep the member's literal across the whole touched paragraph and every sibling restatement, not just the line the fix targets.

**Incident (task 10.1, 2026-09-08).** A fix dropped `||` from an operator list in the `endstate-check` dispatch build but left `||` in a short-circuit note in the same paragraph. Three gate-audit seats flagged it, and an ace batch removed it. A grep for `||` across the paragraph would have caught it in the first round.

**Superseded in 320660c7 (#2259).** The `STATEMENT BOUNDARIES (#1782, operator ruling 2026-09-07)` clause replaced that clause. The test titled `endstate: compound check exit aggregation` in `skills/war/assets/workflow-template.engine-1.test.mjs` now pins the clause and its retired strings.

**Why:** This is the mirror image of [[source-comment-lags-emitted-prompt-after-rewrite]]'s closed-enumeration trap. That instance was an addition not propagated to a sibling restatement. This one was a removal. The root cause is the same.

**How to apply:** Before closing a fix that changes a set's membership, list every prose restatement of the set and pin each with a test. A loose label match proves nothing about the members.

**Locate-cue (verify still present before acting):** `skills/war/assets/workflow-template.js`, search `STATEMENT BOUNDARIES (#1782` (inside the `endstate-check` dispatch build); `agents/war-auditor.md`, search `intake_lint` at the card's execution rung 1.

**Related:** [[audit-panel-unanimity-beats-majority-and-round0-escalation-is-a-known-pre-phase-11-gap]] (the same task 10.1 incident's audit-process side).
