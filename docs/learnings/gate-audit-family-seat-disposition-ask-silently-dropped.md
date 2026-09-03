---
name: gate-audit-family-seat-disposition-ask-silently-dropped
description: "Widening an enum on the standing auditor card reaches every seat prompt, not every engine routing site; audit each findings-ingestion site."
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
  slug: gate-audit-family-seat-disposition-ask-silently-dropped
  phase: ask-disposition/phase-1 (task 1.1)
  tags: 
    - workflow-template.js
    - dispositionOf
    - gate-audit
    - AUDIT_VERDICT
    - disposition
    - standing-card
    - enum-widening
    - routing-gap
  keywords: 
    - gate-audit disposition
    - ask disposition dropped
    - dispositionOf coverage
    - standing card enum widening
    - auditLog.push
    - gate-audit-family seats
    - routing gap
    - disposition never routed
  created: 2026-08-25
  originSessionId: 351f8fc5-4d48-4ee9-8beb-5d257d9bcf6f
  modified: 2026-08-25T22:22:29.339Z
---

# Widening a shared disposition enum on the standing card does not mean every consumer routes the new member

**Rule:** a widening on the standing auditor card (`agents/war-auditor.md`) reaches every
seat's PROMPT. It says nothing about the ENGINE routing in
`skills/war/assets/workflow-template.js`. Audit every site that ingests seat findings, not
just the primary worker-audit path.

**What happened:** the DISPOSITION RULE on the standing card began advertising `ask` next
to `absorb` / `follow-up` / `note`. The three gate-audit-family seats (per-task
`execution-evidence`, `integrated-tip`, `end-state`) read that card too. But their findings
were pushed straight onto `auditLog` / `escalated` without passing through `dispositionOf`
or `parkAsk`. Those two were called only at the roster-seat collection sites. So a gate-audit
seat that honestly emitted `disposition: 'ask'` produced a question that never reached
`asks[]`, the handoff, or the Checkpoint strike-list gate. The plan's census floor covered
only the `dispositionOf` sites plus the `pinMismatch` strip, so this sat inside the ratified
scope and was logged as a Minor follow-up, not a hold.

**Fixed in** commit `bf0d840` (PR #1784, tracked as #1692): all three gate-audit-family sites
now call `parkAsk(...)` under a `#1692` comment, and the `parkAsk` header comment counts
"the three gate-audit-family comment-named ask arms".

**How to apply:** before trusting that an enum-consuming behavior is uniform across seat
types, grep every `.push({ ..., findings` (or equivalent verdict-ingestion) call in
`workflow-template.js` and check whether each one funnels through the shared router
(`dispositionOf`, `demote()`, `parkAsk`) or bypasses it. Any deliberately unrouted sink
should carry a comment plus a census row, as the `pinMismatch` strip does, so a later reader
can tell "excluded by design" from "forgotten".

Related: [[parked-ask-sha-provenance-stamp-shipped-with-only-a-negative-test]] (a second gap
from the same phase's audit log);
[[prose-contract-widening-outruns-the-closed-executable-schema-literal]] (archived; a sibling
class where widening one contract surface fails to widen a second surface sharing the same
concept).
