---
name: worker-self-check-before-commit-catches-over-scoped-universal-claims
description: "A fix worker caught three of its own over-scoped universal claims during self-check before committing — one flatly false ('every file in the scanned corpus carries a ## heading', disproven by docker-gate.md, which is in the scan corpus but never passed to headerRegion since it's absent from the hand-enumerated QUALIFIED_HEADERS allowlist)"
metadata: 
  node_type: memory
  type: project
  keywords: 
    - self-check
    - verify before asserting
    - over-scoped claim
    - universal quantifier
    - headerRegion
    - QUALIFIED_HEADERS
    - docker-gate.md
    - reference-link-integrity.test.mjs
    - pre-commit discipline
    - worker discipline
  provenance: code-verified
  slug: worker-self-check-before-commit-catches-over-scoped-universal-claims
  phase: 2026-08-06-references-pointer-integrity/phase-2
  tags: 
    - war
    - worker
    - discipline
    - verify-before-asserting
    - prose-precision
  relates: 
    - "[[imprecise-claim-that-verbatim-mirrors-a-higher-authority-surface-scores-nit-not-defect]]"
    - "[[release-blurb-overstates-guard-semantics]]"
  created: 2026-08-18
  originSessionId: db0604c4-3009-475d-8db8-5d92ff291ce2
  modified: 2026-08-18T18:31:04.127Z
---

# A worker self-check before commit caught three of its own over-scoped claims

**What happened (`2026-08-06-references-pointer-integrity`, phase 2, task #1544):** the fix
worker reviewed its own draft prose before committing and caught three over-scoped universal
claims, one of them flatly false: "every file in the live scanned corpus carries a `## ` heading."
`code-verified`: `skills/war/assets/reference-link-integrity.test.mjs` scans the whole
`skills/war/references/` directory for link integrity (its `SCAN_DIRS`/corpus), but the
`headerRegion` helper — "text preceding the file's first `## ` heading" — is applied only to the
files named in a separate, hand-enumerated `QUALIFIED_HEADERS` array, not the full scanned
corpus. `skills/war/references/docker-gate.md` is inside the scanned corpus but is absent from
`QUALIFIED_HEADERS`, and its only heading is an H1 (`# Opt-in docker gate — probe-build routing`),
never a `## ` — so it is both a live counterexample to "every file... carries a `## ` heading" and
a file that never reaches `headerRegion` at all.

## Durable rule

The reproduce/verify-before-asserting discipline works at the worker tier, not just at
review/audit time: before shipping a universal claim ("every file in X", "all N cases"), check
the actual enumerated set the code operates over rather than the directory/corpus the claim's
author has in mind — a hand-maintained allowlist (`QUALIFIED_HEADERS`) is very often narrower than
the broader scan set (`SCAN_DIRS`) it lives inside, and a claim true of the broader set is not
automatically true of the narrower one a specific helper actually touches.

**Locate-cue (verify still present before acting):**
`skills/war/assets/reference-link-integrity.test.mjs` — `headerRegion` (extracts text before the
first `^## ` match) and `QUALIFIED_HEADERS` (the hand-enumerated array it's applied to);
`skills/war/references/docker-gate.md` line 1 carries only an H1.

Related:
[[imprecise-claim-that-verbatim-mirrors-a-higher-authority-surface-scores-nit-not-defect]] (same
phase, the audit-tier sibling of this verify-before-asserting discipline).
