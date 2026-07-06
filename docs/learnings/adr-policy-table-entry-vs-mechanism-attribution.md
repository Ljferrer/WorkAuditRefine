---
name: adr-policy-table-entry-vs-mechanism-attribution
description: "ADR policy rows lag mechanism; update same task"
metadata: 
  node_type: memory
  type: project
  keywords: [doc drift, confinement layering, capability allowlist framing, stale reference doc, under-attribution, chosen-option row, doc honesty sweep]
  slug: adr-policy-table-entry-vs-mechanism-attribution
  phase: F01-D2D3/p2
  tags: 
    - doc-honesty
    - adr
    - scope-hook
    - auditor-lens
  related: "[[scope-hook-blind-to-bash-write-path]], [[scope-hook-servitor-pattern-residuals]]"
  originSessionId: fab06e87-b8c3-454f-a1d8-ecc9fa41faf6
---

# ADR policy-table entries lag mechanism changes when prose is restructured elsewhere

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
