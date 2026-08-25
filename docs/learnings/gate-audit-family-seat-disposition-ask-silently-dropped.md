---
name: gate-audit-family-seat-disposition-ask-silently-dropped
description: "Widening AUDIT_VERDICT's disposition enum on the standing auditor card (agents/war-auditor.md) reaches EVERY seat that reads it, including the three gate-audit-family seats — but those seats' findings route straight into auditLog/escalated (workflow-template.js, never through dispositionOf), so a gate-audit seat's disposition:'ask' silently never parks and never reaches the Checkpoint strike-list gate"
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

# Widening a shared disposition enum on the standing instruction card doesn't mean every consumer routes the new member — check every collection site, not just the primary one

**What happened (code-verified — confirmed at the landed tip `4bbfdc3902d079261eb607f3a5dc2f7d153f22fe`
on `dev/2026-08-25-ask-disposition`, read via the matching `_refinery` worktree):**
`agents/war-auditor.md`'s DISPOSITION RULE is the standing instruction read by EVERY auditor
seat — including the three gate-audit-family seats (per-task post-merge, integrated-tip,
end-state-only) — and now advertises `ask` as a routable disposition alongside `absorb`/
`follow-up`/`note`. But `skills/war/assets/workflow-template.js`'s gate-audit collection site
(around the `gateAuditVerdict` block, `auditLog.push({ task: taskId, verdict:
\`gate-audit:${gateAuditVerdict.verdict}\`, findings, gateEvidence: true, ... })`) pushes
`rawFindings`/`findings` straight onto the log — it never calls `dispositionOf(f)` and never
calls `parkAsk(f)`. `dispositionOf` and `parkAsk` are invoked only at the roster-seat collection
sites (worker-task Minor/Nit collection, the sub-seat/floor-retry loop, and the polish/phase-close
sweep) — never at the gate-audit-family sites. So a gate-audit seat that honestly emits
`disposition: 'ask'` on a Minor/Nit produces a question that never reaches `asks[]`, never
reaches the handoff's ninth key, and therefore never reaches the Checkpoint strike-list ruling
gate — it is silently indistinguishable from any other disposition at that lane, all of which are
equally unrouted (the same is true today for `follow-up`/`absorb`/`note` from a gate-audit seat).

**Why this wasn't a hold:** the plan's binding guardrail floors the disposition order-census
domain at exactly "the six `dispositionOf` sites plus the `pinMismatch` strip" — the gate-audit
lane is outside that floored domain by design, so the gap is inside the ratified scope, not a
regression. It was recorded by the audit log as a Minor follow-up (no comment, no census row
naming the gate-audit lane as a deliberate non-route, unlike the `pinMismatch` strip which DOES
get a named comment + census row).

**The durable pattern:** when a plan widens a shared enum by editing the STANDING CARD that every
seat-type reads, the widening is visible to all seats uniformly — but the ENGINE-SIDE ROUTING for
that enum's values may be scoped to only a subset of the collection sites that ingest seat output.
A structural change of this shape needs an explicit audit of every place seat findings/verdicts
are collected (grep for `.push(` sites feeding `auditLog`/`escalated`, not just the "obvious"
worker-audit path), and any deliberately-unrouted sink should carry a comment + census row (the
precedent this diff itself set for the `pinMismatch` strip) so a later reader can tell "excluded
by design" from "forgotten."

**How to apply:** before trusting that a disposition/enum-consuming behavior is uniform across
seat types, grep every `.push({ ..., findings` (or equivalent verdict-ingestion) call site in
`workflow-template.js` and check whether each one funnels through the shared router
(`dispositionOf`, `demote()`, etc.) or bypasses it. A standing-card-level widening reaching "every
seat" is a claim about PROMPT surface, not about ENGINE ROUTING surface — the two can diverge.

Related: [[parked-ask-sha-provenance-stamp-shipped-with-only-a-negative-test]] (a second live gap
recorded from the same phase's audit log); [[prose-contract-widening-outruns-the-closed-executable-schema-literal]]
(archived — a sibling class where widening one contract surface silently fails to widen a second,
sibling surface that shares the same concept).
