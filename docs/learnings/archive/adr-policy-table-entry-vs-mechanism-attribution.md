---
name: adr-policy-table-entry-vs-mechanism-attribution
description: "ADR policy rows/status headers lag mechanism; update same task"
metadata:
  node_type: memory
  type: project
  provenance: agent-unverified
  slug: adr-policy-table-entry-vs-mechanism-attribution
  phase: F01-D2D3/p2 + red-team-plan-vs-state-grading-and-probe-sandboxing/t1.6
  keywords: [doc drift, confinement layering, capability allowlist framing, stale reference doc, under-attribution, chosen-option row, doc honesty sweep, ADR status header, decision bucket, friction attribution]
  tags:
    - doc-honesty
    - adr
    - scope-hook
    - auditor-lens
  related: "[[scope-hook-blind-to-bash-write-path]], [[scope-hook-servitor-pattern-residuals]], [[mirrored-prose-row-parenthetical-inversion]]"
  created: 2026-07-10
  originSessionId: 8c039a7f-0c62-47a8-85f9-10099b5a6caf
---

# ADR policy-table entries (and status headers) lag mechanism changes when prose is restructured elsewhere

## The durable rule
When a doc-honesty phase restructures the primary mechanism attribution (e.g. "hook → capability
allowlist"), the ADR's policy-table row describing that role must be updated in the **same task** —
don't assume it's covered by the other file updates. ADR policy tables are authoritative reference
docs; divergence from the rest of the living surface is a completeness gap even when each file is
internally consistent.

**Corollary:** conservative grep patterns that catch over-strong confinement *claims* will NOT
catch *under-attribution* in a policy table (different phrasing, no boolean-false claim). Auditor
must explicitly check ADR policy-table rows when mechanism attribution changes.

Original finding (F01 D3, Minor): the allowlist-primary framing landed in `war-servitor.md`,
`SKILL.md`, `schemas.md`, `design.md` but ADR 0002's chosen-option row still attributed the
servitor's confinement to the hook's per-role dispatch — not literally false, but inconsistent.

**Fixed:** `docs/adr/0002-scope-by-agent-type.md` now carries the "Confinement layering" framing
(capability allowlist primary; the `agent_type` hook and `..`-traversal guard as defense-in-depth
gating residual Write/Edit) in the chosen-option entry — the "`agent_type` structural guard
(chosen)" bullet under Considered options — tagged with this memory's slug (D4).

## Recurrence 2 (red-team-plan-vs-state-grading-and-probe-sandboxing/t1.6, Minor, disposition absorb)

Same class, different surface: a new ADR's **status header** (not a policy table) mis-attributed
which decision-bucket a friction belonged to. ADR 0013's status line bundled "the D7/D8
guarded-invariant additions to the auditor prompt (Decision 3)" — but friction D7 actually pins the
red-team **gate's** pass-only demotion set (a finding-severity/gate-contract change, Decision 4),
while only D8 (`adjudicationClause` on `auditPrompt()`) is a Decision-3/auditor-prompt addition. The
ADR's own inline Decision-4 note correctly attached D7 there — the top-level status header
contradicted the ADR's own body. Spec §7 confirmed the correct bucketing (D7 = gate contract, D8/D9
= auditor prompt).

**Generalized rule:** when an ADR's status header/summary line groups several "friction" or
decision IDs by surface (e.g. "the auditor prompt additions"), re-derive each ID's bucket from the
ADR's own inline per-decision notes (or the source spec's section) rather than trusting the header's
grouping — a header written before or after an inline note is a common place for silent
re-bucketing to drift in, even inside the same document.

Referent not verified in this checkout @ phase red-team-plan-vs-state-grading-and-probe-sandboxing
(worktree predates that branch's merge; `docs/adr/0013-commanders-intent-and-disposition-routing.md`
was not read) — verify the status-header wording before citing it as still-current.

[[mirrored-prose-row-parenthetical-inversion]]

> archived 2026-07-11: resolved — moved to archive
