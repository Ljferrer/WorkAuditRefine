---
name: generic-runbook-section-can-omit-a-duty-only-a-specific-sibling-procedure-carries
description: "RESOLVED (Adjudication continuity bullet landed in SKILL.md Recovery relaunch, 2026-07): the generic Recovery relaunch section covered the exact incident shape a new duty targets, but only the specific held-partial-phase runbook got the instruction"
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
  slug: generic-runbook-section-can-omit-a-duty-only-a-specific-sibling-procedure-carries
  phase: audit-adjudication-threading/1.2
  created: 2026-07-22
  tags: 
    - SKILL.md
    - runbook-completeness
    - doc-survey
    - recovery-relaunch
    - args.adjudications
  keywords: 
    - Recovery relaunch section
    - Shared mechanics bullets
    - held-partial-phase runbook
    - single-task retry entry a
    - whole-phase relaunch entry b
    - duty homed in one procedure only
    - re-thread adjudications
    - sibling procedure survey
    - two sites resolved but only one instructed
  originSessionId: 8e99f0a3-aecc-4068-9cd8-79868840feb7
  modified: 2026-07-23T00:46:14.500Z
---

# A generic runbook section can cover the exact incident shape a new duty targets, yet not carry it

**What happened (code-verified — `skills/war/SKILL.md`, audit-adjudication-threading/1.2,
`disposition: note`, Minor):** the phase threaded the `args.adjudications` re-thread duty into the
held-partial-phase runbook's step 4 only — but the same doc's more generic `### Recovery relaunch`
section, whose entry (a) single-task retry IS the incident's exact shape, carried no mention in
its `Shared mechanics` bullets: a Lead reaching the generic section directly re-audited
adjudication-blind, the precise failure the phase existed to close. The landed diff was fully
plan-faithful; the spec's "two sites" resolution was a plan-scoping gap — it never surveyed
sibling procedures sharing the incident shape.

**The rule:** when a plan/spec adds a duty to one specific runbook/procedure closing an incident,
grep the same doc for every other, more generic procedure covering the identical situation shape
(not just the identically-named one) before treating "two sites" or "N sites" as exhaustive — a
doc can house the same scenario under both a narrow named runbook and a broader generic section,
and a duty threaded into only the narrow one leaves the broader one's readers exposed.

**RESOLVED (2026-07):** the `### Recovery relaunch` section's `Shared mechanics` list now carries
the **Adjudication continuity** bullet — re-thread the full accumulated `args.adjudications` set
from the ledger record, alongside `args.recovery`, "so neither entry point ever relaunches a seat
adjudication-blind" — byte-matching this lesson's suggested fix.

Related: [[standing-instruction-vs-dispatched-prompt-coverage-split]] (repo) — the closest existing
doctrine on a duty needing mirroring into a second surface, though that pairing is standing-`.md`
vs dispatched-prompt, not two sections of the same standing doc.
[[doc-promises-ledger-field-the-schema-contract-never-defines]] — sibling finding from the same
phase, same doc-completeness-survey theme, different file (schemas.md vs SKILL.md).

> archived 2026-07-27: resolved — moved to archive
