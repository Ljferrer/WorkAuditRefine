---
name: coupling-comment-restating-grep-pattern-bytes-self-matches-the-sweep
description: "A comment that quotes a plan's exactly-N-surfaces grep pattern verbatim becomes a hit for that very grep, silently forking the count in a future sweep"
metadata: 
  node_type: memory
  type: project
  keywords: 
    - coupling comment
    - referential not restating
    - grep pattern literal
    - sweep count
    - exactly-N surfaces
    - self-match
    - doc-truth sweep
  provenance: code-verified
  slug: coupling-comment-restating-grep-pattern-bytes-self-matches-the-sweep
  phase: dispatch-args-and-floor-coverage/2.1
  tags: 
    - doc-honesty
    - drift-guard
    - comment-drift
  created: 2026-07-27
  originSessionId: 0ad881e1-4bbc-43c6-8e45-8597d9cec1cf
  modified: 2026-07-27T22:02:34.098Z
---

# A coupling comment that restates a plan's grep-pattern bytes becomes a hit for that grep itself

## The rule

When a plan enumerates an "exactly N named surfaces" grep invariant (e.g. a token-pair pattern like
`EMBEDDED_ARGS|ARGS_FALLBACK_ANCHOR` expected to hit exactly 4 files), any **new** comment added
elsewhere in the same change — even a purely descriptive, non-functional one — that writes the
pattern's literal bytes out becomes a **fifth** hit under a repo/skills-scope sweep of that same
pattern. The repo's own discipline for this exact hazard ("coupling comments referential, never
restating anchor bytes") must be applied to *every* new comment that touches the swept tokens in
the same commit, not only to the one comment the plan explicitly called out for the reword.

## Evidence

`skills/war/assets/skill-doc-contracts.test.mjs`'s new D23/D24 header comment (added in phase
`dispatch-args-and-floor-coverage`/2.1) writes the sweep's own grep pattern out verbatim as
`` `EMBEDDED_ARGS|ARGS_FALLBACK_ANCHOR` `` while explaining that the ADR/CONTEXT.md amendments were
phrased *without* the literal specifically to keep that sweep's count at 4 — making this very
comment a fifth hit. Verify still present before acting — found at
`skills/war/assets/skill-doc-contracts.test.mjs` (the D23/D24 block header, ~line 508-509) at phase
`dispatch-args-and-floor-coverage`/2.1, landed tip `776ceeca2aee726565dc7816b0294eaa9091b494` on
`dev/2026-07-26-dispatch-args-and-floor-coverage`. No test asserts the count, so nothing goes red —
but a future sweeper re-deriving "why 5, not 4" wastes a round rediscovering this.

## How to apply

Before writing any comment that references a plan's fixed-surface-count grep invariant, name the
grep **descriptively** ("the spec §N.M four-surface embedded-args token grep") rather than quoting
its pattern bytes — mirroring the same referential-never-restating rule the plan already applied to
the primary coupling comment it added. If a literal restatement is unavoidable, record the extra
hit explicitly in the done report's same-scope hand-scan so the count mismatch is pre-explained.
