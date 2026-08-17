---
name: old-absent-gate-half-relies-on-unrecorded-hand-grep-fails-silently
description: "An OLD-absent gate half certified by an uncommitted hand grep silently false-passes; commit the assertion"
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
  slug: old-absent-gate-half-relies-on-unrecorded-hand-grep-fails-silently
  phase: "war-memory-cli-correctness/phase-1 task 1.1 gate-audit (execution-evidence lens), fixed at 086db74"
  created: 2026-07-27
  tags: 
    - gate-audit
    - doc-consistency
    - end-state
    - retired-token-sweep
  keywords: 
    - OLD-absent
    - NEW-present
    - per-medium gate
    - retired-token sweep
    - manual grep
    - gate-audit
    - End state 8
    - hand-certified
    - straggler
    - inbound refs
    - inbound citers
    - ADR 0017
  originSessionId: 0ad881e1-4bbc-43c6-8e45-8597d9cec1cf
  modified: 2026-07-28T01:08:21.793Z
---

# An OLD-absent gate half certified by hand, not committed, is the half that silently fails

**What happened (code-verified — `.claude/teams/2026-07-26-war-memory-cli-correctness-2026-07-27/ledger.json`,
`gateAudit` + `retiredTokenSweep` fields; verify still present before acting):** phase-1's End state
8 required a per-medium doc-consistency flip — `cmdArchive`'s hub-WARN noun renamed from the
undeduped "inbound refs" to the slug-deduped "inbound citers" (task 1.1, #1154, D7), retired
doc-wide across `skills/`, `hooks/`, `agents/`, `CONTEXT.md`, `README.md` (frozen artifacts and the
historical ADR 0028 quote exempt). The NEW-present half — the ADR 0028 amendment and the SKILL.md
rename — landed real (code-verified: `skills/lessons-learned/SKILL.md` now reads "inbound
citers" throughout its hub-threshold section). The OLD-absent half was certified by an **unrecorded
manual grep** in the done-report, and that grep returned the wrong answer: post-merge gate-audit
(`execution-evidence` lens) found the Major finding "End state 8 OLD-absent false at tip — 3
surviving `inbound refs` lines on live `skills/` surfaces."

**Resolution:** Lead-adjudicated scope widening, fixed in-place at `086db74` rather than deferred
(ADR 0017 — a validation in neither the gate, a floor, nor the backstops section may not be waived
in prose). The gate was re-run green (990 JS tests + all shell + lint clean), and the ledger now
carries a committed `retiredTokenSweep` record: `grep -in 'inbound refs'` → 0 hits across `skills/`,
`hooks/`, `agents/`, `CONTEXT.md`, `README.md` at `086db74` (exempt surfaces named explicitly:
`docs/plans`, `docs/specs`, `docs/red-team`, `docs/learnings/archive`, the ADR 0028 historical
quote). Confirmed still true at the landed tip (verified via Grep of the live `_refinery` checkout).

**Why this matters:** the NEW-present half of a rename/retirement gate tends to get real coverage
almost for free — it's the surface the task actually builds and tests. The OLD-absent half is
easy to treat as an afterthought sweep, run once by hand, and never re-verified — exactly the
asymmetry that let 3 stragglers survive from round-0 red-team all the way to a landed merge before
gate-audit caught them.

**How to apply:** when a plan mandates a per-medium NEW-present/OLD-absent gate for a retired
literal, insist the OLD-absent half is a **committed** grep assertion (a test, or a gate-log line
the refiner captures) — not a hand-run grep quoted only in a worker's done-report. Case-sensitivity
matters too: use `grep -in`, token-anchored, so a re-cased straggler doesn't false-negate the check.

Related: [[archive-hub-warning-counts-cross-root-dupe-citer-twice]] (the underlying "refs vs
citers" dedup-semantics substance this rename was fixing); [[plan-survey-token-sweep-misses-untagged-siblings]]
(sibling gotcha, same family — a different failure mode: a grep sweep misses siblings that
paraphrase the token rather than, as here, a hand-certified sweep simply mis-reporting literal
matches); [[full-gates-green-end-state-soft-without-threaded-gate-log-artifact]] (same discipline:
an End state's evidence claim needs a threaded artifact, not an assertion).
