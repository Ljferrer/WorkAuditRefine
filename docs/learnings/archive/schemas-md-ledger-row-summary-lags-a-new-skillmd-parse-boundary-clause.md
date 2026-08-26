---
name: schemas-md-ledger-row-summary-lags-a-new-skillmd-parse-boundary-clause
description: "skills/war/references/schemas.md's ledger.json field-comment rows are informal summaries of…"
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
  slug: schemas-md-ledger-row-summary-lags-a-new-skillmd-parse-boundary-clause
  phase: 2026-08-06-structural-pin-extractors/1.2
  keywords: 
    - schemas.md drift
    - ledger.json doneWhen row
    - SKILL.md intake bullet
    - parse boundary
    - doc cascade gap
    - unregistered mirror
    - ADR 0025 mirror pair
    - contract sheet lag
  tags: 
    - documentation
    - audit-finding
    - doc-cascade
  created: 2026-08-17
  originSessionId: 8bae67aa-acfa-461e-acc9-278fc79ba6c1
  modified: 2026-08-17T19:31:16.849Z
---

# schemas.md's field-comment rows can silently lag a richer SKILL.md clause

**The instance (2026-08-06-structural-pin-extractors/1.2, two Nit notes, same finding class):**
Task 1.2 added a backtick-stripping parse boundary to `skills/war/SKILL.md`'s `**Done-when
intake` lead-in bullet (verify still present before acting, found at that bullet, line 37 — grep
`backticks`), alongside the pre-existing value-vs-key boundary. `skills/war/references/schemas.md`'s
`ledger.json` `doneWhen` field comment (verify still present before acting, found at that file's
task-shape block, the `doneWhen: null` row) still describes the parse as only "the task's `Done
when:` acceptance command, parsed at Decompose as the FULL bullet (soft-wrapped physical lines
joined with single spaces)" — the value-boundary and now the backtick-stripping boundary are
unstated there. No guard reds: the D31 structural-doc-contracts suite reads SKILL.md only, and
schemas.md's `doneWhen` row is not a registered ADR-0025 mirror pair with any SKILL.md clause, so
this is a genuine, silent, unguarded gap — not a defect in either surface (the schemas.md text
stays literally true, just under-detailed).

**The durable rule:** `skills/war/references/schemas.md`'s per-field ledger-row comments are
informal summaries, not registered mirrors, of the richer parse rules stated in
`skills/war/SKILL.md`'s intake bullets — a future change adding or refining a SKILL.md intake
parse boundary (Done-when, Files:, Gate:, etc.) will not be caught by any drift guard if
schemas.md's summary row is left behind. When touching a SKILL.md intake bullet's parse rule,
proactively check the corresponding schemas.md row for staleness rather than relying on a test to
catch it — and if the gap is judged worth closing, either register the pair as an ADR-0025 mirror
(so a guard exists) or extend the schemas.md row's parenthetical in the same change.

> archived 2026-08-25: resolved — moved to archive
