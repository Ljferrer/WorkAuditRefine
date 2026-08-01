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
    - non-vacuity assert
    - truncation guard
    - D29
  provenance: code-verified
  slug: coupling-comment-restating-grep-pattern-bytes-self-matches-the-sweep
  phase: dispatch-args-and-floor-coverage/2.1; recurrence 2026-07-28-prompt-surface-simplification/phase-7
  tags: 
    - doc-honesty
    - drift-guard
    - comment-drift
  created: 2026-07-27
  originSessionId: 0ad881e1-4bbc-43c6-8e45-8597d9cec1cf
  modified: 2026-07-30T00:16:25.083Z
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

## Recurrence — the same class also hits a non-vacuity/truncation assert, not only an exactly-N sweep

The class is broader than the "exactly N surfaces" grep case above: it also fires when a coupling
comment quotes the **exact literal token a nearby non-vacuity/truncation assert checks for**,
because the comment sits inside the very region the assert extracts.

Confirmed landed instance, phase 7 of `2026-07-28-prompt-surface-simplification` (a phase-close
polish finding flagged this and it landed anyway — verified present at the landed tip, not merely
proposed): `skills/war/assets/skill-doc-contracts.test.mjs`'s D29 test extracts
`prompt-surface-budgets.test.mjs`'s header region (file start → first top-level `import`) and
proves the extraction isn't truncated with `assert.match(norm(formula[0]), /Formula/, ...)`. A
phase-close fix added a coupling comment *above* the real `Formula (adjudication D): ...` sentence,
inside that same extracted region, reading "Pinned by skill-doc-contracts.test.mjs's D29 row (ADR
0042 mirror registry) — reword the **Formula** sentence below and that row in the same commit." The
capitalized "Formula" in the coupling comment itself satisfies the non-vacuity assert, so an
extraction truncated right after the coupling comment (before ever reaching the real Formula
sentence) would still pass that one assert — only the two substantive mirror keys
(`/advisory\s*=\s*post-shrink[\s\S]{0,30}1\.10/i`, `/hard\s*=\s*post-shrink[\s\S]{0,30}1\.25/i`)
would still catch it. Verify still present before acting — found at
`skills/war/assets/prompt-surface-budgets.test.mjs` lines 10-11 (the coupling-comment line) and
`skills/war/assets/skill-doc-contracts.test.mjs` around the D29 test's `/Formula/` non-vacuity
assert, at phase 7 of `2026-07-28-prompt-surface-simplification`, landed tip
`2037e6491117988b04115e79408017b392719a70` on `dev/2026-07-28-prompt-surface-simplification`.

Applies-to update: when authoring a coupling comment that must reference a nearby guard's checked
construct, avoid the guard's own non-vacuity/truncation token too — not just its exactly-N grep
pattern bytes. Either paraphrase ("reword the derivation sentence below") or, if the literal is
unavoidable, tighten the assert to a longer, more specific phrase the coupling comment is unlikely
to also contain (e.g. `/Formula \(adjudication D\)/i` instead of bare `/Formula/`).
