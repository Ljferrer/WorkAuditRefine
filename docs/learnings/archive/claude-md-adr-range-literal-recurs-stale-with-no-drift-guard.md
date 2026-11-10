---
name: claude-md-adr-range-literal-recurs-stale-with-no-drift-guard
description: "A doc literal that records a directory's current max N with no drift guard goes stale on every addition; drop the snapshot or bind it with a test (RESOLVED for CLAUDE.md's ADR range)"
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
  slug: claude-md-adr-range-literal-recurs-stale-with-no-drift-guard
  phase: 2026-08-04-interview-and-authoring-contract/2 (task 9 + phase-2-integrated-tip gate-audit + p2-polish) — RESOLVED at precision-chain-and-loop-breaker/5 (tasks 5.3/5.4 + p5-polish, 2026-08-05)
  keywords: 
    - CLAUDE.md
    - ADR range
    - ADR count literal
    - drift guard
    - doc-cascade sweep
    - out-of-footprint straggler
    - max-N literal
    - recurring rot
    - docs/adr
    - doc-contract test
    - RESOLVED
    - literal retired
    - mechanism-narrative shape
    - ADR 0025
    - ls docs/adr for current head
    - class closed
  tags: 
    - doc-honesty
    - adr
    - doc-cascade
    - recurrence
  created: 2026-08-03
  originSessionId: 4095ea62-efc7-4ed1-8045-8de0cd2f76bb
  modified: 2026-08-07T00:16:36.383Z
---

# CLAUDE.md's ADR-range upper bound recurred stale on every new ADR — no test bound it

## The rule

Any repo-doc literal that records a "current max N" fact about a directory (ADR count, phase
count, version count, etc.) with no drift guard binding it to the directory goes stale on every
addition. Once a class like this has recurred twice, expect the next one. Check it during any
phase-close or doc-cascade sweep that adds a numbered doc. Better: drop the snapshot literal for a
mechanism-narrative sentence (the ADR 0025 shape, which cannot rot), or add a doc-contract test
that asserts the literal's upper bound equals `max(readdirSync('docs/adr'))`.

## Why it kept recurring

CLAUDE.md's "## What this repo is" paragraph said `docs/adr/ (0001-NNNN) records the binding
decisions`. It went stale four times (ADRs 0042 through 0046). The cause was the same each time:
same-phase file-disjointness. The task that lands the new ADR owns only `docs/adr/00NN-...md`, and
a different task (or none) owns `CLAUDE.md`, so no task can land both together. Each time a
gate-audit flagged it and a phase-close polish pass bumped it by hand.

## Closure

At precision-chain-and-loop-breaker phase 5, the `p5-polish` pass dropped the literal outright
instead of bumping it. CLAUDE.md now reads: `docs/adr/` records the binding decisions, numbered
sequentially — `ls docs/adr/` for the current head. This closes the class. If a future edit puts a
snapshot range or count literal back on this paragraph, that is a new instance of the general
rule above, not a continuation of this history.

> archived 2026-08-15: resolved — moved to archive
