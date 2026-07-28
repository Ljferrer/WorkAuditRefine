---
name: adr-amendment-byte-unchanged-body-mandate-exempts-status-currency-line
description: "A plan/red-team mandate that an ADR amendment leave 'all pre-existing body text byte-unchanged' does not bind the ADR's own Status currency header line — that line is conventionally updated per amendment, twice confirmed in this repo"
metadata: 
  node_type: memory
  type: project
  provenance: agent-unverified
  slug: adr-amendment-byte-unchanged-body-mandate-exempts-status-currency-line
  phase: "auditor-guard-policy-and-mirror-truth/phase-1 task 1.1 (audit + gate-audit findings, landed dev/2026-07-26-auditor-guard-policy-and-mirror-truth, 2026-07-27)"
  keywords: 
    - ADR amendment
    - Status line
    - currency header
    - byte-unchanged body
    - amended date
    - appended amendment section
    - adjudication tension
    - ADR 0029
    - Considered-options entry
    - re-ratification vehicle
  tags: 
    - adr
    - documentation
    - audit-adjudication
  created: 2026-07-27
  originSessionId: 0ad881e1-4bbc-43c6-8e45-8597d9cec1cf
  modified: 2026-07-28T03:32:52.736Z
---

# ADR "amendment appends a dated section, body stays byte-unchanged" convention still moves the Status line

**What happened:** the repo's ADR re-ratification vehicle is: append a dated
`## Amendment (YYYY-MM-DD)` section at the end of the ADR, with the plan/red-team adjudication
explicitly stating "the Considered-options entry and ALL pre-existing body text stay
byte-unchanged." A worker/absorb-fix change also bumped the ADR's own line-3 currency header —
`**Status:** accepted; amended 2026-07-22` → `**Status:** accepted; amended 2026-07-22,
2026-07-26` — which reads, on a literal parse, like exactly the kind of pre-existing-text edit
the mandate forbids. An auditor flagged this as an **adjudication tension** worth naming rather
than silently absorbing or silently blocking.

**The resolution (repo precedent, now confirmed twice):** the Status line is the ADR's own
*currency header*, not "body text" in the sense the byte-unchanged mandate protects (Decision,
Considered options, and prose). The **first** amendment to this same ADR (2026-07-22, commit
`c0f2f0d`) already moved this exact line — its own commit message states "Status line ->
\"accepted; amended 2026-07-22\"; original body otherwise byte-unchanged" — establishing that the
line is expected to move per amendment while "body" means everything else. The **second**
amendment (2026-07-26) repeated the pattern, an auditor traced the precedent commit rather than
accepting the byte-unchanged mandate as literally covering the header, and gate-audit confirmed
the move as "precedent-grounded, not a byte-invariance breach" (disposition `note`, no fix
required).

**The rule:** when a plan or red-team adjudication says an ADR amendment leaves "all pre-existing
body text byte-unchanged," read that as scoped to the Decision / Considered-options / narrative
prose — **not** the `**Status:**` currency header, which this repo's own precedent treats as a
per-amendment-mutable field. Before flagging a Status-line move as a mandate violation (or before
silently absorbing a "fix" that reverts it), trace whether a prior amendment to the *same* ADR
already moved that line — if so, the move is the sanctioned convention, not a deviation.

**Verify before acting:** confirmed the referent file exists at `docs/adr/0029-capture-grounds-on-committed-tip.md`
(read in a lagging checkout during this write — landed-tip grounding could not reach the true
2026-07-27 tip: my session cwd was a different concurrent plan's worktree, and no live task
worktree under `.git/worktrees/*` matched this plan's slug — the file there still read line 3 as
`accepted; amended 2026-07-22` only, consistent with a lagging view, not a contradiction). The
`accepted; amended 2026-07-22, 2026-07-26` line and the appended `## Amendment (2026-07-26)`
section are sourced from this phase's `gate-audit:approve` finding (`gateEvidence:true`, pinned
`auditSha: 4e15632bc2313ee9e3c1965c3d952006fb9bf4f3`), not independently confirmed by my own
Read/Grep this round.

## Related

[[resolved-lesson-stamp-freezes-body-so-it-can-contradict-the-new-description]] — a different ADR/lesson
edit convention where an update channel (a description prefix) is deliberately narrower than "the
whole file," same family of "which part of a dated record actually moves on update."
