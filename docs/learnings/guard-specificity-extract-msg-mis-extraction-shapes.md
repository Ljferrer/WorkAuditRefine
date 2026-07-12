---
name: guard-specificity-extract-msg-mis-extraction-shapes
description: extract_msg() in the guard-specificity floor has two mis-extraction shapes
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
  keywords: 
    - extract_msg
    - guard specificity
    - die
    - stderr
    - quoted literal
    - format string
    - printf
    - false negative
    - false positive
    - heuristic ceiling
    - D6
  slug: guard-specificity-extract-msg-mis-extraction-shapes
  phase: audit-gate-verdict-fidelity/t1.2
  tags: 
    - floor-script
    - heuristic-ceiling
    - shell-parsing
    - test-fidelity
  related: 
    - dockerfile-shell-form-parser-heuristic-ceiling
  created: 2026-07-09
  originSessionId: 68b2ca32-fa05-459c-9ddf-f23ca91a5f40
---

# assert-guard-specificity-in-diff.sh's extract_msg() has two known mis-extraction shapes

`extract_msg()` in `assert-guard-specificity-in-diff.sh` (verify still present before acting — found at `skills/war/assets/assert-guard-specificity-in-diff.sh`, header lines 25-30 document the general rule @ phase audit-gate-verdict-fidelity/t1.2) is documented as: MSG = first quoted literal after `die`, else first quoted literal on the stderr line. Two concrete failure shapes surfaced at audit, both bounded by the floor's advisory-evidence-only status (ADR 0005 — mints no MergeResult status, never blocks a merge):

1. **stderr-form false extraction (Minor).** For the stderr-emit guard form, `extract_msg()` scans the whole added line and returns the FIRST quoted literal, not the one adjacent to `>&2`. A compound guard `[ -f "$path" ] || { echo "real msg" >&2; exit 1; }` extracts `$path` instead of `real msg`; a format string `printf 'error: %s\n' "$d" >&2` extracts `error: %s`, which can never substring-match a test asserting the interpolated value. Can false-negative (mask a genuinely uncovered guard) or false-positive (spurious advisory).

2. **Quoted-variable message false positive (Nit).** A guard whose message is a quoted variable (`die "$msg"`, `die "$PROG: $1"`) is detected with the literal token (`$msg`) as its "message"; no test can assert that literal substring, so the floor reports exit 1 (uncovered) even when the guard IS meaningfully tested — a false positive, not the documented false-negative.

**Why safe to defer:** both sit inside the plan-authorized line-based shell-heuristic ceiling (same class as [[dockerfile-shell-form-parser-heuristic-ceiling]]); the dominant repo idiom `die "literal string"` extracts correctly; the floor is advisory-only (Task 2.1 wiring turns exit 1 into an auditor finding, never a merge block).

**If this recurs / bites for real:** prefer the quoted literal immediately preceding `>&2` (or the echo/printf arg) over first-quote-on-line; and/or skip flagging when the sole quoted token in a `die`/stderr call is a bare `$var` (no literal text) since no test could ever assert it. Not required as of phase audit-gate-verdict-fidelity — advisory-only, documented ceiling.

[[dockerfile-shell-form-parser-heuristic-ceiling]]
