---
name: shell-digit-only-value-extraction-truncates-legal-js-numeric-literal-forms
description: "A shell floor's numeric-value extraction via `[0-9]+`-only regex (grep/sed) silently truncates at the first non-digit character — a legal JS numeric literal the guarded file may contain (numeric separator `100_000`, hex `0x13880`, exponent `1e5`) reads as only its leading digit run, so a raise that changes trailing digits after the separator/marker is invisible to the comparison and a ceiling-raise floor fails open"
metadata: 
  node_type: memory
  type: project
  keywords: 
    - numeric separator
    - JS numeric literal
    - sed digit extraction
    - grep digit regex
    - fail-open floor
    - value truncation
    - hex literal
    - exponent literal
    - budget ceiling raise
    - assert-budget-raise-cited.sh
    - 0x
    - "1e5"
    - underscore separator
  provenance: code-verified
  slug: shell-digit-only-value-extraction-truncates-legal-js-numeric-literal-forms
  phase: 2026-08-25-engine-reliability-and-filing-fidelity/2.1
  tags: 
    - war
    - shell
    - regex
    - gotcha
    - floor-script
  created: 2026-08-26
  originSessionId: 46a4dbcd-fa2b-416c-87f8-931f5c3c90b5
  modified: 2026-08-26T10:19:19.646Z
---

# `[0-9]+`-only value extraction from a JS source file misreads a legal numeric-separator/hex/exponent literal

**Code-verified — still live** at landed tip `8b1e0ea6d9db99a8042ebaf34766f8c5c7780617` on
`dev/2026-08-25-engine-reliability-and-filing-fidelity` (verify-on-write via the `_refinery28`
worktree, `<repo-root>/.claude/war-worktrees/2026-08-25-engine-reliability-and-filing-fidelity-2026-08-26/_refinery/`,
whose `HEAD` equals the threaded landed tip — landed-tip grounding rung 2). This finding was
disposed `disposition: follow-up` (explicitly NOT `absorb` — a fixture-design task, not a
mechanical edit) and I confirmed at the pin the extraction is unchanged from the audited shape.

`skills/war/assets/assert-budget-raise-cited.sh` extracts a ceiling's numeric value from a JS
source line (`skills/war/assets/prompt-surface-budgets.test.mjs`) with
`sed -nE "s/.*${field}:[[:space:]]*([0-9]+).*/\1/p"`, gated by a companion grep
`(hard|advisory):[[:space:]]*[0-9]`. Both stop at the **first** contiguous digit run. JS (and
Node, which the guarded file runs under) accepts several legal numeric literal forms beyond a
bare digit run: the numeric separator (`100_000`), hex (`0x13880`), and exponent (`1e5`). Any of
these truncates: `hard: 79_872` extracts `79`; `hard: 0x13880` extracts `0`; `hard: 1e5` extracts
`1`. A raise that keeps the truncated leading-digit prefix unchanged — e.g.
`hard: 79_872` → `hard: 79_900` — reads as **no change** (`79` == `79`), so the floor's
`[ "$val" -gt "$old_val" ]` comparison is false, no raise is recorded, the value line stays
KEYED (never falling into the UNKEYED default-deny set-difference), and the floor exits 0 with no
Budget-Raise trailer required — a silent fail-open on exactly the mechanism the floor exists to
enforce. (A raise that changes the truncated PREFIX, e.g. `79_872` → `90_112`, is still caught —
the exposure is narrow, not universal.)

No live budget constant uses these forms today (every value in the guarded file is a plain
integer at the pin), so this is latent, not exploited — but it is a **general shell-scripting
trap**, not specific to this one floor: any script parsing a JS/TS/JSON5 numeric literal with a
bare `[0-9]+` regex will silently mis-extract on any of these three legal forms.

**Pattern to watch for:** before trusting a `[0-9]+`-anchored extraction of a source-code numeric
literal, check whether the source language permits numeric separators, hex/octal/binary
prefixes, or exponent notation — if so, either widen the regex to also match (and reject/route
to default-deny) those forms, or gate the guarded surface with a documented "plain-integer-only"
convention enforced by its own schema/shape assertion (as this repo's
`prompt-surface-budgets.test.mjs` `ROW_SHAPE` regex incidentally does for `FILE_BUDGETS` rows,
though not for the bare `const NAME = N` sentinel form).

**Locate-cue (verify still present before acting):**
`skills/war/assets/assert-budget-raise-cited.sh`, `classify_lines()`, the
`sed -nE "s/.*${field}:[[:space:]]*([0-9]+).*/\1/p"` line (~line 180).
