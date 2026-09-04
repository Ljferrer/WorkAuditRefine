---
name: shell-digit-only-value-extraction-truncates-legal-js-numeric-literal-forms
description: "A bare [0-9]+ regex extracting a JS numeric literal truncates at _, 0x, or e; widen it or enforce plain integers."
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

# `[0-9]+`-only value extraction from a JS source file misreads a legal numeric-separator, hex, or exponent literal

**Rule:** a shell regex of the form `[0-9]+` stops at the first non-digit. JS accepts numeric
separators (`100_000`), hex (`0x13880`), and exponents (`1e5`). Each truncates to its leading digit
run: `79_872` reads as `79`, `0x13880` as `0`, `1e5` as `1`. A comparison built on that value
cannot see a change that keeps the prefix, so a floor guarding the value fails open.

**The instance:** `skills/war/assets/assert-budget-raise-cited.sh`, inside `classify_lines()`,
extracts a budget ceiling with `sed -nE "s/.*${field}:[[:space:]]*([0-9]+).*/\1/p"`, gated by the
companion grep `(hard|advisory):[[:space:]]*[0-9]`. A raise `hard: 79_872` to `hard: 79_900` reads
as no change, the line stays KEYED, and the floor exits 0 with no Budget-Raise trailer required. A
raise that changes the prefix is still caught, so the exposure is narrow.

**Still open.** Disposed `follow-up`, not `absorb` (a fixture-design task). The extraction is
unchanged. No value in the guarded `prompt-surface-budgets.test.mjs` uses these forms today, so the
trap is latent. `ROW_SHAPE` there incidentally enforces plain integers for `FILE_BUDGETS` rows but
not for the bare `const NAME = N` sentinel form.

**How to apply:** before trusting a `[0-9]+` extraction of a source-code numeric literal, check
whether the language permits separators, radix prefixes, or exponents. Either widen the regex to
match those forms and route them to default-deny, or enforce a plain-integer-only convention on
the guarded surface with its own shape assertion.

**Locate-cue:** the `sed -nE` extraction line in `classify_lines()` of
`assert-budget-raise-cited.sh`.

> archived 2026-09-04: resolved — moved to archive
