---
name: old-absent-gate-half-relies-on-unrecorded-hand-grep-fails-silently
description: "An OLD-absent gate half certified by an uncommitted hand grep silently false-passes; make it a committed, case-insensitive grep assertion"
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
  slug: old-absent-gate-half-relies-on-unrecorded-hand-grep-fails-silently
  phase: "war-memory-cli-correctness/phase-1 task 1.1 gate-audit (execution-evidence lens)"
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

**Rule:** when a plan mandates a per-medium NEW-present/OLD-absent gate for a retired literal, the
OLD-absent half must be a **committed** grep assertion (a test, or a gate-log line the refiner
captures) — not a hand-run grep quoted only in a worker's done-report.

**What happened:** a rename retired the hub-WARN noun "inbound refs" for "inbound citers" across
`skills/`, `hooks/`, `agents/`, `CONTEXT.md`, `README.md`. The NEW-present half landed real. The
OLD-absent half was certified by an unrecorded manual grep, and that grep was wrong: the post-merge
gate-audit (`execution-evidence` lens) found 3 surviving `inbound refs` lines on live `skills/`
surfaces.

**Why this matters:** the NEW-present half of a rename/retirement gate gets real coverage almost for
free — it's the surface the task actually builds and tests. The OLD-absent half is easy to treat as
an afterthought sweep, run once by hand, and never re-verified. That asymmetry let the stragglers
survive to a landed merge.

**How to apply:** commit the OLD-absent check, and name the exempt surfaces explicitly (frozen
artifacts such as `docs/plans`, `docs/specs`, `docs/red-team`, `docs/learnings/archive`). Use
`grep -in`, token-anchored, so a re-cased straggler doesn't false-negate the check.

Related: [[archive-hub-warning-counts-cross-root-dupe-citer-twice]] (the underlying "refs vs
citers" dedup-semantics substance this rename was fixing); [[plan-survey-token-sweep-misses-untagged-siblings]]
(sibling gotcha, same family — a grep sweep misses siblings that paraphrase the token, rather than a
hand-certified sweep mis-reporting literal matches); [[full-gates-green-end-state-soft-without-threaded-gate-log-artifact]]
(same discipline: an End state's evidence claim needs a threaded artifact, not an assertion).

> archived 2026-08-30: resolved — moved to archive
