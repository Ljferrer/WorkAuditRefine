---
name: claude-md-adr-range-literal-recurs-stale-with-no-drift-guard
description: "RESOLVED (precision-chain-and-loop-breaker/p5-polish, 2026-08-05): the recurring class is CLOSED — CLAUDE.md's 'docs/adr/ (0001-NNNN)' snapshot literal was retired outright (now 'docs/adr/ records the binding decisions, numbered sequentially — ls docs/adr/ for the current head'), the mechanism-narrative remedy this lesson itself named as the alternative to a fifth manual catch. Body frozen below as the historical record of four recurrences (ADR 0042-0045/0046) before closure."
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
    - follow-up issue
    - RESOLVED
    - literal retired
    - mechanism-narrative shape
    - ADR 0025
    - ls docs/adr for current head
    - ADR 0045
    - ADR 0046
    - p5-polish
    - fourth recurrence
    - class closed
  tags: 
    - doc-honesty
    - adr
    - doc-cascade
    - recurrence
  created: 2026-08-03
  originSessionId: 4095ea62-efc7-4ed1-8045-8de0cd2f76bb
  modified: 2026-08-07T00:16:36.383Z
  promoted: dev/2026-08-05-2026-08-04-interview-and-authoring-contract@phase-2
---

# CLAUDE.md's ADR-range upper bound recurs stale on every new ADR — no test binds it

## The fact

CLAUDE.md's "## What this repo is" paragraph states `docs/adr/ (0001-NNNN) records the binding
decisions` — a hand-maintained "current max ADR number" literal with no test or drift guard tying it
to the actual contents of `docs/adr/`. It has now gone stale on landing **at least two** separate
ADRs:

1. When ADR 0042 landed, the range needed its own dedicated follow-up fix commit (`git log -S0042 --
   CLAUDE.md` shows the ADR-0042-authoring commit followed by a commit whose subject explicitly
   includes "bump ADR range").
2. When ADR 0043 landed in the 2026-08-02-redteam-doctrine-and-guards phase, the same literal went
   stale again — flagged as a Minor `follow-up`/`absorb` finding at two separate task gate-audits
   (1.3 and 1.6), both correctly out-of-footprint since no task in that plan owned CLAUDE.md.

Verified at the phase's landed tip (4bba660): CLAUDE.md's line does read `(0001-0043)` — this
occurrence was caught and fixed (task 1.3's finding was `disposition: absorb, phaseClose: true`, and
the phase-close pass applied it) — but the underlying recurrence pattern (no mechanical guard) is
unchanged, and this is now a **confirmed second recurrence** of the same class.

Locate cue: verify still present before acting — found at CLAUDE.md's "## What this repo is"
paragraph; will need bumping again the next time a new ADR lands, since no test asserts the literal
against `docs/adr/`'s real contents.

## The durable rule

Any repo-doc literal recording a "current max N" fact about a directory's contents (ADR count, phase
count, version count, etc.) with no drift guard binding it to the directory's actual state will recur
stale on every addition to that directory. Once a class like this has recurred **twice**, treat the
**next** occurrence as expected rather than surprising: check it proactively during any phase-close or
doc-cascade sweep that adds a new numbered doc, and consider proposing a mechanical guard (e.g. a
doc-contract test asserting the literal's upper bound equals `max(readdirSync('docs/adr'))`) instead of
relying on a third manual catch.

## Third recurrence (ADR 0044, plan `2026-08-04-interview-and-authoring-contract` phase 2)

Confirmed a **third** time, same shape and same root cause (same-phase file-disjointness: Task 9 owns
only `docs/adr/0044-...md`, Task 6 owns `CLAUDE.md`, so no task in the phase can land both together).
Verified at the landed tip `955e7c10d98e4c4c4e30d22f0ab7c29209f8ab23` on
`dev/2026-08-05-2026-08-04-interview-and-authoring-contract` (read via the `_refinery` worktree, whose
detached HEAD equals the landed tip): CLAUDE.md's "## What this repo is" paragraph correctly reads
`docs/adr/` (0001–0044) — the phase-close `p2-polish` pass bumped the literal again, a **fourth manual
catch**, exactly what the rule above warned against relying on.

This time the recurrence was explicitly escalated past another silent manual catch: `p2-polish`'s own
gate-audit filed the finding as `disposition: follow-up` (not `absorb`) with the rationale "this diff IS
the third manual catch" and recommended precisely the guard this lesson already names — a
`skill-doc-contracts.test.mjs`-style assertion binding CLAUDE.md's range upper bound to
`max(readdirSync('docs/adr'))` parsed from the `00NN-` filename prefix — or alternatively dropping the
snapshot literal entirely ("`docs/adr/` records the binding decisions", the ADR 0025 mechanism-narrative
shape, which cannot rot). No such guard has landed as of this phase; the class remains open and due to
recur a fourth time on the next ADR.

## Fourth recurrence and RESOLUTION (phase 5, plan `2026-08-05-precision-chain-and-loop-breaker`)

Recurred a **fourth** time, same root cause: Task 5.3 lands ADR 0045 and Task 5.4 lands ADR 0046 in
the same phase, neither owns `CLAUDE.md` (file-disjointness), and both gate-audits independently
flagged the literal as stale (Minor, `disposition: absorb, phaseClose: true`) — six near-duplicate
findings across the two tasks' multi-seat audits, all pointing at the same sentence.

This time the phase-close `p5-polish` pass took the **alternative remedy this lesson's third
recurrence already named** instead of a fifth manual re-count: it dropped the snapshot literal
outright rather than bumping it. Verified at the phase's landed tip (read via the `p5-polish` task
worktree, `<repo-root>/.claude/war-worktrees/2026-08-05-precision-chain-and-loop-breaker-2026-08-05/p5-polish/CLAUDE.md`,
one merge-commit behind the confirmed `dev/2026-08-05-precision-chain-and-loop-breaker` landed tip
`52afa389a1da1f91272ba3a546c1421f5abc7a7c` — see
[[servitor-verify-on-write-worktree-can-lag-just-landed-phase]] Recurrence 20 for why no live
worktree sat exactly at that SHA): CLAUDE.md's "## What this repo is" paragraph now reads
`docs/adr/` records the binding decisions, numbered sequentially — `ls docs/adr/` for the current
head — the mechanism-narrative shape, unable to go stale on the next ADR because it no longer
asserts a snapshot count. **This closes the recurring class**: there is no fifth occurrence to watch
for, because the literal that recurred is gone. If a future editor reintroduces a snapshot
range/count literal on this paragraph, that is a NEW instance of the general rule ("The durable
rule" above), not a continuation of this specific literal's four-recurrence history.

The `p5-polish` gate-audit's own findings (read at the same worktree) independently arrived at this
same observation — flagging that this very lesson file would go stale the moment the closure landed,
and recommending exactly the RESOLVED-stamp convention applied here.
