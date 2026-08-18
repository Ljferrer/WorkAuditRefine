---
name: readme-markdown-links-excluded-from-reference-link-integrity-sweep
description: "reference-link-integrity.test.mjs scans only agents/ and skills/war/references/ (SCAN_DIRS) — README.md's own relative markdown links are outside every mechanical link-integrity sweep and must be hand-verified each release"
metadata: 
  node_type: memory
  type: project
  keywords: 
    - README links
    - link integrity
    - reference-link-integrity.test.mjs
    - SCAN_DIRS
    - unguarded links
    - release blurb links
    - link rot
    - hand-verify
    - markdown link sweep
    - dead link
    - relative link
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
  modified: 2026-08-18T08:56:28.194Z
---

# README's own markdown links are outside every mechanical link-integrity sweep

## The gap

`reference-link-integrity.test.mjs` is the repo's only durable link-resolution sweep, but its
`SCAN_DIRS` constant is `['agents', 'skills/war/references']` — `code-verified`, read directly at
`skills/war/assets/reference-link-integrity.test.mjs` lines 34-36 (the file's own header comment,
lines 1-5, names its scope as "the two prose roots that carry `references/` pointers"). `README.md`
is not in `SCAN_DIRS` and is not touched by any other mechanical sweep in the repo — this is a
deliberate scope boundary (the file scans directory-by-directory, never a hand-enumerated file
list, specifically so a renamed/added surface widens the sweep rather than silently narrowing it —
but README.md was never added to that directory set at all).

**Consequence:** every release's `README.md` `## Status` blurb typically ships several relative
markdown links (this repo's own release checklist and prior Status paragraphs commonly carry
4-7 per release) with **no mechanical backstop** verifying they resolve. A dead link introduced in
a Status blurb — a moved doc, a renamed lesson slug, a typo'd path — will pass every test suite and
every existing guard silently.

## How to apply

- When authoring or auditing a release `## Status` blurb (or any README edit that adds a relative
  link), hand-verify each link target resolves at the landed tip — there is no `check:`/`gate:`
  equivalent to lean on. `git show <tip>:<target-path>` (or an equivalent existence check) per link
  is the only available discipline.
- If `reference-link-integrity.test.mjs`'s `SCAN_DIRS` is ever revisited, widening it to include
  `README.md` (or root-level `*.md` generally) would close this gap — but as of this phase that
  widening has not happened and is not proposed anywhere; this lesson records the current gap as a
  known, standing risk, not a promised fix.
- Same family as [[verbatim-doc-move-breaks-relative-links-authored-for-old-location]] (a link-rot
  cause) but this lesson is about **coverage**, not a specific breakage — the absence of any guard
  over README's own links at all.
