---
name: terminal-phase-close-polish-absorb-finding-has-no-further-round-to-land-it
description: "A phase-close polish task's OWN gate-audit can surface a fresh absorb+phaseClose:true finding on the polish diff itself — but if that polish task is the phase's last round (e.g. a release/final phase), there is no subsequent polish pass to drain the queue, and the finding ships unfixed at land"
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
  slug: terminal-phase-close-polish-absorb-finding-has-no-further-round-to-land-it
  phase: 2026-08-05-precision-chain-and-loop-breaker/6.1
  keywords: 
    - phase-close
    - polish
    - absorb
    - phaseClose true
    - unresolved finding
    - release phase
    - CLAUDE.md drift
    - done-unmet
    - queue drain
    - last round
  tags: 
    - war
    - phase-close
    - process
    - audit-findings
  created: 2026-08-06
  originSessionId: 428f1fab-f385-493a-952d-9509fdac5e10
  modified: 2026-08-07T01:36:41.494Z
---

# A terminal phase-close polish task's own absorb finding can ship unfixed

**Code-verified at landed tip `3d3b7913239e6a62e9ee2e485e1d7a9dcd2cf0e4` on
`dev/2026-08-05-precision-chain-and-loop-breaker`**, read via the run-scoped `_refinery`
worktree (`<repo-root>/.claude/war-worktrees/2026-08-05-precision-chain-and-loop-breaker-2026-08-05/_refinery/`).

Phase 6 ("Release") ran a phase-close polish task (`p6-polish`) that correctly fixed the
queued README `## Status` blurb wording finding from task 6.1's audit. But the gate-audit that
then judged the `p6-polish` task's own diff surfaced a **new** finding on that same diff:
`CLAUDE.md`'s floor-family mirror (`skills/war/assets/assert-done-when.sh`'s `done-unmet` route,
landed earlier in this same phase-6 run) was missing from three sibling spots — the named-route
parenthetical (`` `no-test`, `unpackaged` `` with no `done-unmet`), the merge-path floor-script
list (missing `assert-done-when.sh` alongside `assert-test-in-diff.sh` /
`assert-packaging-in-diff.sh` / `assert-no-submodule-mutation.sh`), and the per-phase pipeline
sentence (no land-barrier endstate-check dispatch step named between "Refine" and "post-merge
gate-audit"). That finding was tagged `disposition: absorb, phaseClose: true` — the standard
signal that it should be picked up by phase-close polish.

**It never was.** Verified directly at the landed tip: `CLAUDE.md` still reads (near line 54)
"Floor scripts exit 0/1/2: 1 = the named route (`` `no-test`, `unpackaged` ``)" — no
`done-unmet` — and line 62's merge-path floor list still omits `assert-done-when.sh`. Because
`p6-polish` was itself the LAST phase-close round of the phase (phase 6 is the plan's trailing
release phase — no further task or polish round follows), there was no subsequent polish pass to
drain a queue that only came into existence via this task's own audit. The finding was correctly
routed (`absorb`, `phaseClose: true` is the right disposition in isolation) but had nowhere left
to land within this phase's execution.

**Why this differs from [[phase-close-polish-revert-can-silently-orphan-a-subset-of-absorbed-findings]]:**
that lesson's mechanism is a revert-then-redo losing track of what the reverted commit fixed —
there is always a next round, it just derives the wrong queue. Here there is no revert and no
next round at all: a polish task's audit is free to raise fresh findings against the polish diff
itself, and the phase-close flow has no mechanism to guarantee a further round exists to consume
an `absorb` disposition raised that late. The finding is real, `code-verified`, and non-cosmetic
(a standing-doc drift the release phase's own CLAUDE.md advisory-byte-budget accepted as
byte-cheap) but is currently open, not fixed.

**Pattern to watch for:** an `absorb + phaseClose: true` finding surfacing from the audit of a
phase-close/polish task's OWN diff (not the original task's diff) is a hazard signal — check
whether that polish task is the phase's terminal round before trusting the disposition means
"will be fixed." If it is terminal, the finding needs either a same-round follow-up commit or
explicit escalation/note, not a bare `absorb` that has nowhere to go.

**Locate-cue (verify still present before acting):** `CLAUDE.md`, the "Execution architecture"
section — the "Enum discipline: ..." paragraph (named-route parenthetical) and the "Guard
architecture (hooks/)" paragraph (merge-path floor list); canonical source of the `done-unmet`
route is `skills/war/assets/land-decision.mjs`'s `HARD_ESCALATION_REASONS` export (confirmed
present there at the same pin).
