---
name: endstate-check-fixed-context-window-undercaptures-growing-enumerated-block
description: "An endstate-check command that greps a doc heading with a fixed trailing-context window (e.g. `grep -A6`) sized for a prior release's shorter enumeration silently truncates one item short once a later phase adds a new bullet to the same block — the artifact reads incomplete even though the underlying condition is met."
metadata: 
  node_type: memory
  type: project
  keywords: 
    - endstate-check
    - grep -A context window
    - fixed window undercapture
    - enumerated doc block
    - README Status section
    - artifact under-captures
    - gate-audit evidence quality
    - land barrier
    - .war/endstate log
  provenance: code-verified
  slug: endstate-check-fixed-context-window-undercaptures-growing-enumerated-block
  phase: "2026-08-06-done-when-floor-wiring/phase-2 task 2.1 gate-audit (execution-evidence lens), auditSha fdb71c2f2d4c13c4cd58267e565c6e2cdeec881e"
  tags: 
    - engine
    - evidence-capture
    - gate-audit
    - plan-authoring
  relates: 
    - "[[endstate-check-dispatch-captures-only-one-command-per-condition-row]]"
  created: 2026-08-15
  originSessionId: 8bae67aa-acfa-461e-acc9-278fc79ba6c1
  modified: 2026-08-15T12:23:09.752Z
---

# A fixed grep context window in an endstate-check command undercaptures a doc block that grew

## The gap

`_refinery/.war/endstate-2-2.log` (this phase's End-state condition 2, `README.md ## Status`
enumeration check) captured `README.md` lines 359-365 — the heading, headline, and bullets
1-3 — but the condition's own plan text requires a **fourth** named element (the CLAUDE.md
floor enumeration bullet), which lands at line 366, one line past the artifact's window. The
check command was evidently a fixed-offset trailing-context grep (`grep -n -A6 '## Status'
README.md` or equivalent — 359 + 6 = 365), sized for however many lines the block held at
authoring time. The condition is genuinely met (confirmed by re-grounding directly on the
pinned blob, `git show <sha>:README.md`), so this is an evidence-*quality* gap, not a false
verdict — Nit severity, non-blocking.

## Durable rule

A `check:` command (or any evidence-capture command) that greps a doc heading with a **fixed**
trailing-context count to capture "the whole section" is fragile to the section growing by even
one line in the very release that adds the content the check exists to verify — the classic
off-by-a-future-edit trap. Prefer a window bounded by structure, not a magic number: grep from
the heading **through the next heading** (e.g. `sed -n '/^## Status/,/^## License/p'` or an
`awk`/`grep -A` count deliberately over-sized with a documented margin), so the artifact alone
stays a complete evidence trail even after a later phase appends another bullet to the same
enumerated block.

## Locate cue

`_refinery/.war/endstate-2-2.log` at the phase-2 auditSha `fdb71c2f2d4c13c4cd58267e565c6e2cdeec881e`
— verify still present/reproducible before trusting a fixed-`-A`-window endstate-check artifact as a
complete evidence trail for an enumerated doc block; re-check the block's current line span before
reusing the same window size in a future phase's End-state `check:` field.

Related: [[endstate-check-dispatch-captures-only-one-command-per-condition-row]] — a sibling
evidence-capture-quality gap on the same land-barrier mechanism, same phase, different root cause
(that lesson is about a `check:` naming two mandatory commands where only the first gets an
artifact; this one is about a single command's own context-window sizing).

> archived 2026-08-25: resolved — moved to archive
