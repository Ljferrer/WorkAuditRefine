---
name: generic-runbook-section-can-omit-a-duty-only-a-specific-sibling-procedure-carries
description: "SKILL.md's generic Recovery relaunch section covers the exact incident shape a new duty targets, but only the specific held-partial-phase runbook got the instruction"
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

**What happened (code-verified — `skills/war/SKILL.md`, audit-adjudication-threading phase 1 task
1.2, `disposition: note`, Minor):** the phase's Purpose is closing exactly one incident: "a ruling
the Lead has already made never costs a phase again ... a full `held:escalation` + sanctioned
relaunch paid for a decision already made and routed." The landed diff instructs the re-thread duty
in exactly one place — the **held-partial-phase recovery runbook**'s step 4 ("... and the full
accumulated `args.adjudications` set, re-threaded from the ledger record, alongside `args.recovery`
— so relaunch seats are never adjudication-blind"). But `SKILL.md` also carries a separate, more
generic **`### Recovery relaunch`** section two-thirds of a page above it, with its own **`Shared
mechanics (both entry points)`** bullets (owned-file continuity, prior-commits-kept, normal land
path) covering entry **(a)** single-task retry of an escalated/`env-blocked` task and entry **(b)**
whole-phase relaunch — and entry (a) is *itself* the incident's exact shape (a fresh run
re-dispatching one escalated task to fresh audit seats). That section's Shared mechanics bullets
carry no mention of `args.adjudications` at all: a Lead who reaches the generic section directly
(rather than via the more specific held-partial-phase runbook) re-audits adjudication-blind — the
precise failure the phase exists to close.

**Not a worker deviation:** the design spec explicitly resolved "two sites" for this duty (D3), and
the plan slice for Task 1.2 names only the held-partial-phase runbook's steps 1 and 4 — the landed
diff is fully plan-faithful to its own slice. The gap is a **plan-scoping** gap: the spec's "two
sites" resolution didn't survey every sibling procedure in the same doc that shares the incident
shape.

**The rule:** when a plan/spec adds a duty to one specific runbook/procedure closing an incident,
grep the same doc for every **other**, more generic procedure that covers the identical situation
shape (not just the identically-named one) before treating "two sites" or "N sites" as exhaustive —
a doc can house the same real-world scenario under both a narrow named runbook and a broader generic
section, and a duty threaded into only the narrow one leaves the broader one's readers exposed to
the exact incident the duty exists to prevent.

**Suggested fix (not applied — recorded as `note`, optional per the audit):** one clause in the
`### Recovery relaunch` section's `Shared mechanics` bullets — a fresh relaunch run re-threads the
full accumulated `args.adjudications` set from the ledger record, same as the held-partial-phase
runbook's step 4.

Related: [[standing-instruction-vs-dispatched-prompt-coverage-split]] (repo) — the closest existing
doctrine on a duty needing mirroring into a second surface, though that pairing is standing-`.md`
vs dispatched-prompt, not two sections of the same standing doc.
[[doc-promises-ledger-field-the-schema-contract-never-defines]] — sibling finding from the same
phase, same doc-completeness-survey theme, different file (schemas.md vs SKILL.md).
