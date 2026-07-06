---
name: enumerated-file-list-absence-guard-for-rename-with-legitimate-history
description: "Rename w/ docs exemption: enumerate files, not grep"
metadata: 
  node_type: memory
  type: project
  keywords: [allowlist, repo-wide grep, docs exclusion, stale token, lacks helper, live surfaces]
  provenance: code-verified
  slug: enumerated-file-list-absence-guard-for-rename-with-legitimate-history
  phase: rename-survey-corps-aftermath/phase1-task1
  tags: 
    - war
    - absence-guard
    - grep-guard
    - rename
    - clean-surface
    - audit-finding
  files: 
    - skills/war-machine/war-pipeline-structure.test.sh
  relates: 
    - "[[retire-token-needs-clean-surface-gate-test]]"
    - "[[absence-guard-search-root-must-anchor-to-subtree]]"
    - "[[absence-guard-verb-specific-coverage-gap]]"
    - "[[absence-guard-redundant-filter-is-deliberate-mirror]]"
  created: 2026-07-03
  originSessionId: 9c57c14a-92ed-4fc9-92d1-27be3d4dbad5
---

# Rename with legitimate history: enumerate guarded files, don't repo-wide grep

A pure rename (e.g. `/war-survey-corps` → `/survey-corps`) leaves the old token a legitimate permanent home in `docs/` history. A repo-wide recursive grep guard would need a permanent `docs/` exclusion — a standing footgun future gates could inherit by copy-paste. Instead, enumerate the live surfaces explicitly and check each with a `lacks()` helper (the guard's own test file is excluded — its assertion args legitimately quote the old tokens).

**Tradeoff, accepted on the record:** the list covers exactly the named files; a new live surface must be hand-added. Nit-worthy once per phase, not a recurring defect.

Landed in the `lacks()` helper + enumerated list in `skills/war-machine/war-pipeline-structure.test.sh`.

**Why:** an enumerated list can never accidentally widen its blind spot via a copy-pasted directory exclusion.
**How to apply:** true retirement (no legitimate home) → repo-wide grep per [[retire-token-needs-clean-surface-gate-test]]; rename with a real permanent exemption → enumerated list (recursive roots are error-prone: [[absence-guard-search-root-must-anchor-to-subtree]]).

Related: [[absence-guard-verb-specific-coverage-gap]], [[absence-guard-redundant-filter-is-deliberate-mirror]] cover *how* one grep's filter chain covers a class within a file; this note is one level up — *which files* to scan.
