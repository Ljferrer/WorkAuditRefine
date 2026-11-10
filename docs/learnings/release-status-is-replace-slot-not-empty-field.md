---
name: release-status-is-replace-slot-not-empty-field
description: "README ## Status = replace-in-place, never empty; diff the whole section, not one paragraph"
metadata: 
  node_type: memory
  slug: release-status-is-replace-slot-not-empty-field
  phase: "5 +1 recurrence (2026-08-06-references-pointer-integrity/phase-2 Release task #1544, 2026-08-18)"
  type: project
  provenance: agent-unverified
  keywords: 
    - version bump
    - overwrite paragraph
    - populate empty premise
    - single current value
    - latest pointer
    - verify baseline
    - half-replaced blurb
    - stale bullets
    - prior release bullets
    - self-contradiction
    - README diff
    - mechanical backstop gap
    - section-level replace
  tags: 
    - war
    - release
    - readme
    - status-section
    - plan-repo-mismatch
    - mirrored-value
    - reusable-pattern
  files: 
    - README.md
    - .claude-plugin/plugin.json
    - .claude-plugin/marketplace.json
  relates: 
    - "[[retire-token-needs-clean-surface-gate-test]]"
    - "[[release-blurb-overstates-guard-semantics]]"
    - "[[readme-markdown-links-excluded-from-reference-link-integrity-sweep]]"
    - "[[audit-log-finding-can-be-stale-by-land-time]]"
  created: 2026-08-18
  originSessionId: db0604c4-3009-475d-8db8-5d92ff291ce2
  modified: 2026-08-18T18:30:26.275Z
---

# README `## Status` is a replace-in-place release slot, not an empty field

**Rule.** `README.md ## Status` holds exactly one current-release paragraph. The release operation is always "overwrite the whole paragraph with the new version's note", never append below and never treat it as a blank to fill. The slot is always non-empty after the first release, so a plan slice saying "populate an EMPTY Status" is wrong on every later release.

**Why:** a "populate empty" framing hands the worker a false premise, and a mirrored-slot overwrite silently replaces a real prior value. Verify the baseline yourself instead of trusting the "empty" wording.

**How to apply:** for any single-current-value slot (Status paragraph, version string, a "latest" pointer), read plan text saying "populate" as **"replace and verify baseline"**. Full slot enumeration lives in [[release-bump-slots-canonical-no-badge]].

**Recurrence 1 (2026-08-18, task #1544, fixed before land in `e68ee16`).** A release worker replaced only the Status headline and left the prior release's bullet list under it, and one stale bullet contradicted the new headline. No check caught it, only the Lead reading the diff. README Status no longer carries a bullet block, but the generic rule stands: diff the whole `## Status` region (heading through the next `## `), not just the paragraph you touched.

Related: [[release-blurb-overstates-guard-semantics]] (precision of a claim within the paragraph); [[audit-log-finding-can-be-stale-by-land-time]] (same "fixed before land" shape — record the pattern, not the resolved instance); [[readme-markdown-links-excluded-from-reference-link-integrity-sweep]] (README sits outside the mechanical sweeps); [[retire-token-needs-clean-surface-gate-test]].
