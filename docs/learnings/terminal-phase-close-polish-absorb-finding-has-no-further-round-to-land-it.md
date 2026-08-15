---
name: terminal-phase-close-polish-absorb-finding-has-no-further-round-to-land-it
description: "A phase-close polish task's OWN gate-audit can surface a fresh absorb+phaseClose:true finding on the polish diff itself — but if that polish task is the phase's last round (e.g. a release/final phase), there is no subsequent polish pass to drain the queue, and the finding ships unfixed at land"
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
  promoted: dev/2026-08-05-precision-chain-and-loop-breaker@phase-6
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
    - autoFixable not applied
    - recurring finding not fixed
    - escape guard header
    - assert-no-repo-escape.sh
  tags: 
    - war
    - phase-close
    - process
    - audit-findings
  created: 2026-08-06
  originSessionId: 428f1fab-f385-493a-952d-9509fdac5e10
  modified: 2026-08-15T06:41:50.735Z
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

## Recurrence — `2026-08-06-escape-guard-exit-contract`/p1-polish (landed `dev/2026-08-06-escape-guard-exit-contract` @ `a9f238c00928b369f11621cd46b2922a95e54172`, 2026-08-15)

Independently confirms the pattern with a sharper twist: the finding was raised **three separate
times** — task 1.1's own audit, that same task's post-merge gate-audit (`disposition: absorb,
phaseClose: true`), and then *again*, worded near-identically by multiple auditor seats, inside
`p1-polish`'s own audit of the polish diff itself — and it **still shipped unfixed**. The finding:
`skills/red-team/assets/assert-no-repo-escape.sh`'s header comment (near the top, immediately
after the "DETECTION authority (Layer-2/3 doctrine, ADR 0033)" clause) reads "A nonzero result
quarantines the verdict through the self-confound gate — never CLEARED — until the state is
clean." — a routing claim the phase deliberately narrowed everywhere else: `SKILL.md` Step 4 now
reads "**On exit 1**, diagnose every delta by action-provenance FIRST" plus a new "**On exit 2** —
there is no delta to triage" arm, and `skills/red-team/references/lenses.md`'s escape-guard bullet
was rescoped the same way. Every one of the (at least) three audit passes marked this
`disposition: absorb, phaseClose: true, autoFixable: true` — the standard "polish will pick this
up" signal.

**Verified directly at the landed tip** (read via the run-scoped `_refinery` worktree,
`<repo-root>/.claude/war-worktrees/2026-08-06-escape-guard-exit-contract-2026-08-15/2026-08-06-escape-guard-exit-contract-2026-08-15/_refinery/`):
`skills/red-team/assets/assert-no-repo-escape.sh` line 12 still reads the pre-rescope sentence
verbatim, byte-for-byte, unchanged from before the phase. `p1-polish` — this phase's terminal
phase-close round — never applied the fix despite the finding being `autoFixable: true` and
recurring in its own audit output.

**Sharpens the pattern:** it is not enough to check whether a polish-diff-own finding got a fix —
here the *same* substantive finding was raised **before** the terminal polish task ran (queued
from an earlier task's gate-audit) *and* resurfaced inside the terminal polish task's own audit,
and it still went unfixed both times. `autoFixable: true` and repeated recurrence across audit
passes are not evidence a fix landed — only reading the file at the landed tip is. A servitor or
Lead closing out a phase with a `p1-polish`/terminal-round step should specifically re-grep every
`phaseClose: true` finding queued against that round, not just trust the disposition tag once.

**Locate-cue (verify still present before acting):**
`skills/red-team/assets/assert-no-repo-escape.sh`, the header comment block, the sentence
beginning "A nonzero result quarantines the verdict through the self-confound gate".
