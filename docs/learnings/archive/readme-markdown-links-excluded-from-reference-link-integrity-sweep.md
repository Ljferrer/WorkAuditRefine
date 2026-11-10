---
name: readme-markdown-links-excluded-from-reference-link-integrity-sweep
description: "reference-link-integrity.test.mjs sweeps SCAN_UNITS = SCAN_DIRS plus the README root (a union), so README.md relative links are now checked; SCAN_DIRS itself still covers only agents/ and skills/war/references/"
metadata: 
  node_type: memory
  type: project
  keywords: 
    - README links
    - link integrity
    - reference-link-integrity.test.mjs
    - SCAN_DIRS
    - SCAN_FILES
    - SCAN_UNITS
    - release blurb links
    - dead link
    - relative link
    - README joins sweep
  provenance: code-verified
  slug: readme-markdown-links-excluded-from-reference-link-integrity-sweep
  phase: "2026-08-06-war-strategy-mirror-guards/phase-3 (Release, task 3.1)"
  tags: 
    - war
    - release
    - readme
    - link-integrity
    - test-coverage
  created: 2026-08-18
  originSessionId: db0604c4-3009-475d-8db8-5d92ff291ce2
  modified: 2026-09-03T19:12:15.298Z
---

# README.md's relative links joined the link-integrity sweep by a union, not by widening SCAN_DIRS

**Fact (code-verified, #1673):** `skills/war/assets/reference-link-integrity.test.mjs` has a
`SCAN_FILES = ['README.md']` union member and a `SCAN_UNITS = [...SCAN_DIRS, ROOT_DIR]` array.
Every floor in the file iterates `SCAN_UNITS`, not the bare `SCAN_DIRS`. `SCAN_DIRS` itself is
untouched and still scans only `agents/` and `skills/war/references/`. README joins alongside it.

So a dead relative link in a `## Status` blurb now fails
`node --test skills/war/assets/reference-link-integrity.test.mjs`. No hand-verify step is needed
for README links.

**How to apply:** when you read or extend this suite, look at `SCAN_UNITS` for the real coverage,
not `SCAN_DIRS`. Other root-level `*.md` files are not covered unless they join the union.

**History:** this lesson first recorded (2026-08-18) that README.md was outside every mechanical
link sweep. Task 2.1 of `2026-08-25-doc-truth-and-drift-guard-debt` closed that gap on 2026-09-03.

Same family as [[verbatim-doc-move-breaks-relative-links-authored-for-old-location]] (a link-rot
cause); this lesson is about coverage.

> archived 2026-08-30: resolved — moved to archive
