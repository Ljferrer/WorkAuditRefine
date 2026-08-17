---
name: absorb-fix-for-attribution-finding-can-itself-invert-mirror-direction
description: "A phase-close absorb-fix for a doc finding can itself carry a fresh defect the fail-open sweep lands uncorrected"
metadata: 
  node_type: memory
  type: project
  keywords: 
    - ADR 0025
    - canonical source vs mirror site
    - mirror direction
    - absorb finding
    - phase-close polish
    - doc-truth
    - fail-open audit
    - attribution inversion
    - coherence sweep
    - over-narrowing
    - CLAUDE.md
    - Known traps
    - p2-polish
  provenance: code-verified
  slug: absorb-fix-for-attribution-finding-can-itself-invert-mirror-direction
  phase: dispatch-args-and-floor-coverage/2.1+p2-polish; recurred at 2026-08-04-interview-and-authoring-contract/2 p2-polish
  tags: 
    - doc-honesty
    - adr
    - mirror-registry
    - phase-close
  created: 2026-07-27
  originSessionId: 0ad881e1-4bbc-43c6-8e45-8597d9cec1cf
  modified: 2026-08-05T15:28:07.235Z
---

# An absorb-fix for a mirror-direction under-attribution can itself get the direction backwards — and land anyway

## The rule

When a task 2.1 audit finding flags an ADR Consequences bullet as *under-attributing* a
canonical-source/mirror-site pair (naming the wrong side, or omitting a newly-added member of
the pair), the phase-close (`p<N>-polish`) fix that adds a corrective note is itself new prose
subject to the exact same `docs/adr/0025-drift-guard-discipline.md` canonical-source-vs-mirror-site
direction discipline — and there is no guarantee a second audit round enforces it. The phase-close
coherence sweep is **fail-open** (a discard leaves the pre-polish tip; even on a passing polish
merge, the polish SHA's own audit is not iterated to convergence) — so a *new* finding raised
against the polish diff itself (as opposed to the original queued finding) can land uncorrected.

## What happened here

Task 2.1's audit flagged `docs/adr/0037-run-scoped-staged-phase-scripts.md`'s Consequences bullet
"A second anchor-literal mirror joins the repo's existing mirror registry" for under-describing a
third exported anchor added by the same task (disposition `absorb`, `phaseClose: true`). The
`p2-polish` task appended a dated Amendment note to fix it — but that note itself says the third
anchor's "mirror site is the `const A =` ternary's args-fallback tail in `workflow-template.js`,
**not** an `export const meta` literal." That casts `workflow-template.js` (the live code) as the
*mirror* and the stager's exported constant as the *canonical source* — backwards. The load-bearing
coupling comment at `workflow-template.js`'s own `const A =` ternary states the opposite
direction explicitly: `stage-workflow.mjs` **mirrors** the ternary tail, i.e. the live template code
is canonical and the stager's export is the hand-maintained copy (matching the existing
`export const meta` ↔ stager-export pair's direction, stated the same way in `stage-workflow.mjs`'s
own header comment). The `p2-polish` task's own audit caught this reversal (Minor, disposition
`absorb`, `autoFixable: true`) — but no further round is threaded to me; verified at the landed tip
(776ceec) that the note's backwards wording is still there.

Verify still present before acting — found in the "Amendment (2026-07-27, plan
`2026-07-26-dispatch-args-and-floor-coverage` Task 2.1, #1134)" note under the Consequences
bullet in `docs/adr/0037-run-scoped-staged-phase-scripts.md`, at phase
`dispatch-args-and-floor-coverage`/2.1+p2-polish (landed tip `776ceeca2aee726565dc7816b0294eaa9091b494`
on `dev/2026-07-26-dispatch-args-and-floor-coverage`).

## How to apply

When absorbing (or auditing) an under-attribution finding about a canonical-source/mirror-site
pair: re-derive the direction from the **load-bearing coupling comment at the mirror site itself**
(never from the prior ADR sentence being amended, and never by symmetry/pattern-matching the
donor pair) before writing the correction. An append-only ADR amendment note is a one-shot write —
there is no cheap second pass to catch a backwards direction once it lands, since ADRs are
append-only and the ratified sentence being amended must stay byte-intact.

## Second occurrence (different error class, same mechanism): CLAUDE.md Known-traps over-narrowing

Confirmed the broader mechanism again — a *different* kind of defect this time, not a direction
inversion — in plan `2026-08-04-interview-and-authoring-contract` phase 2. Task 6's queue flagged
CLAUDE.md's `## Known traps` bullet ("Plans and specs share a slug but different suffixes;
`/red-team` greps the plan's source-spec line — keep it") as presenting a now-legacy-only rule as
the general one. The `p2-polish` fix rewrote it to
`"LEGACY spec + plan pairs share a slug but different suffixes; ... keep it there. A merged plan's
Part 1 is its own source of truth."` — but `p2-polish`'s own audit immediately flagged that rewrite
as over-narrowing the **slug-sharing clause itself** to legacy pairs, when a merged plan converted
from a spec (this run's own artifacts: `docs/plans/2026-08-04-interview-and-authoring-contract.md`
↔ its source spec) still shares a slug and still carries a source-spec citation. Disposition
`absorb`, `autoFixable: true` — but verified at the landed tip
(`955e7c10d98e4c4c4e30d22f0ab7c29209f8ab23` on `dev/2026-08-05-2026-08-04-interview-and-authoring-contract`,
read via the `_refinery` worktree) that CLAUDE.md line 82 still carries the over-narrowed wording,
unfixed. `disposition: absorb` on a finding raised against the polish diff itself is **not** a
guarantee of a further round — confirming this lesson's rule holds beyond mirror-direction specifically:
any fresh, correctly-flagged defect in a phase-close fix's own new prose can ride the fail-open
coherence sweep to land, because there is no threaded mechanism that re-audits an absorb fix's own
absorb fix.

[[mirrored-prose-row-parenthetical-inversion]], [[adr-policy-table-entry-vs-mechanism-attribution]],
[[claude-md-adr-range-literal-recurs-stale-with-no-drift-guard]]
