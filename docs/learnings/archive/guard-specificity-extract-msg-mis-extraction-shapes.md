---
name: guard-specificity-extract-msg-mis-extraction-shapes
description: assert-guard-specificity-in-diff.sh extract_msg() has two documented mis-extraction shapes
metadata: 
  node_type: memory
  type: project
  promoted: dev/2026-07-08-audit-gate-verdict-fidelity@phase-1
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
    - emit segment
    - echo printf keyword
    - LAST-keyword
    - floor-script-correctness
    - record_guard
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

## Recurrence — both shapes fixed, narrower ceiling introduced (phase "Floor fixes" / plan `2026-07-12-floor-script-correctness`, landed `dev/2026-07-12-floor-script-correctness`, 2026-07-12)

Per that plan's Commander's Intent Method: `extract_msg` was rescoped to the **emit segment**
between the `echo`/`printf` keyword and `>&2` (no longer "first quoted literal on the whole
line"), and `record_guard` was changed to skip bare-`$var` messages and truncate `printf` format
strings to their pre-`%` literal prefix. This closes both documented shapes above (1: whole-line
first-quote false extraction; 2: bare-variable false-positive uncovered flag).

**New, narrower ceiling introduced by the fix (task-4 audit finding, Nit, disposition `note`,
non-blocking):** the emit-segment scan takes the text after the **LAST** occurrence of the chosen
keyword (`${hal_seg##*$hal_kw}` in the audit's description of the mechanism) and picks `echo` over
`printf` when both are present as space-delimited words. A guard whose stderr message itself
contains ` echo `/` printf ` as a literal space-delimited word (e.g. `echo "run echo now" >&2`)
still mis-extracts. Judged advisory-evidence-only and unrealistic for real guard messages — not
worth closing now; the header's existing shell-aware-tokenizer upgrade path (already named in this
lesson's parent ceiling family) is the documented escape hatch if it ever bites for real.

**Provenance caveat on this recurrence note:** this checkout's `HEAD` does not match the phase's
landed branch (worktree-lag — see [[servitor-verify-on-write-worktree-can-lag-just-landed-phase]]),
so the exact variable names (`hal_kw`/`hal_seg`) and line numbers were **not** independently
re-Grepped here; sourced from the phase's Commander's Intent + unanimous gate-audit `approve`
verdicts (`audit_sha a38520a6`). Verify `extract_msg`/`record_guard` in
`skills/war/assets/assert-guard-specificity-in-diff.sh` directly before citing exact mechanics.

> archived 2026-07-11: resolved — moved to archive (recurrence note added 2026-07-12; still archived, not restored — knowledge only, no status change)
